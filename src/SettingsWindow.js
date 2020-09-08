import React from "react";
import { makeStyles } from "@material-ui/core/styles";

let useStyles = makeStyles((theme) => ({
  root: {
    position: "absolute",
    top: "5%",
    left: "5%",
    width: "90%",
    height: "90%",
    backgroundColor: theme.palette.background.paper,
    zIndex: 1,
  },
}));

export const SettingsWindow = React.forwardRef((props, ref) => {
  let styles = useStyles();

  return (
    <article className={styles.root} {...props} ref={ref}>
      <h1>User Guide</h1>
    </article>
  );
});
