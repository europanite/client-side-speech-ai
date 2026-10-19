import { act, renderHook } from "@testing-library/react";
import { useSpeechSynthesis } from "../hooks/useSpeechSynthesis";
import { synthesizeSpeech } from "../services/ttsEngine";
import { synthesizeClonedSpeech } from "../services/advancedTts";

jest.mock("../services/ttsEngine", () => ({ synthesizeSpeech: jest.fn() }));
jest.mock("../services/advancedTts", () => ({ synthesizeClonedSpeech: jest.fn(), cancelClonedSpeech: jest.fn() }));

const speakMock = synthesizeSpeech as jest.Mock;
const createObjectURL = jest.fn(() => "blob:test");
const revokeObjectURL = jest.fn();

beforeAll(() => {
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectURL });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectURL });
});
afterEach(() => {
  jest.clearAllMocks();
});

describe("useSpeechSynthesis", () => {
  it("generates and exposes a downloadable audio URL", async () => {
    speakMock.mockResolvedValue(new Blob(["RIFF"], { type: "audio/wav" }));
    const { result, unmount } = renderHook(() => useSpeechSynthesis());
    await act(async () => { await result.current.synthesize("Hello"); });
    expect(speakMock).toHaveBeenCalledWith("Hello", "af_heart", expect.any(Function));
    expect(result.current.audioUrl).toBe("blob:test");
    expect(result.current.status).toBe("done");
    act(() => result.current.reset());
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:test");
    unmount();
  });

  it("routes Advanced to Pocket TTS with the reference file", async () => {
    (synthesizeClonedSpeech as jest.Mock).mockResolvedValue(new Blob(["RIFF"], { type: "audio/wav" }));
    const file = new File(["audio"], "me.wav", { type: "audio/wav" });
    const { result } = renderHook(() => useSpeechSynthesis());
    await act(async () => { await result.current.synthesize("Hello", { mode: "advanced", referenceFile: file }); });
    expect(synthesizeClonedSpeech).toHaveBeenCalledWith(
      "Hello", { voiceSample: file }, expect.any(Function), expect.any(Function));
    expect(speakMock).not.toHaveBeenCalled();
    expect(result.current.status).toBe("done");
  });

  it("rejects Advanced without a reference voice", async () => {
    const { result } = renderHook(() => useSpeechSynthesis());
    await act(async () => { await result.current.synthesize("Hello", { mode: "advanced" }); });
    expect(result.current.error).toMatch(/reference voice/i);
    expect(synthesizeClonedSpeech).not.toHaveBeenCalled();
  });

  it("rejects empty text without calling the engine", async () => {
    const { result } = renderHook(() => useSpeechSynthesis());
    await act(async () => { await result.current.synthesize("  "); });
    expect(result.current.status).toBe("error");
    expect(speakMock).not.toHaveBeenCalled();
  });

  it("ignores stale output after cancellation", async () => {
    let finish!: (blob: Blob) => void;
    speakMock.mockImplementation(() => new Promise<Blob>((resolve) => { finish = resolve; }));
    const { result } = renderHook(() => useSpeechSynthesis());
    let promise!: Promise<void>;
    act(() => { promise = result.current.synthesize("Slow speech"); });
    act(() => result.current.cancel());
    await act(async () => { finish(new Blob(["RIFF"])); await promise; });
    expect(result.current.status).toBe("idle");
    expect(result.current.audioUrl).toBeNull();
    expect(createObjectURL).not.toHaveBeenCalled();
  });
});
