import React from "react";

import { CenteredTypography } from "./CenteredTypography";
import { CircularProgress } from "@material-ui/core";

export function LoadingPlaceholder(
  props: React.ComponentProps<typeof CircularProgress>
): JSX.Element {
  return (
    <React.Fragment>
      <CenteredTypography>
        <CircularProgress {...props} />
      </CenteredTypography>
    </React.Fragment>
  );
}
