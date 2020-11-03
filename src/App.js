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

import { AppMenu } from "./AppMenu.js";
import { AppContent } from "./AppContent.js";
import { gdriveMap } from "./GDriveMap";
import { gdriveAuthClient, GDriveStates } from "./GDriveAuthClient";

import { applyQuotaSavers } from "./BackendQuotaSavers";

function App() {
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
  const onTableEntryFocus = React.useCallback((arg) => {
    if (window.innerHeight < 700) {
      setAppBarShown(false);
    }
  }, []);

  const showAppBar = React.useCallback((arg) => {
    setAppBarShown(true);
  }, []);

  const [model, setModel] = React.useState(null);

  React.useEffect(() => {
    const importPromise = import("./EntriesTableModelImpl");
    gdriveAuthClient.addStateListener(async (newState) => {
      if (newState === GDriveStates.SIGNED_IN) {
        const { EntriesTableModelImpl } = await importPromise;
        setModel(
          new EntriesTableModelImpl(
            applyQuotaSavers(gdriveMap),
            gdriveAuthClient
          )
        );
      } else {
        setModel((oldModel) => {
          if (!!oldModel) oldModel.dispose();
          return null;
        });
      }
    });
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppMenu shown={appBarShown} model={model}></AppMenu>
      <AppContent
        onFocus={onTableEntryFocus}
        appBarShown={appBarShown}
        onShowAppBar={showAppBar}
        model={model}
      />
    </ThemeProvider>
  );
}

export default App;
