/* Phase 1: the assessment harness on fixtures and synthetic labels. Nothing here is evidence about grading accuracy.
   Run: node tests/assess.test.mjs /abs/app.html */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { loadScripted } from "../assess/scripted.mjs";
import { kappa, agreement, parseCsv } from "../assess/agree.mjs";
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass += 1; else { fail += 1; console.log("FAIL", m); } };
const APP = process.argv[2];
const g = loadScripted(APP);
ok(JSON.stringify(g("Hi, I'm Robert, I'm with the Maya Kaur campaign. Are you planning to vote on Tuesday?", "Robert")) === "[true,true,true,true]", "the grader read from app.html matches the live app on example 1 of the Today audit");
ok(JSON.stringify(g("Hi there, do you have a minute? I'm out talking to neighbors today.")) === "[false,false,false,false]", "and on example 2 (0 of 4)");
ok(JSON.stringify(g("Hi, I'm voting against Maya Kaur and the election is Tuesday.", "Robert")) === "[false,true,true,true]", "and on example 4 (credits the campaign for 'voting against')");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "assess-"));
const out = execFileSync("node", ["assess/export.mjs", "assess/cases.example.jsonl", APP, path.join(tmp, "sheet.csv")], { encoding: "utf8" });
const rows = parseCsv(fs.readFileSync(path.join(tmp, "sheet.csv"), "utf8"));
ok(rows.length === 35 && rows.every((r) => r.human_a === "" && r.human_b === ""), "export writes 7 rubric rows per case with blank human columns: " + out.trim());
ok(rows.filter((r) => r.item === "maya" && r.case_id === "fx-03")[0].scripted === "met", "the sheet records the scripted grader's call");
ok(kappa([[1, 1], [0, 0], [1, 1], [0, 0]]) === 1 && Math.abs(kappa([[1, 0], [0, 1], [1, 0], [0, 1]]) + 1) < 1e-9, "kappa is 1 for perfect agreement and -1 for perfect disagreement");
/* synthetic labels: two humans agree on 90 of 100; the scripted grader agrees with them 80% of the time */
const syn = [];
for (let i = 0; i < 100; i += 1) { const h = i % 2; syn.push({ item: "name", human_a: h ? "met" : "missed", human_b: i < 90 ? (h ? "met" : "missed") : (h ? "missed" : "met"), scripted: i % 5 === 0 ? (h ? "missed" : "met") : (h ? "met" : "missed"), ai: "" }); }
const a = agreement(syn, 50)[0];
ok(a.enough && Math.abs(a.humanAgree - 0.9) < 1e-9 && Math.abs(a.scripted.agree - 0.8) < 0.03 && a.ai.n === 0, "synthetic: human agreement 90%, scripted about 80%, no AI column: " + JSON.stringify({ h: a.humanAgree, s: a.scripted.agree }));
const few = agreement(syn.slice(0, 10), 50)[0];
ok(!few.enough, "under the minimum, an item is flagged not enough labels");
const lines = execFileSync("node", ["assess/agree.mjs", path.join(tmp, "sheet.csv")], { encoding: "utf8" });
ok(/not enough labels yet/.test(lines) && !/%/.test(lines.split("\n").slice(1).join("\n")), "on the unlabeled sheet, agree.mjs reports no accuracy at all");
let threw = false;
fs.writeFileSync(path.join(tmp, "real.jsonl"), JSON.stringify({ id: "r1", source: "tester", scenario: "kevin_intro", turns: [{ who: "you", text: "hi" }] }) + "\n");
try { execFileSync("node", ["assess/export.mjs", path.join(tmp, "real.jsonl"), APP, path.join(tmp, "x.csv")], { stdio: "pipe" }); } catch (e) { threw = /consent/.test(String(e.stderr)); }
ok(threw, "a real learner's answer without consent is refused");
console.log(`assess: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
