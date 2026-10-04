# PromisePocket — Render Deployment Guide

This guide walks through deploying PromisePocket on [Render](https://render.com) using the provided `render.yaml` blueprint.

---

## 1. Architecture on Render
1. **Frontend**: Static Site service (`promisepocket-frontend`), built from `frontend/` using Vite.
2. **Backend**: Web Service (`promisepocket-backend`), built from `backend/` running FastAPI with Uvicorn.
3. **Temporal Worker**: Background Worker (`promisepocket-temporal-worker`), running `python -m app.worker`.

---

## 2. Deploying via Blueprint (`render.yaml`)

### Step 1: Connect GitHub Repository
1. Push your repository to GitHub.
2. Sign in to your Render Dashboard.
3. Click **New +** and select **Blueprint**.
4. Select your PromisePocket repository.
5. Render will automatically parse `render.yaml` and discover the three services.

### Step 2: Configure Environment Variables
Set the following environment variables in the Render dashboard:
- `SECRET_KEY`: Auto-generated JWT signing secret.
- `MONGODB_URI`: Your MongoDB Atlas connection URI (`mongodb+srv://...`).
- `MONGODB_DATABASE`: `promisepocket`.
- `TEMPORAL_ADDRESS`: Address of your hosted Temporal Cloud cluster (e.g. `your-namespace.tmprl.cloud:7233`) or remote Temporal instance.
- `ELEVENLABS_API_KEY`: *(Optional)* Your ElevenLabs API key for voice transcription.

### Step 3: Deploy Services
Click **Apply**. Render will automatically:
1. Build the frontend (`npm run build`) and serve static assets.
2. Build the backend container and verify health via `GET /health`.
3. Launch the Temporal worker process.

---

## 3. Manual Deployment Alternative (Step-by-Step)

If not using Blueprint:

### A. FastAPI Backend Web Service
- **Name**: `promisepocket-backend`
- **Environment**: Python 3.11
- **Root Directory**: `backend`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Health Check Path**: `/health`

### B. React Frontend Static Site
- **Name**: `promisepocket-frontend`
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Rewrite Rule**: `/* -> /index.html` (SPA routing)
- **Environment Variable**: `VITE_API_URL = https://promisepocket-backend.onrender.com`

---

## 4. Verification
Once deployed:
1. Navigate to your frontend URL: `https://promisepocket-frontend.onrender.com`
2. Check backend health: `https://promisepocket-backend.onrender.com/health`
3. Check OpenAPI documentation: `https://promisepocket-backend.onrender.com/docs`
