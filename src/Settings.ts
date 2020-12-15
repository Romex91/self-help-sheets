import assert  from "assert";

interface HintData {
  isEnabled: boolean;
  text: string;
}

interface EmojiItem {
  codePoint: number;
  text: string;
}

interface SettingsData {
  emojiList: EmojiItem[];
  leftHint: HintData;
  rightHint: HintData;
}

class Hint implements HintData {
  private _isEnabled: boolean = false;
  private _text: string = "";

  get isEnabled() {
    return this._isEnabled;
  }
  get text() {
    return this._text;
  }

  setIsEnabled(isEnabled: boolean) {
    return new Hint({ isEnabled, text: this._text });
  }

  setText(text: string) {
    return new Hint({ text, isEnabled: this._isEnabled });
  }

  // TODO: write tests with wrong settings format

  constructor(data: HintData | string) {
    if (typeof data === "string") data = JSON.parse(data) as HintData;
    assert(typeof data !== "string");

    if (
      data == undefined ||
      data.text == undefined ||
      data.isEnabled == undefined
    )
      throw new Error("Wrong hint data " + JSON.stringify(data));

    this._isEnabled = data.isEnabled;
    this._text = data.text;
  }
}

export class Settings implements SettingsData {
  _emojiList: EmojiItem[] = [];
  _leftHint: HintData = { isEnabled: false, text: "" };
  _rightHint: HintData = { isEnabled: false, text: "" };

  get emojiList() {
    return this._emojiList;
  }

  get leftHint() {
    return this._leftHint;
  }
  get rightHint() {
    return this._rightHint;
  }

  setEmojiList(emojiList: EmojiItem[]) {
    return new Settings({
      emojiList,
      leftHint: this._leftHint,
      rightHint: this._rightHint,
    });
  }
  setLeftHint(leftHint: HintData) {
    return new Settings({
      emojiList: this._emojiList,
      leftHint,
      rightHint: this._rightHint,
    });
  }

  setRightHint(rightHint: HintData) {
    return new Settings({
      emojiList: this._emojiList,
      leftHint: this._leftHint,
      rightHint,
    });
  }

  stringify() {
    return JSON.stringify({
      emojiList: this._emojiList,
      leftHint: JSON.stringify(this._leftHint),
      rightHint: JSON.stringify(this._rightHint),
    });
  }

  constructor(json: string | SettingsData) {
    try {
      if (typeof json === "string") json = JSON.parse(json) as SettingsData;
      assert(typeof json !== "string");

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
}
