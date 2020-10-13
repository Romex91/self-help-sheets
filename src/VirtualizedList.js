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
    const { ItemComponent, onHeightChanged, ...otherProps } = this.props;

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

  const [realHeightsMap, setRealHeightsMap] = React.useState(new Map());
  const onHeightChanged = React.useCallback(
    (entry, height) => {
      let newMap = new Map();
      entries.forEach((x) => {
        if (x.key === entry.key) {
          newMap.set(x.key, height);
        } else if (realHeightsMap.has(x.key)) {
          newMap.set(x.key, realHeightsMap.get(x.key));
        } else {
          newMap.set(x.key, defaultHeight);
        }
      });
      setRealHeightsMap(newMap);
    },
    [realHeightsMap, entries, defaultHeight]
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

  let isFirstEntry = true;
  for (let entry of entries) {
    let entryHeight = defaultHeight;
    if (realHeightsMap.has(entry.key)) {
      entryHeight = realHeightsMap.get(entry.key);
    }

    if (currentHeight + entryHeight < scrollY - window.innerHeight) {
      placeholderTop += entryHeight;
    } else if (currentHeight < scrollY + 2 * windowHeight) {
      visibleEntries.push(
        <VirtualizedItem
          key={entry.key}
          isFirst={isFirstEntry}
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

    isFirstEntry = false;
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
