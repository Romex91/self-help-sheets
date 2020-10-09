import React from "react";
import { Typography, Zoom, makeStyles, SvgIcon } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  container: {
    alignSelf: "center",
    margin: 2,
    cursor: "pointer",
    borderColor: (focused) => (focused ? "gray" : "#0000"),
    border: "solid 2px",
    borderRadius: 4,
    position: "relative",
  },
  popup: {
    position: "absolute",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    left: -17,
    top: "1.5em",
    zIndex: 2,
    background: theme.palette.background.paper,
    border: "gray solid 2px",
    borderRadius: 4,
  },

  setupItem: {
    border: "2px solid",
    borderColor: (isActive) => (isActive ? "darkgray" : "#0000"),
    borderRadius: 4,
    fontSize: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    cursor: "pointer",
    width: 15,
    margin: 0,
    padding: "4px 1px",
    height: "40px",
    border: "1px solid #0000",

    "&:hover": { borderColor: "lightgray" },
  },

  emoji: {
    opacity: (value) => (value === 3 ? 1 : value === 2 ? 0.7 : 0.3),
  },
}));

function EmojiItem(props) {
  const classes = useStyles(props.value);
  return (
    <span className={classes.emoji} role="img" aria-label={props.text}>
      {String.fromCodePoint(props.emoji)}
    </span>
  );
}

function RadioIcon({ checked, value, ...props }) {
  const classes = useStyles();

  let height = 5 * (3 - value) + 1;
  return (
    <SvgIcon className={classes.icon} viewBox="1 1 7 15" {...props}>
      <rect
        width="9"
        height={height}
        fill={checked ? "lightgreen" : "lightgray"}
      />
      <rect
        y={height}
        width="9"
        height={16 - height}
        fill={checked ? "red" : "gray"}
      />
    </SvgIcon>
  );
}

function EmojiSetupItem({ value, isActive, ...props }) {
  const classes = useStyles(isActive);
  return (
    <div className={classes.setupItem}>
      <EmojiItem {...props} value={3} />

      <RadioIcon
        onClick={() => props.onChange(0)}
        checked={value === 0}
        value={0}
      />
      <RadioIcon
        onClick={() => props.onChange(1)}
        checked={value === 1}
        value={1}
      />
      <RadioIcon
        onClick={() => props.onChange(2)}
        checked={value === 2}
        value={2}
      />
      <RadioIcon
        onClick={() => props.onChange(3)}
        checked={value === 3}
        value={3}
      />
    </div>
  );
}

export function EmojiPicker(props) {
  const [focused, setFocus] = React.useState(false);
  let [selectedRow, setSelectedRow] = React.useState(-1);

  const popupRef = React.useRef();
  const classes = useStyles(focused);

  let onFocus = () => {
    setFocus(true);
  };

  let onBlur = () => {
    if (!popupRef.current.contains(document.activeElement)) setFocus(false);
  };

  let onKeyDown = (event) => {
    if (event.key === "ArrowLeft") {
      if (selectedRow >= 0 && selectedRow < props.emojiArray.length) {
        let clone = [...props.emojiArray];
        clone[selectedRow].value--;
        if (clone[selectedRow].value < 0) {
          clone[selectedRow].value = 3;
        }
        props.onEmojiArrayChange(clone);
      }
    } else if (event.key === "ArrowRight") {
      if (selectedRow >= 0 && selectedRow < props.emojiArray.length) {
        let clone = [...props.emojiArray];
        clone[selectedRow].value++;
        if (clone[selectedRow].value > 3) {
          clone[selectedRow].value = 0;
        }
        props.onEmojiArrayChange(clone);
      }
    } else if (event.key === "ArrowDown") {
      selectedRow++;
      if (selectedRow >= props.emojiArray.length) {
        selectedRow = 0;
      }
      setSelectedRow(selectedRow);
    } else if (event.key === "ArrowUp") {
      selectedRow--;
      if (selectedRow < 0) {
        selectedRow = props.emojiArray.length - 1;
      }
      setSelectedRow(selectedRow);
    }
  };

  if (props.emojiArray.length === 0) return null;

  let activeEmojiArray = props.emojiArray.filter((x) => x.value > 0);

  let rowCounter = 0;

  return (
    <React.Fragment>
      <div
        tabIndex={0}
        onFocus={onFocus}
        onBlur={onBlur}
        className={classes.container}
        onKeyDown={onKeyDown}
      >
        {activeEmojiArray.length > 0 ? (
          activeEmojiArray.map((x) => (
            <EmojiItem
              key={x.codePoint}
              emoji={x.codePoint}
              text={x.text}
              value={x.value}
            />
          ))
        ) : (
          <Typography variant="caption">add mood</Typography>
        )}
        {focused && (
          <Zoom in={focused}>
            <div ref={popupRef} className={classes.popup}>
              <Typography align="center" variant="body1">
                {props.text}
              </Typography>

              {props.emojiArray.map((x) => (
                <EmojiSetupItem
                  key={x.codePoint}
                  isActive={rowCounter++ === selectedRow}
                  emoji={x.codePoint}
                  text={x.text}
                  value={x.value}
                  onChange={(value) => {
                    props.onEmojiArrayChange(
                      props.emojiArray.map((y) =>
                        y.codePoint === x.codePoint ? { ...y, value } : y
                      )
                    );
                  }}
                />
              ))}

              <Typography align="center" variant="caption">
                Use arrow keys.
              </Typography>
            </div>
          </Zoom>
        )}
      </div>
    </React.Fragment>
  );
}
