// frontend/app/src/hooks/useTranscription.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { env, pipeline, WhisperTextStreamer } from "@huggingface/transformers";
import { createStreamTranscriptionWorker } from "../workers/createStreamTranscriptionWorker";
import { sampleLiveWaveform } from "../services/liveWaveform";
import { extractWhisperCues, type SubtitleCue } from "../services/subtitles";
import { planFileChunks, type ChunkCountMode, MAX_MANUAL_CHUNK_COUNT } from "../services/transcriptionChunks";

export type TranscriptionStatus =
  | "idle"
  | "loading-model"
  | "ready"
  | "transcribing"
  | "starting-stream"
  | "streaming"
  | "finalizing-stream"
  | "done"
  | "error";

export interface WhisperModelOption {
  id: string;
  label: string;
  description: string;
}

export interface TranscriptionLanguageOption {
  id: string;
  label: string;
  description: string;
  whisperLanguage?: string;
}

export interface TranscriptionProgress {
  percent: number | null;
  label: string;
}

export const AUTO_TRANSCRIPTION_LANGUAGE_ID = "auto";
export const DEFAULT_TRANSCRIPTION_LANGUAGE_ID = "english";

export const TRANSCRIPTION_LANGUAGE_OPTIONS: TranscriptionLanguageOption[] = [
  {
    id: AUTO_TRANSCRIPTION_LANGUAGE_ID,
    label: "Auto-detect",
    description: "Let Whisper detect the spoken language automatically.",
  },
  { id: "english", label: "English", description: "Force English transcription.", whisperLanguage: "english" },
  { id: "chinese", label: "Chinese", description: "Force Chinese transcription.", whisperLanguage: "chinese" },
  { id: "german", label: "German", description: "Force German transcription.", whisperLanguage: "german" },
  { id: "spanish", label: "Spanish", description: "Force Spanish transcription.", whisperLanguage: "spanish" },
  { id: "russian", label: "Russian", description: "Force Russian transcription.", whisperLanguage: "russian" },
  { id: "korean", label: "Korean", description: "Force Korean transcription.", whisperLanguage: "korean" },
  { id: "french", label: "French", description: "Force French transcription.", whisperLanguage: "french" },
  { id: "japanese", label: "Japanese", description: "Force Japanese transcription.", whisperLanguage: "japanese" },
  { id: "portuguese", label: "Portuguese", description: "Force Portuguese transcription.", whisperLanguage: "portuguese" },
  { id: "turkish", label: "Turkish", description: "Force Turkish transcription.", whisperLanguage: "turkish" },
  { id: "polish", label: "Polish", description: "Force Polish transcription.", whisperLanguage: "polish" },
  { id: "catalan", label: "Catalan", description: "Force Catalan transcription.", whisperLanguage: "catalan" },
  { id: "dutch", label: "Dutch", description: "Force Dutch transcription.", whisperLanguage: "dutch" },
  { id: "arabic", label: "Arabic", description: "Force Arabic transcription.", whisperLanguage: "arabic" },
  { id: "swedish", label: "Swedish", description: "Force Swedish transcription.", whisperLanguage: "swedish" },
  { id: "italian", label: "Italian", description: "Force Italian transcription.", whisperLanguage: "italian" },
  { id: "indonesian", label: "Indonesian", description: "Force Indonesian transcription.", whisperLanguage: "indonesian" },
  { id: "hindi", label: "Hindi", description: "Force Hindi transcription.", whisperLanguage: "hindi" },
  { id: "finnish", label: "Finnish", description: "Force Finnish transcription.", whisperLanguage: "finnish" },
  { id: "vietnamese", label: "Vietnamese", description: "Force Vietnamese transcription.", whisperLanguage: "vietnamese" },
  { id: "hebrew", label: "Hebrew", description: "Force Hebrew transcription.", whisperLanguage: "hebrew" },
  { id: "ukrainian", label: "Ukrainian", description: "Force Ukrainian transcription.", whisperLanguage: "ukrainian" },
  { id: "greek", label: "Greek", description: "Force Greek transcription.", whisperLanguage: "greek" },
  { id: "malay", label: "Malay", description: "Force Malay transcription.", whisperLanguage: "malay" },
  { id: "czech", label: "Czech", description: "Force Czech transcription.", whisperLanguage: "czech" },
  { id: "romanian", label: "Romanian", description: "Force Romanian transcription.", whisperLanguage: "romanian" },
  { id: "danish", label: "Danish", description: "Force Danish transcription.", whisperLanguage: "danish" },
  { id: "hungarian", label: "Hungarian", description: "Force Hungarian transcription.", whisperLanguage: "hungarian" },
  { id: "tamil", label: "Tamil", description: "Force Tamil transcription.", whisperLanguage: "tamil" },
  { id: "norwegian", label: "Norwegian", description: "Force Norwegian transcription.", whisperLanguage: "norwegian" },
  { id: "thai", label: "Thai", description: "Force Thai transcription.", whisperLanguage: "thai" },
  { id: "urdu", label: "Urdu", description: "Force Urdu transcription.", whisperLanguage: "urdu" },
  { id: "croatian", label: "Croatian", description: "Force Croatian transcription.", whisperLanguage: "croatian" },
  { id: "bulgarian", label: "Bulgarian", description: "Force Bulgarian transcription.", whisperLanguage: "bulgarian" },
  { id: "lithuanian", label: "Lithuanian", description: "Force Lithuanian transcription.", whisperLanguage: "lithuanian" },
  { id: "latin", label: "Latin", description: "Force Latin transcription.", whisperLanguage: "latin" },
  { id: "maori", label: "Maori", description: "Force Maori transcription.", whisperLanguage: "maori" },
  { id: "malayalam", label: "Malayalam", description: "Force Malayalam transcription.", whisperLanguage: "malayalam" },
  { id: "welsh", label: "Welsh", description: "Force Welsh transcription.", whisperLanguage: "welsh" },
  { id: "slovak", label: "Slovak", description: "Force Slovak transcription.", whisperLanguage: "slovak" },
  { id: "telugu", label: "Telugu", description: "Force Telugu transcription.", whisperLanguage: "telugu" },
  { id: "persian", label: "Persian", description: "Force Persian transcription.", whisperLanguage: "persian" },
  { id: "latvian", label: "Latvian", description: "Force Latvian transcription.", whisperLanguage: "latvian" },
  { id: "bengali", label: "Bengali", description: "Force Bengali transcription.", whisperLanguage: "bengali" },
  { id: "serbian", label: "Serbian", description: "Force Serbian transcription.", whisperLanguage: "serbian" },
  { id: "azerbaijani", label: "Azerbaijani", description: "Force Azerbaijani transcription.", whisperLanguage: "azerbaijani" },
  { id: "slovenian", label: "Slovenian", description: "Force Slovenian transcription.", whisperLanguage: "slovenian" },
  { id: "kannada", label: "Kannada", description: "Force Kannada transcription.", whisperLanguage: "kannada" },
  { id: "estonian", label: "Estonian", description: "Force Estonian transcription.", whisperLanguage: "estonian" },
  { id: "macedonian", label: "Macedonian", description: "Force Macedonian transcription.", whisperLanguage: "macedonian" },
  { id: "breton", label: "Breton", description: "Force Breton transcription.", whisperLanguage: "breton" },
  { id: "basque", label: "Basque", description: "Force Basque transcription.", whisperLanguage: "basque" },
  { id: "icelandic", label: "Icelandic", description: "Force Icelandic transcription.", whisperLanguage: "icelandic" },
  { id: "armenian", label: "Armenian", description: "Force Armenian transcription.", whisperLanguage: "armenian" },
  { id: "nepali", label: "Nepali", description: "Force Nepali transcription.", whisperLanguage: "nepali" },
  { id: "mongolian", label: "Mongolian", description: "Force Mongolian transcription.", whisperLanguage: "mongolian" },
  { id: "bosnian", label: "Bosnian", description: "Force Bosnian transcription.", whisperLanguage: "bosnian" },
  { id: "kazakh", label: "Kazakh", description: "Force Kazakh transcription.", whisperLanguage: "kazakh" },
  { id: "albanian", label: "Albanian", description: "Force Albanian transcription.", whisperLanguage: "albanian" },
  { id: "swahili", label: "Swahili", description: "Force Swahili transcription.", whisperLanguage: "swahili" },
  { id: "galician", label: "Galician", description: "Force Galician transcription.", whisperLanguage: "galician" },
  { id: "marathi", label: "Marathi", description: "Force Marathi transcription.", whisperLanguage: "marathi" },
  { id: "punjabi", label: "Punjabi", description: "Force Punjabi transcription.", whisperLanguage: "punjabi" },
  { id: "sinhala", label: "Sinhala", description: "Force Sinhala transcription.", whisperLanguage: "sinhala" },
  { id: "khmer", label: "Khmer", description: "Force Khmer transcription.", whisperLanguage: "khmer" },
  { id: "shona", label: "Shona", description: "Force Shona transcription.", whisperLanguage: "shona" },
  { id: "yoruba", label: "Yoruba", description: "Force Yoruba transcription.", whisperLanguage: "yoruba" },
  { id: "somali", label: "Somali", description: "Force Somali transcription.", whisperLanguage: "somali" },
  { id: "afrikaans", label: "Afrikaans", description: "Force Afrikaans transcription.", whisperLanguage: "afrikaans" },
  { id: "occitan", label: "Occitan", description: "Force Occitan transcription.", whisperLanguage: "occitan" },
  { id: "georgian", label: "Georgian", description: "Force Georgian transcription.", whisperLanguage: "georgian" },
  { id: "belarusian", label: "Belarusian", description: "Force Belarusian transcription.", whisperLanguage: "belarusian" },
  { id: "tajik", label: "Tajik", description: "Force Tajik transcription.", whisperLanguage: "tajik" },
  { id: "sindhi", label: "Sindhi", description: "Force Sindhi transcription.", whisperLanguage: "sindhi" },
  { id: "gujarati", label: "Gujarati", description: "Force Gujarati transcription.", whisperLanguage: "gujarati" },
  { id: "amharic", label: "Amharic", description: "Force Amharic transcription.", whisperLanguage: "amharic" },
  { id: "yiddish", label: "Yiddish", description: "Force Yiddish transcription.", whisperLanguage: "yiddish" },
  { id: "lao", label: "Lao", description: "Force Lao transcription.", whisperLanguage: "lao" },
  { id: "uzbek", label: "Uzbek", description: "Force Uzbek transcription.", whisperLanguage: "uzbek" },
  { id: "faroese", label: "Faroese", description: "Force Faroese transcription.", whisperLanguage: "faroese" },
  { id: "haitian creole", label: "Haitian Creole", description: "Force Haitian Creole transcription.", whisperLanguage: "haitian creole" },
  { id: "pashto", label: "Pashto", description: "Force Pashto transcription.", whisperLanguage: "pashto" },
  { id: "turkmen", label: "Turkmen", description: "Force Turkmen transcription.", whisperLanguage: "turkmen" },
  { id: "nynorsk", label: "Nynorsk", description: "Force Nynorsk transcription.", whisperLanguage: "nynorsk" },
  { id: "maltese", label: "Maltese", description: "Force Maltese transcription.", whisperLanguage: "maltese" },
  { id: "sanskrit", label: "Sanskrit", description: "Force Sanskrit transcription.", whisperLanguage: "sanskrit" },
  { id: "luxembourgish", label: "Luxembourgish", description: "Force Luxembourgish transcription.", whisperLanguage: "luxembourgish" },
  { id: "myanmar", label: "Myanmar", description: "Force Myanmar transcription.", whisperLanguage: "myanmar" },
  { id: "tibetan", label: "Tibetan", description: "Force Tibetan transcription.", whisperLanguage: "tibetan" },
  { id: "tagalog", label: "Tagalog", description: "Force Tagalog transcription.", whisperLanguage: "tagalog" },
  { id: "malagasy", label: "Malagasy", description: "Force Malagasy transcription.", whisperLanguage: "malagasy" },
  { id: "assamese", label: "Assamese", description: "Force Assamese transcription.", whisperLanguage: "assamese" },
  { id: "tatar", label: "Tatar", description: "Force Tatar transcription.", whisperLanguage: "tatar" },
  { id: "hawaiian", label: "Hawaiian", description: "Force Hawaiian transcription.", whisperLanguage: "hawaiian" },
  { id: "lingala", label: "Lingala", description: "Force Lingala transcription.", whisperLanguage: "lingala" },
  { id: "hausa", label: "Hausa", description: "Force Hausa transcription.", whisperLanguage: "hausa" },
  { id: "bashkir", label: "Bashkir", description: "Force Bashkir transcription.", whisperLanguage: "bashkir" },
  { id: "javanese", label: "Javanese", description: "Force Javanese transcription.", whisperLanguage: "javanese" },
  { id: "sundanese", label: "Sundanese", description: "Force Sundanese transcription.", whisperLanguage: "sundanese" },
  { id: "cantonese", label: "Cantonese", description: "Force Cantonese transcription.", whisperLanguage: "cantonese" },
];

export const WHISPER_MODEL_OPTIONS: WhisperModelOption[] = [
  {
    id: "Xenova/whisper-tiny",
    label: "Tiny",
    description: "Fastest multilingual option for quick browser-side transcription checks.",
  },
  {
    id: "Xenova/whisper-base",
    label: "Base",
    description: "Balanced speed and accuracy for multilingual transcription.",
  },
  {
    id: "Xenova/whisper-small",
    label: "Small",
    description: "Higher accuracy multilingual option, but takes more browser memory.",
  },
];

export const DEFAULT_WHISPER_MODEL_ID = "Xenova/whisper-small";

function mixToMono(audioBuffer: AudioBuffer): Float32Array {
  const { length, numberOfChannels } = audioBuffer;

  if (numberOfChannels <= 1) {
    return audioBuffer.getChannelData(0);
  }

  const mono = new Float32Array(length);

  for (let channel = 0; channel < numberOfChannels; channel += 1) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      mono[i] += channelData[i] / numberOfChannels;
    }
  }

  return mono;
}

const WHISPER_SAMPLE_RATE = 16_000;
const STREAM_WINDOW_SECONDS = 6;
const MIN_STREAM_FLUSH_SECONDS = 0.5;
const STREAM_WORKER_INIT_TIMEOUT_MS = 300_000;

function clampProgressPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function concatFloat32(chunks: Float32Array[]): Float32Array {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const combined = new Float32Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }

  return combined;
}

function resampleLinear(
  input: Float32Array,
  inputSampleRate: number,
  outputSampleRate = WHISPER_SAMPLE_RATE
): Float32Array {
  if (inputSampleRate === outputSampleRate || input.length === 0) {
    return input;
  }

  const outputLength = Math.max(
    1,
    Math.round((input.length * outputSampleRate) / inputSampleRate)
  );
  const output = new Float32Array(outputLength);
  const ratio = inputSampleRate / outputSampleRate;

  for (let i = 0; i < outputLength; i += 1) {
    const sourcePosition = i * ratio;
    const left = Math.floor(sourcePosition);
    const right = Math.min(left + 1, input.length - 1);
    const fraction = sourcePosition - left;
    output[i] = input[left] * (1 - fraction) + input[right] * fraction;
  }

  return output;
}

function extractTranscriptText(result: unknown): string {
  if (typeof result === "string") {
    return result.trim();
  }

  if (
    result &&
    typeof result === "object" &&
    "text" in result &&
    typeof (result as { text?: unknown }).text === "string"
  ) {
    return (result as { text: string }).text.trim();
  }

  return "";
}

function buildAsrOptions(languageId: string, chunkLengthSeconds: number, strideLengthSeconds: number) {
  const selectedLanguage = TRANSCRIPTION_LANGUAGE_OPTIONS.find(
    (option) => option.id === languageId
  );

  const options: {
    task: "transcribe";
    language?: string;
    chunk_length_s?: number;
    stride_length_s?: number;
  } = {
    task: "transcribe",
  };

  options.chunk_length_s = chunkLengthSeconds;
  options.stride_length_s = strideLengthSeconds;

  if (selectedLanguage?.whisperLanguage) {
    options.language = selectedLanguage.whisperLanguage;
  }

  return options;
}

type StreamCaptureNode = AudioWorkletNode | ScriptProcessorNode;

type StreamWorkerMessage =
  | { type: "model-ready"; requestId: number; modelId: string }
  | { type: "model-error"; requestId: number; modelId: string; error: string }
  | { type: "transcript"; sessionId: number; chunkId: number; text: string; cues: SubtitleCue[] }
  | { type: "chunk-error"; sessionId: number; chunkId: number; error: string };

type ActiveStreamRuntime = {
  context: AudioContext;
  source: MediaStreamAudioSourceNode;
  captureNode: StreamCaptureNode;
  sink: GainNode;
  stream: MediaStream;
  ownsStream: boolean;
  cancel: () => void;
  stopCapture: () => void;
  finish: () => Promise<void>;
};

export interface UseTranscriptionResult {
  status: TranscriptionStatus;
  error: string | null;
  transcript: string;
  cues: SubtitleCue[];
  progress: TranscriptionProgress | null;
  availableModels: WhisperModelOption[];
  selectedModelId: string;
  setSelectedModelId: (modelId: string) => void;
  availableLanguages: TranscriptionLanguageOption[];
  selectedLanguageId: string;
  setSelectedLanguageId: (languageId: string) => void;
  chunkCountMode: ChunkCountMode;
  setChunkCountMode: (mode: ChunkCountMode) => void;
  manualChunkCount: number;
  setManualChunkCount: (count: number) => void;
  transcribeFile: (file: File) => Promise<void>;
  isStreaming: boolean;
  isStreamStarting: boolean;
  liveWaveform: number[];
  startStream: (stream: MediaStream) => Promise<void>;
  startMicrophone: () => Promise<void>;
  stopStream: () => void;
  reset: () => void;
}

export function useTranscription(): UseTranscriptionResult {
  const [status, setStatus] = useState<TranscriptionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [progress, setProgress] = useState<TranscriptionProgress | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isStreamStarting, setIsStreamStarting] = useState(false);
  const [liveWaveform, setLiveWaveform] = useState<number[]>([]);
  const [selectedModelIdState, setSelectedModelIdState] = useState<string>(
    DEFAULT_WHISPER_MODEL_ID
  );
  const [selectedLanguageIdState, setSelectedLanguageIdState] = useState<string>(
    DEFAULT_TRANSCRIPTION_LANGUAGE_ID
  );
  const [chunkCountMode, setChunkCountMode] = useState<ChunkCountMode>("auto");
  const [manualChunkCount, setManualChunkCountState] = useState(4);
  const setManualChunkCount = useCallback((count: number) => {
    if (!Number.isFinite(count)) return;
    setManualChunkCountState(Math.max(1, Math.min(MAX_MANUAL_CHUNK_COUNT, Math.trunc(count))));
  }, []);

  // File transcription stays on the main-thread pipeline. Live transcription
  // uses a dedicated worker so heavy Whisper inference does not freeze the UI.
  const pipelineRef = useRef<any | null>(null);
  const loadedModelIdRef = useRef<string | null>(null);
  const streamWorkerRef = useRef<Worker | null>(null);
  const streamWorkerModelIdRef = useRef<string | null>(null);
  const streamWorkerInitRef = useRef<{
    modelId: string;
    promise: Promise<Worker>;
  } | null>(null);
  const workerRequestIdRef = useRef(0);
  const streamRuntimeRef = useRef<ActiveStreamRuntime | null>(null);
  const streamSessionIdRef = useRef(0);
  const streamControlQueueRef = useRef<Promise<void>>(Promise.resolve());

  const loadModel = useCallback(async (modelId: string) => {
    if (pipelineRef.current && loadedModelIdRef.current === modelId) {
      setStatus("ready");
      return pipelineRef.current;
    }

    setStatus("loading-model");
    setError(null);
    setProgress({
      percent: null,
      label: "Loading Whisper model...",
    });

    try {
      env.allowRemoteModels = true;
      if (env.backends?.onnx?.wasm) {
        env.backends.onnx.wasm.numThreads = 1;
      }

      const asr = await pipeline("automatic-speech-recognition", modelId, {
        dtype: "q8",
        progress_callback: (info: unknown) => {
          if (!info || typeof info !== "object") return;

          const event = info as {
            status?: string;
            progress?: number;
            file?: string;
          };

          if (
            event.status === "progress_total" &&
            typeof event.progress === "number"
          ) {
            const raw =
              event.progress <= 1 ? event.progress * 100 : event.progress;
            setProgress({
              percent: clampProgressPercent(raw),
              label: "Loading Whisper model...",
            });
            return;
          }

          if (event.status === "progress" && event.file) {
            setProgress((current) => ({
              percent: current?.percent ?? null,
              label: `Loading model file: ${event.file}`,
            }));
          }
        },
      });
      pipelineRef.current = asr;
      loadedModelIdRef.current = modelId;
      setStatus("ready");
      setProgress({
        percent: 100,
        label: "Whisper model loaded.",
      });
      return asr;
    } catch (e) {
      console.error(e);
      const message =
        e instanceof Error
          ? e.message
          : "Failed to load Whisper model in this browser.";
      setError(message);
      setProgress(null);
      setStatus("error");
      throw e;
    }
  }, []);

  const getStreamWorker = useCallback(() => {
    if (!streamWorkerRef.current) {
      streamWorkerRef.current = createStreamTranscriptionWorker();
    }
    return streamWorkerRef.current;
  }, []);

  const ensureStreamWorkerModel = useCallback(
    (modelId: string): Promise<Worker> => {
      const worker = getStreamWorker();
      if (streamWorkerModelIdRef.current === modelId) {
        return Promise.resolve(worker);
      }
      if (streamWorkerInitRef.current?.modelId === modelId) {
        return streamWorkerInitRef.current.promise;
      }

      const requestId = workerRequestIdRef.current + 1;
      workerRequestIdRef.current = requestId;
      const promise = new Promise<Worker>((resolve, reject) => {
        const cleanup = () => {
          clearTimeout(timeoutId);
          worker.removeEventListener("message", handleMessage);
          worker.removeEventListener("error", handleError);
          worker.removeEventListener("messageerror", handleMessageError);
        };
        const fail = (message: string) => {
          cleanup();
          if (streamWorkerRef.current === worker) {
            worker.terminate();
            streamWorkerRef.current = null;
            streamWorkerModelIdRef.current = null;
          }
          reject(new Error(message));
        };
        const handleMessage = (event: MessageEvent<StreamWorkerMessage>) => {
          const message = event.data;
          if (
            (message.type !== "model-ready" && message.type !== "model-error") ||
            message.requestId !== requestId
          ) {
            return;
          }

          if (message.type === "model-ready") {
            cleanup();
            streamWorkerModelIdRef.current = modelId;
            resolve(worker);
          } else {
            fail(message.error);
          }
        };
        const handleError = (event: ErrorEvent) => {
          const location = event.filename
            ? ` (${event.filename}:${event.lineno}:${event.colno})`
            : "";
          fail(`${event.message || "Whisper worker failed to start."}${location}`);
        };
        const handleMessageError = () => {
          fail("Whisper worker communication failed.");
        };
        const timeoutId = setTimeout(
          () => fail("Whisper worker model loading timed out."),
          STREAM_WORKER_INIT_TIMEOUT_MS
        );

        worker.addEventListener("message", handleMessage);
        worker.addEventListener("error", handleError);
        worker.addEventListener("messageerror", handleMessageError);
        worker.postMessage({ type: "init", requestId, modelId });
      }).finally(() => {
        if (streamWorkerInitRef.current?.modelId === modelId) {
          streamWorkerInitRef.current = null;
        }
      });

      streamWorkerInitRef.current = { modelId, promise };
      return promise;
    },
    [getStreamWorker]
  );

  const enqueueStreamControl = useCallback((task: () => Promise<void>) => {
    const run = async () => {
      // Yield one turn so the click/paint can complete before finalization work.
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      await task();
    };
    streamControlQueueRef.current = streamControlQueueRef.current
      .then(run, run)
      .catch((queueError) => {
        console.error("Stream control queue failed", queueError);
      });
  }, []);

  const appendTranscript = useCallback((nextText: string) => {
    const normalized = nextText.trim();
    if (!normalized) return;
    setTranscript((current) => {
      const previous = current.trim();
      return previous ? `${previous} ${normalized}` : normalized;
    });
  }, []);

  const cancelActiveStream = useCallback(() => {
    streamSessionIdRef.current += 1;
    const runtime = streamRuntimeRef.current;
    streamRuntimeRef.current = null;
    runtime?.cancel();
    setLiveWaveform([]);
    setIsStreamStarting(false);
    setIsStreaming(false);
    setProgress(null);
  }, []);

  const setSelectedModelId = useCallback(
    (modelId: string) => {
      if (!WHISPER_MODEL_OPTIONS.some((option) => option.id === modelId)) return;
      cancelActiveStream();
      setSelectedModelIdState(modelId);
      setTranscript("");
      setCues([]);
      setError(null);
      setStatus("idle");
    },
    [cancelActiveStream]
  );

  const setSelectedLanguageId = useCallback(
    (languageId: string) => {
      if (!TRANSCRIPTION_LANGUAGE_OPTIONS.some((option) => option.id === languageId)) return;
      cancelActiveStream();
      setSelectedLanguageIdState(languageId);
      setTranscript("");
      setCues([]);
      setError(null);
      setStatus("idle");
    },
    [cancelActiveStream]
  );

  const transcribeFile = useCallback(
    async (file: File) => {
      if (!file) return;
      cancelActiveStream();
      setError(null);
      setTranscript("");
      setCues([]);

      try {
        const asr = await loadModel(selectedModelIdState);
        setStatus("transcribing");
        setProgress({
          percent: null,
          label: "Reading media file...",
        });

        const arrayBuffer = await file.arrayBuffer();
        const audioContext = new AudioContext({ sampleRate: WHISPER_SAMPLE_RATE });
        let audioBuffer: AudioBuffer;

        setProgress({
          percent: null,
          label: "Decoding audio...",
        });

        try {
          audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
        } catch (decodeError) {
          const isMkv =
            file.name.toLowerCase().endsWith(".mkv") ||
            file.type === "video/x-matroska" ||
            file.type === "video/matroska";
          if (isMkv) {
            throw new Error(
              "This browser could not decode the selected MKV file. " +
                "MKV selection is allowed, but transcription still depends on the browser's built-in media decoder. " +
                "Please try Chrome/Edge, or convert/extract the audio to MP3, WAV, M4A, MP4, or WebM."
            );
          }
          throw decodeError;
        } finally {
          void audioContext.close();
        }

        const channelData = mixToMono(audioBuffer);
        const chunkPlan = planFileChunks(channelData.length, chunkCountMode, manualChunkCount);
        const totalChunks = chunkPlan.count;
        let completedChunks = 0;

        setProgress({
          percent: 0,
          label: `Transcribing chunk 0 of ${totalChunks}...`,
        });

        const streamer = new WhisperTextStreamer(asr.tokenizer, {
          skip_prompt: true,
          on_finalize: () => {
            completedChunks = Math.min(totalChunks, completedChunks + 1);
            const percent = Math.min(
              99,
              clampProgressPercent((completedChunks / totalChunks) * 100)
            );
            setProgress({
              percent,
              label: `Transcribing chunk ${completedChunks} of ${totalChunks}...`,
            });
          },
        });

        const result = await asr(channelData, {
          ...buildAsrOptions(selectedLanguageIdState, chunkPlan.chunkLengthSeconds, chunkPlan.strideLengthSeconds),
          return_timestamps: true,
          streamer,
        });
        setTranscript(extractTranscriptText(result));
        setCues(extractWhisperCues(result, audioBuffer.duration));
        setProgress({
          percent: 100,
          label: chunkCountMode === "manual" && manualChunkCount !== totalChunks
            ? `Transcription complete (${totalChunks} chunks; requested ${manualChunkCount}).`
            : `Transcription complete (${totalChunks} chunks).`,
        });
        setStatus("done");
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : "Failed to run transcription.");
        setProgress(null);
        setStatus("error");
      }
    },
    [cancelActiveStream, loadModel, selectedLanguageIdState, selectedModelIdState, chunkCountMode, manualChunkCount]
  );

  const startStreamInternal = useCallback(
    async (stream: MediaStream, ownsStream: boolean) => {
      if (!stream || stream.getAudioTracks().length === 0) {
        setError("The supplied MediaStream does not contain an audio track.");
        setStatus("error");
        if (ownsStream) stream?.getTracks().forEach((track) => track.stop());
        return;
      }

      cancelActiveStream();
      const sessionId = streamSessionIdRef.current + 1;
      streamSessionIdRef.current = sessionId;
      setIsStreamStarting(true);
      setLiveWaveform([]);
      setError(null);
      setTranscript("");
      setCues([]);
      setStatus("starting-stream");

      try {
        const worker = await ensureStreamWorkerModel(selectedModelIdState);
        if (sessionId !== streamSessionIdRef.current) {
          if (ownsStream) stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const context = new AudioContext({ sampleRate: WHISPER_SAMPLE_RATE });
        const source = context.createMediaStreamSource(stream);
        const sink = context.createGain();
        sink.gain.value = 0;

        let captureNode: StreamCaptureNode;
        let detachCaptureHandler: () => void;
        let capturedChunks: Float32Array[] = [];
        let capturedSampleCount = 0;
        let stopRequested = false;
        let cancelled = false;
        let streamFailed = false;
        let pendingChunks = 0;
        let chunkId = 0;
        let sentSampleCount = 0;
        let finishPromise: Promise<void> | null = null;
        let resolveFinish: (() => void) | null = null;
        let lastWaveformUpdate = 0;

        const selectedLanguage = TRANSCRIPTION_LANGUAGE_OPTIONS.find(
          (option) => option.id === selectedLanguageIdState
        );
        const streamWindowSamples = Math.max(
          1,
          Math.round(context.sampleRate * STREAM_WINDOW_SECONDS)
        );
        const minFlushSamples = Math.max(
          1,
          Math.round(context.sampleRate * MIN_STREAM_FLUSH_SECONDS)
        );

        let graphCleaned = false;
        const cleanupGraph = () => {
          if (graphCleaned) return;
          graphCleaned = true;
          detachCaptureHandler();
          try { source.disconnect(); } catch { /* already disconnected */ }
          try { captureNode.disconnect(); } catch { /* already disconnected */ }
          try { sink.disconnect(); } catch { /* already disconnected */ }
          void context.close();
          if (ownsStream) stream.getTracks().forEach((track) => track.stop());
        };

        const finishIfDrained = () => {
          if (!stopRequested || pendingChunks > 0) return;
          resolveFinish?.();
          resolveFinish = null;
          if (!cancelled && !streamFailed && sessionId === streamSessionIdRef.current) {
            setStatus("done");
          }
        };

        const handleWorkerMessage = (event: MessageEvent<StreamWorkerMessage>) => {
          const message = event.data;
          if (
            (message.type !== "transcript" && message.type !== "chunk-error") ||
            message.sessionId !== sessionId
          ) {
            return;
          }

          pendingChunks = Math.max(0, pendingChunks - 1);
          if (message.type === "transcript") {
            appendTranscript(message.text);
            setCues((previous) => [...previous, ...(message.cues ?? [])]);
          } else {
            streamFailed = true;
            stopRequested = true;
            cleanupGraph();
            setLiveWaveform([]);
            setIsStreaming(false);
            setError(message.error);
            setStatus("error");
          }
          finishIfDrained();
        };
        worker.addEventListener("message", handleWorkerMessage);

        const postPcm = (nativePcm: Float32Array) => {
          const startSeconds = sentSampleCount / context.sampleRate;
          sentSampleCount += nativePcm.length;
          const pcm = resampleLinear(
            nativePcm,
            context.sampleRate,
            WHISPER_SAMPLE_RATE
          );
          const nextChunkId = chunkId + 1;
          chunkId = nextChunkId;
          pendingChunks += 1;
          worker.postMessage(
            {
              type: "transcribe",
              sessionId,
              chunkId: nextChunkId,
              pcm: pcm.buffer,
              startSeconds,
              language: selectedLanguage?.whisperLanguage,
            },
            [pcm.buffer]
          );
        };

        const flushCapturedAudio = (force: boolean) => {
          if (
            capturedSampleCount < streamWindowSamples &&
            !(force && capturedSampleCount >= minFlushSamples)
          ) return;

          const nativePcm = concatFloat32(capturedChunks);
          capturedChunks = [];
          capturedSampleCount = 0;
          postPcm(nativePcm);
        };

        const updateLiveWaveform = (pcm: Float32Array) => {
          const now = performance.now();
          if (now - lastWaveformUpdate < 50) return;
          lastWaveformUpdate = now;
          setLiveWaveform(sampleLiveWaveform(pcm));
        };

        const handlePcm = (pcm: Float32Array) => {
          if (cancelled || stopRequested || pcm.length === 0) return;
          updateLiveWaveform(pcm);
          capturedChunks.push(pcm);
          capturedSampleCount += pcm.length;
          flushCapturedAudio(false);
        };

        if (context.audioWorklet && typeof AudioWorkletNode !== "undefined") {
          const processorSource = `
class WhisperPcmCaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (input && input.length > 0 && input[0]) {
      const frameLength = input[0].length;
      const mono = new Float32Array(frameLength);
      for (let channel = 0; channel < input.length; channel += 1) {
        const data = input[channel];
        if (!data) continue;
        for (let i = 0; i < frameLength; i += 1) mono[i] += data[i] / input.length;
      }
      this.port.postMessage(mono, [mono.buffer]);
    }
    return true;
  }
}
registerProcessor("whisper-pcm-capture", WhisperPcmCaptureProcessor);
`;
          const moduleUrl = URL.createObjectURL(
            new Blob([processorSource], { type: "application/javascript" })
          );
          try {
            await context.audioWorklet.addModule(moduleUrl);
          } finally {
            URL.revokeObjectURL(moduleUrl);
          }

          const workletNode = new AudioWorkletNode(context, "whisper-pcm-capture");
          workletNode.port.onmessage = (event: MessageEvent<Float32Array>) => {
            handlePcm(new Float32Array(event.data));
          };
          captureNode = workletNode;
          detachCaptureHandler = () => { workletNode.port.onmessage = null; };
        } else {
          const scriptNode = context.createScriptProcessor(4096, 1, 1);
          scriptNode.onaudioprocess = (event) => {
            handlePcm(new Float32Array(event.inputBuffer.getChannelData(0)));
          };
          captureNode = scriptNode;
          detachCaptureHandler = () => { scriptNode.onaudioprocess = null; };
        }

        source.connect(captureNode);
        captureNode.connect(sink);
        sink.connect(context.destination);
        await context.resume();

        if (sessionId !== streamSessionIdRef.current) {
          cleanupGraph();
          worker.removeEventListener("message", handleWorkerMessage);
          return;
        }

        const runtime: ActiveStreamRuntime = {
          context,
          source,
          captureNode,
          sink,
          stream,
          ownsStream,
          cancel: () => {
            if (cancelled) return;
            cancelled = true;
            stopRequested = true;
            capturedChunks = [];
            capturedSampleCount = 0;
            cleanupGraph();
            setLiveWaveform([]);
            worker.postMessage({ type: "cancel-session", sessionId });
            worker.removeEventListener("message", handleWorkerMessage);
            resolveFinish?.();
            resolveFinish = null;
          },
          stopCapture: () => {
            if (cancelled || stopRequested) return;
            stopRequested = true;
            cleanupGraph();
            setLiveWaveform([]);
            flushCapturedAudio(true);
            finishIfDrained();
          },
          finish: async () => {
            if (pendingChunks > 0) {
              if (!finishPromise) {
                finishPromise = new Promise<void>((resolve) => {
                  resolveFinish = resolve;
                });
              }
              await finishPromise;
            }
            worker.removeEventListener("message", handleWorkerMessage);
          },
        };

        streamRuntimeRef.current = runtime;
        setIsStreamStarting(false);
        setIsStreaming(true);
        setStatus("streaming");
      } catch (e) {
        console.error(e);
        if (ownsStream) stream.getTracks().forEach((track) => track.stop());
        if (sessionId !== streamSessionIdRef.current) return;
        setError(e instanceof Error ? e.message : "Failed to start live audio transcription.");
        setLiveWaveform([]);
        setIsStreamStarting(false);
        setIsStreaming(false);
        setStatus("error");
      }
    },
    [
      appendTranscript,
      cancelActiveStream,
      ensureStreamWorkerModel,
      selectedLanguageIdState,
      selectedModelIdState,
    ]
  );

  const startStream = useCallback(
    async (stream: MediaStream) => {
      await startStreamInternal(stream, false);
    },
    [startStreamInternal]
  );

  const startMicrophone = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Microphone capture is not supported by this browser.");
      setStatus("error");
      return;
    }

    cancelActiveStream();
    const requestId = streamSessionIdRef.current + 1;
    streamSessionIdRef.current = requestId;
    setIsStreamStarting(true);
    setLiveWaveform([]);
    setError(null);
    setStatus("loading-model");

    try {
      // Heavy model initialization runs in a Worker, so Stop remains clickable.
      await ensureStreamWorkerModel(selectedModelIdState);
      if (requestId !== streamSessionIdRef.current) return;

      setStatus("starting-stream");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      if (requestId !== streamSessionIdRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      setIsStreamStarting(false);
      await startStreamInternal(stream, true);
    } catch (e) {
      if (requestId !== streamSessionIdRef.current) return;
      console.error(e);
      setError(
        e instanceof Error ? e.message : "Microphone permission was denied or unavailable."
      );
      setLiveWaveform([]);
      setIsStreamStarting(false);
      setStatus("error");
      setIsStreaming(false);
    }
  }, [
    cancelActiveStream,
    ensureStreamWorkerModel,
    selectedModelIdState,
    startStreamInternal,
  ]);

  const stopStream = useCallback(() => {
    const runtime = streamRuntimeRef.current;

    if (!runtime) {
      // Cancels an in-flight worker model load / permission request immediately.
      streamSessionIdRef.current += 1;
      setLiveWaveform([]);
      setIsStreamStarting(false);
      setIsStreaming(false);
      setStatus(streamWorkerModelIdRef.current ? "ready" : "idle");
      return;
    }

    // Immediate phase: stop the microphone and update UI before any final ASR wait.
    streamRuntimeRef.current = null;
    setLiveWaveform([]);
    setIsStreamStarting(false);
    setIsStreaming(false);
    setStatus("finalizing-stream");
    runtime.stopCapture();

    // Deferred phase: wait for worker-transcribed buffered chunks without blocking UI.
    enqueueStreamControl(async () => {
      await runtime.finish();
    });
  }, [enqueueStreamControl]);

  const reset = useCallback(() => {
    cancelActiveStream();
    setTranscript("");
    setCues([]);
    setError(null);
    setLiveWaveform([]);
    setProgress(null);
    setStatus("idle");
  }, [cancelActiveStream]);

  useEffect(() => {
    return () => {
      streamSessionIdRef.current += 1;
      const runtime = streamRuntimeRef.current;
      streamRuntimeRef.current = null;
      runtime?.cancel();
      streamWorkerRef.current?.terminate();
      streamWorkerRef.current = null;
    };
  }, []);

  return {
    status,
    error,
    transcript,
    cues,
    progress,
    availableModels: WHISPER_MODEL_OPTIONS,
    selectedModelId: selectedModelIdState,
    setSelectedModelId,
    availableLanguages: TRANSCRIPTION_LANGUAGE_OPTIONS,
    selectedLanguageId: selectedLanguageIdState,
    setSelectedLanguageId,
    chunkCountMode,
    setChunkCountMode,
    manualChunkCount,
    setManualChunkCount,
    transcribeFile,
    isStreaming,
    isStreamStarting,
    liveWaveform,
    startStream,
    startMicrophone,
    stopStream,
    reset,
  };
}
