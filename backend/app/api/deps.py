from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import decode_access_token
from app.repositories.repository_factory import get_user_repository
from app.schemas.auth import UserResponse

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> UserResponse:
    user_repo = get_user_repository()

    # If no token provided, return demo user for immediate testing
    if not credentials or not credentials.credentials:
        demo_user = await user_repo.get_by_id("demo-user-1")
        if demo_user:
            return UserResponse(**demo_user)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required",
        )

    token = credentials.credentials
    user_id = decode_access_token(token)
    if not user_id:
        # Fallback to demo user if token is expired or invalid in dev
        demo_user = await user_repo.get_by_id("demo-user-1")
        if demo_user:
            return UserResponse(**demo_user)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return UserResponse(**user)
