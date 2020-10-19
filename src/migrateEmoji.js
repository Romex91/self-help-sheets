import { EntryStatus } from "./Entry";

// Emoji values are stored as arrays of values in gdrive files description.
// E.G.: 0200331000. Each number is asociated with its index in
// |settings.emojiList|.
// This way it is compact and may be requested in single request in
// |GRriveMap.getAllKeys|.
// Such implementation is somewhat overcomlicated and require non-trivial
// migration logic. This is the cost of fast mood charts.
//
// The funny thing is I've ran out of time and I am not going to implement
// the mood charts anyway. All this logic is redundant. So, let it be a lesson for me.
export async function migrateEmoji(
  entryTableModel,
  oldEmojiList,
  newEmojiList
) {
  // Some entries may be initially hidden. We should request data for them before proceeding.
  const entries = await new Promise((resolve) => {
    const onEntriesUpdate = (entries) => {
      if (entries.every((x) => x.isDataLoaded())) {
        entryTableModel.unsubscribe(onEntriesUpdate);
        resolve(entries);
      }

      entries.forEach((entry) => {
        if (entry.data === EntryStatus.HIDDEN)
          entryTableModel.onUpdate(entry.show());
      });
    };
    entryTableModel.subscribe(onEntriesUpdate);
  });

  let someValuesAreDeleted = false;
  const newEntries = entries.map((x) => {
    const updatedEmojiArrays = x.emojiArrays.map((y) =>
      migrateEmojiValuesArray(y, oldEmojiList, newEmojiList)
    );

    if (updatedEmojiArrays.some((y) => y.someValuesAreDeleted))
      someValuesAreDeleted = true;

    return x.setEmojiArrays(
      updatedEmojiArrays[0].newArray,
      updatedEmojiArrays[1].newArray
    );
  });

  return { someValuesAreDeleted, newEntries };
}

function migrateEmojiValuesArray(emojiValuesArray, oldEmojiList, newEmojiList) {
  const oldEmojiValues = new Map();
  for (let i = 0; i < oldEmojiList.length; i++) {
    oldEmojiValues.set(oldEmojiList[i].codePoint, emojiValuesArray[i]);
  }

  const newArray = [];
  for (let i = 0; i < newEmojiList.length; i++) {
    const oldValue = oldEmojiValues.get(newEmojiList[i].codePoint);
    newArray.push(oldValue == null ? 0 : oldValue);
  }

  const someValuesAreDeleted = oldEmojiList.some(
    (x) =>
      oldEmojiValues.get(x.codePoint) > 0 &&
      newEmojiList.find((y) => y.codePoint === x.codePoint) == null
  );

  return { newArray, someValuesAreDeleted };
}
