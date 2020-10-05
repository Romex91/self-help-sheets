import { Interface } from "./Interface.js";
import _, { entries } from "lodash";
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
    this._authClient = authClient;
    this.sync();
  }

  subscribe(callback) {
    this._subscriptions.add(callback);
    if (this._entries.size > 0) callback(this._getFilteredEntriesArray());
  }

  unsubscribe(callback) {
    this._subscriptions.delete(callback);
  }

  undo() {}

  redo() {}

  async sync() {
    while (this._authClient.state !== GDriveStates.SIGNED_IN) {
      await this._authClient.waitForStateChange();
    }

    let keys = await this._backendMap.getAllKeys();

    let newEntries = new Map();

    keys.forEach((x) => {
      if (this._entries.has(x.id)) {
        newEntries.set(x.id, this._entries.get(x.id));
      } else {
        newEntries.set(
          x.id,
          new EntryModel(
            x.id,
            newEntries.size < keys.length - 30
              ? EntryStatus.HIDDEN
              : EntryStatus.LOADING
          )
        );
      }
    });

    keys.reverse().forEach((x) => {
      if (x.outdated && newEntries.get(x.id).data !== EntryStatus.HIDDEN) {
        this._fetch(x.id);
      }
    });

    if (this._entries.has(null)) {
      newEntries.set(null, this._entries.get(null));
    }

    this._entries = newEntries;

    this._onEntriesChanged();
  }

  onUpdate = (entry) => {
    if (!this._entries.has(entry.key)) return;

    let prevEntry = this._entries.get(entry.key);
    this._entries.set(entry.key, entry);

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

  _authClient = null;
  _backendMap = null;

  // |_entries| is in reverse order.
  // It is natural for |Map| to add new items to the end, but
  // in |EntriesTable| new items belong to the top.
  _entries = new Map();
  _subscriptions = new Set();

  _fetch = async (key) => {
    let content = await this._backendMap.get(key);

    if (!this._entries.has(key)) {
      console.error("Entry for fetch doesn't exist anymore. " + key);
      return;
    }

    if (content === undefined) {
      console.error("Key " + key + " is missing");
      this._entries.delete(key);
      this._onEntriesChanged();
      return;
    }

    try {
      if (content === "") {
        this._entries.set(key, new EntryModel(key, {}).delete());
      } else {
        const data = JSON.parse(content);

        if (
          data !== EntryStatus.DELETED &&
          (data.left == null || data.right == null)
        ) {
          throw new Error("bad format " + content);
        }

        this._entries.set(key, new EntryModel(key, data));
      }
    } catch (e) {
      console.error(e.message + " " + key + " " + content);
      this._entries.delete(key);
      this._backendMap.delete(key);
    }

    this._onEntriesChanged();
  };

  _getFilteredEntriesArray() {
    let reverseEntriesArray = Array.from(this._entries.values()).reverse();

    // If user deletes entries from top of the table than keys assigned to these
    // entries can be reused again.
    let lastVacantIndex = -1;
    for (let entry of reverseEntriesArray) {
      if (entry.isVacant()) {
        lastVacantIndex++;
        continue;
      }
      break;
    }

    let filteredEntries = reverseEntriesArray.slice(
      lastVacantIndex > 0 ? lastVacantIndex : 0
    );

    if (filteredEntries.length === 0) return filteredEntries;

    if (filteredEntries[0].data === EntryStatus.DELETED) {
      filteredEntries[0] = filteredEntries[0].clear();
    }

    filteredEntries = filteredEntries.filter(
      (x) => x.data !== EntryStatus.DELETED && x.key !== null
    );
    return filteredEntries;
  }

  _onEntriesChanged = async () => {
    let filteredEntriesArray = this._getFilteredEntriesArray();
    if (filteredEntriesArray.length > 0)
      this._notifySubscribers(filteredEntriesArray);
    // There always should be an empty entry on top of the table.
    // The table doesn't have ADD NEW ITEM button. Instead user should
    // start typing in the top empty entry to add a new one.
    if (
      filteredEntriesArray.length === 0 ||
      (filteredEntriesArray[0].isDataLoaded() &&
        !filteredEntriesArray[0].isVacant())
    ) {
      // if there is a null key it means that we already
      // called |this._backendMap.createKey|.
      if (this._entries.has(null)) {
        return;
      }

      this._entries.set(null, new EntryModel(null, {}).clear());
      let newKey = await this._backendMap.createKey();

      if (!this._entries.has(null)) {
        throw new Error(
          "A null key should persist until the new key is created"
        );
      }

      let newEntry = new EntryModel(newKey, this._entries.get(null).data);

      this._entries.set(newKey, newEntry);
      await this._backendMap.set(newKey, JSON.stringify(newEntry.data));
      this._entries.delete(null);

      await this._onEntriesChanged();
      return;
    }
  };

  _notifySubscribers(entries) {
    this._subscriptions.forEach((callback) => {
      callback(entries);
    });
  }
}
