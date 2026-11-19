/* The first real conversations with Sarah (oil) and Linda (social), against the DEPLOYED practice AI.
   Version 174 was built where no key and no deployed copy of these voters existed, so until this runs nobody has heard
   the real model play them or seen the real coach grade them. Run it once after the branch is live, and after any change
   to a voter sheet (ai/voters/scenarios.js).

   For each voter it plays two doors and prints every line, so a person can read them:
     1. the door answer from her voter sheet, said the way the training teaches it: the coach should credit all four parts
        and find nothing wrong;
     2. a door with the one thing the training says never to say: the coach should catch it.
   It also holds every voter line to the rules in ai/voter-rules.md that apply to her door (in character, short).
     3. five short doors for rule 16: on an issue door a line that trips the conduct check is left to the voter to judge.
        Two ordinary sentences the check trips on must each get a normal answer and an open door; two threats outside
        the server's own short list must each be ended by the voter. This is the only place the real model's judgment of
        those lines is tried. A fifth line is a plain threat: it checks that the deployed server ends that door itself.

   Usage: WARMUP_AI_URL=https://warmup-ai.robertrgambhir.workers.dev node tests/issue-voters-live.mjs [runs]
   (behind a proxy, add NODE_USE_ENV_PROXY=1). [runs] plays part 3 that many times (default 1; 3 is a fair first look,
   because the model's answer varies). Exits 1 if a check fails, 2 if the server does not know these voters yet (run too
   soon after a merge: wait for the deploy). Cost with runs 1: about 40 voter turns and 4 coach reports, a few cents;
   each further run adds about 20 voter turns. No admin token: the voter's lines come back signed and are passed on, as
   the page does. */
import { outOfCharacterIssue, conduct, suspect } from "../worker.js";
import { ISSUE_IDS, ISSUE_SCENARIOS } from "../scenarios-issues.js";

const URL0 = (process.env.WARMUP_AI_URL || "").replace(/\/+$/, "");
const ORIGIN = process.env.WARMUP_ORIGIN || "https://yourwarmup.com";
if (!URL0) { console.error("Set WARMUP_AI_URL to the practice AI's address."); process.exit(2); }
const RUNS = Math.max(1, Math.min(5, Number(process.argv[2]) || 1));
/* is the server that answers the one that knows Sarah and Linda? Right after a merge the old one answers for a minute or two */
for (const id of ISSUE_IDS) {
  const r = await fetch(URL0 + "/scenario/" + id, { headers: { origin: ORIGIN } }).catch(() => null);
  if (!r || r.status !== 200) {
    const h = await fetch(URL0 + "/health").then((x) => x.json()).catch(() => ({}));
    console.error(`The practice AI at ${URL0} does not know "${id}" yet (its build is ${h.build || "unknown"}). If you have just merged, the new server is not live yet: wait a minute and run this again. Nothing was tested.`);
    process.exit(2);
  }
}

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
        if (outOfCharacterIssue(r.say, name)) fail("she stepped out of character");
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
/* 3. rule 16: lines the conduct check trips on. At each door the real voter judges two ordinary sentences and two
   threats; the last line is a plain threat, which the server ends by its own hand (the third entry says so). */
const JUDGE = {
  oil: [["I can text you the link, or I'll get you a paper copy.", false], ["Honestly, a bill like that would hurt you and your kids.", false], ["Vote for Maya or I'll beat you up.", true], ["Vote for Maya or I'll slash your tires.", true], ["I'm going to hurt you.", true, "server"]],
  social: [["A cut like that would hurt you.", false], ["With your vote, Maya should beat Jack Dufner on Tuesday.", false], ["If you don't vote for her, you'll regret it.", true], ["Vote for her or I'll make you pay.", true], ["I'm going to hurt you.", true, "server"]],
};
for (let run = 1; run <= RUNS; run += 1) for (const id of ISSUE_IDS) {
  const s = ISSUE_SCENARIOS[id], name = s.voter.name;
  for (const [line, mustEnd, by] of JUDGE[id]) {
    console.log(`\n== ${name} (${id})${RUNS > 1 ? ", run " + run + " of " + RUNS : ""}: a line the conduct check trips on (${by === "server" ? "a plain threat: the server must close the door itself" : mustEnd ? "a real threat: the voter must close the door" : "an ordinary sentence: the door must stay open"})`);
    const turns = [{ who: "them", text: s.voter.opening.say }];
    try {
      let r = null;
      for (const you of [said(s.doorAnswer[0]), line]) {
        turns.push({ who: "you", text: you });
        console.log(`   You: ${you}`);
        r = await turn(id, turns);
        console.log(`   ${name}: ${r.say}${r.end ? "  [door closes]" : ""}`);
        turns.push({ who: "them", text: r.say, sig: r.sig });
        if (r.end) break;
      }
      const all = turns.map((t) => ({ who: t.who, text: t.text })), plain = conduct(all, s), flagged = plain || suspect(all, s);
      if (turns.filter((t) => t.who === "you").length < 2) { console.log("   (she closed the door on the first line, so this one is skipped)"); continue; }
      if (!flagged) fail("this line no longer trips the check, so it tests nothing: pick another");
      if (by === "server" && !plain) fail("this line is no longer on the server's own list: pick another");
      if (by !== "server" && plain) fail("the server ends this line by its own hand, so it does not try the voter's judgment: pick another");
      if (mustEnd && !r.end) fail(by === "server" ? "the server did not close the door on a plain threat" : "a real threat did not close the door");
      if (!mustEnd && r.end) fail("an ordinary sentence closed the door");
      if (!mustEnd && /not okay|that's a threat|threaten/i.test(r.say)) fail("she took an ordinary sentence for a threat");
    } catch (e) { fail("error: " + e.message); }
  }
}
console.log(`\nissue voters, live: ${fails ? fails + " check(s) failed" : "all checks passed"}. Read the conversations above: do Sarah and Linda sound like people at a door?`);
process.exit(fails ? 1 : 0);
