import sinon from "sinon";
import { TestingBackendMap } from "./TestingBackendMap";
import { TestingGDriveAuthClient } from "./TestingGDriveAuthClient";
import { EntriesTableModelImpl } from "./EntriesTableModel";
import { GDriveStates } from "./GDriveAuthClient.js";
import { EntryModel, EntryStatus } from "./Entry";
import _ from "lodash";
import { ArrowUpward } from "@material-ui/icons";

// TESTING DATA
let testingBackendMap;
let testingAuthClient;

function EntriesSubscription(model) {
  let callback = null;

  this.currentEntries = [];
  this.callCount = 0;

  this.waitForNewEntries = () => {
    return new Promise((resolve) => {
      expect(callback).toBe(null);
      callback = (entries) => {
        resolve(entries);
        callback = null;
      };
    });
  };

  model.subscribe((entries) => {
    // Some model methods notify subscriptions immediately.
    // |setTimeout| allows checking wether it happened.
    //
    // e.g.:
    // model.onUpdate(modifiedEntry);
    // await subsciption.waitForNewEntries();
    //
    // without |setTimeout| such a code will freeze waiting for subscription
    // update.
    setTimeout(() => {
      this.currentEntries = entries;
      this.callCount++;
      if (!!callback) callback(entries);
    });
  });
}

async function fillTestingBackendMap(entriesCount) {
  await Promise.all(
    _.range(0, entriesCount)
      .reverse()
      .map((id) => addEntryToTestingMap("lorem ipsum " + id, "dolores " + id))
  );
}

async function addEntryToTestingMap(left, right) {
  let copy = testingBackendMap;
  let key = await testingBackendMap.createKey();

  if (copy !== testingBackendMap)
    throw new Error("testingBackendMap changed instance");

  await testingBackendMap.set(
    key,
    JSON.stringify(new EntryModel().setLeft(left).setRight(right).data)
  );
}

async function waitForModelFullyLoad(model) {
  const subscription = new EntriesSubscription(model);
  let entries = null;
  while (true) {
    entries = await subscription.waitForNewEntries();
    if (
      entries.length > 0 &&
      entries[0].left === "" &&
      entries[0].right === "" &&
      entries.every((x) => x.isDataLoaded() && x.key !== null)
    )
      break;
  }

  return entries;
}

function createModel() {
  const model = new EntriesTableModelImpl(testingBackendMap, testingAuthClient);
  const subscription = new EntriesSubscription(model);
  return { model, subscription };
}

async function expectModelToHaveEntries({ model, entries }) {
  let newEntries = await waitForModelFullyLoad(model);

  expect(newEntries.length).toBe(entries.length);

  for (let i = 0; i < entries.length; i++) {
    expect(newEntries[i]).not.toBe(entries[i]);
    expect(newEntries[i].left).toBe(entries[i].left);
    expect(newEntries[i].right).toBe(entries[i].right);
    expect(JSON.stringify(newEntries[i].data)).toBe(
      JSON.stringify(entries[i].data)
    );
  }
}

async function expectNewModelToHaveEntries(entries) {
  const { model } = createModel();
  await expectModelToHaveEntries({ model, entries });
}

beforeEach(async () => {
  testingAuthClient = new TestingGDriveAuthClient();
  testingAuthClient.setStateFromTest(GDriveStates.SIGNED_IN);
  testingBackendMap = sinon.spy(new TestingBackendMap());
});

test("EntriesTableModel waits for sign in", async () => {
  let lastEntries = null;
  const onEntries = (entries) => {
    lastEntries = entries;
  };

  testingAuthClient.setStateFromTest(GDriveStates.LOADING);

  fillTestingBackendMap(10);

  const model = new EntriesTableModelImpl(testingBackendMap, testingAuthClient);
  model.subscribe(onEntries);

  await sleep(50);
  expect(lastEntries).toBe(null);

  testingAuthClient.setStateFromTest(GDriveStates.SIGNED_IN);
  await new Promise((resolve) => {
    model.subscribe(resolve);
  });

  expect(lastEntries.length).toBe(10);
});

test("EntriesTableModel has at least one empty item", async () => {
  await fillTestingBackendMap(10);

  const { subscription } = createModel();

  while (true) {
    let entries = await subscription.waitForNewEntries();
    if (
      entries.length === 11 &&
      entries.every((entry) => entry.isDataLoaded()) &&
      entries[0].left === "" &&
      entries[0].right === "" &&
      entries[1].left === "lorem ipsum 0" &&
      entries[1].right === "dolores 0" &&
      entries[2].left === "lorem ipsum 1" &&
      entries[2].right === "dolores 1" &&
      entries[3].left === "lorem ipsum 2" &&
      entries[3].right === "dolores 2" &&
      entries[4].left === "lorem ipsum 3" &&
      entries[4].right === "dolores 3"
    ) {
      await expectNewModelToHaveEntries(entries);
      break;
    }
  }
});

test("EntriesTableModel cannot have more than one empty item at front", async () => {
  await fillTestingBackendMap(10);

  const { model, subscription } = createModel();
  let entries = await waitForModelFullyLoad(model);
  expect(entries.length).toBe(11);
  expect(entries[0].key).toBe("10");

  // you cannot delete the first item
  model.onUpdate(entries[0].delete());

  entries = await subscription.waitForNewEntries();
  expect(entries.length).toBe(11);
  expect(entries[0].key).toBe("10");
  expect(entries[0].left).toBe("");
  expect(entries[0].right).toBe("");

  // deleting the second item should do the trick
  expect(entries[1].key).toBe("9");
  model.onUpdate(entries[1].delete());
  entries = await subscription.waitForNewEntries();
  expect(entries.length).toBe(10);

  // now the second item is empty and it is in the place of the first item.
  expect(entries[0].key).toBe("9");
  expect(entries[0].left).toBe("");
  expect(entries[0].right).toBe("");

  expect(entries[1].key).toBe("8");
  expect(entries[1].left).not.toBe("");
  expect(entries[1].right).not.toBe("");

  expect(entries[2].key).toBe("7");
  expect(entries[2].left).not.toBe("");
  expect(entries[2].right).not.toBe("");

  expect(entries[3].key).toBe("6");
  expect(entries[3].left).not.toBe("");
  expect(entries[3].right).not.toBe("");

  expect(entries[4].key).toBe("5");
  expect(entries[4].left).not.toBe("");
  expect(entries[4].right).not.toBe("");

  // setting left and right items empty is the same as deleting them
  model.onUpdate(entries[2].setLeft(""));
  entries = await subscription.waitForNewEntries();
  model.onUpdate(entries[2].setRight(""));
  entries = await subscription.waitForNewEntries();

  model.onUpdate(entries[3].setLeft(""));
  entries = await subscription.waitForNewEntries();
  model.onUpdate(entries[3].setRight(""));
  entries = await subscription.waitForNewEntries();

  // Clearing items in the middle of the table does nothing.
  expect(entries.length).toBe(10);
  expect(entries[0].key).toBe("9");
  expect(entries[0].left).toBe("");
  expect(entries[0].right).toBe("");
  expect(entries[1].key).toBe("8");
  expect(entries[1].left).not.toBe("");
  expect(entries[1].right).not.toBe("");

  expect(entries[2].key).toBe("7");
  expect(entries[2].left).toBe("");
  expect(entries[2].right).toBe("");

  expect(entries[3].key).toBe("6");
  expect(entries[3].left).toBe("");
  expect(entries[3].right).toBe("");

  expect(entries[4].left).not.toBe("");
  expect(entries[4].right).not.toBe("");
  expect(entries[4].key).toBe("5");

  // But clearing the second item should clear all empty items at table top.
  model.onUpdate(entries[1].setLeft(""));
  entries = await subscription.waitForNewEntries();
  model.onUpdate(entries[1].setRight(""));
  entries = await subscription.waitForNewEntries();

  expect(entries.length).toBe(7);
  expect(entries[0].key).toBe("6");
  expect(entries[0].left).toBe("");
  expect(entries[0].right).toBe("");

  await sleep(100);

  // Backend doesn't delete keys for empty or deleted items
  expect((await testingBackendMap.getAllKeys()).length).toBe(11);

  await expectNewModelToHaveEntries(entries);
});

test("EntriesTableModel reuses deleted keys", async () => {
  await fillTestingBackendMap(10);

  const { model, subscription } = createModel();
  let entries = await waitForModelFullyLoad(model);
  expect(entries.length).toBe(11);

  expect(entries[0].key).toBe("10");
  expect(entries[1].key).toBe("9");
  expect(entries[2].key).toBe("8");
  expect(entries[3].key).toBe("7");
  expect(entries[4].key).toBe("6");
  expect(entries[5].key).toBe("5");

  model.onUpdate(entries[1].delete());
  entries = await subscription.waitForNewEntries();
  expect(entries[0].key).toBe("9");

  model.onUpdate(entries[1].delete());
  entries = await subscription.waitForNewEntries();
  expect(entries[0].key).toBe("8");

  model.onUpdate(entries[1].delete());
  entries = await subscription.waitForNewEntries();
  expect(entries[0].key).toBe("7");

  model.onUpdate(entries[1].delete());
  entries = await subscription.waitForNewEntries();
  expect(entries[0].key).toBe("6");

  model.onUpdate(entries[1].delete());
  entries = await subscription.waitForNewEntries();
  expect(entries[0].key).toBe("5");

  model.onUpdate(entries[0].setLeft("foo"));
  entries = await subscription.waitForNewEntries();
  expect(entries[0].key).toBe("6");

  model.onUpdate(entries[0].setLeft("foo"));
  entries = await subscription.waitForNewEntries();
  expect(entries[0].key).toBe("7");

  model.onUpdate(entries[0].setLeft("foo"));
  entries = await subscription.waitForNewEntries();
  expect(entries[0].key).toBe("8");

  model.onUpdate(entries[0].setLeft("foo"));
  entries = await subscription.waitForNewEntries();
  expect(entries[0].key).toBe("9");

  model.onUpdate(entries[0].setLeft("foo"));
  entries = await subscription.waitForNewEntries();
  expect(entries[0].key).toBe("10");

  model.onUpdate(entries[0].setLeft("foo"));
  entries = await subscription.waitForNewEntries();

  expect(entries[0].key).toBe("10");
  entries = await subscription.waitForNewEntries();

  expect(entries[0].key).toBe("11");
  expect(entries[1].key).toBe("10");
  expect(entries[2].key).toBe("9");
  expect(entries[3].key).toBe("8");
  expect(entries[4].key).toBe("7");
  expect(entries[5].key).toBe("6");
  expect(entries[6].key).toBe("5");

  model.onUpdate(entries[0].delete());
  model.onUpdate(entries[1].delete());
  model.onUpdate(entries[2].delete());
  model.onUpdate(entries[3].delete());
  model.onUpdate(entries[4].delete());
  model.onUpdate(entries[5].delete());

  while (subscription.currentEntries.length !== 7) {
    entries = await subscription.waitForNewEntries();
  }

  expect(entries[0].key).toBe("6");

  model.onUpdate(entries[0].setLeft("foo"));
  entries = await subscription.waitForNewEntries();
  expect(entries[0].key).toBe("7");

  model.onUpdate(entries[0].setLeft("foo"));
  entries = await subscription.waitForNewEntries();
  expect(entries[0].key).toBe("8");

  model.onUpdate(entries[0].setLeft("foo"));
  entries = await subscription.waitForNewEntries();
  expect(entries[0].key).toBe("9");

  model.onUpdate(entries[0].setLeft("foo"));
  entries = await subscription.waitForNewEntries();
  expect(entries[0].key).toBe("10");

  model.onUpdate(entries[0].setLeft("foo"));
  entries = await subscription.waitForNewEntries();

  expect(entries[0].key).toBe("11");
  expect(entries[1].key).toBe("10");
  expect(entries[2].key).toBe("9");
  expect(entries[3].key).toBe("8");
  expect(entries[4].key).toBe("7");
  expect(entries[5].key).toBe("6");
  expect(entries[6].key).toBe("5");

  model.onUpdate(entries[0].delete());
  model.onUpdate(entries[1].delete());
  model.onUpdate(entries[2].delete());
  model.onUpdate(entries[3].delete());
  model.onUpdate(entries[4].delete());
  model.onUpdate(entries[5].delete());

  await sleep(100);

  await expectNewModelToHaveEntries(await waitForModelFullyLoad(model));
});

test("EntriesTableModel can delete all items without explosion", async () => {
  await fillTestingBackendMap(3);

  const { model, subscription } = createModel();
  let entries = await waitForModelFullyLoad(model);

  model.onUpdate(entries[0].delete());
  model.onUpdate(entries[1].delete());
  model.onUpdate(entries[2].delete());
  model.onUpdate(entries[3].delete());

  await sleep(100);
  expect(subscription.currentEntries.length).toBe(1);
  expect(subscription.currentEntries[0].key).toBe("0");
  expect(subscription.currentEntries[0].left).toBe("");
  expect(subscription.currentEntries[0].right).toBe("");

  model.onUpdate(subscription.currentEntries[0].delete());
  await sleep(100);
  expect(subscription.currentEntries.length).toBe(1);
  expect(subscription.currentEntries[0].key).toBe("0");
  expect(subscription.currentEntries[0].left).toBe("");
  expect(subscription.currentEntries[0].right).toBe("");

  await expectNewModelToHaveEntries(subscription.currentEntries);
});

test("EntriesTableModel has at least one item", async () => {
  const { subscription } = createModel();

  while (true) {
    let entries = await subscription.waitForNewEntries();
    if (
      entries.length === 1 &&
      entries[0].isDataLoaded() &&
      entries[0].left === "" &&
      entries[0].right === "" &&
      entries[0].key != null
    ) {
      expect(subscription.callCount).toBe(1);
      await expectNewModelToHaveEntries(entries);
      break;
    }
  }
});

test("EntriesTableModel loads only 30 entries at start", async () => {
  await fillTestingBackendMap(100);
  const { model, subscription } = createModel();

  let entries = await subscription.waitForNewEntries();
  expect(entries.length).toBe(100);
  let i = 0;
  for (; i < 30; i++) {
    expect(entries[i].data).toBe(EntryStatus.LOADING);
  }
  for (; i < 100; i++) {
    expect(entries[i].data).toBe(EntryStatus.HIDDEN);
  }

  while (true) {
    entries = (await subscription.waitForNewEntries()).slice(1);
    if (entries.slice(0, 30).every((x) => x.isDataLoaded() && x.key !== null))
      break;
  }

  for (; i < 30; i++) {
    expect(entries[i].isDataLoaded()).toBe(true);
  }
  for (i = 30; i < 100; i++) {
    expect(entries[i].data).toBe(EntryStatus.HIDDEN);
  }

  for (i = 30; i < 40; i++) {
    model.onUpdate(entries[i].show());
  }

  while (true) {
    entries = (await subscription.waitForNewEntries()).slice(1);
    if (entries.slice(0, 40).every((x) => x.isDataLoaded() && x.key !== null))
      break;
  }

  for (; i < 40; i++) {
    expect(entries[i].isDataLoaded()).toBe(true);
  }
  for (i = 40; i < 100; i++) {
    expect(entries[i].data).toBe(EntryStatus.HIDDEN);
  }
});

test("EntriesTableModel deletes poorly formatted entries", async () => {
  await fillTestingBackendMap(10);
  let keys = (await testingBackendMap.getAllKeys()).reverse();

  await testingBackendMap.set(keys[3].id, "\\");
  await testingBackendMap.set(keys[7].id, "{");

  await testingBackendMap.set(keys[9].id, "{dirty}");

  const { subscription } = createModel();

  let entries = await subscription.waitForNewEntries();
  expect(entries.length).toBe(10);
  expect(entries.every((x) => !x.isDataLoaded())).toBe(true);

  while (true) {
    entries = await subscription.waitForNewEntries();
    // console.log(entries.map((x) => x.data));
    if (
      entries.length === 8 &&
      entries.every((entry) => entry.isDataLoaded()) &&
      entries[1].left === "lorem ipsum 0" &&
      entries[2].left === "lorem ipsum 1" &&
      entries[3].left === "lorem ipsum 2" &&
      entries[4].left === "lorem ipsum 4" &&
      entries[5].left === "lorem ipsum 5" &&
      entries[6].left === "lorem ipsum 6" &&
      entries[7].left === "lorem ipsum 8"
    ) {
      await expectNewModelToHaveEntries(entries);
      break;
    }
  }

  expect(testingBackendMap.delete.withArgs(keys[0].id).notCalled).toBe(true);
  expect(testingBackendMap.delete.withArgs(keys[1].id).notCalled).toBe(true);
  expect(testingBackendMap.delete.withArgs(keys[2].id).notCalled).toBe(true);
  expect(testingBackendMap.delete.withArgs(keys[4].id).notCalled).toBe(true);
  expect(testingBackendMap.delete.withArgs(keys[5].id).notCalled).toBe(true);
  expect(testingBackendMap.delete.withArgs(keys[6].id).notCalled).toBe(true);
  expect(testingBackendMap.delete.withArgs(keys[8].id).notCalled).toBe(true);

  expect(testingBackendMap.delete.withArgs(keys[3].id).calledOnce).toBe(true);
  expect(testingBackendMap.delete.withArgs(keys[7].id).calledOnce).toBe(true);
  expect(testingBackendMap.delete.withArgs(keys[9].id).calledOnce).toBe(true);

  await expectNewModelToHaveEntries(entries);
});

test("EntriesTableModel deletes non existing entries", async () => {
  await fillTestingBackendMap(10);
  let keys = (await testingBackendMap.getAllKeys()).reverse();
  {
    let prevGet = testingBackendMap.get.bind(testingBackendMap);
    testingBackendMap.get = (key) => {
      if (key === keys[3].id || key === keys[7].id || key === keys[9].id) {
        return undefined;
      }
      return prevGet(key);
    };
  }

  const { subscription } = createModel();

  let entries = await subscription.waitForNewEntries();
  expect(entries.length).toBe(10);
  expect(entries.every((x) => !x.isDataLoaded())).toBe(true);

  while (true) {
    entries = await subscription.waitForNewEntries();
    if (
      entries.length === 8 &&
      entries.every((entry) => entry.isDataLoaded()) &&
      entries[1].left === "lorem ipsum 0" &&
      entries[2].left === "lorem ipsum 1" &&
      entries[3].left === "lorem ipsum 2" &&
      entries[4].left === "lorem ipsum 4" &&
      entries[5].left === "lorem ipsum 5" &&
      entries[6].left === "lorem ipsum 6" &&
      entries[7].left === "lorem ipsum 8"
    ) {
      await expectNewModelToHaveEntries(entries);
      break;
    }
  }

  expect(testingBackendMap.delete.notCalled).toBe(true);

  await expectNewModelToHaveEntries(entries);
});

test("EntriesTableModel creates items in map", async () => {
  const { model, subscription } = createModel();

  let entries = await subscription.waitForNewEntries();
  expect(entries.length).toBe(1);

  // Update with empty string shouldn't change anything.
  model.onUpdate(entries[0].setLeft(""));
  entries = await subscription.waitForNewEntries();
  expect(entries.length).toBe(1);

  // Update with not empty string should add empty item to front.
  model.onUpdate(entries[0].setLeft("newLeft"));

  while (entries.length !== 2) {
    entries = await subscription.waitForNewEntries();
  }
  expect(entries[0].left).toBe("");
  expect(entries[0].right).toBe("");
  expect(entries[1].left).toBe("newLeft");
  expect(entries[1].right).toBe("");

  model.onUpdate(entries[0].setLeft("ultraLeft"));

  while (entries.length !== 3) {
    entries = await subscription.waitForNewEntries();
  }

  expect(entries[0].left).toBe("");
  expect(entries[0].right).toBe("");
  expect(entries[1].left).toBe("ultraLeft");
  expect(entries[1].right).toBe("");
  expect(entries[2].left).toBe("newLeft");
  expect(entries[2].right).toBe("");

  // Updating items other than first does not add new items.
  model.onUpdate(entries[1].setLeft("oldLeft"));
  await sleep(100);
  entries = subscription.currentEntries;
  expect(entries.length).toBe(3);

  model.onUpdate(entries[2].setLeft("oldUltraLeft"));
  entries = await subscription.waitForNewEntries();
  expect(entries.length).toBe(3);

  subscription.callCount = 0;
  await sleep(100);
  expect(subscription.callCount).toBe(0);

  // Updating first item does add a new item.
  model.onUpdate(entries[0].setLeft("youngLeft"));

  while (entries.length !== 4) {
    entries = await subscription.waitForNewEntries();
  }
  expect(entries[0].left).toBe("");
  expect(entries[1].left).toBe("youngLeft");
  expect(entries[2].left).toBe("oldLeft");
  expect(entries[3].left).toBe("oldUltraLeft");

  await expectNewModelToHaveEntries(entries);
});

test("EntriesTableModel updates item in map", async () => {
  await fillTestingBackendMap(10);
  const { model, subscription } = createModel();

  let entries = await waitForModelFullyLoad(model);

  model.onUpdate(entries[5].setLeft("new left value 5"));
  entries = await subscription.waitForNewEntries();

  model.onUpdate(entries[5].setRight("new right value 5"));
  entries = await subscription.waitForNewEntries();

  model.onUpdate(entries[10].setLeft("new left value 10"));
  entries = await subscription.waitForNewEntries();

  model.onUpdate(entries[10].setRight("new right value 10"));
  entries = await subscription.waitForNewEntries();

  await sleep(100);
  expect(await testingBackendMap.get(entries[10].key)).toBe(
    JSON.stringify({
      left: "new left value 10",
      right: "new right value 10",
    })
  );

  expect(await testingBackendMap.get(entries[5].key)).toBe(
    JSON.stringify({
      left: "new left value 5",
      right: "new right value 5",
    })
  );

  expect(await testingBackendMap.get(entries[0].key)).toBe(
    JSON.stringify({
      left: "",
      right: "",
    })
  );

  await expectNewModelToHaveEntries(entries);
});

test("EntriesTableModel deletes items in map", async () => {
  await fillTestingBackendMap(10);
  const { model, subscription } = createModel();

  let entries = await waitForModelFullyLoad(model);

  model.onUpdate(entries[5].delete());
  await subscription.waitForNewEntries();

  model.onUpdate(entries[10].delete());
  await subscription.waitForNewEntries();

  await sleep(100);
  expect(await testingBackendMap.get(entries[10].key)).toBe(
    `"${EntryStatus.DELETED}"`
  );

  expect(await testingBackendMap.get(entries[5].key)).toBe(
    `"${EntryStatus.DELETED}"`
  );

  expect(await testingBackendMap.get("10")).toBe(
    JSON.stringify({
      left: "",
      right: "",
    })
  );

  entries.splice(10, 1);
  entries.splice(5, 1);

  await expectNewModelToHaveEntries(entries);
});

test("async set/delete doesn't explode", async () => {});
test("BackendMultiplexor handles incorrect data", async () => {});

// test("sync hides deleted entries (without changing other entries)", async () => {
//   await fillTestingBackendMap(10);
//   const { model1 } = createModel();

//   const { model2 } = createModel();

//   let entries1 = await waitForModelFullyLoad(model1);
//   let entries2 = await waitForModelFullyLoad(model2);

//   model2.onUpdate(entries2[1].delete());
//   model1.onUpdate(entries1[4].delete());

//   await sleep(100);

//   model1.sync();
//   model2.sync();

//   entries1 = await waitForModelFullyLoad(model1);
//   expectModelToHaveEntries({ model: model2, entries: entries1 });

//   expect(entries1.length).toBe(8);

//   expect(JSON.stringify(entries1[0].data)).toBe(
//     JSON.stringify({
//       left: "",
//       right: "",
//     })
//   );
//   expect(JSON.stringify(entries1[1].data)).toBe(
//     JSON.stringify({
//       left: "lorem ipsum 1",
//       right: "dolores 1",
//     })
//   );
//   expect(JSON.stringify(entries1[2].data)).toBe(
//     JSON.stringify({
//       left: "lorem ipsum 2",
//       right: "dolores 2",
//     })
//   );
//   expect(JSON.stringify(entries1[3].data)).toBe(
//     JSON.stringify({
//       left: "lorem ipsum 3",
//       right: "dolores 3",
//     })
//   );
//   expect(JSON.stringify(entries1[4].data)).toBe(
//     JSON.stringify({
//       left: "lorem ipsum 5",
//       right: "dolores 5",
//     })
//   );
//   expect(JSON.stringify(entries1[5].data)).toBe(
//     JSON.stringify({
//       left: "lorem ipsum 6",
//       right: "dolores 6",
//     })
//   );
//   expect(JSON.stringify(entries1[6].data)).toBe(
//     JSON.stringify({
//       left: "lorem ipsum 7",
//       right: "dolores 7",
//     })
//   );
//   expect(JSON.stringify(entries1[7].data)).toBe(
//     JSON.stringify({
//       left: "lorem ipsum 8",
//       right: "dolores 8",
//     })
//   );
//   expect(JSON.stringify(entries1[8].data)).toBe(
//     JSON.stringify({
//       left: "lorem ipsum 9",
//       right: "dolores 9",
//     })
//   );
// });

// test("sync updates changed entries (without changing other entries)", async () => {
//   await fillTestingBackendMap(10);
//   const { model1 } = createModel();

//   const { model2 } = createModel();

//   let entries1 = await waitForModelFullyLoad(model1);
//   let entries2 = await waitForModelFullyLoad(model2);
//   expectModelToHaveEntries({ model: model2, entries: entries1 });

//   expect(entries1.length).toBe(11);

//   model2.onUpdate(entries2[1].delete());

//   entries1.shift();
//   entries2.shift();
//   model1.onUpdate(entries1[4].setLeft("updated 4"));
//   model2.onUpdate(entries2[3].setLeft("updated 3"));
//   model1.onUpdate(entries1[6].setLeft("updated 6"));
//   model1.onUpdate(entries1[7].setLeft("updated 7"));
//   model2.onUpdate(entries2[7].setLeft("updated 7"));

//   await sleep(100);

//   model1.sync();
//   model2.sync();

//   entries1 = await waitForModelFullyLoad(model1);
//   expectModelToHaveEntries({ model: model2, entries: entries1 });

//   expect(entries1.length).toBe(10);

//   expect(JSON.stringify(entries1[0].data)).toBe(
//     JSON.stringify({
//       left: "",
//       right: "",
//     })
//   );
//   expect(JSON.stringify(entries1[1].data)).toBe(
//     JSON.stringify({
//       left: "lorem ipsum 1",
//       right: "dolores 1",
//     })
//   );
//   expect(JSON.stringify(entries1[2].data)).toBe(
//     JSON.stringify({
//       left: "lorem ipsum 2",
//       right: "dolores 2",
//     })
//   );
//   expect(JSON.stringify(entries1[3].data)).toBe(
//     JSON.stringify({
//       left: "updated 3",
//       right: "dolores 3",
//     })
//   );
//   expect(JSON.stringify(entries1[4].data)).toBe(
//     JSON.stringify({
//       left: "updated 4",
//       right: "dolores 4",
//     })
//   );
//   expect(JSON.stringify(entries1[5].data)).toBe(
//     JSON.stringify({
//       left: "lorem ipsum 5",
//       right: "dolores 5",
//     })
//   );
//   expect(JSON.stringify(entries1[6].data)).toBe(
//     JSON.stringify({
//       left: "updated 6",
//       right: "dolores 6",
//     })
//   );
//   expect(JSON.stringify(entries1[7].data)).toBe(
//     JSON.stringify({
//       left: "updated 7",
//       right: "dolores 7",
//     })
//   );
//   expect(JSON.stringify(entries1[8].data)).toBe(
//     JSON.stringify({
//       left: "lorem ipsum 8",
//       right: "dolores 8",
//     })
//   );
//   expect(JSON.stringify(entries1[9].data)).toBe(
//     JSON.stringify({
//       left: "lorem ipsum 9",
//       right: "dolores 9",
//     })
//   );
// });

// test("sync adds new entries (without changing other entries)", async () => {
//   await fillTestingBackendMap(4);
//   const { model: model1, subscription: subscription1 } = createModel();
//   const { model: model2, subscription: subscription2 } = createModel();

//   let [entries1, entries2] = await Promise.all([
//     waitForModelFullyLoad(model1),
//     waitForModelFullyLoad(model2),
//   ]);

//   expectModelToHaveEntries({ model: model2, entries: entries1 });

//   expect(entries1.length).toBe(5);

//   model1.onUpdate(entries1[0].setLeft("newStuff").setRight("newStuff"));
//   model2.onUpdate(entries2[0].setLeft("newStuff").setRight("newStuff"));

//   [entries1, entries2] = await Promise.all(
//     subscription1.waitForNewEntries(),
//     subscription2.waitForNewEntries()
//   );

//   model1.onUpdate(entries1[0].setLeft("newStuff").setRight("newStuff"));
//   model2.onUpdate(entries2[0].setLeft("newStuff").setRight("newStuff"));

//   [entries1, entries2] = await Promise.all(
//     subscription1.waitForNewEntries(),
//     subscription2.waitForNewEntries()
//   );

//   await sleep(100);

//   model1.sync();
//   model2.sync();

//   entries1 = await waitForModelFullyLoad(model1);
//   expectModelToHaveEntries({ model: model2, entries: entries1 });

//   expect(entries1.length).toBe(9);
//   expect(JSON.stringify(entries1[0].data)).toBe(
//     JSON.stringify({
//       left: "",
//       right: "",
//     })
//   );
//   expect(JSON.stringify(entries1[1].data)).toBe(
//     JSON.stringify({
//       left: "newStuff",
//       right: "newStuff",
//     })
//   );
//   expect(JSON.stringify(entries1[2].data)).toBe(
//     JSON.stringify({
//       left: "newStuff",
//       right: "newStuff",
//     })
//   );
//   expect(JSON.stringify(entries1[3].data)).toBe(
//     JSON.stringify({
//       left: "newStuff",
//       right: "newStuff",
//     })
//   );
//   expect(JSON.stringify(entries1[4].data)).toBe(
//     JSON.stringify({
//       left: "newStuff",
//       right: "newStuff",
//     })
//   );
//   expect(JSON.stringify(entries1[5].data)).toBe(
//     JSON.stringify({
//       left: "lorem ipsum 0",
//       right: "dolores 0",
//     })
//   );
//   expect(JSON.stringify(entries1[6].data)).toBe(
//     JSON.stringify({
//       left: "updated 1",
//       right: "dolores 1",
//     })
//   );
//   expect(JSON.stringify(entries1[7].data)).toBe(
//     JSON.stringify({
//       left: "updated 2",
//       right: "dolores 2",
//     })
//   );
//   expect(JSON.stringify(entries1[8].data)).toBe(
//     JSON.stringify({
//       left: "lorem ipsum 3",
//       right: "dolores 4",
//     })
//   );
//   expect(JSON.stringify(entries1[9].data)).toBe(
//     JSON.stringify({
//       left: "lorem ipsum 4",
//       right: "dolores 4",
//     })
//   );
// });

// EntriesTableModel supports undo/redo"
test("undo/redo recreates deleted items in map", async () => {});
test("undo/redo deletes added items in map", async () => {});
test("undo/redo restore changed items in map", async () => {});

test("undo/redo works when data is halfloaded", async () => {});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
