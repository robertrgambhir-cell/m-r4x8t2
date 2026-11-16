"""Version 165 (Nov 15, 2026). Robert's three bars for every practice door (Nov 15, 5:33 PM PT voice note): the voter
answers at once or close to it, over a real back-and-forth, to what the canvasser actually said. Applied to all four app
pages (live, staging, dev and p1).

1. The streamed voter. An AI door asks the server's /turn route (live since practice AI 163-turn-4) instead of /voter
   then /speak: one request writes the voter's line and voices each sentence as soon as it is written, and the page
   plays the raw audio as it arrives through the voter's analyser, so the mouth follows it. The words appear sentence by
   sentence as the voice reaches them (version 158's rule). Measured on the live site Nov 6: first word 1.15 to 1.32 s
   after the request, against 2.6 to 4.5 s through /voter and /speak.
2. No tap to finish. On an AI door the mic sends by itself once the words stop for 1 s, and at 0.45 s it starts the
   voter's answer early, held unheard; if the volunteer keeps talking the early answer is thrown away. "I'm done" still
   works.
3. The 1st intro is the same conversation as the 2nd (Robert, Nov 15, 5:39 PM PT: "your first intro and your second
   intro are identical experiences assessed in identical ways"). In lesson 1, when the practice AI is on, Knock opens a
   full AI conversation at Sofia's door (scenario sofia_intro), on the same door screen as Kevin's, and the coach grades
   it on the same four parts; the result comes back to the 1st intro's card. With the practice AI off it stays one line.
4. Both lesson 1 doors run to a natural close, at most four of your lines (Robert, Nov 15, 5:47 PM PT).

To undo: git revert the Version 165 commit. Usage: python3 v165-door-conversation.py page.html ... (edits in place)
"""
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SCEN = os.path.join(HERE, "..", "scenarios.js")
PUB = subprocess.run(["node", "--input-type=module", "-e",
                      "import { SCENARIOS, publicScenario } from " + json.dumps(SCEN) + ";"
                      "const o = {}; for (const k of Object.keys(SCENARIOS)) o[k] = publicScenario(k); console.log(JSON.stringify(o));"],
                     capture_output=True, text=True, check=True).stdout.strip()
assert PUB.startswith("{") and "sofia_intro" in PUB and "kevin_intro" in PUB

STREAM = r'''  /* version 165 (Robert, Nov 15): the voter streams. One request (/turn) writes the voter's line and voices each sentence as
     soon as it's written; the page plays the sound as it arrives, through the voter's analyser so the mouth follows it. A
     request can start early on a short pause (held, unheard) and is thrown away if the volunteer keeps talking. */
  let specH = null;
  const live = new Set();
  const turnsKey = (turns) => turns.map((x) => x.who + ":" + x.text).join("\u0001");
  function stopAll() { live.forEach((h) => h.abort()); live.clear(); specH = null; }
  function stream(turns) {
    const ac = new AbortController(), t0 = performance.now(), tmo = setTimeout(() => ac.abort(), 20000), mp3s = [];
    const h = { at: turns.length, key: turnsKey(turns), tl: { text1: 0, audio1: 0 }, texts: {}, srcs: [], queue: [], started: {}, playOn: false, aborted: false, nextT: 0, lastEnd: 0, hooks: null, gotAudio: false };
    live.add(h);
    const sched = (i, buf) => {
      const ctx = vidCtx;
      if (!ctx || h.aborted || !buf) return;
      if (!voAnalyser) { voAnalyser = ctx.createAnalyser(); voAnalyser.fftSize = 512; voAnalyser.connect(vidGain); }
      vidGain.gain.value = settings.muted ? 0 : 1;
      if (!h.nextT || h.nextT < ctx.currentTime + 0.03) h.nextT = ctx.currentTime + 0.05;
      const at = h.nextT;
      h.nextT += buf.duration; h.lastEnd = h.nextT;
      const src = ctx.createBufferSource();
      src.buffer = buf; src.connect(voAnalyser); src.start(at); h.srcs.push(src);
      src.onended = () => { if (watchSrc === src) watchSrc = null; };
      setTimeout(() => {
        if (h.aborted) return;
        watchSrc = src;
        if (!h.started[i]) { h.started[i] = true; if (h.hooks && h.hooks.onStart) h.hooks.onStart(i, h.texts[i] || ""); }
        if (talkWanted && !voLipRAF) voLipSync();
      }, Math.max(0, (at - ctx.currentTime) * 1000));
    };
    const pcm = (b) => { const ctx = vidCtx, n = b.length >> 1, buf = ctx.createBuffer(1, n, 24000), ch = buf.getChannelData(0), dv = new DataView(b.buffer, b.byteOffset, n * 2); for (let k = 0; k < n; k += 1) ch[k] = dv.getInt16(k * 2, true) / 32768; return buf; };
    const flush = () => {
      if (!h.playOn || !vidCtx) return;
      while (h.queue.length) {
        const q = h.queue.shift();
        if (q.fmt === 1) sched(q.i, pcm(q.b));
        else mp3s.push(new Promise((res) => vidCtx.decodeAudioData(q.b.buffer.slice(q.b.byteOffset, q.b.byteOffset + q.b.length), res, () => res(null))).then((buf) => sched(q.i, buf)));
      }
    };
    h.done = (async () => {
      const r = await fetch(base + "/turn", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ scenario: scenFor(), turns: turnsOf(turns) }), signal: ac.signal });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw { wai: true, code: j.error || "http_" + r.status }; }
      const rd = r.body.getReader();
      let buf = new Uint8Array(0), done = null;
      for (;;) {
        const x = await rd.read();
        if (x.done) break;
        const nb = new Uint8Array(buf.length + x.value.length); nb.set(buf); nb.set(x.value, buf.length); buf = nb;
        while (buf.length >= 5) {
          const n = new DataView(buf.buffer, buf.byteOffset + 1, 4).getUint32(0);
          if (buf.length < 5 + n) break;
          const type = buf[0], p = buf.subarray(5, 5 + n);
          buf = buf.slice(5 + n);
          if (type === 1) {
            const o = JSON.parse(new TextDecoder().decode(p));
            if (o.t === "say") { h.texts[o.i] = o.text; if (!h.tl.text1) h.tl.text1 = Math.round(performance.now() - t0); }
            else if (o.t === "done") done = o;
            else if (o.t === "error") throw { wai: true, code: o.code };
          } else if (type === 2) {
            if (!h.tl.audio1) h.tl.audio1 = Math.round(performance.now() - t0);
            h.gotAudio = true;
            h.queue.push({ i: p[0], fmt: p[1], b: p.slice(2) });
            flush();
          }
        }
      }
      if (!done) throw { wai: true, code: "cut_off" };
      await Promise.all(mp3s);
      return done;
    })().catch((e) => { if (e && e.wai) throw e; throw { wai: true, code: h.aborted ? "aborted" : e && e.name === "AbortError" ? "timeout" : "network" }; }).finally(() => clearTimeout(tmo));
    h.done.catch(() => {}); /* an early answer thrown away is no error */
    h.play = (hooks) => { h.hooks = hooks; h.playOn = true; flush(); };
    h.abort = () => { h.aborted = true; try { ac.abort(); } catch (e) { /* ignore */ } h.srcs.forEach((s) => { try { s.stop(); } catch (e) { /* ignore */ } }); live.delete(h); };
    h.finished = () => new Promise((res) => setTimeout(res, Math.max(0, vidCtx ? (h.lastEnd - vidCtx.currentTime) * 1000 : 0) + 60));
    return h;
  }
  /* the early answer: started on a short pause, kept only if the volunteer's words don't change */
  function spec(text) {
    if (!full() || !S.convo || S.convo.ended || S.convo.busy || !S.convo.knocked) return;
    const turns = S.convo.turns.concat([{ who: "you", text }]), k = turnsKey(turns);
    if (specH && specH.key === k) return;
    if (specH) specH.abort();
    specH = stream(turns);
  }
  function hold(text) {
    if (!specH || !S.convo) return;
    if (specH.key !== turnsKey(S.convo.turns.concat([{ who: "you", text }]))) { specH.abort(); specH = null; }
  }
  async function liveTurn(d, typing) {
    try { await videoAudio(); } catch (e) { /* the phone's voice covers it */ }
    const turns = S.convo.turns.slice(), k = turnsKey(turns);
    let h = specH && specH.key === k ? specH : null;
    if (specH && specH !== h) specH.abort();
    specH = null;
    if (!h) h = stream(turns);
    S.convo.req = h;
    let bub = null;
    const said = [];
    const show = (t) => {
      if (typing && typing.parentNode) typing.remove();
      if (!bub) { addBubble("them", t); const all = document.querySelectorAll("#thread .bub.them"); bub = all[all.length - 1] || null; } else bub.textContent = t;
      scrollDown();
    };
    h.play({ onStart: (i, text) => {
      if (h.aborted || S.screen !== "door") return;
      said[i] = text;
      show(said.filter(Boolean).join(" "));
      if (!talkWanted) { talk(true); clearInterval(talkTimer); talkTimer = -1; const m0 = $("#screen .voter.main .mouth"); if (m0) setMouth(m0, restMouth); voLipSync(); }
    } });
    let o;
    try { o = await h.done; } finally { live.delete(h); if (S.convo && S.convo.req === h) S.convo.req = null; }
    if (S.screen !== "door" || !S.convo) { h.abort(); return null; }
    S.convo.turns.push({ who: "them", text: o.say });
    if (o.sig) sigs.set(h.at + "|" + o.say, o.sig);
    if (o.care) showCare();
    setExpr(o.mood || "neutral");
    window.__waiLat = h.tl; /* for the tests and a phone check: request to first text and first sound, in ms */
    if (h.gotAudio && vidCtx) { await h.finished(); show(o.say); talk(false); }
    else { show(o.say); await speak(o.say, { gender: GENDER[d.persona], role: "voter", rate: d.rate || 1, onstart: () => talk(true), onend: () => talk(false) }); }
    return { say: o.say, expr: o.mood || "neutral", end: !!o.end };
  }
'''

SOFIA = r'''  /* version 165: lesson 1's 1st intro as a full conversation at Sofia's door (ai/scenarios.js sofia_intro), the same door
     experience as Kevin's 2nd intro; it opens only when the practice AI is on (otherwise the 1st intro stays one line) */
  sofia: {
    persona: "walter", scene: "door", name: "Sofia", sub: "Supporter on your list", street: "117", brief: "a supporter on your list at 117", short: true, rate: 1,
    bio: "67, a retired school librarian at 117, a supporter of Maya Kaur.",
    behavior: "Open the door. If the volunteer says their name, that they're volunteering for Maya Kaur and why they came, warm up and say you're voting for her. Otherwise ask who they're with.",
    end: "the volunteer has said their opener and talked a little: four lines at most", place: "at the door of 117",
    intro: "", first: { say: "Hi, can I help you?", expr: "neutral" }, warmSay: "Oh, nice to meet you. Yes, I@Q@m voting for her.", coolSay: "Okay. Who are you with?", warmNeeds: [1],
    start(st) { st.stage = "door"; },
    suggest(st, me) { return "Hi, I'm " + me + ". I live a few blocks over, and I'm volunteering for Maya Kaur. Election Day is Tuesday, so I'm checking in with neighbors."; },
    reply(st, raw) { return knockReply(this, st, raw); },
  },
'''.replace("@Q@", "\\u2019")

TRY1 = r'''/* version 165: lesson 1's Knock opens the same full conversation as the 2nd intro, at Sofia's door, when the practice AI is on */
function try1Start() {
  if (S.track !== "gotv" || S.drill || lessonNo() !== 1 || !WAI.ready()) return false;
  S.try1 = true; S.tryKnocked = true;
  go("door", { noBeat: true });
  WAI.autoKnock();
  return true;
}
'''

FINISH1 = r'''  if (S.try1) { /* version 165: the 1st intro's conversation comes back to its own card, graded like the 2nd */
    const said1 = S.convo.turns.filter((x) => x.who === "you").map((x) => x.text), text1 = said1.slice(0, 2).join(" "), h1 = result.hits.slice(), c1 = h1.filter(Boolean).length;
    S.tryRes = { lesson: 1, text: text1, hits: h1, phr: phrFinal(text1, h1, result.phr || null), pending: false, at: Date.now(), convo: S.convo.turns.map((x) => ({ who: x.who, text: x.text })), coach: result.coach || null };
    S.skipWatch = h1.every(Boolean);
    S.placement = [!h1[3] ? "weak" : c1 === 4 ? "strong" : c1 === 3 ? "ok" : "weak", openerNote(h1)]; S.placementSeen = true; S.placementText = text1;
    S.try1 = false;
    go("try", { noPush: true, noBeat: true });
    return;
  }
'''

for path in sys.argv[1:]:
    s = open(path, encoding="utf-8").read()

    def swap(old, new, n=1):
        global s
        assert s.count(old) == n, (path, s.count(old), old[:90])
        s = s.replace(old, new)

    # the score card's names and rows, with Sofia's scenario
    i = s.index("const WAI_PUB = ")
    j = s.index("\n", i)
    s = s[:i] + "const WAI_PUB = " + PUB + ";" + s[j:]

    # 1. the streamed voter, the early answer, and Sofia's scenario for lesson 1's 1st intro
    swap('    return S.track === "gotv" && (S.lesson || 1) === 1 && doorKey() === "kevin" ? "kevin_intro" : null;',
         '    return S.track === "gotv" && (S.lesson || 1) === 1 ? (doorKey() === "kevin" ? "kevin_intro" : doorKey() === "sofia" ? "sofia_intro" : null) : null; /* version 165: Sofia\'s 1st intro too */')
    swap("  return { ready, settle, flagged, full, scenFor, voiceClip, warmOpening, dots, voter, coachConvo, firstTry, failText, voterFailed, retry, recoach, rows, block, pill, issueLink, startIssue, autoKnock, state: () => state };",
         STREAM + "  return { ready, settle, flagged, full, scenFor, voiceClip, warmOpening, dots, voter, coachConvo, firstTry, failText, voterFailed, retry, recoach, rows, block, pill, issueLink, startIssue, autoKnock, liveTurn, spec, hold, stopAll, state: () => state };")
    swap("async function voterReply(d, scripted, typing) {\n  let r = scripted;\n  const full = WAI.full(d);\n",
         "async function voterReply(d, scripted, typing) {\n  let r = scripted;\n  const full = WAI.full(d);\n"
         "  if (S.convo.mode === \"live\" && full) { /* version 165: the streamed voter */\n"
         "    let o = null;\n"
         "    try { o = await WAI.liveTurn(d, typing); } catch (e) { if (typing && typing.parentNode) typing.remove(); if (S.screen === \"door\" && S.convo && !(e && e.code === \"aborted\")) WAI.voterFailed(d, e, scripted); return; }\n"
         "    if (!o || S.screen !== \"door\") return;\n"
         "    const yt = S.convo.turns.filter((x) => x.who === \"you\").length;\n"
         "    if (o.end || yt >= (shortDoor() ? 4 : 10)) { await endConvo(d); return; } /* lesson 1: four of your lines at most (Robert, Nov 15) */\n"
         "    S.convo.busy = false;\n"
         "    setComposer(true);\n"
         "    return;\n"
         "  }\n")
    swap("function stopWatchAudio() {\n", "function stopWatchAudio() {\n  WAI.stopAll(); /* version 165: a streamed voter stops with the screen */\n")
    swap("(WAI.full() ? 6 : shortDoor() ? 2 : 7)", "(WAI.full() ? (shortDoor() ? 4 : 6) : shortDoor() ? 2 : 7)", 3)

    # 2. no tap to finish on an AI door: send after 1 s of quiet, start the answer early at 0.45 s
    swap("liveCardWords(heard); };",
         "liveCardWords(heard); "
         "if (S.screen === \"door\" && S.convo && WAI.full()) { const said0 = hearName(heard.trim()); clearTimeout(r.pz); clearTimeout(r.pc); WAI.hold(said0); "
         "if (said0) { r.pz = setTimeout(() => { if (rec === r) WAI.spec(said0); }, 450); r.pc = setTimeout(() => { if (rec === r && !recStop) { recStop = true; try { r.stop(); } catch (e2) { /* ignore */ } r.onend(); } }, 1000); } } "
         "/* version 165: an AI door sends on its own after 1 s of quiet and starts the answer at 0.45 s */ };")

    # 3. lesson 1's 1st intro: Knock opens the conversation at Sofia's door
    swap("const DOORS = {\n", "const DOORS = {\n" + SOFIA)
    swap('const doorKey = () => (S.drill && (S.drill.kind === "knock" || S.drill.kind === "aiissue") ? S.drill.door : SK().door);',
         'const doorKey = () => (S.try1 && !S.drill ? "sofia" : S.drill && (S.drill.kind === "knock" || S.drill.kind === "aiissue") ? S.drill.door : SK().door); /* version 165: the 1st intro\'s door */')
    swap("  if (S.track === \"gotv\" && !S.drill && !(S.convo && S.convo.knocked)) return doorIntro(d, sk); /* version 54 */",
         "  if (S.track === \"gotv\" && !S.drill && !S.try1 && !(S.convo && S.convo.knocked)) return doorIntro(d, sk); /* version 54; version 165: the 1st intro knocks straight away, nothing taught first */")
    swap("  const p = BAR_PART[S.screen];", "  const p = S.try1 && S.screen === \"door\" ? 0 : BAR_PART[S.screen]; /* version 165: the 1st intro's door lights the 1st intro */")
    swap("  if (S.screen !== \"door\") return;\n  const youText = S.convo.turns.filter((x) => x.who === \"you\").slice(0, 2).map((x) => x.text).join(\" \");",
         "  if (S.screen !== \"door\") return;\n" + FINISH1 + "  const youText = S.convo.turns.filter((x) => x.who === \"you\").slice(0, 2).map((x) => x.text).join(\" \");")
    swap('    case "try-knock": tryKnock(); break;', '    case "try-knock": if (!try1Start()) tryKnock(); break; /* version 165 */')
    swap("async function tryKnock() {\n", TRY1 + "async function tryKnock() {\n")
    swap("function go(screen, opts = {}) {\n  leaveScreen();\n", "function go(screen, opts = {}) {\n  leaveScreen();\n  if (S.try1 && screen !== \"door\") S.try1 = false; /* version 165: leaving the 1st intro's door ends it */\n")

    open(path, "w", encoding="utf-8").write(s)
    print("patched", path)
