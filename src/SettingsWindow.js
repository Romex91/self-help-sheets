import React from "react";
import {
  makeStyles,
  TextField,
  Checkbox,
  FormControlLabel,
  Button,
} from "@material-ui/core";
import { gdriveAuthClient, GDriveStates } from "./GDriveAuthClient";
import { CenteredTypography } from "./CenteredTypography";
import { Settings } from "./Settings";

let useStyles = makeStyles((theme) => ({
  root: {
    position: "absolute",
    top: "5%",
    left: "5%",
    width: "90%",
    height: "90%",
    backgroundColor: theme.palette.background.paper,
    zIndex: 1000,
    display: "flex",
    padding: 50,
  },
}));

function HintControl(props) {
  let styles = useStyles();

  return (
    <div>
      <FormControlLabel
        value="end"
        label={props.label}
        control={
          <Checkbox
            checked={props.value.isEnabled}
            onChange={(event) => {
              props.onChange(props.value.setIsEnabled(event.target.checked));
            }}
          ></Checkbox>
        }
      ></FormControlLabel>
      <TextField
        value={props.value.text}
        onChange={(event) =>
          props.onChange(props.value.setText(event.target.value))
        }
        disabled={!props.value.isEnabled}
        variant="outlined"
        multiline
      ></TextField>
    </div>
  );
}

function SettingsContent(props) {
  let styles = useStyles();

  const [signInState, setSignInState] = React.useState(gdriveAuthClient.state);
  const [settings, setSettings] = React.useState(null);
  const [entries, setEntries] = React.useState([]);

  React.useEffect(() => {
    gdriveAuthClient.addStateListener(setSignInState);
  }, []);

  React.useEffect(() => {
    let onUpdate = (entries, settings) => {
      setSettings((oldSettings) => {
        return oldSettings == null ? settings : oldSettings;
      });
      setEntries(entries);
    };

    if (props.model != null) {
      props.model.subscribe(onUpdate);
    }

    return () => {
      if (props.model != null) {
        props.model.unsubscribe(onUpdate);
      }
    };
  }, [props.model]);

  if (signInState === GDriveStates.SIGNED_OUT) {
    return <CenteredTypography>Sign in to proceed...</CenteredTypography>;
  } else if (
    signInState === GDriveStates.LOADING ||
    settings == null ||
    props.model == null
  ) {
    return <CenteredTypography> Loading...</CenteredTypography>;
  }

  return (
    <React.Fragment>
      <h1>Settings</h1>
      <h2>Hints: </h2>
      <HintControl
        label="Left"
        value={settings.leftHint}
        onChange={(value) => {
          let newSettings = settings.setLeftHint(value);
          props.model.onSettingsUpdate(newSettings);
          setSettings(newSettings);
        }}
      ></HintControl>
      <HintControl
        label="Right"
        value={settings.rightHint}
        onChange={(value) => {
          let newSettings = settings.setRightHint(value);
          props.model.onSettingsUpdate(newSettings);
          setSettings(newSettings);
        }}
      ></HintControl>
      <Button
        onClick={() => {
          if (window.confirm("Reset settings?")) {
            let newSettings = new Settings();
            props.model.onSettingsUpdate(newSettings);
            setSettings(newSettings);
          }
        }}
      >
        Reset defaults.
      </Button>
    </React.Fragment>
  );
}

export const SettingsWindow = React.forwardRef((props, ref) => {
  let styles = useStyles();

  return (
    <div className={styles.root} {...props} ref={ref}>
      <SettingsContent {...props}></SettingsContent>
    </div>
  );
});
