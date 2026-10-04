import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.security import create_access_token


@pytest.fixture
def test_user():
    return {
        "id": "demo-user-1",
        "email": "demo@promisepocket.ai",
        "display_name": "Sarah",
        "timezone": "Asia/Kolkata",
    }


@pytest.fixture
def auth_headers(test_user):
    token = create_access_token(test_user["id"])
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def async_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
