import React from "react";
import _ from "lodash";

export class EntriesTableChunk extends React.PureComponent {
  state = {
    isVisible: !!this.props.isInitiallyVisible,
    height: 60 * 30,
  };

  #containerRef = React.createRef();
  #onScroll = _.throttle(() => {
    let isVisible = true;
    let {
      top,
      bottom,
      height,
    } = this.#containerRef.current.getBoundingClientRect();
    if (top > 1.5 * window.innerHeight || bottom < -1.5 * window.innerHeight) {
      isVisible = false;
    }

    if (this.state.isVisible !== isVisible) {
      this.setState({
        isVisible,
        height,
      });
    }
  }, 200);

  #onPlaceholderInteraction = () => {
    this.setState({ ...this.state, isVisible: true });
  };

  componentDidMount() {
    this.#onScroll();
    window.addEventListener("scroll", this.#onScroll);
  }
  componentWillUnmount() {
    window.removeEventListener("scroll", this.#onScroll);
  }

  render() {
    return (
      <tbody ref={this.#containerRef}>
        {this.state.isVisible ? (
          this.props.children
        ) : (
          <tr>
            <td colSpan="2">
              <div
                className="placeholder"
                onMouseOver={this.#onPlaceholderInteraction}
                onClick={this.#onPlaceholderInteraction}
                style={{ height: this.state.height }}
              />
            </td>
          </tr>
        )}
      </tbody>
    );
  }
}
