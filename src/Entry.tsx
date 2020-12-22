import React from "react";
import {
  IconButton,
  InputBase,
  makeStyles,
  Typography,
  Collapse,
  Hidden,
  Theme,
} from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import DeleteIcon from "@material-ui/icons/Delete";
import moment from "moment";
import { MoodPicker } from "./MoodPicker";
import { Popup } from "./Popup";
import { EntryModel, EntryStatus, LastChange } from "./EntryModel";
import { Settings, EmojiItem, HintData } from "./Settings";

export type MoodItem = EmojiItem & {
  value: number;
};

interface StyleOptions {
  focused: boolean;
  hasCreationTime: boolean;
  hasMoods: boolean;
}

const paperStyle = (theme: Theme) => ({
  border: "solid",
  borderRadius: 4,
  backgroundColor: theme.palette.background.paper,
  padding: (options: StyleOptions) => (options.focused ? 4 : 5),
  borderWidth: (options: StyleOptions) => {
    return options.focused === true ? 2 : 1;
  },
  borderColor: (options: StyleOptions) => {
    return options.focused === true ? theme.palette.primary.light : "gray";
  },
});

const useStyles = makeStyles((theme) => ({
  inner: {
    display: "flex",
    flex: 1,

    flexDirection: "column",
    position: "relative",
    [theme.breakpoints.up("sm")]: paperStyle(theme),
  },
  input: {
    padding: "0px 7px",
    marginTop: (options: StyleOptions) => (options.hasCreationTime ? 0 : 19),
    minHeight: (options: StyleOptions) => (options.hasMoods ? 76 : 76 + 28),
    alignItems: "flex-start",
  },
  outer: {
    display: "flex",
    alignItems: "flex-start",
    flexDirection: "row",
    [theme.breakpoints.down("xs")]: paperStyle(theme),
  },
  date: {
    border: "0px !important",
    marginBottom: "0px !important",
    paddingBottom: "0px !important",
  },
  hint: {
    backgroundColor: theme.palette.background.paper,
    whiteSpace: "pre-line",
  },
}));

interface SubItemProps {
  onFocus(alreadyFocused: boolean): void;
  moodsText: string;
  moodsArray: MoodItem[];
  onDelete(): void;
  creationTime?: Date;
  onMoodsArrayChange(moodsArray: MoodItem[]): void;
  onCollapseExited?: (node: HTMLElement) => void;
  collapsed: boolean;
  example: boolean;
  deleteXsDown?: boolean;
  deleteSmUp?: boolean;
  autoFocus: boolean;
  hint?: HintData;
  value: string;
  onChange(event: { target: { value: string } }): void;
}

function SubItem(props: SubItemProps) {
  const [focused, setFocused] = React.useState(false);
  const [moodPickerFocused, setMoodPickerFocused] = React.useState(false);

  React.useEffect(() => {
    if (focused) {
      props.onFocus(true);
    }
  }, [focused, props.onFocus]);

  const classes = useStyles({
    hasCreationTime: props.creationTime != undefined,
    hasMoods: props.moodsArray.length > 0,
    focused: focused || moodPickerFocused,
  });
  const inputRef = React.useRef<HTMLInputElement>(null);

  const onFocus = () => {
    setFocused(true);
    props.onFocus(false);
  };

  const onBlur = () => {
    setFocused(false);
  };

  const onMoodPickerFocused = () => {
    props.onFocus(false);
    setMoodPickerFocused(true);
  };

  const onMoodPickerBlur = () => {
    setMoodPickerFocused(false);
  };

  React.useEffect(() => {
    if (!props.collapsed && props.autoFocus) {
      inputRef.current?.focus();
    }
  }, [props.collapsed, props.autoFocus]);

  return (
    <Collapse
      in={!props.collapsed}
      onExited={props.onCollapseExited}
      onEntered={() => {
        if (props.autoFocus) {
          inputRef.current?.focus();
        }
      }}
    >
      <div className={classes.outer}>
        <div
          className={classes.inner}
          onClick={() => {
            if (window.getSelection()?.toString().length === 0) {
              inputRef.current?.focus();
            }
          }}
        >
          {props.creationTime && (
            <Typography variant="caption" color="textSecondary" align="center">
              {moment(props.creationTime).format("h:mm a")}
            </Typography>
          )}

          <InputBase
            className={classes.input}
            fullWidth
            multiline
            placeholder={props.hint != undefined ? props.hint.text : ""}
            inputRef={inputRef}
            onFocus={onFocus}
            onBlur={onBlur}
            value={props.value}
            onChange={props.onChange}
          />
          <MoodPicker
            text={props.moodsText}
            onMoodArrayChange={props.onMoodsArrayChange}
            moodsArray={props.moodsArray}
            inputRef={inputRef}
            onFocus={onMoodPickerFocused}
            onBlur={onMoodPickerBlur}
          ></MoodPicker>
          {props.hint != null &&
            props.hint.isEnabled &&
            props.value.length > 0 && (
              <Popup in={focused}>
                <Typography className={classes.hint} color="textSecondary">
                  {props.hint?.text}
                </Typography>
              </Popup>
            )}
        </div>

        <Hidden xsDown={!props.deleteXsDown} smUp={!props.deleteSmUp}>
          <IconButton
            disabled={props.example}
            aria-label="delete"
            size="small"
            onClick={props.onDelete}
          >
            <DeleteIcon
              color={props.example ? "disabled" : "action"}
              fontSize="small"
            ></DeleteIcon>
          </IconButton>
        </Hidden>
      </div>
    </Collapse>
  );
}

export class DateEntry {
  key: string;
  text: string;
  focused = false;
  constructor(date: Date) {
    this.key = this.text = moment(date).calendar({
      sameDay: "[Today], MMM Do, ddd",
      lastDay: "[Yesterday] , MMM Do, ddd",
      lastWeek: "MMM Do YYYY, ddd",
      sameElse: "MMM Do YYYY, ddd",
    });
  }
}

interface EntryProps {
  onFocus?(): void;
  onUpdate(entry: EntryModel, omitHistory: boolean): void;
  entry: EntryModel | DateEntry;
  settings?: Settings;
  example: boolean;
}

export const Entry = React.forwardRef<HTMLTableRowElement, EntryProps>(
  (props, ref) => {
    const classes = useStyles({
      focused: false,
      hasCreationTime: false,
      hasMoods: false,
    });

    const initiallyCollapsed: boolean =
      !(props.entry instanceof EntryModel) || props.entry.initiallyCollapsed;
    const [collapsed, setCollapsed] = React.useState(initiallyCollapsed);
    React.useEffect(() => {
      if (initiallyCollapsed) {
        setCollapsed(false);
      }
    }, [initiallyCollapsed]);

    if (!(props.entry instanceof EntryModel)) {
      return (
        <tr ref={ref} className={classes.date}>
          <td colSpan={2}>
            <Collapse in={!collapsed}>
              <Typography variant="body2" align="center" color="textSecondary">
                {props.entry.text}
              </Typography>
            </Collapse>
          </td>
        </tr>
      );
    }

    const entryModel = props.entry as EntryModel;

    React.useEffect(() => {
      if (entryModel.initiallyCollapsed) {
        props.onUpdate(entryModel.setInitiallyCollapsed(false), true);
      }
    }, [entryModel, props.onUpdate]);

    React.useEffect(() => {
      if (entryModel.data === EntryStatus.HIDDEN)
        props.onUpdate(entryModel.show(), true);
    });

    const moodsLeft: MoodItem[] = [];
    const moodsRight: MoodItem[] = [];

    if (props.settings != null) {
      for (let i = 0; i < props.settings.emojiList.length; i++) {
        moodsLeft.push({
          value:
            entryModel.moodArrays[0][i] == null
              ? 0
              : entryModel.moodArrays[0][i],
          ...props.settings.emojiList[i],
        });
        moodsRight.push({
          value:
            entryModel.moodArrays[1][i] == null
              ? 0
              : entryModel.moodArrays[1][i],
          ...props.settings.emojiList[i],
        });
      }
    }

    const onEntryChanged = (updatedEntry: EntryModel) => {
      props.onUpdate(updatedEntry, false);
    };

    const onFocus = (alreadyFocused: boolean) => {
      if (entryModel.focused)
        props.onUpdate(entryModel.setFocused(false), true);
      if (!alreadyFocused && props.onFocus) props.onFocus();
    };

    return (
      <tr ref={ref}>
        <td key="issueElement">
          {entryModel.isDataLoaded() ? (
            <SubItem
              autoFocus={
                entryModel.focused &&
                entryModel.lastChange !== LastChange.EDIT_RIGHT
              }
              creationTime={entryModel.creationTime}
              value={entryModel.left}
              onChange={(event: { target: { value: string } }) =>
                onEntryChanged(entryModel.setLeft(event.target.value))
              }
              onFocus={onFocus}
              onDelete={() => {
                setCollapsed(true);
              }}
              deleteXsDown
              example={props.example}
              collapsed={collapsed}
              hint={props.settings?.leftHint}
              moodsText="How do you feel now?"
              moodsArray={moodsLeft}
              onMoodsArrayChange={(newLeftMoodArray: MoodItem[]) =>
                onEntryChanged(
                  entryModel.setMoodsLeft(newLeftMoodArray.map((x) => x.value))
                )
              }
            ></SubItem>
          ) : (
            <Skeleton variant="rect" height={135}></Skeleton>
          )}
        </td>

        <td key="resolutionElement">
          {entryModel.isDataLoaded() ? (
            <SubItem
              autoFocus={
                entryModel.focused &&
                entryModel.lastChange === LastChange.EDIT_RIGHT
              }
              value={entryModel.right}
              onChange={(event: { target: { value: string } }) =>
                onEntryChanged(entryModel.setRight(event.target.value))
              }
              onFocus={onFocus}
              deleteSmUp
              example={props.example}
              onDelete={() => {
                setCollapsed(true);
              }}
              collapsed={collapsed}
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              onCollapseExited={(_event: unknown) =>
                props.onUpdate(entryModel.delete(), false)
              }
              hint={props.settings?.rightHint}
              moodsText="How do you feel after writing resolution?"
              moodsArray={moodsRight}
              onMoodsArrayChange={(newRightMoodArray: MoodItem[]) =>
                onEntryChanged(
                  entryModel.setMoodsRight(
                    newRightMoodArray.map((x) => x.value)
                  )
                )
              }
            />
          ) : (
            <Skeleton variant="rect" height={135}></Skeleton>
          )}
        </td>
      </tr>
    );
  }
);
