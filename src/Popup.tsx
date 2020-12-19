// Material ui popper is too slow buggy and overcomplicated.
// Do not expect much from this popup. It doesn't respect screen boundaries etc.

import React from "react";
import { Zoom, makeStyles } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  outer: {
    position: "relative",
  },
  popup: {
    position: "absolute",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    minWidth: 140,
    zIndex: 2,
    padding: 10,
    background: theme.palette.background.paper,
    border: "gray solid 2px",
    borderRadius: 4,
  },
}));

export const Popup = React.forwardRef<
  HTMLDivElement,
  { children: JSX.Element | JSX.Element[]; in: boolean }
>((props, ref) => {
  const classes = useStyles();
  if (!props.in) return null;
  return (
    <div ref={ref} className={classes.outer}>
      <Zoom in={props.in}>
        <div className={classes.popup}>{props.children}</div>
      </Zoom>
    </div>
  );
});
