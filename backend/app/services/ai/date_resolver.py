import re
from datetime import datetime, timedelta, timezone
from typing import Tuple, Optional
from zoneinfo import ZoneInfo
from app.schemas.commitment import DatePrecision


class DateResolver:
    WEEKDAYS = {
        "monday": 0, "mon": 0,
        "tuesday": 1, "tue": 1,
        "wednesday": 2, "wed": 2,
        "thursday": 3, "thu": 3,
        "friday": 4, "fri": 4,
        "saturday": 5, "sat": 5,
        "sunday": 6, "sun": 6,
    }

    TIME_PERIODS = {
        "morning": "morning",
        "afternoon": "afternoon",
        "evening": "evening",
        "night": "night",
        "after class": "afternoon",
    }

    @classmethod
    def get_user_now(cls, tz_name: str = "Asia/Kolkata") -> datetime:
        try:
            tz = ZoneInfo(tz_name)
            return datetime.now(tz)
        except Exception:
            return datetime.now(timezone.utc)

    @classmethod
    def resolve_date_and_time(
        cls, text: str, tz_name: str = "Asia/Kolkata"
    ) -> Tuple[Optional[str], Optional[str], DatePrecision, Optional[str], bool, Optional[str]]:
        """
        Returns:
            (proposed_date, proposed_time, precision, recurrence_rule, is_ambiguous, ambiguity_note)
        """
        now = cls.get_user_now(tz_name)
        text_lower = text.lower()

        proposed_date: Optional[str] = None
        proposed_time: Optional[str] = None
        precision: DatePrecision = "unresolved"
        recurrence_rule: Optional[str] = None
        is_ambiguous: bool = False
        ambiguity_note: Optional[str] = None

        # 1. Check Recurrence (e.g. "every Tuesday", "every day", "daily", "every week")
        every_weekday_match = re.search(r"every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)", text_lower)
        if every_weekday_match:
            day_name = every_weekday_match.group(1)
            day_idx = cls.WEEKDAYS.get(day_name, 0)
            byday = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"][day_idx]
            recurrence_rule = f"FREQ=WEEKLY;BYDAY={byday}"
            # Next upcoming occurrence of that weekday
            days_ahead = (day_idx - now.weekday() + 7) % 7
            if days_ahead == 0:
                days_ahead = 7
            target_date = now + timedelta(days=days_ahead)
            proposed_date = target_date.strftime("%Y-%m-%d")
            precision = "day"

        elif "every day" in text_lower or "daily" in text_lower:
            recurrence_rule = "FREQ=DAILY"
            proposed_date = (now + timedelta(days=1)).strftime("%Y-%m-%d")
            precision = "day"

        # 2. Check Relative Dates
        if not proposed_date:
            if "tomorrow" in text_lower:
                proposed_date = (now + timedelta(days=1)).strftime("%Y-%m-%d")
                precision = "day"
            elif "day after tomorrow" in text_lower:
                proposed_date = (now + timedelta(days=2)).strftime("%Y-%m-%d")
                precision = "day"
            elif "today" in text_lower or "tonight" in text_lower:
                proposed_date = now.strftime("%Y-%m-%d")
                precision = "day"
            elif "this weekend" in text_lower or "weekend" in text_lower:
                # Target upcoming Saturday
                days_ahead = (5 - now.weekday() + 7) % 7
                if days_ahead == 0:
                    days_ahead = 7
                proposed_date = (now + timedelta(days=days_ahead)).strftime("%Y-%m-%d")
                precision = "approximate_period"
            else:
                # Check weekday mentions like "on Friday", "this Friday", "next Monday"
                for wday, idx in cls.WEEKDAYS.items():
                    if re.search(rf"\b(on|this|next)?\s*{wday}\b", text_lower):
                        days_ahead = (idx - now.weekday() + 7) % 7
                        if days_ahead == 0:
                            days_ahead = 7
                        proposed_date = (now + timedelta(days=days_ahead)).strftime("%Y-%m-%d")
                        precision = "day"
                        break

        # 3. Check Exact Times (e.g., "at 7 PM", "7:30 PM", "6 PM", "10:00 AM", "at 19:00")
        time_match = re.search(r"\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b", text_lower)
        if time_match:
            hour = int(time_match.group(1))
            minute = int(time_match.group(2) or 0)
            ampm = time_match.group(3)
            if ampm == "pm" and hour < 12:
                hour += 12
            elif ampm == "am" and hour == 12:
                hour = 0
            proposed_time = f"{hour:02d}:{minute:02d}"
            precision = "exact_time"
        else:
            # Check 24-hour time "at 19:00"
            time_24 = re.search(r"\bat\s+(\d{1,2}):(\d{2})\b", text_lower)
            if time_24:
                proposed_time = f"{int(time_24.group(1)):02d}:{int(time_24.group(2)):02d}"
                precision = "exact_time"
            else:
                # Check Approximate Periods ("evening", "morning", "afternoon", "after class")
                for period, label in cls.TIME_PERIODS.items():
                    if period in text_lower:
                        proposed_time = label
                        precision = "approximate_period"
                        if period == "after class":
                            is_ambiguous = True
                            ambiguity_note = "Class timing is unspecified. You may want to choose a specific hour."
                        break

        # If date is not resolved at all
        if not proposed_date:
            if proposed_time:
                # If a time period was recognized (e.g. "after class", "evening"), default date to today
                proposed_date = now.strftime("%Y-%m-%d")
            else:
                precision = "unresolved"
                is_ambiguous = True
                if not ambiguity_note:
                    ambiguity_note = "No specific date or day was mentioned."

        return proposed_date, proposed_time, precision, recurrence_rule, is_ambiguous, ambiguity_note
