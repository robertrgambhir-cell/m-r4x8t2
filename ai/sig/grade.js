/* The California signature course: the scripted graders and the passersby's side of each spoken try.

   The rules are each lesson's own "Counts" and "Doesn't count" table in claude/signature-curriculum-claude-v2.md, and
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
  ];
  var COST = /\bfree\b|\bno (?:new |more |extra )?tax(?:es)?\b|\b(?:won't|wont|will not|doesn't|doesnt|does not|isn't going to|not going to) cost\b|\b(?:no|zero) cost\b|\bwithout (?:raising|new|any) tax(?:es)?\b|\bnot a tax\b/;
  /* a statement about being registered isn't the question */
  var STATEMENT = /\b(?:have to be|has to be|need to be|needs to be|must be|should be|gotta be|got to be|only|if you're|if you are|if they're|who are|who's|who is|i'm|i am|we're|we are|not|looking for|for)$/;
  var MID = /\b(?:um+|uh+|uhm|er+|erm|hmm+|ah|and|but|so|or|because|cause|i|i'?m|i am|my|me|we|we'?re|our|the|a|an|to|for|with|of|in|on|at|about|from|like|just|that|this|is|are|was|am|be|it'?s|you|your|who|what|if|then|also|really|very|here|registered|vote|la|los|angeles|library|longer|hi|hello|hey)$/i;
  var esc = function (s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); };

  /* lower case, straight quotes, "L.A." as "la", "?" kept as its own word, everything else that isn't a letter dropped */
  function norm(s) {
    return String(s == null ? "" : s).toLowerCase()
      .replace(/[‘’ʼ`]/g, "'").replace(/[“”]/g, '"').replace(/&/g, " and ")
      .replace(/\bl\.\s?a\.?(?=[\s,.!?]|$)/g, "la").replace(/\bl a(?= county\b)/g, "la")
      .replace(/[^a-z0-9'? ]+/g, " ").replace(/\?/g, " ? ").replace(/(^|\s)'+|'+(?=\s|$)/g, "$1").replace(/\s+/g, " ").trim();
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
      if (STATEMENT.test(before) || /\b(?:have|has|need|needs|must|should|got|gotta) to be$|\bonly(?: [a-z']+){0,2}$/.test(last4)) continue; /* "you have to be registered", "only registered voters count" */
      var start = m.index, cue = before.match(/(?:\b(?:are|r|is|were) )?(?:\b(?:you|ya|u|y'all|yall|you all|you guys|you folks|you two|you both|anyone|anybody|everyone|either of you)\b)(?: (?:a|an|all|both|currently|already|still|guys|folks))*$/);
      if (cue) start = before.length - cue[0].length;
      var after = t.slice(m.index + m[0].length), end = m.index + m[0].length;
      var tail = after.match(/^(?: (?:to vote|voters?|voting|to vote here|here))+/);
      if (tail) end += tail[0].length;
      /* the county, within a few words after "registered ..." or just before the question */
      var county = false, cm = cre.exec(t.slice(end));
      if (cm && t.slice(end, end + cm.index).trim().split(" ").filter(Boolean).length <= 5 && t.slice(end, end + cm.index).indexOf("?") < 0) { county = true; end = end + cm.index + cm[0].length; }
      else { var pre = t.slice(0, start), pm = pre.match(new RegExp("(?:\\bin )?" + cre.source + "(?: [a-z']+){0,2} ?$")); if (pm) { county = true; start = pre.length - pm[0].length; } }
      var q = { at: start, end: end, county: county };
      if (!best || (q.county && !best.county)) best = q;
    }
    return best;
  }

  /* grade one opener (all of its pieces joined): the four parts and what the passerby would have heard */
  function grade(text, st) {
    var t = norm(text), ws = words(t), g = greetLen(ws), q = question(t, st), lre = labelRe(st);
    var tm = TIME_RE.exec(t), timeAt = tm ? tm.index : -1;
    var libAny = new RegExp("\\b" + LIB + "\\b").test(t) || /\bbranch(?:es)?\b(?: [a-z']+){0,3}? (?:hours?|open)\b/.test(t) || (lre ? lre.test(t) : false);
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
      if (seen <= g || FILLER.test(w) || (q && here >= q.at && here < q.end)) return;
      explWords += 1;
    });
    var long = explWords > 13; /* "runs past about 12 words": one word of grace for a recognizer's extra word */
    var hits = [g > 0, libAny && !untrue && !long, !!(q && q.county), timeAt < 0];
    return {
      hits: hits, n: hits.filter(Boolean).length, text: String(text || "").trim(), norm: t,
      greet: g > 0, topic: libAny, long: long, explWords: explWords, untrue: untrue, untrueSaid: um, promise: promise,
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
  /* how long quiet has to last before a passerby answers (playbook A4): 1.2 seconds after a line that sounds finished,
     2.8 when it stops mid-thought or is under three words. The app never cuts a canvasser off. */
  function pauseMs(text) {
    var t = norm(text), last = t.replace(/[ ?]+$/, "");
    return MID.test(last) || real(t).length < 3 ? 2800 : 1200;
  }
  function tipFor(hits) { for (var i = 0; i < 4; i += 1) if (!hits[i]) return i; return -1; }
  var at = function (re, t) { var m = re.exec(t); return m ? m.index : -1; };
  var THANKS = /\bthank|\bno problem\b|\bno worries\b|\bnot a problem\b|\bthat's (?:ok|okay|fine|all right|alright|cool)\b|\bok(?:ay)?\b|\ball good\b|\bno sweat\b|\bgot it\b|\ball right\b|\balright\b|\bhave a (?:good|great|nice|wonderful|lovely)\b|\btake care\b|\b(?:good)?bye\b|\bsee you\b|\bfair enough\b|\bunderstood\b|\bi understand\b|\bappreciate\b/;

  /* ---------------- lesson 1: the question, and why you ask ---------------- */
  var CHECK_RE = /\b(?:county|counties|elections? office|registrar|clerk|state|they|officials?)\b(?: [a-z']+){0,4}? (?:check|checks|checking|checked|verif(?:y|ies|ied|ying)|looks? (?:up|at|over)|go(?:es)? (?:through|over)|reviews?|compares?|match(?:es)?|validates?)\b|\b(?:thrown|tossed|kicked|struck|taken) out\b|\bthrow(?:s|n)? (?:it |them |those |these |yours |that |the [a-z]+ )?(?:out|away)\b|\btoss(?:es|ed)?\b|\breject(?:s|ed)?\b|\bdisqualif|\b(?:checked|verified) by\b|\b(?:is|gets|get|are) (?:checked|verified)\b|\bchecks? (?:every|each|all)\b/;
  function grade1(q, a, st) {
    var tq = norm(q), ta = norm(a), Q = question(tq, st), all = (tq + " " + ta).trim();
    var p3 = /\bregist/.test(ta), p4 = CHECK_RE.test(ta), promise = PROMISE_RE.test(all);
    var hits = [!!Q, !!(Q && Q.county), p3, p4];
    return { hits: hits, n: hits.filter(Boolean).length, alt: [false, false, false, false], promise: promise, untrue: null, why: p3 || p4, text: [q, a].filter(Boolean).join(" ") };
  }

  /* ---------------- lesson 3: the ask ---------------- */
  var PAID_RE = /\b(?:i'?m|i am|we'?re|we are) (?:a |an |also |actually |being |getting |all )*paid\b|\bi (?:do )?(?:get|got) paid\b|\bpaid to (?:gather|collect|get|do|be|circulat|stand|work|ask)|\bpaid (?:signature |petition )?(?:gatherer|canvasser|circulator|collector|staff|staffer|worker|employee)\b|\b(?:they|the campaign|the firm|the company|the drive)(?: do| does)? (?:pays?|is paying|are paying) me\b|\bthis is (?:my|a paid) job\b|\bit'?s (?:my|a paid) job\b|\bi'?m (?:on the clock|compensated)\b/;
  var NOT_PAID_RE = /\b(?:not|never|don't|do not|aren't|isn't)(?: [a-z']+)? (?:being |getting |get )?paid\b|\bunpaid\b/;
  var VOL_RE = /\b(?:i'?m|i am|we'?re|we are|i'?m just|we'?re all) (?:a |an |just a |only a |just |all |actually a )?volunteer(?:s|ing)?\b|\bi (?:just )?volunteer\b|\bas a volunteer\b/;
  var FUND_RE = /\bfunders?\b|\bfunding\b|\bfunded by\b|\bwho(?:'s| is| are)? (?:paying|behind|funding|backing)\b|\bdonors?\b|\bbackers?\b|\bwho pays for\b/;
  var ASK_RE = /\b(?:will|would|can|could|won't|wouldn't) (?:you|ya|u)(?: (?:please|be willing to|like to|want to|be able to|mind|care to|go ahead and|add your name and))* sign(?:ing)?\b|\b(?:want|wanna|like|care|willing|ready|able|happy) (?:to )?sign\b|\bwanna sign\b|\b(?:can|could|may|might) i (?:get|have|grab) (?:your|a|ur) (?:signature|autograph|john hancock)\b|\b(?:get|have|need) your signature\b|\badd your (?:name|signature)\b|\bput your (?:name|signature)\b|\bhow about (?:a|your) signature\b|\byour signature \?/;
  var PRESS_RE = /\byou (?:have|need|got|gotta|ought|are going) to sign\b|\byou (?:must|should|better|gotta) sign\b|\bevery(?:body|one)(?:'s| is| else is| has| else has) sign|\bjust sign\b|\bsign it already\b/;
  var DBL_RE = /\b(?:have|did|haven't|didn't|had|has) (?:you|ya|u|he|she)(?: guys| already| ever| maybe| possibly)* (?:sign|signed|seen and signed)\b|\b(?:already|previously) sign(?:ed)?\b|\bsign(?:ed)? (?:this|it|that|one|the [a-z]+)(?: [a-z']+){0,3} (?:already|before|yet)\b|\bsign(?:ed)? (?:already|before)\b|\bfirst time (?:signing|seeing)\b/;
  var HOURS_RE = /\b(?:longer|more|extended|extra|later|additional|added|expanded) (?:[a-z']+ ){0,3}?hours\b|\bhours\b(?: [a-z']+){0,4}? (?:longer|later)\b|\b(?:evenings?|weekends?|nights?)\b(?: [a-z']+){0,4}? (?:hours|open)\b|\bopen (?:later|longer|more|late|evenings?|weekends?|nights?|on (?:evenings|weekends|nights))\b|\bstays? open\b|\bkeep(?:s|ing)?\b(?: [a-z']+){0,4}? open (?:later|longer|late|more|evenings?|weekends?|nights?)\b|\b(?:extends?|expands?|lengthens?)\b(?: [a-z']+){0,4}? hours\b/;
  var TAX_RE = /\btax(?:es|ed)?\b/;
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
      untrue: untrue, promise: promise, heardTopic: /\blibrar|\bpetition\b|\bballot\b|\bmeasure\b|\bsignatures?\b|\bhours\b|\binitiative\b|\bact\b/.test(t),
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
  var FINE_RE = /\b(?:looks?|look|that's|you're|we're|everything's|everything is|it's)(?: all)? (?:good|great|fine|perfect|set|done|complete)\b|\ball set\b|\bgood to go\b|\bthat's it\b|\bperfect\b/;
  function grade4(text, st) {
    var t = norm(text), self = SELF_RE.test(t), agree = !self && AGREE_RE.test(t.replace(/^(?:um+|uh+|oh|well|so) /, ""));
    var gap = GAP_RE.test(t) && !(FINE_RE.test(t) && !/\b(?:but|except|just|still|one more|forgot|missing|blank|empty|need|didn't|haven't|skipped|without)\b/.test(t));
    return { print: PRINT_RE.test(t), addr: ADDR_REG_RE.test(t) && !/\bmailing address\b/.test(t), self: self, agree: agree, gap: gap, fine: FINE_RE.test(t) || THANKS.test(t), dbl: DBL_RE.test(t), promise: PROMISE_RE.test(t) };
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
    return { straight: straight && !untrue, untrue: untrue, paid: paid, shows: SHOW_RE.test(t), ask: askAt >= 0 && !PRESS_RE.test(t), promise: PROMISE_RE.test(t), text: String(text || "").trim() };
  }
  function argues(text) { var t = norm(text); return ARGUE_RE.test(t) || ASK_RE.test(t) || PRESS_RE.test(t) || /\bsign\b/.test(t); }

  /* ---------------- the passersby: who says which line, and when a try is over ----------------
     talk(key, st) returns one try with one passerby. hear(piece) takes the canvasser's next words and returns
     { say: [...], end: true|false }: say lists the passerby's lines by the script's keys, with "@..." for something that
     happens on screen. A passerby answers what was actually said, asks for a missing part once and never more, and a
     try is over after four of the canvasser's lines at most. grade() scores the pieces together as one try. */
  function talk(key, st) {
    var P = [], S = { pieces: P, said: [], end: false, phase: 0, asked: false }, join = function (a, b) { return P.slice(a || 0, b).join(" "); };
    var out = function (say, end) { S.said = S.said.concat(say); if (end || P.length >= 4) S.end = true; return { say: say, end: S.end }; };
    var M = {
      /* lesson 1, step 6: the question, then why you ask */
      "1.marisol": {
        hear: function () { if (P.length === 1) return out(["ask"]); var g = grade1(P[0], join(1), st); return out([g.why ? "yes" : "other"], true); },
        grade: function () { return grade1(P[0] || "", join(1), st); },
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
          if (g.regAsked) return out(["stop"], true);
          if (S.asked || S.looked) return out(["@go"], true);
          if (g.topic) { S.looked = true; return out(["@look"]); }
          S.asked = true; return out(["other"]);
        },
        grade: function () { var g = grade(join(), st); g.quote = join(); return g; },
      },
      "2.stop": { /* Soo-jin and Luis. Asked with no word on what it's for, they answer and then ask: "Yes, I am, dear." "Sorry, what's this for?" */
        hear: function () {
          var g = grade(join(), st);
          if (S.said.indexOf("stop") >= 0) return out([], true);
          if (g.regAsked && (g.topic || S.asked || S.looked)) return out(["stop"], true);
          if (g.regAsked) { S.asked = true; return out(["stop", "other"]); }
          if (S.asked || S.looked) return out(["@go"], true);
          if (g.topic) { S.looked = true; return out(["@look"]); }
          S.asked = true; return out(["other"]);
        },
        grade: function () { var g = grade(join(), st); g.quote = join(); return g; },
      },
      "2.kayla": { /* she isn't registered, and says so once she's asked. What the canvasser says next is lesson 1 coming back. */
        hear: function () {
          if (S.phase === 1) return out(["bye"], true);
          if (grade(join(), st).regAsked) { S.phase = 1; S.mark = P.length; return out(["not"]); }
          if (!S.looked) { S.looked = true; return out(["@look"]); }
          return out(["@go"], true);
        },
        grade: function () { var n = S.phase === 1 ? S.mark : P.length, g = grade(join(0, n), st); g.quote = join(0, n); g.asked = S.phase === 1; g.from = S.phase === 1 && P.length > S.mark && letGo(join(S.mark)); return g; },
      },
      /* lesson 3 */
      "3.tanya": {
        hear: function () { var g = grade3(join(), st), say = []; if (g.dbl && S.said.indexOf("nodbl") < 0) say.push("nodbl"); if (g.ask) return out(say.concat(["yes"]), true); if (!S.asked) { S.asked = true; return out(say.concat(["wait"])); } return out(say, true); },
        grade: function () { return grade3(join(), st); },
      },
      "3.marisol": { /* the opener, then the stop that is scored */
        hear: function () {
          if (P.length === 1) return out(["reg"]);
          var g = grade3(join(1), st), say = [];
          if (g.dbl && S.said.indexOf("dbl") < 0) say.push("dbl");
          if (g.ask) return out(say.concat(["yes"]), true);
          if (say.length) return out(say);
          if (!S.asked) { S.asked = true; return out(["wait"]); }
          return out([], true);
        },
        grade: function () { var g = grade3(join(1), st), o = grade(P[0] || "", st); g.from = o.n >= 3 && !o.void; g.opener = o; return g; },
      },
      "3.luis": { /* he thinks he signed already */
        hear: function () {
          if (S.phase === 0) { var g = grade3(join(), st); if (g.heardTopic || P.length >= 2) { S.phase = 1; S.mark = P.length; return out(["signed"]); } return out([]); }
          var mine = P[P.length - 1];
          if (signAgain(mine)) { S.again = true; if (S.said.indexOf("again") < 0) return out(["again"]); return out([], true); }
          if (letsGo(mine)) return out(["go"], true);
          return out([], true);
        },
        grade: function () { return { from: S.phase === 1 && !S.again && letsGo(join(S.mark)) }; },
      },
      /* lesson 4 */
      "4.anika": {
        hear: function () { var g = grade4(join(), st); if (g.self) return out(["self"], true); if (g.agree) return out(["agree"], true); if (!S.asked) { S.asked = true; return out([]); } return out([], true); },
        grade: function () { var g = grade4(join(), st), hits = [g.print, g.addr, g.self, false]; return { hits: hits, n: hits.filter(Boolean).length, alt: [false, false, false, false], untrue: null, promise: g.promise, wrote: g.agree, text: join() }; },
      },
      "4.tanya": { /* before the pen: the double question and her ask. Then who writes. Then the look before she leaves. */
        hear: function () {
          var mine = P[P.length - 1], g = grade4(mine, st);
          if (S.phase === 0) { S.phase = 1; S.dbl = grade4(join(), st).dbl; return out((S.dbl ? ["nodbl"] : []).concat(["ask"])); }
          if (S.phase === 1) {
            if (g.self) { S.pen = "hers"; S.phase = 2; S.mark = P.length; return out(["self", "@fill", "set"]); }
            if (g.agree) { S.pen = "yours"; S.phase = 2; S.mark = P.length; return out(["@fillOther", "set"]); }
            if (!S.asked && P.length < 3) { S.asked = true; return out([]); }
            S.pen = "silent"; S.phase = 2; S.mark = P.length; return out(["@fill", "set"]);
          }
          S.gap = grade4(join(S.mark), st).gap;
          if (S.gap) return out(["oops", "@sign", "there"].concat(S.pen === "yours" ? ["@glowAddr"] : []), true);
          return out(["good", "@glowSig"].concat(S.pen === "yours" ? ["@glowAddr"] : []), true);
        },
        grade: function () {
          var g = grade4(join(), st), hits = [g.print, g.addr, S.pen === "hers", !!S.gap];
          return { hits: hits, n: hits.filter(Boolean).length, alt: [false, false, S.pen === "silent" || !S.pen, false], untrue: null, promise: g.promise, from: !!S.dbl, text: join() };
        },
      },
      /* lesson 5 */
      "5.hank": {
        hear: function () { var a = answer5(join(), "tax", st); return out([a.straight ? "straight" : "dodge"], true); },
        grade: function () { var a = answer5(join(), "tax", st), hits = [a.straight, a.shows, a.ask, false]; return { hits: hits, n: hits.filter(Boolean).length, alt: [!!a.untrue, false, false, false], untrue: null, promise: false, text: join() }; },
      },
      "5.ben": { /* "Are you a volunteer?", then the line if he signs */
        hear: function () {
          if (S.phase === 0) {
            var a = answer5(join(), "paid", st), say = [];
            if (a.untrue) { S.untrue = a.untrue; return out([], true); }
            if (a.paid && S.said.indexOf("paid") < 0) say.push("paid");
            if (a.ask) { S.phase = 1; S.mark = P.length; return out(say.concat(["yes", "@hint"])); }
            if (P.length >= 2) return out(say, true);
            return out(say);
          }
          return out([], true);
        },
        grade: function () {
          var a = answer5(join(0, S.phase === 1 ? S.mark : undefined), "paid", st), l = S.phase === 1 ? grade4(join(S.mark), st) : null;
          return { straight: a.straight, shows: a.shows, ask: a.ask, untrue: S.untrue || a.untrue, promise: a.promise || !!(l && l.promise), from: !!(l && l.print && l.addr), text: join() };
        },
      },
      "5.pat": { /* "Is this a new tax?", a no, and letting it go */
        hear: function () {
          if (S.phase === 0) {
            var a = answer5(join(), "tax", st);
            if (a.untrue) { S.untrue = a.untrue; return out([], true); }
            if (a.ask || S.asked) { S.phase = 1; S.mark = P.length; S.straight = a.straight; S.askedOnce = a.ask; return out((a.straight ? ["no1"] : []).concat(["no2"])); }
            S.asked = true; return out(["wait"]);
          }
          var mine = join(S.mark);
          if (argues(mine)) { S.argued = true; return out(["argue"], true); }
          S.let = THANKS.test(norm(mine)) && real(norm(mine)).length > 0;
          return out(S.let && S.straight ? ["thanks"] : [], true);
        },
        grade: function () {
          var a = answer5(join(0, S.phase === 1 ? S.mark : undefined), "tax", st);
          return { straight: a.straight, shows: a.shows, ask: !!S.askedOnce || (S.phase === 0 && a.ask), untrue: S.untrue || a.untrue, promise: a.promise, let: !!S.let && !S.argued, argued: !!S.argued, text: join() };
        },
      },
    };
    var m = M[key] || M[{ "2.soojin": "2.stop", "2.luis": "2.stop" }[key]];
    if (!m) throw new Error("no such passerby: " + key);
    S.hear = function (piece) { if (S.end) return { say: [], end: true }; P.push(String(piece || "").trim()); return m.hear(); };
    S.grade = m.grade;
    return S;
  }

  /* lesson 5's score: parts 1 to 3 count with either passerby, part 4 is scored with Pat */
  function score5(ben, pat) {
    var untrue = ben.untrue || (pat && pat.untrue) || null, hits = [(ben.straight || !!(pat && pat.straight)) && !untrue, ben.shows || !!(pat && pat.shows), ben.ask || !!(pat && pat.ask), !!(pat && pat.let)];
    return { hits: hits, n: hits.filter(Boolean).length, alt: [!!untrue, false, false, false], untrue: untrue, promise: ben.promise || !!(pat && pat.promise), from: ben.from, text: [ben.text, pat ? pat.text : ""].filter(Boolean).join(" ") };
  }
  /* lesson 2's score: the best of the openers, with "said sorry" told apart from "asked for a minute" */
  function score2(tries) {
    var k = best(tries), pick = k >= 0 ? k : (function () { var b = -1; tries.forEach(function (x, i) { if (x && (b < 0 || x.n >= tries[b].n)) b = i; }); return b; })(), g = tries[pick] || { hits: [false, false, false, false], n: 0 };
    return { hits: g.hits.slice(), n: g.n, pick: pick, alt: [false, false, false, sorry(g)], untrue: g.untrue || null, promise: !!g.promise, text: g.text || "" };
  }
  function sorry(g) { return !!(g && g.timeSaid && /sorry|pardon|apolog|excuse|bother/.test(g.timeSaid)); }
  /* the musts a scored try missed, as part numbers from 0 */
  function mustsMissed(lesson, hits) { return ({ 3: [0, 1], 4: [2], 5: [0] }[lesson] || []).filter(function (i) { return !hits[i]; }); }

  return { norm: norm, grade: grade, grade1: grade1, grade3: grade3, grade4: grade4, answer5: answer5, misheard: misheard, letGo: letGo, letsGo: letsGo, signAgain: signAgain, argues: argues,
    best: best, tipFor: tipFor, pauseMs: pauseMs, talk: talk, score2: score2, score5: score5, sorry: sorry, mustsMissed: mustsMissed };
})();
