export enum EntryStatus {
  // The http request for the text of the entry has been sent.
  LOADING = "loading",
  // This entry has never been rendered because user never
  // scrolled to its position.
  HIDDEN = "hidden",
  // User pressed DELETE button.
  DELETED = "deleted",
}

export enum LastChange {
  EDIT_LEFT,
  EDIT_RIGHT,
  NONE,
}

export interface EntryData {
  left: string;
  right: string;
}

function isEntryData(data: EntryData | EntryStatus): data is EntryData {
  const entryData = data as EntryData;
  return entryData.left !== undefined && entryData.right !== undefined;
}

// EntryModel is immutable. setLeft setRight delete and clear return a new copy.
export class EntryModel {
  _initiallyCollapsed;
  _focused;

  private _description: string = "";

  // Cached values for performance. Gets recomputed only when setDescription is called.
  private _emojiArrays: [number[], number[]] = [[], []];
  private _creationTime?: Date;

  private lastChange: LastChange = LastChange.NONE;

  constructor(
    private _key: string,
    private _data: EntryData | EntryStatus,
    description: string
  ) {
    this._initiallyCollapsed = false;
    this._focused = false;

    this._setDescriptionImpl(description);
  }

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
  setDescription(description: string) {
    const cloneModel = this.clone();
    cloneModel._setDescriptionImpl(description);
    return cloneModel;
  }

  get left() {
    if (!isEntryData(this._data)) return "";
    return this._data.left;
  }
  setLeft(left: string) {
    if (!isEntryData(this._data)) {
      console.error("bad status");
      return this;
    }

    const cloneModel = this.clone();
    cloneModel._data = { ...this._data, left };
    cloneModel.lastChange = LastChange.EDIT_LEFT;
    return cloneModel;
  }

  get right() {
    if (!isEntryData(this._data)) return "";
    return this._data.right;
  }
  setRight(right: string) {
    if (!isEntryData(this._data)) {
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

  setEmojiLeft(left: number[]) {
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

  setEmojiRight(right: number[]) {
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
  setCreationTime(creationTime: Date) {
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
  setInitiallyCollapsed(collapsed: boolean) {
    const cloneModel = this.clone();
    cloneModel._initiallyCollapsed = collapsed;
    return cloneModel;
  }

  get focused() {
    return this._focused;
  }
  setFocused(focused: boolean) {
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
    const cloneModel = new EntryModel(this._key, this.data, "");
    cloneModel._emojiArrays = this._emojiArrays;
    cloneModel._creationTime = this._creationTime;
    cloneModel._description = this._description;
    cloneModel._initiallyCollapsed = this._initiallyCollapsed;
    cloneModel._focused = this._focused;
    cloneModel.lastChange = this.lastChange;

    return cloneModel;
  }

  _setDescriptionImpl(description: string) {
    this._emojiArrays = [[], []];
    this._creationTime = undefined;
    this._description = description;
    if (description.length > 0 && description !== EntryStatus.DELETED) {
      const [serializedEmoji, serializedCreationTime] = description.split("-");

      const [leftEmoji = [], rightEmoji = []] = serializedEmoji
        .split(":")
        .map((x) => Array.from(x).map((y) => Number(y)));

      this._emojiArrays = [leftEmoji, rightEmoji];

      this._creationTime = new Date(Number(serializedCreationTime));
      if (isNaN(this._creationTime.getTime())) {
        this._creationTime = undefined;
      }
    }
  }

  static _generateDescription(
    leftEmoji: number[],
    rightEmoji: number[],
    creationTime?: Date
  ) {
    let descrciption;
    if (leftEmoji.every((x) => x === 0) && rightEmoji.every((x) => x === 0)) {
      descrciption = "";
    } else {
      descrciption = leftEmoji.join("") + ":" + rightEmoji.join("");
    }

    if (creationTime != undefined)
      descrciption = descrciption + "-" + creationTime.getTime();
    return descrciption;
  }
}