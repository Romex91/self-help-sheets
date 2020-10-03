import { Interface } from "./Interface.js";
import _ from "lodash";
import { BackendMap } from "./BackendMap";
import { GDriveStates } from "./GDriveAuthClient";

import { EntryStatus, EntryModel } from "./Entry";

export class EntriesTableModel extends Interface {
  constructor() {
    super();
    this.requireFunction("subscribe", "callback");
    this.requireFunction("unsubscribe", "callback");
    this.requireFunction("onUpdate", "entry");

    this.requireFunction("undo");
    this.requireFunction("redo");

    this.requireFunction("sync");
  }
}

export class EntriesTableModelImpl extends EntriesTableModel {
  #backendMap = null;
  #keys = [];
  #entries = null;
  #subscriptions = new Set();

  constructor(backendMap, authClient) {
    console.assert(backendMap instanceof BackendMap);
    super();
    this.#backendMap = backendMap;
    this.#init(authClient);
  }

  #init = async (authClient) => {
    while (authClient.state !== GDriveStates.SIGNED_IN) {
      await authClient.waitForStateChange();
    }
    this.#keys = (await this.#backendMap.getAllKeys()).reverse();

    let entryNumber = 0;
    this.#entries = this.#keys.map((key) => {
      if (entryNumber++ < 30) {
        this.#fetch(key.id);
        return new EntryModel(key.id, EntryStatus.LOADING);
      } else {
        return new EntryModel(key.id, EntryStatus.HIDDEN);
      }
    });

    this.#onEntriesChanged();
  };

  #fetch = async (key) => {
    let content = await this.#backendMap.get(key);
    let entryIndex = this.#entries.findIndex((x) => x.key === key);
    if (entryIndex === -1) {
      console.error("Entry for fetch doesn't exist anymore.");
      return;
    }

    if (content === undefined) {
      console.error("Key " + key + " is missing");
      this.#entries.splice(entryIndex, 1);
      this.#onEntriesChanged();
      return;
    }

    try {
      if (content === "") {
        this.#entries[entryIndex] = new EntryModel(key, {}).clear();
      } else {
        const data = JSON.parse(content);

        if (
          data !== EntryStatus.DELETED &&
          (data.left == null || data.right == null)
        ) {
          throw new Error("bad format " + content);
        }

        this.#entries[entryIndex] = new EntryModel(key, data);
      }
    } catch (e) {
      console.error(e.message);
      this.#entries.splice(entryIndex, 1);
      this.#backendMap.delete(key);
    }

    this.#onEntriesChanged();
  };

  // If user deletes entries from top of the table than keys assigned to these
  // entries can be reused again. This way syncing is a bit simpler.
  #getLastFreeIndex = () => {
    let lastFreeIndex = -1;
    for (let entry of this.#entries) {
      if (
        entry.isDataLoaded() &&
        (entry.data === EntryStatus.DELETED ||
          (entry.left === "" && entry.right === ""))
      ) {
        lastFreeIndex++;
        continue;
      }
      break;
    }
    return lastFreeIndex;
  };

  #onEntriesChanged = async () => {
    // There always should be an empty entry on top of the table.
    // The table doesn't have ADD NEW ITEM button. Instead user should
    // start typing in the top empty entry to add a new one.
    this.#notifySubscribers();
    if (
      this.#entries.length === 0 ||
      (this.#getLastFreeIndex() === -1 && this.#entries[0].isDataLoaded())
    ) {
      if (this.#entries.length > 0 && this.#entries[0].key === null) {
        return;
      }

      this.#entries.unshift(new EntryModel(null, {}).clear());

      let newKey = await this.#backendMap.createKey();

      if (this.#entries[0].key !== null) {
        throw new Error(
          "A null key should be ontop until the new key is created"
        );
      }

      this.#entries[0] = new EntryModel(newKey, this.#entries[0].data);

      let md5Checksum = await this.#backendMap.set(
        newKey,
        JSON.stringify(this.#entries[0].data)
      );

      this.#keys.unshift({ md5Checksum, id: newKey });

      await this.#onEntriesChanged();
      return;
    }
  };

  #getFilteredEntries = () => {
    let lastFreeIndex = this.#getLastFreeIndex();
    let filteredEntries = this.#entries.slice(
      lastFreeIndex > 0 ? lastFreeIndex : 0
    );

    if (filteredEntries[0].data === EntryStatus.DELETED) {
      filteredEntries[0] = filteredEntries[0].clear();
    }

    filteredEntries = filteredEntries.filter(
      (x) => x.data !== EntryStatus.DELETED && x.key !== null
    );
    return filteredEntries;
  };

  #notifySubscribers = () => {
    if (this.#entries.length === 0) return;
    console.log(this.#getFilteredEntries().map((x) => x.data));
    this.#subscriptions.forEach((callback) => {
      callback(this.#getFilteredEntries());
    });
  };

  subscribe(callback) {
    this.#subscriptions.add(callback);
    if (!!this.#entries && this.#entries.length > 0)
      callback(this.#getFilteredEntries());
  }

  unsubscribe(callback) {
    this.#subscriptions.delete(callback);
  }

  undo() {}

  redo() {}

  sync() {}

  onUpdate = (entry) => {
    this.#entries = this.#entries.map((x) => (x.key === entry.key ? entry : x));
    if (entry.data === EntryStatus.LOADING) {
      this.#fetch(entry.key);
    } else if (entry.key !== null) {
      console.assert(entry.isDataLoaded());
      this.#backendMap.set(entry.key, JSON.stringify(entry.data));
    }

    this.#onEntriesChanged();
  };
}
