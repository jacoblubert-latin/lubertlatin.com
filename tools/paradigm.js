#!/usr/bin/env node
// Prints the full paradigm the practice games will use for any words you
// name, so the generator's output can be proofed.
//
//   node tools/paradigm.js mīles hostis laudō            words from vocab.json (macrons optional)
//   node tools/paradigm.js "mare, maris, n. i"           any dictionary line (needn't be in vocab.json)
//   node tools/paradigm.js "sequor, sequī, secūtus sum"
//   node tools/paradigm.js --all                         every word in vocab.json
//   node tools/paradigm.js --irregular                   the hand-entered verbs
//   node tools/paradigm.js --curriculum henle mīles      another curriculum folder (default henle)
//   node tools/paradigm.js --classical ...               show i instead of j
//
// Dictionary lines: "lemma, genitive, m|f|n" for nouns (add " i" for an
// i-stem, " pl" for a plural-only noun); principal parts for verbs.
"use strict";
const fs = require("fs");
const path = require("path");
const L = require("../site/js/latin-forms.js");

const args = process.argv.slice(2);
let curriculum = "henle", all = false, irregular = false, spelling = "henle";
const words = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--curriculum") curriculum = args[++i];
  else if (args[i] === "--all") all = true;
  else if (args[i] === "--irregular") irregular = true;
  else if (args[i] === "--classical") spelling = "classical";
  else words.push(args[i]);
}
if (!words.length && !all && !irregular) {
  console.error("Name at least one word, or use --all / --irregular. See the comment at the top of tools/paradigm.js.");
  process.exit(1);
}

const vocabFile = path.join(__dirname, "..", "site", "practice", "data", curriculum, "vocab.json");
let vocab = [];
try { vocab = JSON.parse(fs.readFileSync(vocabFile, "utf8").replace(/^﻿/, "")); }
catch (e) { if (!all) { /* fine: dictionary lines still work */ } else { console.error("Cannot read " + vocabFile + ": " + e.message); process.exit(1); } }

const IRREGULAR_ENTRIES = {
  "sum": ["sum", "esse", "fuī", "futūrus"], "possum": ["possum", "posse", "potuī"], "eō": ["eō", "īre", "iī", "itum"],
  "ferō": ["ferō", "ferre", "tulī", "lātus"], "volō": ["volō", "velle", "voluī"], "nōlō": ["nōlō", "nōlle", "nōluī"],
  "mālō": ["mālō", "mālle", "māluī"], "fīō": ["fīō", "fierī", "factus sum"]
};

function findEntry(word) {
  const key = L.normalize(word);
  const hit = vocab.find((e) => e.lemma && L.normalize(e.lemma) === key) || vocab.find((e) => e.id === word);
  if (hit) return hit;
  if (word.indexOf(",") >= 0) return L.parseEntry(word);
  if (IRREGULAR_ENTRIES[word] || Object.keys(IRREGULAR_ENTRIES).some((k) => L.normalize(k) === key)) {
    const k = Object.keys(IRREGULAR_ENTRIES).find((k) => L.normalize(k) === key);
    return { pos: "verb", lemma: k, parts: IRREGULAR_ENTRIES[k], conjugation: "irregular" };
  }
  throw new Error("\"" + word + "\" is not in " + path.relative(process.cwd(), vocabFile) + ". Give a dictionary line instead, e.g. \"" + word + ", ..., m.\"");
}

const sp = (s) => L.spell(s, spelling);
const pad = (s, n) => (s + " ".repeat(n)).slice(0, Math.max(n, s.length));
const cell = (c) => c == null ? "—" : Array.isArray(c) ? c.join(" / ") : typeof c === "object" ? c.form + (c.accept.length ? "  (also " + c.accept.join(", ") + ")" : "") : c;

function printNoun(e) {
  const d = L.declineNoun(e);
  const flags = e.flags && e.flags.length ? "  [" + e.flags.join(", ") + "]" : "";
  console.log("\n" + sp(L.nounEntryText(e)) + "   declension " + e.declension + flags + (e.lesson ? "   lesson " + e.lesson : ""));
  console.log("  " + pad("", 6) + pad("singular", 16) + "plural");
  L.CASES.forEach((c) => {
    console.log("  " + pad(c + ".", 6) + pad(sp(cell(d.sg[c])), 16) + sp(cell(d.pl[c])));
  });
}
function printVerb(e) {
  const s = L.synopsis(e);
  const flags = e.flags && e.flags.length ? "  [" + e.flags.join(", ") + "]" : "";
  console.log("\n" + sp(L.verbEntryText(e)) + "   conjugation " + e.conjugation + flags + (e.lesson ? "   lesson " + e.lesson : ""));
  const persons = ["1 sg", "2 sg", "3 sg", "1 pl", "2 pl", "3 pl"];
  ["indicative", "subjunctive"].forEach((mood) => {
    const tenses = mood === "indicative" ? L.IND_TENSES : L.SUBJ_TENSES;
    s.voices.forEach((v) => {
      console.log("\n  " + mood.toUpperCase() + " " + v.toUpperCase());
      tenses.forEach((t) => {
        const set = s[mood][v][t];
        if (!set) { console.log("  " + pad(t, 16) + "—"); return; }
        console.log("  " + pad(t, 16) + set.map((c, i) => sp(c.form)).join(", "));
      });
    });
  });
  // Perfect passive forms also accept the feminine and neuter participle.
  const pp = s.voices.map((v) => s.indicative[v].perfect).find((set) => set && set[0].accept.length);
  if (pp) console.log("\n  (perfect-system passive cells also accept " + pp[0].accept.map(sp).join(" / ") + " etc.)");
}

let list = [];
try {
  if (all) list = vocab.filter((e) => e.pos === "noun" || e.pos === "verb");
  if (irregular) list = list.concat(Object.keys(IRREGULAR_ENTRIES).map((k) => ({ pos: "verb", lemma: k, parts: IRREGULAR_ENTRIES[k], conjugation: "irregular" })));
  list = list.concat(words.map(findEntry));
} catch (e) { console.error(e.message); process.exit(1); }

let failed = 0;
list.forEach((e) => {
  try {
    if (e.pos === "noun") printNoun(e);
    else if (e.pos === "verb") printVerb(e);
    else console.log("\n" + e.lemma + ": " + e.pos + " (no paradigm; forms: " + (e.forms || [e.lemma]).join(", ") + ")");
  } catch (err) { failed++; console.error("\n" + (e.lemma || e.id) + ": " + err.message); }
});
console.log("");
if (failed) process.exit(1);
