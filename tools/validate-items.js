#!/usr/bin/env node
// Checks the parsing-drill data file for the /practice page.
//
//   node tools/validate-items.js                      (checks site/practice/items.json)
//   node tools/validate-items.js path/to/other.json
//
// Exits 0 when everything is fine, 1 when there are problems.
// The allowed values below must match FIELDS in site/js/practice.js.

"use strict";
const fs = require("fs");
const path = require("path");

const LESSON_MIN = 1;
const LESSON_MAX = 42; // Henle First Year has 42 lessons

// Which uses a noun may have in each case. "use" must be one of the
// uses listed for the item's case.
const USES_BY_CASE = {
  nom: ["subject", "predicate nominative"],
  gen: ["possession"],
  dat: ["indirect object"],
  acc: ["direct object", "accusative of place to which"],
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
const TOP_FIELDS = ["id", "sentence", "target_index", "target", "lesson", "type", "parse", "explanation"];

const file = path.resolve(process.argv[2] || path.join(__dirname, "..", "site", "practice", "items.json"));

let text;
try { text = fs.readFileSync(file, "utf8"); }
catch (e) { console.error("Cannot read " + file + ": " + e.message); process.exit(1); }

let items;
try { items = JSON.parse(text.replace(/^﻿/, "")); }
catch (e) { console.error("Not valid JSON: " + e.message); process.exit(1); }

if (!Array.isArray(items)) { console.error("The file must be a JSON array of items."); process.exit(1); }

const errors = [];
const seenIds = new Map();

// Strip punctuation from the ends of a word so "via." matches "via".
const trim = (w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const isInt = (v) => Number.isInteger(v);

items.forEach((item, i) => {
  const where = "item " + (i + 1) + (item && item.id ? " (" + item.id + ")" : "");
  const err = (msg) => errors.push(where + ": " + msg);

  if (!item || typeof item !== "object" || Array.isArray(item)) { err("is not an object"); return; }

  for (const k of TOP_FIELDS) if (!(k in item)) err("missing field \"" + k + "\"");
  for (const k of Object.keys(item)) if (!TOP_FIELDS.includes(k)) err("unexpected field \"" + k + "\"");

  if (!isStr(item.id)) err("id must be a non-empty string");
  else if (seenIds.has(item.id)) err("duplicate id (also item " + seenIds.get(item.id) + ")");
  else seenIds.set(item.id, i + 1);

  if (!isStr(item.sentence)) err("sentence must be a non-empty string");
  if (!isStr(item.target)) err("target must be a non-empty string");
  if (!isStr(item.explanation)) err("explanation must be a non-empty string");

  if (!isInt(item.lesson)) err("lesson must be a whole number");
  else if (item.lesson < LESSON_MIN || item.lesson > LESSON_MAX) err("lesson " + item.lesson + " is outside " + LESSON_MIN + "–" + LESSON_MAX);

  // target_index must point at the target word (or the first word of a
  // multi-word target such as "victī sunt").
  if (!isInt(item.target_index) || item.target_index < 0) err("target_index must be a whole number ≥ 0");
  else if (isStr(item.sentence) && isStr(item.target)) {
    const words = item.sentence.trim().split(/\s+/);
    const targetWords = item.target.trim().split(/\s+/);
    if (item.target_index + targetWords.length > words.length) {
      err("target_index " + item.target_index + " is past the end of the sentence (" + words.length + " words)");
    } else {
      targetWords.forEach((tw, j) => {
        const sw = words[item.target_index + j];
        if (trim(sw) !== trim(tw)) {
          err("target_index " + item.target_index + " points at \"" + sw + "\", but target is \"" + item.target + "\"");
        }
      });
    }
  }

  if (item.type !== "noun" && item.type !== "verb") { err("type must be \"noun\" or \"verb\""); return; }
  if (!item.parse || typeof item.parse !== "object" || Array.isArray(item.parse)) { err("parse must be an object"); return; }

  const spec = item.type === "noun" ? NOUN_FIELDS : VERB_FIELDS;
  for (const [key, allowed] of Object.entries(spec)) {
    if (!(key in item.parse)) { err("parse is missing \"" + key + "\""); continue; }
    if (!allowed.includes(item.parse[key])) {
      err("parse." + key + " = " + JSON.stringify(item.parse[key]) + " is not one of: " + allowed.join(", "));
    }
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
    if ("clause" in item.parse && !CLAUSES.includes(item.parse.clause)) {
      err("parse.clause = " + JSON.stringify(item.parse.clause) + " is not one of: " + CLAUSES.join(", "));
    }
  }
});

if (errors.length) {
  console.error(errors.length + " problem" + (errors.length === 1 ? "" : "s") + " in " + file + ":\n");
  errors.forEach((e) => console.error("  - " + e));
  process.exit(1);
}

const nouns = items.filter((it) => it.type === "noun").length;
const verbs = items.length - nouns;
const lessons = items.map((it) => it.lesson);
const sentences = new Set(items.map((it) => it.sentence)).size;
console.log(
  "OK: " + items.length + " items (" + nouns + " nouns, " + verbs + " verbs) from " +
  sentences + " sentences, lessons " + Math.min(...lessons) + "–" + Math.max(...lessons) + "."
);
