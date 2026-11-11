// Game 3: verb synopsis (typed). Reads vocab.json; forms come from the rules
// engine in latin-forms.js (hand tables for the irregulars). Full mode shows
// a Henle-style synopsis grid for one person/number; single-form mode asks
// for one form at a time. After the indicative and subjunctive come the
// imperative (which follows the round's number), the infinitives and the
// participles. The curriculum's grammar schedule decides which
// conjugations, tenses, moods, voices and non-finite forms are open at the
// chosen lesson.
(function () {
  "use strict";

  var L = window.LatinForms;
  var TENSE_SHORT = { present: "Pres.", imperfect: "Impf.", future: "Fut.", perfect: "Perf.", pluperfect: "Plupf.", "future perfect": "Fut. perf." };
  var VOICE_HEAD = { active: "Active", passive: "Passive", deponent: "Deponent" };
  var SECTION_HEAD = { indicative: "Indicative", subjunctive: "Subjunctive", imperative: "Imperative", infinitive: "Infinitives", participle: "Participles" };
  var FINITE = { indicative: true, subjunctive: true };

  var ctx, S, T, verbs = [], grammar = {};
  var cells = [];

  function lesson() { return ctx.settings.lesson; }
  function entryText(e) { return T.spell(L.verbEntryText(e)); }
  function who(item) { return L.PERSON_NAMES[item.person] + " " + L.NUMBER_NAMES[item.number]; }
  // What a single-form item is asked for: person and number for a finite
  // form, the number alone for an imperative, nothing for the rest.
  function whoSingle(item) {
    if (!item.mood || FINITE[item.mood]) return who(item);
    return item.mood === "imperative" ? L.NUMBER_NAMES[item.number] : "";
  }
  // The schedule (curriculum.json → grammar.verbs) is read through the
  // engine: each cell opens per verb, because Henle teaches a tense one
  // conjugation at a time (laudō in Lesson 9, -iō verbs not until 37).
  // "mood" below is any section of the synopsis: indicative, subjunctive,
  // imperative, infinitive, participle.
  function tenseOpen(entry, mood, voice, tense) {
    var l = L.verbFormLesson(entry, mood, tense, voice, grammar);
    return l != null && l <= lesson();
  }
  // The form for one cell, or null: not yet taught, or the verb has none.
  function cellFor(entry, mood, tense, voice, person, number) {
    return tenseOpen(entry, mood, voice, tense) ? L.synopsisCell(entry, mood, tense, voice, person, number) : null;
  }
  function verbsThrough() {
    return verbs.filter(function (v) {
      var start = L.verbStartLesson(v, grammar);
      return start != null && start <= lesson() && S.lessonOf(v) <= lesson();
    });
  }
  function tensesFor(mood) { return L.sectionTenses(mood); }
  // A row counts as open for a voice when the lesson has taught it; a row of
  // the imperative, infinitives or participles also needs the verb to have
  // the form (possum has no participles, so it gets no Participles section).
  function rowOpen(entry, mood, voice, tense) {
    if (!tenseOpen(entry, mood, voice, tense)) return false;
    return FINITE[mood] || !!L.synopsisCell(entry, mood, tense, voice, "2", "sg");
  }
  function hasOpenCell(entry, mood) {
    return L.verbVoices(entry).some(function (v) { return tensesFor(mood).some(function (t) { return rowOpen(entry, mood, v, t); }); });
  }
  // Is the subjunctive (imperative, …) open for any verb at this lesson?
  // (Asked for every verb on every change of the start screen, so the answer
  // is kept per lesson.)
  var openCache = {};
  function moodOpen(mood) {
    var key = lesson() + "|" + mood;
    if (!(key in openCache)) openCache[key] = verbsThrough().some(function (v) { return hasOpenCell(v, mood); });
    return openCache[key];
  }
  // The start screen's three checkboxes: [setting, the sections it adds].
  var OPTIONAL = [["subjunctive", ["subjunctive"]], ["imperative", ["imperative"]], ["nonfinite", ["infinitive", "participle"]]];
  function moods() {
    var out = ["indicative"];
    OPTIONAL.forEach(function (o) {
      if (ctx.settings[o[0]]) o[1].forEach(function (m) { if (moodOpen(m)) out.push(m); });
    });
    return out;
  }
  // Voice columns shown for a verb: its own voices, minus any not yet taught.
  function columnsFor(entry) {
    return L.verbVoices(entry).filter(function (v) {
      return moods().some(function (m) { return tensesFor(m).some(function (t) { return rowOpen(entry, m, v, t); }); });
    });
  }
  // "perfect passive indicative", "present active imperative", "future active participle";
  // a deponent has one voice, so it is not named.
  function cellText(mood, tense, voice) {
    return tense + (voice === "deponent" ? "" : " " + voice) + " " + mood;
  }
  function rowLabel(mood, tense, item) {
    return TENSE_SHORT[tense] + (mood === "imperative" ? " " + (item.number === "pl" ? "pl." : "sg.") : "");
  }

  // ---------- missed list ----------
  // A form is stored as lemma, mood (section), tense and voice, with the
  // person and number it varies by: both for a finite form, the number alone
  // for an imperative, neither for an infinitive or participle. The answer is
  // generated again from the current vocab.json each time it is asked.
  function formKey(entry, mood, tense, voice, person, number) {
    var key = { lemma: entry.lemma, mood: mood, tense: tense, voice: voice };
    if (FINITE[mood]) key.person = person;
    if (FINITE[mood] || mood === "imperative") key.number = number;
    return key;
  }

  var game = {
    id: "synopsis",
    data: ["vocab"],
    typed: true,
    storageKey: "lubertlatin.practice.synopsis",
    defaults: { mode: "synopsis", subjunctive: true, imperative: true, nonfinite: true },

    setup: function (c) {
      ctx = c; S = c.shell; T = S.typed;
      grammar = (c.curriculumInfo && c.curriculumInfo.grammar) || {};
      verbs = (Array.isArray(c.data.vocab) ? c.data.vocab : []).filter(function (e) {
        return e && e.pos === "verb" && (!e.curriculum || e.curriculum === c.curriculum);
      });
      openCache = {};
      T.enterToAdvance(c.area, S.check);
      c.area.addEventListener("input", function () { S.setCheckEnabled(game.canCheck()); });
    },
    lessonBounds: function () {
      var min = Infinity;
      verbs.forEach(function (v) { if (S.lessonOf(v) < min) min = S.lessonOf(v); });
      return { min: min, max: ctx.curriculumInfo.lessons };
    },
    restore: function (saved) {
      if (saved.mode === "synopsis" || saved.mode === "single") ctx.settings.mode = saved.mode;
      // Settings saved before the imperative and non-finite rows existed have
      // no value for them: those keep the default (on), the rest stay as saved.
      OPTIONAL.forEach(function (o) { if (typeof saved[o[0]] === "boolean") ctx.settings[o[0]] = saved[o[0]]; });
    },
    renderStart: function (options) {
      var fs = S.make("fieldset", "drill-fieldset");
      fs.appendChild(S.make("legend", null, "Mode"));
      var row = S.make("div", "choice-row");
      [["synopsis", "Full synopsis"], ["single", "Single form"]].forEach(function (o) {
        row.appendChild(choice("radio", "mode", o[0], o[1], ctx.settings.mode === o[0]));
      });
      fs.appendChild(row);
      options.appendChild(fs);

      var fs2 = S.make("fieldset", "drill-fieldset"); fs2.id = "subj-fieldset";
      fs2.appendChild(S.make("legend", null, "Rows"));
      var row2 = S.make("div", "choice-row");
      row2.appendChild(choice("checkbox", "subjunctive", "1", "Include subjunctive", ctx.settings.subjunctive));
      row2.appendChild(choice("checkbox", "imperative", "1", "Include imperative", ctx.settings.imperative));
      row2.appendChild(choice("checkbox", "nonfinite", "1", "Include infinitives and participles", ctx.settings.nonfinite));
      fs2.appendChild(row2);
      fs2.appendChild(S.make("p", "fine", "Tenses, moods, voices, infinitives and participles appear once the chosen lesson has taught them."));
      options.appendChild(fs2);
    },
    updateStart: function (form) {
      OPTIONAL.forEach(function (o) {
        var box = form.querySelector("input[name=" + o[0] + "]");
        var open = o[1].some(moodOpen);
        box.disabled = !open;
        box.parentNode.classList.toggle("is-unavailable", !open);
      });
    },
    readStart: function (form) {
      var m = form.querySelector("input[name=mode]:checked");
      ctx.settings.mode = m ? m.value : "synopsis";
      OPTIONAL.forEach(function (o) {
        var s = form.querySelector("input[name=" + o[0] + "]");
        ctx.settings[o[0]] = !!(s && s.checked);
      });
    },

    pool: function () {
      return verbsThrough().filter(function (v) { return columnsFor(v).length > 0; });
    },
    poolNote: function (n) {
      if (n === 0) return "No verbs through Lesson " + lesson() + " yet. Raise the lesson number.";
      var size = game.roundSize();
      var what = n + " " + S.plural(n, "verb") + " to draw from";
      if (ctx.settings.mode === "synopsis" && n < size) what += " (a round will be " + n + " long)";
      return what + ".";
    },
    roundSize: function () { return ctx.settings.mode === "synopsis" ? 3 : 10; },
    buildRound: function (list, size) {
      if (ctx.settings.mode === "synopsis") {
        return S.shuffle(list.slice()).slice(0, size).map(function (e) {
          return { entry: e, person: S.pick(L.PERSONS), number: S.pick(L.NUMBERS) };
        });
      }
      // Single forms: one random cell per pick, spread across verbs.
      var out = [], seen = {};
      var pool = S.shuffle(list.slice());
      var open = moods();
      for (var tries = 0; out.length < size && tries < size * 40; tries++) {
        var e = pool[tries % pool.length];
        var cols = columnsFor(e), mood = S.pick(open), tense = S.pick(tensesFor(mood)), voice = S.pick(cols);
        var person = S.pick(L.PERSONS), number = S.pick(L.NUMBERS);
        var expected = cellFor(e, mood, tense, voice, person, number);
        if (!expected) continue;
        // The key leaves out what the form doesn't vary by, so the same
        // infinitive isn't asked twice under two persons.
        var key = [e.lemma, mood, tense, voice, FINITE[mood] ? person : "", FINITE[mood] || mood === "imperative" ? number : ""].join("|");
        if (seen[key]) continue;
        seen[key] = true;
        out.push({ entry: e, person: person, number: number, mood: mood, tense: tense, voice: voice, expected: expected });
      }
      return out;
    },

    begin: function (item, area) {
      cells = [];
      var head = S.make("p", "entry-line"); head.setAttribute("lang", "la");
      head.textContent = entryText(item.entry);
      area.appendChild(head);
      var sub = S.make("p", "entry-gloss");
      var whoText = whoSingle(item), bits = [];
      if (whoText) sub.appendChild(S.make("b", null, whoText));
      if (item.entry.english) bits.push(item.entry.english);
      if (L.hasFlag(item.entry, "deponent")) bits.push("deponent");
      if (bits.length) sub.appendChild(document.createTextNode((whoText ? " · " : "") + bits.join(" · ")));
      area.appendChild(sub);

      if (item.mood) {
        area.appendChild(S.make("p", "drill-prompt", "Give the " + cellText(item.mood, item.tense, item.voice) + (whoText ? ", " + whoText : "") + "." +
          (item.mood === "participle" ? " (Nominative singular masculine.)" : "")));
        var wrap = S.make("div", "single-form");
        var inp = T.input(cellText(item.mood, item.tense, item.voice));
        wrap.appendChild(inp);
        area.appendChild(wrap);
        cells.push({ input: inp, expected: expectedList(item.expected), label: cellText(item.mood, item.tense, item.voice),
          key: formKey(item.entry, item.mood, item.tense, item.voice, item.person, item.number) });
      } else {
        var cols = columnsFor(item.entry);
        var shown = moods().filter(function (m) { return hasOpenCell(item.entry, m); });
        var notes = [];
        if (shown.indexOf("imperative") >= 0) notes.push("the imperative in the " + L.NUMBER_NAMES[item.number]);
        if (shown.indexOf("participle") >= 0) notes.push("participles in the nominative singular masculine");
        area.appendChild(S.make("p", "drill-prompt", "Type every form for the " + who(item) + "." +
          (notes.length ? " Give " + notes.join(" and ") + "." : "") + (T.settings.strict ? " Macrons count." : " Macrons are optional.")));
        var table = S.make("table", "form-grid synopsis-grid");
        var thead = S.make("thead"), hr = S.make("tr");
        hr.appendChild(S.make("th", null, ""));
        cols.forEach(function (v) { hr.appendChild(S.make("th", null, VOICE_HEAD[v])); });
        thead.appendChild(hr); table.appendChild(thead);
        var tbody = S.make("tbody");
        moods().forEach(function (mood) {
          var tenses = tensesFor(mood).filter(function (t) { return cols.some(function (v) { return rowOpen(item.entry, mood, v, t); }); });
          if (!tenses.length) return;
          var sec = S.make("tr", "grid-section");
          var sth = S.make("th", null, SECTION_HEAD[mood]); sth.colSpan = cols.length + 1; sth.setAttribute("scope", "colgroup");
          sec.appendChild(sth); tbody.appendChild(sec);
          tenses.forEach(function (t) {
            var tr = S.make("tr");
            var th = S.make("th", null, rowLabel(mood, t, item)); th.setAttribute("scope", "row"); th.title = t;
            tr.appendChild(th);
            cols.forEach(function (v) {
              var td = S.make("td");
              var cell = cellFor(item.entry, mood, t, v, item.person, item.number);
              if (cell) {
                var inp = T.input(cellText(mood, t, v));
                td.appendChild(inp);
                cells.push({ input: inp, expected: expectedList(cell), label: cellText(mood, t, v),
                  key: formKey(item.entry, mood, t, v, item.person, item.number) });
              } else { td.className = "cell-none"; td.textContent = "—"; }
              tr.appendChild(td);
            });
            tbody.appendChild(tr);
          });
        });
        table.appendChild(tbody);
        area.appendChild(table);
      }
      area.appendChild(T.macronBar(area));
      S.setCheckEnabled(false);
      if (cells.length) cells[0].input.focus();
    },
    canCheck: function () { return cells.some(function (c) { return c.input.value.trim() !== ""; }); },
    check: function () {
      var wrong = [], marks = [];
      cells.forEach(function (c) {
        var ok = T.grade(c.input, c.expected);
        marks.push({ key: c.key, right: ok });
        if (!ok) wrong.push({ label: c.label, typed: c.input.value, correct: c.expected[0] });
      });
      var n = cells.length, right = n - wrong.length;
      var verdict = wrong.length === 0
        ? (n === 1 ? "Correct!" : "All " + n + " forms right.")
        : (n === 1 ? "Not quite." : right + " of " + n + " forms right.");
      return { right: wrong.length === 0, verdict: verdict, wrong: wrong, marks: marks, total: n, feedback: [] };
    },
    // Missed list: every cell graded, right or wrong, so a missed cell of a
    // synopsis comes back as a single form.
    formKeys: function (item, result) { return result.marks || []; },
    fromMissed: function (key) {
      var e = null;
      verbs.forEach(function (v) { if (!e && v.lemma === key.lemma) e = v; });
      if (!e || tensesFor(key.mood).indexOf(key.tense) < 0 || L.verbVoices(e).indexOf(key.voice) < 0) return null;
      // An infinitive or participle is the same in every person and number.
      var person = key.person == null ? "3" : String(key.person), number = key.number == null ? "sg" : key.number;
      if (L.PERSONS.indexOf(person) < 0 || L.NUMBERS.indexOf(number) < 0) return null;
      var cell = L.synopsisCell(e, key.mood, key.tense, key.voice, person, number);
      return cell ? { entry: e, person: person, number: number, mood: key.mood, tense: key.tense, voice: key.voice, expected: cell } : null;
    },
    missedRoundSize: function () { return 10; }, // single forms, whatever the mode
    review: function (item, result, li) {
      var p = S.make("p", "missed-sentence"); p.setAttribute("lang", "la");
      p.textContent = entryText(item.entry);
      li.appendChild(p);
      if (whoSingle(item)) li.appendChild(S.make("p", "missed-parse", whoSingle(item)));
      var ul = S.make("ul", "missed-cells");
      result.wrong.forEach(function (w) {
        var c = S.make("li");
        c.appendChild(document.createTextNode(w.label + ": "));
        var b = S.make("b", null, T.spell(w.correct)); b.setAttribute("lang", "la");
        c.appendChild(b);
        if (w.typed.trim()) c.appendChild(document.createTextNode(" (you wrote " + w.typed.trim() + ")"));
        else c.appendChild(document.createTextNode(" (left blank)"));
        ul.appendChild(c);
      });
      li.appendChild(ul);
    }
  };

  // A cell from the engine is {form, accept}; grading takes a list.
  function expectedList(cell) { return [cell.form].concat(cell.accept || []); }
  function choice(type, name, value, text, checked) {
    var label = S.make("label", "choice");
    var input = S.make("input"); input.type = type; input.name = name; input.value = value; input.checked = !!checked;
    label.appendChild(input); label.appendChild(S.make("span", null, text));
    return label;
  }

  window.LatinPractice.register(game);
})();
