from typing import Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

CommitmentStatus = Literal["pending", "completed", "cancelled"]
CommitmentCategory = Literal[
    "family", "friendship", "study", "errands", "health", "work", "other"
]
DatePrecision = Literal[
    "exact_time", "day", "approximate_period", "unresolved"
]


class CommitmentBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    person_id: Optional[str] = None
    person_name_snapshot: Optional[str] = None
    category: CommitmentCategory = "family"
    status: CommitmentStatus = "pending"
    due_at: Optional[str] = None  # ISO 8601 string
    timezone: str = "Asia/Kolkata"
    date_precision: DatePrecision = "exact_time"
    recurrence_rule: Optional[str] = None
    reminder_enabled: bool = True
    reminder_at: Optional[str] = None
    source_type: Literal["typed_text", "voice", "assistant"] = "typed_text"
    source_text: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class CommitmentCreate(CommitmentBase):
    pass


class CommitmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    person_id: Optional[str] = None
    person_name_snapshot: Optional[str] = None
    category: Optional[CommitmentCategory] = None
    status: Optional[CommitmentStatus] = None
    due_at: Optional[str] = None
    timezone: Optional[str] = None
    date_precision: Optional[DatePrecision] = None
    recurrence_rule: Optional[str] = None
    reminder_enabled: Optional[bool] = None
    reminder_at: Optional[str] = None
    completed_note: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class CommitmentComplete(BaseModel):
    note: Optional[str] = None


class CommitmentResponse(CommitmentBase):
    id: str
    user_id: str
    created_at: str
    updated_at: str
    completed_at: Optional[str] = None
    completed_note: Optional[str] = None

    class Config:
        from_attributes = True
