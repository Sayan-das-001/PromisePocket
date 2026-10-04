import pytest
from datetime import datetime, timedelta
from app.services.ai.date_resolver import DateResolver


def test_resolve_tomorrow_exact_time():
    text = "Call Ma tomorrow at 7 PM"
    p_date, p_time, precision, recurrence, is_ambig, ambig_note = DateResolver.resolve_date_and_time(
        text, tz_name="Asia/Kolkata"
    )

    now = DateResolver.get_user_now("Asia/Kolkata")
    expected_date = (now + timedelta(days=1)).strftime("%Y-%m-%d")

    assert p_date == expected_date
    assert p_time == "19:00"
    assert precision == "exact_time"
    assert recurrence is None
    assert is_ambig is False


def test_resolve_weekday_approximate_time():
    text = "Return Rahul's book on Friday evening"
    p_date, p_time, precision, recurrence, is_ambig, ambig_note = DateResolver.resolve_date_and_time(
        text, tz_name="Asia/Kolkata"
    )

    assert p_date is not None
    assert p_time == "evening"
    assert precision == "approximate_period"
    assert is_ambig is False


def test_resolve_recurrence():
    text = "Remind me every Tuesday at 6 PM to check on Dad"
    p_date, p_time, precision, recurrence, is_ambig, ambig_note = DateResolver.resolve_date_and_time(
        text, tz_name="Asia/Kolkata"
    )

    assert recurrence == "FREQ=WEEKLY;BYDAY=TU"
    assert p_time == "18:00"
    assert precision == "exact_time"


def test_resolve_ambiguity_after_class():
    text = "Buy medicine after class"
    p_date, p_time, precision, recurrence, is_ambig, ambig_note = DateResolver.resolve_date_and_time(
        text, tz_name="Asia/Kolkata"
    )

    assert is_ambig is True
    assert "class timing" in ambig_note.lower()
