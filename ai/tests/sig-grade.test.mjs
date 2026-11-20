/* The signature course's graders, replayed: every "Counts" and "Doesn't count" example in the five lessons' grading tables
   (claude/signature-curriculum-claude-v4.md, section 3), the extra replays Robert asked for on Nov 18, and each passerby's
   side of a try. Run: node ai/tests/sig-grade.test.mjs */
import { SIGG } from "../sig/grade.mjs";
import { SIG_SETTINGS, SIG_MEASURE, SIG_LESSONS } from "../sig/content.js";
import { REPLAYS, THREE, HEARD, LET_GO } from "./sig2-replays.mjs";

const ST = Object.assign({}, SIG_SETTINGS, { label: SIG_MEASURE.label });
let pass = 0, fail = 0;
const ok = (c, name) => { if (c) pass += 1; else { fail += 1; console.log("FAIL " + name); } };
const bits = (h) => h.map((x) => (x ? 1 : 0)).join("");
const run = (key, pieces, st) => { const t = SIGG.talk(key, st || ST), said = []; for (const p of pieces) { if (t.end) break; said.push(t.hear(p).say.join("+") || "-"); } return { t, said: said.join(" / "), g: t.grade() }; };
const OPENER = "Hi there! This petition is for longer library hours. Are you registered to vote in LA County?";

/* ---------------- lesson 2 ---------------- */
for (const r of REPLAYS) {
  const g = SIGG.grade(r.say, ST);
  ok(bits(g.hits) === r.parts.join(""), `L2 ${r.id}: ${bits(g.hits)} for "${r.say}"`);
  ok((g.untrue || "") === (r.untrue || ""), `L2 ${r.id}: untrue ${g.untrue}`);
  const ben = run("2.ben", [r.say]).said, want = g.first === "time" ? "time" : g.regAsked ? "stop" : g.topic ? "lib" : "other";
  ok(ben === want, `L2 ${r.id}: Ben says ${ben}, wanted ${want}`);
}
for (const h of HEARD) ok(bits(SIGG.grade(h.say, ST).hits) === h.parts.join(""), `L2 heard: "${h.say}"`);
for (const [say, want] of LET_GO) ok(SIGG.letGo(say) === want, `L2 Kayla: "${say}"`);
{ /* three openers where only the second is good: the best one counts */
  const tries = THREE.openers.map((o) => SIGG.grade(o, ST)), s = SIGG.score2(tries);
  ok(s.pick === 1 && s.n === 4 && SIGG.tipFor(s.hits) === -1, "L2 three openers, only the second is good: the second counts, 4 of 4");
  const t2 = ["Hi there! Save our libraries! Are you registered to vote in LA County?", "Hi. Are you registered to vote?", "Hey, got a second?"].map((o) => SIGG.grade(o, ST)), s2 = SIGG.score2(t2);
  ok(s2.pick === 1 && s2.n === 2, "L2 an opener with a label the measure doesn't support can't be the one that counts");
  const t3 = ["Hi there! Save our libraries! Are you registered to vote in LA County?"].map((o) => SIGG.grade(o, ST)), s3 = SIGG.score2(t3);
  ok(s3.pick === 0 && s3.untrue === "closing" && !s3.hits[1], "L2 when every opener is untrue the score still shows part 2 missed");
  ok(SIGG.score2([SIGG.grade("Hi! Sorry to bother you. This petition is for longer library hours. Are you registered to vote in LA County?", ST)]).alt[3] === true, "L2 an apology gets 'Said sorry first.'");
  ok(SIGG.score2([SIGG.grade("Hi! Do you have a minute? This petition is for longer library hours. Are you registered to vote in LA County?", ST)]).alt[3] === false, "L2 a request for time gets 'Asked for a minute.'");
}
/* the passersby answer what was said */
ok(run("2.ben", [OPENER]).said === "stop", "L2 Ben stops for the opener");
ok(run("2.ben", ["Hi! Do you have a minute?"]).said === "time", "L2 Ben keeps walking when asked for a minute");
ok(run("2.ben", ["Hi there! This petition is for longer library hours!", "Are you registered to vote in LA County?"]).said === "lib / stop", "L2 Ben, told only what it's for, asks what you need, then answers the registered question (v5)");
ok(run("2.ben", ["Hi there! This petition is for longer library hours!", "It's about the library.", "More"]).said === "lib / @go", "L2 Ben asks once what you need and walks on when the registered question never comes (v5)");
ok(run("2.ben", ["Hi, how's it going?", "Are you registered to vote?"]).said === "fSmall / stop" && run("2.ben", ["Hey there.", "Um, hi.", "So.", "Okay."]).said === "fHi / other / other / @go", "L2 Ben says hello back once, asks what this is, asks once more after a dodge, then walks on");
ok(run("2.ben", ["Are you registered to vote?"]).said === "stop", "L2 Ben answers the registered question even with nothing else");
ok(bits(run("2.ben", ["Hi there! This petition is for longer library hours!", "Are you registered to vote in LA County?"]).g.hits) === "1111", "L2 an opener in two pieces is scored as one try");
ok(run("2.soojin", [OPENER]).said === "stop" && run("2.luis", [OPENER]).said === "stop", "L2 Soo-jin and Luis stop for a full opener");
ok(run("2.soojin", ["Are you registered to vote in LA County?"]).said === "stop+other", "L2 Soo-jin answers the question first, then asks what it's for");
ok(run("2.soojin", ["Are you registered to vote in LA County?", "This petition is for longer library hours."]).said === "stop+other / -", "L2 Soo-jin doesn't answer twice");
ok(run("2.soojin", ["Hi there! This petition is for longer library hours."]).said === "lib", "L2 Soo-jin doesn't say she's registered when nobody asked; told what it's for, she asks what you need (v5)");
ok(run("2.soojin", ["Hi there! This petition is for longer library hours.", "Are you registered to vote in LA County?"]).said === "lib / stop", "L2 Soo-jin stops once the question comes");
ok(run("2.luis", ["Library hours. You registered?"]).said === "stop" && run("2.luis", ["Hi! Do you like the library?", "Are you registered to vote?"]).said === "lib / stop", "L2 Luis answers the question he's asked");
ok(run("2.soojin", ["Hi there! How are you today?"]).said === "fSmall" && run("2.soojin", ["Do you have a minute?", "Please?", "Hmm."]).said === "other / other / @go", "L2 told nothing, Soo-jin asks what it's for, once more after a dodge, then walks on");
{ const k = run("2.kayla", ["Do you have a minute?", "It's about the library."]); ok(k.said === "@look / lib" && k.g.asked === false && k.g.from === false, "L2 Kayla doesn't say she isn't registered until she's asked; told what it's about, she asks what you need"); }
{ const k = run("2.kayla", ["Hi there! This petition is for longer library hours.", "Are you registered to vote in LA County?", "No problem. Have a good one!"]); ok(k.said === "lib / not / bye" && bits(k.g.hits) === "1111" && k.g.from === true && /County\?$/.test(k.g.quote), "L2 Kayla: an opener in two pieces is one opener, and she answers once she's asked"); }
ok(SIGG.letGo("Do you want to register?") === false && SIGG.letGo("Okay. Have a good one!") === true, "L2 letting her go takes a thank-you or a goodbye");
ok(SIGG.grade("Hi there! Save our libraries! Are you registered to vote in LA County?", ST).untrueSaid === "save our libraries" && /no new taxes/.test(SIGG.grade("Hi! More library hours and no new taxes. Are you registered to vote in LA County?", ST).untrueSaid), "L2 the correction can quote the untrue words");
{ const k = run("2.kayla", [OPENER, "No problem. Have a good one!"]); ok(k.said === "not / bye" && k.g.from === true && bits(k.g.hits) === "1111", "L2 Kayla: the opener is scored, and letting her go ticks lesson 1"); }
{ const k = run("2.kayla", [OPENER, "That's okay, you can sign anyway."]); ok(k.said === "not / bye" && k.g.from === false, "L2 Kayla: 'sign anyway' doesn't tick lesson 1"); }
{ const k = run("2.kayla", [OPENER, "No worries. You can register at registertovote.ca.gov. Have a good one!"]); ok(k.g.from === true, "L2 Kayla: telling her where to register still counts"); }

/* ---------------- lesson 1 ---------------- */
const L1 = [
  ["Are you registered to vote?", "", "1000"], ["Are you a registered voter?", "", "1000"], ["Do you vote?", "", "0000"], ["Are you a voter?", "", "0000"], ["Do you live around here?", "", "0000"],
  ["Are you registered to vote in LA County?", "", "1100"], ["Are you registered to vote in Los Angeles County?", "", "1100"], ["Are you registered to vote in California?", "", "1000"], ["Are you registered to vote around here?", "", "1000"], ["Are you registered to vote in LA?", "", "1000"],
  ["Are you registered to vote in LA County?", "Only registered voters count.", "1110"], ["Are you registered to vote in LA County?", "You have to be registered or it doesn't count.", "1110"],
  ["Are you registered to vote in LA County?", "The county checks every line.", "1101"], ["Are you registered to vote in LA County?", "Only registered voters count and the rest get thrown out.", "1111"], ["Are you registered to vote in LA County?", "They toss the bad ones.", "1101"],
  ["Are you registered to vote in LA County?", "It's the rule.", "1100"], ["Are you registered to vote in LA County?", "My lead told me to.", "1100"],
  ["Are you registered to vote in LA County?", "Only registered voters in LA County count on this sheet, and the county checks every line.", "1111"],
  ["are you registered to vote in L.A. County", "because only registered voters count and the county checks each signature", "1111"],
];
for (const [q, a, want] of L1) { const g = SIGG.grade1(q, a, ST); ok(bits(g.hits) === want, `L1 "${q}" / "${a}": ${bits(g.hits)}, wanted ${want}`); }
ok(SIGG.grade1("Are you registered to vote in LA County?", "Only registered voters count, so yours will count.", ST).promise === true, "L1 a promise gets the correction");
ok(SIGG.grade1("Are you registered to vote in LA County?", "Only registered voters count.", ST).promise === false, "L1 no promise, no correction");
ok(run("1.marisol", ["Are you registered to vote in LA County?", "Only registered voters count."]).said === "ask / yes", "L1 Marisol asks why, then it makes sense");
ok(run("1.marisol", ["Are you registered to vote in LA County?", "It's the rule."]).said === "ask / other", "L1 Marisol says 'Oh, okay.' to a reason that isn't one");

/* ---------------- lesson 3 ---------------- */
const PAID = "I'm paid to gather signatures, and here are the top funders.", TWO = "It funds longer evening and weekend hours at branch libraries, and it's paid for by a new state tax on digital ad sales.", DBL = "Have you signed this one already?", ASK = "Will you sign to put it on the ballot?";
const L3 = [
  [[PAID, TWO, DBL, ASK].join(" "), "1111"],
  [["I'm with Libraries for All.", TWO, DBL, ASK].join(" "), "0111"],
  [["I'm paid to gather signatures.", TWO, DBL, ASK].join(" "), "0111", { alt0: true }],
  [["Here are this month's top funders.", TWO, DBL, ASK].join(" "), "0111", { alt0: false }],
  /* extra: the paid line said after the pen is handed over */
  [[TWO, DBL, ASK, PAID].join(" "), "0111", { late: true }],
  [[PAID, "It funds longer evening and weekend hours at branch libraries. It's paid for by a new state tax on online ad sales.", DBL, ASK].join(" "), "1111"],
  [[PAID, "It funds longer hours at the library, paid for with a new state tax on digital advertising sales.", DBL, ASK].join(" "), "1111"],
  /* extra: only the hours half of the summary */
  [[PAID, "It funds longer evening and weekend hours at branch libraries.", DBL, ASK].join(" "), "1011", { alt1: false }],
  [[PAID, "It's paid for by a new state tax on digital ad sales.", DBL, ASK].join(" "), "1011", { alt1: true }],
  [[PAID, TWO, "Did you sign the library petition before?", ASK].join(" "), "1111"],
  [[PAID, TWO, ASK].join(" "), "1101"],
  [[PAID, TWO, DBL, "Would you like to sign?"].join(" "), "1111"], [[PAID, TWO, DBL, "Can I get your signature?"].join(" "), "1111"],
  [[PAID, TWO, DBL].join(" "), "1110"], [[PAID, TWO, DBL, "What do you think?"].join(" "), "1110"],
  [[PAID, TWO, DBL, "You have to sign."].join(" "), "1110"], [[PAID, TWO, DBL, "Everybody's signing. Will you sign?"].join(" "), "1110"],
];
for (const [say, want, x] of L3) {
  const g = SIGG.grade3(say, ST);
  ok(bits(g.hits) === want, `L3 "${say.slice(0, 70)}...": ${bits(g.hits)}, wanted ${want}`);
  if (x && "alt0" in x) ok(g.alt[0] === x.alt0, `L3 which half of part 1 was missed: "${say.slice(0, 50)}"`);
  if (x && "alt1" in x) ok(g.alt[1] === x.alt1, `L3 which half of part 2 was missed: "${say.slice(0, 50)}"`);
  if (x && x.late) ok(g.late === true, "L3 the paid line after the ask is too late");
}
for (const [say, kind] of [[[PAID, "It's free.", DBL, ASK].join(" "), "cost"], [[PAID, "It gives libraries more hours with no new taxes.", DBL, ASK].join(" "), "cost"], [[PAID, "It keeps libraries from closing.", DBL, ASK].join(" "), "closing"], [["I'm a volunteer.", TWO, DBL, ASK].join(" "), "volunteer"]]) {
  const g = SIGG.grade3(say, ST); ok(g.untrue === kind && (kind === "volunteer" ? !g.hits[0] : !g.hits[1]), `L3 untrue (${kind}): "${say.slice(0, 60)}"`);
}
ok(SIGG.grade3([PAID, TWO, DBL, ASK].join(" "), Object.assign({}, ST, { funders: "printed" })).hits[0] && SIGG.grade3(["I'm paid to gather signatures.", TWO, DBL, ASK].join(" "), Object.assign({}, ST, { funders: "printed" })).hits[0], "L3 with the funders printed on the petition, the paid line alone counts");
ok(String(SIGG.mustsMissed(3, [false, true, true, true])) === "0" && String(SIGG.mustsMissed(3, [true, false, false, false])) === "1" && SIGG.mustsMissed(3, [true, true, false, false]).length === 0, "L3 parts 1 and 2 are the musts");
{ const m = run("3.marisol", [OPENER, [PAID, TWO, DBL].join(" "), ASK]); ok(m.said === "reg / dbl / yes" && bits(m.g.hits) === "1111" && m.g.from === true, "L3 Marisol: the whole stop, with lesson 2's opener ticked"); }
{ const m = run("3.marisol", [OPENER, [PAID, TWO, DBL, ASK].join(" ")]); ok(m.said === "reg / dbl+yes", "L3 Marisol answers the double question, then says yes"); }
{ const m = run("3.marisol", [OPENER, [PAID, TWO].join(" "), ASK]); ok(m.said === "reg / - / yes" && bits(m.g.hits) === "1101", "L3 Marisol listens while the ask is still coming"); }
{ const m = run("3.marisol", [OPENER, [PAID, TWO, DBL].join(" "), "Okay, great."]); ok(m.said === "reg / dbl / wait" && !m.t.end, "L3 Marisol asks what you need once everything but the ask has been said"); }
{ const m = run("3.marisol", [OPENER, [TWO, DBL, ASK].join(" "), PAID]); ok(m.said === "reg / dbl+yes" && m.t.end && !m.g.hits[0] && String(SIGG.mustsMissed(3, m.g.hits)) === "0", "L3 extra: once she has the pen the try is over, so a paid line after it is missed and the must fires"); }
{ const m = run("3.marisol", ["Hey, got a minute?", [PAID, TWO, DBL, ASK].join(" ")]); ok(m.g.from === false && bits(m.g.hits) === "1111", "L3 a weak opener doesn't tick lesson 2 and doesn't change the score"); }
{ const l = run("3.luis", ["It's the Neighborhood Libraries Act, for longer library hours.", "No problem, once is enough. Thanks!"]); ok(l.said === "signed / go" && l.g.from === true, "L3 Luis: thanked and let go ticks lesson 1"); }
{ const l = run("3.luis", ["It's for longer library hours.", "Just sign again to be safe.", "Okay, never mind. Thanks!"]); ok(l.said === "signed / again / go" && l.g.from === false, "L3 Luis: told to sign again, no tick"); }
{ const t = run("3.tanya", [[PAID, TWO, DBL].join(" "), ASK]); ok(t.said === "nodbl / yes", "L3 Tanya answers the double question, then says yes when she is asked"); }
{ const t = run("3.tanya", [[PAID, TWO, DBL].join(" "), "So yeah."]); ok(t.said === "nodbl / wait", "L3 Tanya asks what you need once everything but the ask has been said"); }
ok(run("3.tanya", ["It's for longer library hours. " + ASK]).said === "yes", "L3 Tanya says yes when asked");

/* ---------------- lesson 4 ---------------- */
const L4 = [
  ["Print your name here.", "print", true], ["Print your name first.", "print", true], ["Fill this out.", "print", false], ["Sign here.", "print", false],
  ["Then the address where you're registered to vote.", "addr", true], ["Your home address, the one on your voter registration.", "addr", true], ["Your address.", "addr", false], ["Your mailing address.", "addr", false],
  ["It has to be in your handwriting.", "self", true], ["I can't write on your line, but I'll hold your bag.", "self", true], ["Sure, what's your address?", "self", false], ["Sure, what's your address?", "agree", true], ["It has to be in your handwriting.", "agree", false],
  ["The signature's still blank. Could you sign right here?", "gap", true], ["Looks good.", "gap", false], ["You're all set.", "gap", false], ["Thank you!", "gap", false], ["Looks good, but you still need to sign.", "gap", true], ["You forgot to sign.", "gap", true],
  ["That'll count.", "promise", true], ["Looks good.", "promise", false],
];
for (const [say, k, want] of L4) ok(SIGG.grade4(say, ST)[k] === want, `L4 ${k} for "${say}"`);
const WALK = "Have you signed this one already? Print your name here, then sign, then the address where you're registered to vote.";
{ const t = run("4.tanya", [WALK, "It has to be in your handwriting. I'll hold her hand.", "The signature's still blank. Could you sign right here?"]); ok(t.said === "nodbl+ask / self+@fill+set / oops+@sign+there" && bits(t.g.hits) === "1111" && t.g.from === true, "L4 Tanya: the whole line, with lesson 3's question ticked"); }
{ const t = run("4.tanya", [WALK, "It has to be in your handwriting.", "Looks good, thanks!"]); ok(t.said === "nodbl+ask / self+@fill+set / good+@glowSig" && bits(t.g.hits) === "1110", "L4 Tanya walks off with the box empty, and the screen lights it up"); }
{ /* extra: agreeing to write the address */
  const t = run("4.tanya", [WALK, "Sure, I can write it. What's your address?", "The signature's still blank. Could you sign right here?"]);
  ok(t.said === "nodbl+ask / @fillOther+set / oops+@sign+there+@glowAddr" && bits(t.g.hits) === "1101" && String(SIGG.mustsMissed(4, t.g.hits)) === "2" && t.g.alt[2] === false, "L4 extra: agreeing to write the address misses the must");
}
{ const t = run("4.tanya", ["Print your name here, then the address where you're registered to vote.", "It has to be in your handwriting.", "You're all set."]); ok(t.said === "ask0 / self+@fill+set / good+@glowSig" && t.g.from === false, "L4 Tanya doesn't answer a double question nobody asked"); }
{ const t = run("4.tanya", [WALK, "Hmm.", "Well.", "Could you sign right here?"]); ok(t.said === "nodbl+ask / - / - / @fill+set" && !t.g.hits[2] && t.g.alt[2] === true, "L4 saying nothing about who writes doesn't count: after four lines she writes it herself"); }
{ const a = run("4.anika", ["It has to be in your handwriting, but I can hold a bag."]); ok(a.said === "self" && bits(a.g.hits) === "0010", "L4 Anika picks up the pen"); }
{ const a = run("4.anika", ["Sure, what is it?"]); ok(a.said === "agree" && a.g.wrote === true, "L4 Anika gives her address when the canvasser agrees"); }

/* ---------------- lesson 5 ---------------- */
const L5 = [
  ["Yes, it's a new state tax on digital ad sales.", "tax", { straight: true }], ["No, I'm paid to gather signatures.", "paid", { straight: true, paid: true }], ["I don't know, but it's printed right here.", "tax", { straight: true, shows: true }],
  ["Don't worry about that.", "tax", { straight: false, untrue: null }], ["It's all about keeping libraries open later.", "tax", { straight: false, untrue: null }],
  ["No, there's no tax.", "tax", { straight: false, untrue: "tax" }], ["It's only a few cents.", "tax", { straight: false, untrue: "tax" }], ["I'm a volunteer.", "paid", { straight: false, untrue: "volunteer" }], ["Yes.", "paid", { straight: false, untrue: "volunteer" }],
  ["It's printed right here.", "tax", { shows: true }], ["Here's the summary, take a look.", "tax", { shows: true }], ["The top funders are on this sheet.", "paid", { shows: true }], ["Yes, it's a new tax.", "tax", { shows: false }],
  ["Yes, it's a new state tax. Want to sign?", "tax", { ask: true, straight: true }], ["Yes, it's a new state tax.", "tax", { ask: false }],
  ["Yes. It's a new state tax on digital advertising sales. That's how it pays for the longer hours. It's printed right here in the summary. Take a look.", "tax", { straight: true, shows: true, untrue: null }],
  ["Yes.", "tax", { straight: true }], ["No problem.", "paid", { straight: false, untrue: null }],
];
for (const [say, kind, want] of L5) { const a = SIGG.answer5(say, kind, ST); for (const k of Object.keys(want)) ok(a[k] === want[k], `L5 ${k} for "${say}" (${kind}): ${a[k]}`); }
for (const [say, want] of [["But don't you care about libraries?", true], ["Are you sure? It would really help.", true], ["Come on, it's just one signature.", true], ["Will you sign anyway?", true], ["No problem. Thanks for stopping.", false], ["Okay. Have a good one.", false]]) ok(SIGG.argues(say) === want, `L5 argues: "${say}"`);
ok(run("5.hank", ["Yes, it's a new state tax on digital ad sales."]).said === "straight" && run("5.hank", ["Don't worry about that part."]).said === "dodge" && run("5.hank", ["No, there's no tax."]).said === "dodge", "L5 Hank: a straight yes, a dodge and a no");
{ const b = run("5.ben", ["No, I'm paid to gather signatures. It's printed right here. Want to sign?", "Print your name here, then sign, then the address where you're registered to vote."]); ok(b.said === "paid+yes+@hint / -" && b.g.straight && b.g.shows && b.g.ask && b.g.from === true, "L5 Ben: told straight, signs, and the line from lesson 4 is ticked"); }
{ const b = run("5.ben", ["No, I'm paid.", "Would you like to sign?", "Sign here."]); ok(b.said === "paid / yes+@hint / -" && b.g.from === false, "L5 Ben: the ask can come in a second piece"); }
{ const b = run("5.ben", ["Yes, I'm a volunteer."]); ok(b.said === "-" && b.t.end && b.g.untrue === "volunteer", "L5 Ben: saying you're a volunteer ends the try for the correction"); }
{ const p = run("5.pat", ["Yes, it's a new state tax on digital ad sales. It's printed right here. Want to sign?", "No problem. Thanks for stopping."]); ok(p.said === "no1+no2 / thanks" && p.g.straight && p.g.shows && p.g.ask && p.g.let, "L5 Pat: straight, shown, asked once and let go"); }
{ const p = run("5.pat", ["Yes, it's a new state tax.", "Want to sign?", "Okay, thank you."]); ok(p.said === "- / no1+no2 / thanks" && p.g.ask === true, "L5 Pat listens to an answer that is still coming"); }
{ const p = run("5.pat", ["Yes, it's a new state tax on digital ad sales. It's printed right here in the summary."]); ok(p.said === "wait" && !p.t.end, "L5 Pat asks what you want when the answer and the page come with no ask"); }
{ /* extra: an argument after a no */
  const p = run("5.pat", ["Yes, it's a new state tax. It's printed right here. Want to sign?", "But don't you care about libraries?"]);
  ok(p.said === "no1+no2 / argue" && p.g.let === false && p.g.argued === true, "L5 extra: an argument after a no gets 'Like I said, no thanks.'");
  const b = SIGG.talk("5.ben", ST); b.hear("No, I'm paid to gather signatures. Want to sign?"); b.hear("Print your name, then the address where you're registered to vote.");
  const s = SIGG.score5(b.grade(), p.g); ok(bits(s.hits) === "1110" && SIGG.tipFor(s.hits) === 3, "L5 extra: the argument costs part 4 and the tip is about letting a no go");
}
{ /* extra: "No, there's no tax" */
  const p = run("5.pat", ["No, there's no tax. Want to sign?"]);
  ok(p.said === "dodge" && p.t.end && p.g.untrue === "tax", "L5 extra: 'No, there's no tax' gets \"That isn't what I asked\" and ends the try for the correction");
  const b = SIGG.talk("5.ben", ST); b.hear("No, I'm paid to gather signatures. Want to sign?"); b.hear("Print your name.");
  const s = SIGG.score5(b.grade(), p.g); ok(s.untrue === "tax" && !s.hits[0] && s.alt[0] === true && String(SIGG.mustsMissed(5, s.hits)) === "0", "L5 extra: an untrue answer never passes, even after a straight one, and the must fires");
}
{ const p = run("5.pat", ["Don't worry about that. It's about libraries. Want to sign?", "Thanks anyway."]); ok(p.said === "no2 / thanksDodge" && p.g.straight === false, "L5 Pat doesn't thank a canvasser for a straight answer she didn't get: \"Okay. Bye now.\""); }

/* ---------------- shared ---------------- */
ok(SIGG.misheard("") && SIGG.misheard("um uh") && SIGG.misheard("the", true) && !SIGG.misheard("Yes.") && !SIGG.misheard("Hi", true) && !SIGG.misheard("Okay."), "misheard speech isn't a try, and one real word is an answer");
ok(SIGG.pauseMs("Hi there") === 2800 && SIGG.pauseMs("Hi there longer library hours are you registered to vote in LA") === 2800 && SIGG.pauseMs("Hi I'm um") === 2800 && SIGG.pauseMs(OPENER) === 1200 && SIGG.pauseMs("It has to be in your handwriting") === 1200, "a passerby waits 1.2 seconds after a finished line and 2.8 mid-thought or under three words");
{ const t = SIGG.talk("3.tanya", ST); let n = 0; for (let i = 0; i < 9 && !t.end; i += 1) { t.hear("It funds longer hours."); n += 1; } ok(n <= 4, "a try is over after four of the canvasser's lines at most"); }
for (const n of [1, 2, 3, 4, 5]) ok(SIG_LESSONS[n].parts.length === 4 && SIG_LESSONS[n].parts.every((p) => p.name && p.done && p.missed && p.tip) && SIG_LESSONS[n].steps.reduce((a, s) => a + s.secs, 0) === { 1: 303, 2: 287, 3: 309, 4: 307, 5: 297 }[n], `lesson ${n} has four parts with done, missed and tip lines, and version 5's seconds`);
ok([SIG_LESSONS[3].parts[0], SIG_LESSONS[3].parts[1], SIG_LESSONS[4].parts[2], SIG_LESSONS[5].parts[0]].every((p) => /(?: is|that's) a must\. Try it once more\.$/.test(p.must) && p.step) && !SIG_LESSONS[1].parts.some((p) => p.must) && !SIG_LESSONS[2].parts.some((p) => p.must), "the musts are lesson 3's parts 1 and 2, lesson 4's part 3 and lesson 5's part 1");

/* ---------------- Nov 18, after the outside review of lessons 1, 3, 4 and 5: a try said one sentence at a time, a goodbye,
   something untrue in any lesson, and passersby who answer what was said ---------------- */
const WHY = "Only registered voters count, and the county checks every line.";
{ const m = run("1.marisol", ["Are you registered to vote", "in LA County?", WHY]); ok(m.said === "ask / - / yes" && bits(m.g.hits) === "1111", "L1 the county said after the question still names the county, and she waits for the why"); }
{ const m = run("1.marisol", [WHY, "Are you registered to vote in LA County?"]); ok(m.said === "- / yes" && bits(m.g.hits) === "1111", "L1 the why said first, then the question: scored together, and she doesn't ask why"); }
{ const m = run("1.marisol", ["Are you registered to vote in LA County? " + WHY]); ok(m.said === "yes" && m.t.end && bits(m.g.hits) === "1111", "L1 the question and the why in one breath"); }
{ const m = run("1.marisol", ["Are you registered to vote in LA County?", "It's the rule."]); ok(m.said === "ask / other" && bits(m.g.hits) === "1100", "L1 the question's own \"registered\" doesn't count as the reason"); }
{ const m = run("1.marisol", ["Are you registered to vote?", "Only registered voters in LA County count on this sheet, and the county checks every line."]); ok(bits(m.g.hits) === "1011", "L1 the county inside the reason doesn't name the county in the question"); }
{ const m = run("1.marisol", ["Hi, I'm a volunteer. Are you registered to vote in LA County?", "Only registered voters count, the county checks every line, and it's free, there's no tax."]); ok(m.g.untrue === "volunteer" && /volunteer/.test(m.g.untrueSaid), "L1 \"I'm a volunteer\" never passes"); }
{ const m = run("1.marisol", ["Are you registered to vote in LA County?", "Only registered voters count and it keeps libraries from closing."]); ok(m.g.untrue === "closing", "L1 \"it keeps libraries from closing\" never passes"); }
{ const m = run("1.marisol", ["Are you registered to vote in LA County?", WHY]); ok(m.g.untrue === null && m.g.promise === false, "L1 a clean answer has nothing untrue in it"); }
{ const m = run("1.marisol", ["Never mind, bye!"]); ok(m.said === "fBye" && m.t.end, "L1 a goodbye ends it, with her goodbye"); }
{ const m = run("1.marisol", ["Hi there!", "Um, hello."]); ok(m.said === "fHi / -" && m.t.end, "L1 no question in two lines: she says hi back, walks on, and doesn't answer a question nobody asked"); }

{ const m = run("3.marisol", [OPENER, PAID, TWO, DBL, ASK]); ok(m.said === "reg / - / - / dbl / yes" && bits(m.g.hits) === "1111" && m.g.from === true, "L3 the ask said one sentence at a time: she listens, and all four parts count"); }
{ const m = run("3.marisol", [OPENER + " " + [PAID, TWO, DBL, ASK].join(" ")]); ok(m.said === "reg+dbl+yes" && bits(m.g.hits) === "1111" && m.g.from === true, "L3 the opener and the whole ask in one breath"); }
{ const m = run("3.marisol", [OPENER, "I'm paid to gather signatures, and here are the top funders.", "It funds longer evening and weekend hours at branch libraries, and it's paid for by a new state tax on digital ad sales."]); ok(m.said === "reg / - / -" && !m.t.end, "L3 three lines in, with the ask still to come: the stop isn't over"); }
{ const m = run("3.marisol", [OPENER, "How's your day going?", "Um, so."]); ok(m.said === "reg / - / wait" && !m.t.end, "L3 small talk gets a beat before she asks what you need"); }
{ const m = run("3.marisol", [OPENER, "Oh, never mind. Thanks anyway, bye!"]); ok(m.said === "reg / fBye" && m.t.end, "L3 a goodbye ends Marisol's stop with no question tacked on"); }
{ const m = run("3.marisol", ["Hi there! This petition is for longer library hours."]); ok(m.said === "lib" && !m.t.end, "L3 Marisol doesn't say she's registered before she is asked; told what it's for, she asks what you need (v5)"); }
{ const m = run("3.marisol", [OPENER, [PAID, TWO, DBL].join(" "), "You have to sign."]); ok(m.said === "reg / dbl / fPush" && bits(m.g.hits) === "1110" && m.g.vague[3] === true, "L3 told she has to sign: \"I'd rather decide for myself\", and the part is \"Pushed her to sign\""); }
{ const m = run("3.marisol", [OPENER, [TWO, DBL, ASK, "By the way, I'm paid to gather signatures, and here are the top funders."].join(" ")]); ok(bits(m.g.hits) === "0111" && m.g.vague[0] === true, "L3 the paid line after the ask: the must is missed, and not as \"didn't say you're paid\""); }
{ const m = run("3.marisol", [OPENER, [TWO, DBL, ASK].join(" ")]); ok(bits(m.g.hits) === "0111" && m.g.vague[0] === false, "L3 no paid line at all is \"didn't say you're paid\""); }
{ const t = run("3.tanya", ["Never mind. Have a good day, bye!"]); ok(t.said === "fBye" && t.t.end, "L3 a goodbye ends Tanya's stop"); }
{ const t = run("3.tanya", ["It's for longer library hours. You have to sign."]); ok(t.said === "fPush" && !t.t.end, "L3 Tanya, told she has to sign, says she'd rather decide for herself"); }
{ const t = run("3.tanya", ["It's free, it won't cost you a thing. Will you sign?"]); ok(t.g.untrue === "cost" && /free|cost/.test(t.g.untrueSaid), "L3 the untrue words are kept for the card"); }
{ const l = run("3.luis", ["Hi, how are you?", "Bye."]); ok(l.said === "fSmall / fBye" && run("3.luis", ["Hi there!", "Are you registered?", "It's for longer library hours."]).said === "fHi / what / signed", "L3 Luis says hello back, asks what it's for until he hears, then says what he thinks"); }

const LINE = "Print your name here, then sign, then the address where you're registered to vote.";
{ const t = run("4.tanya", [DBL, "Print your name here.", "Then the address where you're registered to vote.", "It has to be in your handwriting. I can hold your bag.", "The signature's still blank. Could you sign right here?"]);
  ok(t.said === "nodbl+ask / - / - / self+@fill+set / oops+@sign+there" && bits(t.g.hits) === "1111" && t.g.from === true, "L4 the line said one sentence at a time: all four parts count and the must is kept"); }
{ const t = run("4.tanya", [LINE, DBL]); ok(t.said === "ask0 / nodbl" && !t.t.end, "L4 the double question asked after the walk-through still gets its answer"); }
{ const t = run("4.tanya", [WALK, "It has to be in your handwriting.", LINE]); ok(t.said === "nodbl+ask / self+@fill+set / good+@glowSig" && bits(t.g.hits) === "1110", "L4 saying the walk-through again names no gap"); }
{ const t = run("4.tanya", [WALK, "It has to be in your handwriting.", "You still need to sign right here."]); ok(bits(t.g.hits) === "1111", "L4 naming the empty box counts"); }
{ const t = run("4.tanya", [WALK, "Hmm.", "Uh.", "Okay."]); ok(t.said === "nodbl+ask / - / - / @fillOther+set" && t.g.hits[2] === false, "L4 \"Okay.\" to her ask is agreeing to write it"); }
{ const t = run("4.tanya", [WALK, "Hmm.", "Uh.", "Well.", "It has to be in your handwriting, by the way.", "Could you sign right here?"]); ok(t.said === "nodbl+ask / - / - / @fill+set / - / oops+@sign+there" && t.g.hits[2] === true, "L4 said late that it has to be her writing, after she wrote it herself: it counts"); }
{ const t = run("4.tanya", ["I'm a volunteer. " + WALK, "It has to be in your handwriting.", "Could you sign right here?"]); ok(t.g.untrue === "volunteer" && bits(t.g.hits) === "1111", "L4 \"I'm a volunteer\" never passes, whatever the score"); }
{ const t = run("4.tanya", ["Never mind then, bye!"]); ok(t.said === "fBye" && t.t.end, "L4 a goodbye ends Tanya's stop"); }
{ const t = run("4.tanya", [WALK, "Never mind then, bye!"]); ok(t.said === "nodbl+ask / fBye" && t.t.end && t.g.vague[3] === true, "L4 a goodbye before she writes: no line about an empty box she never left"); }
{ const a = run("4.anika", ["Never mind, have a nice day!"]); ok(a.said === "fBye" && a.t.end, "L4 a goodbye ends Anika's stop"); }

{ const b = run("5.ben", ["No, I'm paid to gather signatures.", "It's printed right here.", "Want to sign?", LINE]); ok(b.said === "paid / noask / yes+@hint / -" && b.g.straight && b.g.shows && b.g.ask && b.g.from, "L5 Ben: the answer, the page (\"Is there something you want me to sign?\") and the ask one at a time"); }
{ const b = run("5.ben", ["I'm just here for the libraries.", "Want to sign?"]); ok(b.said === "dodge / yes+@hint" && !b.g.straight, "L5 Ben asks his question once more after a dodge"); }
{ const b = run("5.ben", ["Never mind, bye!"]); ok(b.said === "fBye" && b.t.end, "L5 a goodbye ends Ben's stop"); }
{ const b = run("5.ben", ["Yes, I'm a volunteer.", "Want to sign?", LINE], Object.assign({}, ST, { again: true })); ok(b.said === "- / yes+@hint / -" && b.g.untrue === "volunteer" && /volunteer/.test(b.g.untrueSaid), "L5 on the one more try, something untrue doesn't cut the try short. It still can't pass"); }
{ const p = run("5.pat", ["Yes, it's a new state tax on digital ad sales. It's printed right here. Want to sign?", "Okay."]); ok(p.g.let === true, "L5 Pat: \"Okay.\" lets the no go"); }
{ const p = run("5.pat", ["Yes, it's a new state tax on digital ad sales. It's printed right here. Want to sign?", "Hmm."]), s = SIGG.score5(run("5.ben", ["No, I'm paid. Want to sign?", LINE]).g, p.g); ok(s.hits[3] === false && s.vague[3] === true, "L5 a no that wasn't argued with isn't called an argument"); }
{ const p = run("5.pat", ["Yes, it's a new state tax on digital ad sales. It's printed right here. Want to sign?", "But don't you care about libraries?"]), s = SIGG.score5(run("5.ben", ["No, I'm paid. Want to sign?", LINE]).g, p.g); ok(s.hits[3] === false && s.vague[3] === false, "L5 an argument after a no is called one"); }
{ const p = run("5.pat", ["Well, it's mostly about keeping libraries open later.", "Yes, it's a new state tax. Want to sign?"]); ok(p.said === "dodge / no1+no2", "L5 Pat asks her question once more after a dodge"); }
{ const p = run("5.pat", ["No, there's no tax."]); ok(p.t.end && p.g.untrue === "tax" && /no tax|no/.test(p.g.untrueSaid), "L5 \"No, there's no tax\" stops the try, with the words kept for the card"); }
{ const h = run("5.hank", ["No, there's no tax."]); ok(h.g.untrue === "tax", "L5 the 1st try card can say what wasn't true"); }
ok(SIGG.bye("Have a good one!") && SIGG.bye("ok bye") && !SIGG.bye("Will you sign to put it on the ballot?") && !SIGG.bye("Thanks for stopping."), "a goodbye is a goodbye");

/* ---------------- version 3 and 4 (Nov 19) ---------------- */
{ const g = SIGG.grade("Hi there! Longer library hours. Are you registered to vote in LA County?", ST), s2 = SIGG.score2([g]); ok(bits(g.hits) === "1011" && g.topicOnly && s2.alt[1] === true, "L2 the topic words on their own: part 2 missed, with \"Said only the topic, not what the petition is for.\""); }
ok(bits(SIGG.grade("Hi! I'm gathering signatures for longer library hours. Are you registered to vote in LA County?", ST).hits) === "1111" && bits(SIGG.grade("Hi there! It funds longer library hours. Are you registered to vote in LA County?", ST).hits) === "1111", "L2 the topic after \"for\" or a verb is a sentence that says what the petition is for");
ok(bits(SIGG.grade("Hi there! Are you registered to vote in LA County? Longer library hours.", ST).hits) === "1011", "L2 the registered question's own \"are\" doesn't make the topic a sentence");
{ const m = run("1.marisol", ["Do you vote?", "Only registered voters count, and the county checks every line."]); ok(m.said === "askOther / yes", "L1 asked anything else, Marisol says \"Me? I vote in every election. Why do you ask?\""); }
{ const m = run("3.marisol", ["Hi there!", "I'm paid to gather signatures."]); ok(m.said === "what / -", "L3 a bare hello gets \"Hi. What's this one for?\", then she listens"); }
{ const m = run("3.marisol", ["Hi, can I talk to you?"]); ok(m.said === "what", "L3 an opener that says nothing about the petition: \"Hi. What's this one for?\""); }
{ const a = run("4.anika", ["Um, let me think.", "Hmm."]); ok(a.said === "other / -" && a.t.end, "L4 Anika, neither helped nor told: \"So can you write it for me?\" once"); }
{ const p = run("5.pat", ["Yes, it's a new state tax on digital ad sales. It's printed right here. Want to sign?", "Can I get your signature anyway?"]); ok(p.said === "no1+no2 / argue" && SIGG.score5({ straight: true, shows: true, ask: true }, p.g).alt[3] === true, "L5 asking again after a no gets \"Asked again after a no.\""); }
{ const k = run("2.kayla", ["Hi there!", "Bye now."]); ok(k.said === "fHi / fBye" && k.t.end, "L2 Kayla says hello back, and a goodbye ends it with hers"); }
/* the outside review's cases (Nov 19, 10:48 PM) */
const P2 = (x) => SIGG.grade(x, ST).hits[1];
ok(P2("Hi there! Longer library hours is what this petition is for. Are you registered to vote in LA County?") && P2("Hi! Longer library hours, that's what we're asking for. Are you registered to vote in LA County?"), "L2 a sentence with the topic first says what the petition is for");
ok(P2("Hi! For longer library hours! Are you registered to vote in LA County?") && P2("Hi! Signatures for longer library hours! Are you registered to vote in LA County?") && !P2("Hi there! Help the library! Are you registered to vote in LA County?") && !P2("Hi! Support your library! Are you registered to vote in LA County?") && SIGG.grade("Hi! Support your library! Are you registered to vote in LA County?", ST).topicOnly, "L2 v5 (Robert, Nov 20): the hours after \"for\" count, and a plea for the library is only the topic");
/* version 5, Robert's answers (Nov 20, 12:21 AM) */
{ const g = SIGG.grade("Hi there! This petition is for the library. Are you registered to vote in LA County?", ST); ok(!g.hits[1] && g.topicOnly && g.alt[1], "L2 v5: \"This petition is for the library.\" never says what it does, so it's only the topic"); }
ok(P2("Hi there! Longer library hours is what this petition is for. Are you registered to vote in LA County?") && P2("Hi! We want more library hours. Are you registered to vote in LA County?") && P2("Hi! It funds evening and weekend hours at branch libraries. Are you registered to vote in LA County?") && P2("Hi! Help us keep libraries open later. Are you registered to vote in LA County?"), "L2 v5: the hours after a verb count, and a verb right after them too");
ok(!P2("Hi! Longer library hours. Are you registered to vote in LA County?") && !P2("Hi! Longer evening hours! Are you registered to vote in LA County?"), "L2 v5: the hours alone, with no \"for\" or verb, don't count");
{ const g = SIGG.grade("Hi there! Save our libraries. Are you registered to vote in LA County?", ST); ok(g.miss[1] === "Untrue", "L2 v5: something the measure doesn't say gets its own missed line"); }
{ const g = SIGG.grade("Hi there! We are out here today gathering signatures for a measure that would fund longer evening and weekend hours at branch libraries. Are you registered to vote in LA County?", ST); ok(!g.hits[1] && g.miss[1] === "Long", "L2 v5: too much before the question gets its own missed line"); }
{ const g = SIGG.grade("Hi there! This petition is for longer library hours. Are you registered to vote in LA County? Sorry to bother you.", ST); ok(!g.hits[3] && g.miss[3] === "Sorry" && !g.alt[3], "L2 v5 sweep: a sorry after the question gets \"Said sorry.\""); }
{ const s2 = SIGG.score2([SIGG.grade("Hi there! Save our libraries. Are you registered to vote in LA County?", ST)]); ok(s2.miss && s2.miss[1] === "Untrue", "L2 v5: the best-of-three score keeps the named miss"); }
{ const P = SIG_LESSONS[2].parts; ok(P[1].name === "Says what the petition is for" && P[1].missedLong === "Said too much before the question." && P[1].missedUntrue === "Said something the measure doesn't say." && P[3].missedSorry === "Said sorry.", "L2 v5: part 2's new name and missed lines, part 4's sorry line"); }
{ const g3 = SIGG.grade3("I'm paid to gather signatures, and here are this month's top funders. It keeps our libraries from closing, and it's paid for by a new state tax on digital ad sales. Have you signed this one already? Will you sign to put it on the ballot?", ST); ok(!g3.hits[1] && g3.miss[1] === "Untrue" && SIG_LESSONS[3].parts[1].missedUntrue === "Said something the measure doesn't say.", "L3 v5 sweep: part 2 with something the measure doesn't say gets that line"); }
ok(SIG_LESSONS[4].parts[3].missedVague === "Let her go before she filled in the line." && SIG_LESSONS[5].parts[3].missedAlt === "Asked again after a no." && !SIG_LESSONS[5].parts[3].missedAsk, "L4 and L5 v5 sweep: every way part 4 can be missed has a line, and lesson 5's shows");
ok(run("1.marisol", ["Hi there! This petition is for longer library hours."]).said === "lib" && run("1.marisol", ["Hi there! This petition is for longer library hours.", "Are you registered to vote in LA County?"]).said === "lib / ask", "L1 v5: told only what it's for, she asks what you need, then answers the registered question");
ok(run("1.marisol", ["Do you vote?"]).said === "askOther", "L1 v5: asked another question, she still says she votes and asks why");
ok(run("2.kayla", ["Hi there! This petition is for longer library hours."]).said === "lib" && run("2.kayla", ["Hi, excuse me."]).said !== "not", "L2 v5: Kayla says she isn't registered only once asked");
{ const g = SIGG.grade("Hi there! It's the Neighborhood Libraries Act. Are you registered to vote in LA County?", ST); ok(!g.hits[1] && !g.topicOnly, "L2 the measure's name isn't what it's for"); }
{ const g = SIGG.grade("Hey there, quick question, are you registered to vote in LA County? It's for longer library hours, more evening and weekend hours at the branch libraries.", ST); ok(g.hits[1] && !g.long, "L2 words after the question don't make the opener run long"); }
{ const g = SIGG.grade("Hi there! We are out here today gathering signatures for a measure that would fund longer evening and weekend hours at branch libraries. Are you registered to vote in LA County?", ST), s2 = SIGG.score2([g]); ok(!g.hits[1] && g.vague[1] && !s2.alt[1] && s2.vague[1], "L2 a long explanation gets the part's own row, not \"Didn't say what the petition is for.\""); }
{ const g = SIGG.grade("Hi there! This petition is for longer library hours. Are you registered to vote in LA County? Sorry!", ST); ok(!g.hits[3] && !g.alt[3] && g.vague[3], "L2 a sorry after the question isn't \"Said sorry first.\""); }
ok(run("2.ben", ["Come on, just sign it."]).said === "fPush" && run("2.luis", ["You should just sign it.", "Okay."]).said === "fPush / other", "L2 a push to sign gets \"I'd rather decide for myself.\"");
/* the outside review of version 5 (Nov 20, 1:02 AM) */
{
  const TOP = "Hi there! This petition is for longer library hours.", REG = "Are you registered to vote in LA County?";
  const PAID = "I'm paid to gather signatures, and here are this month's top funders.", TWO = "It funds longer evening and weekend hours at branch libraries, and it's paid for by a new state tax on digital ad sales.";
  ok(run("2.ben", ["Hi! Do you vote?", "This petition is for longer library hours.", REG]).said === "other / lib / stop", "review 1: Ben asks what this is, hears what it's for, asks what you need, then answers the question");
  ok(run("2.ben", ["Hi!", "What's up?", TOP]).said === "fHi / other / lib", "review 1: Ben doesn't walk off once he's told what it's for");
  ok(run("2.soojin", ["Hi! Do you vote?", "It's for longer library hours.", REG]).said === "other / lib / stop" && run("2.luis", ["Hi! Got a sec?", "It's for longer library hours.", REG]).said.endsWith("lib / stop"), "review 1: Soo-jin and Luis stay for the question after asking what this is");
  ok(run("2.kayla", ["Hi, how are you?", "I'm good.", TOP]).said === "fSmall / @look / lib", "review 1: Kayla asks what you need once she hears what it's for");
  { const m = run("3.marisol", [TOP, REG, PAID, TWO, "Have you signed this one already?", "Will you sign to put it on the ballot?"]); ok(/yes$/.test(m.said) && m.g.hits[3], "review 2: an opener in two pieces leaves the ask its four lines in lesson 3 (" + m.said + ")"); }
  ok(run("1.marisol", [TOP, "It keeps branches open evenings."]).said === "lib / -" && run("1.marisol", ["Hi, how are you?", "Good."]).said === "fSmall / -" && run("1.marisol", ["Do you have a minute?"]).said === "-", "review 3 and 10: she says she votes only when asked about voting; anything else, she waits");
  ok(run("1.marisol", [TOP, "It keeps branches open evenings.", REG]).said === "lib / - / ask", "review 3: the real question after a statement gets her answer");
  { const g = SIGG.grade("Hi! Help our libraries stay open! " + REG, ST); ok(!g.hits[1] && g.untrue === "closing", "review 4: \"stay open\" is the closing story, not the hours"); }
  ok(SIGG.grade3([PAID, "It helps our libraries stay open, and it's paid for by a new state tax on digital ad sales.", "Have you signed this one already?", "Will you sign?"].join(" "), ST).untrue === "closing", "review 4: lesson 3 flags \"stay open\" too");
  ok(P2("Hi! Support longer library hours! " + REG) && P2("Hi! Help us win longer library hours! " + REG) && P2("Hi! Do you have a minute to hear about longer library hours? " + REG), "review 5: the hours after common verbs count");
  ok(!P2("Hi! We need more signatures for library hours. " + REG) && !P2("Hi! It's about library hours. Can I catch you later? " + REG), "review 6: \"more signatures\" and \"catch you later\" aren't the hours");
  ok(P2("Hi! Are you registered to vote for longer library hours in LA County?") && P2("Hi! Are you registered to vote in LA County for longer library hours?"), "review 7: word order doesn't flip the score");
  { const g3 = SIGG.grade3("I'm paid to gather signatures. " + TWO + " Have you signed this one already? Will you sign to put it on the ballot? Here are this month's top funders.", ST); ok(!g3.hits[0] && g3.miss[0] === "FundersLate" && SIG_LESSONS[3].parts[0].missedFundersLate === "Showed the top funders too late.", "review 8: funders after the ask get their own line"); }
  { const g = SIGG.grade("Hi there! I'm gathering signatures for a petition for longer evening and weekend hours at our branch libraries.", ST); ok(g.miss[1] !== "Long" && !g.long, "review 9: with no question, nothing ran long before it"); }
  ok(SIGG.grade("Hi! This petition is for longer library hours, and it costs you nothing. " + REG, ST).untrue === "cost", "review 11: \"costs you nothing\" isn't true");
}

console.log(`sig-grade: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
