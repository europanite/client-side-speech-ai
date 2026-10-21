interface TextPaneProps {
  mode: "stt" | "tts";
  value: string;
  busy: boolean;
  canClear: boolean;
  canGenerate?: boolean;
  onChange: (value: string) => void;
  onGenerate: () => void;
  onCancel: () => void;
  onClear: () => void;
}

export function TextPane({
  mode, value, busy, canClear, canGenerate = true, onChange, onGenerate, onCancel, onClear,
}: TextPaneProps) {
  return (
    <section className="section workspace-pane" aria-label="Text pane">
      <div className="pane-heading">
        <h2 className="section-title">Text</h2>
        <span className="pane-role">{mode === "stt" ? "OUTPUT" : "INPUT"}</span>
      </div>
      <p className="section-description">
        {mode === "stt" ? "Transcribed text" : "Text to synthesize"}
      </p>
      <textarea className="transcript-box" aria-label="Text" value={value}
        readOnly={mode === "stt"}
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder={mode === "stt"
          ? "The transcript will appear here after choosing a media file or microphone."
          : "Type or paste text to turn into audio."} />
      <div className="button-row right">
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
          disabled={!canClear}>Clear</button>
      </div>
    </section>
  );
}
