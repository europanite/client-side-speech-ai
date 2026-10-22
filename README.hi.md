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

[![▶ Watch the 40-second demo](https://img.youtube.com/vi/ncDdPy05U9c/hqdefault.jpg)](https://youtu.be/ncDdPy05U9c)

## PlayGround

[▶ Open the app](https://europanite.github.io/client-side-speech-ai/)

Whisper और Transformers.js पर आधारित ब्राउज़र-आधारित AI ट्रांसक्रिप्शन प्लेग्राउंड।
इंस्टॉलेशन, रजिस्ट्रेशन या भुगतान की आवश्यकता नहीं है।

---

## 🚀 अवलोकन

यह प्रोजेक्ट React, TypeScript और Vite से बना एक client-side ट्रांसक्रिप्शन वेब ऐप है।
यह `@huggingface/transformers` के माध्यम से Whisper को सीधे ब्राउज़र में चलाता है, इसलिए मीडिया फ़ाइलें ट्रांसक्रिप्शन के लिए backend पर अपलोड होने के बजाय स्थानीय रूप से प्रोसेस होती हैं।

वर्तमान implementation UI में Whisper मॉडल चुनने, स्थानीय मीडिया फ़ाइलों को ट्रांसक्राइब करने, लाइव माइक्रोफ़ोन इनपुट स्ट्रीम करने, चुने गए मॉडल को आवश्यकता पर लोड करने और पहचाने गए टेक्स्ट को read-only ट्रांसक्रिप्ट क्षेत्र में दिखाने का समर्थन करता है।

## ✨ विशेषताएँ

- **Client-side speech-to-text**  
  React ऐप ब्राउज़र में सीधे `@huggingface/transformers` की `automatic-speech-recognition` pipeline को कॉल करता है, इसलिए ट्रांसक्रिप्शन पूरी तरह client पर चलता है।

- **सरल 3-चरणीय workflow**  
  UI आपको इन चरणों से मार्गदर्शन करता है:
  1. Whisper मॉडल लोड करना।
  2. मॉडल की स्थिति जाँचना।
  3. ऑडियो अपलोड करना और ट्रांसक्रिप्शन चलाना, हर चरण के लिए स्पष्ट status messages के साथ।

- **लाइव माइक्रोफ़ोन streaming transcription**  
  ऐप ब्राउज़र में सीधे माइक्रोफ़ोन ऑडियो कैप्चर कर सकता है और ऑडियो को सर्वर पर अपलोड किए बिना लगातार ट्रांसक्राइब कर सकता है।
  - लाइव PCM ऑडियो Web Audio API से कैप्चर किया जाता है
  - Whisper inference से पहले ऑडियो को छोटे windows में buffer किया जाता है
  - UI को responsive रखने के लिए streaming Whisper inference Web Worker में चलता है
  - लाइव माइक्रोफ़ोन level meter दिखाता है कि वास्तव में ऑडियो मिल रहा है या नहीं
  - `Stop microphone` capture को तुरंत रोकता है, जबकि बचा हुआ buffered audio asynchronous रूप से finalize होता है

- `@huggingface/transformers` के साथ **ब्राउज़र के भीतर ट्रांसक्रिप्शन**
- UI में **बहुभाषी Whisper मॉडल चयन**
- समर्थित built-in मॉडल विकल्प:
  - `Xenova/whisper-tiny`
  - `Xenova/whisper-base`
  - `Xenova/whisper-small`

- `AudioContext` के माध्यम से client-side ऑडियो को 16 kHz पर decode करना
- inference से पहले stereo-to-mono mixing
- लंबे मीडिया के लिए chunked transcription सेटिंग्स:
  - `chunk_length_s: 20`
  - `stride_length_s: 5`

- स्वीकार किए जाने वाले input:
  - `stream`
  - `mp4`
  - `webm`
  - `ogg`
  - `.mp4`
  - `.webm`
  - `.ogv`
  - `.m4v`

---

## 🧱 टेक स्टैक

- Frontend: React + TypeScript + Vite
- ML runtime: `@huggingface/transformers`
- Inference task: `automatic-speech-recognition`
- ब्राउज़र ऑडियो handling: Web Audio API (`AudioContext`)
- Testing: Jest + Testing Library
- Container tooling: Docker + Docker Compose

---


## यह कैसे काम करता है

### 1. ऐप लेआउट

`App.tsx` app shell, title, subtitle, `SettingsBar` और `HomeScreen` को render करता है।

Settings bar वर्तमान में runtime summary दिखाता है:

- `Transformers.js + Whisper`

### 2. मॉडल और फ़ाइल चयन

`HomeScreen.tsx` एक 3-चरणीय UI देता है:

1. एक मॉडल और मीडिया फ़ाइल चुनें
2. मॉडल की स्थिति जाँचें
3. ट्रांसक्रिप्शन परिणाम पढ़ें

स्क्रीन में शामिल हैं:

- Whisper मॉडल dropdown
- बटन से trigger होने वाला hidden file input
- Start/Stop microphone controls
- लाइव माइक्रोफ़ोन level meter
- प्रोसेसिंग के दौरान status text और spinner
- Transcript textarea
- Clear बटन

### 3. ट्रांसक्रिप्शन hook

`useTranscription.ts` मुख्य implementation है।

यह निम्न को expose करता है:

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

व्यवहार:

- चुना गया Whisper मॉडल पहली बार उपयोग होने पर lazily load होता है
- यदि वही मॉडल चुना रहता है, तो pipeline instance cache होकर फिर से उपयोग होता है
- मॉडल लोड होने से पहले browser-friendly ONNX WASM settings लागू की जाती हैं
- चुनी गई फ़ाइल को `ArrayBuffer` के रूप में पढ़ा जाता है
- ऑडियो `AudioContext({ sampleRate: 16000 })` से decode किया जाता है
- Multi-channel ऑडियो को mono में mix down किया जाता है
- `language` को जानबूझकर unset रखा गया है, इसलिए Whisper automatic language detection के साथ चलता है
- पहचाना गया टेक्स्ट transcript state में लिखा जाता है

### 4. लाइव माइक्रोफ़ोन streaming

स्थानीय मीडिया फ़ाइलों के अलावा, ऐप लाइव माइक्रोफ़ोन input का भी समर्थन करता है।

जब `Start microphone` दबाया जाता है:

1. चुना गया Whisper मॉडल Web Worker में तैयार किया जाता है।
2. ब्राउज़र माइक्रोफ़ोन permission माँगता है।
3. Web Audio API के माध्यम से माइक्रोफ़ोन ऑडियो को mono PCM के रूप में कैप्चर किया जाता है।
4. PCM samples को छोटे windows में buffer करके ट्रांसक्रिप्शन के लिए Worker को भेजा जाता है।
5. हर window पूरा होने पर पहचाना गया टेक्स्ट transcript में जोड़ा जाता है।

लाइव input UI में incoming PCM signal पर आधारित माइक्रोफ़ोन level meter शामिल है, जिससे ट्रांसक्रिप्शन प्रोसेस होते समय भी उपयोगकर्ता पुष्टि कर सकते हैं कि ऑडियो वास्तव में कैप्चर हो रहा है।

जब `Stop microphone` दबाया जाता है, तो माइक्रोफ़ोन capture और media tracks तुरंत रुक जाते हैं। पहले से buffer किया गया ऑडियो Worker में asynchronous रूप से finalize होता है, इसलिए Stop action को Whisper inference पूरा होने की प्रतीक्षा नहीं करनी पड़ती।

### 5. Status messages

वर्तमान UI उपयोगकर्ता को ये अवस्थाएँ दिखाता है:

- idle: मॉडल और फ़ाइल चुनें
- loading: पहली बार मॉडल लोड होने में समय लग सकता है
- ready: मॉडल लोड हो चुका है और तैयार है
- starting-stream: Worker और माइक्रोफ़ोन input तैयार किया जा रहा है
- streaming: लाइव माइक्रोफ़ोन capture सक्रिय है
- finalizing-stream: माइक्रोफ़ोन capture रुक चुका है और buffered audio अभी भी ट्रांसक्राइब हो रहा है
- transcribing: स्थानीय browser transcription चल रहा है
- done: ट्रांसक्रिप्शन पूरा हुआ
- error: failure message status block के नीचे दिखाया जाता है

## समर्थित मीडिया संबंधी नोट्स

UI टेक्स्ट बताता है कि उपयोगकर्ता audio या video फ़ाइलें चुन सकते हैं और Whisper ब्राउज़र में MP3 या MP4 जैसे समर्थित media से speech पहचान सकता है।

हालाँकि, वास्तविक implementation चुनी गई फ़ाइल को `AudioContext.decodeAudioData()` से decode करता है। व्यवहार में, सफल decoding ब्राउज़र codec support पर निर्भर करती है। इसलिए वास्तव में क्या समर्थित होगा, यह इस बात पर निर्भर है कि उपयोगकर्ता का ब्राउज़र चुनी गई media फ़ाइल को decode कर सकता है या नहीं।

---

## 🚀 शुरुआत करना

## npm

### पूर्वापेक्षाएँ

- Node.js 20+ अनुशंसित
- npm

### चलाएँ

```bash
cd frontend/app
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

यह सेवा को port `5173` पर शुरू करता है।

## टेस्ट

```bash
cd frontend/app
npm ci
npm test -- --ci --runInBand --coverage --verbose
```

## docker compose

### पूर्वापेक्षाएँ

- [Docker Compose](https://docs.docker.com/compose/)

### चलाएँ

```bash
docker compose build
docker compose up
```

यह सेवा को port `5173` पर शुरू करता है।

## टेस्ट

```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

## नोट्स और सीमाएँ

- मॉडल ब्राउज़र में लोड होता है और पहली बार उपयोग में समय लग सकता है
- बड़े मॉडल अधिक memory उपयोग करते हैं
- ट्रांसक्रिप्शन की गति ब्राउज़र और डिवाइस पर निर्भर करती है
- Media decoding support ब्राउज़र codec support पर निर्भर करता है
- लाइव माइक्रोफ़ोन ट्रांसक्रिप्शन में थोड़ा delay होता है क्योंकि ऑडियो buffered windows में प्रोसेस होता है
- लाइव streaming के लिए ब्राउज़र माइक्रोफ़ोन permission आवश्यक है
- वर्तमान ऐप में कोई backend transcription service नहीं है; ट्रांसक्रिप्शन client-side पर किया जाता है

---

# लाइसेंस
- Apache License 2.0
