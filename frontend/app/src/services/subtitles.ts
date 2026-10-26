export interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

export type SubtitleFormat = "srt" | "vtt";

function finiteSeconds(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function cleanText(value: unknown): string {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").replace(/-->/g, "→").trim()
    : "";
}

/** Convert Whisper's segment-relative timestamps into absolute subtitle cues. */
export function extractWhisperCues(
  result: unknown,
  durationSeconds: number,
  offsetSeconds = 0
): SubtitleCue[] {
  const duration = Math.max(0, finiteSeconds(durationSeconds) ?? 0);
  const offset = Math.max(0, finiteSeconds(offsetSeconds) ?? 0);
  const output = result && typeof result === "object"
    ? result as { text?: unknown; chunks?: unknown }
    : null;
  const chunks = Array.isArray(output?.chunks) ? output.chunks : [];
  const cues: SubtitleCue[] = [];

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index] as { text?: unknown; timestamp?: unknown } | null;
    if (!chunk || !Array.isArray(chunk.timestamp)) continue;
    const text = cleanText(chunk.text);
    const start = finiteSeconds(chunk.timestamp[0]);
    if (!text || start === null) continue;

    const next = chunks[index + 1] as { timestamp?: unknown } | null | undefined;
    const nextStart = next && Array.isArray(next.timestamp)
      ? finiteSeconds(next.timestamp[0]) : null;
    const reportedEnd = finiteSeconds(chunk.timestamp[1]);
    const localStart = Math.min(duration, Math.max(0, start));
    const localEnd = Math.min(duration, Math.max(0,
      reportedEnd ?? nextStart ?? duration
    ));
    if (localEnd <= localStart) continue;
    cues.push({ start: offset + localStart, end: offset + localEnd, text });
  }

  if (cues.length > 0) return cues;

  // Some model outputs have no segment timestamps. A single full-duration cue
  // is an explicit approximation, never fabricated word-level timing.
  const text = cleanText(output?.text ?? result);
  return text && duration > 0
    ? [{ start: offset, end: offset + duration, text }]
    : [];
}

function timestamp(seconds: number, format: SubtitleFormat): string {
  const totalMs = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(totalMs / 3_600_000);
  const minutes = Math.floor(totalMs / 60_000) % 60;
  const secs = Math.floor(totalMs / 1000) % 60;
  const millis = totalMs % 1000;
  const two = (value: number) => String(value).padStart(2, "0");
  const three = (value: number) => String(value).padStart(3, "0");
  const separator = format === "srt" ? "," : ".";
  return `${two(hours)}:${two(minutes)}:${two(secs)}${separator}${three(millis)}`;
}

export function serializeSubtitles(cues: SubtitleCue[], format: SubtitleFormat): string {
  const valid = cues.filter((cue) => Number.isFinite(cue.start) &&
    Number.isFinite(cue.end) && cue.end > cue.start && cleanText(cue.text));
  const blocks = valid.map((cue, index) => {
    const timing = `${timestamp(cue.start, format)} --> ${timestamp(cue.end, format)}`;
    const lines = [timing, cleanText(cue.text)];
    if (format === "srt") lines.unshift(String(index + 1));
    return lines.join(format === "srt" ? "\r\n" : "\n");
  });
  if (format === "vtt") return `WEBVTT\n\n${blocks.join("\n\n")}${blocks.length ? "\n" : ""}`;
  return blocks.length ? `${blocks.join("\r\n\r\n")}\r\n` : "";
}
