import os
import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection, is_mongo_connected
from app.services.ai.extractor import ai_service
from app.services.voice.elevenlabs_service import elevenlabs_service
from app.services.reminders.temporal_client import is_temporal_connected
from app.services.reminders.in_process_engine import run_in_process_reminder_engine
from app.schemas.settings import IntegrationHealthResponse

# Import API Routers
from app.api.auth import router as auth_router
from app.api.dashboard import router as dashboard_router
from app.api.commitments import router as commitments_router
from app.api.assistant import router as assistant_router
from app.api.people import router as people_router
from app.api.calendar import router as calendar_router
from app.api.reminders import router as reminders_router
from app.api.notifications import router as notifications_router
from app.api.voice import router as voice_router
from app.api.settings import router as settings_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("promisepocket")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB Atlas if configured
    logger.info("Initializing PromisePocket application services...")
    connect_to_mongo()

    # Start in-process background reminder engine (runs on Render Free tier without paid workers)
    reminder_task = asyncio.create_task(run_in_process_reminder_engine(interval_seconds=30))

    yield

    # Shutdown: Stop reminder engine & close database connections
    reminder_task.cancel()
    try:
        await reminder_task
    except asyncio.CancelledError:
        pass

    close_mongo_connection()
    logger.info("PromisePocket application services shut down.")


app = FastAPI(
    title="PromisePocket API",
    description="Complete AI Family & Personal Commitment Assistant backend API.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers under /api
app.include_router(auth_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(commitments_router, prefix="/api")
app.include_router(assistant_router, prefix="/api")
app.include_router(people_router, prefix="/api")
app.include_router(calendar_router, prefix="/api")
app.include_router(reminders_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(voice_router, prefix="/api")
app.include_router(settings_router, prefix="/api")


@app.get("/health", response_model=IntegrationHealthResponse, tags=["Health"])
async def health_check():
    ai_health = await ai_service.check_health()
    temporal_ok = await is_temporal_connected()

    return IntegrationHealthResponse(
        ollama_connected=ai_health["ollama_connected"],
        ollama_model=ai_health["ollama_model"],
        groq_gemma_connected=ai_health.get("groq_gemma_connected", False),
        groq_model=ai_health.get("groq_model"),
        mongodb_connected=is_mongo_connected(),
        mongodb_database=settings.MONGODB_DATABASE if is_mongo_connected() else "in-memory-dev",
        temporal_connected=temporal_ok,
        temporal_task_queue=settings.TEMPORAL_TASK_QUEUE,
        elevenlabs_configured=elevenlabs_service.is_configured(),
        render_ready=True,
        mode="production" if is_mongo_connected() else "demo",
    )


@app.head("/health", include_in_schema=False)
async def head_health():
    return Response(status_code=200)


@app.head("/", include_in_schema=False)
async def head_root():
    return Response(status_code=200)


@app.get("/ready", tags=["Health"])
async def readiness_check():
    return {"status": "ready", "service": "PromisePocket"}


# Locate potential frontend dist path for single-service deployment
frontend_dist_path = None
for p in ["../frontend/dist", "./frontend/dist", "frontend/dist"]:
    if os.path.exists(p) and os.path.isdir(p):
        frontend_dist_path = os.path.abspath(p)
        break

if frontend_dist_path:
    logger.info("Found frontend build at: %s. Enabling SPA static serving.", frontend_dist_path)
    assets_dir = os.path.join(frontend_dist_path, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa_frontend(full_path: str):
        # Allow /docs, /openapi.json, /api to pass through
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            raise HTTPException(status_code=404, detail="Not Found")
        file_path = os.path.join(frontend_dist_path, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist_path, "index.html"))
else:
    @app.get("/", tags=["Root"])
    async def root():
        return {
            "name": "PromisePocket API",
            "tagline": "Remember the little things. Keep the promises that matter.",
            "version": "1.0.0",
            "docs_url": "/docs",
        }
