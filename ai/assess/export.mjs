/* Phase 1 assessment harness, step 1: run every grader on every case and write one sheet for human trainers to label.
   Usage: node assess/export.mjs CASES.jsonl APP.html OUT.csv [--ai WORKER_URL --admin TOKEN]
   - scripted: the live app's keyword grader (assess/scripted.mjs), for the four card parts, on the learner's first line;
   - ai: the coach on the practice-AI server (POST /coach), every rubric item, only with --ai (each case costs about a cent).
   Two blank columns (human_a, human_b) are for two trainers who judge each item independently without seeing the graders'
   columns (hide them before sharing; scripts/hide is not provided, use a copy with those columns deleted).
   Nothing here measures accuracy; assess/agree.mjs does, once humans have labeled the sheet. */
import fs from "node:fs";
import { loadScripted } from "./scripted.mjs";
import { SCENARIOS } from "../scenarios.js";

const [,, CASES, APP, OUT, ...rest] = process.argv;
const opt = (k) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : ""; };
const AI = opt("--ai").replace(/\/+$/, ""), ADMIN = opt("--admin");
const grade = loadScripted(APP);
const CARD = ["name", "maya", "tuesday", "nominute"];
const cases = fs.readFileSync(CASES, "utf8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l));
const esc = (x) => '"' + String(x == null ? "" : x).replace(/"/g, '""') + '"';
const rows = [["case_id", "source", "rubric", "item", "item_label", "transcript", "scripted", "ai", "ai_evidence", "human_a", "human_b", "notes"]];
for (const c of cases) {
  const s = SCENARIOS[c.scenario];
  if (!s) throw new Error("unknown scenario " + c.scenario + " in " + c.id);
  if (c.source !== "fixture" && !c.consent) throw new Error(c.id + ": a real learner's answer needs consent: true before it goes in a sheet");
  const you = c.turns.filter((t) => t.who === "you").map((t) => t.text);
  const sc = c.scenario === "bri_health" ? null : grade(you[0] || "", c.name);
  let ai = null;
  if (AI) {
    const r = await fetch(AI + "/coach", { method: "POST", headers: { "content-type": "application/json", origin: "https://yourwarmup.com", ...(ADMIN ? { "x-admin-token": ADMIN } : {}) }, body: JSON.stringify({ scenario: c.scenario, turns: c.turns }) });
    ai = r.ok ? await r.json() : { error: r.status };
  }
  const transcript = c.turns.map((t) => (t.who === "you" ? "Learner: " : "Voter: ") + t.text).join(" / ");
  for (const item of s.rubric) {
    const k = CARD.indexOf(item.id), it = ai && ai.items ? ai.items.find((x) => x.id === item.id) : null;
    rows.push([c.id, c.source, c.rubric || c.scenario, item.id, item.label, transcript, sc && k >= 0 ? (sc[k] ? "met" : "missed") : "", it ? it.status : ai && ai.error ? "error_" + ai.error : "", it ? it.evidence : "", "", "", ""]);
  }
}
fs.writeFileSync(OUT, rows.map((r) => r.map(esc).join(",")).join("\n") + "\n");
console.log(`wrote ${rows.length - 1} rows for ${cases.length} cases to ${OUT}${AI ? "" : " (no --ai: the ai column is empty)"}`);
