// PUBLIC SECTION
export const GDriveStates = {
  LOADING: "loading",
  SIGNED_IN: "signed_in",
  SIGNED_OUT: "signed_out",
  FAILED: "failed",
};
Object.freeze(GDriveStates);

class GDriveAuthClient {
  #state = GDriveStates.LOADING;
  #stateListeners = new Set();

  get state() {
    return this.#state;
  }

  addStateListener(listener) {
    console.assert(typeof listener == "function");
    console.assert(listener.length === 1);
    console.assert(!this.#stateListeners.has(listener));

    this.#stateListeners.add(listener);
  }

  removeStateListener(listener) {
    console.assert(typeof listener == "function");
    console.assert(listener.length === 1);
    console.assert(this.#stateListeners.has(listener));
    this.#stateListeners.delete(listener);
  }

  async waitForStateChange() {
    return await new Promise((resolve) => {
      let listener = (state) => {
        this.removeStateListener(listener);
        resolve(state);
      };
      this.addStateListener(listener);
    });
  }

  constructor() {
    loadGapi(async () => {
      try {
        if (!window.gapi) {
          throw new Error("Failed loading GAPI");
        }

        await new Promise((resolve) =>
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
        this.#state = GDriveStates.FAILED;
        this._notifyStateChanged();
        return;
      }
    });
  }

  signIn() {
    console.assert(isGapiLoaded());
    window.gapi.auth2.getAuthInstance().signIn();
  }

  signOut() {
    console.assert(isGapiLoaded());
    let auth_instance = window.gapi.auth2.getAuthInstance();
    auth_instance.signOut();
  }

  _notifyStateChanged() {
    for (let listener of this.#stateListeners) {
      listener(this.#state);
    }
  }

  _updateSignInState() {
    console.assert(this.#state !== GDriveStates.FAILED);
    let current_state = isSignedIn()
      ? GDriveStates.SIGNED_IN
      : GDriveStates.SIGNED_OUT;
    if (this.#state !== current_state) {
      this.#state = current_state;
      this._notifyStateChanged();
    }
  }
}

export const gdriveAuthClient = new GDriveAuthClient();
Object.seal(gdriveAuthClient);

// PRIVATE SECTION
function loadGapi(ondone) {
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
