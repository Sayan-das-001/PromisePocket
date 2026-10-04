import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    SECRET_KEY: str = "promisepocket_secret_key_change_in_production_jwt_signing_key_32chars"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,*"

    # AI - Gemma (Ollama Local or Groq Free Cloud or Deterministic)
    AI_PROVIDER: str = "ollama"  # "ollama", "groq", "demo"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "gemma:2b"
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "gemma2-9b-it"
    AI_REQUEST_TIMEOUT_SECONDS: int = 60
    AI_MAX_RETRIES: int = 2

    # MongoDB Atlas
    MONGODB_URI: str = ""
    MONGODB_DATABASE: str = "promisepocket"
    MONGODB_SERVER_SELECTION_TIMEOUT_MS: int = 5000

    # ElevenLabs Voice
    ELEVENLABS_API_KEY: str = ""
    ELEVENLABS_STT_MODEL_ID: str = "scribe_v1"
    ELEVENLABS_TTS_MODEL_ID: str = "eleven_multilingual_v2"
    ELEVENLABS_VOICE_ID: str = "21m00Tcm4TlvDq8ikWAM"
    ELEVENLABS_TIMEOUT_SECONDS: int = 60

    # Temporal
    TEMPORAL_ADDRESS: str = "localhost:7233"
    TEMPORAL_NAMESPACE: str = "default"
    TEMPORAL_TASK_QUEUE: str = "promisepocket-reminders"
    TEMPORAL_TLS_ENABLED: bool = False

    @property
    def cors_origins(self) -> List[str]:
        if not self.ALLOWED_ORIGINS or self.ALLOWED_ORIGINS.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
