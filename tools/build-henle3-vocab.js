#!/usr/bin/env node
// Builds site/practice/data/henle3/vocab.json.
//
//   node tools/build-henle3-vocab.js            report only (no changes made)
//   node tools/build-henle3-vocab.js --write    write vocab.json
//
// Third Year has two word lists. Its Classified Word List, First and Second
// Years (pp. 377-410) is Second Year's list reprinted, so those words are
// taken from henle2/vocab.json as it stands: Lesson 1, "review": true.
// Its own words are the VOCABULARY of each Part IV lesson, transcribed in
// tools/henle3-lesson-vocab.txt (the Review Word List for Third Year,
// pp. 359-376, is the same entries in the same order). Each is built here
// from the printed entry, with the tables below for what the print leaves
// out (genders, i-stems, words that are not declined by rule).
// A lesson word the earlier list already has (magis, male, nūper, prope)
// stays a review word and gets "lessons": [1, N], so "Lesson N only" asks it.
// vocab.json for henle3 is this script's output: correct a word in the list
// or in the tables here (or, for a review word, in Second Year's lists).
"use strict";
const fs = require("fs"), path = require("path");
const repo = path.join(__dirname, ".."), write = process.argv.includes("--write");
const L = require(path.join(repo, "site/js/latin-forms.js"));
const read = (f) => fs.readFileSync(f, "utf8").replace(/^﻿/, "");
const book2 = JSON.parse(read(path.join(repo, "site/practice/data/henle2/vocab.json")));
const norm = (s) => L.normalize(s);

const rows = [];
read(path.join(__dirname, "henle3-lesson-vocab.txt")).split(/\r?\n/).forEach((l) => {
  if (!l.trim() || l[0] === "#") return;
  const c = l.split("\t");
  rows.push({ lesson: +c[0], entry: c[1].trim(), english: c[2].trim(), page: c[3] });
});

// ---------- readings corrected against the usual quantities ----------
const FIX = { "pārēns": "parēns", "pārentis": "parentis", "emptus": "ēmptus" };
const fix = (s) => s.split(/(\s+|,)/).map((w) => FIX[w] || w).join("");

// ---------- what the printed entry leaves out ----------
// Third-declension genders the book does not print (it prints only the ones
// its rules of gender do not give). -tās, -tūdō and -iō are feminine and
// -or masculine without a line here.
const GENDER = { "Cicerō": "m", "pestis": "f", "mēns": "f", "carcer": "m", "adulēscēns": "m", "laus": "f", "jūdex": "m",
  "caput": "n", "crīmen": "n", "parēns": "m", "moenia": "n" };
const I_STEM = ["fīnis", "pestis", "cīvis", "mēns", "ignis", "testis", "adulēscēns", "moenia"];
const NOUN_FORMS = {
  "domus": { "sg.dat": ["domuī", "domō"], "sg.abl": ["domō", "domū"], "pl.gen": ["domuum", "domōrum"], "pl.acc": ["domōs", "domūs"] },
  "parēns": { "pl.gen": ["parentum", "parentium"] }
};
const forms = (stem, list) => list.split(" ").map((e) => stem + e);
// Entries that are not built by rule: [pos, lemma, extra fields]. Keyed by the start of the printed entry.
const HAND = [
  [/^jam prīdem$/, "other", "jam prīdem"], [/^jam diū$/, "other", "jam diū"], [/^jam dūdum$/, "other", "jam dūdum"],
  [/^orbis \(orbis\) terrārum/, "other", "orbis terrārum"],
  [/^rēs \(reī\) pūblica/, "other", "rēs pūblica"], [/^rēs \(rērum\) novae/, "other", "rēs novae"],
  [/^ējus modī$/, "other", "ējus modī"], [/^hūjus modī$/, "other", "hūjus modī"],
  [/^nōn modo \. \. \. sed/, "other", "nōn modo … sed etiam"], [/^nōn modo \. \. \. vērum/, "other", "nōn modo … vērum etiam"],
  [/^complūrēs,/, "adjective", "complūrēs", { forms: ["complūrēs", "complūra", "complūria", "complūrium", "complūribus"] }],
  [/^īdem,/, "pronoun", "īdem", { forms: ["īdem", "eadem", "idem", "ejusdem", "eīdem", "eundem", "eandem", "eōdem", "eādem", "eaedem", "eōrundem", "eārundem", "eīsdem", "īsdem", "eōsdem", "eāsdem"] }],
  [/^placet,/, "other", "placet", { forms: ["placet", "placēbat", "placēbit", "placuit", "placuerat", "placuerit", "placeat", "placēret", "placuisset", "placēre", "placuisse"] }],
  [/^ōdī,/, "other", "ōdī", { forms: forms("ōd", "ī istī it imus istis ērunt eram erās erat erāmus erātis erant erō eris erit erimus eritis erint erim erīs erīmus erītis issem issēs isset issēmus issētis issent isse") }],
  [/^meminī,/, "other", "meminī", { forms: forms("memin", "ī istī it imus istis ērunt eram erās erat erāmus erātis erant erō eris erit erimus eritis erint erim erīs erīmus erītis issem issēs isset issēmus issētis issent isse").concat(["mementō", "mementōte"]) }],
  [/^meā \(tuā, suā\) sponte$/, "other", "meā sponte"],
  [/^quīdam, quiddam/, "pronoun", "quīdam", { forms: ["quīdam", "quaedam", "quiddam", "cūjusdam", "cuidam", "quendam", "quandam", "quōdam", "quādam", "quōrundam", "quārundam", "quibusdam", "quōsdam", "quāsdam"] }],
  [/^quīdam, quaedam, quoddam/, "adjective", "quīdam", { forms: ["quīdam", "quaedam", "quoddam", "cūjusdam", "cuidam", "quendam", "quandam", "quōdam", "quādam", "quōrundam", "quārundam", "quibusdam", "quōsdam", "quāsdam"] }],
  [/^aliquis, aliquid/, "pronoun", "aliquis", { forms: ["aliquis", "aliquid", "alicūjus", "alicui", "aliquem", "aliquō", "aliquī", "aliqua", "aliquōrum", "aliquibus", "aliquōs"] }],
  [/^aliquis, aliqua, aliquod/, "adjective", "aliquis", { forms: ["aliquis", "aliquī", "aliqua", "aliquod", "alicūjus", "alicui", "aliquem", "aliquam", "aliquō", "aliquā", "aliquae", "aliquōrum", "aliquārum", "aliquibus", "aliquōs", "aliquās"] }],
  [/^cēterī,/, "adjective", "cēterī", { forms: ["cēterī", "cēterae", "cētera", "cēterōrum", "cēterārum", "cēterīs", "cēterōs", "cēterās"] }],
  [/^nōnnūllī,/, "adjective", "nōnnūllī", { forms: ["nōnnūllī", "nōnnūllae", "nōnnūlla", "nōnnūllōrum", "nōnnūllārum", "nōnnūllīs", "nōnnūllōs", "nōnnūllās"] }],
  [/^sīc \. \. \. ut/, "conjunction", "sīc … ut"],
  [/^capite damnāre$/, "other", "capite damnāre"],
  [/^cōnstat,/, "other", "cōnstat", { forms: ["cōnstat", "cōnstābat", "cōnstābit", "cōnstitit", "cōnstiterat", "cōnstet", "cōnstāret", "cōnstāre", "cōnstitisse"] }],
  [/^accidit,/, "other", "accidit", { forms: ["accidit", "accidēbat", "accidet", "acciderat", "accidat", "accideret", "accidisset", "accidere", "accidisse"] }],
  [/^necesse est/, "other", "necesse est", { forms: ["necesse"] }]
];
// The second line of a two-line entry: other forms of the entry above, not a word of its own.
const SKIP = [/^dexter, dextera, dexterum$/];
// A lesson word that shares its dictionary form and part of speech with an earlier word of another meaning.
const OWN_ID = { "adv-quam": "adv-quam-how", "con-ut": "con-ut-as" };
// The same word as an earlier year's, boxed again: the gloss to show.
const AGAIN = { "adv-magis": null, "adv-male": null, "adv-nuper": null, "adv-prope": "almost; nearly; near" };
const PREFIX = { noun: "", verb: "", adjective: "adj-", adverb: "adv-", pronoun: "pro-", preposition: "pre-", conjunction: "con-", other: "oth-" };
const idFor = (pos, lemma) => PREFIX[pos] + L.normalize(lemma).replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
const gloss = (s) => s.replace(/\s*\.\s\.\s\.\s*/g, " … ").replace(/\s+/g, " ").trim();

const report = { built: [], again: [], notes: [] };

function build(row) {
  const text = fix(row.entry).replace(/\s*\((?:Gr\.|quā \+)[^)]*\)/g, "");
  const hand = HAND.find((h) => h[0].test(text));
  if (hand) return Object.assign({ pos: hand[1], lemma: hand[2] }, hand[3] || {});
  const main = text.split(";")[0].trim();
  const f = main.split(",").map((s) => s.trim());
  const lemma = f[0].replace(/\s*\(.*$/, "").trim();

  // verbs: a conjugation number, "irreg.", or tr./intr. among the fields
  const vi = f.findIndex((x) => /^(1|2|3|4|irreg\.|tr\.|intr\.|tr\. and intr\.)$/.test(x));
  if (vi > 0) {
    let parts = f.slice(0, vi).map((p) => p.replace(/\s*\(.*?\)/g, "").trim());
    const num = f.find((x) => /^[1-4]$/.test(x));
    const intr = f.includes("intr.");
    const dep = /or$/.test(lemma), semi = !dep && parts.some((p) => / sum$/.test(p));
    let conj = num || "irregular";
    if (conj === "3" && /i(ō|or)$/.test(lemma)) conj = "3io";
    if (parts.length === 1) {
      const s = lemma;
      if (dep) parts = [s, s.replace(/or$/, "ārī"), s.replace(/or$/, "ātus sum")];
      else if (conj === "1") parts = [s, s.replace(/ō$/, "āre"), s.replace(/ō$/, "āvī"), s.replace(/ō$/, intr ? "ātum" : "ātus")];
      else if (conj === "2") parts = [s, s.replace(/eō$/, "ēre"), s.replace(/eō$/, "uī"), s.replace(/eō$/, intr ? "itum" : "itus")];
      else if (conj === "4") parts = [s, s.replace(/iō$/, "īre"), s.replace(/iō$/, "īvī"), s.replace(/iō$/, intr ? "ītum" : "ītus")];
      else throw new Error("cannot fill in the principal parts of " + row.entry);
    }
    const e = { pos: "verb", lemma, parts, conjugation: conj, flags: [] };
    if (dep) e.flags.push("deponent");
    else if (semi) e.flags.push("semi-deponent");
    else if (intr || /^(mālō|nōlō|obeō)$/.test(lemma)) e.flags.push("no-passive");
    return e;
  }

  // adjectives
  if (f.length === 3 && f[1] === "a" && f[2] === "um") return { pos: "adjective", lemma, nom: [lemma, lemma.replace(/us$/, "a"), lemma.replace(/us$/, "um")], declension: "1-2" };
  if (f.length === 3 && /a$/.test(f[1]) && /um$/.test(f[2])) return { pos: "adjective", lemma, nom: f.slice(0, 3), declension: "1-2" };
  if (f.length === 2 && f[1] === "e") return { pos: "adjective", lemma, nom: [lemma, lemma.replace(/is$/, "e")], declension: "3" };
  const g1 = /\(gen\. ([^)]+)\)/.exec(text);
  if (g1) return { pos: "adjective", lemma, nom: [lemma], gen: g1[1], declension: "3" };

  // the small words
  if (/\badv\./.test(text) || /abl\. of degree/.test(text)) return { pos: "adverb", lemma };
  if (/\bconj\./.test(text)) return { pos: "conjunction", lemma };
  if (/\bprep\./.test(text)) return { pos: "preposition", lemma };

  // nouns
  let gen = f[1], decl = null, plural = false;
  if (gen === "ae") { gen = lemma.replace(/a$/, "ae"); decl = "1"; }
  else if (gen === "ī") { gen = lemma.replace(/(us|um)$/, "ī"); decl = "2"; }
  else if (gen === "ūs") { gen = lemma.replace(/us$/, "ūs"); decl = "4"; }
  else if (/ārum$/.test(gen)) { decl = "1"; plural = true; }
  else if (/ōrum$/.test(gen)) { decl = "2"; plural = true; }
  else if (/[eē]ī$/.test(gen)) decl = "5";
  else if (/is$/.test(gen)) decl = "3";
  else if (/um$/.test(gen)) { decl = "3"; plural = true; }
  if (!decl) throw new Error("cannot read the entry: " + row.entry);
  const printed = (f[2] || "").replace(/\./g, "");
  let gender = ["m", "f", "n"].includes(printed) ? printed : printed === "c" ? "m" : null;
  if (!gender) {
    if (decl === "1" || decl === "5") gender = "f";
    else if (decl === "2") gender = /(um|a)$/.test(lemma) ? "n" : "m";
    else if (decl === "4") gender = "m";
    else gender = GENDER[lemma] || (/(tās|tūdō|iō)$/.test(lemma) ? "f" : /or$/.test(lemma) ? "m" : null);
  }
  if (!gender) throw new Error("no gender for " + row.entry + " (add it to GENDER)");
  const e = { pos: "noun", lemma, gen, gender, declension: decl, flags: [] };
  if (plural) e.flags.push("plural-only");
  if (I_STEM.includes(lemma)) e.flags.push("i-stem");
  if (NOUN_FORMS[lemma]) e.forms = NOUN_FORMS[lemma];
  return e;
}

// ---------- the earlier years' words ----------
const entries = book2.map((b) => {
  const e = JSON.parse(JSON.stringify(b));
  e.curriculum = "henle3"; e.lesson = 1; e.review = true; delete e.lessons;
  return e;
});
const byId = {}; entries.forEach((e) => { byId[e.id] = e; });

// ---------- Third Year's own ----------
rows.forEach((row) => {
  if (SKIP.some((r) => r.test(row.entry))) return;
  const e = build(row);
  let id = idFor(e.pos, e.lemma);
  if (id in AGAIN) {
    const old = byId[id];
    old.lessons = [1, row.lesson];
    old.english = AGAIN[id] || gloss(row.english);
    report.again.push("L" + row.lesson + "  " + old.lemma + "  " + old.english);
    return;
  }
  if (OWN_ID[id]) id = OWN_ID[id];
  if (byId[id]) throw new Error("duplicate id " + id + " (" + row.entry + "): add it to OWN_ID or AGAIN");
  const o = { id, curriculum: "henle3", lesson: row.lesson, pos: e.pos, lemma: e.lemma };
  ["gen", "gender", "declension", "parts", "conjugation", "nom", "flags", "forms"].forEach((k) => { if (e[k] != null && !(Array.isArray(e[k]) && !e[k].length)) o[k] = e[k]; });
  o.english = gloss(row.english);
  entries.push(o); byId[id] = o;
  report.built.push("L" + String(row.lesson).padEnd(3) + e.pos.padEnd(12) + (e.pos === "noun" ? e.lemma + ", " + e.gen + ", " + e.gender + ". (" + e.declension + ")" : e.pos === "verb" ? e.parts.join(", ") + " (" + e.conjugation + ")" : e.nom ? e.nom.join(", ") + (e.gen ? " (gen. " + e.gen + ")" : "") : e.lemma) + (o.flags ? " [" + o.flags + "]" : ""));
});

// Every entry must go through the engine.
entries.forEach((e) => {
  try {
    if (e.pos === "noun") L.declineNoun(e);
    else if (e.pos === "verb") L.synopsis(e);
    else if (e.pos === "adjective" && e.nom) L.declineAdjective(e);
  } catch (x) { report.notes.push(e.id + ": " + x.message); }
});

if (write) {
  const dir = path.join(repo, "site/practice/data/henle3");
  fs.mkdirSync(dir, { recursive: true });
  const order = ["id", "curriculum", "lesson", "lessons", "review", "pos", "lemma", "gen", "gender", "declension", "stem", "parts", "conjugation", "nom", "flags", "forms", "english"];
  const clean = entries.map((e) => { const o = {}; order.forEach((k) => { if (e[k] != null) o[k] = e[k]; }); return o; });
  fs.writeFileSync(path.join(dir, "vocab.json"), "[\n" + clean.map((e) => JSON.stringify(e)).join(",\n") + "\n]\n");
  console.log("wrote " + clean.length + " entries");
}
module.exports = { entries, report, rows };
if (require.main === module) {
  console.log("entries " + entries.length + ": " + book2.length + " from the earlier years, " + report.built.length + " built from the lesson lists");
  console.log("\n== built ==\n" + report.built.join("\n"));
  console.log("\n== earlier words boxed again ==\n" + report.again.join("\n"));
  console.log("\n== notes ==\n" + report.notes.join("\n"));
}
