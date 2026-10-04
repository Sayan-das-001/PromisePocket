import logging
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

_temporal_client = None
_is_connected = False


async def get_temporal_client():
    global _temporal_client, _is_connected
    if _temporal_client is not None and _is_connected:
        return _temporal_client

    try:
        from temporalio.client import Client
        logger.info("Connecting to Temporal server at %s...", settings.TEMPORAL_ADDRESS)
        _temporal_client = await Client.connect(
            settings.TEMPORAL_ADDRESS,
            namespace=settings.TEMPORAL_NAMESPACE,
        )
        _is_connected = True
        logger.info("Temporal client connected successfully.")
        return _temporal_client
    except Exception as e:
        logger.info("Temporal server is offline or unreachable (%s). Using development fallback scheduler.", str(e))
        _is_connected = False
        _temporal_client = None
        return None


async def schedule_reminder_workflow(
    user_id: str,
    commitment_id: str,
    scheduled_at_iso: str,
    title: str,
    person_name: Optional[str] = None,
) -> str:
    """
    Schedules durable reminder workflow via Temporal.
    Returns status: 'temporal_scheduled' or 'fallback_scheduled'.
    """
    client = await get_temporal_client()
    if client:
        from app.workflows.reminder_workflow import ReminderWorkflow
        workflow_id = f"reminder-{commitment_id}"
        input_data = {
            "user_id": user_id,
            "commitment_id": commitment_id,
            "scheduled_at": scheduled_at_iso,
            "title": title,
            "person_name": person_name,
        }
        try:
            await client.start_workflow(
                ReminderWorkflow.run,
                input_data,
                id=workflow_id,
                task_queue=settings.TEMPORAL_TASK_QUEUE,
            )
            logger.info("Scheduled Temporal workflow %s for commitment %s", workflow_id, commitment_id)
            return "temporal_scheduled"
        except Exception as e:
            logger.warning("Failed to start Temporal workflow: %s. Using development fallback.", str(e))

    # If Temporal server unavailable, use local fallback scheduler
    from app.services.reminders.fallback_scheduler import fallback_scheduler
    return await fallback_scheduler.schedule_reminder(
        user_id, commitment_id, scheduled_at_iso, title, person_name
    )


async def cancel_reminder_workflow(commitment_id: str) -> bool:
    """Cancels Temporal workflow if active."""
    client = await get_temporal_client()
    if client:
        try:
            workflow_id = f"reminder-{commitment_id}"
            handle = client.get_workflow_handle(workflow_id)
            await handle.cancel()
            logger.info("Cancelled Temporal workflow %s", workflow_id)
            return True
        except Exception:
            pass
    return False


async def is_temporal_connected() -> bool:
    client = await get_temporal_client()
    return client is not None
