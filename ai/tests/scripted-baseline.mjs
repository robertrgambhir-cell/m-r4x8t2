/* The "before" column: what version 155's scripted Kevin says to the same learner lines as the live-eval cases.
   Replays each case's learner lines through DOORS.kevin.reply in the production page. Usage:
   NODE_PATH=$(npm root -g) node tests/scripted-baseline.mjs /abs/app155.html /abs/out.json */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { VOTER, PAIR } from "./cases.mjs";
const require = createRequire(path.join(process.env.NODE_PATH || "", "x"));
const { chromium } = require("playwright");
const [,, APP, OUT] = process.argv;
const END = "\nloadVoices();\nrender();\n})();\n</script>";
const src = fs.readFileSync(APP, "utf8");
const hooked = path.join(path.dirname(OUT), "zzbaseline155.html");
fs.writeFileSync(hooked, src.replace(END, "\nloadVoices();\nrender();\nwindow.__D = DOORS;\n})();\n</script>"));
const b = await chromium.launch(), p = await b.newPage();
await p.goto("file://" + hooked, { waitUntil: "domcontentloaded", timeout: 180000 });
await p.waitForTimeout(1500);
const all = [...VOTER.map((c) => ({ name: c.name, turns: c.turns })), ...PAIR.map((t, i) => ({ name: "pair " + (i ? "B" : "A"), turns: t }))];
const res = await p.evaluate((all) => all.map((c) => {
  const d = window.__D.kevin, st = { moves: new Set(), turns: 0 }; d.start(st);
  let r = null, ended = false;
  for (const t of c.turns.filter((x) => x.who === "you")) { if (ended) { r = { say: "(the scripted door had already closed)", expr: "", end: true }; break; } r = d.reply(st, t.text); if (r.end) ended = true; }
  return { name: c.name, say: r.say, mood: r.expr, end: !!r.end, ended };
}), all);
fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
console.log(res.map((x) => `${x.name}: [${x.mood}${x.end ? ", end" : ""}] ${x.say}`).join("\n"));
await b.close();
