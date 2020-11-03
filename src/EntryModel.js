export const EntryStatus = {
  // The http request for the text of the entry has been sent.
  LOADING: "loading",
  // This entry has never been rendered because user never
  // scrolled to its position.
  HIDDEN: "hidden",
  // User pressed DELETE button.
  DELETED: "deleted",
};

export const LastChange = {
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
