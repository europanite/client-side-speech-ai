# [Client-Side Speech AI](https://github.com/europanite/client-side-speech-ai "Client-Side Speech AI")

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
![OS](https://img.shields.io/badge/OS-Linux%20%7C%20macOS%20%7C%20Windows-blue)
[![CI](https://github.com/europanite/client-side-speech-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/europanite/client-side-speech-ai/actions/workflows/ci.yml)
[![docker](https://github.com/europanite/client-side-speech-ai/actions/workflows/docker.yml/badge.svg)](https://github.com/europanite/client-side-speech-ai/actions/workflows/docker.yml)
[![pages](https://github.com/europanite/client-side-speech-ai/actions/workflows/pages.yml/badge.svg)](https://github.com/europanite/client-side-speech-ai/actions/workflows/pages.yml)

![React](https://img.shields.io/badge/react-%2320232a.svg?logo=react&logoColor=%2361DAFB)
![Jest](https://img.shields.io/badge/-jest-%23C21325?logo=jest&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?logo=vite&logoColor=white)

<p align="right">
  <a href="./README.md">🇺🇸 English</a> |
  <a href="./README.hi.md">🇮🇳 हिंदी</a> |
  <a href="./README.ja.md">🇯🇵 日本語</a> |
  <a href="./README.zh-CN.md">🇨🇳 简体中文</a> |
  <a href="./README.es.md">🇪🇸 Español</a> |
  <a href="./README.pt-BR.md">🇧🇷 Português (Brasil)</a> |
  <a href="./README.ko.md">🇰🇷 한국어</a> |
  <a href="./README.de.md">🇩🇪 Deutsch</a> |
  <a href="./README.fr.md">🇫🇷 Français</a>
</p>

## Demo

[![▶ Watch the 40-second demo](https://img.youtube.com/vi/pJ3IfEAxmFo/hqdefault.jpg)](https://youtu.be/pJ3IfEAxmFo)

## PlayGround

[▶ Open the app](https://europanite.github.io/client-side-speech-ai/)

Browser-based client-side speech-to-text (Whisper) and text-to-speech (Kokoro + Pocket TTS) tool.
The input media and text are processed by models in the browser; model, library and dictionary
assets are downloaded on first use. No installation, registration, or payment required.

---

## 🚀 Overview

This project is a bidirectional audio/text web app built with React, TypeScript, and Vite.
Whisper runs locally through `@huggingface/transformers` for STT.
Kokoro-82M with the `kokoro-js-jp` browser runtime supports English and Japanese TTS,
including local WAV generation, playback, and download.
Advanced TTS uses Pocket TTS for client-side English voice cloning from a short reference recording.

The interface has two modes but one shared workspace: Audio on the left, Text on the right.
STT supports media files and live microphone capture; TTS lets you edit text and generate
playable and downloadable speech. Mobile layouts stack the Audio and Text panes.

## ✨ Features

- **Client-side speech-to-text**
  The React app calls the `automatic-speech-recognition` pipeline from `@huggingface/transformers` directly in the browser, so transcription runs entirely on the client.

- **Client-side neural text-to-speech**
  Kokoro generates speech for English or Japanese, with WAV playback and file download.
  The model runs locally after assets have been downloaded; synthesis is batch-based.
  **Advanced** mode uses Pocket TTS (English, INT8/WASM) for local voice cloning.
  Record or select 5–10 seconds of your own voice (or an authorized recording),
  save reference clips locally, and export the generated WAV.

- **Unified STT/TTS workspace**
  Switch between Audio → Text and Text → Audio while keeping the Audio pane on the left
  and Text pane on the right; generated STT text is available in the TTS editor.

- **Live microphone streaming transcription**
  The app can capture microphone audio directly in the browser and transcribe it continuously without uploading audio to a server.
  - Live PCM audio is captured with the Web Audio API
  - Audio is buffered into short windows before Whisper inference
  - Streaming Whisper inference runs in a Web Worker to keep the UI responsive
  - A live microphone level meter shows whether audio is actually being received
  - `Stop microphone` stops capture immediately, while remaining buffered audio is finalized asynchronously

- **In-browser transcription** with `@huggingface/transformers`
- **Multilingual Whisper model selection** in the UI
- Supported built-in model options:
  - `Xenova/whisper-tiny`
  - `Xenova/whisper-base`
  - `Xenova/whisper-small`

- Client-side audio decoding to 16 kHz via `AudioContext`
- Stereo-to-mono mixing before inference
- Chunked transcription settings for longer media:
  - `chunk_length_s: 20`
  - `stride_length_s: 5`

- Input accepts:
  - `stream`
  - `mp4`
  - `webm`
  - `ogg`
  - `.mp4`
  - `.webm`
  - `.ogv`
  - `.m4v`

---

## 🧱 Tech stack

- Frontend: React + TypeScript + Vite
- ML runtime: `@huggingface/transformers` (STT), Kokoro-82M / `kokoro-js-jp` (Standard TTS), `pocket-tts-js` (Advanced TTS)
- Inference tasks: `automatic-speech-recognition` and `text-to-speech`
- Browser audio handling: Web Audio API (`AudioContext`)
- Testing: Jest + Testing Library
- Container tooling: Docker + Docker Compose

---


## How it works

### 1. App layout

`App.tsx` renders the app shell, title, subtitle, `SettingsBar`, and `HomeScreen`.

The settings bar currently displays the runtime summary:

- `Whisper STT + Kokoro / Pocket TTS`

### 2. Model and file selection

`HomeScreen.tsx` provides a two-pane UI with a STT/TTS direction selector,
mode-specific voice/model settings, and a shared status component.

The screen includes:

- A Whisper model dropdown
- A hidden file input triggered by a button
- Start/Stop microphone controls
- A live microphone level meter
- Status text and spinner while processing
- A transcript textarea
- A Clear button

### 3. Transcription hook

`useTranscription.ts` is the core implementation.

It exposes:

- `status`
- `error`
- `transcript`
- `availableModels`
- `selectedModelId`
- `setSelectedModelId(modelId)`
- `transcribeFile(file)`
- `startStream(stream)`
- `startMicrophone()`
- `stopStream()`
- `audioLevel`
- `reset()`

Behavior:

- The selected Whisper model is loaded lazily on first use
- The pipeline instance is cached and reused if the same model remains selected
- Browser-friendly ONNX WASM settings are applied before model loading
- The selected file is read as an `ArrayBuffer`
- Audio is decoded with `AudioContext({ sampleRate: 16000 })`
- Multi-channel audio is mixed down to mono
- Whisper runs with automatic language detection because `language` is intentionally left unset
- The recognized text is written to the transcript state

### 4. Live microphone streaming

The app also supports live microphone input in addition to local media files.

When `Start microphone` is pressed:

1. The selected Whisper model is prepared in a Web Worker.
2. The browser requests microphone permission.
3. Microphone audio is captured as mono PCM through the Web Audio API.
4. PCM samples are buffered into short windows and sent to the Worker for transcription.
5. Recognized text is appended to the transcript as each window finishes.

The live input UI includes a microphone level meter based on the incoming PCM signal, so users can confirm that audio is actually being captured even while transcription is still processing.

When `Stop microphone` is pressed, microphone capture and the media tracks are stopped immediately. Any audio that was already buffered is finalized asynchronously in the Worker so the Stop action does not need to wait for Whisper inference to finish.

### 5. Status messages

The current UI reports user-facing states such as:

- idle: choose a model and a file
- loading: first model load may be slow
- ready: model loaded and ready
- starting-stream: preparing the Worker and microphone input
- streaming: live microphone capture is active
- finalizing-stream: microphone capture has stopped and buffered audio is still being transcribed
- transcribing: local browser transcription is running
- done: transcription finished
- error: failure message shown below the status block

## Supported media notes

The UI text says users can select audio or video files and that Whisper can detect speech from supported media such as MP3 or MP4 in the browser.

However, the actual implementation decodes the selected file using `AudioContext.decodeAudioData()`. In practice, successful decoding depends on browser codec support. That means supported behavior is ultimately constrained by what the user’s browser can decode from the selected media file.

---

## 🚀 Getting Started

## npm

### Prerequisites

- Node.js 20+ recommended
- npm

### Run

```bash
cd frontend/app
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

This starts the service on port `5173`.

## Test

```bash
cd frontend/app
npm ci
npm test -- --ci --runInBand --coverage --verbose
```

## docker compose

### Prerequisites

- [Docker Compose](https://docs.docker.com/compose/)

### Run the application

```bash
docker compose up --build
```

Open `http://localhost:5173/client-side-speech-ai/` in your browser.
The Compose service serves Vite on the host loopback interface; inference and
microphone capture still run in the browser. Stop it with `docker compose down`.

If `package-lock.json` changes and the named dependency volume is out of date,
refresh it using `docker compose run --rm frontend npm ci`.

### Type check, tests and production build

```bash
docker compose -f docker-compose.test.yml run --build --rm frontend_test \
  sh -lc 'npm ci && npx tsc --noEmit && npm test -- --ci --runInBand && npm run build:demo'
```

To run just the existing test service (with coverage and JSON reports):

```bash
docker compose -f docker-compose.test.yml up --build \
  --abort-on-container-exit --exit-code-from frontend_test
```

## Notes and limitations

- Model loading happens in the browser and may take time on first use
- Larger models use more memory
- Transcription speed depends on the browser and device
- Media decoding support depends on browser codec support
- Live microphone transcription has a short delay because audio is processed in buffered windows
- Browser microphone permission is required for live streaming

---

# License
- Apache License 2.0