import React from "react";
import { Entry } from "./Entry.js";
import { EntriesTableChunk } from "./EntriesTableChunk.js";
import Container from "@material-ui/core/Container";
import ColumnResizer from "column-resizer";

import _ from "lodash";

export class EntriesTable extends React.PureComponent {
  state = {
    entries: _.range(0, 1000).map((x) => {
      return {
        key: x,
        left:
          "Lorem ipsum dolo'r sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        right: x + ". О сколько нам открытий чудных готовит просвещенья дух?",
      };
    }),
  };

  #tableRef = React.createRef();
  #columnResizer = null;
  #resizeObserver = null;

  #onLeftChanged = (key, left) => {
    this.setState({
      ...this.state,
      entries: this.state.entries.map((x) => {
        if (x.key === key) return { ...x, left };
        return x;
      }),
    });
  };

  #onRightChanged = (key, right) => {
    this.setState({
      ...this.state,
      entries: this.state.entries.map((x) => {
        if (x.key === key) return { ...x, right };
        return x;
      }),
    });
  };

  componentDidMount() {
    this.#columnResizer = new ColumnResizer(this.#tableRef.current, {
      liveDrag: true,
      minWidth: 100,
      gripInnerHtml: "<div class='grip'></div>",
      draggingClass: "dragging",
      onResize: (e) => {
        // TextArea adjusts its height only when the browser window
        // resizes. It ignores resize of its parent.
        // This logic is encapsulated badly, you cannot change
        // it without modifying library sources.
        //
        // So, the esiest way of forcing TextArea height adjustment is
        // to dispatch a window resize event hoping that it
        // won't break anything.
        window.dispatchEvent(new Event("resize"));
      },
    });

    // this.#columnResizer doesn't observe resizes of the table.
    // It listens for browser window "resize" events instead.
    // This doesn't play well when table content asynchronously adjusts
    // its height listening for the same "resize" event.
    window.removeEventListener("resize", this.#columnResizer.onResize);
    this.#resizeObserver = new ResizeObserver(
      _.throttle(() => {
        this.#columnResizer.onResize();
      }, 200)
    );
    this.#resizeObserver.observe(this.#tableRef.current);
  }

  componentWillUnmount() {
    this.#columnResizer.destroy();
    this.#resizeObserver.unobserve(this.#tableRef.current);
  }

  render() {
    const chunkSize = 30;
    let chunks = [];
    for (let i = 0; i < this.state.entries.length; i += chunkSize) {
      chunks.push(this.state.entries.slice(i, i + chunkSize));
    }

    let chunkCounter = 0;

    return (
      <Container>
        <table className="entriesTable" ref={this.#tableRef}>
          <thead>
            <tr>
              <th>
                <div>issue</div>
              </th>
              <th>
                <div>resolution</div>
              </th>
            </tr>
          </thead>

          {chunks.map((chunk) => (
            <EntriesTableChunk key={chunkCounter++}>
              {chunk.map((entry) => (
                <Entry
                  key={entry.key}
                  entry={entry}
                  onLeftChanged={this.#onLeftChanged}
                  onRightChanged={this.#onRightChanged}
                />
              ))}
            </EntriesTableChunk>
          ))}
        </table>
      </Container>
    );
  }
}
