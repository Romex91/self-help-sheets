import { AuthStates, AuthClient } from "./AuthClient";

export class TestingGDriveAuthClient extends AuthClient {
  public signIn = (): void => {
    this._state = AuthStates.SIGNED_IN;
    this.notifyStateChanged();
  };
  public signOut = (): void => {
    this._state = AuthStates.SIGNED_OUT;
    this.notifyStateChanged();
  };
  public setStateFromTest = (state: AuthStates): void => {
    this._state = state;
    this.notifyStateChanged();
  };
}
