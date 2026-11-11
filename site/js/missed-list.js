// The "missed list" behind the practice games: which forms a student has
// answered wrong, kept in their own browser so they can be drilled again.
// This file is only the list logic (no DOM, no storage calls), so the shell
// (practice.js) and the tests (tools/test-missed.js, in Node) share it.
//
// Stored under one localStorage key as
//   { "v": 1, "lists": { "<curriculum>/<game>": [ entry, ... ] } }
// where an entry is
//   { "k": <key>, "missed": "<ISO time of the last miss>", "right": <right answers in a row since> }
// and <key> is whatever plain object the game uses to name a form: identifiers
// only (an item id; a lemma with case and number), never a generated form, so
// the list survives corrections to the data and the engine. Each list is in
// the order of the last miss, oldest first.
(function (rootObject, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else rootObject.LatinMissed = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // A form leaves the list after this many right answers in a row.
  var RIGHT_IN_A_ROW_TO_CLEAR = 2;
  // Longest a list may grow; the oldest misses are dropped first.
  var MAX_ENTRIES = 300;
  var VERSION = 1;

  function isObject(x) { return !!x && typeof x === "object" && !Array.isArray(x); }

  // One string per key, whatever order its fields were written in.
  function keyId(key) {
    return JSON.stringify(Object.keys(key).sort().map(function (f) { return [f, key[f]]; }));
  }
  function indexOf(list, key) {
    var id = keyId(key);
    for (var i = 0; i < list.length; i++) if (keyId(list[i].k) === id) return i;
    return -1;
  }

  // A list as read from storage, with anything malformed left out.
  function clean(list) {
    if (!Array.isArray(list)) return [];
    var seen = {}, out = [];
    list.forEach(function (e) {
      if (!isObject(e) || !isObject(e.k) || !Object.keys(e.k).length) return;
      var id = keyId(e.k);
      if (seen[id]) return;
      seen[id] = true;
      var right = Math.floor(Number(e.right));
      out.push({ k: e.k, missed: typeof e.missed === "string" ? e.missed : "", right: right > 0 ? right : 0 });
    });
    return out.slice(-MAX_ENTRIES);
  }

  // One answer. Wrong: the form joins the list (or moves to the newest end
  // with its count back at 0). Right: a form on the list counts one more, and
  // leaves once it reaches the threshold; a form not on the list is ignored.
  // `now` is an ISO time string. Returns a new list.
  function record(list, key, right, now) {
    var out = list.slice(), i = indexOf(out, key);
    if (!right) {
      if (i >= 0) out.splice(i, 1);
      out.push({ k: key, missed: now, right: 0 });
      if (out.length > MAX_ENTRIES) out = out.slice(out.length - MAX_ENTRIES);
    } else if (i >= 0) {
      var n = out[i].right + 1;
      if (n >= RIGHT_IN_A_ROW_TO_CLEAR) out.splice(i, 1);
      else out[i] = { k: out[i].k, missed: out[i].missed, right: n };
    }
    return out;
  }
  // marks: [{ key, right }], as a game's formKeys() returns them.
  function recordAll(list, marks, now) {
    (marks || []).forEach(function (m) { if (m && isObject(m.key)) list = record(list, m.key, !!m.right, now); });
    return list;
  }

  // Entries whose word or item is still there: exists(key) → true/false.
  function prune(list, exists) {
    return list.filter(function (e) {
      try { return !!exists(e.k); } catch (err) { return false; }
    });
  }
  // The keys for a round: up to `size`, oldest misses first.
  function take(list, size) { return list.slice(0, size).map(function (e) { return e.k; }); }

  // ---------- the stored object ----------
  function listName(curriculum, game) { return curriculum + "/" + game; }
  // text: the raw localStorage value (or null). Never throws.
  function parse(text) {
    var state = null;
    try { state = JSON.parse(text); } catch (e) { state = null; }
    if (!isObject(state) || !isObject(state.lists)) return { v: VERSION, lists: {} };
    return { v: VERSION, lists: state.lists };
  }
  function getList(state, curriculum, game) { return clean(state.lists[listName(curriculum, game)]); }
  // Sets one list and leaves the others as they were; an empty list is removed.
  function setList(state, curriculum, game, list) {
    var lists = {};
    Object.keys(state.lists).forEach(function (n) { lists[n] = state.lists[n]; });
    if (list.length) lists[listName(curriculum, game)] = list; else delete lists[listName(curriculum, game)];
    return { v: VERSION, lists: lists };
  }

  return {
    RIGHT_IN_A_ROW_TO_CLEAR: RIGHT_IN_A_ROW_TO_CLEAR, MAX_ENTRIES: MAX_ENTRIES, VERSION: VERSION,
    keyId: keyId, clean: clean, record: record, recordAll: recordAll, prune: prune, take: take,
    parse: parse, getList: getList, setList: setList
  };
});
