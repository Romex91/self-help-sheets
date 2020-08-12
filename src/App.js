import React from "react";
import logo from "./logo.svg";
import "./App.css";
import { gdriveAuthClient, GDriveStates } from "./GDriveAuthClient.js";

function App() {
  let firts_time = true;
  gdriveAuthClient.addStateListener((state) => {
    console.log(state);
    if (!firts_time) return;
    if (state === GDriveStates.SIGNED_OUT) gdriveAuthClient.signIn();
    //    else if (state === GDriveStates.SIGNED_IN) google_drive_client.signOut();
    firts_time = false;
  });

  return (
    <div className="App">
      <header className="App-header">
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
