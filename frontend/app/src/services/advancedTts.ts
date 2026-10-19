/** Browser-only Pocket TTS voice cloning. Heavy inference stays inside the library Web Worker. */
export const ADVANCED_SAMPLE_RATE = 24000;
export const MAX_REFERENCE_BYTES = 100 * 1024 * 1024;

export type AdvancedTtsOptions = { voiceSample: File };

// Pocket TTS owns its own Web Worker. Keep one instance so models and the
// encoded reference voice can be reused without downloading/re-encoding.
type PocketEngine = import("pocket-tts-js").PocketTTS;
let enginePromise: Promise<PocketEngine> | null = null;
let activeEngine: PocketEngine | null = null;
let lastVoice: { fingerprint: string; id: string } | null = null;

async function loadPocket(
  onProgress?: (label: string, percent: number | null) => void
): Promise<PocketEngine> {
  if (!enginePromise) {
    enginePromise = import("pocket-tts-js").then(async ({ PocketTTS }) => {
      const engine = new PocketTTS({
        language: "english_2026-04", quantized: true,
        voiceCloning: true, cache: true,
      });
      try {
        await engine.load((progress) => {
          const percent = typeof progress.loaded === "number" && progress.total && progress.total > 0
            ? Math.min(100, Math.round(progress.loaded / progress.total * 100))
            : null;
          onProgress?.(progress.label || progress.status || "Loading Pocket TTS", percent);
        });
        activeEngine = engine;
        return engine;
      } catch (error) {
        engine.destroy();
        throw error;
      }
    }).catch((error: unknown) => {
      enginePromise = null;
      throw error;
    });
  }
  return enginePromise;
}

/** Stop an ongoing Pocket TTS generation, not the Kokoro model. */
export function cancelClonedSpeech(): void {
  if (activeEngine) void activeEngine.stop().catch(() => { /* already stopped */ });
}

/** Testable helper: join streaming PCM chunks into one contiguous WAV buffer. */
export function joinAudioChunks(chunks: Float32Array[]): Float32Array {
  const length = chunks.reduce((total, samples) => total + samples.length, 0);
  const audio = new Float32Array(length);
  let offset = 0;
  for (const samples of chunks) {
    audio.set(samples, offset);
    offset += samples.length;
  }
  return audio;
}

/** Read only local audio. Keep the decoded buffer out of persistent storage. */
async function decodeReferenceFile(file: File): Promise<AudioBuffer> {
  if (!file.size) throw new Error("The reference recording is empty. Record at least 2 seconds of speech.");
  if (file.size > MAX_REFERENCE_BYTES) throw new Error("Reference audio must be smaller than 100 MB.");
  const context = new AudioContext();
  try {
    return await context.decodeAudioData(await file.arrayBuffer());
  } catch {
    throw new Error("The browser could not decode this recording. Try a PCM WAV file or record again.");
  } finally {
    await context.close();
  }
}

export async function inspectReferenceDuration(file: File): Promise<number> {
  const decoded = await decodeReferenceFile(file);
  return decoded.duration;
}

/**
 * Voice cloning works best with short, clearly voiced audio. For long files
 * select the most energetic ten-second interval instead of always using the start.
 * Sampling a coarse energy envelope keeps this cheap even for long recordings.
 */
export function referenceWindow(decoded: AudioBuffer): { offset: number; duration: number } {
  const duration = decoded.duration;
  if (duration <= 10) return { offset: 0, duration };

  const channel = decoded.getChannelData(0);
  const rate = decoded.sampleRate;
  const blockSize = Math.max(1, Math.floor(rate / 2)); // 0.5-second blocks
  const energies: number[] = [];
  const stride = Math.max(1, Math.floor(rate / 200)); // ~200 samples / second
  for (let start = 0; start < channel.length; start += blockSize) {
    let sum = 0;
    for (let i = start; i < Math.min(channel.length, start + blockSize); i += stride) {
      sum += channel[i] * channel[i];
    }
    energies.push(sum);
  }
  const width = 20; // ten seconds, in 0.5-second blocks
  let windowEnergy = 0;
  for (let i = 0; i < width; i++) windowEnergy += energies[i] ?? 0;
  let bestEnergy = windowEnergy;
  let bestIndex = 0;
  for (let i = width; i < energies.length; i++) {
    windowEnergy += energies[i] - energies[i - width];
    if (windowEnergy > bestEnergy) {
      bestEnergy = windowEnergy;
      bestIndex = i - width + 1;
    }
  }
  return { offset: Math.min(bestIndex * 0.5, duration - 10), duration: 10 };
}

/** Decode and resample within the browser. No recording is uploaded. */
export async function decodeVoiceSample(file: File): Promise<Float32Array> {
  const decoded = await decodeReferenceFile(file);
  const duration = decoded.duration;
  if (!Number.isFinite(duration) || duration < 2) {
    const actual = Number.isFinite(duration) ? `${duration.toFixed(2)}s` : "unknown";
    throw new Error(`Reference audio is ${actual}; record at least 2 seconds (5–10 seconds recommended).`);
  }
  const segment = referenceWindow(decoded);
  const count = Math.round(segment.duration * ADVANCED_SAMPLE_RATE);
  const offline = new OfflineAudioContext(1, count, ADVANCED_SAMPLE_RATE);
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start(0, segment.offset, segment.duration);
  const rendered = await offline.startRendering();
  return new Float32Array(rendered.getChannelData(0));
}

export function encodeWav(samples: Float32Array, sampleRate = ADVANCED_SAMPLE_RATE): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const ascii = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
  };
  ascii(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  ascii(36, "data");
  view.setUint32(40, samples.length * 2, true);
  samples.forEach((v, i) => {
    const sample = Math.max(-1, Math.min(1, v));
    view.setInt16(44 + i * 2, sample < 0 ? Math.round(sample * 32768) : Math.round(sample * 32767), true);
  });
  return new Blob([buffer], { type: "audio/wav" });
}

/** Encode a short reference voice and synthesize entirely within the browser. */
export async function synthesizeClonedSpeech(
  text: string,
  options: AdvancedTtsOptions,
  onModelReady?: () => void,
  onModelProgress?: (label: string, percent: number | null) => void
): Promise<Blob> {
  if (!options.voiceSample) throw new Error("Choose or record a reference voice first.");
  if (/[\u3040-\u30ff\u3400-\u9fff]/u.test(text)) {
    throw new Error("Pocket TTS Advanced Mode currently supports English only. Use Kokoro for Japanese.");
  }
  const samples = await decodeVoiceSample(options.voiceSample);
  const engine = await loadPocket(onModelProgress);
  onModelReady?.();
  // IndexedDB stores reference recordings, while the in-memory clone is reused
  // until another reference file is chosen. No user audio goes to a server.
  const fingerprintBuffer = await crypto.subtle.digest("SHA-256", new Uint8Array(samples.buffer as ArrayBuffer));
  const fingerprint = Array.from(new Uint8Array(fingerprintBuffer),
    (byte) => byte.toString(16).padStart(2, "0")).join("");
  let voice = lastVoice?.fingerprint === fingerprint ? lastVoice.id : null;
  if (!voice) {
    onModelProgress?.("Encoding reference voice locally", null);
    voice = await engine.cloneVoice(samples, { inputSampleRate: ADVANCED_SAMPLE_RATE });
    lastVoice = { fingerprint, id: voice };
  }
  onModelProgress?.("Generating cloned speech locally", null);
  const chunks: Float32Array[] = [];
  const metrics = await engine.generate(text, {
    voice,
    onChunk: (chunk) => chunks.push(new Float32Array(chunk)),
  });
  if (metrics.stopped) throw new Error("Voice generation was cancelled.");
  if (!chunks.length) throw new Error("Pocket TTS returned no audio.");
  return encodeWav(joinAudioChunks(chunks), engine.sampleRate);
}
