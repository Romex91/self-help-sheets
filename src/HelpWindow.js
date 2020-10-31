import React from "react";
import { Button, makeStyles, Typography } from "@material-ui/core";
import { EntriesTable } from "./EntriesTable";
import { EntriesTableModel } from "./EntriesTableModel";
import { EntryModel } from "./Entry";
import { Settings } from "./Settings";

export class ExampleModel extends EntriesTableModel {
  subscribe(callback) {
    callback(
      [
        new EntryModel(0)
          .setLeft(
            "My Mom is going to gift a cat to my beloved and not-at-all-annoying sister Ann. It's a disaster. My life is going to turn into a living nightmare!"
          )
          .setRight(
            "I kept in secret the terrible dread I experience every time I see a cat,  but now I have to either come out or feel it daily.\n\n" +
              "It's not that bad.  I just need to overcome my shame of this fear and talk to Mom. I think I trust Mom about that. I'll calm down a little and talk to her."
          )
          .setCreationTime(new Date(Date.now() - 901000000))
          .setEmojiLeft([])
          .setEmojiRight([]),
        new EntryModel(1)
          .setLeft(
            "I talked to Mom. She didn't believe me. Adults disrespect kids. I hate her. And what should I do now? I'm pissed off and scared at the same time."
          )
          .setRight(
            "I need to leave home. Probably Gran won't mind if I live with her. If she minds I'll go homeless!\n\nIt is better to live on the street than in a house where nobody respects you.\n\n" +
              "10 minutes later: Okay, I think I overreacted. She wasn't disrespectful. " +
              "She didn't believe me because: \n 1) The situation is ridiculous \n 2) I am always at war with my dear sister. \n 3) I lied to Mom previously. \n\n" +
              "Good news: Gran doesn't mind me living with her. But actually, I am not that enthusiastic about leaving home.\n" +
              "I think it is time to start working with my fear. Closer the cat to me more practice I have. Maybe, the cat won't be that horrific.\n\n" +
              "If I fail I can flee to Gran's house anytime."
          )
          .setCreationTime(new Date(Date.now() - 900000000))
          .setEmojiLeft([])
          .setEmojiRight([]),
        new EntryModel(2)
          .setLeft(
            "Ann overheard my conversation with Mom and gossiped my fear of cats to my classmates.\n" +
              "They meow every time they see me. The crappiest part is their meowing scares me and I cannot hide it.\n" +
              "They say I am dumb. Maybe they are right."
          )
          .setRight(
            "I shouldn't believe that I am dumb.\n" +
              "I have good grades. It is not strong proof of high intelligence (dumb kids can have good grades if they apply themselves), but it is still a good sign. " +
              "Actually, I don't see any evidence that I am dumb besides their words. " +
              "My classmates are just kids they know no single thing about the world, why should I believe them? " +
              "Another thing is, I am smart enough to understand that there is no good way to measure intelligence. " +
              "I simply don't know whether I am smart or not.\n" +
              "A butterfly with damaged wings still can fly. " +
              "In the same way, even if I'm dumb I still can be happy. And I also can be a good person which is more important. \n\n" +
              "I should stop thinking about my intelligence and focus on something constructive. I have to utterly destroy my sister!"
          )
          .setCreationTime(new Date(Date.now() - 800000000))
          .setEmojiLeft([])
          .setEmojiRight([]),
        new EntryModel(3)
          .setLeft(
            "Writing this diary takes time. I could have more fun if I stop writing it."
          )
          .setRight(
            "You know what else takes time? Your repetitive negative thoughts!\n\nThe diary helps. For example, I stopped worrying about my intelligence the moment I wrote about it. " +
              "It doesn't waste my time, to the contrary, it helps me to avoid wasting my time thinking the same thought again and again. And I actually like the process of writing the diary. Why bother?"
          )
          .setCreationTime(new Date(Date.now()))
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

let useStyles = makeStyles((theme) => ({
  article: {
    "& h1, h4, h5": {
      textAlign: "center",
    },

    "& h4, h5": {
      textAlign: "center",
      marginBottom: 0,
    },

    "& ul": {
      paddingLeft: 20,
    },

    "& section": {
      border: "1px solid lightGray",
      borderRadius: 4,
      margin: "0px 0px 20px 0px",
      padding: "0px 10px",
      backgroundColor: theme.palette.background.paper,
    },

    "& aside": {
      border: "1px solid lightGray",
      borderRadius: 4,
      margin: "0px 0px 20px 0px",
      padding: "0px 10px",
      backgroundColor: theme.palette.background.aside,
    },
  },
  tableContainer: {
    "& h4": {
      textAlign: "center",
      marginBottom: 0,
    },

    margin: "0px 0px 20px 0px",
  },
}));

export const HelpWindow = React.forwardRef((props, ref) => {
  let classes = useStyles();

  return (
    <article className={classes.article} ref={ref}>
      <h1>User Guide</h1>
      <section>
        <h4>Privacy note</h4>
        <p>
          All user data is stored in a hidden folder in your Google Drive
          account. The developers of this site will never have access to your
          data.
        </p>
      </section>

      <section>
        <h4>What is this site for? </h4>
        <p>
          This is a tool for altering your reactions to negative emotions. The
          main goal is to create a habit of questioning your thoughts.
        </p>
        <aside>
          <p>
            This site is only a supplementary tool for cognitive behavioral
            therapy. It is in no way a replacement for consulting with a
            therapist. Please, get help!
          </p>
          <p>
            To learn about cognitive behavioral therapy see{" "}
            <a href="https://feelinggood.com/">Feeling Good</a> by David Burns.
          </p>
        </aside>
      </section>

      <section>
        <h4> Why questioning your thoughts helps? </h4>
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
      </section>

      <div className={classes.tableContainer}>
        <h4>A ficitonal example of a boy struggling with his fear of cats:</h4>

        <EntriesTable example model={new ExampleModel()}></EntriesTable>
      </div>

      <section>
        <h4>Disclaimer</h4>
        <p>
          THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
          EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
          MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
          IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
          CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
          TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
          SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
        </p>
      </section>

      <Button color="primary" onClick={props.onClose}>
        Close
      </Button>
    </article>
  );
});
