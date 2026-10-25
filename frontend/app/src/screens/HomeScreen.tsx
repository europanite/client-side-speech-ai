import { useEffect, useMemo, useRef, useState } from "react";
import { useTranscription } from "../hooks/useTranscription";
import { useSpeechSynthesis } from "../hooks/useSpeechSynthesis";
import { MediaPane } from "../components/MediaPane";
import { TextPane } from "../components/TextPane";
import { OperationStatus } from "../components/OperationStatus";
import { AdvancedVoiceControls } from "../components/AdvancedVoiceControls";
import { playClickSound } from "../services/clickSound";

type Direction = "stt" | "tts";

const HomeScreen = () => {
  const transcription = useTranscription();
  const speech = useSpeechSynthesis();
  const [mode, setMode] = useState<Direction>("stt");
  const [draftText, setDraftText] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [ttsMode, setTtsMode] = useState<"standard" | "advanced">("standard");
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!settingsOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !settingsMenuRef.current?.contains(event.target)) {
        setSettingsOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSettingsOpen(false);
        settingsButtonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [settingsOpen]);

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
  const processing = sttBusy || ttsBusy;

  const switchMode = (next: Direction) => {
    if (processing || next === mode) return;
    if (mode === "stt" && (isStreaming || isStreamStarting)) stopStream();
    if (mode === "tts") speech.cancel();
    if (next === "tts" && transcript) setDraftText(transcript);
    setMode(next);
  };

  const handleFile = (file: File) => {
    if (processing) return;
    setSelectedFileName(file.name);
    void transcribeFile(file);
  };

  const handleMicrophone = () => {
    if (processing) return;
    setSelectedFileName("");
    void startMicrophone();
  };

  const clear = () => {
    if (processing) return;
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
    <main className="home" onClickCapture={(event) => {
      if (!(event.target instanceof Element)) return;
      const control = event.target.closest("button, a.btn");
      if (control && !(control instanceof HTMLButtonElement && control.disabled)) {
        playClickSound();
      }
    }}>
      <div className="mode-toolbar">
      <nav className="direction-tabs" role="group" aria-label="Conversion direction">
        <button type="button" className={`direction-tab ${mode === "stt" ? "active" : ""}`}
          aria-pressed={mode === "stt"} disabled={processing} onClick={() => switchMode("stt")}>
          <span className="tab-number" aria-hidden="true">01</span>
          <span>Audio → Text (STT)</span>
          <span className="tab-arrow" aria-hidden="true">↗</span>
        </button>
        <button type="button" className={`direction-tab ${mode === "tts" ? "active" : ""}`}
          aria-pressed={mode === "tts"} disabled={processing} onClick={() => switchMode("tts")}>
          <span className="tab-number" aria-hidden="true">02</span>
          <span>Text → Audio (TTS)</span>
          <span className="tab-arrow" aria-hidden="true">↗</span>
        </button>
      </nav>

      <div className="engine-menu" ref={settingsMenuRef}>
        <button ref={settingsButtonRef} type="button" className={`engine-settings-toggle ${settingsOpen ? "active" : ""}`}
          aria-label="Engine settings" aria-expanded={settingsOpen} aria-controls="model-settings-panel"
          disabled={processing}
          onClick={() => setSettingsOpen((open) => !open)}>
          <span className="engine-settings-icon" aria-hidden="true">⚙</span>
          <span className="engine-settings-label">Settings</span>
          <span className="engine-settings-chevron" aria-hidden="true">{settingsOpen ? "−" : "+"}</span>
        </button>
      <section id="model-settings-panel" hidden={!settingsOpen}
        className={`section model-controls settings-popover ${mode === "tts" ? "tts-controls" : ""}`} aria-label="Model settings">
        <div className="model-heading">
          <span className="model-heading-label"><span className="model-heading-icon" aria-hidden="true">✦</span> ENGINE CONFIGURATION</span>
          <span className="model-heading-mode">{mode === "stt" ? "WHISPER STT" : "SPEECH SYNTHESIS"}</span>
        </div>
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
      </div>
      </div>

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
          onGenerate={() => { if (processing) return; void speech.synthesize(draftText,
            ttsMode === "advanced" ? { mode: "advanced", referenceFile } : { mode: "standard" }); }}
          onCancel={speech.cancel} onClear={clear} />
      </div>

      <OperationStatus label={mode === "stt" ? sttStatusLabel : ttsStatusLabel}
        busy={mode === "stt" ? sttBusy : ttsBusy}
        progress={mode === "stt" ? progress : speech.progress}
        progressName={mode === "stt" ? "Transcription progress" : "Speech synthesis progress"}
        error={mode === "stt" ? error : speech.error} />
    </main>
  );
};

export default HomeScreen;
