import React from "react";

export function VirtualizedList({
  entries,
  defaultHeight = 30,
  scrollableContainerRef,
  getEntryElement,
  getTopPlaceholderElement,
  getBottomPlaceholderElement,
}) {
  const [scrollY, setScrollY] = React.useState(0);
  const [windowHeight, setWindowHeight] = React.useState(window.innerHeight);

  // Not a true React state, but a hack allowing GC to eliminate memory leak.
  const [realHeights] = React.useState(new WeakMap());
  const onHeightChanged = React.useCallback(
    (entry, height) => {
      realHeights.set(entry, height);
    },
    [realHeights]
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
    if (realHeights.has(entry)) {
      entryHeight = realHeights.get(entry);
    }

    if (currentHeight < scrollY - window.innerHeight) {
      placeholderTop += entryHeight;
    } else if (currentHeight < scrollY + 2 * windowHeight) {
      visibleEntries.push(getEntryElement(entry, { onHeightChanged }));
    } else {
      placeholderBottom += entryHeight;
    }
    currentHeight += entryHeight;
  }
  if (placeholderTop !== 0) {
    visibleEntries.unshift(getTopPlaceholderElement(placeholderTop));
  }
  if (placeholderBottom !== 0) {
    visibleEntries.push(getBottomPlaceholderElement(placeholderBottom));
  }

  return visibleEntries;
}
