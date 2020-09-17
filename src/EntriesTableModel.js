import { Interface } from "./Interface.js";
import _ from "lodash";

export class EntriesTableModel extends Interface {
  constructor() {
    super();
    this.requireFunction("subscribe", "callback");
    this.requireFunction("unsubscribe", "callback");
    this.requireFunction("onUpdate", "entry");
  }
}

export class EntriesTableModelImpl extends EntriesTableModel {
  #entries = _.range(0, 1000).map((x) => {
    return {
      key: x,
      left:
        "Lorem ipsum dolo'r sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      right: x + ". О сколько нам открытий чудных готовит просвещенья дух?",
    };
  });

  #subscriptions = new Set();

  subscribe(callback) {
    this.#subscriptions.add(callback);
    callback(this.#entries);
  }

  unsubscribe(callback) {
    this.#subscriptions.delete(callback);
  }

  onUpdate = (entry) => {
    this.#entries = this.#entries.map((x) => (x.key === entry.key ? entry : x));
    this.#subscriptions.forEach((callback) => {
      callback(this.#entries);
    });
  };
}
