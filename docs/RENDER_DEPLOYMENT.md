# PromisePocket — 100% FREE Render Deployment Guide

> **Total Cost: $0.00 / month (Zero Credit Card Required)**

---

## Why did Blueprint ask for money/card?

Render requires a credit card on file whenever you use **"Blueprint"** (`render.yaml`), even if every service inside is marked free. This is Render's anti-abuse policy for automated infrastructure files.

**HOWEVER: Creating an individual Web Service on Render is 100% FREE and NEVER asks for a credit card!**

We have prepared a single-service Docker setup that compiles your React frontend and FastAPI backend into **ONE Free Web Service**.

---

## 🚀 Step-by-Step 100% Free Deployment (No Credit Card)

### Step 1: Open Render Dashboard
1. Go to [dashboard.render.com](https://dashboard.render.com).
2. Log in with your GitHub account.

---

### Step 2: Click "New +" and Select "Web Service"
> ⚠️ **IMPORTANT**: Do **NOT** click "Blueprint"! Click **Web Service**.

1. In the top-right corner of the Render dashboard, click the blue **New +** button.
2. Select **Web Service** from the menu.

---

### Step 3: Connect Your GitHub Repository
1. Select **`Sayan-das-001/PromisePocket`** from your repository list (or paste `https://github.com/Sayan-das-001/PromisePocket`).
2. Click **Connect**.

---

### Step 4: Configure the Web Service
Fill in the following fields:

- **Name**: `promisepocket` (or any name you prefer)
- **Region**: Select the region closest to you (e.g. `Singapore` or `Frankfurt` or `Oregon`)
- **Branch**: `main`
- **Root Directory**: *(Leave blank)*
- **Runtime**: Render will automatically detect and select **`Docker`** (from the root `Dockerfile`).
- **Instance Type**: Select **Free ($0/month)**.

---

### Step 5: Add Environment Variables
Scroll down to the **Environment Variables** section and click **Add Environment Variable** for each:

| Key | Value |
|---|---|
| `MONGODB_URI` | `mongodb+srv://sayan24430823022:Dada1234@cluster0.sffiau3.mongodb.net/?appName=Cluster0` |
| `ELEVENLABS_API_KEY` | `sk_2b103cd258d6f99d890f8e8e193ac162e9b4793dc5aaa5f4` |
| `SECRET_KEY` | `promisepocket_secret_key_change_in_production_jwt_signing_key_32chars` |
| `AI_PROVIDER` | `demo` |

*(Optional: If you have a free Groq API key, you can add `GROQ_API_KEY` and set `AI_PROVIDER` to `groq` to run Gemma 2 9B-IT in the cloud for free!)*

---

### Step 6: Click "Deploy Web Service"
1. Click the blue **Deploy Web Service** button at the bottom of the page.
2. Render will NOT ask for any credit card or payment.
3. Render will start the build:
   - Compiles React frontend with Vite.
   - Sets up Python 3.11 with FastAPI.
   - Bundles the frontend inside FastAPI.
   - Starts Uvicorn and embedded reminder engine.
4. When the log says `Application startup complete`, your app is live!

---

## 🌐 Accessing Your Live Application

Your app will be available at:
```
https://promisepocket.onrender.com
```
(or whatever name you chose: `https://<service-name>.onrender.com`)

- **Full Application UI**: `https://<service-name>.onrender.com/`
- **Interactive Swagger API Docs**: `https://<service-name>.onrender.com/docs`
- **System Health Check**: `https://<service-name>.onrender.com/health`

---

## ⚠️ Important: MongoDB Atlas Access Check
To make sure Render can connect to your MongoDB Atlas database:
1. Go to [cloud.mongodb.com](https://cloud.mongodb.com).
2. Go to **Network Access** (in the left sidebar under Security).
3. Check if IP `0.0.0.0/0` (Allow Access from Anywhere) is active.
4. If not, click **Add IP Address** -> **Allow Access from Anywhere** -> **Confirm**.
