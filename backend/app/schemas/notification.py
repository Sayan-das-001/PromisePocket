from typing import Optional, Literal
from pydantic import BaseModel

NotificationType = Literal["due_soon", "due_today", "overdue", "reminder", "system"]


class NotificationResponse(BaseModel):
    id: str
    user_id: str
    commitment_id: Optional[str] = None
    type: NotificationType
    title: str
    body: str
    read_at: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True
