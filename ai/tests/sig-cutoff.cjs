/* Nobody is cut off mid-sentence (Robert, Nov 22, 2026, 4:10 PM, on lesson 2's 1st try: "it just cut off my voice. I was still
   talking, unfinished."; playbook rule 34a, voter rule 15). His second line, as the server's log has it, was sent after a short pause:
   "We're collecting signatures on Uh have something on the ballot in November to get", and the man left ("Sorry, I've got to run,
   good luck!"). Checks, in a real browser with a stand-in mic and the passerby's answers from the script (?fast keeps live replies off):
   1. his exact line, then 1.7 seconds of quiet (past the 1.2 for a finished line), then the rest: the line is heard whole, once, and
      the man answers the whole line, not the half;
   2. the phone stops listening on its own partway through a line (iOS does, after a short pause): the app listens again, keeps the
      words and hears the line whole;
   3. a finished opener still gets its answer after the short pause, so nothing got slow.
   Usage (from the repo root, with Playwright installed): node ai/tests/sig-cutoff.cjs. Exits 1 on any failure. */
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path"), http = require("http");
const ROOT = path.resolve(__dirname, "../..");
const TYPES = { ".html": "text/html; charset=utf-8", ".mp3": "audio/mpeg", ".json": "application/json", ".png": "image/png", ".webp": "image/webp", ".js": "text/javascript" };
const serve = () => new Promise((res) => { const s = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split("?")[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream" }); r.end(b); }); }); s.listen(0, "127.0.0.1", () => res(s)); });
const FAKE_SR = () => {
  window.__starts = 0;
  class FakeSR {
    start() { window.__sr = this; window.__starts += 1; this.on = true; setTimeout(() => { if (this.on && this.onstart) this.onstart(); }, 10); }
    stop() { if (!this.on) return; this.on = false; setTimeout(() => { if (this.onend) this.onend(); }, 50); }
    abort() { if (!this.on) return; this.on = false; setTimeout(() => { if (this.onend) this.onend(); }, 0); }
  }
  window.SpeechRecognition = FakeSR; window.webkitSpeechRecognition = FakeSR;
  window.__caps = []; /* every caption that shows, however briefly */
  new MutationObserver(() => document.querySelectorAll("#capts .capt").forEach((n) => { const t = n.textContent.replace(/\s+/g, " ").trim(); if (window.__caps[window.__caps.length - 1] !== t) window.__caps.push(t); })).observe(document, { childList: true, subtree: true, characterData: true });
  /* the words so far in this listening session, as a phone sends them while you talk */
  window.__speak = (text) => { const r = window.__sr; if (!r || !r.onresult || !r.on) return false; r.onresult({ results: { length: 1, 0: { 0: { transcript: text, confidence: 0.9 }, isFinal: false, length: 1 } }, resultIndex: 0 }); return true; };
  /* the phone ends the session on its own, as iOS does after a short pause */
  window.__phoneStops = () => { const r = window.__sr; if (!r || !r.on) return false; r.on = false; if (r.onend) r.onend(); return true; };
};
let fails = 0;
const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails += 1; };
(async () => {
  const srv = await serve(), base = `http://127.0.0.1:${srv.address().port}/wdpfxqlsvp/sig/index.html?preview&l=2&fast`;
  const b = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
  /* plays the 1st try: taps the sheet, waits for the talk button, taps it, then runs `talk` with the page; returns the captions */
  const run = async (talk) => {
    const c = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }); await c.addInitScript(FAKE_SR);
    const p = await c.newPage(), errs = []; p.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
    await p.goto(`${base}&at=1.0`, { waitUntil: "load" });
    let started = false;
    for (let i = 0; i < 300 && !started; i += 1) {
      const s = await p.evaluate(() => ({ sheet: !!document.querySelector("#gsheet #go"), mic: (document.querySelector("#mic") || {}).className || "" }));
      if (s.sheet) { await p.evaluate(() => document.querySelector("#gsheet #go").click()); await p.waitForTimeout(80); continue; }
      if (/pulse/.test(s.mic)) { await p.evaluate(() => document.querySelector("#mic").click()); await p.waitForTimeout(80); continue; }
      if (/\bon\b/.test(s.mic)) { started = true; break; }
      await p.waitForTimeout(50);
    }
    if (started) await talk(p);
    await p.waitForTimeout(3500); /* the answer, as the script says it in fast mode */
    const caps = await p.evaluate(() => window.__caps), starts = await p.evaluate(() => window.__starts);
    await c.close();
    return { started, caps, you: [...new Set(caps.filter((x) => /^You/.test(x)))], them: [...new Set(caps.filter((x) => /^Passerby/.test(x)))], starts, errs }; /* a caption can show twice as others come and go */
  };
  /* 1. Robert's exact line, a pause, then the rest */
  const HALF = "We're collecting signatures on Uh have something on the ballot in November to get";
  const WHOLE = HALF + " longer library hours. Are you registered to vote in LA County?";
  let r = await run(async (p) => {
    await p.evaluate((t) => window.__speak(t), "Hi there!"); await p.waitForTimeout(300);
    await p.evaluate((t) => window.__speak(t), "Hi there! " + HALF); await p.waitForTimeout(1700); /* past 1.2 seconds of quiet */
    await p.evaluate((t) => window.__speak(t), "Hi there! " + WHOLE);
  });
  ok(r.started, "1. the 1st try's talk button turned on");
  ok(r.you.length === 1 && /longer library hours/i.test(r.you[0]) && /LA County/i.test(r.you[0]), "1. Robert's line after a 1.7-second pause on \"to get\" is heard whole, once (" + r.you.join(" / ") + ")");
  ok(r.them.length && !r.them.some((x) => /got to run/i.test(x)), "1. the man answers the whole line, and doesn't leave (" + r.them.join(" / ") + ")");
  ok(!r.errs.length, "1. no page errors " + r.errs.join(" "));
  /* 2. the phone stops listening partway through */
  r = await run(async (p) => {
    await p.evaluate((t) => window.__speak(t), "Hi there! I'm collecting signatures for a ballot measure to keep"); await p.waitForTimeout(400);
    await p.evaluate(() => window.__phoneStops()); await p.waitForTimeout(200);
    await p.evaluate((t) => window.__speak(t), "libraries open later. Are you registered to vote in LA County?");
  });
  ok(r.starts >= 2, "2. the app listens again when the phone stops on its own (" + r.starts + " starts)");
  ok(r.you.length === 1 && /to keep libraries open later/i.test(r.you[0]) && /LA County/i.test(r.you[0]), "2. the words from before and after the stop make one line (" + r.you.join(" / ") + ")");
  ok(r.them.some((x) => /registered/i.test(x)), "2. the man answers the whole opener (" + r.them.join(" / ") + ")");
  ok(!r.errs.length, "2. no page errors " + r.errs.join(" "));
  /* 3. a finished opener is answered after the short pause */
  let t0 = 0;
  r = await run(async (p) => {
    await p.evaluate((t) => window.__speak(t), "Hi there! I'm collecting signatures for a ballot measure to keep libraries open later. Are you registered to vote in LA County?");
    t0 = Date.now();
    for (let i = 0; i < 60; i += 1) { if (await p.evaluate(() => window.__caps.some((x) => /^You/.test(x)))) break; await p.waitForTimeout(50); }
    t0 = Date.now() - t0;
  });
  ok(r.you.length === 1 && t0 < 2200, "3. a finished opener is sent after the short pause (" + t0 + " ms)");
  ok(!r.errs.length, "3. no page errors " + r.errs.join(" "));
  await b.close(); srv.close();
  console.log(fails ? `sig-cutoff: ${fails} failed` : "sig-cutoff: all pass");
  process.exit(fails ? 1 : 0);
})();
