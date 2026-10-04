# PromisePocket — Hackathon Judge Demo Script & Walkthrough

Follow this 5-minute script to experience the full PromisePocket end-to-end journey.

---

## Step 1: Open PromisePocket Dashboard
1. Open `http://localhost:5173` in your browser.
2. Observe the warm visual design inspired by the visual reference:
   - Header with greeting: *"Good evening, Sarah!"*
   - Dynamic 7-day selector strip centered on today
   - Pre-seeded fictional family contacts (Mom, Rahul, Priya, Arjun)
   - Today's promises and coming up cards
   - Grounded AI insight banner: *"You have promises to keep tomorrow..."*

---

## Step 2: Multi-Clause Natural Language Extraction
1. Locate the **Quick Capture bar** on the dashboard.
2. Enter the prompt:
   > *"I'll call Ma tomorrow at 7 PM and return Rahul's book on Friday"*
3. Click the Send button or press Enter.
4. **Observe the AI Extraction Preview**:
   - Gemma extracts **two separate proposals**:
     - **Proposal 1**: Title *"Call Ma"*, Person: *Ma*, Time: *19:00*, Date: *Tomorrow*.
     - **Proposal 2**: Title *"Return Rahul's book"*, Person: *Rahul*, Date: *Friday*, Time: *Approximate / Unspecified*.
   - Notice that the two promises were NOT incorrectly combined into one!

---

## Step 3: Review, Edit & Confirm
1. Click the pencil icon on *"Call Ma"* to review details in the modal.
2. Click **Accept Promise** on both cards.
3. Observe the toast notification: *"Promise saved! Scheduled reminder status: scheduled"*.
4. Refresh the page: the commitments persist reliably.

---

## Step 4: Calendar Verification
1. Navigate to the **Calendar** tab (via floating bottom dock or desktop sidebar).
2. Toggle between **Month** and **Week** views.
3. Observe the colored indicator dots beneath tomorrow's date and Friday.
4. Click tomorrow's date to view the scheduled promise details in the selected-day section.

---

## Step 5: Grounded Memory Query
1. Navigate to the **Assistant** page (`/assistant`).
2. Ask:
   > *"What did I promise Rahul?"*
3. **Observe the Grounded Response**:
   - Gemma retrieves only Rahul's matching commitments from the user's database.
   - Responds accurately: *"You promised: Return Rahul's book (due ...)"*.
   - Click the citation link to jump directly to the commitment details.

---

## Step 6: Mark Complete & Temporal Synchronization
1. On the Dashboard or Promises page, click **Keep Promise** on *"Call Ma"*.
2. The card updates to "Kept", status changes to `completed`, and any pending Temporal reminder workflow is cleanly cancelled.
3. In `/notifications`, observe the delivery log and in-app alerts.

---

## Step 7: Settings & Privacy
1. Open `/settings`.
2. Inspect the live status indicators for Gemma AI, MongoDB Atlas, Temporal, and ElevenLabs.
3. Click **Export Personal Data (.json)** to verify data portability.
4. Test **Reset Demo Data** to easily reset state for repeated testing.
