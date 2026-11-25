"""Version 176 (Nov 25, 2026): nobody is cut off mid-sentence at the door (playbook rule 34a, voter rule 15).

Robert's two notes on the signature course, which share this rule with the door-knocking demo:
- Nov 22, 2026, 4:10 PM: "it cut me off in lesson 2, partway through ... it just cut off my voice. I was still talking,
  unfinished." His line as the phone heard it ended "...to get" and was taken as finished after a short pause.
- Nov 23, 2026, 4:10 PM: "It cut me off when I was talking too soon, and I was still talking." His phone heard "Hi how are
  you", a greeting counted as a finished line, and the passerby answered after 1.2 seconds.
The signature thread found the same short list in this demo's listener (WAI_MID): a pause after "to get" or after "Hey, how's
it going?" ended the line. This is the door-knocking thread's sweep of rule 34a, on the review copy first (rule B1).

What changes for the canvasser:
- Only a line that sounds finished gets the quick answer (1.2 s of quiet): a goodbye or thanks, a question the phone heard
  end, or words that end a thought ("Election Day is Tuesday.", "Are you planning to vote", "I'm going door to door"). A line
  that could go on waits 2.8 s: it ends on a word that needs more after it ("we're trying to get," "Maya Kaur is running,"
  "Do you know if"), it's only a hello or small talk ("Hi, how are you?", "Hey, how's it going?"), or it's under three words
  ("Okay" or "Sure" alone may lead into more). When unsure, it waits. "Thank you" and "Nice to meet you" get the quick answer
  now (they waited 2.8 s).
- When the phone stops listening on its own partway through a line (iOS does, after a short pause), the page listens again
  and keeps the words. Before, the words waited behind "Got it. Tap Send it, or tap the mic to say it again." and anything
  said next was lost. A line now ends on the quiet rule (an AI door), a tap on "I'm done" or, at most, a minute's talk (was
  30 s). The time the phone takes to listen again isn't the canvasser's quiet: it's left off the clock, up to 2 s a time.
- A microphone error partway through a line on an AI door sends what was heard. When the phone won't listen again (WebKit
  refuses a start while the page is hidden and fires only an error, no end), the words are kept: an AI door sends them, any
  other door keeps them behind "Send it", and never the blocked-mic card. While the page is hidden it doesn't try to listen
  again: the words wait behind "Send it", as before. A mic that's blocked or taken (permission, a call) at the start of a line
  still freezes the lesson behind its card, as version 94 set.

The issue training page's door (wdpfxqlsvp/review/train/, Learn's issue trainings) gets the same rule in its own source,
ai/train/train.html, rebuilt with node ai/tools/build-train.mjs --out wdpfxqlsvp/review/train. It ended every line after 0.9 s
of quiet and sent the words at once when the phone stopped on its own. Its waiPause() is the same code as the door's
(ai/tests/door-pause.test.mjs checks), and ai/tests/train-cutoff.cjs plays the cases in a browser.

An outside review (Nov 25) found the first draft lost a line behind the blocked-mic card when the phone wouldn't listen again,
and timed "Okay" alone as finished; both are fixed here and in the tests.

Applied to the review copy, staging and dev (wdpfxqlsvp/review/index.html, staging/index.html, dev/index.html); the live
demo (app.html, p1/index.html, train/index.html) gets it at Robert's "ship it." No change to the AI server.

To undo: git revert the Version 176 commit.
Usage: python3 ai/tools/v176-no-cut-off.py page.html ... (edits in place)
"""
import sys

SWAPS = []

# 1. how long to wait: only a finished-sounding line gets the quick answer
OLD_PAUSE = r"""function waiPause(text) {
  const t = String(text).trim().replace(/[\s.,!?;:\u2026-]+$/, "");
  return WAI_MID.test(t) || t.split(/\s+/).filter(Boolean).length < 3 ? [2000, 2800] : [500, 1200];
}
"""
NEW_PAUSE = r"""/* version 176 (playbook rule 34a; Robert, on the signature course, Nov 22, 2026: "it just cut off my voice. I was still talking,
   unfinished.", and Nov 23: "It cut me off when I was talking too soon"): nobody is cut off mid-sentence. Only a line that sounds
   finished gets the quick answer: a goodbye or thanks (WAI_BYE), a question the phone heard end, or words that end a thought (WAI_DONE). A line
   waits when it ends on a word that needs more after it (WAI_MID, WAI_MORE, or "to" and a verb: "trying to get"), when it's only a
   hello or small talk ("Hi, how are you?", "Hey, how's it going?": WAI_SMALL, WAI_HELLO) or when it's under three words. When unsure,
   it waits. Before: only WAI_MID, so "we're trying to get" and "Hey, how's it going?" sent after 1.2 s, and "Thank you." waited 2.8. */
const WAI_MORE = /\b(get|gets|got|getting|keep|keeps|keeping|make|makes|making|have|has|had|having|give|gives|giving|put|putting|need|needs|want|wants|wanted|try|tries|trying|tryna|going|gonna|wanna|gotta|hoping|planning|wondering|thinking|looking|let|lets|let'?s|ask|asking|tell|telling|remind|reminding|bring|bringing|take|taking|show|showing|would|could|than|as|since|while|though|although|unless|whether|some|any|every|each|more|most|its|their|his|which|whose|where|when|how|why|there'?s|that'?s|what'?s|they'?re|they|he|she|were|been|being|by|until|till|into|onto|through|maybe|actually|running|volunteering|knocking)$/;
const WAI_TO_DONE = /\bto (vote|help|talk|chat|go|know|meet|stop|wait|sign|register|volunteer|do|it|her|him|them|me|us|that|this|there|today|tonight|tomorrow|tuesday|voters|neighbors|people|folks|everyone|everybody|door|doors|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|noon)$/;
const WAI_BYE = /\b(good ?night|good ?bye|bye( now| bye)?|have an? (good|great|nice|lovely|wonderful|blessed) (one|day|evening|night|weekend|morning|afternoon)|thank you( so much| very much| for your time)?|thanks( so much| a lot| anyway| again| for your time)?|take care|see (you|ya)( later| around| soon| then| tuesday)?|you too|(nice|great|good) (to meet|meeting|talking to|chatting with) you)$/;
const WAI_DONE = /\b(no problem|no worries|of course|sure|okay|ok|all good|appreciate (it|you|that)|count on you|not (you|me|us|them|her|him)|(hear|learn|know) more|(stop|stopping|come|coming|drop|dropping|swing|swinging) by)$/;
const WAI_SMALL = /\b(how (are|r) (you|ya|u)( doing)?( today| tonight| this (morning|afternoon|evening))?|how('?s| is) it going|how('?s| is| has) your (day|morning|afternoon|evening|night|week)( going| been)?|how (you|ya) doing|how'?re you( doing)?|how'?s everything|how are things|what'?s up|good (morning|afternoon|evening))$/;
const WAI_HELLO = /^((hi|hello|hey|hiya|howdy|there|um+|uh+|oh|so|well|yeah|ma'?am|sir|folks|neighbor|good (morning|afternoon|evening)) ?)+$/;
function waiPause(text) {
  const raw = String(text).trim(), t = raw.toLowerCase().replace(/\u2019/g, "'").replace(/[.,!?;:\u2026"\u201c\u201d-]+/g, " ").replace(/\s+/g, " ").trim();
  const LONG = [2000, 2800], SHORT = [500, 1200];
  if (WAI_BYE.test(t)) return SHORT; /* a goodbye or thanks */
  if (WAI_SMALL.test(t) || WAI_HELLO.test(t)) return LONG; /* only a hello, or small talk at the end: the rest is coming (Nov 23) */
  if (t.split(" ").filter(Boolean).length < 3) return LONG; /* "Okay" or "Sure" alone may be the start of more */
  if (WAI_DONE.test(t)) return SHORT; /* an answer that ends a thought ("Sure, no problem.") */
  if (/\?["\u201d]?$/.test(raw) && !/\b(um+|uh+|uhm|er+|erm|hmm+|ah)$/.test(t)) return SHORT; /* a question the phone heard end */
  if (WAI_TO_DONE.test(t)) return SHORT; /* "planning to vote," "talking to voters," "door to door" */
  return WAI_MID.test(t) || WAI_MORE.test(t) || /\bto [a-z']+$/.test(t) ? LONG : SHORT;
}
"""
SWAPS.append(("waiPause", OLD_PAUSE, NEW_PAUSE, 1))

# 2. the listener keeps what it heard when the phone stops on its own
OLD_VARS = 'let heard = "", started = false;'
NEW_VARS = ('let heard = "", started = false, micKept = "", micAgain = 0, micOffAt = 0, micLastAt = 0; /* version 176 (rule 34a): the words kept '
            'when the phone stops listening on its own, how often it has listened again, when it stopped and when the words last changed */')
SWAPS.append(("vars", OLD_VARS, NEW_VARS, 1))

OLD_START = "  r.onstart = () => { micNoStart = 0; micGranted = true; goCue(); };\n  r.onaudiostart = () => { micNoStart = 0; micGranted = true; goCue(); };\n"
NEW_START = r"""  /* version 176 (playbook rule 34a; Robert, Nov 22, 2026: "it just cut off my voice. I was still talking, unfinished."): when the phone
     stops listening on its own partway through a line (iOS does, after a short pause), listen again and keep the words, so a line ends on
     the quiet rule (an AI door), a tap on "I'm done" or, at most, a minute's talk. The time the phone takes to listen again isn't the
     volunteer's quiet (Nov 23: "It cut me off when I was talking too soon"): it's left off the clock, up to 2 s a time. Before: the words
     waited behind "Got it. Tap Send it, or tap the mic to say it again." and anything said next was lost. */
  const aiDoor = () => S.screen === "door" && !!S.convo && WAI.full();
  r.quiet = (now) => { /* an AI door's two timers (the early answer and the send), counted from the last words */
    clearTimeout(r.pz); clearTimeout(r.pc);
    if (!aiDoor() || !heard || recStop) return;
    const said0 = hearName(heard.trim()), pw = waiPause(said0), q = now - micLastAt;
    r.pz = setTimeout(() => { if (rec === r) WAI.spec(said0); }, Math.max(0, pw[0] - q));
    r.pc = setTimeout(() => { if (rec === r && !recStop) { recStop = true; try { r.stop(); } catch (e2) { /* ignore */ } r.onend(); } }, Math.max(0, pw[1] - q));
  };
  r.back = () => { if (!micOffAt) return; const now = performance.now(); micLastAt += Math.min(2000, now - micOffAt); micOffAt = 0; clearTimeout(r.offDog); r.quiet(now); };
  r.again = () => { /* "again": listening again; "send": the line is done; "hold": keep the words for a tap */
    const now = performance.now();
    if (micOffAt) { micLastAt += Math.min(2000, now - micOffAt); micOffAt = 0; } /* a restart that stopped again before it listened */
    if (aiDoor() && now - micLastAt >= waiPause(heard)[1]) return "send"; /* the quiet rule already says the line is done */
    if (micAgain >= 30) return aiDoor() ? "send" : "hold";
    if (document.visibilityState === "hidden") return "hold"; /* the phone was locked or the app left: the words wait behind Send it, as before */
    clearTimeout(r.pz); clearTimeout(r.pc);
    micKept = heard; r.base = 0; r.seen = 0; micAgain += 1; micOffAt = now; r.relisten = true;
    try { r.start(); } catch (e) { micOffAt = 0; r.relisten = false; return aiDoor() ? "send" : "hold"; }
    clearTimeout(r.offDog); r.offDog = setTimeout(() => { if (rec === r) r.back(); }, 2000); /* a phone slow to listen again: after 2 s the quiet clock runs */
    return "again";
  };
  r.onstart = () => { micNoStart = 0; micGranted = true; r.relisten = false; goCue(); r.back(); };
  r.onaudiostart = () => { micNoStart = 0; micGranted = true; r.relisten = false; goCue(); r.back(); };
"""
SWAPS.append(("onstart", OLD_START, NEW_START, 1))

OLD_RES = "const rs = Array.prototype.slice.call(e.results, r.base); heard = heardFrom(rs);"
NEW_RES = ("const rs = Array.prototype.slice.call(e.results, r.base); const now0 = heardFrom(rs); heard = !micKept ? now0 : micKept.split(\" \").length >= 3 && now0.toLowerCase().startsWith(micKept.toLowerCase()) ? now0 : hearName((micKept + \" \" + now0).trim()); "
           "micLastAt = performance.now(); r.relisten = false; if (micOffAt) { micOffAt = 0; clearTimeout(r.offDog); } /* version 176: the words kept from before the phone listened again */")
SWAPS.append(("onresult", OLD_RES, NEW_RES, 1))

OLD_CAP = "recCap = setTimeout(() => { if (rec === r) { try { r.stop(); } catch (e) { /* ignore */ } } }, 30000);"
NEW_CAP = ("recCap = setTimeout(() => { if (rec === r) { r.capped = true; if (aiDoor()) recStop = true; try { r.stop(); } catch (e) { /* ignore */ } } }, 60000); "
           "/* version 176: at most a minute's talk (was 30 s); on an AI door the line then goes */")
SWAPS.append(("cap", OLD_CAP, NEW_CAP, 2))

OLD_ERR = 'r.onerror = (e) => { const k = e && e.error; if (["not-allowed", "service-not-allowed", "audio-capture"].includes(k)) { micBlocked = true; micWhy = k === "audio-capture" ? "busy" : "denied"; micErr = "speech: " + k; } };'
NEW_ERR = ('r.onerror = (e) => { const k = e && e.error; '
           'if (r.relisten && k && k !== "no-speech" && k !== "aborted") { r.relisten = false; micOffAt = 0; clearTimeout(r.offDog); r.capped = true; if (aiDoor() && document.visibilityState !== "hidden") recStop = true; setTimeout(() => { if (rec === r) r.onend(); }, 600); return; } '
           '/* version 176: the phone wouldn\'t listen again (WebKit fires only this error, no end): keep what was heard, never the blocked-mic card (an AI door sends it) */ '
           'if (["not-allowed", "service-not-allowed", "audio-capture"].includes(k)) { micBlocked = true; micWhy = k === "audio-capture" ? "busy" : "denied"; micErr = "speech: " + k; } '
           'else if (k && k !== "no-speech" && k !== "aborted" && heard && !r.armed) { r.capped = true; if (aiDoor()) recStop = true; } }; '
           '/* version 176: a mic error partway through a line on an AI door still sends what was heard (rule 34a) */')
SWAPS.append(("onerror", OLD_ERR, NEW_ERR, 1))

OLD_END = '    if (r.armed) { rec = null; clearTimeout(recDog); clearTimeout(recCap); micBlocked = false; micWhy = ""; setTimeout(micArm, 300); return; } /* version 111 */\n    rec = null;\n'
NEW_END = ('    if (r.armed) { rec = null; clearTimeout(recDog); clearTimeout(recCap); micBlocked = false; micWhy = ""; setTimeout(micArm, 300); return; } /* version 111 */\n'
           '    if (!recStop && !micBlocked && heard && !r.capped) { const w = r.again(); if (w === "again") return; if (w === "send") recStop = true; } /* version 176: the phone stopped on its own mid-line */\n'
           '    clearTimeout(r.pz); clearTimeout(r.pc); clearTimeout(r.offDog);\n'
           '    rec = null;\n')
SWAPS.append(("onend", OLD_END, NEW_END, 1))

for path in sys.argv[1:]:
    s = open(path, encoding="utf-8").read()
    for name, old, new, n in SWAPS:
        assert s.count(old) == n, (path, name, s.count(old))
        s = s.replace(old, new)
    open(path, "w", encoding="utf-8").write(s)
    print("patched", path)
