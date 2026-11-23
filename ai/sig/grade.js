/* The California signature course: the scripted graders and the passersby's side of each spoken try.

   The rules are each lesson's own "Counts" and "Doesn't count" table in claude/signature-curriculum-claude-v4.md, and
   ai/tests/sig-grade.test.mjs replays every example in those tables. It is deterministic on purpose: a try is graded
   the instant the canvasser stops talking, a firm can read exactly why a part did or didn't count, and every rule has a
   replay. Nothing here calls an AI: a passerby says only the lines the script gives them, chosen by what the canvasser
   actually said (the practice voter rules in claude/training-playbook.md, part A4, and ai/voter-rules.md). The firm
   settings come in as an argument; nothing here names a county.

   No exports keyword on purpose: the page inlines this file as is (ai/tools/build-sig.mjs), and node reads it through
   ai/sig/grade.mjs, as with ai/schedule.js. No regex lookbehind: older iPhones can't parse it. */
var SIGG = (function () {
  "use strict";
  var FILLER = /^(?:um+|uh+|uhm+|er+|erm+|hmm+|mm+|ah+|oh|so|well|okay|ok|like|and)$/;
  var GREET1 = ["hi", "hello", "hey", "hiya", "heya", "howdy", "hola", "greetings", "morning", "afternoon", "evening"];
  var GREET_TAIL = ["there", "their", "they're", "folks", "everyone", "everybody", "all", "y'all", "yall", "guys", "friend", "friends", "neighbor", "ma'am", "maam", "sir", "miss"];
  /* asking for their time, or saying sorry (part 4). The first half is the door-knocking course's own list. */
  var TIME_RE = /\ba (?:minute|moment|second|sec|min|quick minute|quick second|quick sec)\b|\bquick (?:minute|second|sec|moment)\b|\b(?:one|two|a couple|a few|couple of|few) (?:minutes?|seconds?|secs?|moments?)\b(?: of your time)?|\b(?:bad|good|okay|ok|better) time\b|\bbusy right now\b|\bare you busy\b|\b(?:got|have) (?:some |a little |any )?time\b|\bof your time\b|\bcan i (?:talk to|ask|bother|borrow|grab|stop) you\b|\b(?:may|could) i (?:talk|ask|bother|borrow)\b|\bmind if i\b|\bcan i steal\b|\bis now (?:okay|ok|good|fine)\b|\bsorry\b|\bapologi[sz]e\b|\bapologies\b|\bpardon\b|\bbother(?:ing)? you\b|\bask you (?:something|a question|a quick question)\b/;
  /* a promise that a signature will count never passes (the scoring contract) */
  var PROMISE_RE = /\b(?:yours|your signature|your line|it|that|this|that one|this one|they|theirs)(?: all| definitely| totally)? ?(?:will|'ll|would|is going to|is gonna|are going to|gonna)(?: definitely| totally| still)? count\b|\bi (?:promise|guarantee)\b/;
  /* a label the measure doesn't support (part 2): libraries closing, or a claim about what it costs */
  var LIB = "librar(?:y|ies)(?:'s)?";
  var CLOSING = [
    new RegExp("\\b(?:sav(?:e|es|ing)|rescu(?:e|es|ing)|protect(?:s|ing)?|defend(?:s|ing)?)\\b(?: [a-z']+){0,3}? " + LIB + "\\b"),
    new RegExp("\\b" + LIB + "\\b(?: [a-z']+){0,4}? (?:clos(?:e|es|ed|ing|ure|ures)|shut(?:ting)? down|shutdowns?|shut)\\b"),
    new RegExp("\\b(?:clos(?:ing|ure|ures)|shut(?:ting)? down|shutdowns?)\\b(?: [a-z']+){0,4}? " + LIB + "\\b"),
    new RegExp("\\b(?:stop|stops|stopping|prevent|prevents|preventing|fight|fighting|end|ending|block|blocking)\\b(?: [a-z']+){0,3}? (?:clos(?:ing|ure|ures|ings)|shut ?downs?)\\b"),
    new RegExp("\\bkeep(?:s|ing)?\\b(?: [a-z']+){0,3}? " + LIB + " open\\b(?! (?:later|longer|late|more|evenings?|weekends?|nights?|on|at night|till|until|past|after))"),
    new RegExp("\\b" + LIB + "\\b(?: [a-z']+){0,2}? stay(?:s|ing)? open\\b(?! (?:later|longer|late|more|evenings?|weekends?|nights?|on|at night|till|until|past|after))"), /* "help our libraries stay open" (Nov 20) */
  ];
  var COST = /\bfree\b|\bno (?:new |more |extra )?tax(?:es)?\b|\b(?:won't|wont|will not|doesn't|doesnt|does not|isn't going to|not going to) cost\b|\b(?:no|zero) cost\b|\bwithout (?:raising|new|any) tax(?:es)?\b|\bnot a tax\b|\bcosts? (?:you |taxpayers |anyone |anybody )?nothing\b/;
  /* a statement about being registered isn't the question */
  var STATEMENT = /\b(?:have to be|has to be|need to be|needs to be|must be|should be|gotta be|got to be|only|if you're|if you are|if they're|who are|who's|who is|i'm|i am|we're|we are|not|looking for|for|need|needs|want|wants|require|requires|all|any)$/;
  /* the county said without its name, right after the registered question: "in this county" (rule 27b, Robert, Nov 21, 12:56 PM).
     "In LA" or "in Los Angeles" alone still isn't the county: the city isn't the county (Robert's Nov 18 replay, Extra 1). */
  var LOOSE = /\b(?:this county|the county)\b/;
  /* a question's own start just before "registered": "are you all," "you guys all," "are there any," or "any" opening a question
     (the outside review, Nov 21): then "all" or "any" doesn't make it a statement */
  var QCUE = /(?:\b(?:are|r|is|were) )?\b(?:you|ya|u|y'all|yall|you all|you guys|you folks|you two|you both|anyone|anybody|everyone|either of you)(?: (?:a|an|all|both|currently|already|still|guys|folks))*$|\b(?:are|is) there (?:any|anyone|anybody)$/;
  function statement(before, last4, t, at) {
    if (QCUE.test(before)) return false;
    if (/\bany$/.test(before) && /^[^?]{0,80}\?/.test(t.slice(at))) return false; /* "Any registered voters in LA County here?": "any" with a "?" to come */
    return STATEMENT.test(before) || /\b(?:have|has|need|needs|must|should|got|gotta) to be$|\bonly(?: [a-z']+){0,2}$/.test(last4);
  }
  var MID = /\b(?:um+|uh+|uhm|er+|erm|hmm+|ah|and|but|so|or|because|cause|i|i'?m|i am|my|me|we|we'?re|our|the|a|an|to|for|with|of|in|on|at|about|from|like|just|that|this|is|are|was|am|be|it'?s|you|your|who|what|if|then|also|really|very|here|registered|vote|la|los|angeles|library|longer|hi|hello|hey)$/i;
  var esc = function (s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); };

  /* lower case, straight quotes, "L.A." as "la", "?" kept as its own word, everything else that isn't a letter dropped */
  function norm(s) {
    return String(s == null ? "" : s).toLowerCase()
      .replace(/[‘’ʼ`]/g, "'").replace(/[“”]/g, '"').replace(/&/g, " and ")
      .replace(/\bl\.\s?a\.?(?=[\s,.!?]|$)/g, "la").replace(/\bl a(?= county\b)/g, "la")
      .replace(/[^a-z0-9'? ]+/g, " ").replace(/\?/g, " ? ").replace(/(^|\s)'+|'+(?=\s|$)/g, "$1").replace(/\s+/g, " ").trim()
      /* the registered question asked as a voter question (rule 27b, Nov 21): "Are you an LA County voter?", "Are you a voter in LA
         County?", "Do you vote in LA County?" read as "are you registered to vote in ..." */
      .replace(/\b(are|r) (you|ya|u)(?: (?:a|an))? (la county|los angeles county|los angeles|la) voters?\b/g, "$1 $2 registered to vote in $3")
      .replace(/\b(are|r) (you|ya|u) (?:a|an) voters? (?=(?:here |out here )?in\b)/g, "$1 $2 registered to vote ")
      .replace(/\bdo (you|ya|u) vote (?=(?:here |out here )?in\b)/g, "are $1 registered to vote ");
  }
  var words = function (t) { return t ? t.split(" ").filter(function (w) { return w && w !== "?"; }) : []; };
  var real = function (t) { return words(t).filter(function (w) { return !FILLER.test(w); }); };
  var countyCache = {};
  function countyRe(st) {
    var names = [st.county].concat(st.countyAlso || [], st.countyHeard || []).map(norm).filter(Boolean), key = names.join("|");
    if (!countyCache[key]) countyCache[key] = new RegExp("\\b(?:" + names.filter(function (x, i, a) { return a.indexOf(x) === i; }).sort(function (a, b) { return b.length - a.length; }).map(esc).join("|") + ")\\b");
    return countyCache[key];
  }
  var labelRe = function (st) { var l = norm(st.label); return l ? new RegExp("\\b" + esc(l) + "\\b") : null; };

  /* the greeting at the very start (fillers before it don't count against it): how many words it takes, or 0 */
  function greetLen(ws) {
    var i = 0;
    while (i < ws.length && FILLER.test(ws[i])) i += 1;
    var a = ws[i], b = ws[i + 1], n = 0;
    if (!a) return 0;
    if (["morning", "afternoon", "evening"].indexOf(a) >= 0 && ["and", "or", "hours", "library", "weekend", "weekends"].indexOf(b) >= 0) return 0; /* "evening and weekend hours" is a label, not a hello */
    if (GREET1.indexOf(a) >= 0) n = 1;
    else if (a === "good" && ["morning", "afternoon", "evening", "day"].indexOf(b) >= 0) n = 2;
    /* "How are you?", "How's it going?", "How you doing?" are hellos too (version 8, Robert's 2nd try, Nov 20, 3:51 PM) */
    else if (a === "how" && (b === "are" || b === "r") && ["you", "ya", "u"].indexOf(ws[i + 2]) >= 0) n = ["doing", "today"].indexOf(ws[i + 3]) >= 0 ? 4 : 3;
    else if (a === "how" && b === "you" && ws[i + 2] === "doing") n = 3;
    else if (a === "how's" && b === "it" && ws[i + 2] === "going") n = 3;
    else if ((a === "how's" || (a === "how" && b === "is")) && ["your", "everything"].indexOf(a === "how" ? ws[i + 2] : b) >= 0) n = a === "how" ? 3 : 2;
    else if ((a === "high" || a === "hay" || a === "hei") && GREET_TAIL.indexOf(b) >= 0) n = 1; /* how a phone sometimes spells "hi there" */
    if (!n) return 0;
    while (GREET_TAIL.indexOf(ws[i + n]) >= 0 || GREET1.indexOf(ws[i + n]) >= 0) n += 1; /* "hi there", "hey everyone", "hi good morning" */
    return i + n;
  }

  /* the registered question: where it starts and ends in the line, and whether it names the county */
  function question(t, st) {
    var re = /\bregist(?:er|ered|ration)\b/g, cre = countyRe(st), m, best = null;
    while ((m = re.exec(t))) {
      var before = t.slice(0, m.index).trim(), last4 = before.split(" ").slice(-4).join(" ");
      if (statement(before, last4, t, m.index)) continue; /* "you have to be registered", "only registered voters count" */
      var start = m.index, cue = before.match(/(?:\b(?:are|r|is|were) )?(?:\b(?:you|ya|u|y'all|yall|you all|you guys|you folks|you two|you both|anyone|anybody|everyone|either of you)\b)(?: (?:a|an|all|both|currently|already|still|guys|folks))*$/);
      if (cue) start = before.length - cue[0].length;
      var after = t.slice(m.index + m[0].length), end = m.index + m[0].length;
      var tail = after.match(/^(?: (?:to vote|voters?|voting|to vote here|here))+/);
      if (tail) end += tail[0].length;
      /* the county, within a few words after "registered ..." (a "?" between only when the county follows at once: "Are you registered
         to vote? In LA County?"), said in full or loosely ("in LA," "in Los Angeles," "in this county"), or just before the question */
      /* past a "?", "this county" never counts, and the county's name only as the question's own end: "Are you registered to vote? In
         LA County?" (the outside review, Nov 21: "Are you registered to vote? The county checks every line." isn't the question) */
      var county = false, rest = t.slice(end), gapOk = function (x, loose) { if (!x) return false; var gap = rest.slice(0, x.index), n = gap.trim().split(" ").filter(Boolean).length; if (gap.indexOf("?") < 0) return n <= 8; return !loose && /\?\s*(?:in\s*)?$/.test(gap) && gap.split("?").length === 2; };
      var cm = [[cre.exec(rest), false], [LOOSE.exec(rest), true]].filter(function (x) { return gapOk(x[0], x[1]); }).map(function (x) { return x[0]; }).sort(function (a, b) { return a.index - b.index; })[0];
      if (cm) { county = true; end = end + cm.index + cm[0].length; }
      else { var pre = t.slice(0, start), pm = pre.match(new RegExp("(?:\\bin )?" + cre.source + "(?: [a-z']+){0,2} ?$")); if (pm && !/\b(?:with|from|for|at|of|by) $/.test(pre.slice(0, pre.length - pm[0].length))) { county = true; start = pre.length - pm[0].length; } }
      var q = { at: start, end: end, county: county };
      if (!best || (q.county && !best.county)) best = q;
    }
    return best;
  }

  /* lesson 2's part 2 (version 5, Robert, Nov 20, 12:21 AM; playbook rule 27a): it counts when the opener names the hours (longer,
     more, evening or weekend hours) after "for" or after a verb, whatever the grammar. "Signatures for longer library hours!" counts.
     "Support your library!" and "This petition is for the library." don't, because they never say what it does, and neither do the
     hours on their own ("Longer library hours."). The words have to sit outside the registered question. */
  /* the verbs that can come before the hours ("This petition is", "I'm gathering signatures", "It funds"), with "for" counted too */
  var VERB = /^(?:is|are|am|was|i'm|we're|it's|that's|this's|petition's|here's|what's|its|funds?|funding|keeps?|keeping|gives?|giving|adds?|extends?|expands?|means|would|will|brings?|pays|opens?|makes?|gets?|gathering|collecting|getting|asking|want|wants|need|needs|trying|pushing|proposes?|supports?|supporting|backs?|backing|wins?|winning|help|helps|helping|hear|hearing|sign|signing|imagine|see|fight|fighting|vote|voting|like|love|deliver|delivers|restore|restores|demand|demanding)$/;
  var AFTER = /^(?:is|are|was|it's|that's|this's|what's|means|would|will)$/; /* the topic first: "Longer library hours is what this petition is for." */
  function hoursFor(t, q, g) {
    var at = 0, ws = t.split(" ").map(function (w) { var o = { w: w, at: at }; at += w.length + 1; return o; }).filter(function (x) { return x.w && x.w !== "?"; });
    var inQ = function (x) { return q && x.at >= q.at && x.at < q.end; };
    var re = new RegExp(HOURS_RE.source, "g"), m;
    while ((m = re.exec(t))) {
      var s = m.index, e = s + m[0].length, first = -1, last = -1, inside = q && s >= q.at && s < q.end;
      for (var k = 0; k < ws.length; k += 1) { if (first < 0 && ws[k].at + ws[k].w.length > s) first = k; if (ws[k].at < e) last = k; }
      if (first < 0) continue;
      if (!inside && /^(?:keep|keeps|keeping|extends?|extending|expands?|expanding|lengthens?|lengthening|increas(?:e|es|ed|ing)|boost(?:s|ing)?|raise|raises|raising|adds?|adding|stay|stays|staying)\b/.test(m[0])) return true; /* the verb is part of the match: "keep libraries open later", "increasing the number of hours" */
      for (var j = Math.max(g, first - 9); j < first; j += 1) {
        if (ws[j].w === "for" && j >= first - 2) return true; /* "for longer library hours", even inside the registered question */
        if (!inQ(ws[j]) && (ws[j].w === "for" || VERB.test(ws[j].w))) return true;
      }
      for (var n = last + 1; n < Math.min(ws.length, last + 7); n += 1) { if (inQ(ws[n])) break; if (AFTER.test(ws[n].w)) return true; }
    }
    return false;
  }
  /* grade one opener (all of its pieces joined): the four parts and what the passerby would have heard */
  function grade(text, st) {
    var t = norm(text), ws = words(t), g = greetLen(ws), q = question(t, st), lre = labelRe(st);
    var tm = TIME_RE.exec(t), timeAt = tm ? tm.index : -1;
    var tn = t.replace(/\bneighborhood librar(?:y|ies) act\b/g, "the measure"); /* the measure's name isn't what it's for */
    var libAny = new RegExp("\\b" + LIB + "\\b").test(tn) || /\bbranch(?:es)?\b(?: [a-z']+){0,3}? (?:hours?|open)\b/.test(tn) || (lre ? lre.test(tn) : false);
    var ta = t.replace(/\bfeel free\b/g, " "), um = null;
    CLOSING.some(function (r) { var m = r.exec(t); if (m) um = m[0]; return !!m; });
    var closing = !!um, cm = closing ? null : COST.exec(ta), cost = !!cm, untrue = closing ? "closing" : cost ? "cost" : null;
    if (cm) um = cm[0];
    var promise = PROMISE_RE.test(t);
    /* the explanation: every word that isn't the greeting, the registered question or a filler */
    var explWords = 0, at = 0, seen = 0;
    t.split(" ").forEach(function (w) {
      var here = at; at += w.length + 1;
      if (!w || w === "?") return;
      seen += 1;
      if (seen <= g || FILLER.test(w) || (q && here >= q.at)) return; /* only what comes before the question counts toward "runs past about 12 words" */
      explWords += 1;
    });
    var long = !!q && explWords > 18; /* runs past about 17 words before the question (version 8: the course's own opener now says it's collecting signatures for a ballot measure, 12 words), one word of grace for a recognizer's extra word. With no question it can't run long before it. */
    var hoursAny = HOURS_RE.test(t), topic = libAny || hoursAny, sentence = hoursAny && hoursFor(t, q, g), topicOnly = topic && !sentence && !untrue && !long;
    var sorryWord = !!(tm && /sorry|pardon|apolog|excuse|bother/.test(tm[0])), sorryFirst = sorryWord && (!q || timeAt < q.at);
    var hits = [g > 0, sentence && !untrue && !long, !!(q && q.county), timeAt < 0 && ws.length > 0]; /* part 4 is about what you leave out, so it counts only once you've said something (a passerby who walked past a silent canvasser) */
    return {
      hits: hits, n: hits.filter(Boolean).length, text: String(text || "").trim(), norm: t,
      greet: g > 0, topic: topic, sentence: sentence, hours: sentence, topicOnly: topicOnly, long: long,
      /* signatures or a petition came up, so a passerby can offer to sign (rule 37e, Robert, Nov 21, 12:56 PM: "I didn't ask her to sign anything") */
      sig: /\bsignatures?\b|\bsign(?:ing|ed)?\b|\bpetitions?\b|\b(?:put|add|write) (?:down )?your name\b/.test(t), explWords: explWords, untrue: untrue, untrueSaid: um, promise: promise,
      alt: [false, topicOnly, false, sorryFirst], /* the second "missed" lines: only the topic, and an apology first */
      /* missed in a way no missed line describes: it ran long or wasn't true (the untrue card says that), or a sorry after the question */
      vague: [false, topic && !topicOnly && (long || !!untrue), false, sorryWord && !sorryFirst],
      /* how a part was missed when its plain line wouldn't be true (playbook rule 22a): something the measure doesn't say, too much
         before the question, a sorry after the question */
      miss: [null, untrue ? "Untrue" : topic && long ? "Long" : null, null, sorryWord && !sorryFirst ? "Sorry" : null],
      regAsked: !!q, regAt: q ? q.at : -1, county: !!(q && q.county), timeAt: timeAt, timeSaid: tm ? tm[0] : "",
      /* what the passerby hears first, a request for time or the registered question */
      first: timeAt >= 0 && (!q || timeAt < q.at) ? "time" : q ? "reg" : "none",
      void: !!untrue || promise, /* an opener that says something untrue can't be the one that counts */
    };
  }


  /* lesson 1's rule comes back with a passerby who isn't registered: thank her and let her go. Telling her she can
     register counts; "sign anyway" or offering the board doesn't. */
  var PUSH = /\bsign(?: it| this| that| here)?(?: right)? (?:any ?ways?|regardless|though|still)\b|\bstill sign\b|\b(?:go ahead and|just|you can|you could|can still|could still|should still|should|want to) sign\b|\bsign (?:here|right here|this|it|for me|real quick)\b|\bhere(?:'s| is) (?:the|my|a|your) (?:board|petition|pen|clipboard|sheet)\b|\btake (?:the|this|my|a) (?:pen|board|clipboard|petition)\b|\b(?:doesn't|doesnt|does not|don't|dont) matter\b|\b(?:don't|dont|do not) (?:have|need) to be registered\b|\bregistered or not\b/;
  var COURTESY = /\bthank|\bno problem\b|\bno worries\b|\bnot a problem\b|\bthat's (?:ok|okay|fine|all right|alright|cool)\b|\bok(?:ay)?\b|\ball good\b|\bno sweat\b|\bgot it\b|\ball right\b|\balright\b|\bhave a (?:good|great|nice|wonderful|lovely)\b|\bhave a good one\b|\btake care\b|\b(?:good)?bye\b|\bsee you\b/;
  function letGo(text) {
    var t = norm(text);
    if (!real(t).length) return false;
    var push = PUSH.test(t) && !(/\bregist/.test(t) && /\b(?:then|after|first|once|when)\b/.test(t)); /* "register first, then you can sign" is the save, not a push */
    return !push && COURTESY.test(t);
  }

  /* of several openers, the one that counts: the most parts, a tie going to the later one, never an untrue one */
  function best(tries) {
    var k = -1;
    (tries || []).forEach(function (x, i) { if (!x || x.void) return; if (k < 0 || x.n >= tries[k].n) k = i; });
    return k;
  }

  /* ---------------- shared ---------------- */
  /* speech the recognizer didn't really catch isn't a try. An opener needs more than one stray word; anywhere else one
     real word ("Yes.") is an answer. */
  var HES = /^(?:um+|uh+|uhm+|er+|erm+|hmm+|mm+|ah+)$/;
  function misheard(text, opener) {
    var r = words(norm(text)).filter(function (w) { return !HES.test(w); });
    if (!r.length) return true;
    if (opener && r.length === 1 && GREET1.indexOf(r[0]) < 0 && !/^librar/.test(r[0])) return true;
    return false;
  }
  /* how long quiet has to last before a passerby answers (playbook A4, rules 34 and 34a): 1.2 seconds after a line that sounds
     finished, 2.8 when it could go on or is under three words. The app never cuts a canvasser off.
     Nov 22, 2026 (Robert, on lesson 2's 1st try: "it just cut off my voice. I was still talking, unfinished."): "We're collecting
     signatures on, uh, have something on the ballot in November to get" counted as finished after 1.2 seconds, because "get" wasn't
     on the list. A line could go on when its last word is one that needs more after it (MID, MORE) or it ends on "to" and a verb
     ("to get," "to keep"); only "to sign," "to help," "to talk" and the like end a thought there. When unsure, it waits. */
  var MORE = /\b(?:get|gets|got|getting|keep|keeps|keeping|make|makes|making|have|has|had|having|give|gives|giving|put|puts|putting|need|needs|want|wants|wanted|try|tries|trying|tryna|going|gonna|wanna|gotta|let|lets|let's|ask|asking|tell|telling|bring|bringing|take|taking|show|showing|extend|extends|extending|fund|funds|funding|collect|collecting|gather|gathering|add|adds|adding|pay|pays|paying|would|could|should|might|must|than|as|some|any|every|each|more|most|its|their|his|which|where|when|how|why|there'?s|they'?re|they|he|she|was|were|been|being|extended|extra|additional|new|public|branch|neighborhood|local|statewide|state|digital|evening|weekend|ballot measure|whole|by|until|till|into|onto|through|called|will|can|open|that'?s|you'?re|we'?ll|it'?ll)$/i;
  /* ...unless it ends the way a finished line does (the outside review, Nov 22): a greeting, a goodbye or thanks, an ask to sign */
  var DONE_END = /\b(?:how'?s it going|how are (?:you|ya)|how (?:are )?you doing|how'?re you doing|what'?s up|good (?:morning|afternoon|evening|night)|have a (?:good|great|nice|lovely|wonderful) (?:one|day|evening|night|weekend|morning|afternoon)|thank you(?: so much| very much)?|thanks(?: so much| a lot| anyway| anyways| for stopping(?: by)?)?|(?:good ?)?bye(?: now| bye)?|take care|see (?:you|ya)(?: later| around| soon)?|you too|no problem|no worries|of course|sure|okay|ok|all good|that'?s (?:ok|okay|fine|alright)|yes (?:you|it|they|we) (?:can|will|do|does|are|is)|if you want|hear more|learn more|sign it|sign this|sign here|right here|open later|la county)$/i;
  var TO_DONE = /\bto (?:sign|help|talk|chat|go|register|vote|wait|stop|know|meet|it)$/;
  function pauseMs(text) {
    var t = norm(text), last = t.replace(/[ ?]+$/, "");
    if (DONE_END.test(last)) return 1200;
    if (real(t).length < 3) return 2800;
    if (/\?\s*$/.test(String(text)) && !HES.test(last.split(" ").pop() || "")) return 1200; /* the phone heard a question that ended */
    var more = MID.test(last) || MORE.test(last) || (/\bto [a-z']+$/.test(last) && !TO_DONE.test(last));
    return more ? 2800 : 1200;
  }
  function tipFor(hits) { for (var i = 0; i < 4; i += 1) if (!hits[i]) return i; return -1; }
  var at = function (re, t) { var m = re.exec(t); return m ? m.index : -1; };
  /* a goodbye ends a conversation at once (playbook A4): no extra turn, no question tacked on */
  var BYE_RE = /\b(?:good ?)?bye\b|\bsee (?:you|ya)\b|\btake care\b|\bhave a (?:good|great|nice|wonderful|lovely|blessed) (?:one|day|night|evening|afternoon|morning|weekend)\b|\bnever ?mind\b|\bthanks anyway\b|\bforget it\b/;
  function bye(text) { return BYE_RE.test(norm(text)); }
  /* inside a talk: the canvasser's latest words ask them to sign ("Would you sign?", "Want to put your name on it?") */
  var SIGN_ASK = /\b(?:will|would|can|could|wanna|want to|like to|care to|willing to|ready to|happy to) (?:you )?(?:sign|put your name|add your name)\b|\b(?:will|would|can|could) you (?:please )?(?:sign|put your name|add your name)\b|\bsign (?:this|here|it|the petition|our petition|a petition)\b.{0,20}\?|\bwant to sign\b/;
  /* the words around a match, as the canvasser said them: two before and three after, so a card can show what was untrue */
  function around(t, m, raw) {
    if (!m) return "";
    /* the canvasser's own sentence, when the phone gave punctuation and the sentence is short */
    var parts = String(raw || "").split(/[.!?;]+/), i;
    for (i = 0; i < parts.length; i += 1) { var n = norm(parts[i]); if (n && n.indexOf(m[0]) >= 0 && words(n).length <= 10) return parts[i].replace(/\s+/g, " ").trim(); }
    var a = t.slice(0, m.index).split(" ").filter(function (w) { return w && w !== "?"; }).slice(-1), b = t.slice(m.index + m[0].length).split(" ").filter(Boolean), c = [];
    for (i = 0; i < b.length && c.length < 3 && b[i] !== "?"; i += 1) c.push(b[i]);
    while (c.length && /^(?:a|an|the|and|or|but|so|to|of|it|you|i|we|is|are|have|has|will|would|can|did|do)$/.test(c[c.length - 1])) c.pop(); /* don't stop on half a thought */
    return a.concat([m[0]], c).join(" ").trim();
  }
  var THANKS = /\bthank|\bno problem\b|\bno worries\b|\bnot a problem\b|\bthat's (?:ok|okay|fine|all right|alright|cool)\b|\bok(?:ay)?\b|\ball good\b|\bno sweat\b|\bgot it\b|\ball right\b|\balright\b|\bhave a (?:good|great|nice|wonderful|lovely)\b|\btake care\b|\b(?:good)?bye\b|\bsee you\b|\bfair enough\b|\bunderstood\b|\bi understand\b|\bappreciate\b/;

  /* ---------------- lesson 1: the question, and why you ask ---------------- */
  var CHECK_RE = /\b(?:county|counties|elections? office|registrar|clerk|state|they|officials?)\b(?: [a-z']+){0,4}? (?:check|checks|checking|checked|verif(?:y|ies|ied|ying)|looks? (?:up|at|over)|go(?:es)? (?:through|over)|reviews?|compares?|match(?:es)?|validates?)\b|\b(?:thrown|tossed|kicked|struck|taken) out\b|\bthrow(?:s|n)? (?:it |them |those |these |yours |that |the [a-z]+ )?(?:out|away)\b|\btoss(?:es|ed)?\b|\breject(?:s|ed)?\b|\bdisqualif|\b(?:checked|verified) by\b|\b(?:is|gets|get|are) (?:checked|verified)\b|\bchecks? (?:every|each|all)\b/;
  /* every place the registered question is asked in a line (a statement such as "only registered voters count" isn't one) */
  function questionSpans(t, st) {
    var re = /\bregist(?:er|ered|ration)\b/g, m, out = [];
    while ((m = re.exec(t))) {
      var before = t.slice(0, m.index).trim(), last4 = before.split(" ").slice(-4).join(" ");
      if (statement(before, last4, t, m.index)) continue;
      out.push([m.index, m.index + m[0].length]);
    }
    return out;
  }
  /* the question and the reason, scored together whichever piece they came in (the scoring contract: "a try can come in
     pieces"). Parts 1 and 2 are the question, wherever it was asked. Part 3 is being registered said as a reason, so the
     question's own "registered" doesn't count for it. A short "in LA County?" said after the question finishes the question. */
  function grade1(q, a, st, pieces) {
    var all = norm([q, a].filter(Boolean).join(" ")), Q = question(all, st), rest = all;
    questionSpans(all, st).reverse().forEach(function (s) { rest = rest.slice(0, s[0]) + rest.slice(s[1]); });
    var cre = countyRe(st), late = !!Q && !Q.county && (pieces || [q, a]).some(function (x) { var n = norm(x); return !!n && real(n).length <= 5 && cre.test(n) && !question(n, st); });
    var p3 = /\bregist|\bunregistered\b/.test(rest), p4 = CHECK_RE.test(all), promise = PROMISE_RE.test(all), u = untrueOf(all, [q, a].filter(Boolean).join(" "));
    var hits = [!!Q, !!(Q && (Q.county || late)), p3, p4];
    return { hits: hits, n: hits.filter(Boolean).length, alt: [false, false, false, false], promise: promise, untrue: u ? u.kind : null, untrueSaid: u ? u.said : "", why: p3 || p4, text: [q, a].filter(Boolean).join(" ") };
  }

  /* ---------------- lesson 3: the ask ---------------- */
  var PAID_RE = /\b(?:i'?m|i am|we'?re|we are) (?:a |an |also |actually |being |getting |all )*paid\b|\bi (?:do )?(?:get|got) paid\b|\bpaid to (?:gather|collect|get|do|be|circulat|stand|work|ask)|\bpaid (?:signature |petition )?(?:gatherer|canvasser|circulator|collector|staff|staffer|worker|employee)\b|\b(?:they|the campaign|the firm|the company|the drive)(?: do| does)? (?:pays?|is paying|are paying) me\b|\bthis is (?:my|a paid) job\b|\bit'?s (?:my|a paid) job\b|\bi'?m (?:on the clock|compensated)\b/;
  var NOT_PAID_RE = /\b(?:not|never|don't|do not|aren't|isn't)(?: [a-z']+)? (?:being |getting |get )?paid\b|\bunpaid\b/;
  var VOL_RE = /\b(?:i'?m|i am|we'?re|we are|i'?m just|we'?re all) (?:a |an |just a |only a |just |all |actually a )?volunteer(?:s|ing)?\b|\bi (?:just )?volunteer\b|\bas a volunteer\b/;
  var FUND_RE = /\bfunders?\b|\bfunding\b|\bfunded by\b|\bwho(?:'s| is| are)? (?:paying|behind|funding|backing)\b|\bdonors?\b|\bbackers?\b|\bwho pays for\b/;
  var ASK_RE = /\b(?:will|would|can|could|won't|wouldn't) (?:you|ya|u)(?: (?:please|be willing to|like to|want to|be able to|mind|care to|go ahead and|add your name and))* sign(?:ing)?\b|\b(?:want|wanna|like|care|willing|ready|able|happy) (?:to )?sign\b|\bwanna sign\b|\b(?:can|could|may|might) i (?:get|have|grab) (?:your|a|ur) (?:signature|autograph|john hancock)\b|\b(?:get|have|need) your signature\b|\badd your (?:name|signature)\b|\bput your (?:name|signature)\b|\bhow about (?:a|your) signature\b|\byour signature \?/;
  var PRESS_RE = /\byou (?:have|need|got|gotta|ought|are going) to sign\b|\byou (?:must|should|better|gotta) sign\b|\bevery(?:body|one)(?:'s| is| else is| has| else has) sign|\bjust sign\b|\bsign it already\b/;
  var DBL_RE = /\b(?:have|did|haven't|didn't|had|has) (?:you|ya|u|he|she)(?: guys| already| ever| maybe| possibly)* (?:sign|signed|seen and signed)\b|\b(?:already|previously) sign(?:ed)?\b|\bsign(?:ed)? (?:this|it|that|one|the [a-z]+)(?: [a-z']+){0,3} (?:already|before|yet)\b|\bsign(?:ed)? (?:already|before)\b|\bfirst time (?:signing|seeing)\b/;
  /* the words that can sit inside "longer ... hours" (Nov 20 review: "more signatures for library hours" isn't the hours) */
  var HW = "(?:library|libraries|library's|branch|branches|evening|evenings|weekend|weekends|night|nights|and|open|opening|public|neighborhood|local|our|the|their)";
  var HOURS_RE = new RegExp("\\b(?:longer|more|extended|extra|later|additional|added|expanded) (?:" + HW + " ){0,3}?hours\\b|\\bhours\\b(?: (?:open|a|bit|little|lot|much|each|every|day|night|at|the|library|libraries|branch|branches|stay|stays|staying|run|runs|go|goes)){0,3} (?:longer|later)\\b|\\b(?:evenings?|weekends?|nights?)\\b(?: " + HW + "){0,3}? (?:hours|open)\\b|\\bopen (?:later|longer|more|late|evenings?|weekends?|nights?|on (?:evenings|weekends|nights))\\b|\\bstay(?:s|ing)? open (?:later|longer|late|more|evenings?|weekends?|nights?)\\b|\\bkeep(?:s|ing)?\\b(?: [a-z']+){0,4}? open (?:later|longer|late|more|evenings?|weekends?|nights?)\\b|\\b(?:extends?|extending|expands?|expanding|lengthens?|lengthening|increas(?:e|es|ed|ing)|boost(?:s|ing)?|raise|raises|raising|adds?|adding)\\b(?: [a-z']+){0,4}? hours\\b"); /* version 8: "increasing the number of hours" */
  var TAX_RE = /\btax(?:es|ed)?\b/;
  /* something untrue about the measure or about being paid, in any lesson (the scoring contract): what kind, and the words */
  function untrueOf(t, raw) {
    var m = VOL_RE.exec(t), i;
    if (m && !/\bnot (?:a |an )?volunteer/.test(t)) return { kind: "volunteer", said: around(t, m, raw) };
    for (i = 0; i < CLOSING.length; i += 1) { m = CLOSING[i].exec(t); if (m) return { kind: "closing", said: around(t, m, raw) }; }
    var ta = t.replace(/\bfeel free\b/g, "feel okay"); m = COST.exec(ta);
    return m ? { kind: "cost", said: around(ta, m, raw) } : null;
  }
  function grade3(text, st) {
    var t = norm(text), ta = t.replace(/\bfeel free\b/g, " ");
    var askAt = at(ASK_RE, t), press = PRESS_RE.test(t), paidAt = NOT_PAID_RE.test(t) ? -1 : at(PAID_RE, t), funAt = at(FUND_RE, t);
    var before = function (x) { return x >= 0 && (askAt < 0 || x < askAt); };
    var sheet = st.funders !== "printed", paid = before(paidAt), fun = !sheet || before(funAt);
    var vol = VOL_RE.test(t) && !/\bnot (?:a |an )?volunteer/.test(t), closing = CLOSING.some(function (r) { return r.test(t); }), cost = COST.test(ta);
    var hours = HOURS_RE.test(t), tax = TAX_RE.test(t) && !cost, dbl = DBL_RE.test(t);
    var untrue = vol ? "volunteer" : closing ? "closing" : cost ? "cost" : null, promise = PROMISE_RE.test(t);
    var hits = [paid && fun, hours && tax && !closing, dbl, askAt >= 0 && !press];
    return {
      hits: hits, n: hits.filter(Boolean).length, text: String(text || "").trim(),
      alt: [paid && !fun, tax && !hours && !cost, false, false], /* the second "missed" line: only the sheet, or only the hours half */
      paid: paid, funders: fun, late: (paidAt >= 0 && !paid) || (sheet && funAt >= 0 && !before(funAt)), hours: hours, tax: tax, dbl: dbl, ask: askAt >= 0, press: press,
      untrue: untrue, untrueSaid: untrue ? (untrueOf(t, text) || { said: "" }).said : "", promise: promise, heardTopic: /\blibrar|\bpetition\b|\bballot\b|\bmeasure\b|\bsignatures?\b|\bhours\b|\binitiative\b|\bact\b/.test(t),
      /* a part that was missed in a way its "missed" line doesn't describe: the paid line said after the ask, or pressure in place of an ask */
      vague: [!(paid && fun) && ((paidAt >= 0 && !paid) || (sheet && funAt >= 0 && !before(funAt))) && paidAt >= 0, false, false, press && askAt < 0],
      miss: [paid && sheet && funAt >= 0 && !before(funAt) ? "FundersLate" : null, closing || cost ? "Untrue" : null, null, null], /* the funders shown after the ask; part 2 with something the measure doesn't say (rule 22a) */
    };
  }
  /* a passerby who thinks he signed already: thank him and let him go */
  var AGAIN_RE = /\bsign (?:again|anyway|anyways|it again|this again|one more time|here|right here|another)\b|\bto be safe\b|\bjust in case\b|\bgo ahead and sign\b|\bsign it anyway\b|\bcan't hurt\b|\bwon't hurt\b|\bdoesn't hurt\b|\bsign (?:just )?to be sure\b|\b(?:you can|you could|you should|please|just) sign\b|\bsecond (?:one|signature) (?:is|would be) (?:fine|ok|okay)\b/;
  function signAgain(text) { var t = norm(text); return AGAIN_RE.test(t) && !/\b(?:don't|do not|no need to|can't|cannot|shouldn't|not) sign\b/.test(t); }
  function letsGo(text) { var t = norm(text); return real(t).length > 0 && !signAgain(text) && (THANKS.test(t) || /\bonce\b|\bone (?:signature|time)\b|\b(?:don't|no need to|can't|cannot|shouldn't) sign\b|\ball set\b|\bgood to go\b|\bdouble\b/.test(t)); }

  /* ---------------- lesson 4: the line ---------------- */
  var PRINT_RE = /\bprint(?:ed)?\b(?: [a-z']+){0,3}? name\b|\bname\b(?: [a-z']+){0,3}? print(?:ed)?\b/;
  var ADDR_REG_RE = /\baddress\b(?: [a-z']+){0,8}? (?:regist(?:er|ered|ration)|voter (?:record|file|registration|card))\b|\b(?:regist(?:er|ered|ration)|voter (?:record|file|registration))\b(?: [a-z']+){0,6}? address\b|\bwhere you(?:'re| are) registered\b/;
  var SELF_RE = /\b(?:has|have|needs?|got|gotta|'s got) to be (?:in )?(?:your|ur|the signer's)(?: own)? (?:hand ?writing|writing|hand|words)\b|\byou(?:'ll| will)? (?:have|need|got|gotta|'ve got|ve got) to (?:write|fill|do|print|put)\b|\byou (?:must|should) (?:write|fill|do)\b|\b(?:can't|cannot|can not|not allowed to|not able to|unable to|not supposed to|couldn't|shouldn't|may not|am not allowed|i'm not allowed)(?: [a-z']+){0,2}? (?:write|fill|do that|do it|put)\b|\bonly you can\b|\bin your (?:own )?(?:hand ?writing|writing|hand)\b|\byour (?:own )?hand ?writing\b|\bi(?:'ll| can| will| could) hold\b|\blet me hold\b|\bhand me (?:the|your|a|that)\b|\b(?:signer|voter|you) (?:has|have) to write\b|\bhas to be you\b|\bneeds to be you\b|\bwrite it yourself\b|\bfill it (?:in |out )?yourself\b/;
  var AGREE_RE = /^(?:oh )?(?:sure|yes|yeah|yep|yup|ok|okay|of course|no problem|absolutely|happy to|you bet|certainly|definitely|i can|i got you|got you|i can do that)\b|\bi(?:'ll| can| will) (?:write|fill|put|do|get|take care of)\b|\bwhat(?:'s| is) (?:your|the) address\b|\blet me (?:write|fill|get|do)\b|\bgo ahead and tell me\b|\bi got (?:it|you)\b|\btell me (?:your|the) address\b/;
  var GAP_RE = /\b(?:sign|signature|signed|signing)\b/;
  var GAP_NAMED = /\b(?:blank|empty|missing|forgot|skipped|unsigned)\b|\b(?:didn't|did not|haven't|have not|hasn't|not) sign(?:ed)?\b|\bno signature\b|\bstill (?:need|have to|got to)\b|\b(?:can|could|will|would) you (?:please |just |go ahead and )*sign\b|\bsign (?:right )?(?:here|there)\b|\bneed(?:s)? (?:your|a|the) signature\b|\bplease sign\b|\bsignature (?:box|line)\b|\bone more (?:thing|box)\b/;
  var FINE_RE = /\b(?:looks?|look|that's|you're|we're|everything's|everything is|it's)(?: all)? (?:good|great|fine|perfect|set|done|complete)\b|\ball set\b|\bgood to go\b|\bthat's it\b|\bperfect\b/;
  function grade4(text, st) {
    var t = norm(text), self = SELF_RE.test(t), agree = !self && AGREE_RE.test(t.replace(/^(?:um+|uh+|oh|well|so) /, ""));
    var gap = GAP_RE.test(t) && !(FINE_RE.test(t) && !/\b(?:but|except|just|still|one more|forgot|missing|blank|empty|need|didn't|haven't|skipped|without)\b/.test(t));
    /* saying the whole walk-through again ("print your name, then sign, then the address") names no gap: the hard part counts only when it's done */
    if (gap && PRINT_RE.test(t) && /\baddress\b/.test(t) && !GAP_NAMED.test(t)) gap = false;
    var u = untrueOf(t, text);
    return { print: PRINT_RE.test(t), addr: ADDR_REG_RE.test(t) && !/\bmailing address\b/.test(t), self: self, agree: agree, gap: gap, fine: FINE_RE.test(t) || THANKS.test(t), dbl: DBL_RE.test(t), promise: PROMISE_RE.test(t), untrue: u ? u.kind : null, untrueSaid: u ? u.said : "" };
  }

  /* ---------------- lesson 5: the hard question ---------------- */
  var SHOW_RE = /\bprinted\b|\bin print\b|\bsummary\b|\bright here\b|\btake a look\b|\bhave a look\b|\blook at\b|\bread (?:it|this|the|for)\b|\bit says\b|\bsays (?:it |so )?(?:right )?here\b|\bhere(?:'s| is) the (?:petition|summary|sheet|text|page|full text)\b|\bon (?:the|this) (?:sheet|page|petition|board)\b|\b(?:full )?text\b|\bsee for yourself\b|\ball (?:there|here)\b|\bpoint(?:ing)?\b|\bwritten (?:right )?(?:here|there|down)\b|\bthis sheet\b/;
  var YES_RE = /^(?:(?:um+|uh+|oh|well|so|honestly|actually) )*(?:yes|yeah|yep|yup|it is|it does|it will|correct|that's right|right|true|sure is|yes it is)\b|\bit(?:'s| is) a (?:new |state |statewide |brand new )*tax\b|\bthere(?:'s| is) a (?:new |state |statewide )*tax\b|\byes\b|\bit does (?:raise|add|create)\b|\ba new (?:state |statewide )?tax\b/;
  var NO_RE = /^(?:(?:um+|uh+|oh|well|so|honestly|actually) )*(?:no|nope|nah|not really|not exactly)\b(?! problem| worries| sweat)/;
  var NOTAX_RE = /\bno (?:new |more |extra )?tax(?:es)?\b|\bnot a (?:new |real )?tax\b|\bisn't (?:a|really a) tax\b|\b(?:few|couple of|couple) (?:cents|pennies|dollars|bucks)\b|\bpennies\b|\bwon't (?:even )?notice\b|\b(?:won't|wont|will not|doesn't|does not) (?:cost|raise|affect|touch)\b|\bfree\b|\bnot on you\b|\bonly (?:on|for) (?:big|large|tech)\b/;
  var IDK_RE = /\bi (?:don't|do not) know\b|\bnot sure\b/;
  var ARGUE_RE = /\bbut\b|\bdon't you\b|\bdo you not\b|\bcome on\b|\bare you sure\b|\bwhy not\b|\breconsider\b|\bthink about\b|\bfor the (?:kids|children|community|libraries)\b|\bplease\b|\bit(?:'s| is) (?:only|just)\b|\bjust (?:a|one|this)\b|\byou should\b|\byou really\b|\breally\b \?|\bat least\b|\bwhat if\b|\bcare about\b|\bwouldn't you\b|\bit would help\b|\bwe need\b|\bhelp (?:me|us) out\b/;
  /* one answer: kind is the question it answers, "tax" (is this a new tax?) or "paid" (are you a volunteer?) */
  function answer5(text, kind, st) {
    var t = norm(text), ta = t.replace(/\bfeel free\b/g, " "), head = real(t).slice(0, 10).join(" ");
    var paid = !NOT_PAID_RE.test(t) && PAID_RE.test(t), vol = VOL_RE.test(t) && !/\bnot (?:a |an )?volunteer/.test(t);
    var untrue = null, straight = false;
    if (kind === "tax") {
      if (NOTAX_RE.test(ta) || NO_RE.test(t)) untrue = "tax";
      else straight = YES_RE.test(head) || (IDK_RE.test(head) && SHOW_RE.test(t));
    } else {
      if (vol || (/^(?:(?:um+|uh+|oh|well|so) )*(?:yes|yeah|yep|yup|i am|sure am)\b/.test(t) && !paid)) untrue = "volunteer";
      else straight = paid || NO_RE.test(t) || /\bnot a volunteer\b/.test(t);
    }
    if (!untrue && (CLOSING.some(function (r) { return r.test(t); }))) untrue = "closing";
    var askAt = at(ASK_RE, t);
    var um = !untrue ? null : untrue === "tax" ? (NOTAX_RE.exec(ta) || NO_RE.exec(t)) : untrue === "volunteer" ? (VOL_RE.exec(t) || /^(?:(?:um+|uh+|oh|well|so) )*(?:yes|yeah|yep|yup|i am|sure am)\b/.exec(t)) : null;
    return { straight: straight && !untrue, untrue: untrue, untrueSaid: untrue === "closing" ? (untrueOf(t, text) || { said: "" }).said : around(untrue === "tax" ? ta : t, um, text), paid: paid, shows: SHOW_RE.test(t), ask: askAt >= 0 && !PRESS_RE.test(t), promise: PROMISE_RE.test(t), text: String(text || "").trim() };
  }
  function argues(text) { var t = norm(text); return ARGUE_RE.test(t) || ASK_RE.test(t) || PRESS_RE.test(t) || /\bsign\b/.test(t); }

  /* ---------------- the passersby: who says which line, and when a try is over ----------------
     talk(key, st) returns one try with one passerby. hear(piece) takes the canvasser's next words and returns
     { say: [...], end: true|false }: say lists the passerby's lines by the script's keys, with "@..." for something that
     happens on screen. An empty say with end false means the passerby is listening and the mic opens again.
     The rules every passerby keeps (the practice voter rules, playbook A4):
     - they answer what was actually said: a question asked in this piece gets its answer, whatever else is missing;
     - while the canvasser is still adding to what they have to say, the passerby listens. The script's nudge ("So, what do
       you need from me?") comes once, when a piece adds nothing new or when everything but the ask has been said;
     - a goodbye ends it at once, with no extra turn;
     - a try is over after four of the canvasser's lines at most (where the passerby has just asked the canvasser something,
       the answer to that is still heard);
     - grade() scores every piece together as one try. st.again marks the one more try a must or an untrue statement gives:
       there an untrue statement no longer stops the try, it just can't pass. */
  var SMALL_RE = /\bhow (?:are|r) (?:you|ya|u)(?: doing| today)?\b|\bhow(?:'s| is) it going\b|\bhow(?:'s| is| has) your day\b|\bhow you doing\b|\bhow's everything\b|\bhow are things\b/;
  /* a piece that is only a hello ("Hi there!"), or only small talk ("Hi, how are you?"): the passerby says hello back and waits */
  function fallback(text) {
    var t = norm(text), small = SMALL_RE.test(t), rest = words(small ? t.replace(SMALL_RE, " ") : t), g = greetLen(rest);
    var left = rest.slice(g).filter(function (w) { return !FILLER.test(w) && !/^(?:today|doing|there|this|fine|good|great|morning|afternoon|evening)$/.test(w); });
    if (left.length) return null;
    return small ? "fSmall" : g ? "fHi" : null;
  }
  function talk(key, st) {
    var CAP = 4, P = [], S = { pieces: P, said: [], end: false, phase: 0, asked: false }, join = function (a, b) { return P.slice(a || 0, b).join(" "); };
    /* more: the passerby has just said or done something the canvasser gets to answer, even past the fourth line */
    var out = function (say, end, more) { S.said = S.said.concat(say); if (end || (P.length >= CAP && !more)) S.end = true; return { say: say, end: S.end }; };
    var mine = function () { return P[P.length - 1] || ""; }, saidK = function (k) { return S.said.indexOf(k) >= 0; }, asksSign = function () { var x = norm(mine()); return SIGN_ASK.test(x) || ASK_RE.test(x); };
    /* the fallback lines: a hello or small talk gets one back (once each), a push to sign gets "I'll think about it." */
    var hello = function () { var f = fallback(mine()); return f && !saidK(f) ? out([f]) : null; }; /* said once: after that a bare hello is nothing new */
    /* does this piece add to the ask: being paid, the funders, what it does, how it's paid for, or what it is */
    var adds3 = function (text) { var x = norm(text); return PAID_RE.test(x) || FUND_RE.test(x) || HOURS_RE.test(x) || TAX_RE.test(x) || /\blibrar|\bpetition\b|\bballot\b|\bmeasure\b|\binitiative\b|\bact\b/.test(x); };
    var M = {
      /* lesson 1, step 6: the question, then why you ask. She answers the question when it has been asked, in whichever piece. */
      "1.marisol": {
        hear: function () {
          var tm = norm(mine()), g = grade1(P[0], join(1), st, P), rest = tm;
          questionSpans(tm, st).reverse().forEach(function (s) { rest = rest.slice(0, s[0]) + rest.slice(s[1]); });
          var whyNow = /\bregist|\bunregistered\b/.test(rest) || CHECK_RE.test(tm);
          if (!S.answered) {
            if (g.hits[0]) { S.answered = true; return g.why ? out(["yes"], true) : out(["ask"]); } /* told why already: she doesn't ask why */
            if (bye(mine())) return out(["fBye"], true);
            var hi = hello(); if (hi) return hi;
            if (fallback(mine())) return out([], true); /* hello again and nothing more: she walks on */
            if (whyNow && !S.waited) { S.waited = true; return out([]); } /* told why before any question: she listens */
            var voteQ = /\bvot(?:e|es|er|ers|ing)\b/.test(tm) && (/\?/.test(mine()) || /\b(?:do|are|have|did|will|would|can|could|were|is)\s+(?:you|ya|u)\b/.test(tm));
            if (!voteQ && !S.libbed && grade(mine(), st).topic) { S.libbed = true; return out(["lib"]); } /* told only what it's for: "Oh, the library? What do you need?" (rule 37b) */
            if (voteQ) { S.answered = true; return out(["askOther"]); } /* another question about voting: "Me? I vote in every election. Why do you ask?" */
            return out([]); /* anything else: she waits for the question (rule 37b) */
          }
          if (whyNow) return out(["yes"], true);
          if (bye(mine())) return out([], true);
          if (!S.waited2 && (questionSpans(tm, st).length || (real(tm).length <= 5 && countyRe(st).test(tm)))) { S.waited2 = true; return out([]); } /* finishing the question: she has answered it, and waits for the why */
          return out(["other"], true);
        },
        grade: function () { return grade1(P[0] || "", join(1), st, P); },
      },
      /* lesson 2. A passerby answers what was actually said (playbook A4), with only the script's lines:
         - asked if they're registered: they answer that, whatever else is missing;
         - told what it's for and asked nothing: they slow, look over and wait, once ("@look"). They were just told what it's
           for, so they don't ask, and nobody asked a question, so they don't answer one;
         - told nothing: they ask what this is, once. */
      "2.ben": {
        hear: function () {
          var g = grade(join(), st);
          if (g.first === "time") return out(["time"], true);
          if (bye(mine()) && (saidK("stop") || S.libbed || S.asked)) return out(["fBye"], true); /* a goodbye gets one back, first (the outside review, Nov 21) */
          if (g.topic && !g.regAsked && asksSign()) return out(["sure"], true); /* asked to sign, and told what for: he signs (the card still says he wasn't asked about LA County) */
          /* asked if he's registered: he says so. Told what it's for too, he'll sign, and that ends it; not told, he asks what this is,
             and the next words either tell him ("Sure, I'll sign.") or don't (he heads off with a kind word) */
          if (g.regAsked && !saidK("stop")) return g.topic && g.sig ? out(["stop", "sure"], true) : g.topic ? (S.libbed ? out(["stop"]) : (S.libbed = true, out(["stop", "lib"]))) : out(["stop", "other"]);
          if (saidK("stop")) return g.topic && g.sig ? out(["sure"], true) : g.topic && !S.libbed ? (S.libbed = true, out(["lib"])) : out(["fGo"], true); /* "Sure, I'll sign" only once signing came up (rule 37e) */
          if (bye(mine())) return out(["fBye"], true);
          var hi = hello(); if (hi) return hi;
          if (PRESS_RE.test(norm(mine())) && !saidK("fPush")) return out(["fPush"]);
          if (g.topic && !S.libbed) { S.libbed = true; return out(["lib"]); } /* told what it's for, now or after his own question: "Oh, the library? What do you need?" (rule 37b) */
          if (S.asked && !S.asked2 && !g.topic) { S.asked2 = true; return out(["other"]); } /* a dodge: his question once more, then he moves on */
          if (S.asked || S.libbed) return out(["fGo"], true);
          S.asked = true; return out(["other"]);
        },
        grade: function () { var g = grade(join(), st); g.quote = join(); return g; },
      },
      "2.stop": { /* Soo-jin and Luis. Asked with no word on what it's for, they answer and then ask: "Yes, I am." "Sorry, what's this for?" */
        hear: function () {
          var g = grade(join(), st);
          if (bye(mine()) && (S.said.indexOf("stop") >= 0 || S.libbed || S.asked)) return out(["fBye"], true); /* a goodbye gets one back, first */
          if (g.topic && !g.regAsked && asksSign()) return out(["sure"], true); /* asked to sign, and told what for: they sign */
          if (S.said.indexOf("stop") >= 0) return g.topic && g.sig ? out(["sure"], true) : g.topic && !S.libbed ? (S.libbed = true, out(["lib"])) : out(["fGo"], true); /* asked what it's for: told and asked to sign, they'll sign; not told, they go kindly */
          if (g.regAsked && (g.topic || S.asked || S.libbed)) return g.topic && g.sig ? out(["stop", "sure"], true) : g.topic ? (S.libbed ? out(["stop"]) : (S.libbed = true, out(["stop", "lib"]))) : out(["stop", "fGo"], true); /* "Sure, I'll sign" only once signing came up (rule 37e); told what it's for, they answer and wait for the ask */
          if (!g.regAsked && bye(mine())) return out(["fBye"], true);
          if (!g.regAsked) { var hi = hello(); if (hi) return hi; }
          if (g.regAsked) { S.asked = true; return out(["stop", "other"]); }
          if (PRESS_RE.test(norm(mine())) && !saidK("fPush")) return out(["fPush"]);
          if (g.topic && !S.libbed) { S.libbed = true; return out(["lib"]); } /* told what it's for, now or after their own question: "Oh, the library? What do you need?" */
          if (S.asked && !S.asked2 && !g.topic) { S.asked2 = true; return out(["other"]); } /* a dodge: the question once more, then they move on */
          if (S.asked || S.libbed) return out(["fGo"], true);
          S.asked = true; return out(["other"]);
        },
        grade: function () { var g = grade(join(), st); g.quote = join(); return g; },
      },
      "2.kayla": { /* she isn't registered, and says so once she's asked. What the canvasser says next is lesson 1 coming back. */
        hear: function () {
          if (S.phase === 1) return out(["bye"], true);
          if (grade(join(), st).regAsked) { S.phase = 1; S.mark = P.length; return out(["not"]); }
          if (bye(mine())) return out(["fBye"], true);
          var hi = hello(); if (hi) return hi;
          if (PRESS_RE.test(norm(mine())) && !saidK("fPush")) return out(["fPush"]);
          if (grade(join(), st).topic && !S.libbed) { S.libbed = true; return out(["lib"]); } /* told what it's for, she asks what you need (rule 37b) */
          if (!S.looked && !S.libbed) { S.looked = true; return out(["@look"]); }
          return out(["fGo"], true);
        },
        grade: function () { var n = S.phase === 1 ? S.mark : P.length, g = grade(join(0, n), st); g.quote = join(0, n); g.asked = S.phase === 1; g.from = S.phase === 1 && P.length > S.mark && letGo(join(S.mark)); return g; },
      },
      /* lesson 3 */
      "3.tanya": {
        hear: function () {
          var g = grade3(join(), st), gm = grade3(mine(), st), say = [];
          if (gm.dbl && !saidK("nodbl")) say.push("nodbl");
          if (gm.ask) return out(say.concat(["yes"]), true); /* asked to sign: she answers that */
          if (gm.press) return out(say.concat(saidK("fPush") ? [] : ["fPush"])); /* told to sign: "I'll think about it." */
          if (bye(mine())) return out(say.concat(["fBye"]), true);
          if (say.length) return out(say);
          var hi = hello(); if (hi) return hi;
          var allBut = g.hits[0] && g.hits[1] && g.hits[2];
          if (adds3(mine()) && !allBut) return out([]); /* still telling her: she listens */
          if (allBut && !S.asked) { S.asked = true; return out(["wait"]); } /* everything but the ask */
          if (!S.idle) { S.idle = true; return out([]); } /* nothing new: she waits a beat */
          if (!S.asked) { S.asked = true; return out(["wait"]); }
          return out([], true);
        },
        grade: function () { return grade3(join(), st); },
      },
      "3.marisol": { /* the opener and the ask, in as many pieces as they come. Every piece is scored together. */
        hear: function () {
          var g = grade3(join(), st), gm = grade3(mine(), st), o = grade(mine(), st), say = [];
          var tmn = norm(mine()), opPiece = !(PAID_RE.test(tmn) || FUND_RE.test(tmn) || TAX_RE.test(tmn) || gm.dbl || gm.ask);
          if (P.length === 1) S.openerOnly = opPiece;
          if (!S.opDone) { if (opPiece && (S.op || 0) < 2) S.op = (S.op || 0) + 1; else S.opDone = true; }
          var room = P.length < CAP + (S.op || 0); /* the opener is lesson 2's, in as many as two pieces; the ask that follows gets its four lines */
          if (o.regAsked && !saidK("reg")) say.push("reg");
          /* her first words: asked whether she's registered, she says so; told nothing about the petition, "Hi. What's this one for?" */
          if (P.length === 1 && !o.regAsked && S.openerOnly && !adds3(mine()) && !bye(mine())) { var f0 = fallback(mine()); if (f0 !== "fSmall") say.push("what"); else say.push("fSmall"); }
          else if (P.length === 1 && !o.regAsked && S.openerOnly && o.topic && !bye(mine())) say.push("lib"); /* told only what it's for: "Oh, the library? What do you need?" */
          if (gm.dbl && !saidK("dbl")) say.push("dbl");
          if (gm.ask) return out(say.concat(["yes"]), true);
          if (gm.press) return out(say.concat(saidK("fPush") ? [] : ["fPush"]), false, room);
          if (bye(mine()) && !say.length) return out(["fBye"], true);
          if (say.length) return out(say, false, room);
          var allBut = g.hits[0] && g.hits[1] && g.hits[2];
          if ((adds3(mine()) || (o.greet && !saidK("reg"))) && !allBut) return out([], false, room); /* a hello after she's answered is small talk: it gets her one beat (version 8: "How's your day going?" is a hello now) */
          if (allBut && !S.asked) { S.asked = true; return out(["wait"], false, room); }
          if (!S.idle) { S.idle = true; return out([], false, room); }
          if (!S.asked) { S.asked = true; return out(["wait"], false, room); }
          return out([], true);
        },
        grade: function () { var g = grade3(join(), st), o = grade(join(), st); g.from = o.greet && o.regAsked && o.county && o.timeAt < 0 && !o.void; g.opener = o; g.quote = P.length > 1 && !adds3(P[0]) ? join(1) : join(); return g; },
      },
      "3.luis": { /* he thinks he signed already */
        hear: function () {
          if (S.phase === 0) {
            var g = grade3(join(), st);
            if (g.heardTopic) { S.phase = 1; S.mark = P.length; return out(["signed"], false, true); }
            if (bye(mine())) return out(["fBye"], true);
            var hi = hello(); if (hi) return hi;
            if (!saidK("what")) return out(["what"]); /* "Hey. What's this one for?" */
            return out([]);
          }
          if (signAgain(mine())) { S.again = true; if (!saidK("again")) return out(["again"]); return out([], true); }
          if (letsGo(mine())) return out(["go"], true);
          return out([], true);
        },
        grade: function () { return { from: S.phase === 1 && !S.again && letsGo(join(S.mark)) }; },
      },
      /* lesson 4 */
      "4.anika": {
        hear: function () { var g = grade4(join(), st); if (g.self) return out(["self"], true); if (g.agree) return out(["agree"], true); if (bye(mine())) return out(["fBye"], true); if (!saidK("other")) return out(["other"]); return out([], true); }, /* neither: "So can you write it for me?" */
        grade: function () { var g = grade4(join(), st), hits = [g.print, g.addr, g.self, false]; return { hits: hits, n: hits.filter(Boolean).length, alt: [false, false, false, false], untrue: g.untrue, untrueSaid: g.untrueSaid, promise: g.promise, wrote: g.agree, text: join() }; },
      },
      "4.tanya": { /* before the pen: the double question, whenever it is asked, and her ask. Then who writes. Then the look before she leaves. */
        hear: function () {
          var gm = grade4(mine(), st), say = [];
          if (S.phase < 2) {
            if (gm.dbl && !saidK("nodbl")) { say.push("nodbl"); S.dbl = true; }
            if (S.phase === 0) { if (bye(mine()) && !gm.dbl && !gm.print && !gm.addr) return out(["fBye"], true); S.phase = 1; return out(say.concat([S.dbl ? "ask" : "ask0"]), false, true); } /* her ask follows the canvasser's first words */
            if (gm.self) { S.pen = "hers"; S.phase = 2; return out(say.concat(["self", "@fill", "set"]), false, true); }
            if (gm.agree) { S.pen = "yours"; S.phase = 2; return out(say.concat(["@fillOther", "set"]), false, true); }
            if (bye(mine())) return out(say.concat(["fBye"]), true);
            if (P.length >= CAP) { S.pen = "silent"; S.phase = 2; return out(say.concat(["@fill", "set"]), false, true); } /* nobody answered her: she writes it herself */
            return out(say, false, true); /* she waits for an answer about her address */
          }
          S.looks = (S.looks || 0) + 1;
          if (gm.gap) { S.gap = true; return out(["oops", "@sign", "there"].concat(S.pen === "yours" ? ["@glowAddr"] : []), true); }
          if (S.looks < 2 && !gm.fine && (gm.self || gm.dbl)) { /* said late: it does have to be her writing, and she did write it. She still waits for the look. */
            if (gm.self && S.pen === "silent") S.pen = "hers";
            return out(gm.dbl && !saidK("nodbl") ? ["nodbl"] : [], false, true);
          }
          return out(["good", "@glowSig"].concat(S.pen === "yours" ? ["@glowAddr"] : []), true);
        },
        grade: function () {
          var g = grade4(join(), st), hits = [g.print, g.addr, S.pen === "hers", !!S.gap];
          return { hits: hits, n: hits.filter(Boolean).length, alt: [false, false, S.pen !== "yours" && S.pen !== "hers", false], vague: [false, false, false, S.phase < 2], untrue: g.untrue, untrueSaid: g.untrueSaid, promise: g.promise, from: !!S.dbl, text: join() };
        },
      },
      /* lesson 5 */
      "5.hank": {
        hear: function () { var a = answer5(join(), "tax", st); return out([a.straight ? "straight" : "dodge"], true); },
        grade: function () { var a = answer5(join(), "tax", st), hits = [a.straight, a.shows, a.ask, false]; return { hits: hits, n: hits.filter(Boolean).length, alt: [!!a.untrue, false, false, false], untrue: a.untrue, untrueSaid: a.untrueSaid, promise: false, text: join() }; },
      },
      "5.ben": { /* "Are you a volunteer?", then the line if he signs */
        hear: function () {
          if (S.phase === 0) {
            var a = answer5(join(), "paid", st), am = answer5(mine(), "paid", st), say = [];
            if (a.untrue) { S.untrue = a.untrue; S.untrueSaid = a.untrueSaid; if (!st.again) return out([], true); }
            if (am.paid && !saidK("paid")) say.push("paid");
            if (am.ask) { S.phase = 1; S.mark = P.length; return out(say.concat(["yes", "@hint"]), false, true); }
            if (bye(mine())) return out(say.concat(["fBye"]), true);
            if (say.length) return out(say);
            if (!a.straight && !a.untrue && !S.again1) { S.again1 = true; return out(["dodge"]); } /* his question wasn't answered: "Sorry, but are you a volunteer or not?" */
            if (a.straight && !S.noask) { S.noask = true; return out(["noask"]); } /* answered, and no ask: "Okay. Is there something you want me to sign?" */
            return out([]); /* he listens */
          }
          return out([], true);
        },
        grade: function () {
          var a = answer5(join(0, S.phase === 1 ? S.mark : undefined), "paid", st), l = S.phase === 1 ? grade4(join(S.mark), st) : null;
          return { straight: a.straight, shows: a.shows, ask: a.ask, untrue: S.untrue || a.untrue, untrueSaid: S.untrueSaid || a.untrueSaid, promise: a.promise || !!(l && l.promise), from: !!(l && l.print && l.addr), text: join() };
        },
      },
      "5.pat": { /* "Is this a new tax?", a no, and letting it go */
        hear: function () {
          if (S.phase === 0) {
            var a = answer5(join(), "tax", st), am = answer5(mine(), "tax", st);
            if (a.untrue) { S.untrue = a.untrue; S.untrueSaid = a.untrueSaid; if (!st.again) return out(["dodge"], true); } /* "That isn't what I asked. Is it a new tax or not?" */
            if (am.ask || S.nudged) { S.phase = 1; S.mark = P.length; S.straight = a.straight; S.askedOnce = a.ask; return out((a.straight ? ["no1"] : []).concat(["no2"]), false, true); }
            if (bye(mine())) return out(["fBye"], true);
            if (!a.straight && !a.untrue && !a.shows && !S.again1) { S.again1 = true; return out(["dodge"]); } /* her question wasn't answered: "That isn't what I asked. Is it a new tax or not?" */
            if ((a.straight && a.shows) || S.listened || P.length >= 3) { S.nudged = true; return out(["wait"]); } /* answered and shown, and no ask */
            S.listened = true; return out([]); /* mid-answer: she listens */
          }
          var tail = join(S.mark);
          if (argues(tail)) { S.argued = true; S.askedAgain = ASK_RE.test(norm(tail)) && !ARGUE_RE.test(norm(tail)); return out(["argue"], true); }
          S.let = THANKS.test(norm(tail)) && words(norm(tail)).length > 0;
          return out(S.let ? [S.straight ? "thanks" : "thanksDodge"] : [], true);
        },
        grade: function () {
          var a = answer5(join(0, S.phase === 1 ? S.mark : undefined), "tax", st);
          return { straight: a.straight, shows: a.shows, ask: !!S.askedOnce || (S.phase === 0 && a.ask), untrue: S.untrue || a.untrue, untrueSaid: S.untrueSaid || a.untrueSaid, promise: a.promise, let: !!S.let && !S.argued, argued: !!S.argued, askedAgain: !!S.askedAgain, heardNo: S.phase === 1, text: join() };
        },
      },
    };
    var m = M[key] || M[{ "2.soojin": "2.stop", "2.luis": "2.stop" }[key]];
    if (!m) throw new Error("no such passerby: " + key);
    S.hear = function (piece) { if (S.end) return { say: [], end: true }; P.push(String(piece || "").trim()); return m.hear(); };
    /* lesson 2: a passerby who walked on before the opener landed (Robert, Nov 20, 8:23 AM). Part 4 is about not taking their time,
       so too slow misses it, with its own line; the try can't count as all four. */
    S.walkedOn = function () { S.walked = true; S.end = true; };
    S.grade = function () { var g = m.grade(); if (S.walked && g && g.hits) { g.walked = true; g.hits = g.hits.slice(); g.hits[3] = false; g.n = g.hits.filter(Boolean).length; g.miss = (g.miss || [null, null, null, null]).slice(); g.miss[3] = "Slow"; } return g; };
    return S;
  }

  /* lesson 5's score: parts 1 to 3 count with either passerby, part 4 is scored with Pat */
  function score5(ben, pat) {
    var untrue = ben.untrue || (pat && pat.untrue) || null, hits = [(ben.straight || !!(pat && pat.straight)) && !untrue, ben.shows || !!(pat && pat.shows), ben.ask || !!(pat && pat.ask), !!(pat && pat.let)];
    return { hits: hits, n: hits.filter(Boolean).length, alt: [!!untrue, false, false, !!(pat && pat.askedAgain)], vague: [false, false, false, !(pat && pat.argued)], untrue: untrue, untrueSaid: (ben.untrue ? ben.untrueSaid : pat && pat.untrue ? pat.untrueSaid : "") || "", promise: ben.promise || !!(pat && pat.promise), from: ben.from, text: [ben.text, pat ? pat.text : ""].filter(Boolean).join(" ") };
  }
  /* lesson 2's score: the best of the openers, with "said sorry" told apart from "asked for a minute" */
  function score2(tries) {
    var k = best(tries), pick = k >= 0 ? k : (function () { var b = -1; tries.forEach(function (x, i) { if (x && (b < 0 || x.n >= tries[b].n)) b = i; }); return b; })(), g = tries[pick] || { hits: [false, false, false, false], n: 0 };
    return { hits: g.hits.slice(), n: g.n, pick: pick, alt: (g.alt || [false, !!g.topicOnly, false, sorry(g)]).slice(), vague: (g.vague || [false, false, false, false]).slice(), miss: (g.miss || [null, null, null, null]).slice(), untrue: g.untrue || null, promise: !!g.promise, text: g.text || "" };
  }
  function sorry(g) { return !!(g && g.timeSaid && /sorry|pardon|apolog|excuse|bother/.test(g.timeSaid)); }
  /* the musts a scored try missed, as part numbers from 0 */
  function mustsMissed(lesson, hits) { return ({ 3: [0, 1], 4: [2], 5: [0] }[lesson] || []).filter(function (i) { return !hits[i]; }); }

  return { norm: norm, grade: grade, grade1: grade1, grade3: grade3, grade4: grade4, answer5: answer5, misheard: misheard, letGo: letGo, letsGo: letsGo, signAgain: signAgain, argues: argues, bye: bye, untrueOf: function (text) { return untrueOf(norm(text), text); },
    best: best, tipFor: tipFor, pauseMs: pauseMs, talk: talk, score2: score2, score5: score5, sorry: sorry, mustsMissed: mustsMissed };
})();
