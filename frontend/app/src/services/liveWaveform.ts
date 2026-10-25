export const LIVE_WAVEFORM_POINTS = 96;

/** Take a small signed PCM snapshot for display; never modifies captured audio. */
export function sampleLiveWaveform(
  pcm: Float32Array,
  pointCount = LIVE_WAVEFORM_POINTS
): number[] {
  if (!pcm.length || pointCount <= 0) return [];
  if (pointCount === 1) return [pcm[pcm.length - 1]];

  return Array.from({ length: pointCount }, (_, index) => {
    const sample = Math.round((index * (pcm.length - 1)) / (pointCount - 1));
    return Math.max(-1, Math.min(1, pcm[sample]));
  });
}
