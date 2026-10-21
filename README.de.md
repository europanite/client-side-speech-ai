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

Ein browserbasierter KI-Transkriptions-Playground mit Whisper und Transformers.js.
Keine Installation, Registrierung oder Zahlung erforderlich.

---

## 🚀 Überblick

Dieses Projekt ist eine clientseitige Web-App zur Transkription, die mit React, TypeScript und Vite erstellt wurde.
Whisper wird über `@huggingface/transformers` direkt im Browser ausgeführt, sodass Mediendateien lokal verarbeitet werden, anstatt zur Transkription auf ein Backend hochgeladen zu werden.

Die aktuelle Implementierung unterstützt die Auswahl eines Whisper-Modells in der UI, die Transkription lokaler Mediendateien, das Live-Streaming von Mikrofoneingaben, das bedarfsgesteuerte Laden des ausgewählten Modells und die Anzeige des erkannten Textes in einem schreibgeschützten Transkriptbereich.

## ✨ Funktionen

- **Clientseitige Spracherkennung**  
  Die React-App ruft die Pipeline `automatic-speech-recognition` aus `@huggingface/transformers` direkt im Browser auf, sodass die Transkription vollständig auf dem Client ausgeführt wird.

- **Einfacher Workflow in 3 Schritten**  
  Die UI führt durch folgende Schritte:
  1. Whisper-Modell laden.
  2. Modellstatus prüfen.
  3. Audio hochladen und die Transkription ausführen; für jeden Schritt werden klare Statusmeldungen angezeigt.

- **Live-Streaming-Transkription über das Mikrofon**  
  Die App kann Mikrofon-Audio direkt im Browser erfassen und kontinuierlich transkribieren, ohne das Audio auf einen Server hochzuladen.
  - Live-PCM-Audio wird mit der Web Audio API erfasst
  - Audio wird vor der Whisper-Inferenz in kurzen Zeitfenstern gepuffert
  - Die Streaming-Inferenz von Whisper läuft in einem Web Worker, damit die UI reaktionsfähig bleibt
  - Eine Live-Mikrofonpegelanzeige zeigt, ob tatsächlich Audio empfangen wird
  - `Stop microphone` beendet die Aufnahme sofort, während verbleibendes gepuffertes Audio asynchron abgeschlossen wird

- **Transkription im Browser** mit `@huggingface/transformers`
- **Auswahl mehrsprachiger Whisper-Modelle** in der UI
- Unterstützte integrierte Modelloptionen:
  - `Xenova/whisper-tiny`
  - `Xenova/whisper-base`
  - `Xenova/whisper-small`

- Clientseitige Audiodekodierung auf 16 kHz über `AudioContext`
- Stereo-zu-Mono-Mischung vor der Inferenz
- Einstellungen für segmentierte Transkription längerer Medien:
  - `chunk_length_s: 20`
  - `stride_length_s: 5`

- Akzeptierte Eingaben:
  - `stream`
  - `mp4`
  - `webm`
  - `ogg`
  - `.mp4`
  - `.webm`
  - `.ogv`
  - `.m4v`

---

## 🧱 Tech-Stack

- Frontend: React + TypeScript + Vite
- ML-Runtime: `@huggingface/transformers`
- Inferenzaufgabe: `automatic-speech-recognition`
- Audioverarbeitung im Browser: Web Audio API (`AudioContext`)
- Tests: Jest + Testing Library
- Container-Tools: Docker + Docker Compose

---


## Funktionsweise

### 1. App-Layout

`App.tsx` rendert die App-Struktur, den Titel, den Untertitel, `SettingsBar` und `HomeScreen`.

Die Einstellungsleiste zeigt derzeit die Runtime-Zusammenfassung:

- `Transformers.js + Whisper`

### 2. Modell- und Dateiauswahl

`HomeScreen.tsx` stellt eine UI in 3 Schritten bereit:

1. Modell und Mediendatei auswählen
2. Modellstatus prüfen
3. Transkriptionsergebnis lesen

Der Bildschirm enthält:

- Ein Dropdown für Whisper-Modelle
- Eine ausgeblendete Dateieingabe, die über eine Schaltfläche ausgelöst wird
- Start/Stop-Steuerung für das Mikrofon
- Eine Live-Mikrofonpegelanzeige
- Statustext und Ladeindikator während der Verarbeitung
- Ein Textfeld für das Transkript
- Eine Clear-Schaltfläche

### 3. Transkriptions-Hook

`useTranscription.ts` enthält die Kernimplementierung.

Er stellt Folgendes bereit:

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

Verhalten:

- Das ausgewählte Whisper-Modell wird beim ersten Einsatz verzögert geladen
- Die Pipeline-Instanz wird zwischengespeichert und wiederverwendet, solange dasselbe Modell ausgewählt bleibt
- Vor dem Laden des Modells werden browserfreundliche ONNX-WASM-Einstellungen angewendet
- Die ausgewählte Datei wird als `ArrayBuffer` gelesen
- Audio wird mit `AudioContext({ sampleRate: 16000 })` dekodiert
- Mehrkanal-Audio wird auf Mono heruntergemischt
- Whisper verwendet automatische Spracherkennung, da `language` absichtlich nicht gesetzt ist
- Der erkannte Text wird in den Transkript-State geschrieben

### 4. Live-Mikrofon-Streaming

Zusätzlich zu lokalen Mediendateien unterstützt die App auch Live-Mikrofoneingaben.

Wenn `Start microphone` gedrückt wird:

1. Das ausgewählte Whisper-Modell wird in einem Web Worker vorbereitet.
2. Der Browser fordert die Mikrofonberechtigung an.
3. Das Mikrofon-Audio wird über die Web Audio API als Mono-PCM erfasst.
4. PCM-Samples werden in kurzen Zeitfenstern gepuffert und zur Transkription an den Worker gesendet.
5. Erkannter Text wird dem Transkript hinzugefügt, sobald ein Zeitfenster abgeschlossen ist.

Die Live-Eingabe-UI enthält eine Mikrofonpegelanzeige auf Basis des eingehenden PCM-Signals, sodass Benutzer auch während der laufenden Transkriptionsverarbeitung bestätigen können, dass tatsächlich Audio erfasst wird.

Wenn `Stop microphone` gedrückt wird, werden Mikrofonaufnahme und Medientracks sofort gestoppt. Bereits gepuffertes Audio wird im Worker asynchron abgeschlossen, sodass die Stop-Aktion nicht auf das Ende der Whisper-Inferenz warten muss.

### 5. Statusmeldungen

Die aktuelle UI meldet benutzerseitige Zustände wie:

- idle: Modell und Datei auswählen
- loading: Das erste Laden des Modells kann langsam sein
- ready: Modell geladen und einsatzbereit
- starting-stream: Worker und Mikrofoneingabe werden vorbereitet
- streaming: Live-Mikrofonaufnahme ist aktiv
- finalizing-stream: Mikrofonaufnahme wurde beendet und gepuffertes Audio wird noch transkribiert
- transcribing: Lokale Transkription im Browser läuft
- done: Transkription abgeschlossen
- error: Fehlermeldung wird unterhalb des Statusblocks angezeigt

## Hinweise zu unterstützten Medien

Der UI-Text weist darauf hin, dass Benutzer Audio- oder Videodateien auswählen können und Whisper im Browser Sprache aus unterstützten Medien wie MP3 oder MP4 erkennen kann.

Die tatsächliche Implementierung dekodiert die ausgewählte Datei jedoch mit `AudioContext.decodeAudioData()`. In der Praxis hängt eine erfolgreiche Dekodierung von der Codec-Unterstützung des Browsers ab. Das tatsächlich unterstützte Verhalten ist daher letztlich darauf beschränkt, was der Browser des Benutzers aus der ausgewählten Mediendatei dekodieren kann.

---

## 🚀 Erste Schritte

## npm

### Voraussetzungen

- Node.js 20+ empfohlen
- npm

### Ausführen

```bash
cd frontend/app
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

Dadurch wird der Dienst auf Port `5173` gestartet.

## Test

```bash
cd frontend/app
npm ci
npm test -- --ci --runInBand --coverage --verbose
```

## docker compose

### Voraussetzungen

- [Docker Compose](https://docs.docker.com/compose/)

### Ausführen

```bash
docker compose build
docker compose up
```

Dadurch wird der Dienst auf Port `5173` gestartet.

## Test

```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

## Hinweise und Einschränkungen

- Das Modell wird im Browser geladen und kann beim ersten Einsatz etwas Zeit benötigen
- Größere Modelle benötigen mehr Arbeitsspeicher
- Die Transkriptionsgeschwindigkeit hängt von Browser und Gerät ab
- Die Unterstützung für Mediendekodierung hängt von der Codec-Unterstützung des Browsers ab
- Die Live-Mikrofontranskription hat eine kurze Verzögerung, da Audio in gepufferten Zeitfenstern verarbeitet wird
- Für Live-Streaming ist die Mikrofonberechtigung des Browsers erforderlich
- Die aktuelle App besitzt keinen Backend-Transkriptionsdienst; die Transkription erfolgt clientseitig

---

# Lizenz
- Apache License 2.0
