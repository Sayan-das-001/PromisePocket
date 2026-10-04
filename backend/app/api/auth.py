from fastapi import APIRouter, HTTPException, status, Depends
from app.core.security import verify_password, get_password_hash, create_access_token
from app.repositories.repository_factory import get_user_repository
from app.schemas.auth import UserCreate, UserLogin, UserResponse, Token
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token)
async def register(payload: UserCreate):
    user_repo = get_user_repository()
    existing = await user_repo.get_by_email(payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user_data = {
        "email": payload.email,
        "display_name": payload.display_name,
        "password_hash": get_password_hash(payload.password),
        "timezone": payload.timezone or "Asia/Kolkata",
        "preferred_reminder_lead_minutes": 30,
        "default_reminder_time": "09:00",
        "ai_provider": "ollama",
    }
    user = await user_repo.create(user_data)
    token = create_access_token(user["id"])
    return Token(access_token=token, user=UserResponse(**user))


@router.post("/login", response_model=Token)
async def login(payload: UserLogin):
    user_repo = get_user_repository()
    user = await user_repo.get_by_email(payload.email)
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    token = create_access_token(user["id"])
    return Token(access_token=token, user=UserResponse(**user))


@router.post("/demo", response_model=Token)
async def login_demo():
    user_repo = get_user_repository()
    user = await user_repo.get_by_id("demo-user-1")
    if not user:
        # Create demo user if not existing
        user = await user_repo.create({
            "id": "demo-user-1",
            "email": "demo@promisepocket.ai",
            "display_name": "Sarah",
            "password_hash": get_password_hash("demo1234"),
            "timezone": "Asia/Kolkata",
            "preferred_reminder_lead_minutes": 30,
            "default_reminder_time": "09:00",
            "ai_provider": "ollama",
        })

    token = create_access_token(user["id"])
    return Token(access_token=token, user=UserResponse(**user))


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    return current_user


@router.post("/logout")
async def logout():
    return {"message": "Logged out successfully"}
