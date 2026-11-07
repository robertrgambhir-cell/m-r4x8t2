/* Version 164 checks on the app: ?unlock (investors) opens Learn door-ready with every issue lesson open and nothing saved; Maya's
   issues are the four Senate lessons (Georgia hidden) and the counts follow; Electric bill and School vouchers open the rebuilt
   trainings in the overlay and are checked off when done; the other two still open the issue page, which lists four.
   Usage: (train-server.mjs running on a copy of the site) NODE_PATH=$(npm root -g) node ai/tests/test164.cjs [page path] [outdir] */
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const realFonts = require("/home/claude/work/fonts.js");
const PAGE = process.argv[2] || "wdpfxqlsvp/app.html", OUT = process.argv[3] || "/tmp/t164";
fs.mkdirSync(OUT, { recursive: true });
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL", m); } };
const waitFor = async (p, fn, ms = 15000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn).catch(() => false)) return true; await p.waitForTimeout(150); } return false; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 402, height: 874 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(String(e))); await realFonts(p);
  await p.route(/workers\.dev/, (r) => r.fulfill({ status: 503, body: "{}" }));
  await p.goto("http://127.0.0.1:8765/" + PAGE + "?unlock&v=164", { waitUntil: "load", timeout: 120000 }); await p.waitForTimeout(3000);
  const txt = await p.evaluate(() => document.body.innerText);
  ok(/Nine lessons, one a day/.test(txt), "Learn says nine lessons");
  ok(/School vouchers/.test(txt) && /Electric bill|Your electric bill/.test(txt) && /Heating oil/.test(txt) && /Tariffs/.test(txt), "the four Senate lessons are listed");
  ok(!/Health insurance/.test(txt), "Georgia's health insurance lesson is hidden");
  ok(/0 of 4 done/.test(txt), "Course 2 counts four: " + (txt.match(/\d of \d done[^\n]*/) || [""])[0]);
  ok(await p.evaluate(() => window.__wuPreview === true && window.__wuUnlock === true), "unlock is a preview: nothing saved");
  await p.screenshot({ path: path.join(OUT, "learn-unlock.png"), fullPage: false });
  const row = async (id) => p.$(`[data-act="brief-open"][data-lesson="${id}"]`);
  ok(!!(await row("oh")) && !!(await row("tx")) && !(await row("ga")), "rows carry the four ids, no ga");
  await (await row("oh")).click();
  ok(await waitFor(p, () => { const f = document.querySelector("#issues-ov iframe"); return f && /\/train\/\?l=oh/.test(f.src); }), "Electric bill opens the rebuilt training in the overlay");
  await p.waitForTimeout(1500);
  const fr = p.frame({ url: /\/train\// });
  ok(fr && /Three things we want you to know about your electric bill/.test(await fr.evaluate(() => document.body.innerText)), "the training's cover shows inside the app");
  await p.screenshot({ path: path.join(OUT, "overlay-oh.png") });
  await fr.evaluate(() => window.__train.go(window.__train.FLOW.length - 1)); await p.waitForTimeout(500);
  await fr.click("#back"); await p.waitForTimeout(800);
  ok(!(await p.$("#issues-ov")), "Back to Learn closes the overlay");
  ok(/1 of 4 done/.test(await p.evaluate(() => document.body.innerText)), "the finished training is checked off on Learn");
  await (await row("tx")).click(); ok(await waitFor(p, () => { const f = document.querySelector("#issues-ov iframe"); return f && /\/train\/\?l=tx/.test(f.src); }), "a second lesson opens the same day (unlocked)");
  await p.evaluate(() => { const o = document.getElementById("issues-ov"); if (o) o.remove(); });
  await (await row("me")).click();
  ok(await waitFor(p, () => { const f = document.querySelector("#issues-ov iframe"); return f && /issues\/\?all/.test(f.src) && /lesson=me/.test(f.src); }), "Heating oil still opens the issue page");
  await p.waitForTimeout(2000);
  await p.evaluate(() => { const o = document.getElementById("issues-ov"); if (o) o.remove(); });
  /* the issue page's home */
  const p2 = await ctx.newPage(); await realFonts(p2); const e2 = []; p2.on("pageerror", (e) => e2.push(String(e)));
  await p2.goto("http://127.0.0.1:8765/" + path.dirname(PAGE) + "/issues/?all&done=oh", { waitUntil: "domcontentloaded" }); await p2.waitForTimeout(2000);
  const t2 = await p2.evaluate(() => document.body.innerText);
  ok(/Four issues voters are raising at the door/.test(t2) && /1 of 4 done/.test(t2) && !/health insurance/i.test(t2), "the issue page lists four, one done, no health insurance: " + (t2.match(/\d of \d done/) || [""])[0]);
  await p2.screenshot({ path: path.join(OUT, "issues-home.png") });
  await p2.click('[data-lesson="1"]'); await p2.waitForTimeout(1500);
  ok(/\/train\/\?l=oh/.test(p2.url()) && /ret=/.test(p2.url()), "a tap on Your electric bill there opens the training: " + p2.url());
  await p2.evaluate(() => { window.__train.S.finishedAt = 1; }); await p2.click("#close"); await p2.waitForTimeout(1500);
  ok(/issues\//.test(p2.url()) && /done=oh/.test(p2.url()), "its close returns to the issue page: " + p2.url());
  await p2.goto("http://127.0.0.1:8765/" + path.dirname(PAGE) + "/issues/?all&lesson=tx"); await p2.waitForTimeout(1500);
  ok(/\/train\/\?l=tx/.test(p2.url()), "a deep link to vouchers lands on the training");
  ok(errs.length === 0 && e2.length === 0, "no page errors: " + errs.concat(e2).join(" | "));
  /* without unlock, a fresh visitor still starts on the welcome video */
  const c3 = await b.newContext({ viewport: { width: 402, height: 874 }, isMobile: true, hasTouch: true }); const p3 = await c3.newPage();
  await p3.route(/workers\.dev/, (r) => r.fulfill({ status: 503, body: "{}" }));
  await p3.goto("http://127.0.0.1:8765/" + PAGE + "?v=164b"); await p3.waitForTimeout(2500);
  ok(await p3.evaluate(() => !window.__wuUnlock && !window.__wuPreview), "a plain link is not the investor preview");
  await b.close(); console.log(`v164: ${pass} pass, ${fail} fail`); process.exit(fail ? 1 : 0);
})();
