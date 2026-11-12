// Game 4: vocabulary meanings. Reads vocab.json and asks each word's
// "english" gloss in one of two directions:
//   Latin → English  multiple choice: the dictionary entry and four glosses.
//   English → Latin  typed: the gloss and the part of speech; the student
//                    types the first dictionary form (the lemma).
// Entries without a usable "english" are left out.
//
// How glosses are written in vocab.json, and what the game does with them:
//   "manage, attend to"            meanings separated by commas
//   "carry, carry on; wage (war)"  or by semicolons
//   "with (with the ablative)"     notes in parentheses: shown, but not meanings
//   "who? what?"   "hail!"         ? and ! are dropped when meanings are compared
//   "or; aut … aut, either … or"   a later part that starts with the word itself
//   "to inform (certiōrem facere)" or a note that is the word itself would give
//                                  the answer away, so it is left out of the
//                                  question and shown only in the feedback
// Verbs are written without "to" ("praise"); a leading "to " is ignored when
// meanings are compared.
(function () {
  "use strict";

  var L = window.LatinForms;
  var ROUND_SIZE = 10;
  var OPTIONS = 4;
  var DIRECTIONS = ["la-en", "en-la"];
  var GROUPS = [["noun", "Nouns"], ["verb", "Verbs"], ["adjective", "Adjectives"], ["other", "Other"]];
  var GROUP_IDS = GROUPS.map(function (g) { return g[0]; });

  var ctx, S, T, words = [];
  var eligibleCache = {};   // lesson → the words that can be asked as multiple choice
  var cur = null;           // the item on screen: { item, input?, answers?, shared?, buttons?, done }

  function lesson() { return ctx.settings.lesson; }
  function isChoice() { return ctx.settings.dir === "la-en"; }
  function group(e) { return e.pos === "noun" || e.pos === "verb" || e.pos === "adjective" ? e.pos : "other"; }
  function posLabel(e) {
    if (e.pos === "other") return e.lemma.indexOf(" ") >= 0 ? "phrase" : "word";
    return e.pos;
  }

  // ---------- glosses ----------
  function tokens(s) { return L.normalize(s).split(/[^a-z]+/).filter(Boolean); }
  function startsWith(list, head) {
    return head.length > 0 && head.every(function (t, i) { return list[i] === t; });
  }
  // The gloss as asked: without the parts that contain the Latin word.
  function questionGloss(e) {
    var lemma = tokens(e.lemma);
    var parts = e.english.split(";").map(function (p) {
      return p.replace(/\(([^)]*)\)/g, function (all, inner) {
        return tokens(inner).join(" ") === lemma.join(" ") ? "" : all;
      }).replace(/\s+/g, " ").trim();
    }).filter(function (p, i) { return p && !(i > 0 && startsWith(tokens(p), lemma)); });
    return parts.join("; ") || e.english.trim();
  }
  // The separate meanings of a gloss, for comparing two words.
  function meaningsOf(gloss) {
    var out = [];
    gloss.replace(/\([^)]*\)/g, " ").split(/[,;]/).forEach(function (m) {
      m = m.toLowerCase().replace(/[?!]/g, " ").replace(/\s+/g, " ").trim().replace(/^to /, "");
      if (m && out.indexOf(m) < 0) out.push(m);
    });
    return out.length ? out : [gloss.toLowerCase().trim()];   // "(asks a question)"
  }
  function sharesMeaning(a, b) {
    return a.v.meanings.some(function (m) { return b.v.meanings.indexOf(m) >= 0; });
  }

  // ---------- words ----------
  function entryText(e) {
    var text = e.lemma;
    try {
      if (e.pos === "noun" && e.gen && e.gender) text = L.nounEntryText(e);
      else if (e.pos === "verb") text = L.verbEntryText(e);
      else if (e.pos === "adjective") text = L.adjectiveEntryText(e);
    } catch (err) { text = e.lemma; }
    return T.spell(text);
  }
  // Every word met by the chosen lesson: the wrong options and the "either
  // word" answers come from these, whichever way the lesson filter is set.
  function openWords() { return words.filter(function (w) { return S.lessonOf(w) <= lesson(); }); }
  // Is the word one the lesson filter asks? Through Lesson N: all of the
  // above. Lesson N only: the words whose own lesson is N.
  function asked(w) { return S.inLesson(S.lessonOf(w)); }
  function filtered(list) {
    return list.filter(function (w) { return ctx.settings.pos.indexOf(group(w)) >= 0; });
  }

  // ---------- Latin → English: the wrong options ----------
  // Glosses of other words, never one that is the same as the right gloss or
  // shares a meaning with it, and no two alike. Same part of speech first,
  // then the same row of the filter (so a preposition can stand beside a
  // conjunction), then anything.
  function candidates(e, from) {
    var seen = {}, out = [];
    seen[e.v.option.toLowerCase()] = true;
    from.forEach(function (w) {
      var text = w.v.option.toLowerCase();
      if (w === e || seen[text] || sharesMeaning(w, e)) return;
      seen[text] = true;
      out.push(w);
    });
    return out;
  }
  function distractors(e) {
    var list = candidates(e, openWords());
    if (list.length < OPTIONS - 1) list = candidates(e, words);   // a missed word asked at a low lesson
    var tiers = [[], [], []];
    S.shuffle(list).forEach(function (w) {
      tiers[w.pos === e.pos ? 0 : group(w) === group(e) ? 1 : 2].push(w);
    });
    return tiers[0].concat(tiers[1], tiers[2]).slice(0, OPTIONS - 1);
  }
  // Words through the chosen lesson that have three wrong options to go with.
  function eligible() {
    var key = lesson();
    if (!eligibleCache[key]) {
      var open = openWords();
      eligibleCache[key] = open.filter(function (e) { return candidates(e, open).length >= OPTIONS - 1; });
    }
    return eligibleCache[key];
  }

  // ---------- English → Latin: the accepted answers ----------
  // Open words asked with the same gloss and part of speech (exīstimō and
  // putō, "think"): either is right. The word itself comes first.
  function sharing(e) {
    var q = e.v.option.toLowerCase(), label = posLabel(e);
    return [e].concat(openWords().filter(function (w) {
      return w !== e && posLabel(w) === label && w.v.option.toLowerCase() === q;
    }));
  }
  function answersFor(list) {
    var out = [];
    list.forEach(function (w) {
      out.push(w.lemma);
      if (/^-/.test(w.lemma)) out.push(w.lemma.slice(1));   // -ne, -que
    });
    return out;
  }
  // The whole answer, or its first word when a full dictionary entry was typed.
  function typedRight(value, answers) {
    var first = value.split(/[,;]/)[0].trim();
    return T.same(first, answers) || T.same(first.split(/\s+/)[0], answers);
  }

  // ---------- feedback and review ----------
  function entryLine(e, cls) {
    var p = S.make("p", cls);
    var b = S.make("b", null, entryText(e)); b.setAttribute("lang", "la");
    p.appendChild(b);
    p.appendChild(document.createTextNode(" — " + e.english));
    return p;
  }
  function feedbackNodes(shared) {
    var nodes = shared.map(function (e) { return entryLine(e, null); });
    if (shared.length > 1) nodes.push(S.make("p", "fine", "Either word is accepted for this meaning."));
    return nodes;
  }

  var game = {
    id: "vocab",
    data: ["vocab"],
    typed: true,
    storageKey: "lubertlatin.practice.vocab",
    defaults: { dir: "la-en", pos: GROUP_IDS.slice() },
    lessonOnlyChoice: true,      // "Through Lesson N" / "Lesson N only" under the slider
    hideCheckUntilReady: true,   // multiple choice has no Check button; the typed direction shows it in begin()

    setup: function (c) {
      ctx = c; S = c.shell; T = S.typed;
      words = (Array.isArray(c.data.vocab) ? c.data.vocab : []).filter(function (e) {
        return e && (!e.curriculum || e.curriculum === c.curriculum) &&
          typeof e.lemma === "string" && e.lemma && typeof e.english === "string" && e.english.trim() !== "";
      });
      words.forEach(function (e) {
        var option = questionGloss(e);
        // (kept on the entry, out of the way of JSON and for…in)
        Object.defineProperty(e, "v", { value: { option: option, meanings: meaningsOf(option) } });
      });
      T.enterToAdvance(c.area, S.check);
      c.area.addEventListener("input", function () { if (cur && cur.input) S.setCheckEnabled(game.canCheck()); });
      c.area.addEventListener("click", function (e) {
        var b = e.target.closest(".chip[data-option]");
        if (b && cur && cur.buttons && !cur.done) choose(b);
      });
    },
    lessonBounds: function () {
      var min = Infinity;
      words.forEach(function (w) { if (S.lessonOf(w) < min) min = S.lessonOf(w); });
      return { min: min, max: ctx.curriculumInfo.lessons };
    },
    restore: function (saved) {
      if (DIRECTIONS.indexOf(saved.dir) >= 0) ctx.settings.dir = saved.dir;
      if (Array.isArray(saved.pos)) ctx.settings.pos = GROUP_IDS.filter(function (g) { return saved.pos.indexOf(g) >= 0; });
    },

    renderStart: function (options) {
      var fs = S.make("fieldset", "drill-fieldset");
      fs.appendChild(S.make("legend", null, "Mode"));
      var row = S.make("div", "choice-row");
      row.appendChild(choice("radio", "dir", "la-en", "Latin → English", ctx.settings.dir === "la-en"));
      row.appendChild(choice("radio", "dir", "en-la", "English → Latin", ctx.settings.dir === "en-la"));
      fs.appendChild(row);
      var note = S.make("p", "fine"); note.id = "dir-note";
      fs.appendChild(note);
      options.appendChild(fs);

      var fs2 = S.make("fieldset", "drill-fieldset");
      fs2.appendChild(S.make("legend", null, "Parts of speech"));
      var row2 = S.make("div", "choice-row");
      GROUPS.forEach(function (g) {
        row2.appendChild(choice("checkbox", "pos", g[0], g[1], ctx.settings.pos.indexOf(g[0]) >= 0));
      });
      fs2.appendChild(row2);
      options.appendChild(fs2);
    },
    updateStart: function (form) {
      var have = {};
      openWords().filter(asked).forEach(function (w) { have[group(w)] = true; });
      form.querySelectorAll("input[name=pos]").forEach(function (b) {
        b.disabled = !have[b.value];
        b.parentNode.classList.toggle("is-unavailable", b.disabled);
      });
      var note = form.querySelector("#dir-note");
      if (note) {
        note.textContent = isChoice()
          ? "Pick the meaning of the Latin word from four."
          : "Type the first dictionary form: mīles for “soldier”, laudō for “praise”.";
      }
    },
    readStart: function (form) {
      var d = form.querySelector("input[name=dir]:checked");
      ctx.settings.dir = d ? d.value : "la-en";
      // A struck-through box keeps its setting for when the lesson reaches it.
      var boxes = form.querySelectorAll("input[name=pos]");
      if (boxes.length) {
        ctx.settings.pos = GROUP_IDS.filter(function (g) {
          var b = form.querySelector('input[name=pos][value="' + g + '"]');
          return b && b.checked;
        });
      }
    },
    // Links for assignments (js/practice-link.js):
    //   dir=la-en | en-la   pos=noun,verb,adjective,other (the parts of speech ticked)
    fromLink: function (p, K) { return { dir: K.oneOf(p.dir, DIRECTIONS), pos: K.list(p.pos, GROUP_IDS) }; },
    toLink: function (s) {
      return [["dir", s.dir], ["pos", GROUP_IDS.filter(function (g) { return (s.pos || []).indexOf(g) >= 0; }).join(",")]];
    },
    // Result summary (the line a student can send a teacher): the settings in words.
    summary: function () {
      var out = [isChoice() ? "Latin → English" : "English → Latin"];
      var on = GROUPS.filter(function (g) { return ctx.settings.pos.indexOf(g[0]) >= 0; });
      if (on.length < GROUPS.length) out.push(on.map(function (g) { return g[1]; }).join(", "));
      return out;
    },

    pool: function () { return filtered(isChoice() ? eligible() : openWords()).filter(asked); },
    poolNote: function (n) {
      if (!ctx.settings.pos.length) return "Pick at least one part of speech.";
      var only = ctx.settings.lessonOnly;
      if (n === 0) {
        var open = filtered(openWords()).filter(asked).length;
        if (only && !open) return "No words of those parts of speech are new in " + S.lessonName() + ". Pick another lesson or other parts of speech.";
        if (open && isChoice()) {
          return "Too few words through Lesson " + lesson() + " for multiple choice: each question needs four different meanings. " +
            "Raise the lesson number or switch to English → Latin.";
        }
        return "No words through Lesson " + lesson() + " for those parts of speech yet. Raise the lesson number or pick other parts of speech.";
      }
      if (only) return n + " " + S.plural(n, "word") + " new in " + S.lessonName() + ". A round asks " + (n === 1 ? "it" : n === 2 ? "both" : "all " + n) + ".";
      return n + " " + S.plural(n, "word") + " in play" + (n < ROUND_SIZE ? " (a round will be " + n + " long)" : "") + ".";
    },
    // Ten to a round; "Lesson N only" asks every word of the lesson once.
    roundSize: function () { return ctx.settings.lessonOnly ? Math.max(game.pool().length, 1) : ROUND_SIZE; },
    missedRoundSize: function () { return ROUND_SIZE; },
    // No repeats; in English → Latin, no two words asked by the same gloss.
    buildRound: function (list, size) {
      var dir = ctx.settings.dir, used = {}, out = [];
      S.shuffle(list.slice()).forEach(function (e) {
        var q = dir === "en-la" ? posLabel(e) + "|" + e.v.option.toLowerCase() : e.id || e.lemma;
        if (out.length >= size || used[q]) return;
        used[q] = true;
        out.push({ entry: e, dir: dir });
      });
      return out;
    },

    begin: function (item, area) {
      var e = item.entry;
      cur = { item: item, done: false };
      if (item.dir === "en-la") {
        cur.shared = sharing(e);
        cur.answers = answersFor(cur.shared);
        area.appendChild(S.make("p", "entry-line", e.v.option));
        area.appendChild(S.make("p", "drill-prompt",
          "Type the Latin " + posLabel(e) + (group(e) === "other" ? "." : ": the first form in its dictionary entry.") +
          (T.settings.strict ? " Macrons count." : " Macrons are optional.")));
        var wrap = S.make("div", "single-form");
        cur.input = T.input("Latin for: " + e.v.option);
        wrap.appendChild(cur.input);
        area.appendChild(wrap);
        area.appendChild(T.macronBar(area));
        S.setCheckEnabled(false);
        cur.input.focus();
        return;
      }
      cur.shared = [e];
      var head = S.make("p", "entry-line", entryText(e)); head.setAttribute("lang", "la");
      area.appendChild(head);
      area.appendChild(S.make("p", "drill-prompt", "What does it mean?"));
      var box = S.make("div", "option-chips gloss-options");
      box.setAttribute("role", "group"); box.setAttribute("aria-label", "Meanings");
      cur.buttons = S.shuffle([e].concat(distractors(e))).map(function (w) {
        var b = S.make("button", "chip", w.v.option);
        b.type = "button";
        b.setAttribute("data-option", w === e ? "right" : "wrong");
        box.appendChild(b);
        return b;
      });
      area.appendChild(box);
    },
    canCheck: function () { return !!(cur && cur.input && !cur.done && cur.input.value.trim() !== ""); },
    check: function (item) {
      var value = cur.input.value;
      var right = typedRight(value, cur.answers);
      // The kit compares the whole input, so a full entry that starts with
      // the right word is passed as an accepted answer too.
      T.grade(cur.input, right ? cur.answers.concat([value]) : cur.answers);
      cur.done = true;
      return { right: right, typed: value, feedback: feedbackNodes(cur.shared) };
    },

    // Missed list: a word in one direction, named by lemma, part of speech
    // (cum is two words) and direction.
    missedNoun: ["word", "words"],
    formKeys: function (item, result) {
      return [{ key: { lemma: item.entry.lemma, pos: item.entry.pos, dir: item.dir }, right: !!result.right }];
    },
    fromMissed: function (key) {
      if (DIRECTIONS.indexOf(key.dir) < 0) return null;
      for (var i = 0; i < words.length; i++) {
        if (words[i].lemma === key.lemma && words[i].pos === key.pos) return { entry: words[i], dir: key.dir };
      }
      return null;
    },
    review: function (item, result, li) {
      li.appendChild(entryLine(item.entry, "missed-parse"));
      var said = (result.picked != null ? result.picked : result.typed || "").trim();
      if (said) li.appendChild(S.make("p", "fine", (result.picked != null ? "You chose: " : "You wrote: ") + said));
    }
  };

  // Latin → English: a click on an option is the answer.
  function choose(button) {
    var right = button.getAttribute("data-option") === "right";
    cur.done = true;
    cur.buttons.forEach(function (b) {
      b.disabled = true;
      if (b === button) b.className = right ? "chip is-right" : "chip is-wrong";
      else if (b.getAttribute("data-option") === "right") b.className = "chip is-answer";
    });
    S.finish(right, cur.item, { right: right, picked: button.textContent, feedback: feedbackNodes(cur.shared) });
  }

  function choice(type, name, value, text, checked) {
    var label = S.make("label", "choice");
    var input = S.make("input"); input.type = type; input.name = name; input.value = value; input.checked = !!checked;
    label.appendChild(input); label.appendChild(S.make("span", null, text));
    return label;
  }

  window.LatinPractice.register(game);
})();
