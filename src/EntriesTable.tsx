import React from "react";
import { Entry, DateEntry } from "./Entry";
import ColumnResizer from "column-resizer";
import _ from "lodash";

import {
  withStyles,
  createStyles,
  WithStyles,
  Button,
  IconButton,
  Grid,
  Theme,
  Tooltip,
} from "@material-ui/core";

import { VirtualizedList } from "./VirtualizedList";

import KeyboardEventHandler from "react-keyboard-event-handler";
import { ArrowDropDown as ArrowIcon } from "@material-ui/icons";

import {
  EntriesTableModel,
  EntriesSubscriptionCallback,
} from "./EntriesTableModel";
import { EntryModel } from "./EntryModel";
import { Settings } from "./Settings";
import assert from "assert";

const styles = (theme: Theme) =>
  createStyles({
    scrollableContainer: {
      overflow: (props: { example: boolean }) =>
        props.example ? "hide" : "auto",
      flex: 1,
      willChange: "transform",
    },
    grip: {
      "&:hover": {
        backgroundColor: "#00F8",
        transitionDuration: "0s",
      },
      width: 8,
      zIndex: 10,
      position: "absolute",
      height: "100%",
      backgroundColor: "#0000",
      cursor: "col-resize",
      transitionProperty: "background-color",
      transitionDuration: "1s",
    },
    entriesTable: {
      width: "100%",
      borderSpacing: 0,
      "& td": {
        padding: 2,
        verticalAlign: "top",
        borderLeft: "5px solid #0000",
        // ColumnResizer sets it to "hidden". This cuts MoodPicker popups.
        overflow: "inherit !important",
      },
      "& td:nth-child(odd)": {
        borderRight: "5px solid #0000",
        borderLeft: "20px solid #0000",
      },

      [theme.breakpoints.down("xs")]: {
        "& thead": {
          display: "none",
        },

        "& tbody tr": {
          display: "grid",
          padding: 5,
          marginBottom: 5,
          borderRadius: 4,
          border: "1px solid",
          borderColor: theme.palette.text.secondary,
        },

        "& td:nth-child(odd)": {
          borderRight: 0,
          borderLeft: 0,
        },

        "& tbody td": {
          display: "block",
          borderLeft: 0,
        },
      },
    },

    buttonsContainer: {
      backgroundColor: theme.palette.background.paper,
      borderBottom: "1px solid lightGray",
    },

    buttons: {
      display: "flex",
      justifyContent: "center",
    },
  });

function Placeholder(props: { height: number }) {
  const { height, ...rest } = props;
  return (
    <tr {...rest}>
      <td colSpan={2}>
        <div style={{ height }} />
      </td>
    </tr>
  );
}

interface EntriesTableProps extends WithStyles<typeof styles> {
  example: boolean;
  model: EntriesTableModel;
  appBarShown?: boolean;
  onShowAppBar?(): void;
  onFocus?(): void;
}

interface EntriesTableState {
  entries: (EntryModel | DateEntry)[];
  settings?: Settings;
  canRedo: boolean;
  canUndo: boolean;
}

const EntriesTable = withStyles(styles)(
  class extends React.PureComponent<EntriesTableProps, EntriesTableState> {
    state: EntriesTableState = {
      entries: [],
      canRedo: false,
      canUndo: false,
    };

    private onEntriesChanged: EntriesSubscriptionCallback = (
      entries,
      settings,
      { canRedo, canUndo }
    ) => {
      const entriesWithDates: (EntryModel | DateEntry)[] = [...entries];
      if (entries.length > 0) {

        let dateToInsert = entries[entries.length - 1].creationTime;
        for (let i = entries.length - 2; i >= 0; i--) {
          const currentCreationTime = entries[i].creationTime;

          if (dateToInsert == null) {
            dateToInsert = currentCreationTime;
            continue;
          }

          if (
            !this.props.example &&
            (currentCreationTime == null ||
              currentCreationTime.getTime() < dateToInsert.getTime())
          ) {
            continue;
          }

          if (
            currentCreationTime != null &&
            currentCreationTime.getFullYear() === dateToInsert.getFullYear() &&
            currentCreationTime.getMonth() === dateToInsert.getMonth() &&
            currentCreationTime.getDay() === dateToInsert.getDay()
          ) {
            continue;
          }

          entriesWithDates.splice(i + 1, 0, new DateEntry(dateToInsert));
          dateToInsert = currentCreationTime;
        }

        if (dateToInsert != null) {
          entriesWithDates.splice(0, 0, new DateEntry(dateToInsert));
        }
      }

      this.setState({ entries: entriesWithDates, settings, canRedo, canUndo });
    };

    private scrollBy(top: number) {
      requestAnimationFrame(() => {
        if (this._scrollableContainerRef.current == null) return;
        const timeSinceLastScroll = Date.now() - this._lastScrollTime;
        this._lastScrollTime = Date.now();

        this._scrollableContainerRef.current.scrollBy({
          top,
          behavior: timeSinceLastScroll > 300 ? "smooth" : "auto",
        });
      });
    }

    private onKeyPress: (key: string, e: React.KeyboardEvent) => void = (
      key,
      e
    ) => {
      if (key === "ctrl+z" || key === "cmd+z") {
        this.props.model.undo();
        e.preventDefault();
      } else if (
        key === "ctrl+y" ||
        key === "cmd+y" ||
        key === "ctrl+shift+z" ||
        key === "cmd+shift+z"
      ) {
        this.props.model.redo();
        e.preventDefault();
      } else if (key === "ctrl+enter" || key === "cmd+enter") {
        this.props.model.addNewItemThrottled();
        e.preventDefault();
      } else {
        // When focused item goes out of |VirtualizedList| browsers reset active element to
        // |docuent.body| and keypresses "pageup/pagedown/up/down" stop scrolling
        // |scrollableContainer|.
        // The code below is a workaround for that.

        // Since |target| is focusable it is not |document.body|, hence this dirty workaround is
        // unnecessary.
        if ((e.target as HTMLElement).tabIndex === 0) return;

        if (key === "pageup") {
          this.scrollBy(-window.innerHeight * 0.8);
          e.preventDefault();
        } else if (key === "pagedown") {
          this.scrollBy(window.innerHeight * 0.8);
          e.preventDefault();
        } else if (key === "down") {
          this.scrollBy(100);
          e.preventDefault();
        } else if (key === "up") {
          this.scrollBy(-100);
          e.preventDefault();
        }
      }
    };

    private _tableRef = React.createRef<HTMLTableElement>();
    private _scrollableContainerRef = React.createRef<HTMLDivElement>();
    private _columnResizer?: ColumnResizer;
    private _resizeObserver?: ResizeObserver;
    private _lastScrollTime = Date.now();

    componentDidMount() {
      this.props.model.subscribe(this.onEntriesChanged);

      if (this.props.example) return;

      assert(this._tableRef.current);
      this._columnResizer = new ColumnResizer(this._tableRef.current, {
        liveDrag: true,
        minWidth: 100,
        gripInnerHtml: `<div class='${this.props.classes.grip}'></div>`,
        onResize: () => {
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
          this._columnResizer?.onResize();
        }, 200)
      );
      this._resizeObserver.observe(this._tableRef.current);
    }

    componentDidUpdate(prevProps: EntriesTableProps) {
      if (this.props.model !== prevProps.model) {
        prevProps.model.unsubscribe(this.onEntriesChanged);
        this.props.model.subscribe(this.onEntriesChanged);
      }
    }

    componentWillUnmount() {
      this.props.model.unsubscribe(this.onEntriesChanged);

      if (this.props.example) return;

      this._columnResizer?.destroy();
      if (this._tableRef.current)
        this._resizeObserver?.unobserve(this._tableRef.current);
    }

    private isMacintosh() {
      return navigator.platform.indexOf("Mac") > -1;
    }

    render() {
      return (
        <React.Fragment>
          <KeyboardEventHandler
            handleFocusableElements
            handleKeys={[
              "ctrl+z",
              "cmd+z",
              "ctrl+shift+z",
              "cmd+shift+z",
              "ctrl+y",
              "cmd+y",
              "ctrl+enter",
              "cmd+enter",
              "up",
              "down",
              "pagedown",
              "pageup",
            ]}
            onKeyEvent={this.onKeyPress}
          />
          {!this.props.example && (
            <Grid
              className={this.props.classes.buttonsContainer}
              container
              justify="space-between"
              spacing={0}
            >
              <Grid item xs={1} sm={2}>
                {!this.props.appBarShown && (
                  <IconButton size="small" onClick={this.props.onShowAppBar}>
                    <ArrowIcon color="primary" />
                  </IconButton>
                )}
              </Grid>
              <Grid className={this.props.classes.buttons} item xs={6} sm={3}>
                <Tooltip
                  title={this.isMacintosh() ? "Cmd + Enter" : "Ctrl + Enter"}
                >
                  <span>
                    <Button
                      size="small"
                      onClick={() => {
                        this.props.model.addNewItemThrottled();
                      }}
                    >
                      Add new item
                    </Button>
                  </span>
                </Tooltip>
              </Grid>
              <Grid className={this.props.classes.buttons} item xs={5} sm={2}>
                <Tooltip title={this.isMacintosh() ? "Cmd + Z" : "Ctrl + Z"}>
                  <span>
                    <Button
                      fullWidth
                      size="small"
                      onClick={this.props.model.undo}
                      disabled={!this.state.canUndo}
                    >
                      Undo
                    </Button>
                  </span>
                </Tooltip>
                <Tooltip
                  title={
                    this.isMacintosh() ? "Cmd + Shift + Z" : "Ctrl + Shift + Z"
                  }
                >
                  <span>
                    <Button
                      fullWidth
                      size="small"
                      disabled={!this.state.canRedo}
                      onClick={this.props.model.redo}
                    >
                      Redo
                    </Button>
                  </span>
                </Tooltip>
              </Grid>
            </Grid>
          )}

          <div
            ref={this._scrollableContainerRef}
            className={this.props.classes.scrollableContainer as string}
          >
            <table
              cellPadding={0}
              cellSpacing={0}
              className={this.props.classes.entriesTable}
              ref={this._tableRef}
            >
              {/* ColumnResizer doesn't work without thead */}
              <thead>
                <tr>
                  <th></th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                <VirtualizedList
                  entries={this.state.entries}
                  ItemComponent={Entry}
                  PlaceholderComponent={Placeholder}
                  scrollableContainerRef={this._scrollableContainerRef}
                  componentProps={{
                    onUpdate: this.props.model.onUpdate,
                    onFocus: this.props.onFocus,
                    settings: this.state.settings,
                    example: this.props.example,
                  }}
                  example={this.props.example}
                  defaultHeight={80}
                />
              </tbody>
            </table>
          </div>
        </React.Fragment>
      );
    }
  }
);

export default EntriesTable;
