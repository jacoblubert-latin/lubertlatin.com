// Links for assignments: the practice games' settings as a query string
// (/practice/decline/?lesson=5&mode=single), read on load and written by the
// start screen's "Copy link to these settings". This file is only the
// reading and writing (no DOM, no storage), so the shell (practice.js) and
// the tests (tools/test-links.js, in Node) share it.
//
// The parameter names and values are a public interface: teachers post these
// links, so add to them but never rename one. They are listed in the README
// under "Links for assignments".
//
// The shell's own parameters, in the order a link carries them:
//   book=henle2         the textbook (a folder under /practice/data/), when it
//                       isn't the page's own. A link with settings and no
//                       book means the page's own textbook, as it did when
//                       there was only one.
//   lesson=5            the lesson slider (clamped to the game's range)
//   only=1              "Lesson N only" (games that offer the choice)
//   ...the game's own parameters, in the game's order...
//   macrons=strict      strict macrons (typed games); "optional" turns it off
//   spelling=classical  spelling on screen (typed games); or "henle"
//   start=1             skip the start screen and begin the round
//
// A game takes part with two functions on the object it registers:
//   fromLink(params, link)  params is { name: value } as read from the URL
//                           (values trimmed and lower-cased). Returns the
//                           settings it recognises, in the shape restore()
//                           takes; the shell passes that to restore(), so a
//                           link goes through the same checks as saved
//                           settings. Leave out anything missing or bad.
//   toLink(settings, link)  returns [[name, value], ...] for every one of
//                           its settings, always in the same order. The shell
//                           leaves out the ones that match the defaults.
// `link` is this module, for the small readers below (oneOf, flag, list).
(function (rootObject, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else rootObject.LatinLink = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var has = Object.prototype.hasOwnProperty;

  // "?lesson=5&mode=table" → { lesson: "5", mode: "table" }. Values are
  // trimmed and lower-cased; the first of a repeated name wins; anything
  // that can't be decoded is dropped.
  function parseQuery(query) {
    var out = Object.create(null);   // (so a parameter named __proto__ is only a name)
    String(query == null ? "" : query).replace(/^[?#]/, "").split("&").forEach(function (part) {
      if (!part) return;
      var i = part.indexOf("=");
      var name, value;
      try {
        name = decodeURIComponent((i < 0 ? part : part.slice(0, i)).replace(/\+/g, " "));
        value = decodeURIComponent((i < 0 ? "" : part.slice(i + 1)).replace(/\+/g, " "));
      } catch (e) { return; }
      if (name && !has.call(out, name)) out[name] = value.trim().toLowerCase();
    });
    return out;
  }

  // ---------- readers for one value ----------
  // The value if it is one of `allowed`, else undefined.
  function oneOf(value, allowed) { return allowed.indexOf(value) >= 0 ? value : undefined; }
  // "1" → true, "0" → false, anything else undefined.
  function flag(value) { return value === "1" ? true : value === "0" ? false : undefined; }
  // "3,1,1,x" → ["1", "3"]: the allowed entries, once each, in the order of
  // `allowed`. undefined when none is left.
  function list(value, allowed) {
    if (typeof value !== "string") return undefined;
    var parts = value.split(",").map(function (s) { return s.trim(); });
    var out = allowed.filter(function (a) { return parts.indexOf(a) >= 0; });
    return out.length ? out : undefined;
  }
  // A whole number, clamped to min..max; undefined when it isn't one.
  function lessonNumber(value, min, max) {
    if (typeof value !== "string" || !/^-?\d{1,9}$/.test(value)) return undefined;
    return Math.min(max, Math.max(min, parseInt(value, 10)));
  }
  function onOff(on) { return on ? "1" : "0"; }
  // A textbook id (a data folder's name: "henle2"), else undefined.
  function bookId(value) { return typeof value === "string" && /^[a-z0-9][a-z0-9-]{0,39}$/.test(value) ? value : undefined; }

  // ---------- reading a link ----------
  // game: the registered game object. opts: { min, max } the lesson range.
  // Returns
  //   settings  what the link sets, in the shape the game's restore() takes,
  //             plus lesson and lessonOnly (the shell's)
  //   typed     { strict?, spelling? } for a typed game
  //   start     true for start=1
//   book      the textbook the link names (not counted as a setting)
  //   count     how many settings the link set (0: an ordinary visit)
  // Unknown parameters and bad values are left out, never an error.
  function read(query, game, opts) {
    var p = parseQuery(query);
    var res = { settings: {}, typed: {}, start: p.start === "1", count: 0, book: bookId(p.book) };
    if (!game) return res;
    var lesson = lessonNumber(p.lesson, opts.min, opts.max);
    if (lesson !== undefined) { res.settings.lesson = lesson; res.count++; }
    var only = game.lessonOnlyChoice ? flag(p.only) : undefined;
    if (only !== undefined) { res.settings.lessonOnly = only; res.count++; }
    if (game.fromLink) {
      var own = null;
      try { own = game.fromLink(p, api); } catch (e) { own = null; }
      if (own && typeof own === "object") {
        Object.keys(own).forEach(function (k) {
          if (own[k] === undefined || k === "lesson" || k === "lessonOnly") return;
          res.settings[k] = own[k]; res.count++;
        });
      }
    }
    if (game.typed) {
      var macrons = oneOf(p.macrons, ["strict", "optional"]);
      if (macrons) { res.typed.strict = macrons === "strict"; res.count++; }
      var spelling = oneOf(p.spelling, ["henle", "classical"]);
      if (spelling) { res.typed.spelling = spelling; res.count++; }
    }
    return res;
  }

  // ---------- making a link ----------
  // Every setting as [name, value], in the link's fixed order.
  // state: { settings, typed, book } (typed: { strict, spelling }, typed games
// only; book: the textbook's id).
  function pairs(game, state) {
    var s = state.settings || {}, out = [];
    if (state.book) out.push(["book", String(state.book)]);
    if (s.lesson != null) out.push(["lesson", String(s.lesson)]);
    if (game.lessonOnlyChoice) out.push(["only", onOff(s.lessonOnly)]);
    if (game.toLink) {
      (game.toLink(s, api) || []).forEach(function (pair) {
        if (pair && pair[1] != null) out.push([String(pair[0]), String(pair[1])]);
      });
    }
    if (game.typed && state.typed) {
      out.push(["macrons", state.typed.strict ? "strict" : "optional"]);
      out.push(["spelling", state.typed.spelling === "classical" ? "classical" : "henle"]);
    }
    return out;
  }
  // The query string ("lesson=5&mode=single", no "?") for `state`, leaving
  // out whatever is the same in `defaults` (same shape as state). The same
  // setup always gives the same string.
  function build(game, state, defaults) {
    var base = {};
    pairs(game, defaults).forEach(function (pair) { base[pair[0]] = pair[1]; });
    return pairs(game, state)
      .filter(function (pair) { return pair[1] !== "" && base[pair[0]] !== pair[1]; })
      .map(function (pair) { return encodeURIComponent(pair[0]) + "=" + encodeURIComponent(pair[1]).replace(/%2C/gi, ","); })
      .join("&");
  }

  var api = {
    parseQuery: parseQuery, oneOf: oneOf, flag: flag, list: list, lessonNumber: lessonNumber, onOff: onOff, bookId: bookId,
    read: read, pairs: pairs, build: build
  };
  return api;
});
