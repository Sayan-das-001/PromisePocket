import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection, is_mongo_connected
from app.services.ai.extractor import ai_service
from app.services.voice.elevenlabs_service import elevenlabs_service
from app.services.reminders.temporal_client import is_temporal_connected
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
    yield
    # Shutdown: Close database connections
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
    allow_origins=settings.cors_origins or ["*"],
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
        mongodb_connected=is_mongo_connected(),
        mongodb_database=settings.MONGODB_DATABASE if is_mongo_connected() else "in-memory-dev",
        temporal_connected=temporal_ok,
        temporal_task_queue=settings.TEMPORAL_TASK_QUEUE,
        elevenlabs_configured=elevenlabs_service.is_configured(),
        render_ready=True,
        mode="production" if is_mongo_connected() and ai_health["ollama_connected"] else "demo",
    )


@app.get("/ready", tags=["Health"])
async def readiness_check():
    return {"status": "ready", "service": "PromisePocket"}


@app.get("/", tags=["Root"])
async def root():
    return {
        "name": "PromisePocket API",
        "tagline": "Remember the little things. Keep the promises that matter.",
        "version": "1.0.0",
        "docs_url": "/docs",
    }
