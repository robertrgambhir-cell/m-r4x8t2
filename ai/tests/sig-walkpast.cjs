/* Lesson 2's passersby keep walking (Robert, Nov 20, 2026, 8:23 AM; playbook B3). Checks, in a real browser with a stand-in mic and
   the street running eight times as fast (?fast&walk), that:
   1. said nothing: the man walks past, says "Oh, sorry, I'm busy. Have a good day." and the card says he kept walking, with part 4's
      "Took so long they walked on." and no skipping ahead (the button names Hear it done);
   2. said the opener at once: he stops ("Yeah, I'm registered." then, closing the talk himself, "Sure, I'll sign." since version 8),
      never brushes you off, and the card has all four;
   3. the 2nd try's first passerby, said nothing: she walks past and her card has part 4's walked-on line;
   4. an opener begun just before he'd pass and said slowly is still heard and lands, since every line is heard first (rule 34);
   5. a passerby who stopped ("Oh, for the schools? What do you need?") and was left waiting says "Okay, bye now." and goes, with no
      walked-on line, because the opener had landed.
   Usage (from the repo root, with Playwright installed): node ai/tests/sig-walkpast.cjs. Exits 1 on any failure. */
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path"), http = require("http");
const ROOT = path.resolve(__dirname, "../..");
const OPENER = require("./sig-scripts.cjs")[2].perfect[0];
const TYPES = { ".html": "text/html; charset=utf-8", ".mp3": "audio/mpeg", ".json": "application/json", ".png": "image/png", ".webp": "image/webp", ".js": "text/javascript" };
const serve = () => new Promise((res) => { const s = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split("?")[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream" }); r.end(b); }); }); s.listen(0, "127.0.0.1", () => res(s)); });
const FAKE_SR = () => {
  class FakeSR {
    start() { window.__sr = this; this.on = true; setTimeout(() => { if (this.on && this.onstart) this.onstart(); }, 10); }
    stop() { if (!this.on) return; this.on = false; setTimeout(() => { if (this.onend) this.onend(); }, 50); }
    abort() { if (!this.on) return; this.on = false; setTimeout(() => { if (this.onend) this.onend(); }, 0); }
  }
  window.SpeechRecognition = FakeSR; window.webkitSpeechRecognition = FakeSR;
  window.__caps = []; /* every caption that shows, however briefly */
  new MutationObserver(() => document.querySelectorAll("#capts .capt").forEach((n) => { const t = n.textContent.replace(/\s+/g, " ").trim(); if (window.__caps[window.__caps.length - 1] !== t) window.__caps.push(t); })).observe(document, { childList: true, subtree: true, characterData: true });
  window.__speak = (text) => { const r = window.__sr; if (!r || !r.onresult) return false; r.onresult({ results: { length: 1, 0: { 0: { transcript: text, confidence: 0.9 }, isFinal: false, length: 1 } }, resultIndex: 0 }); return true; };
};
const BUSY = "Oh, sorry, I’m busy. Have a good day.";
let fails = 0;
const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails += 1; };
(async () => {
  const srv = await serve(), base = `http://127.0.0.1:${srv.address().port}/wdpfxqlsvp/sig/index.html?preview&l=2&fast&walk`;
  const b = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
  const run = async (at, say, ready, o = {}) => {
    const c = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }); await c.addInitScript(FAKE_SR);
    const p = await c.newPage(), errs = []; p.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
    await p.goto(`${base}&at=${at}`, { waitUntil: "load" });
    const seen = new Set(); let tapped = false, spoke = false, card = null;
    for (let i = 0; i < 200 && !card; i += 1) {
      const s = await p.evaluate(() => ({ mic: (document.querySelector("#mic") || {}).className || "", caps: [...document.querySelectorAll("#capts .capt")].map((x) => x.innerText.replace(/\s+/g, " ")), go: (document.querySelector("#go") || {}).innerText || "", h1: (document.querySelector("h1") || {}).innerText || "", rows: [...document.querySelectorAll(".rows li")].map((x) => x.innerText.replace(/\s+/g, " ")) }));
      s.caps.forEach((x) => seen.add(x)); (await p.evaluate(() => window.__caps)).forEach((x) => seen.add(x));
      const sheet = await p.evaluate(() => !!document.querySelector("#gsheet #go"));
      if (sheet && ready && !tapped) { await p.evaluate(() => document.querySelector("#gsheet #go").click()); await p.waitForTimeout(60); continue; } /* the try's sheet (rule 49a): a first tap may only clear Part N of 4 */
      if (!s.mic && ready && s.go && !tapped) { await p.evaluate(() => document.querySelector("#go").click()); ready = false; await p.waitForTimeout(100); continue; }
      if (!s.mic && s.go && s.rows.length) { card = s; break; }
      if (/pulse/.test(s.mic) && !tapped) { tapped = true; await p.evaluate(() => document.querySelector("#mic").click()); }
      else if (/\bon\b/.test(s.mic) && say && !spoke && (!o.atX || (await p.evaluate(() => { const ph = document.querySelector(".ph.walking"), pt = ph && ph.querySelector(".pt"); return pt ? parseFloat((pt.style.transform.match(/translateX\(([-\d.]+)px/) || [])[1]) / ph.clientWidth : -9; })) >= o.atX)) { spoke = true; const ws = say.split(" "); for (let k = 1; k <= ws.length; k += 1) { await p.evaluate((x) => window.__speak(x), ws.slice(0, k).join(" ")); await p.waitForTimeout(o.gap || 40); } await p.waitForTimeout(60); await p.evaluate(() => document.querySelector("#mic").click()); }
      await p.waitForTimeout(o.atX && !spoke ? 20 : 100); /* at eight times the street's pace he moves a tenth of the picture in 100 ms, so the late-opener case looks often enough to start at its spot */
    }
    (await p.evaluate(() => window.__caps)).forEach((x) => seen.add(x));
    await c.close();
    return { card, said: [...seen].join(" | "), errs };
  };
  let r = await run("1.0", "", true); /* the 1st try starts from its sheet (rules 16 and 49a) */ if (process.env.V) console.log(r.said);
  ok(r.card && r.said.includes(BUSY.replace("’", "'")) || r.said.includes(BUSY), "1st try, said nothing: he says the brush-off");
  ok(r.card && r.card.h1 === "He kept walking. Start your opener as soon as he’s close.", "1st try, said nothing: the card says he kept walking (" + (r.card && r.card.h1) + ")"); /* version 10: the words match the talk button's ("Wait till he's close") */
  ok(r.card && r.card.rows.some((x) => /Took so long they walked on\./.test(x)), "1st try, said nothing: part 4 says they walked on");
  ok(r.card && r.card.go === "Next: hear it done", "1st try, said nothing: nothing is skipped (" + (r.card && r.card.go) + ")");
  ok(!r.errs.length, "no page errors " + r.errs.join(" "));
  r = await run("1.0", OPENER, true);
  ok(r.card && r.said.includes("Yeah, I’m registered.") && r.said.includes("Sure, I’ll sign."), "1st try, the opener at once: he stops");
  ok(r.card && !r.said.includes(BUSY), "1st try, the opener at once: no brush-off");
  ok(r.card && /all four/.test(r.card.h1), "1st try, the opener at once: all four (" + (r.card && r.card.h1) + ")");
  ok(!r.errs.length, "no page errors " + r.errs.join(" "));
  r = await run("6.0", "", true);
  ok(r.card && r.said.includes(BUSY), "2nd try, said nothing: she says the brush-off");
  ok(r.card && r.card.rows.some((x) => /Took so long they walked on\./.test(x)), "2nd try, said nothing: part 4 says they walked on");
  ok(!r.errs.length, "no page errors " + r.errs.join(" "));
  r = await run("1.0", OPENER, true, { atX: 0.12, gap: 250 });
  ok(r.card && r.said.includes("Yeah, I’m registered.") && r.said.includes("Sure, I’ll sign.") && !r.said.includes(BUSY), "1st try, the opener begun late and said slowly: still heard, he stops");
  ok(!r.errs.length, "no page errors " + r.errs.join(" "));
  r = await run("6.0", "Hi there! This petition is for school funding.", true);
  ok(r.card && r.said.includes("Oh, for the schools? What do you need?") && r.said.includes("Okay, bye now.") && !r.said.includes(BUSY), "2nd try, stopped and left waiting: \"Okay, bye now.\"");
  ok(r.card && !r.card.rows.some((x) => /walked on/.test(x)), "2nd try, stopped and left waiting: no walked-on line");
  ok(!r.errs.length, "no page errors " + r.errs.join(" "));
  await b.close(); srv.close();
  console.log(fails ? `sig-walkpast: ${fails} failed` : "sig-walkpast: all pass");
  process.exit(fails ? 1 : 0);
})();
