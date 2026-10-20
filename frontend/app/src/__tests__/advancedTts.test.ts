import { encodeWav, joinAudioChunks, referenceWindow } from "../services/advancedTts";

describe("Advanced TTS WAV serialization", () => {
  it("produces a valid mono 24 kHz RIFF PCM header", async () => {
    const audio = encodeWav(new Float32Array([0, 0.5, -1]));
    const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(audio);
    });
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);
    expect(String.fromCharCode(...bytes.slice(0, 4))).toBe("RIFF");
    expect(view.getUint32(24, true)).toBe(24000);
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint16(34, true)).toBe(16);
    expect(view.getUint32(40, true)).toBe(6);
    expect(view.getInt16(46, true)).toBe(16384);
    expect(view.getInt16(48, true)).toBe(-32768);
  });
});


describe("Advanced TTS reference selection", () => {
  it("retains short recordings as-is", () => {
    const samples = new Float32Array(24000 * 5);
    const audio = { duration: 5, sampleRate: 24000, getChannelData: () => samples } as unknown as AudioBuffer;
    expect(referenceWindow(audio)).toEqual({ offset: 0, duration: 5 });
  });

  it("selects an energetic ten-second section of a long file", () => {
    const rate = 200;
    const samples = new Float32Array(rate * 40);
    samples.fill(0.5, rate * 25, rate * 34);
    const audio = { duration: 40, sampleRate: rate, getChannelData: () => samples } as unknown as AudioBuffer;
    const result = referenceWindow(audio);
    expect(result.duration).toBe(10);
    expect(result.offset).toBeGreaterThanOrEqual(24);
    expect(result.offset).toBeLessThanOrEqual(25);
  });
});


describe("Pocket TTS PCM chunk assembly", () => {
  it("keeps the chunk order and exact sample count", () => {
    const joined = joinAudioChunks([new Float32Array([0.1, 0.2]), new Float32Array([-0.3])]);
    expect(joined.length).toBe(3);
    expect(joined[0]).toBeCloseTo(0.1);
    expect(joined[1]).toBeCloseTo(0.2);
    expect(joined[2]).toBeCloseTo(-0.3);
  });
});
