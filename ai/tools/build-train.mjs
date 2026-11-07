/* Builds the two rebuilt issue trainings into wdpfxqlsvp/train/index.html from ai/train/train.html (the page),
   ai/train/content.mjs (screens, pictures, checks, sources) and ai/scenarios-issues.js (the narration, the voter, the facts the
   coach checks). With --audio it also records the narration and each voter's opening line from the live AI server's voice
   into wdpfxqlsvp/train/audio/, refetching only lines whose words changed (audio/manifest.json keeps a hash of each).
   Usage: node ai/tools/build-train.mjs [--audio] [--force]   (from the repo root) */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { ISSUE_SCENARIOS } from "../scenarios-issues.js";
import { LESSONS, CSS } from "../train/content.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const OUT = path.join(ROOT, "wdpfxqlsvp/train");
const AI = process.env.WARMUP_AI_URL || "https://warmup-ai.robertrgambhir.workers.dev";
const lessons = {};
for (const [id, L] of Object.entries(LESSONS)) {
  const s = ISSUE_SCENARIOS[L.scen];
  if (!s) throw new Error("no scenario " + L.scen);
  const used = new Set(L.beats.flatMap((b) => b.lines));
  s.narration.forEach((_, k) => { if (!used.has(k)) throw new Error(`${id}: narration line ${k} is in no beat`); });
  const rubric = Object.fromEntries(s.rubric.map((r) => [r.id, { label: r.label, hit: r.hit, miss: r.miss }]));
  for (const c of L.cards) if (!rubric[c]) throw new Error(`${id}: card ${c} not in the rubric`);
  lessons[id] = { ...L, narration: s.narration, rubric, voter: { ...L.voter, opening: s.voter.opening.say } };
}
const DATA = { css: CSS.replace(/\s+/g, " "), lessons };
const page = fs.readFileSync(path.join(ROOT, "ai/train/train.html"), "utf8");
if (!page.includes("/*DATA*/null")) throw new Error("no DATA slot");
const html = page.replace("/*DATA*/null", JSON.stringify(DATA).replace(/<\/script/gi, "<\\/script"));
if (/—/.test(html)) throw new Error("an em dash in the page");
fs.mkdirSync(path.join(OUT, "audio"), { recursive: true });
fs.writeFileSync(path.join(OUT, "index.html"), html);
console.log("wrote", path.join(OUT, "index.html"), html.length, "bytes");

if (process.argv.includes("--audio")) {
  const force = process.argv.includes("--force");
  const mf = path.join(OUT, "audio/manifest.json");
  const man = fs.existsSync(mf) ? JSON.parse(fs.readFileSync(mf, "utf8")) : {};
  const hash = (t) => crypto.createHash("sha256").update(t).digest("hex").slice(0, 16);
  const jobs = [];
  for (const L of Object.values(LESSONS)) {
    const s = ISSUE_SCENARIOS[L.scen];
    s.narration.forEach((t, k) => jobs.push({ name: `${L.scen}-${k}`, text: t, get: () => fetch(`${AI}/narrate?s=${L.scen}&k=${k}`) }));
    const o = s.voter.opening.say;
    jobs.push({ name: `${L.scen}-open`, text: o + "|" + s.voter.voice, get: () => fetch(`${AI}/speak`, { method: "POST", headers: { "content-type": "application/json", origin: "https://yourwarmup.com" }, body: JSON.stringify({ scenario: L.scen, text: o, at: 0, sig: "" }) }) });
  }
  for (const j of jobs) {
    const file = path.join(OUT, "audio", j.name + ".mp3"), h = hash(j.text);
    if (!force && man[j.name] === h && fs.existsSync(file)) continue;
    const r = await j.get();
    if (!r.ok) throw new Error(j.name + " " + r.status + " " + (await r.text()).slice(0, 200));
    const b = Buffer.from(await r.arrayBuffer());
    fs.writeFileSync(file, b); man[j.name] = h;
    console.log("audio", j.name, b.length, "bytes");
  }
  fs.writeFileSync(mf, JSON.stringify(man, null, 1));
}
