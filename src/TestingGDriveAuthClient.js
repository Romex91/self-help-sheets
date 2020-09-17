import { GDriveStates } from "./GDriveAuthClient.js";
import sinon from "sinon";

export function TestingGDriveAuthClient() {
  this.listeners = new Set();
  this.state = GDriveStates.LOADING;

  this.addStateListener = sinon.spy((listener) => {
    this.listeners.add(listener);
  });

  this.removeStateListener = sinon.spy((listener) => {
    this.listeners.delete(listener);
  });

  this.signIn = sinon.fake();

  this.signOut = sinon.fake();

  this.setStateFromTest = (state) => {
    this.state = state;
    this.listeners.forEach((listener) => {
      listener(state);
    });
  };

  this.waitForStateChange = async () => {
    return await new Promise((resolve) => {
      let listener = (state) => {
        this.removeStateListener(listener);
        resolve(state);
      };
      this.addStateListener(listener);
    });
  };
}
