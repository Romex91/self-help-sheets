import React from "react";
import {
  makeStyles,
  TextField,
  Checkbox,
  FormControlLabel,
  Grid,
  Divider,
  Paper,
  IconButton,
  Button,
  Typography,
} from "@material-ui/core";
import { Delete as DeleteIcon } from "@material-ui/icons";
import Picker from "emoji-picker-react";

import { gdriveAuthClient, GDriveStates } from "./GDriveAuthClient";
import { CenteredTypography } from "./CenteredTypography";
import { Settings } from "./Settings";

import { migrateEmoji } from "./migrateEmoji";

const MemoizedEmojiPicker = React.memo(Picker);

const useStyles = makeStyles((theme) => ({
  emojiIcon: {
    margin: "0px 5px 5px 0px ",
    fontSize: 20,
    display: "flex",
    alignItems: "center",
    paddingLeft: 10,
  },
  hintContainer: {
    display: "flex",
    flexDirection: "column",
  },
  buttons: {
    marginTop: 20,
    display: "flex",
    justifyContent: "space-between",
  },
  input: {
    backgroundColor: theme.palette.background.paper,
  },
}));

function HintControl(props) {
  let classes = useStyles();

  return (
    <div className={classes.hintContainer}>
      <Typography variant="h6">{props.label + ":"}</Typography>
      <FormControlLabel
        value="end"
        label="Enable popup"
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
        className={classes.input}
        variant="outlined"
        multiline
      ></TextField>
    </div>
  );
}

export default function SettingsWindow(props) {
  const classes = useStyles();

  const [signInState, setSignInState] = React.useState(gdriveAuthClient.state);
  const [settings, setSettings] = React.useState(null);

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

    const { someValuesAreDeleted, newEntries } = await migrateEmoji(
      props.model,
      settings.emojiList,
      listClone
    );

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

    const { someValuesAreDeleted, newEntries } = await migrateEmoji(
      props.model,
      settings.emojiList,
      newSettings.emojiList
    );

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
    <Grid container justify="center" spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h4" align="center">
          Settings
        </Typography>
      </Grid>

      <Grid container item xs={12} spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h5">Helper questions</Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <HintControl
            label="Left"
            value={settings.leftHint}
            onChange={(value) => {
              let newSettings = settings.setLeftHint(value);
              props.model.onSettingsUpdate(newSettings);
              setSettings(newSettings);
            }}
          ></HintControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <HintControl
            label="Right"
            value={settings.rightHint}
            onChange={(value) => {
              let newSettings = settings.setRightHint(value);
              props.model.onSettingsUpdate(newSettings);
              setSettings(newSettings);
            }}
          ></HintControl>
        </Grid>

        <Grid item xs={12}>
          <Divider></Divider>
        </Grid>
      </Grid>

      <Grid container item xs={12} spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h5">Moods</Typography>
        </Grid>

        <Grid
          container
          alignItems="flex-start"
          justify="flex-start"
          alignContent="flex-start"
          item
          xs={12}
          sm={6}
        >
          <Grid item xs={12}>
            <Typography variant="h6">Active: </Typography>
          </Grid>
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

        <Grid item xs={12} sm={6}>
          <Typography variant="h6">Add new:</Typography>
          <MemoizedEmojiPicker
            disableSkinTonePicker
            disableAutoFocus
            onEmojiClick={onEmojiClick}
          />
        </Grid>
        <Grid item xs={12} className={classes.buttons}>
          <Button color="secondary" onClick={resetDefaults}>
            Reset defaults
          </Button>

          <Button color="primary" onClick={props.onClose}>
            Close
          </Button>
        </Grid>
      </Grid>
    </Grid>
  );
}
