from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from app.api.deps import get_current_user
from app.schemas.auth import UserResponse
from app.schemas.commitment import CommitmentResponse
from app.schemas.person import PersonResponse
from app.repositories.repository_factory import (
    get_commitment_repository,
    get_person_repository,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary")
async def get_dashboard_summary(current_user: UserResponse = Depends(get_current_user)):
    comm_repo = get_commitment_repository()
    person_repo = get_person_repository()

    all_commitments = await comm_repo.list(current_user.id)
    all_people = await person_repo.list(current_user.id)

    now = datetime.now(timezone.utc)
    today_str = now.strftime("%Y-%m-%d")
    tomorrow_str = (now + timedelta(days=1)).strftime("%Y-%m-%d")

    due_today_count = 0
    upcoming_count = 0
    overdue_count = 0
    completed_this_week_count = 0

    todays_promises: List[Dict[str, Any]] = []
    coming_up: List[Dict[str, Any]] = []

    # Map people counts
    person_stats: Dict[str, Dict[str, int]] = {
        p["id"]: {"upcoming": 0, "completed": 0} for p in all_people
    }

    one_week_ago = (now - timedelta(days=7)).isoformat()

    for c in all_commitments:
        status = c.get("status")
        due_at = c.get("due_at")
        pid = c.get("person_id")

        if status == "completed":
            if c.get("completed_at") and c["completed_at"] >= one_week_ago:
                completed_this_week_count += 1
            if pid and pid in person_stats:
                person_stats[pid]["completed"] += 1
            continue

        if status == "cancelled":
            continue

        # Status is pending
        if pid and pid in person_stats:
            person_stats[pid]["upcoming"] += 1

        if not due_at:
            todays_promises.append(c)
            due_today_count += 1
            continue

        due_date_str = due_at[:10]
        if due_date_str == today_str:
            due_today_count += 1
            todays_promises.append(c)
        elif due_at < now.isoformat():
            overdue_count += 1
            todays_promises.append(c)
        else:
            upcoming_count += 1
            coming_up.append(c)

    # Sort upcoming commitments
    coming_up.sort(key=lambda x: x.get("due_at") or "")

    # Calculate real grounded AI insight
    tomorrow_commitments = [c for c in all_commitments if c.get("due_at", "")[:10] == tomorrow_str and c.get("status") == "pending"]
    if len(tomorrow_commitments) > 0:
        insight = f"You have {len(tomorrow_commitments)} promise{'s' if len(tomorrow_commitments) > 1 else ''} to keep tomorrow, including '{tomorrow_commitments[0].get('title')}'."
    elif due_today_count > 0:
        insight = f"You have {due_today_count} promise{'s' if due_today_count > 1 else ''} scheduled for today."
    elif len(all_commitments) == 0:
        insight = "Welcome to PromisePocket! Type or say your first promise above to get started."
    else:
        insight = "All caught up for today! Remember to check on upcoming promises for the week."

    # Format enriched people
    enriched_people = []
    for p in all_people:
        stats = person_stats.get(p["id"], {"upcoming": 0, "completed": 0})
        enriched_people.append({
            **p,
            "upcoming_count": stats["upcoming"],
            "completed_count": stats["completed"],
            "commitment_count": stats["upcoming"] + stats["completed"],
        })

    return {
        "due_today_count": due_today_count,
        "upcoming_count": upcoming_count,
        "completed_this_week_count": completed_this_week_count,
        "overdue_count": overdue_count,
        "todays_promises": [CommitmentResponse(**c) for c in todays_promises],
        "coming_up": [CommitmentResponse(**c) for c in coming_up[:5]],
        "people": [PersonResponse(**p) for p in enriched_people],
        "ai_insight": insight,
    }
