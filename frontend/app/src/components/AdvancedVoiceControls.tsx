import { useEffect, useRef, useState } from "react";
import {
  deleteVoiceProfile, listVoiceProfiles, profileToFile, saveVoiceProfile,
  type VoiceProfile,
} from "../services/voiceProfiles";
import { MAX_REFERENCE_BYTES, inspectReferenceDuration } from "../services/advancedTts";

type Props = {
  disabled: boolean;
  referenceFile: File | null;
  onReferenceFile: (file: File | null) => void;
};

export function AdvancedVoiceControls({
  disabled, referenceFile, onReferenceFile,
}: Props) {
  const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [profileName, setProfileName] = useState("My voice");
  const [recording, setRecording] = useState(false);
  const [pendingAction, setPendingAction] = useState<"record" | "save" | "remove" | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [sampleInfo, setSampleInfo] = useState("");
  const [message, setMessage] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const controlsBusy = disabled || recording || pendingAction !== null;

  useEffect(() => {
    let mounted = true;
    void listVoiceProfiles().then((items) => { if (mounted) setProfiles(items); })
      .catch(() => { /* Private browsing may prohibit IndexedDB; upload still works. */ });
    return () => {
      mounted = false;
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      if (clockRef.current) clearInterval(clockRef.current);
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    let current = true;
    setSampleInfo(referenceFile ? "Checking reference duration..." : "");
    if (referenceFile) {
      void inspectReferenceDuration(referenceFile).then((seconds) => {
        if (!current) return;
        const length = seconds.toFixed(2);
        setSampleInfo(seconds < 2
          ? `Duration: ${length}s. Record at least 2 seconds of speech.`
          : seconds > 10
            ? `Duration: ${length}s. The strongest 10-second section will be used automatically.`
            : `Duration: ${length}s. Ready for voice cloning.`);
      }).catch((reason) => {
        if (current) setSampleInfo(reason instanceof Error ? reason.message : "Could not read reference audio.");
      });
    }
    return () => { current = false; };
  }, [referenceFile]);

  const chooseFile = (file?: File) => {
    if (!file) return;
    if (file.size > MAX_REFERENCE_BYTES) {
      setMessage("Reference audio must be smaller than 100 MB.");
      return;
    }
    onReferenceFile(file);
    setSelectedId("");
    setMessage("");
  };

  const record = async () => {
    if (controlsBusy) return;
    setPendingAction("record");
    setMessage("");
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        throw new Error("Microphone recording is unavailable in this browser.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onstop = () => {
        if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
        if (clockRef.current) clearInterval(clockRef.current);
        stopTimerRef.current = null;
        clockRef.current = null;
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setRecording(false);
        if (!chunks.length) {
          setMessage("No audio was captured. Try recording again.");
          return;
        }
        const type = recorder.mimeType || "audio/webm";
        const suffix = type.includes("mp4") ? "m4a" : "webm";
        chooseFile(new File(chunks, `my-voice.${suffix}`, { type }));
      };
      recorder.onerror = () => setMessage("Recording failed. Try uploading an audio file.");
      recorder.start();
      setRecordingSeconds(0);
      setRecording(true);
      const startedAt = Date.now();
      clockRef.current = setInterval(() => {
        setRecordingSeconds(Math.min(10, (Date.now() - startedAt) / 1000));
      }, 200);
      stopTimerRef.current = setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, 10000);
    } catch (reason) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setMessage(reason instanceof Error ? reason.message : "Could not start recording.");
    } finally {
      setPendingAction(null);
    }
  };

  const stopRecording = () => {
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  };

  const save = async () => {
    if (controlsBusy || !referenceFile || !profileName.trim()) return;
    setPendingAction("save");
    try {
      const saved = await saveVoiceProfile(profileName, referenceFile);
      setProfiles((items) => [...items, saved]);
      setSelectedId(saved.id);
      setMessage("Voice saved locally in this browser.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Could not save voice.");
    } finally {
      setPendingAction(null);
    }
  };

  const remove = async () => {
    if (controlsBusy || !selectedId) return;
    setPendingAction("remove");
    try {
      await deleteVoiceProfile(selectedId);
      setProfiles((items) => items.filter((p) => p.id !== selectedId));
      setSelectedId("");
      onReferenceFile(null);
      setMessage("Saved voice deleted from this browser.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Could not delete voice.");
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="advanced-voice-controls">
      <p className="helper-text">
        Pocket TTS (English voice cloning). Provide 5–10 seconds of your own voice or a recording
        you have permission to use. Recordings stop automatically after 10 seconds; longer files are trimmed to 10 seconds locally. Inference stays in the browser using WebAssembly.
      </p>
      <label className="field-label" htmlFor="advanced-voice-file">Reference voice (audio file)</label>
      <input id="advanced-voice-file" type="file" accept="audio/*,.wav,.mp3,.m4a,.ogg,.webm"
        disabled={controlsBusy} onChange={(event) => chooseFile(event.currentTarget.files?.[0])} />
      <div className="button-row">
        {recording ? (
          <button type="button" className="btn secondary" onClick={stopRecording}>Stop recording ({recordingSeconds.toFixed(1)}s / 10s)</button>
        ) : (
          <button type="button" className="btn secondary" disabled={controlsBusy} onClick={() => { void record(); }}>
            Record my voice
          </button>
        )}
        <span className="file-name">{referenceFile?.name ?? "No reference voice selected"}</span>
      </div>
      {sampleInfo && <p className="helper-text" role="status">{sampleInfo}</p>}
      <label className="field-label" htmlFor="saved-voice-select">Saved voices (this browser only)</label>
      <select className="select-input" id="saved-voice-select" value={selectedId} disabled={controlsBusy}
        onChange={(event) => {
          const id = event.target.value;
          setSelectedId(id);
          const profile = profiles.find((item) => item.id === id);
          onReferenceFile(profile ? profileToFile(profile) : null);
          setMessage("");
        }}>
        <option value="">Choose a saved voice</option>
        {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <div className="button-row advanced-save-row">
        <input className="select-input" aria-label="Voice profile name" maxLength={80}
          value={profileName} disabled={controlsBusy}
          onChange={(event) => setProfileName(event.target.value)} />
        <button type="button" className="btn secondary" disabled={controlsBusy || !referenceFile || !profileName.trim()}
          onClick={() => { void save(); }}>Save locally</button>
        <button type="button" className="btn secondary" disabled={controlsBusy || !selectedId}
          onClick={() => { void remove(); }}>Delete saved</button>
      </div>
      {message && <p className="helper-text" role="status">{message}</p>}
    </div>
  );
}
