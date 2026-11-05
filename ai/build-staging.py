"""Version 156 (staging): the live AI voter and coach in the Maya Kaur app.
Robert, Nov 4, 11:20 PM ET: replace the scripted voters and keyword grading with a real multi-turn AI conversation and
transcript-grounded coaching, first in one intro scenario (lesson 1's 2nd try, Kevin), then one issue scenario (Bri, health
insurance), on a staging copy so the live app (version 155) stays untouched.
What it does to a copy of app.html:
- inlines ai/client/engine.js (the WAI object: calls to Warmup's own server, no key, no prompts) and ai/client/engine.css;
- WAI_PUB, the score card's names and rows, comes from ai/scenarios.js through node, so the page and the server agree;
- aiOn() is on when the server answers; lesson 1's 2nd try with Kevin becomes a full conversation (up to ten turns, the voter
  ends it), the 1st try's one line and the conversation are coached by the server, and a failed call says so with a retry
  instead of quietly switching to the scripted voter;
- the score card draws the scenario's own rows, with What worked, Try next and the full coaching screen;
- a door "bri" plays Maya's health insurance question from the Practice tab after lesson 6, or from ?convo=bri;
- ?convo=kevin opens lesson 1's 2nd try straight away; the issue lessons' frame points one folder up.
Usage: python3 ai/build-staging.py /abs/app155.html /abs/out.html [worker url]
No backslashes or non-ASCII in this file: @ELL@ is the ellipsis, @Q@ a single quote, @DQ@ a double quote, @N@ a new line."""
import json
import os
import subprocess
import sys

APP, OUT = sys.argv[1:3]
URL = sys.argv[3] if len(sys.argv) > 3 else ""
HERE = os.path.dirname(os.path.abspath(__file__))
s = open(APP, encoding="utf-8").read()
TOK = {"@ELL@": chr(8230), "@Q@": chr(39), "@N@": chr(10), "@DQ@": chr(34)}


def tok(x):
    for k, v in TOK.items():
        x = x.replace(k, v)
    return x


pub = subprocess.run(["node", "--input-type=module", "-e",
                      "import { SCENARIOS, publicScenario } from " + json.dumps(os.path.join(HERE, "scenarios.js")) + ";"
                      "const o = {}; for (const k of Object.keys(SCENARIOS)) o[k] = publicScenario(k); console.log(JSON.stringify(o));"],
                     capture_output=True, text=True, check=True).stdout.strip()
assert pub.startswith("{") and "kevin_intro" in pub and "bri_health" in pub
engine = open(os.path.join(HERE, "client", "engine.js"), encoding="utf-8").read().replace("__WAI_URL__", URL).replace("__WAI_PUB__", pub)
css = open(os.path.join(HERE, "client", "engine.css"), encoding="utf-8").read()

BRI = '''  /* version 156: Maya's health insurance question as a live AI conversation (ai/scenarios.js bri_health); no scripted lines, so it opens only when the practice AI is on */
  bri: {
    persona: "brianna", scene: "door", name: "Bri", sub: "Supporter, home health aide", street: "2F", ai: "bri_health", rate: 1,
    intro: "Bri, apartment 2F. She@Q@s been wondering about health insurance.",
    first: { say: "Hi. Can I help you?", expr: "neutral" },
    start(st) { st.stage = "door"; },
    suggest() { return ""; },
    reply() { return { say: "Sorry, I have to run. Thanks for stopping by.", expr: "neutral", end: true }; },
  },
'''

SWAPS = [
    # the engine, before the claude.ai sample path
    ("/* ---------- live AI: claude.ai", engine + "@N@/* ---------- live AI: claude.ai", 1),
    ("function aiFail(e) {", "function aiFail(e) {@N@  if (e && e.wai) { toast(WAI.failText(e)); return e.code; } /* version 156 */", 1),
    ("async function aiVoter(d) {", "async function aiVoter(d) {@N@  if (WAI.full(d)) return WAI.voter(d, S.convo.turns); /* version 156 */", 1),
    ("async function aiGradeConvo(d) {", "async function aiGradeConvo(d) {@N@  if (WAI.full(d)) return WAI.coachConvo(d, S.convo.turns); /* version 156 */", 1),
    ("async function aiGradeOpener(text) {", "async function aiGradeOpener(text) {@N@  if (WAI.ready()) return WAI.firstTry(text); /* version 156: the 1st try's line, coached by the server */", 1),
    # the door: which door a drill plays, the label, the voice
    ('const doorKey = () => (S.drill && S.drill.kind === "knock" ? S.drill.door : SK().door);',
     'const doorKey = () => (S.drill && (S.drill.kind === "knock" || S.drill.kind === "aiissue") ? S.drill.door : SK().door);', 1),
    ('  kevin: {@N@    persona: "kevin", scene: "door", name: "Kevin"', BRI + '  kevin: {@N@    persona: "kevin", scene: "door", name: "Kevin"', 1),
    ('  if (S.drill && S.drill.kind === "knock") return app(`', '  if (S.drill && (S.drill.kind === "knock" || S.drill.kind === "aiissue")) return app(`', 1),
    ('<p class="note">Door ${(S.round ? S.round.i : 0) + 1} of 3 ',
     '${WAI.pill()}${S.drill.kind === "aiissue" ? `<p class="note">${esc(d.intro)}</p><p hidden>` : `<p class="note">`}Door ${(S.round ? S.round.i : 0) + 1} of 3 ', 1),
    ('<div class="thread" id="thread"></div>', '<div class="thread" id="thread">${WAI.pill()}</div>', 1),
    ("  const clip = await voterClip(d.persona, text);", "  const clip = WAI.full(d) ? await WAI.voiceClip(d, text) : await voterClip(d.persona, text); /* version 157: the AI conversation speaks in a natural voice from the server; the phone@Q@s voice is the fallback */", 1),
    ("shortDoor() ? 2 : 7", "WAI.full() ? 6 : shortDoor() ? 2 : 7", 3),
    # the turn: the tail becomes voterReply, so a failed answer can be asked for again
    ("  // The scripted voter always runs too: it tracks moves for the fallback score and covers any AI hiccup.@N@  const scripted = d.reply(S.convo.st, text);@N@  let r = scripted;@N@",
     "  // The scripted voter always runs too: it tracks moves for the fallback score and covers any AI hiccup.@N@  const scripted = d.reply(S.convo.st, text);@N@  await voterReply(d, scripted, typing);@N@}@N@"
     "/* version 156: the voter's answer, split out of sendTurn so WAI.retry can ask again for the same turn */@N@async function voterReply(d, scripted, typing) {@N@  let r = scripted;@N@  const full = WAI.full(d);@N@", 1),
    ("  if (S.convo.mode === @DQ@live@DQ@ && aiOn() && !(d.short && VOTER_AUDIO[d.persona])) {@N@    try {@N@      r = await aiVoter(d);@N@    } catch (e) {@N@      aiFail(e);",
     "  if (S.convo.mode === @DQ@live@DQ@ && (full || (aiOn() && !(d.short && VOTER_AUDIO[d.persona])))) {@N@    try {@N@      r = await aiVoter(d);@N@    } catch (e) {@N@      if (full) { typing.remove(); WAI.voterFailed(d, e, scripted); return; } /* version 156: say so, never swap in the script */@N@      aiFail(e);", 1),
    ("if ((youTurns >= 9 || (shortDoor() && youTurns >= 2)) && !r.end)", "if ((youTurns >= (full ? 10 : 9) || (!full && shortDoor() && youTurns >= 2)) && !r.end)", 1),
    # the coaching
    ('addNote("Scoring your conversation', 'addNote(WAI.full(d) ? "Your coach is reading the conversation@ELL@" : "Scoring your conversation', 1),
    ("try { result = await aiGradeConvo(d); } catch (e) { aiFail(e); }",
     "try { result = await aiGradeConvo(d); } catch (e) { if (WAI.full(d)) { try { result = await aiGradeConvo(d); } catch (e2) { result = Object.assign(result, { coachErr: true }); } } else aiFail(e); } /* version 156: one quiet retry, then an honest label */", 1),
    ("who: d.name, day: S.day };",
     "who: d.name, day: S.day };@N@  if (WAI.full(d)) { S.last.coach = result.coach || null; S.last.coachErr = !!result.coachErr; S.last.turns = S.convo.turns.map((x) => ({ who: x.who, text: x.text })); S.last.scen = WAI.scenFor(); } if (S.drill && S.drill.kind === @DQ@aiissue@DQ@) { S.last.prior = []; if (!S.last.coach) { S.last.noScore = true; S.last.moves = [false, false, false, false]; } } /* version 156: no lesson 1 rows on an issue card */", 1),
    # the score card
    ("const [emo, word] = hits === 3 ?", "const [emo, word] = hits === 3 && L.moves.length === 4 ?", 1),
    ('VERDICT[hits === 4 ? "strong" : hits >= 2 ? "ok" : "weak"]', 'VERDICT[hits === L.moves.length && !WAI.flagged(L) ? "strong" : hits >= 2 ? "ok" : "weak"]', 1),
    ('${ring(hits / 4, 52, 7)}<span class="ring-num num" style="font-size:15px">${hits}/4</span>',
     '${ring(hits / L.moves.length, 52, 7)}<span class="ring-num num" style="font-size:15px">${hits}/${L.moves.length}</span>', 1),
    ('<ul class="sc-list">${sk.moves.map(', '<ul class="sc-list">${WAI.rows(L) || sk.moves.map(', 1),
    ("    ${sayCard}@N@    ${prior}@N@  `, { tag: drill ? (warm ? @DQ@Warmup@DQ@ : @DQ@Practice@DQ@) : @DQ@Feedback@DQ@, noBack: true, footer, stage: !!sd });",
     "    ${WAI.block(L)}@N@    ${sayCard}@N@    ${prior}@N@  `, { tag: drill ? (warm ? @DQ@Warmup@DQ@ : @DQ@Practice@DQ@) : @DQ@Feedback@DQ@, noBack: true, footer, stage: !!sd });", 1),
    ('  else if (drill && drill.kind === "knock") footer =',
     '  else if (drill && drill.kind === "aiissue") footer = `<button class="btn" data-act="door-again">Try this conversation again</button><button class="link center" data-act="coach-back">Done for now</button>`; /* version 156 */@N@  else if (drill && drill.kind === "knock") footer =', 1),
    # a door decides at the knock, after the health check, and keeps that mode (the reviewer: a slow first check let a scripted line play under the AI label)
    ("async function knock() {@N@  const d = DOORS[doorKey()];@N@  S.convo.knocked = true;",
     "async function knock() {@N@  const d = DOORS[doorKey()];@N@  if (S.convo.knocking) return; S.convo.knocking = true; if (WAI.scenFor()) await WAI.settle(); /* only AI doors wait for the check, at most 4 s */ if (!S.convo || S.screen !== @DQ@door@DQ@) return; S.convo.wai = WAI.full(d); /* version 156 */@N@  S.convo.knocked = true;", 1),
    ('  S.convo.mode = aiOn() ? "live" : "scripted";@N@', '  S.convo.mode = S.convo.wai || aiOn() ? "live" : "scripted"; /* version 156 */@N@', 1),
    ('case "knock": if (S.convo && !S.convo.knocked) knock(); break;', 'case "knock": if (S.convo && !S.convo.knocked && !S.convo.knocking) knock(); break;', 1),
    ('if (S.convo.mode === "live" && aiOn() && S.convo.turns.some((x) => x.who === "you")) {', 'if (S.convo.mode === "live" && (WAI.full(d) || aiOn()) && S.convo.turns.some((x) => x.who === "you")) {', 1),
    ("  if (aiOn()) {@N@    S.tryRes = { lesson: n, text, hits, pending: true };", "  if (aiOn() || (n === 1 && WAI.ready())) { /* version 156: lesson 1@Q@s 1st try goes to Warmup@Q@s coach */@N@    S.tryRes = { lesson: n, text, hits, pending: true };", 1),
    ('<div class="sc-card"><ul class="sc-list">', '<div class="sc-card"${L.noScore ? " hidden" : ""}><ul class="sc-list">', 1),
    ('${scTop}</div>` : scTop}', '${L.noScore ? "" : scTop}</div>` : (L.noScore ? "" : scTop)}', 1),
    # screens and actions
    ("chrec: vChRec };", "chrec: vChRec, coachfull: vCoachFull };", 1),
    ('if (S.drill && !["main", "door", "score", "warmtip"].includes(screen)) endDrillState();', 'if (S.drill && !["main", "door", "score", "warmtip", "coachfull"].includes(screen)) endDrillState();', 1),
    ('    case "door-again": go("door"); break;',
     '    case "door-again": go("door"); if (S.drill && S.drill.kind === "aiissue") WAI.autoKnock(); break;@N@'
     '    case "wai-retry": WAI.retry(); break; /* version 156 */@N@    case "coach-full": go("coachfull"); break;@N@    case "coach-retry": WAI.recoach(); break;@N@    case "wai-issue": S.hist = []; WAI.startIssue(); break;', 1),
    ('{ tabs: "practice", footer: `<button class="btn" data-act="knock-start">Knock</button>` });',
     '{ tabs: "practice", footer: `<button class="btn" data-act="knock-start">Knock</button>${WAI.issueLink()}` });', 1),
    # typing instead of talking: on a page that uses the mic itself the box was read-only, so a canvasser whose speech
    # recognition fails had no way in. Type instead opens the box for the rest of the conversation.
    ('<span id="talk-label">${talkLabel()}</span></button>@N@  </div>`;',
     '<span id="talk-label">${talkLabel()}</span></button>${live && S.screen === "door" && !S.typeMode && WAI.full() ? `<button class="link wai-type" data-act="wai-type">Type instead</button>` : ""}@N@  </div>`; /* version 156 */', 1),
    ("  setTimeout(() => { armTries = 0; micArm(); }, 0); /* version 111 */",
     "  if (S.typeMode && S.screen === @DQ@door@DQ@) { const sy = $(@DQ@#say@DQ@); if (sy) sy.readOnly = false; const tb = $(@DQ@#talk .wai-type@DQ@); if (tb) tb.remove(); setTimeout(() => { trayOpen(true); if (sy && !isTouch()) sy.focus(); }, 0); return; } /* version 156: Type instead */@N@"
     "  setTimeout(() => { armTries = 0; micArm(); }, 0); /* version 111 */", 1),
    ('case "talk": talkTap(); break;',
     'case "talk": talkTap(); break;@N@case "wai-type": { S.typeMode = true; stopMic(); const sy = $("#say"); if (sy) { sy.readOnly = false; trayOpen(true); sy.focus(); } const tb = $("#talk .wai-type"); if (tb) tb.remove(); break; } /* version 156 */', 1),
    ('function initConvo() {@N@', 'function initConvo() {@N@  S.typeMode = false; /* version 156: each conversation starts on the mic */@N@', 1),
    # keep the voter in view: in a live conversation only the last two lines show on the door (the whole transcript is on the coaching screen)
    ("  b.textContent = text;@N@  t.appendChild(b);@N@  scrollDown();@N@}",
     "  b.textContent = text;@N@  t.appendChild(b);@N@  if (WAI.full()) { const bs = t.querySelectorAll(@DQ@.bub@DQ@); bs.forEach((x, i) => x.classList.toggle(@DQ@old@DQ@, i < bs.length - 2)); } /* version 156 */@N@  scrollDown();@N@}", 1),
    # staging lives one folder down
    ("'<iframe src=@DQ@issues/?all'", "'<iframe src=@DQ@../issues/?all'", 1),
    # review shortcuts: ?convo=kevin opens lesson 1's 2nd try, ?convo=bri the issue conversation
    ("loadVoices();@N@render();@N@})();@N@</script>",
     "{ const cv = new URLSearchParams(location.search).get(@DQ@convo@DQ@); if (cv && S.track === @DQ@gotv@DQ@) { S.lesson = 1; S.intakeDone = true; S.mode = S.mode || @DQ@voice@DQ@; S.hist = []; S.screen = @DQ@welcome@DQ@; setTimeout(() => { if (cv === @DQ@bri@DQ@) WAI.startIssue(); else go(@DQ@door@DQ@); }, 0); } } /* version 156 */@N@"
     "loadVoices();@N@render();@N@})();@N@</script>", 1),
    ("</head>", "<style>@N@" + css + "</style>@N@</head>", 1),
]
for old, new, n in SWAPS:
    o, w = tok(old), tok(new)
    got = s.count(o)
    assert got == n, (got, n, old[:90])
    s = s.replace(o, w)
print("swapped", len(SWAPS), "strings")
assert chr(8212) not in s, "em dash in the page"
assert "sk-ant" not in s and "x-api-key" not in s and "ANTHROPIC_API_KEY" not in s, "a key or key header in the page"
me = open(__file__, encoding="utf-8").read()
assert chr(92) not in me and all(ord(ch) < 128 for ch in me)
open(OUT, "w", encoding="utf-8").write(s)
print("wrote", OUT, len(s), "chars", "worker:", URL or "(none: the page says the practice AI isn't connected)")
