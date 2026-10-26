import type { SubtitleFormat } from "../services/subtitles";

interface TextPaneProps {
  mode: "stt" | "tts";
  value: string;
  busy: boolean;
  canClear: boolean;
  canGenerate?: boolean;
  canDownloadSubtitles?: boolean;
  onDownloadSubtitles?: (format: SubtitleFormat) => void;
  onChange: (value: string) => void;
  onGenerate: () => void;
  onCancel: () => void;
  onClear: () => void;
}

export function TextPane({
  mode, value, busy, canClear, canGenerate = true, canDownloadSubtitles = false,
  onDownloadSubtitles, onChange, onGenerate, onCancel, onClear,
}: TextPaneProps) {
  return (
    <section className="section workspace-pane" aria-label="Text pane">
      <div className="pane-heading">
        <h2 className="section-title">Text</h2>
        <span className="pane-role">{mode === "stt" ? "OUTPUT" : "INPUT"}</span>
      </div>
      <textarea className="transcript-box" aria-label="Text" value={value}
        readOnly={mode === "stt" || busy}
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder={mode === "stt"
          ? "Select an audio file and press Transcribe audio, or start the microphone."
          : "Type or paste text to turn into audio."} />
      <div className="button-row right">
        {mode === "stt" && (
          <>
            <button type="button" className="btn secondary"
              disabled={!canDownloadSubtitles} onClick={() => onDownloadSubtitles?.("srt")}>
              Download SRT
            </button>
            <button type="button" className="btn secondary"
              disabled={!canDownloadSubtitles} onClick={() => onDownloadSubtitles?.("vtt")}>
              Download VTT
            </button>
          </>
        )}
        {mode === "tts" && (
          busy ? (
            <button type="button" className="btn secondary" onClick={onCancel}>
              Cancel result
            </button>
          ) : (
            <button type="button" className="btn primary" disabled={!value.trim() || !canGenerate}
              onClick={onGenerate}>Generate speech</button>
          )
        )}
        <button type="button" className="btn secondary" onClick={onClear}
          disabled={busy || !canClear}>Clear</button>
      </div>
    </section>
  );
}
