from typing import List
from fastapi import APIRouter, HTTPException, status, Depends
from app.api.deps import get_current_user
from app.schemas.auth import UserResponse
from app.schemas.notification import NotificationResponse
from app.repositories.repository_factory import get_notification_repository

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=List[NotificationResponse])
async def list_notifications(current_user: UserResponse = Depends(get_current_user)):
    repo = get_notification_repository()
    notifications = await repo.list(current_user.id)
    return [NotificationResponse(**n) for n in notifications]


@router.post("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: UserResponse = Depends(get_current_user),
):
    repo = get_notification_repository()
    success = await repo.mark_read(current_user.id, notification_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    return {"message": "Notification marked as read"}
