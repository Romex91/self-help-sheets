import { EntryModel } from "./EntryModel";
import { Settings } from "./Settings";

export interface EntriesSubscription {
  (
    entries: EntryModel[],
    settings: Settings | undefined,
    historyInfo: { canRedo: boolean; canUndo: boolean }
  ): void;
}

export interface EntriesTableModel {
  subscribe(callback: EntriesSubscription): void;
  unsubscribe(callback: EntriesSubscription): void;

  onUpdate(entry: EntryModel, omitHistory: boolean): void;
  onSettingsUpdate(settings: Settings): void;
  addNewItem(): void;
  addNewItemThrottled(): void;
  undo(): void;
  redo(): void;
  sync(): void;
  dispose(): void;
}
