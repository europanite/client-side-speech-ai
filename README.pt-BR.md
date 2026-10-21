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

Um playground de transcrição com IA baseado no navegador, desenvolvido com Whisper e Transformers.js.
Não requer instalação, cadastro nem pagamento.

---

## 🚀 Visão geral

Este projeto é um aplicativo web de transcrição client-side desenvolvido com React, TypeScript e Vite.
Ele executa o Whisper diretamente no navegador por meio de `@huggingface/transformers`, portanto os arquivos de mídia são processados localmente em vez de serem enviados a um backend para transcrição.

A implementação atual permite selecionar um modelo Whisper na UI, transcrever arquivos de mídia locais, fazer streaming em tempo real da entrada do microfone, carregar o modelo selecionado sob demanda e exibir o texto reconhecido em uma área de transcrição somente leitura.

## ✨ Recursos

- **Conversão de fala em texto no client-side**  
  O aplicativo React chama diretamente no navegador o pipeline `automatic-speech-recognition` de `@huggingface/transformers`, portanto a transcrição é executada inteiramente no cliente.

- **Fluxo simples em 3 etapas**  
  A UI orienta você pelas seguintes etapas:
  1. Carregar o modelo Whisper.
  2. Verificar o status do modelo.
  3. Enviar o áudio e executar a transcrição, com mensagens de status claras em cada etapa.

- **Transcrição em streaming do microfone ao vivo**  
  O aplicativo pode capturar o áudio do microfone diretamente no navegador e transcrevê-lo continuamente sem enviar o áudio para um servidor.
  - O áudio PCM ao vivo é capturado com a Web Audio API
  - O áudio é armazenado em buffer em janelas curtas antes da inferência do Whisper
  - A inferência do Whisper em streaming é executada em um Web Worker para manter a UI responsiva
  - Um medidor de nível do microfone ao vivo mostra se o áudio está realmente sendo recebido
  - `Stop microphone` interrompe a captura imediatamente, enquanto o áudio restante em buffer é finalizado de forma assíncrona

- **Transcrição no navegador** com `@huggingface/transformers`
- **Seleção de modelos multilíngues do Whisper** na UI
- Opções de modelos integrados compatíveis:
  - `Xenova/whisper-tiny`
  - `Xenova/whisper-base`
  - `Xenova/whisper-small`

- Decodificação de áudio no client-side para 16 kHz via `AudioContext`
- Conversão de estéreo para mono antes da inferência
- Configurações de transcrição em chunks para mídias mais longas:
  - `chunk_length_s: 20`
  - `stride_length_s: 5`

- Entradas aceitas:
  - `stream`
  - `mp4`
  - `webm`
  - `ogg`
  - `.mp4`
  - `.webm`
  - `.ogv`
  - `.m4v`

---

## 🧱 Stack de tecnologia

- Frontend: React + TypeScript + Vite
- Runtime de ML: `@huggingface/transformers`
- Tarefa de inferência: `automatic-speech-recognition`
- Tratamento de áudio no navegador: Web Audio API (`AudioContext`)
- Testes: Jest + Testing Library
- Ferramentas de contêiner: Docker + Docker Compose

---


## Como funciona

### 1. Layout do aplicativo

`App.tsx` renderiza a estrutura do aplicativo, o título, o subtítulo, `SettingsBar` e `HomeScreen`.

A barra de configurações exibe atualmente o resumo do runtime:

- `Transformers.js + Whisper`

### 2. Seleção de modelo e arquivo

`HomeScreen.tsx` fornece uma UI em 3 etapas:

1. Escolha um modelo e um arquivo de mídia
2. Verifique o status do modelo
3. Leia o resultado da transcrição

A tela inclui:

- Um menu suspenso de modelos Whisper
- Uma entrada de arquivo oculta acionada por um botão
- Controles Start/Stop do microfone
- Um medidor de nível do microfone ao vivo
- Texto de status e indicador de carregamento durante o processamento
- Uma área de texto para a transcrição
- Um botão Clear

### 3. Hook de transcrição

`useTranscription.ts` é a implementação principal.

Ele expõe:

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

Comportamento:

- O modelo Whisper selecionado é carregado de forma lazy no primeiro uso
- A instância do pipeline é armazenada em cache e reutilizada se o mesmo modelo continuar selecionado
- Configurações de ONNX WASM adequadas ao navegador são aplicadas antes do carregamento do modelo
- O arquivo selecionado é lido como um `ArrayBuffer`
- O áudio é decodificado com `AudioContext({ sampleRate: 16000 })`
- O áudio multicanal é convertido para mono
- O Whisper é executado com detecção automática de idioma porque `language` é deixado intencionalmente sem definição
- O texto reconhecido é gravado no estado da transcrição

### 4. Streaming do microfone ao vivo

Além de arquivos de mídia locais, o aplicativo também oferece suporte à entrada ao vivo do microfone.

Ao pressionar `Start microphone`:

1. O modelo Whisper selecionado é preparado em um Web Worker.
2. O navegador solicita permissão para usar o microfone.
3. O áudio do microfone é capturado como PCM mono por meio da Web Audio API.
4. As amostras PCM são armazenadas em buffer em janelas curtas e enviadas ao Worker para transcrição.
5. O texto reconhecido é acrescentado à transcrição à medida que cada janela é concluída.

A UI de entrada ao vivo inclui um medidor de nível do microfone baseado no sinal PCM recebido, permitindo que os usuários confirmem se o áudio está realmente sendo capturado mesmo enquanto a transcrição ainda está em processamento.

Ao pressionar `Stop microphone`, a captura do microfone e as trilhas de mídia são interrompidas imediatamente. Qualquer áudio já armazenado em buffer é finalizado de forma assíncrona no Worker, portanto a ação Stop não precisa esperar a inferência do Whisper terminar.

### 5. Mensagens de status

A UI atual exibe estados voltados ao usuário, como:

- idle: escolha um modelo e um arquivo
- loading: o primeiro carregamento do modelo pode ser lento
- ready: modelo carregado e pronto
- starting-stream: preparando o Worker e a entrada do microfone
- streaming: a captura ao vivo do microfone está ativa
- finalizing-stream: a captura do microfone foi interrompida e o áudio em buffer ainda está sendo transcrito
- transcribing: a transcrição local no navegador está em execução
- done: transcrição concluída
- error: uma mensagem de falha é exibida abaixo do bloco de status

## Observações sobre mídias compatíveis

O texto da UI informa que os usuários podem selecionar arquivos de áudio ou vídeo e que o Whisper pode detectar fala no navegador a partir de mídias compatíveis, como MP3 ou MP4.

No entanto, a implementação real decodifica o arquivo selecionado usando `AudioContext.decodeAudioData()`. Na prática, a decodificação bem-sucedida depende do suporte a codecs do navegador. Isso significa que o comportamento compatível é, em última análise, limitado ao que o navegador do usuário consegue decodificar do arquivo de mídia selecionado.

---

## 🚀 Primeiros passos

## npm

### Pré-requisitos

- Node.js 20+ recomendado
- npm

### Executar

```bash
cd frontend/app
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

Isso inicia o serviço na porta `5173`.

## Testes

```bash
cd frontend/app
npm ci
npm test -- --ci --runInBand --coverage --verbose
```

## docker compose

### Pré-requisitos

- [Docker Compose](https://docs.docker.com/compose/)

### Executar

```bash
docker compose build
docker compose up
```

Isso inicia o serviço na porta `5173`.

## Testes

```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

## Observações e limitações

- O carregamento do modelo ocorre no navegador e pode levar algum tempo no primeiro uso
- Modelos maiores usam mais memória
- A velocidade da transcrição depende do navegador e do dispositivo
- O suporte à decodificação de mídia depende do suporte a codecs do navegador
- A transcrição ao vivo do microfone tem um pequeno atraso porque o áudio é processado em janelas armazenadas em buffer
- É necessária permissão do navegador para usar o microfone no streaming ao vivo
- O aplicativo atual não possui serviço backend de transcrição; a transcrição é realizada no client-side

---

# Licença
- Apache License 2.0
