#!/usr/bin/env node
// Sets each vocab.json entry's "lesson" from the textbook's own lesson
// vocabulary lists, transcribed in tools/<curriculum>-lesson-vocab.txt
// (tab-separated: lesson, dictionary entry as printed, meaning, book page).
//
//   node tools/apply-lesson-vocab.js            report only (no changes made)
//   node tools/apply-lesson-vocab.js --write    write the lessons into vocab.json
//
// A word's lesson is the first lesson whose list has it. Words are matched
// on the lemma, macrons ignored and i/j, u/v alike (L.normalize). A bare
// verb form in an early list (ōrat, vīcērunt) counts for its verb. The
// report lists: book entries with no vocab.json entry, vocab.json entries
// in no list (left unchanged), and entries whose spelling, genitive or
// principal parts differ from the book.
"use strict";
const fs = require("fs");
const path = require("path");
const L = require("../site/js/latin-forms.js");

const args = process.argv.slice(2);
let curriculum = "henle", write = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--curriculum") curriculum = args[++i];
  else if (args[i] === "--write") write = true;
}
const vocabPath = path.join(__dirname, "..", "site", "practice", "data", curriculum, "vocab.json");
const listPath = path.join(__dirname, curriculum + "-lesson-vocab.txt");
const vocabText = fs.readFileSync(vocabPath, "utf8").replace(/^﻿/, "");
const EOL = vocabText.indexOf("\r\n") >= 0 ? "\r\n" : "\n";
const vocab = JSON.parse(vocabText);
const rows = fs.readFileSync(listPath, "utf8").replace(/^﻿/, "").split(/\r?\n/)
  .filter((l) => l.trim() && l[0] !== "#")
  .map((l) => { const f = l.split("\t"); return { lesson: +f[0], entry: (f[1] || "").trim(), english: f[2] || "", page: f[3] || "" }; });

// Entries the lists cannot place, with the reason.
const KEEP = {
  sum: "est and sunt are used from the first lessons (table on p. 28); the lists have only erat/erant (L3) and sum (L14)",
};
// Homographs the printed entry does not tell apart: "lesson|lemma" -> id.
// (The book lists cōnsuēscō only in the perfect: cōnsuēvī, cōnsuētus.)
const PICK = { "25|quō": "adv-quo", "2|dedit": "do", "35|cōnsuēvī": "consuesco" };

const nfc = (s) => String(s || "").normalize("NFC");
const byLemma = {};
vocab.forEach((v) => { const k = L.normalize(v.lemma); (byLemma[k] = byLemma[k] || []).push(v); });
// finite verb form -> verbs that have it
const byVerbForm = {};
vocab.filter((v) => v.pos === "verb").forEach((v) => {
  let fl = [];
  try { fl = L.formLessons(v, curriculum, {}); } catch (e) { /* the validator reports these */ }
  fl.forEach((x) => { const a = (byVerbForm[x.form] = byVerbForm[x.form] || []); if (a.indexOf(v) < 0) a.push(v); });
});

function posHint(entry) {
  if (/\bprep\b|preceded by gen/.test(entry)) return "preposition";
  if (/\bconjs?\b|conjunction/.test(entry)) return "conjunction";
  if (/\badv\b|adverb/.test(entry)) return "adverb";
  if (/pronoun/.test(entry)) return "pronoun";
  if (isAdjective(entry)) return "adjective";
  return null;
}
// "magnus, a, um", "miser, misera, miserum"
function isAdjective(entry) { return /^\S+, a, um\b|^\S+ a, um\b|^\S+er, \S+a, \S+um\b/.test(entry); }
const SMALL = ["preposition", "conjunction", "adverb", "adjective"];
// "ab (ā), prep. w. abl." -> ["ab", "ā"];  "terra, terrae" -> ["terra"]
function headwords(entry) {
  const head = entry.split(/[,;]/)[0].replace(/[!?]/g, "").replace(/ interjection$/, "").trim();
  const m = head.match(/^(\S+) \((\S+)\)$/);
  if (m) return [m[1], m[2]];
  // "certiōrem (-ēs) facere" -> "certiōrem facere";  "parātus a" -> "parātus"
  return [head.replace(/ \([^)]*\)/g, "").replace(/ a$/, "")];
}
// A phrase whose words are all in vocab.json already needs no entry of its own.
let formIndex = null;
function knownWords(phrase) {
  if (!formIndex) { formIndex = {}; vocab.forEach((v) => { try { L.formLessons(v, curriculum, {}).forEach((x) => { formIndex[x.form] = true; }); } catch (e) { /* validator's job */ } }); }
  const words = phrase.replace(/\. \. \./g, " ").split(/\s+/).filter(Boolean);
  return words.length > 1 && words.every((w) => formIndex[L.normalize(w)]);
}
function match(r) {
  if (r.entry[0] === "(") return { skip: "sub-line of the entry above" };
  const heads = headwords(r.entry);
  const hint = posHint(r.entry);
  const picked = PICK[r.lesson + "|" + heads[0]];
  if (picked) return { hits: vocab.filter((v) => v.id === picked), how: "lemma" };
  for (const h of heads) {
    let c = byLemma[L.normalize(h)] || [];
    if (c.length > 1 && hint) { const byPos = c.filter((v) => v.pos === hint); if (byPos.length) c = byPos; }
    if (c.length > 1 && !hint) { const rest = c.filter((v) => SMALL.indexOf(v.pos) < 0); if (rest.length) c = rest; }
    if (c.length > 1) { const exact = c.filter((v) => nfc(v.lemma).toLowerCase() === nfc(h).toLowerCase()); if (exact.length) c = exact; }
    if (c.length) return { hits: c, how: "lemma", head: h };
  }
  if (heads.length === 1 && !/\s/.test(heads[0]) && r.entry.indexOf(",") < 0) {
    const c = byVerbForm[L.normalize(heads[0])] || [];
    // "erat" is also the second word of every pluperfect passive: it is sum's
    const sum = c.filter((v) => L.normalize(v.lemma) === "sum");
    if (c.length) return { hits: sum.length ? sum : c, how: "form" };
  }
  if (knownWords(heads[0])) return { skip: "phrase" };
  return { hits: [] };
}

// ---- compare a matched entry with what the book prints ----
function differences(r, v) {
  const out = [];
  // Rōmānus, a, um beside the noun Rōmānus, ī: nothing to compare
  if (isAdjective(r.entry) && (v.pos === "noun" || v.pos === "verb")) return out;
  // alternatives in brackets stay with their word: "īvī (iī)", "(pl., loca, locōrum)"
  const parts = r.entry.split(";")[0].replace(/\([^)]*\)/g, (m) => m.replace(/,/g, "\u0001"))
    .split(",").map((s) => s.replace(/\u0001/g, ",").trim()).filter(Boolean);
  const head = parts[0].replace(/ \(.*\)$/, "").replace(/[!?]/g, "");
  const same = (a, b) => nfc(a).toLowerCase() === nfc(b).toLowerCase();
  if (v.pos === "noun") {
    if (L.normalize(head) === L.normalize(v.lemma) && !same(head, v.lemma)) out.push("lemma: book " + head + ", vocab.json " + v.lemma);
    let g = (parts[1] || "").replace(/ \(.*\)$/, "");
    if (g && !/^(m|f|n|c|indecl)\b/.test(g)) {
      // Henle abbreviates the genitive: "prōvincia, ae", "gladius, ī", "adventus, ūs"
      const full = nfc(v.gen), short = nfc(g);
      const ok = same(full, short) || (short.length <= 5 && full.toLowerCase().endsWith(short.toLowerCase()) && !/\s/.test(short));
      if (!ok) out.push("genitive: book " + g + ", vocab.json " + v.gen);
    }
    const gm = r.entry.match(/,\s*([mfn])\.(?:\s|,|;|$)/);
    if (gm && gm[1] !== v.gender) out.push("gender: book " + gm[1] + ", vocab.json " + v.gender);
  } else if (v.pos === "verb") {
    const words = parts.filter((p) => !/^(\d$|tr\.|intr\.|irreg\.)/.test(p));
    const conj = (r.entry.match(/,\s*([1-4]),/) || [])[1];
    let book = words;
    if (words.length === 1 && conj === "1" && /ō$/.test(words[0])) {
      const st = words[0].slice(0, -1);
      book = [words[0], st + "āre", st + "āvī", st + (/\bintr\b/.test(r.entry) && !/\btr\b/.test(r.entry.replace(/intr/g, "")) ? "ātum" : "ātus")];
    }
    if (words.length === 1 && book.length === 1) {
      if (L.normalize(head) === L.normalize(v.lemma) && !same(head, v.lemma)) out.push("lemma: book " + head + ", vocab.json " + v.lemma);
    } else {
      const mine = (v.parts || []).map(nfc);
      const theirs = book.map(nfc);
      const sameParts = mine.length === theirs.length && mine.every((p, i) => same(p, theirs[i]) ||
        // the book gives the future participle of an intransitive (ventūrus); vocab.json may keep the supine (ventum)
        (i === 3 && same(p.replace(/um$/, ""), theirs[i].replace(/ūrus$/, "").replace(/us$/, ""))));
      if (!sameParts) out.push("principal parts: book " + theirs.join(", ") + "; vocab.json " + mine.join(", "));
    }
    const vc = String(v.conjugation) === "3io" ? "3" : String(v.conjugation);
    if (conj && vc !== "irregular" && conj !== vc) out.push("conjugation: book " + conj + ", vocab.json " + v.conjugation);
  } else {
    if (L.normalize(head) === L.normalize(v.lemma) && !same(head, v.lemma)) out.push("lemma: book " + head + ", vocab.json " + v.lemma);
  }
  return out;
}

const first = {};      // id -> {lesson, row}
const unmatched = [], formOnly = [], diffs = [], skipped = [];
rows.forEach((r) => {
  const m = match(r);
  if (m.skip) { if (m.skip === "phrase") skipped.push(r); return; }
  if (!m.hits.length) { unmatched.push(r); return; }
  m.hits.forEach((v) => {
    if (!first[v.id] || r.lesson < first[v.id].lesson) first[v.id] = { lesson: r.lesson, row: r };
    if (m.how === "form") formOnly.push({ r: r, v: v });
    else differences(r, v).forEach((d) => diffs.push({ r: r, v: v, d: d }));
  });
});

let moved = 0;
const moves = [], kept = [];
vocab.forEach((v) => {
  const f = first[v.id];
  if (!f) return;
  if (KEEP[v.id]) { kept.push(v); return; }
  if (v.lesson !== f.lesson) { moves.push(v.id + ": " + v.lesson + " -> " + f.lesson); v.lesson = f.lesson; moved++; }
});
const unseen = vocab.filter((v) => !first[v.id]);

const line = (r) => "L" + r.lesson + " p." + r.page + "  " + r.entry + "  —  " + r.english;
console.log(rows.length + " list entries, " + vocab.length + " vocab.json entries.");
console.log("\nLessons changed (" + moved + "):\n  " + (moves.join("\n  ") || "none"));
console.log("\nKept as they are (" + kept.length + "):");
kept.forEach((v) => console.log("  " + v.id + " stays at " + v.lesson + ": " + KEEP[v.id]));
console.log("\nBare verb forms counted for their verb (" + formOnly.length + "):");
formOnly.forEach((x) => console.log("  " + line(x.r) + "  => " + x.v.lemma));
console.log("\nBook entries with no vocab.json entry (" + unmatched.length + "):");
unmatched.forEach((r) => console.log("  " + line(r)));
console.log("\nPhrases made of words vocab.json already has, no entry needed (" + skipped.length + "):");
skipped.forEach((r) => console.log("  " + line(r)));
console.log("\nvocab.json entries in no lesson list, lesson unchanged (" + unseen.length + "):");
unseen.forEach((v) => console.log("  " + v.id + "  " + v.lemma + " (" + v.pos + ", lesson " + v.lesson + ")"));
console.log("\nDifferences from the book (" + diffs.length + "):");
diffs.forEach((x) => console.log("  " + x.v.id + "  " + x.d + "   [" + line(x.r) + "]"));

if (write) {
  // Keep the one-entry-per-line layout.
  fs.writeFileSync(vocabPath, ("[\n" + vocab.map((v) => JSON.stringify(v)).join(",\n") + "\n]\n").replace(/\n/g, EOL));
  console.log("\nWrote " + moved + " lesson" + (moved === 1 ? "" : "s") + " to " + path.relative(process.cwd(), vocabPath) + ".");
}
