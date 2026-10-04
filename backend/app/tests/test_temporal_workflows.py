import pytest
from app.activities.notification_activities import (
    check_and_deliver_reminder,
    DeliveryInput,
)
from app.repositories.repository_factory import (
    get_commitment_repository,
    get_notification_repository,
)


@pytest.mark.asyncio
async def test_activity_delivers_pending_commitment():
    comm_repo = get_commitment_repository()
    notif_repo = get_notification_repository()

    # Create pending commitment
    c = await comm_repo.create("test-user-temp", {
        "title": "Buy medicine",
        "category": "health",
        "status": "pending",
        "timezone": "Asia/Kolkata",
        "reminder_enabled": True,
        "source_type": "typed_text",
    })

    inp = DeliveryInput(
        user_id="test-user-temp",
        commitment_id=c["id"],
        title="Buy medicine",
    )

    result = await check_and_deliver_reminder(inp)
    assert result.delivered is True

    # Verify notification was inserted
    notifs = await notif_repo.list("test-user-temp")
    assert any(n["commitment_id"] == c["id"] for n in notifs)


@pytest.mark.asyncio
async def test_activity_skips_completed_commitment():
    comm_repo = get_commitment_repository()

    # Create completed commitment
    c = await comm_repo.create("test-user-temp-2", {
        "title": "Return book",
        "category": "study",
        "status": "completed",
        "timezone": "Asia/Kolkata",
        "reminder_enabled": False,
        "source_type": "typed_text",
    })

    inp = DeliveryInput(
        user_id="test-user-temp-2",
        commitment_id=c["id"],
        title="Return book",
    )

    result = await check_and_deliver_reminder(inp)
    # Should skip delivery because commitment is already completed
    assert result.delivered is False
    assert "status is 'completed'" in result.message
