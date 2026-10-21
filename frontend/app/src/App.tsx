import React from "react";
import HomeScreen from "./screens/HomeScreen";
import { REPO_URL } from "./screens/HomeScreenUtil";

const App: React.FC = () => {
  return (
    <div className="app-root">
      <div className="app-shell">
        <header className="app-header">
          <div className="brand-lockup">
            <div className="brand-symbol" aria-hidden="true">
              <span /><span /><span /><span /><span />
            </div>
            <div className="brand-copy">
              <a href={REPO_URL} target="_blank" rel="noreferrer">
                <h1 className="app-title">Client-Side Speech AI</h1>
              </a>
              <p className="app-subtitle">
                Text to Speech, Speech to Text in your browser. No installation. No account. No payment. 
              </p>
            </div>
          </div>
        </header>

        <HomeScreen />
      </div>
    </div>
  );
};

export default App;
