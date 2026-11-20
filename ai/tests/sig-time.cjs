/* One timed run of a signature lesson at a normal pace, in a real browser with the real recorded voices: a stand-in canvasser
   who speaks at 150 words a minute, reads silent text at 200 words a minute and takes two seconds a tap (the script's own
   assumptions). Prints the real seconds for each step against the script's.
   Usage (from the repo root, with Playwright installed): node ai/tests/sig-time.cjs <lesson 1-5> [script, default normal] */
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path"), http = require("http"), os = require("os");
const ROOT = path.resolve(__dirname, "../..");
const SCRIPTS = require("./sig-scripts.cjs");
const TYPES = { ".html": "text/html; charset=utf-8", ".mp3": "audio/mpeg", ".json": "application/json", ".png": "image/png", ".js": "text/javascript" };
const serve = () => new Promise((res) => { const s = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split("?")[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream" }); r.end(b); }); }); s.listen(0, "127.0.0.1", () => res(s)); });
const FAKE_SR = () => {
  window.__srs = [];
  class FakeSR {
    constructor() { this.continuous = false; this.interimResults = false; window.__srs.push(this); }
    start() { window.__sr = this; this.on = true; setTimeout(() => { if (this.on && this.onstart) this.onstart(); }, 10); } /* as a real mic: listening a moment later */
    stop() { if (!this.on) return; this.on = false; setTimeout(() => { if (this.onend) this.onend(); }, 400); }
    abort() { if (!this.on) return; this.on = false; setTimeout(() => { if (this.onend) this.onend(); }, 0); }
  }
  window.SpeechRecognition = FakeSR; window.webkitSpeechRecognition = FakeSR;
  window.__speak = (text) => { const r = window.__sr; if (!r || !r.onresult) return false; const res = { 0: { transcript: text, confidence: 0.9 }, isFinal: false, length: 1 }; r.onresult({ results: { length: 1, 0: res }, resultIndex: 0 }); return true; };
};
const L = {
  launch: () => chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] }),
  ctx: async (b, o) => {
    const pane = o.w >= 1000, c = await b.newContext({ viewport: { width: o.w, height: o.h }, hasTouch: !pane, isMobile: !pane, deviceScaleFactor: o.dpr || 2 });
    const F = process.env.FONTS;
    if (F && fs.existsSync(path.join(F, "Figtree.ttf"))) {
      const f = (n) => "url(data:font/ttf;base64," + fs.readFileSync(path.join(F, n)).toString("base64") + ') format("truetype")';
      const css = `@font-face{font-family:"Figtree";font-weight:300 900;src:${f("Figtree.ttf")}}@font-face{font-family:"Newsreader";font-weight:200 800;src:${f("Newsreader.ttf")}}@font-face{font-family:"Newsreader";font-style:italic;font-weight:200 800;src:${f("NewsreaderItalic.ttf")}}`;
      await c.route(/fonts\.googleapis\.com/, (r) => r.fulfill({ status: 200, contentType: "text/css", body: css })); await c.route(/fonts\.gstatic\.com/, (r) => r.abort());
    }
    await c.addInitScript(FAKE_SR);
    return c;
  },
};
const [,, lesson = "2", scriptName = "normal", W = "390", H = "844"] = process.argv;
(async () => {
  const b = await L.launch(); const c = await L.ctx(b, { w: +W, h: +H, dpr: 1 });
  const p = await c.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(String(e).slice(0, 300)));
  const srv = process.env.BASE ? null : await serve(), base = process.env.BASE || `http://127.0.0.1:${srv.address().port}/wdpfxqlsvp/sig/`;
  await p.goto(`${base}index.html?preview&l=${lesson}`, { waitUntil: "load" });
  await p.waitForSelector("#start", { timeout: 8000 });
  const say = SCRIPTS[lesson][scriptName].slice(), taps = (SCRIPTS[lesson][scriptName === "normal" ? "tapsNormal" : "taps"] || []).slice(), boxes = (SCRIPTS[lesson][scriptName === "normal" ? "boxesNormal" : "boxes"] || []).slice(), decl = SCRIPTS[lesson][scriptName === "normal" ? "declNormal" : "decl"] || [1, 2];
  const tap = (sel) => p.evaluate((s) => { const e = document.querySelector(s); if (e) e.click(); }, sel);
  /* silent reading: each line on screen is read once in a step, at 200 words a minute (an answer under a card is read
     once, and the card, the step's name and the petition's printed words aren't read again on the next screen) */
  const lines = () => p.evaluate(() => document.querySelector("#scr").innerText.split(/\n+/).map((x) => x.trim()).filter(Boolean));
  const count = (ls) => ls.reduce((a, l) => a + l.split(/\s+/).filter(Boolean).length, 0);
  const log = []; let spokeFor = -1, seenLines = new Set(), curStep = -1, t0 = Date.now(), readWords = 0;
  const read = async () => { const ls = await lines(); const fresh = count(ls.filter((l) => !seenLines.has(l))); ls.forEach((l) => seenLines.add(l)); readWords += fresh; await p.waitForTimeout(Math.min(14000, Math.round(fresh / 200 * 60000))); };
  await p.waitForTimeout(3000); await tap("#start"); /* three seconds on the cover */
  await p.evaluate(() => { window.__t0 = performance.now(); });
  for (let i = 0; i < 4000; i++) {
    const st = await p.evaluate(() => ({ cover: !!document.querySelector("#start"), mic: document.querySelector("#mic") ? document.querySelector("#mic").className : "", go: !!document.querySelector("#go") && !document.querySelector("#go").classList.contains("ghost"), opts: document.querySelectorAll("#opts:not(.done) button").length, decl: document.querySelectorAll(".decl:not([disabled])").length, boxes: document.querySelectorAll("button.box").length, okb: !!document.querySelector("#okb:not([disabled])"), srs: (window.__srs || []).length, playing: !!document.querySelector(".capt"), tag: document.querySelector("#tag").textContent, step: window.__sg.S.step, kind: window.__sg.L.steps[window.__sg.S.step] ? window.__sg.L.steps[window.__sg.S.step].kind : "" }));
    if (st.cover) break;
    if (st.step !== curStep) { curStep = st.step; seenLines = new Set(); } /* each line is read once in a step */
    if (/pulse/.test(st.mic)) { await p.waitForTimeout(700); await tap("#mic"); await p.waitForTimeout(150); continue; }
    if (/\bon\b/.test(st.mic) && st.srs !== spokeFor) {
      spokeFor = st.srs; const t = say.shift(); if (t == null) { errs.push(st.tag + ": nothing left to say"); break; }
      await p.waitForTimeout(500); /* a breath before speaking */
      const ws = t.split(/\s+/); for (let k = 1; k <= ws.length; k++) { await p.evaluate((x) => window.__speak(x), ws.slice(0, k).join(" ")); await p.waitForTimeout(400); }
      log.push(st.tag + " said: " + t.slice(0, 50)); continue;
    }
    if (st.decl) { await read(); for (const k of decl) { await p.waitForTimeout(2000); await tap(`.decl[data-i="${k}"]`); } continue; }
    if (st.boxes || st.okb) { await read(); await p.waitForTimeout(2000); const pick = boxes.shift() || "ok"; if (pick === "ok") await tap("#okb"); else await tap(`button.box[data-box="${pick}"]`); await p.waitForTimeout(200); continue; }
    if (st.opts) { await read(); await p.waitForTimeout(2000); const pick = taps.shift(); await p.evaluate((k) => { const bs = [...document.querySelectorAll("#opts button")]; (bs[k == null ? 0 : k] || bs[0]).click(); }, pick); await p.waitForTimeout(200); continue; }
    if (st.go) {
      /* wait for any voice that is still talking, read what's new, then tap */
      /* words that were just spoken aloud were heard, not read: only silent text takes reading time */
      let heard = st.kind === "hear" || st.kind === "cards" || st.kind === "stop";
      for (let k = 0; k < 400; k++) { const busy = await p.evaluate(() => !!(window.__sg && window.__sgBusy && window.__sgBusy())); if (!busy) break; heard = true; await p.waitForTimeout(100); }
      if (heard) { (await lines()).forEach((l) => seenLines.add(l)); } else await read();
      await p.waitForTimeout(1200); await tap("#go"); await p.waitForTimeout(300); continue;
    }
    await p.waitForTimeout(100);
  }
  const timing = await p.evaluate(() => window.__sg.time()), Ls = await p.evaluate(() => window.__sg.L.steps.map((s) => [s.name, s.secs]));
  const rows = Ls.map(([name, secs], k) => ({ step: k + 1, name, script: secs, real: Math.round((timing[k] || 0) / 100) / 10 }));
  console.log(JSON.stringify({ lesson, script: scriptName, total: Math.round(rows.reduce((a, r) => a + r.real, 0)), rows, errs, left: say.length, wall: Math.round((Date.now() - t0) / 1000) }, null, 1));
  await b.close(); if (srv) srv.close();
})().catch((e) => { console.error("ERR", e); process.exit(1); });
