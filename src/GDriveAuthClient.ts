import isBot from "isbot";

// PUBLIC SECTION
export enum GDriveStates {
  LOADING= "loading",
  SIGNED_IN= "signed_in",
  SIGNED_OUT= "signed_out",
  FAILED= "failed",
};

interface StateListener {
  (state: GDriveStates) : void
}

export class GDriveAuthClient {
  _state: GDriveStates = GDriveStates.LOADING;
  _stateListeners: Set<StateListener> = new Set();

  get state() {
    return this._state;
  }

  addStateListener(listener:StateListener) {
    console.assert(!this._stateListeners.has(listener));
    this._stateListeners.add(listener);
  }

  removeStateListener(listener:StateListener) {
    console.assert(this._stateListeners.has(listener));
    this._stateListeners.delete(listener);
  }

  async waitForStateChange() {
    return await new Promise((resolve) => {
      const listener = (state: GDriveStates) => {
        this.removeStateListener(listener);
        resolve(state);
      };
      this.addStateListener(listener);
    });
  }

  constructor() {
    if (isBot(window.navigator.userAgent)) {
      this._state = GDriveStates.SIGNED_OUT;
      this._notifyStateChanged();
    }

    loadGapi(async () => {
      try {
        if (!window.gapi) {
          throw new Error("Failed loading GAPI");
        }

        await new Promise<void>((resolve) =>
          window.gapi.load("client:auth2", resolve)
        );

        await window.gapi.client.init({
          clientId:
            "479709565206-4ek8a502261s9sussiehpa5v146ns2ku.apps.googleusercontent.com",
          discoveryDocs: [
            "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
          ],
          scope: "https://www.googleapis.com/auth/drive.appfolder",
        });

        if (!isGapiLoaded()) {
          throw new Error("Failed registering client_id.");
        }

        this._updateSignInState();

        window.gapi.auth2
          .getAuthInstance()
          .isSignedIn.listen(this._updateSignInState.bind(this));
      } catch (error) {
        console.log(error);
        this._state = GDriveStates.FAILED;
        this._notifyStateChanged();
        return;
      }
    });
  }

  signIn() {
    console.assert(isGapiLoaded());
    if ((window as unknown as {mocha: unknown}).mocha != undefined) {
      window.gapi.auth2.getAuthInstance().signIn();
    } else {
      window.gapi.auth2.getAuthInstance().signIn({
        prompt: "select_account",
      });
    }
  }

  signOut() {
    console.assert(isGapiLoaded());
    let auth_instance = window.gapi.auth2.getAuthInstance();
    auth_instance.signOut();
  }

  _notifyStateChanged() {
    for (let listener of Array.from(this._stateListeners)) {
      listener(this._state);
    }
  }

  _updateSignInState() {
    console.assert(this._state !== GDriveStates.FAILED);
    let current_state = isSignedIn()
      ? GDriveStates.SIGNED_IN
      : GDriveStates.SIGNED_OUT;
    if (this._state !== current_state) {
      this._state = current_state;
      this._notifyStateChanged();
    }
  }
}

export const gdriveAuthClient = new GDriveAuthClient();

// PRIVATE SECTION
function loadGapi(ondone: ()=>void) {
  console.assert(typeof ondone == "function");
  console.assert(ondone.length === 0);
  var script = document.createElement("script");
  script.async = true;
  script.src = "https://apis.google.com/js/api.js";
  document.body.appendChild(script);
  script.onload = ondone;
  script.onerror = ondone;
}

function isGapiLoaded() {
  return window.gapi && window.gapi.auth2 && window.gapi.client;
}

function isSignedIn() {
  console.assert(isGapiLoaded());
  return window.gapi.auth2.getAuthInstance().isSignedIn.get();
}
