import { GDriveStates } from "./GDriveAuthClient.js";
import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { GoogleSignInButton } from "./GoogleSignInButton.js";

import { TestingGDriveAuthClient } from "./TestingGDriveAuthClient";

global.document.createRange = () => ({
  setStart: () => {},
  setEnd: () => {},
  commonAncestorContainer: {
    nodeName: "BODY",
    ownerDocument: document,
  },
});

test("button text represents changes in state.", () => {
  let gdriveAuthClient = new TestingGDriveAuthClient();
  const { getByText } = render(
    <GoogleSignInButton gdriveAuthClient={gdriveAuthClient} />
  );

  expect(gdriveAuthClient.listeners.size).toBe(1);

  // Initial text is "Sign in with google"
  let buttonElement = getByText(/Sign in with Google/i);
  expect(buttonElement).toBeInTheDocument();

  let expectButtonText = (state, text) => {
    gdriveAuthClient.setStateFromTest(state);
    expect(getByText(text)).toBe(buttonElement);
    expect(buttonElement).toBeInTheDocument();
  };

  expectButtonText(GDriveStates.SIGNED_OUT, /Sign in with Google/i);
  expectButtonText(GDriveStates.SIGNED_IN, /Sign out/i);
  expectButtonText(GDriveStates.SIGNED_OUT, /Sign in with Google/i);
  expectButtonText(GDriveStates.SIGNED_OUT, /Sign in with Google/i);
  expectButtonText(GDriveStates.SIGNED_IN, /Sign out/i);
  expectButtonText(GDriveStates.SIGNED_IN, /Sign out/i);
  expectButtonText(GDriveStates.SIGNED_IN, /Sign out/i);
  expectButtonText(GDriveStates.FAILED, /Sign in with Google/i);
});

test("button clicks lead to different function calls depending on state.", () => {
  let gdriveAuthClient = new TestingGDriveAuthClient();
  const { getByText } = render(
    <GoogleSignInButton gdriveAuthClient={gdriveAuthClient} />
  );

  let buttonElement = getByText(/Sign in with Google/i);
  expect(buttonElement).toBeInTheDocument();

  let expectClickToCall = ({ signIn = 0, signOut = 0 }) => {
    let signInCountBefore = gdriveAuthClient.signIn.callCount;
    let signOutCountBefore = gdriveAuthClient.signOut.callCount;

    fireEvent.click(buttonElement);

    let signInCountAfter = gdriveAuthClient.signIn.callCount;
    let signOutCountAfter = gdriveAuthClient.signOut.callCount;

    expect(signInCountAfter - signInCountBefore).toBe(signIn);
    expect(signOutCountAfter - signOutCountBefore).toBe(signOut);
  };

  // At first button persists but doesn't work
  expectClickToCall({ signIn: 0, signOut: 0 });
  expectClickToCall({ signIn: 0, signOut: 0 });
  expectClickToCall({ signIn: 0, signOut: 0 });

  // After loading is done the button becomes clickable and
  // clicks lead to signIn calls.
  gdriveAuthClient.setStateFromTest(GDriveStates.SIGNED_OUT);
  expectClickToCall({ signIn: 1, signOut: 0 });
  expectClickToCall({ signIn: 1, signOut: 0 });

  // When sign in is successfull clicks lead to signOut.
  gdriveAuthClient.setStateFromTest(GDriveStates.SIGNED_IN);
  expectClickToCall({ signIn: 0, signOut: 1 });
  expectClickToCall({ signIn: 0, signOut: 1 });
  expectClickToCall({ signIn: 0, signOut: 1 });

  // etc.
  gdriveAuthClient.setStateFromTest(GDriveStates.SIGNED_OUT);
  expectClickToCall({ signIn: 1, signOut: 0 });
  gdriveAuthClient.setStateFromTest(GDriveStates.SIGNED_IN);
  expectClickToCall({ signIn: 0, signOut: 1 });
});

test("poppers are ok", () => {
  let gdriveAuthClient = new TestingGDriveAuthClient();
  const { queryByText } = render(
    <GoogleSignInButton gdriveAuthClient={gdriveAuthClient} />
  );

  let alertOne = /This site stores data in a hidden Google Drive folder/i;
  let alertTwo = /sign out globally/i;
  let alertThree = /Failed/i;
  expect(queryByText(alertOne)).toBe(null);
  expect(queryByText(alertTwo)).toBe(null);
  expect(queryByText(alertThree)).toBe(null);

  gdriveAuthClient.setStateFromTest(GDriveStates.SIGNED_OUT);

  expect(queryByText(alertOne)).not.toBe(null);
  expect(queryByText(alertTwo)).toBe(null);
  expect(queryByText(alertThree)).toBe(null);

  gdriveAuthClient.setStateFromTest(GDriveStates.SIGNED_IN);

  expect(queryByText(alertOne)).toBe(null);
  expect(queryByText(alertTwo)).toBe(null);
  expect(queryByText(alertThree)).toBe(null);

  gdriveAuthClient.setStateFromTest(GDriveStates.SIGNED_OUT);

  expect(queryByText(alertOne)).toBe(null);
  expect(queryByText(alertTwo)).not.toBe(null);
  expect(queryByText(alertThree)).toBe(null);

  gdriveAuthClient.setStateFromTest(GDriveStates.SIGNED_IN);

  expect(queryByText(alertOne)).toBe(null);
  expect(queryByText(alertTwo)).toBe(null);
  expect(queryByText(alertThree)).toBe(null);

  gdriveAuthClient.setStateFromTest(GDriveStates.FAILED);

  expect(queryByText(alertOne)).toBe(null);
  expect(queryByText(alertTwo)).toBe(null);
  expect(queryByText(alertThree)).not.toBe(null);

  gdriveAuthClient.setStateFromTest(GDriveStates.SIGNED_OUT);
  expect(queryByText(alertOne)).toBe(null);
  expect(queryByText(alertTwo)).toBe(null);
  expect(queryByText(alertThree)).toBe(null);
});
