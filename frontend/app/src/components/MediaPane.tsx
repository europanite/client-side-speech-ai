import { useRef, type ChangeEvent } from "react";
import { AudioInputPreview } from "./AudioInputPreview";

export const MEDIA_ACCEPT =
  "audio/*,video/mp4,video/webm,video/ogg,video/x-matroska,video/matroska,.mp4,.webm,.ogv,.m4v,.mkv";

export interface MediaPaneProps {
  mode: "stt" | "tts";
  fileName: string;
  inputFile: File | null;
  busy: boolean;
  streaming: boolean;
  streamStarting: boolean;
  finalizing: boolean;
  liveWaveform: number[];
  audioUrl: string | null;
  onFile: (file: File) => void;
  onTranscribe: () => void;
  onStartMicrophone: () => void;
  onStopMicrophone: () => void;
}

export function MediaPane({
  mode, fileName, inputFile, busy, streaming, streamStarting, finalizing, liveWaveform,
  audioUrl, onFile, onTranscribe, onStartMicrophone, onStopMicrophone,
}: MediaPaneProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const fileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (file && !busy) onFile(file);
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
            style={{ display: "none" }} aria-label="Media file" disabled={busy} onChange={fileChange} />
          <div className="button-row inference-row">
            <button type="button" className="btn primary" disabled={busy || !inputFile}
              onClick={onTranscribe}>Transcribe audio</button>
            <span className="helper-text">The Whisper model loads only when transcription starts.</span>
          </div>
          <AudioInputPreview file={inputFile} liveWaveform={liveWaveform}
            streaming={streaming} starting={streamStarting} finalizing={finalizing}
            busy={busy} onStartMicrophone={onStartMicrophone}
            onStopMicrophone={onStopMicrophone} />
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
