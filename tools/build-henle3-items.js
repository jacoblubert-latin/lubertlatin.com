#!/usr/bin/env node
// Builds site/practice/data/henle3/items.json (the parsing drill):
//   1. Second Year's sentences (henle2/items.json, which holds First Year's
//      too): every word of them is a review word in Third Year, so each is
//      placed by L.availability, in practice at Lesson 1;
//   2. the sentences in NEW below, written with Third Year's lesson words,
//      each at the lesson that brings the last of its words.
// Run it after build-henle3-vocab.js:   node tools/build-henle3-items.js
"use strict";
const fs = require("fs"), path = require("path");
const repo = path.join(__dirname, "..");
const L = require(path.join(repo, "site/js/latin-forms.js"));
const read = (f) => JSON.parse(fs.readFileSync(path.join(repo, f), "utf8").replace(/^﻿/, ""));
const vocab = read("site/practice/data/henle3/vocab.json");
const grammar = read("site/practice/data/henle3/curriculum.json").grammar;
const old = read("site/practice/data/henle2/items.json");

const N = (c, n, g, use) => ({ type: "noun", parse: { case: c, number: n, gender: g, use } });
const V = (p, n, tense, voice, mood, clause) => ({ type: "verb", parse: Object.assign({ person: p, number: n, tense, voice, mood }, clause ? { clause } : {}) });
// [sentence, [target, parse, explanation]...]
const NEW = [
  ["Cicerō conjūrātiōnem Catilīnae nōn ignōrābat.",
    ["conjūrātiōnem", N("acc", "sg", "f", "direct object"), "Nouns in -iō, -iōnis are feminine; the ending -em is accusative singular, the object of ignōrābat."],
    ["Catilīnae", N("gen", "sg", "m", "possession"), "Catilīna is a man's name of the first declension, so it is masculine; the genitive tells whose conspiracy it was."],
    ["ignōrābat", V(3, "sg", "imperfect", "active", "indicative"), "ignōrā- with -ba- and -t is the imperfect indicative active, third person singular: he was not unaware of."]],
  ["Catilīna oculōs omnium vītāvit.",
    ["oculōs", N("acc", "pl", "m", "direct object"), "The ending -ōs is accusative plural of the second declension; the eyes are what Catiline avoided."],
    ["vītāvit", V(3, "sg", "perfect", "active", "indicative"), "vītāv- is the perfect stem of vītō; -it is third person singular: he avoided."]],
  ["Tanta erat audācia Catilīnae ut in senātum venīret.",
    ["audācia", N("nom", "sg", "f", "subject"), "audācia has a short -a, so it is nominative singular, the subject of erat; Tanta agrees with it in the predicate."],
    ["senātum", N("acc", "sg", "m", "accusative of place to which"), "in with the accusative shows motion toward: he came into the Senate."],
    ["venīret", V(3, "sg", "imperfect", "active", "subjunctive", "result"), "Tanta points ahead to a result clause, ut with the subjunctive; after the past tense erat the imperfect is used."]],
  ["Cīvēs cōnsultum senātūs laudāvērunt.",
    ["Cīvēs", N("nom", "pl", "m", "subject"), "Cīvēs could be nominative or accusative plural; laudāvērunt needs a plural subject, and cōnsultum is the object."],
    ["cōnsultum", N("acc", "sg", "n", "direct object"), "cōnsultum is a neuter of the second declension, nominative or accusative by form; here it is what the citizens praised."],
    ["senātūs", N("gen", "sg", "m", "possession"), "The long -ūs of the fourth declension is genitive singular here: the decree of the Senate."]],
  ["Cicerō rogāvit quid Catilīna nocte ēgisset.",
    ["nocte", N("abl", "sg", "f", "ablative of time when"), "The ablative without a preposition tells when: at night."],
    ["ēgisset", V(3, "sg", "pluperfect", "active", "subjunctive", "indirect question"), "quid introduces an indirect question after rogāvit; the pluperfect subjunctive (ēg-isset) shows the doing came before the asking."]],
  ["Praetor manū suā gladium cēpit.",
    ["manū", N("abl", "sg", "f", "ablative of means"), "manus is one of the few feminine nouns of the fourth declension (suā agrees with it); the ablative tells with what he took the sword."],
    ["gladium", N("acc", "sg", "m", "direct object"), "The ending -um is accusative singular; the sword is what the praetor took."],
    ["cēpit", V(3, "sg", "perfect", "active", "indicative"), "cēp- is the perfect stem of capiō (capiō, capere, cēpī, captus): he took."]],
  ["Hominēs perditī jūs nōn timent.",
    ["jūs", N("acc", "sg", "n", "direct object"), "jūs, jūris is neuter, so nominative and accusative are alike; Hominēs is the subject of timent, so jūs is what they do not fear."],
    ["timent", V(3, "pl", "present", "active", "indicative"), "timē- with -nt is the third person plural of the present indicative active: they fear."]],
  ["Moenia urbis ā cīvibus custōdiēbantur.",
    ["Moenia", N("nom", "pl", "n", "subject"), "moenia is a plural-only neuter; with the passive verb custōdiēbantur it is the subject, the thing guarded."],
    ["cīvibus", N("abl", "pl", "m", "ablative of agent"), "With a passive verb, ā and the ablative of living persons names the agent: by the citizens."],
    ["custōdiēbantur", V(3, "pl", "imperfect", "passive", "indicative"), "custōdiē- with -ba- and the passive ending -ntur is the imperfect indicative passive: they were being guarded."]],
  ["Catilīna ex urbe ērūpit et domum profūgit.",
    ["urbe", N("abl", "sg", "f", "ablative of place from which"), "ex with the ablative shows motion out of a place: out of the city."],
    ["domum", N("acc", "sg", "f", "accusative of place to which"), "domus, like the names of towns, shows the place to which by the accusative with no preposition: home."],
    ["ērūpit", V(3, "sg", "perfect", "active", "indicative"), "ērūp- is the perfect stem of ērumpō (ērumpō, ērumpere, ērūpī, ēruptum): he burst forth. The present would be ērumpit."]],
  ["Cum Cicerō omnia comperisset, senātum convocāvit.",
    ["comperisset", V(3, "sg", "pluperfect", "active", "subjunctive", "cum-circumstantial"), "cum meaning when, in past time, takes the subjunctive; the pluperfect (comper-isset) shows the finding out came before the summoning."],
    ["senātum", N("acc", "sg", "m", "direct object"), "senātum is accusative singular of the fourth declension, the object of convocāvit."],
    ["convocāvit", V(3, "sg", "perfect", "active", "indicative"), "convocāv- is the perfect stem of convocō; -it is third person singular: he called together."]],
  ["Cōnsul praetōrēs mīsit ut tēcta urbis custōdīrent.",
    ["praetōrēs", N("acc", "pl", "m", "direct object"), "praetōrēs could be nominative or accusative plural; Cōnsul is the subject of mīsit, so the praetors are the ones sent."],
    ["tēcta", N("acc", "pl", "n", "direct object"), "tēctum is a neuter of the second declension, so tēcta is plural; it is the object of custōdīrent."],
    ["custōdīrent", V(3, "pl", "imperfect", "active", "subjunctive", "purpose"), "ut with the subjunctive tells why he sent them; after the past tense mīsit the imperfect subjunctive is used."]],
  ["Cum hostēs moenia oppugnārent, cīvēs templa nōn relīquērunt.",
    ["oppugnārent", V(3, "pl", "imperfect", "active", "subjunctive", "cum-circumstantial"), "cum meaning when, in past time, takes the subjunctive; the imperfect shows the attack was going on at the same time."],
    ["templa", N("acc", "pl", "n", "direct object"), "templa is neuter plural, nominative or accusative by form; cīvēs is the subject, so the temples are what they did not leave."]],
  ["Cicerō mālēbat in urbe manēre.",
    ["urbe", N("abl", "sg", "f", "ablative of place where"), "in with the ablative tells where he preferred to stay: in the city."],
    ["mālēbat", V(3, "sg", "imperfect", "active", "indicative"), "mālō (magis volō) forms its imperfect like volō: mālēbat, he preferred. The infinitive manēre completes it."]],
  ["Cum Catilīna ex urbe discessisset, cīvēs metū līberātī sunt.",
    ["discessisset", V(3, "sg", "pluperfect", "active", "subjunctive", "cum-circumstantial"), "cum meaning when, in past time, takes the subjunctive; the pluperfect (discess-isset) shows he had gone before they were freed."],
    ["cīvēs", N("nom", "pl", "m", "subject"), "cīvēs could be nominative or accusative plural; the passive līberātī sunt needs a plural subject, and līberātī agrees with it."],
    ["līberātī sunt", V(3, "pl", "perfect", "passive", "indicative"), "The perfect participle līberātī (masculine plural, agreeing with cīvēs) with sunt is the perfect indicative passive: they were freed."]],
  ["Praetor rogāvit ubi vincula essent.",
    ["vincula", N("nom", "pl", "n", "subject"), "vincula is neuter plural, nominative or accusative by form; it is the subject of essent in the indirect question."],
    ["essent", V(3, "pl", "imperfect", "active", "subjunctive", "indirect question"), "ubi introduces an indirect question after rogāvit; a past main verb takes the imperfect subjunctive for action at the same time."]],
  ["Quārē nēmō in exilium discēdere audet?",
    ["exilium", N("acc", "sg", "n", "accusative of place to which"), "in with the accusative shows motion toward: into exile."],
    ["audet", V(3, "sg", "present", "active", "indicative"), "audeō is active in the present system (audet, he dares) and passive in form only in the perfect (ausus est)."]],
  ["Tempestāte magnā pōns frāctus est.",
    ["Tempestāte", N("abl", "sg", "f", "ablative of means"), "Nouns in -tās, -tātis are feminine (magnā agrees); the ablative without a preposition names the thing by which the bridge was broken."],
    ["pōns", N("nom", "sg", "m", "subject"), "pōns is nominative singular (pōns, pontis, m.), the subject of the passive frāctus est; the participle agrees with it."],
    ["frāctus est", V(3, "sg", "perfect", "passive", "indicative"), "frāctus is the perfect participle of frangō (frangō, frangere, frēgī, frāctus); with est it is the perfect indicative passive: it was broken."]],
  ["Catilīna sociōs suōs armāvit ut urbem incenderent.",
    ["sociōs", N("acc", "pl", "m", "direct object"), "The ending -ōs is accusative plural; his companions are the ones Catiline armed."],
    ["incenderent", V(3, "pl", "imperfect", "active", "subjunctive", "purpose"), "ut with the subjunctive tells why he armed them; after the past tense armāvit the imperfect subjunctive is used."]],
  ["Gaudium cīvium magnum erat.",
    ["Gaudium", N("nom", "sg", "n", "subject"), "Gaudium is neuter, nominative or accusative by form; erat takes no object, so it is the subject, and magnum agrees with it."],
    ["cīvium", N("gen", "pl", "m", "possession"), "cīvis is an i-stem, so its genitive plural ends in -ium: the joy of the citizens."]],
  ["Cōnsul scelera conjūrātiōnis senātuī exposuit.",
    ["scelera", N("acc", "pl", "n", "direct object"), "scelus, sceleris is neuter, so scelera is nominative or accusative plural; Cōnsul is the subject, so the crimes are what he explained."],
    ["senātuī", N("dat", "sg", "m", "indirect object"), "The ending -uī is dative singular of the fourth declension: he explained them to the Senate."],
    ["exposuit", V(3, "sg", "perfect", "active", "indicative"), "exposu- is the perfect stem of expōnō (compounds keep the parts of pōnō): he explained."]],
  ["Cōnsul litterās in senātū recitāvit.",
    ["litterās", N("acc", "pl", "f", "direct object"), "litterae is plural in form but means one letter; the ending -ās is accusative plural, the object of recitāvit."],
    ["senātū", N("abl", "sg", "m", "ablative of place where"), "in with the ablative tells where the letter was read aloud: in the Senate."],
    ["recitāvit", V(3, "sg", "perfect", "active", "indicative"), "recitāv- is the perfect stem of recitō; -it is third person singular: he read aloud."]],
  ["Parentēs fīliōs suōs amant.",
    ["Parentēs", N("nom", "pl", "m", "subject"), "Parentēs could be nominative or accusative plural; amant needs a plural subject, and fīliōs is plainly the object."],
    ["fīliōs", N("acc", "pl", "m", "direct object"), "The ending -ōs is only accusative plural; the sons are the ones loved."],
    ["amant", V(3, "pl", "present", "active", "indicative"), "amā- with -nt is the third person plural of the present indicative active: they love."]],
  ["Indicia conjūrātiōnis ad cōnsulem dēlāta sunt.",
    ["Indicia", N("nom", "pl", "n", "subject"), "Indicia is neuter plural; with the passive dēlāta sunt it is the subject, and the participle agrees with it."],
    ["dēlāta sunt", V(3, "pl", "perfect", "passive", "indicative"), "dēlāt- is the participle stem of dēferō (dēferō, dēferre, dētulī, dēlātus); dēlāta is neuter plural to agree with Indicia."]],
  ["Testēs in jūdiciō vēra dīxērunt.",
    ["Testēs", N("nom", "pl", "m", "subject"), "Testēs could be nominative or accusative plural; dīxērunt needs a plural subject."],
    ["jūdiciō", N("abl", "sg", "n", "ablative of place where"), "in with the ablative tells where they spoke: at the trial."],
    ["dīxērunt", V(3, "pl", "perfect", "active", "indicative"), "dīx- is the perfect stem of dīcō; -ērunt is third person plural perfect active: they said."]],
  ["Cīvēs, nōlīte patriam relinquere!",
    ["Cīvēs", N("voc", "pl", "m", "vocative/direct address"), "The citizens are being spoken to; in the third declension the vocative is like the nominative."],
    ["nōlīte", V(2, "pl", "present", "active", "imperative"), "nōlīte is the plural imperative of nōlō; with an infinitive it makes a negative command: do not abandon."],
    ["patriam", N("acc", "sg", "f", "direct object"), "patriam is accusative singular, the object of the infinitive relinquere."]],
  ["Jūdicēs, reum condemnāte!",
    ["Jūdicēs", N("voc", "pl", "m", "vocative/direct address"), "The jurors are being spoken to (gentlemen of the jury); in the third declension the vocative is like the nominative."],
    ["reum", N("acc", "sg", "m", "direct object"), "reum is accusative singular of reus, the defendant, the object of condemnāte."],
    ["condemnāte", V(2, "pl", "present", "active", "imperative"), "The present stem condemnā- with -te is the plural imperative: condemn! The singular is condemnā."]],
  ["Reus ā jūdicibus damnātus est.",
    ["Reus", N("nom", "sg", "m", "subject"), "Reus is nominative singular, the subject of the passive damnātus est; the participle agrees with it."],
    ["jūdicibus", N("abl", "pl", "m", "ablative of agent"), "With a passive verb, ā and the ablative of living persons names the agent: by the jurors."],
    ["damnātus est", V(3, "sg", "perfect", "passive", "indicative"), "The perfect participle damnātus with est is the perfect indicative passive: he was condemned."]],
  ["Cōnsul postulāvit ut reus pūnīrētur.",
    ["reus", N("nom", "sg", "m", "subject"), "reus is nominative singular, the subject of pūnīrētur inside the ut clause."],
    ["pūnīrētur", V(3, "sg", "imperfect", "passive", "subjunctive", "indirect command"), "After postulō, ut with the subjunctive gives what was demanded; pūnīrē- with -tur is the imperfect subjunctive passive, after the past tense postulāvit."]],
  ["Mercātor pecūniam adulēscentī dedit.",
    ["pecūniam", N("acc", "sg", "f", "direct object"), "pecūniam is accusative singular; the money is what the merchant gave."],
    ["adulēscentī", N("dat", "sg", "m", "indirect object"), "The ending -ī of the third declension is dative singular: he gave it to the young man."],
    ["dedit", V(3, "sg", "perfect", "active", "indicative"), "ded- is the perfect stem of dō (dō, dare, dedī, datus): he gave."]]
];

const out = [];
const dropped = [];
// 1. the sentences of the first two years
old.forEach((it) => {
  const r = L.availability(it.sentence, vocab, "henle3", grammar);
  if (r.unknown.length) { dropped.push(it.id + " (" + r.unknown.join(", ") + ")"); return; }
  const o = Object.assign({}, it, { curriculum: "henle3", lesson: r.lesson });
  delete o.available;
  out.push(o);
});
// 2. the new ones
const perLesson = {};
NEW.forEach((row, i) => {
  const sentence = row[0], words = sentence.trim().split(/\s+/).map((w) => w.replace(/[^\p{L}]/gu, ""));
  const r = L.availability(sentence, vocab, "henle3", grammar);
  if (r.unknown.length) throw new Error("unknown words in: " + sentence + " -> " + r.unknown.join(", "));
  row.slice(1).forEach((t) => {
    const first = t[0].split(" ")[0];
    const idx = words.indexOf(first);
    if (idx < 0 || words.lastIndexOf(first) !== idx) throw new Error("target not found once: " + t[0] + " in " + sentence);
    out.push({ id: "t" + String(i + 1).padStart(2, "0") + "-w" + idx, curriculum: "henle3", sentence, target_index: idx, target: t[0], lesson: r.lesson, type: t[1].type, parse: t[1].parse, explanation: t[2] });
  });
  perLesson[r.lesson] = (perLesson[r.lesson] || 0) + 1;
  console.log(String(r.lesson).padStart(2) + "  " + sentence);
});
fs.writeFileSync(path.join(repo, "site/practice/data/henle3/items.json"), "[\n" + out.map((x) => JSON.stringify(x)).join(",\n") + "\n]\n");
console.log("wrote " + out.length + " items (" + (out.length - old.length + dropped.length) + " new, in lessons " + Object.keys(perLesson).join(", ") + "); dropped " + dropped.length + ": " + dropped.join("; "));
