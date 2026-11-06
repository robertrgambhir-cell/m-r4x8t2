"""Version 160 (Nov 5, 2026): the investor-demo pass.
1. The presenter guide. On a laptop or shared screen (1100 px wide and up, a fine pointer) the phone gets a Warmup frame:
   on the left, what Warmup is and what this screen shows and why it works; on the right, the demo in nine stops, each a jump
   (stops 5 to 9 load sample progress, and say so). G hides it, the arrow keys step through it, ?noguide starts it hidden.
   The phone itself is unchanged by the guide, and a phone never sees it.
2. Practice: the door stack and its line sit together in the middle of the spare height, not split by a gap.
3. Apartment doors: the unit number moves onto the door itself, so no crop cuts it in half (Kevin's 3B read as a glitch).
4. Each lesson part's opening card names its place: Part 2 of 4.
Usage: python3 v160.py in_app.html out_app.html"""
import sys

APP, OUT = sys.argv[1:3]
s = open(APP, encoding="utf-8").read()


def swap(old, new, n=1):
    global s
    got = s.count(old)
    assert got == n, (got, n, old[:80])
    s = s.replace(old, new)


# ---------- 1. the guide: styles ----------
CSS = r"""<style id="guide-css">
  /* version 160: the presenter guide, only on wide screens with a fine pointer */
  :root { --g-acc: #2F8A5F; --g-acc-2: #35B57C; --g-soft: rgba(38, 35, 32, 0.06); --g-line: rgba(38, 35, 32, 0.12); }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --g-acc: #7FD1A8; --g-soft: rgba(244, 238, 229, 0.07); --g-line: rgba(244, 238, 229, 0.14); } }
  :root[data-theme="dark"] { --g-acc: #7FD1A8; --g-soft: rgba(244, 238, 229, 0.07); --g-line: rgba(244, 238, 229, 0.14); }
  .guide, .gpath, .g-show { display: none; }
  @media (min-width: 1100px) and (min-height: 620px) and (pointer: fine) {
    body.guide-on .stage-top { display: none; }
    body.guide-on .notes { display: none; }
    body.guide-on .stage-main { min-height: 100vh; box-sizing: border-box; align-items: center; gap: clamp(36px, 4.2vw, 72px); padding: 24px 32px; }
    body.guide-on .device { height: min(820px, calc(100vh - 48px)); }
    body.guide-on .guide { display: flex; }
    body.guide-on .gpath { display: block; }
    body:not(.guide-on) .g-show { display: inline-flex; }
  }
  .guide { flex: none; width: clamp(270px, 24vw, 340px); align-self: center; height: min(820px, calc(100vh - 48px)); flex-direction: column; padding: 6px 0 4px; color: var(--stage-ink); font-family: "Figtree", system-ui, sans-serif; }
  .g-brand { display: inline-flex; align-items: center; gap: 10px; }
  .g-brand span { font-family: "Newsreader", Georgia, serif; font-size: 25px; font-weight: 500; letter-spacing: -0.01em; }
  .g-tag { margin: 22px 0 0; font-family: "Newsreader", Georgia, serif; font-style: italic; font-weight: 500; font-size: clamp(30px, 2.6vw, 38px); line-height: 1.05; letter-spacing: -0.02em; }
  .g-sub { margin: 10px 0 0; font-size: 15px; line-height: 1.5; color: var(--stage-muted); max-width: 300px; }
  .g-now { margin-top: auto; padding-top: 28px; border-top: 1px solid var(--g-line); }
  .g-now.in > * { animation: gIn 0.42s cubic-bezier(.2, .8, .2, 1) both; }
  .g-now.in > :nth-child(2) { animation-delay: 0.03s; } .g-now.in > :nth-child(3) { animation-delay: 0.06s; } .g-now.in > :nth-child(n+4) { animation-delay: 0.09s; }
  @keyframes gIn { from { opacity: 0; transform: translateY(8px); } }
  .g-k { display: flex; align-items: baseline; gap: 12px; margin: 0; font-size: 12px; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; color: var(--g-acc); }
  .g-k i { font-style: normal; font-family: "Newsreader", Georgia, serif; font-size: 15px; font-weight: 500; letter-spacing: 0; text-transform: none; color: var(--stage-muted); font-variant-numeric: tabular-nums; }
  .g-h { margin: 10px 0 0; font-family: "Newsreader", Georgia, serif; font-weight: 500; font-size: clamp(25px, 2.1vw, 31px); line-height: 1.12; letter-spacing: -0.015em; text-wrap: balance; }
  .g-b { margin: 12px 0 0; font-size: 15.5px; line-height: 1.55; color: var(--stage-ink); opacity: 0.86; }
  .g-why, .g-demo { margin: 16px 0 0; font-size: 13.5px; line-height: 1.5; color: var(--stage-muted); }
  .g-why b, .g-demo b { display: block; margin-bottom: 2px; font-size: 11px; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; color: var(--stage-ink); opacity: 0.75; }
  .g-foot { margin-top: 26px; display: grid; gap: 12px; }
  .g-next { justify-self: start; display: inline-flex; align-items: center; gap: 10px; min-height: 44px; padding: 0 18px; border: 0; border-radius: 999px; background: var(--stage-ink); color: var(--stage-bg); font: 600 14.5px/1 "Figtree", system-ui, sans-serif; cursor: pointer; transition: transform .15s ease, opacity .15s ease; }
  .g-next:hover { transform: translateX(2px); } .g-next:active { opacity: .85; }
  .g-next svg { width: 16px; height: 16px; }
  .g-fine { margin: 0; font-size: 12.5px; line-height: 1.5; color: var(--stage-muted); }
  .g-fine button, .g-show { border: 0; background: none; padding: 0; font: inherit; color: inherit; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
  .g-fine kbd { font: 600 11px/1 "Figtree", system-ui, sans-serif; padding: 2px 5px; border-radius: 4px; border: 1px solid var(--g-line); }
  .gpath { flex: none; width: clamp(210px, 17vw, 250px); align-self: center; color: var(--stage-ink); font-family: "Figtree", system-ui, sans-serif; }
  .gp-h { margin: 0 0 12px 10px; font-size: 11px; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; color: var(--stage-muted); }
  .gp-list { list-style: none; margin: 0; padding: 0; position: relative; }
  .gp-list::before { content: ""; position: absolute; left: 21px; top: 18px; bottom: 18px; width: 1.5px; background: var(--g-line); }
  .gp-list li + li { margin-top: 1px; }
  .gp-list button { position: relative; width: 100%; display: grid; grid-template-columns: 24px 1fr; gap: 12px; align-items: center; padding: 8px 10px; border: 0; border-radius: 12px; background: none; color: inherit; text-align: left; cursor: pointer; font: inherit; transition: background .15s ease; }
  .gp-list button:hover { background: var(--g-soft); }
  .gp-n { width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; background: var(--stage-bg); box-shadow: inset 0 0 0 1.5px var(--g-line); font: 600 11.5px/1 "Figtree", system-ui, sans-serif; color: var(--stage-muted); font-variant-numeric: tabular-nums; transition: background .2s ease, color .2s ease, box-shadow .2s ease; }
  .gp-list b { display: block; font-size: 14px; font-weight: 600; line-height: 1.25; }
  .gp-list small { display: block; margin-top: 1px; font-size: 12px; line-height: 1.3; color: var(--stage-muted); }
  .gp-list [aria-current="step"] .gp-n { background: var(--g-acc-2); color: #fff; box-shadow: 0 0 0 4px color-mix(in srgb, var(--g-acc-2) 22%, transparent); }
  .gp-list [aria-current="step"] b { color: var(--g-acc); }
  .gp-list .seen .gp-n { color: var(--g-acc); box-shadow: inset 0 0 0 1.5px var(--g-acc-2); }
  .gp-note { margin: 14px 0 0 10px; font-size: 12px; line-height: 1.45; color: var(--stage-muted); }
  @media (max-height: 780px) { .g-sub { display: none; } .g-tag { margin-top: 14px; font-size: 30px; } .g-now { padding-top: 20px; } .g-h { font-size: 25px; } .g-b { font-size: 15px; margin-top: 8px; } .g-why, .g-demo { margin-top: 10px; } .g-foot { margin-top: 16px; gap: 8px; } }
  .voter:not(.shut) .unit { opacity: 0; } .voter .unit { transition: opacity .25s ease; }
  .g-show { padding: 10px 4px; position: fixed; left: 18px; bottom: 10px; z-index: 5; font: 600 13px/1 "Figtree", system-ui, sans-serif; color: var(--stage-muted); }
  .guide :focus-visible, .gpath :focus-visible, .g-show:focus-visible { outline: 3px solid var(--g-acc-2); outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) { .g-now.in > * { animation: none; } .g-next, .gp-n { transition: none; } }
  /* version 160: Practice's door stack and its line sit together in the middle of the spare height */
  .content:has(> .pk-stack) { justify-content: center; }
  .content:has(> .pk-stack) > .pk-stack { flex: 0 1 auto; margin-top: auto; }
  .content:has(> .pk-stack) > .pk-line { margin-bottom: auto; padding-bottom: 18px; }
  .pk-card { width: min(330px, 100%); }
  /* version 160: each part's opening card says where it sits in the lesson */
  .beat-k { margin: 0 0 -4px; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent-ink, #23744F); animation: beatin 0.3s ease both; }
</style>
</head>"""
swap("</head>", CSS)

# ---------- 1. the guide: the rails and their logic, inside the app's scope ----------
JS = r"""
/* ---------- version 160: the presenter guide (wide screens only) ---------- */
const G_RING = '<svg width="30" height="30" viewBox="0 0 84 84" aria-hidden="true"><circle cx="42" cy="42" r="32" fill="none" stroke="#E6DFD3" stroke-width="12"/><circle cx="42" cy="42" r="32" fill="none" stroke="#35B57C" stroke-width="12" stroke-linecap="round" stroke-dasharray="151 202" transform="rotate(-90 42 42)"/></svg>';
const G_ARROW = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';
const gAI = () => { try { return typeof WAI !== "undefined" && !!WAI.ready && !!WAI.ready(); } catch (e) { return false; } };
const G_STOPS = [
  { n: 1, name: "Welcome", sub: "The candidate’s video", k: "The candidate’s welcome",
    h: "The candidate asks you to get ready.",
    b: "A volunteer signs up, gets a text from the campaign and taps the link. Nothing to download. The candidate explains the two courses in about a minute.",
    why: "The campaign leads. Volunteers show up for a candidate, so her name and her face open the app, and Warmup stays in the background." },
  { n: 2, name: "Try it cold", sub: "Lesson 1 · Your 1st intro", k: () => `Lesson ${lessonNo()} · Part 1 of 4`,
    h: "Try it before any teaching.",
    b: () => (lessonNo() === 1 ? "Each five-minute lesson happens at a voter’s door. You knock and say your intro out loud, before you’re taught anything. This try isn’t scored." : "Each five-minute lesson happens at a voter’s door. You try the lesson’s move out loud before you’re taught anything. This try isn’t scored."),
    why: "Trying first, even wrong, makes the teaching that follows stick. Researchers call it the pretesting effect." },
  { n: 3, name: "Hear it, catch it", sub: "Parts 2 and 3", k: () => `Lesson ${lessonNo()} · Parts 2 and 3 of 4`,
    h: () => (lessonNo() === 1 ? "Hear a good intro, then catch what’s missing." : "Hear it done well, then catch what’s missing."),
    b: "A trained volunteer models all four parts. Then the same door plays with one part left out, and you find it.",
    why: "Picking out the missing part means pulling it from memory, and that kind of practice beats rereading (Roediger and Karpicke, 2006)." },
  { n: 4, name: "Say it, get feedback", sub: "Your 2nd intro", k: () => `Lesson ${lessonNo()} · Part 4 of 4`,
    h: () => (gAI() ? "A real conversation with a new voter." : "Say it again, to a new voter."),
    b: () => (gAI() ? "The voter is played live by AI and answers whatever you say. When the door closes, the coach grades your own words against the four parts." : "A new voter answers the door. You say your intro out loud, and Warmup checks your words against the four parts."),
    why: "Instant feedback on the exact words you used, then a retry while it’s fresh (Hattie and Timperley, 2007).",
    alt: { score: { h: "Feedback on your own words.", b: "You see which of the four parts you hit and the one to add, then retry at the door or finish the lesson. Scores stay with the volunteer." },
           coachfull: { h: "The coach shows its work.", b: "Every part it credited points to the volunteer’s own words, word for word, with the full conversation underneath." },
           close: { h: () => `Lesson ${lessonNo()}, saved.`, b: "The ring fills one fifth for each lesson. Five lessons make a volunteer door-ready." } } },
  { n: 5, name: "One a day", sub: "Today, after lesson 1", k: "Today", sample: "Sample progress: Rosa, the day after her first lesson.",
    h: "One lesson a day, then close the app.",
    b: "The next lesson opens tomorrow, and a text brings the volunteer back at 8 AM. Five mornings make a volunteer door-ready before the first shift.",
    why: "Spreading practice over days beats cramming it into one training (Cepeda et al., 2006).",
    demo: "The 8 AM text isn’t sent in this demo." },
  { n: 6, name: "Two courses", sub: "Learn, door-ready", k: "The curriculum", sample: "Sample progress: Rosa, five days in and door-ready.",
    h: "How to canvass, then the campaign’s issues.",
    b: "Part 1 is made once by Warmup: five canvassing lessons in order, ending at Door-ready. Part 2 is the campaign’s own five issue lessons, drafted by AI from public sources for the campaign to approve, ending at Briefed." },
  { n: 7, name: "An issue lesson", sub: "What Maya stands for", k: "Part 2 · Maya’s issues", sample: "Sample progress: Rosa, five days in and door-ready.",
    h: "Where the candidate stands, in five minutes.",
    b: "Learn covers the problem, the candidate’s plan and the opponent’s plan, each sourced. Then the volunteer explains it out loud to a voter at the door and is graded on those three.",
    demo: "The five issues here are adapted from real 2026 races." },
  { n: 8, name: "Practice", sub: "Extra doors, any time", k: "Practice", sample: "Sample progress: Rosa, five days in and door-ready.",
    h: "Knock any time. You never know who’s home.",
    b: "Practice doors come face down, like a real canvass. The coach only sends voters your saved lessons have prepared you for." },
  { n: 9, name: "Progress", sub: "Streak, medals, record", k: "Progress", sample: "Sample progress: Rosa, five days in and door-ready.",
    h: "Progress the volunteer owns.",
    b: "A streak that forgives one missed day a week, medals for Door-ready and Briefed, and a record that travels from campaign to campaign.",
    why: "The campaign sees status, never scores, so practice stays safe to get wrong." },
];
const G_AT = {
  video: 1, sms: 1, sms2: 1, pick: 1,
  try: 2, session: 2, placement: 2, intake: 2, talk: 2,
  watch: 3, spot: 3, why: 3, recap: 3,
  door: 4, main: 4, score: 4, coachfull: 4, close: 4,
  welcome: 5, locked: 5, whylock: 5, chrec: 5, path: 5,
  library: 6, course: 6, training: 6, silver: 6, ready: 6,
  coach: 8, practice: 8, round: 8, warm: 8, warmtip: 8, warmready: 8, debrief: 8,
  me: 9, record: 9, statushow: 9,
  how: 1, howworks: 1, note: 6,
};
const gClean = /[?&]noguide\b/.test(location.search);
const gState = { on: !gClean && store.get("guide", true) !== false, at: 0, seen: {}, sampled: /[?&](home|learn)\b/.test(location.search) };
const G_WIDE = "(min-width: 1100px) and (min-height: 620px) and (pointer: fine)";
function guideStop() {
  if (document.getElementById("issues-ov")) return 7;
  if (S.drill && ["main", "door", "score", "warmtip"].includes(S.screen)) return 8;
  return G_AT[S.screen] || 0;
}
function gVal(v) { return typeof v === "function" ? v() : v; }
function guideBuild() {
  const main = $(".stage-main");
  if (!main || $("#guide")) return;
  const g = document.createElement("aside");
  g.className = "guide"; g.id = "guide"; g.setAttribute("aria-label", "About this demo");
  g.innerHTML = `<div class="g-brand">${G_RING}<span>Warmup</span></div>
    <p class="g-tag">Ready before the shift.</p>
    <p class="g-sub">Five-minute daily lessons and spoken practice that get campaign volunteers ready for the door.</p>
    <div class="g-now" id="g-now" aria-live="polite"></div>
    <div class="g-foot"><button class="g-next" id="g-next" data-g="next"></button>
      <p class="g-fine">Maya Kaur for U.S. Senate is a sample campaign. <span style="white-space:nowrap"><button data-g="hide">Hide guide</button> <kbd>G</kbd></span></p></div>`;
  main.insertBefore(g, main.firstChild);
  const p = document.createElement("nav");
  p.className = "gpath"; p.id = "gpath"; p.setAttribute("aria-label", "Demo stops");
  p.innerHTML = `<p class="gp-h">The demo in nine stops</p><ol class="gp-list">${G_STOPS.map((x) => `<li><button data-g="${x.n}"><span class="gp-n">${x.n}</span><span><b>${x.name}</b><small>${x.sub}</small></span></button></li>`).join("")}</ol><p class="gp-note">Stops 5 to 9 load sample progress, as if five days had passed.</p>`;
  main.appendChild(p);
  const sh = document.createElement("button");
  sh.className = "g-show"; sh.dataset.g = "show"; sh.textContent = "Show the demo guide";
  if (!gClean) document.body.appendChild(sh);
  document.addEventListener("click", (e) => { const b = e.target.closest ? e.target.closest("[data-g]") : null; if (b) { e.preventDefault(); guideAct(b.dataset.g); } });
  document.addEventListener("keydown", (e) => {
    const t = e.target, typing = t && (t.tagName === "TEXTAREA" || t.tagName === "INPUT" || t.isContentEditable);
    if (typing || e.metaKey || e.ctrlKey || e.altKey || !window.matchMedia(G_WIDE).matches) return;
    if (e.key === "g" || e.key === "G") { guideAct(gState.on ? "hide" : "show"); return; }
    if (!gState.on) return;
    if (e.key === "ArrowRight") { e.preventDefault(); guideAct("next"); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); const at = guideStop() || 1; if (at > 1) guideJump(at - 1); }
  });
  new MutationObserver(() => guideRender()).observe($("#device"), { childList: true });
}
function guideRender() {
  guideBuild();
  document.body.classList.toggle("guide-on", gState.on);
  const at = guideStop(), now = $("#g-now");
  if (!now) return;
  const st = G_STOPS.find((x) => x.n === at);
  const key = at + ":" + S.screen + ":" + (gAI() ? 1 : 0) + ":" + lessonNo() + ":" + (gState.sampled ? 1 : 0);
  if (st) gState.seen[at] = true;
  $("#gpath").querySelectorAll("[data-g]").forEach((b) => { const n = Number(b.dataset.g); if (n === at) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); b.parentNode.classList.toggle("seen", !!gState.seen[n] && n !== at); });
  const nx = G_STOPS.find((x) => x.n === (at || 0) + 1);
  const nb = $("#g-next");
  nb.hidden = !at || !nx; if (at && nx) nb.innerHTML = `Next: ${nx.name}${G_ARROW}`;
  if (key === gState.at) return;
  gState.at = key;
  if (!st) { now.innerHTML = ""; return; }
  const alt = (st.alt && st.alt[S.screen]) || {};
  now.innerHTML = `<p class="g-k">${gVal(st.k)}<i>${String(st.n).padStart(2, "0")} / 09</i></p>
    <h2 class="g-h">${gVal(alt.h || st.h)}</h2>
    <p class="g-b">${gVal(alt.b || st.b)}</p>
    ${st.why ? `<p class="g-why"><b>Why it works</b>${st.why}</p>` : ""}
    ${(st.sample && gState.sampled) || st.demo ? `<p class="g-demo"><b>In this demo</b>${[gState.sampled ? st.sample || "" : "", st.demo || ""].filter(Boolean).join(" ")}</p>` : ""}`;
  now.classList.remove("in"); void now.offsetWidth; now.classList.add("in");
}
function guideSample(ready) {
  const homeText = "Hi, I'm " + me() + ". I'm volunteering for Maya Kaur, and I'm checking in with neighbors.";
  const hits = [true, true, false, true];
  S.track = "gotv"; S.lesson = 1; S.intakeDone = true; S.mode = S.mode || "voice";
  S.first5 = { 1: [true, false, false, true] };
  S.done5 = { 1: hits.slice() };
  S.best5 = { 1: { text: homeText, phr: typeof phrFinal === "function" ? phrFinal(homeText, hits, null) : null, hits: hits.slice() } };
  S.doneAt = { 1: Date.now() };
  if (ready) { S.done5 = {}; S.doneAt = {}; LESSONS5.forEach((x) => { S.done5[x.n] = x.n === 1 ? hits.slice() : [true, true, true, true]; S.doneAt[x.n] = Date.now() - (6 - x.n) * 86400000; }); S.lesson = 5; }
  S.hist = [];
}
function guideJump(n) {
  { const ov = document.getElementById("issues-ov"); if (ov) ov.remove(); }
  leaveScreen();
  S = fresh();
  gState.sampled = n >= 5;
  if (n === 1) { render(); return; }
  if (n === 2) { startLesson5(1, true); return; }
  if (n === 3 || n === 4) {
    S.lesson = 1; S.intakeDone = true; S.hist = [];
    S.tryRes = { lesson: 1, text: "Hi! Do you have a minute to talk about the election?", hits: [false, false, false, false], at: Date.now() };
    S.first5 = { 1: [false, false, false, false] };
    go(n === 3 ? "watch" : "door", { noPush: true });
    return;
  }
  guideSample(n >= 6);
  if (n === 5) { S.screen = "welcome"; render(); return; }
  go({ 6: "library", 7: "library", 8: "coach", 9: "me" }[n], { noPush: true });
  if (n === 7 && typeof window.issuesOpen === "function") window.issuesOpen();
}
function guideAct(a) {
  if (a === "hide" || a === "show") { gState.on = a === "show"; store.set("guide", gState.on); guideRender(); fitZoom(); return; }
  if (a === "next") { const at = guideStop(); if (at) guideJump(Math.min(9, at + 1)); return; }
  const n = Number(a); if (n >= 1 && n <= 9) guideJump(n);
}
"""
swap("\nloadVoices();\nrender();\n})();\n</script>", JS + "\nloadVoices();\nrender();\n})();\n</script>")
swap("  renderNotes();\n  afterRender();\n}", "  renderNotes();\n  guideRender(); /* version 160 */\n  afterRender();\n}")

# ---------- 3. the apartment plate sits beside the frame ----------
swap('<circle cx="160" cy="100" r="3" fill="#2A2622"/><circle cx="198" cy="156" r="4.5" fill="#D9D2C4"/>`',
     '<circle cx="160" cy="100" r="3" fill="#2A2622"/><circle cx="198" cy="156" r="4.5" fill="#D9D2C4"/><g class="unit"><rect x="144" y="66" width="32" height="18" rx="3" fill="#EDE3CF"/><text x="160" y="79.5" text-anchor="middle" font-family="Figtree, sans-serif" font-weight="700" font-size="11.5" fill="#3B3631">${h.num}</text></g>`')
swap('`<rect x="238" y="92" width="34" height="24" rx="4" fill="#3B3631"/><text x="255" y="109" text-anchor="middle" font-family="Figtree, sans-serif" font-weight="700" font-size="13" fill="#F3EBDD">${h.num}</text>`',
     '""')

# ---------- 4. the part's opening card names its place ----------
swap('return `<div class="beat" role="status"><div class="beat-ring" aria-hidden="true">${ring}</div><b class="beat-name">',
     'return `<div class="beat" role="status"><div class="beat-ring" aria-hidden="true">${ring}</div>${i < 4 ? `<p class="beat-k">Part ${i + 1} of 4</p>` : ""}<b class="beat-name">')

assert chr(8212) not in s, "em dash"
open(OUT, "w", encoding="utf-8").write(s)
print("wrote", OUT, len(s))
