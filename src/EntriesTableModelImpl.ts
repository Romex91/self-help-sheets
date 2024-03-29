import { BackendMultiplexor } from "./BackendQuotaSavers/BackendMultiplexor";
import { AuthStates, AuthClient } from "./AuthClient";
import { Settings } from "./Settings";
import { EntryStatus, EntryModel } from "./EntryModel";
import _ from "lodash";
import { Mutex } from "async-mutex";
import {
  EntriesTableModel,
  EntriesSubscriptionCallback,
} from "./EntriesTableModel";
import assert from "assert";

interface HistoryItem {
  old: EntryModel;
  new: EntryModel;
}

export class EntriesTableModelImpl implements EntriesTableModel {
  private _disposed = false;
  private _historyIndex = 0;
  private _history: HistoryItem[] = [];
  private _addNewItemMutex = new Mutex();

  // |_entries| is in reverse order.
  // It is natural for |Map| to add new items to the end, but
  // in |EntriesTable| new items belong to the top.
  private _entries: Map<string, EntryModel> = new Map();
  private _isCreatingNewEntry = false;

  private _settings?: Settings;
  private _serializedSettings = "";
  private _descriptions: Map<string, string> = new Map();
  private _subscriptions: Set<EntriesSubscriptionCallback> = new Set();

  constructor(
    private _backendMap: BackendMultiplexor,
    private _authClient: AuthClient
  ) {
    this._syncLoop();
  }

  dispose(): void {
    this._disposed = true;
    this._subscriptions = new Set();
  }

  subscribe(callback: EntriesSubscriptionCallback): void {
    this._subscriptions.add(callback);
    if (this._entries.size > 0)
      callback(this._getFilteredEntriesArray(), this._settings, {
        canUndo: false,
        canRedo: false,
      });
  }

  unsubscribe(callback: EntriesSubscriptionCallback): void {
    this._subscriptions.delete(callback);
  }

  addNewItemThrottled = _.throttle(() => {
    this.addNewItem();
  }, 500);

  addNewItem = async (omitHistory = false): Promise<void> => {
    const release = await this._addNewItemMutex.acquire();

    const entry = this._tryFindVacantEntry() || (await this._createNewEntry());

    if (entry == undefined) return;

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
  _tryFindVacantEntry(): EntryModel | undefined {
    let lastVacantEntry: EntryModel | undefined = undefined;
    this._entries.forEach((entry) => {
      if (entry.data === EntryStatus.DELETED) {
        if (lastVacantEntry == undefined) lastVacantEntry = entry;
      } else {
        lastVacantEntry = undefined;
      }
    });

    return lastVacantEntry;
  }

  // If there is no deleted entry to reuse the only option is creating a new one.
  async _createNewEntry(): Promise<EntryModel | undefined> {
    if (this._isCreatingNewEntry) {
      return;
    }
    this._isCreatingNewEntry = true;

    const newKey = await this._backendMap.createKey();

    assert(this._isCreatingNewEntry);
    this._isCreatingNewEntry = false;

    const newEntry = new EntryModel(newKey, EntryStatus.DELETED, "");
    this._entries.set(newKey, newEntry);
    await this._sendEntryToBackend(newEntry);

    return newEntry;
  }

  undo = (): void => {
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
  }

  redo = (): void => {
    if (this._historyIndex >= this._history.length) return;

    const historyItem = this._history[this._historyIndex++];
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
  }

  sync = async (): Promise<void> => {
    if (this._disposed) return;

    while (this._authClient.state !== AuthStates.SIGNED_IN) {
      await this._authClient.waitForStateChange();
    }

    const keys = await this._backendMap.getAllKeys();

    const newEntries = new Map();

    Array.from(keys).forEach((x) => {
      let entry;
      if (this._entries.has(x.id)) {
        entry = this._entries.get(x.id);
      } else if (x.description === EntryStatus.DELETED) {
        x.outdated = false;
        entry = new EntryModel(x.id, EntryStatus.DELETED, "");
      } else {
        x.outdated = true;
        entry = new EntryModel(
          x.id,
          newEntries.size < keys.length - 30
            ? EntryStatus.HIDDEN
            : EntryStatus.LOADING,
          x.description ?? ""
        );
        this._descriptions.set(x.id, x.description ?? "");
      }

      assert(!!entry);
      if (x.description !== this._descriptions.get(x.id)) {
        entry = entry.setDescription(x.description ?? "");
        this._descriptions.set(x.id, x.description ?? "");
      }
      newEntries.set(x.id, entry);
    });

    const promises: Promise<void>[] = [];
    if (this._settings == undefined) promises.push(this._fetchSettings());

    keys.reverse().forEach((x) => {
      if (x.outdated && newEntries.get(x.id).data !== EntryStatus.HIDDEN) {
        promises.push(this._fetch(x.id));
      }
    });

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

  onUpdate = (entry: EntryModel, omitHistory = false): void => {
    if (!this._entries.has(entry.key)) return;

    const prevEntry = this._entries.get(entry.key);
    assert(!!prevEntry);

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

  _syncLoop = async (): Promise<void> => {
    if (this._disposed) return;
    await this.sync();
    setTimeout(this._syncLoop, 15000);
  };

  _addHistoryItem(newEntry: EntryModel): void {
    const oldEntry = this._entries.get(newEntry.key);
    if (oldEntry == undefined || !oldEntry.isDataLoaded()) {
      return;
    }

    this._history = this._history.slice(0, this._historyIndex);
    this._history.push({
      old: oldEntry,
      new: newEntry,
    });
    this._historyIndex = this._history.length;
  }

  async _sendEntryToBackend(entry: EntryModel): Promise<void> {
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

  async _fetchSettings(): Promise<void> {
    const serializedSettings = await this._backendMap.getSettings();

    if (serializedSettings == "") {
      this.onSettingsUpdate(new Settings(""));
      return;
    }

    if (this._serializedSettings === serializedSettings) return;
    this._serializedSettings = serializedSettings;
    this._settings = new Settings(serializedSettings);
    this._onEntriesChanged();
  }

  _fetch = async (key: string): Promise<void> => {
    const content = await this._backendMap.get(key);

    if (!this._entries.has(key)) {
      console.error("Entry for fetch doesn't exist anymore. " + key);
      return;
    }

    if (content === undefined) {
      console.error("Key " + key + " is missing");
      const entry = this._entries.get(key);
      if (entry != undefined && !entry.isDataLoaded()) {
        this._entries.delete(key);
        this._onEntriesChanged();
      }
      return;
    }

    try {
      if (content === "") {
        const entry = new EntryModel(key, EntryStatus.DELETED, "");
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

        const entry = new EntryModel(
          key,
          data,
          this._descriptions.get(key) ?? ""
        );

        this._addHistoryItem(entry);
        this._entries.set(key, entry);
      }
    } catch (e) {
      console.error(e.message + " " + key + " " + content);
      const entry = this._entries.get(key);
      if (entry != undefined && !entry.isDataLoaded()) {
        this._entries.delete(key);
        this._onEntriesChanged();
      }
      return;
    }

    this._onEntriesChanged();
  };

  _getFilteredEntriesArray(): EntryModel[] {
    return Array.from(this._entries.values())
      .reverse()
      .filter((x) => x.data !== EntryStatus.DELETED && x.key !== null);
  }

  _onEntriesChanged(): void {
    const entries = this._getFilteredEntriesArray();
    this._subscriptions.forEach((callback) => {
      callback(entries, this._settings, {
        canRedo: this._history.length > this._historyIndex,
        canUndo: this._history.length > 0 && this._historyIndex > 0,
      });
    });
  }
}
