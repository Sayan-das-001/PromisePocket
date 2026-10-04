import logging
from typing import List, Dict, Any, Tuple
from app.core.config import settings
from app.services.ai.base import BaseAIProvider
from app.services.ai.gemma_ollama import OllamaGemmaProvider
from app.services.ai.groq_gemma import GroqGemmaProvider
from app.services.ai.mock_provider import DeterministicMockProvider
from app.schemas.proposal import CommitmentProposal

logger = logging.getLogger(__name__)


class AIExtractorService:
    def __init__(self):
        self._ollama_provider = OllamaGemmaProvider()
        self._groq_provider = GroqGemmaProvider()
        self._mock_provider = DeterministicMockProvider()

    async def get_active_provider(self) -> BaseAIProvider:
        # Check Groq Gemma first if configured (100% free cloud inference for Render)
        if await self._groq_provider.is_available():
            return self._groq_provider

        # Check local Ollama next
        if settings.AI_PROVIDER == "ollama":
            if await self._ollama_provider.is_available():
                return self._ollama_provider

        return self._mock_provider

    async def extract(self, text: str, timezone: str = "Asia/Kolkata") -> Tuple[List[CommitmentProposal], str]:
        provider = await self.get_active_provider()
        intent = await provider.classify_intent(text)
        if intent != "new_commitment":
            return [], intent

        proposals = await provider.extract_proposals(text, timezone=timezone)
        # If model returned empty, run deterministic extractor
        if not proposals:
            proposals = await self._mock_provider.extract_proposals(text, timezone=timezone)

        return proposals, intent

    async def answer_query(self, query: str, context_commitments: List[Dict[str, Any]]) -> str:
        provider = await self.get_active_provider()
        return await provider.answer_commitment_query(query, context_commitments)

    async def check_health(self) -> Dict[str, Any]:
        groq_ok = await self._groq_provider.is_available()
        ollama_ok = await self._ollama_provider.is_available()
        mode = "groq_gemma" if groq_ok else "ollama" if ollama_ok else "deterministic"

        return {
            "ollama_connected": ollama_ok,
            "ollama_model": settings.OLLAMA_MODEL if ollama_ok else None,
            "groq_gemma_connected": groq_ok,
            "groq_model": settings.GROQ_MODEL if groq_ok else None,
            "provider_mode": mode,
        }


ai_service = AIExtractorService()
