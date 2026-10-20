import { useEffect, useMemo, useState } from "react";
import { useTranscription } from "../hooks/useTranscription";
import { useSpeechSynthesis } from "../hooks/useSpeechSynthesis";
import { MediaPane } from "../components/MediaPane";
import { TextPane } from "../components/TextPane";
import { OperationStatus } from "../components/OperationStatus";
import { AdvancedVoiceControls } from "../components/AdvancedVoiceControls";

type Direction = "stt" | "tts";

const HomeScreen = () => {
  const transcription = useTranscription();
  const speech = useSpeechSynthesis();
  const [mode, setMode] = useState<Direction>("stt");
  const [draftText, setDraftText] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [ttsMode, setTtsMode] = useState<"standard" | "advanced">("standard");
  const [referenceFile, setReferenceFile] = useState<File | null>(null);

  const {
    status, error, transcript, progress, availableModels, selectedModelId,
    setSelectedModelId, availableLanguages, selectedLanguageId,
    setSelectedLanguageId, transcribeFile, isStreaming, isStreamStarting,
    audioLevel, startMicrophone, stopStream, reset,
  } = transcription;

  const selectedModel = useMemo(
    () => availableModels.find((m) => m.id === selectedModelId) ?? availableModels[0],
    [availableModels, selectedModelId]
  );
  const selectedLanguage = useMemo(
    () => availableLanguages.find((l) => l.id === selectedLanguageId) ?? availableLanguages[0],
    [availableLanguages, selectedLanguageId]
  );

  // Keep an STT result ready for direct conversion to TTS. Editing is enabled
  // only in TTS mode; Whisper's transcript remains the source of truth in STT.
  useEffect(() => {
    if (mode === "stt") setDraftText(transcript);
  }, [transcript, mode]);

  const sttBusy = ["loading-model", "starting-stream", "transcribing",
    "streaming", "finalizing-stream"].includes(status);
  const ttsBusy = speech.status === "loading-model" || speech.status === "synthesizing";

  const switchMode = (next: Direction) => {
    if (next === mode) return;
    if (mode === "stt" && (isStreaming || isStreamStarting)) stopStream();
    if (mode === "tts") speech.cancel();
    if (next === "tts" && transcript) setDraftText(transcript);
    setMode(next);
  };

  const handleFile = (file: File) => {
    setSelectedFileName(file.name);
    void transcribeFile(file);
  };

  const handleMicrophone = () => {
    setSelectedFileName("");
    void startMicrophone();
  };

  const clear = () => {
    if (mode === "stt") {
      reset();
      setSelectedFileName("");
      setDraftText("");
    } else {
      speech.reset();
      setDraftText("");
    }
  };

  const sttStatusLabel = (() => {
    switch (status) {
      case "idle": return "Choose a file or start the microphone.";
      case "loading-model": return `Loading ${selectedModel?.label ?? "Whisper"} locally...`;
      case "ready": return "Whisper is ready.";
      case "starting-stream": return "Preparing microphone capture...";
      case "transcribing": return selectedLanguageId === "auto"
        ? "Transcribing locally (automatic language detection)..."
        : `Transcribing locally as ${selectedLanguage?.label ?? "the selected language"}...`;
      case "streaming": return "Listening to live microphone audio...";
      case "finalizing-stream": return "Finishing buffered microphone transcription...";
      case "done": return "Transcription finished.";
      case "error": return "Transcription failed.";
      default: return "";
    }
  })();

  const ttsStatusLabel = (() => {
    switch (speech.status) {
      case "idle": return ttsMode === "advanced"
        ? "Choose a reference voice, enter English text, and generate speech."
        : "Enter text and generate audio.";
      case "loading-model": return ttsMode === "advanced"
        ? "Loading Pocket TTS locally (first download)..."
        : "Loading Kokoro TTS locally (first download can be large)...";
      case "synthesizing": return "Generating speech locally...";
      case "done": return "Speech ready. Play or download it from the Audio pane.";
      case "error": return "Speech generation failed.";
    }
  })();

  return (
    <main className="home">
      <nav className="direction-tabs" role="group" aria-label="Conversion direction">
        <button type="button" className={`direction-tab ${mode === "stt" ? "active" : ""}`}
          aria-pressed={mode === "stt"} onClick={() => switchMode("stt")}>Audio → Text (STT)</button>
        <button type="button" className={`direction-tab ${mode === "tts" ? "active" : ""}`}
          aria-pressed={mode === "tts"} onClick={() => switchMode("tts")}>Text → Audio (TTS)</button>
      </nav>

      <section className="section model-controls" aria-label="Model settings">
        {mode === "stt" ? (
          <>
            <div className="field-group">
              <label className="field-label" htmlFor="whisper-model-select">Whisper model</label>
              <select id="whisper-model-select" className="select-input"
                value={selectedModelId} onChange={(event) => setSelectedModelId(event.target.value)}
                disabled={sttBusy}>
                {availableModels.map((model) => (
                  <option key={model.id} value={model.id}>{model.label} - {model.id}</option>
                ))}
              </select>
              <p className="helper-text">{selectedModel?.description}</p>
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="transcription-language-select">Transcription language</label>
              <select id="transcription-language-select" className="select-input"
                value={selectedLanguageId} onChange={(event) => setSelectedLanguageId(event.target.value)}
                disabled={sttBusy}>
                {availableLanguages.map((language) => (
                  <option key={language.id} value={language.id}>{language.label}</option>
                ))}
              </select>
              <p className="helper-text">{selectedLanguage?.description}</p>
            </div>
          </>
        ) : (
          <div className="field-group">
            <label className="field-label" htmlFor="tts-mode-select">TTS mode</label>
            <select id="tts-mode-select" className="select-input" value={ttsMode}
              disabled={ttsBusy} onChange={(event) => {
                speech.reset();
                setTtsMode(event.target.value as "standard" | "advanced");
              }}>
              <option value="standard">Standard — Kokoro voices</option>
              <option value="advanced">Advanced — clone my voice (English, Pocket TTS)</option>
            </select>
            {ttsMode === "advanced" ? (
              <AdvancedVoiceControls disabled={ttsBusy} referenceFile={referenceFile}
                onReferenceFile={(file) => { speech.reset(); setReferenceFile(file); }} />
            ) : (
              <>
                <label className="field-label" htmlFor="tts-voice-select">TTS voice</label>
                <select id="tts-voice-select" className="select-input" value={speech.voiceId}
              onChange={(event) => {
                speech.reset();
                speech.setVoiceId(event.target.value);
              }} disabled={ttsBusy}>
              {speech.voices.map((voice) => (
                <option key={voice.id} value={voice.id}>{voice.label} ({voice.id})</option>
              ))}
            </select>
                <p className="helper-text">Kokoro 82M (English/Japanese); model assets are downloaded once and inference runs in your browser.</p>
              </>
            )}
          </div>
        )}
      </section>

      <div className="workspace-grid">
        <MediaPane mode={mode} fileName={selectedFileName} busy={sttBusy}
          streaming={isStreaming} streamStarting={isStreamStarting}
          finalizing={status === "finalizing-stream"} audioLevel={audioLevel}
          audioUrl={speech.audioUrl} onFile={handleFile}
          onStartMicrophone={handleMicrophone} onStopMicrophone={stopStream} />
        <TextPane mode={mode} value={mode === "stt" ? transcript : draftText}
          busy={ttsBusy}
          canClear={mode === "stt"
            ? Boolean(transcript || error || selectedFileName || isStreaming || isStreamStarting)
            : Boolean(draftText || speech.audioUrl || speech.error || ttsBusy)}
          onChange={(value) => {
            setDraftText(value);
            speech.reset();
          }}
          canGenerate={ttsMode !== "advanced" || Boolean(referenceFile)}
          onGenerate={() => { void speech.synthesize(draftText,
            ttsMode === "advanced" ? { mode: "advanced", referenceFile } : { mode: "standard" }); }}
          onCancel={speech.cancel} onClear={clear} />
      </div>

      <OperationStatus label={mode === "stt" ? sttStatusLabel : ttsStatusLabel}
        busy={mode === "stt" ? sttBusy : ttsBusy}
        progress={mode === "stt" ? progress : speech.progress}
        progressName={mode === "stt" ? "Transcription progress" : "Speech synthesis progress"}
        error={mode === "stt" ? error : speech.error} />

      <p className="footer-note">
        STT: Whisper runs in the browser; live transcription uses short buffered windows.
        TTS: Standard uses Kokoro; Advanced uses Pocket TTS for English voice cloning.
        Both synthesize locally after downloading model assets. Reference audio and text are never sent to an inference backend.
      </p>
    </main>
  );
};

export default HomeScreen;
