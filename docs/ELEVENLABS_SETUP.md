# PromisePocket — ElevenLabs Voice AI Integration Guide

PromisePocket integrates **ElevenLabs** for Speech-to-Text (STT) transcription and Text-to-Speech (TTS) natural voice output.

---

## 1. Acquiring ElevenLabs Credentials
1. Sign up or log in at [elevenlabs.io](https://elevenlabs.io).
2. Go to your Profile settings and copy your **API Key**.
3. (Optional) Choose a preferred Voice ID from the Voice Library (Default is `21m00Tcm4TlvDq8ikWAM`).

---

## 2. Configuration
In `backend/.env`:
```ini
ELEVENLABS_API_KEY=your_actual_elevenlabs_api_key_here
ELEVENLABS_STT_MODEL_ID=scribe_v1
ELEVENLABS_TTS_MODEL_ID=eleven_multilingual_v2
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
ELEVENLABS_TIMEOUT_SECONDS=60
```

---

## 3. Endpoints & Features

### Speech-to-Text (Transcribe)
- **Endpoint**: `POST /api/voice/transcribe`
- **Method**: Multipart file upload (`file: audio/webm` or `audio/mp4`).
- **Flow**:
  1. User presses microphone button in QuickCapture bar or Assistant composer.
  2. Browser MediaRecorder collects audio chunks.
  3. User stops recording.
  4. Audio is sent to backend which forwards to ElevenLabs STT API.
  5. Transcribed text is placed into composer for user review.

### Text-to-Speech (Speak Aloud)
- **Endpoint**: `POST /api/voice/speak`
- **Body**: `{"text": "..."}`
- Returns: `audio/mpeg` streaming response.

---

## 4. Browser Fallback
If `ELEVENLABS_API_KEY` is not provided:
- Speech synthesis automatically uses the browser's built-in `window.speechSynthesis` API (`frontend/src/lib/speech.ts`).
- Voice recording gracefully returns structured demo text for testing.
- The typed interface and Gemma extraction continue working with 100% functionality.
