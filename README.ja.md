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

Whisper と Transformers.js を利用した、ブラウザベースの AI 文字起こしプレイグラウンドです。
インストール、登録、支払いは不要です。

---

## 🚀 概要

このプロジェクトは、React、TypeScript、Vite で構築されたクライアントサイド文字起こし Web アプリです。
`@huggingface/transformers` を通じて Whisper をブラウザ内で直接実行するため、メディアファイルを文字起こし用のバックエンドへアップロードせず、ローカルで処理します。

現在の実装では、UI での Whisper モデル選択、ローカルメディアファイルの文字起こし、マイク入力のライブストリーミング、選択したモデルのオンデマンド読み込み、認識テキストの読み取り専用文字起こし領域への表示をサポートしています。

## ✨ 機能

- **クライアントサイド音声認識**  
  React アプリはブラウザ内から `@huggingface/transformers` の `automatic-speech-recognition` パイプラインを直接呼び出すため、文字起こしはすべてクライアント側で実行されます。

- **シンプルな 3 ステップのワークフロー**  
  UI は次の手順で操作できます:
  1. Whisper モデルを読み込む。
  2. モデルの状態を確認する。
  3. 音声をアップロードして文字起こしを実行する。各ステップには分かりやすいステータスメッセージが表示されます。

- **マイクのライブストリーミング文字起こし**  
  アプリはブラウザ内でマイク音声を直接取得し、音声をサーバーへアップロードせずに継続的に文字起こしできます。
  - Web Audio API でライブ PCM 音声を取得
  - Whisper 推論の前に音声を短いウィンドウ単位でバッファリング
  - UI の応答性を維持するため、ストリーミング Whisper 推論を Web Worker で実行
  - ライブマイクレベルメーターで、実際に音声が入力されているかを確認可能
  - `Stop microphone` を押すと録音取得は即座に停止し、残っているバッファ音声は非同期で最終処理

- `@huggingface/transformers` による **ブラウザ内文字起こし**
- UI での **多言語 Whisper モデル選択**
- 組み込みで選択可能なモデル:
  - `Xenova/whisper-tiny`
  - `Xenova/whisper-base`
  - `Xenova/whisper-small`

- `AudioContext` によるクライアントサイドでの 16 kHz 音声デコード
- 推論前のステレオからモノラルへのミキシング
- 長いメディア向けのチャンク分割文字起こし設定:
  - `chunk_length_s: 20`
  - `stride_length_s: 5`

- 入力として受け付ける形式:
  - `stream`
  - `mp4`
  - `webm`
  - `ogg`
  - `.mp4`
  - `.webm`
  - `.ogv`
  - `.m4v`

---

## 🧱 技術スタック

- フロントエンド: React + TypeScript + Vite
- ML ランタイム: `@huggingface/transformers`
- 推論タスク: `automatic-speech-recognition`
- ブラウザ音声処理: Web Audio API (`AudioContext`)
- テスト: Jest + Testing Library
- コンテナツール: Docker + Docker Compose

---


## 仕組み

### 1. アプリのレイアウト

`App.tsx` は、アプリシェル、タイトル、サブタイトル、`SettingsBar`、`HomeScreen` をレンダリングします。

設定バーには現在、ランタイムの概要が表示されます:

- `Transformers.js + Whisper`

### 2. モデルとファイルの選択

`HomeScreen.tsx` は 3 ステップの UI を提供します:

1. モデルとメディアファイルを選択
2. モデルの状態を確認
3. 文字起こし結果を確認

画面には次の要素があります:

- Whisper モデルのドロップダウン
- ボタンから呼び出す非表示のファイル入力
- マイクの Start/Stop コントロール
- ライブマイクレベルメーター
- 処理中のステータステキストとスピナー
- 文字起こし用テキストエリア
- Clear ボタン

### 3. 文字起こしフック

`useTranscription.ts` が中核となる実装です。

次の値と関数を公開します:

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

動作:

- 選択した Whisper モデルは初回使用時に遅延読み込みされます
- 同じモデルが選択されたままなら、パイプラインインスタンスをキャッシュして再利用します
- モデル読み込み前に、ブラウザ向けの ONNX WASM 設定を適用します
- 選択したファイルを `ArrayBuffer` として読み込みます
- `AudioContext({ sampleRate: 16000 })` で音声をデコードします
- マルチチャンネル音声をモノラルへミックスダウンします
- `language` を意図的に未設定にしているため、Whisper は言語を自動検出して実行されます
- 認識されたテキストを文字起こしの state に書き込みます

### 4. マイクのライブストリーミング

このアプリは、ローカルメディアファイルに加えてライブマイク入力もサポートしています。

`Start microphone` を押すと:

1. 選択した Whisper モデルを Web Worker 内で準備します。
2. ブラウザがマイクの使用許可を要求します。
3. Web Audio API を使ってマイク音声をモノラル PCM として取得します。
4. PCM サンプルを短いウィンドウ単位でバッファリングし、文字起こしのため Worker に送信します。
5. 各ウィンドウの処理が完了するたびに、認識テキストを文字起こし結果へ追加します。

ライブ入力 UI には受信中の PCM 信号に基づくマイクレベルメーターがあり、文字起こし処理中でも実際に音声が取得されていることを確認できます。

`Stop microphone` を押すと、マイク取得とメディアトラックは即座に停止します。すでにバッファリング済みの音声は Worker 内で非同期に最終処理されるため、Stop 操作で Whisper 推論の完了を待つ必要はありません。

### 5. ステータスメッセージ

現在の UI では、次のようなユーザー向け状態を表示します:

- idle: モデルとファイルを選択
- loading: 初回のモデル読み込みには時間がかかる場合があります
- ready: モデルの読み込みが完了し、使用可能
- starting-stream: Worker とマイク入力を準備中
- streaming: ライブマイク取得中
- finalizing-stream: マイク取得は停止済みで、バッファ音声の文字起こしを継続中
- transcribing: ブラウザ内でローカル文字起こしを実行中
- done: 文字起こし完了
- error: ステータスブロックの下にエラーメッセージを表示

## 対応メディアに関する注意

UI では、音声または動画ファイルを選択でき、ブラウザ内で MP3 や MP4 などの対応メディアから Whisper が音声を検出できると案内しています。

ただし、実際の実装では選択したファイルを `AudioContext.decodeAudioData()` でデコードします。実際にデコードできるかどうかはブラウザのコーデック対応状況に依存します。したがって、最終的に利用できる形式は、ユーザーのブラウザが選択したメディアファイルをデコードできるかどうかによって決まります。

---

## 🚀 はじめに

## npm

### 前提条件

- Node.js 20+ 推奨
- npm

### 実行

```bash
cd frontend/app
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

これにより、ポート `5173` でサービスが起動します。

## テスト

```bash
cd frontend/app
npm ci
npm test -- --ci --runInBand --coverage --verbose
```

## docker compose

### 前提条件

- [Docker Compose](https://docs.docker.com/compose/)

### 実行

```bash
docker compose build
docker compose up
```

これにより、ポート `5173` でサービスが起動します。

## テスト

```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

## 注意事項と制限

- モデルはブラウザ内で読み込まれるため、初回使用時は時間がかかる場合があります
- 大きなモデルほど多くのメモリを使用します
- 文字起こし速度はブラウザとデバイスに依存します
- メディアのデコード対応状況はブラウザのコーデック対応に依存します
- ライブマイク文字起こしでは音声をバッファウィンドウ単位で処理するため、短い遅延があります
- ライブストリーミングにはブラウザのマイク使用許可が必要です
- 現在のアプリにはバックエンド文字起こしサービスがなく、文字起こしはクライアント側で実行されます

---

# ライセンス
- Apache License 2.0
