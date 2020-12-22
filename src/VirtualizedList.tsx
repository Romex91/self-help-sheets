import React from "react";

interface VirtualizedItemProps<Entry, ComponentProps, RefType> {
  onHeightChanged(entry: Entry, heigh: number): void;
  entry: Entry;
  ItemComponent: React.ForwardRefExoticComponent<
    ComponentProps & { entry: Entry } & React.RefAttributes<RefType>
  >;
  componentProps: ComponentProps;
}

class VirtualizedItem<
  Entry,
  ComponentProps,
  RefType extends HTMLElement
> extends React.PureComponent<
  VirtualizedItemProps<Entry, ComponentProps, RefType>
> {
  private _ref = React.createRef<RefType>();
  _resizeObserver?: ResizeObserver;

  private onHeightChanged = () => {
    if (this._ref.current) {
      this.props.onHeightChanged(
        this.props.entry,
        this._ref.current.offsetHeight
      );
    }
  };

  componentDidMount() {
    if (this._ref.current) {
      this._resizeObserver = new ResizeObserver(this.onHeightChanged);
      this._resizeObserver.observe(this._ref.current);
    }
  }

  componentWillUnmount() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = undefined;
    }
  }

  render() {
    const { ItemComponent, componentProps, entry } = this.props;

    return <ItemComponent ref={this._ref} entry={entry} {...componentProps} />;
  }
}

interface VirtualizedListProps<Entry, ItemComponentProps, RefType> {
  entries: Entry[];
  defaultHeight: number;
  scrollableContainerRef: React.RefObject<HTMLDivElement>;
  ItemComponent: React.ForwardRefExoticComponent<
    ItemComponentProps & { entry: Entry } & React.RefAttributes<RefType>
  >;
  PlaceholderComponent: React.ComponentType<{ height: number }>;
  componentProps: ItemComponentProps;
  example: boolean;
}

export function VirtualizedList<
  Entry extends { key: string; focused: boolean },
  ItemComponentProps,
  RefType extends HTMLElement
>(
  props: VirtualizedListProps<Entry, ItemComponentProps, RefType>
): JSX.Element {
  const [scrollY, setScrollY] = React.useState(0);
  const [windowHeight, setWindowHeight] = React.useState(window.innerHeight);

  const [realHeightsMap, setRealHeightsMap] = React.useState(new Map());
  // Beware of maintainig VirtualizedItem pureness during refactoring.
  // If one entry has changed it shouldn't lead to render() calls for other
  // entries.

  const memoisedComponentProps = React.useMemo(
    () => ({ ...props.componentProps }),
    Object.values(props.componentProps)
  );

  const onHeightChanged = React.useCallback((entry, height) => {
    setRealHeightsMap((oldMap) => {
      const newMap = new Map(oldMap);

      newMap.set(entry.key, height);
      return newMap;
    });
  }, []);

  const keys = new Set(props.entries.map((x) => x.key));
  const keysToDelete: string[] = [];
  realHeightsMap.forEach((_value, key) => {
    if (!keys.has(key)) {
      keysToDelete.push(key);
    }
  });
  if (keysToDelete.length > 0) {
    setRealHeightsMap((oldMap) => {
      const newMap = new Map(oldMap);
      keysToDelete.forEach((key) => {
        if (oldMap.has(key)) newMap.delete(key);
      });
      return newMap;
    });
  }

  const onResizeOrScroll = () => {
    if (props.scrollableContainerRef.current)
      setScrollY(props.scrollableContainerRef.current.scrollTop);
    setWindowHeight(window.innerHeight);
  };

  React.useEffect(() => {
    if (props.scrollableContainerRef.current)
      props.scrollableContainerRef.current.onscroll = onResizeOrScroll;
    window.addEventListener("resize", onResizeOrScroll);
    return () => {
      window.removeEventListener("resize", onResizeOrScroll);
    };
  });

  const visibleEntries: JSX.Element[] = [];
  let currentHeight = 0;
  let placeholderTop = 0;
  let placeholderBottom = 0;

  for (const entry of props.entries) {
    let entryHeight = props.defaultHeight;
    if (realHeightsMap.has(entry.key)) {
      entryHeight = realHeightsMap.get(entry.key);
    }

    if (
      !props.example &&
      currentHeight + entryHeight < scrollY - window.innerHeight
    ) {
      if (entry.focused && !!props.scrollableContainerRef.current) {
        props.scrollableContainerRef.current.scrollTop = currentHeight;
      }

      placeholderTop += entryHeight;
    } else if (!!props.example || currentHeight < scrollY + 2 * windowHeight) {
      visibleEntries.push(
        <VirtualizedItem
          key={entry.key}
          onHeightChanged={onHeightChanged}
          entry={entry}
          ItemComponent={props.ItemComponent}
          componentProps={memoisedComponentProps}
        />
      );
    } else {
      if (entry.focused && props.scrollableContainerRef.current) {
        props.scrollableContainerRef.current.scrollTop = currentHeight;
      }

      placeholderBottom += entryHeight;
    }
    currentHeight += entryHeight;
  }
  if (placeholderTop !== 0) {
    visibleEntries.unshift(
      <props.PlaceholderComponent
        height={placeholderTop}
        key="placeholderTop"
      />
    );
  }

  if (placeholderBottom !== 0) {
    visibleEntries.push(
      <props.PlaceholderComponent
        height={placeholderBottom}
        key="placeholderBottom"
      />
    );
  }

  return <React.Fragment>{visibleEntries}</React.Fragment>;
}
