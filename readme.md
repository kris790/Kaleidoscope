# 🎞️ Kaleidoscope

Kaleidoscope is a professional-grade generative video platform designed for creators, marketers, and storytellers. It leverages the cutting-edge **Gemini Veo** models to transform text prompts and image references into high-fidelity video clips.

## ✨ Features

- **Text-to-Video (Veo 3.1):** Generate cinematic 720p/1080p video clips from natural language descriptions.
- **Image-to-Video:** Use a starting frame to guide the visual consistency and composition of generated videos.
- **Negative Prompts:** Fine-tuned control over what *not* to include in your shots (e.g., "no blur," "no text").
- **Voiceover & SFX (TTS):** Integrated multi-speaker text-to-speech engine to generate narrations for your projects.
- **Cinematic Style Presets:** One-click application of styles like *Cyberpunk*, *Film Noir*, *Claymation*, and more.
- **Project Library:** A persistent dashboard to manage, remix, and export your previous creations.
- **Tier-Based Workflow:** Support for Free, Plus, and Pro tiers with varying duration and resolution limits.

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript
- **Styling:** Tailwind CSS (Modern, dark-themed UI)
- **Icons:** Lucide React
- **AI Engine:** `@google/genai` (Google Gemini API)
  - `veo-3.1-fast-generate-preview` for high-speed video generation.
  - `gemini-2.5-flash-preview-tts` for high-quality audio synthesis.
- **Environment:** Seamless integration with **AI Studio** for secure API key management and billing.

## 🏗️ Architecture

The application is structured as a robust single-page application (SPA):

- **`/services/geminiService.ts`**: Handles all direct communication with the Gemini API, including polling for long-running video generation operations and PCM-to-WAV audio conversion.
- **`/components`**: Reusable UI components including the `ApiKeyPrompt` for session management and `StyleGrid` for visual selection.
- **`App.tsx`**: The central state orchestrator managing project metadata, credit tracking, and view routing.

## 🚀 Getting Started

### Prerequisites
Kaleidoscope is designed to run within an environment that supports the `window.aistudio` interface for secure API key selection.

### Usage
1. **Select API Key:** Upon launch, use the prompt to select a professional API key from a paid GCP project.
2. **Describe Your Scene:** Enter a visual prompt in the Studio Controls.
3. **Refine with Styles:** Choose a preset to apply specific aesthetic modifiers.
4. **Generate:** Click "Generate Video Clip" and watch the rendering progress in real-time.
5. **Add Audio:** Use the Audio tab to generate a synchronized voiceover or sound effect track.

---

*Built with passion for the future of generative media.*