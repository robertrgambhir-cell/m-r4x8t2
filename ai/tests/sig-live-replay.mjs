/* Robert's own exchanges against the live AI server's live replies (POST /sig/reply; playbook rule 37f, voter rule 14). The page's
   grader decides what each passerby does (computed here with the same grader); the server writes the words. Each must answer what was
   said and keep the decision. Run after any change to the passersby or the server:
   WARMUP_AI_URL=https://warmup-ai.robertrgambhir.workers.dev node tests/sig-live-replay.mjs [rounds] */
import { SIGG } from "../sig/grade.mjs";
import * as C from "../sig/content.js";
const AI = process.env.WARMUP_AI_URL || "https://warmup-ai.robertrgambhir.workers.dev", ROUNDS = Number(process.argv[2]) || 1;
const ST = Object.assign({}, C.SIG_SETTINGS, { label: C.SIG_MEASURE.label });
const CASES = [
  /* Nov 21, 12:56 PM: "I asked her, 'Are you registered to vote in Los Angeles County, and are you a lover of libraries?' She didn't answer. She said, 'Sure, I'll sign.'" */
  { n: 2, who: "soojin", key: "2.soojin", lines: ["Hi, how are you? Um, are you registered to vote in Los Angeles County, and are you a lover of libraries?"],
    must: [/\b(yes|yeah|yep|i am|registered)\b/i], never: [/\bsign\b/i] },
  { n: 2, who: "ben", key: "2.ben", lines: ["Hi there! I'm collecting signatures for a ballot measure to keep funding schools and health care. Are you registered to vote in LA County?"],
    must: [/\b(yes|yeah|yep|i am|registered)\b/i, /\bsign\b/i], never: [/\bnot registered\b/i] },
  { n: 2, who: "kayla", key: "2.kayla", lines: ["Hi! Are you registered to vote in LA County?"], must: [/\bnot\b/i], never: [/\bsign\b/i] },
];
let pass = 0, fail = 0, fell = 0, ms = [];
for (let round = 0; round < ROUNDS; round += 1) for (const c of CASES) {
  const t = SIGG.talk(c.key, ST), history = [];
  for (const said of c.lines) {
    const res = t.hear(said), keys = res.say.filter((k) => k[0] !== "@");
    const t0 = Date.now();
    const r = await fetch(AI + "/sig/reply", { method: "POST", headers: { origin: "https://yourwarmup.com", "content-type": "application/json" }, body: JSON.stringify({ lesson: c.n, who: c.who, said, history, keys }) });
    const j = await r.json().catch(() => ({})); ms.push(Date.now() - t0);
    if (j.fallback || !j.text) { fell += 1; console.log("fallback", c.who, keys.join("+"), j.fallback || r.status); continue; }
    const good = c.must.every((x) => x.test(j.text)) && !c.never.some((x) => x.test(j.text));
    if (good) pass += 1; else { fail += 1; }
    console.log(good ? "ok  " : "FAIL", c.who, keys.join("+"), JSON.stringify(j.text), (Date.now() - t0) + " ms");
    history.push({ who: "you", text: said }, { who: "them", text: j.text });
  }
}
ms.sort((a, b) => a - b);
console.log(`sig-live-replay: ${pass} pass, ${fail} fail, ${fell} fell back to the script; median ${ms[Math.floor(ms.length / 2)]} ms, slowest ${ms[ms.length - 1]} ms`);
process.exit(fail ? 1 : 0);
