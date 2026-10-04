from datetime import datetime, timezone, timedelta
from typing import Dict, Any
from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from app.activities.notification_activities import (
        check_and_deliver_reminder,
        DeliveryInput,
        DeliveryResult,
    )


@workflow.defn
class ReminderWorkflow:
    @workflow.run
    async def run(self, input_data: Dict[str, Any]) -> str:
        """
        Durable Temporal reminder workflow.
        Calculates time remaining until scheduled_at, durably sleeps,
        checks commitment state, and delivers in-app and browser notifications.
        """
        user_id = input_data["user_id"]
        commitment_id = input_data["commitment_id"]
        scheduled_at_iso = input_data["scheduled_at"]
        title = input_data.get("title", "Promise Reminder")
        person_name = input_data.get("person_name")

        # Parse scheduled instant
        try:
            target_time = datetime.fromisoformat(scheduled_at_iso)
            if target_time.tzinfo is None:
                target_time = target_time.replace(tzinfo=timezone.utc)
        except Exception:
            target_time = datetime.now(timezone.utc)

        now = datetime.now(timezone.utc)
        wait_seconds = (target_time - now).total_seconds()

        # If scheduled in future, sleep durably
        if wait_seconds > 0:
            # Temporal durable sleep timer
            await workflow.sleep(timedelta(seconds=wait_seconds))

        # Execute delivery activity with retry policy
        delivery_input = DeliveryInput(
            user_id=user_id,
            commitment_id=commitment_id,
            title=title,
            person_name=person_name,
        )

        result: DeliveryResult = await workflow.execute_activity(
            check_and_deliver_reminder,
            delivery_input,
            start_to_close_timeout=timedelta(seconds=30),
        )

        return f"Delivered: {result.delivered}, Message: {result.message}"
