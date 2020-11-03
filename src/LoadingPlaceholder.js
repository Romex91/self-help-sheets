import React from "react";

import { CenteredTypography } from "./CenteredTypography";
import { CircularProgress } from "@material-ui/core";

export function LoadingPlaceholder(props) {
  return (
    <React.Fragment>
      <CenteredTypography>
        <CircularProgress {...props} />
      </CenteredTypography>
    </React.Fragment>
  );
}
