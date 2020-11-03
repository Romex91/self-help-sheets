import React from "react";
import {
  IconButton,
  InputBase,
  makeStyles,
  Typography,
  Collapse,
  Hidden,
} from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import DeleteIcon from "@material-ui/icons/Delete";
import moment from "moment";
import { EmojiPicker } from "./EmojiPicker";
import { Popup } from "./Popup";
import { EntryModel, EntryStatus, LastChange } from "./EntryModel";

const paperStyle = (theme) => ({
  border: "solid",
  borderRadius: 4,
  backgroundColor: theme.palette.background.paper,
  padding: ({ focused }) => (focused ? 4 : 5),
  borderWidth: ({ focused }) => {
    return focused === true ? 2 : 1;
  },
  borderColor: ({ focused }) => {
    return focused === true ? theme.palette.primary.light : "gray";
  },
});

const useStyles = makeStyles((theme) => ({
  inner: {
    display: "flex",
    flex: 1,

    flexDirection: "column",
    position: "relative",
    [theme.breakpoints.up("sm")]: paperStyle(theme),
  },
  input: {
    padding: "0px 7px",
    marginTop: ({ hasCreationTime }) => (hasCreationTime ? 0 : 19),
    minHeight: ({ hasEmoji }) => (hasEmoji ? 76 : 76 + 28),
    alignItems: "flex-start",
  },
  outer: {
    display: "flex",
    alignItems: "flex-start",
    flexDirection: "row",
    [theme.breakpoints.down("xs")]: paperStyle(theme),
  },
  date: {
    border: "0px !important",
    marginBottom: "0px !important",
    paddingBottom: "0px !important",
  },
  hint: {
    backgroundColor: theme.palette.background.paper,
    whiteSpace: "pre-line",
  },
}));

function SubItem({
  onFocus: onFocusOuter,
  emojiText,
  emojiArray,
  onDelete,
  creationTime,
  onEmojiArrayChange,
  onCollapseExited,
  collapsed,
  example,
  deleteXsDown,
  deleteSmUp,
  ...props
}) {
  const [focused, setFocused] = React.useState(false);
  const [emojiFocused, setEmojiFocused] = React.useState(false);

  React.useEffect(() => {
    if (focused) {
      onFocusOuter(null, true);
    }
  }, [focused, onFocusOuter]);

  const classes = useStyles({
    hasCreationTime: !!creationTime,
    hasEmoji: emojiArray.length > 0,
    focused: focused || emojiFocused,
  });
  const inputRef = React.useRef();

  const onFocus = (event) => {
    setFocused(true);
    onFocusOuter(event);
  };

  const onBlur = (event) => {
    setFocused(false);
  };

  const onEmojiFocused = (event) => {
    onFocusOuter(event);
    setEmojiFocused(true);
  };
  const onEmojiBlur = (event) => {
    setEmojiFocused(false);
  };

  React.useEffect(() => {
    if (!collapsed && props.autoFocus) {
      inputRef.current.focus();
    }
  }, [collapsed, props.autoFocus]);

  return (
    <Collapse
      in={!collapsed}
      onExited={onCollapseExited}
      onEntered={() => {
        if (props.autoFocus) {
          inputRef.current.focus();
        }
      }}
    >
      <div className={classes.outer}>
        <div
          className={classes.inner}
          onClick={(event) => {
            if (window.getSelection().toString().length === 0) {
              inputRef.current.focus();
            }
          }}
        >
          {creationTime && (
            <Typography variant="caption" color="textSecondary" align="center">
              {moment(creationTime).format("h:mm a")}
            </Typography>
          )}

          <InputBase
            className={classes.input}
            fullWidth
            multiline
            placeholder={!!props.hint ? props.hint.text : ""}
            variant="outlined"
            inputRef={inputRef}
            onFocus={onFocus}
            onBlur={onBlur}
            {...props}
          />
          <EmojiPicker
            text={emojiText}
            onEmojiArrayChange={onEmojiArrayChange}
            emojiArray={emojiArray}
            inputRef={inputRef}
            onFocus={onEmojiFocused}
            onBlur={onEmojiBlur}
          ></EmojiPicker>
          {props.hint != null &&
            props.hint.isEnabled &&
            props.value.length > 0 && (
              <Popup in={focused}>
                <Typography
                  className={classes.hint}
                  color="textSecondary"
                  padding={10}
                >
                  {props.hint.text}
                </Typography>
              </Popup>
            )}
        </div>

        <Hidden xsDown={!deleteXsDown} smUp={!deleteSmUp}>
          <IconButton
            disabled={!!example}
            aria-label="delete"
            size="small"
            onClick={onDelete}
          >
            <DeleteIcon
              color={!!example ? "disabled" : "action"}
              fontSize="small"
            ></DeleteIcon>
          </IconButton>
        </Hidden>
      </div>
    </Collapse>
  );
}

export const Entry = React.forwardRef(
  (
    {
      onFocus: onFocusOuter,
      onUpdate,
      onRightChanged,
      entry,
      settings,
      ...otherProps
    },
    ref
  ) => {
    const classes = useStyles();

    const initiallyCollapsed = !!entry.text || entry.initiallyCollapsed;
    const [collapsed, setCollapsed] = React.useState(initiallyCollapsed);
    React.useEffect(() => {
      if (initiallyCollapsed) {
        setCollapsed(false);
      }
    }, [initiallyCollapsed]);

    if (!!entry.text) {
      return (
        <tr ref={ref} className={classes.date}>
          <td colSpan={2}>
            <Collapse in={!collapsed}>
              <Typography variant="body2" align="center" color="textSecondary">
                {entry.text}
              </Typography>
            </Collapse>
          </td>
        </tr>
      );
    }

    console.assert(entry instanceof EntryModel);

    React.useEffect(() => {
      if (entry.initiallyCollapsed) {
        onUpdate(entry.setInitiallyCollapsed(false), true);
      }
    }, [entry, onUpdate]);

    React.useEffect(() => {
      if (entry.data === EntryStatus.HIDDEN) onUpdate(entry.show(), true);
    });

    let emojiLeft = [];
    let emojiRight = [];

    if (settings != null) {
      for (let i = 0; i < settings.emojiList.length; i++) {
        emojiLeft.push({
          value: entry.emojiArrays[0][i] == null ? 0 : entry.emojiArrays[0][i],
          ...settings.emojiList[i],
        });
        emojiRight.push({
          value: entry.emojiArrays[1][i] == null ? 0 : entry.emojiArrays[1][i],
          ...settings.emojiList[i],
        });
      }
    }

    const onEntryChanged = (updatedEntry) => {
      onUpdate(updatedEntry);
    };

    const onFocus = (event, alreadyFocused) => {
      if (entry.focused) onUpdate(entry.setFocused(false), true);
      if (!alreadyFocused && !!onFocusOuter) onFocusOuter(event);
    };

    return (
      <tr ref={ref}>
        <td key="issueElement">
          {entry.isDataLoaded() ? (
            <SubItem
              autoFocus={
                entry.focused && entry.lastChange !== LastChange.EDIT_RIGHT
              }
              color="secondary"
              creationTime={entry.creationTime}
              value={entry.left}
              onChange={(event) =>
                onEntryChanged(entry.setLeft(event.target.value))
              }
              onFocus={onFocus}
              onDelete={() => {
                setCollapsed(true);
              }}
              deleteXsDown
              collapsed={collapsed}
              hint={settings == null ? null : settings.leftHint}
              emojiText="How do you feel now?"
              emojiArray={emojiLeft}
              onEmojiArrayChange={(newLeftEmojiArray) =>
                onEntryChanged(
                  entry.setEmojiLeft(newLeftEmojiArray.map((x) => x.value))
                )
              }
              {...otherProps}
            ></SubItem>
          ) : (
            <Skeleton variant="rect" height={135}></Skeleton>
          )}
        </td>

        <td key="resolutionElement">
          {entry.isDataLoaded() ? (
            <SubItem
              autoFocus={
                entry.focused && entry.lastChange === LastChange.EDIT_RIGHT
              }
              color="primary"
              variant="outlined"
              value={entry.right}
              onChange={(event) =>
                onEntryChanged(entry.setRight(event.target.value))
              }
              onFocus={onFocus}
              deleteSmUp
              onDelete={() => {
                setCollapsed(true);
              }}
              collapsed={collapsed}
              onCollapseExited={(event) => onUpdate(entry.delete())}
              hint={settings == null ? null : settings.rightHint}
              emojiText="How do you feel after writing resolution?"
              emojiArray={emojiRight}
              onEmojiArrayChange={(newRightEmojiArray) =>
                onEntryChanged(
                  entry.setEmojiRight(newRightEmojiArray.map((x) => x.value))
                )
              }
              {...otherProps}
            />
          ) : (
            <Skeleton variant="rect" height={135}></Skeleton>
          )}
        </td>
      </tr>
    );
  }
);
