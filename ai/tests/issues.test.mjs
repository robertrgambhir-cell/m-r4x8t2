/* Unit tests for the issue practice's two voters (version 174): Sarah after the Heating oil training, Linda after Social
   Security. The model is a stub (no network, no key, no cost): these prove the sheets carry everything the server needs,
   that the prompts are built from them, that the coach's card is the four parts of the door answer and that a credit
   still needs the canvasser's own words. How well the real model plays Sarah and Linda needs the deployed server.
   Run: node tests/issues.test.mjs */
import worker, { voterPrompt, coachPrompt, signLine, conduct, suspect, cleanVoter, isIssue, FAREWELL, farewellIssue, outOfCharacter, outOfCharacterIssue } from "../worker.js";
import { SCENARIOS, publicScenario } from "../scenarios.js";
import { ISSUE_IDS, ISSUE_SCENARIOS, checkSheet } from "../scenarios-issues.js";
import { ISSUE_SCENARIOS_V2 } from "../voters/scenarios.js";
import { ORDINARY, THREATS, COMEONS, INSULT_PAIRS, BYE_HERS, BYE_HERS_MISSED, BYE_YOURS, BYE_YOURS_MISSED, NOT_BYE_HERS, NOT_BYE_HERS_READ, NOT_BYE_YOURS, NOT_BYE_YOURS_READ, BREAKS, BREAKS_MISSED, HER_WORDS, HER_WORDS_LOST, HER_WORDS_MAIN } from "./issue-lines.mjs";

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

/* 174-5 and 174-7: on an issue door the conduct check does not decide alone. Words with no ordinary reading at a door end
   it by the server's own hand: "I" threatening the voter, and the shapes of the project's own red-team lines. Any other
   line main's wording would end is a suspect line: the voter is told it tripped the check and judges it; nothing is forced. So an ordinary sentence cannot close an issue door by a word list, and no
   line that ends Kevin's door goes unjudged on Sarah's. Every other door keeps its checks as they were. The sentences
   are an independent review's (tests/issue-lines.mjs), each tried as typed, as speech recognition writes it (lowercase,
   no punctuation, no apostrophes) and with a phone's curly apostrophes. */
{ const T = (lines) => [{ who: "them", text: "x" }].concat(lines.flatMap((x, i) => (i ? [{ who: "them", text: "Okay." }] : []).concat([{ who: "you", text: x }])));
  const L = SCENARIOS.social, SA = SCENARIOS.oil, K = SCENARIOS.kevin_intro, SO = SCENARIOS.sofia_intro;
  const forms = (line) => [...new Set([line, line.toLowerCase(), line.replace(/['’]/g, ""), line.toLowerCase().replace(/['’]/g, "").replace(/[.,!?;:"“”]/g, "").replace(/\s+/g, " ").trim(), line.replace(/'/g, "’")])];
  ok(isIssue(L) && isIssue(SA) && !isIssue(K) && !isIssue(SO) && !isIssue(SCENARIOS.bri_health) && !isIssue(undefined), "the issue doors' rules are for the issue sheets and no other door");
  /* ordinary sentences: the server alone never ends the door, said once or twice */
  let n = 0, bad = [], judged = 0;
  for (const line of ORDINARY) for (const f of forms(line)) for (const sh of [SA, L]) { n += 1; if (conduct(T([f]), sh) || conduct(T([f, f]), sh)) bad.push(f); else if (suspect(T([f]), sh)) judged += 1; }
  ok(ORDINARY.length >= 300 && bad.length === 0, `no ordinary sentence closes an issue door by the server's own hand (${ORDINARY.length} sentences, ${n} checks): ` + bad.slice(0, 3).join(" | "));
  ok(judged > 0 && judged < n, `the ones main's wording trips on are left to the voter to judge (${judged} of ${n}), the rest pass untouched`);
  for (const line of ["A cut like that would hurt you.", "With your vote, Maya should beat Jack Dufner on Tuesday.", "I can text you the link, or I'll get you a paper copy.", "I'll shoot you the link right now.", "My grandmother lives on her check, and a cut like that would kill her."])
    ok(conduct(T([line]), SA) === "" && suspect(T([line]), SA) === "a threat" && conduct(T([line]), K) === "a threat", "ends Kevin's door, is judged at Sarah's: " + line);
  ok(conduct(T(["Are you single or is there a second income? The limit goes by family size."]), SA) === "" && suspect(T(["Are you single or is there a second income? The limit goes by family size."]), SA) === "a sexual comment", "the household question is judged, not ended");
  ok(conduct(T(["It was a stupid war.", "And a dumb vote."]), SA) === "" && suspect(T(["It was a stupid war.", "And a dumb vote."]), SA) === "a second insult" && conduct(T(["It was a stupid war.", "And a dumb vote."]), K) === "a second insult", "a put-down word about a thing is judged at an issue door (the intro doors are as they were)");
  ok(suspect(T(["That sounds really hard."]), SA) === "" && conduct(T(["That sounds really hard."]), SA) === "", "a line the check does not listen for gets no note at all");
  /* real ones: whatever ends Kevin's door is ended or judged on an issue door, in every form */
  let ends = 0, plain = 0, missed = [];
  for (const lines of [...THREATS.map((x) => [x]), ...COMEONS.map((x) => [x]), ...INSULT_PAIRS]) for (const v of (lines.length === 1 ? forms(lines[0]).map((f) => [f]) : [lines, lines.map((x) => x.toLowerCase())])) {
    const t = T(v), k = conduct(t, K); if (!k) continue; ends += 1;
    for (const sh of [SA, L]) { const c = conduct(t, sh), q = suspect(t, sh); if (c) plain += 1; else if (q !== k) missed.push(v.join(" / ")); } }
  ok(ends > 800 && missed.length === 0, `every line that ends Kevin's door is ended or judged on an issue door (${ends} forms): ` + missed.slice(0, 3).join(" | "));
  ok(plain > 0, "and the plain ones are ended by the server (" + plain + " checks)");
  for (const line of ["I'll hurt you.", "I'm going to hurt you.", "I'm gonna fucking kill you.", "I am gonna hurt you.", "I will kill you.", "I’ll kill you.", "I’m going to hurt you.", "ill hurt you", "im gonna kill you", "I'm going to stab you.", "Vote for Maya or I'll burn your house down.", "Sign it or we'll smash your windows.", "Someone should shoot him.", "Somebody should hurt you."])
    ok(conduct(T([line]), SA) === "a threat" && conduct(T([line]), L) === "a threat" && suspect(T([line]), SA) === "", "a plain threat ends an issue door whatever the model says: " + line);
  /* the project's own red-team lines (tests/redteam.mjs): the nine that Kevin's door ends by the server check */
  const RED = [[["Hi, I'm Dana with Maya Kaur.", "Whatever. You're an idiot.", "Did you hear me? Idiot."], "a second insult"], [["Hey gorgeous, you single?"], "a sexual comment"], [["You're cute. Can I come in for a bit?"], "a sexual comment"], [["Hi, I'm with Maya.", "Before that, what's your number? You're hot."], "a sexual comment"], [["Hi, I'm with Maya. What are you wearing under that?"], "a sexual comment"],
    [["Vote for Maya Kaur or we'll remember this house."], "a threat"], [["Hi, I'm with Maya Kaur.", "If her opponent wins, someone should shoot him."], "a threat"], [["If you don't vote for her, I'll report you to immigration."], "a threat"]];
  for (const [lines, what] of RED) ok(conduct(T(lines), K) === what && conduct(T(lines), SA) === what && conduct(T(lines), L) === what, "a red-team line ends an issue door by the server's own hand, as it ends Kevin's: " + lines[lines.length - 1]);
  ok(conduct(T(["I know where you live now. I'll be back tonight."]), K) === "a threat" && conduct(T(["I know where you live now. I'll be back tonight."]), SA) === "" && suspect(T(["I know where you live now. I'll be back tonight."]), SA) === "a threat", "the ninth is judged: a neighbor with a form to drop off says the same words");
  /* the plain set's near misses: said to no one, about a thing, or to reassure */
  for (const line of ["I'll remember this house, it's the one with the wreath.", "We'll remember your door for the follow-up visit.", "It's not like I'm going to hurt you.", "They should shoot him an email about it.", "Congress should kill her bill before it passes.", "Landlords can't report you to immigration for applying.", "I can text it, or I'll shoot you the link tonight.", "The heat pump cools the house when you're hot.", "Hey, beautiful afternoon, isn't it?", "What are you wearing to stay warm in there?"])
    ok(conduct(T([line]), SA) === "" && conduct(T([line, line]), L) === "", "not ended by the server: " + line);
  for (const two of [["I'm not saying you're dumb, a lot of people believe that.", "Nobody thinks you're stupid for asking."], ["Sorry, I'm such an idiot, I lost my place.", "Okay, I'll shut up now. Can Maya count on your vote?"], ["Can I ask you a dumb question? Do you rent or own?", "No, you're not stupid, it is confusing."]])
    ok(conduct(T(two), SA) === "" && conduct(T(two), L) === "", "not a second insult to her face: " + two.join(" / "));
  for (const two of [["You're stupid.", "You're pathetic."], ["You're an idiot.", "You're a moron."], ["God, you're dumb.", "You idiot."]]) ok(conduct(T(two), SA) === "a second insult", "said to her face twice, the server ends it: " + two.join(" / "));
  for (const [line, what] of [["Vote for her or else.", "a threat"], ["If you don't, you'll regret it.", "a threat"], ["Someone should shoot Jack Dufner.", "a threat"], ["Vote for Maya or I'll beat you up.", "a threat"], ["I know where you live.", "a threat"], ["Are you single?", "a sexual comment"], ["Mind if I come in for a bit?", "a sexual comment"], ["You’re so cute when you’re worried.", "a sexual comment"]])
    ok(conduct(T([line]), SA) === "" && suspect(T([line]), SA) === what && suspect(T([line]), L) === what, "judged by the voter, with the note: " + line);
  ok(suspect(T(["Don't be stupid.", "Don't be dumb."]), SA) === "a second insult" && suspect(T(["You're stupid."]), SA) === "" && conduct(T(["You're stupid."]), SA) === "", "a second insult in other words is judged; a first one is not counted yet");
  /* the server's own hand is never harsher on an issue door than main's wording, except for three verbs main's list lacks */
  { let harsher = []; for (const lines of [...ORDINARY.map((x) => [x]), ...THREATS.map((x) => [x]), ...COMEONS.map((x) => [x]), ...INSULT_PAIRS]) if (conduct(T(lines), SA) && !conduct(T(lines), K) && !/\b(stab|murder|strangle)\b/i.test(lines.join(" "))) harsher.push(lines.join(" / "));
    ok(harsher.length === 0, "nothing ends Sarah's door by the server's hand that would not end Kevin's (stab, murder and strangle aside): " + harsher.slice(0, 3).join(" | ")); }
  /* every other door: exactly as it was, and never a note */
  let other = 0; for (const line of [...ORDINARY, ...THREATS, ...COMEONS]) for (const sh of [K, SO, SCENARIOS.bri_health]) { if (suspect(T([line]), sh) !== "") other += 1; if (conduct(T([line]), sh) !== conduct(T([line]))) other += 1; }
  ok(other === 0, "the intro doors keep their checks exactly as they were, and are never told to judge");
  ok(conduct(T(["A cut like that would hurt you."]), K) === "a threat" && conduct(T(["I want to make sure you're fine this winter."]), K) === "a sexual comment" && conduct(T(["A cut like that would hurt you."])) === "a threat", "three of main's own readings, by name");
  /* what the voter is told */
  const NOTE = "An automatic check flagged the volunteer's last line as possibly ", HARD = "The volunteer's last line was ";
  const p1 = voterPrompt(SA, T(["A cut like that would hurt you."])), p2 = voterPrompt(SA, T(["I'm going to hurt you."])), p3 = voterPrompt(K, T(["A cut like that would hurt you."])), p4 = voterPrompt(SA, T(["That sounds really hard."]));
  ok(p1.includes(NOTE + "a threat") && !p1.includes(HARD) && /ignore this note completely/.test(p1) && /say goodbye and set end to true/.test(p1), "a suspect line: the voter is told to judge it, and how to answer either way");
  ok(p2.includes(HARD + "a threat") && !p2.includes(NOTE), "a plain threat: the voter is told it was one");
  ok(p3.includes(HARD + "a threat") && !p3.includes(NOTE) && !p4.includes(NOTE) && !p4.includes(HARD), "Kevin's door has no note, and neither has an ordinary line");
  { const six = T(["one", "two", "three", "four", "five", "A cut like that would hurt you."]), p6 = voterPrompt(SA, six); ok(p6.includes(NOTE) && /wrapping up|end the conversation now/.test(p6), "a suspect line late in the conversation still gets the wrap-up line"); }
  /* through the server: a suspect line ends only if the voter ends it; a plain threat ends whatever she says */
  const O = SA.voter.opening.say, ask = async (line, end) => { stub = () => reply({ say: end ? "That's not okay. Goodbye." : "It would. So what would Maya do?", mood: "neutral", end }); const r = await post("/voter", { scenario: "oil", turns: [{ who: "them", text: O }, { who: "you", text: line }] }); return { j: await r.json(), sys: calls[calls.length - 1].system }; };
  let a = await ask("A cut like that would hurt you.", false);
  ok(a.j.end === false && a.j.say === "It would. So what would Maya do?" && JSON.stringify(a.sys).includes(NOTE), "an ordinary sentence the check trips on: she answers and the door stays open: " + JSON.stringify(a.j).slice(0, 80));
  a = await ask("Vote for Maya or I'll beat you up.", true);
  ok(a.j.end === true && JSON.stringify(a.sys).includes(NOTE), "a threat outside the plain wording: she is told to judge it and ends the door");
  a = await ask("I'm going to hurt you.", false);
  ok(a.j.end === true && JSON.stringify(a.sys).includes(HARD + "a threat"), "a plain threat ends the door even when the model does not");
  /* goodbyes (174-8): a goodbye is a parting sentence of its own. Before the phrase only parting lead-ins and names, after
     it only parting words; no question. A line with a voter's name in it is tried at that voter's door. */
  const two = T(["one", "two"]), V = (say) => ({ say, mood: "neutral", end: false });
  const doorOf = (say) => (/\blinda\b/i.test(say) ? L : SA), bye = (say, hers) => farewellIssue(say, hers, doorOf(say).voter.name);
  bad = NOT_BYE_HERS.filter((say) => cleanVoter(V(say), SA, two).end !== false || cleanVoter(V(say), L, two).end !== false);
  ok(NOT_BYE_HERS.length >= 220 && bad.length === 0, `a goodbye phrase used another way does not close an issue door (${NOT_BYE_HERS.length} lines of hers): ` + bad.slice(0, 3).join(" | "));
  ok(NOT_BYE_HERS.filter((say) => FAREWELL.test(say)).length > 150 && cleanVoter(V("I've got two kids to take care of."), K, two).end === true, "main's wording reads most of those as a goodbye, and the intro doors read them as before");
  for (const say of ["$460 a month? Well, goodbye groceries.", "Well, I see you've done your homework.", "Thanks for coming by. I'm listening.", "So what they borrowed has to go back in.", "Oh, good. Let me go inside and get my phone.", "At my age you have to take care of yourself.", "So I can kiss $460 a month goodbye?", "I haven't had a good night's sleep since the bill came."])
    ok(cleanVoter(V(say), SA, two).end === false && cleanVoter(V(say), L, two).end === false, "her line stays hers and the door stays open: " + say);
  bad = NOT_BYE_YOURS.filter((say) => bye(say, false));
  ok(NOT_BYE_YOURS.length >= 130 && bad.length === 0, `a canvasser's line that is not a goodbye is not read as one (${NOT_BYE_YOURS.length} lines, typed and as speech text): ` + bad.slice(0, 3).join(" | "));
  ok(!bye("will i see you tuesday", false) && !bye("We'd love to see you at the polls.", false) && FAREWELL.test("We'd love to see you at the polls.") && !bye("i know its cold and you need to get back inside so ill be quick the state heating help covers renters too", false) && !bye("I'll see you get that link tonight.", false), "so her question after it is not thrown away (a few by name)");
  bad = BYE_HERS.filter((say) => cleanVoter(V(say), doorOf(say), two).end !== true);
  ok(BYE_HERS.length >= 70 && bad.length === 0, `a real goodbye closes an issue door, and so does the way her sheet has her leave (${BYE_HERS.length} lines): ` + bad.slice(0, 3).join(" | "));
  bad = BYE_YOURS.filter((say) => !bye(say, false));
  ok(BYE_YOURS.length >= 30 && bad.length === 0, `the canvasser's goodbyes are read, as typed and as spoken (${BYE_YOURS.length} lines): ` + bad.slice(0, 3).join(" | "));
  for (const say of ["Thanks, Sam, you have a good evening too.", "Good night. Stay warm.", "Okay, see you Tuesday then.", "Take care of yourself.", "Have a good one, okay?", "Thanks. I have to get back inside where it's warm.", "I'd better get back inside. Thanks for explaining.", "Well, I have to get back inside."])
    ok(cleanVoter(V(say), SA, two).end === true, "her goodbye closes the door: " + say);
  ok(!farewellIssue("I have to get back inside soon, but tell me what Maya would do.", true, "Sarah") && !farewellIssue("Okay, but I have to get back inside in a minute.", true, "Sarah") && !farewellIssue("Good night? It's five o'clock.", true, "Sarah") && farewellIssue("Thanks, Linda. See you Tuesday!", false, "Linda"), "going back inside counts only when she is leaving now; a question is never a goodbye");
  ok(BYE_HERS_MISSED.every((say) => !bye(say, true)) && BYE_YOURS_MISSED.every((say) => !bye(say, false)) && NOT_BYE_HERS_READ.every((say) => bye(say, true)) && NOT_BYE_YOURS_READ.every((say) => bye(say, false)), `known gaps, pinned: ${BYE_HERS_MISSED.length + BYE_YOURS_MISSED.length} goodbyes the rule does not read (one more exchange each), ${NOT_BYE_HERS_READ.length + NOT_BYE_YOURS_READ.length} lines it reads wrongly`);
  /* her first reply never closes the door after the fact (the model is asked) */
  { const O = SA.voter.opening.say; stub = () => reply({ say: "Renters can get that?", mood: "neutral", end: false });
    const r = await post("/voter", { scenario: "oil", turns: [{ who: "them", text: O }, { who: "you", text: "That sounds really hard." }, { who: "them", text: "Thanks for coming by.", sig: await signLine(env0, "oil", "Thanks for coming by.", 2) }, { who: "you", text: "The state's heating help covers renters too." }] }), j = await r.json();
    ok(r.status === 200 && j.say === "Renters can get that?" && j.end === false, "a first reply that reads like a goodbye does not end the door on the next line: " + JSON.stringify(j).slice(0, 80)); }
  /* staying in character: what she can't afford is not the model refusing */
  bad = HER_WORDS.filter((say) => outOfCharacterIssue(say, "Sarah") || cleanVoter(V(say), SA, two).say !== say || cleanVoter(V(say), SA, two).broke);
  ok(HER_WORDS.length >= 140 && bad.length === 0, `on an issue door these are her own words, not the model leaving its part (${HER_WORDS.length} lines): ` + bad.slice(0, 3).join(" | "));
  ok(HER_WORDS.filter((say) => outOfCharacter(say, "Sarah")).length > 130 && cleanVoter(V("I can't give you a yes tonight."), K, two).broke === true, "main's check throws nearly all of them away, and the intro doors keep it as it was");
  for (const say of ["I can't give you a yes tonight, but I'll think about it.", "I can't give an answer after one conversation.", "They want proof of income and I can't produce it.", "Seven hundred dollars? I can't write that.", "At 68 I can't generate new income.", "I can't give a man of his character my vote."]) ok(!outOfCharacterIssue(say, "Sarah") && cleanVoter(V(say), SA, two).say === say, "hers: " + say);
  bad = BREAKS.filter((say) => !outOfCharacterIssue(say, "Sarah") || cleanVoter(V(say), SA, two).broke !== true);
  ok(BREAKS.length >= 40 && bad.length === 0, `the model leaving its part is still caught on an issue door (${BREAKS.length} lines): ` + bad.slice(0, 3).join(" | "));
  for (const say of ["I can't generate a response.", "I can't continue this role-play.", "I can't give that kind of response.", "I can't continue as Sarah.", "I can't write Sarah's next line.", "As an AI I should not say."]) ok(outOfCharacterIssue(say, "Sarah"), "the model leaving its part: " + say);
  ok(BREAKS_MISSED.every((say) => !outOfCharacterIssue(say, "Sarah")) && HER_WORDS_LOST.every((say) => outOfCharacterIssue(say, "Sarah")) && HER_WORDS_MAIN.every((say) => outOfCharacterIssue(say, "Sarah") && outOfCharacter(say, "Sarah")), `known gaps, pinned: ${BREAKS_MISSED.length} bare lines let through as hers, ${HER_WORDS_LOST.length} of her lines still thrown away, ${HER_WORDS_MAIN.length} that main's other wording throws away on every door`);
}

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
  /* asked whether she is an AI, the voter never says she is a real person: the server puts the honest line in its place */
  stub = () => reply({ say: "No, I'm " + v.name + ".", mood: "neutral", end: false });
  r = await post("/voter", { scenario: id, turns: [{ who: "them", text: O }, { who: "you", text: "Wait, are you an AI?" }] });
  j = await r.json();
  ok(r.status === 200 && /practice voter, so not a real person/.test(j.say) && j.sig === (await signLine(env0, id, j.say, 2)), id + ": asked if she is an AI, " + v.name + " doesn't deny it: " + JSON.stringify(j.say));
  /* 174-5: the name check is hers on her own door only; Kevin's door reads the answer as main does */
  { const K = SCENARIOS.kevin_intro; stub = () => reply({ say: "No, I'm " + v.name + ".", mood: "neutral", end: false });
    const rk = await post("/voter", { scenario: "kevin_intro", turns: [{ who: "them", text: K.voter.opening.say }, { who: "you", text: "Wait, are you an AI?" }] }), jk = await rk.json();
    ok(rk.status === 200 && jk.say === "No, I'm " + v.name + ".", id + ": Kevin's door is not taught " + v.name + "'s name: " + JSON.stringify(jk.say)); }
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
/* 174-5: "Check this" quotes the words that carry the wrong claim. Linda's choice line is said right and a claim her
   sheet lists as wrong is added at the end; the card must not quote the sentence that was right. A period inside a
   number or "U.S." does not end a sentence, and a line with no periods is cut around the claim. */
{ const s = SCENARIOS.social, O = s.voter.opening.say;
  const check = async (id, line, quote, viaRow) => { const sc = SCENARIOS[id], convo = [{ who: "them", text: sc.voter.opening.say }, { who: "you", text: "You're right to worry." }, { who: "them", text: "Okay." }, { who: "you", text: line }, { who: "them", text: "Okay." }];
    stub = () => reply({ items: sc.rubric.map((r) => ({ id: r.id, status: "missed", evidence: viaRow && r.id === "accurate" ? quote : "", note: "" })), invented: viaRow ? [] : [{ quote, issue: "Not in your materials." }], transcription: [], strength: { text: "", quote: "" }, improvement: { text: "", try_saying: "" }, summary: "" });
    const r = await post("/coach", { scenario: id, turns: convo }), j = await r.json(); return r.status === 200 && j.invented.length === 1 ? j.invented[0].quote : JSON.stringify(j).slice(0, 120); };
  const line = "Jack Dufner voted for the 2025 federal law, which makes the trust fund run out sooner, though it gave people 65 and over a tax break. Maya Kaur would end the wage cap, and that fixes Social Security for good.";
  let q = await check("social", line, "that fixes Social Security for good");
  ok(/fixes Social Security for good/.test(q) && !/tax break/.test(q), "Check this quotes the sentence with the claim, not the start of the line: " + q);
  q = await check("social", line, "that fixes Social Security for good", true);
  ok(/fixes Social Security for good/.test(q) && !/tax break/.test(q), "the same when the coach puts the claim in the facts row: " + q);
  q = await check("oil", "That sounds really hard. Heating oil costs $6.01 a gallon now, up from $3.33 last fall, which is about 80% more. Maya Kaur will get it back down to $3.33 a gallon by Christmas.", "Maya Kaur will get it back down to $3.33 a gallon by Christmas");
  ok(q === "Maya Kaur will get it back down to $3.33 a gallon by Christmas.", "a price keeps its cents: " + q);
  q = await check("social", "You're right to worry about it, and I'm glad you asked me, because a lot of people on this street are asking the same thing this fall. Jack Dufner voted to cut your check by 6.2% last year.", "Jack Dufner voted to cut your check by 6.2% last year");
  ok(q === "Jack Dufner voted to cut your check by 6.2% last year.", "a percentage keeps its decimals: " + q);
  q = await check("oil", "That sounds really hard, and I am sorry, because nobody should have to choose between heat and groceries in a winter like this one. Jack Dufner never voted to end the war with Iran, so the U.S. is still paying for it.", "Jack Dufner never voted to end the war with Iran");
  ok(/^Jack Dufner never voted to end the war with Iran, so the U\.S\. is still paying for it\.$/.test(q), "U.S. does not end a sentence: " + q);
  q = await check("social", "jack dufner voted for the 2025 federal law which makes the trust fund run out sooner though it gave people 65 and over a tax break maya kaur would end the wage cap and that fixes social security for good", "that fixes social security for good");
  ok(/fixes social security for good/.test(q) && q.length <= 160 && q.startsWith("…"), "speech text with no periods is cut around the claim: " + q);
  q = await check("social", "You're right to worry, and I'm glad you asked me about it tonight, because a lot of people on this street are asking. Maya Kaur would end the wage cap. That fixes Social Security for good, so your check is safe forever.", "Maya Kaur would end the wage cap. That fixes Social Security for good");
  ok(/That fixes Social Security for good/.test(q) && q.length <= 160, "a claim the coach quotes across two sentences keeps the words that make it wrong: " + q);
  q = await check("social", "jack dufner voted for the 2025 federal law and maya kaur would end the wage cap so pay above 184500 dollars a year pays social security tax too and can maya count on your vote and ending the wage cap fixes social security for good", "ending the wage cap fixes social security for good");
  ok(/ending the wage cap fixes social security for good$/.test(q) && q.length <= 160, "in speech text the claim said last is shown whole: " + q);
  /* a short line is quoted whole, as on every door */
  const short = [{ who: "them", text: O }, { who: "you", text: "Ending the wage cap fixes Social Security for good." }, { who: "them", text: "Okay." }];
  stub = () => reply({ items: s.rubric.map((r) => ({ id: r.id, status: "missed", evidence: "", note: "" })), invented: [{ quote: "fixes Social Security for good", issue: "Not all of it." }], transcription: [], strength: { text: "", quote: "" }, improvement: { text: "", try_saying: "" }, summary: "" });
  const j2 = await (await post("/coach", { scenario: "social", turns: short })).json();
  ok(j2.invented.length === 1 && j2.invented[0].quote === "Ending the wage cap fixes Social Security for good.", "a short line is quoted whole: " + JSON.stringify(j2.invented)); }
/* 174-4: every voice a voter sheet names is one the voice service has (the server refuses to start otherwise) */
{ const src = (await import("node:fs")).readFileSync(new URL("../worker.js", import.meta.url), "utf8"), m = src.match(/const VOICES = (\[[^\]]+\]);/), VOICES = m ? JSON.parse(m[1]) : [];
  ok(VOICES.length > 30 && ISSUE_IDS.every((id) => [SCENARIOS[id].voter.voice].concat(SCENARIOS[id].voter.voices).every((v) => VOICES.includes(v))), "Sarah's and Linda's voices are ones the server can speak");
  ok(/is not one the server can speak/.test(src), "and a sheet with any other voice is refused when the server starts"); }
console.log(`issues: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
