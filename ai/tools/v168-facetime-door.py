"""Version 168 (Nov 15, 2026), from Robert's 9:49 PM PT phone run. Applied to all four app pages (live, staging, dev and p1).

1. The door looks like a FaceTime call (Robert asked which layout is better; Claude's pick, made the call): the voter fills
   the screen, the latest line from each of you shows as a caption over the bottom of the picture, and the live words card
   sits over it too while you talk. Nothing scrolls and no transcript stays (a real door has none). Replaces version 166's
   fixed 44% picture.
2. Your words get punctuation. The phone's speech-to-text has none, so after you speak the page asks the practice AI's
   /tidy (practice AI 165-6) to add punctuation and capitals only (the server refuses any change to the words) and swaps
   the caption in when it arrives. The voter's answer doesn't wait for it.

To undo: git revert the Version 168 commit. Usage: python3 v168-facetime-door.py page.html ... (edits in place)
"""
import sys

OLD_CSS = '''  .content.stage > .frame.convo-stage { flex: 0 0 44%; min-height: 0; }
  .content.stage > .frame.convo-stage + .thread { flex: 1 1 0; min-height: 0; overflow: hidden; justify-content: flex-end; -webkit-mask-image: linear-gradient(transparent 0, #000 22px); mask-image: linear-gradient(transparent 0, #000 22px); }
  .content.stage > .frame.convo-stage + .thread > .note.wai-pill { order: -1; margin-bottom: auto; }
  .content.stage > .frame.convo-stage ~ .talk-live .tl-said { height: 3.9em; max-height: 3.9em; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-end; }
'''
NEW_CSS = '''  /* version 168: the door as a FaceTime call. The voter fills the screen; the latest lines are captions over the bottom of
     the picture, and the live words card sits there while you talk. Nothing scrolls. */
  .content.stage > .frame.convo-stage { flex: 1 1 auto; min-height: 0; overflow: hidden; }
  .frame.convo-stage > svg { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
  .frame.convo-stage > .thread { position: absolute; inset: 0; z-index: 2; margin: 0; padding: 12px 12px 14px; display: flex; flex-direction: column; justify-content: flex-end; gap: 8px; overflow: hidden; background: linear-gradient(to top, rgba(28, 24, 20, .58) 0, rgba(28, 24, 20, .18) 34%, rgba(28, 24, 20, 0) 52%); }
  .frame.convo-stage > .thread > .note.wai-pill { order: -1; margin: 0 auto auto 0; padding: 5px 11px; border-radius: 999px; background: rgba(255, 253, 249, .88); font-size: 11px; line-height: 1.3; white-space: nowrap; max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
  .frame.convo-stage > .thread .bub { max-width: 90%; font-size: 15.5px; box-shadow: 0 2px 12px rgba(0, 0, 0, .16); }
  .frame.convo-stage > .thread .bub.them { background: rgba(255, 253, 249, .96); border-color: transparent; }
  .frame.convo-stage > .thread .typing { align-self: flex-start; background: rgba(255, 253, 249, .96); }
  .frame.convo-stage > .talk-live { position: absolute; left: 10px; right: 10px; bottom: 10px; z-index: 3; margin: 0; box-shadow: 0 6px 24px rgba(0, 0, 0, .22); }
  .frame.convo-stage > .talk-live .tl-said { max-height: 3.9em; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-end; }
  .frame.convo-stage:has(> .talk-live) > .thread .bub, .frame.convo-stage:has(> .talk-live) > .thread .typing { visibility: hidden; }
'''

for path in sys.argv[1:]:
    s = open(path, encoding="utf-8").read()

    def swap(old, new, n=1):
        global s
        assert s.count(old) == n, (path, s.count(old), old[:90])
        s = s.replace(old, new)

    swap(OLD_CSS, NEW_CSS)
    # the thread lives inside the picture; the picture fills its frame
    swap('''    <div class="frame stage-frame door-stage convo-stage">${scene(d.scene, d.persona, { main: true, sign: d.sign, shut: d.scene === "door", away: d.scene === "store", label: `${d.name}, ${d.sub}` })}<video class="selfie" id="selfie" playsinline muted autoplay hidden></video></div>
    <div class="thread" id="thread">${WAI.pill()}</div>
  `, { tag: "", back: "path", stage: true, footer: composer("send", "Type what you\\u2019d say") });''',
         '''    <div class="frame stage-frame door-stage convo-stage">${scene(d.scene, d.persona, { main: true, sign: d.sign, shut: d.scene === "door", away: d.scene === "store", label: `${d.name}, ${d.sub}` }).replace("<svg ", '<svg preserveAspectRatio="xMidYMid slice" ')}<video class="selfie" id="selfie" playsinline muted autoplay hidden></video><div class="thread" id="thread">${WAI.pill()}</div></div>
  `, { tag: "", back: "path", stage: true, footer: composer("send", "Type what you\\u2019d say") }); /* version 168: the FaceTime door */''')
    swap('''    <div class="frame stage-frame door-stage convo-stage">${scene(d.scene, d.persona, { main: true, shut: true, label: `${d.name}, ${d.sub}` })}<video class="selfie" id="selfie" playsinline muted autoplay hidden></video></div>
    <div class="thread" id="thread">${WAI.pill()}${S.drill.kind === "aiissue" ? `<p class="note">${esc(d.intro)}</p><p hidden>` : `<p class="note">`}Door ${(S.round ? S.round.i : 0) + 1} of 3 \\u00b7 ${d.street}</p></div>''',
         '''    <div class="frame stage-frame door-stage convo-stage">${scene(d.scene, d.persona, { main: true, shut: true, label: `${d.name}, ${d.sub}` }).replace("<svg ", '<svg preserveAspectRatio="xMidYMid slice" ')}<video class="selfie" id="selfie" playsinline muted autoplay hidden></video><div class="thread" id="thread">${WAI.pill()}${S.drill.kind === "aiissue" ? `<p class="note">${esc(d.intro)}</p><p hidden>` : `<p class="note">`}Door ${(S.round ? S.round.i : 0) + 1} of 3 \\u00b7 ${d.street}</p></div></div>''')
    # the live words card sits over the picture too
    swap('''  const host = $("#content");
  if (!host) return null;
  c = document.createElement("div");
  c.className = "talk-live";''', '''  const host = $("#screen .frame.convo-stage") || $("#content"); /* version 168: over the FaceTime door */
  if (!host) return null;
  c = document.createElement("div");
  c.className = "talk-live";''')
    # punctuation for what you said
    swap('''  addBubble("you", text);
  S.convo.turns.push({ who: "you", text });''', '''  addBubble("you", text);
  S.convo.turns.push({ who: "you", text });
  WAI.tidy(text); /* version 168: punctuation arrives a moment later; the voter doesn't wait for it */''')
    swap("  return { ready, settle, flagged, full, scenFor, voiceClip, warmOpening, dots, voter, coachConvo, firstTry, failText, voterFailed, retry, recoach, rows, block, pill, issueLink, startIssue, autoKnock, liveTurn, spec, hold, stopAll, state: () => state };",
         '''  /* version 168: punctuation and capitals for what the volunteer said (the server keeps every word as said) */
  function tidy(text) {
    if (!full() || !S.convo || !text || /[.?!]$/.test(text.trim())) return;
    const at = S.convo.turns.length - 1, conv = S.convo, bubs = document.querySelectorAll("#thread .bub.you"), bub = bubs[bubs.length - 1];
    fetch(base + "/tidy", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ scenario: scenFor(), text }) })
      .then((r) => (r.ok ? r.json() : null)).then((j) => {
        if (!j || !j.text || j.text === text || S.convo !== conv || !conv.turns[at] || conv.turns[at].text !== text) return;
        conv.turns[at].text = j.text;
        if (bub && bub.isConnected && bub.textContent === text) bub.textContent = j.text;
      }).catch(() => {});
  }
  return { ready, settle, flagged, full, scenFor, voiceClip, warmOpening, dots, voter, coachConvo, firstTry, failText, voterFailed, retry, recoach, rows, block, pill, issueLink, startIssue, autoKnock, liveTurn, spec, hold, stopAll, tidy, state: () => state };''')

    open(path, "w", encoding="utf-8").write(s)
    print("patched", path)
