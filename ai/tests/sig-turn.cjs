/* Your turn is a real one (Robert, Nov 23, 2026, 4:10 PM, on lesson 2's 1st try, version 12 with live replies: "It cut me off when
   I was talking too soon, and I was still talking, and it cut me off. Then it said something, and before I could even reply, it said,
   'Oh, sorry, I have to go.' It wasn't natural how the passerby spoke two times back to back without me being able to talk in the
   middle of it."; playbook rules 34a and 37g, voter rules 15 and 16).
   The server's log had his run: his phone heard "Hi how are you", and the man answered, live, "I'm good, thanks. Just grabbing my
   coffee, so I'm in a bit of a hurry." He then had 2.5 seconds, counted from the end of that line, while the mic came back on, and the
   man said "Oh, sorry, I'm busy. Have a good day." This plays his run in real time, in a real browser, with a stand-in mic that, like a
   phone, takes a second to listen again, and the man's live line stubbed with its exact words and a 4.5-second voice. Checks:
   1. "Hi how are you", then 1.7 seconds of quiet, then the rest: heard whole, once;
   2. "Hi how are you" on its own: the man answers it; the mic comes back on by itself; words that arrive 3 seconds after his line
      ended are heard and answered, with no brush-off first;
   3. the same, and then silence: the man says nothing more for at least 5 seconds after his line and at least 4 once the mic is
      listening again; then he says the brush-off, once, and the card says he walked on.
   Usage (from the repo root, with Playwright installed): node ai/tests/sig-turn.cjs. Exits 1 on any failure. About 90 seconds. */
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path"), http = require("http");
const ROOT = path.resolve(__dirname, "../..");
const TYPES = { ".html": "text/html; charset=utf-8", ".mp3": "audio/mpeg", ".json": "application/json", ".png": "image/png", ".webp": "image/webp", ".js": "text/javascript" };
const serve = () => new Promise((res) => { const s = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split("?")[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream" }); r.end(b); }); }); s.listen(0, "127.0.0.1", () => res(s)); });
/* 4.5 seconds of quiet as a WAV: the length of the man's live line in Robert's run */
const wav = (sec) => { const rate = 8000, n = Math.round(rate * sec), b = Buffer.alloc(44 + n * 2); b.write("RIFF", 0); b.writeUInt32LE(36 + n * 2, 4); b.write("WAVE", 8); b.write("fmt ", 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(n * 2, 40); return b.toString("base64"); };
const LIVE = "I'm good, thanks. Just grabbing my coffee, so I'm in a bit of a hurry.";
const FAKE_SR = () => {
  window.__starts = []; window.__startDelay = 10;
  class FakeSR {
    start() { window.__sr = this; this.on = true; this.listening = false; const d = window.__startDelay; setTimeout(() => { if (!this.on) return; this.listening = true; window.__starts.push(performance.now()); if (this.onstart) this.onstart(); }, d); }
    stop() { if (!this.on) return; this.on = false; setTimeout(() => { if (this.onend) this.onend(); }, 50); }
    abort() { if (!this.on) return; this.on = false; setTimeout(() => { if (this.onend) this.onend(); }, 0); }
  }
  window.SpeechRecognition = FakeSR; window.webkitSpeechRecognition = FakeSR;
  window.__caps = []; /* every caption, with when it showed */
  new MutationObserver(() => document.querySelectorAll("#capts .capt").forEach((n) => { const t = n.textContent.replace(/\s+/g, " ").trim(); const l = window.__caps[window.__caps.length - 1]; if (!l || l.t !== t) window.__caps.push({ t, at: performance.now() }); })).observe(document, { childList: true, subtree: true, characterData: true });
  window.__mic = []; /* the talk button's state over time: wait, pulse (idle) or on */
  setInterval(() => { const b = document.querySelector("#mic"), k = b ? (/\bon\b/.test(b.className) ? "on" : /pulse/.test(b.className) ? "idle" : "wait") : ""; const l = window.__mic[window.__mic.length - 1]; if (!l || l.k !== k) window.__mic.push({ k, at: performance.now() }); }, 20);
  window.__speak = (text) => { const r = window.__sr; if (!r || !r.onresult || !r.on || !r.listening) return false; r.onresult({ results: { length: 1, 0: { 0: { transcript: text, confidence: 0.9 }, isFinal: false, length: 1 } }, resultIndex: 0 }); return true; };
};
let fails = 0;
const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails += 1; };
(async () => {
  const srv = await serve(), base = `http://127.0.0.1:${srv.address().port}/wdpfxqlsvp/sig/index.html?preview&l=2&live=on&at=1.0`;
  const b = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
  const audio = wav(4.5);
  /* plays the 1st try in real time: taps the sheet, waits for the man to arrive, taps the talk button, then runs `talk` */
  const run = async (talk) => {
    const c = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }); await c.addInitScript(FAKE_SR);
    await c.route("**/warmup-ai.robertrgambhir.workers.dev/**", (r) => { /* no real server: his live line for the small talk, the script for anything else, and punctuation stays local */
      if (!/\/sig\/reply$/.test(r.request().url())) return r.abort();
      const keys = (JSON.parse(r.request().postData() || "{}").keys || []).join("+");
      return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(keys === "fSmall" ? { text: LIVE, audio, ms: 900 } : { fallback: "test" }) });
    });
    const p = await c.newPage(), errs = []; p.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
    await p.goto(base, { waitUntil: "load" });
    let started = false;
    for (let i = 0; i < 600 && !started; i += 1) {
      const s = await p.evaluate(() => ({ sheet: !!document.querySelector("#gsheet #go"), mic: (document.querySelector("#mic") || {}).className || "" }));
      if (s.sheet) { await p.evaluate(() => document.querySelector("#gsheet #go").click()); await p.waitForTimeout(100); continue; }
      if (/pulse/.test(s.mic)) { await p.waitForTimeout(1500); await p.evaluate(() => document.querySelector("#mic").click()); await p.waitForTimeout(80); continue; } /* a person taps a beat after he arrives */
      if (/\bon\b/.test(s.mic) && (await p.evaluate(() => window.__sr && window.__sr.listening))) { started = true; break; }
      await p.waitForTimeout(50);
    }
    const out = started ? await talk(p) : {};
    const caps = await p.evaluate(() => window.__caps), mic = await p.evaluate(() => window.__mic), starts = await p.evaluate(() => window.__starts);
    const card = await p.evaluate(() => [...document.querySelectorAll(".rows li")].map((x) => x.innerText.replace(/\s+/g, " ")));
    await c.close();
    return Object.assign({ started, caps, mic, starts, card, errs, you: [...new Set(caps.filter((x) => /^You/.test(x.t)).map((x) => x.t))], them: caps.filter((x) => /^Passerby/.test(x.t)) }, out);
  };
  /* say a line word by word, as a phone sends it while you talk */
  const say = async (p, text, gap) => { const ws = text.split(" "); for (let k = 1; k <= ws.length; k += 1) { await p.evaluate((x) => window.__speak(x), ws.slice(0, k).join(" ")); await p.waitForTimeout(gap || 120); } };
  /* when the man's first line ended: the talk button turned back on after his caption showed */
  const lineEnd = (r, re) => { const c = r.caps.find((x) => re.test(x.t)); if (!c) return 0; const m = r.mic.find((x) => x.at > c.at && x.k === "idle"); return m ? m.at : 0; };
  const OPEN = "I'm collecting signatures for a ballot measure to keep funding schools and health care. Are you registered to vote in LA County?";

  /* 1. Robert's exact line, a pause, then the rest */
  let r = await run(async (p) => { await say(p, "Hi how are you"); await p.waitForTimeout(1700); await say(p, "Hi how are you " + OPEN, 60); await p.waitForTimeout(9000); });
  ok(r.started, "1. the talk button turned on");
  ok(r.you.length === 1 && /how are you/i.test(r.you[0]) && /LA County/i.test(r.you[0]), "1. \"Hi how are you\", 1.7 seconds of quiet, then the rest: heard whole, once (" + r.you.join(" / ") + ")");
  ok(!r.them.some((x) => /I'm good, thanks|busy/.test(x.t.replace("’", "'"))), "1. the man answers the opener, not the hello (" + [...new Set(r.them.map((x) => x.t))].join(" / ") + ")");
  ok(!r.errs.length, "1. no page errors " + r.errs.join(" "));

  /* 2. "Hi how are you" on its own; then the rest, arriving 3 seconds after his line ended (a phone takes a second to listen again) */
  r = await run(async (p) => {
    await say(p, "Hi how are you"); await p.evaluate(() => { window.__startDelay = 1000; });
    let end = 0; for (let i = 0; i < 300 && !end; i += 1) { await p.waitForTimeout(50); end = await p.evaluate(() => { const c = window.__caps.find((x) => /^Passerby/.test(x.t)); if (!c) return 0; const m = window.__mic.find((x) => x.at > c.at && x.k === "idle"); return m ? m.at : 0; }); }
    const now = await p.evaluate(() => performance.now()); await p.waitForTimeout(Math.max(0, end + 3000 - now));
    const heard = await p.evaluate(() => !!(window.__sr && window.__sr.on && window.__sr.listening));
    await say(p, OPEN, 90); await p.waitForTimeout(9000);
    return { heardAt3: heard };
  });
  ok(r.them.length && /good, thanks/.test(r.them[0].t.replace("’", "'")) && /hurry/.test(r.them[0].t), "2. the man answers \"Hi how are you\" with his live line (" + (r.them[0] && r.them[0].t) + ")");
  ok(r.heardAt3, "2. 3 seconds after his line, the mic is listening and he's still there");
  ok(r.you.length === 2 && /LA County/.test(r.you[1]), "2. the opener that followed is heard (" + r.you.join(" / ") + ")");
  ok(!r.them.some((x) => /busy/.test(x.t)), "2. no brush-off: he answers the opener (" + [...new Set(r.them.map((x) => x.t))].join(" / ") + ")");
  ok(!r.errs.length, "2. no page errors " + r.errs.join(" "));

  /* 3. "Hi how are you", his answer, then silence */
  r = await run(async (p) => { await say(p, "Hi how are you"); await p.evaluate(() => { window.__startDelay = 1000; }); await p.waitForTimeout(22000); });
  const end = lineEnd(r, /hurry/), busy = r.them.find((x) => /busy/.test(x.t)), back = r.starts.filter((t) => t > end)[0] || 0;
  ok(end > 0 && !!busy, "3. silent after his answer: he says the brush-off in the end (" + [...new Set(r.them.map((x) => x.t))].join(" / ") + ")");
  ok(busy && busy.at - end >= 5000, "3. nothing more from him for at least 5 seconds after his line (" + (busy ? Math.round(busy.at - end) : "-") + " ms)");
  ok(busy && back && busy.at - back >= 4000, "3. ...and at least 4 seconds once the mic was listening again (" + (busy && back ? Math.round(busy.at - back) : "-") + " ms)");
  ok(new Set(r.them.map((x) => x.t)).size === 2, "3. he speaks twice in all, with your turn between (" + [...new Set(r.them.map((x) => x.t))].join(" / ") + ")");
  ok(r.card.some((x) => /walked on/.test(x)), "3. the card says he walked on");
  ok(!r.errs.length, "3. no page errors " + r.errs.join(" "));
  await b.close(); srv.close();
  console.log(fails ? `sig-turn: ${fails} failed` : "sig-turn: all pass");
  process.exit(fails ? 1 : 0);
})();
