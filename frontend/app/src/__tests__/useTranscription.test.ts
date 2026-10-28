import { renderHook, act } from "@testing-library/react";
import {
  DEFAULT_TRANSCRIPTION_LANGUAGE_ID,
  DEFAULT_WHISPER_MODEL_ID,
  useTranscription,
} from "../hooks/useTranscription";

jest.mock("@huggingface/transformers", () => ({
  env: {},
  pipeline: jest.fn(),
  WhisperTextStreamer: jest.fn(),
}));

describe("useTranscription hook", () => {
  it("exposes the expected initial state", () => {
    const { result } = renderHook(() => useTranscription());

    expect(result.current.status).toBe("idle");
    expect(result.current.error).toBeNull();
    expect(result.current.transcript).toBe("");
    expect(result.current.cues).toEqual([]);
    expect(result.current.progress).toBeNull();
    expect(result.current.selectedModelId).toBe(DEFAULT_WHISPER_MODEL_ID);
    expect(result.current.availableModels.length).toBeGreaterThan(0);
    expect(typeof result.current.setSelectedModelId).toBe("function");
    expect(result.current.selectedLanguageId).toBe(
      DEFAULT_TRANSCRIPTION_LANGUAGE_ID
    );
    expect(result.current.availableLanguages.length).toBeGreaterThan(0);
    expect(typeof result.current.setSelectedLanguageId).toBe("function");
    expect(result.current.chunkCountMode).toBe("auto");
    expect(result.current.manualChunkCount).toBe(4);
    expect(typeof result.current.setChunkCountMode).toBe("function");
    expect(typeof result.current.setManualChunkCount).toBe("function");
    expect(typeof result.current.transcribeFile).toBe("function");
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.isStreamStarting).toBe(false);
    expect(result.current.liveWaveform).toEqual([]);
    expect(typeof result.current.startStream).toBe("function");
    expect(typeof result.current.startMicrophone).toBe("function");
    expect(typeof result.current.stopStream).toBe("function");
    expect(typeof result.current.reset).toBe("function");
  });

  it("keeps state stable when reset() is called from the initial state", () => {
    const { result } = renderHook(() => useTranscription());

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.error).toBeNull();
    expect(result.current.transcript).toBe("");
    expect(result.current.cues).toEqual([]);
    expect(result.current.selectedModelId).toBe(DEFAULT_WHISPER_MODEL_ID);
    expect(result.current.selectedLanguageId).toBe(
      DEFAULT_TRANSCRIPTION_LANGUAGE_ID
    );
  });

  it("keeps manual chunk settings across transcript resets and clamps input", () => {
    const { result } = renderHook(() => useTranscription());
    act(() => {
      result.current.setChunkCountMode("manual");
      result.current.setManualChunkCount(999);
      result.current.reset();
    });
    expect(result.current.chunkCountMode).toBe("manual");
    expect(result.current.manualChunkCount).toBe(256);
    act(() => result.current.setManualChunkCount(0));
    expect(result.current.manualChunkCount).toBe(1);
  });

  it("passes the selected manual chunk plan to Whisper file inference", async () => {
    const originalAudioContext = globalThis.AudioContext;
    const transcriber = jest.fn().mockResolvedValue({ text: "Hello", chunks: [] });
    const { pipeline } = jest.requireMock("@huggingface/transformers");
    (pipeline as jest.Mock).mockResolvedValue(Object.assign(transcriber, { tokenizer: {} }));
    const audio = new Float32Array(60 * 16_000);
    Object.defineProperty(globalThis, "AudioContext", {
      configurable: true,
      writable: true,
      value: jest.fn().mockImplementation(() => ({
        decodeAudioData: jest.fn().mockResolvedValue({
          length: audio.length,
          numberOfChannels: 1,
          getChannelData: () => audio,
          duration: 60,
        }),
        close: jest.fn(),
      })),
    });

    try {
      const { result } = renderHook(() => useTranscription());
      act(() => {
        result.current.setChunkCountMode("manual");
        result.current.setManualChunkCount(2);
      });
      const file = { arrayBuffer: async () => new ArrayBuffer(8) } as File;
      await act(async () => { await result.current.transcribeFile(file); });
      expect(transcriber).toHaveBeenCalledWith(audio, expect.objectContaining({
        chunk_length_s: 30,
        stride_length_s: 0,
        return_timestamps: true,
      }));
      expect(result.current.status).toBe("done");
      expect(result.current.progress?.label).toContain("2 chunks");
    } finally {
      Object.defineProperty(globalThis, "AudioContext", {
        configurable: true,
        writable: true,
        value: originalAudioContext,
      });
    }
  });

  it("rejects a MediaStream without audio tracks", async () => {
    const { result } = renderHook(() => useTranscription());
    const stream = {
      getAudioTracks: () => [],
      getTracks: () => [],
    } as unknown as MediaStream;

    await act(async () => {
      await result.current.startStream(stream);
    });

    expect(result.current.status).toBe("error");
    expect(result.current.error).toContain("does not contain an audio track");
    expect(result.current.isStreaming).toBe(false);
  });
});
