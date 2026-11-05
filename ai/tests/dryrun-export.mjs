/* Writes every live-eval case as the exact system and user text the worker would send, for a prompt dry run. */
import fs from "node:fs";
import { SCENARIOS } from "../scenarios.js";
import { voterPrompt, coachPrompt } from "../worker.js";
import { VOTER, PAIR, COACH } from "./cases.mjs";
const tx = (turns, name) => turns.map((t, i) => `${i + 1}. ${t.who === "you" ? "Volunteer" : name}: ${t.text}`).join("\n");
const K = SCENARIOS.kevin_intro, out = [];
VOTER.forEach((c, i) => out.push({ id: "v" + i, kind: "voter", name: c.name, system: voterPrompt(K, c.turns), user: `The conversation so far:\n${tx(c.turns, "Kevin")}\n\nWrite Kevin's next turn.` }));
PAIR.forEach((t, i) => out.push({ id: "p" + i, kind: "voter", name: "pair " + i, system: voterPrompt(K, t), user: `The conversation so far:\n${tx(t, "Kevin")}\n\nWrite Kevin's next turn.` }));
COACH.forEach((c, i) => { const s = SCENARIOS[c.scen]; out.push({ id: "c" + i, kind: "coach", scen: c.scen, name: c.name, ids: s.rubric.map((r) => r.id), system: coachPrompt(s), user: `The transcript (Volunteer lines are speech-to-text):\n${tx(c.turns, s.voter.name)}\n\nJudge it with the coach_report tool.` }); });
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log(out.length, "cases");
