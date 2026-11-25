/* Version 176: nobody is cut off mid-sentence at the issue training page's door either (playbook rule 34a; Robert's notes on the
   signature course: Nov 22, 2026, "it just cut off my voice. I was still talking, unfinished.", and Nov 23, "It cut me off when I
   was talking too soon"). Before, every line there ended after 0.9 s of quiet, and when the phone stopped listening on its own the
   words so far went at once. In a real browser, with a stand-in mic, against the real worker with a stubbed model and voice
   (ai/tests/train-server.mjs), on the electric bill training's door:
   1. a line that stops on "trying to get", then 1.7 s of quiet: nothing goes; the rest follows and the whole line goes, once;
   2. the phone stops listening on its own partway through a line: listening starts again and the words are kept;
   3. the phone stops and then refuses to listen again: what was heard still goes, with no microphone message.
   Usage: node ai/tests/train-server.mjs /abs/site & then NODE_PATH=/opt/node-tools/node_modules node ai/tests/train-cutoff.cjs
   (the site's wdpfxqlsvp/train/ is the page under test; build the review copy's with --out and copy it there) */
const { chromium } = require("playwright");
const BASE = "http://127.0.0.1:8765/wdpfxqlsvp/train/?ai=http://127.0.0.1:8799&l=oh&at=door";
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass += 1; console.log("ok  ", m); } else { fail += 1; console.log("FAIL", m); } };
const FAKE_SR = () => {
  window.__starts = 0;
  class FakeSR {
    start() { window.__sr = this; window.__starts += 1; this.on = true; const bad = window.__failNextStart; window.__failNextStart = ""; if (bad) { setTimeout(() => { if (this.onerror) this.onerror({ error: bad }); this.on = false; }, 30); return; } setTimeout(() => { if (this.on && this.onstart) this.onstart(); }, 10); }
    stop() { if (!this.on) return; this.on = false; setTimeout(() => { if (this.onend) this.onend(); }, 50); }
    abort() { this.on = false; }
  }
  window.SpeechRecognition = FakeSR; window.webkitSpeechRecognition = FakeSR;
  window.__speak = (text) => { const r = window.__sr; if (!r || !r.onresult || !r.on) return false; r.onresult({ results: [[{ transcript: text }]] }); return true; };
  window.__phoneStops = () => { const r = window.__sr; if (!r || !r.on) return false; r.on = false; if (r.onend) r.onend(); return true; };
};
(async () => {
  const b = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await ctx.addInitScript(FAKE_SR);
  const p = await ctx.newPage(), errs = [];
  p.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
  const waitFor = async (fn, ms = 15000, arg) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn, arg).catch(() => false)) return true; await p.waitForTimeout(40); } return false; };
  const yours = () => p.evaluate(() => ((window.__train.S.door || {}).turns || []).filter((t) => t.who === "you").map((t) => t.text));
  const yourTurn = () => waitFor(() => document.querySelector("#mic") && document.querySelector("#mic").classList.contains("pulse"), 20000);
  await p.goto(BASE, { waitUntil: "load" });
  ok(await waitFor(() => document.querySelectorAll("#thread .bub.them").length === 1), "the voter opens the door (?at=door opens the live door)");
  ok(await yourTurn(), "your turn after the opening");

  /* 1. a pause after "trying to get" */
  await p.click("#mic", { force: true });
  await waitFor(() => !!(window.__sr && window.__sr.on), 3000);
  await p.evaluate(() => window.__speak("Hi Barb, I'm Sam, and we're trying to get"));
  await p.waitForTimeout(1700);
  ok((await yours()).length === 0, "1.7 s of quiet after \"trying to get\" doesn't end the line");
  await p.evaluate(() => window.__speak("Hi Barb, I'm Sam, and we're trying to get the word out for Maya Kaur."));
  const t1 = Date.now();
  ok(await waitFor(() => ((window.__train.S.door || {}).turns || []).some((t) => t.who === "you"), 4000), "the finished line goes");
  const d1 = Date.now() - t1;
  ok(d1 >= 900 && d1 < 2300, "after about 1.2 s of quiet (was 0.9): " + (d1 / 1000).toFixed(2) + " s");
  ok(JSON.stringify(await yours()) === JSON.stringify(["Hi Barb, I'm Sam, and we're trying to get the word out for Maya Kaur."]), "whole, once: " + JSON.stringify(await yours()));

  /* 2. the phone stops on its own mid-line */
  ok(await yourTurn(), "your turn again");
  await p.click("#mic", { force: true });
  await waitFor(() => !!(window.__sr && window.__sr.on), 3000);
  const s0 = await p.evaluate(() => window.__starts);
  await p.evaluate(() => window.__speak("Bills are up more than half since 2019, and"));
  await p.waitForTimeout(300);
  await p.evaluate(() => window.__phoneStops());
  ok(await waitFor((k) => window.__starts > k && window.__sr.on, 2000, s0), "when the phone stops on its own, listening starts again");
  ok((await yours()).length === 1, "and nothing goes yet");
  await p.evaluate(() => window.__speak("data centers are the biggest new reason."));
  ok(await waitFor(() => ((window.__train.S.door || {}).turns || []).filter((t) => t.who === "you").length >= 2, 4000), "the line goes after the quiet");
  ok(((await yours())[1] || "") === "Bills are up more than half since 2019, and data centers are the biggest new reason.", "with the words kept: " + JSON.stringify((await yours())[1]));

  /* 3. the phone stops and won't listen again */
  ok(await yourTurn(), "your turn again");
  await p.click("#mic", { force: true });
  await waitFor(() => !!(window.__sr && window.__sr.on), 3000);
  await p.evaluate(() => window.__speak("Maya would make them pay their"));
  await p.waitForTimeout(300);
  await p.evaluate(() => { window.__failNextStart = "not-allowed"; window.__phoneStops(); });
  ok(await waitFor(() => ((window.__train.S.door || {}).turns || []).filter((t) => t.who === "you").length >= 3, 3000), "a phone that won't listen again still sends what was heard");
  ok(((await yours())[2] || "") === "Maya would make them pay their", "the words heard: " + JSON.stringify((await yours())[2]));
  ok(!/needs your microphone|can.t reach your microphone/i.test(await p.evaluate(() => document.body.innerText)), "no microphone message");

  ok(!errs.length, "no page errors: " + errs.slice(0, 3).join(" | "));
  console.log(`train cut-off: ${pass} pass, ${fail} fail`);
  await b.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("CRASH", e); process.exit(2); });
