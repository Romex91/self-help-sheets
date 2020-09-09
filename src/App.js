import React from "react";
import "./App.css";
import { gdriveAuthClient } from "./GDriveAuthClient.js";
import { GoogleSignInButton } from "./GoogleSignInButton.js";
import { EntriesTable } from "./EntriesTable.js";
import { makeStyles } from "@material-ui/core/styles";
import { HelpWindow } from "./HelpWindow.js";
import { SettingsWindow } from "./SettingsWindow.js";

import {
  Settings as SettingsIcon,
  ArrowDropDownCircle as ArrowIcon,
  Help as HelpIcon,
} from "@material-ui/icons";

import {
  AppBar,
  Collapse,
  CssBaseline,
  Hidden,
  IconButton,
  Modal,
  Slide,
  Toolbar,
  Typography,
} from "@material-ui/core";
import { red } from "@material-ui/core/colors";

const useStyles = makeStyles({
  placeholder: {
    flex: 1,
  },
  showAppBarButton: {
    position: "fixed",
    top: 0,
    left: "50%",
    transform: "translate(-50%, -30%)",
    zIndex: 2000,
  },
});

function ButtonController(props) {
  const [open, setOpen] = React.useState(false);
  const onButtonClick = () => {
    setOpen(true);
  };
  const onWindowClose = () => {
    setOpen(false);
  };

  return (
    <React.Fragment>
      <IconButton {...props} onClick={onButtonClick}>
        {props.children[0]}
      </IconButton>
      <Modal open={open} onClose={onWindowClose}>
        {props.children[1]}
      </Modal>
    </React.Fragment>
  );
}

function App() {
  const classes = useStyles();
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
    <React.Fragment>
      <CssBaseline />
      <Collapse appear={false} in={appBarShown}>
        <Toolbar />
      </Collapse>
      {!appBarShown && (
        <IconButton className={classes.showAppBarButton} onClick={showAppBar}>
          <ArrowIcon color="primary" fontSize="large" />
        </IconButton>
      )}
      <Slide appear={false} direction="down" in={appBarShown}>
        <AppBar>
          <Toolbar>
            <ButtonController edge="start">
              <SettingsIcon />
              <SettingsWindow />
            </ButtonController>
            <Hidden xsDown>
              <Typography>Settings</Typography>
            </Hidden>

            <Typography
              className={classes.placeholder}
              variant="body2"
              align="center"
            >
              Self help sheets
              <Hidden xsDown>
                <br />
                Document your inner dialog
              </Hidden>
            </Typography>

            <ButtonController>
              <HelpIcon />
              <HelpWindow></HelpWindow>
            </ButtonController>

            <GoogleSignInButton
              gdriveAuthClient={gdriveAuthClient}
            ></GoogleSignInButton>
          </Toolbar>
        </AppBar>
      </Slide>

      <EntriesTable onFocus={onTableEntryFocus} />
    </React.Fragment>
  );
}

export default App;
