import { planFileChunks } from "../services/transcriptionChunks";

const samples = (seconds: number) => seconds * 16_000;

describe("Whisper file chunk planning", () => {
  it("transcribes short clips in a single chunk in auto mode", () => {
    expect(planFileChunks(samples(25), "auto", 4)).toEqual({
      count: 1, chunkLengthSeconds: 30, strideLengthSeconds: 5,
    });
  });

  it("automatically minimizes 30-second chunks while preserving 5-second overlaps", () => {
    expect(planFileChunks(samples(60), "auto", 1)).toEqual({
      count: 3, chunkLengthSeconds: 30, strideLengthSeconds: 5,
    });
  });

  it("honors a feasible manual chunk count", () => {
    const plan = planFileChunks(samples(60), "manual", 4);
    expect(plan.count).toBe(4);
    expect(plan.chunkLengthSeconds).toBeLessThanOrEqual(30);
    expect(plan.strideLengthSeconds).toBeGreaterThan(0);
  });

  it("reduces overlap to allow the minimum number of chunks", () => {
    expect(planFileChunks(samples(60), "manual", 2)).toEqual({
      count: 2, chunkLengthSeconds: 30, strideLengthSeconds: 0,
    });
  });

  it("adjusts impossible manual counts based on the file duration", () => {
    expect(planFileChunks(samples(65), "manual", 1).count).toBe(3);
    expect(planFileChunks(samples(10), "manual", 200).count).toBe(2);
  });

  it("handles empty audio without invalid chunk sizes", () => {
    expect(planFileChunks(0, "manual", 20)).toEqual({
      count: 1, chunkLengthSeconds: 30, strideLengthSeconds: 0,
    });
  });
});
