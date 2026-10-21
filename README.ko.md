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

Whisper와 Transformers.js로 구동되는 브라우저 기반 AI 음성 전사 플레이그라운드입니다.
설치, 가입, 결제가 필요하지 않습니다.

---

## 🚀 개요

이 프로젝트는 React, TypeScript, Vite로 구축된 클라이언트 측 음성 전사 웹 앱입니다.
`@huggingface/transformers`를 통해 브라우저에서 Whisper를 직접 실행하므로, 미디어 파일을 전사용 백엔드에 업로드하지 않고 로컬에서 처리합니다.

현재 구현은 UI에서 Whisper 모델 선택, 로컬 미디어 파일 전사, 실시간 마이크 입력 스트리밍, 선택한 모델의 온디맨드 로딩, 인식된 텍스트를 읽기 전용 전사 영역에 표시하는 기능을 지원합니다.

## ✨ 기능

- **클라이언트 측 음성-텍스트 변환**  
  React 앱은 브라우저에서 `@huggingface/transformers`의 `automatic-speech-recognition` pipeline을 직접 호출하므로 전사가 전적으로 클라이언트에서 실행됩니다.

- **간단한 3단계 워크플로**  
  UI는 다음 순서로 안내합니다:
  1. Whisper 모델 로드.
  2. 모델 상태 확인.
  3. 오디오를 업로드하고 전사를 실행하며, 각 단계마다 명확한 상태 메시지를 표시합니다.

- **실시간 마이크 스트리밍 전사**  
  앱은 브라우저에서 마이크 오디오를 직접 캡처하고 서버에 오디오를 업로드하지 않은 채 지속적으로 전사할 수 있습니다.
  - Web Audio API로 실시간 PCM 오디오 캡처
  - Whisper 추론 전에 오디오를 짧은 윈도우 단위로 버퍼링
  - UI 반응성을 유지하기 위해 스트리밍 Whisper 추론을 Web Worker에서 실행
  - 실시간 마이크 레벨 미터로 실제 오디오 수신 여부 확인
  - `Stop microphone`은 캡처를 즉시 중지하고, 남은 버퍼 오디오는 비동기적으로 마무리 처리

- `@huggingface/transformers`를 사용한 **브라우저 내 전사**
- UI에서 **다국어 Whisper 모델 선택**
- 지원되는 내장 모델 옵션:
  - `Xenova/whisper-tiny`
  - `Xenova/whisper-base`
  - `Xenova/whisper-small`

- `AudioContext`를 사용한 클라이언트 측 16 kHz 오디오 디코딩
- 추론 전 스테레오를 모노로 믹싱
- 긴 미디어를 위한 청크 단위 전사 설정:
  - `chunk_length_s: 20`
  - `stride_length_s: 5`

- 허용되는 입력:
  - `stream`
  - `mp4`
  - `webm`
  - `ogg`
  - `.mp4`
  - `.webm`
  - `.ogv`
  - `.m4v`

---

## 🧱 기술 스택

- 프런트엔드: React + TypeScript + Vite
- ML 런타임: `@huggingface/transformers`
- 추론 작업: `automatic-speech-recognition`
- 브라우저 오디오 처리: Web Audio API (`AudioContext`)
- 테스트: Jest + Testing Library
- 컨테이너 도구: Docker + Docker Compose

---


## 동작 방식

### 1. 앱 레이아웃

`App.tsx`는 앱 셸, 제목, 부제목, `SettingsBar`, `HomeScreen`을 렌더링합니다.

설정 바에는 현재 런타임 요약이 표시됩니다:

- `Transformers.js + Whisper`

### 2. 모델 및 파일 선택

`HomeScreen.tsx`는 3단계 UI를 제공합니다:

1. 모델과 미디어 파일 선택
2. 모델 상태 확인
3. 전사 결과 확인

화면에는 다음 항목이 포함됩니다:

- Whisper 모델 드롭다운
- 버튼으로 실행되는 숨겨진 파일 입력
- 마이크 Start/Stop 컨트롤
- 실시간 마이크 레벨 미터
- 처리 중 상태 텍스트와 스피너
- 전사 텍스트 영역
- Clear 버튼

### 3. 전사 Hook

`useTranscription.ts`가 핵심 구현입니다.

다음을 노출합니다:

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

동작:

- 선택한 Whisper 모델은 처음 사용할 때 지연 로딩됩니다
- 같은 모델이 계속 선택되어 있으면 pipeline 인스턴스를 캐시해 재사용합니다
- 모델을 로드하기 전에 브라우저 친화적인 ONNX WASM 설정을 적용합니다
- 선택한 파일을 `ArrayBuffer`로 읽습니다
- `AudioContext({ sampleRate: 16000 })`로 오디오를 디코딩합니다
- 다채널 오디오를 모노로 믹스다운합니다
- `language`를 의도적으로 설정하지 않았기 때문에 Whisper는 자동 언어 감지를 사용합니다
- 인식된 텍스트를 전사 state에 기록합니다

### 4. 실시간 마이크 스트리밍

이 앱은 로컬 미디어 파일뿐 아니라 실시간 마이크 입력도 지원합니다.

`Start microphone`을 누르면:

1. 선택한 Whisper 모델을 Web Worker에서 준비합니다.
2. 브라우저가 마이크 권한을 요청합니다.
3. Web Audio API를 통해 마이크 오디오를 모노 PCM으로 캡처합니다.
4. PCM 샘플을 짧은 윈도우 단위로 버퍼링한 뒤 전사를 위해 Worker로 보냅니다.
5. 각 윈도우 처리가 끝날 때마다 인식된 텍스트를 전사 결과에 추가합니다.

실시간 입력 UI에는 들어오는 PCM 신호 기반의 마이크 레벨 미터가 포함되어 있어, 전사가 아직 처리 중이더라도 실제로 오디오가 캡처되고 있는지 확인할 수 있습니다.

`Stop microphone`을 누르면 마이크 캡처와 미디어 트랙이 즉시 중지됩니다. 이미 버퍼링된 오디오는 Worker에서 비동기적으로 마무리되므로 Stop 동작이 Whisper 추론 완료를 기다릴 필요가 없습니다.

### 5. 상태 메시지

현재 UI는 다음과 같은 사용자용 상태를 표시합니다:

- idle: 모델과 파일 선택
- loading: 첫 모델 로드는 느릴 수 있습니다
- ready: 모델 로드 완료 및 사용 준비됨
- starting-stream: Worker와 마이크 입력 준비 중
- streaming: 실시간 마이크 캡처 활성화됨
- finalizing-stream: 마이크 캡처는 중지되었지만 버퍼 오디오 전사는 계속 진행 중
- transcribing: 브라우저에서 로컬 전사 실행 중
- done: 전사 완료
- error: 상태 블록 아래에 오류 메시지 표시

## 지원 미디어 관련 참고 사항

UI 텍스트에서는 사용자가 오디오 또는 비디오 파일을 선택할 수 있으며, Whisper가 브라우저에서 MP3나 MP4 같은 지원 미디어의 음성을 감지할 수 있다고 안내합니다.

하지만 실제 구현은 선택한 파일을 `AudioContext.decodeAudioData()`로 디코딩합니다. 실제 디코딩 성공 여부는 브라우저의 코덱 지원에 따라 달라집니다. 따라서 최종적으로 지원되는 동작은 사용자의 브라우저가 선택한 미디어 파일을 디코딩할 수 있는 범위로 제한됩니다.

---

## 🚀 시작하기

## npm

### 사전 요구 사항

- Node.js 20+ 권장
- npm

### 실행

```bash
cd frontend/app
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

이 명령은 포트 `5173`에서 서비스를 시작합니다.

## 테스트

```bash
cd frontend/app
npm ci
npm test -- --ci --runInBand --coverage --verbose
```

## docker compose

### 사전 요구 사항

- [Docker Compose](https://docs.docker.com/compose/)

### 실행

```bash
docker compose build
docker compose up
```

이 명령은 포트 `5173`에서 서비스를 시작합니다.

## 테스트

```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

## 참고 사항 및 제한 사항

- 모델 로딩은 브라우저에서 이루어지며 처음 사용할 때 시간이 걸릴 수 있습니다
- 더 큰 모델은 더 많은 메모리를 사용합니다
- 전사 속도는 브라우저와 디바이스에 따라 달라집니다
- 미디어 디코딩 지원 여부는 브라우저 코덱 지원에 따라 달라집니다
- 실시간 마이크 전사는 오디오를 버퍼 윈도우 단위로 처리하므로 짧은 지연이 있습니다
- 실시간 스트리밍에는 브라우저의 마이크 권한이 필요합니다
- 현재 앱에는 백엔드 전사 서비스가 없으며, 전사는 클라이언트 측에서 수행됩니다

---

# 라이선스
- Apache License 2.0
