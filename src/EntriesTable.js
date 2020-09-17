import React from "react";
import { Entry } from "./Entry.js";
import ColumnResizer from "column-resizer";
import _ from "lodash";

import { withStyles } from "@material-ui/core";
import { VirtualizedList } from "./VirtualizedList";

const styles = (theme) => ({
  container: {
    overflow: "auto",
    flex: 1,
    willChange: "transform",
  },
  grip: {
    width: 10,
    marginLeft: 5,
    position: "absolute",
    height: "100%",
    backgroundColor: "#0000",
    cursor: "col-resize",
  },
  entriesTable: {
    width: "100%",
    borderSpacing: 0,
    "& th": {
      backgroundColor: theme.palette.background.paper,
      zIndex: 1,
      top: 0,
      position: "sticky",
      borderSpacing: 0,
      borderBottom: "1px solid #000",
    },
    "& td": {
      padding: 2,
      verticalAlign: "top",
    },
    "& td:nth-child(even)": {
      borderLeft: "10px solid #0000",
    },
    "& h5": {
      display: "none",
    },

    [theme.breakpoints.down("xs")]: {
      "& thead": {
        display: "none",
      },

      "& h5": {
        display: "block",
        margin: 0,
      },

      "& tbody tr": {
        display: "grid",
        padding: 5,
        border: "1px solid #000",
      },

      "& td:nth-child(even)": {
        borderLeft: 0,
      },

      "& tbody td": {
        display: "block",
      },
    },
  },
});

function Placeholder({ height, ...rest }) {
  return (
    <tr {...rest}>
      <td colSpan="2">
        <div style={{ height }} />
      </td>
    </tr>
  );
}

class EntriesTableNoStyles extends React.PureComponent {
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
  #scrollableContainerRef = React.createRef();
  #columnResizer = null;
  #resizeObserver = null;

  #onLeftChanged = (entry, left) => {
    this.setState((prevState) => {
      return {
        ...prevState,
        entries: prevState.entries.map((x) => {
          if (x === entry) return { ...x, left };
          return x;
        }),
      };
    });
  };

  #onRightChanged = (entry, right) => {
    this.setState((prevState) => {
      return {
        ...prevState,
        entries: prevState.entries.map((x) => {
          if (x === entry) return { ...x, right };
          return x;
        }),
      };
    });
  };

  componentDidMount() {
    this.#columnResizer = new ColumnResizer(this.#tableRef.current, {
      liveDrag: true,
      minWidth: 100,
      gripInnerHtml: `<div class='${this.props.classes.grip}'></div>`,
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
    return (
      <div
        ref={this.#scrollableContainerRef}
        className={this.props.classes.container}
        tabIndex={0}
      >
        <table
          cellPadding={0}
          cellSpacing={0}
          className={this.props.classes.entriesTable}
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

          <tbody>
            <VirtualizedList
              entries={this.state.entries}
              ItemComponent={Entry}
              PlaceholderComponent={Placeholder}
              scrollableContainerRef={this.#scrollableContainerRef}
              // Additional props for Entry
              onLeftChanged={this.#onLeftChanged}
              onRightChanged={this.#onRightChanged}
            />
          </tbody>
        </table>
      </div>
    );
  }
}
export const EntriesTable = withStyles(styles)(EntriesTableNoStyles);
