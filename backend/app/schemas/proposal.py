from typing import Optional, List, Literal, Any
from pydantic import BaseModel, Field
from app.schemas.commitment import CommitmentCategory, DatePrecision, CommitmentResponse


class CommitmentProposal(BaseModel):
    proposal_id: str
    title: str = Field(..., min_length=1)
    description: Optional[str] = None
    person_name: Optional[str] = None
    person_id: Optional[str] = None
    category: CommitmentCategory = "family"
    proposed_date: Optional[str] = None  # YYYY-MM-DD
    proposed_time: Optional[str] = None  # HH:mm or "evening"
    date_precision: DatePrecision = "exact_time"
    timezone: str = "Asia/Kolkata"
    recurrence_rule: Optional[str] = None
    reminder_enabled: bool = True
    reminder_at: Optional[str] = None
    ambiguity_note: Optional[str] = None
    is_ambiguous: bool = False
    status: Literal["draft", "confirmed", "rejected"] = "draft"


class ExtractionRequest(BaseModel):
    text: str = Field(..., min_length=1)
    timezone: str = "Asia/Kolkata"


class ExtractionResponse(BaseModel):
    proposals: List[CommitmentProposal]
    intent: str  # "new_commitment", "query_history", "modify_commitment", "general_chat"


class ConfirmProposalRequest(BaseModel):
    proposal: CommitmentProposal
    idempotency_key: Optional[str] = None


class ConfirmProposalResponse(BaseModel):
    commitment: Any = None  # CommitmentResponse
    reminder_status: str  # "scheduled", "workflow_queued", "needs_attention"
