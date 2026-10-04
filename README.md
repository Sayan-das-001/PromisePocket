# PromisePocket 🤝

> **"Remember the little things. Keep the promises that matter."**

PromisePocket is a warm, human-centered AI personal and family commitment assistant. It turns everyday spoken notes and natural-language messages into structured, editable commitments, verifies details with the user before scheduling, and uses durable workflows to deliver reliable reminders.

![PromisePocket Architecture](docs/media_1791107896100.png)

---

## ✨ Key Capabilities

1. **Multi-Clause Natural Language Extraction**:
   - Speak or type: *"I'll call Ma tomorrow at 7 PM and return Rahul's book on Friday"*.
   - PromisePocket extracts **two distinct proposals** with timezone-aware date resolution.
2. **User Confirmation First**:
   - AI suggestions are never scheduled commitments until you review, edit, and confirm.
3. **Conversational Assistant with Grounded Memory**:
   - Ask: *"What did I promise Rahul?"*
   - Grounded strictly in your authenticated personal database with citations to matching records.
4. **Calendar & Month/Week Views**:
   - Review promises by date with status indicator dots, day-level promise cards, and quick actions.
5. **People I Care About**:
   - Organize promises by person (Mom, Rahul, Priya, Arjun) with relationship tags and commitment counts.
6. **Voice Notes**:
   - Seamless microphone recording with ElevenLabs speech-to-text transcription and text-to-speech output.
7. **Durable Reminders**:
   - Powered by Temporal workflows that survive server restarts, network drops, and daylight saving transitions.

---

## 🛠️ Mandatory Sponsor Technologies Integrated

| Technology | Role in PromisePocket | Implementation Details |
| :--- | :--- | :--- |
| **Gemma** | Open-Weight AI Inference | `app/services/ai/gemma_ollama.py` — Local Ollama inference with zero cloud leakage, multi-intent classification, and structured JSON output. |
| **MongoDB Atlas** | Persistent Document Memory | `app/repositories/mongo_repository.py` — Multi-tenant document database with user isolation, compound indexing, and search. |
| **Temporal** | Durable Reminders | `app/workflows/reminder_workflow.py` — Durable timer workflows, worker process, rescheduling, and cancellation sync. |
| **ElevenLabs** | Voice AI (STT & TTS) | `app/services/voice/elevenlabs_service.py` — Scribe STT for voice notes & multilingual voice read-aloud with web speech fallback. |
| **Render** | Production Cloud Hosting | `render.yaml` — Infrastructure blueprint for static frontend, FastAPI backend, and Temporal background worker. |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v18+ and `npm`
- **Python** v3.10+
- *(Optional)* **Ollama** with `gemma:2b` or `gemma:7b`
- *(Optional)* **Temporal Server** (`temporal server start-dev`)
- *(Optional)* **MongoDB Atlas** connection URI

### 2. Run Backend
```bash
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be available at: `http://localhost:8000/docs`

### 3. Run Frontend
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` to launch PromisePocket.

### 4. Run Temporal Worker (Optional)
```bash
cd backend
python -m app.worker
```

---

## 🧪 Running Automated Tests

PromisePocket includes a complete suite of unit and API tests running offline with zero external credential requirements:
```bash
cd backend
pytest -v
```

---

## 📖 Detailed Documentation

- [Architecture & Design Specification](docs/ARCHITECTURE.md)
- [Setup & Local Development Guide](docs/SETUP.md)
- [AI & Privacy Policy](docs/AI_AND_PRIVACY.md)
- [MongoDB Atlas Setup](docs/MONGODB_SETUP.md)
- [Temporal Durable Workflows Setup](docs/TEMPORAL_SETUP.md)
- [ElevenLabs Voice Setup](docs/ELEVENLABS_SETUP.md)
- [Render Deployment Blueprint](docs/RENDER_DEPLOYMENT.md)
- [Complete REST API Reference](docs/API.md)
- [Hackathon Judge Demo Script](docs/DEMO_SCRIPT.md)
- [Implementation Status Tracker](docs/IMPLEMENTATION_STATUS.md)

---

## 🔒 Security & Privacy Notice
PromisePocket enforces server-side user ownership on all database operations. When running local Gemma mode, commitment text never leaves your machine. No user records or voice notes are transmitted to unauthorized third parties.
