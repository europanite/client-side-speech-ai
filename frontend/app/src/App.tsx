import React from "react";
import HomeScreen from "./screens/HomeScreen";
import SettingsBar from "./components/SettingsBar";
import { REPO_URL } from "./screens/HomeScreenUtil";

const App: React.FC = () => {
  return (
    <div className="app-root">
      <div className="app-shell">
        <header className="app-header">
          <div>
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              <h1 className="app-title">
                Client-Side Speech AI
              </h1>
            </a>
            <p className="app-subtitle">
              Convert audio to text with Whisper and text to speech with Kokoro or Pocket TTS in your browser. No account required.
            </p>
          </div>
          <SettingsBar />
        </header>

        <HomeScreen />
      </div>
    </div>
  );
};

export default App;
