/* Walks one signature lesson screen by screen in a real browser, with a stand-in speech recognizer, and checks every screen:
   nothing scrolls, nothing is clipped or overlaps, buttons are one line and name what comes next, the face sits in the top
   third of a conversation with the captions below it, every screen has its tag, and no raw or missing text shows.
   Usage (from the repo root, with Playwright installed): node ai/tests/sig-walk.cjs <lesson 1-5> <width> <height> [script] [slow]
   Sizes Robert reviews at: 375 667, 390 844, 430 932 and the laptop frame 1280 792. Scripts are in sig-scripts.cjs ("show" visits
   every screen). FONTS=<dir with Figtree.ttf, Newsreader.ttf, NewsreaderItalic.ttf> loads the real fonts without the network;
   OUT=<dir> keeps the screenshots; V=1 prints each screen's words. Exits 1 if any screen has a problem. */
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
    start() { window.__sr = this; this.on = true; }
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
const [,, lesson = "2", W = "375", H = "667", scriptName = "show", mode = "fast"] = process.argv;
(async () => {
  const b = await L.launch(); const c = await L.ctx(b, { w: +W, h: +H, dpr: 2 });
  const p = await c.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(String(e).slice(0, 300))); p.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|ERR_FAILED/.test(m.text())) errs.push("console: " + m.text().slice(0, 200)); });
  const out = path.join(process.env.OUT || path.join(os.tmpdir(), "sig-walk"), `L${lesson}-${W}${scriptName === "show" ? "" : "-" + scriptName}`); fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  const srv = process.env.BASE ? null : await serve(), base = process.env.BASE || `http://127.0.0.1:${srv.address().port}/wdpfxqlsvp/sig/`;
  await p.goto(`${base}index.html?l=${lesson}${mode === "fast" ? "&fast" : mode === "caps" ? "&fast=320" : ""}`, { waitUntil: "load" });
  await p.waitForSelector("#start", { timeout: 8000 });
  await p.evaluate(() => document.fonts.ready);
  const say = SCRIPTS[lesson][scriptName].slice(); const problems = []; let n = 0, lastSig = "", idle = 0;
  const check = async (label) => {
    const r = await p.evaluate(() => {
      const out = [], app = document.querySelector("#app").getBoundingClientRect(), vis = (e) => { const s = getComputedStyle(e); return s.display !== "none" && s.visibility !== "hidden" && e.getClientRects().length; };
      const scr = document.querySelector("#scr"), sb = scr.getBoundingClientRect();
      if (document.documentElement.scrollHeight > innerHeight + 1) out.push("page scrolls: " + document.documentElement.scrollHeight + " > " + innerHeight);
      [...scr.children].filter(vis).forEach((e) => { const r = e.getBoundingClientRect(), ft = e.classList.contains("ft"); if (r.bottom > (ft ? innerHeight : sb.bottom) + 1.5 || r.top < sb.top - 1.5) out.push("outside the screen: ." + e.className + " bottom " + Math.round(r.bottom) + " > " + Math.round(sb.bottom)); if (!ft && (r.right > app.right + 1 || r.left < app.left - 1)) out.push("too wide: ." + e.className); });
      /* inside a filled area nothing may spill past its edges or over its neighbor */
      document.querySelectorAll(".fill").forEach((f) => { const fr = f.getBoundingClientRect(), ks = [...f.children].filter(vis); ks.forEach((e, i) => { const r = e.getBoundingClientRect(); if (r.bottom > fr.bottom + 1.5 || r.top < fr.top - 1.5) out.push("spills out of the filled area: ." + e.className); if (i && r.top < ks[i - 1].getBoundingClientRect().bottom - 1.5) out.push("overlap in the filled area: ." + e.className); }); });
      document.querySelectorAll(".dock").forEach((d) => { const dr = d.getBoundingClientRect(), pr = d.parentElement.getBoundingClientRect(); if (dr.top < pr.top + pr.height * 0.36) out.push("the captions and mic climb to " + Math.round((dr.top - pr.top) / pr.height * 100) + "% of the picture"); });
      /* children can also overlap when a flex column runs out of room */
      const kids = [...scr.children].filter(vis).filter((e) => getComputedStyle(e).position !== "absolute"); for (let i = 1; i < kids.length; i++) { const a = kids[i - 1].getBoundingClientRect(), b2 = kids[i].getBoundingClientRect(); if (b2.top < a.bottom - 1.5) out.push("overlap: ." + kids[i - 1].className + " over ." + kids[i].className); }
      document.querySelectorAll(".btn, .opt, .hw, .capt, .who, h1, .tip, .said, .coach, .labels span, .nx li span, .rows li, .box i, .callout, .pic .lt, .link, .mict, .sub, .shift").forEach((e) => { if (!vis(e)) return; if (e.scrollWidth > e.clientWidth + 1.5 && getComputedStyle(e).display !== "inline") out.push("clipped across: ." + e.className + " “" + e.textContent.slice(0, 40) + "”"); if (e.scrollHeight > e.clientHeight + 2 && getComputedStyle(e).overflow !== "visible") out.push("clipped down: ." + e.className + " “" + e.textContent.slice(0, 40) + "”"); });
      document.querySelectorAll(".btn").forEach((e) => { if (vis(e) && e.getBoundingClientRect().height > 64) out.push("button wraps: “" + e.textContent + "”"); if (vis(e) && e.textContent.length > 36) out.push("button over 36 characters: “" + e.textContent + "”"); if (vis(e) && /^(Next|Continue|Start)$/i.test(e.textContent.trim())) out.push("button says only: " + e.textContent); });
      const pan = document.querySelector("#panel, .panel, .ft"); if (pan && vis(pan)) { const pr = pan.getBoundingClientRect(); if (pr.height < (pan.classList.contains("short") ? 82 : 118)) out.push("picture squeezed to " + Math.round(pr.height) + " px");
        const eyes = [...pan.querySelectorAll(".p:not(.off-l):not(.off-r) .eyes")], caps = pan.querySelector(".capts"); eyes.forEach((e) => { const er = e.getBoundingClientRect(); if (pan.classList.contains("ft") && er.top > pr.top + pr.height * 0.36) out.push("face below the top third: eyes at " + Math.round((er.top - pr.top) / pr.height * 100) + "%"); if (caps && caps.children.length) { const cr = caps.getBoundingClientRect(); if (cr.top < er.bottom + 14) out.push("captions over the face: caption top " + Math.round(cr.top) + ", eyes " + Math.round(er.bottom)); } }); }
      const tag = document.querySelector("#tag").textContent; if (!/^Sig \d\.\d+[a-z]?\d?s?$/.test(tag)) out.push("screen tag: " + tag);
      { const tq = document.querySelector("#tag").getBoundingClientRect(), R = parseFloat(getComputedStyle(document.querySelector("#app")).borderTopLeftRadius) || 0; if (R) { const dx = tq.right - (app.right - R), dy = tq.bottom - (app.bottom - R); if (dx > 0 && dy > 0 && dx * dx + dy * dy > (R - 1) * (R - 1)) out.push("the screen tag is cut by the frame's round corner"); } if (tq.right > app.right + 0.5 || tq.bottom > app.bottom + 0.5 || tq.width < 8) out.push("the screen tag is off the screen"); }
      if (/—/.test(document.body.innerText)) out.push("an em dash");
      if (/\b(undefined|NaN|null)\b|\{[a-zA-Z]+\}/.test(document.querySelector("#scr").innerText)) out.push("raw text: " + document.querySelector("#scr").innerText.match(/.{0,20}(undefined|NaN|null|\{[a-zA-Z]+\}).{0,20}/)[0]);
      return { out, tag, text: document.querySelector("#scr").innerText.replace(/\s+/g, " ").slice(0, 160) };
    });
    n += 1; const file = String(n).padStart(2, "0") + "-" + r.tag.replace(/[^a-z0-9.]/gi, "") + ".png";
    await p.screenshot({ path: path.join(out, file) });
    r.out.forEach((x) => problems.push(`${r.tag} [${file}] ${x}`));
    if (process.env.V) console.log(file, "|", label, "|", r.text);
    return r;
  };
  const sig = () => p.evaluate(() => document.querySelector("#tag").textContent + "|" + document.querySelector("#scr").innerText.length + "|" + document.querySelectorAll(".done, .right, .on, .tick, .glow, .capt").length + "|" + (document.querySelector("#mic") ? document.querySelector("#mic").className : "") + "|" + (document.querySelector(".capts") ? document.querySelector(".capts").innerText : ""));
  const settle = async (ms) => { await p.waitForTimeout(ms || 220); };
  const tap = (sel) => p.evaluate((s) => { const e = document.querySelector(s); if (!e) throw new Error("nothing to tap: " + s); e.click(); }, sel);
  await check("cover");
  await tap("#start"); await settle(400);
  for (let step = 0; step < 400; step++) {
    const s = await sig(); if (s !== lastSig) { lastSig = s; idle = 0; await check("state"); } else idle += 1;
    const st = await p.evaluate(() => ({ cover: !!document.querySelector("#start"), mic: document.querySelector("#mic") ? document.querySelector("#mic").className : "", go: !!document.querySelector("#go") && !document.querySelector("#go").classList.contains("ghost"), ghost: !!document.querySelector("#go.ghost"), opts: [...document.querySelectorAll("#opts:not(.done) button, #opts:not(.done) .pic")].length, decl: document.querySelectorAll(".decl:not([disabled])").length, boxes: document.querySelectorAll("button.box").length, okb: !!document.querySelector("#okb:not([disabled])"), tag: document.querySelector("#tag").textContent, kind: window.__sg.L.steps[window.__sg.S.step] ? window.__sg.L.steps[window.__sg.S.step].kind : "cover", sub: window.__sg.S.sub, typed: !!document.querySelector("#typed") }));
    if (st.cover && step > 2) break;
    if (/pulse/.test(st.mic)) {
      const t = say.shift(); if (t == null) { problems.push(st.tag + " the script ran out of things to say"); break; }
      await tap("#mic"); await settle(120); await p.evaluate((x) => window.__speak(x), t); await settle(180); await check("speaking"); await tap("#mic"); await settle(mode === "fast" ? 600 : mode === "caps" ? 500 : 900); continue;
    }
    if (st.decl) { const want = SCRIPTS[lesson].decl || [1, 2]; for (const i of want) { await tap(`.decl[data-i="${i}"]`); await settle(150); } continue; }
    if (st.boxes || st.okb) { const pick = (SCRIPTS[lesson].boxes || []).shift() || "ok"; if (pick === "ok") await tap("#okb"); else await tap(`button.box[data-box="${pick}"]`); await settle(); continue; }
    if (st.opts) { const pick = (SCRIPTS[lesson].taps || []).shift(); await p.evaluate((i) => { const bs = [...document.querySelectorAll("#opts button")]; (bs[i == null ? 0 : i] || bs[0]).click(); }, pick); await settle(); continue; }
    if (st.go) { await tap("#go"); await settle(350); continue; }
    if (idle > (mode === "fast" ? 40 : mode === "caps" ? 120 : 400)) { problems.push(st.tag + " stuck: " + JSON.stringify(st)); break; }
    await settle(mode === "fast" ? 120 : mode === "caps" ? 90 : 250);
  }
  const timing = await p.evaluate(() => window.__sg.time());
  console.log(JSON.stringify({ lesson, size: W + "x" + H, script: scriptName, screens: n, left: say.length, errs, problems, timing: Object.fromEntries(Object.entries(timing).map(([k, v]) => [k, Math.round(v / 100) / 10])) }, null, 1));
  await b.close(); if (srv) srv.close();
  process.exit(errs.length || problems.length || say.length ? 1 : 0);
})().catch((e) => { console.error("ERR", e); process.exit(1); });
