import React from "react";
import {
  makeStyles,
  TextField,
  Checkbox,
  FormControlLabel,
  Grid,
  Paper,
  IconButton,
  Backdrop,
  CircularProgress,
  Button,
  Typography,
} from "@material-ui/core";
import { Delete as DeleteIcon } from "@material-ui/icons";
import Picker from "emoji-picker-react";

import { gdriveAuthClient, GDriveStates } from "./GDriveAuthClient";
import { CenteredTypography } from "./CenteredTypography";
import { Settings } from "./Settings";
import classnames from "classnames";

import { migrateEmoji } from "./migrateEmoji";

const MemoizedEmojiPicker = React.memo(Picker);

const useStyles = makeStyles((theme) => ({
  root: {
    position: "absolute",
    top: "5%",
    left: "5%",
    width: "90%",
    height: "90%",
    backgroundColor: theme.palette.background.paper,
    zIndex: 1000,
    borderRadius: 4,
    overflow: "auto",
    padding: 10,
  },
  emojiIcon: {
    fontSize: 20,
    display: "flex",
    alignItems: "center",
    paddingLeft: 10,
  },
  hintContainer: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    [theme.breakpoints.up("sm")]: {
      width: "49.5%",
    },
  },

  hintContainerRight: {
    float: "right",
  },
  hintContainerLeft: {
    float: "left",
  },

  clear: {
    clear: "both",
    paddingTop: 20,
  },
  button: {
    paddingTop: 20,
  },
  backdrop: {
    zIndex: 1002,
  },
}));

function HintControl(props) {
  let classes = useStyles();

  return (
    <div
      className={classnames({
        [classes.hintContainer]: true,
        [classes.hintContainerLeft]: props.label === "Left",
        [classes.hintContainerRight]: props.label === "Right",
      })}
    >
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
  const classes = useStyles();

  const [signInState, setSignInState] = React.useState(gdriveAuthClient.state);
  const [settings, setSettings] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    gdriveAuthClient.addStateListener(setSignInState);
  }, []);

  React.useEffect(() => {
    let onUpdate = (entries, settings) => {
      setSettings((oldSettings) => {
        return oldSettings == null ? settings : oldSettings;
      });
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

  const onEmojiClick = React.useCallback(
    (_event, emoji) => {
      setSettings((oldSettings) => {
        const codePoint = emoji.emoji.codePointAt(0);
        const text =
          emoji.names.length > 0 ? emoji.names[emoji.names.length - 1] : "";
        if (
          oldSettings.emojiList.findIndex((x) => x.codePoint === codePoint) !==
          -1
        ) {
          alert(text + " is already selected");
          return oldSettings;
        } else {
          const listClone = [...oldSettings.emojiList];
          listClone.push({ codePoint, text });
          const newSettings = oldSettings.setEmojiList(listClone);
          props.model.onSettingsUpdate(newSettings);
          setSettings(newSettings);
        }
      });
    },
    [props.model]
  );

  if (signInState === GDriveStates.SIGNED_OUT) {
    return <CenteredTypography>Sign in to proceed...</CenteredTypography>;
  } else if (
    signInState === GDriveStates.LOADING ||
    settings == null ||
    props.model == null
  ) {
    return <CenteredTypography>Loading...</CenteredTypography>;
  }

  const onDeleteEmoji = async (codePoint) => {
    const listClone = [...settings.emojiList];
    const index = listClone.findIndex((y) => y.codePoint === codePoint);
    if (index === -1) return;
    listClone.splice(index, 1);

    setIsLoading(true);
    const { someValuesAreDeleted, newEntries } = await migrateEmoji(
      props.model,
      settings.emojiList,
      listClone
    );
    setIsLoading(false);

    if (
      someValuesAreDeleted &&
      !window.confirm(
        "This will delete some moods from some of the entries. Are you sure?"
      )
    ) {
      return;
    }

    newEntries.forEach((entry) => {
      props.model.onUpdate(entry);
    });

    const newSettings = settings.setEmojiList(listClone);
    props.model.onSettingsUpdate(newSettings);
    setSettings(newSettings);
  };

  const resetDefaults = async () => {
    let newSettings = new Settings();

    setIsLoading(true);
    const { someValuesAreDeleted, newEntries } = await migrateEmoji(
      props.model,
      settings.emojiList,
      newSettings.emojiList
    );
    setIsLoading(false);

    let consent = someValuesAreDeleted
      ? "This will delete some moods from some entries. Reset settings?"
      : "Reset settings?";

    if (window.confirm(consent)) {
      newEntries.forEach((entry) => {
        props.model.onUpdate(entry);
      });
      props.model.onSettingsUpdate(newSettings);
      setSettings(newSettings);
    }
  };

  return (
    <React.Fragment>
      <Backdrop className={classes.backdrop} open={isLoading}>
        <CircularProgress color="inherit" />
      </Backdrop>
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

      <h2 className={classes.clear}>Moods: </h2>
      <Grid alignItems="flex-start" container spacing={1}>
        {settings.emojiList.map((x) => (
          <Grid item key={x.codePoint}>
            <Paper className={classes.emojiIcon}>
              <Typography>{String.fromCodePoint(x.codePoint)}</Typography>
              <IconButton onClick={() => onDeleteEmoji(x.codePoint)}>
                <DeleteIcon></DeleteIcon>
              </IconButton>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <h2>Add new:</h2>
      <MemoizedEmojiPicker
        disableSkinTonePicker
        disableAutoFocus
        onEmojiClick={onEmojiClick}
      />

      <Button
        className={classes.button}
        color="secondary"
        onClick={resetDefaults}
      >
        Reset defaults
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
