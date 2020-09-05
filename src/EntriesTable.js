import React from "react";
import { Entry } from "./Entry.js";
import Container from "@material-ui/core/Container";
import ColumnResizer from "column-resizer";

import _ from "lodash";

export class EntriesTable extends React.PureComponent {
  state = {
    scrollY: 0,
    windowHeight: window.innerHeight,
    entries: _.range(0, 1000).map((x) => {
      return {
        height: 30,
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
    this.setState((prevState) => {
      return {
        ...prevState,
        entries: prevState.entries.map((x) => {
          if (x.key === key) return { ...x, left };
          return x;
        }),
      };
    });
  };

  #onRightChanged = (key, right) => {
    this.setState((prevState) => {
      return {
        ...prevState,
        entries: prevState.entries.map((x) => {
          if (x.key === key) return { ...x, right };
          return x;
        }),
      };
    });
  };

  #onHeightChanged = (key, height) => {
    this.setState((prevState) => {
      return {
        ...prevState,
        entries: prevState.entries.map((x) => {
          if (x.key === key) return { ...x, height };
          return x;
        }),
      };
    });
  };

  #onResizeOrScroll = () => {
    this.setState((prevState) => {
      return {
        ...prevState,
        scrollY: window.scrollY,
        windowHeight: window.innerHeight,
      };
    });
  };

  componentDidMount() {
    window.addEventListener("resize", this.#onResizeOrScroll);
    window.addEventListener("scroll", this.#onResizeOrScroll);

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
    window.removeEventListener("resize", this.#onResizeOrScroll);
    window.removeEventListener("scroll", this.#onResizeOrScroll);

    this.#columnResizer.destroy();
    this.#resizeObserver.unobserve(this.#tableRef.current);
  }

  #generateVirtualizedEntries = () => {
    let entries = [];
    let currentHeight = 0;
    let placeholderTop = 0;
    let placeholderBottom = 0;

    for (let entry of this.state.entries) {
      if (currentHeight < this.state.scrollY - window.innerHeight) {
        placeholderTop += entry.height;
      } else if (
        currentHeight <
        this.state.scrollY + 2 * this.state.windowHeight
      ) {
        entries.push(
          <Entry
            key={entry.key}
            entry={entry}
            onLeftChanged={this.#onLeftChanged}
            onRightChanged={this.#onRightChanged}
            onHeightChanged={this.#onHeightChanged}
          />
        );
      } else {
        placeholderBottom += entry.height;
      }
      currentHeight += entry.height;
    }
    if (placeholderTop !== 0) {
      entries.unshift(
        <tr key="placeholderTop">
          <td colSpan="2">
            <div style={{ height: placeholderTop }} />
          </td>
        </tr>
      );
    }
    if (placeholderBottom !== 0) {
      entries.push(
        <tr key="placeholderBottom">
          <td colSpan="2">
            <div style={{ height: placeholderBottom }} />
          </td>
        </tr>
      );
    }

    return entries;
  };

  render() {
    return (
      <Container>
        <table
          cellPadding={0}
          cellSpacing={0}
          className="entriesTable"
          ref={this.#tableRef}
        >
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

          <tbody>{this.#generateVirtualizedEntries()}</tbody>
        </table>
      </Container>
    );
  }
}
