from typing import Optional, Literal
from pydantic import BaseModel


class SettingsUpdate(BaseModel):
    display_name: Optional[str] = None
    timezone: Optional[str] = None
    preferred_reminder_lead_minutes: Optional[int] = None
    default_reminder_time: Optional[str] = None
    ai_provider: Optional[Literal["ollama", "remote", "demo"]] = None


class IntegrationHealthResponse(BaseModel):
    ollama_connected: bool
    ollama_model: Optional[str] = None
    mongodb_connected: bool
    mongodb_database: Optional[str] = None
    temporal_connected: bool
    temporal_task_queue: Optional[str] = None
    elevenlabs_configured: bool
    render_ready: bool
    mode: str
