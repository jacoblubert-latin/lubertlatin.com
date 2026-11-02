// Game 2: decline a noun (typed). Reads vocab.json; forms come from the
// rules engine in latin-forms.js. Full-table mode shows a case × number
// grid; single-form mode asks for one form at a time.
(function () {
  "use strict";

  var L = window.LatinForms;
  var ROWS = ["nom", "gen", "dat", "acc", "abl"];
  var SHORT = { nom: "Nom.", gen: "Gen.", dat: "Dat.", acc: "Acc.", abl: "Abl.", voc: "Voc." };

  var ctx, S, T, nouns = [], grammar = {};
  var cells = []; // current item: [{ input, expected, label }]

  function lesson() { return ctx.settings.lesson; }
  function cases() { return ctx.settings.vocative ? ROWS.concat(["voc"]) : ROWS; }
  function entryText(e) { return T.spell(L.nounEntryText(e)); }
  function declensionTaught(d) {
    var g = grammar.nouns && grammar.nouns.declension;
    return !g || g[d] == null || g[d] <= lesson();
  }
  function nounsThrough() {
    return nouns.filter(function (n) { return S.lessonOf(n) <= lesson() && declensionTaught(String(n.declension)); });
  }
  function cellLabel(c, n) { return L.CASE_NAMES[c] + " " + L.NUMBER_NAMES[n]; }

  var game = {
    id: "decline",
    data: ["vocab"],
    typed: true,
    storageKey: "lubertlatin.practice.decline",
    defaults: { mode: "table", vocative: false, declensions: [] },

    setup: function (c) {
      ctx = c; S = c.shell; T = S.typed;
      grammar = (c.curriculumInfo && c.curriculumInfo.grammar) || {};
      nouns = (Array.isArray(c.data.vocab) ? c.data.vocab : []).filter(function (e) {
        return e && e.pos === "noun" && (!e.curriculum || e.curriculum === c.curriculum);
      });
      T.enterToAdvance(c.area, S.check);
      c.area.addEventListener("input", function () { S.setCheckEnabled(game.canCheck()); });
    },
    lessonBounds: function () {
      var min = Infinity;
      nouns.forEach(function (n) { if (S.lessonOf(n) < min) min = S.lessonOf(n); });
      return { min: min, max: ctx.curriculumInfo.lessons };
    },
    restore: function (saved) {
      if (saved.mode === "table" || saved.mode === "single") ctx.settings.mode = saved.mode;
      if (typeof saved.vocative === "boolean") ctx.settings.vocative = saved.vocative;
      if (Array.isArray(saved.declensions)) ctx.settings.declensions = saved.declensions.map(String);
    },

    renderStart: function (options) {
      var fs = S.make("fieldset", "drill-fieldset");
      fs.appendChild(S.make("legend", null, "Mode"));
      var row = S.make("div", "choice-row");
      [["table", "Full table"], ["single", "Single form"]].forEach(function (o) {
        row.appendChild(choice("radio", "mode", o[0], o[1], ctx.settings.mode === o[0]));
      });
      fs.appendChild(row);
      options.appendChild(fs);

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
    },
    readStart: function (form) {
      var m = form.querySelector("input[name=mode]:checked");
      ctx.settings.mode = m ? m.value : "table";
      var v = form.querySelector("input[name=vocative]");
      ctx.settings.vocative = !!(v && v.checked);
      var picked = [];
      form.querySelectorAll("input[name=declension]:checked").forEach(function (b) { picked.push(b.value); });
      ctx.settings.declensions = picked.length === L.DECLENSIONS.length ? [] : picked;
    },

    pool: function () {
      var sel = ctx.settings.declensions;
      return nounsThrough().filter(function (n) { return !sel.length || sel.indexOf(String(n.declension)) >= 0; });
    },
    poolNote: function (n) {
      if (n === 0) return "No nouns through Lesson " + lesson() + " with those declensions yet. Raise the lesson number or pick other declensions.";
      var size = game.roundSize();
      return n + " " + S.plural(n, "noun") + " to draw from" + (ctx.settings.mode === "table" && n < size ? " (a round will be " + n + " long)" : "") + ".";
    },
    roundSize: function () { return ctx.settings.mode === "table" ? 4 : 10; },
    buildRound: function (list, size) {
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
      if (item.entry.english) area.appendChild(S.make("p", "entry-gloss", item.entry.english));
      if (item["case"]) {
        area.appendChild(S.make("p", "drill-prompt", "Give the " + cellLabel(item["case"], item.number) + "."));
        var wrap = S.make("div", "single-form");
        var inp = T.input(cellLabel(item["case"], item.number));
        wrap.appendChild(inp);
        area.appendChild(wrap);
        cells.push({ input: inp, expected: item.expected, label: cellLabel(item["case"], item.number) });
      } else {
        area.appendChild(S.make("p", "drill-prompt", "Type every form." + (T.settings.strict ? " Macrons count." : " Macrons are optional.")));
        var d = L.declineNoun(item.entry);
        var table = S.make("table", "form-grid");
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
            if (d[n][c]) {
              var inp = T.input(cellLabel(c, n));
              td.appendChild(inp);
              cells.push({ input: inp, expected: d[n][c], label: cellLabel(c, n) });
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
          wrong.push({ label: c.label, typed: c.input.value, correct: Array.isArray(c.expected) ? c.expected[0] : c.expected });
        }
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

  function choice(type, name, value, text, checked) {
    var label = S.make("label", "choice");
    var input = S.make("input"); input.type = type; input.name = name; input.value = value; input.checked = !!checked;
    label.appendChild(input); label.appendChild(S.make("span", null, text));
    return label;
  }
  function ordinal(d) { return { "1": "1st", "2": "2nd", "3": "3rd", "4": "4th", "5": "5th" }[d] || d; }

  window.LatinPractice.register(game);
})();
