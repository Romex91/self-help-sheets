import React from "react";
import { IconButton, InputBase, makeStyles } from "@material-ui/core";
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
  _data;
  _key;

  isDataLoaded() {
    return (
      this._data !== EntryStatus.LOADING && this._data !== EntryStatus.HIDDEN
    );
  }

  isVacant() {
    return (
      this.isDataLoaded() &&
      (this.data === EntryStatus.DELETED ||
        (this.description === "" && this.left === "" && this.right === ""))
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

  setDescription(description) {
    if (!this.isDataLoaded()) {
      console.error("bad status");
      return this;
    }

    return new EntryModel(this._key, { ...this._data, description });
  }

  setLeft(left) {
    if (!this.isDataLoaded()) {
      console.error("bad status");
      return this;
    }

    return new EntryModel(this._key, { ...this._data, left });
  }

  setRight(right) {
    if (!this.isDataLoaded()) {
      console.error("bad status");
      return this;
    }
    return new EntryModel(this._key, { ...this._data, right });
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

  constructor(key, data) {
    this._data = data;
    this._key = key;
  }
}

function descriptionToEmojiArray(descriptionString, emojiList) {
  if (typeof descriptionString !== "string") return [[], []];
  const all = Array.from(descriptionString).map((x) => Number(x));
  let left = all.slice(0, emojiList.length);
  let right = all.slice(emojiList.length);

  for (let i = 0; i < emojiList.length; i++) {
    left[i] = { value: left[i] == null ? 0 : left[i], ...emojiList[i] };
    right[i] = { value: right[i] == null ? 0 : right[i], ...emojiList[i] };
  }

  return [left, right];
}

function emojiArraysToDescription(left, right) {
  if (left.every((x) => x.value === 0) && right.every((x) => x.value === 0))
    return "";
  return left.map((x) => x.value).join("") + right.map((x) => x.value).join("");
}

const useStyles = makeStyles({
  inner: {
    display: "flex",
    flex: 1,
    flexDirection: "column",
    position: "relative",
  },
  input: {
    padding: "5px 5px 0px 5px",
  },
  outer: {
    display: "flex",
    alignItems: "flex-start",
    flexDirection: "row",
    border: "lightgray solid 1px",
    borderRadius: 4,
  },
});

function SubItem({
  emojiText,
  emojiArray,
  onDelete,
  isFirst,
  onEmojiArrayChange,
  ...props
}) {
  const classes = useStyles();
  return (
    <div className={classes.outer}>
      <div className={classes.inner}>
        <InputBase
          className={classes.input}
          fullWidth
          multiline
          variant="outlined"
          {...props}
        />
        <EmojiPicker
          text={emojiText}
          onEmojiArrayChange={onEmojiArrayChange}
          emojiArray={emojiArray}
        ></EmojiPicker>
      </div>
      {!!onDelete && (
        <IconButton aria-label="delete" size="small" onClick={onDelete}>
          <DeleteIcon
            color={isFirst ? "disabled" : "secondary"}
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
    console.assert(entry instanceof EntryModel);

    React.useEffect(() => {
      if (entry.data === EntryStatus.HIDDEN) onUpdate(entry.show());
    });

    const classes = useStyles();

    const [leftEmojiArray, rightEmojiArray] = descriptionToEmojiArray(
      entry.description,
      settings.emojiList
    );

    return (
      <tr ref={ref}>
        <td key="issueElement">
          <h5>issue</h5>
          {entry.isDataLoaded() ? (
            <SubItem
              color="secondary"
              placeholder={
                isFirst
                  ? "Start typing to create new item."
                  : "What bothers you?"
              }
              value={entry.left}
              onChange={(event) => onUpdate(entry.setLeft(event.target.value))}
              emojiText="How do you feel now?"
              emojiArray={leftEmojiArray}
              onEmojiArrayChange={(newLeftEmojiArray) =>
                onUpdate(
                  entry.setDescription(
                    emojiArraysToDescription(newLeftEmojiArray, rightEmojiArray)
                  )
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
                  ? "Start typing to create new item."
                  : "What can you do to resolve the problem?"
              }
              isFirst={isFirst}
              variant="outlined"
              value={entry.right}
              onDelete={(event) => onUpdate(entry.delete())}
              onChange={(event) => onUpdate(entry.setRight(event.target.value))}
              emojiText="How do you feel after writing resolution?"
              emojiArray={rightEmojiArray}
              onEmojiArrayChange={(newRightEmojiArray) =>
                onUpdate(
                  entry.setDescription(
                    emojiArraysToDescription(leftEmojiArray, newRightEmojiArray)
                  )
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
