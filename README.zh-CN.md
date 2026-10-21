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

一个由 Whisper 和 Transformers.js 驱动、基于浏览器的 AI 转录实验平台。
无需安装、注册或付费。

---

## 🚀 概览

本项目是一个使用 React、TypeScript 和 Vite 构建的客户端转录 Web 应用。
它通过 `@huggingface/transformers` 直接在浏览器中运行 Whisper，因此媒体文件会在本地处理，而无需上传到后端进行转录。

当前实现支持在 UI 中选择 Whisper 模型、转录本地媒体文件、实时流式处理麦克风输入、按需加载所选模型，以及在只读转录区域中显示识别出的文本。

## ✨ 功能

- **客户端语音转文本**  
  React 应用直接在浏览器中调用 `@huggingface/transformers` 的 `automatic-speech-recognition` pipeline，因此整个转录过程都在客户端完成。

- **简单的 3 步工作流**  
  UI 会引导你完成以下步骤:
  1. 加载 Whisper 模型。
  2. 检查模型状态。
  3. 上传音频并运行转录，每一步都有清晰的状态提示。

- **实时麦克风流式转录**  
  应用可以直接在浏览器中采集麦克风音频，并在不将音频上传到服务器的情况下持续转录。
  - 使用 Web Audio API 采集实时 PCM 音频
  - 在 Whisper 推理前，将音频缓冲为较短的时间窗口
  - 在 Web Worker 中运行流式 Whisper 推理，以保持 UI 响应
  - 实时麦克风电平表可显示是否真正接收到音频
  - `Stop microphone` 会立即停止采集，剩余的缓冲音频则异步完成处理

- 使用 `@huggingface/transformers` 进行 **浏览器内转录**
- 在 UI 中进行 **多语言 Whisper 模型选择**
- 内置支持的模型选项:
  - `Xenova/whisper-tiny`
  - `Xenova/whisper-base`
  - `Xenova/whisper-small`

- 通过 `AudioContext` 在客户端将音频解码为 16 kHz
- 推理前将立体声混合为单声道
- 针对较长媒体的分块转录设置:
  - `chunk_length_s: 20`
  - `stride_length_s: 5`

- 接受的输入:
  - `stream`
  - `mp4`
  - `webm`
  - `ogg`
  - `.mp4`
  - `.webm`
  - `.ogv`
  - `.m4v`

---

## 🧱 技术栈

- 前端: React + TypeScript + Vite
- ML 运行时: `@huggingface/transformers`
- 推理任务: `automatic-speech-recognition`
- 浏览器音频处理: Web Audio API (`AudioContext`)
- 测试: Jest + Testing Library
- 容器工具: Docker + Docker Compose

---


## 工作原理

### 1. 应用布局

`App.tsx` 会渲染应用外壳、标题、副标题、`SettingsBar` 和 `HomeScreen`。

设置栏当前显示运行时摘要:

- `Transformers.js + Whisper`

### 2. 模型和文件选择

`HomeScreen.tsx` 提供一个 3 步 UI:

1. 选择模型和媒体文件
2. 检查模型状态
3. 查看转录结果

界面包含:

- Whisper 模型下拉菜单
- 由按钮触发的隐藏文件输入框
- 麦克风 Start/Stop 控件
- 实时麦克风电平表
- 处理期间的状态文本和加载指示器
- 转录文本区域
- Clear 按钮

### 3. 转录 Hook

`useTranscription.ts` 是核心实现。

它公开以下内容:

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

行为:

- 所选 Whisper 模型会在首次使用时延迟加载
- 如果仍选择同一个模型，则缓存并复用 pipeline 实例
- 在加载模型前应用适合浏览器的 ONNX WASM 设置
- 将所选文件读取为 `ArrayBuffer`
- 使用 `AudioContext({ sampleRate: 16000 })` 解码音频
- 将多声道音频混合为单声道
- 由于有意未设置 `language`，Whisper 会使用自动语言检测运行
- 将识别出的文本写入转录 state

### 4. 实时麦克风流式处理

除本地媒体文件外，该应用还支持实时麦克风输入。

按下 `Start microphone` 时:

1. 在 Web Worker 中准备所选 Whisper 模型。
2. 浏览器请求麦克风权限。
3. 通过 Web Audio API 将麦克风音频采集为单声道 PCM。
4. 将 PCM 样本缓冲为较短的时间窗口，并发送到 Worker 进行转录。
5. 每个窗口处理完成后，将识别出的文本追加到转录结果中。

实时输入 UI 包含一个基于传入 PCM 信号的麦克风电平表，因此即使转录仍在处理中，用户也可以确认音频是否确实正在被采集。

按下 `Stop microphone` 时，麦克风采集和媒体轨道会立即停止。已经缓冲的音频会在 Worker 中异步完成处理，因此 Stop 操作无需等待 Whisper 推理结束。

### 5. 状态消息

当前 UI 会报告以下面向用户的状态:

- idle: 选择模型和文件
- loading: 首次加载模型可能较慢
- ready: 模型已加载并可用
- starting-stream: 正在准备 Worker 和麦克风输入
- streaming: 实时麦克风采集已启用
- finalizing-stream: 麦克风采集已停止，但缓冲音频仍在转录
- transcribing: 正在浏览器本地执行转录
- done: 转录完成
- error: 在状态区域下方显示失败消息

## 支持的媒体说明

UI 文本说明用户可以选择音频或视频文件，并且 Whisper 可以在浏览器中从 MP3、MP4 等受支持媒体中检测语音。

不过，实际实现使用 `AudioContext.decodeAudioData()` 解码所选文件。实际能否成功解码取决于浏览器的编解码器支持。因此，最终可支持的行为取决于用户浏览器能否解码所选媒体文件。

---

## 🚀 快速开始

## npm

### 前置要求

- 推荐 Node.js 20+
- npm

### 运行

```bash
cd frontend/app
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

这会在端口 `5173` 上启动服务。

## 测试

```bash
cd frontend/app
npm ci
npm test -- --ci --runInBand --coverage --verbose
```

## docker compose

### 前置要求

- [Docker Compose](https://docs.docker.com/compose/)

### 运行

```bash
docker compose build
docker compose up
```

这会在端口 `5173` 上启动服务。

## 测试

```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

## 注意事项和限制

- 模型在浏览器中加载，首次使用时可能需要一些时间
- 较大的模型会占用更多内存
- 转录速度取决于浏览器和设备
- 媒体解码支持取决于浏览器的编解码器支持
- 实时麦克风转录会有短暂延迟，因为音频按缓冲窗口处理
- 实时流式处理需要浏览器授予麦克风权限
- 当前应用没有后端转录服务；转录完全在客户端执行

---

# 许可证
- Apache License 2.0
