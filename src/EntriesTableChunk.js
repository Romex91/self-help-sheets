import React from "react";

export class EntriesTableChunk extends React.PureComponent {
  state = {
    isVisible: !!this.props.isInitiallyVisible,
    height: 60 * 30,
  };

  #containerRef = React.createRef();
  #intersectionObserver = new IntersectionObserver(
    (entries) => {
      if (this.state.isVisible !== entries[0].isIntersecting) {
        let height = this.state.isVisible
          ? this.#containerRef.current.clientHeight
          : this.state.height;

        this.setState({
          isVisible: entries[0].isIntersecting,
          height,
        });
      }
    },
    {
      threshold: [0, 0.25, 0.5, 0.75, 1],
      rootMargin: "200%",
    }
  );

  #onPlaceholderInteraction = () => {
    this.setState({ ...this.state, isVisible: true });
  };

  componentDidMount() {
    this.#intersectionObserver.observe(this.#containerRef.current);
  }
  componentWillUnmount() {
    this.#intersectionObserver.unobserve(this.#containerRef.current);
  }

  render() {
    return (
      <tbody ref={this.#containerRef}>
        {this.state.isVisible ? (
          this.props.children
        ) : (
          <tr>
            <td>
              <div
                className="placeholder"
                onMouseOver={this.#onPlaceholderInteraction}
                onClick={this.#onPlaceholderInteraction}
                style={{ height: this.state.height }}
              />
            </td>
            <td>
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
