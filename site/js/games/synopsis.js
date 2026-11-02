// Game 3: verb synopsis (typed). Reads vocab.json; forms come from the rules
// engine in latin-forms.js (hand tables for the irregulars). Full mode shows
// a Henle-style synopsis grid for one person/number; single-form mode asks
// for one form at a time. The curriculum's grammar schedule decides which
// conjugations, tenses, moods and voices are open at the chosen lesson.
(function () {
  "use strict";

  var L = window.LatinForms;
  var TENSE_SHORT = { present: "Pres.", imperfect: "Impf.", future: "Fut.", perfect: "Perf.", pluperfect: "Plupf.", "future perfect": "Fut. perf." };
  var VOICE_HEAD = { active: "Active", passive: "Passive", deponent: "Deponent" };

  var ctx, S, T, verbs = [], grammar = {};
  var cells = [];

  function lesson() { return ctx.settings.lesson; }
  function entryText(e) { return T.spell(L.verbEntryText(e)); }
  function who(item) { return L.PERSON_NAMES[item.person] + " " + L.NUMBER_NAMES[item.number]; }
  // Deponent columns follow the passive schedule.
  function scheduleVoice(v) { return v === "deponent" ? "passive" : v; }
  function tenseOpen(mood, voice, tense) {
    var g = grammar.verbs && grammar.verbs[mood] && grammar.verbs[mood][scheduleVoice(voice)];
    if (!g) return mood === "indicative"; // no schedule: indicative open, subjunctive closed
    return g[tense] != null && g[tense] <= lesson();
  }
  function conjugationOpen(c) {
    var g = grammar.verbs && grammar.verbs.conjugation;
    return !g || g[c] == null || g[c] <= lesson();
  }
  function moodOpen(mood) {
    return ["active", "passive"].some(function (v) {
      return L.IND_TENSES.concat(L.SUBJ_TENSES).some(function (t) { return tenseOpen(mood, v, t); });
    });
  }
  function verbsThrough() {
    return verbs.filter(function (v) { return S.lessonOf(v) <= lesson() && conjugationOpen(String(v.conjugation)); });
  }
  function moods() { return ctx.settings.subjunctive && moodOpen("subjunctive") ? ["indicative", "subjunctive"] : ["indicative"]; }
  function tensesFor(mood) { return mood === "indicative" ? L.IND_TENSES : L.SUBJ_TENSES; }
  // Voice columns shown for a verb: its own voices, minus any not yet taught.
  function columnsFor(entry) {
    return L.verbVoices(entry).filter(function (v) {
      return moods().some(function (m) { return tensesFor(m).some(function (t) { return tenseOpen(m, v, t); }); });
    });
  }
  function cellText(mood, tense, voice) {
    return tense + (voice === "deponent" ? "" : " " + voice) + " " + mood;
  }

  var game = {
    id: "synopsis",
    data: ["vocab"],
    typed: true,
    storageKey: "lubertlatin.practice.synopsis",
    defaults: { mode: "synopsis", subjunctive: true },

    setup: function (c) {
      ctx = c; S = c.shell; T = S.typed;
      grammar = (c.curriculumInfo && c.curriculumInfo.grammar) || {};
      verbs = (Array.isArray(c.data.vocab) ? c.data.vocab : []).filter(function (e) {
        return e && e.pos === "verb" && (!e.curriculum || e.curriculum === c.curriculum);
      });
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
      if (typeof saved.subjunctive === "boolean") ctx.settings.subjunctive = saved.subjunctive;
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
      fs2.appendChild(row2);
      fs2.appendChild(S.make("p", "fine", "Tenses, moods and voices appear once the chosen lesson has taught them."));
      options.appendChild(fs2);
    },
    updateStart: function (form) {
      var box = form.querySelector("input[name=subjunctive]");
      var open = moodOpen("subjunctive");
      box.disabled = !open;
      box.parentNode.classList.toggle("is-unavailable", !open);
    },
    readStart: function (form) {
      var m = form.querySelector("input[name=mode]:checked");
      ctx.settings.mode = m ? m.value : "synopsis";
      var s = form.querySelector("input[name=subjunctive]");
      ctx.settings.subjunctive = !!(s && s.checked);
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
      for (var tries = 0; out.length < size && tries < size * 20; tries++) {
        var e = pool[tries % pool.length];
        var cols = columnsFor(e), mood = S.pick(moods()), tense = S.pick(tensesFor(mood)), voice = S.pick(cols);
        if (!tenseOpen(mood, voice, tense)) continue;
        var set = L.conjugateSet(e, mood, tense, voice);
        if (!set) continue;
        var person = S.pick(L.PERSONS), number = S.pick(L.NUMBERS);
        var key = [e.lemma, mood, tense, voice, person, number].join("|");
        if (seen[key]) continue;
        seen[key] = true;
        out.push({ entry: e, person: person, number: number, mood: mood, tense: tense, voice: voice,
                   expected: set[L.personIndex(person, number)] });
      }
      return out;
    },

    begin: function (item, area) {
      cells = [];
      var head = S.make("p", "entry-line"); head.setAttribute("lang", "la");
      head.textContent = entryText(item.entry);
      area.appendChild(head);
      var sub = S.make("p", "entry-gloss");
      sub.appendChild(S.make("b", null, who(item)));
      if (item.entry.english) sub.appendChild(document.createTextNode(" · " + item.entry.english));
      if (L.hasFlag(item.entry, "deponent")) sub.appendChild(document.createTextNode(" · deponent"));
      area.appendChild(sub);

      if (item.mood) {
        area.appendChild(S.make("p", "drill-prompt", "Give the " + cellText(item.mood, item.tense, item.voice) + ", " + who(item) + "."));
        var wrap = S.make("div", "single-form");
        var inp = T.input(cellText(item.mood, item.tense, item.voice));
        wrap.appendChild(inp);
        area.appendChild(wrap);
        cells.push({ input: inp, expected: expectedList(item.expected), label: cellText(item.mood, item.tense, item.voice) });
      } else {
        area.appendChild(S.make("p", "drill-prompt", "Type every form for the " + who(item) + "." + (T.settings.strict ? " Macrons count." : " Macrons are optional.")));
        var cols = columnsFor(item.entry);
        var idx = L.personIndex(item.person, item.number);
        var table = S.make("table", "form-grid synopsis-grid");
        var thead = S.make("thead"), hr = S.make("tr");
        hr.appendChild(S.make("th", null, ""));
        cols.forEach(function (v) { hr.appendChild(S.make("th", null, VOICE_HEAD[v])); });
        thead.appendChild(hr); table.appendChild(thead);
        var tbody = S.make("tbody");
        moods().forEach(function (mood) {
          var tenses = tensesFor(mood).filter(function (t) { return cols.some(function (v) { return tenseOpen(mood, v, t); }); });
          if (!tenses.length) return;
          var sec = S.make("tr", "grid-section");
          var sth = S.make("th", null, mood.charAt(0).toUpperCase() + mood.slice(1)); sth.colSpan = cols.length + 1; sth.setAttribute("scope", "colgroup");
          sec.appendChild(sth); tbody.appendChild(sec);
          tenses.forEach(function (t) {
            var tr = S.make("tr");
            var th = S.make("th", null, TENSE_SHORT[t]); th.setAttribute("scope", "row"); th.title = t;
            tr.appendChild(th);
            cols.forEach(function (v) {
              var td = S.make("td");
              var set = tenseOpen(mood, v, t) ? L.conjugateSet(item.entry, mood, t, v) : null;
              if (set) {
                var inp = T.input(cellText(mood, t, v));
                td.appendChild(inp);
                cells.push({ input: inp, expected: expectedList(set[idx]), label: cellText(mood, t, v) });
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
      var wrong = [];
      cells.forEach(function (c) {
        if (!T.grade(c.input, c.expected)) wrong.push({ label: c.label, typed: c.input.value, correct: c.expected[0] });
      });
      var n = cells.length, right = n - wrong.length;
      var verdict = wrong.length === 0
        ? (n === 1 ? "Correct!" : "All " + n + " forms right.")
        : (n === 1 ? "Not quite." : right + " of " + n + " forms right.");
      return { right: wrong.length === 0, verdict: verdict, wrong: wrong, total: n, feedback: [] };
    },
    review: function (item, result, li) {
      var p = S.make("p", "missed-sentence"); p.setAttribute("lang", "la");
      p.textContent = entryText(item.entry);
      li.appendChild(p);
      li.appendChild(S.make("p", "missed-parse", who(item)));
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
