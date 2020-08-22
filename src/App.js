import React from "react";
import "./App.css";
import { gdriveAuthClient } from "./GDriveAuthClient.js";
import { GoogleSignInButton } from "./GoogleSignInButton.js";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <GoogleSignInButton gdriveAuthClient={gdriveAuthClient} />
      </header>
    </div>
  );
}

export default App;
