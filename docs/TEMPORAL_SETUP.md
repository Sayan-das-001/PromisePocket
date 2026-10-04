# PromisePocket — Temporal Durable Reminders Architecture & Setup

PromisePocket uses **Temporal** to orchestrate durable reminders that survive server reboots, restarts, and network partitions.

---

## 1. Why Temporal?
Ordinary cron jobs or in-memory timers fail when containers restart, reschedule, or redeploy. Temporal provides durable execution:
- **Durable timers**: `workflow.sleep()` can wait for seconds, days, or months durably without holding memory or connections.
- **Resilience**: If the worker or server crashes, Temporal resumes exactly where it left off.
- **Idempotency**: Activities verify current commitment status before delivering notifications.

---

## 2. Architecture & File Structure

- **Workflow**: `backend/app/workflows/reminder_workflow.py` (`ReminderWorkflow`)
  - Starts with workflow ID `f"reminder-{commitment_id}"`.
  - Durably sleeps until the scheduled reminder instant.
  - Calls activity `check_and_deliver_reminder`.
- **Activity**: `backend/app/activities/notification_activities.py` (`check_and_deliver_reminder`)
  - Verifies that commitment status is still `pending`. If completed or cancelled, cleanly terminates without firing an obsolete alert.
  - Inserts in-app notification.
  - Marks reminder delivery status as `delivered`.
- **Worker**: `backend/app/worker.py`
  - Separate Python process polling task queue `promisepocket-reminders`.

---

## 3. Running Locally

### Step 1: Install Temporal CLI
Follow the [official Temporal installation guide](https://docs.temporal.io/cli):
```bash
# macOS/Linux:
brew install temporal
# Windows:
winget install Temporal.TemporalCLI
```

### Step 2: Start Development Server
```bash
temporal server start-dev
```
Access the Temporal Web UI at `http://localhost:8233`.

### Step 3: Run Worker Process
In a separate terminal:
```bash
cd backend
python -m app.worker
```

---

## 4. Development Fallback
If the Temporal development server is offline, the backend uses `app/services/reminders/fallback_scheduler.py`. This records the reminder cleanly in the database, allowing UI development to continue without friction.
