// PUBLIC SECTION
export enum AuthStates {
  LOADING= "loading",
  SIGNED_IN= "signed_in",
  SIGNED_OUT= "signed_out",
  FAILED= "failed",
}

interface StateListener {
  (state: AuthStates) : void
}

export abstract class AuthClient {
  protected _state: AuthStates = AuthStates.LOADING;
  private _stateListeners: Set<StateListener> = new Set();

  public abstract signIn(): void;
  public abstract signOut(): void;



  public get state(): AuthStates {
    return this._state;
  }

  protected notifyStateChanged(): void {
    for (const listener of Array.from(this._stateListeners)) {
      listener(this._state);
    }
  }


  public addStateListener(listener:StateListener): void {
    console.assert(!this._stateListeners.has(listener));
    this._stateListeners.add(listener);
  }

  public removeStateListener(listener:StateListener): void {
    console.assert(this._stateListeners.has(listener));
    this._stateListeners.delete(listener);
  }

  public async waitForStateChange(): Promise<AuthStates> {
    return await new Promise((resolve) => {
      const listener = (state: AuthStates) => {
        this.removeStateListener(listener);
        resolve(state);
      };
      this.addStateListener(listener);
    });
  }

}
