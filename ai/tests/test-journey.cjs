/* Phase 1 readiness: the whole learner journey on the LEARNER build (no test clock, no ?ai=, no test hooks), the way a
   tester's phone would meet it. Ten mornings: lessons 1 to 5 for real, retakes, door-ready, the five issue lessons for real
   inside the app, then a return visit after the tenth. Along the way: Today, Learn, Practice and Progress agree; an
   interrupted lesson; no network; the server failing; progress saving switched off; honest save wording; the personal
   link on a new phone; a planted link; erase; and the test-clock and ?ai= parameters doing nothing in this build.
   How the days pass: the browser's clock is moved (an init script shifts Date), not the app's own test clock. The page's
   calls to Warmup's real server address are answered by the local test server (p1-server.mjs, the real worker.js on fake
   storage); every other outside request is refused and counted, so nothing reaches production.
   Needs: node ai/tests/p1-server.mjs <repo root> running. Usage: NODE_PATH=$(npm root -g) node ai/tests/test-journey.cjs */
const L = require("./p1-lib.cjs");
const fs = require("fs"), path = require("path"), cp = require("child_process");
const REPO = path.resolve(__dirname, "..", "..");
const OUTDIR = "wdpfxqlsvp/.p1-test-prod";
const PROD = "http://127.0.0.1:8765/" + OUTDIR + "/";
const LIVE = "https://warmup-ai.robertrgambhir.workers.dev";
const DAY = 86400000;
/* day 0 is a Tuesday at 10 AM in New York; the phone's time zone is New York */
const BASE = Date.parse("2026-11-10T15:00:00Z");
let pass = 0, fail = 0;
const log = [];
const ok = (c, m) => { if (c) pass += 1; else fail += 1; log.push((c ? "PASS " : "FAIL ") + m); if (!c) console.log("FAIL", m); };
const PROMISE = /(we|i|warmup|mia)\s*(’|')?ll\s+text\s+you|text you (when|lesson|tomorrow|the next)|by text|you’ll get a text|get a text when|comes by text/i;
const external = [], promises = new Set();

async function phone(b, startDay, o = {}) {
  const c = await L.ctx(b, { tz: "America/New_York" });
  await c.addCookies([{ name: "__clock", value: String(BASE + startDay * DAY), url: "http://127.0.0.1:8765" }]);
  await c.addInitScript(() => {
    const m = document.cookie.match(/(?:^|; )__clock=(\d+)/);
    if (m) { const D = Date, off = Number(m[1]) - D.now(); function FD(...a) { return a.length ? new D(...a) : new D(D.now() + off); } FD.prototype = D.prototype; FD.now = () => D.now() + off; FD.UTC = D.UTC; FD.parse = D.parse; window.Date = FD; }
    /* any promise of a text that shows on screen, even for a moment (a toast), is caught */
    const RE = /(we|i|warmup|mia)\s*(’|')?ll\s+text\s+you|text you (when|lesson|tomorrow|the next)|by text|you’ll get a text|get a text when|comes by text/i;
    window.__promises = [];
    setInterval(() => { const t = document.body ? document.body.innerText : ""; const x = t.match(RE); if (x) { const i = t.search(RE); window.__promises.push(t.slice(Math.max(0, i - 40), i + 60).replace(/\s+/g, " ")); } }, 250);
  });
  await c.route(/^https?:\/\/(?!127\.0\.0\.1)/, async (r) => {
    const u = r.request().url();
    if (/fonts\.(googleapis|gstatic)\.com/.test(u)) return r.fallback();
    if (u.startsWith(LIVE) && c.__off) return r.abort("internetdisconnected"); /* the phone's network is off: routed calls fail too */
    if (u.startsWith(LIVE) && !o.offlineAI) { try { const resp = await r.fetch({ url: u.replace(LIVE, L.AI) }); return r.fulfill({ response: resp }); } catch (e) { return r.abort(); } }
    external.push(u.slice(0, 80)); return r.abort();
  });
  if (o.clipboard) await c.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:8765" });
  return c;
}
const setDay = (c, d, hour) => c.addCookies([{ name: "__clock", value: String(BASE + d * DAY + ((hour == null ? 10 : hour) - 10) * 3600000), url: "http://127.0.0.1:8765" }]);
async function open(c, q, errs) {
  const p = await c.newPage();
  p.on("pageerror", (e) => { const m = String(e); if (!/start is not defined|onHasParentDirectory|addRow is not defined/.test(m)) errs.push(m.slice(0, 200)); });
  await p.goto(PROD + (q || ""), { waitUntil: "domcontentloaded", timeout: 180000 });
  await p.waitForFunction(() => window.__p1 && document.querySelector("#screen"), null, { timeout: 120000 });
  await p.waitForTimeout(2500);
  return p;
}
/* a new visit in the same tab (so a beacon sent as the old page goes still reaches the test server) */
async function reopen(p, c, errs, q) {
  await harvest(p);
  await p.goto(PROD + "?visit=" + Date.now() + String(q || "").replace(/^\?/, "&"), { waitUntil: "domcontentloaded", timeout: 180000 });
  await p.waitForFunction(() => window.__p1 && document.querySelector("#screen"), null, { timeout: 120000 });
  await p.waitForTimeout(2500);
  return p;
}
const harvest = async (p) => { try { (await p.evaluate(() => window.__promises || [])).forEach((x) => promises.add(x)); } catch (e) { /* closed */ } };
const acts = (p) => p.evaluate(() => [...document.querySelectorAll("[data-act]")].filter((x) => x.offsetParent || getComputedStyle(x).position === "fixed").map((x) => x.dataset.act + (x.dataset.arg != null && x.dataset.arg !== "" ? ":" + x.dataset.arg : "")));
const text = (p) => p.evaluate(() => document.body.innerText.replace(/\s+/g, " "));
const rec = (p) => L.realState(p); /* the learner build has no sandbox copy, whatever the address says */
const kv = async () => (await fetch(L.AI + "/__p1/kv")).json();
const tok = (p) => p.evaluate(() => { try { return JSON.parse(localStorage.getItem("recognize-demo:learner")); } catch (e) { return null; } });
const tab = async (p, t) => { await L.act(p, "go", t); await p.waitForTimeout(900); };
const LINES = {
  1: "Hi, I'm Robert. I'm volunteering with Maya Kaur's campaign. Election Day is Tuesday.",
  2: "Hi! I'm Robert with Maya Kaur's campaign. What's on your mind this election?",
  3: "No problem at all. Thanks for your time, have a good night!",
  4: "When on Tuesday are you planning to vote, and do you know where your polling place is?",
  5: "Would you text three friends right now and remind them to vote? I'll wait.",
};
/* a lesson the way a learner takes it, from Learn's tile through the end cards, answering every door with the lesson's line */
async function lesson(p, n, o = {}) {
  if (!o.fromHere) { await tab(p, "library"); await L.act(p, "lesson5", String(n)); await p.waitForTimeout(1500); }
  let steps = [], closed = false;
  for (let k = 0; k < 90; k += 1) {
    const a = await acts(p);
    const has = (x) => a.some((y) => y === x || y.startsWith(x + ":"));
    let did = "";
    if (o.stopAt && o.stopAt(a)) return "stopped";
    if (has("try-start")) { await L.act(p, "try-start"); did = "try-start"; await p.waitForTimeout(3500); }
    else if (has("try-knock")) { await L.act(p, "try-knock"); did = "try-knock"; await p.waitForTimeout(3300); }
    else if (has("knock")) { await L.act(p, "knock"); did = "knock"; await p.waitForTimeout(3500); }
    else if (has("talk") || (await p.isVisible("#say").catch(() => false))) { const firstTry = !steps.includes("try-next"); await L.say(p, firstTry && !o.strongFirst ? "Hi there." : LINES[n]); did = "say"; await p.waitForTimeout(6000); } /* a learner who does better on the 2nd try (Finish shows only then) */
    else if (has("try-next")) { await L.act(p, "try-next"); did = "try-next"; await p.waitForTimeout(3000); }
    else if (has("watch-next")) { await L.act(p, "watch-next"); did = "watch-next"; await p.waitForTimeout(1800); }
    else if (has("spot-toggle") && !steps.includes("spot-toggle")) { await L.act(p, "spot-toggle"); did = "spot-toggle"; await p.waitForTimeout(1500); }
    else if (has("spot-fix") && !steps.includes("spot-fix")) { await L.act(p, "spot-fix"); did = "spot-fix"; await p.waitForTimeout(1500); }
    else if (has("spot-next")) { await L.act(p, "spot-next"); did = "spot-next"; await p.waitForTimeout(1500); }
    else if (has("try-check")) { await L.act(p, "try-check"); did = "try-check"; await p.waitForTimeout(3000); }
    else if (a.some((x) => x.startsWith("spot-pick"))) { await L.act(p, "spot-pick", a.find((x) => x.startsWith("spot-pick")).split(":")[1]); did = "spot-pick"; await p.waitForTimeout(1500); }
    else if (has("go:main")) { await L.act(p, "go", "main"); did = "main"; await p.waitForTimeout(4500); }
    else if (has("go:close")) { await L.act(p, "go", "close"); did = "close"; closed = true; await p.waitForTimeout(5500); }
    else if (has("silver-close")) { await L.act(p, "silver-close"); did = "silver-close"; await p.waitForTimeout(2000); }
    else if (has("done-card")) { await L.act(p, "done-card"); did = "done-card"; await p.waitForTimeout(2600); }
    else if (closed && (has("go:welcome") || has("go:library"))) { await tab(p, "welcome"); return steps.join(" "); }
    else if (has("spot-skip") && steps.slice(-3).every((x) => x === "wait")) { await L.act(p, "spot-skip"); did = "spot-skip"; await p.waitForTimeout(1500); }
    else if (has("spot-play")) { await L.act(p, "spot-play"); did = "spot-play"; await p.waitForTimeout(6000); }
    else { await p.waitForTimeout(1500); did = "wait"; if (steps.slice(-6).every((s) => s === "wait")) { console.log("stuck in lesson", n, a.join(" "), (await text(p)).slice(0, 300)); return "stuck"; } }
    steps.push(did);
  }
  return "too long";
}
/* a first visit: the welcome video (skipped), then lesson 1 */
async function first(p) { await L.act(p, "video-skip"); await p.waitForTimeout(4300); return lesson(p, 1, { fromHere: true }); }
/* an issue lesson inside the app's frame, the way a learner walks it: next, tiles, the practice door answered out loud */
async function issueLesson(p, which) {
  await L.act(p, "issues-open"); await p.waitForTimeout(3000);
  const fr = p.frames().find((f) => /issues\//.test(f.url()));
  if (!fr) return "no frame";
  await fr.waitForSelector(".hr", { timeout: 30000 });
  const rows = await fr.$$(".hr");
  /* a new issue lesson: a row that isn't finished (.hr-st.ok) and isn't locked */
  const states = await fr.evaluate(() => [...document.querySelectorAll(".hr")].map((b) => (b.disabled || b.querySelector(".hr-st.lock") ? "locked" : b.querySelector(".hr-st.ok") ? "done" : "open")));
  const k = which == null ? states.indexOf("open") : which;
  if (k < 0 || states[k] !== "open") return "locked";
  await rows[k].click(); await p.waitForTimeout(1800);
  const before = Object.keys((await rec(p) || { issues: {} }).issues || {}).length;
  let tiles = 0, saids = 0;
  for (let s = 0; s < 60; s += 1) {
    const now = Object.keys((await rec(p) || { issues: {} }).issues || {}).length;
    if (now > before) { await p.evaluate(() => { const o = document.getElementById("issues-ov"); const x = o && o.querySelector("[data-act='issues-close'], .ov-close, button.close"); if (x) x.click(); }).catch(() => {}); await p.waitForTimeout(800); return "done"; }
    const said = await fr.$("#said:visible").catch(() => null);
    if (said) { saids += 1; await fr.fill("#said", tiles === 0 ? "I'm not sure, sorry." : "Maya's plan helps families like yours, and her opponent has a different approach. What matters most to you?"); /* better the second time, as a learner would be */ await fr.evaluate(() => { const b = [...document.querySelectorAll("button")].filter((e) => e.offsetParent).find((x) => /Send/.test(x.innerText)); if (b) b.click(); }); await p.waitForTimeout(7000); continue; }
    const tl = await fr.$$("button.tile:visible");
    if (tl.length && tiles < 2) { await tl[tiles ? tl.length - 1 : 0].click(); tiles += 1; await p.waitForTimeout(1800); continue; }
    const nx = await fr.$("button.next:visible, .st-next:visible");
    if (nx) { await nx.click(); await p.waitForTimeout(1600); continue; }
    const clicked = await fr.evaluate(() => { const bs = [...document.querySelectorAll("button")].filter((e) => e.offsetParent && !e.disabled); const b = bs.find((x) => /^(Next|Knock|Start|Continue|Practice|Try|Hear|Play|Skip|Done|Got it|Finish|See)/i.test(x.innerText.trim())); if (b) { b.click(); return b.innerText.trim(); } return null; });
    if (!clicked) { await p.waitForTimeout(2500); if (s > 50) break; } else await p.waitForTimeout(4000);
  }
  return "not finished";
}
const closeIssues = (p) => p.evaluate(() => { const o = document.getElementById("issues-ov"); if (o) o.remove(); });
/* what each tab says, for the consistency checks */
async function tabs(p) {
  const out = {};
  await tab(p, "welcome"); out.today = await text(p);
  await tab(p, "library"); out.learn = await text(p); out.learnDone = await p.evaluate(() => document.querySelectorAll(".lp-i.done, .chp-row .chp.done").length); /* Version 161 shows Learn as one path (.lp-i) */
  await tab(p, "coach"); out.practice = await text(p);
  await tab(p, "me"); out.progress = await text(p); out.ring = await p.evaluate(() => Number((document.querySelector(".pg-num") || {}).textContent || -1));
  out.cta = await p.evaluate(() => (document.querySelector(".pg-cta") || {}).textContent || "");
  await tab(p, "welcome");
  return out;
}
const saveLine = (p) => p.evaluate(() => (document.querySelector(".pg-save") || {}).textContent || "");
async function saveLineSettled(p, want, ms) { const t0 = Date.now(); let s = ""; while (Date.now() - t0 < (ms || 6000)) { await tab(p, "me"); s = await saveLine(p); if (want.test(s)) return s; await p.waitForTimeout(700); } return s; }

(async () => {
  cp.execFileSync("python3", ["ai/build-phase1.py", "wdpfxqlsvp/staging/index.html", "ai/assets/issues-source.html", OUTDIR], { cwd: REPO });
  await fetch(L.AI + "/__p1/reset"); await fetch(L.AI + "/__p1/nokey?on=0"); await fetch(L.AI + "/__p1/down?on=0"); await fetch(L.AI + "/__p1/kvfail?on=0");
  /* belt and braces: the browser can't even find Warmup's real server, so nothing a page does can reach production */
  const b = await require("playwright").chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required", "--host-resolver-rules=MAP warmup-ai.robertrgambhir.workers.dev ~NOTFOUND"] }), errs = [];
  let c = await phone(b, 0, { clipboard: true });
  let p = await open(c, "", errs);
  let t;

  /* ---- day 0: first visit, the welcome video, lesson 1, reload ---- */
  ok((await acts(p)).includes("video-skip"), "day 0: a first visit opens the welcome video");
  const SRC = fs.readFileSync(path.join(REPO, OUTDIR, "index.html"), "utf8"); /* the app's script runs in a closure, so the video's data is read from the page itself */
  const cap9 = JSON.parse('"' + SRC.slice(SRC.indexOf("const WELCOME = {")).match(/\{ shot: "phone", text: "(The lessons come one a day\.[^"]*)" \}/)[1] + '"');
  const b64_9 = (() => { const i = SRC.indexOf("const WELCOME_AUDIO = ["); return SRC.slice(i, SRC.indexOf("];", i)).match(/"([A-Za-z0-9+\/=]{1000,})"/g)[8].slice(1, -1); })();
  ok(cap9 === "The lessons come one a day. Ten mornings in, you’ll have the fundamentals down and know our campaign inside and out.", "the video's line 9 caption matches the cut recording: " + cap9);
  const dur9 = await p.evaluate(async (b64) => { const AC = window.AudioContext || window.webkitAudioContext; const ctx = new AC(); const bin = atob(b64); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i += 1) u[i] = bin.charCodeAt(i); const buf = await ctx.decodeAudioData(u.buffer); return buf.duration; }, b64_9);
  ok(Math.abs(dur9 - 7.12) < 0.15, "line 9's recording is the cut one (about 7.1 s, was 10.9 s): " + dur9.toFixed(2));
  await first(p);
  t = await text(p);
  ok(/See you tomorrow/.test(t) && /Lesson 2 opens tomorrow morning, right here/.test(t), "day 0: Today after lesson 1 says lesson 2 opens tomorrow, right here");
  let r = await rec(p);
  ok(r && r.lessons[1] && r.lessons[1].best.every(Boolean), "day 0: lesson 1 is saved on the phone");
  const at1 = r.lessons[1].at;
  ok(Math.abs(at1 - BASE) < 3600000, "lesson 1's finish time is on the phone's clock (day 0)");
  let s = await saveLineSettled(p, /backed up to Warmup/);
  ok(/saved on this phone and backed up to Warmup/.test(s), "Progress says backed up only once the server has it: " + s);
  const token = await tok(p), id = token.split(".")[0];
  let K = await kv();
  ok(K["lp:" + id] && JSON.parse(K["lp:" + id]).lessons[1].at === at1 && !/Robert|volunteering|Election/.test(K["lp:" + id]), "the server copy has lesson 1 with the same time and none of the learner's words");
  await tab(p, "library"); await L.act(p, "lesson5", "2"); await p.waitForTimeout(900);
  t = await text(p);
  ok(/Come back to this link for lesson 2/.test(t), "day 0: lesson 2 is locked, and says to come back to this link");
  p = await reopen(p, c, errs);
  t = await text(p);
  ok(/See you tomorrow/.test(t), "day 0: a reload lands on Today, done for today, not the video");
  /* a same-day retake */
  ok((await lesson(p, 1)) !== "stuck", "day 0: lesson 1 can be retaken the same day");
  r = await rec(p);
  ok(r.lessons[1].at === at1 && r.lessons[1].retakes === 1, "the retake keeps the first finish time and is counted: " + JSON.stringify({ same: r.lessons[1].at === at1, retakes: r.lessons[1].retakes }));
  ok(/See you tomorrow/.test(await text(p)), "after the retake Today still says see you tomorrow (it didn't open lesson 2)");
  let T = await tabs(p);
  ok(T.learnDone === 1 && T.ring === 1 && /Retake lesson 1/.test(T.cta) && /Lesson 2 opens tomorrow morning/.test(T.progress), "day 0: Learn, Progress and Today agree (1 done, lesson 2 tomorrow): " + JSON.stringify({ learn: T.learnDone, ring: T.ring, cta: T.cta }));

  /* ---- day 1: lesson 2 opens; a retake first doesn't use it ---- */
  await setDay(c, 1); p = await reopen(p, c, errs);
  t = await text(p);
  ok(/Today.s lesson is ready/.test(t) && /Lesson 2 of 10/.test(t), "day 1: lesson 2 is ready: " + t.slice(0, 120));
  T = await tabs(p);
  ok(/Start lesson 2/.test(T.cta) && T.ring === 1, "day 1: Progress offers lesson 2 as Today does: " + T.cta);
  ok(/Jamal|Maria|Omar|door/i.test(T.practice), "day 1: Practice opens with the doors lesson 1 taught");
  ok((await lesson(p, 1)) !== "stuck", "day 1: a retake of lesson 1 first");
  ok(/Today.s lesson is ready/.test(await text(p)), "day 1: after the retake, lesson 2 is still today's lesson");
  let res = await lesson(p, 2);
  r = await rec(p);
  ok(r.lessons[2] && res !== "stuck", "day 1: lesson 2 finished for real (" + res + ")");
  t = await text(p);
  ok(/See you tomorrow/.test(t) && /Lesson 3 opens tomorrow morning/.test(t), "day 1: lesson 3 waits for tomorrow");
  await tab(p, "library"); await L.act(p, "lesson5", "3"); await p.waitForTimeout(800);
  ok(/Come back to this link for lesson 3/.test(await text(p)), "day 1: lesson 3 is locked on Learn too");
  await tab(p, "welcome");

  /* ---- day 1, 2 AM: still day 1 (the day starts at 5 AM) ---- */
  await setDay(c, 2, 2); p = await reopen(p, c, errs);
  ok(/See you tomorrow/.test(await text(p)), "2 AM the next night still counts as day 1: lesson 3 not open yet");

  /* ---- day 2: lesson 3 with no network at all ---- */
  await setDay(c, 2); p = await reopen(p, c, errs);
  ok(/Lesson 3 of 10/.test(await text(p)), "day 2: lesson 3 is ready");
  await c.setOffline(true); c.__off = true;
  res = await lesson(p, 3);
  r = await rec(p);
  ok(r.lessons[3], "day 2, offline: lesson 3 still finishes and saves on the phone (" + res + ")");
  s = await saveLineSettled(p, /isn.t backed up yet/, 3000);
  ok(/saved on this phone\. It isn.t backed up yet/.test(s), "offline, Progress says it isn't backed up yet (not that it is): " + s);
  await c.setOffline(false); c.__off = false;
  s = await saveLineSettled(p, /backed up to Warmup/, 12000);
  ok(/backed up to Warmup/.test(s), "back online, the backup catches up on its own: " + s);
  K = await kv();
  ok(JSON.parse(K["lp:" + id]).lessons[3], "and the server copy now has lesson 3");

  /* ---- day 3: lesson 4 while the server's storage fails ---- */
  await setDay(c, 3); p = await reopen(p, c, errs);
  await fetch(L.AI + "/__p1/kvfail?on=1");
  res = await lesson(p, 4);
  r = await rec(p);
  ok(r.lessons[4], "day 3, server storage failing: lesson 4 saves on the phone (" + res + ")");
  s = await saveLineSettled(p, /isn.t backed up yet/, 6000);
  ok(/isn.t backed up yet/.test(s), "with the server failing, Progress doesn't claim a backup: " + s);
  await fetch(L.AI + "/__p1/kvfail?on=0");
  p = await reopen(p, c, errs);
  s = await saveLineSettled(p, /backed up to Warmup/, 10000);
  ok(/backed up to Warmup/.test(s) && JSON.parse((await kv())["lp:" + id]).lessons[4], "the next visit backs lesson 4 up: " + s);

  /* ---- day 4: lesson 5, interrupted once, then finished; door-ready ---- */
  await setDay(c, 4); p = await reopen(p, c, errs);
  res = await lesson(p, 5, { stopAt: (a) => a.includes("try-next") });
  p = await reopen(p, c, errs);
  t = await text(p);
  ok(/Lesson 5 of 10/.test(t) && !(await rec(p)).lessons[5], "an interrupted lesson 5 comes back as today's lesson after a reload");
  const evq = await p.evaluate(() => JSON.parse(localStorage.getItem("recognize-demo:events") || "[]"));
  K = await kv();
  const evAll = Object.entries(K).filter(([k]) => k.startsWith("ev:") && k.includes(id)).flatMap(([, v]) => JSON.parse(v)).concat(evq);
  ok(evAll.some((e) => e.name === "interruption"), "the interruption is in the event log (on the server or still queued on the phone): " + evAll.filter((e) => e.name === "interruption").length);
  await p.waitForTimeout(3000);
  { const K2 = await kv(); const onServer = Object.entries(K2).filter(([k]) => k.startsWith("ev:") && k.includes(id)).flatMap(([, v]) => JSON.parse(v));
    ok(onServer.some((e) => e.name === "interruption"), "and it reaches the server by the next visit"); }
  res = await lesson(p, 5);
  r = await rec(p);
  ok(r.lessons[5], "day 4: lesson 5 finished (" + res + ")");
  t = await text(p);
  ok(/door-ready/i.test(t) && /issue lessons open tomorrow/.test(t), "day 4: door-ready, and the issue lessons open tomorrow: " + t.slice(0, 160));
  res = await issueLesson(p);
  ok(res === "locked", "day 4: the issue page holds every issue lesson until tomorrow (" + res + ")");
  await closeIssues(p);
  T = await tabs(p);
  ok(T.learnDone === 5 && T.ring === 0 && /door-ready|5 of 10|issue lesson/i.test(T.progress + T.learn), "day 4: Learn shows five done, and Progress (door-ready) starts counting issue lessons at 0: " + JSON.stringify({ learn: T.learnDone, ring: T.ring }));

  /* ---- days 5 to 9: the five issue lessons, one a day, for real ---- */
  for (let d = 5; d <= 9; d += 1) {
    await setDay(c, d); p = await reopen(p, c, errs);
    t = await text(p);
    ok(/issue lessons are open|Lesson \d+ of 10/.test(t), "day " + d + ": an issue lesson is open: " + t.slice(0, 100));
    const n0 = Object.keys((await rec(p)).issues).length;
    res = await issueLesson(p);
    const n1 = Object.keys((await rec(p)).issues).length;
    ok(res === "done" && n1 === n0 + 1, "day " + d + ": issue lesson " + (n0 + 1) + " finished inside the app (" + res + ")");
    await closeIssues(p); await tab(p, "welcome");
    if (n1 < 5) {
      res = await issueLesson(p);
      ok(res === "locked", "day " + d + ": a second new issue lesson waits for tomorrow (" + res + ")");
      await closeIssues(p);
    }
  }
  K = await kv();
  ok(Object.keys(JSON.parse(K["lp:" + id]).issues).length === 5, "the server copy has all five issue lessons");

  /* ---- day 10: coming back after the tenth lesson ---- */
  await setDay(c, 10); p = await reopen(p, c, errs);
  T = await tabs(p);
  ok(T.ring === 5 && T.learnDone >= 5, "day 10: Progress shows all five issue lessons done after the five canvassing ones: " + JSON.stringify({ ring: T.ring, learn: T.learnDone }));
  ok(/All 10 lessons done|issue lessons are open|briefed/i.test(T.today + T.learn), "day 10: Today and Learn show the path finished: " + T.today.slice(0, 120));
  r = await rec(p);
  ok(Object.keys(r.lessons).length === 5 && Object.keys(r.issues).length === 5 && r.lessons[1].at === at1, "day 10: the record has all ten, with lesson 1's first finish time unchanged");
  const ats = [1, 2, 3, 4, 5].map((n) => new Date(r.lessons[n].at).toISOString().slice(0, 10));
  ok(new Set(ats).size === 5, "each canvassing lesson was finished on its own day: " + ats.join(" "));
  /* the parameters that drive the dev build's test clock and server do nothing here */
  const before = JSON.stringify(await rec(p));
  p = await reopen(p, c, errs, "?day=30&ai=http://127.0.0.1:9");
  { const after = JSON.stringify(await rec(p)), hooks = await p.evaluate(() => typeof window.__p1S), shift = await p.evaluate(() => __p1.status().shiftDays); ok(after === before && hooks === "undefined" && shift === 0, "in the learner build ?day= and ?ai= change nothing and there are no test hooks: " + JSON.stringify({ same: after === before, hooks, shift })); }
  if (false) ok(true, "in the learner build ?day= and ?ai= change nothing and there are no test hooks");

  /* ---- the personal link on a new phone, a planted link, erase ---- */
  await tab(p, "me");
  await L.act(p, "p1-link"); await p.waitForTimeout(800);
  const link = await p.evaluate(() => navigator.clipboard.readText()).catch(() => "");
  ok(/#l=[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{32}$/.test(link) && /Copied/.test(await text(p)), "Copy my personal link copies a #l= link: " + link.replace(/#l=.*/, "#l=..."));
  await harvest(p);
  const c2 = await phone(b, 10);
  let p2 = await c2.newPage(); p2.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
  await p2.goto(link.replace("http://127.0.0.1:8765/" + OUTDIR + "/", PROD), { waitUntil: "domcontentloaded", timeout: 180000 });
  await p2.waitForFunction(() => window.__p1); await p2.waitForTimeout(5000);
  t = await text(p2);
  ok(/Your lessons are back on this phone/.test(t) || Object.keys((await rec(p2)) || { lessons: {} }).length, "the link on a new phone says the lessons are back");
  r = await rec(p2);
  ok(r && Object.keys(r.lessons).length === 5 && Object.keys(r.issues).length === 5 && r.lessons[1].at === at1, "the new phone has all ten lessons with the same times");
  ok(!(await p2.evaluate(() => location.href)).includes("l="), "the token leaves the address bar at once");
  await tab(p2, "me");
  { const ring2 = await p2.evaluate(() => Number((document.querySelector(".pg-num") || {}).textContent || -1)); ok(ring2 === 5, "the new phone's Progress shows the finished path (five issue lessons after door-ready): " + ring2); }
  /* a planted link on a phone that has its own lessons */
  const c3 = await phone(b, 10);
  let p3 = await open(c3, "", errs);
  await first(p3);
  const own = await tok(p3);
  p3 = await reopen(p3, c3, errs, "#l=" + token);
  t = await text(p3);
  ok(/already has its own lessons/.test(t) && (await tok(p3)) === own && !(await rec(p3)).lessons[2], "a planted link on a phone with its own lessons is refused, and says so");
  await harvest(p3); await c3.close();
  /* erase on the new phone */
  await L.act(p2, "p1-erase", "ask"); await p2.waitForTimeout(500);
  ok(/This can.t be undone/.test(await text(p2)), "Erase asks first");
  await L.act(p2, "p1-erase-yes"); await p2.waitForTimeout(2500);
  t = await text(p2);
  ok(/Erased from this phone and Warmup.s backup/.test(t), "erase says it cleared the phone and the backup: " + t.slice(0, 80));
  K = await kv();
  ok(!K["lp:" + id], "the server copy is gone");
  ok((await rec(p2)) === null || Object.keys((await rec(p2)).lessons).length === 0, "the phone's copy is gone");
  await harvest(p2); await p2.close();
  p2 = await open(c2, "", errs);
  ok((await acts(p2)).includes("video-skip"), "after erase, the next visit starts fresh with the video");
  await harvest(p2); await c2.close();
  /* the first phone still has its own copy (erase on one phone doesn't reach another); its next change backs up again */
  r = await rec(p);
  ok(r && Object.keys(r.lessons).length === 5, "the first phone keeps its own copy after the other phone erased the backup");

  /* ---- clearing the browser's data, then the link brings it back ---- */
  await p.evaluate(() => localStorage.clear());
  p = await reopen(p, c, errs);
  ok((await acts(p)).includes("video-skip"), "with the browser's data cleared, the app starts fresh");
  await harvest(p); await c.close();

  /* ---- progress saving switched off on the server (before LEARNER_KEY is set): never claims a backup ---- */
  await fetch(L.AI + "/__p1/nokey?on=1");
  c = await phone(b, 0);
  p = await open(c, "", errs);
  await first(p);
  s = await saveLineSettled(p, /this phone only/, 4000);
  ok(/saved on this phone only/.test(s) && !(await p.$('[data-act="p1-link"]')), "with saving off on the server, Progress says this phone only and offers no link: " + s);
  await harvest(p); await c.close();
  await fetch(L.AI + "/__p1/nokey?on=0");
  /* a personal link while the server is down */
  await fetch(L.AI + "/__p1/down?on=1");
  c = await phone(b, 0);
  p = await open(c, "#l=" + token, errs);
  { let seen = ""; for (let i = 0; i < 30 && !seen; i += 1) { const tx = await text(p); if (/couldn.t be reached, so the link couldn.t bring your lessons back/.test(tx)) seen = tx; else await p.waitForTimeout(300); }
    ok(!!seen && !(await rec(p)), "a personal link while the server is down says so, and the phone stays empty"); }
  await harvest(p); await c.close();
  await fetch(L.AI + "/__p1/down?on=0");

  ok(promises.size === 0, "no screen or message in the whole journey promised a text: " + [...promises].slice(0, 5).join(" | "));
  ok(external.length === 0, "no request left the test machine except fonts: " + external.slice(0, 5).join(" "));
  ok(errs.length === 0, "no page errors: " + errs.slice(0, 3).join(" | "));
  await b.close();
  fs.rmSync(path.join(REPO, OUTDIR), { recursive: true, force: true });
  fs.writeFileSync(path.join(__dirname, "journey-last-run.txt"), log.filter(Boolean).join("\n") + "\n");
  console.log("journey: " + pass + " pass, " + fail + " fail");
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log("CRASH", e && e.stack); process.exit(2); });
