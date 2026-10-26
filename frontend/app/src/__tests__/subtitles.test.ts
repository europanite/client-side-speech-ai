import { extractWhisperCues, serializeSubtitles } from "../services/subtitles";

describe("subtitle export", () => {
  it("converts Whisper segment timestamps and preserves Unicode", () => {
    const cues = extractWhisperCues({
      text: "Hello 世界",
      chunks: [
        { timestamp: [0.25, 1.5], text: " Hello" },
        { timestamp: [1.5, null], text: " 世界" },
      ],
    }, 3);
    expect(cues).toEqual([
      { start: 0.25, end: 1.5, text: "Hello" },
      { start: 1.5, end: 3, text: "世界" },
    ]);
    expect(serializeSubtitles(cues, "srt")).toBe(
      "1\r\n00:00:00,250 --> 00:00:01,500\r\nHello\r\n\r\n" +
      "2\r\n00:00:01,500 --> 00:00:03,000\r\n世界\r\n"
    );
    expect(serializeSubtitles(cues, "vtt")).toBe(
      "WEBVTT\n\n00:00:00.250 --> 00:00:01.500\nHello\n\n" +
      "00:00:01.500 --> 00:00:03.000\n世界\n"
    );
  });

  it("adds an absolute offset for microphone windows", () => {
    expect(extractWhisperCues({ text: "live" }, 6, 12)).toEqual([
      { start: 12, end: 18, text: "live" },
    ]);
  });

  it("uses the recording duration when timestamps are absent", () => {
    expect(extractWhisperCues({ text: "all speech" }, 4.5)).toEqual([
      { start: 0, end: 4.5, text: "all speech" },
    ]);
    expect(extractWhisperCues({ text: "" }, 4.5)).toEqual([]);
  });

  it("ignores empty or invalid intervals and formats times over one hour", () => {
    expect(serializeSubtitles([
      { start: 3601.234, end: 3602.5, text: "long" },
      { start: 3, end: 2, text: "bad" },
    ], "vtt")).toContain("01:00:01.234 --> 01:00:02.500");
    expect(serializeSubtitles([], "vtt")).toBe("WEBVTT\n\n");
  });
});
