import { EntriesTableModel } from "./EntriesTableModel";
import { EmojiItem } from "./Settings";
import { EntryModel } from "./EntryModel";

// Mood data is stored as arrays of numbers in gdrive files description.
// E.G.: 02003:31000. Each number is asociated with its index in
// |settings.emojiList|.
// This way it is compact and may be requested in single request in
// |GRriveMap.getAllKeys|.
// Such implementation is somewhat overcomlicated and require non-trivial
// migration logic. This is the cost of fast mood charts.
//
// The funny thing is I've ran out of time and I am not going to implement
// the mood charts anyway. All this logic is redundant. So, let it be a lesson for me.
export async function migrateMoods(
  entryTableModel: EntriesTableModel,
  oldEmojiList: EmojiItem[],
  newEmojiList: EmojiItem[]
): Promise<{ someValuesAreDeleted: boolean; newEntries: EntryModel[] }> {
  const entries: EntryModel[] = await new Promise((resolve) => {
    const onEntriesUpdate = (entries: EntryModel[]) => {
      entryTableModel.unsubscribe(onEntriesUpdate);
      resolve(entries);
    };
    entryTableModel.subscribe(onEntriesUpdate);
  });

  let someValuesAreDeleted = false;
  const newEntries = entries.map((x) => {
    const updatedMoodArrays = x.moodArrays.map((y) =>
      migrateMoodArray(y, oldEmojiList, newEmojiList)
    );

    if (updatedMoodArrays.some((y) => y.someValuesAreDeleted))
      someValuesAreDeleted = true;

    return x
      .setMoodsLeft(updatedMoodArrays[0].newMoods)
      .setMoodsRight(updatedMoodArrays[1].newMoods);
  });

  return { someValuesAreDeleted, newEntries };
}

function migrateMoodArray(
  moodArray: number[],
  oldEmojiList: EmojiItem[],
  newEmojiList: EmojiItem[]
) {
  const oldMoods = new Map();
  for (let i = 0; i < oldEmojiList.length; i++) {
    oldMoods.set(oldEmojiList[i].codePoint, moodArray[i]);
  }

  const newMoods = [];
  for (let i = 0; i < newEmojiList.length; i++) {
    const oldValue = oldMoods.get(newEmojiList[i].codePoint);
    newMoods.push(oldValue == null ? 0 : oldValue);
  }

  const someValuesAreDeleted = oldEmojiList.some(
    (x) =>
      oldMoods.get(x.codePoint) > 0 &&
      newEmojiList.find((y) => y.codePoint === x.codePoint) == null
  );

  return { newMoods, someValuesAreDeleted };
}
