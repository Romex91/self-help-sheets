import { EntryModel } from "./EntryModel";
import { Settings } from "./Settings";

export interface EntriesSubscriptionCallback {
  (
    entries: EntryModel[],
    settings: Settings | undefined,
    historyInfo: { canRedo: boolean; canUndo: boolean }
  ): void;
}

export interface EntriesTableModel {
  subscribe(callback: EntriesSubscriptionCallback): void;
  unsubscribe(callback: EntriesSubscriptionCallback): void;

  onUpdate(entry: EntryModel, omitHistory: boolean): void;
  onSettingsUpdate(settings: Settings): void;
  addNewItem(): void;
  addNewItemThrottled(): void;
  undo(): void;
  redo(): void;
  sync(): void;
  dispose(): void;
}
