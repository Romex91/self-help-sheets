import React from "react";
import { TextField } from "@material-ui/core";

export const Entry = React.forwardRef(
  ({ onUpdate, onRightChanged, entry, ...otherProps }, ref) => {
    return (
      <tr ref={ref}>
        <td key="issueElement">
          <h5>issue</h5>
          <TextField
            color="secondary"
            fullWidth
            multiline
            placeholder="What bothers you?"
            variant="outlined"
            onChange={(event) =>
              onUpdate({ ...entry, left: event.target.value })
            }
            value={entry.left}
            {...otherProps}
          />
        </td>

        <td key="resolutionElement">
          <h5>resolution</h5>
          <TextField
            color="primary"
            fullWidth
            multiline
            placeholder="What can you do to resolve the problem?"
            variant="outlined"
            onChange={(event) =>
              onUpdate({ ...entry, right: event.target.value })
            }
            value={entry.right}
            {...otherProps}
          />
        </td>
      </tr>
    );
  }
);
