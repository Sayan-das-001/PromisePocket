import asyncio
import logging
from temporalio.client import Client
from temporalio.worker import Worker
from app.core.config import settings
from app.workflows.reminder_workflow import ReminderWorkflow
from app.activities.notification_activities import check_and_deliver_reminder

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("temporal-worker")


async def main():
    logger.info("Starting PromisePocket Temporal Worker...")
    logger.info("Connecting to Temporal Server at %s...", settings.TEMPORAL_ADDRESS)

    client = await Client.connect(
        settings.TEMPORAL_ADDRESS,
        namespace=settings.TEMPORAL_NAMESPACE,
    )

    worker = Worker(
        client,
        task_queue=settings.TEMPORAL_TASK_QUEUE,
        workflows=[ReminderWorkflow],
        activities=[check_and_deliver_reminder],
    )

    logger.info("Temporal Worker listening on task queue: '%s'", settings.TEMPORAL_TASK_QUEUE)
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
