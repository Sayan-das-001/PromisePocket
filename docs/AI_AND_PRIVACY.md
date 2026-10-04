# PromisePocket — AI Architecture & Privacy Policy

## 1. Open-Weight Model Philosophy
PromisePocket is designed around the core principle of personal privacy. Personal and family promises often contain intimate, sensitive commitments ("Buy Dad's heart medication", "Call therapist", "Pay landlord"). Sending these private life details to remote proprietary LLM vendors presents significant privacy concerns.

PromisePocket solves this by using **Gemma**, Google's lightweight, open-weight instruction-tuned model.

---

## 2. Local Inference Execution
- **Provider**: Ollama serving `gemma:2b` or `gemma:7b`.
- **Zero Cloud Leakage**: When configured with `AI_PROVIDER=ollama`, all commitment extraction, intent classification, and conversation memory search happen entirely on your local machine.
- **Auditable Prompts**: Prompts are strictly versioned in `app/services/ai/gemma_ollama.py`.
- **Fallback**: If the local model is offline, the application uses an in-code deterministic parsing engine without silently falling back to a proprietary cloud model.

---

## 3. Data Flow & Sanitization
1. **User Input**: Captured via text input or voice note.
2. **Audio Processing**: If voice is used, audio is transcribed on-demand only after explicit user action.
3. **Structured Proposal Extraction**: Gemma extracts actions, persons, and relative dates into a strict JSON schema.
4. **Deterministic Validation**: Application code validates date logic and IANA timezones.
5. **Confirmation Step**: Proposals are displayed to the user for review. Nothing is saved until confirmed.
6. **Multi-Tenant Memory Search**: When answering "What did I promise Rahul?", PromisePocket queries only commitments belonging to the authenticated `user_id`. Records from other users are completely inaccessible.

---

## 4. Privacy Settings & Data Sovereignty
In the **Settings & Privacy** page (`/settings`), users can:
- View the active AI provider status and model connection.
- Export all personal commitments and people as a structured JSON file.
- Delete all stored commitment data permanently with one click.
- Reset to fictional demo data.
