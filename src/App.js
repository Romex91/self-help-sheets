import React from "react";
import "./App.css";
import { gdriveAuthClient } from "./GDriveAuthClient.js";
import { GoogleSignInButton } from "./GoogleSignInButton.js";
import { EntriesTable } from "./EntriesTable.js";
import { Settings as SettingsIcon, Help as HelpIcon } from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import { HelpWindow } from "./HelpWindow.js";
import { SettingsWindow } from "./SettingsWindow.js";

import {
  IconButton,
  useScrollTrigger,
  Typography,
  CssBaseline,
  AppBar,
  Toolbar,
  Slide,
  Hidden,
  Modal,
} from "@material-ui/core";
import { red } from "@material-ui/core/colors";

const useStyles = makeStyles({
  placeholder: {
    flex: 1,
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
  const trigger = useScrollTrigger();

  return (
    <React.Fragment>
      <CssBaseline />
      <Toolbar />
      <Slide appear={false} direction="down" in={!trigger}>
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

      <EntriesTable />
    </React.Fragment>
  );
}

export default App;
