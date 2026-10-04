import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends, Response
from pydantic import BaseModel
from app.api.deps import get_current_user
from app.schemas.auth import UserResponse
from app.services.voice.elevenlabs_service import elevenlabs_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/voice", tags=["Voice AI"])

MAX_AUDIO_SIZE = 15 * 1024 * 1024  # 15 MB


class SpeakRequest(BaseModel):
    text: str


@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user),
):
    """
    Transcribe recorded user voice note using ElevenLabs STT.
    """
    audio_bytes = await file.read()
    if len(audio_bytes) > MAX_AUDIO_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Audio recording exceeds 15 MB limit.",
        )

    try:
        transcript = await elevenlabs_service.transcribe_audio(audio_bytes, file.filename or "recording.webm")
        return {"text": transcript}
    except Exception as e:
        logger.warning("Voice transcription failed: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transcription failed: {str(e)}",
        )


@router.post("/speak")
async def generate_speech(
    payload: SpeakRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    """
    Generate speech audio for assistant responses using ElevenLabs TTS.
    """
    if not elevenlabs_service.is_configured():
        return {"message": "ElevenLabs API key not configured. Use browser speech synthesis."}

    audio_bytes = await elevenlabs_service.text_to_speech(payload.text)
    if not audio_bytes:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate speech audio.",
        )

    return Response(content=audio_bytes, media_type="audio/mpeg")
