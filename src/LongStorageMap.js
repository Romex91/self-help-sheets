import { Interface } from "./Interface.js";

export class LongStorageMap extends Interface {
  constructor() {
    super();
    this.requireFunction("createKey");
    this.requireFunction("delete", "key");
    this.requireFunction("set", "key", "contentString");
    this.requireFunction("get", "key");
    this.requireFunction("getAllKeys");
    this.requireFunction("getSettings");
    this.requireFunction("setSettings");
    this.requireFunction("setDescription");
  }
}
