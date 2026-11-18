"""Version 173 (Nov 18, 2026), from Robert's Nov 17, 8:47 PM PT run: after the conversation ended the door sat shut on
"Your coach is reading the conversation" for 5 to 15 seconds before the result showed. Robert, Nov 18: make the best version.

1. Grading starts the moment the voter's goodbye arrives (earlyGrade), while her goodbye plays and the door closes, instead of
   after both.
2. The result card opens as soon as the door shuts, with the four parts listed and pulsing while the coach reads; they fill in
   (the card's usual cascade) when the grade comes back. The 1st intro's card and the score card (the 2nd intro and other AI
   doors) both do this. If the volunteer leaves the card meanwhile, the grade is still saved.
Only AI conversation doors change; the scripted doors keep their short note. Applied to all four app pages.

To undo: git revert the Version 173 commit. Usage: python3 v173-no-wait-after-door.py page.html ... (edits in place)
"""
import sys

for path in sys.argv[1:]:
    s = open(path, encoding="utf-8").read()

    def swap(old, new, n=1):
        global s
        assert s.count(old) == n, (path, s.count(old), old[:90])
        s = s.replace(old, new)

    # 1. grade from the goodbye
    swap('    S.convo.turns.push({ who: "them", text: o.say });\n',
         '    S.convo.turns.push({ who: "them", text: o.say });\n    if (o.end || S.convo.turns.filter((x) => x.who === "you").length >= (shortDoor() ? 4 : 10)) earlyGrade(d); /* version 173 */\n')
    swap("async function endConvo(d) {",
         """/* version 173 (Robert, Nov 17): grading starts as the goodbye arrives, not after it plays and the door shuts */
function earlyGrade(d) {
  if (!S.convo || S.convo.gradeP || S.convo.mode !== "live" || !WAI.full(d)) return;
  S.convo.gradeP = WAI.coachConvo(d, S.convo.turns.slice());
  S.convo.gradeP.catch(() => {});
}
/* version 173: the result card opens as the door shuts and fills in when the grade comes back */
function gradingScreen(d) {
  if (S.try1) { S.tryRes = { lesson: 1, pending: true, grading: true, at: 0 }; go("try", { noPush: true, noBeat: true }); return "try"; }
  const sc = WAI.scenFor(), pub = sc && WAI_PUB[sc], card = pub ? pub.rubric.filter((r) => r.card).map((r) => r.label) : null;
  S.last = { skill: skKey(), lesson: S.lesson || 1, grading: true, gradeRows: card && card.length ? card : SK().moves.slice(), moves: SK().moves.map(() => false), prior: [], text: "", who: d.name, day: S.day };
  go("score");
  return "score";
}
async function endConvo(d) {""")
    # 2. finishConvo: open the card first, then wait for the grade
    swap("""  let result = { hits: fallback, praise: "", tip: "" };
  if (S.convo.mode === "live" && (WAI.full(d) || aiOn()) && S.convo.turns.some((x) => x.who === "you")) {
    const note = addNote(WAI.full(d) ? "Your coach is reading the conversation…" : "Scoring your conversation\\u2026");
    try { result = await aiGradeConvo(d); } catch (e) {""",
         """  let result = { hits: fallback, praise: "", tip: "" }, back = null;
  const conv = S.convo, t1 = S.try1; /* leaving the door for the card ends 1st intro mode, so remember it */
  if (S.convo.mode === "live" && (WAI.full(d) || aiOn()) && S.convo.turns.some((x) => x.who === "you")) {
    if (WAI.full(d)) back = gradingScreen(d); /* version 173 */
    const note = back ? null : addNote("Scoring your conversation\\u2026");
    try { result = await (conv.gradeP || aiGradeConvo(d)); } catch (e) {""")
    swap("""    if (note) note.remove();
  }
  if (S.screen !== "door") return;
  if (S.try1) {""",
         """    if (note) note.remove();
  }
  const here = back ? S.screen === back && S.convo === conv : S.screen === "door"; /* version 173: a grade that lands after they left is still saved */
  if (!back && !here) return;
  if (t1) {""")
    swap("""    S.try1 = false;
    go("try", { noPush: true, noBeat: true });
    return;
  }""", """    S.try1 = false;
    if (here) go("try", { noPush: true, noBeat: true });
    return;
  }""")
    swap("""  S.sayNow = null;
  S.lastAt[S.track] = Date.now();
  go("score");
}""", """  S.sayNow = null;
  S.lastAt[S.track] = Date.now();
  if (here) go("score", back ? { noPush: true, noBeat: true } : {});
}""")
    # the 1st intro's card while grading
    swap("""  if (R && R.pending) return app(`${head}${scenePart}${pendingCard("Reading your answer\\u2026")}`, { tag: "", stage: knocked });""",
         """  if (R && R.pending && R.grading) return app(`${lessonBar(0, 1)}<h2 class="h2 tight">Your 1st intro</h2><div class="fb try grading"><h3>A good introduction does four things.</h3><ul class="sc-list four-list">${sk.moves.map((m, i) => `<li class="wait ev" style="--i:${i}"><span class="ev-l"><small>Checking</small>${esc(m)}</span></li>`).join("")}</ul><p class="try-lead had">Your coach is reading the conversation\\u2026</p></div>`, { tag: "", stage: true, footer: `<button class="btn" disabled>Next: hear it done</button>` }); /* version 173 */
  if (R && R.pending) return app(`${head}${scenePart}${pendingCard("Reading your answer\\u2026")}`, { tag: "", stage: knocked });""")
    # the score card while grading
    swap("""function vScore() {
  const L = S.last,""", """function vScore() {
  if (S.last && S.last.grading) { /* version 173: the card opens while the coach reads, then fills in */
    const G = S.last, gd = S.track === "gotv" ? DOORS[S.drill ? S.drill.door : SK().door] : null;
    return app(`${S.track === "gotv" ? progressBar(repMoves().length + 2, 1) : ""}${gd ? `<div class="frame stage-frame sc-voter">${scene(gd.scene, gd.persona, { main: true, label: `${gd.name}, ${gd.sub}` })}<div class="sc-top grading"><h1 class="h1 verdict-h" style="margin:0">Checking your conversation\\u2026</h1></div></div>` : ""}<div class="sc-card grading"><ul class="sc-list">${G.gradeRows.map((m, i) => `<li class="wait" style="--i:${i}">${esc(m)}</li>`).join("")}</ul></div><p class="sc-coach">Your coach is reading the conversation\\u2026</p>`, { tag: S.drill ? "Practice" : "Feedback", noBack: true, stage: !!gd });
  }
  const L = S.last,""")
    swap("  .sc-list li.n::before { border: 2px solid var(--ink-3); }\n",
         """  .sc-list li.n::before { border: 2px solid var(--ink-3); }
  .sc-list li.wait { color: var(--ink-2); } /* version 173: a part the coach is still reading */
  .sc-list li.wait::before { border: 2px solid var(--ink-3); animation: waitPulse 1.1s ease-in-out infinite; animation-delay: calc(var(--i, 0) * .14s); }
  .fb.try .four-list li.wait small { color: var(--ink-3); }
  @keyframes waitPulse { 0%, 100% { opacity: .3; transform: scale(.85); } 50% { opacity: 1; transform: scale(1); } }
  @media (prefers-reduced-motion: reduce) { .sc-list li.wait::before { animation: none; opacity: .6; } }
""")
    open(path, "w", encoding="utf-8").write(s)
    print("patched", path)
