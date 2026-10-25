import { act, fireEvent, render, screen } from "@testing-library/react";
import { AudioInputPreview } from "../components/AudioInputPreview";
import { frequencyDataToBars, pcmToSoundBars } from "../services/soundBars";
import { sampleLiveWaveform } from "../services/liveWaveform";

const STANDBY = {
  file: null, liveWaveform: [], streaming: false, starting: false,
};

describe("shared audio sound bars", () => {
  it("uses microphone samples without modifying captured PCM", () => {
    const pcm = Float32Array.from([-0.8, -0.4, 0, 0.4, 0.8]);
    const original = Float32Array.from(pcm);
    expect(sampleLiveWaveform(pcm, 5)).toEqual(Array.from(original));
    const bars = pcmToSoundBars(Array.from(pcm));
    expect(bars).toHaveLength(24);
    expect(bars.some((level) => level > 0)).toBe(true);
    expect(pcm).toEqual(original);
  });

  it("normalizes live playback frequency data", () => {
    expect(frequencyDataToBars(new Uint8Array(128).fill(255))).toEqual(Array(24).fill(1));
    expect(frequencyDataToBars(new Uint8Array(128))).toEqual(Array(24).fill(0));
  });

  it("keeps one inline sound-bar visualizer while switching to microphone input", () => {
    const view = render(<AudioInputPreview {...STANDBY} />);
    const bars = screen.getByRole("img", { name: "Audio sound bars" });
    view.rerender(<AudioInputPreview {...STANDBY} streaming liveWaveform={[-0.8, 0.2, 0.7, 0]} />);
    expect(screen.getByRole("img", { name: "Audio sound bars" })).toBe(bars);
    expect(screen.getAllByRole("img", { name: "Audio sound bars" })).toHaveLength(1);
    expect(bars.querySelectorAll("span")).toHaveLength(24);
    expect(view.container.querySelector(".input-audio-preview, .soundbar-pane, svg")).toBeNull();
  });

  it("animates file playback bars from actual decoded audio frequencies", () => {
    const previousContext = globalThis.AudioContext;
    const previousRAF = globalThis.requestAnimationFrame;
    const previousCancelRAF = globalThis.cancelAnimationFrame;
    const previousCreate = URL.createObjectURL;
    const previousRevoke = URL.revokeObjectURL;
    const resume = jest.fn().mockResolvedValue(undefined);
    const close = jest.fn().mockResolvedValue(undefined);
    const frequencyData = jest.fn((array: Uint8Array) => array.fill(255));
    let frame: FrameRequestCallback | null = null;
    globalThis.requestAnimationFrame = jest.fn((cb) => { frame = cb; return 1; });
    globalThis.cancelAnimationFrame = jest.fn();
    URL.createObjectURL = jest.fn(() => "blob:audio-original");
    URL.revokeObjectURL = jest.fn();
    globalThis.AudioContext = class {
      createMediaElementSource = () => ({ connect: jest.fn() });
      createAnalyser = () => ({ fftSize: 1024, frequencyBinCount: 512,
        smoothingTimeConstant: 0.7, connect: jest.fn(), getByteFrequencyData: frequencyData });
      destination = {};
      resume = resume;
      close = close;
    } as unknown as typeof AudioContext;

    try {
      const file = new File(["original"], "speech.wav", { type: "audio/wav" });
      const view = render(<AudioInputPreview {...STANDBY} file={file} />);
      const audio = screen.getByLabelText("Selected audio playback") as HTMLAudioElement;
      Object.defineProperty(audio, "paused", { configurable: true, value: false });
      act(() => { fireEvent.play(audio); });
      act(() => { frame?.(0); });
      expect(frequencyData).toHaveBeenCalled();
      expect(screen.getByRole("img", { name: "Audio sound bars" })
        .querySelector("span")?.getAttribute("style")).toContain("100%");
      view.unmount();
      expect(close).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:audio-original");
    } finally {
      globalThis.AudioContext = previousContext;
      globalThis.requestAnimationFrame = previousRAF;
      globalThis.cancelAnimationFrame = previousCancelRAF;
      if (previousCreate) URL.createObjectURL = previousCreate;
      else Reflect.deleteProperty(URL, "createObjectURL");
      if (previousRevoke) URL.revokeObjectURL = previousRevoke;
      else Reflect.deleteProperty(URL, "revokeObjectURL");
    }
  });
});
