import json
import logging
import uuid
import httpx
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.services.ai.base import BaseAIProvider
from app.services.ai.date_resolver import DateResolver
from app.schemas.proposal import CommitmentProposal

logger = logging.getLogger(__name__)


class OllamaGemmaProvider(BaseAIProvider):
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL.rstrip("/")
        self.model = settings.OLLAMA_MODEL
        self.timeout = settings.AI_REQUEST_TIMEOUT_SECONDS

    async def is_available(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    models = res.json().get("models", [])
                    model_names = [m.get("name", "") for m in models]
                    # Check if our model or a compatible gemma model exists
                    has_model = any(self.model in name or "gemma" in name for name in model_names)
                    return has_model
                return False
        except Exception:
            return False

    async def _query_ollama(self, prompt: str, system: Optional[str] = None) -> str:
        url = f"{self.base_url}/api/generate"
        payload: Dict[str, Any] = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
        }
        if system:
            payload["system"] = system

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            res = await client.post(url, json=payload)
            res.raise_for_status()
            data = res.json()
            return data.get("response", "").strip()

    async def classify_intent(self, text: str) -> str:
        text_lower = text.lower()
        if text_lower.startswith("what did i") or text_lower.startswith("show me") or "?" in text:
            return "query_history"
        if "move my" in text_lower or "reschedule" in text_lower or "change" in text_lower:
            return "modify_commitment"
        return "new_commitment"

    async def extract_proposals(
        self, text: str, timezone: str = "Asia/Kolkata"
    ) -> List[CommitmentProposal]:
        system_prompt = (
            "You are PromisePocket's extraction engine. Extract all personal commitments from the user's text. "
            "Return ONLY valid JSON matching this schema: "
            '{"commitments": [{"action": "string", "person": "string or null", "raw_time": "string or null", "category": "family|friendship|study|errands|health|work|other"}]}'
        )

        prompt = f"Extract all commitments from this message: \"{text}\""

        try:
            raw_response = await self._query_ollama(prompt, system=system_prompt)
            # Find JSON block
            json_start = raw_response.find("{")
            json_end = raw_response.rfind("}") + 1
            if json_start != -1 and json_end != -1:
                json_str = raw_response[json_start:json_end]
                parsed = json.loads(json_str)
                extracted_items = parsed.get("commitments", [])
            else:
                extracted_items = []
        except Exception as e:
            logger.warning("Ollama Gemma extraction parsing failed: %s. Using fallback parser.", str(e))
            # Fallback to local parsing
            return []

        proposals: List[CommitmentProposal] = []
        for item in extracted_items:
            action = item.get("action") or "Promise"
            person = item.get("person")
            raw_time = item.get("raw_time") or text

            # Resolve dates with trusted deterministic DateResolver
            (
                p_date,
                p_time,
                precision,
                r_rule,
                is_ambig,
                ambig_note,
            ) = DateResolver.resolve_date_and_time(raw_time, tz_name=timezone)

            cat = str(item.get("category", "")).lower().strip()
            valid_cats = {"family", "friendship", "study", "errands", "health", "work", "other"}
            if cat not in valid_cats:
                cat = "family" if person else "errands"

            proposals.append(
                CommitmentProposal(
                    proposal_id=str(uuid.uuid4()),
                    title=action,
                    person_name=person,
                    category=cat,
                    proposed_date=p_date,
                    proposed_time=p_time,
                    date_precision=precision,
                    timezone=timezone,
                    recurrence_rule=r_rule,
                    reminder_enabled=True,
                    is_ambiguous=is_ambig,
                    ambiguity_note=ambig_note,
                    status="draft",
                )
            )

        return proposals

    async def answer_commitment_query(
        self, query: str, context_commitments: List[Dict[str, Any]]
    ) -> str:
        if not context_commitments:
            return "I searched your personal pocket memory, but found no saved commitments matching your question."

        records_summary = "\n".join(
            [
                f"- Title: {c.get('title')} | Person: {c.get('person_name_snapshot')} | Due: {c.get('due_at', 'Unspecified')} | Status: {c.get('status')}"
                for c in context_commitments
            ]
        )

        system = (
            "You are PromisePocket, a warm AI personal commitment assistant. "
            "Answer the user's question accurately using ONLY the provided commitments list. "
            "Never invent promises. Keep your response concise, warm, and clear."
        )

        prompt = f"User asked: \"{query}\"\n\nSaved commitments:\n{records_summary}\n\nAnswer:"
        try:
            return await self._query_ollama(prompt, system=system)
        except Exception:
            titles = [f"'{c.get('title')}' (due {c.get('due_at', 'unspecified')})" for c in context_commitments]
            return f"You promised: {', '.join(titles)}."

    async def generate_response(self, prompt: str) -> str:
        return await self._query_ollama(prompt)
