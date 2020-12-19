import React from "react";
import "./App.css";
import "fontsource-roboto";
import {
  createMuiTheme,
  CssBaseline,
  ThemeProvider,
  useMediaQuery,
} from "@material-ui/core";
import { blue, blueGrey } from "@material-ui/core/colors";

import { AppMenu } from "./AppMenu";
import { AppContent } from "./AppContent";
import { gdriveMap } from "./GDriveMap";
import { gdriveAuthClient } from "./GDriveAuthClient";

import { EntriesTableModel } from "./EntriesTableModel";

import { applyQuotaSavers } from "./BackendQuotaSavers/BackendMultiplexor";
import { AuthStates } from "./AuthClient";

// Widen MUI color pallete by adding |aside| to make typescript happy.
declare module "@material-ui/core/styles/createPalette" {
  interface TypeBackground {
    aside: string;
  }
}

function App(): JSX.Element {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const theme = React.useMemo(
    () =>
      createMuiTheme({
        palette: {
          type: prefersDarkMode ? "dark" : "light",
          primary: { main: prefersDarkMode ? blueGrey[900] : blue[800] },
          background: {
            default: prefersDarkMode ? "#303030" : blueGrey[50],
            aside: prefersDarkMode ? "#777" : "lightyellow",
          },
        },
      }),
    [prefersDarkMode]
  );
  const [appBarShown, setAppBarShown] = React.useState(true);
  const onTableEntryFocus = React.useCallback(() => {
    if (window.innerHeight < 700) {
      setAppBarShown(false);
    }
  }, []);

  const onShowAppBar = React.useCallback(() => {
    setAppBarShown(true);
  }, []);

  const [model, setModel] = React.useState<EntriesTableModel | undefined>(
    undefined
  );

  React.useEffect(() => {
    const importPromise = import("./EntriesTableModelImpl");
    gdriveAuthClient.addStateListener(async (newState) => {
      if (newState === AuthStates.SIGNED_IN) {
        const { EntriesTableModelImpl } = await importPromise;
        setModel(
          new EntriesTableModelImpl(
            applyQuotaSavers(gdriveMap),
            gdriveAuthClient
          )
        );
      } else {
        setModel((oldModel) => {
          if (oldModel) oldModel.dispose();
          return undefined;
        });
      }
    });
  }, []);

  const tableProps = model
    ? {
        model,
        appBarShown,
        onShowAppBar,
        example: false,
        onFocus: onTableEntryFocus,
      }
    : undefined;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppMenu shown={appBarShown} model={model}></AppMenu>
      <AppContent tableProps={tableProps} />
    </ThemeProvider>
  );
}

export default App;
