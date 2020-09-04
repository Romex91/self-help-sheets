import React from "react";
import TextField from "@material-ui/core/TextField";

export class Entry extends React.PureComponent {
  #onLeftChanged = (event) => {
    this.props.onLeftChanged(this.props.entry.key, event.target.value);
  };
  #onRightChanged = (event) => {
    this.props.onRightChanged(this.props.entry.key, event.target.value);
  };

  render() {
    return (
      <tr>
        <td key="issueElement">
          <h5>issue</h5>
          <TextField
            className="issueElement"
            fullWidth
            multiline
            placeholder="What bothers you?"
            variant="outlined"
            onChange={this.#onLeftChanged}
            value={this.props.entry.left}
          />
        </td>

        <td key="resolutionElement">
          <h5>resolution</h5>
          <TextField
            className="resolutionElement"
            fullWidth
            multiline
            placeholder="What can you do to resolve the problem?"
            variant="outlined"
            onChange={this.#onRightChanged}
            value={this.props.entry.right}
          />
        </td>
      </tr>
    );
  }
}
