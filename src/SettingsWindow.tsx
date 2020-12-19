import React from "react";
import {
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  makeStyles,
  Paper,
  TextField,
  Typography,
} from "@material-ui/core";
import { Delete as DeleteIcon } from "@material-ui/icons";
import Picker from "emoji-picker-react";

import { gdriveAuthClient } from "./GDriveAuthClient";
import { CenteredTypography } from "./CenteredTypography";
import { Settings, Hint } from "./Settings";
import { LoadingPlaceholder } from "./LoadingPlaceholder";

import { migrateEmoji } from "./migrateEmoji";
import { EntriesSubscription, EntriesTableModel } from "./EntriesTableModel";
import assert from "assert";
import { AuthStates } from "./AuthClient";

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

interface HintControlProps {
  value: Hint;
  label: string;
  onChange(chanedValue: Hint): void;
}

function HintControl(props: HintControlProps) {
  const classes = useStyles();

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

interface SettingsWindowProps {
  model?: EntriesTableModel;
  onClose?(): void;
}
export default function SettingsWindow(
  props: SettingsWindowProps
): JSX.Element {
  const classes = useStyles();

  const [signInState, setSignInState] = React.useState(gdriveAuthClient.state);
  const [settings, setSettings] = React.useState<Settings | undefined>(
    undefined
  );

  React.useEffect(() => {
    gdriveAuthClient.addStateListener(setSignInState);
  }, []);

  React.useEffect(() => {
    const onUpdate: EntriesSubscription = (entries, settings) => {
      setSettings((oldSettings) => {
        return oldSettings == undefined ? settings : oldSettings;
      });
    };

    if (props.model != undefined) {
      props.model.subscribe(onUpdate);
    }

    return () => {
      if (props.model != undefined) {
        props.model.unsubscribe(onUpdate);
      }
    };
  }, [props.model]);

  const onEmojiClick = React.useCallback(
    (_event, emoji) => {
      setSettings((oldSettings?: Settings) => {
        if (!oldSettings) return oldSettings;
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
          props.model?.onSettingsUpdate(newSettings);
          setSettings(newSettings);
        }
      });
    },
    [props.model]
  );

  if (signInState === AuthStates.SIGNED_OUT) {
    return <CenteredTypography>Sign in to proceed...</CenteredTypography>;
  } else if (
    signInState === AuthStates.LOADING ||
    settings == null ||
    props.model == null
  ) {
    return <LoadingPlaceholder />;
  }

  const onDeleteEmoji = async (codePoint: number) => {
    const listClone = [...settings.emojiList];
    const index = listClone.findIndex((y) => y.codePoint === codePoint);
    if (index === -1) return;
    listClone.splice(index, 1);

    assert(props.model);
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
      props.model?.onUpdate(entry, true);
    });

    const newSettings = settings.setEmojiList(listClone);
    props.model.onSettingsUpdate(newSettings);
    setSettings(newSettings);
  };

  const resetDefaults = async () => {
    const newSettings = new Settings("");

    assert(props.model);
    const { someValuesAreDeleted, newEntries } = await migrateEmoji(
      props.model,
      settings.emojiList,
      newSettings.emojiList
    );

    const consent = someValuesAreDeleted
      ? "This will delete some moods from some entries. Reset settings?"
      : "Reset settings?";

    if (window.confirm(consent)) {
      newEntries.forEach((entry) => {
        props.model?.onUpdate(entry, true);
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
              const newSettings = settings.setLeftHint(value);
              props.model?.onSettingsUpdate(newSettings);
              setSettings(newSettings);
            }}
          ></HintControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <HintControl
            label="Right"
            value={settings.rightHint}
            onChange={(value) => {
              const newSettings = settings.setRightHint(value);
              props.model?.onSettingsUpdate(newSettings);
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
