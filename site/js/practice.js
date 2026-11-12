// Shared shell for the /practice games: loads a curriculum's data files,
// runs the start screen (game options + lesson filter), rounds, scoring,
// streak and the end-of-round review. Each game (js/games/*.js) registers
// itself with LatinPractice.register() and only supplies the parts that
// differ: start-screen options, the pool, how an item is shown and graded,
// and how a missed item is reviewed. The lesson filter is the shell's: the
// slider sets ctx.settings.lesson. A game that sets lessonOnlyChoice: true
// (the vocabulary game) also gets a two-way choice beside it, which sets
// ctx.settings.lessonOnly ("Through Lesson N", the default, or "Lesson N
// only"); in every other game lessonOnly stays false. A game asks
// shell.inLesson(l) whether material that first opens at lesson l is in play. The shell also keeps the student's
// missed list (js/missed-list.js) and runs the two rounds made from it:
// "Drill what I missed" after a round and "Drill my missed list" on the
// start screen. A game takes part by supplying formKeys() and fromMissed().
// Settings can also arrive in the page's address (?lesson=5&mode=single) and
// be copied from the start screen as a link: js/practice-link.js, and
// "links for assignments" below. A game takes part by supplying fromLink()
// and toLink().
//
// Page markup: <div id="drill" data-game="parse" data-curriculum="henle" data-root="/practice/data/">
// Data files live at <root><curriculum>/<file>.json. Adding a textbook means
// adding a folder there (plus, later, a picker that sets data-curriculum).
(function () {
  "use strict";

  var root = document.getElementById("drill");
  if (!root) return;

  var gameId = root.getAttribute("data-game");
  var curriculumId = root.getAttribute("data-curriculum") || "henle";
  var dataRoot = root.getAttribute("data-root") || "/practice/data/";
  var TYPED_KEY = "lubertlatin.practice.typed";
  var MISSED_KEY = "lubertlatin.practice.missed";
  var M = window.LatinMissed;
  var K = window.LatinLink;

  var el = {
    start: document.getElementById("screen-start"),
    startOptions: document.getElementById("start-options"),
    startExtra: document.getElementById("start-extra"),
    play: document.getElementById("screen-play"),
    results: document.getElementById("screen-results"),
    message: document.getElementById("screen-message"),
    messageText: document.getElementById("message-text"),
    lessonLabel: document.getElementById("lesson-label-text"),
    lessonRange: document.getElementById("lesson-range"),
    lessonNumber: document.getElementById("lesson-number"),
    lessonOutput: document.getElementById("lesson-output"),
    poolNote: document.getElementById("pool-note"),
    startButton: document.getElementById("start-button"),
    linkNote: document.getElementById("link-note"),
    linkReset: document.getElementById("link-reset"),
    copyLink: document.getElementById("copy-link"),
    copyStatus: document.getElementById("copy-status"),
    copyUrl: document.getElementById("copy-url"),
    missedStart: document.getElementById("missed-start"),
    missedCount: document.getElementById("missed-count"),
    missedDrill: document.getElementById("missed-drill"),
    missedRule: document.getElementById("missed-rule"),
    missedClear: document.getElementById("missed-clear"),
    missedConfirm: document.getElementById("missed-confirm"),
    missedClearYes: document.getElementById("missed-clear-yes"),
    missedClearNo: document.getElementById("missed-clear-no"),
    progress: document.getElementById("progress"),
    streak: document.getElementById("streak"),
    area: document.getElementById("game-area"),
    feedback: document.getElementById("feedback"),
    check: document.getElementById("check-button"),
    next: document.getElementById("next-button"),
    score: document.getElementById("results-score"),
    resultsLine: document.getElementById("results-line"),
    missedBlock: document.getElementById("missed-block"),
    missedList: document.getElementById("missed-list"),
    resultShare: document.getElementById("result-share"),
    resultSummary: document.getElementById("result-summary"),
    resultCopy: document.getElementById("result-copy"),
    resultStatus: document.getElementById("result-status"),
    title: document.getElementById("practice-title"),
    retry: document.getElementById("retry-button"),
    again: document.getElementById("again-button"),
    settings: document.getElementById("settings-button")
  };

  // ---------- small DOM/utility helpers shared with the games ----------
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function make(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function readJSON(key) {
    try { var v = JSON.parse(localStorage.getItem(key)); return v && typeof v === "object" ? v : null; }
    catch (e) { return null; }
  }
  function writeJSON(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  // Lesson an item counts as in this curriculum: `available` wins over `lesson`.
  function lessonOf(thing) {
    if (thing.available && thing.available[curriculumId] != null) return thing.available[curriculumId];
    return thing.lesson;
  }
  function plural(n, one, many) { return n === 1 ? one : (many || one + "s"); }
  // The lesson filter as the games ask it. `l` is the lesson a piece of
  // material first opens (null = never): through Lesson N takes everything
  // that has opened by N, Lesson N only what opens at N itself.
  function inLesson(l) {
    if (l == null) return false;
    return ctx.settings.lessonOnly ? l === ctx.settings.lesson : l <= ctx.settings.lesson;
  }
  function lessonName(n) { return curriculum.lessonWord + " " + (n == null ? ctx.settings.lesson : n); }

  // ---------- typed-answer kit (used by the decline and synopsis games) ----------
  var typed = {
    settings: { strict: false, spelling: "henle" },
    load: function () {
      var s = readJSON(TYPED_KEY);
      if (s) {
        if (typeof s.strict === "boolean") typed.settings.strict = s.strict;
        if (s.spelling === "henle" || s.spelling === "classical") typed.settings.spelling = s.spelling;
      }
    },
    save: function () { writeJSON(TYPED_KEY, typed.settings); },
    // Start-screen controls: strict macrons + spelling convention.
    renderSettings: function (container) {
      var fs = make("fieldset", "drill-fieldset");
      fs.appendChild(make("legend", null, "Typing"));
      var row = make("div", "choice-row");
      row.appendChild(choice("checkbox", "strict", "1", "Strict macrons", typed.settings.strict));
      fs.appendChild(row);
      container.appendChild(fs);
      var fs2 = make("fieldset", "drill-fieldset");
      fs2.appendChild(make("legend", null, "Spelling"));
      var row2 = make("div", "choice-row");
      row2.appendChild(choice("radio", "spelling", "henle", "Henle (j)", typed.settings.spelling === "henle"));
      row2.appendChild(choice("radio", "spelling", "classical", "Classical (i)", typed.settings.spelling === "classical"));
      fs2.appendChild(row2);
      container.appendChild(fs2);
      var note = make("p", "fine", "Macrons are ignored unless strict macrons is on. i/j and u/v are always accepted either way.");
      container.appendChild(note);
    },
    readSettings: function (form) {
      var s = form.querySelector("input[name=strict]");
      typed.settings.strict = !!(s && s.checked);
      var sp = form.querySelector("input[name=spelling]:checked");
      typed.settings.spelling = sp ? sp.value : "henle";
      // (on a visit from a shared link they are saved with the rest, at Start)
      if (!link.active) typed.save();
    },
    spell: function (s) { return window.LatinForms ? window.LatinForms.spell(s, typed.settings.spelling) : s; },
    same: function (answer, expected) { return window.LatinForms.sameForm(answer, expected, typed.settings.strict); },
    // One text input for a form, with a hidden "correct answer" line.
    input: function (label) {
      var inp = make("input", "form-input");
      inp.type = "text"; inp.autocomplete = "off"; inp.autocapitalize = "none"; inp.spellcheck = false;
      inp.setAttribute("lang", "la");
      if (label) inp.setAttribute("aria-label", label);
      return inp;
    },
    // Grade one input against expected (string or [string]); marks it and
    // shows the correct form when wrong. Returns true/false.
    grade: function (inp, expected) {
      var main = Array.isArray(expected) ? expected[0] : expected;
      var right = typed.same(inp.value, expected);
      inp.disabled = true;
      inp.classList.add(right ? "is-right" : "is-wrong");
      inp.setAttribute("aria-invalid", right ? "false" : "true");
      var cell = inp.parentNode;
      if (!right) {
        var ans = make("span", "cell-answer", typed.spell(main));
        ans.setAttribute("lang", "la");
        cell.appendChild(ans);
      }
      return right;
    },
    // Macron buttons that insert into the input last focused inside `area`.
    macronBar: function (area) {
      var bar = make("div", "macron-bar");
      bar.setAttribute("role", "group"); bar.setAttribute("aria-label", "Insert a long vowel");
      var last = null;
      area.addEventListener("focusin", function (e) { if (e.target.matches("input.form-input")) last = e.target; });
      "āēīōū".split("").forEach(function (ch) {
        var b = make("button", "macron-key", ch);
        b.type = "button"; b.tabIndex = -1;
        b.addEventListener("mousedown", function (e) { e.preventDefault(); });
        b.addEventListener("click", function () {
          if (!last || last.disabled) return;
          var s = last.selectionStart, en = last.selectionEnd, v = last.value;
          last.value = v.slice(0, s) + ch + v.slice(en);
          last.setSelectionRange(s + 1, s + 1);
          last.focus();
          last.dispatchEvent(new Event("input", { bubbles: true }));
        });
        bar.appendChild(b);
      });
      return bar;
    },
    // Enter: move to the next empty input, or check when none is left.
    enterToAdvance: function (area, onCheck) {
      area.addEventListener("keydown", function (e) {
        if (e.key !== "Enter" || !e.target.matches("input.form-input")) return;
        e.preventDefault();
        var inputs = Array.prototype.slice.call(area.querySelectorAll("input.form-input:not([disabled])"));
        var i = inputs.indexOf(e.target);
        var next = inputs.slice(i + 1).concat(inputs.slice(0, i)).filter(function (x) { return !x.value.trim(); })[0];
        if (next) next.focus(); else onCheck();
      });
    }
  };
  // A pill-styled radio/checkbox like the start screen's existing choices.
  function choice(type, name, value, text, checked) {
    var label = make("label", "choice");
    var input = make("input"); input.type = type; input.name = name; input.value = value; input.checked = !!checked;
    label.appendChild(input);
    label.appendChild(make("span", null, text));
    return label;
  }

  // ---------- state ----------
  var game = null, ctx = null, data = {}, curriculum = null;
  var bounds = { min: 1, max: 1 };
  var scopeUi = null; // the "Through Lesson N" / "Lesson N only" radios: { through: {input, text}, only: {input, text} }
  var round = null; // { items, index, correct, streak, missed:[{item,result}], wrongKeys:[key], phase }

  function show(screen) {
    [el.start, el.play, el.results, el.message].forEach(function (s) { s.hidden = s !== screen; });
  }
  function clampLesson(n) {
    n = Math.round(Number(n));
    if (!isFinite(n)) n = bounds.max;
    return Math.min(bounds.max, Math.max(bounds.min, n));
  }

  // ---------- start screen ----------
  function loadSettings() {
    var saved = readJSON(game.storageKey);
    if (saved && typeof saved.lesson === "number" && isFinite(saved.lesson)) ctx.settings.lesson = saved.lesson;
    // Settings stored before the choice existed have no lessonOnly: "through".
    // So does every game that doesn't offer the choice, whatever is stored.
    ctx.settings.lessonOnly = !!(game.lessonOnlyChoice && saved && saved.lessonOnly === true);
    if (saved && game.restore) game.restore(saved);
  }
  // A shared link's settings are for that visit: nothing is saved until the
  // student changes a setting on the start screen.
  function saveSettings() {
    if (link.active && !link.touched) return;
    writeJSON(game.storageKey, ctx.settings); typed.save();
  }

  // ---------- links for assignments ----------
  // The page's query string, applied over the saved settings (defaults, then
  // localStorage, then the link) and never written back on load. What the
  // parameters are: js/practice-link.js.
  var link = {
    active: false,   // the link set at least one setting
    touched: false,  // ...and the student has since changed one
    start: false,    // start=1: begin the round straight away
    defaults: null   // { settings, typed } before anything was restored
  };
  function typedState() { return game.typed ? { strict: typed.settings.strict, spelling: typed.settings.spelling } : null; }
  function applyLink() {
    if (!K || !window.location.search) return;
    var res = K.read(window.location.search, game, bounds);
    link.start = res.start;
    if (!res.count) return;
    link.active = true;
    if (res.settings.lesson != null) ctx.settings.lesson = res.settings.lesson;
    if (typeof res.settings.lessonOnly === "boolean") ctx.settings.lessonOnly = res.settings.lessonOnly;
    if (game.restore) game.restore(res.settings);
    if (typeof res.typed.strict === "boolean") typed.settings.strict = res.typed.strict;
    if (res.typed.spelling) typed.settings.spelling = res.typed.spelling;
  }
  // The address of this page with the start screen's settings, leaving out
  // the ones still at their defaults.
  function linkUrl() {
    readStartForm();
    var query = K.build(game, { settings: ctx.settings, typed: typedState() }, link.defaults);
    return window.location.origin + window.location.pathname + (query ? "?" + query : "");
  }
  function copyLink() {
    var url = linkUrl();
    el.copyUrl.hidden = true;
    el.copyStatus.textContent = "";
    function copied() { el.copyStatus.textContent = "Link copied"; }
    // No clipboard (an old browser, a page not on https, permission refused):
    // show the link in a field, selected, to be copied by hand.
    function byHand() {
      el.copyUrl.value = url;
      el.copyUrl.hidden = false;
      el.copyUrl.focus(); el.copyUrl.select();
      el.copyUrl.scrollLeft = 0;   // show the start of the address, not its tail
      el.copyStatus.textContent = "Copy the link from the box.";
    }
    copyText(url, copied, byHand);
  }
  // Put text on the clipboard; `failed` runs where that can't be done.
  function copyText(text, done, failed) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, failed);
      else failed();
    } catch (e) { failed(); }
  }

  function readStartForm() {
    ctx.settings.lesson = clampLesson(el.lessonNumber.value);
    var scope = scopeUi && el.start.querySelector("input[name=lessonScope]:checked");
    ctx.settings.lessonOnly = !!scope && scope.value === "only";
    if (game.readStart) game.readStart(el.start);
    if (game.typed) typed.readSettings(el.start);
  }
  function syncStartForm() {
    el.lessonRange.value = ctx.settings.lesson;
    el.lessonNumber.value = ctx.settings.lesson;
    el.lessonOutput.textContent = ctx.settings.lesson;
    if (scopeUi) {
      scopeUi.through.input.checked = !ctx.settings.lessonOnly;
      scopeUi.only.input.checked = ctx.settings.lessonOnly;
      scopeUi.through.text.textContent = "Through " + lessonName();
      scopeUi.only.text.textContent = lessonName() + " only";
    }
    if (game.updateStart) game.updateStart(el.start);
    var n = game.pool().length;
    // "Only" with nothing in it: say so and point at the nearest lessons that
    // have material. With none anywhere the game's own note explains why.
    el.poolNote.textContent = (n === 0 && ctx.settings.lessonOnly && nothingNewNote()) || game.poolNote(n);
    el.startButton.disabled = n === 0;
    if (el.linkNote) el.linkNote.hidden = !link.active;
    showMissedLine();
  }
  function onStartChange() {
    link.touched = true;
    readStartForm(); syncStartForm();
    // a copied link is for the settings as they were
    if (el.copyStatus) { el.copyStatus.textContent = ""; el.copyUrl.hidden = true; }
  }

  // How many items the game's pool would have at another lesson, the other
  // settings staying as they are.
  function poolSizeAt(n) {
    var keep = ctx.settings.lesson, size = 0;
    ctx.settings.lesson = n;
    try { size = game.pool().length; } catch (e) { size = 0; }
    ctx.settings.lesson = keep;
    return size;
  }
  // "Nothing new for this game in Lesson 11. Try Lesson 10 or 12." The
  // lessons named are the nearest below and above that have material; null
  // when no lesson has any. (Kept per setting: the slider asks on every step.)
  var nothingNewCache = {};
  function nothingNewNote() {
    var key = JSON.stringify(ctx.settings);
    if (key in nothingNewCache) return nothingNewCache[key];
    var n = ctx.settings.lesson, below = null, above = null, i;
    for (i = n - 1; i >= bounds.min && below == null; i--) if (poolSizeAt(i)) below = i;
    for (i = n + 1; i <= bounds.max && above == null; i++) if (poolSizeAt(i)) above = i;
    var note = null;
    if (below != null || above != null) {
      var near = below != null && above != null ? below + " or " + above : (below != null ? below : above);
      note = "Nothing new for this game in " + lessonName() + ". Try " + lessonName(near) + ".";
    }
    return (nothingNewCache[key] = note);
  }

  function buildStartScreen() {
    clear(el.startOptions); clear(el.startExtra);
    // Without the choice the slider means "through". With it, the label
    // names the lesson and the choice under the slider says whether that is
    // everything through the lesson or the lesson alone.
    var through = game.lessonOnlyChoice ? "" : "Through ";
    el.lessonLabel.textContent = through + curriculum.short + " " + curriculum.lessonWord + " ";
    el.lessonRange.setAttribute("aria-label", through + curriculum.lessonWord.toLowerCase() + " (slider)");
    el.lessonRange.min = el.lessonNumber.min = bounds.min;
    el.lessonRange.max = el.lessonNumber.max = bounds.max;
    if (game.lessonOnlyChoice && !scopeUi) {
      var row = make("div", "choice-row lesson-scope");
      row.setAttribute("role", "radiogroup"); row.setAttribute("aria-label", "Which lessons");
      scopeUi = {};
      ["through", "only"].forEach(function (v) {
        var label = choice("radio", "lessonScope", v, "", v === "through");
        scopeUi[v] = { input: label.querySelector("input"), text: label.querySelector("span") };
        row.appendChild(label);
      });
      var controls = el.lessonRange.parentNode;
      controls.parentNode.insertBefore(row, controls.nextSibling);
    }
    game.renderStart(el.startOptions, el.startExtra);
    if (game.typed) typed.renderSettings(el.startExtra);
  }

  // ---------- missed list ----------
  // The forms this student has answered wrong in this game and textbook,
  // kept in localStorage under MISSED_KEY (format and rules: missed-list.js).
  // Where storage doesn't work (private browsing, a full disk) the list is
  // simply not kept: `stored` goes false, the start-screen line stays hidden
  // and the end-of-round retry carries on from the round's own record.
  var missed = {
    list: [],
    stored: false,
    // A game takes part by supplying formKeys() and fromMissed().
    supported: function () { return !!(M && game && game.formKeys && game.fromMissed); },
    init: function () {
      if (!missed.supported()) return;
      try {
        localStorage.setItem(MISSED_KEY + ".probe", "1");
        localStorage.removeItem(MISSED_KEY + ".probe");
        missed.stored = true;
      } catch (e) { missed.stored = false; }
      missed.load();
      // Drop forms whose word or item is no longer in the data.
      var kept = M.prune(missed.list, itemFor);
      if (kept.length !== missed.list.length) { missed.list = kept; missed.save(); }
    },
    // Re-read before every change, so two open tabs don't undo each other.
    load: function () {
      if (!missed.stored) return;
      try { missed.list = M.getList(M.parse(localStorage.getItem(MISSED_KEY)), curriculumId, gameId); }
      catch (e) { missed.stored = false; }
    },
    save: function () {
      if (!missed.stored) return;
      try {
        var state = M.setList(M.parse(localStorage.getItem(MISSED_KEY)), curriculumId, gameId, missed.list);
        localStorage.setItem(MISSED_KEY, JSON.stringify(state));
      } catch (e) { missed.stored = false; }
    },
    // marks: [{ key, right }] for the forms just graded.
    record: function (marks) {
      if (!missed.supported() || !marks.length) return;
      missed.load();
      missed.list = M.recordAll(missed.list, marks, new Date().toISOString());
      missed.save();
    },
    clear: function () { missed.load(); missed.list = []; missed.save(); }
  };
  // The round item for a stored key, or null when the word, item or form is gone.
  function itemFor(key) {
    try { return game.fromMissed(key) || null; } catch (e) { return null; }
  }
  // What a graded item says about each form it asked: [{ key, right }].
  function marksFor(item, result) {
    if (!missed.supported()) return [];
    try { return (game.formKeys(item, result) || []).filter(function (m) { return m && m.key; }); }
    catch (e) { return []; }
  }
  function missedNoun(n) {
    var words = game.missedNoun || ["form", "forms"];
    return plural(n, words[0], words[1]);
  }
  // Start screen: "12 forms on your missed list" with its two controls.
  function showMissedLine() {
    if (!el.missedStart) return;
    if (missed.supported()) missed.load();
    var n = missed.stored ? missed.list.length : 0;
    el.missedStart.hidden = n === 0;
    if (n === 0) { askClear(false); return; }
    el.missedCount.textContent = n + " " + missedNoun(n) + " on your missed list";
    el.missedRule.textContent = "A " + missedNoun(1) + " comes off the list after " + M.RIGHT_IN_A_ROW_TO_CLEAR + " right answers in a row.";
  }
  function askClear(on) {
    if (!el.missedConfirm) return;
    el.missedConfirm.hidden = !on;
    el.missedClear.hidden = on;
  }

  // ---------- rounds ----------
  function defaultBuildRound(list, size) { return shuffle(list.slice()).slice(0, size); }

  function startRound() {
    var size = game.roundSize ? game.roundSize() : 10;
    beginRound((game.buildRound || defaultBuildRound)(game.pool(), size), roundLabel());
  }
  // What a round was, in words, for the result summary: the lesson filter
  // and the game's settings as they stood when it began.
  function roundLabel() {
    var parts = [curriculum.short + " " + (ctx.settings.lessonOnly ? lessonName() + " only" : "through " + lessonName())];
    try { if (game.summary) parts = parts.concat(game.summary() || []); } catch (e) { /* the lesson alone */ }
    return parts;
  }
  function typedLabel() { return game.typed && typed.settings.strict ? ["Strict macrons"] : []; }
  function beginRound(items, label) {
    round = { items: items, index: 0, correct: 0, streak: 0, missed: [], wrongKeys: [], phase: "play", label: label.concat(typedLabel()) };
    show(el.play);
    showItem();
  }
  // A round made of missed forms. The keys are turned back into items from
  // the current data, so the lesson filter and the game's other filters
  // don't apply; a key that no longer has an item is left out.
  function startMissedRound(keys) {
    var items = keys.map(itemFor).filter(Boolean);
    if (items.length) beginRound(items, ["Missed-list round"]);
    return items.length > 0;
  }
  // Results screen: only what was missed in the round just played, shuffled.
  function retryMissed() {
    if (!round || !startMissedRound(shuffle(round.wrongKeys.slice()))) el.retry.hidden = true;
  }
  // Start screen: up to a round's worth of the stored list, oldest misses first.
  function drillMissedList() {
    readStartForm(); saveSettings(); // the typed settings still apply
    missed.load();
    var size = game.missedRoundSize ? game.missedRoundSize() : (game.roundSize ? game.roundSize() : 10);
    if (!startMissedRound(M.take(missed.list, size))) syncStartForm();
  }
  function current() { return round.items[round.index]; }
  function updateStatus() {
    el.progress.textContent = (round.index + 1) + " of " + round.items.length;
    el.streak.textContent = "Streak " + round.streak;
    el.streak.className = round.streak >= 3 ? "streak-hot" : "";
  }
  function showItem() {
    round.phase = "play";
    updateStatus();
    clear(el.area);
    el.feedback.hidden = true; el.feedback.className = "feedback"; clear(el.feedback);
    el.check.hidden = !!game.hideCheckUntilReady; el.check.disabled = true;
    el.next.hidden = true;
    game.begin(current(), el.area);
    el.play.scrollIntoView({ block: "start", behavior: "smooth" });
  }
  function onCheck() {
    if (round.phase !== "play" || !game.canCheck()) return;
    var item = current();
    var result = game.check(item, el.area);
    el.check.hidden = true;
    finish(result.right, item, result);
  }
  // result: { right, verdict?, feedback: [Node], ... } — stored for the review.
  function finish(right, item, result) {
    round.phase = "done";
    if (right) { round.correct++; round.streak++; }
    else { round.streak = 0; round.missed.push({ item: item, result: result }); }
    var marks = marksFor(item, result);
    missed.record(marks);
    marks.forEach(function (m) {
      var id = M.keyId(m.key);
      if (!m.right && !round.wrongKeys.some(function (k) { return M.keyId(k) === id; })) round.wrongKeys.push(m.key);
    });
    updateStatus();
    clear(el.feedback);
    el.feedback.className = "feedback " + (right ? "is-right" : "is-wrong");
    el.feedback.appendChild(make("p", "verdict", result.verdict || (right ? "Correct!" : "Not quite.")));
    (result.feedback || []).forEach(function (node) { el.feedback.appendChild(node); });
    el.feedback.hidden = false;
    el.check.hidden = true;
    el.next.hidden = false;
    el.next.textContent = round.index + 1 < round.items.length ? "Next" : "See score";
    el.next.focus();
  }
  function onNext() {
    if (round.phase !== "done") return;
    round.index++;
    if (round.index < round.items.length) showItem(); else showResults();
  }

  // ---------- results ----------
  function showResults() {
    var n = round.items.length;
    clear(el.score);
    el.score.appendChild(document.createTextNode(round.correct + " "));
    el.score.appendChild(make("small", null, "/ " + n));
    var pct = Math.round(100 * round.correct / n);
    el.resultsLine.textContent = round.correct === n
      ? "Perfect round. Optimē!"
      : pct + "% right. " + (round.missed.length === 1 ? "One to review." : round.missed.length + " to review.");
    clear(el.missedList);
    el.missedBlock.hidden = round.missed.length === 0;
    round.missed.forEach(function (m) {
      var li = make("li");
      game.review(m.item, m.result, li);
      el.missedList.appendChild(li);
    });
    if (el.retry) el.retry.hidden = round.wrongKeys.length === 0;
    showSummary(n, pct);
    show(el.results);
    el.results.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  // The result summary: one line saying what the round was and how it went,
  // for a student to copy and send to a teacher. It is made here and goes
  // nowhere by itself; the site keeps no record of it.
  //   Decline a noun · Henle through Lesson 5 · Single form · 9/10 (90%) · 11 Nov 2026, 4:12 PM
  function dateText(d) {
    try {
      return d.toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
    } catch (e) { return d.toString(); }
  }
  function showSummary(n, pct) {
    if (!el.resultShare) return;
    var parts = [el.title ? el.title.textContent.trim() : gameId].concat(round.label || []);
    parts.push(round.correct + "/" + n + " (" + pct + "%)", dateText(new Date()));
    el.resultSummary.textContent = parts.join(" · ");
    el.resultStatus.textContent = "";
    el.resultShare.hidden = false;
  }
  function copySummary() {
    copyText(el.resultSummary.textContent, function () { el.resultStatus.textContent = "Result copied"; }, function () {
      // No clipboard: select the line, to be copied by hand.
      try { window.getSelection().selectAllChildren(el.resultSummary); } catch (e) { /* the line is still there to select */ }
      el.resultStatus.textContent = "Copy the selected line.";
    });
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
    readStartForm(); syncStartForm(); saveSettings();
    if (game.pool().length) startRound();
  });
  el.check.addEventListener("click", onCheck);
  el.next.addEventListener("click", onNext);
  el.again.addEventListener("click", startRound);
  el.settings.addEventListener("click", function () { askClear(false); syncStartForm(); show(el.start); });
  if (el.retry) el.retry.addEventListener("click", retryMissed);
  if (el.resultCopy) el.resultCopy.addEventListener("click", copySummary);
  if (el.missedStart) {
    el.missedDrill.addEventListener("click", drillMissedList);
    el.missedClear.addEventListener("click", function () { askClear(true); el.missedClearNo.focus(); });
    el.missedClearNo.addEventListener("click", function () { askClear(false); el.missedClear.focus(); });
    el.missedClearYes.addEventListener("click", function () { missed.clear(); askClear(false); showMissedLine(); el.startButton.focus(); });
  }
  if (K && el.copyLink && el.copyStatus && el.copyUrl) {
    el.copyLink.hidden = false;
    el.copyLink.addEventListener("click", copyLink);
  }
  // "Use my saved settings": the same page without the link's settings.
  if (el.linkReset) el.linkReset.addEventListener("click", function () { window.location.assign(window.location.pathname); });

  // ---------- loading ----------
  function fetchJSON(file) {
    return fetch(dataRoot + curriculumId + "/" + file + ".json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error(file + ": HTTP " + r.status); return r.json(); });
  }

  function boot(g) {
    game = g;
    var files = ["curriculum"].concat(g.data || []);
    Promise.all(files.map(fetchJSON))
      .then(function (loaded) {
        files.forEach(function (f, i) { data[f] = loaded[i]; });
        curriculum = data.curriculum;
        if (!curriculum || !curriculum.lessons) throw new Error("bad curriculum.json");
        ctx = {
          curriculum: curriculumId, curriculumInfo: curriculum, data: data,
          settings: Object.assign({ lesson: curriculum.lessons, lessonOnly: false }, g.defaults || {}),
          area: el.area,
          shell: {
            make: make, clear: clear, shuffle: shuffle, pick: pick, plural: plural, lessonOf: lessonOf, typed: typed,
            inLesson: inLesson, lessonName: lessonName,
            setCheckEnabled: function (on) { el.check.hidden = false; el.check.disabled = !on; },
            finish: function (right, item, result) { el.check.hidden = true; finish(right, item, result); },
            check: onCheck
          }
        };
        if (g.typed) typed.load();
        g.setup(ctx);
        bounds = g.lessonBounds();
        if (!isFinite(bounds.min) || !isFinite(bounds.max)) throw new Error("No items");
        ctx.settings.lesson = bounds.max; // default: everything unlocked
        link.defaults = { settings: JSON.parse(JSON.stringify(ctx.settings)), typed: g.typed ? { strict: false, spelling: "henle" } : null };
        loadSettings();
        ctx.settings.lesson = clampLesson(ctx.settings.lesson);
        applyLink();
        missed.init();
        buildStartScreen();
        syncStartForm();
        // start=1 goes straight to a round, when the settings give one
        if (link.start && game.pool().length) startRound();
        else show(el.start);
      })
      .catch(function (err) {
        el.messageText.textContent = "The practice data couldn't be loaded. Please refresh the page and try again.";
        if (window.console) console.error("practice: ", err);
      });
  }

  var registry = {};
  window.LatinPractice = {
    register: function (g) {
      registry[g.id] = g;
      if (g.id === gameId && !game) boot(g);
    },
    games: registry
  };
})();
