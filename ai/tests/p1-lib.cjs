/* shared helpers for the phase 1 browser tests */
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const FONTS = process.env.FONTS_DIR || "/home/claude/fonts";
function fontCss() {
  const f = (n) => { const p = path.join(FONTS, n); return fs.existsSync(p) ? "url(data:font/ttf;base64," + fs.readFileSync(p).toString("base64") + ") format(\"truetype\")" : null; };
  const fig = f("Figtree.ttf"), nr = f("Newsreader.ttf"), nri = f("NewsreaderItalic.ttf");
  if (!fig || !nr) return null;
  return `@font-face{font-family:"Figtree";font-weight:300 900;src:${fig}}@font-face{font-family:"Newsreader";font-weight:200 800;src:${nr}}${nri ? `@font-face{font-family:"Newsreader";font-style:italic;font-weight:200 800;src:${nri}}` : ""}`;
}
const CSS = fontCss();
exports.SITE = "http://127.0.0.1:8765/wdpfxqlsvp/dev/";
exports.AI = "http://127.0.0.1:8799";
exports.launch = () => chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
exports.ctx = async (b, o = {}) => {
  const c = await b.newContext({ viewport: { width: o.w || 402, height: o.h || 874 }, hasTouch: !o.desk, isMobile: !o.desk, deviceScaleFactor: 1 });
  await c.route(/fonts\.googleapis\.com/, (r) => (CSS ? r.fulfill({ status: 200, contentType: "text/css", body: CSS }) : r.abort()));
  await c.route(/fonts\.gstatic\.com/, (r) => r.abort());
  await c.addInitScript(() => { window.SpeechRecognition = undefined; window.webkitSpeechRecognition = undefined; });
  return c;
};
exports.open = async (c, q, errs) => {
  const p = await c.newPage();
  p.on("pageerror", (e) => { const m = String(e); if (!/start is not defined|onHasParentDirectory|addRow is not defined/.test(m)) errs.push(m.slice(0, 200)); });
  await p.goto(exports.SITE + (q || ""), { waitUntil: "domcontentloaded", timeout: 180000 });
  await p.waitForFunction(() => window.__p1 && document.querySelector("#screen"), null, { timeout: 120000 });
  await p.waitForTimeout(1200);
  return p;
};
exports.act = async (p, a, arg) => p.evaluate(([a, arg]) => { const e = [...document.querySelectorAll(`[data-act="${a}"]`)].find((x) => (x.offsetParent || getComputedStyle(x).position === "fixed") && (arg == null || x.dataset.arg === String(arg))); if (!e) throw new Error("no act " + a + " " + arg); e.click(); }, [a, arg]);
exports.say = async (p, text) => {
  for (let i = 0; i < 16; i += 1) { /* Tap to talk stays locked while the voter speaks */
    await exports.act(p, "talk").catch(() => {});
    if (await p.isVisible("#say")) break;
    await p.waitForTimeout(1000);
  }
  await p.waitForSelector("#say", { state: "visible", timeout: 4000 });
  await p.fill("#say", text);
  const a = await p.evaluate(() => [...document.querySelectorAll("#talk-tray [data-act]")].map((e) => e.dataset.act).find((x) => /send|check/.test(x)));
  await p.click(`#talk-tray [data-act="${a}"]`);
};
exports.screen = (p) => p.evaluate(() => document.querySelector("#screen") ? (window.__p1 && true, document.querySelector("#screen").innerText.replace(/\s+/g, " ")) : "");
exports.state = (p) => p.evaluate(() => { try { return JSON.parse(localStorage.getItem("recognize-demo:p1")); } catch (e) { return null; } });
exports.events = (p) => p.evaluate(() => { try { return JSON.parse(localStorage.getItem("recognize-demo:events")) || []; } catch (e) { return []; } });
/* lesson 1, all four parts on the first try (the shortcut path), then the 2nd intro, the end cards and Today */
exports.lesson1 = async (p, fromVideo = true) => {
  if (fromVideo) { await exports.act(p, "video-skip"); await p.waitForTimeout(4300); }
  await p.waitForSelector('[data-act="try-knock"]', { state: "visible", timeout: 15000 });
  await exports.act(p, "try-knock"); await p.waitForTimeout(3200);
  await exports.say(p, "Hi, I'm Robert. I'm volunteering with Maya Kaur's campaign. Election Day is Tuesday.");
  await p.waitForSelector('[data-act="try-next"]', { state: "visible", timeout: 20000 }); await p.waitForTimeout(1500);
  await exports.act(p, "try-next"); await p.waitForTimeout(4500);
  await p.waitForSelector('[data-act="knock"]', { state: "visible", timeout: 15000 });
  await exports.act(p, "knock"); await p.waitForTimeout(3300);
  await exports.say(p, "Hi, I'm Robert. I'm volunteering with Maya Kaur's campaign. Election Day is Tuesday.");
  await p.waitForSelector('[data-act="go"][data-arg="close"]', { state: "visible", timeout: 30000 }); await p.waitForTimeout(800);
  await exports.act(p, "go", "close"); await p.waitForTimeout(5500);
  await exports.act(p, "done-card"); await p.waitForTimeout(3000);
  await exports.act(p, "done-card"); await p.waitForTimeout(2000);
};
