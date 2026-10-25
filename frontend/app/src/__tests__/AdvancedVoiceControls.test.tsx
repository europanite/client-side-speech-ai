import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AdvancedVoiceControls } from "../components/AdvancedVoiceControls";
import { inspectReferenceDuration } from "../services/advancedTts";
import { listVoiceProfiles, saveVoiceProfile, type VoiceProfile } from "../services/voiceProfiles";

jest.mock("../services/advancedTts");
jest.mock("../services/voiceProfiles");

describe("advanced voice button locking", () => {
  beforeEach(() => {
    (listVoiceProfiles as jest.Mock).mockResolvedValue([]);
    (inspectReferenceDuration as jest.Mock).mockResolvedValue(5);
  });

  afterEach(() => jest.clearAllMocks());

  it("prevents repeat saving and re-enables controls once storage completes", async () => {
    const voice = new File(["wav"], "me.wav", { type: "audio/wav" });
    const saved: VoiceProfile = {
      id: "voice-1", name: "My voice", fileName: voice.name,
      mimeType: voice.type, blob: voice,
    };
    let finishSave!: (profile: VoiceProfile) => void;
    (saveVoiceProfile as jest.Mock).mockReturnValue(new Promise<VoiceProfile>((resolve) => {
      finishSave = resolve;
    }));

    render(<AdvancedVoiceControls disabled={false} referenceFile={voice} onReferenceFile={jest.fn()} />);
    const saveButton = screen.getByRole("button", { name: "Save locally" }) as HTMLButtonElement;
    fireEvent.click(saveButton);
    expect(saveButton.disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Record my voice" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(saveButton);
    expect(saveVoiceProfile).toHaveBeenCalledTimes(1);

    await act(async () => { finishSave(saved); });
    await waitFor(() => expect(saveButton.disabled).toBe(false));
    expect(screen.getByText("Voice saved locally in this browser.")).not.toBeNull();
  });
});
