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
  defaultHeight = 150,
  scrollableContainerRef,
  ItemComponent,
  PlaceholderComponent,
  ...restProps
}) {
  const [scrollY, setScrollY] = React.useState(0);
  const [windowHeight, setWindowHeight] = React.useState(window.innerHeight);

  const [realHeightsMap, setRealHeightsMap] = React.useState(new Map());
  // Beware of maintainig VirtualizedItem pureness during refactoring.
  // If one entry has changed it shouldn't lead to render() calls for other
  // entries.
  const onHeightChanged = React.useCallback((entry, height) => {
    setRealHeightsMap((oldMap) => {
      let newMap = new Map(oldMap);

      newMap.set(entry.key, height);
      return newMap;
    });
  }, []);

  const keys = new Set(entries.map((x) => x.key));
  const keysToDelete = [];
  realHeightsMap.forEach((_value, key) => {
    if (!keys.has(key)) {
      keysToDelete.push(key);
    }
  });
  if (keysToDelete.length > 0) {
    setRealHeightsMap((oldMap) => {
      let newMap = new Map(oldMap);
      keysToDelete.forEach((key) => {
        if (oldMap.has(key)) newMap.delete(key);
      });
      return newMap;
    });
  }

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
