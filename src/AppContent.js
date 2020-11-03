import React, { Suspense } from "react";
import { gdriveAuthClient, GDriveStates } from "./GDriveAuthClient";
import { CenteredTypography } from "./CenteredTypography";
import { LoadingPlaceholder } from "./LoadingPlaceholder";
const EntriesTable = React.lazy(() => import("./EntriesTable"));

export function AppContent({ model, ...props }) {
  const [signInState, setSignInState] = React.useState(gdriveAuthClient.state);
  React.useEffect(() => {
    gdriveAuthClient.addStateListener(setSignInState);
  }, []);

  if (signInState === GDriveStates.SIGNED_OUT) {
    return <CenteredTypography>Sign in to proceed...</CenteredTypography>;
  } else if (signInState === GDriveStates.FAILED) {
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
        {model == null ? (
          <LoadingPlaceholder color="secondary" />
        ) : (
          <EntriesTable {...props} model={model} />
        )}
      </Suspense>
    );
  }
}
