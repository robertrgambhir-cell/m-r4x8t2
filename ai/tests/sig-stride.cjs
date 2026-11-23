/* A walker walks like a person (Robert, Nov 22, 2026, 4:10 PM, on lesson 2: "the walking is very phony ... Their feet are mostly just
   kind of sliding, and then their feet are moving. It doesn't look natural at all for a person walking down a sidewalk."; playbook rule
   69b). Checks every walker the lessons draw walking (img/manifest.json's "stride"), in a real browser with the page's own STRIDE:
   1. a foot on the ground never moves until it lifts (nothing slides), checked every 1/2000 of the walk;
   2. the ground covered is a walk, about a meter a second, not the old 3.3: at most 1.7 meters a second at the walk's steadiest;
   3. the steps keep a walking rhythm while they walk: 1.5 to 2.6 a second;
   4. one foot is always on the ground, a planted foot's sole stays on it (a raised heel pivots on the toe), and the walk ends with
      both feet down, side by side and apart, never one slab; someone pushing a cart keeps their feet behind its wheels;
   5. the walker is drawn (the canvas isn't empty) at the start, the middle and the end, with no page errors.
   Usage (from the repo root, with Playwright installed): node ai/tests/sig-stride.cjs. Exits 1 on any failure. */
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path"), http = require("http");
const ROOT = path.resolve(__dirname, "../..");
const TYPES = { ".html": "text/html; charset=utf-8", ".mp3": "audio/mpeg", ".json": "application/json", ".png": "image/png", ".webp": "image/webp", ".js": "text/javascript" };
const serve = () => new Promise((res) => { const s = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split("?")[0])); fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream" }); r.end(b); }); }); s.listen(0, "127.0.0.1", () => res(s)); });
let fails = 0;
const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails += 1; };
const BODY_M = 1.7, POV_S = 3.6; /* a body height in meters; the walk down the sidewalk, in seconds (engine2) */
(async () => {
  const srv = await serve(), base = `http://127.0.0.1:${srv.address().port}/wdpfxqlsvp/sig/index.html?preview&l=2&fast&at=2.0`;
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage(), errs = []; p.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
  await p.goto(base, { waitUntil: "load" }); await p.waitForTimeout(1200);
  const res = await p.evaluate(async () => {
    const G = window.__sg.walk, IMG = G.IMG, S = G.STRIDE, out = [];
    const paceU = (t) => { t = Math.max(0, Math.min(1, t)); const V = 1 / 0.895, d = t - 0.7; return Math.min(1, t <= 0.7 ? V * t : V * (0.7 + d - 7 / 6 * d * d)); }; /* engine2's pace */
    for (const key of Object.keys(IMG).filter((k) => /^w-/.test(k) && IMG[k].stride)) {
      const o = IMG[key].stride, De = S.Dend(o), N = 2000; let slide = 0, air = 0, prev = null, strikes = 0, last = null;
      for (let i = 0; i <= N; i += 1) {
        const g = S.gait(o, De * i / N);
        if (!g.a.swing === false && !g.b.swing === false) air += 1; /* both feet off the ground */
        if (prev) for (const f of ["a", "b"]) if (!g[f].swing && !prev[f].swing && Math.abs(g[f].d - prev[f].d) > 1e-9) slide = Math.max(slide, Math.abs(g[f].d - prev[f].d));
        if (prev) for (const f of ["a", "b"]) if (prev[f].swing && !g[f].swing) strikes += 1;
        prev = g; last = g;
      }
      /* the steadiest speed: paceU's slope at the start, in body heights a second */
      const vMax = De * (paceU(0.01) - paceU(0)) / (0.01 * 3.6);
      /* steps a second during the steady part (the first 70% of the time) */
      const tS = 0.7 * 3.6, dS = De * paceU(0.7), stepsS = dS / o.step;
      /* drawn: a panel with the walk-up views, drawn at three points */
      const who = key.slice(2).split("-")[0], box = document.createElement("div");
      box.className = "ft"; box.setAttribute("data-stage", "pov"); box.style.cssText = "position:fixed;left:0;top:0;width:350px;height:620px;z-index:9999";
      box.innerHTML = G.sceneWalk(who, key.slice(2)).replace(/id="(air|pov)-/g, 'id="$1-zz'); document.body.appendChild(box); /* its own ids, apart from the page's */
      await new Promise((r) => { const im = box.querySelector("img.wsrc"); if (im.complete) r(); else { im.onload = r; im.onerror = r; } });
      const drawn = [0, 0.5, 1].map((u) => { G.walkAt("zz" + who, u); const cv = box.querySelector("canvas.stride"), d = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let j = 3; j < d.length; j += 4) if (d[j] > 200) n += 1; return n; });
      /* the pose at 400 points: a planted foot's sole is on the ground (a raised heel pivots on the toe), feet end apart, and someone
         pushing a cart keeps their feet behind its wheels (the picture's plane) */
      let soleOff = 0, ahead = 0, side = 0; const M = IMG.walkway, F = IMG[key], was = {};
      for (let i = 0; i <= 400; i += 1) { const P = S.pose(M, F, o, i / 400); for (const lg of P.legs) { if (lg.planted) soleOff = Math.max(soleOff, Math.abs(lg.sole[1] - P.ground(0, lg.fz)[1])); if (o.back) ahead = Math.max(ahead, P.zp - lg.fz);
        const w = was[lg.side]; if (lg.planted && w && w.planted && Math.abs(w.fz - lg.fz) < 1e-9) side = Math.max(side, Math.abs(w.x - lg.sole[0])); was[lg.side] = { planted: lg.planted, fz: lg.fz, x: lg.sole[0] }; } } /* a planted foot never moves sideways either */
      const E = S.pose(M, F, o, 1), gap = Math.abs(E.legs[0].ankle[0] - E.legs[1].ankle[0]) - o.shoeW * E.legs[0].sole[2];
      box.remove();
      out.push({ key, slide, air, strikes, end: last.a.d === last.b.d && !last.a.swing && !last.b.swing, vMax, cadence: stepsS / tS, drawn, steps: o.steps, soleOff, gap, ahead, side, cart: !!o.back });
    }
    return out;
  });
  ok(res.length >= 8, `every walker has a stride (${res.map((r) => r.key).join(", ")})`);
  for (const r of res) {
    ok(r.slide === 0, `${r.key}: a foot on the ground never slides`);
    ok(r.air === 0, `${r.key}: one foot is always on the ground`);
    ok(r.end, `${r.key}: the walk ends with both feet on the ground, side by side`);
    ok(r.vMax * BODY_M <= 1.7 && r.vMax * BODY_M >= 0.6, `${r.key}: a walking pace, ${(r.vMax * BODY_M).toFixed(2)} m/s at its steadiest (the old walk-up: about 3.3)`);
    ok(r.cadence >= 1.5 && r.cadence <= 2.6, `${r.key}: ${r.cadence.toFixed(2)} steps a second while walking`);
    ok(r.drawn.every((n) => n > 500), `${r.key}: drawn at the start, middle and end (${r.drawn.join(", ")} pixels)`);
    ok(r.soleOff < 0.5, `${r.key}: a planted foot's sole stays on the ground, heel raised or not (off by ${r.soleOff.toFixed(2)} px at most)`);
    ok(r.gap > 0, `${r.key}: the feet end side by side, not one shoe-wide slab (gap ${r.gap.toFixed(1)} px)`);
    ok(r.side < 0.01, `${r.key}: a planted foot never moves sideways (${r.side.toFixed(3)} px at most)`);
    if (r.cart) ok(r.ahead <= 0.001, `${r.key}: her feet stay behind the cart's wheels`);
  }
  ok(!errs.length, "no page errors " + errs.join(" "));
  await b.close(); srv.close();
  console.log(fails ? `sig-stride: ${fails} failed` : "sig-stride: all pass");
  process.exit(fails ? 1 : 0);
})();
