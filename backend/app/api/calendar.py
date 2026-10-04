from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from app.api.deps import get_current_user
from app.schemas.auth import UserResponse
from app.schemas.commitment import CommitmentResponse
from app.repositories.repository_factory import get_commitment_repository

router = APIRouter(prefix="/calendar", tags=["Calendar"])


@router.get("/events")
async def get_calendar_events(
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    current_user: UserResponse = Depends(get_current_user),
):
    repo = get_commitment_repository()

    month_str = f"{year:04d}-{month:02d}"
    # Query commitments for this month
    all_commitments = await repo.list(current_user.id)
    month_events = [
        c for c in all_commitments
        if c.get("due_at") and c["due_at"].startswith(month_str)
    ]

    return {
        "year": year,
        "month": month,
        "events": [CommitmentResponse(**c) for c in month_events],
    }
