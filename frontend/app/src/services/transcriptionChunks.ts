/** Whisper has a 30-second audio context. Plan file chunks in sample units so
 * the progress counter uses the same boundaries as the ASR pipeline. */
export type ChunkCountMode = "auto" | "manual";

export const MAX_MANUAL_CHUNK_COUNT = 256;

const SAMPLE_RATE = 16_000;
const MAX_CHUNK_SAMPLES = 30 * SAMPLE_RATE;
const AUTO_STRIDE_SAMPLES = 5 * SAMPLE_RATE;
const MIN_MANUAL_CHUNK_SECONDS = 5;

export interface FileChunkPlan {
  count: number;
  chunkLengthSeconds: number;
  strideLengthSeconds: number;
}

function countChunks(sampleCount: number, chunkSamples: number, strideSamples: number): number {
  if (sampleCount <= chunkSamples) return 1;
  const step = chunkSamples - 2 * strideSamples;
  return Math.ceil((sampleCount - chunkSamples) / step) + 1;
}

export function planFileChunks(
  sampleCount: number,
  mode: ChunkCountMode,
  requestedCount: number
): FileChunkPlan {
  const samples = Math.max(0, Math.floor(sampleCount));

  if (mode === "auto") {
    // Fewest 30-second windows with a 5-second overlap at each boundary.
    return {
      count: countChunks(samples, MAX_CHUNK_SAMPLES, AUTO_STRIDE_SAMPLES),
      chunkLengthSeconds: MAX_CHUNK_SAMPLES / SAMPLE_RATE,
      strideLengthSeconds: AUTO_STRIDE_SAMPLES / SAMPLE_RATE,
    };
  }

  // There is no way to fit more than 30 seconds into a Whisper window; very
  // short windows are also avoided because they hurt transcription quality.
  const minimum = Math.max(1, Math.ceil(samples / MAX_CHUNK_SAMPLES));
  const maximum = Math.max(minimum, Math.floor(samples / (MIN_MANUAL_CHUNK_SECONDS * SAMPLE_RATE)));
  const safeRequested = Number.isFinite(requestedCount) ? Math.trunc(requestedCount) : 1;
  const target = Math.max(minimum, Math.min(maximum, Math.max(1, safeRequested)));

  if (target === 1) {
    return { count: 1, chunkLengthSeconds: 30, strideLengthSeconds: 0 };
  }

  // Solve for a window size and overlap which produce the requested count:
  // samples <= target * window - 2 * (target - 1) * overlap.
  // Reduce the overlap if necessary to stay within Whisper's 30 s context.
  const strideSamples = Math.max(0, Math.min(
    AUTO_STRIDE_SAMPLES,
    Math.floor(samples / (4 * target)),
    Math.floor((target * MAX_CHUNK_SAMPLES - samples) / (2 * (target - 1)))
  ));
  const chunkSamples = Math.min(
    MAX_CHUNK_SAMPLES,
    Math.ceil((samples + 2 * (target - 1) * strideSamples) / target)
  );
  return {
    count: countChunks(samples, chunkSamples, strideSamples),
    chunkLengthSeconds: chunkSamples / SAMPLE_RATE,
    strideLengthSeconds: strideSamples / SAMPLE_RATE,
  };
}
