// Game 1: the parsing drill. Reads items.json (sentences with one target
// word each); the student says noun or verb, then parses it with chips.
(function () {
  "use strict";

  var ROUND_SIZE = 10;

  // Field order and allowed values. The validator (tools/validate-items.js)
  // checks items.json against these same lists.
  var FIELDS = {
    noun: [
      { key: "case", label: "Case", options: ["nom", "gen", "dat", "acc", "abl", "voc"] },
      { key: "number", label: "Number", options: ["sg", "pl"] },
      { key: "gender", label: "Gender", options: ["m", "f", "n"] },
      { key: "use", label: "Use", dependsOn: { case: "*" }, optionsBy: "case", options: {
        nom: ["subject", "predicate nominative"],
        gen: ["possession"],
        dat: ["indirect object"],
        acc: ["direct object", "accusative of place to which", "accusative of time (post/ante)"],
        abl: ["ablative of means", "ablative of agent", "ablative of accompaniment",
              "ablative of place where", "ablative of place from which", "ablative of time when"],
        voc: ["vocative/direct address"]
      } }
    ],
    verb: [
      { key: "person", label: "Person", options: ["1", "2", "3"] },
      { key: "number", label: "Number", options: ["sg", "pl"] },
      { key: "tense", label: "Tense", options: ["present", "imperfect", "future", "perfect", "pluperfect", "future perfect"] },
      { key: "voice", label: "Voice", options: ["active", "passive"] },
      { key: "mood", label: "Mood", options: ["indicative", "imperative", "subjunctive"] },
      { key: "clause", label: "Clause", dependsOn: { mood: "subjunctive" }, options: [
        "purpose", "result", "indirect command", "indirect question",
        "cum-circumstantial", "cum-causal", "cum-concessive"
      ] }
    ]
  };
  var DISPLAY = { "1": "1st", "2": "2nd", "3": "3rd" };
  // In the Use row the case is already known, so drop the "ablative of" prefix.
  var USE_DISPLAY = { "accusative of place to which": "place to which", "accusative of time (post/ante)": "time (post/ante)", "vocative/direct address": "direct address" };
  Object.keys(FIELDS.noun[3].options).forEach(function (c) {
    FIELDS.noun[3].options[c].forEach(function (u) {
      if (!USE_DISPLAY[u]) USE_DISPLAY[u] = u.replace(/^ablative of /, "");
    });
  });

  var ctx, S, items = [];
  var ui = {}; // per-item nodes: sentence, prompt, typeRow, fields
  var picks = {}, phase = "type";

  function display(v) { return DISPLAY[String(v)] || String(v); }
  function wordsOf(s) { return s.trim().split(/\s+/); }

  // Sentence with the target word(s) underlined. Multi-word targets
  // (e.g. "victī sunt") underline each word from target_index on.
  function renderSentence(container, item) {
    S.clear(container);
    var words = wordsOf(item.sentence);
    var span = wordsOf(item.target).length;
    words.forEach(function (w, i) {
      if (i > 0) container.appendChild(document.createTextNode(" "));
      if (i >= item.target_index && i < item.target_index + span) {
        container.appendChild(S.make("span", "drill-target", w));
      } else {
        container.appendChild(document.createTextNode(w));
      }
    });
  }

  function fieldsFor(item) { return FIELDS[item.type]; }
  function fieldApplies(field, p) {
    if (!field.dependsOn) return true;
    for (var k in field.dependsOn) {
      if (field.dependsOn[k] === "*" ? p[k] == null : p[k] !== field.dependsOn[k]) return false;
    }
    return true;
  }
  function optionsFor(field, p) {
    if (!field.optionsBy) return field.options;
    return field.options[p[field.optionsBy]] || [];
  }
  function displayOption(field, v) { return field.key === "use" ? (USE_DISPLAY[v] || v) : display(v); }
  function correctHas(field, item) { return !field.dependsOn || item.parse[field.key] != null; }
  function parseText(item) {
    var parts = fieldsFor(item)
      .filter(function (f) { return item.parse[f.key] != null; })
      .map(function (f) { return display(item.parse[f.key]); });
    return item.type + " · " + parts.join(" · ");
  }

  // ---------- play ----------
  function buildFieldRows(item) {
    S.clear(ui.fields);
    fieldsFor(item).forEach(function (field) {
      var row = S.make("div", "option-row");
      row.setAttribute("role", "group");
      row.setAttribute("aria-label", field.label);
      row.setAttribute("data-field", field.key);
      row.hidden = !fieldApplies(field, picks);
      var label = S.make("div", "option-label");
      label.appendChild(S.make("span", null, field.label));
      label.appendChild(S.make("span", "row-result"));
      row.appendChild(label);
      var chips = S.make("div", "option-chips");
      fillChips(chips, field, optionsFor(field, picks));
      row.appendChild(chips);
      ui.fields.appendChild(row);
    });
  }
  function fillChips(chips, field, options) {
    S.clear(chips);
    options.forEach(function (opt) {
      var b = S.make("button", "chip", displayOption(field, opt));
      b.type = "button";
      b.setAttribute("data-value", opt);
      b.setAttribute("aria-pressed", "false");
      chips.appendChild(b);
    });
  }
  function allPicked(item) {
    return fieldsFor(item).every(function (f) { return !fieldApplies(f, picks) || picks[f.key] != null; });
  }

  function onTypePick(e, item) {
    var btn = e.target.closest(".chip[data-type]");
    if (!btn || phase !== "type") return;
    var picked = btn.getAttribute("data-type");
    if (picked === item.type) {
      btn.className = "chip is-right"; btn.setAttribute("aria-pressed", "true");
      ui.typeRow.querySelectorAll(".chip").forEach(function (b) { b.disabled = true; });
      phase = "fields";
      ui.prompt.textContent = "Right, a " + item.type + ". Now parse it.";
      buildFieldRows(item);
      S.setCheckEnabled(false);
    } else {
      btn.className = "chip is-wrong";
      ui.typeRow.querySelectorAll(".chip").forEach(function (b) {
        b.disabled = true;
        if (b.getAttribute("data-type") === item.type) b.className = "chip is-answer";
      });
      phase = "done";
      S.finish(false, item, { right: false, verdict: "Not quite. It's a " + item.type + ".", feedback: feedbackNodes(item) });
    }
  }
  function onFieldPick(e, item) {
    var btn = e.target.closest(".chip[data-value]");
    if (!btn || phase !== "fields") return;
    var row = btn.closest(".option-row");
    var key = row.getAttribute("data-field");
    row.querySelectorAll(".chip").forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
    picks[key] = btn.getAttribute("data-value");
    // Show/hide dependent rows (the clause row after "subjunctive") and
    // refresh rows whose options depend on this pick (Use after case).
    fieldsFor(item).forEach(function (field) {
      if (!field.dependsOn) return;
      var r = ui.fields.querySelector('[data-field="' + field.key + '"]');
      var applies = fieldApplies(field, picks);
      r.hidden = !applies;
      if (field.optionsBy === key) {
        delete picks[field.key];
        fillChips(r.querySelector(".option-chips"), field, optionsFor(field, picks));
      } else if (!applies) {
        delete picks[field.key];
        r.querySelectorAll(".chip").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
      }
    });
    S.setCheckEnabled(allPicked(item));
  }
  function feedbackNodes(item) {
    return [S.make("p", "parse-line", item.target + ": " + parseText(item)), S.make("p", null, item.explanation)];
  }

  var game = {
    id: "parse",
    data: ["items"],
    storageKey: "lubertlatin.practice.filters",
    defaults: { types: "both" },
    hideCheckUntilReady: true,

    setup: function (c) {
      ctx = c; S = c.shell;
      items = (Array.isArray(c.data.items) ? c.data.items : []).filter(function (it) { return it && FIELDS[it.type] && it.parse; });
      c.area.addEventListener("click", function (e) {
        var item = game.currentItem;
        if (!item) return;
        if (e.target.closest("#type-row")) onTypePick(e, item);
        else if (e.target.closest("#fields")) onFieldPick(e, item);
      });
    },
    lessonBounds: function () {
      var min = Infinity, max = -Infinity;
      items.forEach(function (it) {
        var l = S.lessonOf(it);
        if (l < min) min = l;
        if (l > max) max = l;
      });
      return { min: min, max: max };
    },
    restore: function (saved) {
      if (["noun", "verb", "both"].indexOf(saved.types) >= 0) ctx.settings.types = saved.types;
    },
    renderStart: function (options) {
      var fs = S.make("fieldset", "drill-fieldset");
      fs.appendChild(S.make("legend", null, "Practice"));
      var row = S.make("div", "choice-row");
      [["noun", "Nouns"], ["verb", "Verbs"], ["both", "Both"]].forEach(function (o) {
        var label = S.make("label", "choice");
        var input = S.make("input"); input.type = "radio"; input.name = "types"; input.value = o[0];
        input.checked = ctx.settings.types === o[0];
        label.appendChild(input); label.appendChild(S.make("span", null, o[1]));
        row.appendChild(label);
      });
      fs.appendChild(row);
      options.appendChild(fs);
    },
    readStart: function (form) {
      var checked = form.querySelector("input[name=types]:checked");
      ctx.settings.types = checked ? checked.value : "both";
    },
    // Links for assignments (js/practice-link.js): type=noun | verb | both
    fromLink: function (p, K) { return { types: K.oneOf(p.type, ["noun", "verb", "both"]) }; },
    toLink: function (s) { return [["type", s.types]]; },
    // Result summary (the line a student can send a teacher): the settings in words.
    summary: function () {
      return [{ noun: "Nouns", verb: "Verbs", both: "Nouns and verbs" }[ctx.settings.types]];
    },
    pool: function () {
      return items.filter(function (it) {
        // through Lesson N, or Lesson N only: by the lesson the sentence is first usable
        return S.inLesson(S.lessonOf(it)) && (ctx.settings.types === "both" || it.type === ctx.settings.types);
      });
    },
    poolNote: function (n) {
      var what = ctx.settings.types === "both" ? "words" : ctx.settings.types + "s";
      var only = ctx.settings.lessonOnly;
      if (n === 0) {
        return only ? "No " + what + " become usable in " + S.lessonName() + ". Pick another lesson."
          : "No " + what + " through Lesson " + ctx.settings.lesson + " yet. Raise the lesson number.";
      }
      if (only) what = (n === 1 ? what.replace(/s$/, "") : what) + " first usable in " + S.lessonName();
      else what += " to draw from";
      return n + " " + what + (n < ROUND_SIZE ? " (a round will be " + n + " long)" : "") + ".";
    },
    roundSize: function () { return ROUND_SIZE; },
    // Random, no repeats, and no two items from the same sentence when
    // the pool has enough distinct sentences; otherwise fill from the rest.
    buildRound: function (list, size) {
      var shuffled = S.shuffle(list.slice());
      var picked = [], used = {};
      shuffled.forEach(function (it) {
        if (picked.length < size && !used[it.sentence]) { picked.push(it); used[it.sentence] = true; }
      });
      if (picked.length < size) {
        shuffled.forEach(function (it) { if (picked.length < size && picked.indexOf(it) < 0) picked.push(it); });
      }
      return S.shuffle(picked);
    },

    begin: function (item, area) {
      game.currentItem = item;
      phase = "type"; picks = {};
      ui.sentence = S.make("p", "drill-sentence"); ui.sentence.setAttribute("lang", "la"); ui.sentence.id = "sentence";
      renderSentence(ui.sentence, item);
      ui.prompt = S.make("p", "drill-prompt", "Is the underlined word a noun or a verb?");
      ui.typeRow = S.make("div", "option-row option-row-type"); ui.typeRow.id = "type-row";
      ui.typeRow.setAttribute("role", "group"); ui.typeRow.setAttribute("aria-label", "Noun or verb");
      var chips = S.make("div", "option-chips");
      [["noun", "Noun"], ["verb", "Verb"]].forEach(function (t) {
        var b = S.make("button", "chip", t[1]); b.type = "button"; b.setAttribute("data-type", t[0]); chips.appendChild(b);
      });
      ui.typeRow.appendChild(chips);
      ui.fields = S.make("div"); ui.fields.id = "fields";
      area.appendChild(ui.sentence); area.appendChild(ui.prompt); area.appendChild(ui.typeRow); area.appendChild(ui.fields);
    },
    canCheck: function () { return phase === "fields" && allPicked(game.currentItem); },
    check: function (item) {
      var allRight = true;
      fieldsFor(item).forEach(function (field) {
        var row = ui.fields.querySelector('[data-field="' + field.key + '"]');
        var result = row.querySelector(".row-result");
        var expected = correctHas(field, item) ? String(item.parse[field.key]) : null;
        var picked = picks[field.key] != null ? String(picks[field.key]) : null;
        if (expected == null && picked == null) return; // clause row not involved
        row.hidden = false;
        var right = expected === picked;
        if (!right) allRight = false;
        row.querySelectorAll(".chip").forEach(function (b) {
          b.disabled = true;
          var v = b.getAttribute("data-value");
          if (v === picked) b.className = right ? "chip is-right" : "chip is-wrong";
          else if (v === expected) b.className = "chip is-answer";
        });
        result.className = "row-result " + (right ? "is-right" : "is-wrong");
        if (right) result.textContent = "✓";
        else if (expected == null) result.textContent = "Not needed: the mood is " + display(item.parse.mood) + ".";
        else result.textContent = "Correct: " + displayOption(field, expected);
      });
      phase = "done";
      return { right: allRight, verdict: allRight ? "Correct!" : "Not quite.", feedback: feedbackNodes(item) };
    },
    // Missed list: a sentence is stored by its item id and asked again as it was.
    missedNoun: ["word", "words"],
    formKeys: function (item, result) {
      return item.id == null ? [] : [{ key: { id: item.id }, right: !!result.right }];
    },
    fromMissed: function (key) {
      for (var i = 0; i < items.length; i++) if (items[i].id === key.id) return items[i];
      return null;
    },
    review: function (item, result, li) {
      var s = S.make("p", "missed-sentence"); s.setAttribute("lang", "la");
      renderSentence(s, item);
      li.appendChild(s);
      var p = S.make("p", "missed-parse");
      p.appendChild(S.make("b", null, item.target));
      p.appendChild(document.createTextNode(" — " + parseText(item)));
      li.appendChild(p);
    }
  };

  window.LatinPractice.register(game);
})();
