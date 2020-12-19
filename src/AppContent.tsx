import React, { Suspense } from "react";
import { gdriveAuthClient } from "./GDriveAuthClient";
import { CenteredTypography } from "./CenteredTypography";
import { LoadingPlaceholder } from "./LoadingPlaceholder";
import { AuthStates } from "./AuthClient";
const EntriesTable = React.lazy(() => import("./EntriesTable"));

export function AppContent(props: {
  tableProps?: React.ComponentProps<typeof EntriesTable>;
}): JSX.Element {
  const [signInState, setSignInState] = React.useState(gdriveAuthClient.state);
  React.useEffect(() => {
    gdriveAuthClient.addStateListener(setSignInState);
  }, []);

  if (signInState === AuthStates.SIGNED_OUT) {
    return <CenteredTypography>Sign in to proceed...</CenteredTypography>;
  } else if (signInState === AuthStates.FAILED) {
    return (
      <CenteredTypography>
        S-meth#ng wen# wr00ng..^ Relo�� the page.
        <br />
        Check th�� networ� con#5.0%^&
        <br /> Ошибка модуля перевода текста. Переключаюсь на китайский.
        <br />禅
      </CenteredTypography>
    );
  } else {
    return (
      <Suspense fallback={<LoadingPlaceholder color="primary" />}>
        {props.tableProps == undefined ? (
          <LoadingPlaceholder color="secondary" />
        ) : (
          <EntriesTable {...props.tableProps} />
        )}
      </Suspense>
    );
  }
}
