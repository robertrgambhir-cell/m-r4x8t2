/* Unit tests for the issue practice's two voters (version 173): Sarah after the Heating oil training, Linda after Social
   Security. The model is a stub (no network, no key, no cost): these prove the sheets carry everything the server needs,
   that the prompts are built from them, that the coach's card is the four parts of the door answer and that a credit
   still needs the canvasser's own words. How well the real model plays Sarah and Linda needs the deployed server.
   Run: node tests/issues.test.mjs */
import worker, { voterPrompt, coachPrompt, signLine } from "../worker.js";
import { SCENARIOS, publicScenario } from "../scenarios.js";
import { ISSUE_IDS, ISSUE_SCENARIOS, checkSheet } from "../scenarios-issues.js";
import { ISSUE_SCENARIOS_V2 } from "../voters/scenarios.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass += 1; else { fail += 1; console.log("FAIL", m); } };
const ORIGIN = "https://yourwarmup.com";
let stub = null; const calls = [];
globalThis.fetch = async (url, init) => { calls.push(JSON.parse(init.body)); return stub(); };
const reply = (input) => new Response(JSON.stringify({ content: [{ type: "tool_use", name: calls[calls.length - 1].tools[0].name, input }], usage: { input_tokens: 1500, output_tokens: 200 } }), { status: 200 });
const env0 = { ANTHROPIC_API_KEY: "test-key" };
const post = (path, body) => worker.fetch(new Request("https://w.example" + path, { method: "POST", headers: { origin: ORIGIN, "content-type": "application/json", "cf-connecting-ip": "3.3.3.3" }, body: JSON.stringify(body) }), env0);

/* which trainings are wired */
ok(ISSUE_IDS.join() === "oil,social" && Object.keys(ISSUE_SCENARIOS).join() === "oil,social", "the app's issue trainings are oil and social: " + ISSUE_IDS.join());
ok(SCENARIOS.oil === ISSUE_SCENARIOS.oil && SCENARIOS.social === ISSUE_SCENARIOS.social, "the server knows both");
ok(!SCENARIOS.oh_bills && !SCENARIOS.tx_vouchers && !SCENARIOS.power && !SCENARIOS.health && !SCENARIOS.hospital && !SCENARIOS.food, "no other issue training reaches the server");
ok(SCENARIOS.oil.voter.name === "Sarah" && SCENARIOS.social.voter.name === "Linda", "Sarah for oil, Linda for social");
ok(ISSUE_SCENARIOS.oil === ISSUE_SCENARIOS_V2.oil, "the server uses the voter sheet as written, not a rewrite");

/* this repo is public and the trainings' repo is not: only the wired trainings' sheets may be in the app's copy */
{ const fs = await import("node:fs"), raw = fs.readFileSync(new URL("../voters/scenarios.js", import.meta.url), "utf8");
  ok(Object.keys(ISSUE_SCENARIOS_V2).join() === ISSUE_IDS.join(), "the app's sheet file holds the wired trainings and no others: " + Object.keys(ISSUE_SCENARIOS_V2).join());
  ok(!/\b(Barb|Carla|Earl|Andre)\b|UNVERIFIED|helpNote|hamburger|data center/i.test(raw), "nothing of the other trainings' sheets is in this repo"); }

/* a sheet that is not ready for the app is refused when the server starts */
{ let msg = ""; try { checkSheet("power", ISSUE_SCENARIOS_V2.power); } catch (e) { msg = e.message; }
  ok(/voter sheet "power"/.test(msg), "a training that is not wired has no sheet here and is refused by name: " + msg);
  const thin = JSON.parse(JSON.stringify(ISSUE_SCENARIOS_V2.oil)); delete thin.outOfScope; thin.rubric.forEach((r) => { delete r.hit; });
  let m0 = ""; try { checkSheet("oil", thin); } catch (e) { m0 = e.message; }
  ok(/outOfScope is missing/.test(m0), "a sheet without the app's fields is refused: " + m0);
  let m2 = ""; try { checkSheet("nope", undefined); } catch (e) { m2 = e.message; }
  ok(/voter sheet "nope"/.test(m2), "a missing sheet is refused");
  const bad = JSON.parse(JSON.stringify(ISSUE_SCENARIOS_V2.oil)); bad.voter.opening.mood = "worried";
  let m3 = ""; try { checkSheet("oil", bad); } catch (e) { m3 = e.message; }
  ok(/moods/.test(m3), "a face the page can't draw is refused: " + m3);
  const five = JSON.parse(JSON.stringify(ISSUE_SCENARIOS_V2.oil)); five.rubric[4].card = true;
  let m4 = ""; try { checkSheet("oil", five); } catch (e) { m4 = e.message; }
  ok(/four/.test(m4), "the card must be the four parts: " + m4); }

for (const id of ISSUE_IDS) {
  const s = SCENARIOS[id], v = s.voter, O = v.opening.say;
  /* the page's copy of the card */
  const pub = publicScenario(id), blob = JSON.stringify(pub);
  ok(pub.voter.name === v.name && pub.voter.opening.say === O && pub.voter.voice === v.voice, id + ": the page gets the voter's name, opening line and voice");
  ok(pub.rubric.filter((r) => r.card).map((r) => r.id).join() === (id === "oil" ? "agree,help,choice,ask" : "agree,cause,choice,ask"), id + ": the card is the four parts of the door answer, in order: " + pub.rubric.filter((r) => r.card).map((r) => r.id).join());
  ok(pub.rubric.every((r) => r.hit && r.miss && r.label) && !/approvedFacts|persona|knownWrong|\bdef\b/.test(blob), id + ": every row has its lines for the card, and nothing of the prompt reaches the page");
  ok(!/—/.test(JSON.stringify(s)) && !/volunteer/i.test(pub.rubric.map((r) => r.hit + r.miss + r.label).join(" ")), id + ": no em dash, and the card says nothing about volunteers");
  /* the prompts are built from the sheet */
  const turns = [{ who: "them", text: O }, { who: "you", text: "That sounds really hard." }];
  const vp = voterPrompt(s, turns), cp = coachPrompt(s);
  ok(vp.includes(v.persona) && vp.includes(v.setting) && v.reactions.every((x) => vp.includes(x)) && vp.includes(v.endRule) && !/undefined|\[object/.test(vp), id + ": the voter's prompt carries the persona, setting, reactions and end rule");
  ok(s.approvedFacts.every((x) => cp.includes(x)) && s.knownWrong.every((x) => cp.includes(x)) && cp.includes(s.outOfScope) && s.rubric.every((r) => cp.includes("[" + r.id + "] " + r.label + ": " + r.def)) && !/undefined|\[object/.test(cp), id + ": the coach's prompt carries every approved fact, wrong claim and rubric row");
  ok(/Jack Dufner/.test(cp) && /Maya Kaur/.test(cp) && !/Collins|Jackson|Ernst|Maine|Iowa/.test(vp + cp), id + ": the prompts name only the made-up candidates and state");
  /* the voter answers, signed, and the conversation must open with the voter's own line */
  stub = () => reply({ say: v.name + ": Thanks. So what would Maya do?", mood: "neutral", end: false });
  let r = await post("/voter", { scenario: id, turns });
  let j = await r.json();
  ok(r.status === 200 && j.say === "Thanks. So what would Maya do?" && j.sig === (await signLine(env0, id, j.say, 2)), id + ": " + v.name + " answers and her line is signed: " + JSON.stringify(j).slice(0, 90));
  ok(calls[calls.length - 1].model === "claude-haiku-5-5" && calls[calls.length - 1].system.includes(v.persona), id + ": the fast model plays her from the sheet");
  r = await post("/voter", { scenario: id, turns: [{ who: "them", text: "Hello there." }, { who: "you", text: "Hi" }] });
  ok(r.status === 400 && (await r.json()).error === "bad_opening", id + ": a conversation that doesn't start with her own first line is refused");
  /* the coach: four rows on the card, a credit only for words the canvasser really said */
  const said = id === "oil"
    ? ["That sounds really hard. Heating oil costs about 80% more than last fall.", "The state's heating help covers renters too. I can text you the link.", "Jack Dufner voted five times against ending the war before he voted to end it. Maya Kaur would end the war.", "Can Maya count on your vote on Tuesday?"]
    : ["You're right to worry. Checks get smaller, they don't stop.", "Fewer workers pay in for each person getting a check.", "Jack Dufner voted for the 2025 federal law, though it gave people 65 and over a tax break. Maya Kaur would end the wage cap.", "Can Maya count on your vote?"];
  const convo = [{ who: "them", text: O }];
  for (const t of said) { convo.push({ who: "you", text: t }); convo.push({ who: "them", text: "Okay." }); }
  const cardIds = s.rubric.filter((x) => x.card).map((x) => x.id);
  stub = () => reply({
    items: [
      { id: cardIds[0], status: "met", evidence: said[0].split(".")[0], note: "" },
      { id: cardIds[1], status: "met", evidence: "words the canvasser never said", note: "" },
      { id: cardIds[2], status: "met", evidence: "Maya Kaur would end the " + (id === "oil" ? "war" : "wage cap"), note: "" },
      { id: cardIds[3], status: "met", evidence: "Can Maya count on your vote", note: "" },
      { id: "accurate", status: "met", evidence: "", note: "" },
    ],
    invented: [], transcription: [], strength: { text: "You agreed with her first.", quote: said[0].split(".")[0] }, improvement: { text: "Offer the help sooner.", try_saying: "I can text you the link." }, summary: "A solid door.",
  });
  r = await post("/coach", { scenario: id, turns: convo });
  j = await r.json();
  ok(r.status === 200 && j.hits.length === 4, id + ": the card has four rows: " + JSON.stringify(j.hits));
  ok(j.hits.join() === "true,false,true,true" && j.items[1].status === "missed" && /weren't in what you said/.test(j.items[1].note), id + ": a credit with words she never heard is taken back: " + JSON.stringify(j.hits));
  ok(j.items.length === 5 && j.items[4].id === "accurate" && j.items[4].status === "met", id + ": stick to the facts is judged, off the card");
  ok(calls[calls.length - 1].model === "claude-sonnet-5-5" && JSON.stringify(calls[calls.length - 1].system || "").includes(s.approvedFacts[0].slice(0, 40)), id + ": the careful model coaches from the approved facts");
}
console.log(`issues: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
