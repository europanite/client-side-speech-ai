import { useEffect, useMemo, useRef, useState } from "react";
import {
  SOUND_BAR_COUNT, frequencyDataToBars, pcmToSoundBars,
} from "../services/soundBars";

const EMPTY_BARS = Array<number>(SOUND_BAR_COUNT).fill(0);

interface AudioInputPreviewProps {
  file: File | null;
  liveWaveform: readonly number[];
  streaming: boolean;
  starting: boolean;
}

/** One visualizer for file playback and microphone input, without a separate panel. */
export function AudioInputPreview({
  file, liveWaveform, streaming, starting,
}: AudioInputPreviewProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [playbackBars, setPlaybackBars] = useState<number[]>(EMPTY_BARS);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const stopAnimation = () => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setPlaybackBars(EMPTY_BARS);
  };

  useEffect(() => {
    setPlaybackBars(EMPTY_BARS);
    if (!file || typeof URL.createObjectURL !== "function") {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
      analyserRef.current = null;
      const context = audioContextRef.current;
      audioContextRef.current = null;
      if (context) void context.close().catch(() => {});
      if (typeof URL.revokeObjectURL === "function") URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const startVisualization = () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (!analyserRef.current) {
        const context = new AudioContext();
        const source = context.createMediaElementSource(audio);
        const analyser = context.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.7;
        source.connect(analyser);
        analyser.connect(context.destination);
        audioContextRef.current = context;
        analyserRef.current = analyser;
      }
      const context = audioContextRef.current;
      if (context) void context.resume().catch(() => {});
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      const tick = () => {
        if (audio.paused || audio.ended || !analyserRef.current) {
          animationRef.current = null;
          return;
        }
        const frequencies = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(frequencies);
        setPlaybackBars(frequencyDataToBars(frequencies));
        animationRef.current = requestAnimationFrame(tick);
      };
      animationRef.current = requestAnimationFrame(tick);
    } catch (cause) {
      // Keep native playback usable even if Web Audio visualization is unavailable.
      console.warn("Sound-bar visualization unavailable", cause);
    }
  };

  const micBars = useMemo(() => pcmToSoundBars(liveWaveform), [liveWaveform]);
  const microphone = streaming || starting;
  const bars = microphone ? (streaming ? micBars : EMPTY_BARS)
    : file ? playbackBars : EMPTY_BARS;

  return (
    <>
      <div className="soundbar-visual" role="img" aria-label="Audio sound bars">
        {bars.map((level, index) => (
          <span key={index} className="soundbar-column"
            style={{ height: `${Math.max(5, Math.min(100, level * 100))}%` }} />
        ))}
      </div>
      {file && !microphone && (
        <audio key={url ?? file.name} ref={audioRef} className="audio-player"
          controls preload="metadata" src={url ?? undefined}
          aria-label="Selected audio playback" onPlay={startVisualization}
          onPause={stopAnimation} onEnded={stopAnimation} />
      )}
    </>
  );
}
