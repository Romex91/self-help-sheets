import React, { useEffect } from "react";
import { EntriesTable } from "./EntriesTable.js";
import { EntriesTableModelImpl } from "./EntriesTableModel";
import { gdriveAuthClient, GDriveStates } from "./GDriveAuthClient";
import { gdriveMap } from "./GDriveMap";
import { applyQuotaSavers } from "./BackendQuotaSavers";
import { Typography, makeStyles } from "@material-ui/core";

const useStyles = makeStyles({
  container: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
});
function CenteredTypography(props) {
  const classes = useStyles();
  return (
    <div className={classes.container}>
      <Typography variant="h4" {...props}>
        {props.children}
      </Typography>
    </div>
  );
}

export function AppContent(props) {
  const [signInState, setSignInState] = React.useState(gdriveAuthClient.state);
  const [model, setModel] = React.useState(null);

  useEffect(() => {
    gdriveAuthClient.waitForStateChange().then((newState) => {
      if (newState === GDriveStates.SIGNED_IN) {
        setModel(
          new EntriesTableModelImpl(
            applyQuotaSavers(gdriveMap),
            gdriveAuthClient
          )
        );
      } else {
        if (!!model) model.dispose();
        setModel(null);
      }
      setSignInState(newState);
    });
  });

  if (signInState === GDriveStates.SIGNED_IN && !!model) {
    return <EntriesTable {...props} model={model} />;
  } else if (signInState === GDriveStates.SIGNED_OUT) {
    return <CenteredTypography>Sign in to proceed...</CenteredTypography>;
  } else {
    return <CenteredTypography> Loading...</CenteredTypography>;
  }
}
