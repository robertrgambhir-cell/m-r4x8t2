/* Browser tests for the two rebuilt issue trainings (wdpfxqlsvp/train/): every screen at phone sizes with the real fonts, the
   whole flow from cover to done with a stand-in speech recognizer, the live voter's streamed turns against the real worker.js
   (stubbed model and voice), failure and retry, a blocked mic, a browser that can't listen, the app frame's done message.
   Usage: node ai/tests/train-server.mjs /abs/site & then NODE_PATH=$(npm root -g) node ai/tests/test-train.cjs /abs/outdir [full] */
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const realFonts = require("/home/claude/work/fonts.js");
const OUT = process.argv[2] || "/tmp/train-out", FULL = process.argv[3] === "full";
fs.mkdirSync(OUT, { recursive: true });
const BASE = "http://127.0.0.1:8765/wdpfxqlsvp/train/?ai=http://127.0.0.1:8799";
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL", m); } };
const stats = async () => JSON.parse(await (await fetch("http://127.0.0.1:8799/__t/stats")).text());
const FAKE = () => {
  window.__say = []; window.__srStarts = 0;
  class FakeSR { start() { window.__srStarts++; const me = this; if (window.__srDeny) { setTimeout(() => me.onerror && me.onerror({ error: "not-allowed" }), 50); return; } const t = window.__say.shift() || ""; const w = t.split(" ").filter(Boolean); let i = 0; this._iv = setInterval(() => { i++; me.onresult && me.onresult({ results: [[{ transcript: w.slice(0, i).join(" ") }]] }); if (i >= w.length) clearInterval(me._iv); }, 55); }
    stop() { clearInterval(this._iv); this.onend && this.onend(); } abort() { clearInterval(this._iv); } }
  window.SpeechRecognition = FakeSR; window.webkitSpeechRecognition = FakeSR;
};
const LINES = {
  oh: { say: "Maya would make the data centers pay the full cost of their own electricity, not you.", door: ["Hi Barb, I'm Sam and I'm volunteering for Maya Kaur.", "Bills are up more than half since 2019, and data centers are the biggest new reason. Maya would make them pay their full cost.", "She's not banning them, she just wants them to pay their own way.", "His bill only asks states to consider it. Thanks so much, Barb, stay warm."] },
  tx: { say: "Maya fights vouchers because they take tax dollars out of our public schools.", door: ["Hi, I'm Sam, I'm with Maya Kaur's campaign.", "Maya taught in a public school and she fights vouchers, because seven in ten went to kids already in private school.", "I'm glad your niece is doing well. It's a fair choice. The money just comes from the same budget as public schools.", "Her opponent backs vouchers. Thanks for your time, Ray."] },
};
async function fits(p) { return p.evaluate(() => { const s = document.querySelector("#scr"), a = document.querySelector("#app"); const over = [...document.querySelectorAll("#scr *")].filter((e) => { if (e.closest(".door, .panel") && !e.matches(".door, .panel")) return false; const r = e.getBoundingClientRect(); return r.width && (r.bottom > a.getBoundingClientRect().bottom + 1 || r.right > window.innerWidth + 1); }).map((e) => String(e.className && e.className.baseVal != null ? e.className.baseVal : e.className) || e.tagName).slice(0, 4); return { ok: s.scrollHeight <= s.clientHeight + 1 && !over.length, over, sh: s.scrollHeight, ch: s.clientHeight }; }); }
async function waitFor(p, fn, ms = 20000, arg) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn, arg).catch(() => false)) return true; await p.waitForTimeout(100); } return false; }
(async () => {
  const b = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
  const sizes = FULL ? [[390, 844]] : [[390, 844], [375, 667], [430, 932]];
  for (const lid of ["oh", "tx"]) for (const [W, H] of sizes) {
    const tag = `${lid}-${W}x${H}`;
    const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const p = await ctx.newPage(); const errs = [];
    p.on("pageerror", (e) => errs.push(String(e))); await realFonts(p); await p.addInitScript(FAKE);
    await p.goto(BASE + "&l=" + lid + "&lat", { waitUntil: "load" }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
    let f = await fits(p); ok(f.ok, `${tag} cover fits: ${JSON.stringify(f)}`);
    ok(!/—/.test(await p.content()), `${tag} no em dash`);
    ok(!/(Brown|Talarico|Husted|Paxton|Ohio|Texas)/.test(await p.evaluate(() => document.body.innerText)), `${tag} the cover names no real candidate or state`);
    await p.screenshot({ path: path.join(OUT, `${tag}-0cover.png`) });
    const t0 = Date.now();
    await p.click("#start");
    const nb = await p.evaluate(() => window.__train.D.beats.length);
    for (let k = 0; k < nb; k++) {
      ok(await waitFor(p, (k) => window.__train.FLOW[window.__train.S.at].kind === "beat" && window.__train.S.beat === k, 15000, k), `${tag} beat ${k + 1} shows`);
      await p.waitForTimeout(FULL ? 300 : 1400); if (!FULL) { await p.evaluate(() => document.querySelectorAll("#panel [data-at]").forEach((e) => e.classList.add("on"))); }
      f = await fits(p); ok(f.ok, `${tag} beat ${k + 1} fits: ${JSON.stringify(f)}`);
      const lit = await p.evaluate(() => document.querySelectorAll("#panel [data-at].on").length); ok(lit > 0, `${tag} beat ${k + 1} lights its picture`);
      ok((await p.evaluate(() => document.querySelector("#cap").textContent)).length > 10, `${tag} beat ${k + 1} has its caption`);
      if (!FULL) { await p.waitForTimeout(1200); await p.screenshot({ path: path.join(OUT, `${tag}-b${k + 1}.png`) }); await p.click("#tr"); }
      else { const t = Date.now(); await waitFor(p, (k) => window.__train.S.beat !== k || window.__train.FLOW[window.__train.S.at].kind !== "beat", 40000, k); console.log(`  ${tag} beat ${k + 1}: ${((Date.now() - t) / 1000).toFixed(1)} s`); await p.screenshot({ path: path.join(OUT, `${tag}-b${k + 1}.png`) }); }
    }
    const learnS = (Date.now() - t0) / 1000;
    ok(await waitFor(p, () => window.__train.FLOW[window.__train.S.at].kind === "quiz"), `${tag} the check follows the story`);
    for (let q = 0; q < 2; q++) {
      f = await fits(p); ok(f.ok, `${tag} check ${q + 1} fits: ${JSON.stringify(f)}`);
      const right = await p.evaluate((q) => window.__train.D.quiz[q].right, q);
      await p.click(`.opt[data-k="${q === 0 && lid === "oh" ? 0 : right}"]`);
      ok(await p.isVisible(".why"), `${tag} check ${q + 1} explains`);
      if (q === 0 && lid === "oh") ok(await p.evaluate(() => !!document.querySelector(".opt.wrong") && !!document.querySelector(".opt.right")), `${tag} a wrong pick shows the right one`);
      await p.screenshot({ path: path.join(OUT, `${tag}-q${q + 1}.png`) });
      await p.click("#go");
    }
    ok(await waitFor(p, () => window.__train.FLOW[window.__train.S.at].kind === "say"), `${tag} say it out loud`);
    f = await fits(p); ok(f.ok, `${tag} say screen fits: ${JSON.stringify(f)}`);
    await p.evaluate(() => { window.__say.push("um I think she wants lower bills"); });
    await p.click("#mic", { force: true }); ok(await waitFor(p, () => !!document.querySelector(".model")), `${tag} a miss shows a line to try`);
    await p.evaluate((t) => { window.__say.push(t); }, LINES[lid].say);
    await p.click("#mic", { force: true }); ok(await waitFor(p, () => !!document.querySelector("#heard mark")), `${tag} a hit highlights the words that carried it`);
    ok(!(await p.evaluate(() => document.querySelector("#go").disabled)), `${tag} a hit unlocks the next step`);
    await p.screenshot({ path: path.join(OUT, `${tag}-say.png`) });
    await p.click("#go");
    f = await fits(p); ok(f.ok, `${tag} door intro fits: ${JSON.stringify(f)}`);
    await p.screenshot({ path: path.join(OUT, `${tag}-doorintro.png`) });
    const s0 = await stats(); const tDoor = Date.now();
    await p.click("#knock");
    ok(await waitFor(p, () => document.querySelectorAll("#thread .bub.them").length === 1), `${tag} the voter opens the door`);
    ok(await waitFor(p, () => document.querySelector("#mic").classList.contains("pulse"), 15000), `${tag} your turn after the opening`);
    const lines = LINES[lid].door;
    for (let k = 0; k < lines.length; k++) {
      if (k === 1 && W === 390) { await fetch("http://127.0.0.1:8799/__t/fail?n=2"); }
      await p.evaluate((t) => { window.__say.push(t); }, lines[k]);
      await p.click("#mic", { force: true });
      if (k === 1 && W === 390) {
        ok(await waitFor(p, () => !!document.querySelector("#retry"), 15000), `${tag} a failed turn says so and offers Try again`);
        ok((await p.evaluate(() => document.querySelectorAll("#thread .bub.them").length)) === 2, `${tag} no made-up line when the AI fails`);
        await p.screenshot({ path: path.join(OUT, `${tag}-fail.png`) });
        await p.click("#retry");
      }
      if (k < lines.length - 1) ok(await waitFor(p, (n) => document.querySelectorAll("#thread .bub.them").length >= n && document.querySelector("#mic").classList.contains("pulse"), 20000, k + 2), `${tag} the voter answers turn ${k + 1}`);
      if (k === 1) { f = await fits(p); ok(f.ok, `${tag} the door fits mid-conversation: ${JSON.stringify(f)}`); await p.screenshot({ path: path.join(OUT, `${tag}-door.png`) }); }
    }
    ok(await waitFor(p, () => window.__train.FLOW[window.__train.S.at].kind === "coach", 25000), `${tag} the voter's goodbye ends it and the coach follows`);
    const doorS = (Date.now() - tDoor) / 1000;
    const s1 = await stats();
    ok(s1.turn - s0.turn === lines.length + (W === 390 ? 2 : 0), `${tag} one model call per learner turn (speculation reused, failures counted): ${s1.turn - s0.turn}`);
    const lat = await p.evaluate(() => window.__train.S.door.lat);
    console.log(`  ${tag} learn ${learnS.toFixed(1)} s, door ${doorS.toFixed(1)} s, stopped-talking to voice (local stub): ${lat.join(", ")} ms`);
    ok(await waitFor(p, () => document.querySelectorAll(".rows li").length >= 4, 15000), `${tag} the coach's rows land`);
    f = await fits(p); ok(f.ok, `${tag} coach fits: ${JSON.stringify(f)}`);
    ok(await p.evaluate(() => [...document.querySelectorAll(".rows span")].filter((x) => /“/.test(x.textContent)).length >= 2), `${tag} credits quote the learner's own words`);
    await p.screenshot({ path: path.join(OUT, `${tag}-coach.png`) });
    await p.click("#fin");
    f = await fits(p); ok(f.ok, `${tag} done fits: ${JSON.stringify(f)}`);
    const done = await p.evaluate(() => document.body.innerText);
    ok(lid === "oh" ? /Sherrod Brown/.test(done) && /Ohio/.test(done) : /James Talarico/.test(done) && /Texas/.test(done), `${tag} the one credit names the real candidate on the last screen`);
    ok(/Next: /.test(done), `${tag} done offers the other training`);
    await p.screenshot({ path: path.join(OUT, `${tag}-done.png`) });
    await p.click("#src"); ok(await p.isVisible(".sheet"), `${tag} sources open`);
    ok((await p.$$eval(".sheet a", (a) => a.length)) >= 5, `${tag} sources list the links`);
    await p.screenshot({ path: path.join(OUT, `${tag}-sources.png`) });
    if (FULL) console.log(`  ${tag} whole lesson ${(Date.now() - t0) / 1000} s (with scripted answers)`);
    ok(errs.length === 0, `${tag} no page errors: ${errs.join(" | ")}`);
    await ctx.close();
  }
  /* a blocked mic, and a browser that can't listen */
  { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const p = await ctx.newPage(); await realFonts(p); await p.addInitScript(FAKE); await p.addInitScript(() => { window.__srDeny = true; });
    await p.goto(BASE + "&l=oh&at=say"); await p.waitForTimeout(500); await p.click("#mic", { force: true });
    ok(await waitFor(p, () => /microphone is off/.test(document.querySelector("#mict").textContent)), "a blocked mic says how to allow it");
    ok(!/type/i.test(await p.evaluate(() => document.body.innerText)), "no offer to type, ever"); await ctx.close(); }
  { const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); await realFonts(p); await p.addInitScript(() => { delete window.SpeechRecognition; delete window.webkitSpeechRecognition; window.SpeechRecognition = undefined; window.webkitSpeechRecognition = undefined; });
    await p.goto(BASE + "&l=tx&at=say"); await p.waitForTimeout(500);
    ok(/This part is spoken/.test(await p.evaluate(() => document.body.innerText)) && !(await p.$("textarea, input[type=text]")), "a browser that can't listen gets the open-in-Safari card, no text box"); await ctx.close(); }
  /* inside the app: the done message reaches the parent */
  { const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); await p.addInitScript(FAKE);
    fs.writeFileSync("/tmp/claude-0/-home-claude/4f985791-cb78-5151-a3d6-e6a9c0d013a5/scratchpad/site/wdpfxqlsvp/zzframe.html", '<html><body style="margin:0"><iframe id="f" style="width:390px;height:844px;border:0" src="train/?ai=http://127.0.0.1:8799&l=oh&at=done"></iframe><script>window.got=[];addEventListener("message",e=>got.push(e.data))</script></body></html>');
    await p.goto("http://127.0.0.1:8765/wdpfxqlsvp/zzframe.html"); await p.waitForTimeout(1500);
    ok(await p.evaluate(() => window.got.some((d) => d.warmup === "brief-done" && d.lesson === "oh")), "inside the app, done tells Warmup to check it off");
    const fr = p.frame({ url: /train/ }); await fr.click("#back"); await p.waitForTimeout(300);
    ok(await p.evaluate(() => window.got.some((d) => d.warmup === "issues-close")), "Back to Learn closes the overlay"); await ctx.close(); }
  await b.close();
  console.log(`train: ${pass} pass, ${fail} fail`); process.exit(fail ? 1 : 0);
})();
