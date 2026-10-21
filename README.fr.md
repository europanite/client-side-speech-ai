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

[![▶ Watch the 40-second demo](https://img.youtube.com/vi/I6X9HJDjatY/hqdefault.jpg)](https://youtu.be/I6X9HJDjatY)

## PlayGround

[▶ Open the app](https://europanite.github.io/client-side-speech-ai/)

Un environnement de démonstration de transcription IA dans le navigateur, propulsé par Whisper et Transformers.js.
Aucune installation, inscription ni aucun paiement requis.

---

## 🚀 Présentation

Ce projet est une application web de transcription côté client construite avec React, TypeScript et Vite.
Il exécute Whisper directement dans le navigateur via `@huggingface/transformers`, de sorte que les fichiers multimédias sont traités localement au lieu d’être envoyés vers un backend pour transcription.

L’implémentation actuelle permet de sélectionner un modèle Whisper dans l’UI, de transcrire des fichiers multimédias locaux, de diffuser en direct l’entrée du microphone, de charger le modèle sélectionné à la demande et d’afficher le texte reconnu dans une zone de transcription en lecture seule.

## ✨ Fonctionnalités

- **Reconnaissance vocale côté client**  
  L’application React appelle directement dans le navigateur le pipeline `automatic-speech-recognition` de `@huggingface/transformers`, de sorte que la transcription s’exécute entièrement côté client.

- **Workflow simple en 3 étapes**  
  L’UI vous guide à travers les étapes suivantes :
  1. Charger le modèle Whisper.
  2. Vérifier l’état du modèle.
  3. Importer l’audio et lancer la transcription, avec des messages d’état clairs à chaque étape.

- **Transcription en streaming du microphone en direct**  
  L’application peut capturer l’audio du microphone directement dans le navigateur et le transcrire en continu sans envoyer l’audio vers un serveur.
  - L’audio PCM en direct est capturé avec la Web Audio API
  - L’audio est mis en mémoire tampon par courtes fenêtres avant l’inférence Whisper
  - L’inférence Whisper en streaming s’exécute dans un Web Worker afin de garder l’UI réactive
  - Un indicateur de niveau du microphone en direct montre si de l’audio est réellement reçu
  - `Stop microphone` arrête immédiatement la capture, tandis que l’audio restant en mémoire tampon est finalisé de façon asynchrone

- **Transcription dans le navigateur** avec `@huggingface/transformers`
- **Sélection de modèles Whisper multilingues** dans l’UI
- Options de modèles intégrés prises en charge :
  - `Xenova/whisper-tiny`
  - `Xenova/whisper-base`
  - `Xenova/whisper-small`

- Décodage audio côté client en 16 kHz via `AudioContext`
- Mixage stéréo vers mono avant l’inférence
- Paramètres de transcription par segments pour les médias plus longs :
  - `chunk_length_s: 20`
  - `stride_length_s: 5`

- Entrées acceptées :
  - `stream`
  - `mp4`
  - `webm`
  - `ogg`
  - `.mp4`
  - `.webm`
  - `.ogv`
  - `.m4v`

---

## 🧱 Stack technique

- Frontend : React + TypeScript + Vite
- Runtime ML : `@huggingface/transformers`
- Tâche d’inférence : `automatic-speech-recognition`
- Gestion audio dans le navigateur : Web Audio API (`AudioContext`)
- Tests : Jest + Testing Library
- Outils de conteneurisation : Docker + Docker Compose

---


## Fonctionnement

### 1. Mise en page de l’application

`App.tsx` affiche la structure de l’application, le titre, le sous-titre, `SettingsBar` et `HomeScreen`.

La barre de paramètres affiche actuellement un résumé du runtime :

- `Transformers.js + Whisper`

### 2. Sélection du modèle et du fichier

`HomeScreen.tsx` fournit une UI en 3 étapes :

1. Choisir un modèle et un fichier multimédia
2. Vérifier l’état du modèle
3. Lire le résultat de la transcription

L’écran comprend :

- Une liste déroulante de modèles Whisper
- Un champ de fichier masqué déclenché par un bouton
- Des contrôles Start/Stop pour le microphone
- Un indicateur de niveau du microphone en direct
- Un texte d’état et un indicateur de chargement pendant le traitement
- Une zone de texte pour la transcription
- Un bouton Clear

### 3. Hook de transcription

`useTranscription.ts` constitue l’implémentation principale.

Il expose :

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

Comportement :

- Le modèle Whisper sélectionné est chargé de manière différée lors de la première utilisation
- L’instance du pipeline est mise en cache et réutilisée si le même modèle reste sélectionné
- Des paramètres ONNX WASM adaptés au navigateur sont appliqués avant le chargement du modèle
- Le fichier sélectionné est lu sous forme d’`ArrayBuffer`
- L’audio est décodé avec `AudioContext({ sampleRate: 16000 })`
- L’audio multicanal est mixé en mono
- Whisper s’exécute avec détection automatique de la langue, car `language` est volontairement laissé non défini
- Le texte reconnu est écrit dans l’état de la transcription

### 4. Streaming du microphone en direct

L’application prend également en charge l’entrée du microphone en direct en plus des fichiers multimédias locaux.

Lorsque `Start microphone` est activé :

1. Le modèle Whisper sélectionné est préparé dans un Web Worker.
2. Le navigateur demande l’autorisation d’utiliser le microphone.
3. L’audio du microphone est capturé en PCM mono via la Web Audio API.
4. Les échantillons PCM sont mis en mémoire tampon par courtes fenêtres puis envoyés au Worker pour transcription.
5. Le texte reconnu est ajouté à la transcription à mesure que chaque fenêtre se termine.

L’UI d’entrée en direct comprend un indicateur de niveau du microphone basé sur le signal PCM entrant, ce qui permet aux utilisateurs de confirmer que l’audio est bien capturé même pendant que la transcription est encore en cours de traitement.

Lorsque `Stop microphone` est activé, la capture du microphone et les pistes multimédias sont arrêtées immédiatement. Tout audio déjà mis en mémoire tampon est finalisé de manière asynchrone dans le Worker, de sorte que l’action Stop n’a pas besoin d’attendre la fin de l’inférence Whisper.

### 5. Messages d’état

L’UI actuelle affiche notamment les états destinés à l’utilisateur suivants :

- idle: choisir un modèle et un fichier
- loading: le premier chargement du modèle peut être lent
- ready: modèle chargé et prêt
- starting-stream: préparation du Worker et de l’entrée du microphone
- streaming: la capture du microphone en direct est active
- finalizing-stream: la capture du microphone est arrêtée et l’audio en mémoire tampon est encore en cours de transcription
- transcribing: la transcription locale dans le navigateur est en cours
- done: transcription terminée
- error: un message d’échec est affiché sous le bloc d’état

## Remarques sur les médias pris en charge

Le texte de l’UI indique que les utilisateurs peuvent sélectionner des fichiers audio ou vidéo et que Whisper peut détecter la parole dans le navigateur à partir de médias pris en charge tels que MP3 ou MP4.

Cependant, l’implémentation réelle décode le fichier sélectionné avec `AudioContext.decodeAudioData()`. En pratique, la réussite du décodage dépend des codecs pris en charge par le navigateur. Le comportement effectivement pris en charge est donc limité à ce que le navigateur de l’utilisateur peut décoder à partir du fichier multimédia sélectionné.

---

## 🚀 Bien démarrer

## npm

### Prérequis

- Node.js 20+ recommandé
- npm

### Exécuter

```bash
cd frontend/app
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

Cela démarre le service sur le port `5173`.

## Tests

```bash
cd frontend/app
npm ci
npm test -- --ci --runInBand --coverage --verbose
```

## docker compose

### Prérequis

- [Docker Compose](https://docs.docker.com/compose/)

### Exécuter

```bash
docker compose build
docker compose up
```

Cela démarre le service sur le port `5173`.

## Tests

```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

## Remarques et limitations

- Le chargement du modèle s’effectue dans le navigateur et peut prendre du temps lors de la première utilisation
- Les modèles plus volumineux utilisent davantage de mémoire
- La vitesse de transcription dépend du navigateur et de l’appareil
- La prise en charge du décodage multimédia dépend des codecs disponibles dans le navigateur
- La transcription du microphone en direct présente un léger délai car l’audio est traité par fenêtres mises en mémoire tampon
- L’autorisation du navigateur d’utiliser le microphone est requise pour le streaming en direct
- L’application actuelle ne dispose d’aucun service backend de transcription ; la transcription est effectuée côté client

---

# Licence
- Apache License 2.0
