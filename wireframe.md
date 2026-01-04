# 🗺️ Kaleidoscope Wireframe Documentation

This document outlines the structural layout and component hierarchy of the Kaleidoscope generative video platform.

---

## 🏗️ 1. Global Navigation (Header)
- **Position**: Sticky Top (Fixed)
- **Visuals**: Translucent glass effect (`backdrop-blur-2xl`)
- **Components**:
  - **Left**: `[Logo (Sparkles Icon)]` + `[Brand: KALEIDOSCOPE]` + `[Version Label: v2.1_PRO_CORE]`
  - **Center**: Navigation Links (Tabs)
    - `[Library]` -> Navigates to Dashboard
    - `[Studio]` -> Navigates to Editor
    - `[Settings]` -> Navigates to Configuration
  - **Right**:
    - `[Credits Badge]`: Displays `[Units Count] + [Zap Icon]`
    - `[User/API Key Trigger]`: Round button for managing production keys.

---

## 📂 2. Dashboard View (The Archive)
- **Layout**: Fluid Container (`max-w-7xl`)
- **Header Section**:
  - `[Large Title: PRODUCTION ARCHIVE]`
  - `[Action: + START NEW SEQUENCE]` (Primary Button)
- **Empty State**:
  - `[Graphic: Video Icon]` + `[Instructional Text]` + `[CTA: Enter Studio]`
- **Project Grid**:
  - `[Card Component]`:
    - `[Video Preview (Top)]`: Auto-plays on hover.
    - `[Chapter Count Badge]`: (e.g., "3 CHPT")
    - `[Content Info (Bottom)]`: Title, prompt snippet.
    - `[Metadata Row]`: Timestamp + `[Refresh Icon]` + `[Delete Icon]`

---

## 🎬 3. Editor View (The Studio)
- **Layout**: 12-Column Grid (LG View)
- **Left Sidebar (4 Columns)**:
  - `[Tab Switcher]`: `[Visual]` | `[Sonic]` | `[Cloud]`
  - **Visual Tab**:
    - `[Textarea: Narrative Script]` + `[Toggle: Search Grounding]`
    - `[Style Selector]`: Grid of preset thumbnails (Cinematic, Anime, Noir, etc.)
    - `[Camera Dynamics]`: Grid of movement buttons (Zoom, Pan, Orbital).
    - `[Keyframe Upload]`: Dashed dropzone for image-to-video reference.
  - **Sonic Tab**:
    - `[Toggle: Dialogue Mode]` (Multi-speaker support)
    - `[Textarea: Narration Script]`
    - `[Voice Selection List]`: Voice profile cards with icons.
  - **Cloud Tab**:
    - `[File Explorer]`: Tree view of backend microservices (Go/TS/Python).
    - `[Resource Monitor]`: GPU/Memory load bars.
  - **Footer Actions**:
    - `[Primary Button: INITIATE RENDER / EXTEND TIMELINE]`
- **Right Preview (8 Columns)**:
  - `[Terminal Player]`:
    - `[Video Screen]`: Large display area.
    - `[Overlay]`: Terminal logs and progress spinner during generation.
    - `[Grounding Panel]`: Fact-check sources (Top Right).
    - `[Metadata Badges]`: Resolution and total duration (Bottom Left).
  - **Timeline Area (Bottom)**:
    - `[Clip Strip]`: Scrollable row of clip thumbnails (CH_1, CH_2, etc.).
    - `[Audio Preview]`: Waveform or mini-player for generated sonic layer.
    - `[Export]`: Primary button to download final .mp4 media.

---

## ⚙️ 4. Settings View (The Control)
- **Layout**: Central Column Grid
- **Cards**:
  - **Production Tier**: Visual progress bar for credit allocation.
  - **Billing Matrix**: Subscription info and priority status.
  - **Enterprise Banner**: Gradient CTA for high-throughput API needs.
- **Footer Links**: Row of 3rd party links (Docs, API Status, Privacy).

---

## 📱 5. Mobile Considerations
- **Sidebar**: Collapses into a scrollable stack.
- **Preview**: Resizes to maintain aspect ratio, timeline shifts to bottom vertical stack.
- **Navigation**: Hidden on small screens, accessible via hamburger menu (Mobile specific).

---
*Created by Senior Frontend Lead | v2.1-prod*
