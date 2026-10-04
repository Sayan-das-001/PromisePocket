from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Depends, Query
from app.api.deps import get_current_user
from app.schemas.auth import UserResponse
from app.schemas.commitment import (
    CommitmentCreate,
    CommitmentUpdate,
    CommitmentResponse,
    CommitmentComplete,
)
from app.repositories.repository_factory import get_commitment_repository
from app.services.reminders.temporal_client import (
    schedule_reminder_workflow,
    cancel_reminder_workflow,
)

router = APIRouter(prefix="/commitments", tags=["Commitments"])


@router.get("", response_model=List[CommitmentResponse])
async def list_commitments(
    status: Optional[str] = None,
    person_id: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user),
):
    repo = get_commitment_repository()
    commitments = await repo.list(
        user_id=current_user.id,
        status=status,
        person_id=person_id,
        category=category,
        search=search,
    )
    return [CommitmentResponse(**c) for c in commitments]


@router.get("/{commitment_id}", response_model=CommitmentResponse)
async def get_commitment(
    commitment_id: str,
    current_user: UserResponse = Depends(get_current_user),
):
    repo = get_commitment_repository()
    c = await repo.get_by_id(current_user.id, commitment_id)
    if not c:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commitment not found",
        )
    return CommitmentResponse(**c)


@router.post("", response_model=CommitmentResponse, status_code=status.HTTP_201_CREATED)
async def create_commitment(
    payload: CommitmentCreate,
    current_user: UserResponse = Depends(get_current_user),
):
    repo = get_commitment_repository()
    data = payload.dict()
    data["user_id"] = current_user.id

    # If due_at is set and reminder enabled, set reminder_at
    if data.get("reminder_enabled") and data.get("due_at"):
        data["reminder_at"] = data["due_at"]

    created = await repo.create(current_user.id, data)

    # Schedule Temporal workflow if reminder is enabled
    if created.get("reminder_enabled") and created.get("reminder_at"):
        await schedule_reminder_workflow(
            user_id=current_user.id,
            commitment_id=created["id"],
            scheduled_at_iso=created["reminder_at"],
            title=created["title"],
            person_name=created.get("person_name_snapshot"),
        )

    return CommitmentResponse(**created)


@router.patch("/{commitment_id}", response_model=CommitmentResponse)
async def update_commitment(
    commitment_id: str,
    payload: CommitmentUpdate,
    current_user: UserResponse = Depends(get_current_user),
):
    repo = get_commitment_repository()
    existing = await repo.get_by_id(current_user.id, commitment_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commitment not found",
        )

    updates = {k: v for k, v in payload.dict().items() if v is not None}
    updated = await repo.update(current_user.id, commitment_id, updates)

    # If rescheduled, cancel previous workflow and start updated schedule
    if "due_at" in updates or "reminder_at" in updates or "reminder_enabled" in updates:
        await cancel_reminder_workflow(commitment_id)
        if updated.get("reminder_enabled") and updated.get("due_at"):
            await schedule_reminder_workflow(
                user_id=current_user.id,
                commitment_id=commitment_id,
                scheduled_at_iso=updated.get("reminder_at") or updated["due_at"],
                title=updated["title"],
                person_name=updated.get("person_name_snapshot"),
            )

    return CommitmentResponse(**updated)


@router.post("/{commitment_id}/complete", response_model=CommitmentResponse)
async def complete_commitment(
    commitment_id: str,
    payload: Optional[CommitmentComplete] = None,
    current_user: UserResponse = Depends(get_current_user),
):
    repo = get_commitment_repository()
    existing = await repo.get_by_id(current_user.id, commitment_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commitment not found",
        )

    now = datetime.now(timezone.utc).isoformat()
    updates = {
        "status": "completed",
        "completed_at": now,
        "completed_note": payload.note if payload else None,
        "reminder_enabled": False,
    }
    updated = await repo.update(current_user.id, commitment_id, updates)

    # Cancel active reminder workflow
    await cancel_reminder_workflow(commitment_id)

    return CommitmentResponse(**updated)


@router.post("/{commitment_id}/cancel", response_model=CommitmentResponse)
async def cancel_commitment(
    commitment_id: str,
    current_user: UserResponse = Depends(get_current_user),
):
    repo = get_commitment_repository()
    existing = await repo.get_by_id(current_user.id, commitment_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commitment not found",
        )

    updates = {
        "status": "cancelled",
        "reminder_enabled": False,
    }
    updated = await repo.update(current_user.id, commitment_id, updates)

    # Cancel active reminder workflow
    await cancel_reminder_workflow(commitment_id)

    return CommitmentResponse(**updated)


@router.delete("/{commitment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_commitment(
    commitment_id: str,
    current_user: UserResponse = Depends(get_current_user),
):
    repo = get_commitment_repository()
    success = await repo.delete(current_user.id, commitment_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commitment not found",
        )
    await cancel_reminder_workflow(commitment_id)
    return None
