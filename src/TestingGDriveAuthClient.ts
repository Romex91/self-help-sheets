import { AuthStates, AuthClient } from "./AuthClient.js";
import sinon from "sinon";

export class TestingGDriveAuthClient extends AuthClient 
{
  public signIn = sinon.fake();
  public signOut = sinon.fake();
  public setStateFromTest =  (state:AuthStates): void => {
    this._state = state;
    this.notifyStateChanged();
  };
}
