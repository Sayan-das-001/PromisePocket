# PromisePocket — Setup & Local Development Guide

## 1. Prerequisites
- **Node.js**: v18+ and `npm`
- **Python**: v3.10+
- *(Optional)* **Ollama**: For running local open-weight Gemma models
- *(Optional)* **Temporal CLI / Server**: For local durable reminder workflows
- *(Optional)* **MongoDB Atlas account**: For persistent cloud document memory

---

## 2. Quick Start (Development Mode)

### Step 1: Clone or Navigate to Project
```bash
cd promisepocket
```

### Step 2: Set Up Backend
```bash
cd backend
python -m venv venv

# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Windows Command Prompt:
.\venv\Scripts\activate.bat
# Linux / macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

Start the FastAPI backend:
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be live at: `http://localhost:8000/docs`

---

### Step 3: Set Up Frontend
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser. The application will automatically connect to the backend!

---

## 3. Running Gemma AI via Ollama

To run open-weight Gemma locally:
1. Download and install Ollama from [ollama.com](https://ollama.com).
2. Pull the Gemma model:
   ```bash
   ollama pull gemma:2b
   # or for more capable hardware:
   ollama pull gemma:7b
   ```
3. Start the Ollama server:
   ```bash
   ollama serve
   ```
4. In `backend/.env`, verify:
   ```ini
   AI_PROVIDER=ollama
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=gemma:2b
   ```
If Ollama is not running, PromisePocket automatically falls back to its deterministic extraction engine with zero configuration needed.

---

## 4. Running Temporal Workflows & Worker

To run local durable reminder workflows:
1. Start the Temporal development server:
   ```bash
   temporal server start-dev
   ```
   (Temporal Web UI is available at `http://localhost:8233`)
2. Start the PromisePocket Temporal Worker in a separate terminal:
   ```bash
   cd backend
   python -m app.worker
   ```
If Temporal is offline, PromisePocket uses its development scheduler fallback, recording reminders safely in the repository.

---

## 5. Running Automated Tests

To run the backend test suite:
```bash
cd backend
pytest -v
```
All tests use mock fixtures and run cleanly offline without requiring paid API keys!
