import React from "react";
import "./App.css";
import "fontsource-roboto";
import {
  createMuiTheme,
  CssBaseline,
  ThemeProvider,
  useMediaQuery,
} from "@material-ui/core";
import { AppMenu } from "./AppMenu.js";
import { AppContent } from "./TestingAppContent.js";

function App() {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const theme = React.useMemo(
    () =>
      createMuiTheme({
        palette: {
          type: prefersDarkMode ? "dark" : "light",
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppMenu shown={appBarShown} onShow={showAppBar}></AppMenu>

      <AppContent onFocus={onTableEntryFocus} />
    </ThemeProvider>
  );
}

export default App;
