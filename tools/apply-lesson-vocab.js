#!/usr/bin/env node
// Sets each vocab.json entry's "lesson" from the textbook's own lesson
// vocabulary lists, transcribed in tools/<curriculum>-lesson-vocab.txt
// (tab-separated: lesson, dictionary entry as printed, meaning, book page).
//
//   node tools/apply-lesson-vocab.js            report only (no changes made)
//   node tools/apply-lesson-vocab.js --write    write the lessons into vocab.json
//
// A word's lesson is the first lesson whose list has its dictionary entry.
// Words are matched on the lemma, macrons ignored and i/j, u/v alike
// (L.normalize). A bare verb form in an early list (ōrat, vīcērunt) is an
// entry of its own (frm-orat); it does not date its verb, which waits for
// the lesson that boxes laudō, dō, videō... A word boxed in more than one
// lesson (a later VOCABULARY list, or a REVIEW VOCABULARY list, below)
// also gets "lessons": every lesson that boxes it. The report lists: book entries with no vocab.json entry, vocab.json entries
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
const KEEP = {};
// REVIEW VOCABULARY lists (not in the .txt file): lesson -> ids boxed again.
const REVIEW = {
  11: ["imperator"],
  17: ["do", "adiuuo", "colloco", "oppugno", "uoco", "occupo"],
  18: ["terreo", "teneo", "uideo"],
  19: ["defendo", "duco", "pello", "uinco", "ago"],
  20: ["audio", "munio", "uenio", "conuenio"],
  25: ["adv-ubi", "adv-cur", "pro-quis", "uoco", "appello", "nomen"],
  32: ["pre-a", "pre-de"],
  33: ["pro-is"],
  34: ["adj-liber", "adj-tutus", "defendo", "adj-plenus", "pre-cum", "pre-pro", "pre-a", "pre-de", "pre-sine", "absum"],
  35: ["paro", "timeo", "adj-paratus", "contendo"],
  37: ["adj-primus", "adj-alter"],
  39: ["scio", "audio", "cerno", "cognosco", "confirmo", "conspicio", "ostendo", "probo", "moneo", "uideo"],
  40: ["adv-quam"],
};
// Words the book teaches outside a VOCABULARY list (a rule box, the
// lesson's own text, or a footnote gloss): id -> [lesson, where].
// Used only when the word is in no list.
const OUTSIDE = {
  "littera": [1, "the lesson's text"],
  "frm-est": [1, "est and sunt are used from the first lessons (table on p. 28); sum itself is boxed in Lesson 14"],
  "con-ut": [22, "rule box, p. 227"],
  "con-ne": [22, "rule box, p. 230"],
  "con-quo": [24, "section 4, p. 263"],
  "con-cum": [29, "p. 318"],
  "con-utinam": [27, "section 3, p. 300"],
  "oth-nonne": [25, "section 2, pp. 269-270"],
  "oth-num": [25, "section 2, pp. 269-270"],
  "pro-hic": [31, "the lesson's model word, p. 331"],
  "adj-meus": [16, "section 3, p. 173"],
  "adj-tuus": [16, "section 3, p. 173"],
  "adj-noster": [16, "section 3, p. 173"],
  "adj-uester": [16, "section 3, p. 173"],
  "adj-unus": [36, "assignment, p. 370"],
  "adj-duo": [36, "assignment, p. 370"],
  "adj-tres": [36, "assignment, p. 370"],
  "con-si": [11, "footnote gloss, p. 129 (earliest found)"],
  "adv-tandem": [16, "footnote gloss, p. 167 (earliest found)"],
  "pre-praeter": [37, "footnote gloss, p. 403 (earliest found)"],
};
// Homographs and phrases the lemma alone does not settle: the printed
// entry, "lesson|printed entry" or "lesson|lemma" -> id.
// (The book lists cōnsuēscō only in the perfect: cōnsuēvī, cōnsuētus.)
const PICK = {
  "25|quō": "adv-quo", "quid, pronoun": "pro-quis", "35|cōnsuēvī": "consuesco",
  "in, prep. w. abl.": "pre-in", "in, prep. w. acc.": "pre-in-acc",
  "24|quī, quae, quod": "pro-qui", "25|quī, quae, quod": "adj-qui",
  "satis, adv.": "adv-satis", "satis, indecl. noun w. gen.": "oth-satis",
  "et . . . et": "oth-et-et", "aut . . . aut, conjs.": "oth-aut-aut", "neque . . . neque, conjs.": "oth-neque-neque",
};

const nfc = (s) => String(s || "").normalize("NFC");
const byLemma = {};
vocab.forEach((v) => { const k = L.normalize(v.lemma); (byLemma[k] = byLemma[k] || []).push(v); });

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
  const picked = PICK[r.entry] || PICK[r.lesson + "|" + r.entry] || PICK[r.lesson + "|" + heads[0]];
  if (picked) return { hits: vocab.filter((v) => v.id === picked), how: "lemma" };
  for (const h of heads) {
    let c = byLemma[L.normalize(h)] || [];
    if (c.length > 1 && hint) { const byPos = c.filter((v) => v.pos === hint); if (byPos.length) c = byPos; }
    if (c.length > 1 && !hint) { const rest = c.filter((v) => SMALL.indexOf(v.pos) < 0); if (rest.length) c = rest; }
    if (c.length > 1) { const exact = c.filter((v) => nfc(v.lemma).toLowerCase() === nfc(h).toLowerCase()); if (exact.length) c = exact; }
    if (c.length) return { hits: c, how: "lemma", head: h };
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
const boxed = {};      // id -> every lesson that boxes it
const box = (id, lesson) => { const a = (boxed[id] = boxed[id] || []); if (a.indexOf(lesson) < 0) a.push(lesson); };
const unmatched = [], diffs = [], skipped = [];
rows.forEach((r) => {
  const m = match(r);
  if (m.skip) { if (m.skip === "phrase") skipped.push(r); return; }
  if (!m.hits.length) { unmatched.push(r); return; }
  m.hits.forEach((v) => {
    if (!first[v.id] || r.lesson < first[v.id].lesson) first[v.id] = { lesson: r.lesson, row: r };
    box(v.id, r.lesson);
    differences(r, v).forEach((d) => diffs.push({ r: r, v: v, d: d }));
  });
});
Object.keys(REVIEW).forEach((l) => REVIEW[l].forEach((id) => {
  if (!vocab.some((v) => v.id === id)) throw new Error("REVIEW names " + id + ", which is not in vocab.json");
  box(id, +l);
}));

let moved = 0;
const moves = [], kept = [], outside = [], again = [];
vocab.forEach((v) => {
  let f = first[v.id];
  if (!f && OUTSIDE[v.id]) { f = first[v.id] = { lesson: OUTSIDE[v.id][0] }; outside.push(v); }
  if (!f) return;
  if (KEEP[v.id]) { kept.push(v); return; }
  if (v.lesson !== f.lesson) { moves.push(v.id + ": " + v.lesson + " -> " + f.lesson); v.lesson = f.lesson; moved++; }
});
// "lessons": every lesson that boxes the word, when there is more than one.
let relisted = 0;
vocab.forEach((v, i) => {
  const all = (boxed[v.id] || []).filter((l) => l >= v.lesson).concat(v.lesson)
    .filter((l, j, a) => a.indexOf(l) === j).sort((a, b) => a - b);
  const want = all.length > 1 ? all : null;
  if (JSON.stringify(v.lessons || null) !== JSON.stringify(want)) relisted++;
  if (want) again.push(v);
  // keep "lessons" right after "lesson"
  const out = {};
  Object.keys(v).forEach((k) => { if (k !== "lessons") out[k] = v[k]; if (k === "lesson" && want) out.lessons = want; });
  vocab[i] = out;
});
const unseen = vocab.filter((v) => !first[v.id]);

const line = (r) => "L" + r.lesson + " p." + r.page + "  " + r.entry + "  —  " + r.english;
console.log(rows.length + " list entries, " + vocab.length + " vocab.json entries.");
console.log("\nLessons changed (" + moved + "):\n  " + (moves.join("\n  ") || "none"));
console.log("\nKept as they are (" + kept.length + "):");
kept.forEach((v) => console.log("  " + v.id + " stays at " + v.lesson + ": " + KEEP[v.id]));
console.log("\nTaught outside a VOCABULARY list, lesson set by hand (" + outside.length + "):");
outside.forEach((v) => console.log("  " + v.id + "  " + v.lemma + ": lesson " + OUTSIDE[v.id][0] + ", " + OUTSIDE[v.id][1]));
console.log("\nBoxed in more than one lesson (" + again.length + "), " + relisted + " changed:");
again.forEach((v) => console.log("  " + v.id + "  " + v.lemma + ": " + boxed[v.id].slice().sort((a, b) => a - b).join(", ")));
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
  console.log("\nWrote " + moved + " lesson" + (moved === 1 ? "" : "s") + " and " + relisted + " lessons list" + (relisted === 1 ? "" : "s") + " to " + path.relative(process.cwd(), vocabPath) + ".");
}
