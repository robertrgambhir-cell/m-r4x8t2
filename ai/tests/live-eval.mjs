/* Live behavior tests for the deployed practice AI: the real model, the real prompts, the real checks.
   Each voter case runs RUNS times (default 3), because a model's answer varies; the report gives a pass rate per case.
   Usage: WARMUP_AI_URL=https://warmup-ai.<you>.workers.dev WARMUP_ADMIN_TOKEN=<the worker's ADMIN_TOKEN> node tests/live-eval.mjs [runs] > report.md
   (the voter cases are made-up conversations, so they need the admin token to skip the signature check)
   Cost: about 30 voter calls and 9 coach calls per run of the suite, roughly $0.11 at the models' list prices. */

const URL0 = (process.env.WARMUP_AI_URL || "").replace(/\/+$/, "");
const RUNS = Number(process.argv[2] || 3);
const ORIGIN = process.env.WARMUP_ORIGIN || "https://yourwarmup.com";
if (!URL0) { console.error("Set WARMUP_AI_URL to the worker's address."); process.exit(2); }

const call = async (path, body) => {
  const t0 = Date.now();
  const r = await fetch(URL0 + path, { method: "POST", headers: { "content-type": "application/json", origin: ORIGIN, "x-admin-token": process.env.WARMUP_ADMIN_TOKEN || "" }, body: JSON.stringify(body) });
  const j = await r.json();
  if (!r.ok) throw new Error(path + " " + r.status + " " + JSON.stringify(j));
  return { ...j, ms: Date.now() - t0 };
};
import { KEV, VOTER, PAIR, COACH, overlap } from "./cases.mjs";

const out = [];
const log = (x = "") => out.push(x);
(async () => {
  const spend = async () => (await (await fetch(URL0 + "/health?spend=1", { headers: { "x-admin-token": process.env.WARMUP_ADMIN_TOKEN || "" } })).json());
  const h0 = { ...(await (await fetch(URL0 + "/health")).json()), ...(await spend()) };
  log(`# Warmup practice AI: live test run`);
  log(`${new Date().toISOString()} · voter ${h0.voterModel} · coach ${h0.coachModel} · ${RUNS} runs per voter case\n`);
  log(`## The voter (Kevin, lesson 1)\n`);
  let vp = 0, vt = 0;
  const lat = [];
  for (const c of VOTER) {
    const res = [];
    for (let i = 0; i < RUNS; i += 1) { try { const r = await call("/voter", { scenario: "kevin_intro", turns: c.turns }); lat.push(r.ms); res.push({ ...r, ok: c.check(r) }); } catch (e) { res.push({ say: "ERROR " + e.message, ok: false }); } }
    const n = res.filter((r) => r.ok).length; vp += n; vt += res.length;
    log(`**${c.name}** (${n}/${res.length}). Wanted: ${c.want}. Last learner line: "${c.turns[c.turns.length - 1].text}"`);
    res.forEach((r) => log(`- ${r.ok ? "pass" : "FAIL"} [${r.mood || ""}${r.end ? ", end" : ""}] ${r.say}`));
    log("");
  }
  log(`## Two different openers to the same "${KEV}"\n`);
  const a = await call("/voter", { scenario: "kevin_intro", turns: PAIR[0] }), b = await call("/voter", { scenario: "kevin_intro", turns: PAIR[1] });
  const sim = overlap(a.say, b.say), diff = a.mood !== b.mood || sim < 0.5;
  log(`- A: "${PAIR[0][1].text}" -> [${a.mood}] ${a.say}`);
  log(`- B: "${PAIR[1][1].text}" -> [${b.mood}] ${b.say}`);
  log(`- ${diff ? "pass" : "FAIL"}: word overlap ${sim.toFixed(2)}, moods ${a.mood} vs ${b.mood}\n`);
  log(`## The coach\n`);
  let cp = 0;
  for (const c of COACH) {
    try {
      const r = await call("/coach", { scenario: c.scen, turns: c.turns });
      const okc = c.check(r); if (okc) cp += 1;
      log(`**${c.name}**: ${okc ? "pass" : "FAIL"} (${(r.ms / 1000).toFixed(1)} s). Wanted: ${c.want}.`);
      log(`- ${r.items.map((x) => `${x.id} ${x.status}${x.downgraded ? " (downgraded: quote not in transcript)" : ""}`).join(", ")}`);
      if (r.invented.length) log(`- invented: ${r.invented.map((x) => `"${x.quote}" (${x.issue})`).join("; ")}`);
      if (r.transcription.length) log(`- transcription: ${r.transcription.map((x) => `"${x.heard}" -> ${x.likely}`).join("; ")}`);
      log(`- strength: ${r.strength ? r.strength.text : "(none)"} · improvement: ${r.improvement ? r.improvement.text + " Try: " + r.improvement.try_saying : "(none)"}`);
    } catch (e) { log(`**${c.name}**: FAIL ${e.message}`); }
    log("");
  }
  const h1 = await spend();
  lat.sort((x, y) => x - y);
  log(`## Summary\n`);
  log(`- Voter checks: ${vp}/${vt}. Pair: ${diff ? "different" : "too similar"}. Coach checks: ${cp}/${COACH.length}.`);
  log(`- Voter latency: median ${(lat[Math.floor(lat.length / 2)] / 1000).toFixed(2)} s, slowest ${(lat[lat.length - 1] / 1000).toFixed(2)} s (network included).`);
  log(`- Spent this run: about $${((h1.dayUsd || 0) - (h0.dayUsd || 0)).toFixed(3)} (from the worker's own counter).`);
  console.log(out.join("\n"));
})();
