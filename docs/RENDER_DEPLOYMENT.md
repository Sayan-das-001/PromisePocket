# PromisePocket — 100% FREE Render Deployment Guide

> **Total Cost: $0.00 / month (Zero Credit Card Required)**

This guide explains how to deploy PromisePocket on [Render.com](https://render.com) using **only** Render's Free Tier, MongoDB Atlas's Free Shared Cluster (M0), and optional free AI inference.

---

## 1. Why is this 100% Free?

Many cloud templates accidentally require paid services:
- ❌ Render Background Workers require a paid plan ($7/month).
- ❌ Self-hosted Temporal requires a dedicated paid virtual machine.
- ❌ Running local Ollama on cloud servers requires an expensive GPU.

**How PromisePocket makes it 100% Free:**
- ✅ **Frontend**: Deploys as a Render **Static Site** (100% Free, zero bandwidth cost, free SSL, global CDN).
- ✅ **Backend**: Deploys as a Render **Web Service** on the **Free Plan** (512 MB RAM, free instance hours).
- ✅ **Embedded Durable Reminders**: Runs in-process inside the FastAPI web process as an async background task — no paid worker needed!
- ✅ **Database**: Uses MongoDB Atlas Free Tier (M0, 512 MB storage, free forever).
- ✅ **AI**: Uses our built-in smart extraction engine (0 extra cost, 0 MB extra RAM) with optional 100% free cloud Gemma 2 inference via Groq.
- ✅ **Voice**: Uses your free ElevenLabs API key and/or browser-native Web Speech API.

---

## 2. Option A: Deploy via Blueprint (Recommended, 2 Minutes)

Render Blueprints automatically configure both the Static Site and the Backend Web Service from `render.yaml`.

### Step 1: Push Code to GitHub
1. Create a new repository on [GitHub](https://github.com).
2. Push your `promisepocket` project:
   ```bash
   cd "C:\Users\SAYAN DAS\.gemini\antigravity\scratch\promisepocket"
   git init
   git add .
   git commit -m "Initial PromisePocket build"
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Create Blueprint on Render
1. Sign in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** (top right) and select **Blueprint**.
3. Connect your GitHub repository.
4. Render will read `render.yaml` and discover two free services:
   - `promisepocket-frontend` (Static Site, Free)
   - `promisepocket-backend` (Web Service, Free)
5. Under Environment Variables for `promisepocket-backend`, add:
   - **`MONGODB_URI`**: `mongodb+srv://sayan24430823022:Dada1234@cluster0.sffiau3.mongodb.net/?appName=Cluster0`
   - **`ELEVENLABS_API_KEY`**: `sk_2b103cd258d6f99d890f8e8e193ac162e9b4793dc5aaa5f4`
   - **`AI_PROVIDER`**: `demo` (or add `GROQ_API_KEY` for free remote Gemma 2)
6. Click **Apply**.
7. Render will build and deploy both services automatically!

---

## 3. Option B: Deploy as a Single Free Web Service (Simplest)

If you prefer to deploy everything under **one single URL** without managing two separate services:

1. In Render Dashboard, click **New + > Web Service**.
2. Connect your repository.
3. Choose **Docker** as the Runtime (Render will automatically detect the root `Dockerfile`).
4. Select the **Free** instance type.
5. In the Environment section, add:
   - `MONGODB_URI`: `mongodb+srv://sayan24430823022:Dada1234@cluster0.sffiau3.mongodb.net/?appName=Cluster0`
   - `ELEVENLABS_API_KEY`: `sk_2b103cd258d6f99d890f8e8e193ac162e9b4793dc5aaa5f4`
   - `AI_PROVIDER`: `demo`
   - `SECRET_KEY`: `any_long_random_secret_string_32_chars`
6. Click **Create Web Service**.
7. Render builds the React frontend and Python backend into one container and serves the whole application on `https://your-app-name.onrender.com`!

---

## 4. Post-Deployment Verification

1. Open your frontend URL: `https://promisepocket-frontend.onrender.com` (or your single web service URL).
2. Check backend health: `https://promisepocket-backend.onrender.com/health`
   You should see:
   ```json
   {
     "mongodb_connected": true,
     "mongodb_database": "promisepocket",
     "elevenlabs_configured": true,
     "render_ready": true,
     "mode": "production"
   }
   ```
3. Test creating a promise:
   *"I'll call Ma tomorrow at 7 PM and return Rahul's book on Friday"*
4. Accept the proposal:
   It persists directly to your MongoDB Atlas cluster at zero cost!

---

## 5. Free Tier Tips & Sleep Behavior

- **Sleep on Inactivity**: Render's free web services sleep after 15 minutes of inactivity. When you visit the site, it may take 30–45 seconds to spin up on the first request.
- **MongoDB Atlas Free Tier**: Your Atlas cluster (`cluster0.sffiau3.mongodb.net`) never sleeps and stores up to 512 MB of data for free.
- **Database IP Whitelist**: In your MongoDB Atlas dashboard under **Network Access**, ensure you have `0.0.0.0/0` (Allow access from anywhere) enabled so Render can connect to your database.
