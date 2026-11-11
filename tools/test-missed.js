#!/usr/bin/env node
// Checks the missed-list logic (site/js/missed-list.js).
// Run:   node tools/test-missed.js
"use strict";
const M = require("../site/js/missed-list.js");

let failures = 0, checks = 0;
function eq(label, got, want) {
  checks++;
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) { failures++; console.error("FAIL " + label + "\n   got  " + g + "\n   want " + w); }
}
const T1 = "2026-11-11T10:00:00.000Z", T2 = "2026-11-12T10:00:00.000Z";
const terra = { lemma: "terra", case: "acc", number: "pl" };
const miles = { lemma: "mīles", case: "gen", number: "sg" };
const lemmas = (list) => list.map((e) => e.k.lemma || e.k.id);

// ---------- add on a miss ----------
let list = M.record([], terra, false, T1);
eq("a miss joins the list", list, [{ k: terra, missed: T1, right: 0 }]);
eq("a right answer to a form not on the list does nothing", M.record([], terra, true, T1), []);
list = M.record(list, miles, false, T1);
eq("order: oldest miss first", lemmas(list), ["terra", "mīles"]);
eq("the same key in another field order is the same form",
  M.record(list, { number: "pl", lemma: "terra", case: "acc" }, false, T2).length, 2);
eq("record returns a new list", M.record(list, terra, true, T2) !== list && list[0].right, 0);

// ---------- removal after two right in a row ----------
eq("threshold", M.RIGHT_IN_A_ROW_TO_CLEAR, 2);
let once = M.record(list, terra, true, T2);
eq("one right answer: still on the list", once[0], { k: terra, missed: T1, right: 1 });
let twice = M.record(once, terra, true, T2);
eq("two right in a row: gone", lemmas(twice), ["mīles"]);

// ---------- a new miss resets the count ----------
let again = M.record(once, terra, false, T2);
eq("miss after one right: count back to 0, date updated, moved to the newest end",
  again, [{ k: miles, missed: T1, right: 0 }, { k: terra, missed: T2, right: 0 }]);
eq("then one right is not enough", lemmas(M.record(again, terra, true, T2)), ["mīles", "terra"]);
eq("and two are", lemmas(M.record(M.record(again, terra, true, T2), terra, true, T2)), ["mīles"]);

// ---------- recordAll (a graded grid) ----------
let grid = M.recordAll(once, [{ key: terra, right: true }, { key: miles, right: false }, { key: { lemma: "via", case: "abl", number: "sg" }, right: false },
  { key: { lemma: "rēx", case: "nom", number: "sg" }, right: true }], T2);
eq("recordAll: right cells count, wrong cells join", lemmas(grid), ["mīles", "via"]);
eq("recordAll ignores junk", M.recordAll(list, [null, { right: false }, { key: "x", right: false }], T2), list);
eq("recordAll with nothing", M.recordAll(list, undefined, T2), list);

// ---------- cap ----------
let big = [];
for (let i = 0; i < M.MAX_ENTRIES + 25; i++) big = M.record(big, { id: "s" + i }, false, T1);
eq("cap", big.length, M.MAX_ENTRIES);
eq("cap drops the oldest", [big[0].k.id, big[big.length - 1].k.id], ["s25", "s" + (M.MAX_ENTRIES + 24)]);
eq("a re-miss at the cap doesn't drop anything", M.record(big, { id: "s30" }, false, T2).length, M.MAX_ENTRIES);

// ---------- stale keys ----------
const known = { terra: true };
eq("prune drops keys whose word is gone", lemmas(M.prune(list, (k) => known[k.lemma])), ["terra"]);
eq("prune survives a lookup that throws", M.prune(list, () => { throw new Error("x"); }), []);
eq("take: up to the round size, oldest first", M.take(big, 3).map((k) => k.id), ["s25", "s26", "s27"]);
eq("take: a short list", M.take(list, 10), [terra, miles]);

// ---------- storage shape ----------
eq("parse: nothing stored", M.parse(null), { v: 1, lists: {} });
eq("parse: not JSON", M.parse("{oops"), { v: 1, lists: {} });
eq("parse: wrong shape", [M.parse("[1,2]"), M.parse('{"lists":[]}'), M.parse('"x"')].map((s) => s.lists), [{}, {}, {}]);
let state = M.setList(M.parse(null), "henle", "decline", list);
eq("stored shape", state, { v: 1, lists: { "henle/decline": list } });
state = M.setList(state, "henle", "parse", M.record([], { id: "s01-w1" }, false, T1));
eq("lists are per game", [M.getList(state, "henle", "decline").length, M.getList(state, "henle", "parse").length, M.getList(state, "henle", "synopsis").length], [2, 1, 0]);
eq("and per curriculum", M.getList(state, "wheelock", "decline"), []);
eq("round trip through JSON", M.getList(M.parse(JSON.stringify(state)), "henle", "decline"), list);
eq("an empty list is removed", Object.keys(M.setList(state, "henle", "parse", []).lists), ["henle/decline"]);
eq("setList leaves the old state alone", Object.keys(state.lists).length, 2);
eq("clean: malformed entries are left out",
  M.clean([null, 3, { k: null }, { k: {} }, { k: [1] }, { k: terra, right: "1" }, { k: terra, missed: T1, right: 0 }, { k: miles, missed: 5, right: -2 }]),
  [{ k: terra, missed: "", right: 1 }, { k: miles, missed: "", right: 0 }]);
eq("clean: not a list", [M.clean(undefined), M.clean({ a: 1 })], [[], []]);
eq("clean: an over-long stored list keeps the newest", M.clean(big.concat(big.map((e) => ({ k: { id: "t" + e.k.id }, missed: T2, right: 0 })))).length, M.MAX_ENTRIES);

if (failures) { console.error("\n" + failures + " of " + checks + " checks failed."); process.exit(1); }
console.log("OK: " + checks + " checks passed.");
