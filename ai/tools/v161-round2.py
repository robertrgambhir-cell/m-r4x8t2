"""Version 161 (Nov 6, 2026): round 2, the product itself. Built on version 160 (commit 5db51fe).
Robert's round 2 brief: make the spoken practice trustworthy, make the value obvious in the first minute, one visual system,
a simpler phone experience and a demo that holds up. The one-lesson-a-day rule, five-minute lessons, the ten-lesson journey
and the four tabs stay as they are (Robert, Nov 5, 10:33 PM PT).
1. The evidence grader. A part is credited only when the volunteer's own words carry it. "Do you have a minute to talk about
   the election?" no longer counts as "Election Day is Tuesday"; naming Maya is not the same as volunteering for her; a greeting
   with nothing in it earns nothing for "didn't ask for a minute"; spoken questions count without a question mark; "How are
   you?" is not a question about how they'll vote. Each credited part shows the words that earned it, and a near miss says
   what was missing.
2. Feedback that shows its work: the 1st intro card and the feedback card quote the volunteer's words for each part.
3. A typed fallback: when the microphone is blocked or busy, "Type it instead" opens the keyboard for the rest of the visit.
4. Learn as one path: two courses as readable rows (today's lesson opens in place), not ten small tiles.
5. Progress joins the system: the same headings and buttons as the rest of the app, and both courses on one strip.
6. Today, first visit: what the five minutes hold (knock, say it out loud, see what landed) on the lesson card.
7. Investor preview on a phone (?tour): a labeled tour of the nine guide stops with sample progress that is never saved.
8. The guide's copy says what is real: no text is sent; the checks quote the words.
Usage: python3 v161.py in_app.html out_app.html"""
import sys

APP, OUT = sys.argv[1:3]
s = open(APP, encoding="utf-8").read()


def swap(old, new, n=1):
    global s
    got = s.count(old)
    assert got == n, (got, n, old[:90])
    s = s.replace(old, new)


def cut(start, end):
    """replace the text from start up to (not including) end"""
    global s
    a = s.index(start)
    b = s.index(end, a)
    assert s.count(start) == 1
    return a, b


# ---------- 1. the evidence grader ----------
swap('const has = (t, words) => words.some((w) => t.includes(w));',
     'const has = (t, words) => (Array.isArray(words) ? words.some((w) => t.includes(w)) : words.test(t)); /* version 161: a list of words, or a pattern that needs the whole phrase */\n'
     'const wcount = (t) => String(t || "").trim().split(" ").filter(Boolean).length;')
swap('const MINUTE_ASK = ["a minute", "a second", " a sec ", "a moment", "bad time", "good time to talk", "busy right now", "quick minute"];',
     '/* version 161: asking for their time, in the ways people really ask */\n'
     "const MINUTE_ASK = /\\ba (?:minute|moment|second|sec|quick minute)\\b|\\bquick (?:minute|second|sec)\\b|\\b(?:bad|good|okay|ok|better) time\\b|\\bbusy right now\\b|\\bare you busy\\b|\\b(?:got|have) (?:some |a little |any )?time (?:to talk|for)\\b|\\bdo you have (?:some |any )?time\\b|\\bcan i (?:talk to|ask) you\\b|\\bmay i (?:talk|ask)\\b|\\bmind if i\\b|\\bcan i steal\\b|\\bis now (?:okay|ok|good|fine)\\b/;")
swap('const WHY1 = ["election", "tuesday", "ballot", "polls"];',
     '/* version 161 (round 2 review): part 3 is when the election is. "Talk about the election?" names it without saying when, so it is a near miss */\n'
     "const WHY1 = /\\belection day\\b|\\btuesday\\b|\\bpolls (?:open|close|are open)\\b|\\belection(?: is|'s)? (?:on|in|this|next|coming|soon|tomorrow|almost|right around)\\b/;\n"
     "const WHY_NEAR = /\\belections?\\b|\\bballots?\\b|\\bvot(?:e|es|ing)\\b|\\bpolls?\\b/;")
swap('const CAMPW = ["maya", "kaur", "campaign", "senate"];',
     '/* version 161: part 2 is volunteering for Maya Kaur. Her name after a cue (volunteering for, with, on behalf of) or before campaign or team;\n'
     '   "voting for Maya" and "not with Maya" do not count, and "the campaign" without her name is a near miss */\n'
     "const CAMP_RE = /\\b(?:volunteer(?:ing)?|campaign(?:ing)?|canvass(?:ing)?|knocking (?:doors )?|with|for|from|on behalf of|supporting|team)\\b(?: [a-z'.]+){0,3}? (?:maya|kaur)\\b|\\b(?:maya|kaur)(?:'s)?(?: kaur(?:'s)?)? (?:campaign|team)\\b/g;\n"
     "const CAMPW = { test(t) { CAMP_RE.lastIndex = 0; let m; while ((m = CAMP_RE.exec(t))) { const pre = t.slice(Math.max(0, m.index - 14), m.index + m[0].length); if (!/\\bvot(?:e|ing|ed) for\\b|\\brooting for\\b|\\bnot (?:with|for|from)\\b|n't (?:with|for|from)\\b/.test(pre)) return true; } return false; } };\n"
     "const CAMP_NEAR = /\\bcampaign\\b|\\bsenate\\b|\\bvolunteer(?:ing)?\\b|\\bmaya\\b|\\bkaur\\b/;")
swap('const openHits = (t) => [saysName(t), has(t, CAMPW), has(t, WHY1), !has(t, MINUTE_ASK)];',
     'const openHits = (t) => { const h = [saysName(t), has(t, CAMPW), has(t, WHY1)]; return h.concat([!has(t, MINUTE_ASK) && (h.some(Boolean) || wcount(t) >= 4)]); }; /* version 161: part 4 is earned by an opener that says something, never by a bare hello */')
swap('const PHR_WHY = ["election day is on tuesday", "election day is this tuesday", "election day is tuesday", "election day\'s tuesday", "election day on tuesday", "election day tuesday", "election day", "election is tuesday", "the election", "election", "tuesday", "ballot", "polls"];',
     'const PHR_WHY = ["election day is on tuesday", "election day is this tuesday", "election day is tuesday", "election day\'s tuesday", "election day on tuesday", "election day tuesday", "election day", "election is on tuesday", "election is tuesday", "election is this tuesday", "tuesday", "the polls open", "polls open"]; /* version 161: only words that say when */')
swap('const QCOUNT = (t) => t.split("?").length - 1;',
     '/* version 161: a spoken question rarely comes back with a question mark, so a question is either one, or a question opening aimed at the voter */\n'
     "const QSPOKEN = /\\b(?:what|when|where|how|why|which|who)(?:'s|'re)?\\b(?: [a-z']+){0,4}? (?:you|your|ya)\\b|\\b(?:are|do|did|will|would|have|could|can|is|were)(?: you| your| ya)\\b/g;\n"
     'const QCOUNT = (t) => Math.max(t.split("?").length - 1, (String(t).match(QSPOKEN) || []).length);')
swap('const THREEW = ["three", " 3 "];',
     "const THREEW = /\\b(?:three|3)\\b(?: [a-z']+){0,2}? (?:friends|people|folks|family|coworkers|neighbors|others|of them|more|of your|names)\\b|\\b(?:three|3)\\?/; /* version 161: three friends, not any three */")
swap('const WHENQ = ["when ", "when?", "what time", "what day", "which day"];',
     "const WHENQ = /\\bwhen (?:will|are|do|would|can|could|might|is|were|did|you)\\b|\\bwhat (?:time|day|days)\\b|\\bwhich (?:day|time)\\b|\\bwhen\\?/; /* version 161: asking when, not any when */")
swap('const HOW = [" mail", "drop box", "dropbox", "drop off", "drop it", "vote center", "in person", "how will you", "how are you", "how do you", "polling"];',
     "const HOW = /\\bby mail\\b|\\bmail (?:it|in|your|ballot)\\b|\\bmailing\\b|\\bdrop ?box\\b|\\bdrop (?:it|off|your)\\b|\\bvot(?:e|ing) center\\b|\\bin person\\b|\\bpolling (?:place|location|station)\\b|\\bearly voting\\b|\\bhow (?:will|are|do|would|you|you're)\\b(?: you)?(?: [a-z']+){0,2}? (?:vote|voting|get there|go|plan|planning|cast|turn|return)\\b|\\bwhere (?:will|are|do|would|you)\\b(?: you)?(?: [a-z']+){0,1}? (?:vote|voting|go)\\b/; /* version 161: \"How are you?\" is a greeting, not how they will vote */")
swap('const ANCHOR = ["coming from", "before", "after", "beforehand", "on your way", "be doing", "doing that", "usually up to", "usually doing", "mornings"];',
     "const ANCHOR = /\\bcoming from\\b|\\bbefore (?:that|then|you|it|work|your|class|school|the)\\b|\\bafter (?:work|school|your|you|that|class|church|lunch|dinner|the)\\b|\\bon your way\\b|\\bbe doing\\b|\\bdoing that\\b|\\busually (?:up to|doing)\\b|\\bwhat (?:are|will) you (?:be )?doing\\b|\\bbeforehand\\b|\\bmornings\\b/; /* version 161: \"voted before?\" is not what comes before */")
# Kevin's door: react to a real ask for time, and keep part 4 unless they ask on the second line
swap('        if (!h[3]) st.moves.delete(3);', '        if (has(t, MINUTE_ASK)) st.moves.delete(3); /* version 161 */')
swap('      if (!h[3]) return { say: "Uh, sure, I guess. What', '      if (has(t, MINUTE_ASK)) return { say: "Uh, sure, I guess. What')
swap('has(t, BYE) && t.trim().split(" ").length <= 20, false]', 'has(t, BYE) && !has(t, ARGUE) && t.trim().split(" ").length <= 20, false]') # version 161: a goodbye after a debate is not a fast wrap-up
# lesson 3 and 5's first tries: silence is not calm, and the ask to remind friends is an ask
swap('    hits: (t) => [!has(t, ARGUE), has(t, THANKW), has(t',
     '    hits: (t) => [!has(t, ARGUE) && wcount(t) >= 2, has(t, THANKW), has(t')
swap('    hits: (t) => [has(t, FRIENDW) && has(t, REMINDW), h',
     '    hits: (t) => [has(t, FRIEND_ASK) && (QCOUNT(t) >= 1 || /\\b(?:could|would|can|will) you\\b|\\bplease\\b/.test(t)), h')
swap('const THREEW = /', "/* version 161: the ask names who to remind (tell me what people think is not it) */\nconst FRIEND_ASK = /\\b(?:remind|text|ask|call|bring|get|tell)\\b(?! me\\b)(?: [a-z']+){0,3}? (?:friends?|family|people|folks|coworkers?|co-workers?|neighbors?|others|them|sister|brother|mom|dad|roommates?|everyone)\\b/;\nconst THREEW = /")

# ---------- 2. the words behind each part, and the feedback rows that show them ----------
EV = r"""
/* ---------- version 161: the evidence for each part ----------
   Each credited part points to the clause of the volunteer's own line that carried it. A part that is close says what is missing.
   A part the volunteer got wrong (asked for a minute, argued) quotes the words that did it. Live AI credits keep their own phrases. */
const EV_ALT = (xs) => new RegExp(xs.map((w) => w.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).filter(Boolean).map((w) => "\\b" + w + "\\b").join("|"));
const EV_Q = /\b(?:what|when|where|how|why|which|who|are|do|did|will|would|have|could|can|is)\b(?: [a-z']+){0,8}?(?: you| your| ya)\b(?: [a-z']+){0,5}/;
const EVR = {
  open: [null, /\b(?:volunteer(?:ing)?|campaign(?:ing)?|with|for|on behalf of)\b(?: [a-z'.]+){0,3}? (?:maya|kaur)\b(?: kaur)?(?:'s)?(?: campaign)?|\bmaya(?: kaur)?(?:'s)? campaign\b/, null, null],
  listen: [EV_Q, EV_Q, EV_ALT(HEARD), null],
  noargue: [null, EV_ALT(THANKW), EV_ALT(BYE), null],
  plan: [WHENQ, HOW, ANCHOR, null],
  friends: [EV_ALT(FRIENDW), THREEW, EV_ALT(WHOW), EV_ALT(NOWW)],
};
const EVBAD = { open: [null, null, null, MINUTE_ASK], noargue: [ARGUE, null, null, null] };
const EV_NEAR = {
  open: [() => "",
    (t) => (!has(t, CAMPW) && CAMP_NEAR.test(t) ? "Close. Say whose campaign: “I’m volunteering for Maya Kaur.”" : ""),
    (t) => (!has(t, WHY1) && WHY_NEAR.test(t) ? "Close. You mentioned the election but not when. Add “Election Day is Tuesday.”" : ""),
    () => ""],
  listen: [() => "", (t) => (QCOUNT(t) > 1 ? `You asked ${QCOUNT(t)} questions at once. Ask one, then wait.` : ""), () => "", () => ""],
  noargue: [() => "", () => "", (t) => (has(t, BYE) && wcount(t) > 20 ? "Close. Keep the goodbye to one short line." : ""), () => ""],
  plan: [(t) => (!has(t, WHENQ) && /\bwhen\b/.test(t) ? "Close. Ask it as a question: “When will you vote?”" : ""), () => "", () => "", () => ""],
  friends: [(t) => (has(t, FRIENDW) && !has(t, REMINDW) ? "Close. Ask him to remind them to vote." : ""), (t) => (has(t, FRIENDW) && !has(t, THREEW) ? "Close. Give a number: three friends." : ""), (t) => (whoCount(t) === 1 ? "Close. Suggest one more person by name or role." : ""), () => ""],
};
/* the volunteer's words as tokens, with a map from the normalized line back to the raw one */
function evMap(raw) {
  const toks = [], re = /[A-Za-z0-9‘’']+\??/g;
  let m, low = " ";
  while ((m = re.exec(raw))) { toks.push({ a: m.index, b: m.index + m[0].length, at: low.length }); low += m[0].toLowerCase().replace(/[‘’]/g, "'") + " "; }
  return { toks, low };
}
function evFind(raw, re) {
  if (!raw || !re) return "";
  const mp = evMap(String(raw)), r = new RegExp(re.source, re.flags.replace("g", "")), m = r.exec(mp.low);
  if (!m) return "";
  const s0 = m.index, e0 = m.index + m[0].length;
  const ins = mp.toks.filter((k) => k.at + 1 > s0 - 1 && k.at < e0);
  if (!ins.length) return "";
  let a = ins[0].a, b = ins[ins.length - 1].b;
  const str = String(raw);
  /* widen to the clause when it stays short */
  let ca = a, cb = b;
  while (ca > 0 && !/[.?!;,\u2014]/.test(str.charAt(ca - 1))) ca -= 1;
  while (cb < str.length && !/[.?!;,\u2014]/.test(str.charAt(cb))) cb += 1;
  const clause = str.slice(ca, cb).trim();
  const q = clause.split(/\s+/).length <= 12 ? clause : str.slice(a, b).trim();
  return q.replace(/^[\s,;]+|[\s,;]+$/g, "");
}
/* what to show for part i: state y (credited), near, x (did the thing to avoid) or n (not yet), with a quote or a note */
function evPart(k, i, raw, hit, phr) {
  const t = norm(raw), bad = EVBAD[k] && EVBAD[k][i];
  if (bad && has(t, bad)) return { st: "x", quote: evFind(raw, bad) };
  if (hit) {
    let quote = phr && phr[i] ? String(phr[i]) : "";
    if (!quote && k === "open" && i === 0) quote = (openPhrases(raw, [true, false, false, false])[0] || "");
    if (!quote && EVR[k] && EVR[k][i]) quote = evFind(raw, EVR[k][i]);
    return { st: "y", quote };
  }
  const near = EV_NEAR[k] && EV_NEAR[k][i] ? EV_NEAR[k][i](t) : "";
  return near ? { st: "near", note: near } : { st: "n" };
}
const EV_ABSENT = { open: [null, null, null, "You went straight into it."], noargue: ["No debate, even at a no.", null, null, null] };
function evLi(k, i, raw, hit, phr, names, opts) {
  const sk = SKILLS[k], o = opts || {};
  if (!sk || !EVR[k]) return `<li class="${hit ? "y" : "n"}">${esc(hit ? sk.hitNames[i] : (sk.missNames || [])[i] || sk.moves[i])}</li>`;
  const p = evPart(k, i, raw, hit, phr);
  const label = p.st === "y" ? sk.hitNames[i] : p.st === "x" ? (sk.missNames || [])[i] || sk.moves[i] : (names || sk.moves)[i];
  let det = "";
  if (p.st === "y") det = p.quote ? `<q class="ev-q">${esc(p.quote)}</q>` : (EV_ABSENT[k] && EV_ABSENT[k][i]) ? `<span class="ev-note">${EV_ABSENT[k][i]}</span>` : "";
  else if (p.st === "x") det = p.quote ? `<span class="ev-note">You said <q class="ev-q">${esc(p.quote)}</q></span>` : "";
  else if (p.st === "near") det = `<span class="ev-note">${p.note}</span>`;
  else if (o.notYet) det = `<span class="ev-note">${o.notYet}</span>`;
  const cls = p.st === "y" ? "y" : p.st === "x" ? "n x" : p.st === "near" ? "n near" : "n";
  return `<li class="${cls} ev" style="--i:${i}"><span class="ev-l">${o.kick ? `<small>${p.st === "y" ? "You did" : p.st === "near" ? "Almost" : p.st === "x" ? "Skip this" : "Not yet"}</small>` : ""}${esc(label)}</span>${det}</li>`;
}
/* every line the volunteer said at this door, for the feedback card's quotes */
const evDoorText = (L) => (S.convo && S.convo.turns && S.screen === "score" ? S.convo.turns.filter((x) => x.who === "you").map((x) => x.text).join(" ") : (L && L.text) || "");
"""
swap('/* "Say it now": a light check that the tip they said out loud carries the move */', EV + '\n/* "Say it now": a light check that the tip they said out loud carries the move */')

# the 1st intro card: each part with the words that earned it, and the line itself with those words marked
EV2 = r"""
function evSaid(raw, parts) {
  const str = String(raw || ""), marks = [];
  parts.forEach((p) => { if ((p.st === "y" || p.st === "x") && p.quote) { const at = UNC(str).indexOf(UNC(p.quote)); if (at >= 0) marks.push([at, at + p.quote.length, p.st]); } });
  marks.sort((x, y) => x[0] - y[0]);
  let html = "", pos = 0;
  marks.forEach((m) => { if (m[0] < pos) return; html += esc(str.slice(pos, m[0])) + `<mark class="ev-hl${m[2] === "x" ? " bad" : ""}">${esc(str.slice(m[0], m[1]))}</mark>`; pos = m[1]; });
  return html + esc(str.slice(pos));
}
"""
swap('/* "Say it now": a light check that the tip they said out loud carries the move */', EV2 + '/* "Say it now": a light check that the tip they said out loud carries the move */')
swap('  const rows = sk.moves.map((m, i) => `<li class="${hits[i] ? "y" : "n"}" style="--i:${i}"><small>${hits[i] ? "You did" : "Not yet"}</small>${esc(m)}</li>`).join("");',
     '  const rows = sk.moves.map((m, i) => evLi(k, i, R.text, hits[i], R.phr, sk.moves, { kick: true, moves: true })).join(""); /* version 161: each part shows the words that earned it */\n'
     '  const evParts = sk.moves.map((m, i) => evPart(k, i, R.text, hits[i], R.phr));')
swap('<p class="you-said">You said: \\u201c${esc(R.text)}\\u201d</p><h3>${all ? "You already have all four." : "A good introduction does four things."}</h3><ul class="sc-list four-list">${rows}</ul><p class="try-lead had">${sum}</p></div>`;',
     '<p class="you-said">You said: \\u201c${evSaid(R.text, evParts)}\\u201d</p><h3>${all ? "You already have all four." : n === 1 ? "A good introduction does four things." : "A good answer here does four things."}</h3><ul class="sc-list four-list">${rows}</ul><p class="try-lead had">${sum}</p><p class="ev-foot">Credit only for what your words say.</p></div>`;')
# the feedback card after the 2nd intro: the same rows, with every line said at the door
swap('<ul class="sc-list">${sk.moves.map((m, i) => `<li class="${L.moves[i] ? "y" : "n"}">${esc(L.moves[i] ? sk.hitNames[i] : (sk.missNames || [])[i] || m)}</li>`).join("")}</ul>',
     '<ul class="sc-list">${sk.moves.map((m, i) => evLi(L.skill, i, evDoorText(L), L.moves[i], L.phr, sk.missNames || sk.moves, {})).join("")}</ul>')
# the label: Try keeps the move's own wording for every state
swap("  const label = p.st === \"y\" ? sk.hitNames[i] : p.st === \"x\" ? (sk.missNames || [])[i] || sk.moves[i] : (names || sk.moves)[i];",
     "  const label = o.moves ? sk.moves[i] : p.st === \"y\" ? sk.hitNames[i] : p.st === \"x\" ? (sk.missNames || [])[i] || sk.moves[i] : (names || sk.moves)[i];")

# ---------- 3. a typed fallback when the microphone fails ----------
swap('let micBlocked = false, micWhy = "",', 'let micTyped = false; /* version 161: the volunteer chose to type for the rest of this visit */\nlet micBlocked = false, micWhy = "",')
swap('function pageMic() { try { return !!SpeechRec &&', 'function pageMic() { if (micTyped) return false; try { return !!SpeechRec &&')
swap('"This lesson is spoken, not typed. Allow the microphone for this site in your browser settings, then tap Try again."',
     '"Warmup works best out loud. Allow the microphone for this site in your browser settings, then tap Try again. Or type your words for now."')
swap('"Another app is probably using it, like FaceTime or a call. Close or mute that app, then tap Try again."',
     '"Another app is probably using it, like FaceTime or a call. Close or mute that app, then tap Try again. Or type your words for now."')
swap('<button class="btn" data-act="mic-retry">Try again</button>',
     '<button class="btn" data-act="mic-retry">Try again</button><button class="btn secondary mm-type" data-act="mic-type">Type it instead</button>')
swap('    case "mic-retry": micRetry(); break; /* version 94 */',
     '    case "mic-retry": micRetry(); break; /* version 94 */\n    case "mic-type": micType(); break; /* version 161 */')
swap('function micOff() { const m = $("#mic-modal"); if (m) m.remove(); }',
     'function micOff() { const m = $("#mic-modal"); if (m) m.remove(); }\n'
     '/* version 161 (round 2 brief): a working fallback. Typing is graded the same way; the talk bar becomes a text box for the rest of the visit */\n'
     'function micType() {\n'
     '  micTyped = true; micBlocked = false; micWhy = "";\n'
     '  try { if (rec) rec.abort(); } catch (e) { /* ignore */ }\n'
     '  rec = null;\n'
     '  micOff();\n'
     '  const ta = $("#say"), h = $("#talk-hint");\n'
     '  if (ta) { ta.readOnly = false; ta.placeholder = "Type what you\\u2019d say at the door"; }\n'
     '  try { liveCardOff(); listenFold(false); } catch (e) { /* ignore */ }\n'
     '  const b0 = $(\'#talk [data-act="talk"]\'); if (b0) b0.classList.remove("on", "send");\n'
     '  heldWords = "";\n'
     '  trayOpen(true);\n'
     '  const send = $("#talk-tray .composer [data-act]"); if (send) send.hidden = false;\n'
     '  if (h) h.textContent = "Type it the way you\\u2019d say it.";\n'
     '}')
swap('const keyHint = () => (isTouch() ? "Tap the mic on your keyboard and talk." : "Use your dictation key (like Wispr Flow) and talk.");',
     'const keyHint = () => (micTyped ? "Type it the way you\\u2019d say it." : isTouch() ? "Tap the mic on your keyboard and talk." : "Use your dictation key (like Wispr Flow) and talk.");')

swap('if (!heard) { if (note) note.textContent = "Nothing came through. Tap to talk and try again."; if (h) h.textContent = "Nothing came through. Tap to talk and try again."; return; }',
     'if (!heard) { const tl = \'Nothing came through. Tap to talk and try again, or <button class="link" data-act="mic-type">type it instead</button>.\'; if (note) note.innerHTML = tl; if (h) h.textContent = "Nothing came through. Tap to talk and try again."; return; } /* version 161: a recognizer that hears nothing offers the keyboard */')
# ---------- styles for 1 to 3 ----------
CSS1 = r"""
  /* ---------- version 161: one system. Paper, ink and one green; Newsreader speaks, Figtree works. ---------- */
  :root { --r-card: 20px; --r-ctl: 16px; --sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px; --sp-5: 24px; --warn: #9A6A0C; --warn-soft: #F6E7C1; --bad: #A4432F; --bad-soft: #F5DDD6; }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --warn: #E9C46A; --warn-soft: rgba(233, 196, 106, .18); --bad: #F0A08E; --bad-soft: rgba(240, 160, 142, .16); } }
  :root[data-theme="dark"] { --warn: #E9C46A; --warn-soft: rgba(233, 196, 106, .18); --bad: #F0A08E; --bad-soft: rgba(240, 160, 142, .16); }
  /* the evidence rows */
  .sc-list li.ev .ev-l { display: block; }
  .sc-list li.ev .ev-q, .sc-list li.ev .ev-note { display: block; margin-top: 2px; font-weight: 400; line-height: 1.35; color: var(--ink-2); }
  .sc-list li.ev .ev-note .ev-q { display: inline; margin: 0; }
  .ev-q { font-family: var(--head-font); font-style: italic; font-size: 1.02em; quotes: "\201C" "\201D"; }
  .sc-list li.ev .ev-note { font-size: .9em; }
  .sc-list li.near { color: var(--ink); }
  .sc-list li.near .ev-note { color: var(--warn); font-weight: 500; }
  .sc-list li.x .ev-note { color: var(--bad); }
  .sc-list li.near::before, .fb.try .four-list li.near::before { content: ""; border: 2px solid var(--warn) !important; background: linear-gradient(90deg, var(--warn) 50%, transparent 50%) !important; border-radius: 50% !important; }
  .sc-list li.x::before, .fb.try .four-list li.x::before { content: ""; border: 0 !important; border-radius: 50% !important; background: var(--bad) url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M5 5l6 6M11 5l-6 6' stroke='%23FFFFFF' stroke-width='2.4' stroke-linecap='round'/%3E%3C/svg%3E") center / 11px 11px no-repeat !important; }
  .sc-list li.near::after, .sc-list li.x::after { display: none !important; }
  .fb.try .four-list li.near small { color: var(--warn); }
  .fb.try .four-list li.x small { color: var(--bad); }
  .fb.try .four-list li.ev .ev-q, .fb.try .four-list li.ev .ev-note { font-size: 14.5px; }
  mark.ev-hl { background: color-mix(in srgb, var(--accent) 26%, transparent); color: var(--ink); border-radius: 4px; padding: 0 2px; box-decoration-break: clone; -webkit-box-decoration-break: clone; }
  mark.ev-hl.bad { background: var(--bad-soft); }
  .fb .you-said { color: var(--ink-2); }
  .ev-foot { margin: 10px 0 0; font-size: 12.5px; color: var(--ink-3); display: flex; gap: 6px; align-items: center; }
  .ev-foot::before { content: ""; width: 14px; height: 14px; flex: none; background: url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M8 1.5 2.5 3.8v3.9c0 3.2 2.3 5.9 5.5 6.8 3.2-.9 5.5-3.6 5.5-6.8V3.8z' fill='none' stroke='%236F685F' stroke-width='1.5' stroke-linejoin='round'/%3E%3Cpath d='m5.5 8 1.8 1.8L10.8 6' fill='none' stroke='%236F685F' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center / contain no-repeat; }
  .fb.try.cascade .ev-foot { animation: rise 0.4s ease 4.1s both; }
  .mm-type { margin-top: 10px; }
"""

# ---------- 4. Learn as one path ----------
LEARN = r"""function vLearnG() {
  /* version 161 (round 2 brief: Learn is dense on a phone): one path, read top to bottom. The course you are in comes first; each lesson
     is a row you can read (its house, its number, its name, where it stands), and today's lesson opens in place with its one line and
     Start. Course 2 waits below with its own five rows, so the two courses read as one journey of ten. The rules are unchanged:
     lessons 1 to 5 in order, one a day; the issue lessons in any order once door-ready. Replaces version 149's grid of ten tiles. */
  const d5 = S.done5 || {}, nd = LESSONS5.filter((x) => d5[x.n]).length, nx = LESSONS5.find((x) => !d5[x.n]);
  const camp = CAMPAIGN[S.track] || CAMPAIGN.gotv, first = camp.name.split(" ")[0], briefs = camp.briefs || [], ids = camp.briefIds || [];
  const ready = nd >= 5, total = 5 + briefs.length, lastL = LESSONS5.filter((x) => d5[x.n]).pop();
  const bd = S.briefsDoneIds || {}, nb = ids.filter((id) => bd[id]).length, briefed = ready && nb >= briefs.length;
  const clean = (t) => String(t).replace(/^How to /, "").replace(/^./, (c) => c.toUpperCase());
  const art1 = (n, dim) => houseTile(HOME[(FLOW[LESSON_SKILL[n]] || {}).persona] || HOME.walter, dim);
  const bar = (k, of, cls) => `<span class="lp-bar${cls ? " " + cls : ""}" aria-hidden="true">${Array.from({ length: of }, (_, i) => `<i${i < k ? ' class="on"' : ""}></i>`).join("")}</span>`;
  const mornings = (n) => `${n} morning${n === 1 ? "" : "s"}`;
  const row1 = (L) => {
    const done = d5[L.n], next = !!nx && nx.n === L.n, lk = !done && lessonLocked(L.n), sc = done ? done.filter(Boolean).length : 0;
    if (next && !lk) return `<li class="lp-i now"><div class="lp-row"><span class="lp-art">${art1(L.n, false)}</span><span class="lp-tx"><small>Today · Lesson ${L.n} · 5 min</small><b>${esc(clean(L.title))}</b></span></div><p class="lp-line">${L.line}</p>${button([`Start lesson ${L.n}`, "lesson5", String(L.n)])}</li>`;
    const state = done ? `${sc} of 4` : next ? "Tomorrow" : `Day ${L.n}`;
    const aria = `Lesson ${L.n}: ${esc(L.title)}, ${done ? "done, " + sc + " of 4 parts" : next ? "opens tomorrow morning" : "opens on day " + L.n}`;
    return `<li class="lp-i${done ? " done" : next ? " tom" : " later"}"><button class="lp-row lp-b" data-act="lesson5" data-arg="${L.n}" aria-label="${aria}"><span class="lp-art">${art1(L.n, !done && !next)}${done ? TILE_CHECK : ""}</span><span class="lp-tx"><small>Lesson ${L.n}</small><b>${esc(clean(L.title))}</b></span><span class="lp-st">${state}</span></button></li>`;
  };
  const goal = (kind, on, k, title, line) => `<li class="lp-i lp-goal${on ? " on" : ""}"><div class="lp-row"><span class="lp-art lp-medal">${medalSvg(kind, on)}</span><span class="lp-tx"><small>${k}</small><b>${title}</b></span></div>${line ? `<p class="lp-gl">${line}</p>` : ""}</li>`;
  const retake = lastL ? `<button class="link" data-act="retake5" data-arg="${lastL.n}">Retake lesson ${lastL.n}</button>` : "";
  const why = `<button class="link" data-act="go" data-arg="whylock">Why one a day</button>`;
  const c1 = `<section class="lp-c" aria-label="Course 1, How to canvass">
    <header class="lp-h"><p class="lp-k">Course 1 · In order, one a day</p><h2 class="lp-t">How to canvass</h2>${bar(nd, 5)}<p class="lp-s">${ready ? "Done. You’re door-ready." : nd ? `${nd} of 5 done · door-ready in ${mornings(5 - nd)}` : "Five lessons, five mornings, then you’re door-ready."}</p></header>
    <ol class="lp-l">${LESSONS5.map(row1).join("")}${goal("door", ready, ready ? "Earned" : "After lesson 5", "Door-ready", ready ? "" : `Silver: a thank-you from ${first} and a card to share.`)}</ol>
    <p class="lp-links">${why}${retake}</p></section>`;
  const row2 = (bf, i) => { const ok = ready && !!bd[ids[i]]; return `<li class="lp-i${ok ? " done" : ready ? " open" : " later"}"><button class="lp-row lp-b" data-act="brief-open" data-arg="${esc(bf)}" data-lesson="${ids[i] || ""}" aria-label="Lesson ${i + 6}: ${esc(bf)}${ok ? ", done" : ready ? "" : ", opens when you’re door-ready"}"><span class="lp-art">${issueTile(i, !ready)}${ok ? TILE_CHECK : ""}</span><span class="lp-tx"><small>Lesson ${i + 6}</small><b>${esc(bf)}</b></span><span class="lp-st">${ok ? "Done" : ready ? "Open" : LOCK_SVG}</span></button></li>`; };
  const c2 = `<section class="lp-c lp-c2${ready ? "" : " shut"}" aria-label="Course 2, ${first}’s issues">
    <header class="lp-h"><button class="lp-hb" data-act="issues-open" aria-label="Open ${first}’s issue lessons"><img src="${CAND_PHOTO}" alt=""><span><span class="lp-k">Course 2 · ${ready ? "Any order, one a day" : "After door-ready"}</span><span class="lp-t">${first}’s issues</span></span></button>${bar(ready ? nb : 0, 5, "blue")}<p class="lp-s">${briefed ? "Done. You’re briefed." : ready ? `${nb} of 5 done · five minutes each on what voters raise at the door` : "Where " + first + " stands on five issues voters raise at the door."}</p></header>
    <ol class="lp-l">${briefs.map(row2).join("")}${goal("brief", briefed, briefed ? "Earned" : "After all five", "Briefed", "")}</ol>
    ${ready && !briefed ? `<div class="lp-cta">${button([`Open ${first}’s issues`, "issues-open"])}</div>` : ""}</section>`;
  const mast = `<div class="lp-mast"><p class="kicker">GOTV canvassing · ${nd + (ready ? nb : 0)} of ${total} done</p><h1 class="h1 lp-h1">Ten lessons, one a day</h1></div>`;
  const after = `<p class="lrn-after">${LOCK_SVG}<span>After ${total}: more courses from Warmup and your campaign.</span></p>`;
  return app(`${mast}${ready && !briefed ? c2 + c1 : c1 + c2}${after}`, { tabs: "library", stage: true });
}
"""
a = s.index("function vLearnG() {")
b = s.index("function vCourseG() {", a)
s = s[:a] + LEARN + s[b:]

# ---------- 5. Progress joins the system: both courses on one strip, under the ring ----------
swap('    <div class="pg-sk"><span class="pg-flame">',
     '    ${pgPath(c, first)}\n    <div class="pg-sk"><span class="pg-flame">')
swap("function vProgressG() {",
     "/* version 161: the two courses as one strip of ten, the same marks as Learn */\n"
     "function pgPath(c, first) {\n"
     "  const ids = (CAMPAIGN[S.track] || CAMPAIGN.gotv).briefIds || [], bd = S.briefsDoneIds || {};\n"
     "  const b1 = LESSONS5.map((x) => `<i${c.d5[x.n] ? ' class=\"on\"' : \"\"}></i>`).join(\"\"), b2 = ids.map((id) => `<i${c.nd >= 5 && bd[id] ? ' class=\"on\"' : \"\"}></i>`).join(\"\");\n"
     "  return `<button class=\"pg-path\" data-act=\"go\" data-arg=\"library\" aria-label=\"Your two courses, on Learn\"><span><small>How to canvass</small><span class=\"lp-bar\" aria-hidden=\"true\">${b1}</span></span><span><small>${first}\\u2019s issues</small><span class=\"lp-bar blue\" aria-hidden=\"true\">${b2}</span></span></button>`;\n"
     "}\n"
     "function vProgressG() {")

# ---------- 6. Today, first visit: what the five minutes hold ----------
swap('<h2 class="hn-t">${nx.title}</h2>${heroDoor(nx.n, false)}${button([`Start · 5 min`, "lesson5", String(nx.n)])}</div>`;',
     '<h2 class="hn-t">${nx.title}</h2>${heroDoor(nx.n, false)}${nd === 0 ? TD_STEPS : ""}${button([`Start · 5 min`, "lesson5", String(nx.n)])}</div>`;')
swap("function vTodayG() {",
     "/* version 161 (round 2 brief: the value in the first minute): a first visit sees what the five minutes hold before Start */\n"
     "const TD_STEPS = `<ol class=\"td-steps\" aria-label=\"What happens in the lesson\"><li><b>1</b><span>Knock on a voter\\u2019s door</span></li><li><b>2</b><span>Say your intro out loud</span></li><li><b>3</b><span>See which words landed</span></li></ol>`;\n"
     "function vTodayG() {")

CSS2 = r"""
  /* Learn: one path */
  .lp-mast { margin: 2px 0 6px; }
  .lp-h1 { font-size: 29px; margin: 2px 0 4px; }
  .lp-c { margin: 12px 0 4px; }
  .lp-h { padding: 0 2px 8px; }
  .lp-k { display: block; margin: 0; font-size: 11.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-3); }
  .lp-t { display: block; margin: 2px 0 8px; font-family: var(--head-font); font-weight: var(--head-weight); font-size: 22px; line-height: 1.15; letter-spacing: -0.01em; color: var(--ink); }
  .lp-s { margin: 6px 0 0; font-size: 13.5px; line-height: 1.4; color: var(--ink-2); }
  .lp-bar { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; }
  .lp-bar i { height: 6px; border-radius: 3px; background: var(--track); }
  .lp-bar i.on { background: var(--accent); }
  .lp-bar.blue i.on { background: var(--maya-stage, #1F4C91); }
  .lp-l { list-style: none; margin: 4px 0 0; padding: 0; border-radius: var(--r-card); background: var(--card); border: 1.5px solid var(--line); overflow: hidden; }
  .lp-i + .lp-i { border-top: 1px solid var(--line); }
  .lp-row { display: grid; grid-template-columns: 40px 1fr auto; gap: 12px; align-items: center; width: 100%; padding: 10px 14px; border: 0; background: none; color: inherit; font: inherit; text-align: left; }
  .lp-b { cursor: pointer; }
  .lp-b:active { background: var(--soft); }
  .lp-art { position: relative; width: 40px; height: 40px; }
  .lp-art .ta, .lp-art > svg { display: block; width: 40px; height: 40px; }
  .lp-art .chp-badge { right: -5px; bottom: -5px; box-shadow: 0 0 0 2px var(--card); }
  .lp-tx { min-width: 0; }
  .lp-tx small { display: block; font-size: 11.5px; font-weight: 600; color: var(--ink-3); letter-spacing: 0.01em; }
  .lp-tx b { display: block; font-size: 15.5px; font-weight: 600; line-height: 1.25; color: var(--ink); }
  .lp-st { font-size: 12.5px; font-weight: 600; color: var(--ink-3); white-space: nowrap; display: inline-flex; align-items: center; }
  .lp-st svg { width: 13px; height: 13px; }
  .lp-i.done .lp-st { color: var(--accent-ink); }
  .lp-i.tom .lp-st { color: var(--ink); }
  .lp-i.later .lp-tx b { color: var(--ink-2); font-weight: 500; }
  .lp-i.open .lp-st { color: var(--accent-ink); }
  .lp-i.now { background: var(--accent-soft); padding-bottom: 14px; }
  .lp-i.now .lp-row { grid-template-columns: 40px 1fr; }
  .lp-i.now .lp-tx small { color: var(--accent-ink); font-weight: 700; }
  .lp-i.now .lp-tx b { font-family: var(--head-font); font-weight: var(--head-weight); font-size: 20px; }
  .lp-line { margin: 0 14px 12px 66px; font-size: 14px; line-height: 1.4; color: var(--ink-2); }
  .lp-i.now .btn { width: calc(100% - 80px); margin: 0 14px 0 66px; min-height: 46px; border-radius: 14px; font-size: 15.5px; }
  .lp-goal .lp-row { grid-template-columns: 40px 1fr; }
  .lp-medal svg { width: 34px; height: 40px; margin-left: 3px; }
  .lp-goal:not(.on) .lp-tx b { color: var(--ink-2); }
  .lp-gl { margin: -4px 14px 12px 66px; font-size: 12.5px; color: var(--ink-3); line-height: 1.4; }
  .lp-links { display: flex; gap: 16px; justify-content: center; margin: 8px 0 0; }
  .lp-links .link { font-size: 13px; }
  .lp-hb { display: grid; grid-template-columns: 40px 1fr; gap: 12px; align-items: center; width: 100%; padding: 0 0 8px; border: 0; background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; }
  .lp-hb img { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
  .lp-hb .lp-t { margin: 1px 0 0; }
  .lp-c2.shut .lp-l { background: transparent; }
  .lp-c2.shut .ta { opacity: .9; }
  .lp-cta { margin-top: 10px; }
  /* Progress: the same type, buttons and tokens as the rest of the app */
  .pg-h { font-family: var(--head-font); font-weight: var(--head-weight); font-size: 32px; letter-spacing: -0.015em; }
  .pg-wm { color: var(--accent-ink); }
  .pg-take { font-family: var(--head-font); font-weight: var(--head-weight); font-size: 26px; letter-spacing: -0.01em; }
  .pg-cta { min-height: 54px; border-radius: 16px; background: var(--ink); color: var(--on-ink); box-shadow: none; font-weight: 700; font-size: 16.5px; }
  .pg-cta:active { transform: translateY(1px); }
  .pg-when, .pg-sk small, .pg-week li, .pg-foot p, .pg-ctr small { color: var(--ink-3); }
  .pg-week li.on span { background: var(--accent); }
  .pg-links .link { color: var(--accent-ink); }
  .pg-ring { --rw: clamp(178px, calc(100cqh - 452px), 290px); }
  .pg-ctr small { font-size: clamp(9.5px, calc(var(--rw) * 0.05), 11px); }
  @media (max-height: 720px) { .pg-path { margin-top: 10px; padding: 9px 12px; } .pg-sk small { display: none; } .pg-week { margin-top: 6px; } }
  .pg-path { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; width: 100%; margin: 14px 0 0; padding: 12px 14px; border-radius: var(--r-card); background: var(--card); border: 1.5px solid var(--line); color: inherit; font: inherit; text-align: left; cursor: pointer; }
  .pg-path small { display: block; margin-bottom: 6px; font-size: 11.5px; font-weight: 700; letter-spacing: 0.04em; color: var(--ink-2); }
  /* Today, first visit */
  .td-steps { list-style: none; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 12px 0; padding: 0; }
  .td-steps li { display: grid; justify-items: center; gap: 5px; text-align: center; font-size: 12.5px; line-height: 1.25; font-weight: 600; color: var(--ink-2); }
  .td-steps b { width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; background: var(--accent-soft); color: var(--accent-ink); font-size: 12.5px; }
  /* the investor preview on a phone */
  .tour-pill { position: fixed; z-index: 30; top: calc(env(safe-area-inset-top, 0px) + 10px); right: 12px; display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px 7px 10px; border-radius: 999px; border: 0; background: #262320; color: #FCF8F2; font: 700 12.5px/1 "Figtree", system-ui, sans-serif; box-shadow: 0 6px 18px -6px rgba(0,0,0,.45); cursor: pointer; }
  .tour-pill i { width: 8px; height: 8px; border-radius: 50%; background: #35B57C; }
  .tour-sheet { position: fixed; z-index: 31; left: 0; right: 0; bottom: 0; max-height: 82vh; overflow: auto; padding: 18px 18px calc(env(safe-area-inset-bottom, 0px) + 16px); border-radius: 22px 22px 0 0; background: var(--stage-bg); color: var(--stage-ink); box-shadow: 0 -12px 40px -10px rgba(0,0,0,.4); font-family: "Figtree", system-ui, sans-serif; }
  .tour-scrim { position: fixed; inset: 0; z-index: 30; background: rgba(20,18,16,.42); }
  .tour-sheet h2 { margin: 0; font-family: "Newsreader", Georgia, serif; font-weight: 500; font-size: 24px; }
  .tour-sheet .t-lab { display: inline-block; margin: 0 0 8px; padding: 4px 8px; border-radius: 6px; background: #F6E7C1; color: #6B4A06; font-size: 11.5px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
  .tour-sheet .t-now { margin: 12px 0 4px; padding: 12px 14px; border-radius: 16px; background: var(--g-soft); }
  .tour-sheet .t-now b { display: block; font-size: 15.5px; }
  .tour-sheet .t-now p { margin: 4px 0 0; font-size: 14px; line-height: 1.45; color: var(--stage-muted); }
  .tour-sheet .t-now .t-why { color: var(--stage-ink); }
  .tour-sheet ol { list-style: none; margin: 10px 0 0; padding: 0; display: grid; gap: 2px; }
  .tour-sheet ol button { width: 100%; display: grid; grid-template-columns: 26px 1fr; gap: 12px; align-items: center; padding: 9px 6px; border: 0; border-radius: 12px; background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; }
  .tour-sheet ol button[aria-current] { background: var(--g-soft); }
  .tour-sheet ol .n { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; box-shadow: inset 0 0 0 1.5px var(--g-line); font-size: 12px; font-weight: 700; }
  .tour-sheet ol [aria-current] .n { background: #35B57C; color: #fff; box-shadow: none; }
  .tour-sheet ol b { display: block; font-size: 15px; } .tour-sheet ol small { display: block; font-size: 12.5px; color: var(--stage-muted); }
  .tour-sheet .t-foot { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; }
  .tour-sheet .t-foot button { min-height: 48px; border-radius: 14px; border: 1.5px solid var(--g-line); background: none; color: inherit; font: 700 15px/1 "Figtree", system-ui, sans-serif; cursor: pointer; }
  .tour-sheet .t-foot .t-go { background: #262320; color: #FCF8F2; border-color: #262320; }
  .tour-sheet .t-fine { margin: 12px 2px 0; font-size: 12px; line-height: 1.45; color: var(--stage-muted); }
  @media (min-width: 1100px) and (min-height: 620px) and (pointer: fine) { body.guide-on .tour-pill, body.guide-on .tour-sheet, body.guide-on .tour-scrim { display: none; } }
"""

# ---------- 7. the investor preview on a phone ----------
TOUR = r"""
/* version 161 (round 2 brief: an investor on their own phone): ?tour adds a labeled preview. A pill top right opens the nine stops of
   the laptop guide as a sheet: what this screen shows, why it works and what is sample. Stops 5 to 9 load sample progress, as on the
   laptop. Nothing a preview does is saved: the page's own storage writes are skipped while ?tour is on, and window.__wuPreview tells
   any learner record (Phase 1) to stay out of it. A volunteer's link never carries ?tour. */
const TOUR_ON = /[?&]tour\b/.test(location.search);
const tourSt = { open: false };
if (TOUR_ON) { window.__wuPreview = true; const set0 = store.set; store.set = function (k, v) { if (k === "guide") return; return undefined; }; void set0; }
function tourRender() {
  if (!TOUR_ON) return;
  let pill = document.getElementById("tour-pill");
  if (!pill) {
    pill = document.createElement("button"); pill.id = "tour-pill"; pill.className = "tour-pill"; pill.dataset.tour = "open";
    document.body.appendChild(pill);
    document.addEventListener("click", (e) => {
      const b = e.target.closest ? e.target.closest("[data-tour]") : null;
      if (!b) return;
      e.preventDefault();
      const v = b.dataset.tour, at = guideStop();
      if (v === "open") tourSt.open = true;
      else if (v === "close") tourSt.open = false;
      else if (v === "next") { tourSt.open = false; guideJump(Math.min(9, (at || 0) + 1)); }
      else { tourSt.open = false; guideJump(Number(v)); }
      tourRender();
    });
  }
  const at = guideStop();
  pill.innerHTML = `<i aria-hidden="true"></i>Investor preview${at ? ` · ${at}/9` : ""}`;
  let sh = document.getElementById("tour-sheet"), scrim = document.getElementById("tour-scrim");
  if (!tourSt.open) { if (sh) sh.remove(); if (scrim) scrim.remove(); pill.hidden = false; return; }
  pill.hidden = true;
  if (!scrim) { scrim = document.createElement("div"); scrim.id = "tour-scrim"; scrim.className = "tour-scrim"; scrim.dataset.tour = "close"; document.body.appendChild(scrim); }
  if (!sh) { sh = document.createElement("div"); sh.id = "tour-sheet"; sh.className = "tour-sheet"; sh.setAttribute("role", "dialog"); sh.setAttribute("aria-label", "Investor preview"); document.body.appendChild(sh); }
  const st = G_STOPS.find((x) => x.n === at), alt = st && st.alt ? st.alt[S.screen] || {} : {};
  const nx = G_STOPS.find((x) => x.n === (at || 0) + 1);
  sh.innerHTML = `<p class="t-lab">Investor preview</p><h2>Warmup in nine stops</h2>
    ${st ? `<div class="t-now"><b>${at}. ${gVal(alt.h || st.h)}</b><p>${gVal(alt.b || st.b)}</p>${st.why ? `<p class="t-why">${st.why}</p>` : ""}${(st.sample && gState.sampled) || st.demo ? `<p>${[gState.sampled ? st.sample || "" : "", st.demo || ""].filter(Boolean).join(" ")}</p>` : ""}</div>` : ""}
    <ol>${G_STOPS.map((x) => `<li><button data-tour="${x.n}"${x.n === at ? ' aria-current="step"' : ""}><span class="n">${x.n}</span><span><b>${x.name}</b><small>${x.sub}</small></span></button></li>`).join("")}</ol>
    <div class="t-foot"><button data-tour="close">Back to the app</button>${nx ? `<button class="t-go" data-tour="next">Next: ${nx.name}</button>` : `<button class="t-go" data-tour="1">Start over</button>`}</div>
    <p class="t-fine">Maya Kaur for U.S. Senate is a sample campaign. Stops 5 to 9 load sample progress, as if five days had passed. Nothing here is saved, and no texts are sent.</p>`;
}
"""
swap("\nloadVoices();\nrender();\n})();\n</script>", TOUR + "\nloadVoices();\nrender();\n})();\n</script>")
swap("  guideRender(); /* version 160 */\n", "  guideRender(); /* version 160 */\n  tourRender(); /* version 161 */\n")

# ---------- 8. the guide's copy says what is real ----------
swap('b: "The next lesson opens tomorrow, and a text brings the volunteer back at 8 AM. Five mornings make a volunteer door-ready before the first shift.",',
     'b: "The next lesson opens the next morning, right where the volunteer left off. Five mornings make a volunteer door-ready before the first shift.",')
swap('demo: "The 8 AM text isn’t sent in this demo." },',
     'demo: "Reminder texts aren’t sent yet. The volunteer comes back to the same link." },')
swap('"A new voter answers the door. You say your intro out loud, and Warmup checks your words against the four parts."',
     '"A new voter answers the door. You say your intro out loud, and Warmup credits a part only when your words say it, and shows those words."')
swap('alt: { score: { h: "Feedback on your own words.", b: "You see which of the four parts you hit and the one to add, then retry at the door or finish the lesson. Scores stay with the volunteer." },',
     'alt: { score: { h: "Feedback on your own words.", b: "Each part shows the words that earned it, and a near miss says what was missing. Retry at the door or finish the lesson. Scores stay with the volunteer." },')

# ---------- 9. no promise of a text that isn't sent (--honest: for the live page; the same lines as Phase 1's builder) ----------
# Staging is built without it, so Phase 1's builder still finds its own anchors on top of staging.
if "--honest" in sys.argv:
    RQ = chr(8217)
    swap("const LOCK_LINE = (n) => `A new lesson opens every morning. You\\u2019ll get a text as soon as lesson ${n} is ready.`;",
         "const LOCK_LINE = (n) => `A new lesson opens every morning. Come back to this link for lesson ${n}.`; /* version 161: reminders aren't sent yet */")
    swap('<p class="lt-sub">You can close this. We' + RQ + 'll text you lesson ${nx.n} tomorrow at&nbsp;8&nbsp;AM.</p>',
         '<p class="lt-sub">You can close this. Lesson ${nx.n} opens tomorrow morning, right here.</p>')
    swap('locked ? `Lesson ${nx.n} unlocks tomorrow.` : `Lesson ${nx.n} comes by text tomorrow.`',
         'locked ? `Lesson ${nx.n} unlocks tomorrow.` : `Lesson ${nx.n} opens tomorrow.`')
    swap('locked ? "There\\u2019ll be a new 5 minute lesson every morning. You\\u2019ll get a text when it\\u2019s ready."',
         'locked ? "There\\u2019ll be a new 5 minute lesson every morning, right here."')
    swap(': nx ? `<p><b>Lesson ${nx.n} comes by text tomorrow.</b></p>`',
         ': nx ? `<p><b>Lesson ${nx.n} opens tomorrow.</b></p>`')
    swap("text: \"The lessons come one a day. Finish today\\u2019s, and we\\u2019ll text you the next one tomorrow morning.",
         "text: \"The lessons come one a day. Finish today\\u2019s, and the next one opens tomorrow morning.")
    swap('<p class="lt-sub">Or close this. We' + RQ + 'll text you tomorrow at&nbsp;8&nbsp;AM.</p></div>`;',
         '<p class="lt-sub">Or close this. One issue lesson a day, right here.</p></div>`;')
    left = [x for x in ["text you", "by text", "get a text"] if x in s]
    print("honest copy on; remaining text mentions:", {x: s.count(x) for x in left})

# ---------- write ----------
STYLE = '<style id="v161-css">' + CSS1 + CSS2 + "</style>\n</head>"
swap("</head>", STYLE)
assert chr(8212) not in s, "em dash"
open(OUT, "w", encoding="utf-8").write(s)
print("wrote", OUT, len(s))
