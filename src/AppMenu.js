import React from "react";

import { gdriveAuthClient } from "./GDriveAuthClient.js";
import { GoogleSignInButton } from "./GoogleSignInButton.js";
import { HelpWindow } from "./HelpWindow.js";
import { SettingsWindow } from "./SettingsWindow.js";

import { Settings as SettingsIcon, Help as HelpIcon } from "@material-ui/icons";

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
  settingsLabel: {
    paddingRight: 50,
  },
});

function ModalWindowButton(props) {
  const [open, setOpen] = React.useState(false);
  const onButtonClick = () => {
    setOpen(true);
  };

  React.useEffect(() => {
    if (props.model) props.model.setIgnoreKeys(open);
  }, [open, props.model]);

  const onWindowClose = () => {
    if (props.model != null) {
      props.model.setIgnoreKeys(false);
    }

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
      <Slide appear={false} direction="down" in={props.shown}>
        <AppBar>
          <Toolbar>
            <ModalWindowButton model={props.model} edge="start">
              <SettingsIcon />
              <SettingsWindow model={props.model} />
            </ModalWindowButton>
            <Hidden xsDown>
              <Typography className={classes.settingsLabel}>
                Settings
              </Typography>
            </Hidden>

            <Typography
              className={classes.placeholder}
              variant="body2"
              align="center"
            >
              Self-help sheets
              <Hidden xsDown>
                <br />
                Document your inner dialog
              </Hidden>
            </Typography>

            <ModalWindowButton>
              <HelpIcon />
              <HelpWindow></HelpWindow>
            </ModalWindowButton>

            <GoogleSignInButton
              gdriveAuthClient={gdriveAuthClient}
            ></GoogleSignInButton>
          </Toolbar>
        </AppBar>
      </Slide>
    </React.Fragment>
  );
}
