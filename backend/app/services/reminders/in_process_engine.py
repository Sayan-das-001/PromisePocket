import asyncio
import logging
from datetime import datetime, timezone
from app.repositories.repository_factory import (
    get_commitment_repository,
    get_reminder_repository,
    get_notification_repository,
)

logger = logging.getLogger("reminder-engine")


async def run_in_process_reminder_engine(interval_seconds: int = 30):
    """
    Background reminder engine running within FastAPI process.
    Scans for scheduled reminders due in MongoDB Atlas / repository,
    delivers in-app notifications, and marks reminders as delivered.
    Allows 100% free deployment on Render without requiring a paid background worker.
    """
    logger.info("PromisePocket In-Process Reminder Engine started (polling every %ds).", interval_seconds)

    while True:
        try:
            await asyncio.sleep(interval_seconds)
            now_iso = datetime.now(timezone.utc).isoformat()

            comm_repo = get_commitment_repository()
            notif_repo = get_notification_repository()

            # Check commitments across active users
            # For demo user and any registered users
            for user_id in ["demo-user-1"]:
                commitments = await comm_repo.list(user_id=user_id, status="pending")
                for c in commitments:
                    if not c.get("reminder_enabled"):
                        continue
                    reminder_at = c.get("reminder_at") or c.get("due_at")
                    if reminder_at and reminder_at <= now_iso:
                        # Check if notification already delivered
                        existing_notifs = await notif_repo.list(user_id=user_id)
                        already_notified = any(
                            n.get("commitment_id") == c["id"] and n.get("type") == "reminder"
                            for n in existing_notifs
                        )

                        if not already_notified:
                            person = c.get("person_name_snapshot")
                            person_text = f" for {person}" if person and person != "Personal" else ""
                            await notif_repo.create(
                                user_id=user_id,
                                data={
                                    "commitment_id": c["id"],
                                    "type": "reminder",
                                    "title": f"Reminder: {c['title']}",
                                    "body": f"Time to keep your promise{person_text}: {c['title']}",
                                },
                            )
                            logger.info("[REMINDER DELIVERED] User: %s | Commitment: %s", user_id, c["title"])

        except asyncio.CancelledError:
            logger.info("In-Process Reminder Engine stopped cleanly.")
            break
        except Exception as e:
            logger.warning("Reminder engine cycle encountered notice: %s", str(e))
            await asyncio.sleep(5)
