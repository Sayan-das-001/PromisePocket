from typing import List
from fastapi import APIRouter, HTTPException, status, Depends
from app.api.deps import get_current_user
from app.schemas.auth import UserResponse
from app.schemas.person import PersonCreate, PersonUpdate, PersonResponse
from app.repositories.repository_factory import (
    get_person_repository,
    get_commitment_repository,
)

router = APIRouter(prefix="/people", tags=["People"])


@router.get("", response_model=List[PersonResponse])
async def list_people(current_user: UserResponse = Depends(get_current_user)):
    person_repo = get_person_repository()
    comm_repo = get_commitment_repository()

    people = await person_repo.list(current_user.id)
    commitments = await comm_repo.list(current_user.id)

    # Calculate statistics per person
    stats_map = {p["id"]: {"upcoming": 0, "completed": 0} for p in people}
    for c in commitments:
        pid = c.get("person_id")
        if pid and pid in stats_map:
            if c.get("status") == "completed":
                stats_map[pid]["completed"] += 1
            elif c.get("status") == "pending":
                stats_map[pid]["upcoming"] += 1

    enriched = []
    for p in people:
        s = stats_map.get(p["id"], {"upcoming": 0, "completed": 0})
        enriched.append({
            **p,
            "upcoming_count": s["upcoming"],
            "completed_count": s["completed"],
            "commitment_count": s["upcoming"] + s["completed"],
        })

    return [PersonResponse(**p) for p in enriched]


@router.post("", response_model=PersonResponse, status_code=status.HTTP_201_CREATED)
async def create_person(
    payload: PersonCreate,
    current_user: UserResponse = Depends(get_current_user),
):
    person_repo = get_person_repository()
    created = await person_repo.create(current_user.id, payload.dict())
    return PersonResponse(**created, commitment_count=0, upcoming_count=0, completed_count=0)


@router.patch("/{person_id}", response_model=PersonResponse)
async def update_person(
    person_id: str,
    payload: PersonUpdate,
    current_user: UserResponse = Depends(get_current_user),
):
    person_repo = get_person_repository()
    updates = {k: v for k, v in payload.dict().items() if v is not None}
    updated = await person_repo.update(current_user.id, person_id, updates)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Person not found",
        )
    return PersonResponse(**updated)


@router.delete("/{person_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_person(
    person_id: str,
    current_user: UserResponse = Depends(get_current_user),
):
    person_repo = get_person_repository()
    deleted = await person_repo.delete(current_user.id, person_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Person not found",
        )
    return None
