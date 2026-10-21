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

Un entorno de pruebas de transcripción con IA basado en el navegador, impulsado por Whisper y Transformers.js.
No requiere instalación, registro ni pago.

---

## 🚀 Descripción general

Este proyecto es una aplicación web de transcripción del lado del cliente creada con React, TypeScript y Vite.
Ejecuta Whisper directamente en el navegador mediante `@huggingface/transformers`, por lo que los archivos multimedia se procesan localmente en lugar de subirse a un backend para su transcripción.

La implementación actual permite seleccionar un modelo de Whisper en la UI, transcribir archivos multimedia locales, transmitir en directo la entrada del micrófono, cargar el modelo seleccionado bajo demanda y mostrar el texto reconocido en un área de transcripción de solo lectura.

## ✨ Funciones

- **Conversión de voz a texto del lado del cliente**  
  La aplicación React llama directamente en el navegador al pipeline `automatic-speech-recognition` de `@huggingface/transformers`, por lo que la transcripción se ejecuta por completo en el cliente.

- **Flujo de trabajo sencillo de 3 pasos**  
  La UI te guía por los siguientes pasos:
  1. Cargar el modelo de Whisper.
  2. Comprobar el estado del modelo.
  3. Subir audio y ejecutar la transcripción, con mensajes de estado claros para cada paso.

- **Transcripción en streaming del micrófono en directo**  
  La aplicación puede capturar el audio del micrófono directamente en el navegador y transcribirlo de forma continua sin subir el audio a un servidor.
  - El audio PCM en directo se captura con la Web Audio API
  - El audio se almacena en búfer en ventanas cortas antes de la inferencia de Whisper
  - La inferencia de Whisper en streaming se ejecuta en un Web Worker para mantener la UI fluida
  - Un medidor de nivel del micrófono en directo indica si realmente se está recibiendo audio
  - `Stop microphone` detiene la captura de inmediato, mientras que el audio restante en búfer se finaliza de forma asíncrona

- **Transcripción en el navegador** con `@huggingface/transformers`
- **Selección de modelos multilingües de Whisper** en la UI
- Opciones de modelo integradas compatibles:
  - `Xenova/whisper-tiny`
  - `Xenova/whisper-base`
  - `Xenova/whisper-small`

- Decodificación de audio del lado del cliente a 16 kHz mediante `AudioContext`
- Mezcla de estéreo a mono antes de la inferencia
- Configuración de transcripción por fragmentos para contenido multimedia más largo:
  - `chunk_length_s: 20`
  - `stride_length_s: 5`

- Entradas aceptadas:
  - `stream`
  - `mp4`
  - `webm`
  - `ogg`
  - `.mp4`
  - `.webm`
  - `.ogv`
  - `.m4v`

---

## 🧱 Stack tecnológico

- Frontend: React + TypeScript + Vite
- Runtime de ML: `@huggingface/transformers`
- Tarea de inferencia: `automatic-speech-recognition`
- Gestión de audio en el navegador: Web Audio API (`AudioContext`)
- Pruebas: Jest + Testing Library
- Herramientas de contenedores: Docker + Docker Compose

---


## Cómo funciona

### 1. Diseño de la aplicación

`App.tsx` renderiza la estructura de la aplicación, el título, el subtítulo, `SettingsBar` y `HomeScreen`.

La barra de ajustes muestra actualmente el resumen del runtime:

- `Transformers.js + Whisper`

### 2. Selección del modelo y del archivo

`HomeScreen.tsx` proporciona una UI de 3 pasos:

1. Elegir un modelo y un archivo multimedia
2. Comprobar el estado del modelo
3. Leer el resultado de la transcripción

La pantalla incluye:

- Un desplegable de modelos de Whisper
- Una entrada de archivo oculta activada mediante un botón
- Controles Start/Stop del micrófono
- Un medidor de nivel del micrófono en directo
- Texto de estado y un indicador de carga durante el procesamiento
- Un área de texto para la transcripción
- Un botón Clear

### 3. Hook de transcripción

`useTranscription.ts` es la implementación principal.

Expone:

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

Comportamiento:

- El modelo de Whisper seleccionado se carga de forma diferida en el primer uso
- La instancia del pipeline se almacena en caché y se reutiliza si sigue seleccionado el mismo modelo
- Antes de cargar el modelo se aplican ajustes de ONNX WASM adecuados para el navegador
- El archivo seleccionado se lee como un `ArrayBuffer`
- El audio se decodifica con `AudioContext({ sampleRate: 16000 })`
- El audio multicanal se mezcla a mono
- Whisper se ejecuta con detección automática de idioma porque `language` se deja intencionadamente sin definir
- El texto reconocido se escribe en el estado de la transcripción

### 4. Streaming del micrófono en directo

La aplicación también admite entrada de micrófono en directo, además de archivos multimedia locales.

Al pulsar `Start microphone`:

1. El modelo de Whisper seleccionado se prepara en un Web Worker.
2. El navegador solicita permiso para usar el micrófono.
3. El audio del micrófono se captura como PCM mono mediante la Web Audio API.
4. Las muestras PCM se almacenan en búfer en ventanas cortas y se envían al Worker para su transcripción.
5. El texto reconocido se añade a la transcripción a medida que termina cada ventana.

La UI de entrada en directo incluye un medidor de nivel del micrófono basado en la señal PCM entrante, de modo que los usuarios pueden confirmar que el audio se está capturando realmente incluso mientras la transcripción sigue procesándose.

Al pulsar `Stop microphone`, la captura del micrófono y las pistas multimedia se detienen de inmediato. El audio que ya estaba en búfer se finaliza de forma asíncrona en el Worker, por lo que la acción Stop no tiene que esperar a que termine la inferencia de Whisper.

### 5. Mensajes de estado

La UI actual muestra estados orientados al usuario como:

- idle: elige un modelo y un archivo
- loading: la primera carga del modelo puede ser lenta
- ready: modelo cargado y listo
- starting-stream: preparando el Worker y la entrada del micrófono
- streaming: la captura del micrófono en directo está activa
- finalizing-stream: la captura del micrófono se ha detenido y el audio en búfer sigue transcribiéndose
- transcribing: se está ejecutando la transcripción local en el navegador
- done: transcripción finalizada
- error: se muestra un mensaje de error debajo del bloque de estado

## Notas sobre los formatos multimedia compatibles

El texto de la UI indica que los usuarios pueden seleccionar archivos de audio o vídeo y que Whisper puede detectar voz en el navegador a partir de formatos compatibles como MP3 o MP4.

Sin embargo, la implementación real decodifica el archivo seleccionado mediante `AudioContext.decodeAudioData()`. En la práctica, que la decodificación funcione depende de los códecs compatibles con el navegador. Por tanto, el comportamiento admitido queda limitado por lo que el navegador del usuario pueda decodificar del archivo multimedia seleccionado.

---

## 🚀 Primeros pasos

## npm

### Requisitos previos

- Se recomienda Node.js 20+
- npm

### Ejecutar

```bash
cd frontend/app
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

Esto inicia el servicio en el puerto `5173`.

## Pruebas

```bash
cd frontend/app
npm ci
npm test -- --ci --runInBand --coverage --verbose
```

## docker compose

### Requisitos previos

- [Docker Compose](https://docs.docker.com/compose/)

### Ejecutar

```bash
docker compose build
docker compose up
```

Esto inicia el servicio en el puerto `5173`.

## Pruebas

```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

## Notas y limitaciones

- El modelo se carga en el navegador y puede tardar la primera vez
- Los modelos más grandes utilizan más memoria
- La velocidad de transcripción depende del navegador y del dispositivo
- La compatibilidad de decodificación multimedia depende de los códecs admitidos por el navegador
- La transcripción en directo del micrófono tiene un breve retraso porque el audio se procesa en ventanas almacenadas en búfer
- El streaming en directo requiere permiso del navegador para usar el micrófono
- La aplicación actual no tiene un servicio backend de transcripción; la transcripción se realiza en el cliente

---

# Licencia
- Apache License 2.0
