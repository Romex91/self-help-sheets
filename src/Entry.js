import React from "react";
import Grid from "@material-ui/core/Grid";
import TextField from "@material-ui/core/TextField";

export class Entry extends React.PureComponent {
  #textFieldStyle = {
    backgroundColor: "lightblue",
  };

  render() {
    return (
      <Grid container spacing={3}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            style={this.#textFieldStyle}
            aria-label="What happened?"
            multiline
            placeholder="What happened?"
            variant="outlined"
          />{" "}
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            style={this.#textFieldStyle}
            aria-label="minimum height"
            multiline
            placeholder="Minimum 3 rows"
            variant="outlined"
          />
        </Grid>
      </Grid>
    );
  }
}
