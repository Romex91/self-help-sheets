import React, { Suspense } from "react";

import { ErrorBoundary } from "react-error-boundary";
import { Settings as SettingsIcon, Help as HelpIcon } from "@material-ui/icons";
import {
  AppBar,
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

import { LoadingPlaceholder } from "./LoadingPlaceholder";
import { gdriveAuthClient } from "./GDriveAuthClient";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { HelpWindow } from "./HelpWindow";
import { CenteredTypography } from "./CenteredTypography";
import isBot from "isbot";
import KeyboardEventHandler from "react-keyboard-event-handler";
import { EntriesTableModel } from "./EntriesTableModel";
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

interface ModalWindowButtonProps {
  setOpen: (isOpen: boolean) => void;
  open: boolean;
  hashString: string;
  edge?: "start";
  children: [JSX.Element, JSX.Element];
}

function ModalWindowButton(
  props: React.PropsWithChildren<ModalWindowButtonProps>
) {
  const styles = useStyles();
  const onButtonClick = () => {
    props.setOpen(true);
  };

  const onWindowClose = () => {
    //TODO: test history and rever in case if it doesn't work
    window.history.replaceState(null, "", " ");
    props.setOpen(false);
  };

  if (props.open && window.location.hash !== "#" + props.hashString) {
    window.location.hash = props.hashString;
  }

  return (
    <React.Fragment>
      <IconButton edge={props.edge} onClick={onButtonClick}>
        {props.children[0]}
      </IconButton>
      <Modal open={props.open} className={styles.modal} onClose={onWindowClose}>
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
            <Suspense fallback={<LoadingPlaceholder />}>
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

interface AppMenuProps {
  shown: boolean;
  model?: EntriesTableModel;
}
export function AppMenu(props: AppMenuProps): JSX.Element {
  const [settingsOpen, setSettingsOpen] = React.useState(
    window.location.hash === "#settings"
  );
  const [helpOpen, setHelpOpen] = React.useState(
    window.location.hash === "#help" || isBot(window.navigator.userAgent)
  );

  React.useEffect(() => {
    const onHashChange = () => {
      setSettingsOpen(window.location.hash === "#settings");
      setHelpOpen(
        window.location.hash === "#help" || isBot(window.navigator.userAgent)
      );
    };
    window.addEventListener("hashchange", onHashChange);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
    };
  });

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
                  <Typography align="center">Self-help sheets</Typography>
                </Hidden>
              </Grid>
              <Grid item className={classes.buttonsContainer} xs={8} sm={4}>
                <ModalWindowButton
                  hashString="help"
                  open={helpOpen}
                  setOpen={setHelpOpen}
                >
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
                  hashString="settings"
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
