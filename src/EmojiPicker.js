import React from "react";
import { Typography, makeStyles, SvgIcon } from "@material-ui/core";
import { Popup } from "./Popup";

const useStyles = makeStyles((theme) => ({
  container: {
    alignSelf: "flex-start",
    margin: 2,
    cursor: "pointer",
    borderColor: (focused) => (focused ? "gray" : "#0000"),
    border: "solid 2px",
    borderRadius: 4,
    position: "relative",
    backgroundColor: theme.palette.background.paper,
  },
  setupItem: {
    border: "2px solid",
    borderColor: (isActive) => (isActive ? "darkgray" : "#0000"),
    borderRadius: 4,
    fontSize: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  icon: {
    cursor: "pointer",
    width: 15,
    margin: 0,
    padding: "4px 1px",
    height: "30px",
    border: "1px solid #0000",

    borderColor: (isSelected) => (isSelected ? "gray" : "#0000"),
  },

  emoji: {
    userSelect: "none",
    fontWeight: (value) => (value === 3 ? "bold" : "unset"),
    opacity: (value) => (value === 3 ? 1 : value === 2 ? 0.7 : 0.3),
  },
}));

function EmojiItem({ emoji, text, ...props }) {
  const classes = useStyles(props.value);
  return (
    <span className={classes.emoji} role="img" aria-label={text} {...props}>
      {String.fromCodePoint(emoji)}
    </span>
  );
}

function RadioIcon({ selectedValue, value, ...props }) {
  const classes = useStyles(selectedValue === value);

  let height = 5 * (3 - value) + 1;
  return (
    <SvgIcon className={classes.icon} viewBox="1 1 7 15" {...props}>
      <rect
        y={height}
        width="9"
        height={16 - height}
        fill={value <= selectedValue ? "red" : "lightGray"}
      />
    </SvgIcon>
  );
}

function EmojiSetupItem({ value, isActive, ...props }) {
  const classes = useStyles(isActive);
  return (
    <div className={classes.setupItem}>
      <EmojiItem
        {...props}
        value={3}
        onClick={() => props.onChange((value + 1) % 4)}
      />
      <RadioIcon
        onClick={() => props.onChange(0)}
        selectedValue={value}
        value={0}
      />
      <RadioIcon
        onClick={() => props.onChange(1)}
        selectedValue={value}
        value={1}
      />
      <RadioIcon
        onClick={() => props.onChange(2)}
        selectedValue={value}
        value={2}
      />
      <RadioIcon
        onClick={() => props.onChange(3)}
        selectedValue={value}
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

  let onClick = (event) => {
    event.stopPropagation();
  };

  let onFocus = (event) => {
    props.onFocus(event);
    setFocus(true);
  };

  let onBlur = (event) => {
    if (!popupRef.current.contains(document.activeElement)) {
      setFocus(false);
      props.onBlur(event);
    }
  };

  let onKeyDown = (event) => {
    if (event.key === "ArrowLeft") {
      if (selectedRow < 0) setSelectedRow((selectedRow = 0));
      if (selectedRow < props.emojiArray.length) {
        let clone = [...props.emojiArray];
        clone[selectedRow].value--;
        if (clone[selectedRow].value < 0) {
          clone[selectedRow].value = 3;
        }
        props.onEmojiArrayChange(clone);
      }
    } else if (event.key === "ArrowRight") {
      if (selectedRow < 0) setSelectedRow((selectedRow = 0));
      if (selectedRow < props.emojiArray.length) {
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
    } else if (event.key === "Escape" || event.key === "Enter") {
      props.inputRef.current.focus();
    } else {
      return;
    }

    event.preventDefault();
  };

  if (props.emojiArray.length === 0) return null;

  let activeEmojiArray = props.emojiArray.filter((x) => x.value > 0);

  let rowCounter = 0;

  return (
    <React.Fragment>
      <div
        tabIndex={0}
        onClick={onClick}
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
          <Typography variant="caption" color="textSecondary">
            add mood
          </Typography>
        )}
        <Popup in={focused} ref={popupRef}>
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
        </Popup>{" "}
      </div>
    </React.Fragment>
  );
}
