import { renderHook, act } from "@testing-library/react";
import {
  DEFAULT_TRANSCRIPTION_LANGUAGE_ID,
  DEFAULT_WHISPER_MODEL_ID,
  useTranscription,
} from "../hooks/useTranscription";

jest.mock("@huggingface/transformers", () => ({
  env: {},
  pipeline: jest.fn(),
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
