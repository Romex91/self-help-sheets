import React from "react";
import { Button } from "@material-ui/core";
import { EntriesTable } from "./EntriesTable";
import { EntriesTableModel } from "./EntriesTableModel";
import { EntryModel } from "./Entry";
import { Settings } from "./Settings";

export class ExampleModel extends EntriesTableModel {
  subscribe(callback) {
    callback(
      [
        new EntryModel(0)
          .setLeft("")
          .setRight("")
          .setCreationTime(new Date(Date.now() - 900000000))
          .setEmojiLeft([])
          .setEmojiRight([]),
        new EntryModel(1)
          .setLeft("")
          .setRight("")
          .setCreationTime(new Date(Date.now() - 804000000))
          .setEmojiLeft([])
          .setEmojiRight([]),
        new EntryModel(2)
          .setLeft("")
          .setRight("")
          .setCreationTime(new Date(Date.now() - 800000000))
          .setEmojiLeft([])
          .setEmojiRight([]),
        new EntryModel(3)
          .setLeft("")
          .setRight("")
          .setCreationTime(new Date(Date.now() - 700000000))
          .setEmojiLeft([])
          .setEmojiRight([]),
        new EntryModel(4)
          .setLeft("")
          .setRight("")
          .setCreationTime(new Date(Date.now() - 600000000))
          .setEmojiLeft([])
          .setEmojiRight([]),
        new EntryModel(5)
          .setLeft("")
          .setRight("")
          .setCreationTime(new Date(Date.now() - 100000000))
          .setEmojiLeft([])
          .setEmojiRight([]),
      ],
      new Settings(),
      { canRedo: false, canUndo: false }
    );
  }
  unsubscribe() {}
  onUpdate() {}
  onSettingsUpdate() {}
  setIgnoreKeys() {}
  addNewItem() {}
  undo() {}
  redo() {}
  addNewItemThrottled() {}
  sync() {}
}

// let useStyles = makeStyles((theme) => ({}));

export const HelpWindow = React.forwardRef((props, ref) => {
  // let styles = useStyles();

  return (
    <article ref={ref}>
      <h1>User Guide</h1>
      <section>
        <h4>Privacy note</h4>
        <p>
          All user data is stored in a hidden folder in user's Google Drive
          account. The developers of this site will never have access to your
          data.
        </p>
      </section>

      <section>
        <h4>What is this site for? </h4>
        <p>
          This is a tool for altering your reaction to negative emotions. The
          main goal is to create a habit of questioning thoughts.
        </p>
        <aside>
          <p>
            This site is only a supplementary tool for cognitive behavioral
            therapy. It is no way a replacement for consulting with a therapist.
            Please, get help!
          </p>
          <p>
            To learn about cognitive behavioral therapy see{" "}
            <a href="https://feelinggood.com/">Feeling Good</a> by David Burns.
          </p>
        </aside>
      </section>

      <section>
        <h4> Why questioning thoughts helps? </h4>
        <p>
          A suffering mind tends to speak to itself coloring and distorting its
          view of the problem. Because the view is distorted such thoughts don't
          help feeling good, instead they fuel bad moods and become a problem
          themselves. The reaction to negative emotions become a source of
          negative emotions.
        </p>
        <p>
          There are several ways to break this vicious circle. Writing is one of
          them. Negative thoughts have power because they are subconscious. In
          other words they are crude and contain a lot of logical mistakes. In
          order to notice these mistakes you need a habit of questioning your
          thoughts. When you realize that a thought is wrong it looses its
          power.
        </p>
        <aside>
          <p>
            We learn a habit of non-constructive subconscious thinking very
            early in life. Changing old habits is a gradual process. This is why
            the first two ingredients of success are <b>persistence</b> and{" "}
            <b>optimism</b>.
          </p>
        </aside>
      </section>

      <section>
        <h4>How to use it?</h4>
        <p>
          When something bothers you open the site and click <b>ADD NEW ITEM</b>{" "}
          (<b>Ctrl+E</b>) and just start answering questions.
        </p>
        <p>
          If some of the questions doesn't fit you open{" "}
          <Button
            onClick={props.onOpenSettings}
            size="small"
            variant="contained"
            color="primary"
          >
            Settings
          </Button>{" "}
          and change them.
        </p>
        <aside>
          <h5>Tips</h5>
          <ul>
            <li>No hurry! It is best to take time thinking before writing.</li>
            <li>
              Don't force yourself to write "correct" and "proper" answers. Just
              write what you think.
            </li>
          </ul>
        </aside>

        <p>
          Below is a ficitonal example of a boy struggling with his fear of
          cats:
        </p>

        <div></div>
        <EntriesTable example model={new ExampleModel()}></EntriesTable>
      </section>

      <section>
        <h4> </h4>
        <p></p>
        <aside></aside>
      </section>
    </article>
  );
});
