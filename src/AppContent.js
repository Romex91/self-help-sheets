import React from "react";
import { EntriesTable } from "./EntriesTable.js";
import { gdriveAuthClient, GDriveStates } from "./GDriveAuthClient";
import { CenteredTypography } from "./CenteredTypography";

export function AppContent({ model, ...props }) {
  const [signInState, setSignInState] = React.useState(gdriveAuthClient.state);
  React.useEffect(() => {
    gdriveAuthClient.addStateListener(setSignInState);
  }, []);

  if (signInState === GDriveStates.SIGNED_IN && !!model) {
    return <EntriesTable {...props} model={model} />;
  } else if (signInState === GDriveStates.SIGNED_OUT) {
    return <CenteredTypography>Sign in to proceed...</CenteredTypography>;
  } else {
    return <CenteredTypography> Loading...</CenteredTypography>;
  }
}