import React from "react";
import { Typography, makeStyles, SvgIcon } from "@material-ui/core";
import { Popup } from "./Popup";
import { MoodItem } from "./Entry";

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

function EmojiIcon(
  props: MoodItem & {
    onClick?(): void;
  }
) {
  const classes = useStyles(props.value);
  return (
    <span
      onClick={props.onClick}
      className={classes.emoji}
      role="img"
      aria-label={props.text}
    >
      {String.fromCodePoint(props.codePoint)}
    </span>
  );
}

function RadioIcon(props: {
  onClick(): void;
  selectedValue: number;
  value: number;
}) {
  const classes = useStyles(props.selectedValue === props.value);

  const height = 5 * (3 - props.value) + 1;
  return (
    <SvgIcon
      className={classes.icon}
      viewBox="1 1 7 15"
      onClick={props.onClick}
    >
      <rect
        y={height}
        width="9"
        height={16 - height}
        fill={props.value <= props.selectedValue ? "red" : "lightGray"}
      />
    </SvgIcon>
  );
}

function MoodSetupItem(
  props: MoodItem & {
    onChange(value: number): void;
    isActive: boolean;
  }
) {
  const classes = useStyles(props.isActive);
  return (
    <div className={classes.setupItem}>
      <EmojiIcon
        value={3}
        codePoint={props.codePoint}
        text={props.text}
        onClick={() => props.onChange((props.value + 1) % 4)}
      />
      <RadioIcon
        onClick={() => props.onChange(0)}
        selectedValue={props.value}
        value={0}
      />
      <RadioIcon
        onClick={() => props.onChange(1)}
        selectedValue={props.value}
        value={1}
      />
      <RadioIcon
        onClick={() => props.onChange(2)}
        selectedValue={props.value}
        value={2}
      />
      <RadioIcon
        onClick={() => props.onChange(3)}
        selectedValue={props.value}
        value={3}
      />
    </div>
  );
}

export function MoodPicker(props: {
  moodsArray: MoodItem[];
  onMoodArrayChange(newArray: MoodItem[]): void;
  onFocus(): void;
  onBlur(): void;
  inputRef: React.RefObject<HTMLInputElement>;
  text: string;
}): JSX.Element | null {
  const [focused, setFocus] = React.useState(false);

  // eslint-disable-next-line prefer-const
  let [selectedRow, setSelectedRow] = React.useState(-1);

  const popupRef = React.useRef<HTMLDivElement>(null);
  const classes = useStyles(focused);

  const onClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  const onFocus = () => {
    props.onFocus();
    setFocus(true);
  };

  const onBlur = () => {
    if (
      popupRef.current &&
      !popupRef.current.contains(document.activeElement)
    ) {
      setFocus(false);
      props.onBlur();
    }
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowLeft") {
      if (selectedRow < 0) setSelectedRow((selectedRow = 0));
      if (selectedRow < props.moodsArray.length) {
        const clone = [...props.moodsArray];
        clone[selectedRow].value--;
        if (clone[selectedRow].value < 0) {
          clone[selectedRow].value = 3;
        }
        props.onMoodArrayChange(clone);
      }
    } else if (event.key === "ArrowRight") {
      if (selectedRow < 0) setSelectedRow((selectedRow = 0));
      if (selectedRow < props.moodsArray.length) {
        const clone = [...props.moodsArray];
        clone[selectedRow].value++;
        if (clone[selectedRow].value > 3) {
          clone[selectedRow].value = 0;
        }
        props.onMoodArrayChange(clone);
      }
    } else if (event.key === "ArrowDown") {
      selectedRow++;
      if (selectedRow >= props.moodsArray.length) {
        selectedRow = 0;
      }
      setSelectedRow(selectedRow);
    } else if (event.key === "ArrowUp") {
      selectedRow--;
      if (selectedRow < 0) {
        selectedRow = props.moodsArray.length - 1;
      }
      setSelectedRow(selectedRow);
    } else if (event.key === "Escape" || event.key === "Enter") {
      props.inputRef.current?.focus();
    } else {
      return;
    }

    event.preventDefault();
  };

  if (props.moodsArray.length === 0) return null;

  const activeEmojiArray = props.moodsArray.filter((x) => x.value > 0);

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
            <EmojiIcon
              key={x.codePoint}
              codePoint={x.codePoint}
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
          <React.Fragment>
            {props.moodsArray.map((x) => (
              <MoodSetupItem
                key={x.codePoint}
                isActive={rowCounter++ === selectedRow}
                codePoint={x.codePoint}
                text={x.text}
                value={x.value}
                onChange={(value) => {
                  props.onMoodArrayChange(
                    props.moodsArray.map((y) =>
                      y.codePoint === x.codePoint ? { ...y, value } : y
                    )
                  );
                }}
              />
            ))}
          </React.Fragment>
          <Typography align="center" variant="caption">
            Use arrow keys.
          </Typography>
        </Popup>{" "}
      </div>
    </React.Fragment>
  );
}
