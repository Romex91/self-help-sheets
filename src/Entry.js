import React from "react";
import Grid from "@material-ui/core/Grid";
import TextField from "@material-ui/core/TextField";
import Hidden from "@material-ui/core/Hidden";
import Divider from "@material-ui/core/Divider";

export class Entry extends React.PureComponent {
  #textFieldStyle = {
    backgroundColor: "lightblue",
  };

  #onLeftChanged = (event) => {
    this.props.onLeftChanged(this.props.entry.key, event.target.value);
  };
  #onRightChanged = (event) => {
    this.props.onRightChanged(this.props.entry.key, event.target.value);
  };

  render() {
    return [
      <Hidden key="divider" smUp>
        <Grid item xs={12}>
          <Divider style={{ height: 2 }} />
        </Grid>
      </Hidden>,
      <Grid
        key="left"
        item
        xs={12}
        sm={this.props.sliderPosition}
        style={{ padding: 10 }}
      >
        <TextField
          fullWidth
          style={{ backgroundColor: "lightyellow" }}
          multiline
          placeholder="What bothers you?"
          onChange={this.#onLeftChanged}
          value={this.props.entry.left}
        />
      </Grid>,
      <Grid
        key="right"
        item
        xs={12}
        sm={12 - this.props.sliderPosition}
        style={{ padding: 10 }}
      >
        <TextField
          fullWidth
          style={{ backgroundColor: "lightblue" }}
          multiline
          placeholder="What can you do to resolve the problem?"
          variant="outlined"
          onChange={this.#onRightChanged}
          value={this.props.entry.right}
        />
      </Grid>,
    ];
  }
}
