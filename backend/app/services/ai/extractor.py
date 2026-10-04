import logging
from typing import List, Dict, Any, Tuple
from app.core.config import settings
from app.services.ai.base import BaseAIProvider
from app.services.ai.gemma_ollama import OllamaGemmaProvider
from app.services.ai.mock_provider import DeterministicMockProvider
from app.schemas.proposal import CommitmentProposal

logger = logging.getLogger(__name__)


class AIExtractorService:
    def __init__(self):
        self._ollama_provider = OllamaGemmaProvider()
        self._mock_provider = DeterministicMockProvider()

    async def get_active_provider(self) -> BaseAIProvider:
        if settings.AI_PROVIDER == "ollama":
            if await self._ollama_provider.is_available():
                return self._ollama_provider
            logger.info("Ollama is not reachable on %s. Using deterministic fallback provider.", settings.OLLAMA_BASE_URL)
        return self._mock_provider

    async def extract(self, text: str, timezone: str = "Asia/Kolkata") -> Tuple[List[CommitmentProposal], str]:
        provider = await self.get_active_provider()
        intent = await provider.classify_intent(text)
        if intent != "new_commitment":
            return [], intent

        proposals = await provider.extract_proposals(text, timezone=timezone)
        # If ollama returned empty on multi-clause text, run deterministic extractor
        if not proposals:
            proposals = await self._mock_provider.extract_proposals(text, timezone=timezone)

        return proposals, intent

    async def answer_query(self, query: str, context_commitments: List[Dict[str, Any]]) -> str:
        provider = await self.get_active_provider()
        return await provider.answer_commitment_query(query, context_commitments)

    async def check_health(self) -> Dict[str, Any]:
        ollama_ok = await self._ollama_provider.is_available()
        return {
            "ollama_connected": ollama_ok,
            "ollama_model": settings.OLLAMA_MODEL if ollama_ok else None,
            "provider_mode": "ollama" if ollama_ok else "mock_fallback",
        }


ai_service = AIExtractorService()
