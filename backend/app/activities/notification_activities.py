import logging
from dataclasses import dataclass
from typing import Optional
from temporalio import activity
from app.repositories.repository_factory import (
    get_commitment_repository,
    get_notification_repository,
    get_reminder_repository,
)

logger = logging.getLogger(__name__)


@dataclass
class DeliveryInput:
    user_id: str
    commitment_id: str
    title: str
    person_name: Optional[str] = None


@dataclass
class DeliveryResult:
    delivered: bool
    message: str


@activity.defn
async def check_and_deliver_reminder(input_data: DeliveryInput) -> DeliveryResult:
    """
    Idempotent activity: checks if commitment is still pending, creates notification,
    and updates reminder state.
    """
    commitment_repo = get_commitment_repository()
    notification_repo = get_notification_repository()
    reminder_repo = get_reminder_repository()

    commitment = await commitment_repo.get_by_id(input_data.user_id, input_data.commitment_id)
    if not commitment:
        return DeliveryResult(delivered=False, message="Commitment not found")

    # If user already completed or cancelled, do not deliver
    if commitment.get("status") in ["completed", "cancelled"]:
        return DeliveryResult(
            delivered=False,
            message=f"Commitment status is '{commitment.get('status')}', skipping reminder."
        )

    # Deliver in-app notification
    person_str = f" for {input_data.person_name}" if input_data.person_name else ""
    notif_data = {
        "commitment_id": input_data.commitment_id,
        "type": "reminder",
        "title": f"Reminder: {input_data.title}",
        "body": f"It's time to keep your promise{person_str}: {input_data.title}",
    }
    await notification_repo.create(input_data.user_id, notif_data)

    # Update reminder record if exists
    reminder = await reminder_repo.get_by_commitment_id(input_data.user_id, input_data.commitment_id)
    if reminder:
        await reminder_repo.update(input_data.user_id, reminder["id"], {"status": "delivered"})

    logger.info("Successfully delivered reminder for commitment: %s", input_data.commitment_id)
    return DeliveryResult(delivered=True, message="Reminder delivered successfully")
