// Latin inflection engine shared by the typed practice games (browser) and
// the tools in /tools (Node). Generates noun paradigms and verb synopses
// from dictionary entries in a curriculum's vocab.json, and normalizes
// typed answers for grading.
//
// Entry format (vocab.json):
//   noun: { lemma, gen, gender: m|f|n, declension: "1".."5", flags?: ["i-stem","plural-only"], forms?: {...} }
//   verb: { lemma, parts: [..], conjugation: "1"|"2"|"3"|"3io"|"4"|"irregular", flags?: ["deponent","no-passive"] }
// Rules handle 3rd-declension i-stems and neuters, 4th/5th declensions,
// 2nd-declension -ius/-ium/-er nouns, deponents and 3rd -iō verbs. The verbs
// sum, possum, eō, ferō, volō, nōlō, mālō and fīō come from hand-entered tables.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.LatinForms = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var CASES = ["nom", "gen", "dat", "acc", "abl", "voc"];
  var NUMBERS = ["sg", "pl"];
  var PERSONS = ["1", "2", "3"];
  var IND_TENSES = ["present", "imperfect", "future", "perfect", "pluperfect", "future perfect"];
  var SUBJ_TENSES = ["present", "imperfect", "perfect", "pluperfect"];
  var DECLENSIONS = ["1", "2", "3", "4", "5"];
  var CONJUGATIONS = ["1", "2", "3", "3io", "4", "irregular"];
  var NOUN_FLAGS = ["i-stem", "plural-only", "singular-only", "no-vocative"];
  var VERB_FLAGS = ["deponent", "no-passive"];

  var CASE_NAMES = { nom: "nominative", gen: "genitive", dat: "dative", acc: "accusative", abl: "ablative", voc: "vocative" };
  var NUMBER_NAMES = { sg: "singular", pl: "plural" };
  var PERSON_NAMES = { "1": "1st", "2": "2nd", "3": "3rd" };

  // ---------- text helpers ----------
  function stripMacrons(s) {
    return s.normalize("NFD").replace(/̄/g, "").normalize("NFC");
  }
  function hasFlag(entry, flag) { return !!(entry.flags && entry.flags.indexOf(flag) >= 0); }
  function endsWith(s, suf) { return s.length >= suf.length && s.slice(-suf.length) === suf; }
  function cut(s, suf) {
    if (!endsWith(s, suf)) throw new Error('"' + s + '" does not end in -' + suf);
    return s.slice(0, s.length - suf.length);
  }
  // Grading key: lower case, macrons optional, i/j and u/v interchangeable.
  function normalize(s, strict) {
    s = String(s || "").trim().toLowerCase().replace(/\s+/g, " ").normalize("NFC");
    if (!strict) s = stripMacrons(s);
    return s.replace(/j/g, "i").replace(/v/g, "u");
  }
  function sameForm(typed, expected, strict) {
    var t = normalize(typed, strict);
    var list = Array.isArray(expected) ? expected : [expected];
    return list.some(function (e) { return normalize(e, strict) === t; });
  }
  // Display convention: Henle writes consonantal i as j; classical uses i.
  function spell(s, convention) {
    if (convention === "classical") return s.replace(/j/g, "i").replace(/J/g, "I");
    return s;
  }

  // ---------- nouns ----------
  var GEN_ENDINGS = { "1": "ae", "2": "ī", "3": "is", "4": "ūs", "5": "ī" };

  function nounStem(entry) {
    if (entry.stem) return entry.stem;
    var d = String(entry.declension), g = entry.gen;
    if (d === "5") {
      // diēs, diēī → di-; rēs, reī → r-
      if (endsWith(g, "ēī")) return cut(g, "ēī");
      if (endsWith(g, "eī")) return cut(g, "eī");
      throw new Error("5th-declension genitive should end in -ēī or -eī: " + g);
    }
    if (hasFlag(entry, "plural-only")) {
      // castra, castrōrum; dīvitiae, dīvitiārum; moenia, moenium
      var plEnd = { "1": "ārum", "2": "ōrum", "3": hasFlag(entry, "i-stem") ? "ium" : "um", "4": "uum", "5": "ērum" }[d];
      if (endsWith(g, plEnd)) return cut(g, plEnd);
    }
    return cut(g, GEN_ENDINGS[d]);
  }

  // Returns { sg: {nom,gen,dat,acc,abl,voc}, pl: {...} }. Missing cells are null.
  function declineNoun(entry) {
    var d = String(entry.declension);
    if (DECLENSIONS.indexOf(d) < 0) throw new Error("unknown declension code " + JSON.stringify(entry.declension));
    var n = entry.gender === "n";
    var st = nounStem(entry);
    var lemma = entry.lemma;
    var istem = hasFlag(entry, "i-stem");
    var sg = {}, pl = {};

    if (d === "1") {
      sg = { nom: lemma, gen: st + "ae", dat: st + "ae", acc: st + "am", abl: st + "ā", voc: lemma };
      pl = { nom: st + "ae", gen: st + "ārum", dat: st + "īs", acc: st + "ās", abl: st + "īs", voc: st + "ae" };
    } else if (d === "2") {
      if (n) {
        sg = { nom: lemma, gen: st + "ī", dat: st + "ō", acc: lemma, abl: st + "ō", voc: lemma };
        pl = { nom: st + "a", gen: st + "ōrum", dat: st + "īs", acc: st + "a", abl: st + "īs", voc: st + "a" };
      } else {
        var voc;
        if (endsWith(lemma, "ius")) voc = cut(lemma, "ius") + "ī";       // fīlius → fīlī
        else if (endsWith(lemma, "us")) voc = cut(lemma, "us") + "e";    // servus → serve
        else voc = lemma;                                                // puer, ager, vir
        sg = { nom: lemma, gen: st + "ī", dat: st + "ō", acc: st + "um", abl: st + "ō", voc: voc };
        pl = { nom: st + "ī", gen: st + "ōrum", dat: st + "īs", acc: st + "ōs", abl: st + "īs", voc: st + "ī" };
      }
    } else if (d === "3") {
      var genPl = st + (istem ? "ium" : "um");
      if (n) {
        var nomPl = st + (istem ? "ia" : "a");
        sg = { nom: lemma, gen: st + "is", dat: st + "ī", acc: lemma, abl: st + (istem ? "ī" : "e"), voc: lemma };
        pl = { nom: nomPl, gen: genPl, dat: st + "ibus", acc: nomPl, abl: st + "ibus", voc: nomPl };
      } else {
        sg = { nom: lemma, gen: st + "is", dat: st + "ī", acc: st + "em", abl: st + "e", voc: lemma };
        pl = { nom: st + "ēs", gen: genPl, dat: st + "ibus", acc: st + "ēs", abl: st + "ibus", voc: st + "ēs" };
      }
    } else if (d === "4") {
      if (n) {
        sg = { nom: lemma, gen: st + "ūs", dat: st + "ū", acc: lemma, abl: st + "ū", voc: lemma };
        pl = { nom: st + "ua", gen: st + "uum", dat: st + "ibus", acc: st + "ua", abl: st + "ibus", voc: st + "ua" };
      } else {
        sg = { nom: lemma, gen: st + "ūs", dat: st + "uī", acc: st + "um", abl: st + "ū", voc: lemma };
        pl = { nom: st + "ūs", gen: st + "uum", dat: st + "ibus", acc: st + "ūs", abl: st + "ibus", voc: st + "ūs" };
      }
    } else if (d === "5") {
      sg = { nom: lemma, gen: entry.gen, dat: entry.gen, acc: st + "em", abl: st + "ē", voc: lemma };
      pl = { nom: st + "ēs", gen: st + "ērum", dat: st + "ēbus", acc: st + "ēs", abl: st + "ēbus", voc: st + "ēs" };
    }

    // Hand overrides for odd words (deus, vīs, Iuppiter...): forms: {"sg.voc":"deus","pl.nom":["dī","deī"]}
    if (entry.forms) {
      Object.keys(entry.forms).forEach(function (k) {
        var parts = k.split(".");
        var tbl = parts[0] === "pl" ? pl : sg;
        tbl[parts[1]] = entry.forms[k];
      });
    }
    if (hasFlag(entry, "plural-only")) CASES.forEach(function (c) { sg[c] = null; });
    if (hasFlag(entry, "singular-only")) CASES.forEach(function (c) { pl[c] = null; });
    if (hasFlag(entry, "no-vocative")) { sg.voc = null; pl.voc = null; }
    return { sg: sg, pl: pl };
  }

  function nounEntryText(entry) {
    var g = entry.gender;
    if (hasFlag(entry, "plural-only")) return entry.lemma + ", " + entry.gen + ", " + g + ". (pl.)";
    return entry.lemma + ", " + entry.gen + ", " + g + ".";
  }

  // ---------- verbs: regular ----------
  // Suffix tables, appended to the short present stem S (laud-, mon-, dūc-, cap-, aud-).
  var A = {
    pres: { "1": ["ō", "ās", "at", "āmus", "ātis", "ant"], "2": ["eō", "ēs", "et", "ēmus", "ētis", "ent"],
            "3": ["ō", "is", "it", "imus", "itis", "unt"], "3io": ["iō", "is", "it", "imus", "itis", "iunt"],
            "4": ["iō", "īs", "it", "īmus", "ītis", "iunt"] },
    impf: ["bam", "bās", "bat", "bāmus", "bātis", "bant"],
    futB: ["bō", "bis", "bit", "bimus", "bitis", "bunt"],
    futE: ["am", "ēs", "et", "ēmus", "ētis", "ent"],
    subjE: ["em", "ēs", "et", "ēmus", "ētis", "ent"],
    subjA: ["am", "ās", "at", "āmus", "ātis", "ant"],
    perf: ["ī", "istī", "it", "imus", "istis", "ērunt"],
    plup: ["eram", "erās", "erat", "erāmus", "erātis", "erant"],
    futp: ["erō", "eris", "erit", "erimus", "eritis", "erint"],
    perfS: ["erim", "erīs", "erit", "erīmus", "erītis", "erint"],
    plupS: ["issem", "issēs", "isset", "issēmus", "issētis", "issent"]
  };
  var P = {
    pres: { "1": ["or", "āris", "ātur", "āmur", "āminī", "antur"], "2": ["eor", "ēris", "ētur", "ēmur", "ēminī", "entur"],
            "3": ["or", "eris", "itur", "imur", "iminī", "untur"], "3io": ["ior", "eris", "itur", "imur", "iminī", "iuntur"],
            "4": ["ior", "īris", "ītur", "īmur", "īminī", "iuntur"] },
    impf: ["bar", "bāris", "bātur", "bāmur", "bāminī", "bantur"],
    futB: ["bor", "beris", "bitur", "bimur", "biminī", "buntur"],
    futE: ["ar", "ēris", "ētur", "ēmur", "ēminī", "entur"],
    subjE: ["er", "ēris", "ētur", "ēmur", "ēminī", "entur"],
    subjA: ["ar", "āris", "ātur", "āmur", "āminī", "antur"]
  };
  var SUM = {
    present: ["sum", "es", "est", "sumus", "estis", "sunt"],
    imperfect: ["eram", "erās", "erat", "erāmus", "erātis", "erant"],
    future: ["erō", "eris", "erit", "erimus", "eritis", "erunt"],
    subjPresent: ["sim", "sīs", "sit", "sīmus", "sītis", "sint"],
    subjImperfect: ["essem", "essēs", "esset", "essēmus", "essētis", "essent"]
  };
  // Thematic vowel before -ba-/-bō for the imperfect and the 1st/2nd future.
  var IMPF_VOWEL = { "1": "ā", "2": "ē", "3": "ē", "3io": "iē", "4": "iē" };
  var INF_ENDING = { "1": "āre", "2": "ēre", "3": "ere", "3io": "ere", "4": "īre" };
  var DEP_INF_ENDING = { "1": "ārī", "2": "ērī", "3": "ī", "3io": "ī", "4": "īrī" };

  function add(stem, list) { return list.map(function (e) { return stem + e; }); }

  function verbStems(entry) {
    var c = String(entry.conjugation), parts = entry.parts || [];
    var dep = hasFlag(entry, "deponent");
    if (CONJUGATIONS.indexOf(c) < 0) throw new Error("unknown conjugation code " + JSON.stringify(entry.conjugation));
    if (parts.length < 2) throw new Error("a verb needs at least two principal parts");
    var inf = parts[1];
    var infEnding = dep ? DEP_INF_ENDING[c] : INF_ENDING[c];
    var pres = cut(inf, infEnding);            // laud, mon, dūc, cap, aud
    var perf = null, ppl = null;
    if (dep) {
      // sequor, sequī, secūtus sum
      var p3 = (parts[2] || "").replace(/\s+sum$/, "");
      if (p3) ppl = cut(p3, "us");
    } else {
      if (parts[2]) perf = cut(parts[2], "ī");
      if (parts[3]) {
        var p4 = parts[3];
        if (endsWith(p4, "us")) ppl = cut(p4, "us");
        else if (endsWith(p4, "um")) ppl = cut(p4, "um");       // supine given instead
        else if (endsWith(p4, "ūrus")) ppl = null;              // future participle only (e.g. futūrus): no perfect passive
        else throw new Error("4th principal part should end in -us or -um: " + p4);
      }
    }
    return { conj: c, pres: pres, perf: perf, ppl: ppl, impfSubj: pres + INF_ENDING[c].slice(0, -1) /* laudār, dūcer */ };
  }

  // Participle agreeing with the subject: masculine by default; the
  // accepted-answers list adds feminine and neuter.
  function periphrastic(ppl, auxList, number) {
    return auxList.map(function (aux, i) {
      var plural = i >= 3;
      var m = ppl + (plural ? "ī" : "us");
      var alts = [ppl + (plural ? "ae" : "a"), ppl + (plural ? "a" : "um")];
      return { form: m + " " + aux, accept: alts.map(function (a) { return a + " " + aux; }) };
    });
  }
  function plain(list) { return list.map(function (f) { return { form: f, accept: [] }; }); }

  // Six forms for one (mood, tense, voice). Returns an array of
  // {form, accept} or null if the verb lacks that set (e.g. no passive).
  function regularSet(entry, stems, mood, tense, voice) {
    var c = stems.conj, S = stems.pres;
    var table = voice === "active" ? A : P;
    if (mood === "indicative") {
      if (tense === "present") return plain(add(S, table.pres[c]));
      if (tense === "imperfect") return plain(add(S + IMPF_VOWEL[c], table.impf));
      if (tense === "future") {
        if (c === "1" || c === "2") return plain(add(S + IMPF_VOWEL[c], table.futB));
        return plain(add(S + (c === "3" ? "" : "i"), table.futE));
      }
      if (voice === "active") {
        if (!stems.perf) return null;
        if (tense === "perfect") return plain(add(stems.perf, A.perf));
        if (tense === "pluperfect") return plain(add(stems.perf, A.plup));
        if (tense === "future perfect") return plain(add(stems.perf, A.futp));
      } else {
        if (!stems.ppl) return null;
        if (tense === "perfect") return periphrastic(stems.ppl, SUM.present);
        if (tense === "pluperfect") return periphrastic(stems.ppl, SUM.imperfect);
        if (tense === "future perfect") return periphrastic(stems.ppl, SUM.future);
      }
    }
    if (mood === "subjunctive") {
      if (tense === "present") {
        if (c === "1") return plain(add(S, table.subjE));
        if (c === "2") return plain(add(S + "e", table.subjA));
        return plain(add(S + (c === "3" ? "" : "i"), table.subjA));
      }
      if (tense === "imperfect") return plain(add(stems.impfSubj, voice === "active" ? A.subjE : P.subjE));
      if (voice === "active") {
        if (!stems.perf) return null;
        if (tense === "perfect") return plain(add(stems.perf, A.perfS));
        if (tense === "pluperfect") return plain(add(stems.perf, A.plupS));
      } else {
        if (!stems.ppl) return null;
        if (tense === "perfect") return periphrastic(stems.ppl, SUM.subjPresent);
        if (tense === "pluperfect") return periphrastic(stems.ppl, SUM.subjImperfect);
      }
    }
    return null;
  }

  // ---------- verbs: hand-entered irregulars ----------
  // Present-system forms are written out in full. The perfect system uses
  // the standard personal endings on the hand-entered perfect stem (and the
  // participle for the passive), except where a full table is given.
  var IRREGULAR = {
    "sum": {
      perf: "fu", passive: false,
      active: {
        indicative: { present: SUM.present, imperfect: SUM.imperfect, future: SUM.future },
        subjunctive: { present: SUM.subjPresent, imperfect: SUM.subjImperfect }
      }
    },
    "possum": {
      perf: "potu", passive: false,
      active: {
        indicative: {
          present: ["possum", "potes", "potest", "possumus", "potestis", "possunt"],
          imperfect: ["poteram", "poterās", "poterat", "poterāmus", "poterātis", "poterant"],
          future: ["poterō", "poteris", "poterit", "poterimus", "poteritis", "poterunt"]
        },
        subjunctive: {
          present: ["possim", "possīs", "possit", "possīmus", "possītis", "possint"],
          imperfect: ["possem", "possēs", "posset", "possēmus", "possētis", "possent"]
        }
      }
    },
    "eō": {
      perf: "i", passive: false,
      active: {
        indicative: {
          present: ["eō", "īs", "it", "īmus", "ītis", "eunt"],
          imperfect: ["ībam", "ībās", "ībat", "ībāmus", "ībātis", "ībant"],
          future: ["ībō", "ībis", "ībit", "ībimus", "ībitis", "ībunt"],
          perfect: ["iī", "īstī", "iit", "iimus", "īstis", "iērunt"],
          pluperfect: ["ieram", "ierās", "ierat", "ierāmus", "ierātis", "ierant"],
          "future perfect": ["ierō", "ieris", "ierit", "ierimus", "ieritis", "ierint"]
        },
        subjunctive: {
          present: ["eam", "eās", "eat", "eāmus", "eātis", "eant"],
          imperfect: ["īrem", "īrēs", "īret", "īrēmus", "īrētis", "īrent"],
          perfect: ["ierim", "ierīs", "ierit", "ierīmus", "ierītis", "ierint"],
          pluperfect: ["īssem", "īssēs", "īsset", "īssēmus", "īssētis", "īssent"]
        }
      }
    },
    "ferō": {
      perf: "tul", ppl: "lāt", passive: true,
      active: {
        indicative: {
          present: ["ferō", "fers", "fert", "ferimus", "fertis", "ferunt"],
          imperfect: ["ferēbam", "ferēbās", "ferēbat", "ferēbāmus", "ferēbātis", "ferēbant"],
          future: ["feram", "ferēs", "feret", "ferēmus", "ferētis", "ferent"]
        },
        subjunctive: {
          present: ["feram", "ferās", "ferat", "ferāmus", "ferātis", "ferant"],
          imperfect: ["ferrem", "ferrēs", "ferret", "ferrēmus", "ferrētis", "ferrent"]
        }
      },
      passiveForms: {
        indicative: {
          present: ["feror", "ferris", "fertur", "ferimur", "feriminī", "feruntur"],
          imperfect: ["ferēbar", "ferēbāris", "ferēbātur", "ferēbāmur", "ferēbāminī", "ferēbantur"],
          future: ["ferar", "ferēris", "ferētur", "ferēmur", "ferēminī", "ferentur"]
        },
        subjunctive: {
          present: ["ferar", "ferāris", "ferātur", "ferāmur", "ferāminī", "ferantur"],
          imperfect: ["ferrer", "ferrēris", "ferrētur", "ferrēmur", "ferrēminī", "ferrentur"]
        }
      }
    },
    "volō": {
      perf: "volu", passive: false,
      active: {
        indicative: {
          present: ["volō", "vīs", "vult", "volumus", "vultis", "volunt"],
          imperfect: ["volēbam", "volēbās", "volēbat", "volēbāmus", "volēbātis", "volēbant"],
          future: ["volam", "volēs", "volet", "volēmus", "volētis", "volent"]
        },
        subjunctive: {
          present: ["velim", "velīs", "velit", "velīmus", "velītis", "velint"],
          imperfect: ["vellem", "vellēs", "vellet", "vellēmus", "vellētis", "vellent"]
        }
      }
    },
    "nōlō": {
      perf: "nōlu", passive: false,
      active: {
        indicative: {
          present: ["nōlō", "nōn vīs", "nōn vult", "nōlumus", "nōn vultis", "nōlunt"],
          imperfect: ["nōlēbam", "nōlēbās", "nōlēbat", "nōlēbāmus", "nōlēbātis", "nōlēbant"],
          future: ["nōlam", "nōlēs", "nōlet", "nōlēmus", "nōlētis", "nōlent"]
        },
        subjunctive: {
          present: ["nōlim", "nōlīs", "nōlit", "nōlīmus", "nōlītis", "nōlint"],
          imperfect: ["nōllem", "nōllēs", "nōllet", "nōllēmus", "nōllētis", "nōllent"]
        }
      }
    },
    "mālō": {
      perf: "mālu", passive: false,
      active: {
        indicative: {
          present: ["mālō", "māvīs", "māvult", "mālumus", "māvultis", "mālunt"],
          imperfect: ["mālēbam", "mālēbās", "mālēbat", "mālēbāmus", "mālēbātis", "mālēbant"],
          future: ["mālam", "mālēs", "mālet", "mālēmus", "mālētis", "mālent"]
        },
        subjunctive: {
          present: ["mālim", "mālīs", "mālit", "mālīmus", "mālītis", "mālint"],
          imperfect: ["māllem", "māllēs", "māllet", "māllēmus", "māllētis", "māllent"]
        }
      }
    },
    // fīō serves as the passive of faciō: active-looking present system,
    // perfect system from the participle factus.
    "fīō": {
      perf: null, ppl: "fact", passive: false, perfectFromParticiple: true,
      active: {
        indicative: {
          present: ["fīō", "fīs", "fit", "fīmus", "fītis", "fīunt"],
          imperfect: ["fīēbam", "fīēbās", "fīēbat", "fīēbāmus", "fīēbātis", "fīēbant"],
          future: ["fīam", "fīēs", "fīet", "fīēmus", "fīētis", "fīent"]
        },
        subjunctive: {
          present: ["fīam", "fīās", "fīat", "fīāmus", "fīātis", "fīant"],
          imperfect: ["fierem", "fierēs", "fieret", "fierēmus", "fierētis", "fierent"]
        }
      }
    }
  };
  // Lemmas may be given with or without macrons / j.
  function irregularFor(entry) {
    var key = normalize(entry.lemma);
    var found = null;
    Object.keys(IRREGULAR).forEach(function (k) { if (normalize(k) === key) found = IRREGULAR[k]; });
    return found;
  }

  function irregularSet(table, mood, tense, voice) {
    var perfTense = tense === "perfect" || tense === "pluperfect" || tense === "future perfect";
    if (voice === "passive") {
      if (!table.passive) return null;
      if (!perfTense) { var pf = table.passiveForms[mood] && table.passiveForms[mood][tense]; return pf ? plain(pf) : null; }
      return perfectPassive(table.ppl, mood, tense);
    }
    var given = table.active[mood] && table.active[mood][tense];
    if (given) return plain(given);
    if (!perfTense) return null;
    if (table.perfectFromParticiple) return perfectPassive(table.ppl, mood, tense);
    if (!table.perf) return null;
    if (mood === "indicative") {
      if (tense === "perfect") return plain(add(table.perf, A.perf));
      if (tense === "pluperfect") return plain(add(table.perf, A.plup));
      return plain(add(table.perf, A.futp));
    }
    if (tense === "perfect") return plain(add(table.perf, A.perfS));
    if (tense === "pluperfect") return plain(add(table.perf, A.plupS));
    return null;
  }
  function perfectPassive(ppl, mood, tense) {
    if (!ppl) return null;
    if (mood === "indicative") {
      if (tense === "perfect") return periphrastic(ppl, SUM.present);
      if (tense === "pluperfect") return periphrastic(ppl, SUM.imperfect);
      if (tense === "future perfect") return periphrastic(ppl, SUM.future);
    } else {
      if (tense === "perfect") return periphrastic(ppl, SUM.subjPresent);
      if (tense === "pluperfect") return periphrastic(ppl, SUM.subjImperfect);
    }
    return null;
  }

  // Which voice columns a verb has in a synopsis.
  //   regular transitive: ["active","passive"]; deponent: ["deponent"];
  //   no-passive / sum-type irregulars / fīō: ["active"]
  function verbVoices(entry) {
    if (hasFlag(entry, "deponent")) return ["deponent"];
    if (hasFlag(entry, "no-passive")) return ["active"];
    if (String(entry.conjugation) === "irregular") {
      var t = irregularFor(entry);
      if (!t) throw new Error("no hand-entered table for irregular verb " + entry.lemma);
      return t.passive ? ["active", "passive"] : ["active"];
    }
    return ["active", "passive"];
  }

  // Six forms (1sg..3pl) as [{form, accept}] for a verb in a given
  // mood/tense/voice, or null when the verb has no such forms.
  // voice: "active" | "passive" | "deponent" (deponent = passive forms).
  function conjugateSet(entry, mood, tense, voice) {
    if (String(entry.conjugation) === "irregular") {
      var t = irregularFor(entry);
      if (!t) throw new Error("no hand-entered table for irregular verb " + entry.lemma);
      if (voice === "deponent") return null;
      return irregularSet(t, mood, tense, voice);
    }
    var stems = verbStems(entry);
    var dep = hasFlag(entry, "deponent");
    if (dep) {
      if (voice !== "deponent") return null;
      var perfTense = tense === "perfect" || tense === "pluperfect" || tense === "future perfect";
      if (perfTense) return perfectPassive(stems.ppl, mood, tense);
      return regularSet(entry, stems, mood, tense, "passive");
    }
    if (voice === "deponent") return null;
    if (voice === "passive" && hasFlag(entry, "no-passive")) return null;
    return regularSet(entry, stems, mood, tense, voice);
  }

  // Full synopsis: { indicative: { active: { present: [...6], ... }, passive: {...} }, subjunctive: {...} }
  function synopsis(entry) {
    var out = { voices: verbVoices(entry), indicative: {}, subjunctive: {} };
    out.voices.forEach(function (v) {
      out.indicative[v] = {}; out.subjunctive[v] = {};
      IND_TENSES.forEach(function (t) { out.indicative[v][t] = conjugateSet(entry, "indicative", t, v); });
      SUBJ_TENSES.forEach(function (t) { out.subjunctive[v][t] = conjugateSet(entry, "subjunctive", t, v); });
    });
    return out;
  }

  function verbEntryText(entry) {
    return (entry.parts || [entry.lemma]).join(", ");
  }
  function personIndex(person, number) { return (number === "pl" ? 3 : 0) + (Number(person) - 1); }

  // ---------- dictionary-line parser (for the proofing tool) ----------
  // "mīles, mīlitis, m."  "mare, maris, n. i"  "laudō, laudāre, laudāvī, laudātus"
  // "sequor, sequī, secūtus sum"  "castra, castrōrum, n. pl"
  function parseEntry(line) {
    var raw = line.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    if (raw.length < 2) throw new Error("need at least two comma-separated parts: " + line);
    var last = raw[raw.length - 1];
    var m = /^([mfn])\.?(?:\s+(.*))?$/.exec(last);
    if (m && raw.length === 3) {
      var flags = (m[2] || "").split(/\s+/).filter(Boolean).map(function (f) {
        return { i: "i-stem", "i-stem": "i-stem", istem: "i-stem", pl: "plural-only", "pl.": "plural-only" }[f] || f;
      });
      var gen = raw[1], decl;
      if (endsWith(gen, "ae")) decl = "1";
      else if (endsWith(gen, "ūs")) decl = "4";
      else if (endsWith(gen, "ēī") || (endsWith(gen, "eī") && endsWith(raw[0], "ēs"))) decl = "5"; // rēs, reī; but deus, deī is 2nd
      else if (endsWith(gen, "is")) decl = "3";
      else if (endsWith(gen, "ōrum")) { decl = "2"; flags.push("plural-only"); }
      else if (endsWith(gen, "ārum")) { decl = "1"; flags.push("plural-only"); }
      else if (endsWith(gen, "ī")) decl = "2";
      else throw new Error("cannot tell the declension from the genitive " + gen);
      var e = { pos: "noun", lemma: raw[0], gen: gen, gender: m[1], declension: decl };
      if (decl === "2" && flags.indexOf("plural-only") >= 0) e.stem = cut(gen, "ōrum");
      if (decl === "1" && flags.indexOf("plural-only") >= 0) e.stem = cut(gen, "ārum");
      if (flags.length) e.flags = flags;
      return e;
    }
    // verb
    var parts = raw.slice(), vflags = [];
    var inf = parts[1], conj;
    var dep = /\ssum$/.test(parts[parts.length - 1]) || endsWith(parts[0], "or");
    if (dep) vflags.push("deponent");
    if (irregularFor({ lemma: parts[0] })) conj = "irregular";
    else if (endsWith(inf, "āre") || endsWith(inf, "ārī")) conj = "1";
    else if (endsWith(inf, "ēre") || endsWith(inf, "ērī")) conj = "2";
    else if (endsWith(inf, "īre") || endsWith(inf, "īrī")) conj = "4";
    else if (endsWith(inf, "ere") || endsWith(inf, "ī")) conj = (endsWith(parts[0], "iō") || endsWith(parts[0], "ior")) ? "3io" : "3";
    else throw new Error("cannot tell the conjugation from the infinitive " + inf);
    var v = { pos: "verb", lemma: parts[0], parts: parts, conjugation: conj };
    if (vflags.length) v.flags = vflags;
    return v;
  }

  // ---------- availability from vocab ----------
  // Every form an entry can take, macron-stripped and i/j, u/v folded.
  function formsOf(entry) {
    var forms = [];
    if (Array.isArray(entry.forms)) forms = entry.forms.slice();
    else if (entry.pos === "noun") {
      var d = declineNoun(entry);
      NUMBERS.forEach(function (n) { CASES.forEach(function (c) {
        var f = d[n][c]; if (f) forms = forms.concat(Array.isArray(f) ? f : [f]);
      }); });
    } else if (entry.pos === "verb") {
      var s = synopsis(entry);
      s.voices.forEach(function (v) {
        ["indicative", "subjunctive"].forEach(function (mood) {
          Object.keys(s[mood][v]).forEach(function (t) {
            (s[mood][v][t] || []).forEach(function (cell) {
              forms.push(cell.form); forms = forms.concat(cell.accept);
            });
          });
        });
      });
      forms = forms.concat(entry.parts || []);
    } else {
      forms = [entry.lemma];
    }
    var out = {};
    forms.forEach(function (f) {
      // periphrastic forms count word by word ("laudātus sum" → laudātus, sum)
      f.split(/\s+/).forEach(function (w) { out[normalize(w)] = true; });
    });
    return Object.keys(out);
  }
  // Lesson a sentence becomes available in a curriculum: the lesson that
  // introduces the last of its words. Words not in the vocab are listed
  // in `unknown` and ignored for the lesson.
  function availability(sentence, vocab, curriculum) {
    var index = buildFormIndex(vocab, curriculum);
    var lesson = null, unknown = [];
    sentence.trim().split(/\s+/).forEach(function (w) {
      var key = normalize(w.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, ""));
      if (!key) return;
      var l = index[key];
      if (l == null) unknown.push(w);
      else if (lesson == null || l > lesson) lesson = l;
    });
    return { lesson: lesson, unknown: unknown };
  }
  var indexCache = null;
  function buildFormIndex(vocab, curriculum) {
    if (indexCache && indexCache.vocab === vocab && indexCache.curriculum === curriculum) return indexCache.index;
    var index = {};
    vocab.forEach(function (e) {
      if (e.curriculum && curriculum && e.curriculum !== curriculum) return;
      var lesson = e.available && e.available[curriculum] != null ? e.available[curriculum] : e.lesson;
      formsOf(e).forEach(function (f) { if (index[f] == null || lesson < index[f]) index[f] = lesson; });
    });
    indexCache = { vocab: vocab, curriculum: curriculum, index: index };
    return index;
  }
  // Lesson an item or vocab entry counts as, for a curriculum.
  function lessonOf(thing, curriculum) {
    if (thing.available && thing.available[curriculum] != null) return thing.available[curriculum];
    return thing.lesson;
  }

  return {
    CASES: CASES, NUMBERS: NUMBERS, PERSONS: PERSONS, IND_TENSES: IND_TENSES, SUBJ_TENSES: SUBJ_TENSES,
    DECLENSIONS: DECLENSIONS, CONJUGATIONS: CONJUGATIONS, NOUN_FLAGS: NOUN_FLAGS, VERB_FLAGS: VERB_FLAGS,
    CASE_NAMES: CASE_NAMES, NUMBER_NAMES: NUMBER_NAMES, PERSON_NAMES: PERSON_NAMES,
    IRREGULAR_LEMMAS: Object.keys(IRREGULAR),
    stripMacrons: stripMacrons, normalize: normalize, sameForm: sameForm, spell: spell, hasFlag: hasFlag,
    declineNoun: declineNoun, nounEntryText: nounEntryText,
    conjugateSet: conjugateSet, synopsis: synopsis, verbVoices: verbVoices, verbEntryText: verbEntryText, personIndex: personIndex,
    parseEntry: parseEntry, formsOf: formsOf, availability: availability, lessonOf: lessonOf
  };
});
