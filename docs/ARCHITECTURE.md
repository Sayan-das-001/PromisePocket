# PromisePocket — System Architecture & Design Specification

"Remember the little things. Keep the promises that matter."

---

## 1. Executive Architecture Overview

PromisePocket is an AI-powered personal and family commitment assistant built with a mobile-first, warm human-centered UI and a durable distributed backend. It turns casual conversations, typed messages, and spoken voice notes into structured, editable commitments, provides durable reminders, and maintains a grounded memory of what you promised.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Frontend Client (React 18 + Vite)                    │
│  - Playfair Display & Inter Typography                                 │
│  - Warm Ivory (#FFF9F5), Soft Peach (#FFE2D5), Coral Accent (#FF986F)  │
│  - 3 Core Views: Dashboard, Conversational Assistant, Calendar         │
│  - Web Speech Fallback + AudioRecorder (MediaRecorder API)             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / JSON REST
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      FastAPI Backend Web Service                       │
│  - JWT Bearer Authentication & Multi-Tenant User Isolation            │
│  - REST API Routers: /commitments, /assistant, /calendar, /people...   │
│  - Deterministic DateResolver (IANA Timezone-aware date calculations)   │
└──────────────┬───────────────────┬───────────────────┬─────────────────┘
               │                   │                   │
               ▼                   ▼                   ▼
    ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────────┐
    │ Gemma Open-Weight│  │  MongoDB Atlas   │  │ Temporal Workflows     │
    │ AI (Ollama Local │  │ Document Memory  │  │ & Reminders Engine     │
    │  or Remote API)  │  │ User Isolation   │  │ - Durable Timers       │
    │ - Intent Classify│  │ - Commitments    │  │ - Idempotent Activities│
    │ - Multi-clause   │  │ - People         │  │ - Reschedule/Cancel    │
    │ - Grounded QA    │  │ - Reminders      │  │ - Python Worker        │
    └──────────────────┘  └──────────────────┘  └────────────────────────┘
               ▲
               │
    ┌──────────────────┐
    │ ElevenLabs Voice │
    │ - STT Scribe     │
    │ - TTS Multilingual
    └──────────────────┘
```

---

## 2. Core Sponsor Technology Integrations

### 1. Gemma (Open-Weight AI)
- **Engine**: Gemma 2B-IT / 7B-IT instruction models served locally via Ollama (`http://localhost:11434`) or compatible remote inference endpoint.
- **Provider Abstraction**: `BaseAIProvider` implemented by `OllamaGemmaProvider` and `DeterministicMockProvider`.
- **Extraction Pipeline**: Extracts actions, people, and time phrases into structured `CommitmentProposal` items.
- **Privacy Guarantee**: When running in local mode, prompts and user commitment texts never leave the user's host.

### 2. MongoDB Atlas (Persistent Document Memory)
- **Collections**: `commitments`, `people`, `users`, `reminders`, `notifications`.
- **Security**: Strict user-level multi-tenant isolation where all database queries enforce `user_id`.
- **Indexes**: Compound index on `(user_id, due_at)`, `(user_id, status)`, and full-text search indexes on `title` and `description`.
- **Fault-Tolerance**: If Atlas credentials are not yet configured, the system transparently utilizes the in-memory repository with zero disruption to the user experience.

### 3. Temporal (Durable Workflow Reminders)
- **Workflow**: `ReminderWorkflow` computes the exact duration until reminder time and durably sleeps via `workflow.sleep()`.
- **Activity**: `check_and_deliver_reminder` executes idempotently, verifies the commitment is still pending, creates an in-app notification, and updates reminder delivery status.
- **Worker**: Separate Python background process (`python -m app.worker`) polling task queue `promisepocket-reminders`.

### 4. ElevenLabs (Voice AI)
- **Speech-to-Text (STT)**: User voice notes recorded via microphone in the composer are transcribed using ElevenLabs Scribe STT API.
- **Text-to-Speech (TTS)**: Assistant answers and promise details can be spoken aloud via ElevenLabs multilingual models with browser speech synthesis fallback.

### 5. Render (Cloud Deployment)
- **Frontend**: Render Static Site pointing to `./frontend/dist`.
- **Backend**: Render Web Service running FastAPI.
- **Worker**: Render Background Worker running the Temporal Python worker.

---

## 3. Commitment Confirmation Guarantee

**Rule**: An AI proposal is never a scheduled commitment until explicitly reviewed and accepted by the user.

1. User enters: *"I'll call Ma tomorrow at 7 PM and return Rahul's book on Friday"*.
2. AI extraction produces two distinct `CommitmentProposal` items:
   - Proposal 1: "Call Ma", Person: Ma, Date: tomorrow's resolved date, Time: 19:00.
   - Proposal 2: "Return Rahul's book", Person: Rahul, Date: Friday's resolved date, Time: unspecified.
3. User inspects proposal cards:
   - User can edit any parameter (date, time, category, person).
   - User can reject individual proposals.
   - User confirms.
4. Commitment is written to the database with a unique ID and idempotency key.
5. Temporal durable reminder workflow is scheduled.
