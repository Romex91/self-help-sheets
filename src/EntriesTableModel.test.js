import sinon from "sinon";
import { TestingBackendMap } from "./TestingBackendMap";
import { applyQuotaSavers } from "./BackendQuotaSavers";
import { TestingGDriveAuthClient } from "./TestingGDriveAuthClient";
import { EntriesTableModelImpl } from "./EntriesTableModel";
import { GDriveStates } from "./GDriveAuthClient.js";
import { EntryModel, EntryStatus } from "./Entry";
import _ from "lodash";

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
      callback = (entries, settings) => {
        resolve({ entries, settings });
        callback = null;
      };
    });
  };

  model.subscribe((entries, settings) => {
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
      if (!!callback) callback(entries, settings);
    });
  });
}

async function fillTestingBackendMap(
  entriesCount,
  backendMap = testingBackendMap
) {
  await Promise.all(
    _.range(0, entriesCount)
      .reverse()
      .map((id) => backendMap.addEntry("lorem ipsum " + id, "dolores " + id))
  );
}

async function waitForModelFullyLoad(model) {
  const subscription = new EntriesSubscription(model);
  let entries = null;
  let settings = null;
  while (true) {
    ({ entries, settings } = await subscription.waitForNewEntries());

    for (let i = 0; i < entries.length; i++) {
      if (entries[i].data === EntryStatus.HIDDEN) {
        model.onUpdate(entries[i].show());
        break;
      }
    }

    if (
      settings != null &&
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
  testingBackendMap = sinon.spy(applyQuotaSavers(new TestingBackendMap()));

  await testingBackendMap.getAllKeys();
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
    let entries = (await subscription.waitForNewEntries()).entries;

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
  expect(entries[0].key).toBe("2-1");

  // you cannot delete the first item
  model.onUpdate(entries[0].delete());

  entries = (await subscription.waitForNewEntries()).entries;
  expect(entries.length).toBe(11);
  expect(entries[0].key).toBe("2-1");
  expect(entries[0].left).toBe("");
  expect(entries[0].right).toBe("");

  // deleting the second item should do the trick
  expect(entries[1].key).toBe("1-1");
  model.onUpdate(entries[1].delete());
  entries = (await subscription.waitForNewEntries()).entries;
  expect(entries.length).toBe(10);

  // now the second item is empty and it is in the place of the first item.
  expect(entries[0].key).toBe("1-1");
  expect(entries[0].left).toBe("");
  expect(entries[0].right).toBe("");

  expect(entries[1].key).toBe("0-1");
  expect(entries[1].left).not.toBe("");
  expect(entries[1].right).not.toBe("");

  expect(entries[2].key).toBe("7-0");
  expect(entries[2].left).not.toBe("");
  expect(entries[2].right).not.toBe("");

  expect(entries[3].key).toBe("6-0");
  expect(entries[3].left).not.toBe("");
  expect(entries[3].right).not.toBe("");

  expect(entries[4].key).toBe("5-0");
  expect(entries[4].left).not.toBe("");
  expect(entries[4].right).not.toBe("");

  // setting left and right items empty is the same as deleting them
  model.onUpdate(entries[2].setLeft(""));
  entries = (await subscription.waitForNewEntries()).entries;
  model.onUpdate(entries[2].setRight(""));
  entries = (await subscription.waitForNewEntries()).entries;

  model.onUpdate(entries[3].setLeft(""));
  entries = (await subscription.waitForNewEntries()).entries;
  model.onUpdate(entries[3].setRight(""));
  entries = (await subscription.waitForNewEntries()).entries;

  // Clearing items in the middle of the table does nothing.
  expect(entries.length).toBe(10);
  expect(entries[0].key).toBe("1-1");
  expect(entries[0].left).toBe("");
  expect(entries[0].right).toBe("");
  expect(entries[1].key).toBe("0-1");
  expect(entries[1].left).not.toBe("");
  expect(entries[1].right).not.toBe("");

  expect(entries[2].key).toBe("7-0");
  expect(entries[2].left).toBe("");
  expect(entries[2].right).toBe("");

  expect(entries[3].key).toBe("6-0");
  expect(entries[3].left).toBe("");
  expect(entries[3].right).toBe("");

  expect(entries[4].left).not.toBe("");
  expect(entries[4].right).not.toBe("");
  expect(entries[4].key).toBe("5-0");

  // But clearing the second item should clear all empty items at table top.
  model.onUpdate(entries[1].setLeft(""));
  entries = (await subscription.waitForNewEntries()).entries;
  model.onUpdate(entries[1].setRight(""));
  entries = (await subscription.waitForNewEntries()).entries;

  expect(entries.length).toBe(7);
  expect(entries[0].key).toBe("6-0");
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

  expect(entries[0].key).toBe("2-1");
  expect(entries[1].key).toBe("1-1");
  expect(entries[2].key).toBe("0-1");
  expect(entries[3].key).toBe("7-0");
  expect(entries[4].key).toBe("6-0");
  expect(entries[5].key).toBe("5-0");

  model.onUpdate(entries[1].delete());
  entries = (await subscription.waitForNewEntries()).entries;
  expect(entries[0].key).toBe("1-1");

  model.onUpdate(entries[1].delete());
  entries = (await subscription.waitForNewEntries()).entries;
  expect(entries[0].key).toBe("0-1");

  model.onUpdate(entries[1].delete());
  entries = (await subscription.waitForNewEntries()).entries;
  expect(entries[0].key).toBe("7-0");

  model.onUpdate(entries[1].delete());
  entries = (await subscription.waitForNewEntries()).entries;
  expect(entries[0].key).toBe("6-0");

  model.onUpdate(entries[1].delete());
  entries = (await subscription.waitForNewEntries()).entries;
  expect(entries[0].key).toBe("5-0");

  model.onUpdate(entries[0].setLeft("foo"));
  entries = (await subscription.waitForNewEntries()).entries;
  expect(entries[0].key).toBe("6-0");

  model.onUpdate(entries[0].setLeft("foo"));
  entries = (await subscription.waitForNewEntries()).entries;
  expect(entries[0].key).toBe("7-0");

  model.onUpdate(entries[0].setLeft("foo"));
  entries = (await subscription.waitForNewEntries()).entries;
  expect(entries[0].key).toBe("0-1");

  model.onUpdate(entries[0].setLeft("foo"));
  entries = (await subscription.waitForNewEntries()).entries;
  expect(entries[0].key).toBe("1-1");

  model.onUpdate(entries[0].setLeft("foo"));
  entries = (await subscription.waitForNewEntries()).entries;
  expect(entries[0].key).toBe("2-1");

  model.onUpdate(entries[0].setLeft("foo"));
  entries = (await subscription.waitForNewEntries()).entries;

  expect(entries[0].key).toBe("2-1");
  entries = (await subscription.waitForNewEntries()).entries;

  expect(entries[0].key).toBe("3-1");
  expect(entries[1].key).toBe("2-1");
  expect(entries[2].key).toBe("1-1");
  expect(entries[3].key).toBe("0-1");
  expect(entries[4].key).toBe("7-0");
  expect(entries[5].key).toBe("6-0");
  expect(entries[6].key).toBe("5-0");

  model.onUpdate(entries[0].delete());
  model.onUpdate(entries[1].delete());
  model.onUpdate(entries[2].delete());
  model.onUpdate(entries[3].delete());
  model.onUpdate(entries[4].delete());
  model.onUpdate(entries[5].delete());

  while (subscription.currentEntries.length !== 7) {
    entries = (await subscription.waitForNewEntries()).entries;
  }

  expect(entries[0].key).toBe("6-0");

  model.onUpdate(entries[0].setLeft("foo"));
  entries = (await subscription.waitForNewEntries()).entries;
  expect(entries[0].key).toBe("7-0");

  model.onUpdate(entries[0].setLeft("foo"));
  entries = (await subscription.waitForNewEntries()).entries;
  expect(entries[0].key).toBe("0-1");

  model.onUpdate(entries[0].setLeft("foo"));
  entries = (await subscription.waitForNewEntries()).entries;
  expect(entries[0].key).toBe("1-1");

  model.onUpdate(entries[0].setLeft("foo"));
  entries = (await subscription.waitForNewEntries()).entries;
  expect(entries[0].key).toBe("2-1");

  model.onUpdate(entries[0].setLeft("foo"));
  entries = (await subscription.waitForNewEntries()).entries;

  expect(entries[0].key).toBe("3-1");
  expect(entries[1].key).toBe("2-1");
  expect(entries[2].key).toBe("1-1");
  expect(entries[3].key).toBe("0-1");
  expect(entries[4].key).toBe("7-0");
  expect(entries[5].key).toBe("6-0");
  expect(entries[6].key).toBe("5-0");

  model.onUpdate(entries[0].delete());
  model.onUpdate(entries[1].delete());
  model.onUpdate(entries[2].delete());
  model.onUpdate(entries[3].delete());
  model.onUpdate(entries[4].delete());
  model.onUpdate(entries[5].delete());

  await sleep(100);

  entries = await waitForModelFullyLoad(model);

  await expectNewModelToHaveEntries(entries);
});

test("EntriesTableModel can delete all items without explosion", async () => {
  await fillTestingBackendMap(16);

  const { model, subscription } = createModel();
  let entries = await waitForModelFullyLoad(model);

  model.onUpdate(entries[0].delete());
  model.onUpdate(entries[1].delete());
  model.onUpdate(entries[2].delete());
  model.onUpdate(entries[3].delete());
  model.onUpdate(entries[4].delete());
  model.onUpdate(entries[5].delete());
  model.onUpdate(entries[6].delete());
  model.onUpdate(entries[7].delete());
  model.onUpdate(entries[8].delete());
  model.onUpdate(entries[9].delete());
  model.onUpdate(entries[10].delete());
  model.onUpdate(entries[11].delete());
  model.onUpdate(entries[12].delete());
  model.onUpdate(entries[13].delete());
  model.onUpdate(entries[14].delete());
  model.onUpdate(entries[15].delete());
  model.onUpdate(entries[16].delete());

  await sleep(100);
  expect(subscription.currentEntries.length).toBe(1);
  expect(subscription.currentEntries[0].key).toBe("0-0");
  expect(subscription.currentEntries[0].left).toBe("");
  expect(subscription.currentEntries[0].right).toBe("");

  model.onUpdate(subscription.currentEntries[0].delete());
  await sleep(100);
  expect(subscription.currentEntries.length).toBe(1);
  expect(subscription.currentEntries[0].key).toBe("0-0");
  expect(subscription.currentEntries[0].left).toBe("");
  expect(subscription.currentEntries[0].right).toBe("");

  await expectNewModelToHaveEntries(subscription.currentEntries);
});

test("EntriesTableModel has at least one item", async () => {
  const { subscription } = createModel();

  while (true) {
    let entries = (await subscription.waitForNewEntries()).entries;
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

  let entries = (await subscription.waitForNewEntries()).entries;
  expect(entries.length).toBe(100);
  let i = 0;
  for (; i < 30; i++) {
    expect(entries[i].data).toBe(EntryStatus.LOADING);
  }
  for (; i < 100; i++) {
    expect(entries[i].data).toBe(EntryStatus.HIDDEN);
  }

  while (true) {
    entries = (await subscription.waitForNewEntries()).entries.slice(1);
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
    entries = (await subscription.waitForNewEntries()).entries.slice(1);
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

  let entries = (await subscription.waitForNewEntries()).entries;
  expect(entries.length).toBe(10);
  expect(entries.every((x) => !x.isDataLoaded())).toBe(true);

  while (true) {
    entries = (await subscription.waitForNewEntries()).entries;
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

  let entries = (await subscription.waitForNewEntries()).entries;
  expect(entries.length).toBe(10);
  expect(entries.every((x) => !x.isDataLoaded())).toBe(true);

  while (true) {
    entries = (await subscription.waitForNewEntries()).entries;
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
});

test("EntriesTableModel creates items in map", async () => {
  const { model, subscription } = createModel();

  let entries = (await subscription.waitForNewEntries()).entries;
  expect(entries.length).toBe(1);

  // Update with empty string shouldn't change anything.
  model.onUpdate(entries[0].setLeft(""));
  entries = (await subscription.waitForNewEntries()).entries;
  expect(entries.length).toBe(1);

  // Update with not empty string should add empty item to front.
  model.onUpdate(entries[0].setLeft("newLeft"));

  while (entries.length !== 2) {
    entries = (await subscription.waitForNewEntries()).entries;
  }
  expect(entries[0].left).toBe("");
  expect(entries[0].right).toBe("");
  expect(entries[1].left).toBe("newLeft");
  expect(entries[1].right).toBe("");

  model.onUpdate(entries[0].setLeft("ultraLeft"));

  while (entries.length !== 3) {
    entries = (await subscription.waitForNewEntries()).entries;
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
  entries = (await subscription.waitForNewEntries()).entries;
  expect(entries.length).toBe(3);

  subscription.callCount = 0;
  await sleep(100);
  expect(subscription.callCount).toBe(0);

  // Updating first item does add a new item.
  model.onUpdate(entries[0].setLeft("youngLeft"));

  while (entries.length !== 4) {
    entries = (await subscription.waitForNewEntries()).entries;
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
  entries = (await subscription.waitForNewEntries()).entries;

  model.onUpdate(entries[5].setRight("new right value 5"));
  entries = (await subscription.waitForNewEntries()).entries;

  model.onUpdate(entries[10].setLeft("new left value 10"));
  entries = (await subscription.waitForNewEntries()).entries;

  model.onUpdate(entries[10].setRight("new right value 10"));
  entries = (await subscription.waitForNewEntries()).entries;

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

  expect(await testingBackendMap.get(entries[0].key)).toBe(`"deleted"`);

  await expectNewModelToHaveEntries(entries);
});

test("EntriesTableModel deletes items in map", async () => {
  await fillTestingBackendMap(10);
  const { model, subscription } = createModel();

  let entries = await waitForModelFullyLoad(model);

  model.onUpdate(entries[5].delete());
  (await subscription.waitForNewEntries()).entries;

  model.onUpdate(entries[10].delete());
  (await subscription.waitForNewEntries()).entries;

  await sleep(100);
  expect(await testingBackendMap.get(entries[10].key)).toBe(
    `"${EntryStatus.DELETED}"`
  );

  expect(await testingBackendMap.get(entries[5].key)).toBe(
    `"${EntryStatus.DELETED}"`
  );

  expect(await testingBackendMap.get(entries[0].key)).toBe(`"deleted"`);

  entries.splice(10, 1);
  entries.splice(5, 1);

  await expectNewModelToHaveEntries(entries);
});

test("async set/delete doesn't explode", async () => {
  await fillTestingBackendMap(10);
  const { model, subscription } = createModel();

  let entries = await waitForModelFullyLoad(model);
  model.onUpdate(entries[10].delete());
  model.onUpdate(entries[4].setLeft("").setRight(""));
  model.onUpdate(entries[1].setLeft("").setRight(""));
  model.onUpdate(entries[5].setLeft("").setRight(""));
  model.onUpdate(entries[4].delete());
  model.onUpdate(entries[9].setLeft("").setRight(""));
  model.onUpdate(entries[1].delete());
  model.onUpdate(entries[8].delete());
  model.onUpdate(entries[10].setLeft("").setRight(""));
  model.onUpdate(entries[2].delete());
  model.onUpdate(entries[2].setLeft("").setRight(""));
  model.onUpdate(entries[6].delete());
  model.onUpdate(entries[7].setLeft("").setRight(""));
  model.onUpdate(entries[6].setLeft("").setRight(""));
  model.onUpdate(entries[3].setLeft("").setRight(""));
  model.onUpdate(entries[9].delete());
  model.onUpdate(entries[7].delete());
  model.onUpdate(entries[5].delete());
  model.onUpdate(entries[3].delete());
  model.onUpdate(entries[8].setLeft("").setRight(""));

  while (entries.length !== 1) {
    entries = (await subscription.waitForNewEntries()).entries;
  }

  expect(entries[0].left).toBe("");
  expect(entries[0].right).toBe("");
});

test("BackendMultiplexor handles incorrect data", async () => {
  console.log("-----------------------------------------------");
  let testingBackendMap = new TestingBackendMap();
  fillTestingBackendMap(50, testingBackendMap);

  await testingBackendMap.getAllKeys();
  // correct entry
  await testingBackendMap.set(
    "3",
    JSON.stringify([
      '{"left":"3-1", "right": ""}',
      null,
      '{"left":"3-2", "right": ""}',
    ])
  );
  await testingBackendMap.setDescription("3", ",null,");

  // wrong json format (should be deleted)
  await testingBackendMap.set(
    "4",
    JSON.stringify([
      '{"left":"4-1", "right": ""}',
      null,
      '{"left":"4-2", "right": ""}',
    ]) + "wrong"
  );
  await testingBackendMap.setDescription("4", ",null,");

  // without description (should be deleted)
  await testingBackendMap.set(
    "10",
    JSON.stringify([
      null,
      '{"left":"10-1", "right": ""}',
      null,
      '{"left":"10-2", "right": ""}',
    ])
  );

  // with null values (should be deleted)
  await testingBackendMap.set("13", `null`);
  await testingBackendMap.setDescription("13", ",null,");

  // values is array of nulls (should be deleted)
  await testingBackendMap.set("20", JSON.stringify([null, null, null]));
  await testingBackendMap.setDescription("20", ",null,");

  // with empty values (should be deleted)
  await testingBackendMap.set("25", `[]`);
  await testingBackendMap.setDescription("25", ",,");

  // larger than chunkSize (extra items ignored)
  await testingBackendMap.set(
    "30",
    JSON.stringify([
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      '{"left":"30-1", "right": "this item is not ignored"}',
      '{"left":"30-2", "right": "this item is ignored"}',
    ])
  );
  await testingBackendMap.setDescription("30", ",,,,,,,,");

  let model = new EntriesTableModelImpl(
    applyQuotaSavers(testingBackendMap),
    testingAuthClient
  );
  let entries = await waitForModelFullyLoad(model);

  expect(entries.length).toBe(4);
  expect(entries[0].left).toBe("");
  expect(entries[1].left).toBe("30-1");
  expect(entries[2].left).toBe("3-2");
  expect(entries[3].left).toBe("3-1");

  let subscription = new EntriesSubscription(model);

  model.onUpdate(entries[0].setLeft("newLeft"));
  while (entries.length !== 5) {
    entries = (await subscription.waitForNewEntries()).entries;
  }

  model.onUpdate(entries[0].setLeft("newNewLeft"));
  while (entries.length !== 6) {
    entries = (await subscription.waitForNewEntries()).entries;
  }

  await sleep(1500);
  expect((await testingBackendMap.getAllKeys()).length).toBe(4);

  let anotherModel = new EntriesTableModelImpl(
    applyQuotaSavers(testingBackendMap),
    testingAuthClient
  );

  await expectModelToHaveEntries({ model: anotherModel, entries });
  console.log("-----------------------------------------------");
}, 60000);

async function createSyncedModels(itemsNumber) {
  let testingMap = new TestingBackendMap();
  let withQuotaSavers = applyQuotaSavers(testingMap);
  await withQuotaSavers.getAllKeys();
  await fillTestingBackendMap(itemsNumber, withQuotaSavers);
  await sleep(1500);

  let model1 = new EntriesTableModelImpl(
    applyQuotaSavers(testingMap),
    testingAuthClient
  );

  // As soon as model1 finishes loading it creates new item
  // and marks it dirty. While it is dirty it will ignore
  // all updates to that item unless updated md5checksum
  // matches. This is behavior preventing sync hell when
  // user makes different changes to the same item.
  await waitForModelFullyLoad(model1);
  // To reset dirtiness we should wait until changes are delivered
  // to testingMap and sync. This way updated md5checksum will
  // equal |model1| contents.
  await sleep(1200);
  model1.sync();

  let model2 = new EntriesTableModelImpl(
    applyQuotaSavers(testingMap),
    testingAuthClient
  );

  return [model1, model2];
}

test("sync hides deleted entries (without changing other entries)", async () => {
  let [model1, model2] = await createSyncedModels(10);
  let subscription1 = new EntriesSubscription(model1);
  let subscription2 = new EntriesSubscription(model2);

  let entries1 = await waitForModelFullyLoad(model1);
  let entries2 = await waitForModelFullyLoad(model2);

  model2.onUpdate(entries2[1].delete());
  model1.onUpdate(entries1[4].delete());

  await sleep(1500);

  model1.sync();
  model2.sync();

  while (entries1.length !== 9) {
    entries1 = (await subscription1.waitForNewEntries()).entries;
  }
  while (subscription2.currentEntries.length !== 9) {
    entries2 = (await subscription2.waitForNewEntries()).entries;
  }

  await expectModelToHaveEntries({ model: model2, entries: entries1 });

  expect(JSON.stringify(entries1[0].data)).toBe(
    JSON.stringify({
      left: "",
      right: "",
      description: "",
    })
  );
  expect(JSON.stringify(entries1[1].data)).toBe(
    JSON.stringify({
      left: "lorem ipsum 1",
      right: "dolores 1",
      description: "",
    })
  );
  expect(JSON.stringify(entries1[2].data)).toBe(
    JSON.stringify({
      left: "lorem ipsum 2",
      right: "dolores 2",
      description: "",
    })
  );
  expect(JSON.stringify(entries1[3].data)).toBe(
    JSON.stringify({
      left: "lorem ipsum 4",
      right: "dolores 4",
      description: "",
    })
  );
  expect(JSON.stringify(entries1[4].data)).toBe(
    JSON.stringify({
      left: "lorem ipsum 5",
      right: "dolores 5",
      description: "",
    })
  );
  expect(JSON.stringify(entries1[5].data)).toBe(
    JSON.stringify({
      left: "lorem ipsum 6",
      right: "dolores 6",
      description: "",
    })
  );
  expect(JSON.stringify(entries1[6].data)).toBe(
    JSON.stringify({
      left: "lorem ipsum 7",
      right: "dolores 7",
      description: "",
    })
  );
  expect(JSON.stringify(entries1[7].data)).toBe(
    JSON.stringify({
      left: "lorem ipsum 8",
      right: "dolores 8",
      description: "",
    })
  );
  expect(JSON.stringify(entries1[8].data)).toBe(
    JSON.stringify({
      left: "lorem ipsum 9",
      right: "dolores 9",
      description: "",
    })
  );
}, 10000);

test("sync updates changed entries (without changing other entries)", async () => {
  let [model1, model2] = await createSyncedModels(10);
  let subscription1 = new EntriesSubscription(model1);
  let subscription2 = new EntriesSubscription(model2);

  let entries1 = await waitForModelFullyLoad(model1);
  let entries2 = await waitForModelFullyLoad(model2);

  await expectModelToHaveEntries({ model: model2, entries: entries1 });
  expect(entries1.length).toBe(11);

  entries1.shift();
  entries2.shift();

  model2.onUpdate(entries2[1].delete());
  model2.onUpdate(entries2[3].setLeft("updated 3"));
  model2.onUpdate(entries2[7].setLeft("updated 7"));

  await sleep(1200);
  model1.sync();
  model2.sync();
  await sleep(200);

  model1.onUpdate(entries1[4].setLeft("updated 4"));
  model1.onUpdate(entries1[6].setLeft("updated 6"));

  await sleep(1200);
  model1.sync();
  model2.sync();
  await sleep(200);

  entries1 = subscription1.currentEntries;
  entries2 = subscription2.currentEntries;

  await expectModelToHaveEntries({ model: model2, entries: entries1 });

  expect(entries1.length).toBe(10);

  expect(JSON.stringify(entries1[0].data)).toBe(
    JSON.stringify({
      left: "",
      right: "",
      description: "",
    })
  );
  expect(JSON.stringify(entries1[1].data)).toBe(
    JSON.stringify({
      left: "lorem ipsum 0",
      right: "dolores 0",
      description: "",
    })
  );
  expect(JSON.stringify(entries1[2].data)).toBe(
    JSON.stringify({
      left: "lorem ipsum 2",
      right: "dolores 2",
      description: "",
    })
  );
  expect(JSON.stringify(entries1[3].data)).toBe(
    JSON.stringify({
      left: "updated 3",
      right: "dolores 3",
      description: "",
    })
  );
  expect(JSON.stringify(entries1[4].data)).toBe(
    JSON.stringify({
      left: "updated 4",
      right: "dolores 4",
      description: "",
    })
  );
  expect(JSON.stringify(entries1[5].data)).toBe(
    JSON.stringify({
      left: "lorem ipsum 5",
      right: "dolores 5",
      description: "",
    })
  );
  expect(JSON.stringify(entries1[6].data)).toBe(
    JSON.stringify({
      left: "updated 6",
      right: "dolores 6",
      description: "",
    })
  );
  expect(JSON.stringify(entries1[7].data)).toBe(
    JSON.stringify({
      left: "updated 7",
      right: "dolores 7",
      description: "",
    })
  );
  expect(JSON.stringify(entries1[8].data)).toBe(
    JSON.stringify({
      left: "lorem ipsum 8",
      right: "dolores 8",
      description: "",
    })
  );
  expect(JSON.stringify(entries1[9].data)).toBe(
    JSON.stringify({
      left: "lorem ipsum 9",
      right: "dolores 9",
      description: "",
    })
  );
}, 10000);

test("without sync new entries overwrite previous items in chunk", async () => {
  let [model1, model2] = await createSyncedModels(4);
  let subscription1 = new EntriesSubscription(model1);
  let subscription2 = new EntriesSubscription(model2);

  let entries1 = await waitForModelFullyLoad(model1);
  await waitForModelFullyLoad(model2);

  await expectModelToHaveEntries({ model: model2, entries: entries1 });

  expect(entries1.length).toBe(5);

  let addItem = async (model, subscription, left) => {
    while (subscription.currentEntries[0].left !== "") {
      await subscription.waitForNewEntries();
    }
    model.onUpdate(subscription.currentEntries[0].setLeft(left));
    await subscription.waitForNewEntries();
  };

  await addItem(model1, subscription1, "item 1 model 1");
  await addItem(model1, subscription1, "item 2 model 1");
  await addItem(model1, subscription1, "item 3 model 1");
  await addItem(model1, subscription1, "item 4 model 1");
  await addItem(model1, subscription1, "item 5 model 1");
  await addItem(model1, subscription1, "item 6 model 1");

  await sleep(1200);
  model1.sync();
  // model2 didn't sync
  await sleep(200);

  await addItem(model2, subscription2, "item 1 model 2");
  await addItem(model2, subscription2, "item 2 model 2");
  await addItem(model2, subscription2, "item 3 model 2");
  await addItem(model2, subscription2, "item 4 model 2");
  await addItem(model2, subscription2, "item 5 model 2");
  await addItem(model2, subscription2, "item 6 model 2");

  await sleep(1200);
  model1.sync();
  model2.sync();
  await sleep(200);

  entries1 = subscription1.currentEntries;

  await expectModelToHaveEntries({ model: model2, entries: entries1 });

  expect(entries1[0].left).toBe("");
  expect(entries1[1].left).toBe("item 6 model 2");
  expect(entries1[2].left).toBe("item 5 model 2");
  expect(entries1[3].left).toBe("item 6 model 1");
  expect(entries1[4].left).toBe("item 5 model 1");
  // model2 didn't sync and it didn't know about changes in model1.
  // That's why it overwrote last 3 entries in chunk.
  expect(entries1[5].left).toBe("item 4 model 2");
  expect(entries1[6].left).toBe("item 3 model 2");
  expect(entries1[7].left).toBe("item 2 model 2");
  expect(entries1[8].left).toBe("item 1 model 2");
  expect(entries1[9].left).toBe("lorem ipsum 0");
  expect(entries1[10].left).toBe("lorem ipsum 1");
  expect(entries1[11].left).toBe("lorem ipsum 2");
  expect(entries1[12].left).toBe("lorem ipsum 3");
}, 10000);

test("with sync new entries adds up to previous items in chunk", async () => {
  let [model1, model2] = await createSyncedModels(4);
  let subscription1 = new EntriesSubscription(model1);
  let subscription2 = new EntriesSubscription(model2);

  let entries1 = await waitForModelFullyLoad(model1);
  await waitForModelFullyLoad(model2);

  await expectModelToHaveEntries({ model: model2, entries: entries1 });

  expect(entries1.length).toBe(5);

  let addItem = async (model, subscription, left) => {
    while (subscription.currentEntries[0].left !== "") {
      await subscription.waitForNewEntries();
    }
    model.onUpdate(subscription.currentEntries[0].setLeft(left));
    await subscription.waitForNewEntries();
  };

  await addItem(model1, subscription1, "item 1 model 1");
  await addItem(model1, subscription1, "item 2 model 1");
  await addItem(model1, subscription1, "item 3 model 1");
  await addItem(model1, subscription1, "item 4 model 1");
  await addItem(model1, subscription1, "item 5 model 1");
  await addItem(model1, subscription1, "item 6 model 1");

  await sleep(1200);
  model1.sync();
  model2.sync();
  await sleep(200);

  await addItem(model2, subscription2, "item 1 model 2");
  await addItem(model2, subscription2, "item 2 model 2");
  await addItem(model2, subscription2, "item 3 model 2");
  await addItem(model2, subscription2, "item 4 model 2");
  await addItem(model2, subscription2, "item 5 model 2");
  await addItem(model2, subscription2, "item 6 model 2");

  await sleep(1200);
  model1.sync();
  model2.sync();
  await sleep(200);

  entries1 = subscription1.currentEntries;

  await expectModelToHaveEntries({ model: model2, entries: entries1 });

  expect(entries1[0].left).toBe("");
  expect(entries1[1].left).toBe("item 6 model 2");
  expect(entries1[2].left).toBe("item 5 model 2");
  expect(entries1[3].left).toBe("item 4 model 2");
  expect(entries1[4].left).toBe("item 3 model 2");
  expect(entries1[5].left).toBe("item 2 model 2");
  expect(entries1[6].left).toBe("item 1 model 2");
  expect(entries1[7].left).toBe("item 6 model 1");
  expect(entries1[8].left).toBe("item 5 model 1");
  expect(entries1[9].left).toBe("item 4 model 1");
  expect(entries1[10].left).toBe("item 3 model 1");
  expect(entries1[11].left).toBe("item 2 model 1");
  expect(entries1[12].left).toBe("item 1 model 1");
  expect(entries1[13].left).toBe("lorem ipsum 0");
  expect(entries1[14].left).toBe("lorem ipsum 1");
  expect(entries1[15].left).toBe("lorem ipsum 2");
  expect(entries1[16].left).toBe("lorem ipsum 3");
}, 10000);

test("undo/redo", async () => {
  await fillTestingBackendMap(160);

  const { model, subscription } = createModel();
  let initialEntries = await waitForModelFullyLoad(model);

  for (let i = 0; i <= 160; i++) model.onUpdate(initialEntries[i].delete());
  await sleep(100);

  expect(subscription.currentEntries.length).toBe(1);
  expect(subscription.currentEntries[0].key).toBe("0-0");
  expect(subscription.currentEntries[0].left).toBe("");
  expect(subscription.currentEntries[0].right).toBe("");

  for (let i = 0; i <= 499; i++) model.undo();

  await sleep(10);
  await expectModelToHaveEntries({ model, entries: initialEntries });

  for (let i = 0; i <= 1500; i++) {
    model.redo();
  }

  await sleep(10);

  expect(subscription.currentEntries.length).toBe(1);
  expect(subscription.currentEntries[0].key).toBe("0-0");
  expect(subscription.currentEntries[0].left).toBe("");
  expect(subscription.currentEntries[0].right).toBe("");

  for (let i = 0; i <= 15; i++) {
    expect(subscription.currentEntries.length).toBe(i + 1);
    model.undo();
    await sleep(10);
  }

  let entries1 = subscription.currentEntries;

  expect(entries1[0].left).toBe("");
  expect(entries1[1].left).toBe("lorem ipsum 144");
  expect(entries1[2].left).toBe("lorem ipsum 145");
  expect(entries1[3].left).toBe("lorem ipsum 146");
  expect(entries1[4].left).toBe("lorem ipsum 147");
  expect(entries1[5].left).toBe("lorem ipsum 148");
  expect(entries1[6].left).toBe("lorem ipsum 149");
  expect(entries1[7].left).toBe("lorem ipsum 150");
  expect(entries1[8].left).toBe("lorem ipsum 151");
  expect(entries1[9].left).toBe("lorem ipsum 152");
  expect(entries1[10].left).toBe("lorem ipsum 153");
  expect(entries1[11].left).toBe("lorem ipsum 154");
  expect(entries1[12].left).toBe("lorem ipsum 155");
  expect(entries1[13].left).toBe("lorem ipsum 156");
  expect(entries1[14].left).toBe("lorem ipsum 157");
  expect(entries1[15].left).toBe("lorem ipsum 158");
  expect(entries1[16].left).toBe("lorem ipsum 159");

  // redo delete
  model.redo();
  await sleep(10);
  let entries2 = subscription.currentEntries;

  expect(entries2[0].left).toBe("");
  expect(entries2[1].left).toBe("lorem ipsum 145");
  expect(entries2[2].left).toBe("lorem ipsum 146");
  expect(entries2[3].left).toBe("lorem ipsum 147");
  expect(entries2[4].left).toBe("lorem ipsum 148");
  expect(entries2[5].left).toBe("lorem ipsum 149");
  expect(entries2[6].left).toBe("lorem ipsum 150");
  expect(entries2[7].left).toBe("lorem ipsum 151");
  expect(entries2[8].left).toBe("lorem ipsum 152");
  expect(entries2[9].left).toBe("lorem ipsum 153");
  expect(entries2[10].left).toBe("lorem ipsum 154");
  expect(entries2[11].left).toBe("lorem ipsum 155");
  expect(entries2[12].left).toBe("lorem ipsum 156");
  expect(entries2[13].left).toBe("lorem ipsum 157");
  expect(entries2[14].left).toBe("lorem ipsum 158");
  expect(entries2[15].left).toBe("lorem ipsum 159");

  model.onUpdate(entries2[2].setLeft("changed 2"));
  model.onUpdate(entries2[4].setLeft("changed 4"));
  model.onUpdate(entries2[8].setLeft("changed 8"));
  model.onUpdate(entries2[14].setLeft("changed 14"));

  await sleep(10);
  let entries3 = subscription.currentEntries;

  expect(entries3[0].left).toBe("");
  expect(entries3[1].left).toBe("lorem ipsum 145");
  expect(entries3[2].left).toBe("changed 2");
  expect(entries3[3].left).toBe("lorem ipsum 147");
  expect(entries3[4].left).toBe("changed 4");
  expect(entries3[5].left).toBe("lorem ipsum 149");
  expect(entries3[6].left).toBe("lorem ipsum 150");
  expect(entries3[7].left).toBe("lorem ipsum 151");
  expect(entries3[8].left).toBe("changed 8");
  expect(entries3[9].left).toBe("lorem ipsum 153");
  expect(entries3[10].left).toBe("lorem ipsum 154");
  expect(entries3[11].left).toBe("lorem ipsum 155");
  expect(entries3[12].left).toBe("lorem ipsum 156");
  expect(entries3[13].left).toBe("lorem ipsum 157");
  expect(entries3[14].left).toBe("changed 14");
  expect(entries3[15].left).toBe("lorem ipsum 159");

  // Redo does nothing.
  model.redo();
  await sleep(10);

  await expectModelToHaveEntries({ model, entries: entries3 });

  model.onUpdate(entries3[4].setLeft("changed again 4"));
  model.onUpdate(entries3[14].setLeft("changed again 14"));
  await sleep(10);
  let entries4 = subscription.currentEntries;
  expect(entries4[0].left).toBe("");
  expect(entries4[1].left).toBe("lorem ipsum 145");
  expect(entries4[2].left).toBe("changed 2");
  expect(entries4[3].left).toBe("lorem ipsum 147");
  expect(entries4[4].left).toBe("changed again 4");
  expect(entries4[5].left).toBe("lorem ipsum 149");
  expect(entries4[6].left).toBe("lorem ipsum 150");
  expect(entries4[7].left).toBe("lorem ipsum 151");
  expect(entries4[8].left).toBe("changed 8");
  expect(entries4[9].left).toBe("lorem ipsum 153");
  expect(entries4[10].left).toBe("lorem ipsum 154");
  expect(entries4[11].left).toBe("lorem ipsum 155");
  expect(entries4[12].left).toBe("lorem ipsum 156");
  expect(entries4[13].left).toBe("lorem ipsum 157");
  expect(entries4[14].left).toBe("changed again 14");
  expect(entries4[15].left).toBe("lorem ipsum 159");

  model.undo();
  await sleep(10);
  expect(subscription.currentEntries[4].left).toBe("changed again 4");
  expect(subscription.currentEntries[14].left).toBe("changed 14");

  model.undo();
  await sleep(10);
  await expectModelToHaveEntries({ model, entries: entries3 });

  for (let i = 0; i < 4; i++) model.undo();
  await sleep(10);
  await expectModelToHaveEntries({ model, entries: entries2 });

  model.undo();
  await sleep(10);
  await expectModelToHaveEntries({ model, entries: entries1 });

  for (let i = 0; i <= 160; i++) model.undo();
  await sleep(10);
  await expectModelToHaveEntries({ model, entries: initialEntries });

  for (let i = 0; i <= 1600; i++) model.undo();
  await sleep(10);
  await expectModelToHaveEntries({ model, entries: initialEntries });

  for (let i = 0; i <= 160; i++) model.redo();
  await sleep(10);
  await expectModelToHaveEntries({ model, entries: entries4 });
}, 10000);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
