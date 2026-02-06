# ✅ Completed User Stories: ParentGuide (Co-Teacher)

This document outlines the user stories currently implemented and fully functional in the **ParentGuide** prototype. These stories focus on empowering parents with limited education to become confident co-teachers.

---

## 1. Persona: The Multi-Child Parent
**"As a parent with children in different grades, I want to switch contexts instantly so that I can help each child with their specific level of study."**

*   **Status:** ✅ Working
*   **Feature:** Compact Child-Switcher Popover.
*   **Behavior:** Tapping the child's name in the header opens a popover to switch between Riya (Class 4) and Aarav (Class 8).
*   **Impact:** The entire app context (Subject, Grade, History, and AI prompts) updates immediately to match the selected child.

---

## 2. Persona: The Tech-Wary Parent
**"As a parent who isn't comfortable with typing or complex menus, I want a simple way to start helping so that I don't feel overwhelmed by the app."**

*   **Status:** ✅ Working
*   **Feature:** Floating "Scan" FAB & Hinglish Welcome.
*   **Behavior:** A prominent amber camera button is always accessible. The home screen uses warm, encouraging copy: *"Hi Parent! Riya ka lesson scan kijiye."*
*   **Impact:** Zero-learning curve. The primary action is unmistakable and friendly.

---

## 3. Persona: The Non-English Speaker
**"As a parent whose child studies in an English-medium school, I want to understand the textbook in Hinglish so that I can explain the concepts in a language we both speak at home."**

*   **Status:** ✅ Working
*   **Feature:** Bilingual Guided Sessions (Hinglish/English).
*   **Behavior:** AI analyzes scanned content and provides "Parent Context" in Hinglish (Hindi in English script).
*   **Impact:** Bridges the language gap, allowing the parent to understand complex English chapters instantly.

---

## 4. Persona: The "Unsure" Teacher
**"As a parent who wants to help but doesn't know 'how' to teach, I want a script of exactly what to say so that I feel like a real teacher."**

*   **Status:** ✅ Working
*   **Feature:** "Speak to Child" Scripts.
*   **Behavior:** Every teaching chunk includes a "🗣️ Say to [Name]" section with a specific script.
*   **Impact:** Removes the anxiety of "What do I say next?" by providing a ready-to-use dialogue.

---

## 5. Persona: The Busy Parent (Accessibility)
**"As a parent who might be multitasking or finds reading long texts difficult, I want to hear the explanations out loud so that I can learn while I listen."**

*   **Status:** ✅ Working
*   **Feature:** Integrated AI Audio Player (TTS).
*   **Behavior:** Every explanation, book text, and script has a "Listen" button that plays high-quality AI speech.
*   **Impact:** Complete accessibility for parents with lower literacy levels.

---

## 6. Persona: The Homework Helper
**"As a parent assisting with exercises, I want to know the answers and how to explain the 'why' so that I don't just give the child the answer."**

*   **Status:** ✅ Working
*   **Feature:** Homework Mode with Answer Hints.
*   **Behavior:** AI extracts specific questions from the scan and provides the parent with the answer plus a simplified "Hinglish" explanation of the logic.
*   **Impact:** Moves the parent from "Answer-giver" to "Guide."

---

## 7. Persona: The Visual Learner
**"As a parent, I want to show my child a picture that explains the concept so that we can both understand it visually."**

*   **Status:** ✅ Working
*   **Feature:** AI Visual Cues.
*   **Behavior:** The app generates a relevant, simple educational illustration based on the lesson's core concept.
*   **Impact:** Enhances child engagement and simplifies abstract concepts (like "Sun rays" or "Molecules").

---

## 8. Persona: The Progress Tracker
**"As a parent, I want to keep track of what my child found difficult today so that I can share it with their teacher or father on WhatsApp."**

*   **Status:** ✅ Working
*   **Feature:** Analytics Dashboard & WhatsApp Share.
*   **Behavior:** The dashboard tracks "Weakness Tags" (Hard Words, Focus, Concepts) and provides a "Share Update" button for WhatsApp.
*   **Impact:** Creates a data-driven loop of improvement and involves the wider family in the child's progress.

---

## 9. Persona: The Exam Preparer
**"As a parent preparing for a test, I want to quickly quiz my child on what we learned last week so that I know they haven't forgotten."**

*   **Status:** ✅ Working
*   **Feature:** Revision Quiz Mode.
*   **Behavior:** From the dashboard, parents can launch an AI-generated quiz (MCQs and Flashcards) based on previous study sessions.
*   **Impact:** Provides professional-grade revision tools to parents who wouldn't know how to create a mock test themselves.

---

## 10. Persona: The "Fast Fix" Parent
**"As a parent who identified a specific struggle (like hard words), I want a quick way to solve it so that my child doesn't get stuck for hours."**

*   **Status:** ✅ Working
*   **Feature:** 5-Minute Micro-Lessons.
*   **Behavior:** If a weakness is detected, the app offers a "⚡ Fast Fix" lesson—a 3-step targeted teaching guide.
*   **Impact:** Provides immediate, actionable interventions for specific learning hurdles.
