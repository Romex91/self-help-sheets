import React from "react";
import "./App.css";
import { gdriveAuthClient } from "./GDriveAuthClient.js";
import { GoogleSignInButton } from "./GoogleSignInButton.js";
import { EntriesTable } from "./EntriesTable.js";
import AppBar from "@material-ui/core/AppBar";

function App() {
  return (
    <div className="App">
      <AppBar>
        <GoogleSignInButton gdriveAuthClient={gdriveAuthClient} />
      </AppBar>

      <EntriesTable />
    </div>
  );
}

export default App;
