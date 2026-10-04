import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.security import create_access_token


@pytest.mark.asyncio
async def test_commitments_crud():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Login demo user
        login_res = await client.post("/api/auth/demo")
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Create commitment
        new_payload = {
            "title": "Call Grandma for her birthday",
            "person_name_snapshot": "Grandma",
            "category": "family",
            "status": "pending",
            "due_at": "2026-10-15T18:00:00",
            "timezone": "Asia/Kolkata",
            "date_precision": "exact_time",
            "reminder_enabled": True,
            "source_type": "typed_text",
        }
        create_res = await client.post("/api/commitments", json=new_payload, headers=headers)
        assert create_res.status_code == 201
        created_comm = create_res.json()
        assert created_comm["title"] == "Call Grandma for her birthday"
        comm_id = created_comm["id"]

        # 3. Get single
        get_res = await client.get(f"/api/commitments/{comm_id}", headers=headers)
        assert get_res.status_code == 200
        assert get_res.json()["id"] == comm_id

        # 4. Complete commitment
        comp_res = await client.post(
            f"/api/commitments/{comm_id}/complete",
            json={"note": "Had a lovely call!"},
            headers=headers,
        )
        assert comp_res.status_code == 200
        assert comp_res.json()["status"] == "completed"
        assert comp_res.json()["completed_note"] == "Had a lovely call!"

        # 5. Delete commitment
        del_res = await client.delete(f"/api/commitments/{comm_id}", headers=headers)
        assert del_res.status_code == 204


@pytest.mark.asyncio
async def test_user_ownership_isolation():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create user A
        token_a = create_access_token("user-a")
        headers_a = {"Authorization": f"Bearer {token_a}"}

        # User A creates a commitment
        res_a = await client.post(
            "/api/commitments",
            json={
                "title": "Secret promise of User A",
                "category": "personal",
                "status": "pending",
                "timezone": "Asia/Kolkata",
                "date_precision": "exact_time",
                "reminder_enabled": False,
                "source_type": "typed_text",
            },
            headers=headers_a,
        )
        comm_a_id = res_a.json()["id"]

        # User B attempts to access User A's commitment
        token_b = create_access_token("user-b")
        headers_b = {"Authorization": f"Bearer {token_b}"}

        res_b = await client.get(f"/api/commitments/{comm_a_id}", headers=headers_b)
        # Must return 404 Not Found to enforce multi-tenant isolation
        assert res_b.status_code == 404
