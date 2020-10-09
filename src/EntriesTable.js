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
      zIndex: 3,
      top: 0,
      position: "sticky",
      borderSpacing: 0,
      borderBottom: "1px solid #000",
    },
    "& td": {
      padding: 2,
      verticalAlign: "top",
      // ColumnResizer sets it to "hidden". This cuts emoji popups.
      overflow: "inherit !important",
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

class EntriesTableRaw extends React.PureComponent {
  state = {
    entries: [],
    settings: {
      emojiList: [
        { codePoint: 0x1f44e, text: "discontent" },
        { codePoint: 0x1f628, text: "fear" },
        { codePoint: 0x1f622, text: "sadness" },
        { codePoint: 0x1f62d, text: "grief" },
        { codePoint: 0x1f631, text: "horror" },
        { codePoint: 0x1f616, text: "pain" },
        { codePoint: 0x1f621, text: "anger" },
        { codePoint: 0x1f922, text: "disgust" },
      ],
    },
  };

  _onEntriesChanged = (entries) => {
    this.setState({ entries });
  };

  _tableRef = React.createRef();
  _scrollableContainerRef = React.createRef();
  _columnResizer = null;
  _resizeObserver = null;

  componentDidMount() {
    this.props.model.subscribe(this._onEntriesChanged);

    this._columnResizer = new ColumnResizer(this._tableRef.current, {
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

    // this._columnResizer doesn't observe resizes of the table.
    // It listens for browser window "resize" events instead.
    // This doesn't play well when table content asynchronously adjusts
    // its height listening for the same "resize" event.
    window.removeEventListener("resize", this._columnResizer.onResize);
    this._resizeObserver = new ResizeObserver(
      _.throttle(() => {
        this._columnResizer.onResize();
      }, 200)
    );
    this._resizeObserver.observe(this._tableRef.current);
  }

  componentDidUpdate(prevProps) {
    if (this.props.model !== prevProps.model) {
      prevProps.model.unsubscribe(this._onEntriesChanged);
      this.props.model.subscribe(this._onEntriesChanged);
    }
  }

  componentWillUnmount() {
    this.props.model.unsubscribe(this._onEntriesChanged);

    this._columnResizer.destroy();
    this._resizeObserver.unobserve(this._tableRef.current);
  }

  render() {
    return (
      <div
        ref={this._scrollableContainerRef}
        className={this.props.classes.container}
        tabIndex={0}
      >
        <table
          cellPadding={0}
          cellSpacing={0}
          className={this.props.classes.entriesTable}
          ref={this._tableRef}
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
              scrollableContainerRef={this._scrollableContainerRef}
              // Additional props for Entry
              onUpdate={this.props.model.onUpdate}
              settings={this.state.settings}
            />
          </tbody>
        </table>
      </div>
    );
  }
}
export const EntriesTable = withStyles(styles)(EntriesTableRaw);
