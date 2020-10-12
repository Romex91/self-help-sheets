import React from "react";
import {
  IconButton,
  InputBase,
  makeStyles,
  Typography,
} from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import { EmojiPicker } from "./EmojiPicker";
import DeleteIcon from "@material-ui/icons/Delete";

export const EntryStatus = {
  // The http request for the text of the entry has been sent.
  LOADING: "loading",
  // This entry has never been rendered because user never
  // scrolled to its position.
  HIDDEN: "hidden",
  // User pressed DELETE button.
  DELETED: "deleted",
};

// EntryModel is immutable. setLeft setRight delete and clear return a new copy.
export class EntryModel {
  isDataLoaded() {
    return (
      this._data !== EntryStatus.LOADING && this._data !== EntryStatus.HIDDEN
    );
  }

  isVacant() {
    return (
      this.isDataLoaded() &&
      (this.data === EntryStatus.DELETED ||
        (this._emojiArrays.every((x) => x.length === 0) &&
          this.left === "" &&
          this.right === ""))
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
    return this._data.description;
  }

  get left() {
    if (!this.isDataLoaded()) return "";
    return this._data.left;
  }

  get right() {
    if (!this.isDataLoaded()) return "";
    return this._data.right;
  }

  get emojiArrays() {
    return this._emojiArrays;
  }

  get creationTime() {
    return this._creationTime;
  }

  setLeft(left) {
    if (!this.isDataLoaded()) {
      console.error("bad status");
      return this;
    }

    return new EntryModel(
      this._key,
      { ...this._data, left },
      this._emojiArrays,
      this._creationTime
    );
  }

  setRight(right) {
    if (!this.isDataLoaded()) {
      console.error("bad status");
      return this;
    }
    return new EntryModel(
      this._key,
      { ...this._data, right },
      this._emojiArrays,
      this._creationTime
    );
  }

  delete() {
    return new EntryModel(this._key, EntryStatus.DELETED);
  }

  clear() {
    return new EntryModel(this._key, { left: "", right: "", description: "" });
  }

  show() {
    return new EntryModel(this._key, EntryStatus.LOADING);
  }

  setEmojiArrays(left, right) {
    return this.setDescription(
      EntryModel._generateDescription(
        left.map((x) => x.value),
        right.map((x) => x.value),
        this._creationTime
      )
    );
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

  setDescription(description) {
    if (!this.isDataLoaded()) {
      return this;
    }

    let emojiArrays = [[], []];
    let creationTime;
    if (typeof description === "string") {
      const [serializedEmoji, serializedCreationTime] = description.split("-");

      {
        const all = Array.from(serializedEmoji).map((x) => Number(x));
        var half_length = Math.ceil(all.length / 2);
        let left = all.slice(0, half_length);
        let right = all.slice(half_length);
        emojiArrays = [left, right];
      }

      creationTime = new Date(Number(serializedCreationTime));
      if (isNaN(creationTime.getTime())) {
        creationTime = null;
      }
    }
    return new EntryModel(
      this._key,
      { ...this._data, description },
      emojiArrays,
      creationTime
    );
  }

  constructor(key, data, emojiArrays, creationTime) {
    this._data = data;
    this._key = key;

    this._emojiArrays = emojiArrays != null ? emojiArrays : [[], []];
    this._creationTime = creationTime;
  }

  _data;
  _key;
  // Cached values for performance. Got recomputed only when setDescription is called.
  _emojiArrays;
  _creationTime;

  static _generateDescription(left, right, creationTime) {
    let descrciption;
    if (left.every((x) => x === 0) && right.every((x) => x === 0)) {
      descrciption = "";
    } else {
      descrciption = left.join("") + right.join("");
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
  },
  outer: {
    padding: 5,
    display: "flex",
    alignItems: "flex-start",
    flexDirection: "row",
    border: "lightgray solid 1px",
    borderRadius: 4,
  },
}));

function SubItem({
  emojiText,
  emojiArray,
  onDelete,
  isFirst,
  creationTime,
  onEmojiArrayChange,
  ...props
}) {
  const classes = useStyles();
  const inputRef = React.useRef();
  return (
    <div className={classes.outer}>
      <div className={classes.inner}>
        {creationTime && (
          <Typography
            variant="caption"
            onClick={() => inputRef.current.focus()}
            color="textSecondary"
            align="center"
          >
            {creationTime.getHours().toString().padStart(2, "0")}:
            {creationTime.getMinutes().toString().padStart(2, "0")}
          </Typography>
        )}

        <InputBase
          className={classes.input}
          fullWidth
          multiline
          variant="outlined"
          inputRef={inputRef}
          {...props}
        />
        <EmojiPicker
          text={emojiText}
          onEmojiArrayChange={onEmojiArrayChange}
          emojiArray={emojiArray}
          inputRef={inputRef}
        ></EmojiPicker>
      </div>
      {!!onDelete && (
        <IconButton aria-label="delete" size="small" onClick={onDelete}>
          <DeleteIcon
            color={isFirst ? "disabled" : "action"}
            fontSize="small"
          ></DeleteIcon>
        </IconButton>
      )}
    </div>
  );
}

export const Entry = React.forwardRef(
  (
    { isFirst, onUpdate, onRightChanged, entry, settings, ...otherProps },
    ref
  ) => {
    if (entry instanceof Date) {
      let dateString = "";
      let now = new Date(Date.now());
      if (
        entry.getYear() === now.getYear() &&
        entry.getMonth() === now.getMonth() &&
        entry.getDay() === now.getDay()
      ) {
        dateString = "Today";
      } else {
        dateString = entry.toDateString();
      }
      return (
        <tr ref={ref}>
          <td>{dateString}</td>
        </tr>
      );
    }

    console.assert(entry instanceof EntryModel);

    React.useEffect(() => {
      if (entry.data === EntryStatus.HIDDEN) onUpdate(entry.show());
    });

    let emojiLeft = [];
    let emojiRight = [];

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

    const onEntryChanged = (updatedEntry) => {
      if (isFirst)
        updatedEntry = updatedEntry.setCreationTime(new Date(Date.now()));

      onUpdate(updatedEntry);
    };

    return (
      <tr ref={ref}>
        <td key="issueElement">
          <h5>issue</h5>
          {entry.isDataLoaded() ? (
            <SubItem
              color="secondary"
              creationTime={!isFirst && entry.creationTime}
              placeholder={
                isFirst
                  ? "Start typing to create a new item."
                  : "What bothers you?"
              }
              value={entry.left}
              onChange={(event) =>
                onEntryChanged(entry.setLeft(event.target.value))
              }
              emojiText="How do you feel now?"
              emojiArray={emojiLeft}
              onEmojiArrayChange={(newLeftEmojiArray) =>
                onEntryChanged(
                  entry.setEmojiArrays(newLeftEmojiArray, emojiRight)
                )
              }
              {...otherProps}
            ></SubItem>
          ) : (
            <Skeleton variant="rect" height={56}></Skeleton>
          )}
        </td>

        <td key="resolutionElement">
          <h5>resolution</h5>
          {entry.isDataLoaded() ? (
            <SubItem
              color="primary"
              placeholder={
                isFirst
                  ? "Start typing to create a new item."
                  : "What can you do to resolve the problem?"
              }
              isFirst={isFirst}
              variant="outlined"
              value={entry.right}
              onDelete={(event) => onUpdate(entry.delete())}
              onChange={(event) =>
                onEntryChanged(entry.setRight(event.target.value))
              }
              emojiText="How do you feel after writing resolution?"
              emojiArray={emojiRight}
              onEmojiArrayChange={(newRightEmojiArray) =>
                onEntryChanged(
                  entry.setEmojiArrays(emojiLeft, newRightEmojiArray)
                )
              }
              {...otherProps}
            />
          ) : (
            <Skeleton variant="rect" height={56}></Skeleton>
          )}
        </td>
      </tr>
    );
  }
);
