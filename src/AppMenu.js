import React from "react";

import { gdriveAuthClient } from "./GDriveAuthClient.js";
import { GoogleSignInButton } from "./GoogleSignInButton.js";
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
  Hidden,
  IconButton,
  Modal,
  Slide,
  makeStyles,
  Toolbar,
  Typography,
} from "@material-ui/core";

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

export function AppMenu(props) {
  const classes = useStyles();

  return (
    <React.Fragment>
      <Collapse appear={false} in={props.shown}>
        <Toolbar />
      </Collapse>
      {!props.shown && (
        <IconButton className={classes.showAppBarButton} onClick={props.onShow}>
          <ArrowIcon color="primary" fontSize="large" />
        </IconButton>
      )}
      <Slide appear={false} direction="down" in={props.shown}>
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
    </React.Fragment>
  );
}
