#!/usr/bin/env node
// Checks the links for assignments: the query-string reading and writing in
// site/js/practice-link.js, and each game's fromLink()/toLink().
// Run:   node tools/test-links.js
"use strict";
const path = require("path");
const K = require("../site/js/practice-link.js");
const L = require("../site/js/latin-forms.js");

let failures = 0, checks = 0;
function eq(label, got, want) {
  checks++;
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) { failures++; console.error("FAIL " + label + "\n   got  " + g + "\n   want " + w); }
}

// ---------- the games, loaded as the browser loads them ----------
const games = {};
global.window = { LatinForms: L, LatinPractice: { register: (g) => { games[g.id] = g; } } };
["parse", "decline", "synopsis", "vocab"].forEach((id) => require(path.join("..", "site", "js", "games", id + ".js")));

const MIN = 1, MAX = 42;
const TYPED_DEFAULTS = { strict: false, spelling: "classical" };
// A game set up the way the shell's boot() does it, without a page.
function open(id) {
  const game = games[id];
  const ctx = {
    curriculum: "henle", curriculumInfo: { lessons: MAX, lessonWord: "Lesson", grammar: {} },
    data: { vocab: [], items: [] },
    settings: Object.assign({ lesson: MAX, lessonOnly: false }, JSON.parse(JSON.stringify(game.defaults || {}))),
    area: { addEventListener() {} },
    shell: { typed: { enterToAdvance() {} }, lessonOf: (x) => x.lesson, setCheckEnabled() {} }
  };
  game.setup(ctx);
  const typed = game.typed ? Object.assign({}, TYPED_DEFAULTS) : null;
  const defaults = { settings: JSON.parse(JSON.stringify(ctx.settings)), typed: typed && Object.assign({}, typed) };
  return { game, ctx, typed, defaults };
}
// What the shell does with saved settings, then with a link. Returns the
// state the start screen would show, and what K.read() made of the link.
function visit(id, query, saved, savedTyped) {
  const o = open(id), s = o.ctx.settings;
  if (saved) {
    if (typeof saved.lesson === "number") s.lesson = saved.lesson;
    s.lessonOnly = !!(o.game.lessonOnlyChoice && saved.lessonOnly === true);
    o.game.restore(saved);
  }
  if (savedTyped && o.typed) Object.assign(o.typed, savedTyped);
  const res = K.read(query, o.game, { min: MIN, max: MAX });
  if (res.settings.lesson != null) s.lesson = res.settings.lesson;
  if (typeof res.settings.lessonOnly === "boolean") s.lessonOnly = res.settings.lessonOnly;
  o.game.restore(res.settings);
  if (o.typed) Object.assign(o.typed, res.typed);
  return { settings: s, typed: o.typed, res, o };
}
function linkFor(id, settings, typed) {
  const o = open(id);
  return K.build(o.game, { settings: Object.assign({}, o.defaults.settings, settings), typed: typed ? Object.assign({}, TYPED_DEFAULTS, typed) : o.typed }, o.defaults);
}

// ---------- parseQuery ----------
eq("parse: plain", K.parseQuery("?lesson=5&mode=table"), { lesson: "5", mode: "table" });
eq("parse: no question mark", K.parseQuery("lesson=5"), { lesson: "5" });
eq("parse: empty", K.parseQuery(""), {});
eq("parse: null", K.parseQuery(null), {});
eq("parse: first of a repeated name wins", K.parseQuery("?mode=single&mode=table"), { mode: "single" });
eq("parse: trimmed and lower-cased", K.parseQuery("?mode=%20Single%20&spelling=CLASSICAL"), { mode: "single", spelling: "classical" });
eq("parse: + is a space, %2C a comma", K.parseQuery("?decl=1%2C2&pos=noun,+verb"), { decl: "1,2", pos: "noun, verb" });
eq("parse: no value", K.parseQuery("?start&x="), { start: "", x: "" });
eq("parse: bad escape dropped, rest kept", K.parseQuery("?mode=%E0%A4%A&lesson=5&&=3"), { lesson: "5" });
eq("parse: __proto__ is just a name", Object.keys(K.parseQuery("?__proto__=x&lesson=5")).sort(), ["__proto__", "lesson"].sort());

// ---------- the small readers ----------
eq("oneOf", [K.oneOf("a", ["a", "b"]), K.oneOf("c", ["a", "b"]), K.oneOf(undefined, ["a"])], ["a", undefined, undefined]);
eq("flag", [K.flag("1"), K.flag("0"), K.flag("yes"), K.flag(""), K.flag(undefined)], [true, false, undefined, undefined, undefined]);
eq("list: order of the allowed list, once each", K.list("3,1,1,x", ["1", "2", "3"]), ["1", "3"]);
eq("list: nothing valid", K.list("x,y", ["1", "2"]), undefined);
eq("list: empty", K.list("", ["1", "2"]), undefined);
eq("lessonNumber", [K.lessonNumber("5", 1, 42), K.lessonNumber("999", 1, 42), K.lessonNumber("0", 1, 42), K.lessonNumber("-3", 2, 42)], [5, 42, 1, 2]);
eq("lessonNumber: not a whole number", [K.lessonNumber("abc", 1, 42), K.lessonNumber("5.5", 1, 42), K.lessonNumber("", 1, 42), K.lessonNumber("1e3", 1, 42), K.lessonNumber(undefined, 1, 42)],
  [undefined, undefined, undefined, undefined, undefined]);

// ---------- reading: each game's parameters ----------
let v = visit("decline", "?lesson=5&mode=single&decl=1,2&voc=1&macrons=strict&spelling=henle");
eq("decline: reads all", v.settings, { lesson: 5, lessonOnly: false, mode: "single", phraseForm: "table", vocative: true, declensions: ["1", "2"] });
eq("decline: typed", v.typed, { strict: true, spelling: "henle" });
eq("decline: count", [v.res.count, v.res.start], [6, false]);
v = visit("decline", "?mode=phrase&form=single&start=1");
eq("decline: noun + adjective, single form", [v.settings.mode, v.settings.phraseForm, v.res.start], ["phrase", "single", true]);
v = visit("decline", "?decl=5,4,3,2,1", { declensions: ["1"] });
eq("decline: every declension is the default (none listed)", v.settings.declensions, []);
v = visit("decline", "?only=1");
eq("decline: only=1 ignored (the game has no such choice)", [v.settings.lessonOnly, v.res.count], [false, 0]);

v = visit("synopsis", "?lesson=17&mode=single&subj=0&imp=0&nonfinite=0");
eq("synopsis: reads all", v.settings, { lesson: 17, lessonOnly: false, mode: "single", subjunctive: false, imperative: false, nonfinite: false });
v = visit("synopsis", "?mode=synopsis&subj=1", { mode: "single", subjunctive: false, imperative: false });
eq("synopsis: a link can set a default back", [v.settings.mode, v.settings.subjunctive, v.settings.imperative], ["synopsis", true, false]);

v = visit("vocab", "?lesson=3&only=1&dir=en-la&pos=verb,noun&macrons=strict");
eq("vocab: reads all", v.settings, { lesson: 3, lessonOnly: true, dir: "en-la", pos: ["noun", "verb"] });
eq("vocab: typed", v.typed, { strict: true, spelling: "classical" });
v = visit("vocab", "?only=0", { lesson: 9, lessonOnly: true });
eq("vocab: only=0 over a saved only", [v.settings.lesson, v.settings.lessonOnly], [9, false]);

v = visit("parse", "?lesson=12&type=verb&macrons=strict&spelling=classical");
eq("parse: reads its own", v.settings, { lesson: 12, lessonOnly: false, types: "verb" });
eq("parse: no typed settings (not a typed game)", [v.typed, v.res.typed, v.res.count], [null, {}, 2]);

// ---------- unknown parameters and bad values ----------
v = visit("decline", "?mode=<script>alert(1)</script>&form=grid&decl=9,x&voc=yes&lesson=abc&macrons=loud&spelling=greek&utm_source=x&fbclid=123&only=1&start=yes");
eq("decline: junk changes nothing", v.settings, v.o.defaults.settings);
eq("decline: junk typed", v.typed, TYPED_DEFAULTS);
eq("decline: junk counts as no link", [v.res.count, v.res.start, v.res.settings, v.res.typed], [0, false, {}, {}]);
v = visit("decline", "?mode=sideways&lesson=7&voc=2");
eq("decline: good values beside bad ones still apply", [v.settings.lesson, v.settings.mode, v.settings.vocative, v.res.count], [7, "table", false, 1]);
["parse", "synopsis", "vocab"].forEach((id) => {
  v = visit(id, "?mode=x&type=x&dir=x&pos=x&subj=x&imp=&nonfinite=2&lesson=&only=x&%zz=1");
  eq(id + ": junk changes nothing", [v.settings, v.res.count], [v.o.defaults.settings, 0]);
});
// A game whose fromLink() throws or returns rubbish doesn't break the page.
eq("fromLink throws", K.read("?lesson=5", { fromLink() { throw new Error("x"); } }, { min: 1, max: 42 }).settings, { lesson: 5 });
eq("fromLink returns a string", K.read("?lesson=5", { fromLink() { return "x"; } }, { min: 1, max: 42 }).count, 1);
eq("fromLink can't set the shell's own", K.read("?x=1", { fromLink() { return { lesson: 99, lessonOnly: true, a: 1 }; } }, { min: 1, max: 42 }).settings, { a: 1 });
eq("no game", K.read("?lesson=5&start=1", null, { min: 1, max: 42 }), { settings: {}, typed: {}, start: true, count: 0 });

// ---------- the lesson is clamped ----------
eq("lesson above the book", visit("vocab", "?lesson=999").settings.lesson, MAX);
eq("lesson below the book", visit("vocab", "?lesson=0").settings.lesson, MIN);
eq("negative lesson", visit("vocab", "?lesson=-4").settings.lesson, MIN);
eq("clamped to the game's own range", K.read("?lesson=1", games.synopsis, { min: 4, max: 42 }).settings.lesson, 4);

// ---------- the link goes over the saved settings; the rest are kept ----------
v = visit("decline", "?lesson=5&mode=single", { lesson: 20, mode: "phrase", phraseForm: "single", vocative: true, declensions: ["3"] }, { strict: true, spelling: "henle" });
eq("decline: link over saved", v.settings, { lesson: 5, lessonOnly: false, mode: "single", phraseForm: "single", vocative: true, declensions: ["3"] });
eq("decline: saved typed settings kept", v.typed, { strict: true, spelling: "henle" });
v = visit("decline", "?macrons=optional", null, { strict: true, spelling: "henle" });
eq("decline: macrons=optional over saved strict", v.typed, { strict: false, spelling: "henle" });
v = visit("vocab", "", { lesson: 8, lessonOnly: true, dir: "en-la", pos: ["verb"] });
eq("vocab: no query string, saved settings as they were", [v.settings, v.res.count], [{ lesson: 8, lessonOnly: true, dir: "en-la", pos: ["verb"] }, 0]);

// ---------- making a link ----------
["parse", "decline", "synopsis", "vocab"].forEach((id) => eq(id + ": the defaults make no query string", linkFor(id, {}), ""));
eq("decline link", linkFor("decline", { lesson: 5, mode: "single", vocative: true, declensions: ["1", "2"] }, { strict: true, spelling: "henle" }),
  "lesson=5&mode=single&decl=1,2&voc=1&macrons=strict&spelling=henle");
eq("decline link: noun + adjective", linkFor("decline", { mode: "phrase", phraseForm: "single" }), "mode=phrase&form=single");
eq("synopsis link", linkFor("synopsis", { lesson: 17, mode: "single", subjunctive: false, imperative: false, nonfinite: false }), "lesson=17&mode=single&subj=0&imp=0&nonfinite=0");
eq("vocab link", linkFor("vocab", { lesson: 3, lessonOnly: true, dir: "en-la", pos: ["noun", "verb"] }), "lesson=3&only=1&dir=en-la&pos=noun,verb");
eq("parse link", linkFor("parse", { lesson: 12, types: "noun" }), "lesson=12&type=noun");
eq("only what differs", linkFor("synopsis", { imperative: false }), "imp=0");

// Stable: the order of the object's keys and of a list doesn't matter.
const a = linkFor("decline", { vocative: true, declensions: ["3", "1"], mode: "single", lesson: 9 });
const b = linkFor("decline", { lesson: 9, mode: "single", declensions: ["1", "3", "1"], vocative: true });
eq("stable order", [a, a === b], ["lesson=9&mode=single&decl=1,3&voc=1", true]);
eq("stable order: vocab", linkFor("vocab", { pos: ["other", "noun"], dir: "en-la" }), "dir=en-la&pos=noun,other");

// ---------- round trip: a link gives back the settings it was made from ----------
const cases = [
  ["parse", { lesson: 12, types: "verb" }, null],
  ["parse", { types: "noun" }, null],
  ["decline", { lesson: 5, mode: "single", vocative: true, declensions: ["1", "2", "3"] }, { strict: true, spelling: "henle" }],
  ["decline", { lesson: 30, mode: "phrase", phraseForm: "single", declensions: ["3"] }, { strict: false, spelling: "henle" }],
  ["decline", { vocative: true }, { strict: true, spelling: "classical" }],
  ["synopsis", { lesson: 17, mode: "single", subjunctive: false, imperative: false, nonfinite: false }, { strict: true, spelling: "classical" }],
  ["synopsis", { nonfinite: false }, null],
  ["vocab", { lesson: 3, lessonOnly: true, dir: "en-la", pos: ["noun", "verb"] }, { strict: true, spelling: "henle" }],
  ["vocab", { pos: ["other"] }, null]
];
cases.forEach(([id, settings, typed], i) => {
  const o = open(id);
  const want = Object.assign({}, o.defaults.settings, settings);
  const wantTyped = o.typed ? Object.assign({}, TYPED_DEFAULTS, typed) : null;
  const query = K.build(o.game, { settings: want, typed: wantTyped }, o.defaults);
  const back = visit(id, "?" + query);
  eq("round trip " + i + " (" + id + "): settings", back.settings, want);
  eq("round trip " + i + " (" + id + "): typed", back.typed, wantTyped);
  // and the link made from what was read is the same link
  eq("round trip " + i + " (" + id + "): same link again", K.build(o.game, { settings: back.settings, typed: back.typed }, o.defaults), query);
  eq("round trip " + i + " (" + id + "): plain characters only", /^[a-z0-9=&,-]*$/.test(query), true);
});

// ---------- the textbook (book=) ----------
{
  const o = open("decline");
  eq("book: read from a link, not counted as a setting", [K.read("?book=henle2", o.game, { min: MIN, max: MAX }).book, K.read("?book=henle2", o.game, { min: MIN, max: MAX }).count], ["henle2", 0]);
  eq("book: beside settings", (({ book, count }) => [book, count])(K.read("?book=henle2&lesson=5&mode=single", o.game, { min: MIN, max: MAX })), ["henle2", 2]);
  eq("book: a link without one names none", K.read("?lesson=5", o.game, { min: MIN, max: MAX }).book, undefined);
  eq("book: a bad id is dropped", ["../x", "a/b", "", "-x", "x".repeat(41)].map((b) => K.read("?book=" + encodeURIComponent(b), o.game, { min: MIN, max: MAX }).book), [undefined, undefined, undefined, undefined, undefined]);
  eq("book: upper case is read as lower", K.read("?book=HENLE2", o.game, { min: MIN, max: MAX }).book, "henle2");
  const withBook = Object.assign({}, o.defaults, { book: "henle" });
  const state = (book, settings) => ({ settings: Object.assign({}, o.defaults.settings, settings), typed: o.typed, book });
  eq("book: the page's own textbook is left out of a link", K.build(o.game, state("henle", { lesson: 5 }), withBook), "lesson=5");
  eq("book: another textbook leads the link", K.build(o.game, state("henle2", { lesson: 5 }), withBook), "book=henle2&lesson=5");
  eq("book: alone when the settings are the defaults", K.build(o.game, state("henle2", {}), withBook), "book=henle2");
}

console.log(failures ? failures + " of " + checks + " checks FAILED" : "All " + checks + " link checks passed.");
process.exit(failures ? 1 : 0);
