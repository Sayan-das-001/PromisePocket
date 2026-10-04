import logging
from typing import Optional
from app.repositories.repository_factory import get_reminder_repository

logger = logging.getLogger(__name__)


class FallbackReminderScheduler:
    """
    Clearly labeled Development Reminder Scheduler Fallback.
    Used when Temporal development server is not running locally.
    Records the reminder in the repository and logs transparently.
    """

    async def schedule_reminder(
        self,
        user_id: str,
        commitment_id: str,
        scheduled_at_iso: str,
        title: str,
        person_name: Optional[str] = None,
    ) -> str:
        reminder_repo = get_reminder_repository()
        data = {
            "commitment_id": commitment_id,
            "scheduled_at": scheduled_at_iso,
            "status": "scheduled",
            "metadata": {
                "engine": "dev_fallback_scheduler",
                "note": "Temporal server offline. Reminder recorded in database.",
            },
        }
        await reminder_repo.create(user_id, data)
        logger.info(
            "[DEV FALLBACK SCHEDULER] Recorded reminder for commitment %s at %s. (Temporal server offline)",
            commitment_id,
            scheduled_at_iso,
        )
        return "fallback_scheduler_recorded"


fallback_scheduler = FallbackReminderScheduler()
