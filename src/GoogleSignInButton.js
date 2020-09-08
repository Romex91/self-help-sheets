import React from "react";
import Icon from "./googleIcon";
import { GDriveStates } from "./GDriveAuthClient.js";
import Popper from "@material-ui/core/Popper";
import { Alert, AlertTitle } from "@material-ui/lab";

const ButtonContent = ({ children }) => (
  <span
    style={{
      padding: 10,
      paddingLeft: 0,
      fontWeight: 500,
    }}
  >
    {children}
  </span>
);

let buttonStyle = {
  backgroundColor: "#fff",
  display: "inline-flex",
  alignItems: "center",
  color: "rgba(0, 0, 0, .54)",
  boxShadow: "0 2px 2px 0 rgba(0, 0, 0, .24), 0 0 1px 0 rgba(0, 0, 0, .24)",
  padding: 0,
  borderRadius: 2,
  border: "1px solid transparent",
  fontSize: 14,
  fontWeight: "500",
  fontFamily: "Roboto, sans-serif",
  cursor: "pointer",
};

let disabledStyle = {
  opacity: 0.6,
};

export class GoogleSignInButton extends React.PureComponent {
  state = {
    authState: this.props.gdriveAuthClient.state,
    prevAuthState: this.props.gdriveAuthClient.LOADING,
    buttonAnchor: null,
  };

  componentDidMount() {
    if (this.state.authState !== this.props.gdriveAuthClient.state) {
      this.#setAuthState(this.props.gdriveAuthClient.state);
    }
    this.props.gdriveAuthClient.addStateListener(this.#setAuthState);
  }
  componentWillUnmount() {
    this.props.gdriveAuthClient.removeStateListener(this.#setAuthState);
  }

  #setAuthState = (authState) => {
    this.setState((prevState) => {
      return { ...prevState, prevAuthState: prevState.authState, authState };
    });
  };

  #setButtonAnchor = (buttonAnchor) => {
    this.setState((prevState) => {
      return { ...prevState, buttonAnchor };
    });
  };

  #getButtonStyle = () => {
    if (
      this.state.authState === GDriveStates.FAILED ||
      this.state.authState === GDriveStates.LOADING
    ) {
      return Object.assign({}, buttonStyle, disabledStyle);
    }

    return buttonStyle;
  };

  #onClick = async () => {
    if (this.state.authState === GDriveStates.SIGNED_IN) {
      this.props.gdriveAuthClient.signOut();
    } else if (this.state.authState === GDriveStates.SIGNED_OUT) {
      this.props.gdriveAuthClient.signIn();
    }
  };

  render() {
    let alertElement = (() => {
      if (this.state.authState === GDriveStates.FAILED) {
        return (
          <Alert severity="error">
            Failed connecting to google. Check your connection and try reloading
            the page.
          </Alert>
        );
      }

      if (this.state.authState === GDriveStates.SIGNED_OUT) {
        if (this.state.prevAuthState === GDriveStates.SIGNED_IN) {
          return (
            <Alert severity="warning">
              <AlertTitle>Privacy note!</AlertTitle>
              If other people have access to this browser <br />
              AND you don't want them to read your sheets: <br />
              <ol>
                <li>
                  sign out globally: <br />
                  <a href="https://accounts.google.com/Logout">
                    https://accounts.google.com/Logout
                  </a>
                </li>
                <li>delete Google account password from the browser</li>
              </ol>
            </Alert>
          );
        } else if (this.state.prevAuthState === GDriveStates.LOADING) {
          return (
            <Alert severity="info">
              This site stores data in a hidden Google Drive folder. <br />
              Sign in to proceed.
              <br />
            </Alert>
          );
        }
      }
    })();

    return (
      <button
        ref={(ref) => this.#setButtonAnchor(ref)}
        onClick={this.#onClick}
        style={this.#getButtonStyle()}
        type="button"
      >
        <Icon key={0} active={this.state.active} />
        <ButtonContent key={2}>
          {this.state.authState === GDriveStates.SIGNED_IN
            ? "Sign Out"
            : "Sign in with Google"}
        </ButtonContent>

        {!!alertElement && !!this.state.buttonAnchor && (
          <Popper
            key={1}
            style={{ zIndex: 1200 }}
            open={true}
            anchorEl={this.state.buttonAnchor}
            placement="bottom-end"
            disablePortal={false}
            modifiers={{
              flip: {
                enabled: false,
              },
              preventOverflow: {
                enabled: false,
              },
              hide: {
                enabled: false,
              },
              offset: {
                offset: "0,5",
              },
            }}
          >
            {alertElement}
          </Popper>
        )}
      </button>
    );
  }
}
