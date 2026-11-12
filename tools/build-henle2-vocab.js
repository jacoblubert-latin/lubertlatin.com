#!/usr/bin/env node
// Builds site/practice/data/henle2/vocab.json from the book's own lists,
// transcribed in tools/henle2-classified-word-list.txt (the Classified Word
// List, pp. 551-584: every required word, by declension and conjugation)
// and tools/henle2-lesson-vocab.txt (the VOCABULARY of each Part IV lesson).
//
//   node tools/build-henle2-vocab.js            report only (no changes made)
//   node tools/build-henle2-vocab.js --write    write vocab.json
//
// A word that First Year's vocab.json already has is copied from there
// (principal parts, gender, flags, forms), with Second Year's meaning. The
// rest are built from the printed entry. A word the list marks with an
// asterisk is a second-year word: its lesson is the first lesson whose
// VOCABULARY has it (OUTSIDE below for the few taught in a lesson's text).
// The others are First Year's required words: Lesson 1, "review": true.
// vocab.json for henle2 is this script's output: correct a word in the
// lists or in the tables here, not in vocab.json.
"use strict";
const fs = require("fs"), path = require("path");
const repo = path.join(__dirname, ".."), out = __dirname, write = process.argv.includes("--write");
const L = require(path.join(repo, "site/js/latin-forms.js"));
const read = (f) => fs.readFileSync(f, "utf8").replace(/^﻿/, "");
const book1 = JSON.parse(read(path.join(repo, "site/practice/data/henle/vocab.json")));
const norm = (s) => L.normalize(String(s).replace(/^-/, ""));
const b1 = {};
book1.forEach((e) => { (b1[norm(e.lemma)] = b1[norm(e.lemma)] || []).push(e); });

const rows = [];
["henle2-classified-word-list.txt"].forEach((f) => read(path.join(out, f)).split(/\r?\n/).forEach((l) => {
  if (!l.trim() || l[0] === "#") return;
  const c = l.split("\t");
  rows.push({ section: c[0], star: c[1] === "*", entry: c[2].trim(), english: c[3].trim(), page: c[4] });
}));
const lessonRows = [];
["henle2-lesson-vocab.txt"].forEach((f) => read(path.join(out, f)).split(/\r?\n/).forEach((l) => {
  if (!l.trim() || l[0] === "#") return;
  const c = l.split("\t");
  lessonRows.push({ lesson: +c[0], entry: c[1].trim(), english: (c[2] || "").trim(), page: c[3], heading: c[4] || "" });
}));

// ---------- readings corrected against the usual quantities ----------
const FIX = { "exīre?": "exīre", "īntulī?": "intulī", "īntulī": "intulī", "nuntius": "nūntius", "nuntiō": "nūntiō", "pes": "pēs", "vastō": "vāstō" };
const fix = (s) => s.split(/(\s+|,)/).map((w) => FIX[w] || w).join("");

// ---------- hand data for words that are not in First Year ----------
const GENDER = { "cāritās": "f", "crux": "f", "lībertās": "f", "classis": "f", "cohors": "f" };
const OTHER_POS = {}; // id -> forced pos

const sectionInfo = (s) => {
  const S = s.toUpperCase();
  if (/^PLURAL NOUNS OF THE FIRST/.test(S)) return { pos: "noun", decl: "1", plural: true, gender: "f" };
  if (/^NOUNS OF THE FIRST/.test(S)) return { pos: "noun", decl: "1", gender: "f" };
  if (/^MASCULINE NOUNS OF THE SECOND/.test(S)) return { pos: "noun", decl: "2", gender: "m" };
  if (/^PLURAL NEUTER NOUNS OF THE SECOND/.test(S)) return { pos: "noun", decl: "2", plural: true, gender: "n" };
  if (/^NEUTER NOUNS OF THE SECOND/.test(S)) return { pos: "noun", decl: "2", gender: "n" };
  if (/^PLURAL NOUNS OF THE THIRD.*FĪNĒS/.test(S)) return { pos: "noun", decl: "3", plural: true, istem: true };
  if (/^PLURAL NOUNS OF THE THIRD/.test(S)) return { pos: "noun", decl: "3", plural: true };
  if (/^MASCULINE AND FEMININE NOUNS OF THE THIRD.*PARS/.test(S)) return { pos: "noun", decl: "3", istem: true };
  if (/^MASCULINE AND FEMININE NOUNS OF THE THIRD/.test(S)) return { pos: "noun", decl: "3" };
  if (/^NEUTER NOUNS OF THE THIRD/.test(S)) return { pos: "noun", decl: "3", gender: "n" };
  if (/^NOUNS OF THE FOURTH/.test(S)) return { pos: "noun", decl: "4", gender: "m" };
  if (/^NOUNS OF THE FIFTH/.test(S)) return { pos: "noun", decl: "5", gender: "f" };
  if (/^ADJECTIVES OF THE FIRST.*ŪNUS/.test(S)) return { pos: "adjective", decl: "1-2", genius: true };
  if (/^ADJECTIVES OF THE FIRST/.test(S)) return { pos: "adjective", decl: "1-2" };
  if (/^ADJECTIVES OF THE THIRD/.test(S)) return { pos: "adjective", decl: "3" };
  if (/^COMPARATIVE ADJECTIVES/.test(S)) return { pos: "adjective", undeclined: true };
  if (/^IRREGULAR AND MIXED/.test(S)) return { pos: "mixed" };
  if (/^ADVERBS/.test(S)) return { pos: "adverb" };
  if (/^PRONOUNS/.test(S)) return { pos: "pronoun" };
  if (/^NUMERALS/.test(S)) return { pos: "adjective", undeclined: true, numeral: true };
  if (/^PREPOSITIONS/.test(S)) return { pos: "preposition" };
  if (/^OTHER WORDS/.test(S)) return { pos: "other" };
  if (/^VERBS OF THE FIRST/.test(S)) return { pos: "verb", conj: "1" };
  if (/^VERBS OF THE SECOND/.test(S)) return { pos: "verb", conj: "2" };
  if (/^VERBS OF THE THIRD/.test(S)) return { pos: "verb", conj: "3" };
  if (/^VERBS OF THE FOURTH/.test(S)) return { pos: "verb", conj: "4" };
  if (/^-IŌ VERBS/.test(S)) return { pos: "verb", conj: "3io" };
  if (/^DEPONENT VERBS OF THE FIRST/.test(S)) return { pos: "verb", conj: "1", dep: true };
  if (/^DEPONENT VERBS OF THE SECOND/.test(S)) return { pos: "verb", conj: "2", dep: true };
  if (/^DEPONENT VERBS OF THE THIRD/.test(S)) return { pos: "verb", conj: "3", dep: true };
  if (/^DEPONENT VERBS OF THE FOURTH/.test(S)) return { pos: "verb", conj: "4", dep: true };
  if (/^DEPONENT -IŌ/.test(S)) return { pos: "verb", conj: "3io", dep: true };
  if (/^IRREGULAR VERBS|^OTHER IRREGULAR/.test(S)) return { pos: "verb", conj: "irregular" };
  if (/^VERBAL IDIOMS/.test(S)) return { pos: "other", idiom: true };
  if (/^CONJUNCTIONS/.test(S)) return { pos: "conjunction" };
  throw new Error("unknown section " + s);
};
const PREFIX = { noun: "", verb: "", adjective: "adj-", adverb: "adv-", pronoun: "pro-", preposition: "pre-", conjunction: "con-", other: "oth-", indeclinable: "oth-" };
const idFor = (pos, lemma) => PREFIX[pos] + L.normalize(lemma.replace(/^-/, "")).replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
const gloss = (s) => s.replace(/\s*\.\s\.\s\.\s*/g, " … ").replace(/i\. e\./g, "i.e.").replace(/\s+/g, " ").trim();

const report = { reused: 0, built: [], differ: [], noLesson: [], lessonOnly: [], notes: [] };
const entries = [];
const byKey = {}; // norm lemma -> [entries]
function addEntry(e, row) {
  e.curriculum = "henle2";
  const dup = entries.find((x) => x.id === e.id);
  if (dup) { report.notes.push("duplicate id " + e.id + " (" + row.entry + ")"); e.id += "-2"; }
  e._star = row.star; e._entry = row.entry; e._page = row.page;
  entries.push(e);
  (byKey[norm(e.lemma)] = byKey[norm(e.lemma)] || []).push(e);
  return e;
}
function fromBook1(lemma, pos, accept) {
  const hits = (b1[norm(lemma)] || []).filter((e) => (accept || [pos]).includes(e.pos));
  return hits.length ? JSON.parse(JSON.stringify(hits[0])) : null;
}
function finish(e, row, english) {
  const o = { id: e.id, curriculum: "henle2", lesson: 1, pos: e.pos, lemma: e.lemma };
  ["gen", "gender", "declension", "stem", "parts", "conjugation", "nom", "flags", "forms"].forEach((k) => { if (e[k] != null && !(Array.isArray(e[k]) && !e[k].length)) o[k] = e[k]; });
  o.english = gloss(english);
  return addEntry(o, row);
}

let last = null;
rows.forEach((row) => {
  const info = sectionInfo(row.section);
  // a sub-row ("with ut (nē)"): another meaning of the row above
  if (/^with /.test(row.entry)) {
    const note = row.entry.replace(/^with /, "");
    last.english += "; " + gloss(row.english) + " (with " + (note === "a reflexive pronoun" ? "sē" : note.replace(/accs\./, "accusatives").replace(/acc\. w\. infin\./, "the accusative and infinitive")) + ")";
    return;
  }
  let text = fix(row.entry);
  const main = text.split(";")[0].replace(/\s*\(always with an object in Latin\)/, "").trim();
  const f = main.split(",").map((s) => s.trim());
  let lemma = f[0].replace(/\s*\(.*$/, "").trim();
  let e = null;

  if (info.pos === "noun") {
    const b = fromBook1(lemma, "noun");
    if (b) { e = b; report.reused++; }
    else {
      let gen = f[1];
      if (gen === "ae") gen = lemma.replace(/a$/, "ae");
      else if (gen === "ī") gen = lemma.replace(/(us|um)$/, "ī");
      else if (gen === "ūs") gen = lemma.replace(/us$/, "ūs");
      const g = (f[2] || "").replace(/\./g, "").replace(/\s*\(.*$/, "");
      e = { pos: "noun", lemma, gen, gender: ["m", "f", "n"].includes(g) ? g : (info.gender || GENDER[lemma]), declension: info.decl, flags: [] };
      if (info.plural) e.flags.push("plural-only");
      if (info.istem) e.flags.push("i-stem");
      report.built.push("noun  " + lemma + ", " + gen + ", " + e.gender + (e.flags.length ? " [" + e.flags + "]" : ""));
    }
    e.id = idFor("noun", lemma);
  } else if (info.pos === "verb") {
    if (lemma === "oportet" || lemma === "coepī") {
      const o = fromBook1(lemma, "other") || { pos: "other", lemma, forms: ["coepī", "coepisse", "coeptus"] };
      o.id = idFor("other", lemma); if (!fromBook1(lemma, "other")) report.built.push("other " + lemma);
      last = finish(o, row, row.english); return;
    }
    const b = fromBook1(lemma, "verb");
    let parts = f.filter((x) => !/^(1|2|3|4|tr\.|intr\.|irreg\.|tr\. and intr\.)$/.test(x));
    const intr = /(^|,\s)intr\./.test(main) && !/tr\. and intr\./.test(main);
    if (/\{/.test(main)) parts = ["revertor", "revertī", "reversus sum"];
    parts = parts.map((p) => p.replace(/\s*\(.*?\)/g, "").trim());
    if (parts.length === 1) {
      const s = lemma;
      if (info.dep) parts = info.conj === "1" ? [s, s.replace(/or$/, "ārī"), s.replace(/or$/, "ātus sum")]
        : info.conj === "2" ? [s, s.replace(/eor$/, "ērī"), s.replace(/eor$/, "itus sum")]
        : [s, s.replace(/ior$/, "īrī"), s.replace(/ior$/, "ītus sum")];
      else parts = info.conj === "1" ? [s, s.replace(/ō$/, "āre"), s.replace(/ō$/, "āvī"), s.replace(/ō$/, intr ? "ātum" : "ātus")]
        : info.conj === "2" ? [s, s.replace(/eō$/, "ēre"), s.replace(/eō$/, "uī"), s.replace(/eō$/, "itus")]
        : [s, s.replace(/iō$/, "īre"), s.replace(/iō$/, "īvī"), s.replace(/iō$/, "ītus")];
    }
    if (b) {
      e = b; report.reused++;
      const printed = parts.join(", "), had = (b.parts || []).join(", ");
      if (f.length > 3 && printed !== had) report.differ.push("verb  " + had + "   | book 2: " + printed);
    } else {
      e = { pos: "verb", lemma, parts, conjugation: info.conj, flags: [] };
      if (info.dep) e.flags.push("deponent");
      if ((intr || lemma === "volō") && !info.dep) e.flags.push("no-passive");
      report.built.push("verb  " + parts.join(", ") + "  (" + info.conj + (e.flags.length ? " " + e.flags : "") + ")");
    }
    e.id = idFor("verb", lemma);
  } else if (info.pos === "adjective" && !info.undeclined && !/^(paucī|uterque)$/.test(lemma)) {
    const b = fromBook1(lemma, "adjective");
    if (b && b.nom) { e = b; report.reused++; }
    else {
      let nom;
      if (/\(gen\. /.test(text)) nom = [lemma];
      else if (f.length === 3 && f[1] === "a" && f[2] === "um") nom = [lemma, lemma.replace(/us$/, "a"), lemma.replace(/us$/, "um")];
      else if (f.length === 2 && f[1] === "e") nom = [lemma, lemma.replace(/is$/, "e")];
      else nom = f.slice(0, 3);
      e = { pos: "adjective", lemma, nom, declension: info.decl, flags: [] };
      const g = /\(gen\. ([^)]+)\)/.exec(text);
      if (g) e.gen = g[1];
      if (info.genius) e.flags.push("gen-ius");
      report.built.push("adj   " + nom.join(", ") + (e.gen ? " (gen. " + e.gen + ")" : "") + (e.flags.length ? " [" + e.flags + "]" : ""));
    }
    e.id = idFor("adjective", lemma);
  } else {
    // everything else: no paradigm from rules. Reuse the First Year entry
    // (its forms list) when there is one of a fitting kind.
    let pos = info.pos === "mixed" ? "other" : info.pos;
    if (info.idiom) lemma = main.replace(/,.*$/, "").replace(/\s*\(-ēs\)/, "").replace(/\s*\(.*$/, "").trim();
    else if (info.pos === "preposition" || info.pos === "other" || info.pos === "conjunction") lemma = f[0].replace(/\s*\(.*$/, "").trim();
    if (/^(tot|quot)$/.test(lemma)) pos = "adjective";
    const alias = { ab: "ā", ex: "ē" }[lemma];
    const b = fromBook1(alias || lemma, pos, info.pos === "mixed" ? ["other", "indeclinable", "noun", "adjective", "pronoun"] : pos === "other" ? ["other", "indeclinable"] : [pos]);
    if (b && b.lemma !== lemma && !alias && L.normalize(b.lemma) === L.normalize(lemma) && b.lemma.replace(/^-/, "") !== lemma.replace(/^-/, "")) { /* nē is not -ne */ }
    else
    if (b && !(b.lemma.charAt(0) === "-" && lemma.charAt(0) !== "-") && !(info.pos === "mixed" && /indecl\. noun|plūs|plūrēs/.test(text) && b.pos !== "noun")) {
      e = b; report.reused++;
      if (pos !== b.pos) pos = b.pos;
    } else {
      e = { pos, lemma };
      report.built.push(pos.padEnd(5) + " " + lemma + "   <- " + row.entry);
    }
    e.pos = pos === "indeclinable" ? "other" : pos;
    e.lemma = e.lemma || lemma;
    if (e.lemma === "ipse" && !e.forms) e.forms = ["ipse", "ipsa", "ipsum", "ipsīus", "ipsī", "ipsam", "ipsō", "ipsā", "ipsae", "ipsōrum", "ipsārum", "ipsīs", "ipsōs", "ipsās"];
    if (e.lemma === "vīs" && e.pos === "other") { e.pos = "noun"; e.gen = "vīs"; e.gender = "f"; e.declension = "3"; e.stem = "v"; e.flags = ["singular-only"]; e.forms = { "sg.gen": "vīs", "sg.dat": "vī", "sg.acc": "vim", "sg.abl": "vī" }; }
    e.id = idFor(e.pos, e.lemma);
    if (e.lemma === "nē" && e.pos === "other") e.id = "oth-ne-negative";
  }
  last = finish(e, row, row.english);
});

// ---------- fold "aut . . . aut" style rows and doubled prepositions ----------
function fold() {
  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i];
    const m = /^(\S+) (?:\. \. \.|…) (\S+)$/.exec(e.lemma);
    if (m && m[1] === m[2]) {
      const base = entries.find((x) => x.lemma === m[1] && x.pos === e.pos);
      if (base) { base.english += "; " + m[1] + " … " + m[1] + ", " + e.english; entries.splice(i, 1); }
    }
  }
  const seen = {};
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (e.pos !== "preposition") continue;
    const k = e.lemma;
    const kase = /w\. abl/.test(e._entry) ? "ablative" : /w\. acc/.test(e._entry) ? "accusative" : null;
    if (seen[k]) {
      const a = seen[k];
      a.english = a._first + " (with the " + a._case + "); " + e.english + " (with the " + kase + ")";
      a._star = a._star || e._star;
      entries.splice(i, 1); i--;
    } else { seen[k] = e; e._first = e.english; e._case = kase; }
  }
}
fold();

// ---------- lessons ----------
// A second-year word (asterisk) belongs to the first lesson whose VOCABULARY
// has it; a first-year word is known from Lesson 1.
function hint(entry) {
  if (/\bprep\b/.test(entry) || /preceded by gen/.test(entry)) return ["preposition", "other"];
  if (/\bconjs?\b/.test(entry)) return ["conjunction"];
  if (/indecl\. noun/.test(entry)) return ["other", "noun"];
  if (/\badv\b/.test(entry)) return ["adverb"];
  return null;
}
const lessonOfId = {};
lessonRows.forEach((r) => {
  if (/^with /.test(r.entry) || r.heading) return;
  let t = fix(r.entry).replace(/\s*\(Gr\..*?\)/, "");
  let lemma = t.split(/[;,(]/)[0].trim();
  const idiom = { "cōnsilium capere": "cōnsilium capiō", "iter facere": "iter faciō", "proelium committere": "proelium committō", "pedem referre": "pedem referō", "certiōrem": "certiōrem faciō" };
  if (/^certiōrem/.test(t)) lemma = "certiōrem faciō";
  if (/^(ējus|eōrum|mīlia)/.test(t)) return;   // forms of is and mīlle
  if (/^in fugam dō/.test(t)) lemma = "in fugam dō";
  if (idiom[lemma]) lemma = idiom[lemma];
  if (lemma === "ab") lemma = "ā"; if (lemma === "ex") lemma = "ē";
  let c = byKey[norm(lemma)] || [];
  const h = hint(t);
  if (c.length > 1 && h) { const n = c.filter((e) => h.includes(e.pos)); if (n.length) c = n; }
  else if (c.length > 1 && !h) { const n = c.filter((e) => !["adverb", "conjunction", "preposition"].includes(e.pos) || /,/.test(t) === false); if (n.length) c = n; }
  if (c.length > 1) {
    // same lemma, same kind: tell them apart by the meaning
    const n = c.filter((e) => gloss(r.english).split(/[;(]/)[0].trim() === e.english.split(/[;(]/)[0].trim());
    if (n.length) c = n;
  }
  if (!c.length) { report.lessonOnly.push(r.lesson + "\t" + r.entry + "\t" + r.english); return; }
  if (c.length > 1) report.notes.push("lesson " + r.lesson + " " + r.entry + " matched " + c.map((e) => e.id).join(", ") + " (first taken)");
  const e = c[0];
  if (lessonOfId[e.id] == null || r.lesson < lessonOfId[e.id]) lessonOfId[e.id] = r.lesson;
});
const OUTSIDE = {};
[["adj-maximus adj-minimus adj-optimus adj-paruus adj-pessimus adj-maior adj-melior adj-minor adj-peior oth-plures oth-plus", 14],
 ["adv-bene adv-magis adv-magnopere adv-male adv-melius adv-minus adv-nuper adv-peius adv-plus adv-prope adv-propius", 16],
 ["oth-ne-negative oth-utinam", 4]].forEach(([ids, n]) => ids.split(" ").forEach((id) => { OUTSIDE[id] = n; }));
entries.forEach((e) => { if (lessonOfId[e.id] == null && e._star && OUTSIDE[e.id]) lessonOfId[e.id] = OUTSIDE[e.id]; });
entries.forEach((e) => {
  if (!e._star) e.review = true;
  if (lessonOfId[e.id] != null) e.lesson = e._star ? lessonOfId[e.id] : 1;
  else if (e._star) { e.lesson = null; report.noLesson.push(e.id + "\t" + e._entry + "\t" + e.english + "\tp. " + e._page); }
});

const POLISH = {
  "pre-in": "in, on (with the ablative); into, against, upon, onto (with the accusative)",
  "pre-sub": "under, at the foot of (with the ablative); under, beneath, up to; about, toward (of time) (with the accusative)",
  "iesus": null
};
entries.forEach((e) => {
  if (POLISH[e.id]) e.english = POLISH[e.id];
  if (e.id === "iesus") e.forms["sg.acc"] = "Jēsum";
});
if (write) {
  const dir = path.join(repo, "site/practice/data/henle2");
  fs.mkdirSync(dir, { recursive: true });
  const order = ["id", "curriculum", "lesson", "review", "pos", "lemma", "gen", "gender", "declension", "stem", "parts", "conjugation", "nom", "flags", "forms", "english"];
  const clean = entries.map((e) => { const o = {}; order.forEach((k) => { if (e[k] != null) o[k] = e[k]; }); return o; });
  fs.writeFileSync(path.join(dir, "vocab.json"), "[\n" + clean.map((e) => JSON.stringify(e)).join(",\n") + "\n]\n");
  console.log("wrote " + clean.length + " entries");
}
module.exports = { entries, report, lessonRows, rows, L };
if (require.main === module) {
  console.log("entries " + entries.length + ", reused from First Year " + report.reused + ", built " + report.built.length);
  console.log("\n== built new ==\n" + report.built.join("\n"));
  console.log("\n== principal parts differ from First Year file ==\n" + report.differ.join("\n"));
  console.log("\n== second-year words in no lesson list ==\n" + report.noLesson.join("\n"));
  console.log("\n== lesson-list words not in the classified list ==\n" + report.lessonOnly.join("\n"));
  console.log("\n== notes ==\n" + report.notes.join("\n"));
}
