import logging
from typing import Optional
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


class ElevenLabsService:
    def __init__(self):
        self.api_key = settings.ELEVENLABS_API_KEY
        self.timeout = settings.ELEVENLABS_TIMEOUT_SECONDS
        self.voice_id = settings.ELEVENLABS_VOICE_ID
        self.tts_model = settings.ELEVENLABS_TTS_MODEL_ID
        self.stt_model = settings.ELEVENLABS_STT_MODEL_ID

    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 5)

    async def transcribe_audio(self, audio_bytes: bytes, filename: str = "audio.webm") -> str:
        """
        Transcribe audio using ElevenLabs Scribe STT API if configured,
        or graceful fallback for demo.
        """
        if not self.is_configured():
            logger.info("ElevenLabs API key not configured. Returning fallback transcription.")
            return "I will call Ma tomorrow at 7 PM and return Rahul's book on Friday."

        # ElevenLabs Speech-to-Text endpoint
        url = "https://api.elevenlabs.io/v1/speech-to-text"
        headers = {"xi-api-key": self.api_key}
        files = {"file": (filename, audio_bytes, "audio/webm")}
        data = {"model_id": self.stt_model}

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.post(url, headers=headers, files=files, data=data)
                res.raise_for_status()
                result = res.json()
                return result.get("text", "").strip()
        except Exception as e:
            logger.warning("ElevenLabs transcription failed (%s). Falling back.", str(e))
            raise RuntimeError(f"ElevenLabs transcription error: {str(e)}")

    async def text_to_speech(self, text: str) -> Optional[bytes]:
        """
        Generate audio bytes using ElevenLabs TTS API if configured.
        """
        if not self.is_configured():
            return None

        url = f"https://api.elevenlabs.io/v1/text-to-speech/{self.voice_id}"
        headers = {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        }
        payload = {
            "text": text,
            "model_id": self.tts_model,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.post(url, headers=headers, json=payload)
                res.raise_for_status()
                return res.content
        except Exception as e:
            logger.warning("ElevenLabs TTS failed: %s", str(e))
            return None


elevenlabs_service = ElevenLabsService()
