import re
import uuid
from typing import List, Dict, Any, Optional
from app.services.ai.base import BaseAIProvider
from app.services.ai.date_resolver import DateResolver
from app.schemas.proposal import CommitmentProposal


class DeterministicMockProvider(BaseAIProvider):
    async def is_available(self) -> bool:
        return True

    async def classify_intent(self, text: str) -> str:
        text_lower = text.lower()
        if (
            "what did i" in text_lower
            or "what did you" in text_lower
            or "show me" in text_lower
            or text_lower.endswith("?")
        ):
            return "query_history"
        if "move my" in text_lower or "reschedule" in text_lower or "change" in text_lower:
            return "modify_commitment"
        return "new_commitment"

    async def extract_proposals(
        self, text: str, timezone: str = "Asia/Kolkata"
    ) -> List[CommitmentProposal]:
        # Clean text
        raw = text.strip()
        # Remove leading "I'll", "I will", "Remind me to", "Please remind me to"
        cleaned = re.sub(r"^(?:I'?ll|I will|Remind me to|Please remind me to)\s+", "", raw, flags=re.IGNORECASE)

        # Split multi-clause sentences on " and ", ",", " also "
        parts = [p.strip() for p in re.split(r"\s+and\s+|,\s*|\s+also\s+", cleaned) if p.strip()]

        proposals: List[CommitmentProposal] = []

        for part in parts:
            part_lower = part.lower()

            # Person detection (Mom, Ma, Rahul, Priya, Arjun, Dad, Grandma, etc.)
            person_match = re.search(r"\b(mom|ma|mother|dad|father|grandma|rahul|priya|arjun)\b", part_lower)
            person_name = None
            if person_match:
                name_raw = person_match.group(1)
                if name_raw in ["mom", "ma", "mother"]:
                    person_name = "Mom"
                elif name_raw in ["dad", "father"]:
                    person_name = "Dad"
                elif name_raw == "grandma":
                    person_name = "Grandma"
                else:
                    person_name = name_raw.capitalize()

            # Action / Title Extraction
            # e.g. "call Ma tomorrow at 7 PM" -> Title "Call Ma"
            # "return Rahul's book on Friday" -> Title "Return Rahul's book"
            # "buy medicine after class" -> Title "Buy medicine after class"
            title = part.strip()
            # Clean trailing time phrases from title if desired
            title_clean = re.sub(
                r"\s+(?:tomorrow|today|on\s+\w+|this\s+\w+|every\s+\w+|at\s+\d+.*|after\s+\w+).*$",
                "",
                title,
                flags=re.IGNORECASE,
            ).strip()

            if len(title_clean) > 2:
                display_title = title_clean[:1].upper() + title_clean[1:]
            else:
                display_title = title[:1].upper() + title[1:]

            # Resolve Date, Time, Precision, Recurrence, Ambiguity
            (
                p_date,
                p_time,
                precision,
                r_rule,
                is_ambig,
                ambig_note,
            ) = DateResolver.resolve_date_and_time(part, tz_name=timezone)

            # Categorize
            category = "family"
            if person_name in ["Rahul", "Priya", "Arjun"]:
                category = "friendship" if person_name == "Rahul" else "study"
            elif "medicine" in part_lower or "doctor" in part_lower:
                category = "health"
            elif "groceries" in part_lower or "buy" in part_lower or "errand" in part_lower:
                category = "errands"
            elif "meeting" in part_lower or "presentation" in part_lower or "project" in part_lower:
                category = "work"

            proposals.append(
                CommitmentProposal(
                    proposal_id=str(uuid.uuid4()),
                    title=display_title,
                    description=f"Extracted from: \"{part}\"",
                    person_name=person_name,
                    category=category,
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

        person = None
        for p in ["Rahul", "Mom", "Ma", "Priya", "Arjun"]:
            if p.lower() in query.lower():
                person = p
                break

        records_info = []
        for c in context_commitments:
            due = c.get("due_at") or "no date specified"
            records_info.append(f"\"{c.get('title')}\" (due {due})")

        if person:
            return f"Here is what you promised {person}: {', '.join(records_info)}. I can help you update or complete any of these if you need!"
        return f"Found {len(context_commitments)} matching commitments: {', '.join(records_info)}."

    async def generate_response(self, prompt: str) -> str:
        return "I am your PromisePocket assistant. I've noted that for you and will make sure you keep the promises that matter."
