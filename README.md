# Jujutsu-Kaisen-live-Technique-

# Gojo AR Hand Tracking Project

This repository contains a Vite + React app for webcam-based hand tracking and real-time Three.js particle effects inspired by Jujutsu Kaisen techniques.

Project source lives in `technique/`.

## Tech Stack

- React
- Vite
- Three.js
- MediaPipe Hands (`@mediapipe/hands`, `@mediapipe/camera_utils`)

## Prerequisites

- Node.js 18+ (Node 20 LTS recommended)
- npm
- Webcam
- Internet connection (MediaPipe hand assets are loaded from CDN)

## Clone and Run

1. Clone the repository:
```bash
git clone <your-repo-url>
cd gojo-ar
```

2. Install dependencies:
```bash
cd technique
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Open the URL shown in terminal (usually `http://localhost:5173`).

5. Allow camera access when the browser asks for permission.

## Available Scripts

Run these inside `technique/`:

- `npm run dev`: start local dev server
- `npm run build`: production build
- `npm run preview`: preview production build locally
- `npm run lint`: run ESLint checks

## Active Interaction Instructions (Gestures)

The app reads your hand landmarks from webcam and switches visual modes.

- `Neutral`: no active gesture detected
- `Red`: left hand `index only` up
- `Blue`: right hand `index only` up
- `Both`: both hands `index only` up
- `Purple`: both hands with `index + middle` raised and close together (crossed pattern)
- `Explosion`:
  - first enter `Purple`
  - then show all 5 fingers up on both hands
- `Shrine`: any detected hand with four fingers up (index, middle, ring, pinky)
- `Void`: two hands with index fingers up and touching/very close

Notes:

- Gesture switching uses frame-based stability filtering, so hold a sign briefly.
- If hands are lost for a short time, mode resets to neutral.
- A tracking box appears bottom-right with live status:
  - mode
  - hand count
  - tracking/camera status
  - split state (`L:ON/OFF`, `R:ON/OFF`)

## Troubleshooting

- Camera not starting:
  - Check browser camera permissions.
  - Close other apps that may be using webcam.
  - Refresh and allow camera again.
- Gestures not recognized:
  - Keep hands fully visible in frame.
  - Improve lighting and reduce background clutter.
  - Move slightly farther from camera so full fingers are visible.
- Fresh machine setup issues:
  - Delete `node_modules` and reinstall:
    - `rm -rf node_modules` (macOS/Linux) or remove folder in Windows
    - `npm install`

## Project Structure

- `technique/src/components/HandTracker.jsx`: MediaPipe + gesture logic + Three.js effects
- `technique/src/App.jsx`: app shell and current technique label
- `technique/vite.config.js`: Vite config

