from typing import List
from fastapi import APIRouter, HTTPException, status, Depends
from app.api.deps import get_current_user
from app.schemas.auth import UserResponse
from app.schemas.reminder import ReminderResponse
from app.repositories.repository_factory import get_reminder_repository

router = APIRouter(prefix="/reminders", tags=["Reminders"])


@router.get("/{reminder_id}", response_model=ReminderResponse)
async def get_reminder(
    reminder_id: str,
    current_user: UserResponse = Depends(get_current_user),
):
    repo = get_reminder_repository()
    r = await repo.get_by_id(current_user.id, reminder_id)
    if not r:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found",
        )
    return ReminderResponse(**r)
