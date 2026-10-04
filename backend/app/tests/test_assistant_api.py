import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.security import create_access_token


@pytest.mark.asyncio
async def test_assistant_extract_and_confirm():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = create_access_token("demo-user-1")
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Extract commitments
        extract_res = await client.post(
            "/api/assistant/extract",
            json={
                "text": "I'll call Ma tomorrow at 7 PM and return Rahul's book on Friday",
                "timezone": "Asia/Kolkata",
            },
            headers=headers,
        )
        assert extract_res.status_code == 200
        data = extract_res.json()
        assert len(data["proposals"]) == 2

        # 2. Confirm first proposal
        prop1 = data["proposals"][0]
        confirm_res = await client.post(
            "/api/assistant/confirm",
            json={"proposal": prop1},
            headers=headers,
        )
        assert confirm_res.status_code == 200
        saved = confirm_res.json()
        assert "commitment" in saved
        assert saved["commitment"]["title"] == prop1["title"]
        assert "reminder_status" in saved


@pytest.mark.asyncio
async def test_assistant_chat_message():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = create_access_token("demo-user-1")
        headers = {"Authorization": f"Bearer {token}"}

        res = await client.post(
            "/api/assistant/message",
            json={"message": "What did I promise Rahul?", "timezone": "Asia/Kolkata"},
            headers=headers,
        )
        assert res.status_code == 200
        msg_data = res.json()
        assert "reply" in msg_data
        assert len(msg_data["reply"]) > 5
