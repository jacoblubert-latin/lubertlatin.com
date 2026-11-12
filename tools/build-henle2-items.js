#!/usr/bin/env node
// Builds site/practice/data/henle2/items.json (the parsing drill):
//   1. the First Year sentences (henle/items.json) whose every word is in
//      Second Year's vocab.json, each at the lesson by which Second Year has
//      taught all its words and forms (L.availability);
//   2. the sentences in NEW below, written with Second Year's words.
// Run it after build-henle2-vocab.js:   node tools/build-henle2-items.js
"use strict";
const fs = require("fs"), path = require("path");
const repo = path.join(__dirname, "..");
const L = require(path.join(repo, "site/js/latin-forms.js"));
const read = (f) => JSON.parse(fs.readFileSync(path.join(repo, f), "utf8").replace(/^﻿/, ""));
const vocab = read("site/practice/data/henle2/vocab.json");
const grammar = read("site/practice/data/henle2/curriculum.json").grammar;
const old = read("site/practice/data/henle/items.json");

const N = (c, n, g, use) => ({ type: "noun", parse: { case: c, number: n, gender: g, use } });
const V = (p, n, tense, voice, mood, clause) => ({ type: "verb", parse: Object.assign({ person: p, number: n, tense, voice, mood }, clause ? { clause } : {}) });
// [sentence, [target, parse, explanation]...]
const NEW = [
  ["Timor mortis in cohorte erat.",
    ["Timor", N("nom", "sg", "m", "subject"), "Timor is nominative singular (timor, timōris) and erat needs a subject; mortis, a genitive, cannot be it."],
    ["cohorte", N("abl", "sg", "f", "ablative of place where"), "cohorte is ablative singular of cohors, cohortis; with in and the ablative it tells where the fear was."]],
  ["Auctōritās cōnsulis in prōvinciā magna erat.",
    ["Auctōritās", N("nom", "sg", "f", "subject"), "Nouns in -tās, -tātis are feminine; Auctōritās is nominative singular, the subject of erat, and magna agrees with it."],
    ["cōnsulis", N("gen", "sg", "m", "possession"), "The ending -is on cōnsul- is genitive singular; it tells whose authority it was."]],
  ["Barbarī oppida Galliae incolunt.",
    ["oppida", N("acc", "pl", "n", "direct object"), "oppida is neuter plural, nominative or accusative by form; Barbarī is the subject of incolunt, so oppida is what they inhabit."],
    ["incolunt", V(3, "pl", "present", "active", "indicative"), "incolō is third conjugation; -unt is the third person plural of the present indicative active: they inhabit."]],
  ["Hostēs pīla in mūrum jēcērunt.",
    ["pīla", N("acc", "pl", "n", "direct object"), "pīlum is a neuter of the second declension, so pīla is plural; it is what the enemy threw."],
    ["mūrum", N("acc", "sg", "m", "accusative of place to which"), "in with the accusative shows motion toward: the javelins were thrown onto the wall."],
    ["jēcērunt", V(3, "pl", "perfect", "active", "indicative"), "jēc- is the perfect stem of jaciō (jaciō, jacere, jēcī, jactus); -ērunt is third person plural perfect active."]],
  ["Cōnsul quaesīvit quot cohortēs in oppidō essent.",
    ["cohortēs", N("nom", "pl", "f", "subject"), "cohortēs could be nominative or accusative plural; here it is the subject of essent in the indirect question."],
    ["essent", V(3, "pl", "imperfect", "active", "subjunctive", "indirect question"), "quot introduces an indirect question after quaesīvit; a past main verb takes the imperfect subjunctive for action at the same time."]],
  ["Hostēs ā cohorte in fugam datī sunt.",
    ["cohorte", N("abl", "sg", "f", "ablative of agent"), "With a passive verb, ā and the ablative of living persons names the agent: by the cohort."],
    ["datī sunt", V(3, "pl", "perfect", "passive", "indicative"), "The perfect participle datī (masculine plural, agreeing with Hostēs) with sunt is the perfect indicative passive: they were put to flight."]],
  ["Lēgātum mīsit nē oppidum incenderētur.",
    ["Lēgātum", N("acc", "sg", "m", "direct object"), "Lēgātum is accusative singular, the object of mīsit."],
    ["incenderētur", V(3, "sg", "imperfect", "passive", "subjunctive", "purpose"), "nē introduces a negative purpose clause; incenderē- with -tur is the imperfect subjunctive passive, after the past tense mīsit."]],
  ["Cum mīlitēs flūmen vīdissent, Caesar eōs cohortātus est.",
    ["flūmen", N("acc", "sg", "n", "direct object"), "flūmen is neuter, nominative or accusative by form; mīlitēs is the subject of vīdissent, so flūmen is what they had seen."],
    ["vīdissent", V(3, "pl", "pluperfect", "active", "subjunctive", "cum-circumstantial"), "cum meaning when, in past time, takes the subjunctive; the pluperfect (vīd-issent) shows the seeing came before the encouraging."]],
  ["Lēgātōs mīsit quī pācem peterent.",
    ["pācem", N("acc", "sg", "f", "direct object"), "pācem is accusative singular of pāx, pācis, the object of peterent."],
    ["peterent", V(3, "pl", "imperfect", "active", "subjunctive", "purpose"), "A relative clause with the subjunctive can express purpose: he sent envoys who were to seek peace, that is, to seek peace."]],
  ["Caesar cum legiōnibus flūmen trānsiit.",
    ["legiōnibus", N("abl", "pl", "f", "ablative of accompaniment"), "cum with the ablative of persons shows accompaniment: with the legions."],
    ["trānsiit", V(3, "sg", "perfect", "active", "indicative"), "trānsiit is the perfect of trānseō (trānseō, trānsīre, trānsiī, trānsitus): he crossed. The present would be trānsit."]],
  ["Barbarī bellum populō Rōmānō intulērunt.",
    ["bellum", N("acc", "sg", "n", "direct object"), "bellum is neuter, nominative or accusative by form; Barbarī is the subject, so bellum is the object of intulērunt."],
    ["intulērunt", V(3, "pl", "perfect", "active", "indicative"), "intul- is the perfect stem of īnferō (īnferō, īnferre, intulī, illātus); -ērunt is third person plural perfect active."]],
  ["Cōnsul cōpiās redūcere nōn potuit.",
    ["cōpiās", N("acc", "pl", "f", "direct object"), "cōpiās is accusative plural, the object of the infinitive redūcere."],
    ["potuit", V(3, "sg", "perfect", "active", "indicative"), "potu- is the perfect stem of possum (possum, posse, potuī); potuit is third person singular: he was able."]],
  ["Postquam hostēs vīdit, dux cohortēs in castra redūxit.",
    ["castra", N("acc", "pl", "n", "accusative of place to which"), "castra is plural in form; in with the accusative shows motion toward: into the camp."],
    ["vīdit", V(3, "sg", "perfect", "active", "indicative"), "postquam takes the perfect indicative; vīdit is third person singular perfect of videō."],
    ["redūxit", V(3, "sg", "perfect", "active", "indicative"), "redūx- is the perfect stem of redūcō (compounds keep the parts of dūcō): he led back."]],
  ["Cōnsul imperāvit ut cohortēs pontem facerent.",
    ["pontem", N("acc", "sg", "m", "direct object"), "pontem is accusative singular of pōns, pontis, the object of facerent."],
    ["facerent", V(3, "pl", "imperfect", "active", "subjunctive", "indirect command"), "After imperō, ut with the subjunctive gives what was ordered; the past tense imperāvit takes the imperfect subjunctive."]],
  ["Tantus erat timor ut nēmō ex castrīs exīret.",
    ["timor", N("nom", "sg", "m", "subject"), "timor is nominative singular, the subject of erat; Tantus agrees with it in the predicate."],
    ["castrīs", N("abl", "pl", "n", "ablative of place from which"), "ex with the ablative shows motion out of a place: out of the camp."],
    ["exīret", V(3, "sg", "imperfect", "active", "subjunctive", "result"), "Tantus points ahead to a result clause: ut with the subjunctive. exīret is the imperfect subjunctive of exeō, formed on the infinitive exīre."]],
  ["Eō annō Gallī bellum populō Rōmānō intulērunt.",
    ["annō", N("abl", "sg", "m", "ablative of time when"), "The ablative without a preposition tells when: in that year."],
    ["Gallī", N("nom", "pl", "m", "subject"), "Gallī could be genitive singular or nominative plural; intulērunt is plural and needs a plural subject."]],
  ["Cōnsul, redūc cohortēs in castra!",
    ["Cōnsul", N("voc", "sg", "m", "vocative/direct address"), "The consul is being spoken to; in the third declension the vocative is like the nominative."],
    ["redūc", V(2, "sg", "present", "active", "imperative"), "dūcō and its compounds drop the -e in the singular imperative: dūc, redūc. The plural is redūcite."]],
  ["Cum flūmen altum esset, cohortēs trānsīre nōn potuērunt.",
    ["flūmen", N("nom", "sg", "n", "subject"), "flūmen is neuter, nominative or accusative by form; it is the subject of esset, and altum agrees with it."],
    ["esset", V(3, "sg", "imperfect", "active", "subjunctive", "cum-causal"), "cum here gives the reason, since the river was deep; causal cum always takes the subjunctive."],
    ["potuērunt", V(3, "pl", "perfect", "active", "indicative"), "potu- is the perfect stem of possum; -ērunt is third person plural perfect active: they were not able."]]
];

const out = [];
let dropped = [];
// 1. the First Year sentences
old.forEach((it) => {
  const r = L.availability(it.sentence, vocab, "henle2", grammar);
  if (r.unknown.length) { dropped.push(it.id + " (" + r.unknown.join(", ") + ")"); return; }
  const o = Object.assign({}, it, { curriculum: "henle2", lesson: r.lesson });
  delete o.available;
  // an imperative is read as one from the imperative's lesson, whatever else the form could be
  if (it.type === "verb" && it.parse.mood === "imperative") o.lesson = Math.max(o.lesson, grammar.verbs.imperative.active.present["1"]);
  if (/!$/.test(it.sentence) || it.parse.case === "voc") o.lesson = Math.max(o.lesson, it.sentence.match(/Servāte|Ōrā/) ? grammar.verbs.imperative.active.present["1"] : grammar.nouns.vocative);
  out.push(o);
});
// 2. the new ones
NEW.forEach((row, i) => {
  const sentence = row[0], words = sentence.trim().split(/\s+/);
  const r = L.availability(sentence, vocab, "henle2", grammar);
  if (r.unknown.length) throw new Error("unknown words in: " + sentence + " -> " + r.unknown.join(", "));
  row.slice(1).forEach((t) => {
    const first = t[0].split(" ")[0];
    const idx = words.map((w) => w.replace(/[^\p{L}]/gu, "")).indexOf(first);
    if (idx < 0 || words.map((w) => w.replace(/[^\p{L}]/gu, "")).lastIndexOf(first) !== idx) throw new Error("target not found once: " + t[0] + " in " + sentence);
    let lesson = r.lesson;
    if (t[1].type === "verb" && t[1].parse.mood === "imperative") lesson = Math.max(lesson, 29);
    if (/!$/.test(sentence)) lesson = Math.max(lesson, 29);
    out.push({ id: "c" + String(i + 1).padStart(2, "0") + "-w" + idx, curriculum: "henle2", sentence, target_index: idx, target: t[0], lesson, type: t[1].type, parse: t[1].parse, explanation: t[2] });
    console.log(String(lesson).padStart(2) + "  " + sentence + "  [" + t[0] + "]");
  });
});
fs.writeFileSync(path.join(repo, "site/practice/data/henle2/items.json"), "[\n" + out.map((x) => JSON.stringify(x)).join(",\n") + "\n]\n");
console.log("wrote " + out.length + " items; dropped " + dropped.length + ": " + dropped.join("; "));
