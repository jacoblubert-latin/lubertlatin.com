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
  practice/data/henle/         ← one folder per textbook (see "The practice games")
    curriculum.json            ← name, lesson count, and which forms each lesson teaches
    items.json                 ← parsing-drill sentences and answers
    vocab.json                 ← dictionary entries for the typed games
  css/styles.css      ← colors, fonts, layout
  css/practice.css    ← styles for the practice games only
  css/fonts.css       ← self-hosted font files (don't edit)
  js/main.js          ← mobile menu, footer year, FAQ search markup
  js/practice.js      ← the shared game shell (start screen, lesson filter, scoring, review)
  js/latin-forms.js   ← the rules engine that declines nouns and adjectives and conjugates verbs
  js/games/*.js       ← one file per game: parse.js, decline.js, synopsis.js
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

Four games share one shell (`site/js/practice.js`): the start screen with its lesson filter, scoring, streak, the end-of-round review, and the footer. Each game is a small file in `site/js/games/` that only says what its start-screen options are, which items are in the pool, how an item is shown and graded, and how a missed item is reviewed. Everything is static: the browser reads JSON from `site/practice/data/<textbook>/` and keeps nothing anywhere else (the last settings and the missed list are remembered in the student's own browser only).

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

### Textbooks (curricula)

Every data file lives in a folder named for the textbook, and every item and entry carries a matching `"curriculum"` field. Only `henle` exists now. To add Wheelock, *Latin for the New Millennium* or *Ecce Romani* later: copy the folder, write its `curriculum.json`, `items.json` and `vocab.json`, and set `data-curriculum` on the `<div id="drill">` of each page (a textbook picker on the start screen will set that attribute; the games themselves don't change).

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

The typed games generate every form from these entries with the rules engine in `site/js/latin-forms.js`. The Henle file was transcribed (with macrons) from the First Year master list. Each word's `lesson` comes from the book's own lesson vocabularies: it is the first lesson whose VOCABULARY list has the word (REVIEW VOCABULARY lists don't count). Those lists are transcribed in `tools/henle-lesson-vocab.txt`, one line per word (lesson, entry as printed, meaning, book page); after correcting a line there, `node tools/apply-lesson-vocab.js --write` sets the lessons again and reports any word the two files disagree on. A word's lesson can be earlier than the lesson its paradigm is taught (*ōrat* and *videt* are in Lesson 1, the first conjugation in Lesson 9); the games open each form at the later of the two. The few words the book teaches outside a vocabulary list (*ut*, *nē*, *hic*, *meus*, the numerals…) get their lesson from the `OUTSIDE` table at the top of that script, which names the page for each; `sum` is kept at Lesson 1, because *est* and *sunt* are used from the start. One entry per line:

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
- **Verbs:** `parts` (principal parts; three for a deponent, ending in "… sum"), `conjugation` ("1", "2", "3", "3io", "4" or "irregular"). Flags: `deponent`, `no-passive` (intransitive verbs: only the active column is shown). The verbs **sum, possum, eō, ferō, volō, nōlō, mālō, fīō** are hand-entered tables, not rules; give them `"conjugation": "irregular"`.
- **Adjectives:** `nom` (the nominative singular forms as the dictionary gives them, written out in full: three for `"declension": "1-2"`, two for `"declension": "3"`). The stem comes from the feminine, so *miser, misera* keeps its e and *integer, integra* and *noster, nostra* drop it. `-us` adjectives get the vocative in *-e* (*mī* for *meus*); third-declension adjectives decline as i-stems (abl. sg. *-ī*, gen. pl. *-ium*, neuter pl. *-ia*). Flags: `gen-ius` (genitive singular *-īus* and dative singular *-ī* in all genders; the neuter is taken as written, so *alius* has *aliud*), `singular-only` (*ūnus*). For an odd word, `"forms": {"f.sg.gen": ["alterīus", "alterius", "alīus", "aliae"]}` overrides single cells, keyed gender.number.case; a list means every spelling is accepted and the first is the one shown (the genitive and dative singular of *alius* are entered this way). The possessives *meus, tuus, suus, noster, vester* are entered as adjectives. An adjective with no `nom` and `declension` (*quot*, *duo*, *mīlle*) is not declined and counts as one of the "other words" below.
- **Other words** (`pronoun`, `adverb`, `preposition`, `conjunction`, `indeclinable`, `other`, and adjectives that aren't declined by rule) are used to work out sentence availability and in the vocabulary game; give an optional `"forms": [...]` list for anything that inflects.
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
