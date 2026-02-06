<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1Z6ugw1V7eT-ai1nC5B3onzou_HFy-20Y

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Hackathon Highlights

- Multimodal scan-to-teach pipeline for real homework pages.
- Parent-friendly co-teaching scripts in Hinglish + audio playback.
- Chapter mode, revision mode, and micro-lesson weakness recovery.
- New autonomous `Marathon Agent`:
  - Builds a 5-7 day learning plan from session memory and weakness trends.
  - Uses a self-critique and refinement loop before saving the plan.
  - Runs adaptive check-ins that update pending missions dynamically.
