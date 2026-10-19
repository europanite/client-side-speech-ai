import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import HomeScreen from "../screens/HomeScreen";
import { useTranscription } from "../hooks/useTranscription";
import { useSpeechSynthesis } from "../hooks/useSpeechSynthesis";

jest.mock("../hooks/useTranscription");
jest.mock("../hooks/useSpeechSynthesis");

type MockTranscription = ReturnType<typeof useTranscription>;
type MockSynthesis = ReturnType<typeof useSpeechSynthesis>;

const transcribe = (): MockTranscription => ({
  status: "idle", error: null, transcript: "", progress: null,
  availableModels: [
    { id: "Xenova/whisper-small", label: "Small", description: "Smaller model" },
    { id: "Xenova/whisper-base", label: "Base", description: "Balanced model" },
  ],
  selectedModelId: "Xenova/whisper-small", setSelectedModelId: jest.fn(),
  availableLanguages: [
    { id: "auto", label: "Auto-detect", description: "Auto" },
    { id: "english", label: "English", description: "English", whisperLanguage: "english" },
    { id: "japanese", label: "Japanese", description: "Japanese", whisperLanguage: "japanese" },
  ],
  selectedLanguageId: "english", setSelectedLanguageId: jest.fn(),
  transcribeFile: jest.fn().mockResolvedValue(undefined),
  isStreaming: false, isStreamStarting: false, audioLevel: 0,
  startStream: jest.fn(), startMicrophone: jest.fn().mockResolvedValue(undefined),
  stopStream: jest.fn(), reset: jest.fn(),
});

const synthesize = (): MockSynthesis => ({
  status: "idle", error: null, progress: null, audioUrl: null,
  voiceId: "af_heart", setVoiceId: jest.fn(),
  voices: [
    { id: "af_heart", label: "English — female", language: "en" },
    { id: "am_michael", label: "English — male", language: "en" },
    { id: "jf_alpha", label: "Japanese — female", language: "ja" },
    { id: "jm_kumo", label: "Japanese — male", language: "ja" },
  ] as MockSynthesis["voices"],
  synthesize: jest.fn().mockResolvedValue(undefined),
  cancel: jest.fn(), reset: jest.fn(),
});

describe("bidirectional HomeScreen", () => {
  beforeEach(() => {
    (useTranscription as jest.Mock).mockReturnValue(transcribe());
    (useSpeechSynthesis as jest.Mock).mockReturnValue(synthesize());
  });
  afterEach(() => jest.clearAllMocks());

  it("renders shared audio/text panes with STT by default", () => {
    render(<HomeScreen />);
    expect(screen.getByRole("group", { name: "Conversion direction" })).not.toBeNull();
    expect(screen.getByRole("region", { name: "Audio pane" })).not.toBeNull();
    expect(screen.getByRole("region", { name: "Text pane" })).not.toBeNull();
    expect((screen.getByRole("textbox", { name: "Text" }) as HTMLTextAreaElement).readOnly).toBe(true);
    expect(screen.getByLabelText("Whisper model")).not.toBeNull();
  });

  it("changes Whisper model and language", () => {
    const stt = transcribe();
    (useTranscription as jest.Mock).mockReturnValue(stt);
    render(<HomeScreen />);
    fireEvent.change(screen.getByLabelText("Whisper model"), {
      target: { value: "Xenova/whisper-base" },
    });
    fireEvent.change(screen.getByLabelText("Transcription language"), {
      target: { value: "japanese" },
    });
    expect(stt.setSelectedModelId).toHaveBeenCalledWith("Xenova/whisper-base");
    expect(stt.setSelectedLanguageId).toHaveBeenCalledWith("japanese");
  });

  it("retains accepted video file types and calls transcribeFile", async () => {
    const stt = transcribe();
    (useTranscription as jest.Mock).mockReturnValue(stt);
    render(<HomeScreen />);
    const input = screen.getByLabelText("Media file") as HTMLInputElement;
    expect(input.accept).toContain("video/mp4");
    const file = new File(["sample"], "clip.mp4", { type: "video/mp4" });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(stt.transcribeFile).toHaveBeenCalledWith(file));
    expect(screen.getByText("clip.mp4")).not.toBeNull();
  });

  it("starts, stops and meters live microphone input", () => {
    const stt = { ...transcribe(), status: "streaming" as const,
      isStreaming: true, audioLevel: 0.42 };
    (useTranscription as jest.Mock).mockReturnValue(stt);
    render(<HomeScreen />);
    fireEvent.click(screen.getByText("Stop microphone"));
    expect(stt.stopStream).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("meter", { name: "Microphone input level" }).getAttribute("aria-valuenow")).toBe("42");
  });

  it("switches to TTS and reuses the STT transcript as editable text", () => {
    const stt = { ...transcribe(), transcript: "Hello from STT" };
    const tts = synthesize();
    (useTranscription as jest.Mock).mockReturnValue(stt);
    (useSpeechSynthesis as jest.Mock).mockReturnValue(tts);
    render(<HomeScreen />);
    fireEvent.click(screen.getByRole("button", { name: "Text → Audio (TTS)" }));
    const editor = screen.getByRole("textbox", { name: "Text" }) as HTMLTextAreaElement;
    expect(editor.readOnly).toBe(false);
    expect(editor.value).toBe("Hello from STT");
    fireEvent.click(screen.getByText("Generate speech"));
    expect(tts.synthesize).toHaveBeenCalledWith("Hello from STT");
  });

  it("exposes Pocket TTS Advanced Mode and requires a reference voice", () => {
    const tts = synthesize();
    (useSpeechSynthesis as jest.Mock).mockReturnValue(tts);
    render(<HomeScreen />);
    fireEvent.click(screen.getByRole("button", { name: "Text → Audio (TTS)" }));
    fireEvent.change(screen.getByLabelText("TTS mode"), { target: { value: "advanced" } });
    expect(screen.getByText(/Pocket TTS \(English voice cloning\)/)).not.toBeNull();
    fireEvent.change(screen.getByRole("textbox", { name: "Text" }), { target: { value: "Hello" } });
    expect((screen.getByRole("button", { name: "Generate speech" }) as HTMLButtonElement).disabled).toBe(true);
    const voice = new File(["wav"], "me.wav", { type: "audio/wav" });
    fireEvent.change(screen.getByLabelText("Reference voice (audio file)"), { target: { files: [voice] } });
    expect((screen.getByRole("button", { name: "Generate speech" }) as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Generate speech" }));
    expect(tts.synthesize).toHaveBeenCalledWith("Hello", { mode: "advanced", referenceFile: voice });
  });

  it("shows generated audio and allows WAV download", () => {
    (useSpeechSynthesis as jest.Mock).mockReturnValue({
      ...synthesize(), audioUrl: "blob:https://local/speech", status: "done",
    });
    render(<HomeScreen />);
    fireEvent.click(screen.getByText("Text → Audio (TTS)"));
    expect(screen.getByLabelText("Generated speech")).not.toBeNull();
    const link = screen.getByRole("link", { name: "Download WAV" }) as HTMLAnchorElement;
    expect(link.download).toBe("speech.wav");
  });

  it("stops a starting microphone when switching to TTS", () => {
    const stt = { ...transcribe(), status: "loading-model" as const, isStreamStarting: true };
    (useTranscription as jest.Mock).mockReturnValue(stt);
    render(<HomeScreen />);
    fireEvent.click(screen.getByText("Text → Audio (TTS)"));
    expect(stt.stopStream).toHaveBeenCalledTimes(1);
  });

  it("keeps progress and Clear behavior in STT", () => {
    (useTranscription as jest.Mock).mockReturnValue({
      ...transcribe(), status: "transcribing", progress: { percent: 42, label: "Chunk 3 of 7" },
    });
    render(<HomeScreen />);
    expect(screen.getByRole("progressbar", { name: "Transcription progress" }).getAttribute("aria-valuenow")).toBe("42");
    expect((screen.getByText("Clear") as HTMLButtonElement).disabled).toBe(true);
  });
});
