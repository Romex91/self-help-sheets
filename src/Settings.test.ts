import { Settings } from "./Settings";

import _ from "lodash";
const defaultSettingsData = {
  emojiList: [
    { codePoint: 128078, text: "discontent" },
    { codePoint: 128552, text: "fear" },
    { codePoint: 128546, text: "sadness" },
    { codePoint: 128557, text: "grief" },
    { codePoint: 128561, text: "horror" },
    { codePoint: 128534, text: "pain" },
    { codePoint: 128545, text: "anger" },
    { codePoint: 129314, text: "disgust" },
  ],
  leftHint: {
    isEnabled: true,
    text: "What happened?\nWhat were your immediate thoughts?",
  },
  rightHint: {
    isEnabled: true,
    text:
      "Why is it bad?\nWhat would your therapist say?\nIs your view of the problem biased?",
  },
};

const modifiedSettingsData = _.cloneDeep(defaultSettingsData);
modifiedSettingsData.leftHint.text = "modified";

function stringifySettingsData(settingsData: {
  leftHint?: unknown;
  rightHint?: unknown;
  emojiList?: unknown;
}): string {
  return JSON.stringify({
    leftHint: JSON.stringify(settingsData.leftHint),
    rightHint: JSON.stringify(settingsData.rightHint),
    emojiList: settingsData.emojiList,
  });
}

function areDefaultSettings(settings: Settings): boolean {
  return _.isMatch(settings, defaultSettingsData);
}

test("Settings can initialize from data", () => {
  expect(areDefaultSettings(new Settings(defaultSettingsData))).toBe(true);
});

test("Settings can initialize from string", () => {
  expect(
    areDefaultSettings(new Settings(stringifySettingsData(defaultSettingsData)))
  ).toBe(true);
});

test("Extra data is ok", () => {
  expect(
    areDefaultSettings(
      new Settings(stringifySettingsData(modifiedSettingsData))
    )
  ).toBe(false);
});

test("Hint setters work", () => {
  let settings = new Settings(defaultSettingsData);
  settings = settings.setLeftHint(settings.leftHint.setText("modified"));

  expect(_.isMatch(settings, modifiedSettingsData)).toBe(true);
});

test("Settings fallback to defaults on JSON erros", () => {
  const spiedJestConsole = jest
    .spyOn(console, "error")
    .mockImplementation(() => {
      // Does nothing;
    });
  expect(areDefaultSettings(new Settings("{"))).toBe(true);
  expect(areDefaultSettings(new Settings(""))).toBe(true);
  expect(areDefaultSettings(new Settings("\\"))).toBe(true);
  expect(areDefaultSettings(new Settings("{}"))).toBe(true);

  expect(
    areDefaultSettings(
      new Settings(
        stringifySettingsData({ ...modifiedSettingsData, rightHint: undefined })
      )
    )
  ).toBe(true);

  spiedJestConsole.mockRestore();
});
