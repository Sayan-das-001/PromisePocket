from typing import Optional, Literal
from pydantic import BaseModel

ReminderStatus = Literal["scheduled", "delivered", "cancelled", "failed"]


class ReminderResponse(BaseModel):
    id: str
    user_id: str
    commitment_id: str
    scheduled_at: str
    status: ReminderStatus
    attempt_count: int = 0
    last_attempt_at: Optional[str] = None
    delivered_at: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True
