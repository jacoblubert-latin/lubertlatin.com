#!/usr/bin/env node
// Checks the practice data files under site/practice/data/<curriculum>/:
// items.json (parsing drill), vocab.json (typed games) and curriculum.json
// (including its grammar schedule: moods, imperative, infinitives, participles).
//
//   node tools/validate-items.js                               checks every curriculum folder
//   node tools/validate-items.js site/practice/data/henle/vocab.json   checks one file (by its name)
//
// Exits 0 when everything is fine, 1 when there are problems.
// The allowed parse values below must match FIELDS in site/js/games/parse.js;
// declension/conjugation codes and flags come from site/js/latin-forms.js.

"use strict";
const fs = require("fs");
const path = require("path");
const L = require("../site/js/latin-forms.js");

const DATA_DIR = path.join(__dirname, "..", "site", "practice", "data");
const LESSON_MIN = 1;
const DEFAULT_LESSON_MAX = 42; // used when a curriculum.json gives no "lessons"

// ---------- parsing-drill items ----------
const USES_BY_CASE = {
  nom: ["subject", "predicate nominative"],
  gen: ["possession"],
  dat: ["indirect object"],
  acc: ["direct object", "accusative of place to which", "accusative of time (post/ante)"],
  abl: ["ablative of means", "ablative of agent", "ablative of accompaniment",
        "ablative of place where", "ablative of place from which", "ablative of time when"],
  voc: ["vocative/direct address"]
};
const NOUN_FIELDS = {
  case: Object.keys(USES_BY_CASE),
  number: ["sg", "pl"],
  gender: ["m", "f", "n"],
  use: [].concat(...Object.values(USES_BY_CASE))
};
const VERB_FIELDS = {
  person: [1, 2, 3],
  number: ["sg", "pl"],
  tense: ["present", "imperfect", "future", "perfect", "pluperfect", "future perfect"],
  voice: ["active", "passive"],
  mood: ["indicative", "imperative", "subjunctive"]
};
const CLAUSES = [
  "purpose", "result", "indirect command", "indirect question",
  "cum-circumstantial", "cum-causal", "cum-concessive"
];
const ITEM_FIELDS = ["id", "curriculum", "sentence", "target_index", "target", "lesson", "type", "parse", "explanation"];
const ITEM_OPTIONAL = ["available"];

// ---------- vocab entries ----------
const POS = ["noun", "verb", "adjective", "pronoun", "adverb", "preposition", "conjunction", "indeclinable", "other"];
const VOCAB_FIELDS = ["id", "curriculum", "lesson", "pos", "lemma"];
const VOCAB_OPTIONAL = ["english", "flags", "available", "forms", "stem", "gen", "gender", "declension", "parts", "conjugation", "nom"];

const trim = (w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const isInt = (v) => Number.isInteger(v);
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);

function readJSON(file) {
  let text;
  try { text = fs.readFileSync(file, "utf8"); }
  catch (e) { return { error: "Cannot read " + file + ": " + e.message }; }
  try { return { data: JSON.parse(text.replace(/^﻿/, "")) }; }
  catch (e) { return { error: "Not valid JSON: " + e.message }; }
}

// Lesson range check shared by items and vocab: `lesson` and each `available` value.
function checkLessons(thing, err, curriculumId, lessonMax, lessonMaxFor) {
  if (!isInt(thing.lesson)) err("lesson must be a whole number");
  else if (thing.lesson < LESSON_MIN || thing.lesson > lessonMax) err("lesson " + thing.lesson + " is outside " + LESSON_MIN + "–" + lessonMax);
  if ("available" in thing) {
    if (!isObj(thing.available)) { err("available must be an object like {\"henle\": 7}"); return; }
    for (const [cur, n] of Object.entries(thing.available)) {
      if (!/^[a-z][a-z0-9-]*$/.test(cur)) err("available has a bad curriculum key " + JSON.stringify(cur));
      const max = lessonMaxFor(cur);
      if (!isInt(n)) err("available." + cur + " must be a whole number");
      else if (n < LESSON_MIN || n > max) err("available." + cur + " = " + n + " is outside " + LESSON_MIN + "–" + max);
    }
  }
}

function validateItems(items, ctx) {
  const errors = [];
  if (!Array.isArray(items)) return ["The file must be a JSON array of items."];
  const seenIds = new Map();
  items.forEach((item, i) => {
    const where = "item " + (i + 1) + (item && item.id ? " (" + item.id + ")" : "");
    const err = (msg) => errors.push(where + ": " + msg);
    if (!isObj(item)) { err("is not an object"); return; }

    for (const k of ITEM_FIELDS) if (!(k in item)) err("missing field \"" + k + "\"");
    for (const k of Object.keys(item)) if (!ITEM_FIELDS.includes(k) && !ITEM_OPTIONAL.includes(k)) err("unexpected field \"" + k + "\"");

    if (!isStr(item.id)) err("id must be a non-empty string");
    else if (seenIds.has(item.id)) err("duplicate id (also item " + seenIds.get(item.id) + ")");
    else seenIds.set(item.id, i + 1);

    if (!isStr(item.curriculum)) err("curriculum must be a non-empty string (e.g. \"henle\")");
    else if (ctx.curriculumId && item.curriculum !== ctx.curriculumId) err("curriculum is " + JSON.stringify(item.curriculum) + " but the file is in the " + ctx.curriculumId + " folder");

    if (!isStr(item.sentence)) err("sentence must be a non-empty string");
    if (!isStr(item.target)) err("target must be a non-empty string");
    if (!isStr(item.explanation)) err("explanation must be a non-empty string");

    checkLessons(item, err, ctx.curriculumId, ctx.lessonMax, ctx.lessonMaxFor);

    if (!isInt(item.target_index) || item.target_index < 0) err("target_index must be a whole number ≥ 0");
    else if (isStr(item.sentence) && isStr(item.target)) {
      const words = item.sentence.trim().split(/\s+/);
      const targetWords = item.target.trim().split(/\s+/);
      if (item.target_index + targetWords.length > words.length) {
        err("target_index " + item.target_index + " is past the end of the sentence (" + words.length + " words)");
      } else {
        targetWords.forEach((tw, j) => {
          const sw = words[item.target_index + j];
          if (trim(sw) !== trim(tw)) err("target_index " + item.target_index + " points at \"" + sw + "\", but target is \"" + item.target + "\"");
        });
      }
    }

    if (item.type !== "noun" && item.type !== "verb") { err("type must be \"noun\" or \"verb\""); return; }
    if (!isObj(item.parse)) { err("parse must be an object"); return; }

    const spec = item.type === "noun" ? NOUN_FIELDS : VERB_FIELDS;
    for (const [key, allowed] of Object.entries(spec)) {
      if (!(key in item.parse)) { err("parse is missing \"" + key + "\""); continue; }
      if (!allowed.includes(item.parse[key])) err("parse." + key + " = " + JSON.stringify(item.parse[key]) + " is not one of: " + allowed.join(", "));
    }
    const allowedKeys = Object.keys(spec).concat(item.type === "verb" ? ["clause"] : []);
    for (const k of Object.keys(item.parse)) if (!allowedKeys.includes(k)) err("parse has unexpected field \"" + k + "\"");

    if (item.type === "noun" && USES_BY_CASE[item.parse.case] && NOUN_FIELDS.use.includes(item.parse.use)
        && !USES_BY_CASE[item.parse.case].includes(item.parse.use)) {
      err("parse.use " + JSON.stringify(item.parse.use) + " does not go with case " + JSON.stringify(item.parse.case) +
          " (allowed: " + USES_BY_CASE[item.parse.case].join(", ") + ")");
    }
    if (item.type === "verb") {
      const subj = item.parse.mood === "subjunctive";
      if (subj && !("clause" in item.parse)) err("mood is subjunctive but parse has no \"clause\"");
      if (!subj && "clause" in item.parse) err("parse has \"clause\" but mood is " + JSON.stringify(item.parse.mood) + ", not subjunctive");
      if ("clause" in item.parse && !CLAUSES.includes(item.parse.clause)) err("parse.clause = " + JSON.stringify(item.parse.clause) + " is not one of: " + CLAUSES.join(", "));
    }
  });
  return errors;
}

function validateVocab(vocab, ctx) {
  const errors = [];
  if (!Array.isArray(vocab)) return ["The file must be a JSON array of entries."];
  const seenIds = new Map();
  vocab.forEach((e, i) => {
    const where = "entry " + (i + 1) + (e && (e.id || e.lemma) ? " (" + (e.id || e.lemma) + ")" : "");
    const err = (msg) => errors.push(where + ": " + msg);
    if (!isObj(e)) { err("is not an object"); return; }

    for (const k of VOCAB_FIELDS) if (!(k in e)) err("missing field \"" + k + "\"");
    for (const k of Object.keys(e)) if (!VOCAB_FIELDS.includes(k) && !VOCAB_OPTIONAL.includes(k)) err("unexpected field \"" + k + "\"");

    if (!isStr(e.id)) err("id must be a non-empty string");
    else if (seenIds.has(e.id)) err("duplicate id (also entry " + seenIds.get(e.id) + ")");
    else seenIds.set(e.id, i + 1);
    if (!isStr(e.curriculum)) err("curriculum must be a non-empty string");
    else if (ctx.curriculumId && e.curriculum !== ctx.curriculumId) err("curriculum is " + JSON.stringify(e.curriculum) + " but the file is in the " + ctx.curriculumId + " folder");
    if (!isStr(e.lemma)) err("lemma must be a non-empty string");
    checkLessons(e, err, ctx.curriculumId, ctx.lessonMax, ctx.lessonMaxFor);
    if (!POS.includes(e.pos)) { err("pos must be one of: " + POS.join(", ")); return; }
    if ("english" in e && (typeof e.english !== "string" || !e.english.trim())) err("english must be a non-empty string (leave the field out if the gloss is not known yet)");
    if ("flags" in e) {
      const allowed = e.pos === "noun" ? L.NOUN_FLAGS : e.pos === "verb" ? L.VERB_FLAGS : e.pos === "adjective" ? L.ADJ_FLAGS : [];
      if (!Array.isArray(e.flags)) err("flags must be an array");
      else e.flags.forEach((f) => { if (!allowed.includes(f)) err("flag " + JSON.stringify(f) + " is not one of: " + (allowed.join(", ") || "(no flags for " + e.pos + ")")); });
    }

    if (e.pos === "noun") {
      if (!isStr(e.gen)) err("a noun needs \"gen\" (genitive singular)");
      if (!["m", "f", "n"].includes(e.gender)) err("gender must be m, f or n");
      if (!L.DECLENSIONS.includes(String(e.declension))) { err("declension " + JSON.stringify(e.declension) + " is not one of: " + L.DECLENSIONS.join(", ")); return; }
      if ("forms" in e && !isObj(e.forms)) err("forms (overrides) must be an object like {\"sg.voc\": \"deus\"}");
      if (isObj(e.forms)) Object.keys(e.forms).forEach((k) => {
        const m = /^(sg|pl)\.(nom|gen|dat|acc|abl|voc)$/.exec(k);
        if (!m) err("forms has a bad key " + JSON.stringify(k) + " (use sg.nom … pl.voc)");
      });
      if (isStr(e.gen) && e.gender) {
        try { L.declineNoun(e); } catch (x) { err("cannot decline: " + x.message); }
      }
    } else if (e.pos === "verb") {
      if (!Array.isArray(e.parts) || e.parts.length < 2 || !e.parts.every(isStr)) err("a verb needs \"parts\" (principal parts, at least two)");
      if (!L.CONJUGATIONS.includes(String(e.conjugation))) { err("conjugation " + JSON.stringify(e.conjugation) + " is not one of: " + L.CONJUGATIONS.join(", ")); return; }
      if (String(e.conjugation) === "irregular" && !L.hasIrregularTable(e)) {
        err("irregular verbs need a hand-entered table; available: " + L.IRREGULAR_LEMMAS.join(", ") + " and their compounds (absum, adeō…)");
      }
      if (Array.isArray(e.parts) && e.parts.length >= 2 && isStr(e.lemma)) {
        try { L.synopsis(e); } catch (x) { err("cannot conjugate: " + x.message); }
      }
    } else if (e.pos === "adjective" && ("declension" in e || "nom" in e)) {
      // A declined adjective: "nom" + "declension". (quot, duo, mīlle… have neither and fall through below.)
      if (!L.ADJ_DECLENSIONS.includes(String(e.declension))) { err("adjective declension " + JSON.stringify(e.declension) + " is not one of: " + L.ADJ_DECLENSIONS.join(", ")); return; }
      const want = String(e.declension) === "3" ? 2 : 3;
      if (!Array.isArray(e.nom) || e.nom.length !== want || !e.nom.every(isStr)) err("a declension " + e.declension + " adjective needs \"nom\" with " + want + " forms (" + (want === 2 ? "gravis, grave" : "magnus, magna, magnum") + ")");
      else {
        if (isStr(e.lemma) && e.nom[0] !== e.lemma) err("nom[0] is " + JSON.stringify(e.nom[0]) + " but the lemma is " + JSON.stringify(e.lemma));
        try { L.declineAdjective(e); } catch (x) { err("cannot decline: " + x.message); }
      }
      if ("forms" in e && !isObj(e.forms)) err("on a declined adjective, forms (overrides) must be an object like {\"m.sg.gen\": [\"alterīus\", \"alīus\"]}");
      if (isObj(e.forms)) Object.entries(e.forms).forEach(([k, v]) => {
        if (!/^(m|f|n)\.(sg|pl)\.(nom|gen|dat|acc|abl|voc)$/.test(k)) err("forms has a bad key " + JSON.stringify(k) + " (use m.sg.nom … n.pl.voc)");
        if (!(isStr(v) || (Array.isArray(v) && v.length && v.every(isStr)))) err("forms." + k + " must be a form or a list of accepted forms");
      });
      if (Array.isArray(e.flags) && e.flags.includes("gen-ius") && String(e.declension) !== "1-2") err("flag \"gen-ius\" only goes with declension \"1-2\"");
      for (const k of ["gen", "gender", "parts", "conjugation", "stem"]) if (k in e) err("\"" + k + "\" does not belong on an adjective");
    } else {
      if ("flags" in e && e.pos === "adjective" && Array.isArray(e.flags) && e.flags.length) err("flags on an adjective need \"nom\" and \"declension\"");
      if ("forms" in e && (!Array.isArray(e.forms) || !e.forms.every(isStr))) err("forms must be an array of strings for a " + e.pos);
      for (const k of ["gen", "gender", "declension", "parts", "conjugation", "nom"]) if (k in e) err("\"" + k + "\" only belongs on a noun, verb or declined adjective");
    }
  });
  return errors;
}

function validateCurriculum(c) {
  const errors = [];
  const err = (m) => errors.push(m);
  if (!isObj(c)) return ["curriculum.json must be an object"];
  if (!isStr(c.id)) err("id must be a non-empty string");
  if (!isStr(c.name)) err("name must be a non-empty string");
  if (!isStr(c.short)) err("short must be a non-empty string (used in \"Through Henle Lesson\")");
  if (!isStr(c.lessonWord)) err("lessonWord must be a non-empty string (e.g. \"Lesson\" or \"Chapter\")");
  if (!isInt(c.lessons) || c.lessons < 1) err("lessons must be a whole number ≥ 1");
  if ("grammar" in c) {
    if (!isObj(c.grammar)) err("grammar must be an object");
    else {
      const max = isInt(c.lessons) ? c.lessons : DEFAULT_LESSON_MAX;
      const walk = (obj, pathStr) => {
        for (const [k, v] of Object.entries(obj)) {
          const p = pathStr + "." + k;
          if (k === "like") { if (!L.CONJUGATIONS.includes(v) || v === "irregular") err("grammar" + p + " = " + JSON.stringify(v) + " should be a conjugation code"); }
          else if (isObj(v)) walk(v, p);
          else if (v !== null && (!isInt(v) || v < 1 || v > max)) err("grammar" + p + " = " + JSON.stringify(v) + " should be a lesson number 1–" + max + " or null");
        }
      };
      walk(c.grammar, "");
      const v = c.grammar.verbs || {};
      ["indicative", "subjunctive"].forEach((mood) => {
        if (v[mood]) ["active", "passive"].forEach((voice) => {
          if (v[mood][voice]) Object.keys(v[mood][voice]).forEach((t) => {
            const allowed = mood === "indicative" ? L.IND_TENSES : L.SUBJ_TENSES;
            if (!allowed.includes(t)) err("grammar.verbs." + mood + "." + voice + " has unknown tense " + JSON.stringify(t));
            const tv = v[mood][voice][t];
            if (isObj(tv)) Object.keys(tv).forEach((k) => { if (!L.CONJUGATIONS.includes(k) || k === "irregular") err("grammar.verbs." + mood + "." + voice + "." + t + " has unknown conjugation code " + JSON.stringify(k)); });
          });
        });
      });
      // imperative, infinitive, participle: the same shape, with their own
      // tenses; a map may also name a hand-table verb ("sum": null).
      const NONFINITE = {
        imperative: { active: L.IMP_TENSES, passive: L.IMP_TENSES },
        infinitive: { active: L.INF_TENSES, passive: L.INF_TENSES },
        participle: { active: ["present", "future"], passive: ["perfect"] }
      };
      Object.keys(NONFINITE).forEach((section) => {
        if (!(section in v)) return;
        const where = "grammar.verbs." + section;
        if (!isObj(v[section])) { err(where + " must be an object like {\"active\": {...}, \"passive\": {...}}"); return; }
        Object.keys(v[section]).forEach((voice) => {
          if (!(voice in NONFINITE[section])) { err(where + " has unknown voice " + JSON.stringify(voice) + " (use active, passive)"); return; }
          if (!isObj(v[section][voice])) { err(where + "." + voice + " must be an object of tenses"); return; }
          Object.keys(v[section][voice]).forEach((t) => {
            if (!NONFINITE[section][voice].includes(t)) err(where + "." + voice + " has unknown tense " + JSON.stringify(t) + " (use " + NONFINITE[section][voice].join(", ") + ")");
            const tv = v[section][voice][t];
            if (isObj(tv)) Object.keys(tv).forEach((k) => {
              if (k === "irregular" || !(L.CONJUGATIONS.includes(k) || L.IRREGULAR_LEMMAS.includes(k))) err(where + "." + voice + "." + t + " has unknown conjugation code or hand-table verb " + JSON.stringify(k));
            });
          });
        });
      });
      Object.keys(v).forEach((k) => { if (!["conjugation", "deponent", "irregular"].concat(L.SECTIONS).includes(k)) err("grammar.verbs has unknown key " + JSON.stringify(k) + " (use conjugation, deponent, irregular, " + L.SECTIONS.join(", ") + ")"); });
      if (v.conjugation) Object.keys(v.conjugation).forEach((k) => { if (!L.CONJUGATIONS.includes(k)) err("grammar.verbs.conjugation has unknown code " + JSON.stringify(k)); });
      if (v.irregular) Object.keys(v.irregular).forEach((k) => { if (!L.IRREGULAR_LEMMAS.includes(k)) err("grammar.verbs.irregular has no hand table for " + JSON.stringify(k) + " (use one of: " + L.IRREGULAR_LEMMAS.join(", ") + ")"); });
      const n = c.grammar.nouns || {};
      if (n.declension) Object.keys(n.declension).forEach((k) => { if (!L.DECLENSIONS.includes(k)) err("grammar.nouns.declension has unknown code " + JSON.stringify(k)); });
      const a = c.grammar.adjectives || {};
      Object.keys(a).forEach((k) => { if (!["declension", "er", "gen-ius"].includes(k)) err("grammar.adjectives has unknown key " + JSON.stringify(k) + " (use declension, er, gen-ius)"); });
      if ("declension" in a && !isObj(a.declension)) err("grammar.adjectives.declension must be an object like {\"1-2\": 7, \"3\": 8}");
      if (isObj(a.declension)) Object.keys(a.declension).forEach((k) => { if (!L.ADJ_DECLENSIONS.includes(k)) err("grammar.adjectives.declension has unknown code " + JSON.stringify(k)); });
      ["er", "gen-ius"].forEach((k) => { if (isObj(a[k])) err("grammar.adjectives." + k + " must be a lesson number or null"); });
    }
  }
  return errors;
}

// ---------- driver ----------
function lessonMaxOf(dir) {
  const r = readJSON(path.join(dir, "curriculum.json"));
  return r.data && isInt(r.data.lessons) ? r.data.lessons : DEFAULT_LESSON_MAX;
}
function contextFor(dir) {
  const id = path.basename(dir);
  return {
    curriculumId: id,
    lessonMax: lessonMaxOf(dir),
    lessonMaxFor: (cur) => {
      const other = path.join(DATA_DIR, cur);
      return fs.existsSync(path.join(other, "curriculum.json")) ? lessonMaxOf(other) : DEFAULT_LESSON_MAX;
    }
  };
}
function checkFile(file, ctx) {
  const name = path.basename(file);
  const r = readJSON(file);
  if (r.error) return { errors: [r.error], summary: "" };
  if (name === "items.json") {
    const errors = validateItems(r.data, ctx);
    if (errors.length) return { errors };
    const items = r.data, nouns = items.filter((it) => it.type === "noun").length;
    const lessons = items.map((it) => it.lesson), sentences = new Set(items.map((it) => it.sentence)).size;
    const withAvail = items.filter((it) => it.available).length;
    return { errors, summary: items.length + " items (" + nouns + " nouns, " + (items.length - nouns) + " verbs) from " + sentences +
      " sentences, lessons " + Math.min(...lessons) + "–" + Math.max(...lessons) + (withAvail ? ", " + withAvail + " with \"available\"" : "") + "." };
  }
  if (name === "vocab.json") {
    const errors = validateVocab(r.data, ctx);
    if (errors.length) return { errors };
    const v = r.data, nouns = v.filter((e) => e.pos === "noun").length, verbs = v.filter((e) => e.pos === "verb").length;
    const adjs = v.filter(L.isDeclinedAdjective).length;
    // Not an error: a word without a gloss is only left out of the vocabulary game.
    const noGloss = v.filter((e) => !("english" in e)).length;
    const warnings = noGloss ? [noGloss + (noGloss === 1 ? " entry has" : " entries have") + " no \"english\" gloss and " + (noGloss === 1 ? "is" : "are") + " left out of the vocabulary game."] : [];
    return { errors, warnings, summary: v.length + " entries (" + nouns + " nouns, " + verbs + " verbs, " + adjs + " declined adjectives, " + (v.length - nouns - verbs - adjs) + " other)." };
  }
  if (name === "curriculum.json") {
    const errors = validateCurriculum(r.data);
    return { errors, summary: errors.length ? "" : r.data.name + ", " + r.data.lessons + " " + r.data.lessonWord.toLowerCase() + "s." };
  }
  return { errors: ["Don't know how to check a file called " + name + " (expected items.json, vocab.json or curriculum.json)"], summary: "" };
}

let files = [];
if (process.argv[2]) {
  const f = path.resolve(process.argv[2]);
  files = [{ file: f, ctx: fs.existsSync(path.join(path.dirname(f), "curriculum.json")) ? contextFor(path.dirname(f)) : { curriculumId: null, lessonMax: DEFAULT_LESSON_MAX, lessonMaxFor: () => DEFAULT_LESSON_MAX } }];
} else {
  const dirs = fs.readdirSync(DATA_DIR).map((d) => path.join(DATA_DIR, d)).filter((d) => fs.statSync(d).isDirectory());
  dirs.forEach((dir) => {
    const ctx = contextFor(dir);
    ["curriculum.json", "items.json", "vocab.json"].forEach((n) => {
      const f = path.join(dir, n);
      if (fs.existsSync(f)) files.push({ file: f, ctx });
      else if (n === "curriculum.json") files.push({ file: f, ctx, missing: true });
    });
  });
}

let bad = 0;
files.forEach(({ file, ctx, missing }) => {
  const rel = path.relative(process.cwd(), file);
  if (missing) { bad++; console.error(rel + ": missing (every curriculum folder needs a curriculum.json)"); return; }
  const r = checkFile(file, ctx);
  if (r.errors.length) {
    bad++;
    console.error(r.errors.length + " problem" + (r.errors.length === 1 ? "" : "s") + " in " + rel + ":\n");
    r.errors.forEach((e) => console.error("  - " + e));
    console.error("");
  } else {
    console.log("OK " + rel + ": " + r.summary);
    (r.warnings || []).forEach((w) => console.warn("  warning: " + w));
  }
});
process.exit(bad ? 1 : 0);
