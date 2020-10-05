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
  constructor(backendMap, authClient) {
    console.assert(backendMap instanceof BackendMap);
    super();
    this._backendMap = backendMap;
    this._init(authClient);
  }

  subscribe(callback) {
    this._subscriptions.add(callback);
    if (!!this._entries && this._entries.length > 0)
      callback(this._getFilteredEntries());
  }

  unsubscribe(callback) {
    this._subscriptions.delete(callback);
  }

  undo() {}

  redo() {}

  sync() {}

  onUpdate = (entry) => {
    let prevEntry = this._entries.find((x) => x.key === entry.key);
    if (prevEntry == null) return;

    this._entries = this._entries.map((x) => (x.key === entry.key ? entry : x));
    if (
      entry.data === EntryStatus.LOADING &&
      prevEntry.data === EntryStatus.HIDDEN
    ) {
      this._fetch(entry.key);
    } else if (entry.key !== null && entry.isDataLoaded()) {
      this._backendMap.set(entry.key, JSON.stringify(entry.data));
    }

    this._onEntriesChanged();
  };

  _backendMap = null;
  _keys = [];
  _entries = null;
  _subscriptions = new Set();

  _init = async (authClient) => {
    while (authClient.state !== GDriveStates.SIGNED_IN) {
      await authClient.waitForStateChange();
    }
    this._keys = (await this._backendMap.getAllKeys()).reverse();

    let entryNumber = 0;
    this._entries = this._keys.map((key) => {
      if (entryNumber++ < 30) {
        this._fetch(key.id);
        return new EntryModel(key.id, EntryStatus.LOADING);
      } else {
        return new EntryModel(key.id, EntryStatus.HIDDEN);
      }
    });

    this._onEntriesChanged();
  };

  _fetch = async (key) => {
    let content = await this._backendMap.get(key);
    let entryIndex = this._entries.findIndex((x) => x.key === key);
    if (entryIndex === -1) {
      console.error("Entry for fetch doesn't exist anymore. " + key);
      return;
    }

    if (content === undefined) {
      console.error("Key " + key + " is missing");
      this._entries.splice(entryIndex, 1);
      this._onEntriesChanged();
      return;
    }

    try {
      if (content === "") {
        this._entries[entryIndex] = new EntryModel(key, {}).delete();
      } else {
        const data = JSON.parse(content);

        if (
          data !== EntryStatus.DELETED &&
          (data.left == null || data.right == null)
        ) {
          throw new Error("bad format " + content);
        }

        this._entries[entryIndex] = new EntryModel(key, data);
      }
    } catch (e) {
      console.error(e.message + " " + content);
      this._entries.splice(entryIndex, 1);
      this._backendMap.delete(key);
    }

    this._onEntriesChanged();
  };

  // If user deletes entries from top of the table than keys assigned to these
  // entries can be reused again. This way syncing is a bit simpler.
  _getLastFreeIndex = () => {
    let lastFreeIndex = -1;
    for (let entry of this._entries) {
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

  _onEntriesChanged = async () => {
    // There always should be an empty entry on top of the table.
    // The table doesn't have ADD NEW ITEM button. Instead user should
    // start typing in the top empty entry to add a new one.
    this._notifySubscribers();
    if (
      this._entries.length === 0 ||
      (this._getLastFreeIndex() === -1 && this._entries[0].isDataLoaded())
    ) {
      if (this._entries.length > 0 && this._entries[0].key === null) {
        return;
      }

      this._entries.unshift(new EntryModel(null, {}).clear());

      let newKey = await this._backendMap.createKey();

      if (this._entries[0].key !== null) {
        throw new Error(
          "A null key should be ontop until the new key is created"
        );
      }

      this._entries[0] = new EntryModel(newKey, this._entries[0].data);

      let md5Checksum = await this._backendMap.set(
        newKey,
        JSON.stringify(this._entries[0].data)
      );

      this._keys.unshift({ md5Checksum, id: newKey });

      await this._onEntriesChanged();
      return;
    }
  };

  _getFilteredEntries = () => {
    let lastFreeIndex = this._getLastFreeIndex();
    let filteredEntries = this._entries.slice(
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

  _notifySubscribers = () => {
    if (this._entries.length === 0) return;
    this._subscriptions.forEach((callback) => {
      callback(this._getFilteredEntries());
    });
  };
}
