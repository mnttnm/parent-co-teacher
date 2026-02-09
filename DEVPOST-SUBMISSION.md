# Devpost Submission: Parent-Co-Teacher

## Inspiration

This project started from a real need at home.

My sister is a very hardworking mother with two daughters (Class 6 and Class 10). She regularly sits with them for homework and revision, but because English is not her strongest language, she often cannot confidently explain the concepts even when she is putting in the time.

So the effort is there, but the learning support is inconsistent.  
That gap inspired ParentGuide: a co-teacher app that helps parents teach correctly and confidently, in language they naturally use.

The first target is Indian households, but this problem is global wherever school language differs from parents’ everyday language.

---

## What it does

Parent-Co-Teacher transforms homework images into **actionable teaching scripts in Hinglish** (natural Hindi-English code-mixing) with audio guidance, so parents can teach effectively even if they can't read English.

**Core Features:**

1. **Scan-to-Teach Pipeline**: Parents photograph homework. Gemini Vision analyzes the content—detecting subject, chapter, difficulty, and whether it's textbook content or homework questions.

2. **Bilingual Teaching Scripts**: Instead of translations (which sound unnatural), we generate Hinglish scripts—the way Indians actually speak. Parents get:
   - Context to understand the topic themselves
   - Exact words to say to their child
   - Vocabulary help with pronunciation guides

3. **Audio-First Accessibility**: Every script can be played aloud via Gemini TTS. Parents listen, learn pronunciation, and repeat to their children. No reading required.

4. **Marathon Agent**: An autonomous 7-day learning planner that:
   - Analyzes session history and weakness trends
   - Generates personalized learning missions
   - Self-critiques using quality metrics (scores improve from draft to final!)
   - Adapts missions based on completed work through check-ins

5. **Weakness Tracking**: Every session feeds into personalized recommendations. Vocabulary struggles? The app knows and offers targeted micro-lessons.

---

## How we built it

**Tech Stack:**
- **Frontend**: React 19 + TypeScript + Tailwind CSS + Vite
- **AI**: Gemini 3 Pro (Vision + Reasoning), Gemini 3 Flash (Generation), Gemini TTS
- **Storage**: IndexedDB (client-side, privacy-preserving)

**Gemini Integration Architecture:**

We don't just wrap prompts—we orchestrate **6+ coordinated Gemini API calls per session**:

1. **Vision Analysis** (Gemini 3 Pro): Multimodal analysis extracts subject, chapter, difficulty, and content type from homework images.

2. **Content Generation** (Gemini 3 Pro): Generates bilingual teaching scripts with strict Hinglish language rules—not literal translation, but natural code-mixed speech.

3. **Marathon Agent** (Gemini 3 Pro with two-pass refinement):
   - Pass 1: Generate draft 7-day learning plan
   - Pass 2: Self-critique against quality metrics (mission count, weakness targeting, time estimates, evidence capture)
   - Result: Quality scores visibly improve from initial to final

4. **Adaptive Check-ins** (Gemini 3 Pro): Reviews completed missions and adjusts pending ones based on progress.

5. **Audio Synthesis** (Gemini TTS): Converts all teaching scripts to natural speech with proper Hinglish pronunciation.

**Stateful Architecture:**
- IndexedDB persistence across sessions
- Weakness trend tracking over time
- Session history feeds into Marathon Agent planning
- Mission status tracking with adaptive updates

---

## Challenges we ran into

1. **Hinglish is NOT Translation**: Early versions used Hindi translations that sounded robotic and unnatural. Real Hinglish is code-mixed—"Riya ko bolo story ka main character kaun hai" not "रिया को कहो कहानी का मुख्य पात्र कौन है।" We spent significant effort crafting prompts that generate natural speech patterns.

2. **Content Type Detection**: Distinguishing textbook chapters from homework questions required careful vision prompt engineering. The same image might need chapter-breakdown mode OR question-answering mode—wrong detection ruins the experience.

3. **Self-Critique Quality**: Getting the Marathon Agent to genuinely improve its plans (not just claim higher scores) required a detailed verification checklist. We had to make the critique concrete: "Does each mission have evidence capture? Are time estimates realistic?"

4. **Audio Latency**: TTS generation can be slow. We implemented streaming playback and visual feedback so parents know audio is loading rather than broken.

5. **Mobile-First Constraints**: Our target users are on budget smartphones with inconsistent internet. We built comprehensive fallbacks—the app works even when API calls fail, using cached or mock data.

---

## Accomplishments that we're proud of

1. **The Self-Critique Loop Actually Works**: Watch the Marathon Agent's quality score improve from 85 to 100 as it refines its own plan. This isn't theater—the verification checklist enforces real improvements.

2. **Natural Hinglish Generation**: When you play the audio, it sounds like a real Indian teacher speaking to a child. Not translated, not robotic—natural code-mixed speech.

3. **Complete Offline Resilience**: Every feature has a fallback. API failures don't break the app—they gracefully degrade to cached content.

4. **Parent-First UX**: The entire interface assumes the user might not read English well. Audio buttons are prominent. Visual cues guide actions. Minimal text, maximum clarity.

5. **Evidence-Based Learning**: The Marathon Agent doesn't just assign tasks—it requests photo evidence of completed work, creating accountability and trackable progress.

---

## What we learned

1. **Accessibility Drives Innovation**: Designing for parents who can't read English forced us to build better UX for everyone. Audio-first, visual-guided interfaces work better than text-heavy alternatives.

2. **Self-Critique Requires Structure**: Asking an LLM to "improve this" doesn't work. Providing a concrete verification checklist with specific criteria produces measurable improvements.

3. **Stateful AI > Stateless Prompts**: The power of our Marathon Agent comes from memory—session history, weakness trends, mission progress. Single-prompt chatbots can't achieve this.

4. **Code-Mixed Language is Hard**: Hinglish isn't Hindi or English—it's a dynamic blend that varies by region and context. We learned to specify "natural Mumbai Hinglish" for consistent, authentic output.

5. **Real Users Ground Truth**: Every design decision traces back to "Would Sunita understand this?" This persona-driven development kept us focused on actual impact over technical elegance.

---

## What's next for Parent-Co-Teacher

1. **Voice Input**: Let parents ask questions by speaking instead of typing. "Yeh question ka answer kya hai?" triggers voice-to-text and generates a response.

2. **Regional Language Expansion**: Start with Tamil-English, Telugu-English, and Marathi-English code-mixing for South and West India.

3. **Teacher Dashboard**: Let teachers assign homework through the app and track which parents engaged with it—bridging the school-home gap.

4. **WhatsApp Integration**: Most Indian parents live on WhatsApp. A bot that accepts homework photos and returns audio guidance would dramatically increase accessibility.

5. **Community Curriculum**: Let successful parents share their Marathon Agent plans with others facing similar challenges. Crowdsourced, proven learning paths.

6. **Offline Mode**: Full offline functionality for areas with unreliable internet. Pre-download curriculum content and sync when connected.

---

## Try It

- **Live Demo**: https://ai.studio/apps/drive/1Z6ugw1V7eT-ai1nC5B3onzou_HFy-20Y
- **GitHub**: [Repository Link]
- **Demo Video**: [Video Link]

---

*Every parent deserves to be their child's first teacher. Parent-Co-Teacher makes that possible—in any language, at any literacy level.*
