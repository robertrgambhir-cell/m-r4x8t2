/* The signature course's graders, replayed: every "Counts" and "Doesn't count" example in the five lessons' grading tables
   (claude/signature-curriculum-claude-v2.md, section 3), the extra replays Robert asked for on Nov 18, and each passerby's
   side of a try. Run: node ai/tests/sig-grade.test.mjs */
import { SIGG } from "../sig/grade.mjs";
import { SIG_SETTINGS, SIG_MEASURE, SIG_LESSONS } from "../sig/content.js";
import { REPLAYS, THREE, HEARD, LET_GO } from "./sig2-replays.mjs";

const ST = Object.assign({}, SIG_SETTINGS, { label: SIG_MEASURE.label });
let pass = 0, fail = 0;
const ok = (c, name) => { if (c) pass += 1; else { fail += 1; console.log("FAIL " + name); } };
const bits = (h) => h.map((x) => (x ? 1 : 0)).join("");
const run = (key, pieces, st) => { const t = SIGG.talk(key, st || ST), said = []; for (const p of pieces) { if (t.end) break; said.push(t.hear(p).say.join("+") || "-"); } return { t, said: said.join(" / "), g: t.grade() }; };
const OPENER = "Hi there! Longer library hours. Are you registered to vote in LA County?";

/* ---------------- lesson 2 ---------------- */
for (const r of REPLAYS) {
  const g = SIGG.grade(r.say, ST);
  ok(bits(g.hits) === r.parts.join(""), `L2 ${r.id}: ${bits(g.hits)} for "${r.say}"`);
  ok((g.untrue || "") === (r.untrue || ""), `L2 ${r.id}: untrue ${g.untrue}`);
  const ben = run("2.ben", [r.say]).said, want = g.first === "time" ? "time" : g.regAsked ? "stop" : "other";
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
  ok(SIGG.score2([SIGG.grade("Hi! Sorry to bother you. Longer library hours. Are you registered to vote in LA County?", ST)]).alt[3] === true, "L2 an apology gets 'Said sorry first.'");
  ok(SIGG.score2([SIGG.grade("Hi! Do you have a minute? Longer library hours. Are you registered to vote in LA County?", ST)]).alt[3] === false, "L2 a request for time gets 'Asked for a minute.'");
}
/* the passersby answer what was said */
ok(run("2.ben", [OPENER]).said === "stop", "L2 Ben stops for the opener");
ok(run("2.ben", ["Hi! Do you have a minute?"]).said === "time", "L2 Ben keeps walking when asked for a minute");
ok(run("2.ben", ["Hi there! Longer library hours!", "Are you registered to vote in LA County?"]).said === "other / stop", "L2 Ben asks what this is once, then answers the question");
ok(run("2.ben", ["Hi there! Longer library hours!", "It's about the library.", "More"]).said === "other / -", "L2 Ben asks once and never twice");
ok(bits(run("2.ben", ["Hi there! Longer library hours!", "Are you registered to vote in LA County?"]).g.hits) === "1111", "L2 an opener in two pieces is scored as one try");
ok(run("2.soojin", [OPENER]).said === "stop" && run("2.luis", [OPENER]).said === "stop", "L2 Soo-jin and Luis stop for a full opener");
ok(run("2.soojin", ["Are you registered to vote in LA County?"]).said === "other", "L2 Soo-jin asks what it's for when the opener has two parts");
ok(run("2.soojin", ["Hi there! Longer library hours."]).said === "other", "L2 Soo-jin doesn't say she's registered when nobody asked");
ok(run("2.soojin", ["Hi there! Longer library hours.", "Are you registered to vote in LA County?"]).said === "other / stop", "L2 Soo-jin stops once the question comes");
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
{ const m = run("3.marisol", [OPENER, [PAID, TWO].join(" "), ASK]); ok(m.said === "reg / wait / yes" && bits(m.g.hits) === "1101", "L3 Marisol asks what you need when no ask comes"); }
{ const m = run("3.marisol", [OPENER, [TWO, DBL, ASK].join(" "), PAID]); ok(m.said === "reg / dbl+yes" && m.t.end && !m.g.hits[0] && String(SIGG.mustsMissed(3, m.g.hits)) === "0", "L3 extra: once she has the pen the try is over, so a paid line after it is missed and the must fires"); }
{ const m = run("3.marisol", ["Hey, got a minute?", [PAID, TWO, DBL, ASK].join(" ")]); ok(m.g.from === false && bits(m.g.hits) === "1111", "L3 a weak opener doesn't tick lesson 2 and doesn't change the score"); }
{ const l = run("3.luis", ["It's the Neighborhood Libraries Act, for longer library hours.", "No problem, once is enough. Thanks!"]); ok(l.said === "signed / go" && l.g.from === true, "L3 Luis: thanked and let go ticks lesson 1"); }
{ const l = run("3.luis", ["It's for longer library hours.", "Just sign again to be safe.", "Okay, never mind. Thanks!"]); ok(l.said === "signed / again / go" && l.g.from === false, "L3 Luis: told to sign again, no tick"); }
{ const t = run("3.tanya", [[PAID, TWO, DBL].join(" "), ASK]); ok(t.said === "nodbl+wait / yes", "L3 Tanya answers the double question, asks what you need, then says yes"); }
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
{ const t = run("4.tanya", ["Print your name here, then the address where you're registered to vote.", "It has to be in your handwriting.", "You're all set."]); ok(t.said === "ask / self+@fill+set / good+@glowSig" && t.g.from === false, "L4 Tanya doesn't answer a double question nobody asked"); }
{ const t = run("4.tanya", [WALK, "Hmm.", "Well.", "Could you sign right here?"]); ok(t.said === "nodbl+ask / - / @fill+set / oops+@sign+there" && !t.g.hits[2] && t.g.alt[2] === true, "L4 saying nothing about who writes doesn't count"); }
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
{ const p = run("5.pat", ["Yes, it's a new state tax.", "Want to sign?", "Okay, thank you."]); ok(p.said === "wait / no1+no2 / thanks" && p.g.ask === true, "L5 Pat asks what you want when no ask follows the answer"); }
{ /* extra: an argument after a no */
  const p = run("5.pat", ["Yes, it's a new state tax. It's printed right here. Want to sign?", "But don't you care about libraries?"]);
  ok(p.said === "no1+no2 / argue" && p.g.let === false && p.g.argued === true, "L5 extra: an argument after a no gets 'Like I said, no thanks.'");
  const b = SIGG.talk("5.ben", ST); b.hear("No, I'm paid to gather signatures. Want to sign?"); b.hear("Print your name, then the address where you're registered to vote.");
  const s = SIGG.score5(b.grade(), p.g); ok(bits(s.hits) === "1110" && SIGG.tipFor(s.hits) === 3, "L5 extra: the argument costs part 4 and the tip is about letting a no go");
}
{ /* extra: "No, there's no tax" */
  const p = run("5.pat", ["No, there's no tax. Want to sign?"]);
  ok(p.said === "-" && p.t.end && p.g.untrue === "tax", "L5 extra: 'No, there's no tax' ends the try for the correction");
  const b = SIGG.talk("5.ben", ST); b.hear("No, I'm paid to gather signatures. Want to sign?"); b.hear("Print your name.");
  const s = SIGG.score5(b.grade(), p.g); ok(s.untrue === "tax" && !s.hits[0] && s.alt[0] === true && String(SIGG.mustsMissed(5, s.hits)) === "0", "L5 extra: an untrue answer never passes, even after a straight one, and the must fires");
}
{ const p = run("5.pat", ["Don't worry about that. It's about libraries. Want to sign?", "Thanks anyway."]); ok(p.said === "no2 / -" && p.g.straight === false, "L5 Pat doesn't thank a canvasser for a straight answer she didn't get"); }

/* ---------------- shared ---------------- */
ok(SIGG.misheard("") && SIGG.misheard("um uh") && SIGG.misheard("the", true) && !SIGG.misheard("Yes.") && !SIGG.misheard("Hi", true), "misheard speech isn't a try");
ok(SIGG.pauseMs("Hi there") === 2800 && SIGG.pauseMs("Hi there longer library hours are you registered to vote in LA") === 2800 && SIGG.pauseMs("Hi I'm um") === 2800 && SIGG.pauseMs(OPENER) === 1200 && SIGG.pauseMs("It has to be in your handwriting") === 1200, "a passerby waits 1.2 seconds after a finished line and 2.8 mid-thought or under three words");
{ const t = SIGG.talk("3.tanya", ST); let n = 0; for (let i = 0; i < 9 && !t.end; i += 1) { t.hear("It funds longer hours."); n += 1; } ok(n <= 4, "a try is over after four of the canvasser's lines at most"); }
for (const n of [1, 2, 3, 4, 5]) ok(SIG_LESSONS[n].parts.length === 4 && SIG_LESSONS[n].parts.every((p) => p.name && p.done && p.missed && p.tip) && SIG_LESSONS[n].steps.reduce((a, s) => a + s.secs, 0) === 300, `lesson ${n} has four parts with done, missed and tip lines, and 300 designed seconds`);
ok([SIG_LESSONS[3].parts[0], SIG_LESSONS[3].parts[1], SIG_LESSONS[4].parts[2], SIG_LESSONS[5].parts[0]].every((p) => / (?:is|are) a must\. One more time\.$/.test(p.must)) && !SIG_LESSONS[1].parts.some((p) => p.must) && !SIG_LESSONS[2].parts.some((p) => p.must), "the musts are lesson 3's parts 1 and 2, lesson 4's part 3 and lesson 5's part 1");

console.log(`sig-grade: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
