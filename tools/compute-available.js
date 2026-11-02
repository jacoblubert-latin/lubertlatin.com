#!/usr/bin/env node
// Works out when each sentence in items.json becomes available in a
// curriculum: the lesson that introduces the last of its words, looked up
// by generating every form of every vocab.json entry.
//
//   node tools/compute-available.js                 report for henle (no changes made)
//   node tools/compute-available.js --write         fill in "available": {"henle": N} on each item
//   node tools/compute-available.js --curriculum wheelock [--write]
//
// Words the vocab doesn't cover are listed so you can add them; an item
// with unknown words keeps whatever "available" it already has (or its
// "lesson") unless every word is known.
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
const dir = path.join(__dirname, "..", "site", "practice", "data", curriculum);
const read = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8").replace(/^﻿/, ""));
const items = read("items.json"), vocab = read("vocab.json");

const unknownCounts = {};
let known = 0, changed = 0;
items.forEach((it) => {
  const r = L.availability(it.sentence, vocab, curriculum);
  r.unknown.forEach((w) => { const k = w.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, "").toLowerCase(); unknownCounts[k] = (unknownCounts[k] || 0) + 1; });
  const current = L.lessonOf(it, curriculum);
  if (r.unknown.length === 0) {
    known++;
    const mark = r.lesson !== current ? "  (currently " + current + ")" : "";
    console.log(it.id + ": lesson " + r.lesson + mark + "   " + it.sentence);
    if (write && r.lesson !== (it.available && it.available[curriculum])) {
      it.available = Object.assign({}, it.available, { [curriculum]: r.lesson });
      changed++;
    }
  } else {
    console.log(it.id + ": unknown " + r.unknown.join(", ") + (r.lesson != null ? " (known words reach lesson " + r.lesson + ")" : "") + "   " + it.sentence);
  }
});

const unknownList = Object.keys(unknownCounts).sort((a, b) => unknownCounts[b] - unknownCounts[a]);
console.log("\n" + known + " of " + items.length + " sentences fully covered by vocab.json.");
if (unknownList.length) console.log("Words not in vocab.json (" + unknownList.length + "): " + unknownList.map((w) => w + " ×" + unknownCounts[w]).join(", "));

if (write) {
  // Keep the one-item-per-line layout.
  const out = "[\n" + items.map((it) => JSON.stringify(it)).join(",\n") + "\n]\n";
  fs.writeFileSync(path.join(dir, "items.json"), out);
  console.log("Wrote " + changed + " availability value" + (changed === 1 ? "" : "s") + " to " + path.relative(process.cwd(), path.join(dir, "items.json")) + ".");
}
