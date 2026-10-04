from typing import Optional
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    display_name: str
    timezone: str = "Asia/Kolkata"
    preferred_reminder_lead_minutes: int = 30
    default_reminder_time: str = "09:00"
    ai_provider: str = "ollama"


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    display_name: str
    timezone: Optional[str] = "Asia/Kolkata"


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(UserBase):
    id: str
    created_at: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
