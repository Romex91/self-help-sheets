import React from "react";
import { Typography, makeStyles } from "@material-ui/core";

const useStyles = makeStyles({
  container: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
});
export function CenteredTypography(props) {
  const classes = useStyles();
  return (
    <div className={classes.container}>
      <Typography align="center" variant="h4" {...props}>
        {props.children}
      </Typography>
    </div>
  );
}
