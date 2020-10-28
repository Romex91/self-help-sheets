import { Interface } from "./Interface.js";
import { BackendMap } from "./BackendMap";
import { GDriveStates } from "./GDriveAuthClient";
import { Settings } from "./Settings";
import { EntryStatus, EntryModel } from "./Entry";
import _ from "lodash";
import { Mutex } from "async-mutex";

export class EntriesTableModel extends Interface {
  constructor() {
    super();
    this.requireFunction("subscribe", "callback");
    this.requireFunction("unsubscribe", "callback");
    this.requireFunction("onUpdate", "entry", "omitHistory");
    this.requireFunction("onSettingsUpdate", "settings");
    this.requireFunction("setIgnoreKeys", "ignoreKeys");

    this.requireFunction("addNewItem");

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

  addNewItemThrottled = _.throttle(() => {
    this.addNewItem();
  }, 500);

  addNewItem = async (omitHistory = false) => {
    let release = await this._addNewItemMutex.acquire();

    const entry = this._tryFindVacantEntry() || (await this._createNewEntry());

    this.onUpdate(
      entry
        .clear()
        .setFocused(true)
        .setInitiallyCollapsed(true)
        .setCreationTime(new Date(Date.now())),
      omitHistory
    );

    release();
  };

  // If user deletes entries from top of the table than keys assigned to these
  // entries can be reused.
  // This function returns such entry if it exists.
  _tryFindVacantEntry() {
    let lastVacantEntry = null;
    this._entries.forEach((entry) => {
      if (entry.data === EntryStatus.DELETED) {
        if (lastVacantEntry == null) lastVacantEntry = entry;
      } else {
        lastVacantEntry = null;
      }
    });

    return lastVacantEntry;
  }

  // If there is no deleted entry to reuse the only option is creating a new one.
  async _createNewEntry() {
    if (this._entries.has(null)) {
      return;
    }
    this._entries.set(null, new EntryModel(null).delete());

    let newKey = await this._backendMap.createKey();

    if (!this._entries.has(null)) {
      throw new Error("A null key should persist until the new key is created");
    }

    let newEntry = new EntryModel(newKey, this._entries.get(null).data, "");
    this._entries.set(newKey, newEntry);
    await this._sendEntryToBackend(newEntry);

    this._entries.delete(null);

    return newEntry;
  }

  undo = () => {
    if (this._historyIndex === 0) return;

    this._historyIndex--;

    let entry = this._history[this._historyIndex].old;
    if (entry.data !== EntryStatus.DELETED) {
      entry = entry.setFocused(true);
      if (this._history[this._historyIndex].new.data === EntryStatus.DELETED) {
        entry = entry.setInitiallyCollapsed(true);
      }
    }

    this._entries.set(entry.key, entry);
    this._sendEntryToBackend(entry);
    this._onEntriesChanged();
  };

  redo = () => {
    if (this._historyIndex >= this._history.length) return;

    let historyItem = this._history[this._historyIndex++];
    let entry = historyItem.new;
    if (entry.data !== EntryStatus.DELETED) {
      entry = entry.setFocused(true);
      if (historyItem.old.data === EntryStatus.DELETED) {
        entry = entry.setInitiallyCollapsed(true);
      }
    }

    this._entries.set(entry.key, entry);
    this._sendEntryToBackend(entry);
    this._onEntriesChanged();
  };

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
      } else if (x.description === EntryStatus.DELETED) {
        x.outdated = false;
        entry = new EntryModel(x.id).delete();
      } else {
        x.outdated = true;
        entry = new EntryModel(
          x.id,
          newEntries.size < keys.length - 30
            ? EntryStatus.HIDDEN
            : EntryStatus.LOADING,
          x.description
        );
        this._descriptions.set(x.id, x.description);
      }

      if (x.description !== this._descriptions.get(x.id)) {
        entry = entry.setDescription(x.description);
        this._descriptions.set(x.id, x.description);
      }
      newEntries.set(x.id, entry);
    });

    let promises = [];
    if (this._settings == null) promises.push(this._fetchSettings());

    keys.reverse().forEach((x) => {
      if (x.outdated && newEntries.get(x.id).data !== EntryStatus.HIDDEN) {
        promises.push(this._fetch(x.id));
      }
    });

    if (this._entries.has(null)) {
      newEntries.set(null, this._entries.get(null));
    }

    this._entries = newEntries;

    if (this._entries.size === 0) {
      await this.addNewItem(true);
      return;
    }

    this._onEntriesChanged();

    await Promise.all(promises);
  };

  onSettingsUpdate = _.debounce((settings) => {
    this._settings = settings;
    this._onEntriesChanged();
    this._backendMap.setSettings(settings.stringify());
  }, 1000);

  onUpdate = (entry, omitHistory = false) => {
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
    if (!omitHistory) this._addHistoryItem(entry);
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
  _addNewItemMutex = new Mutex();

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
      if (e.keyCode === 90) {
        // Z
        this.undo();
      } else if (e.keyCode === 89) {
        // Y
        this.redo();
      } else if (e.keyCode === 13) {
        // ENTER
        this.addNewItemThrottled();
      } else return;
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
        : new EntryModel(newEntry.key).delete(),
      new: newEntry,
    });
    this._historyIndex = this._history.length;
  }

  async _sendEntryToBackend(entry) {
    let descriptionPromise = null;
    if (entry.description !== this._descriptions.get(entry.key)) {
      descriptionPromise = this._backendMap.setDescription(
        entry.key,
        entry.description
      );
      this._descriptions.set(entry.key, entry.description);
    }

    let dataPromise = null;
    if (entry.isDataLoaded())
      dataPromise = this._backendMap.set(entry.key, JSON.stringify(entry.data));

    await Promise.all([descriptionPromise, dataPromise]);
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
        let entry = new EntryModel(key).delete();
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

        if (
          data === EntryStatus.DELETED &&
          this._descriptions.get(key) !== EntryStatus.DELETED
        ) {
          this._backendMap.setDescription(key, EntryStatus.DELETED);
        }

        let entry = new EntryModel(key, data, this._descriptions.get(key));

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
    return Array.from(this._entries.values())
      .reverse()
      .filter((x) => x.data !== EntryStatus.DELETED && x.key !== null);
  }

  _onEntriesChanged() {
    const entries = this._getFilteredEntriesArray();
    this._subscriptions.forEach((callback) => {
      callback(entries, this._settings, {
        canRedo: this._history.length > this._historyIndex,
        canUndo: this._history.length > 0 && this._historyIndex > 0,
      });
    });
  }
}
