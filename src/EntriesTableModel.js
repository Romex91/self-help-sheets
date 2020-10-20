import { Interface } from "./Interface.js";
import { BackendMap } from "./BackendMap";
import { GDriveStates } from "./GDriveAuthClient";
import { Settings } from "./Settings";
import { EntryStatus, EntryModel } from "./Entry";
import _ from "lodash";

export class EntriesTableModel extends Interface {
  constructor() {
    super();
    this.requireFunction("subscribe", "callback");
    this.requireFunction("unsubscribe", "callback");
    this.requireFunction("onUpdate", "entry");
    this.requireFunction("onSettingsUpdate", "settings");
    this.requireFunction("setIgnoreKeys", "ignoreKeys");

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
    this._syncLoop();
    window.addEventListener("keydown", this._onKeyPress);
  }

  dispose() {
    this._disposed = true;
    window.removeEventListener("keydown", this._onKeyPress);
    this._subscriptions = new Set();
  }

  subscribe(callback) {
    this._subscriptions.add(callback);
    if (this._entries.size > 0)
      callback(this._getFilteredEntriesArray(), this._settings);
  }

  unsubscribe(callback) {
    this._subscriptions.delete(callback);
  }

  undo() {
    if (this._historyIndex === 0) return;

    this._historyIndex--;

    let entry = this._history[this._historyIndex].old;
    this._entries.set(entry.key, entry);
    this._sendEntryToBackend(entry);
    this._onEntriesChanged();
  }

  redo() {
    if (this._historyIndex >= this._history.length) return;

    let entry = this._history[this._historyIndex++].new;
    this._entries.set(entry.key, entry);
    this._sendEntryToBackend(entry);
    this._onEntriesChanged();
  }

  sync = async () => {
    if (this._disposed) return;

    while (this._authClient.state !== GDriveStates.SIGNED_IN) {
      await this._authClient.waitForStateChange();
    }

    let keys = await this._backendMap.getAllKeys();

    let newEntries = new Map();

    keys.forEach((x) => {
      let entry;
      if (this._entries.has(x.id)) {
        entry = this._entries.get(x.id);
      } else {
        x.outdated = true;
        entry = new EntryModel(
          x.id,
          newEntries.size < keys.length - 30
            ? EntryStatus.HIDDEN
            : EntryStatus.LOADING
        );
      }

      if (
        entry.isDataLoaded() &&
        entry.data !== EntryStatus.DELETED &&
        x.description !== this._descriptions.get(x.id)
      ) {
        entry = entry.setDescription(x.description);
      }
      newEntries.set(x.id, entry);
      this._descriptions.set(x.id, x.description);
    });

    let promises = [];
    promises.push(this._fetchSettings());

    keys.reverse().forEach((x) => {
      if (x.outdated && newEntries.get(x.id).data !== EntryStatus.HIDDEN) {
        promises.push(this._fetch(x.id));
      }
    });

    if (this._entries.has(null)) {
      newEntries.set(null, this._entries.get(null));
    }

    this._entries = newEntries;

    this._onEntriesChanged();

    await Promise.all(promises);
  };

  onSettingsUpdate = _.debounce((settings) => {
    this._backendMap.setSettings(settings.stringify());
  }, 1000);

  onUpdate = (entry) => {
    if (!this._entries.has(entry.key)) return;

    let prevEntry = this._entries.get(entry.key);

    if (entry.data === EntryStatus.LOADING) {
      if (prevEntry.data === EntryStatus.HIDDEN) {
        this._fetch(entry.key);
        this._entries.set(entry.key, entry);
      }
      return;
    }

    this._sendEntryToBackend(entry);
    this._addHistoryItem(entry);
    this._entries.set(entry.key, entry);

    this._onEntriesChanged();
  };

  setIgnoreKeys(ignoreKeys) {
    this._ignoreKeys = ignoreKeys;
  }

  _disposed = false;
  _historyIndex = 0;
  _history = [];
  _authClient = null;
  _backendMap = null;

  // |_entries| is in reverse order.
  // It is natural for |Map| to add new items to the end, but
  // in |EntriesTable| new items belong to the top.
  _entries = new Map();
  _settings = null;
  _descriptions = new Map();
  _subscriptions = new Set();

  _syncLoop = async () => {
    await this.sync();
    setTimeout(this._syncLoop, 15000);
  };

  _onKeyPress = (e) => {
    if (this._ignoreKeys) return;
    if (e.ctrlKey) {
      if (e.keyCode === 90) this.undo();
      else if (e.keyCode === 89) this.redo();
      else return;
      e.preventDefault();
    }
  };

  _addHistoryItem(newEntry) {
    if (newEntry.key == null) {
      throw new Error(
        "null key shouldn't have value. There is no point to restore it."
      );
    }

    if (
      !this._entries.has(newEntry.key) ||
      !this._entries.get(newEntry.key).isDataLoaded()
    ) {
      return;
    }

    this._history = this._history.slice(0, this._historyIndex);
    this._history.push({
      old: this._entries.has(newEntry.key)
        ? this._entries.get(newEntry.key)
        : new EntryModel(newEntry.key, {}).delete(),
      new: newEntry,
    });
    this._historyIndex = this._history.length;
  }

  async _sendEntryToBackend(entry) {
    let { description, ...data } = entry.data;
    if (entry.data === EntryStatus.DELETED) {
      data = EntryStatus.DELETED;
      description = "";
    }

    let descriptionPromise = null;
    if (description !== this._descriptions.get(entry.key)) {
      descriptionPromise = this._backendMap.setDescription(
        entry.key,
        description
      );
      this._descriptions.set(entry.key, description);
    }

    await Promise.all([
      descriptionPromise,
      this._backendMap.set(entry.key, JSON.stringify(data)),
    ]);
  }

  async _fetchSettings() {
    const serializedSettings = await this._backendMap.getSettings();
    if (this._serializedSettings === serializedSettings) return;

    this._serializedSettings = serializedSettings;

    this._settings = new Settings(serializedSettings);

    this._onEntriesChanged();
  }

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
        let entry = new EntryModel(key, {}).delete();
        this._addHistoryItem(entry);
        this._entries.set(key, entry);
      } else {
        const data = JSON.parse(content);

        if (
          data !== EntryStatus.DELETED &&
          (data.left == null || data.right == null)
        ) {
          throw new Error("bad format " + content);
        }

        let entry = new EntryModel(key, data);

        if (data !== EntryStatus.DELETED)
          entry = entry.setDescription(this._descriptions.get(key));

        this._addHistoryItem(entry);
        this._entries.set(key, entry);
      }
    } catch (e) {
      console.error(e.message + " " + key + " " + content);
      if (!this._entries.get(key).isDataLoaded()) {
        this._entries.delete(key);
        this._descriptions.delete(key);
        this._backendMap.delete(key);
      }
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
      if (
        this._cachedFirstEmptyItem == null ||
        this._cachedFirstEmptyItem.key !== filteredEntries[0].key
      ) {
        this._cachedFirstEmptyItem = filteredEntries[0].clear();
      }

      filteredEntries[0] = this._cachedFirstEmptyItem;
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
      if (this._entries.has(null)) {
        return;
      }
      this._entries.set(null, new EntryModel(null, {}).delete());

      let newKey = await this._backendMap.createKey();

      if (!this._entries.has(null)) {
        throw new Error(
          "A null key should persist until the new key is created"
        );
      }

      let newEntry = new EntryModel(newKey, this._entries.get(null).data);

      this._entries.set(newKey, newEntry);
      await this._sendEntryToBackend(newEntry);

      this._entries.delete(null);

      await this._onEntriesChanged();
      return;
    }
  };

  _notifySubscribers(entries) {
    this._subscriptions.forEach((callback) => {
      callback(entries, this._settings);
    });
  }
}
