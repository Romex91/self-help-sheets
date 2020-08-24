import React from "react";
import { Entry } from "./Entry.js";

export class EntriesTable extends React.PureComponent {
  state = {
    entries: [
      {
        key: "1",
        left:
          "Lorem ipsum dolo'r sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        right: "О сколько нам открытий чудных готовит просвещенья дух?",
      },
      {
        key: "2",
        left:
          "Lorem ipsum dolo'r sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        right: "О сколько нам открытий чудных готовит просвещенья дух?",
      },
    ],
  };

  render() {
    return this.state.entries.map((entry) => (
      <Entry key={entry.key} left={entry.left} right={entry.right} />
    ));
  }
}
