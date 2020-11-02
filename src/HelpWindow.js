import React from "react";
import { Button, makeStyles } from "@material-ui/core";
import { EntriesTable } from "./EntriesTable";
import { EntriesTableModel } from "./EntriesTableModel";
import { EntryModel } from "./Entry";
import { Settings } from "./Settings";
import classnames from "classnames";

export class ExampleModel extends EntriesTableModel {
  subscribe(callback) {
    callback(
      [
        new EntryModel(0)
          .setLeft(
            "Mom is going to gift a cat to my beloved and not-at-all-annoying sister Ann. It's a disaster. My life is going to turn into a living nightmare!"
          )
          .setRight(
            "I kept in secret the terrible dread I experience every time I see a cat,  but now I have to either come out or feel it daily.\n\n" +
              "It's not that bad.  I just need to overcome my shame of this fear and talk to Mom. I think I trust Mom about that. I'll calm down a little and talk to her."
          )
          .setCreationTime(new Date(Date.now() - 901000000))
          .setEmojiLeft([3, 0, 0, 0, 3])
          .setEmojiRight([1, 0, 0, 0, 2]),
        new EntryModel(1)
          .setLeft(
            "I talked to Mom. She didn't believe me. Adults never repsect kids. I hate her for that! And what should I do now? I'm pissed off and scared at the same time."
          )
          .setRight(
            "I need to leave home. Probably Gran won't mind if I live with her. If she minds I'll go homeless!\n\nIt is better to live on the street than in a house where nobody respects you.\n\n" +
              "10 minutes later: Okay, I think I overreacted. She wasn't disrespectful. " +
              "She didn't believe me because: \n 1) The situation is ridiculously hard to believe \n 2) I am always at war with my dear sister \n 3) I lied to Mom previously. \n\n" +
              "Good news: Gran doesn't mind me living with her. But actually, I am not that enthusiastic about leaving home.\n" +
              "I think it is time to start working with my fear. The closer the cat, the more practice I have. Maybe, the cat won't be that horrific.\n\n" +
              "If I fail I can flee to Gran's house anytime."
          )
          .setCreationTime(new Date(Date.now() - 900000000))
          .setEmojiLeft([3, 0, 0, 0, 3, 0, 3])
          .setEmojiRight([1, 0, 0, 0, 2, 0, 0, 0]),
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
          .setEmojiLeft([0, 3, 0, 3])
          .setEmojiRight([0, 0, 0, 0, 0, 0, 3]),
        new EntryModel(3)
          .setLeft(
            "Writing this diary takes time. I could have more fun if I stop writing it."
          )
          .setRight(
            "You know what else takes time? Your repetitive negative thoughts!\n\nThe diary helps. For example, I stopped worrying about my intelligence the moment I wrote about it. " +
              "It doesn't waste my time, to the contrary, it helps me to avoid wasting my time thinking the same thought again and again. And I actually like the process of writing the diary. Why bother?"
          )
          .setCreationTime(new Date(Date.now() - 1000000))
          .setEmojiLeft([1])
          .setEmojiRight([]),
        new EntryModel(3)
          .setLeft(
            "I worry I'll give up the diary because it is less entertaining than videogames or netflix. "
          )
          .setRight(
            "I think this is a valid concern. " +
              "I appreciate the effects this diary produces but they are not that addictive.\n\n" +
              "It is the same as tooth brushing, I need to form a habit.\n\n" +
              "Dad says that to form a habit I should avoid beating myself " +
              "up and praise myself each time I do well. I think I'll try that approach. \n\n" +
              "Why not starting right now? I am actually proud of how constructive I am. " +
              " It is great that I write the diary regularly. Yes, I procrastinate sometimes, but this is not a problem! The main thing is sometimes I DON'T procrastinate. Great job!"
          )
          .setCreationTime(new Date(Date.now()))
          .setEmojiLeft([0, 2])
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
    display: "grid",
    gridTemplateColumns:
      "[first-line] repeat(auto-fill, minmax(300px, 1fr)) [last-line]",
    gridGap: "1rem",
    gridAutoFlow: "dense",

    "& h1, h4, h5": {
      textAlign: "center",
    },

    "& h4, h5": {
      marginTop: 0,
      marginBottom: 5,
    },

    "& ul": {
      paddingLeft: 20,
      marginTop: 0,
    },

    "& section": {
      "& p": {
        marginTop: 0,
      },
      "& aside": {
        border: "1px solid lightGray",
        borderRadius: 4,
        margin: "0px 0px 20px 0px",
        padding: "10px 10px 0px 10px",
        backgroundColor: theme.palette.background.aside,
      },

      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      border: "1px solid lightGray",
      borderRadius: 4,
      padding: "10px 10px 0px 10px",
      backgroundColor: theme.palette.background.paper,
    },
  },

  stretched: {
    gridColumn: "first-line / last-line",
  },

  large: {
    gridRow: "span 2",
  },

  tableContainer: {
    background: "#0000 !important",
    "& h4": {
      textAlign: "center",
      marginBottom: 0,
    },

    paddingBottom: "1em !important",
  },
}));

export const HelpWindow = React.forwardRef((props, ref) => {
  let classes = useStyles();

  return (
    <article className={classes.article} ref={ref}>
      <h1 className={classes.stretched}>User Guide</h1>
      <section>
        <h4>Privacy note</h4>
        <p>
          All your data will be stored in a hidden folder in your Google Drive
          account. The developers of this site will never have access to a
          single word you leave here.
        </p>
      </section>

      <section className={classes.large}>
        <h4>What is this site? </h4>
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

      <section className={classes.large}>
        <h4> Why does questioning help? </h4>
        <p>
          A suffering mind tends to speak to itself coloring its view of the
          world negatively. Such thoughts don't help feeling good, instead they
          defense bad moods. Reactions to negative emotions become negative
          emotions themselves. When unhappy we talk to ourselves every reason
          why we are unhappy and this talking produces more unhappiness. Writing
          is one of the ways of breaking this vicious circle.
        </p>
        <p>
          Negative thoughts are subconscious, they are crude and contain a lot
          of logical mistakes. By questioning our thoughts we are able to notice
          such mistakes. When a negative thought appears wrong we gain a choice
          to think constructively a possibility to help ourselves.
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
          If some of the questions don't fit you open{" "}
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
          <ul>
            <label>
              <h5>Tips</h5>
            </label>
            <li>No hurry! It is best to take time thinking before writing.</li>
            <li>
              Don't force yourself to write "correct" and "proper" answers. Just
              write what you think.
            </li>
          </ul>
        </aside>
      </section>

      <section
        className={classnames({
          [classes.tableContainer]: true,
          [classes.stretched]: true,
        })}
      >
        <h4>A fictional example of a boy struggling with his fear of cats:</h4>

        <EntriesTable example model={new ExampleModel()}></EntriesTable>
      </section>

      <section className={classes.stretched}>
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

      <div className={classes.stretched}>
        <Button color="primary" onClick={props.onClose}>
          Close
        </Button>
      </div>
    </article>
  );
});
