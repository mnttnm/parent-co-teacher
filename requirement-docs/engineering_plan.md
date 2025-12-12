
# Detailed Engineering Plan (Hackathon Focused)

## 1. System Architecture Overview
**Frontend:**  
- Next.js or React + Tailwind  
- Bottom navigation with large central Scan button  
- Local state for sessions, kid profiles  
- Cloud-based API calls for AI responses  

**Backend / Services:**  
- Gemini 2.0 (Vision + Text + TTS if needed)  
- Simple Node/Express or Firebase Functions wrapper  
- Stateless request/response design for speed  
- In-memory or lightweight storage (Firestore / JSON file)

---

## 2. Core Modules

### Module A — Vision Processing
**Input:** Homework image  
**Steps:**
1. Send to Gemini Vision → extract text  
2. Classify subject  
3. Detect question intent  
4. Return structured JSON:  
```json
{
  "subject": "English",
  "chapter": "A Pact With The Sun",
  "question": "What is the message of the story?",
  "difficulty": "medium"
}
```

**Engineering Notes:**  
- Pre-generate 2–3 sample pages for stability during demo  
- Keep a fallback if OCR fails  

---

### Module B — Guided Parent Session Generator
Given subject, chapter, and question, produce:

```json
{
  "parentContext": "This chapter explains...",
  "speakScript": "Ask Riya: 'Beta, tell me...'",
  "visualCuePrompt": "sunlight entering a room",
  "finalAnswer": "...",
  "tags": ["vocabulary", "comprehension"]
}
```

**Prompt Structure:**
- System: "You are a teaching assistant for low-literacy parents."  
- Force JSON output  
- Tone: empathetic, simple Hindi

---

### Module C — Visual Cue Generator
- Simple image generation call  
- Keep it conceptually small + recognizable  
- Cache 2–3 images for stability  

---

### Module D — Weakness Tracking Engine
**Tracking Logic:**  
- Maintain counters for:
  - vocabulary_issues  
  - message_comprehension  
  - concept_differentiation  
  - example_misclassification

**Engine Flow:**  
- On each session result → append tags  
- Render simple summary in UI  

---

### Module E — Revision Engine (Optional Tier 3)
Given subject + chapters → produce:
- MCQs  
- Vocab flashcards  
- 1 long answer  
- Audio Q&A  

Simplify by generating 5 items max.

---

## 3. UI Components (React)

### `KidSelector.tsx`
- Shows kid cards  
- Sets active context

### `ScanButton.tsx`
- Large bottom button  
- Triggers upload/camera

### `HomeworkSession.tsx`
Cards:
- Topic card  
- Parent Context  
- Speak Script  
- Visual Cue  
- Final Answer  

### `WeaknessPanel.tsx`
- Display aggregated tags

### `RevisionPage.tsx`
- Optional Tier 3 feature  

---

## 4. API Endpoints

### `POST /process-image`
Input: image → Output: structured OCR + classification

### `POST /generate-session`
Input: {
  kid_profile,
  extracted_text,
  subject,
  chapter
}  
Output: guided session JSON

### `POST /generate-visual`
Input: prompt → Output: image URL/base64

### `POST /revision`
Input: subject + chapter list → Output: quiz pack JSON (Tier 3)

---

## 5. Demo Stability Checklist
- Pre-load 1–2 known homework image samples  
- Offline fallback JSON for OCR errors  
- Cache one visual image per subject  
- Audio always optional → TTS fallback  
- Limit generative calls to 2–3 per demo to avoid lag

---

## 6. Engineering Timeline (Hackathon)
### Day 1:
- Build UI scaffold  
- Multi-kid dashboard  
- Scan input + API wiring  
- Vision → structure JSON  

### Day 2:
- Guided session generator  
- Speak Script + Parent Context cards  
- Basic weakness tracking  

### Day 3:
- Audio buttons  
- Visual cues  
- Polish transitions  
- Prepare demo flow  

(If time allows → add revision engine + radar dashboard)

---

This engineering plan is optimized for speed, safety, and a clean demo narrative.
