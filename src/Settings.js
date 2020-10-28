class Hint {
  _isEnabled;
  _text;

  get isEnabled() {
    return this._isEnabled;
  }
  get text() {
    return this._text;
  }

  setIsEnabled(isEnabled) {
    return new Hint({ isEnabled, text: this._text });
  }

  setText(text) {
    return new Hint({ text, isEnabled: this._isEnabled });
  }

  constructor(data) {
    if (typeof data === "string") data = JSON.parse(data);

    if (typeof data.isEnabled !== "boolean" || typeof data.text !== "string")
      throw new Error("Wrong hint data " + JSON.stringify(data));
    this._isEnabled = data.isEnabled;
    this._text = data.text;
  }

  stringify() {
    return JSON.stringify({ isEnabled: this._isEnabled, text: this._text });
  }
}

export class Settings {
  get emojiList() {
    return this._emojiList;
  }
  get leftHint() {
    return this._leftHint;
  }
  get rightHint() {
    return this._rightHint;
  }

  setEmojiList(emojiList) {
    return new Settings({
      emojiList,
      leftHint: this._leftHint,
      rightHint: this._rightHint,
    });
  }
  setLeftHint(leftHint) {
    return new Settings({
      emojiList: this._emojiList,
      leftHint,
      rightHint: this._rightHint,
    });
  }

  setRightHint(rightHint) {
    return new Settings({
      emojiList: this._emojiList,
      leftHint: this._leftHint,
      rightHint,
    });
  }

  stringify() {
    return JSON.stringify({
      emojiList: this._emojiList,
      leftHint: this._leftHint.stringify(),
      rightHint: this._rightHint.stringify(),
    });
  }

  constructor(json) {
    try {
      if (typeof json === "string") json = JSON.parse(json);

      if (
        !Array.isArray(json.emojiList) ||
        !json.emojiList.every(
          (x) => typeof String.fromCodePoint(x.codePoint) === "string"
        )
      ) {
        throw new Error("Bad emoji list: " + JSON.stringify(json));
      }

      this._emojiList = json.emojiList;
      this._leftHint = new Hint(json.leftHint);
      this._rightHint = new Hint(json.rightHint);
    } catch (error) {
      if (!!json) console.error("Settings format error:" + error.message);
      this._mutateToDefaults();
    }
  }

  _mutateToDefaults() {
    this._leftHint = new Hint({
      isEnabled: true,
      text: "What happened?\nWhat were your immediate thoughts?",
    });

    this._rightHint = new Hint({
      isEnabled: true,
      text:
        "Why is it bad?\n" +
        "What would your therapist say?\n" +
        "Is your view of the problem biased?",
    });

    this._emojiList = [
      { codePoint: 0x1f44e, text: "discontent" },
      { codePoint: 0x1f628, text: "fear" },
      { codePoint: 0x1f622, text: "sadness" },
      { codePoint: 0x1f62d, text: "grief" },
      { codePoint: 0x1f631, text: "horror" },
      { codePoint: 0x1f616, text: "pain" },
      { codePoint: 0x1f621, text: "anger" },
      { codePoint: 0x1f922, text: "disgust" },
    ];
  }

  _emojiList;
  _leftHint;
  _rightHint;
}
