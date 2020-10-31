import React, { Suspense } from "react";

import { ErrorBoundary } from "react-error-boundary";
import { Settings as SettingsIcon, Help as HelpIcon } from "@material-ui/icons";
import {
  AppBar,
  Backdrop,
  CircularProgress,
  Collapse,
  Grid,
  Hidden,
  IconButton,
  makeStyles,
  Modal,
  Slide,
  Toolbar,
  Typography,
} from "@material-ui/core";

import { gdriveAuthClient } from "./GDriveAuthClient.js";
import { GoogleSignInButton } from "./GoogleSignInButton.js";
import { HelpWindow } from "./HelpWindow.js";
import { CenteredTypography } from "./CenteredTypography";
import isBot from "isbot";
import KeyboardEventHandler from "react-keyboard-event-handler";
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
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  modalWindow: {
    maxWidth: 1000,
    height: "90%",
    width: "90%",
    backgroundColor: theme.palette.background.default,
    zIndex: 1000,
    borderRadius: 4,
    overflow: "auto",
    display: "flex",
    padding: 30,
    [theme.breakpoints.down("xs")]: {
      padding: 10,
    },
  },
}));

function ModalWindowButton({ setOpen, open, ...props }) {
  const styles = useStyles();
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
      <Modal open={open} className={styles.modal} onClose={onWindowClose}>
        <div className={styles.modalWindow}>
          <ErrorBoundary
            fallback={
              <CenteredTypography>
                Something went wrong. <br />
                Reload the page. <br />
                Ц_Ц
              </CenteredTypography>
            }
          >
            <KeyboardEventHandler isExclusive />
            <Suspense
              fallback={
                <React.Fragment>
                  <Backdrop invisible open={true}>
                    <CircularProgress color="inherit" />
                  </Backdrop>
                  <CenteredTypography>Loading...</CenteredTypography>
                </React.Fragment>
              }
            >
              {React.cloneElement(props.children[1], {
                onClose: onWindowClose,
              })}
            </Suspense>
          </ErrorBoundary>
        </div>
      </Modal>
    </React.Fragment>
  );
}

let isFirstRender = true;
const urlParams = new URLSearchParams(window.location.search);

export function AppMenu(props) {
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(
    (isFirstRender && !!urlParams.get("help")) ||
      isBot(window.navigator.userAgent)
  );

  const classes = useStyles();
  React.useEffect(() => {
    isFirstRender = false;
  }, []);
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
                  <Typography align="center">Self-help sheets</Typography>
                </Hidden>
              </Grid>
              <Grid item className={classes.buttonsContainer} xs={8} sm={4}>
                <ModalWindowButton open={helpOpen} setOpen={setHelpOpen}>
                  <HelpIcon />
                  <HelpWindow
                    onOpenSettings={() => {
                      setHelpOpen(false);
                      setSettingsOpen(true);
                    }}
                  ></HelpWindow>
                </ModalWindowButton>

                <ModalWindowButton
                  open={settingsOpen}
                  setOpen={setSettingsOpen}
                  edge="start"
                >
                  <SettingsIcon />

                  <SettingsWindow model={props.model} />
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
