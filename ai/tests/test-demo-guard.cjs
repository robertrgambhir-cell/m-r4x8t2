/* The investor demos never touch a volunteer's record: the ?tour phone preview and the laptop guide's sample stops (5 to 9)
   load sample progress, so Phase 1 must not save it, send it or log events from it. Runs on the learner build
   (wdpfxqlsvp/p1/) with p1-server.mjs running; the page's calls to Warmup's real server address go to the local server.
   Usage: NODE_PATH=$(npm root -g) node ai/tests/test-demo-guard.cjs */
const L = require("./p1-lib.cjs");
const PAGE = "http://127.0.0.1:8765/wdpfxqlsvp/p1/";
const LIVE = "https://warmup-ai.robertrgambhir.workers.dev";
const DAY = 86400000, now = Date.now();
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass += 1; else { fail += 1; console.log("FAIL", m); } };
const L1 = (at) => ({ first: [true, false, true, true], best: [true, true, true, true], at, retakes: 0, words: "Hi, I'm Robert." });
const REAL = { v: 1, lessons: { 1: L1(now - DAY) }, issues: {}, doors: 0, practDays: [], activeDays: [] };
const writes = []; let watching = false; /* only writes made while a demo is on screen count */
async function phone(b, o) {
  const c = await L.ctx(b, Object.assign({ tz: "America/New_York" }, o || {}));
  await c.route(/^https?:\/\/(?!127\.0\.0\.1)/, async (r) => {
    const u = r.request().url();
    if (/fonts\.(googleapis|gstatic)\.com/.test(u)) return r.fallback();
    if (u.startsWith(LIVE)) { if (watching && /\/v1\/(progress|events)/.test(u) && r.request().method() !== "GET") writes.push(r.request().method() + " " + u.replace(LIVE, "")); const resp = await r.fetch({ url: u.replace(LIVE, L.AI) }); return r.fulfill({ response: resp }); }
    return r.abort();
  });
  return c;
}
const seedReal = (c) => c.addInitScript((r) => { if (!localStorage.getItem("test-seeded")) { localStorage.setItem("recognize-demo:p1", JSON.stringify(r)); localStorage.setItem("test-seeded", "1"); } }, REAL);
const keys = (p) => p.evaluate(() => Object.keys(localStorage).filter((k) => k !== "test-seeded").sort());
const rec = (p) => p.evaluate(() => localStorage.getItem("recognize-demo:p1"));
const queued = (p) => p.evaluate(() => (JSON.parse(localStorage.getItem("recognize-demo:events") || "[]")).length);
async function open(c, q) {
  const p = await c.newPage();
  p.on("pageerror", (e) => { if (!/start is not defined/.test(String(e))) errs.push(String(e).slice(0, 160)); });
  await p.goto(PAGE + (q || ""), { waitUntil: "domcontentloaded", timeout: 180000 });
  await p.waitForFunction(() => window.__p1 && document.querySelector("#screen"), null, { timeout: 120000 });
  await p.waitForTimeout(3000);
  return p;
}
const errs = [];
(async () => {
  await fetch(L.AI + "/__p1/reset");
  const b = await require("playwright").chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required", "--host-resolver-rules=MAP warmup-ai.robertrgambhir.workers.dev ~NOTFOUND"] });

  /* 1. ?tour on a fresh phone: nothing is stored at all */
  watching = true;
  let c = await phone(b), p = await open(c, "?tour");
  ok(await p.evaluate(() => !!document.getElementById("tour-pill") && window.__wuPreview === true && window.__p1.DEMO === true), "?tour shows the Investor preview pill and Phase 1 sees presenter mode");
  for (const n of [5, 6, 7, 8, 9]) { await p.evaluate((n) => { const pill = document.getElementById("tour-pill"); if (pill) pill.click(); }, n); await p.waitForTimeout(500); await p.evaluate((n) => { const x = document.querySelector('[data-tour="' + n + '"]'); if (x) x.click(); }, n); await p.waitForTimeout(1500); }
  ok((await p.evaluate(() => document.body.innerText)).length > 0, "the tour's sample stops 5 to 9 open");
  ok((await keys(p)).filter((k) => /^recognize-demo:(p1|learner|events)/.test(k)).length === 0, "after the tour's sample stops, local storage has no learner record, token or events: " + (await keys(p)).join(","));
  await c.close();

  /* 2. ?tour on a volunteer's own phone: their record is untouched, then comes back as theirs */
  c = await phone(b); await seedReal(c);
  p = await open(c, "?tour");
  const before = await rec(p);
  for (const n of [5, 6, 8, 9]) { await p.evaluate(() => { const pill = document.getElementById("tour-pill"); if (pill) pill.click(); }); await p.waitForTimeout(400); await p.evaluate((n) => { const x = document.querySelector('[data-tour="' + n + '"]'); if (x) x.click(); }, n); await p.waitForTimeout(1500); }
  await p.waitForTimeout(2500);
  ok((await rec(p)) === before && (await queued(p)) === 0, "a tour on a volunteer's phone leaves their record exactly as it was and logs no events");
  await p.close(); watching = false;
  p = await open(c, "");
  const t = await p.evaluate(() => document.body.innerText.replace(/\s+/g, " "));
  ok(/Lesson 2 of 9/.test(t) && JSON.parse(await rec(p)).lessons[1].at === REAL.lessons[1].at && !JSON.parse(await rec(p)).lessons[2], "opening the plain link afterward shows the volunteer's own progress (lesson 2 next), not the sample: " + t.slice(0, 90));
  await c.close();

  /* 3. the laptop guide: its sample stops never save into the record on that computer */
  c = await phone(b, { desk: true, w: 1280, h: 800 }); await seedReal(c);
  p = await open(c, "");
  const hasGuide = await p.evaluate(() => !!document.querySelector("[data-g]"));
  ok(hasGuide, "the laptop guide is on the page at 1280 wide");
  const before2 = await rec(p); await p.waitForTimeout(2000); watching = true;
  for (const n of [5, 6, 7, 8, 9, 2]) { await p.evaluate((n) => { const x = document.querySelector('[data-g="' + n + '"]'); if (x) x.click(); }, n); await p.waitForTimeout(1800); }
  await p.waitForTimeout(2500);
  ok((await rec(p)) === before2, "after the guide's sample stops, the record on this computer is unchanged");
  ok(await p.evaluate(() => window.__wuPreview === true && window.__p1.DEMO === true), "the guide puts Phase 1 in presenter mode from its first jump");
  watching = false; await p.reload({ waitUntil: "domcontentloaded" }); await p.waitForFunction(() => window.__p1); await p.waitForTimeout(3000);
  ok(JSON.parse(await rec(p)).lessons[1].at === REAL.lessons[1].at && !JSON.parse(await rec(p)).lessons[5], "a reload brings back the real record, with no sample lessons in it");
  await c.close();

  ok(writes.length === 0, "no progress or event was sent to the server during any demo: " + writes.slice(0, 4).join(" "));
  ok(errs.length === 0, "no page errors: " + errs.slice(0, 3).join(" | "));
  await b.close();
  console.log("demo guard: " + pass + " pass, " + fail + " fail");
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log("CRASH", e && e.stack); process.exit(2); });
