// Create a very short, quiet click in response to a real button activation.
// No sound file, download, or third-party library is needed.
let audioContext: AudioContext | null = null;

export function playClickSound(): void {
  try {
    const AudioContextClass = window.AudioContext
      ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const context = audioContext ?? new AudioContextClass();
    audioContext = context;
    if (context.state === "suspended") {
      void context.resume().catch(() => { /* Audio is optional. */ });
    }

    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const volume = context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(850, now);
    oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.035);
    volume.gain.setValueAtTime(0.035, now);
    volume.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
    oscillator.connect(volume);
    volume.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.05);
  } catch {
    // Unsupported or blocked audio must never interfere with a button action.
  }
}
