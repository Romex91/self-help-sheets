import React, { Suspense } from "react";

import { ErrorBoundary } from "react-error-boundary";
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
  Grid,
} from "@material-ui/core";

import { gdriveAuthClient } from "./GDriveAuthClient.js";
import { GoogleSignInButton } from "./GoogleSignInButton.js";
import { HelpWindow } from "./HelpWindow.js";
import { CenteredTypography } from "./CenteredTypography";
const SettingsWindow = React.lazy(() => import("./SettingsWindow"));

const useStyles = makeStyles((theme) => ({
  buttonsContainer: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
  },

  titleContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },

  modal: {
    position: "absolute",
    top: "5%",
    left: "5%",
    width: "90%",
    height: "90%",
    backgroundColor: theme.palette.background.default,
    zIndex: 1000,
    borderRadius: 4,
    overflow: "auto",
    padding: 10,
    [theme.breakpoints.up("sm")]: {
      padding: 30,
    },
  },
}));

function ModalWindowButton(props) {
  const [open, setOpen] = React.useState(false);
  const styles = useStyles();
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
        <div className={styles.modal}>
          {React.cloneElement(props.children[1], { onClose: onWindowClose })}
        </div>
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
            <Grid container justify="space-between">
              <Hidden xsDown>
                <Grid item xs={4}></Grid>
              </Hidden>
              <Grid item xs={4} className={classes.titleContainer}>
                <Hidden xsDown>
                  <Typography variant="h6" align="center">
                    Self-help sheets
                  </Typography>
                  <Typography variant="caption" align="center">
                    Document your inner dialog
                  </Typography>
                </Hidden>
                <Hidden smUp>
                  <Typography variant="h7" align="center">
                    Self-help sheets
                  </Typography>
                </Hidden>
              </Grid>
              <Grid item className={classes.buttonsContainer} xs={8} sm={4}>
                <ModalWindowButton>
                  <HelpIcon />
                  <HelpWindow></HelpWindow>
                </ModalWindowButton>

                <ModalWindowButton model={props.model} edge="start">
                  <SettingsIcon />

                  <ErrorBoundary>
                    <Suspense
                      fallback={
                        <CenteredTypography>Ladding...</CenteredTypography>
                      }
                    >
                      <SettingsWindow model={props.model} />
                    </Suspense>
                  </ErrorBoundary>
                </ModalWindowButton>

                <GoogleSignInButton
                  gdriveAuthClient={gdriveAuthClient}
                ></GoogleSignInButton>
              </Grid>
            </Grid>
          </Toolbar>
        </AppBar>
      </Slide>
    </React.Fragment>
  );
}
