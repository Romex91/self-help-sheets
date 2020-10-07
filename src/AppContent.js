import React, { useEffect } from "react";
import { EntriesTable } from "./EntriesTable.js";
import { EntriesTableModelImpl } from "./EntriesTableModel";
import { gdriveAuthClient, GDriveStates } from "./GDriveAuthClient";
import { gdriveMap } from "./GDriveMap";
import { Skeleton } from "@material-ui/lab";
import { applyQuotaSavers } from "./BackendQuotaSavers";

const model = new EntriesTableModelImpl(
  applyQuotaSavers(gdriveMap),
  gdriveAuthClient
);

function keyPress(e) {
  if (e.ctrlKey) {
    if (e.keyCode === 90) model.undo();
    else if (e.keyCode === 89) model.redo();
    else return;
    e.preventDefault();
  }
}
window.onkeydown = keyPress;

export function AppContent(props) {
  const [signInState, setSignInState] = React.useState(gdriveAuthClient.state);
  useEffect(() => {
    gdriveAuthClient.addStateListener(setSignInState);
  }, []);

  if (signInState === GDriveStates.SIGNED_IN) {
    return <EntriesTable {...props} model={model} />;
  } else {
    return <Skeleton />;
  }
}
