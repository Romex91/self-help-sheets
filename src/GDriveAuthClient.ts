import isBot from "isbot";
import {AuthClient, AuthStates} from "./AuthClient"

export class GDriveAuthClient extends AuthClient {
  constructor() {
    super();
    if (isBot(window.navigator.userAgent)) {
      this._state = AuthStates.SIGNED_OUT;
      this.notifyStateChanged();
      return;
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
        this._state = AuthStates.FAILED;
        this.notifyStateChanged();
        return;
      }
    });
  }

  signIn(): void {
    console.assert(isGapiLoaded());
    if ((window as unknown as {mocha: unknown}).mocha != undefined) {
      window.gapi.auth2.getAuthInstance().signIn();
    } else {
      window.gapi.auth2.getAuthInstance().signIn({
        prompt: "select_account",
      });
    }
  }

  signOut(): void {
    console.assert(isGapiLoaded());
    const auth_instance = window.gapi.auth2.getAuthInstance();
    auth_instance.signOut();
  }

  private _updateSignInState(): void {
    console.assert(this._state !== AuthStates.FAILED);
    const current_state = isSignedIn()
      ? AuthStates.SIGNED_IN
      : AuthStates.SIGNED_OUT;
    if (this._state !== current_state) {
      this._state = current_state;
      this.notifyStateChanged();
    }
  }
}

export const gdriveAuthClient = new GDriveAuthClient();

// PRIVATE SECTION
function loadGapi(ondone: ()=>void) {
  console.assert(typeof ondone == "function");
  console.assert(ondone.length === 0);
  const script = document.createElement("script");
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
