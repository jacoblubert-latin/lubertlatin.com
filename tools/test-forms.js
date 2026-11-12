#!/usr/bin/env node
// Checks the inflection engine (site/js/latin-forms.js) against known
// paradigms. Run:   node tools/test-forms.js
"use strict";
const L = require("../site/js/latin-forms.js");

let failures = 0, checks = 0;
function eq(label, got, want) {
  checks++;
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) { failures++; console.error("FAIL " + label + "\n   got  " + g + "\n   want " + w); }
}
function forms(set) { return set ? set.map((c) => c.form) : null; }
function N(lemma, gen, gender, declension, flags) { return { pos: "noun", lemma, gen, gender, declension, flags }; }
function V(parts, conjugation, flags) { return { pos: "verb", lemma: parts[0], parts, conjugation, flags }; }

// ---------- nouns ----------
let d = L.declineNoun(N("terra", "terrae", "f", "1"));
eq("terra sg", d.sg, { nom: "terra", gen: "terrae", dat: "terrae", acc: "terram", abl: "terrā", voc: "terra" });
eq("terra pl", d.pl, { nom: "terrae", gen: "terrārum", dat: "terrīs", acc: "terrās", abl: "terrīs", voc: "terrae" });

d = L.declineNoun(N("servus", "servī", "m", "2"));
eq("servus sg", d.sg, { nom: "servus", gen: "servī", dat: "servō", acc: "servum", abl: "servō", voc: "serve" });
eq("servus pl", d.pl, { nom: "servī", gen: "servōrum", dat: "servīs", acc: "servōs", abl: "servīs", voc: "servī" });

d = L.declineNoun(N("fīlius", "fīliī", "m", "2"));
eq("fīlius voc", d.sg.voc, "fīlī");
eq("fīlius gen", d.sg.gen, "fīliī");

d = L.declineNoun(N("ager", "agrī", "m", "2"));
eq("ager sg", d.sg, { nom: "ager", gen: "agrī", dat: "agrō", acc: "agrum", abl: "agrō", voc: "ager" });
eq("ager pl", d.pl, { nom: "agrī", gen: "agrōrum", dat: "agrīs", acc: "agrōs", abl: "agrīs", voc: "agrī" });
d = L.declineNoun(N("puer", "puerī", "m", "2"));
eq("puer acc pl", d.pl.acc, "puerōs");

d = L.declineNoun(N("bellum", "bellī", "n", "2"));
eq("bellum sg", d.sg, { nom: "bellum", gen: "bellī", dat: "bellō", acc: "bellum", abl: "bellō", voc: "bellum" });
eq("bellum pl", d.pl, { nom: "bella", gen: "bellōrum", dat: "bellīs", acc: "bella", abl: "bellīs", voc: "bella" });
d = L.declineNoun(N("proelium", "proeliī", "n", "2"));
eq("proelium pl", d.pl, { nom: "proelia", gen: "proeliōrum", dat: "proeliīs", acc: "proelia", abl: "proeliīs", voc: "proelia" });

d = L.declineNoun(N("castra", "castrōrum", "n", "2", ["plural-only"]));
eq("castra sg empty", d.sg.nom, null);
eq("castra pl", d.pl, { nom: "castra", gen: "castrōrum", dat: "castrīs", acc: "castra", abl: "castrīs", voc: "castra" });

d = L.declineNoun(N("mīles", "mīlitis", "m", "3"));
eq("mīles sg", d.sg, { nom: "mīles", gen: "mīlitis", dat: "mīlitī", acc: "mīlitem", abl: "mīlite", voc: "mīles" });
eq("mīles pl", d.pl, { nom: "mīlitēs", gen: "mīlitum", dat: "mīlitibus", acc: "mīlitēs", abl: "mīlitibus", voc: "mīlitēs" });

d = L.declineNoun(N("hostis", "hostis", "m", "3", ["i-stem"]));
eq("hostis gen pl", d.pl.gen, "hostium");
eq("hostis acc pl", d.pl.acc, "hostēs");
d = L.declineNoun(N("pars", "partis", "f", "3", ["i-stem"]));
eq("pars pl", d.pl, { nom: "partēs", gen: "partium", dat: "partibus", acc: "partēs", abl: "partibus", voc: "partēs" });

d = L.declineNoun(N("flūmen", "flūminis", "n", "3"));
eq("flūmen sg", d.sg, { nom: "flūmen", gen: "flūminis", dat: "flūminī", acc: "flūmen", abl: "flūmine", voc: "flūmen" });
eq("flūmen pl", d.pl, { nom: "flūmina", gen: "flūminum", dat: "flūminibus", acc: "flūmina", abl: "flūminibus", voc: "flūmina" });

d = L.declineNoun(N("mare", "maris", "n", "3", ["i-stem"]));
eq("mare sg", d.sg, { nom: "mare", gen: "maris", dat: "marī", acc: "mare", abl: "marī", voc: "mare" });
eq("mare pl", d.pl, { nom: "maria", gen: "marium", dat: "maribus", acc: "maria", abl: "maribus", voc: "maria" });
d = L.declineNoun(N("animal", "animālis", "n", "3", ["i-stem"]));
eq("animal abl sg", d.sg.abl, "animālī");
eq("animal nom pl", d.pl.nom, "animālia");

d = L.declineNoun(N("portus", "portūs", "m", "4"));
eq("portus sg", d.sg, { nom: "portus", gen: "portūs", dat: "portuī", acc: "portum", abl: "portū", voc: "portus" });
eq("portus pl", d.pl, { nom: "portūs", gen: "portuum", dat: "portibus", acc: "portūs", abl: "portibus", voc: "portūs" });
d = L.declineNoun(N("cornū", "cornūs", "n", "4"));
eq("cornū sg", d.sg, { nom: "cornū", gen: "cornūs", dat: "cornū", acc: "cornū", abl: "cornū", voc: "cornū" });
eq("cornū pl", d.pl, { nom: "cornua", gen: "cornuum", dat: "cornibus", acc: "cornua", abl: "cornibus", voc: "cornua" });

d = L.declineNoun(N("rēs", "reī", "f", "5"));
eq("rēs sg", d.sg, { nom: "rēs", gen: "reī", dat: "reī", acc: "rem", abl: "rē", voc: "rēs" });
eq("rēs pl", d.pl, { nom: "rēs", gen: "rērum", dat: "rēbus", acc: "rēs", abl: "rēbus", voc: "rēs" });
d = L.declineNoun(N("diēs", "diēī", "m", "5"));
eq("diēs sg", d.sg, { nom: "diēs", gen: "diēī", dat: "diēī", acc: "diem", abl: "diē", voc: "diēs" });
eq("diēs pl", d.pl, { nom: "diēs", gen: "diērum", dat: "diēbus", acc: "diēs", abl: "diēbus", voc: "diēs" });

// ---------- verbs ----------
const laudo = V(["laudō", "laudāre", "laudāvī", "laudātus"], "1");
eq("laudō pres act", forms(L.conjugateSet(laudo, "indicative", "present", "active")), ["laudō", "laudās", "laudat", "laudāmus", "laudātis", "laudant"]);
eq("laudō impf act", forms(L.conjugateSet(laudo, "indicative", "imperfect", "active")), ["laudābam", "laudābās", "laudābat", "laudābāmus", "laudābātis", "laudābant"]);
eq("laudō fut act", forms(L.conjugateSet(laudo, "indicative", "future", "active")), ["laudābō", "laudābis", "laudābit", "laudābimus", "laudābitis", "laudābunt"]);
eq("laudō perf act", forms(L.conjugateSet(laudo, "indicative", "perfect", "active")), ["laudāvī", "laudāvistī", "laudāvit", "laudāvimus", "laudāvistis", "laudāvērunt"]);
eq("laudō plup act", forms(L.conjugateSet(laudo, "indicative", "pluperfect", "active")), ["laudāveram", "laudāverās", "laudāverat", "laudāverāmus", "laudāverātis", "laudāverant"]);
eq("laudō futp act", forms(L.conjugateSet(laudo, "indicative", "future perfect", "active")), ["laudāverō", "laudāveris", "laudāverit", "laudāverimus", "laudāveritis", "laudāverint"]);
eq("laudō pres pas", forms(L.conjugateSet(laudo, "indicative", "present", "passive")), ["laudor", "laudāris", "laudātur", "laudāmur", "laudāminī", "laudantur"]);
eq("laudō impf pas", forms(L.conjugateSet(laudo, "indicative", "imperfect", "passive")), ["laudābar", "laudābāris", "laudābātur", "laudābāmur", "laudābāminī", "laudābantur"]);
eq("laudō fut pas", forms(L.conjugateSet(laudo, "indicative", "future", "passive")), ["laudābor", "laudāberis", "laudābitur", "laudābimur", "laudābiminī", "laudābuntur"]);
eq("laudō perf pas", forms(L.conjugateSet(laudo, "indicative", "perfect", "passive")), ["laudātus sum", "laudātus es", "laudātus est", "laudātī sumus", "laudātī estis", "laudātī sunt"]);
eq("laudō perf pas accepts fem", L.conjugateSet(laudo, "indicative", "perfect", "passive")[0].accept, ["laudāta sum", "laudātum sum"]);
eq("laudō plup pas", forms(L.conjugateSet(laudo, "indicative", "pluperfect", "passive")), ["laudātus eram", "laudātus erās", "laudātus erat", "laudātī erāmus", "laudātī erātis", "laudātī erant"]);
eq("laudō futp pas", forms(L.conjugateSet(laudo, "indicative", "future perfect", "passive")), ["laudātus erō", "laudātus eris", "laudātus erit", "laudātī erimus", "laudātī eritis", "laudātī erunt"]);
eq("laudō pres subj act", forms(L.conjugateSet(laudo, "subjunctive", "present", "active")), ["laudem", "laudēs", "laudet", "laudēmus", "laudētis", "laudent"]);
eq("laudō impf subj act", forms(L.conjugateSet(laudo, "subjunctive", "imperfect", "active")), ["laudārem", "laudārēs", "laudāret", "laudārēmus", "laudārētis", "laudārent"]);
eq("laudō perf subj act", forms(L.conjugateSet(laudo, "subjunctive", "perfect", "active")), ["laudāverim", "laudāverīs", "laudāverit", "laudāverīmus", "laudāverītis", "laudāverint"]);
eq("laudō plup subj act", forms(L.conjugateSet(laudo, "subjunctive", "pluperfect", "active")), ["laudāvissem", "laudāvissēs", "laudāvisset", "laudāvissēmus", "laudāvissētis", "laudāvissent"]);
eq("laudō pres subj pas", forms(L.conjugateSet(laudo, "subjunctive", "present", "passive")), ["lauder", "laudēris", "laudētur", "laudēmur", "laudēminī", "laudentur"]);
eq("laudō impf subj pas", forms(L.conjugateSet(laudo, "subjunctive", "imperfect", "passive")), ["laudārer", "laudārēris", "laudārētur", "laudārēmur", "laudārēminī", "laudārentur"]);
eq("laudō perf subj pas", forms(L.conjugateSet(laudo, "subjunctive", "perfect", "passive")), ["laudātus sim", "laudātus sīs", "laudātus sit", "laudātī sīmus", "laudātī sītis", "laudātī sint"]);
eq("laudō plup subj pas", forms(L.conjugateSet(laudo, "subjunctive", "pluperfect", "passive")), ["laudātus essem", "laudātus essēs", "laudātus esset", "laudātī essēmus", "laudātī essētis", "laudātī essent"]);

const moneo = V(["moneō", "monēre", "monuī", "monitus"], "2");
eq("moneō pres act", forms(L.conjugateSet(moneo, "indicative", "present", "active")), ["moneō", "monēs", "monet", "monēmus", "monētis", "monent"]);
eq("moneō impf act", forms(L.conjugateSet(moneo, "indicative", "imperfect", "active")), ["monēbam", "monēbās", "monēbat", "monēbāmus", "monēbātis", "monēbant"]);
eq("moneō fut pas", forms(L.conjugateSet(moneo, "indicative", "future", "passive")), ["monēbor", "monēberis", "monēbitur", "monēbimur", "monēbiminī", "monēbuntur"]);
eq("moneō pres pas", forms(L.conjugateSet(moneo, "indicative", "present", "passive")), ["moneor", "monēris", "monētur", "monēmur", "monēminī", "monentur"]);
eq("moneō pres subj act", forms(L.conjugateSet(moneo, "subjunctive", "present", "active")), ["moneam", "moneās", "moneat", "moneāmus", "moneātis", "moneant"]);
eq("moneō pres subj pas", forms(L.conjugateSet(moneo, "subjunctive", "present", "passive")), ["monear", "moneāris", "moneātur", "moneāmur", "moneāminī", "moneantur"]);
eq("moneō impf subj act", forms(L.conjugateSet(moneo, "subjunctive", "imperfect", "active")), ["monērem", "monērēs", "monēret", "monērēmus", "monērētis", "monērent"]);
eq("moneō perf act", forms(L.conjugateSet(moneo, "indicative", "perfect", "active")), ["monuī", "monuistī", "monuit", "monuimus", "monuistis", "monuērunt"]);

const duco = V(["dūcō", "dūcere", "dūxī", "ductus"], "3");
eq("dūcō pres act", forms(L.conjugateSet(duco, "indicative", "present", "active")), ["dūcō", "dūcis", "dūcit", "dūcimus", "dūcitis", "dūcunt"]);
eq("dūcō impf act", forms(L.conjugateSet(duco, "indicative", "imperfect", "active")), ["dūcēbam", "dūcēbās", "dūcēbat", "dūcēbāmus", "dūcēbātis", "dūcēbant"]);
eq("dūcō fut act", forms(L.conjugateSet(duco, "indicative", "future", "active")), ["dūcam", "dūcēs", "dūcet", "dūcēmus", "dūcētis", "dūcent"]);
eq("dūcō pres pas", forms(L.conjugateSet(duco, "indicative", "present", "passive")), ["dūcor", "dūceris", "dūcitur", "dūcimur", "dūciminī", "dūcuntur"]);
eq("dūcō impf pas", forms(L.conjugateSet(duco, "indicative", "imperfect", "passive")), ["dūcēbar", "dūcēbāris", "dūcēbātur", "dūcēbāmur", "dūcēbāminī", "dūcēbantur"]);
eq("dūcō fut pas", forms(L.conjugateSet(duco, "indicative", "future", "passive")), ["dūcar", "dūcēris", "dūcētur", "dūcēmur", "dūcēminī", "dūcentur"]);
eq("dūcō pres subj act", forms(L.conjugateSet(duco, "subjunctive", "present", "active")), ["dūcam", "dūcās", "dūcat", "dūcāmus", "dūcātis", "dūcant"]);
eq("dūcō impf subj act", forms(L.conjugateSet(duco, "subjunctive", "imperfect", "active")), ["dūcerem", "dūcerēs", "dūceret", "dūcerēmus", "dūcerētis", "dūcerent"]);
eq("dūcō impf subj pas", forms(L.conjugateSet(duco, "subjunctive", "imperfect", "passive")), ["dūcerer", "dūcerēris", "dūcerētur", "dūcerēmur", "dūcerēminī", "dūcerentur"]);
eq("dūcō perf pas", forms(L.conjugateSet(duco, "indicative", "perfect", "passive")), ["ductus sum", "ductus es", "ductus est", "ductī sumus", "ductī estis", "ductī sunt"]);

const capio = V(["capiō", "capere", "cēpī", "captus"], "3io");
eq("capiō pres act", forms(L.conjugateSet(capio, "indicative", "present", "active")), ["capiō", "capis", "capit", "capimus", "capitis", "capiunt"]);
eq("capiō impf act", forms(L.conjugateSet(capio, "indicative", "imperfect", "active")), ["capiēbam", "capiēbās", "capiēbat", "capiēbāmus", "capiēbātis", "capiēbant"]);
eq("capiō fut act", forms(L.conjugateSet(capio, "indicative", "future", "active")), ["capiam", "capiēs", "capiet", "capiēmus", "capiētis", "capient"]);
eq("capiō pres pas", forms(L.conjugateSet(capio, "indicative", "present", "passive")), ["capior", "caperis", "capitur", "capimur", "capiminī", "capiuntur"]);
eq("capiō fut pas", forms(L.conjugateSet(capio, "indicative", "future", "passive")), ["capiar", "capiēris", "capiētur", "capiēmur", "capiēminī", "capientur"]);
eq("capiō pres subj act", forms(L.conjugateSet(capio, "subjunctive", "present", "active")), ["capiam", "capiās", "capiat", "capiāmus", "capiātis", "capiant"]);
eq("capiō impf subj act", forms(L.conjugateSet(capio, "subjunctive", "imperfect", "active")), ["caperem", "caperēs", "caperet", "caperēmus", "caperētis", "caperent"]);
eq("capiō impf subj pas", forms(L.conjugateSet(capio, "subjunctive", "imperfect", "passive")), ["caperer", "caperēris", "caperētur", "caperēmur", "caperēminī", "caperentur"]);

const audio = V(["audiō", "audīre", "audīvī", "audītus"], "4");
eq("audiō pres act", forms(L.conjugateSet(audio, "indicative", "present", "active")), ["audiō", "audīs", "audit", "audīmus", "audītis", "audiunt"]);
eq("audiō impf act", forms(L.conjugateSet(audio, "indicative", "imperfect", "active")), ["audiēbam", "audiēbās", "audiēbat", "audiēbāmus", "audiēbātis", "audiēbant"]);
eq("audiō fut act", forms(L.conjugateSet(audio, "indicative", "future", "active")), ["audiam", "audiēs", "audiet", "audiēmus", "audiētis", "audient"]);
eq("audiō pres pas", forms(L.conjugateSet(audio, "indicative", "present", "passive")), ["audior", "audīris", "audītur", "audīmur", "audīminī", "audiuntur"]);
eq("audiō pres subj act", forms(L.conjugateSet(audio, "subjunctive", "present", "active")), ["audiam", "audiās", "audiat", "audiāmus", "audiātis", "audiant"]);
eq("audiō impf subj act", forms(L.conjugateSet(audio, "subjunctive", "imperfect", "active")), ["audīrem", "audīrēs", "audīret", "audīrēmus", "audīrētis", "audīrent"]);

// Deponents: passive forms, one column.
const sequor = V(["sequor", "sequī", "secūtus sum"], "3", ["deponent"]);
eq("sequor voices", L.verbVoices(sequor), ["deponent"]);
eq("sequor pres", forms(L.conjugateSet(sequor, "indicative", "present", "deponent")), ["sequor", "sequeris", "sequitur", "sequimur", "sequiminī", "sequuntur"]);
eq("sequor impf", forms(L.conjugateSet(sequor, "indicative", "imperfect", "deponent")), ["sequēbar", "sequēbāris", "sequēbātur", "sequēbāmur", "sequēbāminī", "sequēbantur"]);
eq("sequor fut", forms(L.conjugateSet(sequor, "indicative", "future", "deponent")), ["sequar", "sequēris", "sequētur", "sequēmur", "sequēminī", "sequentur"]);
eq("sequor perf", forms(L.conjugateSet(sequor, "indicative", "perfect", "deponent")), ["secūtus sum", "secūtus es", "secūtus est", "secūtī sumus", "secūtī estis", "secūtī sunt"]);
eq("sequor plup", forms(L.conjugateSet(sequor, "indicative", "pluperfect", "deponent"))[0], "secūtus eram");
eq("sequor pres subj", forms(L.conjugateSet(sequor, "subjunctive", "present", "deponent")), ["sequar", "sequāris", "sequātur", "sequāmur", "sequāminī", "sequantur"]);
eq("sequor impf subj", forms(L.conjugateSet(sequor, "subjunctive", "imperfect", "deponent")), ["sequerer", "sequerēris", "sequerētur", "sequerēmur", "sequerēminī", "sequerentur"]);
eq("sequor plup subj", forms(L.conjugateSet(sequor, "subjunctive", "pluperfect", "deponent"))[2], "secūtus esset");
eq("sequor active is null", L.conjugateSet(sequor, "indicative", "present", "active"), null);
const hortor = V(["hortor", "hortārī", "hortātus sum"], "1", ["deponent"]);
eq("hortor pres", forms(L.conjugateSet(hortor, "indicative", "present", "deponent")), ["hortor", "hortāris", "hortātur", "hortāmur", "hortāminī", "hortantur"]);
eq("hortor impf subj", forms(L.conjugateSet(hortor, "subjunctive", "imperfect", "deponent")), ["hortārer", "hortārēris", "hortārētur", "hortārēmur", "hortārēminī", "hortārentur"]);
const patior = V(["patior", "patī", "passus sum"], "3io", ["deponent"]);
eq("patior pres", forms(L.conjugateSet(patior, "indicative", "present", "deponent")), ["patior", "pateris", "patitur", "patimur", "patiminī", "patiuntur"]);
eq("patior fut", forms(L.conjugateSet(patior, "indicative", "future", "deponent")), ["patiar", "patiēris", "patiētur", "patiēmur", "patiēminī", "patientur"]);
eq("patior impf subj", forms(L.conjugateSet(patior, "subjunctive", "imperfect", "deponent")), ["paterer", "paterēris", "paterētur", "paterēmur", "paterēminī", "paterentur"]);
const vereor = V(["vereor", "verērī", "veritus sum"], "2", ["deponent"]);
eq("vereor pres", forms(L.conjugateSet(vereor, "indicative", "present", "deponent")), ["vereor", "verēris", "verētur", "verēmur", "verēminī", "verentur"]);

// Irregulars (hand tables).
const sum = V(["sum", "esse", "fuī", "futūrus"], "irregular");
eq("sum voices", L.verbVoices(sum), ["active"]);
eq("sum pres", forms(L.conjugateSet(sum, "indicative", "present", "active")), ["sum", "es", "est", "sumus", "estis", "sunt"]);
eq("sum fut", forms(L.conjugateSet(sum, "indicative", "future", "active")), ["erō", "eris", "erit", "erimus", "eritis", "erunt"]);
eq("sum perf", forms(L.conjugateSet(sum, "indicative", "perfect", "active")), ["fuī", "fuistī", "fuit", "fuimus", "fuistis", "fuērunt"]);
eq("sum futp", forms(L.conjugateSet(sum, "indicative", "future perfect", "active")), ["fuerō", "fueris", "fuerit", "fuerimus", "fueritis", "fuerint"]);
eq("sum pres subj", forms(L.conjugateSet(sum, "subjunctive", "present", "active")), ["sim", "sīs", "sit", "sīmus", "sītis", "sint"]);
eq("sum plup subj", forms(L.conjugateSet(sum, "subjunctive", "pluperfect", "active")), ["fuissem", "fuissēs", "fuisset", "fuissēmus", "fuissētis", "fuissent"]);
eq("sum passive", L.conjugateSet(sum, "indicative", "present", "passive"), null);
const possum = V(["possum", "posse", "potuī"], "irregular");
eq("possum pres", forms(L.conjugateSet(possum, "indicative", "present", "active")), ["possum", "potes", "potest", "possumus", "potestis", "possunt"]);
eq("possum perf subj", forms(L.conjugateSet(possum, "subjunctive", "perfect", "active")), ["potuerim", "potuerīs", "potuerit", "potuerīmus", "potuerītis", "potuerint"]);
const eo = V(["eō", "īre", "iī", "itum"], "irregular");
eq("eō pres", forms(L.conjugateSet(eo, "indicative", "present", "active")), ["eō", "īs", "it", "īmus", "ītis", "eunt"]);
eq("eō perf", forms(L.conjugateSet(eo, "indicative", "perfect", "active")), ["iī", "īstī", "iit", "iimus", "īstis", "iērunt"]);
eq("eō plup subj", forms(L.conjugateSet(eo, "subjunctive", "pluperfect", "active")), ["īssem", "īssēs", "īsset", "īssēmus", "īssētis", "īssent"]);
const fero = V(["ferō", "ferre", "tulī", "lātus"], "irregular");
eq("ferō voices", L.verbVoices(fero), ["active", "passive"]);
eq("ferō pres", forms(L.conjugateSet(fero, "indicative", "present", "active")), ["ferō", "fers", "fert", "ferimus", "fertis", "ferunt"]);
eq("ferō pres pas", forms(L.conjugateSet(fero, "indicative", "present", "passive")), ["feror", "ferris", "fertur", "ferimur", "feriminī", "feruntur"]);
eq("ferō perf pas", forms(L.conjugateSet(fero, "indicative", "perfect", "passive")), ["lātus sum", "lātus es", "lātus est", "lātī sumus", "lātī estis", "lātī sunt"]);
eq("ferō perf act", forms(L.conjugateSet(fero, "indicative", "perfect", "active")), ["tulī", "tulistī", "tulit", "tulimus", "tulistis", "tulērunt"]);
eq("ferō impf subj pas", forms(L.conjugateSet(fero, "subjunctive", "imperfect", "passive")), ["ferrer", "ferrēris", "ferrētur", "ferrēmur", "ferrēminī", "ferrentur"]);
const volo = V(["volō", "velle", "voluī"], "irregular");
eq("volō pres", forms(L.conjugateSet(volo, "indicative", "present", "active")), ["volō", "vīs", "vult", "volumus", "vultis", "volunt"]);
eq("volō pres subj", forms(L.conjugateSet(volo, "subjunctive", "present", "active")), ["velim", "velīs", "velit", "velīmus", "velītis", "velint"]);
const nolo = V(["nōlō", "nōlle", "nōluī"], "irregular");
eq("nōlō pres", forms(L.conjugateSet(nolo, "indicative", "present", "active")), ["nōlō", "nōn vīs", "nōn vult", "nōlumus", "nōn vultis", "nōlunt"]);
const malo = V(["mālō", "mālle", "māluī"], "irregular");
eq("mālō pres", forms(L.conjugateSet(malo, "indicative", "present", "active")), ["mālō", "māvīs", "māvult", "mālumus", "māvultis", "mālunt"]);
eq("mālō impf subj", forms(L.conjugateSet(malo, "subjunctive", "imperfect", "active")), ["māllem", "māllēs", "māllet", "māllēmus", "māllētis", "māllent"]);
const fio = V(["fīō", "fierī", "factus sum"], "irregular");
eq("fīō pres", forms(L.conjugateSet(fio, "indicative", "present", "active")), ["fīō", "fīs", "fit", "fīmus", "fītis", "fīunt"]);
eq("fīō impf subj", forms(L.conjugateSet(fio, "subjunctive", "imperfect", "active")), ["fierem", "fierēs", "fieret", "fierēmus", "fierētis", "fierent"]);
eq("fīō perf", forms(L.conjugateSet(fio, "indicative", "perfect", "active")), ["factus sum", "factus es", "factus est", "factī sumus", "factī estis", "factī sunt"]);
eq("fīō voices", L.verbVoices(fio), ["active"]);

// Compounds of sum and eō, and dō (hand table, short a).
const adeo = V(["adeō", "adīre", "adiī", "aditus"], "irregular", ["no-passive"]);
eq("adeō pres", forms(L.conjugateSet(adeo, "indicative", "present", "active")), ["adeō", "adīs", "adit", "adīmus", "adītis", "adeunt"]);
eq("adeō perf", forms(L.conjugateSet(adeo, "indicative", "perfect", "active")), ["adiī", "adīstī", "adiit", "adiimus", "adīstis", "adiērunt"]);
const absum = V(["absum", "abesse", "āfuī", "āfutūrus"], "irregular", ["no-passive"]);
eq("absum pres", forms(L.conjugateSet(absum, "indicative", "present", "active")), ["absum", "abes", "abest", "absumus", "abestis", "absunt"]);
eq("absum perf uses āfu-", forms(L.conjugateSet(absum, "indicative", "perfect", "active"))[0], "āfuī");
eq("absum impf subj", forms(L.conjugateSet(absum, "subjunctive", "imperfect", "active")), ["abessem", "abessēs", "abesset", "abessēmus", "abessētis", "abessent"]);
eq("laudō is not a compound of dō", L.parseEntry("laudō, laudāre, laudāvī, laudātus").conjugation, "1");
eq("dēdō is 3rd", L.parseEntry("dēdō, dēdere, dēdidī, dēditus").conjugation, "3");
eq("adeō parses irregular", L.parseEntry("adeō, adīre, adiī, aditus").conjugation, "irregular");
const do_ = V(["dō", "dare", "dedī", "datus"], "irregular");
eq("dō pres", forms(L.conjugateSet(do_, "indicative", "present", "active")), ["dō", "dās", "dat", "damus", "datis", "dant"]);
eq("dō impf", forms(L.conjugateSet(do_, "indicative", "imperfect", "active"))[0], "dabam");
eq("dō pres pas", forms(L.conjugateSet(do_, "indicative", "present", "passive")), ["dor", "daris", "datur", "damur", "daminī", "dantur"]);
eq("dō perf pas", forms(L.conjugateSet(do_, "indicative", "perfect", "passive"))[2], "datus est");
eq("dō pres subj", forms(L.conjugateSet(do_, "subjunctive", "present", "active")), ["dem", "dēs", "det", "dēmus", "dētis", "dent"]);
eq("parse fīnēs", L.parseEntry("fīnēs, fīnium, m.").flags, ["plural-only", "i-stem"]);

// ---------- imperative, infinitives, participles ----------
const cellForm = (c) => c ? c.form : null;
const imp = (e, v) => { const s = L.imperativeSet(e, v || "active"); return s ? s.map(cellForm) : null; };
const infs = (e, v) => L.INF_TENSES.map((t) => cellForm(L.infinitive(e, t, v || "active")));
const parts3 = (e, v) => L.PART_TENSES.map((t) => cellForm(L.participle(e, t, v || "active")));
const mitto = V(["mittō", "mittere", "mīsī", "missus"], "3");
const dico = V(["dīcō", "dīcere", "dīxī", "dictus"], "3"), facio = V(["faciō", "facere", "fēcī", "factus"], "3io");
eq("laudō imperative", imp(laudo), ["laudā", "laudāte"]);
eq("moneō imperative", imp(moneo), ["monē", "monēte"]);
eq("mittō imperative", imp(mitto), ["mitte", "mittite"]);
eq("audiō imperative", imp(audio), ["audī", "audīte"]);
eq("capiō imperative", imp(capio), ["cape", "capite"]);
eq("dīc, dūc, fac", [imp(dico), imp(duco), imp(facio)], [["dīc", "dīcite"], ["dūc", "dūcite"], ["fac", "facite"]]);
eq("dēdūc, addūc", [imp(V(["dēdūcō", "dēdūcere", "dēdūxī", "dēductus"], "3")), imp(V(["addūcō", "addūcere", "addūxī", "adductus"], "3"))], [["dēdūc", "dēdūcite"], ["addūc", "addūcite"]]);
eq("interfice keeps its -e", imp(V(["interficiō", "interficere", "interfēcī", "interfectus"], "3io")), ["interfice", "interficite"]);
eq("passive imperatives", [imp(laudo, "passive"), imp(moneo, "passive"), imp(mitto, "passive"), imp(capio, "passive"), imp(audio, "passive")],
  [["laudāre", "laudāminī"], ["monēre", "monēminī"], ["mittere", "mittiminī"], ["capere", "capiminī"], ["audīre", "audīminī"]]);

eq("laudō infinitives active", infs(laudo), ["laudāre", "laudāvisse", "laudātūrus esse"]);
eq("laudō infinitives passive", infs(laudo, "passive"), ["laudārī", "laudātus esse", null]);
eq("moneō infinitives", [infs(moneo), infs(moneo, "passive")], [["monēre", "monuisse", "monitūrus esse"], ["monērī", "monitus esse", null]]);
eq("mittō infinitives", [infs(mitto), infs(mitto, "passive")], [["mittere", "mīsisse", "missūrus esse"], ["mittī", "missus esse", null]]);
eq("audiō infinitives", [infs(audio), infs(audio, "passive")], [["audīre", "audīvisse", "audītūrus esse"], ["audīrī", "audītus esse", null]]);
eq("capiō infinitives", [infs(capio), infs(capio, "passive")], [["capere", "cēpisse", "captūrus esse"], ["capī", "captus esse", null]]);
eq("dūcō, dīcō, faciō passive infinitives", [duco, dico, facio].map((e) => infs(e, "passive")[0]), ["dūcī", "dīcī", "facī"]);
eq("perfect passive infinitive accepts", L.infinitive(laudo, "perfect", "passive").accept, ["laudāta esse", "laudātum esse", "laudātam esse"]);
eq("future active infinitive accepts", L.infinitive(laudo, "future", "active").accept, ["laudātūra esse", "laudātūrum esse", "laudātūram esse"]);
eq("laudātum esse is graded right", [L.sameForm("laudatum esse", [L.infinitive(laudo, "perfect", "passive").form].concat(L.infinitive(laudo, "perfect", "passive").accept), false),
  L.sameForm("laudātōs esse", [L.infinitive(laudo, "perfect", "passive").form].concat(L.infinitive(laudo, "perfect", "passive").accept), false)], [true, false]);

eq("laudō participles active", parts3(laudo), ["laudāns", null, "laudātūrus"]);
eq("laudō participles passive", parts3(laudo, "passive"), [null, "laudātus", null]);
eq("present participles", [moneo, mitto, capio, audio].map((e) => parts3(e)[0]), ["monēns", "mittēns", "capiēns", "audiēns"]);
eq("perfect participles passive", [moneo, mitto, capio, audio].map((e) => parts3(e, "passive")[1]), ["monitus", "missus", "captus", "audītus"]);
eq("future participles", [moneo, mitto, capio, audio].map((e) => parts3(e)[2]), ["monitūrus", "missūrus", "captūrus", "audītūrus"]);
eq("participle accepts the three nominatives", ["laudātus", "laudātus, laudāta, laudātum", "laudatus laudata laudatum", "laudātus, a, um", "laudāta"]
  .map((typed) => L.sameForm(typed, [L.participle(laudo, "perfect", "passive").form].concat(L.participle(laudo, "perfect", "passive").accept), false)), [true, true, true, true, false]);

// Deponents: passive forms, but the present and future participles and the future infinitive are active in form.
eq("sequor imperative", imp(sequor, "deponent"), ["sequere", "sequiminī"]);
eq("sequor infinitives", infs(sequor, "deponent"), ["sequī", "secūtus esse", "secūtūrus esse"]);
eq("sequor participles", parts3(sequor, "deponent"), ["sequēns", "secūtus", "secūtūrus"]);
eq("patior imperative", imp(patior, "deponent"), ["patere", "patiminī"]);
eq("patior infinitives", infs(patior, "deponent"), ["patī", "passus esse", "passūrus esse"]);
eq("patior participles", parts3(patior, "deponent"), ["patiēns", "passus", "passūrus"]);
eq("hortor, vereor, orior infinitives", [hortor, vereor, V(["orior", "orīrī", "ortus sum"], "4", ["deponent"])].map((e) => infs(e, "deponent")),
  [["hortārī", "hortātus esse", "hortātūrus esse"], ["verērī", "veritus esse", "veritūrus esse"], ["orīrī", "ortus esse", "oritūrus esse"]]);
eq("deponent has no active column", [imp(sequor), infs(sequor), parts3(sequor)], [null, [null, null, null], [null, null, null]]);

// Hand tables.
eq("sum non-finite", [imp(sum), infs(sum), parts3(sum)], [["es", "este"], ["esse", "fuisse", "futūrus esse"], [null, null, "futūrus"]]);
eq("sum has no passive", [imp(sum, "passive"), infs(sum, "passive"), parts3(sum, "passive")], [null, [null, null, null], [null, null, null]]);
eq("possum non-finite", [imp(possum), infs(possum), parts3(possum)], [null, ["posse", "potuisse", null], [null, null, null]]);
eq("eō non-finite", [imp(eo), infs(eo), parts3(eo)], [["ī", "īte"], ["īre", "iisse", "itūrus esse"], ["iēns", null, "itūrus"]]);
eq("eō perfect infinitive also īsse", L.infinitive(eo, "perfect", "active").accept, ["īsse"]);
eq("adeō non-finite", [imp(adeo), infs(adeo), parts3(adeo)], [["adī", "adīte"], ["adīre", "adiisse", "aditūrus esse"], ["adiēns", null, "aditūrus"]]);
eq("absum non-finite", [imp(absum), infs(absum), parts3(absum)], [["abes", "abeste"], ["abesse", "āfuisse", "āfutūrus esse"], [null, null, "āfutūrus"]]);
eq("ferō non-finite", [imp(fero), infs(fero), infs(fero, "passive"), parts3(fero), parts3(fero, "passive")],
  [["fer", "ferte"], ["ferre", "tulisse", "lātūrus esse"], ["ferrī", "lātus esse", null], ["ferēns", null, "lātūrus"], [null, "lātus", null]]);
eq("dō non-finite", [imp(do_), infs(do_), infs(do_, "passive"), parts3(do_, "passive")], [["dā", "date"], ["dare", "dedisse", "datūrus esse"], ["darī", "datus esse", null], [null, "datus", null]]);
eq("volō, nōlō, mālō", [infs(volo), imp(volo), infs(nolo), imp(nolo), infs(malo)], [["velle", "voluisse", null], null, ["nōlle", "nōluisse", null], ["nōlī", "nōlīte"], ["mālle", "māluisse", null]]);
eq("fīō", [infs(fio), parts3(fio)], [["fierī", "factus esse", null], [null, "factus", null]]);

// No fourth principal part: nothing built on the participle. A neuter or
// -ūrus fourth part gives the future forms only.
const timeo = V(["timeō", "timēre", "timuī"], "2"), contendo = V(["contendō", "contendere", "contendī"], "3", ["no-passive"]);
const pugno = V(["pugnō", "pugnāre", "pugnāvī", "pugnātum"], "1", ["no-passive"]), maneo = V(["maneō", "manēre", "mānsī", "mānsūrus"], "2", ["no-passive"]);
eq("timeō: no fourth part", [infs(timeo), infs(timeo, "passive"), parts3(timeo), parts3(timeo, "passive")], [["timēre", "timuisse", null], ["timērī", null, null], ["timēns", null, null], [null, null, null]]);
eq("contendō: no fourth part, no passive", [imp(contendo), infs(contendo), parts3(contendo), infs(contendo, "passive"), imp(contendo, "passive")], [["contende", "contendite"], ["contendere", "contendisse", null], ["contendēns", null, null], [null, null, null], null]);
eq("pugnō: pugnātum gives pugnātūrus", [infs(pugno), parts3(pugno), parts3(pugno, "passive")], [["pugnāre", "pugnāvisse", "pugnātūrus esse"], ["pugnāns", null, "pugnātūrus"], [null, null, null]]);
eq("maneō: mānsūrus", [infs(maneo), parts3(maneo)], [["manēre", "mānsisse", "mānsūrus esse"], ["manēns", null, "mānsūrus"]]);

// One cell of any section.
eq("synopsisCell", [L.synopsisCell(laudo, "indicative", "present", "active", "3", "pl"), L.synopsisCell(laudo, "imperative", "present", "active", "1", "pl"),
  L.synopsisCell(laudo, "imperative", "present", "active", "3", "sg"), L.synopsisCell(laudo, "infinitive", "perfect", "active", "3", "pl"),
  L.synopsisCell(laudo, "participle", "future", "active", "1", "sg"), L.synopsisCell(laudo, "participle", "future", "passive", "1", "sg")].map(cellForm),
  ["laudant", "laudāte", "laudā", "laudāvisse", "laudātūrus", null]);

// Whole synopsis shape.
const syn = L.synopsis(laudo);
eq("synopsis voices", syn.voices, ["active", "passive"]);
eq("synopsis tenses", Object.keys(syn.indicative.active), L.IND_TENSES);
eq("synopsis subj tenses", Object.keys(syn.subjunctive.passive), L.SUBJ_TENSES);
eq("synopsis imperative", syn.imperative.active.present.map(cellForm), ["laudā", "laudāte"]);
eq("synopsis infinitive tenses", Object.keys(syn.infinitive.passive), L.INF_TENSES);
eq("synopsis participle tenses", Object.keys(syn.participle.active), L.PART_TENSES);

// ---------- grading ----------
eq("macrons ignored", L.sameForm("laudavi", "laudāvī", false), true);
eq("macrons strict", L.sameForm("laudavi", "laudāvī", true), false);
eq("macrons strict ok", L.sameForm("laudāvī", "laudāvī", true), true);
eq("i/j", L.sameForm("iubeo", "jubeō", false), true);
eq("u/v", L.sameForm("laudaui", "laudāvī", false), true);
eq("case/space", L.sameForm("  Laudātus   SUM ", "laudātus sum", true), true);
eq("alternatives", L.sameForm("laudāta sum", ["laudātus sum", "laudāta sum"], true), true);
eq("spell classical", L.spell("jubeō", "classical"), "iubeō");
eq("spell henle", L.spell("jubeō", "henle"), "jubeō");

// ---------- dictionary-line parser ----------
eq("parse noun", L.parseEntry("mīles, mīlitis, m."), { pos: "noun", lemma: "mīles", gen: "mīlitis", gender: "m", declension: "3" });
eq("parse i-stem", L.parseEntry("mare, maris, n. i").flags, ["i-stem"]);
eq("parse 5th", L.parseEntry("rēs, reī, f.").declension, "5");
eq("parse deus is 2nd", L.parseEntry("deus, deī, m.").declension, "2");
d = L.declineNoun({ pos: "noun", lemma: "deus", gen: "deī", gender: "m", declension: "2",
  forms: { "sg.voc": "deus", "pl.nom": ["dī", "deī"], "pl.dat": ["dīs", "deīs"], "pl.abl": ["dīs", "deīs"], "pl.voc": ["dī", "deī"] } });
eq("deus overrides", [d.sg.voc, d.pl.nom, d.pl.gen, d.pl.dat], ["deus", ["dī", "deī"], "deōrum", ["dīs", "deīs"]]);
d = L.declineNoun({ pos: "noun", lemma: "Jēsūs", gen: "Jēsū", gender: "m", declension: "4", stem: "Jēs", flags: ["singular-only"],
  forms: { "sg.gen": "Jēsū", "sg.dat": "Jēsū", "sg.voc": "Jēsū" } });
eq("Jēsūs", d.sg, { nom: "Jēsūs", gen: "Jēsū", dat: "Jēsū", acc: "Jēsum", abl: "Jēsū", voc: "Jēsū" });
eq("Jēsūs no plural", d.pl.nom, null);
eq("parse castra", L.parseEntry("castra, castrōrum, n."), { pos: "noun", lemma: "castra", gen: "castrōrum", gender: "n", declension: "2", stem: "castr", flags: ["plural-only"] });
eq("parse verb", L.parseEntry("capiō, capere, cēpī, captus").conjugation, "3io");
eq("parse deponent", L.parseEntry("sequor, sequī, secūtus sum").flags, ["deponent"]);
eq("parse irregular", L.parseEntry("ferō, ferre, tulī, lātus").conjugation, "irregular");

// ---------- availability ----------
const vocab = [
  { lemma: "terra", gen: "terrae", gender: "f", declension: "1", pos: "noun", lesson: 1, curriculum: "henle" },
  { lemma: "mīles", gen: "mīlitis", gender: "m", declension: "3", pos: "noun", lesson: 4, curriculum: "henle" },
  { lemma: "in", pos: "indeclinable", lesson: 1, curriculum: "henle" },
  { lemma: "laudō", parts: ["laudō", "laudāre", "laudāvī", "laudātus"], conjugation: "1", pos: "verb", lesson: 11, curriculum: "henle" }
];
eq("availability", L.availability("Mīlitēs in terrā laudātī sunt.", vocab, "henle"), { lesson: 11, unknown: [] });
eq("availability unknown", L.availability("Mīlitēs rēgem laudant.", vocab, "henle"), { lesson: 11, unknown: ["rēgem"] });
const grammar = { nouns: { declension: { "1": 1, "3": 4 } }, verbs: { conjugation: { "1": 11 }, indicative: { active: { present: 11, perfect: 17 }, passive: { perfect: 20 } }, subjunctive: { active: { pluperfect: 32 } } } };
eq("availability with grammar: perfect passive", L.availability("Mīlitēs in terrā laudātī sunt.", vocab, "henle", grammar).lesson, 20);
eq("availability with grammar: present", L.availability("Mīlitēs terram laudant.", vocab, "henle", grammar).lesson, 11);
eq("availability with grammar: plup subj", L.availability("laudāvissent", vocab, "henle", grammar).lesson, 32);
eq("availability with grammar: sum alone stays early", L.availability("Terra est.", [...vocab, { lemma: "sum", parts: ["sum", "esse", "fuī", "futūrus"], conjugation: "irregular", pos: "verb", lesson: 1, curriculum: "henle", flags: ["no-passive"] }], "henle", grammar).lesson, 1);
eq("lessonOf available", L.lessonOf({ lesson: 3, available: { henle: 7 } }, "henle"), 7);
eq("lessonOf fallback", L.lessonOf({ lesson: 3, available: { henle: 7 } }, "wheelock"), 3);

// ---------- grammar schedule: per conjugation ----------
const G = JSON.parse(require("fs").readFileSync(require("path").join(__dirname, "..", "site", "practice", "data", "henle", "curriculum.json"), "utf8")).grammar;
const cellL = (e, m, t, v) => L.verbCellLesson(e, m, t, v, G);
eq("laudō present active L9", cellL(laudo, "indicative", "present", "active"), 9);
eq("moneō present active L10", cellL(moneo, "indicative", "present", "active"), 10);
eq("dūcō future active L12", cellL(duco, "indicative", "future", "active"), 12);
eq("audiō imperfect active L13", cellL(audio, "indicative", "imperfect", "active"), 13);
eq("laudō perfect active L15", cellL(laudo, "indicative", "perfect", "active"), 15);
eq("laudō present passive L17", cellL(laudo, "indicative", "present", "passive"), 17);
eq("moneō present passive L18", cellL(moneo, "indicative", "present", "passive"), 18);
eq("dūcō present passive L19", cellL(duco, "indicative", "present", "passive"), 19);
eq("audiō present passive L20", cellL(audio, "indicative", "present", "passive"), 20);
eq("laudō perfect passive L21", cellL(laudo, "indicative", "perfect", "passive"), 21);
eq("present subj active L22", cellL(duco, "subjunctive", "present", "active"), 22);
eq("imperfect subj active L23", cellL(duco, "subjunctive", "imperfect", "active"), 23);
eq("perfect subj active L26", cellL(duco, "subjunctive", "perfect", "active"), 26);
eq("passive subj L29", cellL(duco, "subjunctive", "pluperfect", "passive"), 29);
eq("capiō everything waits for L37", [cellL(capio, "indicative", "present", "active"), cellL(capio, "indicative", "perfect", "active"), cellL(capio, "subjunctive", "present", "passive")], [37, 37, 37]);
eq("sum present system L14", cellL(sum, "indicative", "imperfect", "active"), 14);
eq("sum perfect L15", cellL(sum, "indicative", "perfect", "active"), 15);
eq("sum imperfect subj L23", cellL(sum, "subjunctive", "imperfect", "active"), 23);
eq("absum follows sum", cellL(absum, "indicative", "present", "active"), 14);
eq("possum L35", [cellL(possum, "indicative", "present", "active"), cellL(possum, "subjunctive", "present", "active")], [35, 35]);
eq("eō L42", cellL(eo, "indicative", "present", "active"), 42);
eq("adeō follows eō", cellL(adeo, "subjunctive", "imperfect", "active"), 42);
eq("dō like the first conjugation", [cellL(do_, "indicative", "present", "active"), cellL(do_, "indicative", "present", "passive"), cellL(do_, "indicative", "perfect", "active")], [9, 17, 15]);
eq("deponents L41", [cellL(sequor, "indicative", "present", "deponent"), cellL(patior, "subjunctive", "perfect", "deponent")], [41, 41]);
eq("ferō not taught in First Year", cellL(fero, "indicative", "present", "active"), null);
eq("start lessons", [laudo, moneo, duco, audio, capio, sequor, sum, eo, fero].map((e) => L.verbStartLesson(e, G)), [9, 10, 12, 13, 37, 41, 14, 42, null]);

// ---------- grammar schedule: imperative, infinitives, participles ----------
// Henle, First Year Latin: imperative active L27 (p. 296); perfect participle
// passive L30 (p. 325); present infinitives L35 (p. 352); perfect and future
// infinitive active and future participle active L39 (p. 412); perfect
// infinitive passive L39 (p. 428); deponents L41 (pp. 450, 453); eō L42 (p. 464).
const formL = (e, s, t, v) => L.verbFormLesson(e, s, t, v, G);
const infL = (e, v) => L.INF_TENSES.map((t) => formL(e, "infinitive", t, v));
const partL = (e, v) => L.PART_TENSES.map((t) => formL(e, "participle", t, v));
eq("imperative active L27", [laudo, moneo, mitto, audio].map((e) => formL(e, "imperative", "present", "active")), [27, 27, 27, 27]);
eq("imperative of -iō verbs L37", [formL(capio, "imperative", "present", "active"), formL(facio, "imperative", "present", "active")], [37, 37]);
eq("imperative passive not taught", [laudo, capio].map((e) => formL(e, "imperative", "present", "passive")), [null, null]);
eq("imperative of dō L27", formL(do_, "imperative", "present", "active"), 27);
eq("imperative of sum, possum, eō and compounds not taught", [sum, absum, possum, eo, adeo].map((e) => formL(e, "imperative", "present", "active")), [null, null, null, null, null]);
eq("imperative of deponents not taught", formL(sequor, "imperative", "present", "deponent"), null);
eq("infinitives active L35, L39, L39", infL(laudo, "active"), [35, 39, 39]);
eq("infinitives passive L35, L39, never", infL(laudo, "passive"), [35, 39, null]);
eq("infinitives of -iō verbs L37, L39", [infL(capio, "active"), infL(capio, "passive")], [[37, 39, 39], [37, 39, null]]);
eq("participles: perfect passive L30, future active L39, present never", [partL(laudo, "active"), partL(laudo, "passive")], [[null, null, 39], [null, 30, null]]);
eq("participles of -iō verbs wait for L37", [partL(capio, "active"), partL(capio, "passive")], [[null, null, 39], [null, 37, null]]);
eq("sum infinitives L35, L39", infL(sum, "active"), [35, 39, 39]);
eq("absum follows sum", [infL(absum, "active"), partL(absum, "active")], [[35, 39, 39], [null, null, 39]]);
eq("possum infinitives L35, L39", infL(possum, "active"), [35, 39, 39]);
eq("eō and adeō infinitives L42", [infL(eo, "active"), infL(adeo, "active"), partL(eo, "active")], [[42, 42, 42], [42, 42, 42], [null, null, 42]]);
eq("deponent infinitives and participles L41", [infL(sequor, "deponent"), partL(patior, "deponent")], [[41, 41, 41], [null, 41, 41]]);
eq("ferō still not taught", [formL(fero, "imperative", "present", "active"), infL(fero, "active")], [null, [null, null, null]]);
eq("verbFormLesson passes the moods through", [formL(laudo, "indicative", "present", "active"), formL(duco, "subjunctive", "pluperfect", "passive")], [9, 29]);
eq("no schedule: non-finite forms closed", [L.verbFormLesson(laudo, "imperative", "present", "active", {}), L.verbFormLesson(laudo, "infinitive", "present", "active", grammar)], [null, null]);

// formsOf and availability see the new forms.
eq("formsOf has imperatives, infinitives, declined participles", ["lauda", "laudate", "laudauisse", "laudari", "laudatos", "laudaturam", "laudans"].every((f) => L.formsOf(laudo).includes(f)), true);
eq("formsOf has no stray words from the accepted spellings", ["a", "um", "laudatus,"].some((f) => L.formsOf(laudo).includes(f)), false);
const nvocab = [...vocab, { lemma: "sum", parts: ["sum", "esse", "fuī", "futūrus"], conjugation: "irregular", pos: "verb", lesson: 1, curriculum: "henle", flags: ["no-passive"] },
  { lemma: "capiō", parts: ["capiō", "capere", "cēpī", "captus"], conjugation: "3io", pos: "verb", lesson: 14, curriculum: "henle" }];
const avail = (s) => L.availability(s, nvocab, "henle", G).lesson;
eq("availability: imperative L27", [avail("Laudāte mīlitēs."), avail("Laudā terram.")], [27, 27]);
eq("availability: cape waits for L37", avail("Cape terram."), 37);
eq("availability: present infinitive stays at the verb's start (a principal part)", avail("laudāre"), 11);
eq("availability: present passive infinitive L35", avail("laudārī"), 35);
eq("availability: perfect infinitive L39", [avail("laudāvisse"), avail("fuisse")], [39, 39]);
eq("availability: participle in an oblique case L30", avail("mīlitēs laudātōs"), 30);
eq("availability: laudātus itself is a principal part, known from the verb's start", avail("laudātus"), 11);
eq("availability: future participle L39", [avail("laudātūrōs esse"), avail("futūram")], [39, 39]);
eq("availability: forms the book never teaches stay unknown", [L.availability("laudāns", nvocab, "henle", G).unknown, L.availability("laudāminī", nvocab, "henle", G).lesson], [["laudāns"], 17]);

// ---------- adjectives ----------
function ADJ(nom, declension, flags) { return { pos: "adjective", lemma: nom[0], nom, declension, flags }; }
const magnus = ADJ(["magnus", "magna", "magnum"], "1-2");
let a = L.declineAdjective(magnus);
eq("magnus m sg", a.m.sg, { nom: "magnus", gen: "magnī", dat: "magnō", acc: "magnum", abl: "magnō", voc: "magne" });
eq("magnus m pl", a.m.pl, { nom: "magnī", gen: "magnōrum", dat: "magnīs", acc: "magnōs", abl: "magnīs", voc: "magnī" });
eq("magnus f sg", a.f.sg, { nom: "magna", gen: "magnae", dat: "magnae", acc: "magnam", abl: "magnā", voc: "magna" });
eq("magnus f pl", a.f.pl, { nom: "magnae", gen: "magnārum", dat: "magnīs", acc: "magnās", abl: "magnīs", voc: "magnae" });
eq("magnus n sg", a.n.sg, { nom: "magnum", gen: "magnī", dat: "magnō", acc: "magnum", abl: "magnō", voc: "magnum" });
eq("magnus n pl", a.n.pl, { nom: "magna", gen: "magnōrum", dat: "magnīs", acc: "magna", abl: "magnīs", voc: "magna" });

a = L.declineAdjective(ADJ(["miser", "misera", "miserum"], "1-2"));
eq("miser m sg", a.m.sg, { nom: "miser", gen: "miserī", dat: "miserō", acc: "miserum", abl: "miserō", voc: "miser" });
eq("miser f sg", a.f.sg, { nom: "misera", gen: "miserae", dat: "miserae", acc: "miseram", abl: "miserā", voc: "misera" });
eq("miser n pl", a.n.pl, { nom: "misera", gen: "miserōrum", dat: "miserīs", acc: "misera", abl: "miserīs", voc: "misera" });

a = L.declineAdjective(ADJ(["integer", "integra", "integrum"], "1-2"));
eq("integer m sg", a.m.sg, { nom: "integer", gen: "integrī", dat: "integrō", acc: "integrum", abl: "integrō", voc: "integer" });
eq("integer m pl", a.m.pl, { nom: "integrī", gen: "integrōrum", dat: "integrīs", acc: "integrōs", abl: "integrīs", voc: "integrī" });
eq("integer f sg", a.f.sg, { nom: "integra", gen: "integrae", dat: "integrae", acc: "integram", abl: "integrā", voc: "integra" });
eq("integer n sg", a.n.sg, { nom: "integrum", gen: "integrī", dat: "integrō", acc: "integrum", abl: "integrō", voc: "integrum" });

a = L.declineAdjective(ADJ(["noster", "nostra", "nostrum"], "1-2"));
eq("noster m sg", a.m.sg, { nom: "noster", gen: "nostrī", dat: "nostrō", acc: "nostrum", abl: "nostrō", voc: "noster" });
eq("noster f pl", a.f.pl, { nom: "nostrae", gen: "nostrārum", dat: "nostrīs", acc: "nostrās", abl: "nostrīs", voc: "nostrae" });
eq("noster n sg nom", a.n.sg.nom, "nostrum");
eq("meus voc", L.declineAdjective(ADJ(["meus", "mea", "meum"], "1-2")).m.sg.voc, "mī");
eq("tuus voc", L.declineAdjective(ADJ(["tuus", "tua", "tuum"], "1-2")).m.sg.voc, "tue");

const gravis = ADJ(["gravis", "grave"], "3");
a = L.declineAdjective(gravis);
eq("gravis m sg", a.m.sg, { nom: "gravis", gen: "gravis", dat: "gravī", acc: "gravem", abl: "gravī", voc: "gravis" });
eq("gravis m pl", a.m.pl, { nom: "gravēs", gen: "gravium", dat: "gravibus", acc: "gravēs", abl: "gravibus", voc: "gravēs" });
eq("gravis f = m", [a.f.sg, a.f.pl], [a.m.sg, a.m.pl]);
eq("gravis n sg", a.n.sg, { nom: "grave", gen: "gravis", dat: "gravī", acc: "grave", abl: "gravī", voc: "grave" });
eq("gravis n pl", a.n.pl, { nom: "gravia", gen: "gravium", dat: "gravibus", acc: "gravia", abl: "gravibus", voc: "gravia" });

const totus = ADJ(["tōtus", "tōta", "tōtum"], "1-2", ["gen-ius"]);
a = L.declineAdjective(totus);
eq("tōtus m sg", a.m.sg, { nom: "tōtus", gen: "tōtīus", dat: "tōtī", acc: "tōtum", abl: "tōtō", voc: "tōte" });
eq("tōtus f sg", a.f.sg, { nom: "tōta", gen: "tōtīus", dat: "tōtī", acc: "tōtam", abl: "tōtā", voc: "tōta" });
eq("tōtus n sg", a.n.sg, { nom: "tōtum", gen: "tōtīus", dat: "tōtī", acc: "tōtum", abl: "tōtō", voc: "tōtum" });
eq("tōtus plural is regular", a.f.pl, { nom: "tōtae", gen: "tōtārum", dat: "tōtīs", acc: "tōtās", abl: "tōtīs", voc: "tōtae" });

const alius = ADJ(["alius", "alia", "aliud"], "1-2", ["gen-ius"]);
a = L.declineAdjective(alius);
eq("alius m sg", a.m.sg, { nom: "alius", gen: "alīus", dat: "aliī", acc: "alium", abl: "aliō", voc: "alie" });
eq("alius f sg", a.f.sg, { nom: "alia", gen: "alīus", dat: "aliī", acc: "aliam", abl: "aliā", voc: "alia" });
eq("alius n sg", a.n.sg, { nom: "aliud", gen: "alīus", dat: "aliī", acc: "aliud", abl: "aliō", voc: "aliud" });
eq("alius n pl", a.n.pl, { nom: "alia", gen: "aliōrum", dat: "aliīs", acc: "alia", abl: "aliīs", voc: "alia" });
// The genitive singular of alius as vocab.json has it: alterīus (i long or
// short) is the usual form, alīus the regular one, aliī / aliae also found.
// The dative shows aliī and also accepts aliō (m., n.) and aliae (f.).
const ALIUS_GEN = ["alterīus", "alterius", "alīus", "aliī"], ALIUS_GEN_F = ["alterīus", "alterius", "alīus", "aliae"];
const ALIUS_DAT = ["aliī", "aliō"], ALIUS_DAT_F = ["aliī", "aliae"];
const aliusFull = Object.assign({}, alius, { forms: { "m.sg.gen": ALIUS_GEN, "f.sg.gen": ALIUS_GEN_F, "n.sg.gen": ALIUS_GEN, "m.sg.dat": ALIUS_DAT, "f.sg.dat": ALIUS_DAT_F, "n.sg.dat": ALIUS_DAT } });
a = L.declineAdjective(aliusFull);
eq("alius overrides", [a.m.sg.gen, a.f.sg.gen, a.n.sg.gen, a.m.sg.dat, a.f.sg.dat, a.n.sg.dat], [ALIUS_GEN, ALIUS_GEN_F, ALIUS_GEN, ALIUS_DAT, ALIUS_DAT_F, ALIUS_DAT]);
eq("alius dat graded strictly", [L.sameForm("aliī", a.m.sg.dat, true), L.sameForm("aliō", a.m.sg.dat, true), L.sameForm("aliae", a.m.sg.dat, true), L.sameForm("aliae", a.f.sg.dat, true), L.sameForm("aliō", a.f.sg.dat, true)], [true, true, false, true, false]);
eq("alius overrides in formsOf", ["alterius", "alius", "aliae", "alii"].every((f) => L.formsOf(aliusFull).includes(f)), true);
eq("alius gen graded strictly", [L.sameForm("alterius", a.m.sg.gen, true), L.sameForm("alterīus", a.m.sg.gen, true), L.sameForm("alīus", a.m.sg.gen, true), L.sameForm("alius", a.m.sg.gen, true), L.sameForm("aliae", a.f.sg.gen, true), L.sameForm("aliae", a.m.sg.gen, true)], [true, true, true, false, true, false]);
const vAlius = JSON.parse(require("fs").readFileSync(require("path").join(__dirname, "..", "site", "practice", "data", "henle", "vocab.json"), "utf8").replace(/^﻿/, "")).find((e) => e.id === "adj-alius");
eq("vocab.json alius", [L.declineAdjective(vAlius).m.sg, L.declineAdjective(vAlius).f.sg.gen, L.declineAdjective(vAlius).f.sg.dat], [{ nom: "alius", gen: ALIUS_GEN, dat: ALIUS_DAT, acc: "alium", abl: "aliō", voc: "alie" }, ALIUS_GEN_F, ALIUS_DAT_F]);
a = L.declineAdjective(ADJ(["uter", "utra", "utrum"], "1-2", ["gen-ius"]));
eq("uter gen/dat", [a.m.sg.gen, a.f.sg.dat, a.n.sg.acc, a.m.pl.acc], ["utrīus", "utrī", "utrum", "utrōs"]);
a = L.declineAdjective(ADJ(["alter", "altera", "alterum"], "1-2", ["gen-ius"]));
eq("alter gen/dat", [a.m.sg.gen, a.n.sg.dat, a.f.sg.acc], ["alterīus", "alterī", "alteram"]);
a = L.declineAdjective(ADJ(["ūnus", "ūna", "ūnum"], "1-2", ["gen-ius", "singular-only"]));
eq("ūnus singular only", [a.f.sg.gen, a.m.pl.nom, a.n.pl.acc], ["ūnīus", null, null]);

// agreement: the noun's gender picks the table
const bonus = ADJ(["bonus", "bona", "bonum"], "1-2"), fortis = ADJ(["fortis", "forte"], "3");
const nauta = N("nauta", "nautae", "m", "1"), miles = N("mīles", "mīlitis", "m", "3");
const flumen = N("flūmen", "flūminis", "n", "3"), manus = N("manus", "manūs", "f", "4");
const agree = (adj, noun) => L.NUMBERS.map((n) => L.CASES.map((c) => L.agreeAdjective(adj, noun, c, n)));
eq("nauta bonus", agree(bonus, nauta), [["bonus", "bonī", "bonō", "bonum", "bonō", "bone"], ["bonī", "bonōrum", "bonīs", "bonōs", "bonīs", "bonī"]]);
eq("mīles fortis", agree(fortis, miles), [["fortis", "fortis", "fortī", "fortem", "fortī", "fortis"], ["fortēs", "fortium", "fortibus", "fortēs", "fortibus", "fortēs"]]);
eq("flūmen magnum", agree(magnus, flumen), [["magnum", "magnī", "magnō", "magnum", "magnō", "magnum"], ["magna", "magnōrum", "magnīs", "magna", "magnīs", "magna"]]);
eq("manus magna", agree(magnus, manus), [["magna", "magnae", "magnae", "magnam", "magnā", "magna"], ["magnae", "magnārum", "magnīs", "magnās", "magnīs", "magnae"]]);
eq("flūmen forte", [L.agreeAdjective(fortis, flumen, "acc", "sg"), L.agreeAdjective(fortis, flumen, "nom", "pl")], ["forte", "fortia"]);

// dictionary lines
eq("parse gravis, grave", L.parseEntry("gravis, grave"), { pos: "adjective", lemma: "gravis", nom: ["gravis", "grave"], declension: "3" });
eq("parse gravis, e", L.parseEntry("gravis, e").nom, ["gravis", "grave"]);
eq("parse magnus, a, um", L.parseEntry("magnus, a, um"), { pos: "adjective", lemma: "magnus", nom: ["magnus", "magna", "magnum"], declension: "1-2" });
eq("parse integer", L.parseEntry("integer, integra, integrum").nom, ["integer", "integra", "integrum"]);
eq("parse alius -īus", L.parseEntry("alius, alia, aliud, -īus"), { pos: "adjective", lemma: "alius", nom: ["alius", "alia", "aliud"], declension: "1-2", flags: ["gen-ius"] });
eq("entry text", [L.adjectiveEntryText(fortis), L.adjectiveEntryText(magnus)], ["fortis, forte", "magnus, magna, magnum"]);
eq("adjective types", [magnus, gravis, ADJ(["miser", "misera", "miserum"], "1-2"), totus].map(L.adjectiveType), ["1-2", "3", "er", "1-2"]);

// schedule and availability
eq("adjective start lessons", [magnus, gravis, ADJ(["miser", "misera", "miserum"], "1-2"), ADJ(["noster", "nostra", "nostrum"], "1-2"), totus, ADJ(["alter", "altera", "alterum"], "1-2", ["gen-ius"])]
  .map((e) => L.adjectiveStartLesson(e, G)), [7, 8, 16, 16, 36, 36]);
eq("no schedule: open", L.adjectiveStartLesson(magnus, {}), 0);
const avocab = [
  { lemma: "via", gen: "viae", gender: "f", declension: "1", pos: "noun", lesson: 3, curriculum: "henle" },
  Object.assign({ lesson: 7, curriculum: "henle" }, magnus),
  Object.assign({ lesson: 1, curriculum: "henle" }, gravis),
  Object.assign({ lesson: 9, curriculum: "henle" }, ADJ(["aliēnus", "aliēna", "aliēnum"], "1-2"))
];
eq("formsOf adjective", ["magna", "magnarum", "magne", "magnum"].every((f) => L.formsOf(magnus).includes(f)), true);
eq("availability sees magna", L.availability("Via magna.", avocab, "henle", G), { lesson: 7, unknown: [] });
eq("adjective waits for its type", L.availability("gravia", avocab, "henle", G).lesson, 8);
eq("adjective waits for its own lesson", L.availability("aliēnīs", avocab, "henle", G).lesson, 9);
eq("adjective vocative waits for the vocative", L.availability("magne", avocab, "henle", G).lesson, 27);

// "first opens at": the later of the word's lesson and its grammar's
const at = (lesson, e) => Object.assign({ lesson, curriculum: "henle" }, e);
eq("noun opens at its own lesson", L.nounOpenLesson(at(3, N("mīles", "mīlitis", "m", "3")), "henle", G), 3);
eq("noun waits for its declension", L.nounOpenLesson(at(1, N("mīles", "mīlitis", "m", "3")), "henle", G), 3);
eq("noun after its declension", L.nounOpenLesson(at(22, N("terra", "terrae", "f", "1")), "henle", G), 22);
eq("noun: available wins over lesson", L.nounOpenLesson(Object.assign(at(1, N("terra", "terrae", "f", "1")), { available: { henle: 6 } }), "henle", G), 6);
eq("noun: no schedule", L.nounOpenLesson(at(4, N("terra", "terrae", "f", "1")), "henle", {}), 4);
eq("vocative lesson", [L.vocativeLesson(G), L.vocativeLesson({})], [27, 0]);
eq("noun cells: the vocative waits", ["nom", "abl", "voc"].map((c) => L.nounCellOpenLesson(at(2, N("servus", "servī", "m", "2")), c, "henle", G)), [2, 2, 27]);
eq("noun cells: a late noun's vocative", L.nounCellOpenLesson(at(37, N("servus", "servī", "m", "2")), "voc", "henle", G), 37);
eq("adjective open lessons", [at(7, magnus), at(1, gravis), at(9, magnus), at(16, ADJ(["noster", "nostra", "nostrum"], "1-2")), at(8, totus)]
  .map((e) => L.adjectiveOpenLesson(e, "henle", G)), [7, 8, 9, 16, 36]);
eq("adjective type never taught", L.adjectiveOpenLesson(at(7, magnus), "henle", { adjectives: { declension: { "1-2": null } } }), null);
const openL = (lesson, e, s, t, v) => L.verbCellOpenLesson(at(lesson, e), s, t, v, "henle", G);
eq("verb cell: grammar later than the word", [openL(1, laudo, "indicative", "present", "active"), openL(1, laudo, "indicative", "present", "passive"),
  openL(1, laudo, "indicative", "perfect", "active"), openL(11, laudo, "subjunctive", "present", "active")], [9, 17, 15, 22]);
eq("verb cell: word later than the grammar", [openL(24, laudo, "indicative", "present", "active"), openL(24, laudo, "indicative", "perfect", "passive"),
  openL(24, laudo, "imperative", "present", "active"), openL(24, laudo, "infinitive", "perfect", "active")], [24, 24, 27, 39]);
eq("verb cell: -iō verbs and deponents", [openL(14, capio, "indicative", "present", "active"), openL(14, capio, "indicative", "perfect", "active"),
  openL(41, sequor, "indicative", "present", "deponent")], [37, 37, 41]);
eq("verb cell: never taught", [openL(1, laudo, "imperative", "present", "passive"), openL(1, fero, "indicative", "present", "active")], [null, null]);

// ---------- Second Year: adjectives of three endings and of one ----------
{
  const acer = { pos: "adjective", lemma: "ācer", nom: ["ācer", "ācris", "ācre"], declension: "3" };
  const audax = { pos: "adjective", lemma: "audāx", nom: ["audāx"], gen: "audācis", declension: "3" };
  const diligens = { pos: "adjective", lemma: "dīligēns", nom: ["dīligēns"], gen: "dīligentis", declension: "3" };
  const a = L.declineAdjective(acer), x = L.declineAdjective(audax), g = L.declineAdjective(diligens);
  eq("ācer nominatives", [a.m.sg.nom, a.f.sg.nom, a.n.sg.nom], ["ācer", "ācris", "ācre"]);
  eq("ācer m sg", a.m.sg, { nom: "ācer", gen: "ācris", dat: "ācrī", acc: "ācrem", abl: "ācrī", voc: "ācer" });
  eq("ācer n pl", a.n.pl, { nom: "ācria", gen: "ācrium", dat: "ācribus", acc: "ācria", abl: "ācribus", voc: "ācria" });
  eq("audāx sg: one nominative, neuter accusative like it", [x.m.sg.nom, x.f.sg.nom, x.n.sg.nom, x.m.sg.acc, x.n.sg.acc, x.f.sg.abl], ["audāx", "audāx", "audāx", "audācem", "audāx", "audācī"]);
  eq("audāx pl", [x.m.pl.nom, x.n.pl.nom, x.f.pl.gen], ["audācēs", "audācia", "audācium"]);
  eq("dīligēns", [g.m.sg.gen, g.n.sg.acc, g.n.pl.acc, g.m.pl.gen], ["dīligentis", "dīligēns", "dīligentia", "dīligentium"]);
  eq("entry text, one ending", [L.adjectiveEntryText(audax), L.adjectiveEntryText(acer)], ["audāx (gen. audācis)", "ācer, ācris, ācre"]);
  let threw = false;
  try { L.declineAdjective({ pos: "adjective", lemma: "audāx", nom: ["audāx"], declension: "3" }); } catch (e) { threw = true; }
  eq("one ending without gen is an error", threw, true);
  eq("agreement: mīles audāx, flūmen ācre", [
    L.agreeAdjective(audax, { gender: "m" }, "acc", "sg"), L.agreeAdjective(acer, { gender: "n" }, "nom", "sg")], ["audācem", "ācre"]);
}
// ---------- Second Year: dēsum, the compounds of ferō, morior ----------
{
  const desum = { pos: "verb", lemma: "dēsum", parts: ["dēsum", "deesse", "dēfuī", "dēfutūrus"], conjugation: "irregular", flags: ["no-passive"] };
  eq("dēsum: dē- is short before a vowel", forms(L.conjugateSet(desum, "indicative", "present", "active")), ["dēsum", "dees", "deest", "dēsumus", "deestis", "dēsunt"]);
  eq("dēsum imperfect, perfect", [forms(L.conjugateSet(desum, "indicative", "imperfect", "active"))[2], forms(L.conjugateSet(desum, "indicative", "perfect", "active"))[2]], ["deerat", "dēfuit"]);
  const differo = { pos: "verb", lemma: "differō", parts: ["differō", "differre", "distulī", "dīlātus"], conjugation: "irregular" };
  const refero = { pos: "verb", lemma: "referō", parts: ["referō", "referre", "rettulī", "relātus"], conjugation: "irregular" };
  eq("differō, referō have ferō's table", [L.hasIrregularTable(differo), L.hasIrregularTable(refero)], [true, true]);
  eq("differō: present, perfect, perfect passive", [
    forms(L.conjugateSet(differo, "indicative", "present", "active"))[1],
    forms(L.conjugateSet(differo, "indicative", "perfect", "active"))[5],
    forms(L.conjugateSet(differo, "indicative", "perfect", "passive"))[2]], ["differs", "distulērunt", "dīlātus est"]);
  eq("referō: rettulit, refer", [forms(L.conjugateSet(refero, "indicative", "perfect", "active"))[2], L.imperativeSet(refero, "active")[0].form], ["rettulit", "refer"]);
  const morior = { pos: "verb", lemma: "morior", parts: ["morior", "morī", "mortuus sum"], conjugation: "3io", flags: ["deponent"] };
  eq("morior: moritūrus", [L.participle(morior, "future", "deponent").form, L.infinitive(morior, "future", "deponent").form], ["moritūrus", "moritūrus esse"]);
}
// ---------- Third Year: semi-deponents, afferō and offerō, patefaciō ----------
{
  const audeo = { pos: "verb", lemma: "audeō", parts: ["audeō", "audēre", "ausus sum"], conjugation: "2", flags: ["semi-deponent"] };
  eq("audeō: one column, active", L.verbVoices(audeo), ["active"]);
  eq("audeō: present and imperfect are active", [forms(L.conjugateSet(audeo, "indicative", "present", "active"))[2], forms(L.conjugateSet(audeo, "subjunctive", "imperfect", "active"))[5]], ["audet", "audērent"]);
  eq("audeō: the perfect system is from the participle", [
    forms(L.conjugateSet(audeo, "indicative", "perfect", "active")),
    forms(L.conjugateSet(audeo, "subjunctive", "pluperfect", "active"))[0]],
    [["ausus sum", "ausus es", "ausus est", "ausī sumus", "ausī estis", "ausī sunt"], "ausus essem"]);
  eq("audeō: no passive", L.conjugateSet(audeo, "indicative", "present", "passive"), null);
  eq("audeō: imperative, infinitives, participles", [
    L.imperativeSet(audeo, "active").map((x) => x.form), L.infinitive(audeo, "present", "active").form, L.infinitive(audeo, "perfect", "active").form,
    L.infinitive(audeo, "future", "active").form, L.participle(audeo, "present", "active").form, L.participle(audeo, "perfect", "active").form, L.participle(audeo, "future", "active").form],
    [["audē", "audēte"], "audēre", "ausus esse", "ausūrus esse", "audēns", "ausus", "ausūrus"]);
  const confido = { pos: "verb", lemma: "cōnfīdō", parts: ["cōnfīdō", "cōnfīdere", "cōnfīsus sum"], conjugation: "3", flags: ["semi-deponent"] };
  eq("cōnfīdō: cōnfīdet, cōnfīsus erat", [forms(L.conjugateSet(confido, "indicative", "future", "active"))[2], forms(L.conjugateSet(confido, "indicative", "pluperfect", "active"))[2]], ["cōnfīdet", "cōnfīsus erat"]);
  const affero = { pos: "verb", lemma: "afferō", parts: ["afferō", "afferre", "attulī", "allātus"], conjugation: "irregular" };
  const offero = { pos: "verb", lemma: "offerō", parts: ["offerō", "offerre", "obtulī", "oblātus"], conjugation: "irregular" };
  eq("afferō, offerō have ferō's table", [L.hasIrregularTable(affero), L.hasIrregularTable(offero)], [true, true]);
  eq("afferō: affers, attulit, allātus est; offerō: offertur, obtulisse", [
    forms(L.conjugateSet(affero, "indicative", "present", "active"))[1], forms(L.conjugateSet(affero, "indicative", "perfect", "active"))[2],
    forms(L.conjugateSet(affero, "indicative", "perfect", "passive"))[2], forms(L.conjugateSet(offero, "indicative", "present", "passive"))[2],
    L.infinitive(offero, "perfect", "active").form], ["affers", "attulit", "allātus est", "offertur", "obtulisse"]);
  const patefacio = { pos: "verb", lemma: "patefaciō", parts: ["patefaciō", "patefacere", "patefēcī", "patefactus"], conjugation: "3io" };
  const interficio = { pos: "verb", lemma: "interficiō", parts: ["interficiō", "interficere", "interfēcī", "interfectus"], conjugation: "3io" };
  eq("patefac, but interfice", [L.imperativeSet(patefacio, "active")[0].form, L.imperativeSet(interficio, "active")[0].form], ["patefac", "interfice"]);
}

if (failures) { console.error("\n" + failures + " of " + checks + " checks failed."); process.exit(1); }
console.log("OK: " + checks + " checks passed.");
