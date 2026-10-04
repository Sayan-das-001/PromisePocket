from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.api.deps import get_current_user
from app.schemas.auth import UserResponse
from app.schemas.commitment import CommitmentResponse
from app.schemas.proposal import (
    CommitmentProposal,
    ExtractionRequest,
    ExtractionResponse,
    ConfirmProposalRequest,
    ConfirmProposalResponse,
)
from app.services.ai.extractor import ai_service
from app.repositories.repository_factory import (
    get_commitment_repository,
    get_person_repository,
)
from app.services.reminders.temporal_client import schedule_reminder_workflow

router = APIRouter(prefix="/assistant", tags=["AI Assistant"])


class AssistantMessageRequest(BaseModel):
    message: str
    timezone: Optional[str] = "Asia/Kolkata"


class AssistantMessageResponse(BaseModel):
    reply: str
    proposals: Optional[List[CommitmentProposal]] = None
    citations: Optional[List[Dict[str, Any]]] = None


@router.post("/message", response_model=AssistantMessageResponse)
async def handle_assistant_message(
    payload: AssistantMessageRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    comm_repo = get_commitment_repository()
    tz = payload.timezone or current_user.timezone or "Asia/Kolkata"

    # Step 1: Extract intent & proposals
    proposals, intent = await ai_service.extract(payload.message, timezone=tz)

    # Intent 1: New commitment
    if intent == "new_commitment" and proposals:
        reply_intro = (
            f"I found {len(proposals)} promise{'s' if len(proposals) > 1 else ''} in your message. "
            "Please review the proposed details below and click Accept to save."
        )
        return AssistantMessageResponse(
            reply=reply_intro,
            proposals=proposals,
        )

    # Intent 2: Query historical commitments (e.g. "What did I promise Rahul?")
    if intent == "query_history":
        all_user_commitments = await comm_repo.list(current_user.id)
        # Search for mentioned persons or words
        matching_commitments = []
        msg_lower = payload.message.lower()
        for c in all_user_commitments:
            person = (c.get("person_name_snapshot") or "").lower()
            title = c.get("title", "").lower()
            if person and person in msg_lower:
                matching_commitments.append(c)
            elif any(word in title for word in msg_lower.split() if len(word) > 4):
                matching_commitments.append(c)

        if not matching_commitments and "weekend" in msg_lower:
            # Return commitments for this weekend
            matching_commitments = [c for c in all_user_commitments if c.get("status") == "pending"][:3]
        elif not matching_commitments:
            matching_commitments = all_user_commitments[:4]

        grounded_answer = await ai_service.answer_query(payload.message, matching_commitments)

        citations = [
            {
                "id": c["id"],
                "title": c["title"],
                "person_name_snapshot": c.get("person_name_snapshot"),
                "due_at": c.get("due_at"),
                "status": c.get("status"),
            }
            for c in matching_commitments
        ]

        return AssistantMessageResponse(
            reply=grounded_answer,
            citations=citations,
        )

    # Intent 3: Modify existing commitment
    if intent == "modify_commitment":
        # Extract the proposed change
        proposals, _ = await ai_service.extract(payload.message.replace("Move my", "I'll").replace("change my", "I'll"), timezone=tz)
        if proposals:
            return AssistantMessageResponse(
                reply="I've prepared the proposed change for you. Please confirm to update your commitment:",
                proposals=proposals,
            )

    # Fallback general chat
    provider = await ai_service.get_active_provider()
    generic_reply = await provider.generate_response(payload.message)
    return AssistantMessageResponse(reply=generic_reply)


@router.post("/extract", response_model=ExtractionResponse)
async def extract_commitments(
    payload: ExtractionRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    tz = payload.timezone or current_user.timezone or "Asia/Kolkata"
    proposals, intent = await ai_service.extract(payload.text, timezone=tz)
    return ExtractionResponse(proposals=proposals, intent=intent)


@router.post("/confirm", response_model=ConfirmProposalResponse)
async def confirm_proposal(
    payload: ConfirmProposalRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    proposal = payload.proposal
    comm_repo = get_commitment_repository()
    person_repo = get_person_repository()

    # Step 1: Check or create Person if named
    person_id = proposal.person_id
    if not person_id and proposal.person_name:
        existing_person = await person_repo.get_by_name(current_user.id, proposal.person_name)
        if existing_person:
            person_id = existing_person["id"]
        else:
            new_person = await person_repo.create(current_user.id, {
                "name": proposal.person_name,
                "relationship": "Contact",
            })
            person_id = new_person["id"]

    # Step 2: Assemble due timestamp ISO
    due_at = None
    if proposal.proposed_date:
        time_part = proposal.proposed_time if proposal.proposed_time and ":" in proposal.proposed_time else "12:00"
        due_at = f"{proposal.proposed_date}T{time_part}:00"

    commitment_data = {
        "title": proposal.title,
        "description": proposal.description,
        "person_id": person_id,
        "person_name_snapshot": proposal.person_name or "Personal",
        "category": proposal.category,
        "status": "pending",
        "due_at": due_at,
        "timezone": proposal.timezone,
        "date_precision": proposal.date_precision,
        "recurrence_rule": proposal.recurrence_rule,
        "reminder_enabled": proposal.reminder_enabled,
        "reminder_at": due_at if proposal.reminder_enabled else None,
        "source_type": "assistant",
        "source_text": f"Proposal: {proposal.title}",
    }

    created = await comm_repo.create(current_user.id, commitment_data)

    # Step 3: Schedule Temporal Reminder Workflow
    reminder_status = "no_reminder"
    if created.get("reminder_enabled") and created.get("reminder_at"):
        try:
            status_str = await schedule_reminder_workflow(
                user_id=current_user.id,
                commitment_id=created["id"],
                scheduled_at_iso=created["reminder_at"],
                title=created["title"],
                person_name=created.get("person_name_snapshot"),
            )
            reminder_status = status_str
        except Exception as e:
            reminder_status = "needs_attention"

    return ConfirmProposalResponse(
        commitment=CommitmentResponse(**created),
        reminder_status=reminder_status,
    )
