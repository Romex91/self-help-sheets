import React from "react";
import {
  IconButton,
  InputBase,
  makeStyles,
  Typography,
  Collapse,
} from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import DeleteIcon from "@material-ui/icons/Delete";
import moment from "moment";
import { EmojiPicker } from "./EmojiPicker";
import { Popup } from "./Popup";

export const EntryStatus = {
  // The http request for the text of the entry has been sent.
  LOADING: "loading",
  // This entry has never been rendered because user never
  // scrolled to its position.
  HIDDEN: "hidden",
  // User pressed DELETE button.
  DELETED: "deleted",
};

const LastChange = {
  EDIT_LEFT: "editLeft",
  EDIT_RIGHT: "editRight",
  NONE: "none",
};

// EntryModel is immutable. setLeft setRight delete and clear return a new copy.
export class EntryModel {
  isDataLoaded() {
    return (
      this._data !== EntryStatus.LOADING && this._data !== EntryStatus.HIDDEN
    );
  }

  get data() {
    if (this._data instanceof Object) return { ...this._data };
    return this._data;
  }

  get key() {
    return this._key;
  }

  get description() {
    if (!this.isDataLoaded()) return "";
    return this._description;
  }
  setDescription(description) {
    const cloneModel = this.clone();
    cloneModel._setDescriptionImpl(description);
    return cloneModel;
  }

  get left() {
    if (!this.isDataLoaded()) return "";
    return this._data.left;
  }
  setLeft(left) {
    if (!this.isDataLoaded()) {
      console.error("bad status");
      return this;
    }

    const cloneModel = this.clone();
    cloneModel._data = { ...this._data, left };
    cloneModel.lastChange = LastChange.EDIT_LEFT;
    return cloneModel;
  }

  get right() {
    if (!this.isDataLoaded()) return "";
    return this._data.right;
  }
  setRight(right) {
    if (!this.isDataLoaded()) {
      console.error("bad status");
      return this;
    }

    const cloneModel = this.clone();
    cloneModel._data = { ...this._data, right };
    cloneModel.lastChange = LastChange.EDIT_RIGHT;
    return cloneModel;
  }

  get emojiArrays() {
    return this._emojiArrays;
  }

  setEmojiLeft(left) {
    let result = this.setDescription(
      EntryModel._generateDescription(
        left,
        this._emojiArrays[1],
        this._creationTime
      )
    );
    result.lastChange = LastChange.EDIT_LEFT;
    return result;
  }

  setEmojiRight(right) {
    let result = this.setDescription(
      EntryModel._generateDescription(
        this._emojiArrays[0],
        right,
        this._creationTime
      )
    );
    result.lastChange = LastChange.EDIT_RIGHT;
    return result;
  }

  get creationTime() {
    return this._creationTime;
  }
  setCreationTime(creationTime) {
    return this.setDescription(
      EntryModel._generateDescription(
        this._emojiArrays[0],
        this._emojiArrays[1],
        creationTime
      )
    );
  }

  get initiallyCollapsed() {
    return this._initiallyCollapsed;
  }
  setInitiallyCollapsed(collapsed) {
    const cloneModel = this.clone();
    cloneModel._initiallyCollapsed = collapsed;
    return cloneModel;
  }

  get focused() {
    return this._focused;
  }
  setFocused(focused) {
    const cloneModel = this.clone();
    cloneModel._focused = focused;
    return cloneModel;
  }

  delete() {
    return new EntryModel(this._key, EntryStatus.DELETED, EntryStatus.DELETED);
  }

  clear() {
    return new EntryModel(this._key, { left: "", right: "" }, "");
  }

  show() {
    if (this._data !== EntryStatus.HIDDEN)
      throw new Error("show() has been called for entry that is not hidden");
    return new EntryModel(this._key, EntryStatus.LOADING, this._description);
  }

  clone() {
    // this.data creates shallow copy of this._data
    const cloneModel = new EntryModel(this._key, this.data);
    cloneModel._emojiArrays = this._emojiArrays;
    cloneModel._creationTime = this._creationTime;
    cloneModel._description = this._description;
    cloneModel._initiallyCollapsed = this._initiallyCollapsed;
    cloneModel._focused = this._focused;
    cloneModel.lastChange = this.lastChange;

    return cloneModel;
  }

  constructor(key, data, description) {
    this._data = data;
    this._key = key;
    this._initiallyCollapsed = false;
    this._focused = false;
    this.lastChange = LastChange.NONE;
    this._setDescriptionImpl(description);
  }

  _data;
  _description;
  _key;

  _initiallyCollapsed;
  _focused;

  // Cached values for performance. Got recomputed only when setDescription is called.
  _emojiArrays;
  _creationTime;

  _setDescriptionImpl(description) {
    this._emojiArrays = [[], []];
    this._creationTime = null;
    this._description = description;
    if (
      typeof description === "string" &&
      description.length > 0 &&
      description !== EntryStatus.DELETED
    ) {
      const [serializedEmoji, serializedCreationTime] = description.split("-");

      this._emojiArrays = serializedEmoji
        .split(":")
        .map((x) => Array.from(x).map((y) => Number(y)));
      if (this._emojiArrays.length !== 2) this._emojiArrays.push([]);

      this._creationTime = new Date(Number(serializedCreationTime));
      if (isNaN(this._creationTime.getTime())) {
        this._creationTime = null;
      }
    }
  }

  static _generateDescription(left, right, creationTime) {
    let descrciption;
    if (left.every((x) => x === 0) && right.every((x) => x === 0)) {
      descrciption = "";
    } else {
      descrciption = left.join("") + ":" + right.join("");
    }

    if (creationTime != null)
      descrciption = descrciption + "-" + creationTime.getTime();
    return descrciption;
  }
}

const useStyles = makeStyles((theme) => ({
  inner: {
    display: "flex",
    flex: 1,
    flexDirection: "column",
    position: "relative",
  },
  input: {
    padding: 0,
    minHeight: ({ minHeight }) => minHeight,
    alignItems: "flex-start",
  },
  outer: {
    display: "flex",
    alignItems: "flex-start",
    flexDirection: "row",
    border: "solid",
    padding: ({ focused }) => (focused ? 4 : 5),
    borderWidth: ({ focused }) => {
      return focused === true ? 2 : 1;
    },
    borderColor: ({ focused }) => {
      return focused === true ? theme.palette.primary.light : "gray";
    },
    borderRadius: 4,
  },
  date: {
    border: "0px !important",
  },
  hint: {
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
  ...props
}) {
  const [focused, setFocused] = React.useState(false);
  const [emojiFocused, setEmojiFocused] = React.useState(false);

  let minHeight = 47;
  if (!creationTime) minHeight += 19;
  if (emojiArray.length === 0) minHeight += 28;

  React.useEffect(() => {
    if (focused) {
      onFocusOuter(null, true);
    }
  }, [focused, onFocusOuter]);

  const classes = useStyles({
    minHeight,
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
        <div className={classes.inner}>
          {creationTime && (
            <Typography variant="caption" color="textSecondary" align="center">
              {moment(creationTime).format("h:mm a")}
            </Typography>
          )}

          <InputBase
            className={classes.input}
            fullWidth
            multiline
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
          {props.hint != null && props.hint.isEnabled && (
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
        {!!onDelete && (
          <IconButton aria-label="delete" size="small" onClick={onDelete}>
            <DeleteIcon color="action" fontSize="small"></DeleteIcon>
          </IconButton>
        )}
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
              </Typography>{" "}
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
      if (!alreadyFocused) onFocusOuter(event);
    };

    return (
      <tr ref={ref}>
        <td key="issueElement">
          <h5>issue</h5>
          {entry.isDataLoaded() ? (
            <SubItem
              autoFocus={
                entry.focused && entry.lastChange !== LastChange.EDIT_RIGHT
              }
              color="secondary"
              creationTime={entry.creationTime}
              placeholder="What bothers you?"
              value={entry.left}
              onChange={(event) =>
                onEntryChanged(entry.setLeft(event.target.value))
              }
              onFocus={onFocus}
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
            <Skeleton variant="rect" height={106}></Skeleton>
          )}
        </td>

        <td key="resolutionElement">
          <h5>resolution</h5>
          {entry.isDataLoaded() ? (
            <SubItem
              autoFocus={
                entry.focused && entry.lastChange === LastChange.EDIT_RIGHT
              }
              color="primary"
              placeholder="What can you do to resolve the problem?"
              variant="outlined"
              value={entry.right}
              onChange={(event) =>
                onEntryChanged(entry.setRight(event.target.value))
              }
              onFocus={onFocus}
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
            <Skeleton variant="rect" height={106}></Skeleton>
          )}
        </td>
      </tr>
    );
  }
);
