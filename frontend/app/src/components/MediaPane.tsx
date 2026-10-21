import { useRef, type ChangeEvent } from "react";

export const MEDIA_ACCEPT =
  "audio/*,video/mp4,video/webm,video/ogg,video/x-matroska,video/matroska,.mp4,.webm,.ogv,.m4v,.mkv";

export interface MediaPaneProps {
  mode: "stt" | "tts";
  fileName: string;
  busy: boolean;
  streaming: boolean;
  streamStarting: boolean;
  finalizing: boolean;
  audioLevel: number;
  audioUrl: string | null;
  onFile: (file: File) => void;
  onStartMicrophone: () => void;
  onStopMicrophone: () => void;
}

export function MediaPane({
  mode, fileName, busy, streaming, streamStarting, finalizing, audioLevel,
  audioUrl, onFile, onStartMicrophone, onStopMicrophone,
}: MediaPaneProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const canStop = streamStarting || streaming;

  const fileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (file) onFile(file);
    // Permit choosing the same file again after clearing or changing modes.
    event.currentTarget.value = "";
  };

  return (
    <section className="section workspace-pane" aria-label="Audio pane">
      <div className="pane-heading">
        <h2 className="section-title">Audio</h2>
        <span className="pane-role">{mode === "stt" ? "INPUT" : "OUTPUT"}</span>
      </div>
      {mode === "stt" ? (
        <>
          <p className="section-description">File or live microphone input</p>
          <div className="button-row">
            <button type="button" className="btn primary"
              onClick={() => fileRef.current?.click()} disabled={busy}>
              Choose a media file
            </button>
            <span className="file-name">{fileName || "No file selected yet."}</span>
          </div>
          <input ref={fileRef} type="file" accept={MEDIA_ACCEPT}
            style={{ display: "none" }} aria-label="Media file" onChange={fileChange} />
          <div className="button-row">
            <button type="button" className="btn primary"
              onClick={onStartMicrophone} disabled={busy}>Start microphone</button>
            <button type="button" className={canStop ? "btn primary" : "btn secondary"}
              onClick={onStopMicrophone} disabled={!canStop}>Stop microphone</button>
          </div>
          <p className="helper-text">
            {streaming ? "Live microphone input is active."
              : streamStarting ? "Preparing microphone input. You can stop now."
              : finalizing ? "Microphone stopped. Finalizing buffered audio."
              : "Microphone is stopped."}
          </p>
          <div className="audio-level-row" aria-live="off">
            <span className="audio-level-label">Mic level</span>
            <div className="audio-level-meter" role="meter"
              aria-label="Microphone input level" aria-valuemin={0} aria-valuemax={100}
              aria-valuenow={Math.round(audioLevel * 100)}>
              <div className="audio-level-fill" style={{ width: `${Math.round(audioLevel * 100)}%` }} />
            </div>
            <span className="audio-level-value">
              {streaming ? `${Math.round(audioLevel * 100)}%` : "--"}
            </span>
          </div>
        </>
      ) : (
        <>
          <p className="section-description">Generated audio · play or save as a file</p>
          {audioUrl ? (
            <>
              <audio key={audioUrl} className="audio-player" controls src={audioUrl}
                aria-label="Generated speech" />
              <a className="btn primary audio-download" href={audioUrl} download="speech.wav">
                Download WAV
              </a>
            </>
          ) : (
            <div className="audio-placeholder" role="status">
              Enter text on the right and select Generate speech.
            </div>
          )}
          <p className="helper-text">Audio is generated locally, then played as a browser stream or saved as WAV.</p>
        </>
      )}
    </section>
  );
}
