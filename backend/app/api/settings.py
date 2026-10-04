from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_user
from app.schemas.auth import UserResponse
from app.schemas.settings import SettingsUpdate
from app.repositories.repository_factory import (
    get_user_repository,
    get_commitment_repository,
    get_person_repository,
    reset_memory_demo,
)
from app.services.demo_data import generate_demo_dataset

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("")
async def get_settings(current_user: UserResponse = Depends(get_current_user)):
    user_repo = get_user_repository()
    user = await user_repo.get_by_id(current_user.id)
    return user


@router.patch("")
async def update_settings(
    payload: SettingsUpdate,
    current_user: UserResponse = Depends(get_current_user),
):
    user_repo = get_user_repository()
    updates = {k: v for k, v in payload.dict().items() if v is not None}
    updated = await user_repo.update(current_user.id, updates)
    return UserResponse(**updated)


@router.post("/reset_demo")
async def reset_demo_data(current_user: UserResponse = Depends(get_current_user)):
    reset_memory_demo(current_user.id)
    return {"success": True, "message": "Demo data has been reset to dynamic dates relative to today."}


@router.get("/export")
async def export_data(current_user: UserResponse = Depends(get_current_user)):
    comm_repo = get_commitment_repository()
    person_repo = get_person_repository()

    commitments = await comm_repo.list(current_user.id)
    people = await person_repo.list(current_user.id)

    return {
        "export_timestamp": datetime.now(timezone.utc).isoformat(),
        "user": current_user.dict(),
        "commitments": commitments,
        "people": people,
    }


@router.delete("/data")
async def delete_personal_data(current_user: UserResponse = Depends(get_current_user)):
    comm_repo = get_commitment_repository()
    commitments = await comm_repo.list(current_user.id)
    for c in commitments:
        await comm_repo.delete(current_user.id, c["id"])
    return {"message": "All personal commitments deleted successfully."}
