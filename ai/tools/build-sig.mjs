/* Builds the signature course's hidden page, wdpfxqlsvp/sig/, from ai/sig/sig.html (the page and its look), ai/sig/engine1.js
   to engine3.js (sound, listening, pictures, the flow), ai/sig/grade.js (the graders and the passersby) and ai/sig/content.js
   (every word, and the firm settings). Each lesson has its own link: wdpfxqlsvp/sig/?l=1 to ?l=5, and ?l=card for the
   first-shift card. The recorded voices are made by ai/tools/sig-audio.mjs; this build stops if a line has no clip.
   Nothing in the Maya demo is read or changed.
   Usage: node ai/tools/build-sig.mjs   (from the repo root) */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { SIG_SETTINGS, SIG_SHARED, SIG_MEASURE, SIG_CAST, SIG_LESSONS, SIG_CARD, SIG_VOICES, SIG_OPEN, SIG_SAY, sigFill, sigText, sigSay } from "../sig/content.js";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const OUT = path.join(ROOT, "wdpfxqlsvp/sig");
const st = SIG_SETTINGS;
const clipKey = (voice, say) => crypto.createHash("sha256").update(voice + "|" + say).digest("hex").slice(0, 12);
const man = JSON.parse(fs.readFileSync(path.join(OUT, "audio/manifest.json"), "utf8"));
let clips = 0;
/* every string gets the firm's settings; every spoken line gets its clip */
function fill(x) {
  if (typeof x === "string") return sigFill(x, st);
  if (Array.isArray(x)) return x.map(fill);
  if (!x || typeof x !== "object") return x;
  if (x.printed && typeof x.printed === "object" && st.funders === "printed") return fill(Object.assign({}, x, x.printed, { printed: undefined })); /* a whole question that changes */
  const o = {};
  for (const k of Object.keys(x)) { if (k === "printed" || (k === "say" && typeof x[k] === "string")) continue; o[k] = k === "who" || k === "kind" || k === "act" || k === "face" ? x[k] : fill(x[k]); }
  if (typeof x.who === "string" && typeof x.text === "string" && SIG_VOICES[x.who]) {
    o.text = sigFill(sigText(x, st), st);
    const h = clipKey(SIG_VOICES[x.who], sigSay(x, st));
    if (!man[h] || !fs.existsSync(path.join(OUT, "audio", h + ".mp3"))) throw new Error("no recorded clip for: " + o.text + " (run node ai/tools/sig-audio.mjs)");
    o.clip = h; o.dur = man[h].dur; clips += 1;
  }
  return o;
}
const card = { title: SIG_CARD.title, rules: SIG_CARD.rules.map((r) => (st.funders === "printed" && r[2] && r[2].printed ? r[2].printed : [r[0], r[1]]).map((t) => sigFill(t, st))) };
/* the painted pictures (Nov 19): the manifest from ai/tools/sig-pictures.md's steps; every file it names must be there */
const IMG = JSON.parse(fs.readFileSync(path.join(OUT, "img/manifest.json"), "utf8"));
/* every file a picture names must be there: its storefront, each person's cutout and versions, each face's talking mouth and
   closed eyes, and the close and round faces for cards (look Q, Nov 19: ai/tools/sig-pictures/q_build.py) */
for (const [n, m] of Object.entries(IMG)) {
  const files = [].concat(m.bg ? [m.bg] : [], ...(m.parts || []).map((p) => [p.src].concat(Object.values(p.alt || {}), p.head ? ["mo-" + p.head, "bl-" + p.head] : [])), m.close ? [n + "-close", n + "-av"] : [], !m.parts && !m.close && !m.bg ? [n] : []);
  for (const f of files) if (!fs.existsSync(path.join(OUT, "img", f + ".webp"))) throw new Error("no picture file: img/" + f + ".webp");
}
/* everyone the lessons show has a picture: each passerby alone, each version a step names (pic) and each scene with a canvasser */
{ const need = new Set(); const by = (st) => st.by || "lena";
  for (const L of Object.values(SIG_LESSONS)) for (const st of L.steps) {
    JSON.stringify(st, (k, v) => { if ((k === "who" || k === "face") && typeof v === "string" && SIG_CAST[v] && SIG_CAST[v].full) need.add(v); if (k === "pic" && v && v.who) need.add(v.who); return v; });
    if (typeof st.pic === "string") need.add(st.pic);
    for (const P of st.people || []) if (P.pic) need.add(P.pic);
    for (const sc of st.scenes || []) need.add("two-" + by(st) + "-" + (sc.pic || sc.who));
    if (st.kind === "spot") need.add("two-" + by(st) + "-" + st.who);
    if (st.kind === "stop") need.add("two-lena-" + st.who);
  }
  for (const n of need) if (!IMG[n]) throw new Error("no picture for " + n); }
const DATA = { st: Object.assign({}, st, { label: SIG_MEASURE.label }), shared: fill(SIG_SHARED), measure: fill(SIG_MEASURE), cast: SIG_CAST, lessons: fill(SIG_LESSONS), card, img: IMG, open: SIG_OPEN, say: fill(SIG_SAY) };
const read = (f) => fs.readFileSync(path.join(ROOT, "ai/sig", f), "utf8");
let html = read("sig.html");
const slot = (name, body) => { if (!html.includes(name)) throw new Error("no slot " + name); html = html.split(name).join(body); };
slot("/*GRADE*/", read("grade.js"));
slot("/*DATA*/null", JSON.stringify(DATA).replace(/<\/script/gi, "<\\/script"));
slot("/*ENGINE1*/", read("engine1.js")); slot("/*ENGINE2*/", read("engine2.js")); slot("/*ENGINE3*/", read("engine3.js"));
if (/—/.test(html)) throw new Error("an em dash in the page");
if (/\(\?<[=!]/.test(html)) throw new Error("a regex lookbehind in the page: older iPhones can't parse it");
if (st.county !== "LA County" && JSON.stringify(DATA.lessons).includes("LA County")) throw new Error("a county the settings didn't fill");
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "lesson.html"), html);
/* a small front page that loads the lesson in place, so a new build shows at once */
fs.writeFileSync(path.join(OUT, "index.html"), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>Warmup</title>
<style>
  html, body { margin: 0; height: 100%; background: #FFFFFF; }
  .load { height: 100%; display: grid; place-items: center; }
  .load svg { animation: spin 1.1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { .load svg { animation: none; } }
  .err { font: 16px/1.5 -apple-system, system-ui, sans-serif; color: #262320; text-align: center; padding: 24px; }
</style>
</head>
<body>
<!-- The signature course's front page: it loads the lesson (lesson.html) in place, keeping this address and its ?l= lesson number. -->
<div class="load" id="load"><svg width="56" height="56" viewBox="0 0 84 84" aria-label="Loading"><circle cx="42" cy="42" r="32" fill="none" stroke="#E6E0D6" stroke-width="12"/><circle cx="42" cy="42" r="32" fill="none" stroke="#35B57C" stroke-width="12" stroke-linecap="round" stroke-dasharray="151 202" transform="rotate(-90 42 42)"/></svg></div>
<script>
fetch("lesson.html", { cache: "no-cache" })
  .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
  .then(function (html) { document.open(); document.write(html); document.close(); })
  .catch(function () { document.getElementById("load").innerHTML = '<p class="err">Warmup didn&#39;t load. Check your connection and reload the page.</p>'; });
</script>
</body>
</html>
`);
console.log("wrote wdpfxqlsvp/sig/lesson.html", html.length, "bytes,", clips, "spoken lines,", Object.keys(man).length, "clips");
