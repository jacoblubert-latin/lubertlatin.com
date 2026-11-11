// Game 2: decline a noun (typed). Reads vocab.json; forms come from the
// rules engine in latin-forms.js. Full-table mode shows a case × number
// grid; single-form mode asks for one form at a time. Noun + adjective
// mode pairs a noun with an adjective and asks for the phrase in each
// cell (either word order), as a full table or one form at a time.
(function () {
  "use strict";

  var L = window.LatinForms;
  var ROWS = ["nom", "gen", "dat", "acc", "abl"];
  var SHORT = { nom: "Nom.", gen: "Gen.", dat: "Dat.", acc: "Acc.", abl: "Abl.", voc: "Voc." };

  var ctx, S, T, nouns = [], adjectives = [], grammar = {};
  var cells = []; // current item: [{ input, expected, label, noun?, adj? }]

  function lesson() { return ctx.settings.lesson; }
  function cases() { return ctx.settings.vocative ? ROWS.concat(["voc"]) : ROWS; }
  function entryText(e) { return T.spell(L.nounEntryText(e)); }
  function adjText(e) { return T.spell(L.adjectiveEntryText(e)); }
  function declensionTaught(d) {
    var g = grammar.nouns && grammar.nouns.declension;
    return !g || g[d] == null || g[d] <= lesson();
  }
  function nounsThrough() {
    return nouns.filter(function (n) { return S.lessonOf(n) <= lesson() && declensionTaught(String(n.declension)); });
  }
  function cellLabel(c, n) { return L.CASE_NAMES[c] + " " + L.NUMBER_NAMES[n]; }

  // ---------- noun + adjective ----------
  function isPhrase() { return ctx.settings.mode === "phrase"; }
  // "table" or "single": how the items are asked, whatever the mode.
  function asking() { return isPhrase() ? ctx.settings.phraseForm : ctx.settings.mode; }
  // Lesson an adjective can first be drilled: the later of its own lesson
  // and the lesson its type is taught. null = never in this book.
  function adjLesson(a) {
    var start = L.adjectiveStartLesson(a, grammar);
    return start == null ? null : Math.max(S.lessonOf(a), start);
  }
  function adjectivesThrough() {
    return adjectives.filter(function (a) { var l = adjLesson(a); return l != null && l <= lesson(); });
  }
  function firstAdjectiveLesson() {
    var min = Infinity;
    adjectives.forEach(function (a) { var l = adjLesson(a); if (l != null && l < min) min = l; });
    return min;
  }
  function list(x) { return Array.isArray(x) ? x : [x]; }
  // Cells of a noun + adjective pair: [{case, number, noun, adj}] where
  // both words have a form (noun may be a list of accepted spellings).
  function phraseCells(noun, adj) {
    var d = L.declineNoun(noun), ad = L.declineAdjective(adj)[noun.gender], out = [];
    if (!ad) return out;
    L.NUMBERS.forEach(function (n) { cases().forEach(function (c) {
      var a = d[n][c] ? ad[n][c] : null;      // the same form L.agreeAdjective(adj, noun, c, n) gives
      if (a) out.push({ "case": c, number: n, noun: d[n][c], adj: a });
    }); });
    return out;
  }
  // How many cells have the two words ending differently (terra magna: 0;
  // nauta bonus, mīles fortis, flūmen magnum: most of them).
  function mismatch(noun, adj) {
    function tail(w) { return L.normalize(w).slice(-2); }
    return phraseCells(noun, adj).filter(function (p) { return tail(list(p.noun)[0]) !== tail(p.adj); }).length;
  }
  // An adjective for this noun: usually one whose endings differ from the
  // noun's, since that is the point of the exercise.
  function differs(noun, adj) { return mismatch(noun, adj) >= 2; }
  function pickAdjective(noun, pool) {
    var ok = pool.filter(function (a) { return phraseCells(noun, a).length > 0; });
    if (!ok.length) return null;
    var differing = ok.filter(function (a) { return differs(noun, a); });
    return S.pick(differing.length && Math.random() < 0.85 ? differing : ok);
  }
  // Nouns in the order a round takes them: about four in five are nouns
  // some open adjective differs from (at Lesson 7 that leaves out terra and
  // servus, whose only partners are magna and magnus).
  function nounOrder(list, adjs) {
    var mixed = [], plain = [];
    S.shuffle(list.slice()).forEach(function (n) {
      (adjs.some(function (a) { return differs(n, a); }) ? mixed : plain).push(n);
    });
    var out = [];
    while (mixed.length || plain.length) {
      var from = !plain.length || (mixed.length && Math.random() < 0.8) ? mixed : plain;
      out.push(from.pop());
    }
    return out;
  }
  // Every accepted answer for a cell, the one shown as correct first:
  // noun then adjective, or adjective then noun.
  function phraseAnswers(p) {
    var a = [], b = [];
    list(p.noun).forEach(function (n) { a.push(n + " " + p.adj); b.push(p.adj + " " + n); });
    return a.concat(b);
  }
  // For a wrong phrase: which of the two words is the wrong one, if the
  // other is right. Returns a short note or "".
  function whichWrong(typed, cell) {
    var raw = typed.trim().split(/\s+/).filter(Boolean);
    if (!raw.length || raw.length > 2) return "";
    function isNoun(x) { return T.same(x, cell.noun); }
    function isAdj(x) { return T.same(x, cell.adj); }
    var nounOk = raw.some(isNoun), adjOk = raw.some(isAdj);
    if (raw.length === 1) {
      if (nounOk) return "the adjective is missing";
      if (adjOk) return "the noun is missing";
      return "";
    }
    if (nounOk && !adjOk) return "the adjective is wrong";
    if (adjOk && !nounOk) return "the noun is wrong";
    return "";
  }

  var game = {
    id: "decline",
    data: ["vocab"],
    typed: true,
    storageKey: "lubertlatin.practice.decline",
    defaults: { mode: "table", phraseForm: "table", vocative: false, declensions: [] },

    setup: function (c) {
      ctx = c; S = c.shell; T = S.typed;
      grammar = (c.curriculumInfo && c.curriculumInfo.grammar) || {};
      var vocab = (Array.isArray(c.data.vocab) ? c.data.vocab : []).filter(function (e) {
        return e && (!e.curriculum || e.curriculum === c.curriculum);
      });
      nouns = vocab.filter(function (e) { return e.pos === "noun"; });
      adjectives = vocab.filter(function (e) { return L.isDeclinedAdjective(e); });
      T.enterToAdvance(c.area, S.check);
      c.area.addEventListener("input", function () { S.setCheckEnabled(game.canCheck()); });
    },
    lessonBounds: function () {
      var min = Infinity;
      nouns.forEach(function (n) { if (S.lessonOf(n) < min) min = S.lessonOf(n); });
      return { min: min, max: ctx.curriculumInfo.lessons };
    },
    restore: function (saved) {
      if (saved.mode === "table" || saved.mode === "single" || saved.mode === "phrase") ctx.settings.mode = saved.mode;
      if (saved.phraseForm === "table" || saved.phraseForm === "single") ctx.settings.phraseForm = saved.phraseForm;
      if (typeof saved.vocative === "boolean") ctx.settings.vocative = saved.vocative;
      if (Array.isArray(saved.declensions)) ctx.settings.declensions = saved.declensions.map(String);
    },

    renderStart: function (options) {
      var fs = S.make("fieldset", "drill-fieldset");
      fs.appendChild(S.make("legend", null, "Mode"));
      var row = S.make("div", "choice-row");
      [["table", "Full table"], ["single", "Single form"], ["phrase", "Noun + adjective"]].forEach(function (o) {
        row.appendChild(choice("radio", "mode", o[0], o[1], ctx.settings.mode === o[0]));
      });
      fs.appendChild(row);
      var note = S.make("p", "fine"); note.id = "phrase-note"; note.hidden = true;
      fs.appendChild(note);
      options.appendChild(fs);

      var fsp = S.make("fieldset", "drill-fieldset"); fsp.id = "phrase-options";
      fsp.appendChild(S.make("legend", null, "Noun + adjective"));
      var rowp = S.make("div", "choice-row");
      [["table", "Full table"], ["single", "Single form"]].forEach(function (o) {
        rowp.appendChild(choice("radio", "phraseForm", o[0], o[1], ctx.settings.phraseForm === o[0]));
      });
      fsp.appendChild(rowp);
      fsp.appendChild(S.make("p", "fine", "Type both words in each cell, in either order: mīles fortis or fortis mīles."));
      options.appendChild(fsp);

      var fs2 = S.make("fieldset", "drill-fieldset");
      fs2.appendChild(S.make("legend", null, "Declensions"));
      var row2 = S.make("div", "choice-row");
      L.DECLENSIONS.forEach(function (d) {
        var on = !ctx.settings.declensions.length || ctx.settings.declensions.indexOf(d) >= 0;
        row2.appendChild(choice("checkbox", "declension", d, ordinal(d), on));
      });
      fs2.appendChild(row2);
      fs2.appendChild(S.make("p", "fine", "Only declensions taught by the chosen lesson can be picked."));
      options.appendChild(fs2);

      var fs3 = S.make("fieldset", "drill-fieldset");
      fs3.appendChild(S.make("legend", null, "Rows"));
      var row3 = S.make("div", "choice-row");
      row3.appendChild(choice("checkbox", "vocative", "1", "Include vocative", ctx.settings.vocative));
      fs3.appendChild(row3);
      options.appendChild(fs3);
    },
    updateStart: function (form) {
      var have = {};
      nounsThrough().forEach(function (n) { have[String(n.declension)] = true; });
      form.querySelectorAll("input[name=declension]").forEach(function (b) {
        b.disabled = !have[b.value];
        b.parentNode.classList.toggle("is-unavailable", b.disabled);
      });
      // Noun + adjective opens with the first adjectives (Henle Lesson 7).
      var open = adjectivesThrough().length > 0;
      var radio = form.querySelector("input[name=mode][value=phrase]");
      if (radio) {
        radio.disabled = !open;
        radio.parentNode.classList.toggle("is-unavailable", !open);
      }
      var note = form.querySelector("#phrase-note");
      if (note) {
        note.hidden = open;
        note.textContent = open ? "" : phraseOpensAt();
      }
      var sub = form.querySelector("#phrase-options");
      if (sub) sub.hidden = !isPhrase();
    },
    readStart: function (form) {
      var m = form.querySelector("input[name=mode]:checked");
      ctx.settings.mode = m ? m.value : "table";
      var pf = form.querySelector("input[name=phraseForm]:checked");
      ctx.settings.phraseForm = pf ? pf.value : "table";
      var v = form.querySelector("input[name=vocative]");
      ctx.settings.vocative = !!(v && v.checked);
      var picked = [];
      form.querySelectorAll("input[name=declension]:checked").forEach(function (b) { picked.push(b.value); });
      ctx.settings.declensions = picked.length === L.DECLENSIONS.length ? [] : picked;
    },

    pool: function () {
      var sel = ctx.settings.declensions;
      var list = nounsThrough().filter(function (n) { return !sel.length || sel.indexOf(String(n.declension)) >= 0; });
      if (!isPhrase()) return list;
      var adjs = adjectivesThrough();
      if (!adjs.length) return [];
      // only nouns some open adjective can go with
      return list.filter(function (n) { return adjs.some(function (a) { return phraseCells(n, a).length > 0; }); });
    },
    poolNote: function (n) {
      if (isPhrase() && !adjectivesThrough().length) return phraseClosedNote();
      if (n === 0) return "No nouns through Lesson " + lesson() + " with those declensions yet. Raise the lesson number or pick other declensions.";
      var size = game.roundSize();
      var short = asking() === "table" && n < size ? " (a round will be " + n + " long)" : "";
      if (isPhrase()) {
        var a = adjectivesThrough().length;
        return n + " " + S.plural(n, "noun") + " and " + a + " " + S.plural(a, "adjective") + " to draw from" + short + ".";
      }
      return n + " " + S.plural(n, "noun") + " to draw from" + short + ".";
    },
    roundSize: function () { return asking() === "table" ? 4 : 10; },
    buildRound: function (list, size) {
      if (isPhrase()) return buildPhraseRound(list, size);
      if (ctx.settings.mode === "table") {
        return S.shuffle(list.slice()).slice(0, size).map(function (e) { return { entry: e }; });
      }
      // Single forms: every (noun, case, number) with a form, no repeats.
      var all = [];
      list.forEach(function (e) {
        var d = L.declineNoun(e);
        L.NUMBERS.forEach(function (n) { cases().forEach(function (c) {
          if (d[n][c]) all.push({ entry: e, "case": c, number: n, expected: d[n][c] });
        }); });
      });
      return S.shuffle(all).slice(0, size);
    },

    begin: function (item, area) {
      cells = [];
      var head = S.make("p", "entry-line", entryText(item.entry)); head.setAttribute("lang", "la");
      area.appendChild(head);
      if (item.adj) {
        var head2 = S.make("p", "entry-line", adjText(item.adj)); head2.setAttribute("lang", "la");
        area.appendChild(head2);
        var gloss = [item.entry.english, item.adj.english].filter(Boolean).join(" + ");
        if (gloss) area.appendChild(S.make("p", "entry-gloss", gloss));
      } else if (item.entry.english) area.appendChild(S.make("p", "entry-gloss", item.entry.english));
      var macrons = T.settings.strict ? " Macrons count." : " Macrons are optional.";
      // phrase cells by "number.case" (noun-only items have none)
      var byCell = {};
      if (item.adj) phraseCells(item.entry, item.adj).forEach(function (p) { byCell[p.number + "." + p["case"]] = p; });
      function addCell(parent, c, n, expected) {
        var inp = T.input(cellLabel(c, n));
        parent.appendChild(inp);
        var cell = { input: inp, expected: expected, label: cellLabel(c, n) };
        var p = byCell[n + "." + c];
        if (p) { cell.expected = phraseAnswers(p); cell.noun = p.noun; cell.adj = p.adj; }
        cells.push(cell);
      }
      if (item["case"]) {
        area.appendChild(S.make("p", "drill-prompt", item.adj
          ? "Give the " + cellLabel(item["case"], item.number) + " of the noun and adjective together."
          : "Give the " + cellLabel(item["case"], item.number) + "."));
        var wrap = S.make("div", "single-form");
        addCell(wrap, item["case"], item.number, item.expected);
        area.appendChild(wrap);
      } else {
        area.appendChild(S.make("p", "drill-prompt", item.adj
          ? "Type the noun and adjective together in every cell, in either order." + macrons
          : "Type every form." + macrons));
        var d = L.declineNoun(item.entry);
        var table = S.make("table", item.adj ? "form-grid phrase-grid" : "form-grid");
        var thead = S.make("thead"), hr = S.make("tr");
        hr.appendChild(S.make("th", null, ""));
        hr.appendChild(S.make("th", null, "Singular")); hr.appendChild(S.make("th", null, "Plural"));
        thead.appendChild(hr); table.appendChild(thead);
        var tbody = S.make("tbody");
        cases().forEach(function (c) {
          var tr = S.make("tr");
          var th = S.make("th", null, SHORT[c]); th.setAttribute("scope", "row");
          tr.appendChild(th);
          L.NUMBERS.forEach(function (n) {
            var td = S.make("td");
            if (item.adj) td.setAttribute("data-number", n === "sg" ? "Sg." : "Pl.");   // shown when the grid stacks on a phone
            if (item.adj ? byCell[n + "." + c] : d[n][c]) {
              addCell(td, c, n, d[n][c]);
            } else {
              td.className = "cell-none"; td.textContent = "—";
            }
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        area.appendChild(table);
      }
      area.appendChild(T.macronBar(area));
      S.setCheckEnabled(false);
      if (cells.length) cells[0].input.focus();
    },
    canCheck: function () { return cells.some(function (c) { return c.input.value.trim() !== ""; }); },
    check: function (item) {
      var wrong = [];
      cells.forEach(function (c) {
        if (!T.grade(c.input, c.expected)) {
          var w = { label: c.label, typed: c.input.value, correct: Array.isArray(c.expected) ? c.expected[0] : c.expected };
          if (c.adj) {
            w.note = whichWrong(c.input.value, c);
            if (w.note) c.input.parentNode.appendChild(S.make("span", "fine", capital(w.note) + "."));
          }
          wrong.push(w);
        }
      });
      var n = cells.length, right = n - wrong.length;
      var what = item.adj ? "phrases" : "forms";
      var verdict = wrong.length === 0
        ? (n === 1 ? "Correct!" : "All " + n + " " + what + " right.")
        : (n === 1 ? "Not quite." : right + " of " + n + " " + what + " right.");
      return { right: wrong.length === 0, verdict: verdict, wrong: wrong, total: n, feedback: [] };
    },
    review: function (item, result, li) {
      var p = S.make("p", "missed-sentence"); p.setAttribute("lang", "la");
      p.textContent = entryText(item.entry) + (item.adj ? " + " + adjText(item.adj) : "");
      li.appendChild(p);
      var ul = S.make("ul", "missed-cells");
      result.wrong.forEach(function (w) {
        var c = S.make("li");
        c.appendChild(document.createTextNode(w.label + ": "));
        var b = S.make("b", null, T.spell(w.correct)); b.setAttribute("lang", "la");
        c.appendChild(b);
        if (w.typed.trim()) c.appendChild(document.createTextNode(" (you wrote " + w.typed.trim() + (w.note ? "; " + w.note : "") + ")"));
        else c.appendChild(document.createTextNode(" (left blank)"));
        ul.appendChild(c);
      });
      li.appendChild(ul);
    }
  };

  // Short note under the Mode row while the mode is closed.
  function phraseOpensAt() {
    var first = firstAdjectiveLesson();
    if (!isFinite(first)) return "Noun + adjective isn't available: this textbook's vocabulary has no adjectives yet.";
    return "Noun + adjective opens at " + (ctx.curriculumInfo.lessonWord || "Lesson") + " " + first + ", with the first adjectives.";
  }
  // Pool note when the mode is picked but closed.
  function phraseClosedNote() {
    return phraseOpensAt() + (isFinite(firstAdjectiveLesson()) ? " Raise the lesson number or pick another mode." : "");
  }
  // Rounds for noun + adjective. Full table: one pair per noun. Single
  // form: one cell of a fresh pair each time, no repeats.
  function buildPhraseRound(list, size) {
    var adjs = adjectivesThrough(), out = [];
    if (ctx.settings.phraseForm === "table") {
      nounOrder(list, adjs).slice(0, size).forEach(function (e) {
        var a = pickAdjective(e, adjs);
        if (a) out.push({ entry: e, adj: a });
      });
      return out;
    }
    var seen = {}, order = [];
    for (var tries = 0; out.length < size && tries < size * 30 && list.length; tries++) {
      if (!order.length) order = nounOrder(list, adjs).reverse();
      var e = order.pop(), a = pickAdjective(e, adjs);
      if (!a) continue;
      var p = S.pick(phraseCells(e, a));
      var key = (e.id || e.lemma) + "|" + (a.id || a.lemma) + "|" + p.number + "." + p["case"];
      if (seen[key]) continue;
      seen[key] = true;
      out.push({ entry: e, adj: a, "case": p["case"], number: p.number, expected: phraseAnswers(p) });
    }
    return out;
  }

  function choice(type, name, value, text, checked) {
    var label = S.make("label", "choice");
    var input = S.make("input"); input.type = type; input.name = name; input.value = value; input.checked = !!checked;
    label.appendChild(input); label.appendChild(S.make("span", null, text));
    return label;
  }
  function ordinal(d) { return { "1": "1st", "2": "2nd", "3": "3rd", "4": "4th", "5": "5th" }[d] || d; }
  function capital(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  window.LatinPractice.register(game);
})();
