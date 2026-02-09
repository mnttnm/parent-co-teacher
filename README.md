<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# Parent-Co-Teacher

**Empowering parents with limited English literacy to teach their children effectively**

[Live Demo](https://ai.studio/apps/drive/1Z6ugw1V7eT-ai1nC5B3onzou_HFy-20Y) · [Demo Video](#) · [Devpost](#)

</div>

---

## The Problem

In India, **250 million+ parents** struggle to help their children with homework—not because they don't care, but because their children attend English-medium schools while they themselves have limited English literacy.

**Current reality:**
- Child brings home English homework
- Parent can't read or understand the content
- Child's learning depends on parent's language skills, not their dedication
- Educational inequity perpetuates across generations

## Our Solution

Parent-Co-Teacher transforms homework images into actionable parent-child teaching scripts in **Hinglish** (natural Hindi-English code-mixing), with AI-powered audio so parents can teach effectively regardless of their own literacy level.

### Key Features

| Feature | Description |
|---------|-------------|
| 📸 **Scan-to-Teach** | Photograph homework → Get teaching scripts instantly |
| 🗣️ **Hinglish Scripts** | Natural code-mixed language, not awkward translations |
| 🔊 **Audio Playback** | Listen and learn pronunciation before teaching |
| 📚 **Chapter Mode** | Break down textbook chapters into teachable segments |
| 🎯 **Weakness Tracking** | Identify and address learning gaps over time |
| 🏃 **Marathon Agent** | Autonomous 7-day learning plans with self-improvement |

### Marathon Agent: Autonomous Planning

Our standout feature is an autonomous learning planner that:

1. **Analyzes** session history and weakness trends
2. **Generates** a personalized 7-day learning plan
3. **Self-critiques** using quality metrics (50-100 scale)
4. **Refines** the plan before presenting to parents
5. **Adapts** missions based on completed work via check-ins

This isn't a chatbot—it's a stateful orchestration system that learns and improves.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS + Vite
- **AI**: Gemini 3 Pro (Vision + Reasoning) + Gemini 3 Flash (Generation) + Gemini TTS
- **Storage**: IndexedDB (client-side, privacy-preserving)

## Run Locally

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install

# Set your Gemini API key
echo "GEMINI_API_KEY=your_key_here" > .env.local

# Start development server
npm run dev
```

## Demo Data

Sample homework images are provided in `demo-data/`:
- `demo-data/Riya/english/` - Class 4 English chapter pages
- `demo-data/aarav/science/` - Class 8 Science content

## Hackathon Submission

**Gemini 3 API Hackathon 2025**

- **Technical Execution**: Multi-step autonomous agent with self-critique loop
- **Innovation**: Bilingual Hinglish generation + audio-first accessibility
- **Impact**: 250M+ underserved Indian families

---

<div align="center">
Built with ❤️ for parents everywhere who want to help their children learn.
</div>
