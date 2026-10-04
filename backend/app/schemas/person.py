from typing import Optional
from pydantic import BaseModel, Field


class PersonBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    relationship: Optional[str] = None


class PersonCreate(PersonBase):
    pass


class PersonUpdate(BaseModel):
    name: Optional[str] = None
    relationship: Optional[str] = None


class PersonResponse(PersonBase):
    id: str
    user_id: str
    commitment_count: int = 0
    upcoming_count: int = 0
    completed_count: int = 0
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True
