<div align="center">
<img width="1200" height="475" alt="Kaleidoscope Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# 🎞️ KALEIDOSCOPE
**High-Fidelity Generative Video Production Suite**

[![Project Status: Active](https://img.shields.io/badge/Project%20Status-Active-brightgreen.svg)](https://ai.studio/apps/drive/1fL-Gka3cQ8pM_U2-RqNZK01WBKkY1oZP)
[![Tech: React 19](https://img.shields.io/badge/Tech-React%2019-blue.svg)](https://react.dev/)
[![AI: Gemini Veo 3.1](https://img.shields.io/badge/AI-Gemini%20Veo%203.1-orange.svg)](https://ai.google.dev/)

</div>

---

## 🎬 Overview
Kaleidoscope is a professional-grade generative video platform designed for creators, marketers, and storytellers. It leverages cutting-edge **Gemini Veo** models to transform text prompts and image references into cinematic, high-fidelity video clips.

## ✨ Key Features
- **Cinematic Rendering (Veo 3.1):** High-speed 720p/1080p generation with advanced frame consistency.
- **Image-to-Video Synthesis:** Guide the composition and visual identity using reference assets.
- **Sonic Layering:** Integrated **Gemini 2.5 Flash TTS** for multi-speaker narrations and scripts.
- **Aesthetic Presets:** One-click styles ranging from *Cyberpunk* to *Film Noir*.
- **Production Archive:** Persistent project library to remix, track credits, and export assets.

## 🛠️ Run Locally

This project is built as a modern SPA. Follow these steps to set up your local studio environment.

### Prerequisites
- **Node.js** (LTS recommended)
- **API Key:** A valid Gemini API key from a paid GCP project (required for Veo video features).

### Installation
1. **Clone and Install:**
   ```bash
   npm install
   ```
2. **Configure Environment:**
   Create a `.env.local` file in the root directory and add your key:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```
3. **Launch Studio:**
   ```bash
   npm run dev
   ```

## 🏗️ Technical Architecture
- **Framework:** React 19 + TypeScript
- **Styling:** Tailwind CSS (Custom Dark-Mode UI)
- **State Management:** React Context + Hooks
- **AI Integration:** `@google/genai` (Native Audio & Video Operations)
- **Service Layer:** `GeminiService.ts` handles complex polling and PCM-to-WAV conversion.

## 🔗 Project Context
View and edit this project directly in **AI Studio**:
[Launch Kaleidoscope in AI Studio](https://ai.studio/apps/drive/1fL-Gka3cQ8pM_U2-RqNZK01WBKkY1oZP)

---
<div align="center">
Built for the future of generative media.
</div>