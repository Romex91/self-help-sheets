import React from "react";

class VirtualizedItem extends React.PureComponent {
  ref = React.createRef();

  #onHeightChanged = () => {
    if (!!this.ref.current) {
      this.props.onHeightChanged(
        this.props.entry,
        this.ref.current.offsetHeight
      );
    }
  };

  #resizeObserver = null;

  componentDidMount() {
    if (!!this.ref.current) {
      this.#onHeightChanged();
      this.#resizeObserver = new ResizeObserver(this.#onHeightChanged);
      this.#resizeObserver.observe(this.ref.current);
    }
  }

  componentWillUnmount() {
    if (
      this.ref.current.contains(document.activeElement) &&
      !!this.props.scrollableContainerRef.current
    ) {
      this.props.scrollableContainerRef.current.focus();
    }

    if (!!this.#resizeObserver) {
      this.#resizeObserver.disconnect();
      this.#resizeObserver = null;
    }
  }

  render() {
    const {
      scrollableContainerRef,
      ItemComponent,
      onHeightChanged,
      ...otherProps
    } = this.props;

    return <ItemComponent ref={this.ref} {...otherProps} />;
  }
}

export function VirtualizedList({
  entries,
  defaultHeight = 30,
  scrollableContainerRef,
  ItemComponent,
  PlaceholderComponent,
  ...restProps
}) {
  const [scrollY, setScrollY] = React.useState(0);
  const [windowHeight, setWindowHeight] = React.useState(window.innerHeight);

  // |realHeightsMap| asocciates each entry with a height obtained by
  // ResizeObserver.
  //
  // WARINING!!! THis is not a true React state, but a hack allowing GC to
  // eliminate memory leak when some entry is deleted.
  // You cannot clone WeakMap. That's why it's impossible to use it as
  // immutable React state.
  // The alternative is to use Map instead of WeakMap and sync it with |entries|.
  // But, I'd rather choose performance and simplicity over following React
  // guidlines here.
  const [realHeightsMap] = React.useState(new WeakMap());
  const onHeightChanged = React.useCallback(
    (entry, height) => {
      realHeightsMap.set(entry, height);
    },
    [realHeightsMap]
  );

  const onResizeOrScroll = () => {
    if (!!scrollableContainerRef.current)
      setScrollY(scrollableContainerRef.current.scrollTop);
    setWindowHeight(window.innerHeight);
  };

  React.useEffect(() => {
    if (!!scrollableContainerRef.current)
      scrollableContainerRef.current.onscroll = onResizeOrScroll;
    window.addEventListener("resize", onResizeOrScroll);
    return () => {
      window.removeEventListener("resize", onResizeOrScroll);
    };
  });

  let visibleEntries = [];
  let currentHeight = 0;
  let placeholderTop = 0;
  let placeholderBottom = 0;

  for (let entry of entries) {
    let entryHeight = defaultHeight;
    if (realHeightsMap.has(entry)) {
      entryHeight = realHeightsMap.get(entry);
    }

    if (currentHeight < scrollY - window.innerHeight) {
      placeholderTop += entryHeight;
    } else if (currentHeight < scrollY + 2 * windowHeight) {
      visibleEntries.push(
        <VirtualizedItem
          key={entry.key}
          onHeightChanged={onHeightChanged}
          entry={entry}
          ItemComponent={ItemComponent}
          scrollableContainerRef={scrollableContainerRef}
          {...restProps}
        />
      );
    } else {
      placeholderBottom += entryHeight;
    }
    currentHeight += entryHeight;
  }
  if (placeholderTop !== 0) {
    visibleEntries.unshift(
      <PlaceholderComponent height={placeholderTop} key="placeholderTop" />
    );
  }
  if (placeholderBottom !== 0) {
    visibleEntries.push(
      <PlaceholderComponent
        height={placeholderBottom}
        key="placeholderBottom"
      />
    );
  }

  return visibleEntries;
}
