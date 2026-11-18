/* Live replays of the conversations Robert flagged while testing (ai/voter-rules.md), against the deployed practice AI.
   Each conversation runs RUNS times (the model's answer varies); every voter line is checked against the voter rules, and
   each conversation has its own expectations. No admin token: the voter's lines come back signed and are passed on.
   Usage: WARMUP_AI_URL=https://warmup-ai.robertrgambhir.workers.dev node tests/voter-replays.mjs [runs]
   (behind a proxy, add NODE_USE_ENV_PROXY=1). Exits 1 if any check fails. Cost: about 15 voter calls a run, a few cents.
   To add one: copy a conversation Robert flagged into REPLAYS with what it must do, and add the rule to ai/voter-rules.md. */
import { introParts, outOfCharacter, FAREWELL } from "../worker.js";

const URL0 = (process.env.WARMUP_AI_URL || "").replace(/\/+$/, "");
const RUNS = Number(process.argv[2] || 2);
const ORIGIN = process.env.WARMUP_ORIGIN || "https://yourwarmup.com";
if (!URL0) { console.error("Set WARMUP_AI_URL to the practice AI's address."); process.exit(2); }

/* one streamed turn: the voter's words, whether it ended, its signature and when its voice started */
async function turn(scenario, turns) {
  const t0 = Date.now();
  const r = await fetch(URL0 + "/turn", { method: "POST", headers: { "content-type": "application/json", origin: ORIGIN }, body: JSON.stringify({ scenario, turns }) });
  if (!r.ok) throw new Error("/turn " + r.status + " " + (await r.text()).slice(0, 200));
  const rd = r.body.getReader();
  let buf = new Uint8Array(0), done = null, audio1 = 0;
  for (;;) {
    const x = await rd.read();
    if (x.done) break;
    const nb = new Uint8Array(buf.length + x.value.length); nb.set(buf); nb.set(x.value, buf.length); buf = nb;
    while (buf.length >= 5) {
      const n = new DataView(buf.buffer, buf.byteOffset + 1, 4).getUint32(0);
      if (buf.length < 5 + n) break;
      const type = buf[0], p = buf.subarray(5, 5 + n);
      buf = buf.slice(5 + n);
      if (type === 2 && !audio1) audio1 = Date.now() - t0;
      if (type === 1) { const o = JSON.parse(new TextDecoder().decode(p)); if (o.t === "done") done = o; if (o.t === "error") throw new Error("voter error " + o.code); }
    }
  }
  if (!done) throw new Error("no answer");
  return { ...done, audio1 };
}

/* the rules every voter line must pass (ai/voter-rules.md) */
const LESSON1 = new Set(["sofia_intro", "kevin_intro"]);
function checkLine(scen, turns, reply) {
  const bad = [], say = reply.say || "", name = scen === "sofia_intro" ? "Sofia" : scen === "kevin_intro" ? "Kevin" : "the voter";
  if (outOfCharacter(say, name)) bad.push("stepped out of character (rule 7)");
  if (/confus|what you'?re after/i.test(say)) bad.push("sounds confused or talks about the exchange (rules 4 and 7)");
  if (say.split(/\s+/).length > 40) bad.push("too long for a door (rule 2)");
  if (LESSON1.has(scen)) {
    if (/\bsame as always\b/i.test(say)) bad.push("\"same as always\" (rule 2)");
    if (/\bpoll(s|ing)?\b[^.?!]*\?|what time[^.?!]*\?|where (do|should) i vote/i.test(say)) bad.push("asks something the canvasser couldn't know (rule 3)");
    const p = introParts(turns), asks = [[p.name, /and you are\?|catch your name/i, "their name"], [p.maya, /who are you (volunteering|with)/i, "who they're with"], [p.why, /what'?s this about\?|what brings you/i, "why they came"]];
    for (const [said, re, what] of asks) if (said && re.test(say)) bad.push(`asks for ${what}, already said (rule 4)`);
    if (/[a-z][,.!]? oh, nice\b/i.test(say)) bad.push("\"oh, nice\" in the middle of a line (rule 4)");
    if (/volunteering/i.test(say) && !turns.some((t) => t.who === "you" && /volunteer/i.test(t.text))) bad.push("says \"volunteering\" before the canvasser has (rule 4)");
    if ((say.match(/\?/g) || []).length > 1) bad.push("more than one question (rule 4)");
  }
  const lastThem = [...turns].reverse().find((t) => t.who === "them");
  if (lastThem && FAREWELL.test(lastThem.text) && turns.filter((t) => t.who === "you").length >= 2 && !reply.end) bad.push("the door stayed open after the voter's goodbye (rule 6)");
  return bad;
}

/* Robert's flagged conversations. lines: what the canvasser says, in order; expect(replies, turns): extra checks */
const REPLAYS = [
  { name: "Nov 15, 6:55 PM: one more line after Sofia's goodbye", scenario: "sofia_intro",
    lines: ["Hi, I'm Robert. I live down the street and I'm volunteering for Maya Kaur. Election Day is Tuesday.", "Great, thanks so much. Have a good night!", "You too goodnight"],
    expect: (rs) => (rs[rs.length - 1].end ? [] : ["the door didn't close on the goodbye"]) },
  { name: "Nov 15, 7:44 PM: \"anything else?\" and the polls", scenario: "sofia_intro",
    lines: ["Hi I'm Robert I'm with the Maya Kaur campaign do you know about the election on Tuesday", "Great we're um really happy to hear that we'll be getting your vote do you have any questions about the election or is there anything I can help you with"],
    expect: (rs) => (/\?/.test(rs[1].say) ? ["asked a question back after \"anything else?\""] : []) },
  { name: "Nov 15, 8:09 PM: \"getting the word out about the election\"", scenario: "sofia_intro",
    lines: ["Hi I'm Robert um I live down the street I'm volunteering getting the word out about the election do you know there's an election next Tuesday"],
    expect: (rs) => (/who are you (volunteering|with)/i.test(rs[0].say) ? [] : ["didn't ask who he's volunteering with: " + rs[0].say]) },
  { name: "Nov 16, 8:14 PM: no name, twice", scenario: "sofia_intro",
    lines: ["Hi um I'm here", "Hi I'm here knocking on neighbor's doors do you know about the election on Tuesday", "Oh sorry I'm Robert I'm volunteering for Maya Kaur"],
    expect: (rs) => [!/and you are\?/i.test(rs[0].say) && "first ask wasn't for his name: " + rs[0].say, !/name/i.test(rs[1].say) && "second ask wasn't for his name: " + rs[1].say].filter(Boolean) },
  { name: "Nov 15, 5:33 PM: off topic (the weather)", scenario: "sofia_intro",
    lines: ["Hi, I'm Robert, I'm volunteering for Maya Kaur. Boy, it sure is sunny today."],
    expect: (rs) => (/sun|nice|weather|beautiful|lovely|gorgeous|warm|day|sure is|it is|isn.t it/i.test(rs[0].say) ? [] : ["didn't respond to the weather: " + rs[0].say]) },
  { name: "Nov 16: a goodbye before all four parts", scenario: "sofia_intro",
    lines: ["Hi, I'm Robert, I'm volunteering for Maya Kaur.", "Okay, thanks so much, bye now!"],
    expect: (rs) => { const l = rs[rs.length - 1]; return [!l.end && "the door didn't close on his goodbye", /\?/.test(l.say) && "asked a question after his goodbye: " + l.say].filter(Boolean); } },
  { name: "Nov 17, 7:54 PM: a name and a pause", scenario: "sofia_intro",
    lines: ["Hi, I'm Robert, um, I'm", "Hi I'm Robert how are you"],
    expect: (rs) => [!/what can i do for you/i.test(rs[0].say) && "first answer wasn't the open question: " + rs[0].say, !/good|well|fine|great/i.test(rs[1].say) && "didn't answer \"how are you\": " + rs[1].say].filter(Boolean) },
  { name: "Kevin: the same rules at the 2nd intro", scenario: "kevin_intro",
    lines: ["Hey, I'm volunteering for Maya Kaur.", "Oh sorry, I'm Sam, I live nearby. Election Day is Tuesday."],
    expect: (rs) => (/and you are\?|catch your name/i.test(rs[0].say) ? [] : ["didn't ask Sam's name: " + rs[0].say]) },
];

const OPENING = { sofia_intro: "Hi, can I help you?", kevin_intro: "Hey. Can I help you?" };
let fails = 0;
const report = [];
for (const rp of REPLAYS) {
  for (let run = 1; run <= RUNS; run += 1) {
    const turns = [{ who: "them", text: OPENING[rp.scenario] }], replies = [], problems = [];
    try {
      for (const line of rp.lines) {
        turns.push({ who: "you", text: line });
        const r = await turn(rp.scenario, turns);
        problems.push(...checkLine(rp.scenario, turns, r).map((b) => `"${r.say}": ${b}`));
        replies.push(r);
        turns.push({ who: "them", text: r.say, sig: r.sig });
        if (r.end) break;
      }
      problems.push(...rp.expect(replies, turns));
    } catch (e) { problems.push("error: " + e.message); }
    if (problems.length) fails += 1;
    report.push({ name: rp.name, run, ok: !problems.length, problems, lines: turns.map((t) => `${t.who === "you" ? "You" : "Voter"}: ${t.text}`), audio1: replies.map((r) => r.audio1) });
  }
}
for (const r of report) {
  console.log(`${r.ok ? "PASS" : "FAIL"} ${r.name} (run ${r.run}; voice after ${r.audio1.map((x) => (x / 1000).toFixed(1) + " s").join(", ")})`);
  if (!r.ok) { r.problems.forEach((p) => console.log("   - " + p)); r.lines.forEach((l) => console.log("     " + l)); }
}
console.log(`voter replays: ${report.length - fails} pass, ${fails} fail`);
process.exit(fails ? 1 : 0);
