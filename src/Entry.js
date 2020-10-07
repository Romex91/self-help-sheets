import React from "react";
import { TextField } from "@material-ui/core";

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
        (this.left === "" && this.right === ""))
    );
  }

  get data() {
    if (this._data instanceof Object) return { ...this._data };
    return this._data;
  }

  get key() {
    return this._key;
  }

  get left() {
    if (!this.isDataLoaded()) return "";
    return this._data.left;
  }

  get right() {
    if (!this.isDataLoaded()) return "";
    return this._data.right;
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
    return new EntryModel(this._key, { left: "", right: "" });
  }

  show() {
    return new EntryModel(this._key, EntryStatus.LOADING);
  }

  constructor(key, data) {
    this._data = data;
    this._key = key;
  }
}

export const Entry = React.forwardRef(
  ({ onUpdate, onRightChanged, entry, ...otherProps }, ref) => {
    console.assert(entry instanceof EntryModel);

    React.useEffect(() => {
      if (entry.data === EntryStatus.HIDDEN) onUpdate(entry.show());
    });

    return (
      <tr ref={ref}>
        <td key="issueElement">
          <h5>issue</h5>
          <TextField
            color="secondary"
            fullWidth
            multiline
            placeholder="What bothers you?"
            variant="outlined"
            onChange={(event) => onUpdate(entry.setLeft(event.target.value))}
            value={entry.left}
            {...otherProps}
          />
        </td>

        <td key="resolutionElement">
          <h5>resolution</h5>
          <TextField
            color="primary"
            fullWidth
            multiline
            placeholder="What can you do to resolve the problem?"
            variant="outlined"
            onChange={(event) => onUpdate(entry.setRight(event.target.value))}
            value={entry.right}
            {...otherProps}
          />
        </td>
      </tr>
    );
  }
);
