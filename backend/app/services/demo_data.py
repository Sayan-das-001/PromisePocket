from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
import uuid


def generate_demo_dataset(user_id: str, tz_name: str = "Asia/Kolkata") -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    today_str = now.strftime("%Y-%m-%d")

    # Dynamic dates relative to today
    tomorrow = now + timedelta(days=1)
    two_days_later = now + timedelta(days=2)
    three_days_later = now + timedelta(days=3)
    five_days_later = now + timedelta(days=5)

    people: List[Dict[str, Any]] = [
        {
            "id": "person-mom",
            "user_id": user_id,
            "name": "Mom",
            "relationship": "Mother",
            "created_at": (now - timedelta(days=30)).isoformat(),
            "updated_at": (now - timedelta(days=30)).isoformat(),
        },
        {
            "id": "person-rahul",
            "user_id": user_id,
            "name": "Rahul",
            "relationship": "Friend & Classmate",
            "created_at": (now - timedelta(days=20)).isoformat(),
            "updated_at": (now - timedelta(days=20)).isoformat(),
        },
        {
            "id": "person-priya",
            "user_id": user_id,
            "name": "Priya",
            "relationship": "Study Partner",
            "created_at": (now - timedelta(days=15)).isoformat(),
            "updated_at": (now - timedelta(days=15)).isoformat(),
        },
        {
            "id": "person-arjun",
            "user_id": user_id,
            "name": "Arjun",
            "relationship": "Roommate",
            "created_at": (now - timedelta(days=10)).isoformat(),
            "updated_at": (now - timedelta(days=10)).isoformat(),
        },
    ]

    commitments: List[Dict[str, Any]] = [
        {
            "id": "comm-mom-call",
            "user_id": user_id,
            "title": "Call Mom",
            "description": "Weekly catchup and ask about Dad's health",
            "person_id": "person-mom",
            "person_name_snapshot": "Mom",
            "category": "family",
            "status": "pending",
            "due_at": tomorrow.replace(hour=13, minute=30, second=0).isoformat(), # 7:00 PM IST is 13:30 UTC
            "timezone": tz_name,
            "date_precision": "exact_time",
            "recurrence_rule": None,
            "reminder_enabled": True,
            "reminder_at": (tomorrow.replace(hour=13, minute=0, second=0)).isoformat(),
            "source_type": "assistant",
            "source_text": "I'll call Ma tomorrow at 7 PM",
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        },
        {
            "id": "comm-rahul-book",
            "user_id": user_id,
            "title": "Return Rahul's book",
            "description": "Operating System Concepts textbook from library desk",
            "person_id": "person-rahul",
            "person_name_snapshot": "Rahul",
            "category": "friendship",
            "status": "pending",
            "due_at": two_days_later.replace(hour=11, minute=0, second=0).isoformat(),
            "timezone": tz_name,
            "date_precision": "approximate_period",
            "recurrence_rule": None,
            "reminder_enabled": True,
            "reminder_at": (two_days_later.replace(hour=10, minute=30, second=0)).isoformat(),
            "source_type": "typed_text",
            "source_text": "Return Rahul's book on Friday",
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        },
        {
            "id": "comm-priya-interview",
            "user_id": user_id,
            "title": "Help Priya practice interview questions",
            "description": "Go through mock systems design and behavioral questions",
            "person_id": "person-priya",
            "person_name_snapshot": "Priya",
            "category": "study",
            "status": "pending",
            "due_at": three_days_later.replace(hour=10, minute=0, second=0).isoformat(),
            "timezone": tz_name,
            "date_precision": "exact_time",
            "recurrence_rule": None,
            "reminder_enabled": True,
            "reminder_at": (three_days_later.replace(hour=9, minute=30, second=0)).isoformat(),
            "source_type": "voice",
            "source_text": "I promised Priya that I would help her prepare for her interview this weekend",
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        },
        {
            "id": "comm-groceries",
            "user_id": user_id,
            "title": "Buy groceries and medicine",
            "description": "Apples, milk, and prescription vitamins after class",
            "person_id": None,
            "person_name_snapshot": "Personal",
            "category": "errands",
            "status": "pending",
            "due_at": now.replace(hour=14, minute=0, second=0).isoformat(),
            "timezone": tz_name,
            "date_precision": "exact_time",
            "recurrence_rule": None,
            "reminder_enabled": True,
            "reminder_at": (now.replace(hour=13, minute=30, second=0)).isoformat(),
            "source_type": "typed_text",
            "source_text": "Buy groceries this evening",
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        },
        {
            "id": "comm-arjun-project",
            "user_id": user_id,
            "title": "Review project presentation with Arjun",
            "description": "Verify slide order and demo links before meeting",
            "person_id": "person-arjun",
            "person_name_snapshot": "Arjun",
            "category": "work",
            "status": "completed",
            "due_at": (now - timedelta(days=1)).isoformat(),
            "completed_at": now.isoformat(),
            "completed_note": "Reviewed all 12 slides and confirmed demo script.",
            "timezone": tz_name,
            "date_precision": "exact_time",
            "recurrence_rule": None,
            "reminder_enabled": False,
            "source_type": "assistant",
            "source_text": "I told Arjun I'd send him the project files before our meeting",
            "created_at": (now - timedelta(days=2)).isoformat(),
            "updated_at": now.isoformat(),
        },
    ]

    notifications: List[Dict[str, Any]] = [
        {
            "id": "notif-1",
            "user_id": user_id,
            "commitment_id": "comm-mom-call",
            "type": "due_soon",
            "title": "Call Mom tomorrow",
            "body": "Reminder: Scheduled for 7:00 PM tomorrow. Temporal workflow active.",
            "read_at": None,
            "created_at": now.isoformat(),
        },
        {
            "id": "notif-2",
            "user_id": user_id,
            "commitment_id": "comm-groceries",
            "type": "due_today",
            "title": "Buy groceries and medicine",
            "body": "Due this evening after class.",
            "read_at": None,
            "created_at": now.isoformat(),
        },
    ]

    return {
        "people": people,
        "commitments": commitments,
        "notifications": notifications,
    }
