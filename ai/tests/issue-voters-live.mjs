/* The first real conversations with Sarah (oil) and Linda (social), against the DEPLOYED practice AI.
   Version 173 was built where no key and no deployed copy of these voters existed, so until this runs nobody has heard
   the real model play them or seen the real coach grade them. Run it once after the branch is live, and after any change
   to a voter sheet (ai/voters/scenarios.js).

   For each voter it plays two doors and prints every line, so a person can read them:
     1. the door answer from her voter sheet, said the way the training teaches it: the coach should credit all four parts
        and find nothing wrong;
     2. a door with the one thing the training says never to say: the coach should catch it.
   It also holds every voter line to the rules in ai/voter-rules.md that apply to every door (in character, short).

   Usage: WARMUP_AI_URL=https://warmup-ai.robertrgambhir.workers.dev node tests/issue-voters-live.mjs
   (behind a proxy, add NODE_USE_ENV_PROXY=1). Exits 1 if a check fails. Cost: about 20 voter turns and 4 coach reports,
   a few cents. No admin token: the voter's lines come back signed and are passed on, as the page does. */
import { outOfCharacter } from "../worker.js";
import { ISSUE_IDS, ISSUE_SCENARIOS } from "../scenarios-issues.js";

const URL0 = (process.env.WARMUP_AI_URL || "").replace(/\/+$/, "");
const ORIGIN = process.env.WARMUP_ORIGIN || "https://yourwarmup.com";
if (!URL0) { console.error("Set WARMUP_AI_URL to the practice AI's address."); process.exit(2); }

/* one streamed turn, read the way the page reads it */
async function turn(scenario, turns) {
  const r = await fetch(URL0 + "/turn", { method: "POST", headers: { "content-type": "application/json", origin: ORIGIN }, body: JSON.stringify({ scenario, turns }) });
  if (!r.ok) throw new Error("/turn " + r.status + " " + (await r.text()).slice(0, 200));
  const rd = r.body.getReader();
  let buf = new Uint8Array(0), done = null;
  for (;;) {
    const x = await rd.read();
    if (x.done) break;
    const nb = new Uint8Array(buf.length + x.value.length); nb.set(buf); nb.set(x.value, buf.length); buf = nb;
    while (buf.length >= 5) {
      const n = new DataView(buf.buffer, buf.byteOffset + 1, 4).getUint32(0);
      if (buf.length < 5 + n) break;
      const type = buf[0], p = buf.subarray(5, 5 + n);
      buf = buf.slice(5 + n);
      if (type === 1) { const o = JSON.parse(new TextDecoder().decode(p)); if (o.t === "done") done = o; if (o.t === "error") throw new Error("voter error " + o.code); }
    }
  }
  if (!done) throw new Error("no answer");
  return done;
}
async function coach(scenario, turns) {
  const r = await fetch(URL0 + "/coach", { method: "POST", headers: { "content-type": "application/json", origin: ORIGIN }, body: JSON.stringify({ scenario, turns: turns.map((t) => ({ who: t.who, text: t.text })) }) });
  if (!r.ok) throw new Error("/coach " + r.status + " " + (await r.text()).slice(0, 200));
  return r.json();
}
/* the words inside the quotes of a doorAnswer line: 'Agree: "That sounds really hard."' */
const said = (line) => (line.match(/"([^"]+)"/) || [null, line])[1];
const NEVER = {
  oil: { line: "Jack Dufner never voted to end the war with Iran. Maya Kaur would end it.", what: "saying Jack Dufner never voted to end the war" },
  social: { line: "Your Social Security checks will stop in 2032, and Jack Dufner voted to cut your check.", what: "saying checks will stop and that he voted to cut her check" },
};

let fails = 0;
const fail = (m) => { fails += 1; console.log("   FAIL " + m); };
for (const id of ISSUE_IDS) {
  const s = ISSUE_SCENARIOS[id], name = s.voter.name;
  const doors = [
    { label: "the door answer, as the training teaches it", lines: s.doorAnswer.map(said) },
    { label: "a door with the line to never say", lines: [said(s.doorAnswer[0]), NEVER[id].line, said(s.doorAnswer[3])] },
  ];
  for (const [k, door] of doors.entries()) {
    console.log(`\n== ${name} (${id}): ${door.label}`);
    const turns = [{ who: "them", text: s.voter.opening.say }];
    console.log(`   ${name}: ${s.voter.opening.say}`);
    let ended = false;
    try {
      for (const line of door.lines) {
        turns.push({ who: "you", text: line });
        console.log(`   You: ${line}`);
        const r = await turn(id, turns);
        console.log(`   ${name}: ${r.say}${r.end ? "  [door closes]" : ""}`);
        if (outOfCharacter(r.say, name)) fail("she stepped out of character");
        if (r.say.split(/\s+/).length > 45) fail("too long for a door: " + r.say.split(/\s+/).length + " words");
        if (/—/.test(r.say)) fail("an em dash in her line");
        if (/\b(Collins|Jackson|Hinson|Turek|Maine|Iowa)\b/.test(r.say)) fail("she named a real candidate or state");
        turns.push({ who: "them", text: r.say, sig: r.sig });
        if (r.end) { ended = true; break; }
      }
      const rep = await coach(id, turns);
      const card = s.rubric.filter((x) => x.card).map((x, i) => (rep.hits[i] ? x.hit : x.miss));
      const acc = rep.items.find((x) => x.id === "accurate") || {};
      console.log("   Coach's card: " + card.join(" | ") + "   (" + rep.hits.filter(Boolean).length + " of 4)");
      console.log("   Stick to the facts: " + acc.status + (rep.invented.length ? "   Check this: " + rep.invented.map((v) => `"${v.quote}" ${v.issue}`).join(" ; ") : ""));
      if (rep.strength) console.log("   What worked: " + rep.strength.text);
      if (rep.improvement) console.log("   Try next: " + rep.improvement.text);
      if (k === 0) {
        const given = door.lines.length === turns.filter((t) => t.who === "you").length;
        if (given && rep.hits.filter(Boolean).length < 4) fail("the training's own door answer did not get 4 of 4: " + JSON.stringify(rep.hits));
        if (!given) console.log("   (she closed the door before every part was said, so the 4 of 4 check is skipped: read the lines above" + (ended ? "" : "") + ")");
        if (acc.status === "missed" || rep.invented.length) fail("the coach found a wrong claim in the training's own door answer");
      } else if (!(acc.status === "missed" || rep.invented.length)) fail("the coach did not catch " + NEVER[id].what);
    } catch (e) { fail("error: " + e.message); }
  }
}
console.log(`\nissue voters, live: ${fails ? fails + " check(s) failed" : "all checks passed"}. Read the conversations above: do Sarah and Linda sound like people at a door?`);
process.exit(fails ? 1 : 0);
