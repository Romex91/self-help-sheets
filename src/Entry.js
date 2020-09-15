import React from "react";
import TextField from "@material-ui/core/TextField";

export class Entry extends React.PureComponent {
  #trRef = React.createRef();
  #resizerObserver = null;

  #onLeftChanged = (event) => {
    this.props.onLeftChanged(this.props.entry, event.target.value);
  };

  #onRightChanged = (event) => {
    this.props.onRightChanged(this.props.entry, event.target.value);
  };

  #onHeightChanged = () => {
    if (!this.#trRef.current) return;
    this.props.onHeightChanged(
      this.props.entry,
      this.#trRef.current.offsetHeight
    );
  };

  componentDidMount() {
    this.#resizerObserver = new ResizeObserver(this.#onHeightChanged);
    this.#resizerObserver.observe(this.#trRef.current);
  }

  componentWillUnmount() {
    this.#resizerObserver.unobserve(this.#trRef.current);
  }

  render() {
    const {
      onLeftChanged,
      onRightChanged,
      onHeightChanged,
      entry,
      ...rest
    } = this.props;
    return (
      <tr ref={this.#trRef}>
        <td key="issueElement">
          <h5>issue</h5>
          <TextField
            color="primary"
            fullWidth
            multiline
            placeholder="What bothers you?"
            variant="outlined"
            onChange={this.#onLeftChanged}
            value={this.props.entry.left}
            {...rest}
          />
        </td>

        <td key="resolutionElement">
          <h5>resolution</h5>
          <TextField
            color="secondary"
            fullWidth
            multiline
            placeholder="What can you do to resolve the problem?"
            variant="outlined"
            onChange={this.#onRightChanged}
            value={this.props.entry.right}
            {...rest}
          />
        </td>
      </tr>
    );
  }
}
