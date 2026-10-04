# PromisePocket — REST API Documentation

Base URL: `/api`  
Interactive OpenAPI UI: `http://localhost:8000/docs`

---

## Authentication (`/api/auth`)

### `POST /api/auth/register`
Register a new user account.
```json
// Request
{
  "email": "user@example.com",
  "password": "securepassword",
  "display_name": "Sarah",
  "timezone": "Asia/Kolkata"
}
// Response (200 OK)
{
  "access_token": "jwt.token.here",
  "token_type": "bearer",
  "user": { ... }
}
```

### `POST /api/auth/login`
Authenticate with email and password.

### `POST /api/auth/demo`
Authenticate instantly with the pre-seeded demo user account.

### `GET /api/auth/me`
Retrieve currently authenticated user profile.

---

## Dashboard (`/api/dashboard`)

### `GET /api/dashboard/summary`
Returns summary metrics (due today, upcoming, completed, overdue), today's commitments, upcoming events, people counts, and deterministic AI insight.

---

## Commitments (`/api/commitments`)

### `GET /api/commitments`
List commitments with optional query parameters:
- `status`: `pending`, `completed`, `cancelled`
- `person_id`: filter by person
- `category`: `family`, `friendship`, `study`, `errands`, `health`, `work`, `other`
- `search`: text query

### `POST /api/commitments`
Create a commitment. Automatically schedules a Temporal reminder workflow if `reminder_enabled` is true.

### `PATCH /api/commitments/{id}`
Update commitment fields. If `due_at` or `reminder_at` is updated, reschedules the Temporal workflow.

### `POST /api/commitments/{id}/complete`
Mark a commitment complete. Cancels active reminder workflow.

### `POST /api/commitments/{id}/cancel`
Cancel a commitment. Cancels active reminder workflow.

### `DELETE /api/commitments/{id}`
Delete a commitment and cancel its reminder workflow.

---

## AI Assistant (`/api/assistant`)

### `POST /api/assistant/message`
Main conversational endpoint:
- Automatically classifies intent.
- If new commitment: returns structured proposals for confirmation.
- If query history: queries database memory, grounds Gemma answer in records, and returns citations.
- If modify: returns proposal for confirmed update.

### `POST /api/assistant/extract`
Direct commitment extraction endpoint.

### `POST /api/assistant/confirm`
Confirms a proposal card, creates or links contact, writes to database, and schedules Temporal workflow.

---

## People (`/api/people`)
- `GET /api/people`
- `POST /api/people`
- `PATCH /api/people/{id}`
- `DELETE /api/people/{id}`

---

## Calendar (`/api/calendar`)
- `GET /api/calendar/events?year=2026&month=10`

---

## Health & Diagnostics
- `GET /health` (Ollama, MongoDB, Temporal, ElevenLabs status)
- `GET /ready` (Readiness probe)
