/* The issue trainings in the app (version 173, Nov 18, 2026): Heating oil, with the voter Sarah, and Social Security, with
   the voter Linda. Each training is a page built in the issue-trainings repo (robertrgambhir-cell/issue-trainings) and
   copied to wdpfxqlsvp/trainings/. After it, "Practice the conversation" opens the app's spoken door practice, and this
   file is what the AI server needs for that: who the voter is, the facts the coach checks and what the coach scores.

   The voter sheets are written with the trainings, so the training's words and the practice can never drift apart:
   ai/voters/scenarios.js is that repo's voters/scenarios.js, copied as it is by ai/tools/sync-issue-trainings.py.
   Only the ids in ISSUE_IDS reach the server; the other sheets in that file are not wired. The two trainings rebuilt on
   Nov 6 (electric bills as oh_bills, school vouchers as tx_vouchers) and their narration left the app with this version.

   Maya Kaur, Jack Dufner and the state of Franklin are a sample campaign; the voters are example voters. */
import { ISSUE_SCENARIOS_V2 } from "./voters/scenarios.js";

export const ISSUE_IDS = ["oil", "social"];

const MOODS = ["warm", "neutral", "busy", "skeptical", "surprised"]; /* the faces the page can draw (worker.js MOODS) */
const text = (x) => typeof x === "string" && x.trim().length > 0;
const list = (x) => Array.isArray(x) && x.length > 0 && x.every(text);

/* A sheet that is missing something the server needs must fail here, when the server starts, not in a canvasser's conversation */
export function checkSheet(id, s) {
  const bad = (why) => { throw new Error(`voter sheet "${id}": ${why}`); };
  if (!s || typeof s !== "object") bad("not in ai/voters/scenarios.js");
  for (const k of ["title", "lesson", "learnerGoal", "outOfScope"]) if (!text(s[k])) bad(`${k} is missing`);
  for (const k of ["approvedFacts", "knownWrong"]) if (!list(s[k])) bad(`${k} is missing`);
  const v = s.voter;
  if (!v || !text(v.name) || !text(v.persona) || !text(v.setting) || !text(v.endRule)) bad("the voter needs a name, persona, setting and end rule");
  for (const k of ["knows", "unknown", "reactions"]) if (!list(v[k])) bad(`voter.${k} is missing`);
  if (!v.opening || !text(v.opening.say) || !MOODS.includes(v.opening.mood)) bad("the opening needs a line and one of the app's moods (" + MOODS.join(", ") + ")");
  if (!text(v.voice) || !list(v.voices) || !v.voices.includes(v.voice)) bad("voter.voice and voter.voices are missing");
  if (!(Number.isInteger(v.wrapAt) && Number.isInteger(v.hardStop) && v.wrapAt > 0 && v.hardStop > v.wrapAt)) bad("wrapAt and hardStop must be whole numbers, hardStop the larger");
  if (!Array.isArray(s.rubric) || !s.rubric.length) bad("the rubric is missing");
  const ids = new Set();
  for (const r of s.rubric) {
    if (!r || !text(r.id) || ids.has(r.id)) bad("every rubric row needs its own id");
    ids.add(r.id);
    for (const k of ["label", "hit", "miss", "def"]) if (!text(r[k])) bad(`rubric row ${r.id}: ${k} is missing`);
    if (typeof r.evidence !== "boolean") bad(`rubric row ${r.id}: evidence must be true or false`);
  }
  if (s.rubric.filter((r) => r.card).length !== 4) bad("the score card is the four parts of the door answer: exactly four rows need card: true");
  if (!ids.has("accurate")) bad('the rubric needs an "accurate" row (stick to the facts)');
  if (JSON.stringify(s).includes("—")) bad("an em dash");
  return s;
}

export const ISSUE_SCENARIOS = Object.fromEntries(ISSUE_IDS.map((id) => [id, checkSheet(id, ISSUE_SCENARIOS_V2[id])]));
