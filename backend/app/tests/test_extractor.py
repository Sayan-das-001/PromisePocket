import pytest
from app.services.ai.extractor import ai_service
from app.services.ai.mock_provider import DeterministicMockProvider


@pytest.mark.asyncio
async def test_multi_clause_extraction():
    text = "I'll call Ma tomorrow at 7 PM and return Rahul's book on Friday"
    proposals, intent = await ai_service.extract(text, timezone="Asia/Kolkata")

    assert intent == "new_commitment"
    assert len(proposals) == 2

    prop1 = proposals[0]
    assert "Call Ma" in prop1.title or "Ma" in (prop1.person_name or "")
    assert prop1.proposed_time == "19:00"

    prop2 = proposals[1]
    assert "Rahul" in prop2.title or prop2.person_name == "Rahul"


@pytest.mark.asyncio
async def test_intent_classification():
    provider = DeterministicMockProvider()

    intent_new = await provider.classify_intent("I'll call Priya tomorrow")
    assert intent_new == "new_commitment"

    intent_query = await provider.classify_intent("What did I promise Rahul?")
    assert intent_query == "query_history"

    intent_mod = await provider.classify_intent("Move my call with Ma to tomorrow at 7 PM")
    assert intent_mod == "modify_commitment"


@pytest.mark.asyncio
async def test_grounded_answer():
    provider = DeterministicMockProvider()
    context = [
        {
            "id": "1",
            "title": "Return Rahul's book",
            "person_name_snapshot": "Rahul",
            "due_at": "2026-10-09T17:00:00",
            "status": "pending",
        }
    ]

    answer = await provider.answer_commitment_query("What did I promise Rahul?", context)
    assert "Return Rahul's book" in answer
