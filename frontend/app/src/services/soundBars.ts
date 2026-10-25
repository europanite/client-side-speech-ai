export const SOUND_BAR_COUNT = 24;

/** Log-spaced spectrum groups from a browser AnalyserNode (0–1). */
export function frequencyDataToBars(
  frequencies: Uint8Array,
  barCount = SOUND_BAR_COUNT
): number[] {
  if (barCount <= 0) return [];
  if (!frequencies.length) return Array(barCount).fill(0);
  return Array.from({ length: barCount }, (_, index) => {
    const start = Math.min(frequencies.length - 1,
      Math.floor(Math.pow(frequencies.length, index / barCount)));
    const end = Math.max(start + 1,
      Math.min(frequencies.length, Math.ceil(Math.pow(frequencies.length, (index + 1) / barCount))));
    let total = 0;
    for (let bin = start; bin < end; bin += 1) total += frequencies[bin];
    return Math.min(1, total / (255 * (end - start)));
  });
}

/** Frequency-band energy from the microphone PCM snapshot, without changing the audio. */
export function pcmToSoundBars(
  samples: readonly number[],
  barCount = SOUND_BAR_COUNT
): number[] {
  if (barCount <= 0) return [];
  const size = samples.length;
  if (size < 4) return Array(barCount).fill(0);

  return Array.from({ length: barCount }, (_, index) => {
    const bin = Math.min(Math.floor(size / 2) - 1,
      Math.max(1, Math.round(Math.pow(size / 2 - 1, (index + 1) / barCount))));
    let real = 0;
    let imaginary = 0;
    for (let sample = 0; sample < size; sample += 1) {
      const window = 0.5 - 0.5 * Math.cos(2 * Math.PI * sample / (size - 1));
      const angle = 2 * Math.PI * bin * sample / size;
      real += samples[sample] * window * Math.cos(angle);
      imaginary -= samples[sample] * window * Math.sin(angle);
    }
    const magnitude = Math.hypot(real, imaginary) * 4 / size;
    return Math.min(1, Math.sqrt(Math.max(0, magnitude)));
  });
}
