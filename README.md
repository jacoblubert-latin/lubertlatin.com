# Jacob Lubert Latin Tutoring — website

The site for **lubertlatin.com**. Plain HTML, CSS, and a few lines of JavaScript. No framework, no build step, no server. Hosted on Netlify.

- **Live site:** https://lubertlatin.com
- **Booking link used everywhere:** https://cal.com/jacob-lubert-latin
- **Deployment and domain setup:** see [DEPLOY.md](DEPLOY.md)

## What's in here

```
site/                 ← everything Netlify publishes
  index.html          ← the home page (all the text lives here)
  free-sheet.html     ← "thank you" page after the PDF signup (has the download link)
  thank-you.html      ← "thank you" page after the contact form
  404.html            ← page-not-found
  practice/index.html          ← game 1: the parsing drill (lubertlatin.com/practice/)
  practice/decline/index.html  ← game 2: decline a noun, alone or with an adjective (typed)
  practice/synopsis/index.html ← game 3: verb synopsis (typed)
  practice/vocab/index.html    ← game 4: vocabulary meanings
  practice/data/textbooks.json ← the textbooks the start screen offers
  practice/data/henle/         ← one folder per textbook (see "The practice games"): Henle First Year
    curriculum.json            ← name, lesson count, and which forms each lesson teaches
    items.json                 ← parsing-drill sentences and answers
    vocab.json                 ← dictionary entries for the typed games
  practice/data/henle2/        ← Henle Second Year: the same three files
  practice/data/henle3/        ← Henle Third Year: the same three files
  css/styles.css      ← colors, fonts, layout
  css/practice.css    ← styles for the practice games only
  css/fonts.css       ← self-hosted font files (don't edit)
  js/main.js          ← mobile menu, footer year, FAQ search markup
  js/practice.js      ← the shared game shell (start screen, lesson filter, scoring, review)
  js/latin-forms.js   ← the rules engine that declines nouns and adjectives and conjugates verbs
  js/practice-link.js ← settings in a link: reads and writes the query string (see "Links for assignments")
  js/games/*.js       ← one file per game: parse.js, decline.js, synopsis.js, vocab.js
  assets/             ← images, fonts, and the PDF
  robots.txt, sitemap.xml
netlify.toml          ← Netlify settings
tools/                ← sources for the PDF and images, plus the data checker and paradigm tools
```

## Editing text and pricing (no coding needed)

Open `site/index.html` in any text editor (Notepad works; VS Code is nicer). Everything on the page is plain text between tags. Change the words, save, and push (see "Publishing a change" below). Nothing else is required.

Look for comments that start with `✏️` — they mark the spots people edit most.

### Prices

Find the `<!-- ✏️ EDIT PRICING -->` comment. Each price is on one line:

```html
<p class="price"><span class="from">from</span> $100 <span class="per">/ hour</span></p>
```

Change `$100` to the new number. Same for `$35`. To change "Ask for dates" on the intensives card, edit that text where it appears.

### FAQ

Find the `<!-- ✏️ EDIT FAQ -->` comment. Each question looks like this:

```html
<details>
  <summary>How does scheduling work?</summary>      ← the question
  <div class="answer">
    <p>You choose a time on my online calendar...</p>   ← the answer
  </div>
</details>
```

Copy a whole `<details>...</details>` block to add a question; delete one to remove it. The search-engine FAQ markup updates itself.

### About paragraph, headline, cards

Just edit the words. Keep the tags (`<p>`, `<h2>`, etc.) around them.

### Special characters

Use `&amp;` for an ampersand in text (e.g. `AP Latin &amp; NLE`). Curly quotes and the en dash (–) can be typed directly.

### Your photo

To change it, replace `site/assets/jacob-lubert.jpg` with a new file of the same name (portrait orientation, about 1000×1250 px; under 200 KB is ideal — [squoosh.app](https://squoosh.app) can shrink it). If the new photo has a different shape, update the `width` and `height` numbers on the `<img>` next to the `<!-- ✏️ PHOTO -->` comment in `index.html` to match.

### Testimonials

The "What families say" section (between **Pricing** and **About**) holds one quote in a `<blockquote>` with the names in `<cite>`. To add another, copy the whole `<figure class="hero-quote testimonial-quote">...</figure>` block (marked with a `✏️ TESTIMONIALS` comment) and paste it below the first.

### Colors and fonts

Open `site/css/styles.css`. The first block (`:root`) holds the colors. Change `--accent` to recolor every button and heading accent.

## The practice games (/practice)

Four games share one shell (`site/js/practice.js`): the start screen with its lesson filter, scoring, streak, the end-of-round review, printed worksheets, and the footer. Each game is a small file in `site/js/games/` that only says what its start-screen options are, which items are in the pool, how an item is shown and graded, and how a missed item is reviewed. Everything is static: the browser reads JSON from `site/practice/data/<textbook>/` and keeps nothing anywhere else (the last settings and the missed list are remembered in the student's own browser only). A game's settings can also be sent as a link: see "Links for assignments" below.

| Page | Game | Data |
|---|---|---|
| `/practice/` | **Parsing drill** – noun or verb, then parse it with chips | `items.json` |
| `/practice/decline/` | **Decline a noun** – type the whole table, or one form; or a noun with an adjective | `vocab.json` |
| `/practice/synopsis/` | **Verb synopsis** – type a Henle-style synopsis, or one form | `vocab.json` |
| `/practice/vocab/` | **Vocabulary** – the meaning of a word: Latin → English by multiple choice, English → Latin typed | `vocab.json` |

### The lesson filter: through Lesson N, or Lesson N only

Every start screen has the lesson slider, which means "through Lesson N": everything the book has taught by that lesson. The **vocabulary game** also has a two-way choice under it: **Through Lesson N** (the default) and **Lesson N only** (just the words Lesson N introduced). With "only" a round asks every word of the lesson once, however many there are, not ten.

Both are the shell's: the slider is `ctx.settings.lesson`, the choice is `ctx.settings.lessonOnly`, and both are saved with the game's other settings under its own storage key. Settings saved before the choice existed have no `lessonOnly` and mean "through".

**Which games show the choice.** A game shows it by setting `lessonOnlyChoice: true` on the object it registers; only `vocab.js` does. In the other three games `lessonOnly` is always false, whatever is stored. They do have the "only" rule written (described below), so adding that one line to `parse.js`, `decline.js` or `synopsis.js` turns the choice on there.

**What belongs to a lesson.** A piece of material belongs to the lesson at which it *first opens*: the later of the word's own lesson and the lesson its grammar is taught. That covers both kinds of lesson. A vocabulary lesson brings its new words (Lesson 3 only: the nouns of Lesson 3). A grammar lesson brings new forms of words already met (Lesson 17 only: the present, imperfect and future passive of the first-conjugation verbs, though the verbs are from earlier lessons). A word that arrives after its grammar brings everything already taught for it (*appellō*, a Lesson 17 word, has its active tenses in Lesson 17 only as well).

"Through" and "only" read the same number; one takes what opens at N or before, the other what opens at N exactly. The number comes from one place per kind of material, in `site/js/latin-forms.js`:

| Material | First opens at | Function |
|---|---|---|
| Parsing sentence | its `available` lesson for the textbook, else its `lesson` | `lessonOf` |
| Vocabulary word | the word's `lesson` | `lessonOf` |
| Noun (its table) | the later of the noun's lesson and its declension's | `nounOpenLesson` |
| Noun's vocative | the later of that and the vocative's lesson | `nounCellOpenLesson`, `vocativeLesson` |
| Adjective | the later of the adjective's lesson and its type's | `adjectiveOpenLesson` |
| Synopsis cell | the later of the verb's lesson and the lesson that tense, voice and mood (or imperative, infinitive, participle) is taught for that verb | `verbCellOpenLesson` |

A game asks the shell `shell.inLesson(l)` with one of these numbers; the shell answers for whichever choice is on. What "Lesson N only" gives in each game (only Vocabulary offers it now):

- **Parsing drill:** the sentences first usable in Lesson N.
- **Decline a noun:** the nouns that open in Lesson N, as full tables or single forms. In the lesson that teaches the vocative (Henle 27) the vocatives of the earlier nouns are that lesson's new material: they are asked one form at a time, in either mode and whether or not "Include vocative" is on, alongside the nouns new in that lesson, and the note under the slider says so.
- **Noun + adjective:** the pairs that open in Lesson N, a pair opening at the later of its two words. So a new adjective is paired with every earlier noun (Lesson 7 only: *magnus* and the other first adjectives, with the nouns of Lessons 1–7) and a new noun with every open adjective. In the vocative's lesson the earlier pairs are asked for their vocative, one form at a time.
- **Verb synopsis:** the cells that open in Lesson N. The full synopsis shows only the rows and columns that are new for that verb, single-form mode draws only from those cells, and a verb is in the pool if it has at least one. "Include subjunctive" and the other Rows boxes are struck through when the lesson has nothing of that kind.
- **Vocabulary:** the words whose lesson is N, all of them in one round, shuffled. The wrong options in multiple choice, and the "either word" answers, still come from every word through Lesson N. (In English → Latin two words asked by the same gloss are asked once, so a round can be a word or two shorter than the count.)

The note under the slider counts what is in play. When "only" leaves nothing it says so and names the nearest lessons that have something, with the other settings as they are ("Nothing new for this game in Lesson 11. Try Lesson 10 or 12."), and Start is off. A round is never filled out from other lessons. A round from the missed list ignores the choice, as it ignores the slider.

### Links for assignments

A teacher can post a link that opens a game with its settings already chosen:

```
https://lubertlatin.com/practice/decline/?lesson=5&mode=single
https://lubertlatin.com/practice/vocab/?lesson=3&only=1&dir=en-la&start=1
https://lubertlatin.com/practice/synopsis/?lesson=17&imp=0&nonfinite=0&macrons=strict
```

**Making one.** Set the start screen the way the class should have it and press **Copy link to these settings** under Start. The link carries only the settings that differ from the defaults, always in the same order, so the same setup always gives the same link. Where the browser won't copy (an old browser, a page not on https) the link appears in a box, selected, to copy by hand. The address bar is never rewritten.

**Opening one.** The page applies its defaults, then the student's saved settings, then the link. A setting the link doesn't mention keeps the student's saved value. The start screen says "Settings from a shared link", with **Use my saved settings** to reload the page without them. A link's settings are for that visit: nothing is saved when the page opens, or when the student presses Start without changing anything, so the student's own setup is still there on the bare address. If the student changes a setting and then starts a round, the settings are saved as usual. A link holds settings only: no missed list, no scores, nothing about the student.

Because a link leaves out defaults, a student whose saved settings differ from the defaults keeps their own for anything the link doesn't name. To pin a setting at its default, write it into the link by hand: every value in the tables below is accepted, defaults included (`?lesson=5&mode=table&voc=0&macrons=optional`).

**The parameters.** These names and values are a public interface: links that teachers have posted must keep working, so add to them but never rename or remove one.

Every game:

| Parameter | Values | Setting |
|---|---|---|
| `book` | a textbook's folder name: `henle`, `henle2`, `henle3` | The textbook. Left out of a copied link when it is the page's own (`henle`), so links made before there was a choice still mean First Year: a link that carries settings and no `book` opens First Year, whatever the student last chose. A name that isn't a textbook is ignored. |
| `lesson` | a whole number | The lesson slider. A number outside the game's range is brought to the nearest end (`lesson=999` is the last lesson). Default: the last lesson. |
| `only` | `1`, `0` | "Lesson N only" (`1`) or "Through Lesson N" (`0`, the default). Only in games that show the choice (Vocabulary); ignored elsewhere. |
| `macrons` | `strict`, `optional` | Strict macrons on or off (default `optional`). Typed games: Decline, Synopsis, Vocabulary. |
| `spelling` | `henle`, `classical` | Spelling on screen: j (default `henle`) or i. Typed games. |
| `start` | `1` | Skip the start screen and begin the round. If the settings leave nothing to ask, the start screen is shown with its note instead. Never part of a copied link; add `&start=1` by hand. |

Parsing drill (`/practice/`):

| Parameter | Values | Setting |
|---|---|---|
| `type` | `noun`, `verb`, `both` | Practice: Nouns, Verbs, Both (default `both`). |

Decline a noun (`/practice/decline/`):

| Parameter | Values | Setting |
|---|---|---|
| `mode` | `table`, `single`, `phrase` | Mode: Full table (default), Single form, Noun + adjective. |
| `form` | `table`, `single` | Inside Noun + adjective: Full table (default) or Single form. |
| `decl` | a list of `1`–`5`, as `decl=1,2,3` | The Declensions boxes that are ticked. Default: all five. |
| `voc` | `1`, `0` | Include vocative (default `0`). |

Verb synopsis (`/practice/synopsis/`):

| Parameter | Values | Setting |
|---|---|---|
| `mode` | `synopsis`, `single` | Mode: Full synopsis (default), Single form. |
| `subj` | `1`, `0` | Include subjunctive (default `1`). |
| `imp` | `1`, `0` | Include imperative (default `1`). |
| `nonfinite` | `1`, `0` | Include infinitives and participles (default `1`). |

Vocabulary (`/practice/vocab/`):

| Parameter | Values | Setting |
|---|---|---|
| `dir` | `la-en`, `en-la` | Mode: Latin → English (default), English → Latin. |
| `pos` | a list of `noun`, `verb`, `adjective`, `other`, as `pos=noun,verb` | The Parts of speech boxes that are ticked. Default: all four. |

A parameter the game doesn't know, or a value not in these tables, is ignored without any message, and the rest of the link still applies. Nothing from the address is ever written into the page.

**How it is built.** `site/js/practice-link.js` reads and writes the query string and has no page code in it, so the tests run it in Node. The shell (`practice.js`) handles `lesson`, `only`, `macrons`, `spelling` and `start`. A game handles its own settings with two functions on the object it registers:

| Function | What it does |
|---|---|
| `fromLink(params, link)` | `params` is `{ name: value }` from the address, values trimmed and lower-cased. Returns the settings it recognises in the shape `restore()` takes, leaving out anything missing or bad. The shell passes the result to `restore()`, so a link goes through the same checks as saved settings. |
| `toLink(settings, link)` | Returns `[[name, value], ...]` for every one of the game's settings, always in the same order. The shell drops the ones that match the defaults. |

`link` is the module itself, for its small readers: `link.oneOf(value, allowed)`, `link.flag(value)` (`1`/`0`), `link.list(value, allowed)` and `link.onOff(boolean)`. A new setting in a game needs a line in each function, a row in the table above and a case in the test:

```bash
node tools/test-links.js
```

Each practice page's `<link rel="canonical">` is its bare address, so links with settings are not indexed as separate pages. `netlify.toml` needs no rule for them: Netlify passes a query string through its redirects.

### The result summary ("Copy my result")

The results screen shows one line saying what the round was and how it went, with a **Copy my result** button, so a student can paste it into an email or the class platform:

```
Decline a noun · Henle through Lesson 5 · Single form · Declensions 1st, 2nd · Strict macrons · 9/10 (90%) · Nov 11, 2026, 4:12 PM
```

It has the game, the lesson filter ("through Lesson 5" or "Lesson 5 only"), the game's settings in words, "Strict macrons" when that was on, the score, and the date and time on the student's device in the student's own date format. A round from the missed list says "Missed-list round" in place of the lesson and settings, which don't apply to it. Where the browser won't copy, the line is selected to copy by hand.

The line is made in the student's browser and goes nowhere by itself: the site keeps no record and sends nothing to anyone. It is plain text that a student could edit, so treat it as a report of work done, not a secure grade. It has no name on it; the student's message says who it is from.

The shell (`practice.js`) builds the line. A game adds its settings with one optional function on the object it registers: `summary()` returns a list of short phrases for the settings as they stand (`["Single form", "Declensions 1st, 2nd", "With vocative"]`), leaving out what is at its default where that reads better. A game without it gets the lesson and the score only.

### The missed list ("drill only what I missed")

Every form a student answers wrong goes on a missed list, one list per game and textbook, kept in their browser. Two buttons use it:

- **Drill what I missed**, on the results screen whenever something was missed: a new round of only the forms missed in the round just played, shuffled. Its own results screen offers the button again until nothing is missed. A missed cell of a noun table or a synopsis comes back as that one form in the single-form layout, not as the whole grid; a missed parsing sentence is asked again as it was.
- **Drill my missed list**, on the start screen whenever the list isn't empty ("12 forms on your missed list"): up to a normal round (10) of the stored list, oldest misses first. This round ignores the lesson slider and the other filters, since the student has already met these forms; strict macrons and the spelling setting still apply. **Clear list** beside it empties the list after a confirmation.

The rules: a form joins the list when it is answered wrong in any round. Each right answer after that counts one, a wrong answer puts the count back to zero, and after **two right answers in a row** the form leaves the list (`RIGHT_IN_A_ROW_TO_CLEAR` in `site/js/missed-list.js`). The list holds at most 300 forms per game (`MAX_ENTRIES`); past that the oldest misses drop off.

It is stored in `localStorage` under `lubertlatin.practice.missed`, apart from the settings keys:

```json
{ "v": 1,
  "lists": {
    "henle/parse":    [ { "k": { "id": "s31-w3" }, "missed": "2026-11-11T21:44:00.474Z", "right": 0 } ],
    "henle/decline":  [ { "k": { "lemma": "nōmen", "case": "abl", "number": "sg" }, "missed": "…", "right": 1 },
                        { "k": { "lemma": "vīta", "adj": "prīmus", "case": "voc", "number": "sg" }, "missed": "…", "right": 0 } ],
    "henle/synopsis": [ { "k": { "lemma": "commoveō", "mood": "indicative", "tense": "future perfect", "voice": "passive", "person": "3", "number": "pl" }, "missed": "…", "right": 0 } ]
  } }
```

`k` names the form, `missed` is the time of the last miss, `right` the right answers in a row since, and each list is in the order of the last miss. Only identifiers are stored, never a generated form: the answer is worked out again from the current `items.json` or `vocab.json` each time, so a correction to the data or the engine reaches the list too. A verb key leaves out what the form doesn't vary by (an imperative has no `person`, an infinitive or participle neither `person` nor `number`). When a page loads, entries whose item, word or form is no longer in the data are dropped. Nothing is sent anywhere. Where the browser refuses storage (private browsing, storage full), the end-of-round button still works and the start-screen line simply doesn't appear.

The list, its storage, the buttons and the two kinds of round live in the shell. A game takes part by adding two functions to what it already gives the shell (`pool`, `buildRound`, `begin`, `check`, `review`…):

| Function | Returns |
|---|---|
| `formKeys(item, result)` | `[{ key, right }]`: one entry for every form the graded item asked, with a plain-object `key` of identifiers and whether it was answered right. A table returns one per cell; the parsing drill returns one for the sentence. The right ones matter too: they are what counts a form off the list. |
| `fromMissed(key)` | A round item for that key, in the game's one-form layout, built from the current data; or `null` if the word, item or form is gone. |

Optional: `missedRoundSize()` when a missed-list round should be a different length from `roundSize()` (the typed games return 10, because their table rounds are 3 or 4 long), and `missedNoun: ["word", "words"]` for the start-screen line (default "form", "forms"). A game without `formKeys` and `fromMissed` runs as before, with no buttons. The list logic has its own test:

```bash
node tools/test-missed.js
```

### Worksheets ("Print a worksheet")

Beside **Start** on every start screen is **Print a worksheet**. It takes the settings as they stand (lesson, mode, filters, strict macrons, spelling), builds a round with the game's own `buildRound`, and prints it as a paper worksheet with a separate answer key. So a worksheet holds exactly what a round on screen would. Under the buttons:

- **Number of items**: how many the worksheet has. It starts at about a page's worth and can go up to what the pool holds (100 at most).
- **Include answer key**, on to begin with. Turn it off to print the worksheet alone.

| Game and mode | On the worksheet | A page holds |
|---|---|---|
| Decline a noun, full table | the entry and gloss, then an empty case × number grid | 4 |
| Noun + adjective, full table | both entries, then a wider grid for the two words | 3 (2 with the vocative row) |
| Decline a noun, single form (either kind) | the entry, "gen. pl.", a blank | 20 |
| Verb synopsis, full | the principal parts, the person and number, then the grid the screen shows, empty | 2, side by side |
| Verb synopsis, single form | the principal parts, "imperfect passive indicative, 3rd pl.", a blank | 20 |
| Parsing drill | the sentence with the word underlined and bold, then a labeled blank for each part (Case, Number, Gender, Use; or Person, Number, Tense, Voice, Mood) | 10 |
| Vocabulary, Latin → English | the entry and four meanings lettered a–d, one to circle | 12 |
| Vocabulary, English → Latin | the meaning, the part of speech, a blank | 20 |

Two things differ from the screen in the parsing drill. The blanks themselves show whether the word is a noun or a verb, so that first question isn't asked (the key gives it). And the "Clause (if subjunctive)" blank is printed on every verb once the chosen lesson has a subjunctive to parse, so that its presence doesn't give the mood away.

The header has the site name, lines for Name and Date, the game and mode, the textbook and lesson ("Henle First Year Latin, through Lesson N", or "Lesson N only"), and a line of instructions that says whether macrons count. The foot has, in small type, the link that opens the game with the same settings (the one **Copy link to these settings** gives; see "Links for assignments"), so students can do the same drill online. The link carries the settings, not the items: the round online is a fresh one. The **answer key** starts on a new page with the same header, marked "Answer key", and the same numbers. Grids are filled in; single forms, parsing and vocabulary are a numbered list. Every form has its macrons and follows the spelling setting (Henle j or classical i). Where the game accepts more than one form, the others follow the main one in small italics after "or" (*dī or deī*; *laudātus es or laudāta es; laudātum es*). For a noun + adjective the key gives noun then adjective and says once, at the top, that either order is right.

**How it works.** No PDF library, no new window, no third-party script. The shell builds the worksheet in the page as `<div id="worksheet" class="worksheet">` at the end of `<body>`, sets the class `print-worksheet` on `<html>`, and calls `window.print()`; the browser's own dialog does paper or "Save as PDF". When the dialog closes, printed or cancelled (`afterprint`), the shell removes both, and the page is as it was. The look is the `@media print` section at the end of `site/css/practice.css`: everything on the page except the worksheet is hidden, text is black on white with lines for borders and nothing that depends on color, the type is the site's serif, the margins are 0.6 in, an item is never split across pages (`break-inside: avoid`), and the key starts its own page (`break-before: page`). It is sized for US Letter and also fits A4, portrait.

The button, the two controls, the page frame, the numbering and the print call are the shell's. A game takes part by adding two functions to what it already gives the shell:

| Function | Does |
|---|---|
| `printItem(item, box)` | Renders one round item into `box` as the student gets it: the prompt and something to fill in. |
| `printAnswer(item, box)` | Renders the same item's answer into `box`, for the key. |

`printItem` is always called before `printAnswer` for an item, so it may leave on the item what the answer needs (the vocabulary game keeps the order of its four options there, so that the key can name the letter). `shell.answerNode(expected)` gives the standard answer: the first form in bold, the other accepted forms after "or", all in the chosen spelling. The class names the print styles know are `ws-entry`, `ws-gloss`, `ws-grid` (a table; `ws-none` for a cell with no form, `ws-section` for a heading row), `ws-single` with `ws-ask` and `ws-blank` (one line with a rule to write on), and `ws-fields`, `ws-field`, `ws-label` (labeled blanks).

Optional: `printSheet()`, which returns any of

| Field | Meaning | Default |
|---|---|---|
| `mode` | the mode's name, for the header ("Full table") | none |
| `instructions` | the line under the header | none |
| `keyNote` | a sentence for the top of the key | none |
| `items` | how many items fill about a page | `roundSize()` |
| `max` | the most the worksheet can have | the size of the pool |
| `columns`, `keyColumns` | 1 or 2: items side by side on the worksheet, and in the key | 1; the key follows the worksheet |
| `macrons` | whether the student writes Latin, so the macron line is shown | true for a typed game |

A game without `printItem` and `printAnswer` has no button. "Number of items" and "Include answer key" are not settings of the game: they are not saved and are not part of a link.

### Textbooks (curricula)

Every data file lives in a folder named for the textbook, and every item and entry carries a matching `"curriculum"` field. There are three: `henle` (Henle *First Year Latin*), `henle2` (Henle *Second Year Latin*) and `henle3` (Henle *Third Year Latin*). `site/practice/data/textbooks.json` lists them, in the order the start screen shows them:

```json
[
  { "id": "henle", "label": "Henle First Year" },
  { "id": "henle2", "label": "Henle Second Year" },
  { "id": "henle3", "label": "Henle Third Year" }
]
```

**The Textbook choice.** With more than one textbook in that file, every start screen has a Textbook row above the game's options. Picking one loads the page again with that textbook's data, lessons, saved settings and missed list. The choice is kept in the student's browser (`lubertlatin.practice.book`) and holds for all four games. Each textbook keeps its own settings: First Year under the keys it always had (`lubertlatin.practice.decline`), another textbook under the same key with its name added (`lubertlatin.practice.decline.henle2`). `data-curriculum` on the `<div id="drill">` of each page is the textbook a first visit starts with. A link names a textbook with `book=` (see "Links for assignments").

To add Wheelock, *Latin for the New Millennium* or *Ecce Romani* later: make a folder, write its `curriculum.json`, `items.json` and `vocab.json`, and add a line to `textbooks.json`. The games themselves don't change.

**Henle Second Year (`henle2`).** Its 32 lessons are those of Part IV, "Exercises Based on Caesar" (pp. 305–520), which review First Year's forms and add the rest. The grammar schedule follows the lesson titles and what each lesson's text gives: the indicative active in Lesson 3, the subjunctive active in 4 and 5, the passive in 7 and 9, deponents in 11, *eō* in 15, *ferō* and the perfect participle in 18, *possum* and the present infinitive in 19, the other infinitives and the future participle in 20, the present participle in 22, *volō* in 23, *fīō* in 24, the vocative and the imperative (active and passive) in 29. The declensions count as known from Lesson 1. The gerund and gerundive (Lessons 26–28) and the comparison of adjectives and adverbs (12, 14, 16) are not in the typed games; the comparatives and superlatives the book lists as words are in the vocabulary game.

Its words are the book's Classified Word List (pp. 551–584), 541 entries. The list marks second-year words with an asterisk; each belongs to the first lesson whose VOCABULARY has it. The rest are First Year's required words: they are entered at Lesson 1 with `"review": true`, so they are in play through every lesson, but "Lesson 1 only" in the vocabulary game asks just the seven words Lesson 1 itself lists. Both lists are transcribed from the book in `tools/henle2-classified-word-list.txt` and `tools/henle2-lesson-vocab.txt`, and `vocab.json` is built from them:

```bash
node tools/build-henle2-vocab.js --write
```

A word First Year's `vocab.json` already has is copied from there (principal parts, gender, flags, forms) with Second Year's meaning; the others are built from the printed entry. Without `--write` the script only reports: the words it built, the second-year words no lesson lists, and the lesson words the classified list lacks. So for this textbook correct a word in the two lists or in the script's tables, not in `vocab.json`. A few readings where the print has no macron, or a doubtful one, are set right in the script's `FIX` table (*nūntius*, *nūntiō*, *vāstō*, *pēs*, *intulī*).

Its parsing sentences are First Year's, for every sentence whose words Second Year's list covers (99 of the 108), each placed at the lesson by which Second Year has taught all its words and forms, plus 40 new items written with second-year words (the `NEW` table in the script):

```bash
node tools/build-henle2-items.js
```

**Henle Third Year (`henle3`).** Its 21 lessons are those of Part IV, "Exercises Based on Cicero" (pp. 209–344). They teach syntax (questions, wishes, conditions, the uses of the cases, the subordinate clauses) and assign the forms only as review, so the grammar schedule opens every declension, conjugation, tense, voice and mood at Lesson 1; a verb still waits for the lesson that lists it (*mālō* Lesson 9, *nōlō* Lesson 19). The gerund and gerundive (Lesson 11) are not in the typed games.

Its words come from two lists. The book's Classified Word List, First and Second Years (pp. 377–410) is Second Year's list reprinted, so those 541 words are copied from `henle2/vocab.json` at Lesson 1 with `"review": true`. Its own 310 words are the VOCABULARY of each lesson, transcribed in `tools/henle3-lesson-vocab.txt` (the Review Word List for Third Year, pp. 359–376, is the same entries in the same order), and built from the printed entry:

```bash
node tools/build-henle3-vocab.js --write
```

The script's tables hold what the print leaves out: third-declension genders, the i-stems, the forms of *domus*, and the words that are not declined by rule (*īdem*, *quīdam*, *aliquis*, *complūrēs*, *cēterī*, *nōnnūllī*, the impersonals *placet*, *cōnstat*, *accidit*, the defectives *ōdī* and *meminī*, and the phrases). Two readings are set right in its `FIX` table (*parēns* for the printed *pārēns*, *ēmptus* for *emptus*). Four lesson words are already in the earlier list (*magis*, *male*, *nūper*, *prope*): they stay review words and get `"lessons": [1, N]`, so "Lesson N only" asks them with that lesson's words. *quam* "how" and *ut* "as" are entries of their own beside the earlier *quam* "than" and *ut* "that". Without `--write` the script only reports. So for this textbook correct a word in the list or in the script's tables (a review word: in Second Year's lists, then build both), not in `vocab.json`.

Its parsing sentences are Second Year's 139 items (First Year's among them), all usable from Lesson 1, plus 76 new items in 29 sentences written with Third Year's words (the `NEW` table in the script), each at the lesson that brings the last of its words:

```bash
node tools/build-henle3-items.js
```

`curriculum.json` holds the display name, the number of lessons, the word for a lesson ("Lesson" or "Chapter") and a **grammar schedule**: the lesson in which each declension, conjugation, tense, voice and mood is first taught. The typed games open a row or column once the lesson filter reaches that number (or, with "Lesson N only", when it is that number). The Henle numbers come from the book's table of contents. A tense is one lesson number, or a map by conjugation where the book teaches it one conjugation at a time (`"present": {"1": 9, "2": 10, "3": 12, "4": 13, "3io": 37}`); `conjugation` says when each conjugation starts, `deponent` when deponents start, and `irregular` when each hand-table verb starts (`null` = not taught in this book; compounds follow their base verb). Every cell opens at the later of the verb's start and the tense's lesson, so *capiō* shows nothing before Lesson 37 and *sequor* nothing before 41.

The imperative, the infinitives and the participles are scheduled the same way, under `grammar.verbs`:

```json
"imperative": {
  "active":  { "present": { "1": 27, "2": 27, "3": 27, "4": 27, "3io": 37, "sum": null, "possum": null, "eō": null } },
  "passive": { "present": null }
},
"infinitive": {
  "active":  { "present": 35, "perfect": 39, "future": 39 },
  "passive": { "present": 35, "perfect": 39, "future": null }
},
"participle": {
  "active":  { "present": null, "future": 39 },
  "passive": { "perfect": 30 }
}
```

Each value is a lesson number, `null` for a form the book never teaches, or a map by conjugation; in these three sections a map may also name a hand-table verb (`"sum": null`: Henle gives no imperative of *sum*, and *absum* follows it). The rule for a cell is the same as for the tenses: the later of the verb's start and the form's lesson, so *capiō* has no infinitives before Lesson 37 and *eō* none before 42. Deponents follow the `passive` lines, except for their future infinitive and their present and future participles, which are active in form and follow the `active` lines. The Henle numbers, with the page each form is taught on:

| Form | Lesson | Page |
|---|---|---|
| Present imperative active, singular and plural | 27 | 296 |
| Perfect participle passive (*laudātus, -a, -um*) | 30 | 325 |
| Present infinitive, active and passive | 35 | 352 |
| Perfect infinitive active; future participle active; future infinitive active | 39 | 412 |
| Perfect infinitive passive | 39 | 428 |
| Deponents: perfect participle; the three infinitives | 41 | 450, 453 |
| Infinitives of *eō* | 42 | 464 |

Not in First Year, so `null` or left out: the passive imperative, the imperative of *sum*, *possum*, *eō* and the deponents, the present participle, the future infinitive passive ("you need not learn it now", p. 428) and the gerundive. The engine does not generate the last two at all.

Adjectives have their own lines in the schedule:

```json
"adjectives": {
  "declension": { "1-2": 7, "3": 8 },
  "er": 16,
  "gen-ius": 36
}
```

`declension` is the lesson each kind of adjective is taught (*magnus, -a, -um* in Lesson 7, *gravis, grave* in Lesson 8), `er` the lesson for *miser* and *integer*, and `gen-ius` the lesson for the group with the genitive in *-īus* (*ūnus, tōtus, alius*…). An adjective opens at the latest of its own lesson and the lines that apply to it, so *noster* (Lesson 16) waits for Lesson 16 and *tōtus* for Lesson 36. Its vocative follows the nouns' `vocative` lesson.

**Noun + adjective mode.** The Mode row of *Decline a noun* has a third choice, "Noun + adjective", with its own "Full table / Single form" choice. The game shows both dictionary entries (*mīles, mīlitis, m.* and *fortis, forte*) and the student types the two words together in each cell, in either order. It pairs a noun from the pool with an adjective that is open at the chosen lesson, and most of the time picks a pair whose endings differ (*nauta bonus, mīles fortis, flūmen magnum*). A wrong cell shows the correct phrase with macrons and says which word was wrong when the other was right. The mode is closed, with a note, below the first adjective lesson (Henle Lesson 7). On a phone the grid stacks each case's singular over its plural so the phrases fit.

**Verb synopsis: imperative, infinitives, participles.** After the Indicative and Subjunctive sections the synopsis grid has three more, in the order of Henle's *Grammar* (Nos. 208–215): **Imperative** (one row, which follows the round's number, "Pres. sg." or "Pres. pl.", and ignores its person), **Infinitives** (present, perfect, future) and **Participles** (perfect, future), under the same Active and Passive columns. A section appears once the chosen lesson has opened one of its cells for that verb, and a cell the verb doesn't have shows a dash (*laudō* has no passive imperative in this book, *timeō* no perfect participle). Under **Rows** on the start screen, "Include imperative" and "Include infinitives and participles" sit beside "Include subjunctive"; each is struck through until the lesson reaches it (27 and 30 for Henle). Single-form mode draws from the same cells: "Give the perfect passive infinitive.", "Give the present active imperative, plural." How the forms are graded:

- Compound infinitives are shown in the nominative masculine (*laudātus esse*, *laudātūrus esse*); the feminine, the neuter and the accusative (*laudātum esse*, *laudātam esse*) are accepted too.
- A participle is answered in the nominative singular masculine (*laudātus*); the three nominatives are also accepted, in full or abbreviated (*laudātus, laudāta, laudātum* or *laudātus, a, um*).
- The short imperatives are *dīc*, *dūc* (and *addūc*, *dēdūc*, *trādūc*…) and *fac*; compounds of *faciō* in *-ficiō* keep the *-e* (*interfice*).
- A verb with no fourth principal part (*timeō*, *contendō*) has nothing built on the participle; a neuter or *-ūrus* fourth part (*pugnātum*, *mānsūrus*) gives the future participle and infinitive only.
- The perfect infinitive of *eō* is *iisse* (*īsse* is accepted); its compounds have *adiisse*, *rediisse*.

### The vocabulary game (/practice/vocab/)

`site/js/games/vocab.js` asks the meaning of the words in `vocab.json`, ten to a round. It uses each entry's `english` gloss; an entry without one is left out of the game (the validator prints how many there are).

- **Mode.** *Latin → English* shows the dictionary entry (*mīles, mīlitis, m.*; *laudō, laudāre, laudāvī, laudātus*; the nominatives of an adjective; the lemma of anything else) and four glosses to pick from. *English → Latin* shows the gloss and the part of speech, and the student types the first dictionary form (*mīles*, *laudō*). A full dictionary entry typed in the box is graded on its first word.
- **Parts of speech.** Nouns, Verbs, Adjectives, Other (pronouns, adverbs, prepositions, conjunctions, phrases); all on to begin with. A box is struck through until the chosen lesson has a word of that kind.
- **Lesson.** The words through the chosen lesson, by each word's `lesson`, ten to a round; or with "Lesson N only" the words of that lesson alone, every one of them in the round. The note under the slider says how many are in play.
- **Typing and Spelling** are the shared settings of the typed games: macrons optional unless strict macrons is on, i/j and u/v accepted either way, Henle (j) or classical (i) spelling on screen.
- **Wrong options** in multiple choice are the glosses of three other words open at the chosen lesson: the same part of speech where there are enough, never a gloss that is the same as the right one or shares a meaning with it (a word glossed "fear, dread" would never be offered beside *timor*, "fear"), and no two alike. A word with fewer than three such options is left out of multiple choice, and if that leaves nothing the start screen says there are too few words; with the Henle data every word has them from Lesson 1.
- **Two words, one gloss.** Where two open words of the same part of speech are asked by the same gloss (*exīstimō* and *putō*, "think"; *et* and *atque*, "and"), English → Latin accepts either, shows both in the feedback and asks that gloss only once in a round.
- After each answer the feedback shows the full entry with macrons and the whole gloss, and the end-of-round review lists each missed word the same way.
- The settings are kept under `lubertlatin.practice.vocab` (mode, parts of speech, lesson). The missed list stores a word as its lemma, part of speech and direction, so a word missed in one direction is asked again in that direction.

**How to write a gloss.** Separate meanings with commas or semicolons (`"carry, carry on; wage (war)"`). Put notes in parentheses (`"with (with the ablative)"`, `"grain; (plural) crops"`): they are shown, but they are not meanings. Write verbs without "to" (`"praise"`); a leading "to" is ignored when meanings are compared, and so are `?` and `!`. Two glosses share a meaning when any one of their comma- or semicolon-separated meanings is the same, so keep the wording of a shared meaning identical across words. Two kinds of note would give the answer away and are left out of the question (the feedback still shows them): a later semicolon part that begins with the Latin word itself (`"or; aut … aut, either … or"` is asked as "or") and a parenthesis that is the Latin word (`"to inform (certiōrem facere)"`).

### Parsing-drill items (`items.json`)

```json
{"id":"s01-w1","curriculum":"henle","sentence":"In silvā est via.","target_index":1,"target":"silvā","lesson":1,
 "type":"noun","parse":{"case":"abl","number":"sg","gender":"f","use":"ablative of place where"},
 "explanation":"..."}
```

- `target_index` counts words from 0. For a two-word form such as *victī sunt*, point at the first word and put both words in `target`.
- Noun parse: `case` (nom, gen, dat, acc, abl, voc), `number` (sg, pl), `gender` (m, f, n), `use` (must go with the case; see `USES_BY_CASE` in `tools/validate-items.js`).
- Verb parse: `person` (1, 2, 3), `number`, `tense`, `voice`, `mood`, and `clause` only when `mood` is `subjunctive`.
- Optional `"available": {"henle": 7}` says in which lesson of each textbook the sentence becomes usable; it wins over `lesson` for that textbook, so one sentence can serve several books. `node tools/compute-available.js` works these numbers out from `vocab.json` (a sentence is available after the lesson that introduces the last of its words), lists the words the vocab doesn't cover yet, and with `--write` fills the field in.

### Dictionary entries (`vocab.json`)

The typed games generate every form from these entries with the rules engine in `site/js/latin-forms.js`. The Henle file was transcribed (with macrons) from the First Year master list. Each word's `lesson` comes from the book's own lesson vocabularies: it is the first lesson whose VOCABULARY list boxes its dictionary entry. A word boxed again later (in another VOCABULARY list or a REVIEW VOCABULARY list) also has `"lessons": [9, 17, 25]`, every lesson that boxes it; the vocabulary game counts it among each of those lessons' own words. Those lists are transcribed in `tools/henle-lesson-vocab.txt`, one line per word (lesson, entry as printed, meaning, book page); after correcting a line there, `node tools/apply-lesson-vocab.js --write` sets the lessons again and reports any word the two files disagree on. The bare verb forms boxed in Lessons 1–6 (*ōrat*, *videt*, *dedērunt*…) are entries of their own (`frm-orat`, pos `other`); the verb itself waits for the lesson that boxes *ōrō*, *videō*, *dō*. The review lists are in the `REVIEW` table at the top of that script. The few words the book teaches outside a vocabulary list (*ut*, *nē*, *hic*, *meus*, the numerals…) get their lesson from the `OUTSIDE` table at the top of that script, which names the page for each; *est* and *sunt* are one of these (`frm-est`, Lesson 1), since `sum` itself is boxed in Lesson 14. One entry per line:

```json
{"id":"terra","curriculum":"henle","lesson":1,"pos":"noun","lemma":"terra","gen":"terrae","gender":"f","declension":"1","english":"land"}
{"id":"hostis","curriculum":"henle","lesson":5,"pos":"noun","lemma":"hostis","gen":"hostis","gender":"m","declension":"3","flags":["i-stem"],"english":"enemy"}
{"id":"castra","curriculum":"henle","lesson":3,"pos":"noun","lemma":"castra","gen":"castrōrum","gender":"n","declension":"2","flags":["plural-only"],"english":"camp"}
{"id":"laudo","curriculum":"henle","lesson":11,"pos":"verb","lemma":"laudō","parts":["laudō","laudāre","laudāvī","laudātus"],"conjugation":"1","english":"praise"}
{"id":"capio","curriculum":"henle","lesson":14,"pos":"verb","lemma":"capiō","parts":["capiō","capere","cēpī","captus"],"conjugation":"3io","english":"take"}
{"id":"sequor","curriculum":"henle","lesson":41,"pos":"verb","lemma":"sequor","parts":["sequor","sequī","secūtus sum"],"conjugation":"3","flags":["deponent"],"english":"follow"}
{"id":"sum","curriculum":"henle","lesson":1,"pos":"verb","lemma":"sum","parts":["sum","esse","fuī","futūrus"],"conjugation":"irregular","flags":["no-passive"],"english":"be"}
{"id":"adj-magnus","curriculum":"henle","lesson":7,"pos":"adjective","lemma":"magnus","nom":["magnus","magna","magnum"],"declension":"1-2","english":"great, large"}
{"id":"adj-grauis","curriculum":"henle","lesson":8,"pos":"adjective","lemma":"gravis","nom":["gravis","grave"],"declension":"3","english":"heavy, severe, serious"}
{"id":"adj-totus","curriculum":"henle","lesson":36,"pos":"adjective","lemma":"tōtus","nom":["tōtus","tōta","tōtum"],"declension":"1-2","flags":["gen-ius"],"english":"whole, all of"}
{"id":"in","curriculum":"henle","lesson":1,"pos":"indeclinable","lemma":"in","english":"in, on; into"}
```

- **Nouns:** `lemma`, `gen` (genitive singular; genitive plural for a plural-only noun), `gender` (m, f, n), `declension` ("1"–"5"). The stem comes from the genitive, so *ager, agrī* and *fīlius, fīliī* work by themselves; 2nd-declension -ius nouns get the vocative in -ī, 3rd-declension neuters and i-stems (`"i-stem"` flag: gen. pl. -ium; neuters also abl. -ī and nom./acc. pl. -ia), and the 4th and 5th declensions are all handled. Flags: `i-stem`, `plural-only`, `singular-only`, `no-vocative`. For an odd word, `"forms": {"sg.voc": "deus", "pl.nom": ["dī", "deī"]}` overrides single cells (a list means every spelling is accepted).
- **Verbs:** `parts` (principal parts; three for a deponent, ending in "… sum"), `conjugation` ("1", "2", "3", "3io", "4" or "irregular"). Flags: `deponent`, `semi-deponent` (*audeō, audēre, ausus sum*: three parts ending in "… sum"; one Active column, active in the present system, the perfect system from the participle), `no-passive` (intransitive verbs: only the active column is shown). Compounds of *sum*, *eō* and *ferō* use the base verb's table (*adsum*, *obeō*, *afferō*, *offerō*, *dēferō*). The verbs **sum, possum, eō, ferō, volō, nōlō, mālō, fīō** are hand-entered tables, not rules; give them `"conjugation": "irregular"`.
- **Adjectives:** `nom` (the nominative singular forms as the dictionary gives them, written out in full: three for `"declension": "1-2"`, two for `"declension": "3"`). A third-declension adjective can also have three (`["ācer", "ācris", "ācre"]`) or one with its genitive beside it (`"nom": ["audāx"], "gen": "audācis"`). The stem comes from the feminine, so *miser, misera* keeps its e and *integer, integra* and *noster, nostra* drop it. `-us` adjectives get the vocative in *-e* (*mī* for *meus*); third-declension adjectives decline as i-stems (abl. sg. *-ī*, gen. pl. *-ium*, neuter pl. *-ia*). Flags: `gen-ius` (genitive singular *-īus* and dative singular *-ī* in all genders; the neuter is taken as written, so *alius* has *aliud*), `singular-only` (*ūnus*). For an odd word, `"forms": {"f.sg.gen": ["alterīus", "alterius", "alīus", "aliae"]}` overrides single cells, keyed gender.number.case; a list means every spelling is accepted and the first is the one shown (the genitive and dative singular of *alius* are entered this way). The possessives *meus, tuus, suus, noster, vester* are entered as adjectives. An adjective with no `nom` and `declension` (*quot*, *duo*, *mīlle*) is not declined and counts as one of the "other words" below.
- **Other words** (`pronoun`, `adverb`, `preposition`, `conjunction`, `indeclinable`, `other`, and adjectives that aren't declined by rule) are used to work out sentence availability and in the vocabulary game; give an optional `"forms": [...]` list for anything that inflects.
- `review` (optional, `true` only): a word known from an earlier book. It is asked through every lesson, but is not one of any lesson's own words, so "Lesson N only" leaves it out. `henle2` and `henle3` use it. A review word that a lesson of the book boxes again also has `"lessons": [1, N]` and is asked in "Lesson N only".
- `english` (optional, on any entry): the gloss shown under the entry in the typed games and asked in the vocabulary game; how to write one is under "The vocabulary game" above. Leave the field out when the meaning isn't known yet instead of guessing: the word is then only left out of the vocabulary game.
- Spelling: write consonantal i as **j** the way Henle does (*jubeō*, *cūjus*). The games show it as j or i according to the student's spelling setting, and grading accepts i/j and u/v either way. Macrons are ignored unless the student turns on "strict macrons", and every correct form is shown with macrons.

### Proofing the generator

Print the full paradigm the games will use for any words, from `vocab.json` or from a dictionary line that needn't be in the file:

```bash
node tools/paradigm.js mīles hostis laudō
```
```bash
node tools/paradigm.js "mare, maris, n. i" "sequor, sequī, secūtus sum" "capiō, capere, cēpī, captus"
```
```bash
node tools/paradigm.js --all
```
```bash
node tools/paradigm.js fortis "gravis, grave" "magnus, a, um" "tōtus, a, um, -īus"
```

Adjectives print with the three genders side by side; a dictionary line gives the nominatives, in full or as Henle abbreviates them, with `, -īus` added for the *ūnus* group. `--irregular` prints the eight hand-entered verbs; `--classical` shows i instead of j. A word that needs `forms` overrides (*vīs*, *deus*, *Jēsūs*, *domus*) can be given as a full JSON entry in quotes instead of a dictionary line. A verb prints every tense of the indicative and subjunctive, then its imperative, infinitives and participles (including the forms Henle's schedule leaves closed, such as the passive imperative and the present participle). The engine also has a fixed test of known paradigms (every declension type, the adjective types and noun-adjective agreement, all conjugations, deponents, the irregulars, the imperative, infinitives and participles with the lesson each opens, the lesson each noun, adjective and synopsis cell first opens for the lesson filter, and the grading rules):

```bash
node tools/test-forms.js
```

### Checking the data before you push

```bash
node tools/validate-items.js
```

With no arguments it checks every textbook folder: `curriculum.json` (shape and lesson numbers), `items.json` (missing fields, values outside the allowed lists, a use that doesn't go with the case, a `target_index` that doesn't point at the target word, lesson and `available` numbers outside the book, duplicate ids) and `vocab.json` (missing fields, unknown declension/conjugation codes and flags, adjectives whose `nom` doesn't fit their declension, entries the engine can't decline or conjugate, irregular verbs without a hand table, an `english` that is empty; entries with no `english` are counted in a warning, which is not an error). "OK" on every line means the data is good. To check one file, give its path: `node tools/validate-items.js site/practice/data/henle/vocab.json`.

## Publishing a change

Netlify redeploys automatically whenever you push to the `main` branch on GitHub. From the project folder:

```bash
git add -A
```
```bash
git commit -m "Update pricing"
```
```bash
git push
```

The live site updates in about a minute. You can also edit files directly on GitHub.com (pencil icon → edit → "Commit changes") and skip the command line entirely.

## Form submissions

Both forms (contact and PDF signup) are handled by **Netlify Forms**. Submissions appear in the Netlify dashboard under **Forms**, and you can turn on email notifications there (Forms → Settings → Form notifications). The free plan includes 100 submissions a month.

The PDF signup redirects to `free-sheet.html`, which has the download link. No email is sent; if you later want the PDF emailed automatically, connect the form to Zapier/Make or a mailing-list service.

## Updating the free PDF

The PDF at `site/assets/latin-declension-conjugation-id-sheet.pdf` is the proofed version supplied directly as a file. To replace it, drop a new PDF over that file (same name), commit, and push.

`tools/id-sheet.html` is the original draft the first PDF was built from; it is older than the current PDF. If you ever want to regenerate from it, edit that file, then run from the project folder (this overwrites the PDF in `site/assets`):

```bash
powershell -ExecutionPolicy Bypass -File tools\build-assets.ps1
```

This rebuilds the PDF (and the social-sharing image from `tools/og-image.html`) using Chrome or Edge. Commit and push the result.

## Checking the site locally

Any static file server works. With Node installed:

```bash
npx serve site
```

Then open the address it prints (usually http://localhost:3000).

## SEO notes

- Title and description are at the top of `index.html` (`<title>` and `<meta name="description">`).
- `sitemap.xml` has a `lastmod` date; update it when you make meaningful content changes.
- After the domain is live, submit the sitemap in [Google Search Console](https://search.google.com/search-console) (free) so Google indexes the site quickly.
- Structured data (Person, LocalBusiness, FAQ) can be tested at https://validator.schema.org.
