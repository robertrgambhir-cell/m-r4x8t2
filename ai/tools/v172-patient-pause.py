"""Version 172 (Nov 17, 2026), from Robert's 7:54 PM PT run: "Hi, I'm Robert, um, I'm" was sent mid-sentence and Sofia answered.
"We can't have this be something that just responds the second there's a pause... some people just pause when they're
talking, especially since they're going to be nervous."

On an AI door the page waits for the volunteer by how their words end, not by a fixed second:
- a line that sounds finished: the early answer starts at 0.5 s of quiet and it sends at 1.2 s (was 0.45 s and 1 s);
- a line that stops mid-thought (ends on "um", "I'm", "and", "with" and the like, or is under three words): it waits, the early
  answer starts at 2 s and it sends at 2.8 s.
A mic that goes quiet because something else took it (a pop-up) is the second case, since the words stop mid-thought.
Applied to all four app pages (live, staging, dev and p1).

To undo: git revert the Version 172 commit. Usage: python3 v172-patient-pause.py page.html ... (edits in place)
"""
import sys

OLD = "if (said0) { r.pz = setTimeout(() => { if (rec === r) WAI.spec(said0); }, 450); r.pc = setTimeout(() => { if (rec === r && !recStop) { recStop = true; try { r.stop(); } catch (e2) { /* ignore */ } r.onend(); } }, 1000); }"
NEW = "if (said0) { const pw = waiPause(said0); r.pz = setTimeout(() => { if (rec === r) WAI.spec(said0); }, pw[0]); r.pc = setTimeout(() => { if (rec === r && !recStop) { recStop = true; try { r.stop(); } catch (e2) { /* ignore */ } r.onend(); } }, pw[1]); }"
ANCHOR = "let micBlocked = false, micWhy = \"\", micPrimed = false"
FN = """/* version 172 (Robert, Nov 17): how long to wait for the volunteer depends on how their words end. A line that stops
   mid-thought gets time to go on; a finished one gets a quick answer. [early answer starts, sends] in ms */
const WAI_MID = /\\b(um+|uh+|uhm|er+|erm|hmm+|ah|and|but|so|or|because|cause|i|i'?m|i am|my|me|we|we'?re|our|the|a|an|to|for|with|of|in|on|at|about|from|like|just|that|this|is|are|was|am|be|it'?s|you|your|who|what|if|then|also|really|very|name'?s|called|here|um i'?m)$/i;
function waiPause(text) {
  const t = String(text).trim().replace(/[\\s.,!?;:\\u2026-]+$/, "");
  return WAI_MID.test(t) || t.split(/\\s+/).filter(Boolean).length < 3 ? [2000, 2800] : [500, 1200];
}
"""

for path in sys.argv[1:]:
    s = open(path, encoding="utf-8").read()
    assert s.count(OLD) == 1, (path, "OLD", s.count(OLD))
    s = s.replace(OLD, NEW)
    assert s.count(ANCHOR) == 1, (path, "ANCHOR", s.count(ANCHOR))
    s = s.replace(ANCHOR, FN + ANCHOR)
    C = "version 165: an AI door sends on its own after 1 s of quiet and starts the answer at 0.45 s"
    assert s.count(C) == 1, (path, "C")
    s = s.replace(C, C + " (version 172: after 1.2 s, or 2.8 s when the words stop mid-thought; see waiPause)")
    open(path, "w", encoding="utf-8").write(s)
    print("patched", path)
