import React from "react";

const SettingsBar: React.FC = () => {
  return (
    <div className="settings-bar">
      <div className="settings-main">
        <div className="settings-label">Runtime</div>
        <div className="settings-value">Whisper STT + Kokoro / Pocket TTS</div>
      </div>
    </div>
  );
};

export default SettingsBar;
