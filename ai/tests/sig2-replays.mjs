/* Signature lesson 2, "How to stop a passerby": the replays.

   One replay for every example in the lesson's grading table (claude/signature-curriculum-claude-v5.md, "What gets
   graded in the spoken practice"), word for word, plus the five Robert asked for on Nov 18: "in LA" with no "County",
   a hello that comes after the question, "Do you have a minute?", "save our schools" and three openers where only
   the second is good.

   Each replay is what a canvasser says and what must come back: the four parts [hello first, what it's for, the
   registered question with the county, no ask for time], Ben's answer on the 1st try (stop, time or other) and whether
   Soo-jin or Luis stops (three or more parts).
   Run by ai/tests/sig-grade.test.mjs (the grader alone) and ai/tests/test-sig2.cjs (through the page, spoken into a
   stand-in microphone). */
const Q = "Are you registered to vote in LA County?";
export const REPLAYS = [
  /* ---- Part 1. Says hello first ---- */
  { id: "1-counts-hi", table: 'Part 1 counts: "Hi"', say: `Hi. This petition is for school funding. ${Q}`, parts: [1, 1, 1, 1], ben: "stop", stops: true },
  { id: "1-counts-hi-there", table: 'Part 1 counts: "Hi there"', say: `Hi there! This petition is for school funding. ${Q}`, parts: [1, 1, 1, 1], ben: "stop", stops: true },
  { id: "1-counts-good-morning", table: 'Part 1 counts: "Good morning"', say: `Good morning! This petition is for school funding. ${Q}`, parts: [1, 1, 1, 1], ben: "stop", stops: true },
  { id: "1-not-no-greeting", table: "Part 1 doesn't count: no greeting", say: `This petition is for school funding. ${Q}`, parts: [0, 1, 1, 1], ben: "stop", stops: true },
  { id: "1-not-greeting-after", table: "Part 1 doesn't count: a greeting after the question", say: `This petition is for school funding. ${Q} Hi there!`, parts: [0, 1, 1, 1], ben: "stop", stops: true },
  /* ---- Part 2. Says what the petition is for (version 5, Nov 20: the hours named after "for" or a verb count; the library alone doesn't) ---- */
  { id: "2-counts-signatures-for", table: 'Part 2 counts: "Signatures for school funding!" (Robert, Nov 20)', say: `Hi there! Signatures for school funding! ${Q}`, parts: [1, 1, 1, 1], ben: "stop", stops: true },
  { id: "2-not-support", table: 'Part 2 doesn\'t count: "Support your schools!" (Robert, Nov 20)', say: `Hi there! Support your schools! ${Q}`, parts: [1, 0, 1, 1], ben: "stop", stops: true, topicOnly: true },
  { id: "2-not-for-the-library", table: 'Part 2 doesn\'t count: "This petition is for the schools." (Robert, Nov 20)', say: `Hi there! This petition is for the schools. ${Q}`, parts: [1, 0, 1, 1], ben: "stop", stops: true, topicOnly: true },
  { id: "2-counts-this-petition", table: 'Part 2 counts: "This petition is for school funding"', say: `Hi there! This petition is for school funding. ${Q}`, parts: [1, 1, 1, 1], ben: "stop", stops: true },
  { id: "2-counts-gathering", table: 'Part 2 counts: "I\'m gathering signatures for school funding"', say: `Hi there! I'm gathering signatures for school funding. ${Q}`, parts: [1, 1, 1, 1], ben: "stop", stops: true },
  { id: "2-counts-evening-weekend", table: 'Part 2 counts: "It\'s for more evening and weekend hours at the library"', say: `Hi there! It's for more money for schools and health care. ${Q}`, parts: [1, 1, 1, 1], ben: "stop", stops: true },
  { id: "2-not-topic-only", table: 'Part 2 doesn\'t count: the topic words on their own, "School funding."', say: `Hi there! School funding. ${Q}`, parts: [1, 0, 1, 1], ben: "stop", stops: true, topicOnly: true },
  { id: "2-not-no-topic", table: "Part 2 doesn't count: no topic", say: `Hi there! ${Q}`, parts: [1, 0, 1, 1], ben: "stop", stops: true },
  { id: "2-not-save", table: 'Part 2 doesn\'t count: a label the measure doesn\'t support, "save our schools"', say: `Hi there! Save our schools. ${Q}`, parts: [1, 0, 1, 1], ben: "stop", stops: true, untrue: "closing" },
  { id: "2-not-closures", table: 'Part 2 doesn\'t count: a label the measure doesn\'t support, "stop school closures"', say: `Hi there! Stop school closures. ${Q}`, parts: [1, 0, 1, 1], ben: "stop", stops: true, untrue: "closing" },
  { id: "2-not-long", table: "Part 2 doesn't count: an explanation that runs past about 12 words before the question", say: `Hi there! We are out here today gathering signatures for a measure that would fund schools and health care in every county in the state. ${Q}`, parts: [1, 0, 1, 1], ben: "stop", stops: true },
  /* ---- Part 3. Asks if they're registered to vote in LA County ---- */
  { id: "3-counts-to-vote-la", table: 'Part 3 counts: "registered to vote" and "LA County"', say: "Hi there! This petition is for school funding. Are you registered to vote in LA County?", parts: [1, 1, 1, 1], ben: "stop", stops: true },
  { id: "3-counts-voter-la", table: 'Part 3 counts: "registered voter" and "LA County"', say: "Hi there! This petition is for school funding. Are you a registered voter in LA County?", parts: [1, 1, 1, 1], ben: "stop", stops: true },
  { id: "3-counts-to-vote-los-angeles", table: 'Part 3 counts: "registered to vote" and "Los Angeles County"', say: "Hi there! This petition is for school funding. Are you registered to vote in Los Angeles County?", parts: [1, 1, 1, 1], ben: "stop", stops: true },
  { id: "3-counts-voter-los-angeles", table: 'Part 3 counts: "registered voter" and "Los Angeles County"', say: "Hi there! This petition is for school funding. Are you a registered voter in Los Angeles County?", parts: [1, 1, 1, 1], ben: "stop", stops: true },
  { id: "3-not-a-voter", table: 'Part 3 doesn\'t count: "Are you a voter?"', say: "Hi there! This petition is for school funding. Are you a voter?", parts: [1, 1, 0, 1], ben: "stop", stops: true },
  { id: "3-not-no-county", table: "Part 3 doesn't count: no county", say: "Hi there! This petition is for school funding. Are you registered to vote?", parts: [1, 1, 0, 1], ben: "stop", stops: true },
  { id: "3-not-california", table: 'Part 3 doesn\'t count: "in California"', say: "Hi there! This petition is for school funding. Are you registered to vote in California?", parts: [1, 1, 0, 1], ben: "stop", stops: true },
  /* ---- Part 4. Doesn't ask for time or say sorry ---- */
  { id: "4-counts-plain", table: "Part 4 counts: any opener without those", say: `Hi there! This petition is for school funding. ${Q}`, parts: [1, 1, 1, 1], ben: "stop", stops: true },
  { id: "4-not-minute", table: 'Part 4 doesn\'t count: "Do you have a minute?"', say: `Hi there! Do you have a minute? This petition is for school funding. ${Q}`, parts: [1, 1, 1, 0], ben: "time", stops: true },
  { id: "4-not-second", table: 'Part 4 doesn\'t count: "Got a second?"', say: `Hi there! Got a second? This petition is for school funding. ${Q}`, parts: [1, 1, 1, 0], ben: "time", stops: true },
  { id: "4-not-sorry", table: 'Part 4 doesn\'t count: "Sorry to bother you"', say: `Hi there! Sorry to bother you. This petition is for school funding. ${Q}`, parts: [1, 1, 1, 0], ben: "time", stops: true },
  { id: "4-not-ask-something", table: 'Part 4 doesn\'t count: "Can I ask you something?"', say: `Hi there! Can I ask you something? This petition is for school funding. ${Q}`, parts: [1, 1, 1, 0], ben: "time", stops: true },
  /* ---- the five more ---- */
  { id: "x1-in-la-no-county", table: 'Extra 1: "in LA" with no "County"', say: "Hi there! This petition is for school funding. Are you registered to vote in LA?", parts: [1, 1, 0, 1], ben: "stop", stops: true },
  { id: "x2-hello-after-question", table: "Extra 2: a hello that comes after the question", say: "Are you registered to vote in LA County? Hello!", parts: [0, 0, 1, 1], ben: "stop", stops: false },
  { id: "x3-minute", table: 'Extra 3: "Do you have a minute?"', say: "Do you have a minute?", parts: [0, 0, 0, 0], ben: "time", stops: false },
  { id: "x4-save-our-libraries", table: 'Extra 4: "save our schools"', say: "Hi there! Save our schools! Are you registered to vote in LA County?", parts: [1, 0, 1, 1], ben: "stop", stops: true, untrue: "closing" },
];
/* Extra 5: three openers in a row where only the second is good. The best one counts, and its tip is the all-four line. */
export const THREE = {
  id: "x5-only-the-second-is-good", table: "Extra 5: three openers where only the second is good",
  openers: ["Do you have a minute?", "Hi there! This petition is for school funding. Are you registered to vote in LA County?", "Hi, are you a voter?"],
  parts: [[0, 0, 0, 0], [1, 1, 1, 1], [1, 0, 0, 1]],
  kaylaReply: "No problem. Have a good one!", letGo: true,
  best: 1, score: 4, tip: -1,
};
/* how a phone's speech recognition really writes these (no punctuation, its own spellings): each must grade the same */
export const HEARD = [
  { say: "hi there this petition is for school funding are you registered to vote in LA County", parts: [1, 1, 1, 1] },
  { say: "Hi there. This petition is for school funding. Are you registered to vote in L.A. County?", parts: [1, 1, 1, 1] },
  { say: "hi there this petition is for school funding are you registered to vote in el a county", parts: [1, 1, 1, 1] },
  { say: "Hi there, this petition's for school funding, are you register to vote in Los Angeles county", parts: [1, 1, 1, 1] },
  { say: "high there this petition is for school funding are you a registered voter in LA county", parts: [1, 1, 1, 1] },
  { say: "um hi there uh this petition is for school funding are you registered to vote in LA County", parts: [1, 1, 1, 1] },
  { say: "hi there this petition is for school funding are you registered to vote in Los Angeles", parts: [1, 1, 0, 1] },
  { say: "hi there school funding are you registered to vote in LA County", parts: [1, 0, 1, 1] },
  { say: "hi sorry to bother you it's for school funding are you registered to vote in LA County", parts: [1, 1, 1, 0] },
  { say: "hey there quick question are you registered to vote in LA County it's for school funding", parts: [1, 1, 1, 1] },
  { say: "hi you have to be registered to vote in LA County to sign this", parts: [1, 0, 0, 1] },
  { say: "hi there it's for school and health care funding are you registered to vote in LA County", parts: [1, 1, 1, 1] },
  { say: "hi there we want to keep our schools open are you registered to vote in LA County", parts: [1, 0, 1, 1], untrue: "closing" },
  { say: "hi there school funding and it's free are you registered to vote in LA County", parts: [1, 0, 1, 1], untrue: "cost" },
];
/* Kayla isn't registered: thanking her and letting her go counts, with or without telling her she can register;
   "sign anyway" or offering the board doesn't */
export const LET_GO = [
  ["No problem. Have a good one!", true],
  ["Thanks anyway! Have a good day.", true],
  ["Okay, thank you. You can register at registertovote.ca.gov.", true],
  ["No worries. You can register online and then sign next time.", true],
  ["That's okay, sign anyway.", false],
  ["You can still sign. Here's the board.", false],
  ["It doesn't matter, just sign here.", false],
  ["Are you sure?", false],
];

/* rule 27b (Robert, Nov 21, 2026, 12:56 PM: "the AI voice accuracy thing is that it needs to be 99%+ accurate"): ways a canvasser
   asks the registered question with the county, which all count, and lines that don't ask it with the county */
export const REG_COUNTS = [
  /* the outside review, Nov 21: "all" or "any" inside a question */
  "Are you all registered to vote in LA County?", "Are you guys all registered to vote in LA County?", "Any registered voters in LA County here?", "Are there any registered LA County voters here?",
  "Are you registered to vote in LA County?", "Are you registered to vote in Los Angeles County?", "Are you registered to vote in L.A. County?",
  "Are you registered to vote in L A County?",   "Are you registered in LA County?", "Are you registered here in LA County?", "Are you registered to vote here in Los Angeles County?",
  "Are you a registered voter in LA County?", "Are you a registered LA County voter?", "Are you an LA County voter?",
  "Are you a voter in LA County?", "Do you vote in LA County?", "Are you registered to vote in this county?",
  "Are you registered in the county?", "You registered to vote in LA County?", "Are you registered to vote in the county of Los Angeles?",
  "Are you registered to vote? In LA County?", "Are you registered to vote in LA County by chance?", "Are you by chance registered to vote in LA County?",
  "Are you currently registered to vote in LA County?", "Are you registered to vote at your address in LA County?",
  "Would you happen to be registered to vote in LA County?",   "And are you registered to vote in LA County?", "Are you registered to vote around here, in LA County?",
  "Are you registered to vote in Los Angeles county, and do you love schools?", "Are you registered to vote in Los Angeles County and are you a lover of libraries?",
  "are you registered to vote in ella county", "are you registered to vote in el a county", "are you registered to vote in elay county",
  "are you registered to vote in l.a county", "Registered to vote in LA County?",
  "You're registered in LA County, right?", "You a registered voter in LA County?",   "Are you registered in Los Angeles County to vote?", "Are you guys registered to vote in LA County?", "Are you registered to vote out here in LA County?",
  "Are you registered to vote in the city or county of Los Angeles?", "Are you a Los Angeles County voter?",
  "Do you vote here in LA County?", "Are you registered to vote in LA County, by any chance?", "Are you, um, registered to vote in LA County?",
  "Are you registered, uh, to vote in LA County?", "Are you registered to vote in LA County at all?",
];
export const REG_NOT = [ /* no county named, "in LA" alone (the city), or no question */
  /* the outside review, Nov 21: the county past a "?" that isn't the question's, or someone's employer */
  "Are you registered to vote? The county checks every line.", "Are you registered to vote? I'm with LA County schools.", "I'm with LA County schools. Are you registered to vote?",
  "Any registered LA County voter can sign this.",
  "Are you registered to vote?", "Only registered voters in LA County can sign.", "You have to be registered in LA County.",
  "Do you live in LA County?", "Do you vote?", "I'm registered in LA County.", "We need registered voters in LA County.",
  "Are you registered to vote in Los Angeles?", "Are you registered to vote in LA?", "Are you a registered voter here in Los Angeles?", "Are you registered to vote in L.A.?",
  "Are you registered to vote in the LA area?", "Are you registered to vote here in LA?", "Are you registered to vote here in Los Angeles?",
];
