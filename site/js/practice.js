// Parsing drill for /practice. Loads /practice/items.json and runs
// 10-item rounds. Only the start-screen filters are stored (localStorage).
(function () {
  "use strict";

  var ROUND_SIZE = 10;
  var STORAGE_KEY = "lubertlatin.practice.filters";

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

  var root = document.getElementById("drill");
  if (!root) return;

  var el = {
    start: document.getElementById("screen-start"),
    play: document.getElementById("screen-play"),
    results: document.getElementById("screen-results"),
    message: document.getElementById("screen-message"),
    messageText: document.getElementById("message-text"),
    lessonRange: document.getElementById("lesson-range"),
    lessonNumber: document.getElementById("lesson-number"),
    lessonOutput: document.getElementById("lesson-output"),
    poolNote: document.getElementById("pool-note"),
    startButton: document.getElementById("start-button"),
    progress: document.getElementById("progress"),
    streak: document.getElementById("streak"),
    sentence: document.getElementById("sentence"),
    prompt: document.getElementById("prompt"),
    typeRow: document.getElementById("type-row"),
    fields: document.getElementById("fields"),
    feedback: document.getElementById("feedback"),
    check: document.getElementById("check-button"),
    next: document.getElementById("next-button"),
    score: document.getElementById("results-score"),
    resultsLine: document.getElementById("results-line"),
    missedBlock: document.getElementById("missed-block"),
    missedList: document.getElementById("missed-list"),
    again: document.getElementById("again-button"),
    settings: document.getElementById("settings-button")
  };

  var items = [];
  var minLesson = 1, maxLesson = 1;
  var filters = { types: "both", lesson: 1 };
  var game = null; // { round, index, correct, streak, missed, phase, picks }

  // ---------- helpers ----------
  function show(screen) {
    [el.start, el.play, el.results, el.message].forEach(function (s) { s.hidden = s !== screen; });
  }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function display(v) { return DISPLAY[String(v)] || String(v); }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function make(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function wordsOf(s) { return s.trim().split(/\s+/); }

  // Sentence with the target word(s) underlined. Multi-word targets
  // (e.g. "victī sunt") underline each word from target_index on.
  function renderSentence(container, item) {
    clear(container);
    var words = wordsOf(item.sentence);
    var span = wordsOf(item.target).length;
    words.forEach(function (w, i) {
      if (i > 0) container.appendChild(document.createTextNode(" "));
      if (i >= item.target_index && i < item.target_index + span) {
        container.appendChild(make("span", "drill-target", w));
      } else {
        container.appendChild(document.createTextNode(w));
      }
    });
  }

  function fieldsFor(item) { return FIELDS[item.type]; }
  function fieldApplies(field, picks) {
    if (!field.dependsOn) return true;
    for (var k in field.dependsOn) {
      if (field.dependsOn[k] === "*" ? picks[k] == null : picks[k] !== field.dependsOn[k]) return false;
    }
    return true;
  }
  // Options for a field; for the Use row they depend on the case picked.
  function optionsFor(field, picks) {
    if (!field.optionsBy) return field.options;
    return field.options[picks[field.optionsBy]] || [];
  }
  function displayOption(field, v) { return field.key === "use" ? (USE_DISPLAY[v] || v) : display(v); }
  function correctHas(field, item) {
    return !field.dependsOn || item.parse[field.key] != null;
  }
  function parseText(item) {
    var parts = fieldsFor(item)
      .filter(function (f) { return item.parse[f.key] != null; })
      .map(function (f) { return display(item.parse[f.key]); });
    return item.type + " · " + parts.join(" · ");
  }

  // ---------- filters / start screen ----------
  function loadFilters() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && typeof saved === "object") {
        if (["noun", "verb", "both"].indexOf(saved.types) >= 0) filters.types = saved.types;
        if (typeof saved.lesson === "number" && isFinite(saved.lesson)) filters.lesson = saved.lesson;
      }
    } catch (e) { /* no storage, or bad data: use defaults */ }
  }
  function saveFilters() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(filters)); } catch (e) { /* ignore */ }
  }
  function clampLesson(n) {
    n = Math.round(Number(n));
    if (!isFinite(n)) n = maxLesson;
    return Math.min(maxLesson, Math.max(minLesson, n));
  }
  function pool() {
    return items.filter(function (it) {
      return it.lesson <= filters.lesson && (filters.types === "both" || it.type === filters.types);
    });
  }
  function readStartForm() {
    var checked = el.start.querySelector("input[name=types]:checked");
    filters.types = checked ? checked.value : "both";
    filters.lesson = clampLesson(el.lessonNumber.value);
  }
  function syncStartForm() {
    var radio = el.start.querySelector("input[name=types][value=" + filters.types + "]");
    if (radio) radio.checked = true;
    el.lessonRange.value = filters.lesson;
    el.lessonNumber.value = filters.lesson;
    el.lessonOutput.textContent = filters.lesson;
    var n = pool().length;
    var what = filters.types === "both" ? "words" : filters.types + "s";
    if (n === 0) {
      el.poolNote.textContent = "No " + what + " through Lesson " + filters.lesson + " yet. Raise the lesson number.";
    } else {
      el.poolNote.textContent = n + " " + what + " to draw from" + (n < ROUND_SIZE ? " (a round will be " + n + " long)" : "") + ".";
    }
    el.startButton.disabled = n === 0;
  }
  function onStartChange() { readStartForm(); syncStartForm(); }

  // ---------- round building ----------
  // Random, no repeats, and no two items from the same sentence when
  // the pool has enough distinct sentences; otherwise fill from the rest.
  function buildRound(list) {
    var shuffled = shuffle(list.slice());
    var picked = [], used = {};
    shuffled.forEach(function (it) {
      if (picked.length < ROUND_SIZE && !used[it.sentence]) { picked.push(it); used[it.sentence] = true; }
    });
    if (picked.length < ROUND_SIZE) {
      shuffled.forEach(function (it) {
        if (picked.length < ROUND_SIZE && picked.indexOf(it) < 0) picked.push(it);
      });
    }
    return shuffle(picked);
  }

  function startRound() {
    game = { round: buildRound(pool()), index: 0, correct: 0, streak: 0, missed: [] };
    show(el.play);
    showItem();
  }

  // ---------- play ----------
  function current() { return game.round[game.index]; }

  function updateStatus() {
    el.progress.textContent = (game.index + 1) + " of " + game.round.length;
    el.streak.textContent = "Streak " + game.streak;
    el.streak.className = game.streak >= 3 ? "streak-hot" : "";
  }

  function showItem() {
    var item = current();
    game.phase = "type";
    game.picks = {};
    updateStatus();
    renderSentence(el.sentence, item);
    el.prompt.textContent = "Is the underlined word a noun or a verb?";
    el.typeRow.hidden = false;
    el.typeRow.querySelectorAll(".chip").forEach(function (b) {
      b.disabled = false; b.className = "chip"; b.removeAttribute("aria-pressed");
    });
    clear(el.fields);
    el.feedback.hidden = true; el.feedback.className = "feedback"; clear(el.feedback);
    el.check.hidden = true; el.check.disabled = true;
    el.next.hidden = true;
    el.sentence.focus && el.play.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function onTypePick(e) {
    var btn = e.target.closest(".chip[data-type]");
    if (!btn || game.phase !== "type") return;
    var item = current();
    var picked = btn.getAttribute("data-type");
    if (picked === item.type) {
      btn.className = "chip is-right"; btn.setAttribute("aria-pressed", "true");
      el.typeRow.querySelectorAll(".chip").forEach(function (b) { b.disabled = true; });
      game.phase = "fields";
      el.prompt.textContent = "Right, a " + item.type + ". Now parse it.";
      buildFieldRows(item);
      el.check.hidden = false;
      el.check.disabled = true;
    } else {
      btn.className = "chip is-wrong";
      el.typeRow.querySelectorAll(".chip").forEach(function (b) {
        b.disabled = true;
        if (b.getAttribute("data-type") === item.type) b.className = "chip is-answer";
      });
      finishItem(false, "Not quite. It's a " + item.type + ".", item);
    }
  }

  function buildFieldRows(item) {
    clear(el.fields);
    fieldsFor(item).forEach(function (field) {
      var row = make("div", "option-row");
      row.setAttribute("role", "group");
      row.setAttribute("aria-label", field.label);
      row.setAttribute("data-field", field.key);
      row.hidden = !fieldApplies(field, game.picks);
      var label = make("div", "option-label");
      label.appendChild(make("span", null, field.label));
      label.appendChild(make("span", "row-result"));
      row.appendChild(label);
      var chips = make("div", "option-chips");
      fillChips(chips, field, optionsFor(field, game.picks));
      row.appendChild(chips);
      el.fields.appendChild(row);
    });
  }
  function fillChips(chips, field, options) {
    clear(chips);
    options.forEach(function (opt) {
      var b = make("button", "chip", displayOption(field, opt));
      b.type = "button";
      b.setAttribute("data-value", opt);
      b.setAttribute("aria-pressed", "false");
      chips.appendChild(b);
    });
  }

  function onFieldPick(e) {
    var btn = e.target.closest(".chip[data-value]");
    if (!btn || game.phase !== "fields") return;
    var row = btn.closest(".option-row");
    var key = row.getAttribute("data-field");
    row.querySelectorAll(".chip").forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
    game.picks[key] = btn.getAttribute("data-value");
    // Show/hide dependent rows (the clause row after "subjunctive") and
    // refresh rows whose options depend on this pick (Use after case).
    fieldsFor(current()).forEach(function (field) {
      if (!field.dependsOn) return;
      var r = el.fields.querySelector('[data-field="' + field.key + '"]');
      var applies = fieldApplies(field, game.picks);
      r.hidden = !applies;
      if (field.optionsBy === key) {
        delete game.picks[field.key];
        fillChips(r.querySelector(".option-chips"), field, optionsFor(field, game.picks));
      } else if (!applies) {
        delete game.picks[field.key];
        r.querySelectorAll(".chip").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
      }
    });
    el.check.disabled = !allPicked();
  }

  function allPicked() {
    return fieldsFor(current()).every(function (f) {
      return !fieldApplies(f, game.picks) || game.picks[f.key] != null;
    });
  }

  function onCheck() {
    if (game.phase !== "fields" || !allPicked()) return;
    var item = current();
    var allRight = true;
    fieldsFor(item).forEach(function (field) {
      var row = el.fields.querySelector('[data-field="' + field.key + '"]');
      var result = row.querySelector(".row-result");
      var expected = correctHas(field, item) ? String(item.parse[field.key]) : null;
      var picked = game.picks[field.key] != null ? String(game.picks[field.key]) : null;
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
    el.check.hidden = true;
    finishItem(allRight, allRight ? "Correct!" : "Not quite.", item);
  }

  function finishItem(right, verdict, item) {
    game.phase = "done";
    if (right) { game.correct++; game.streak++; }
    else { game.streak = 0; game.missed.push(item); }
    updateStatus();
    clear(el.feedback);
    el.feedback.className = "feedback " + (right ? "is-right" : "is-wrong");
    el.feedback.appendChild(make("p", "verdict", verdict));
    el.feedback.appendChild(make("p", "parse-line", item.target + ": " + parseText(item)));
    el.feedback.appendChild(make("p", null, item.explanation));
    el.feedback.hidden = false;
    el.next.hidden = false;
    el.next.textContent = game.index + 1 < game.round.length ? "Next" : "See score";
    el.next.focus();
  }

  function onNext() {
    if (game.phase !== "done") return;
    game.index++;
    if (game.index < game.round.length) showItem();
    else showResults();
  }

  // ---------- results ----------
  function showResults() {
    var n = game.round.length;
    clear(el.score);
    el.score.appendChild(document.createTextNode(game.correct + " "));
    el.score.appendChild(make("small", null, "/ " + n));
    var pct = Math.round(100 * game.correct / n);
    el.resultsLine.textContent = game.correct === n
      ? "Perfect round. Optimē!"
      : pct + "% right. " + (game.missed.length === 1 ? "One to review." : game.missed.length + " to review.");
    clear(el.missedList);
    el.missedBlock.hidden = game.missed.length === 0;
    game.missed.forEach(function (item) {
      var li = make("li");
      var s = make("p", "missed-sentence"); s.setAttribute("lang", "la");
      renderSentence(s, item);
      li.appendChild(s);
      var p = make("p", "missed-parse");
      p.appendChild(make("b", null, item.target));
      p.appendChild(document.createTextNode(" — " + parseText(item)));
      li.appendChild(p);
      el.missedList.appendChild(li);
    });
    show(el.results);
    el.results.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  // ---------- wiring ----------
  el.start.addEventListener("change", onStartChange);
  el.lessonRange.addEventListener("input", function () { el.lessonNumber.value = el.lessonRange.value; onStartChange(); });
  el.lessonNumber.addEventListener("input", function () {
    if (el.lessonNumber.value === "") return;
    el.lessonRange.value = clampLesson(el.lessonNumber.value); onStartChange();
  });
  el.start.addEventListener("submit", function (e) {
    e.preventDefault();
    readStartForm(); syncStartForm(); saveFilters();
    if (pool().length) startRound();
  });
  el.typeRow.addEventListener("click", onTypePick);
  el.fields.addEventListener("click", onFieldPick);
  el.check.addEventListener("click", onCheck);
  el.next.addEventListener("click", onNext);
  el.again.addEventListener("click", startRound);
  el.settings.addEventListener("click", function () { syncStartForm(); show(el.start); });

  // ---------- load ----------
  fetch(root.getAttribute("data-items-url"), { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function (data) {
      if (!Array.isArray(data) || !data.length) throw new Error("No items");
      items = data.filter(function (it) { return it && FIELDS[it.type] && it.parse; });
      minLesson = Infinity; maxLesson = -Infinity;
      items.forEach(function (it) {
        if (it.lesson < minLesson) minLesson = it.lesson;
        if (it.lesson > maxLesson) maxLesson = it.lesson;
      });
      el.lessonRange.min = el.lessonNumber.min = minLesson;
      el.lessonRange.max = el.lessonNumber.max = maxLesson;
      filters.lesson = maxLesson; // default: highest lesson in the file
      loadFilters();
      filters.lesson = clampLesson(filters.lesson);
      syncStartForm();
      show(el.start);
    })
    .catch(function (err) {
      el.messageText.textContent = "The sentences couldn't be loaded. Please refresh the page and try again.";
      if (window.console) console.error("practice: ", err);
    });
})();
