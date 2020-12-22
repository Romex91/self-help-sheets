import assert from "assert";

export interface HintData {
  isEnabled: boolean;
  text: string;
}

export interface EmojiItem {
  codePoint: number;
  text: string;
}

interface SettingsData {
  emojiList: EmojiItem[];
  leftHint: HintData;
  rightHint: HintData;
}

export class Hint implements HintData {
  private _isEnabled = false;
  private _text = "";

  get isEnabled(): boolean {
    return this._isEnabled;
  }
  get text(): string {
    return this._text;
  }

  setIsEnabled(isEnabled: boolean): Hint {
    return new Hint({ isEnabled, text: this._text });
  }

  setText(text: string): Hint {
    return new Hint({ text, isEnabled: this._isEnabled });
  }

  stringify(): string {
    const hintData: HintData = { isEnabled: this.isEnabled, text: this.text };
    return JSON.stringify(hintData);
  }

  constructor(data: HintData | string) {
    if (typeof data === "string") {
      if (data.length === 0) return;
      data = JSON.parse(data) as HintData;
    }

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
  private _emojiList: EmojiItem[] = [];
  private _leftHint = new Hint("");
  private _rightHint = new Hint("");

  get emojiList(): EmojiItem[] {
    return this._emojiList;
  }

  get leftHint(): Hint {
    return this._leftHint;
  }
  get rightHint(): Hint {
    return this._rightHint;
  }

  setEmojiList(emojiList: EmojiItem[]): Settings {
    return new Settings({
      emojiList,
      leftHint: this._leftHint,
      rightHint: this._rightHint,
    });
  }
  setLeftHint(leftHint: HintData): Settings {
    return new Settings({
      emojiList: this._emojiList,
      leftHint,
      rightHint: this._rightHint,
    });
  }

  setRightHint(rightHint: HintData): Settings {
    return new Settings({
      emojiList: this._emojiList,
      leftHint: this._leftHint,
      rightHint,
    });
  }

  stringify(): string {
    return JSON.stringify({
      emojiList: this._emojiList,
      leftHint: this._leftHint.stringify(),
      rightHint: this._rightHint.stringify(),
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
      if (json != "") console.error("Settings format error: " + error.message);
      this.mutateToDefaults();
    }
  }

  private mutateToDefaults(): void {
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
