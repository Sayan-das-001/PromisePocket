from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from app.schemas.proposal import CommitmentProposal


class BaseAIProvider(ABC):
    @abstractmethod
    async def extract_proposals(
        self, text: str, timezone: str = "Asia/Kolkata"
    ) -> List[CommitmentProposal]:
        """Extract one or more commitment proposals from natural language text."""
        pass

    @abstractmethod
    async def classify_intent(self, text: str) -> str:
        """Classify user intent into: new_commitment, query_history, modify_commitment, or general_chat."""
        pass

    @abstractmethod
    async def answer_commitment_query(
        self, query: str, context_commitments: List[Dict[str, Any]]
    ) -> str:
        """Answer a question about user promises grounded in retrieved records."""
        pass

    @abstractmethod
    async def generate_response(self, prompt: str) -> str:
        """Generate general assistant text."""
        pass

    @abstractmethod
    async def is_available(self) -> bool:
        """Check if provider is online and reachable."""
        pass
