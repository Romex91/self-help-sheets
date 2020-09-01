import React from "react";
import { Entry } from "./Entry.js";
import Grid from "@material-ui/core/Grid";
import Hidden from "@material-ui/core/Hidden";
import Slider from "@material-ui/core/Slider";
import { withStyles } from "@material-ui/core/styles";
import Divider from "@material-ui/core/Divider";
import Container from "@material-ui/core/Container";

import _ from "lodash";

const ColumnsWidthSlider = withStyles({
  root: {
    color: "#52af77",
    height: 8,
  },
  active: {},
  valueLabel: {
    left: "calc(-50% + 4px)",
  },
  track: {
    height: 8,
    borderRadius: 4,
  },
  rail: {
    height: 16,
    borderRadius: 4,
  },

  thumb: {
    height: 0,
    width: 0,
    marginLeft: "0",
  },

  mark: {
    height: 16,
    color: "black",
    width: 1,
  },
})(Slider);

function ThumbComponent(props) {
  return (
    <div {...props}>
      <div
        style={{
          height: "100vh",
          width: "20px",
          top: 0,
          backgroundColor: "#0000",
          cursor: "col-resize",
          position: "fixed",
        }}
      ></div>
      <Divider
        orientation="vertical"
        style={{
          margin: 10,
          padding: 0,
          width: 3,
          display: "block",
          cursor: "col-resize",

          top: 0,
          height: "100vh",
          position: "fixed",
        }}
      ></Divider>
    </div>
  );
}

export class EntriesTable extends React.PureComponent {
  state = {
    sliderPosition: 6,
    entries: [
      {
        key: "1",
        left:
          "Lorem ipsum dolo'r sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        right: "О сколько нам открытий чудных готовит просвещенья дух?",
      },
      //   {
      //     key: "2",
      //     left:
      //       "Lorem ipsum dolo'r sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      //     right: "О сколько нам открытий чудных готовит просвещенья дух?",
      //   },
      //   {
      //     key: "3",
      //     left:
      //       "Lorem ipsum dolo'r sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      //     right: "О сколько нам открытий чудных готовит просвещенья дух?",
      //   },
      //   {
      //     key: "4",
      //     left:
      //       "Lorem ipsum dolo'r sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      //     right: "О сколько нам открытий чудных готовит просвещенья дух?",
      //   },
      //   {
      //     key: "5",
      //     left:
      //       "Lorem ipsum dolo'r sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      //     right: "О сколько нам открытий чудных готовит просвещенья дух?",
      //   },
      //   {
      //     key: "6",
      //     left:
      //       "Lorem ipsum dolo'r sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      //     right: "О сколько нам открытий чудных готовит просвещенья дух?",
      //   },
      //   {
      //     key: "7",
      //     left:
      //       "Lorem ipsum dolo'r sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      //     right: "О сколько нам открытий чудных готовит просвещенья дух?",
      //   },
      //   {
      //     key: "8",
      //     left:
      //       "Lorem ipsum dolo'r sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      //     right: "О сколько нам открытий чудных готовит просвещенья дух?",
      //   },
      //   {
      //     key: "9",
      //     left:
      //       "Lorem ipsum dolo'r sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      //     right: "О сколько нам открытий чудных готовит просвещенья дух?",
      //   },
      //   {
      //     key: "10",
      //     left:
      //       "Lorem ipsum dolo'r sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      //     right: "О сколько нам открытий чудных готовит просвещенья дух?",
      //   },
      //   {
      //     key: "11",
      //     left:
      //       "Lorem ipsum dolo'r sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      //     right: "О сколько нам открытий чудных готовит просвещенья дух?",
      //   },
      //   {
      //     key: "12",
      //     left:
      //       "Lorem ipsum dolo'r sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      //     right: "О сколько нам открытий чудных готовит просвещенья дух?",
      //   },
    ],
  };

  #onSliderPosition = (sender, sliderPosition) => {
    if (this.state.sliderPosition !== sliderPosition) {
      this.setState({ ...this.state, sliderPosition });
    }
  };

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

  render() {
    return (
      <Container>
        <Grid container>
          <Hidden only="xs">
            <Grid
              item
              xs={12}
              height={0}
              style={{ left: 0, top: 0, position: "sticky", zIndex: 0 }}
            >
              <Slider
                ThumbComponent={ThumbComponent}
                track={false}
                value={this.state.sliderPosition}
                valueLabelDisplay="off"
                onChange={this.#onSliderPosition}
                step={null}
                marks={_.range(2, 11).map((value) => {
                  return {
                    value,
                  };
                })}
                min={0}
                max={12}
              />
            </Grid>
          </Hidden>
          {this.state.entries.map((entry) => (
            <Entry
              key={entry.key}
              entry={entry}
              onLeftChanged={this.#onLeftChanged}
              onRightChanged={this.#onRightChanged}
              sliderPosition={this.state.sliderPosition}
            />
          ))}
        </Grid>
      </Container>
    );
  }
}
