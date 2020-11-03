import { Interface } from "./Interface.js";

export class EntriesTableModel extends Interface {
  constructor() {
    super();
    this.requireFunction("subscribe", "callback");
    this.requireFunction("unsubscribe", "callback");
    this.requireFunction("onUpdate", "entry", "omitHistory");
    this.requireFunction("onSettingsUpdate", "settings");

    this.requireFunction("addNewItem");
    this.requireFunction("addNewItemThrottled");

    this.requireFunction("undo");
    this.requireFunction("redo");

    this.requireFunction("sync");
  }
}
