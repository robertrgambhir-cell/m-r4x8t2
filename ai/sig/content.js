/* The California signature course: what a paid canvasser hears, sees and taps, lesson by lesson.

   The words come from the curriculum, courses/signature/curriculum.md in the private rules repo robertrgambhir-cell/issue-trainings
   (version 10, Nov 21, 2026: version 9 with Robert's 12:56 PM notes on lesson 2; its "What changed in version 10" lists every line
   that changed, and versions 1 to 7 stay in the Warmup project as history), section 3. They are built exactly as written there. Since Nov 20 one thread owns
   the course's words and its build (playbook rule 66): a line that doesn't work is fixed in the curriculum first, as its next
   version, then here. Nothing is reworded here alone.

   One file holds the words so the page, the recorded voices and the graders' test cases can't drift apart:
   - ai/tools/build-sig.mjs fills the page (wdpfxqlsvp/sig/) from it;
   - the AI server reads SIG_NARRATION, the only lines its voice may speak for this course (GET /narrate?s=sig&k=N);
   - ai/tools/sig-audio.mjs records those lines into wdpfxqlsvp/sig/audio/.

   Firm settings live in SIG_SETTINGS and nowhere else. The scripts spell out the defaults, so "LA County" in a line is the
   [COUNTY] setting and is swapped when the page is built. Straight quotes here; the page sets them as curly quotes.
   No em dashes. */

/* ---- firm settings: the one place (curriculum, "Firm settings") ---- */
export const SIG_SETTINGS = {
  /* [COUNTY]: the opener, the card and every county mention */
  county: "LA County",
  /* other names for the same county that count when a canvasser says them */
  countyAlso: ["Los Angeles County", "County of Los Angeles"],
  /* how a phone's speech recognition tends to spell the county; all of these are heard as the county */
  countyHeard: ["L.A. County", "L A County", "LA County", "el a County", "ella County", "elay County", "L.A County"],
  /* how the recorded voices say it */
  countySay: "L.A. County",
  /* [FUNDERS]: "sheet" (a separate Official Top Funders sheet, the default) or "printed" (printed on the petition) */
  funders: "sheet",
  /* [PAY LINE]: which of SIG_PAY_LINES is true for this firm */
  payLine: "bonus",
  /* [BOARD]: "one" petition. "several" has rules and no scripts yet (curriculum, "If the canvasser carries a board") */
  board: "one",
  /* [LEAD]: who texts the lessons, on each lesson end */
  lead: "Your lead",
  /* the drive, for the page's header */
  drive: { name: "Schools and Health Care", measure: "Prop 3", color: "#5A3E99" },
  /* live replies (rule 37f) wait for "ship it": the AI server's own description of the drive for live passersby still names the libraries
     (SIG_SYSTEM in ai/worker.js), so until it reads the drive from this file the passersby say their scripted lines (version 13) */
  liveReplies: false,
  site: "Westside Market",
};

/* lesson 1, step 5: the line has to be true for the firm */
export const SIG_PAY_LINES = {
  bonus: "The campaign checks your signatures. Your bonus is paid on the ones that count.",
  perValid: "You're paid for signatures that count. A thrown-out line pays nothing.",
  hourlyTracked: "Your lead sees how many of your signatures count. That number decides who gets the best spots and the most hours.",
  rawNoCheck: "The drive only wins with signatures that count, and your name goes on every sheet you turn in.",
};

/* the measure and the practice petition (curriculum, "The petition on screen") */
export const SIG_MEASURE = {
  /* version 13 (Robert's go, Nov 23, 2026): a real measure, the 2026 initiative that became Prop 3. Every fact is the petition's own:
     the Attorney General's title and summary (Secretary of State release, Nov 4, 2025). Before: the made-up Neighborhood Libraries Act. */
  name: "Schools and Health Care",
  label: "school and health care funding",
  /* the opener's sentence for the measure: that you're collecting signatures, what it does and that it's for the ballot (version 8,
     Robert, Nov 20, 3:51 PM: "You wouldn't say, 'This petition is for longer library hours.'") */
  opener: "I'm collecting signatures for a ballot measure to keep funding schools and health care.",
  two: "It makes funding for schools and health care permanent. It's paid for by keeping today's tax on high incomes.",
  paid: "I'm paid to gather these signatures.",
  summary: "Provides permanent funding for schools and healthcare by extending existing tax on high incomes.", /* the petition's official title, word for word */
  /* what a live passerby knows of the measure (the AI server reads it once its change ships; until then live replies are off) */
  gist: "a ballot measure that would make funding for schools and health care permanent, paid for by keeping today's state tax on high incomes",
  stamp: "PRACTICE ONLY. NOT A REAL PETITION.",
  /* the line at the foot of every sources sheet (version 13: the measure is real, the people aren't, and the practice isn't its campaign's) */
  fine: "The passersby and the canvassers are AI voices, and every person here is made up for practice. Prop 3 is a real California measure from 2026. Its words here are its petition's own, and this practice isn't from its campaign.",
  boxes: { name: "Print Your Name", sig: "Sign As Registered To Vote", addr: "Residence Address ONLY", city: "City", zip: "Zip" },
  fundersHead: "OFFICIAL TOP FUNDERS",
  fundersValid: "Valid only for",
  /* the practice is set in the drive's last month (version 13): the sheet a canvasser holds up says "Valid only for April" */
  month: "April",
};

/* what every lesson shares (curriculum, "What every lesson shares" and "The scoring contract") */
export const SIG_SHARED = {
  start: "Start your 1st try", startLesson: "Start lesson {n}",
  next: { hear: "Next: hear it done", spot: "Next: catch the mistake", try2: "Next: your 2nd try" },
  /* inside a step, the button to its next item names the step and the number (version 8, Robert: "Next, catch mistake number 2") */
  nth: "Next: {step}, {n} of {m}",
  /* the button into the feedback card (version 8, Robert: "Next: your feedback" didn't say what comes next) */
  seeHow: "Next: see how you did",
  /* the frame every Warmup course shares, the door-knocking lessons' (Robert's pick, Nov 20, 11:53 AM): the talk button, and Part N of 4 */
  talk: "Tap to talk", talkClick: "Click to talk", micDone: "I’m done",
  /* the talk button while someone walks up, then as they reach you (rule 54b, Robert, Nov 21, 2026, 12:56 PM: "very intuitive when you
     should say 'click to start talking'") */
  waitClose: { m: "Wait till he's close", f: "Wait till she's close" }, sayHi: "Tap and say hi", sayHiClick: "Click and say hi",
  /* the button on a sheet that starts a scene (rule 49a) */
  play: "Start listening", listening: "Listening. Say it your way.", starting: "Starting your mic…", goAhead: "Go ahead. Say it your way.", partOf: "Part {n} of 4",
  /* a second example inside a step: its own short card, not a Part screen (version 8, Robert: "You're still in the Hear it done") */
  exampleOf: "Example {n} of {m}",
  done: "Done for today",
  ready: "Start your 2nd try",
  try1: { some: "You've got {n} of 4. Watch for the other {m}.", one: "You've got 3 of 4. Watch for the last one.", none: "You tried it first. That's the hard part. Watch for all four.", all: "You got all four. A few quick questions come next, then your 2nd try.", walked: "He kept walking. Start your opener as soon as he's close.", watch: "Watch for" },
  /* the lesson end says one thing (version 8, Robert: "only the main message sticks out"): the lesson is done and what tomorrow brings */
  end: { done: "Lesson {n} done.", tomorrow: "Tomorrow: {next}." },
  /* the feedback card says the score once, in its header (version 8) */
  score: { all: "You got all four.", some: "You got {n} of 4.", none: "You got 0 of 4.", of: "{n} of 4" },
  /* How you grew (rule 19, Robert, Nov 21, 2026, 12:56 PM: "show growth and improvement"; perfect both times: "You're already really solid") */
  grew: { both: "You got all four both times.", bothSub: "You have a strong start, and you're ready for what comes next.", added: "You added {n} part{s} since your 1st try.", addedSub: "You're better at this than you were five minutes ago.", allSub: "Now you have all four. You're better at this than you were five minutes ago.", same: "You got {n} of 4 both times.", drop: "You got {a} of 4 on your 1st try and {b} of 4 on your 2nd.", keepSub: "That happens. Each try is practice, and the tip shows what to add next.", keepSubNoTip: "That happens. Each try is practice.", first: "1st try", second: "2nd try", chip: "New" },
  /* the row of 20 passersby that comes with the stop-rate answer */
  of20: "{n} of 20 passersby stop",
  tipLead: "Tip:",
  misheard: "I missed that. Try once more.",
  /* Catch the mistake: the header while the scene plays, and the quiet link under the options (version 8: centered) */
  spotHead: "Listen for the mistake.", hearAgain: "Hear it again",
  promise: "Only the county decides. Leave out the promise and try it once more.",
  /* the untrue card: the heading over the true sentence, the coach's words and the button */
  untrue: "That isn't true.",
  untrueSay: "That part isn't true. Here's the true sentence. Try it once more.",
  tryAgain: "Try it once more",
  /* a must missed on both tries: the practice round ({step} is the must's step) */
  practice: "{step} is waiting for you as a practice round. Do it before your next shift.",
  practiceBtn: "Start the practice round",
  passed: "You passed {step}.",
  sources: "See sources",
  ready5: "You're table-ready.",
  ready5wait: "One step to go before you're table-ready.",
  course: "Right person. True words. Their own hand. One good look.",
  passerby: "Passerby",
  /* a canvasser on screen is known by role, never by name (version 8, Robert: "we can't rely too much on names in this app") */
  canvasser: "Canvasser",
  answering: { m: "He's answering.", f: "She's answering." },
  titles: ["How to spot a signature that counts", "How to stop a passerby", "How to ask for the signature", "How to make every line count", "How to answer a hard question"],
};

/* ElevenLabs voices, one per person, "el:<voice id>:<speed>" (playbook rule 68). Nov 19, 8:16 PM: the coach is Frank
   (Frank Sullivan, warm and authentic, a man in his late 60s), Robert's pick of six samples by ear. Nov 20 (version 8, Robert,
   3:51 PM: the coach should sound warmer and friendlier): the coach's words were rewritten, and Frank reads looser
   (SIG_VOICE_SETTINGS, Claude's call), keeping the voice Robert picked and its unhurried pace. Four samples went to Robert to
   pick by ear: Chris "el:iP95p4xoKVk53GoZ742B" and River "el:SAz9YHcvj6GT2YYXdXww" talk about 40% faster between pauses. Lena Jessica, Rico Will, Ben Eric, Tanya and Pat Matilda, Dwayne Brian, Hank Bill, Soo-jin, Ines and
   Joan Bella, Kayla Laura, Luis Liam, Marisol and Anika Sarah, Bob Roger, Karim Adam, at 0.88 speed. A shared voice is
   never used twice in one lesson, and the coach's voice is the coach's alone. Nov 21 (version 10, Robert, 12:56 PM, on Soo-jin: "Her voice is
   very strange. We need to make it much more human"): the voice she shared with Ines and Joan (Bella) goes. Soo-jin is Carol ("Relatable,
   Real, Likeable Gran"), Ines is Eryn ("Genuine, Friendly and Natural") and Joan is Jane Hackett, ElevenLabs library voices made for
   conversation, at 0.9 speed. Robert picked Carol for Soo-jin from four samples by ear (Nov 21, 3:35 PM: "Pick Carol 1"). */
export const SIG_VOICES = {
  coach: "el:bRlp5mUWs01wX4H4oW4X:0.9",
  lena: "el:cgSgspJ2msm6clMCkdW9:0.88",
  rico: "el:bIHbv24MWmeRgasZH58o:0.88",
  ben: "el:cjVigY5qzO86Huf0OWal:0.88",
  tanya: "el:XrExE9yKIg1WjnnlVkGX:0.88",
  dwayne: "el:nPczCjzI2devNBz1zQrb:0.88",
  hank: "el:pqHfZKP75CvOlQylNhV4:0.88",
  soojin: "el:5u41aNhyCU6hXOcjPPv0:0.9",
  kayla: "el:FGY2WhTYpPnrIDTdsKH5:0.88",
  luis: "el:TX3LPaxmHKxFdv7VOQHJ:0.88",
  marisol: "el:EXAVITQu4vr4xnSDxMaL:0.88",
  ines: "el:kdnRe2koJdOK4Ovxn2DI:0.9",
  bob: "el:CwhRBWXzGAHq8TQ4Fs17:0.88",
  anika: "el:EXAVITQu4vr4xnSDxMaL:0.88",
  joan: "el:aIu5oHglU5AHNc2x0AZu:0.9",
  karim: "el:pNInz6obpgDQGcFmaJgB:0.88",
  pat: "el:XrExE9yKIg1WjnnlVkGX:0.88",
};
/* how each voice is recorded: the coach looser than a steady read so it sounds like someone talking with you (version 8), everyone
   else at the cast's settings */
export const SIG_VOICE_SETTINGS = {
  coach: { stability: 0.38, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true, seed: 7 }, /* Nov 19 to 20: 0.62 and style 0 */
  rest: { stability: 0.5, similarity_boost: 0.8, style: 0.1, use_speaker_boost: true },
};

/* the cast keeps the same facts in every lesson; every name and address is invented. A passerby's name and age are stage
   notes for the artist and the build (version 4, rule 30a): on screen a passerby is "Passerby" until they write their name. */
export const SIG_CAST = {
  lena: { name: "Lena", g: "f" }, rico: { name: "Rico", g: "m" },
  ben: { name: "Ben", full: "Ben Feldman", age: 38, g: "m" }, tanya: { name: "Tanya", full: "Tanya Brooks", age: 45, g: "f" },
  dwayne: { name: "Dwayne", full: "Dwayne Carter", age: 58, g: "m" }, hank: { name: "Hank", full: "Hank Dawson", age: 71, g: "m" },
  soojin: { name: "Soo-jin", full: "Soo-jin Kim", age: 67, g: "f" }, kayla: { name: "Kayla", full: "Kayla Jones", age: 24, g: "f" },
  luis: { name: "Luis", full: "Luis Ortega", age: 29, g: "m" }, marisol: { name: "Marisol", full: "Marisol Vega", age: 34, g: "f" },
  theo: { name: "Theo", full: "Theo Lewis", age: 22, g: "m" }, carmen: { name: "Carmen", full: "Carmen Ruiz", age: 52, g: "f" },
  ines: { name: "Ines", full: "Ines Romero", age: 39, g: "f" }, bob: { name: "Bob", full: "Bob Hall", age: 73, g: "m" },
  anika: { name: "Anika", full: "Anika Rao", age: 41, g: "f" }, joan: { name: "Joan", full: "Joan Whitaker", age: 60, g: "f" },
  karim: { name: "Karim", full: "Karim Nassar", age: 33, g: "m" }, pat: { name: "Pat", full: "Pat Sullivan", age: 64, g: "f" },
};

const OPENER = "Hi there! I'm collecting signatures for a ballot measure to keep funding schools and health care. Are you registered to vote in LA County?";
const s = (who, text, o) => Object.assign({ who, text }, o || {}); /* a spoken line */
const c = (text, o) => s("coach", text, o);
/* lines every passerby has, in their own voice, for the moments no script plans (the scoring contract, version 3): a greeting,
   small talk, a push to sign, a goodbye and (version 8) a kind way to end a talk that's going nowhere, said as they leave, so
   every talk ends with the other person closing it (Robert, Nov 20, 3:51 PM). A dodge gets their own question once more. */
const fb = (who) => ({ fHi: s(who, "Hi."), fSmall: s(who, "I'm good, thanks."), fPush: s(who, "I'll think about it."), fBye: s(who, "Okay, bye now.", { act: "go" }), fGo: s(who, "Sorry, I've got to run. Good luck!", { act: "go" }), fDone: s(who, "Thanks! Good luck out here.", { act: "go" }) });

/* ---- Lesson 1. How to spot a signature that counts ---- */
const L1 = {
  n: 1, id: "sig1", title: "How to spot a signature that counts", start: "Start with a guess",
  parts: [
    { name: "Asks if she's registered to vote", done: "Asked if she's registered to vote.", missed: "Didn't ask if she's registered to vote.", tip: "Use the word 'registered.' Plenty of people who call themselves voters aren't on the rolls." },
    { name: "Names the county", done: "Named LA County.", missed: "Didn't name the county.", tip: "Add 'in LA County.' Your sheet only counts LA County voters." },
    { name: "Says only registered voters count", done: "Said only registered voters count.", missed: "Didn't say only registered voters count.", tip: "Say the rule out loud: only registered voters count." },
    { name: "Says the county checks", done: "Said the county checks every line.", missed: "Didn't say who checks.", tip: "Say that the county checks. People relax when it's a rule, not a judgment." },
  ],
  tipAll: "You got all four. You already think like the county.",
  headsUp: "Heads up: when she asks why, say who counts and who checks.",
  nextShift: "On your next shift: before anyone picks up the pen, ask 'Are you registered to vote in LA County?'",
  endExtra: "Your first-shift card is in your texts. It has the eight rules for your first signature.",
  steps: [
    { kind: "taps", name: "Guess how many get thrown out", secs: 18, coach: c("Welcome! You'll practice on a real measure from 2026, Prop 3. It keeps funding schools and health care."),
      qs: [{ ask: "What share of the signatures a drive turns in get thrown out?", opts: ["5%", "25%", "50%"], row: true, right: 1, after: c("About 25% get thrown out. Let's learn which ones count."),
        sources: [["About 1 in 4 thrown out", [["Proposition 3's final report", "https://elections.cdn.sos.ca.gov/ccrov/2026/june/26153jh.pdf"], ["Proposition 37's", "https://elections.cdn.sos.ca.gov/ccrov/2026/april/26102jl.pdf"]], "Warmup's arithmetic from the Secretary of State's nine final reports for 2026, two of them here"]] }] },
    { kind: "cards", name: "How the county checks", secs: 25, coach: c("The county checks each signer's voter record for four things."),
      cards: [c("1. Is this person registered to vote?"), c("2. Are they registered in this county?"), c("3. Are they registered at the address they wrote?"), c("4. Does the signature look like theirs?")],
      after: c("With four yeses, the signature counts. With one no, it's thrown out. Only the county decides, so never promise anyone their signature will count.") },
    { kind: "sort", name: "Sort five lines", secs: 92, coach: c("Let's play the county. Five people signed at Westside Market today. Decide which lines count."), ask: "Will the county count this line?", buttons: ["Counts", "Thrown out"], last: "Next: the three thrown out",
      cards: [
        { face: "marisol", text: "Marisol Vega is registered to vote at her Culver City apartment. She wrote that address and signed.", right: 0, why: "It counts. She's registered at that address, and she wrote the line herself." },
        { face: "dwayne", text: "Dwayne Carter likes the measure and filled in the line neatly. He has never registered to vote.", right: 1, why: "It's thrown out. Not being registered is the top reason lines get thrown out." },
        { face: "soojin", text: "Soo-jin Kim is registered at 412 Palm Avenue, Apartment 4. She left off the apartment number.", right: 0, why: "It counts. A missing apartment number is fine when the house number and street match." },
        { face: "theo", text: "Theo Lewis moved to Westwood last month and wrote his new address. His voter record still has his old one.", right: 1, why: "It's thrown out, because his voter record has the old address. He can update his registration first, then sign." },
        { face: "luis", text: "Luis Ortega is a registered voter. He signed this petition last week and signs again today.", right: 1, why: "It's thrown out. Each voter signs once, and a double can cost far more than one line." },
      ],
      after: c("Three of those five lines get thrown out. Not one was about handwriting. All three were about who signed.") },
    { kind: "taps", name: "Guess the cost of a double", short: "the cost of a double", secs: 25, coach: c("Luis signed twice. The county checks a sample, about 3 lines in every 100."),
      qs: [{ ask: "The sample catches one double. How many signatures does the drive lose?", opts: ["1", "2", "About 1,000"], row: true, right: 2, after: c("The drive loses about 1,000. One double in the sample tells the county the stack holds many more."),
        sources: [["The sample of 3%", [["Elections Code 9030", "https://california.public.law/codes/elections_code_section_9030"]]], ["About 1,000 per double", [["2 CCR 20531 and 20540 on the Secretary of State's site", "https://www.sos.ca.gov/administration/regulations/current-regulations/elections/election-petition-signature-verification-random-sampling-verification-methodology"]], "whose example weights each duplicate at about 1,075 signatures"]] }] },
    { kind: "taps", name: "Who had the better hour?", short: "the better hour", secs: 21,
      qs: [{ ask: "Ana gathered 12 signatures in an hour, and 7 count. Nate gathered 10, and 8 count. Which canvasser had the better hour?", opts: ["Ana", "Nate"], row: true, right: 1, tally: [[12, 7], [10, 8]], /* each button is that canvasser's sheet: lines gathered, lines that count */ after: c("Nate had the better hour. Signatures that count are the score. {PAYLINE}") }] },
    { kind: "say", name: "Say it", secs: 43, coach: c("One question screens out the most bad lines. Here comes a woman in scrubs. Go ahead and ask her if she's registered to vote in LA County."), ready: "Talk to the woman in scrubs",
      who: "marisol", note: "Stage note, art only: Marisol Vega, 34, in scrubs.", hint: "Tell her why. Who counts? Who checks?",
      /* asked whether she's registered, she answers that; told only what it's for, she asks what you need; asked any other question, she says so */
      ask: s("marisol", "I am. Why do you ask?"), askOther: s("marisol", "Me? I vote in every election. Why do you ask?"),
      replies: Object.assign({ lib: s("marisol", "Oh, for the schools? What do you need?"), yes: s("marisol", "Makes sense. I vote every time, so sure, I'll sign.", { act: "pen" }), other: s("marisol", "Oh, okay. Well, good luck!", { act: "go" }) }, fb("marisol")),
      oneWay: "One way to say it: 'Only registered voters in LA County count on this sheet, and the county checks every line.'" },
    { kind: "stop", name: "One whole stop", secs: 63, play: "Start watching", coach: c("Now watch a trained canvasser do the whole job, start to finish."), who: "ines", props: "stroller",
      note: "Stage note, art only: Lena stands in front of her table. Ines Romero, 39, walks up pushing a stroller.",
      labels: ["Right person", "True words", "Their own hand", "One good look"],
      lines: [
        s("lena", OPENER, { label: 0 }), s("ines", "I am."),
        s("lena", "I'm paid to gather signatures, and here are this month's top funders. It makes funding for schools and health care permanent, paid for by keeping today's tax on high incomes. Have you signed this one already?",
          { label: 1, act: "sheet", printed: "I'm paid to gather signatures. It makes funding for schools and health care permanent, paid for by keeping today's tax on high incomes. Have you signed this one already?" }),
        s("ines", "No."), s("lena", "Then here's the petition. Will you sign to put it on the ballot?", { act: "board" }), s("ines", "Sure."),
        s("lena", "Print your name, sign, then write the address where you're registered to vote.", { label: 2, act: "write" }),
        s("lena", "All set. Thank you!", { label: 3, act: "look" }), s("ines", "Thanks! Good luck out here.", { act: "go" }),
      ],
      after: c("Two of her lines are the law. Say each one once."), sayLead: "Say it:",
      say: ["I'm paid to gather these signatures.", "It makes funding for schools and health care permanent. It's paid for by keeping today's tax on high incomes."],
      done: c("Good. Take those two lines with you today.") },
    { kind: "end", name: "Lesson done", secs: 16, btn: "Finish lesson 1" },
  ],
  sources: [
    ["Who may sign and what the county checks", [["Elections Code 100", "https://california.public.law/codes/elections_code_section_100"], ["Elections Code 105", "https://california.public.law/codes/elections_code_section_105"], ["Elections Code 9021", "https://california.public.law/codes/elections_code_section_9021"], ["2 CCR 20960", "https://www.law.cornell.edu/regulations/california/2-CCR-20960"]]],
    ["Not registered as the top reason, doubles at 22%, wrong address at 16%", [["LA County, 2022", "https://lacounty.gov/2022/08/15/registrar-recorder-county-clerk-completes-petition-verification-for-district-attorney-recall-attempt/"]]],
    ["Apartment numbers count, a different house number doesn't and a mover may re-register by the day they sign", [["2 CCR 20931 and 20940 on the Secretary of State's site", "https://www.sos.ca.gov/administration/regulations/current-regulations/elections/petition-processing-signature-verification-ballot-processing-and-ballot-counting"], ["Elections Code 105", "https://california.public.law/codes/elections_code_section_105"], ["Elections Code 2102", "https://california.public.law/codes/elections_code_section_2102"]]],
    ["About 1 in 4 thrown out", [["Proposition 3", "https://elections.cdn.sos.ca.gov/ccrov/2026/june/26153jh.pdf"], ["Proposition 37", "https://elections.cdn.sos.ca.gov/ccrov/2026/april/26102jl.pdf"], ["Proposition 38", "https://elections.cdn.sos.ca.gov/ccrov/2026/june/26161jh.pdf"], ["Proposition 39", "https://elections.cdn.sos.ca.gov/ccrov/2026/april/26110jh.pdf"], ["Proposition 40", "https://elections.cdn.sos.ca.gov/ccrov/2026/june/26158jh.pdf"], ["Proposition 41", "https://elections.cdn.sos.ca.gov/ccrov/2026/june/26160jh.pdf"], ["Proposition 42", "https://elections.cdn.sos.ca.gov/ccrov/2026/june/26162jh.pdf"], ["Proposition 44", "https://elections.cdn.sos.ca.gov/ccrov/2026/may/26139jh.pdf"], ["Proposition 45", "https://elections.cdn.sos.ca.gov/ccrov/2026/june/26156jh.pdf"]], "Warmup's arithmetic from the Secretary of State's nine final reports for 2026"],
    ["The sample of 3%", [["Elections Code 9030", "https://california.public.law/codes/elections_code_section_9030"]]],
    ["About 1,000 per double", [["2 CCR 20531 and 20540 on the Secretary of State's site", "https://www.sos.ca.gov/administration/regulations/current-regulations/elections/election-petition-signature-verification-random-sampling-verification-methodology"]], "whose example weights each duplicate at about 1,075 signatures"],
    ["26 doubles and about 28,000 in LA County", [["the Secretary of State's report on initiative 2017", "https://elections.cdn.sos.ca.gov/ccrov/2026/june/26160jh.pdf"]], "Warmup's arithmetic from its LA County row"],
    /* a row can also be one sentence with its links marked {words|address}, when the script's words run between the links */
    ["Firms check validity before paying, or track it by canvasser", "{Wilson v. The La Jolla Group|https://law.justia.com/cases/california/court-of-appeal/2021/d077134.html} for one broker, and a petition vendor's own guide ({Leo Operations|https://leooperations.com/guides/ballot-measure-signature-gathering/}). Guess for any other firm"],
  ],
};

/* ---- Lesson 2. How to stop a passerby ---- */
const L2 = {
  n: 2, id: "sig2", title: "How to stop a passerby",
  parts: [
    { name: "Says hello first", done: "Said hello first.", missed: "Didn't start with hello.", tip: "Start with 'Hi there.' A hello turns a stranger into a person." },
    /* version 5 (Robert, Nov 20): part 2 counts when the opener names the hours after "for" or a verb. missedAlt is the line for an opener
       that had only the topic, missedLong for one that said too much before the question, missedUntrue for something the measure doesn't say. */
    { name: "Says what the petition is for", done: "Said what the petition is for.", missed: "Didn't say what the petition is for.", missedAlt: "Said only the topic, not what the petition is for.", missedLong: "Said too much before the question.", missedUntrue: "Said something the measure doesn't say.", tip: "Say what it does: 'to keep funding schools and health care.' Leave out 'save.' Nothing says schools are closing." },
    { name: "Asks if they're registered to vote in LA County", done: "Asked if they're registered in LA County.", missed: "Didn't ask about LA County.", tip: "End on 'Are you registered to vote in LA County?' A yes is your stop." },
    { name: "Don't ask for a minute or say sorry", done: "Didn't ask for a minute.", missed: "Asked for a minute.", missedAlt: "Said sorry first.", missedSorry: "Said sorry.", missedSlow: "Took so long they walked on.", tip: "Skip 'Do you have a minute?' It makes no the easy answer." },
  ],
  tipAll: "You did all four parts in about five seconds, and every word was true. Say your opener to everyone.",
  headsUp: "Heads up: never ask for a minute.",
  nextShift: "On your next shift: say your opener to the first 20 people who walk by. Count how many stop.",
  /* the lesson end's one line on what comes next, which follows from what you just did (rule 19, Robert, Nov 21, 2026, 12:56 PM, on
     "Tomorrow: how to ask for the signature": "It seems like I wasn't already asking for the signature on these screens") */
  next: "Tomorrow: what to say once they stop.",
  steps: [
    { kind: "try1", name: "Your 1st try", secs: 34, coach: c("Let's try one. Here comes a man with a coffee. Say hi when he's close, and see if he'll stop."),
      who: "ben", walk: true, note: "Stage note, art only: Ben Feldman, 38, coffee in hand, heading for the door.",
      replies: Object.assign({ stop: s("ben", "Yeah, I'm registered.", { act: "slow" }), sure: s("ben", "Sure, I'll sign.", { act: "slow" }), lib: s("ben", "Oh, for the schools? What do you need?", { act: "slow" }), busy: s("ben", "Oh, sorry, I'm busy. Have a good day.", { act: "go" }), time: s("ben", "Sorry, I don't have a minute.", { act: "go" }), other: s("ben", "Sorry, what's this?", { act: "turn" }) }, fb("ben")) },
    /* version 10 (Robert, Nov 21, 2026, 12:56 PM: "She does this all day" is unclear, "Listen to a well-trained canvasser ... do the opening
       here really well," and "You don't even need to know the four things"): each example opens on its own sheet (Example 1 of 2 and
       Example 2 of 2, rule 13a), each part shows up ticked as she says it (a tick lands where its words end: line, at), then the why */
    { kind: "hear", name: "Hear it done", secs: 60, coach: c("Listen to a trained canvasser open well."),
      scenes: [
        { who: "tanya", pic: "tanya-cart", head: "How a trained canvasser opens", note: "Stage note, art only: Lena stands in front of her table, board in hand. Tanya Brooks, 45, pushes a shopping cart with her daughter riding in it.",
          lines: [s("lena", OPENER), s("tanya", "I am, yeah. Sure, I'll sign.", { act: "slow" })],
          ticks: [{ text: "She said hi.", line: 0, at: "Hi there!" }, { text: "She said what it's for, in one short sentence.", line: 0, at: "health care." }, { text: "She asked if the woman is registered to vote in LA County.", line: 0, at: "?" }, { text: "She never asked for a minute.", line: 0, at: "?", late: 700 }],
          after: c("A yes means the woman can sign, and now they're talking. The whole opener took about eight seconds.") },
        { who: "dwayne", note: "Stage note, art only: Dwayne Carter, 58, walks up.", intro: c("Here's one more. This time, the man isn't registered."), head: "When the passerby isn't registered",
          lines: [s("lena", OPENER), s("dwayne", "No, I'm not."), s("lena", "No problem. Have a good one!"), s("dwayne", "You too!", { act: "go" })],
          after: c("He can't sign, so she lets him go and turns to the next person. His no just saved her a minute.") },
      ] },
    { kind: "taps", name: "Where to stand", secs: 27,
      qs: [
        /* version 10 (Robert, Nov 21, 2026, 12:56 PM: "you're seated and paying attention, or you're standing and paying attention"): the one
           difference is sitting or standing; the chair and the drive's sign ("Schools and Health Care" since version 13) are in both (rule 67) */
        { ask: "Which canvasser gets more passersby to stop?", pics: ["sit", "stand"], alt: ["A canvasser sitting behind the table, watching passersby walk up.", "The same canvasser standing behind the table, watching passersby walk up."], right: 1,
          after: c("B is right. Passersby stop for someone who is standing and ready to meet them. Stand up, and step out in front of the table when you can.") },
        { ask: "To collect more signatures per hour, which is a better place to stand?", pics: ["doorway", "side"], alt: ["A canvasser standing in the middle of the doorway, with shoppers squeezing past.", "A canvasser a few steps to the side of the door, where people pass close by and have room to keep going."], right: 1,
          after: c("B is right. Stand where passersby walk, and never block the way. Anyone who wants to keep walking can.") },
      ] },
    { kind: "spot", name: "Catch the mistake", secs: 40, head: "Listen for the one mistake.", coach: c("Here's a new canvasser. Listen for the one thing that goes wrong."), who: "hank", by: "rico",
      note: "Stage note, art only: Hank Dawson, 71, walks up with a newspaper under his arm.",
      /* version 8 (Robert): a yes-or-no question gets yes, no or "I'm not sure", never "Not really." He answers the minute, so it's plain what he said no to */
      lines: [s("rico", "Hi! Do you have a minute? I'm collecting signatures for a ballot measure to keep funding schools and health care. Are you registered to vote in LA County?"), s("hank", "Sorry, I don't have a minute.", { act: "go" })],
      ask: "Which part did the new canvasser get wrong?", opts: ["He didn't say hi", "He didn't say what the petition is for", "He didn't ask if the man is registered in LA County", "He asked for a minute"], right: 3,
      after: "He asked for a minute, so saying no was easy. Without that question, the man might have stopped to hear what it's for." },
    /* version 8 (Robert: "Guess how many stop" didn't say who, and the screen was "just bad UX"): the button names the passersby, and
       the answer shows on a row of 20 passersby, the ones who stop in green. Version 10 (Robert, Nov 21, 2026, 12:56 PM): every option
       a single number (rule 43); the 20 come with the answer (rule 49b); the answer says what to do because of it, ask everyone, and
       that the no's are normal (rule 17a); its one source (rule 46) */
    { kind: "taps", name: "How many passersby stop", guess: true, secs: 24,
      qs: [{ ask: "What percent of passersby stop for a good canvasser?", opts: ["5%", "30%", "60%"], of20: [1, 6, 12], right: 0,
        sources: [["About 5% stop", [["KPBS, 2016", "https://www.kpbs.org/news/2016/may/11/california-elections-are-bonanza-signature-gathere/"]], "one strategist's estimate of five or six stops per hundred"]],
        after: c("About 5% stop, even for a good canvasser: one passerby in every 20. So say your opener to everyone who walks by. The no's are normal, and they're how you find the yeses.") }] },
    /* version 10 (Robert, Nov 21, 2026, 12:56 PM: "framing that your second try is three parts when your first try was just one part ...
       throws me off"): it opens like the 1st try, on one passerby, and the next comes after (rule 16) */
    { kind: "try2", name: "Your 2nd try", secs: 80, coach: c("Your turn again. Here comes a woman with a tote bag. Say hi when she's close, and see if she'll stop."),
      people: [
        { who: "soojin", walk: true, note: "Stage note, art only: Soo-jin Kim, 67, with a tote bag.", replies: Object.assign({ stop: s("soojin", "Yes, I am.", { act: "slow" }), sure: s("soojin", "Oh, that's nice. Sure, I'll sign.", { act: "slow" }), lib: s("soojin", "Oh, for the schools? What do you need?", { act: "slow" }), busy: s("soojin", "Oh, sorry, I'm busy. Have a good day.", { act: "go" }), other: s("soojin", "Sorry, what's this for?", { act: "turn" }) }, fb("soojin")) },
        /* who comes next is named by the button alone (version 8, Robert: "You can just have that be in the button") */
        { who: "kayla", walk: true, note: "Stage note, art only: Kayla Jones, 24, earbuds in.", upBtn: "Next: a woman with earbuds",
          replies: Object.assign({ not: s("kayla", "Oh. I'm not registered.", { act: "turn" }), lib: s("kayla", "Oh, for the schools? What do you need?", { act: "turn" }), busy: s("kayla", "Oh, sorry, I'm busy. Have a good day.", { act: "go" }), bye: s("kayla", "Thanks! Have a good one.", { act: "go" }) }, fb("kayla")) },
        /* someone new is "a" or "an" (rule 39e, Robert, Nov 21, 2026, 12:56 PM: "Please change the button language to 'a man in an apron'") */
        { who: "luis", walk: true, note: "Stage note, art only: Luis Ortega, 29, in a kitchen apron, heading to work.", upBtn: "Next: a man in an apron",
          replies: Object.assign({ stop: s("luis", "Yeah, I'm registered.", { act: "slow" }), sure: s("luis", "Cool. Sure, I'll sign.", { act: "slow" }), lib: s("luis", "Oh, for the schools? What do you need?", { act: "slow" }), busy: s("luis", "Oh, sorry, I'm busy. Have a good day.", { act: "go" }), other: s("luis", "Sorry, what's this for?", { act: "turn" }) }, fb("luis")) },
      ] },
    { kind: "end", name: "Feedback and lesson done", secs: 31 },
  ],
  sources: [
    ["Five or six stops per hundred", [["KPBS, 2016", "https://www.kpbs.org/news/2016/may/11/california-elections-are-bonanza-signature-gathere/"]], "one strategist's estimate"],
    ["A spoken ask raises givers and a third of shoppers avoid it", [["Andreoni, Rao and Trachtman", "https://econweb.ucsd.edu/~jandreon/WorkingPapers/AndreoniRaoTrachtman.pdf"]], "a charity study used here as an analogy"],
    ["Direct requests, eye contact, smiling and a small first request", [["Hadi and colleagues, Voluntas, 2026", "https://www.cambridge.org/core/journals/voluntas/article/state-of-the-art-and-future-research-directions-in-facetoface-fundraising-a-systematic-literature-review/F15A95B216CC7CD05E92E7C29A1F72CD"]], "a review of charity fundraising studies"],
    ["Hourly benchmarks", [["Change Laws Now post", "https://www.career.com/job/change-laws-now/petition-circulator/j202604120919356252670"], ["Wilson v. The La Jolla Group", "https://law.justia.com/cases/california/court-of-appeal/2021/d077134.html"], ["NJ Libertarian Party", "https://njlp.org/news-top/35-candidates/169-petitioning"], ["Clean the Darn Air", "https://www.cleanthedarnair.org/guide-to-signature-gathering-in-utah/"]]],
    ["Greet warmly, make eye contact, walk toward people", [["Arizona's training guide", "https://wickenburgaz.gov/DocumentCenter/View/11663/Petition-Circulation-Training-Guide-from-SOS"]]],
    ["Stand in front of the table and invite people over", [["Public Citizen", "https://www.citizen.org/article/tips-for-petitioning-in-your-community/"]]],
    ["Fast stopper lines, and not blocking traffic", [["CFER tips for petitioners", "https://cfer.org/campaign/petitioners.html"]]],
    ["A voter question as the opener", [["a Reclaim Idaho volunteer's tactics", "https://medium.com/cam-crow/individual-tactics-for-collecting-ballot-initiative-signatures-b2a628251f17"], ["SF Examiner", "https://www.sfexaminer.com/after-dealing-drugs-in-las-vegas-he-found-signature-gathering-more-lucrative/article_3f4e108c-ed94-5c47-8abe-ee9c8cf5fdff.html"]]],
    ["What the petition is for has to be true", [["Elections Code 18600", "https://california.public.law/codes/elections_code_section_18600"]]],
    ["Registered voters of one county", [["Elections Code 100", "https://california.public.law/codes/elections_code_section_100"], ["Elections Code 9021", "https://california.public.law/codes/elections_code_section_9021"]]],
  ],
};

/* ---- Lesson 3. How to ask for the signature ---- */
const L3 = {
  n: 3, id: "sig3", title: "How to ask for the signature",
  parts: [
    { name: "Says they're paid and shows the top funders", step: "Saying you're paid and showing the funders", must: "Saying you're paid and showing the funders is a must. Try it once more.", done: "Said you're paid and showed the top funders.", missed: "Didn't say you're paid.", missedAlt: "Didn't show the top funders.", missedVague: "Said you're paid too late.", missedFundersLate: "Showed the top funders too late.", tip: "Say 'I'm paid to gather these signatures' and show the top funders before handing over the petition." },
    { name: "Says what it does and how it's paid for", step: "Telling both halves", must: "Telling both halves is a must. Try it once more.", done: "Said what it does and how it's paid for.", missed: "Left out how it's paid for.", missedAlt: "Left out what it does.", missedUntrue: "Said something the measure doesn't say.", missedWho: "Didn't say who pays the tax.", tip: "Tell both halves every time: what the measure does and how it's paid for." }, /* missedWho (version 13): a tax with nobody named to pay it */
    { name: "Asks if they've signed this one already", done: "Asked if she signed this one already.", missed: "Didn't ask about a double.", tip: "Ask 'Have you signed this one already?' before the pen moves." },
    { name: "Asks for the signature and leaves the choice with them", done: "Asked for the signature.", missed: "Didn't ask for the signature.", missedVague: "Pushed her to sign.", tip: "Ask 'Will you sign to put it on the ballot?' and hold out the pen." },
  ],
  tipAll: "You said you're paid, told both halves, checked for a double and asked clearly. That's a signature you can stand behind.",
  headsUp: "Heads up: say you're paid and show the top funders before the petition leaves your hand.",
  nextShift: "On your next shift: say you're paid and show the top funders before the petition leaves your hand, every time.",
  next: "Tomorrow: what to do once they say yes.",
  steps: [
    { kind: "try1", name: "Your 1st try", secs: 33, coach: c("Let's try one. A woman with a shopping cart heard your opener and stopped. Go ahead and ask for her signature."), who: "tanya", pic: "tanya-cart",
      note: "Stage note, art only: Tanya Brooks, 45, her daughter in the cart, has stopped at the table.",
      opens: s("tanya", "Yeah, I'm registered. What's this about?"),
      replies: Object.assign({ yes: s("tanya", "Okay, sure.", { act: "pen" }), wait: s("tanya", "So, do you need something from me?"), nodbl: s("tanya", "No, I haven't signed it.") }, fb("tanya")) },
    { kind: "hear", name: "Hear it done", secs: 57, coach: c("Listen to a trained canvasser ask for the signature. An older man heard her opener and stopped."),
      sources: [["Saying you're paid", [["SB 1369's chaptered text", "https://legiscan.com/CA/text/SB1369/2025"]]], ["Showing this month's top funders", [["Elections Code 107", "https://california.public.law/codes/elections_code_section_107"]]], ["About 1,000 per double", [["2 CCR 20531 and 20540", "https://www.sos.ca.gov/administration/regulations/current-regulations/elections/election-petition-signature-verification-random-sampling-verification-methodology"]]]],
      scenes: [{ who: "bob", stopped: true, head: "How a trained canvasser asks", note: "Stage note, art only: Bob Hall, 73, has stopped at the table.",
        lines: [
          s("bob", "I'm registered. What've you got?"),
          s("lena", "Thanks for stopping. I'm paid to gather signatures, and here are this month's top funders.", { act: "sheet", printed: "Thanks for stopping. I'm paid to gather signatures." }),
          s("lena", "It makes funding for schools and health care permanent, and it's paid for by keeping today's tax on high incomes. Have you signed this one already?"),
          s("bob", "No, first I've heard of it."),
          s("lena", "Then here's the petition. Will you sign to put it on the ballot?", { act: "board" }),
          s("bob", "All right. Where do I sign?", { act: "pen" }),
        ],
        ticks: [
          { text: "She said she's paid and showed the top funders.", line: 1, printed: { text: "She said she's paid." } },
          { text: "She said what it does and how it's paid for.", line: 2, at: "high incomes." },
          { text: "She asked if he signed this one already.", line: 2, at: "?" },
          { text: "She asked for the signature and left the choice with him.", line: 4 },
        ],
        after: c("The law requires saying you're paid and showing the top funders before the petition leaves her hand, even if nobody asks. And one double can cost about 1,000 signatures.", { printed: "The law requires saying you're paid before the petition leaves her hand, even if nobody asks. And one double can cost about 1,000 signatures." }) }] },
    { kind: "taps", name: "Three taps on honest wording", short: "honest wording", secs: 64,
      qs: [
        /* pic: what the screen shows above the options. It has no words of its own: a person from the cast, or the thing the question describes. */
        { pic: { who: "tanya" }, ask: "Which line about the measure can you say?", opts: ["It keeps our schools from closing.", "It funds schools and health care, and it won't cost you a thing.", "It makes school and health care funding permanent with today's tax on high incomes."], quote: true, right: 2,
          after: c("C is right. Nothing in the measure says schools are closing, and nobody can promise what a tax will cost.") },
        { pic: { sheet: "March", day: ["April", "3"] }, ask: "Your top funders sheet says 'Valid only for March.' It's April 3. What do you do?", opts: ["Use it anyway.", "Get this month's sheet from your lead.", "Skip the sheet today."], right: 1,
          after: c("B is right. A sheet is only good for the month printed on it."),
          printed: { pic: { who: "soojin" }, ask: "A passerby asks who is paying for the drive. What do you do?", opts: ["Say you don't know.", "Point to the top funders box on the petition.", "Say it's the schools."], right: 1, after: c("B is right. The top funders are printed in the box on the petition, so point to the box.") } },
        { pic: { who: "luis" }, ask: "A passerby thinks he signed this petition last week. What do you do?", opts: ["Thank him and move on.", "Have him sign again to be safe.", "Have him sign, then tell your lead it might be a double."], right: 0,
          sources: [["Each signer may sign once", [["Statewide Initiative Guide", "https://elections.cdn.sos.ca.gov/ballot-measures/pdf/statewide-initiative-guide.pdf"]]], ["About 1,000 per double", [["2 CCR 20531 and 20540", "https://www.sos.ca.gov/administration/regulations/current-regulations/elections/election-petition-signature-verification-random-sampling-verification-methodology"]]]],
          after: c("A is right. A second signature never helps, and it can cost the drive about 1,000.") },
      ] },
    { kind: "spot", name: "Catch the mistake", secs: 46, head: "Listen for the missing part.", coach: c("Here's the new canvasser again. One part is missing."), who: "soojin", by: "rico", stopped: true, note: "Stage note, art only: Soo-jin Kim, 67, with a tote bag, has stopped.",
      lines: [
        s("rico", "Here are this month's top funders. It makes funding for schools and health care permanent, and it's paid for by keeping today's tax on high incomes. Have you signed this one already?",
          { act: "sheet", printed: "It makes funding for schools and health care permanent, and it's paid for by keeping today's tax on high incomes. Have you signed this one already?" }),
        s("soojin", "No, I haven't."), s("rico", "Here's the petition. Will you sign to put it on the ballot?", { act: "board" }), s("soojin", "Sure. I guess you're a teacher.", { act: "pen" }),
      ],
      ask: "Which part did the new canvasser leave out?", opts: ["He didn't say he's paid", "He didn't say what it does and how it's paid for", "He didn't ask if she already signed", "He didn't ask for the signature"], right: 0,
      after: "He never said he's paid, so she had to guess who he works for." },
    /* version 10 (rule 16): the line is about the first passerby only */
    { kind: "try2", name: "Your 2nd try", secs: 78, coach: c("Your turn again. Here comes a woman in scrubs. Do the whole stop, starting from hello."),
      people: [
        { who: "marisol", walk: true, note: "Stage note, art only: Marisol Vega, 34, in scrubs.", scored: true,
          replies: Object.assign({ reg: s("marisol", "Yes, I'm registered. I've got a minute.", { act: "slow" }), what: s("marisol", "Hi. What's this one for?", { act: "slow" }), lib: s("marisol", "Oh, for the schools? What do you need?", { act: "slow" }), dbl: s("marisol", "No, I haven't signed it."), yes: s("marisol", "Sure. Where do I sign?", { act: "pen" }), wait: s("marisol", "So, what do you need from me?") }, fb("marisol")) },
        /* version 10: who comes next is said by the button alone (rule 16), "a man in an apron" (rule 39e) */
        { who: "luis", stopped: true, upBtn: "Next: a man in an apron", note: "Stage note, art only: Luis Ortega, 29, in a kitchen apron.",
          replies: Object.assign({ what: s("luis", "Hey. What's this one for?"), signed: s("luis", "Oh, the school one. I think I signed that at the farmers market last week."), go: s("luis", "Cool. Good luck out here.", { act: "go" }), again: s("luis", "Are you sure? I'm pretty sure I signed it.") }, fb("luis")) },
      ] },
    { kind: "end", name: "Feedback and lesson done", secs: 31 },
  ],
  sources: [
    ["The spoken paid disclosure", [["SB 1369's chaptered text", "https://legiscan.com/CA/text/SB1369/2025"], ["Assembly Elections Committee analysis", "https://aelc.assembly.ca.gov/media/2686"]], "The text names no penalty"],
    ["The Top Funders sheet, its \"Valid only for\" month and the duty to present it", [["Elections Code 107", "https://california.public.law/codes/elections_code_section_107"], ["the Secretary of State's Official Top Funders page", "https://www.sos.ca.gov/elections/ballot-measures/initiative-and-referendum-status/official-top-funders"], ["2 CCR 20950", "https://www.sos.ca.gov/administration/regulations/current-regulations/elections/petition-processing-signature-verification-ballot-processing-and-ballot-counting"]]],
    ["Misstating a petition, and lying about being paid when asked", [["Elections Code 18600", "https://california.public.law/codes/elections_code_section_18600"]]],
    ["Letting anyone read it, and never blocking the summary", [["Elections Code 18601", "https://california.public.law/codes/elections_code_section_18601"], ["Elections Code 18602", "https://california.public.law/codes/elections_code_section_18602"]]],
    ["Each signer may sign once", [["Statewide Initiative Guide", "https://elections.cdn.sos.ca.gov/ballot-measures/pdf/statewide-initiative-guide.pdf"]]],
    ["Doubles and their weight", [["LA County, 2022", "https://lacounty.gov/2022/08/15/registrar-recorder-county-clerk-completes-petition-verification-for-district-attorney-recall-attempt/"], ["2 CCR 20531 and 20540", "https://www.sos.ca.gov/administration/regulations/current-regulations/elections/election-petition-signature-verification-random-sampling-verification-methodology"]]],
    ["A signature sends the measure to the voters", [["how to qualify an initiative", "https://www.sos.ca.gov/elections/ballot-measures/how-qualify-initiative"]]],
    ["Holding out the pen and asking", [["CFER tips for petitioners", "https://cfer.org/campaign/petitioners.html"], ["RepresentUs", "https://represent.us/resource-library/how-to-host-a-petitioning-or-tabling-event/"]]],
  ],
};

/* ---- Lesson 4. How to make every line count ---- */
const L4 = {
  n: 4, id: "sig4", title: "How to make every line count",
  parts: [
    { name: "Asks them to print their name", done: "Asked her to print her name.", missed: "Didn't ask her to print her name.", tip: "Start with 'Print your name here.' It gets the pen moving in the right box." },
    { name: "Asks for the address where they're registered to vote", done: "Asked for the address where she's registered.", missed: "Didn't ask for the address where she's registered.", tip: "Say 'the address where you're registered to vote.' It guards against a wrong address." },
    { name: "Keeps the pen in the signer's hand", step: "Keeping the pen in the signer's hand", must: "The signer writes every word on their line, and that's a must. Try it once more.", done: "Kept the pen in her hand.", missed: "Offered to write on her line.",
      missedAlt: "Didn't tell her she has to write it herself.", tip: "Keep the pen in their hand. Offer to hold the bag." },
    { name: "Catches the gap before the signer leaves", done: "Caught the empty signature box.", missed: "Let her go with the box empty.", missedVague: "Let her go before she filled in the line.", tip: "Before they leave, look at the name, signature, address and city. Then say thanks." },
  ],
  tipAll: "Every box was in her own writing, and you checked it before she left. That's a good line.",
  headsUp: "Heads up: the signer writes every word on their line.",
  nextShift: "On your next shift: before each signer walks away, look at the name, signature, address and city.",
  next: "Tomorrow: what to say when someone asks a hard question.",
  steps: [
    { kind: "try1", name: "Your 1st try", secs: 31, coach: c("Let's try one. A woman said yes and came over to your board. She has a grocery bag in each hand."), who: "anika", pic: "anika-bags", note: "Stage note, art only: Anika Rao, 41.", line: {},
      opens: s("anika", "Can you just fill in my address for me? My hands are full."),
      replies: Object.assign({ self: s("anika", "Oh, okay. Hold this for a second?", { act: "pen" }), agree: s("anika", "Thanks! It's 88 Hill Street."), other: s("anika", "So can you write it for me?") }, fb("anika")) },
    { kind: "hear", name: "Hear it done", secs: 51, play: "Start watching", coach: c("Watch the line as a trained canvasser helps an older man who said yes."),
      scenes: [{ who: "bob", pic: "bob-pen", stopped: true, head: "How a trained canvasser helps with the line", note: "Stage note, art only: Bob Hall, 73, pen in hand.", line: {},
        lines: [
          s("lena", "Print your name right here. Then sign, and then write the address where you're registered to vote."),
          s("bob", "Can you write it for me? My handwriting's terrible."),
          s("lena", "It has to be in your handwriting. Terrible is fine. Take your time.", { fillAfter: { name: "Bob Hall", sig: true, addr: "1530 Juniper Ave." } }),
          s("lena", "Bob, your city and zip are still blank. Could you add them?", { glow: ["city", "zip"] }),
          s("bob", "It's Los Angeles, 90024. There you go.", { fill: { city: "Los Angeles", zip: "90024" }, say: "It's Los Angeles, nine oh oh two four. There you go." }),
          s("lena", "That's a good line. Thank you!"), s("bob", "Thank you! Good luck.", { act: "go" }),
        ],
        ticks: [{ text: "She asked him to print his name.", line: 0, at: "right here." }, { text: "She asked for the address where he's registered to vote.", line: 0 }, { text: "She kept the pen in his hand.", line: 2, at: "handwriting." }, { text: "She looked at the line before he left and caught the gap.", line: 3 }],
        after: c("The signer writes every word, so the pen stays in his hand. And one look before he leaves catches a gap while it can still be fixed.") }] },
    { kind: "lines", name: "Check four lines", secs: 64, coach: c("Now it's your turn to look at four lines. Tap the box that will get each line thrown out, or tap Good to go."), ask: "Which box gets this line thrown out?", ok: "Good to go",
      lines: [
        { tag: "A", fill: { name: "Dana Whitfield", sig: true, addr: "PO Box 5512", city: "Culver City", zip: "90230" }, right: "addr", why: "A PO box alone gets the line thrown out. Ask for the street address where she's registered." },
        { tag: "B", fill: { name: "Marcus Bell", sig: false, addr: "3120 Alder St.", city: "Los Angeles", zip: "90066" }, right: "sig", why: "The signature box is empty. Ask him to sign before he goes." },
        { tag: "C", fill: { name: "Liz Cruz", sig: true, addr: "2210 Larkspur Blvd.", city: "Santa Monica", zip: "90405" }, note: "Her voter record says Elizabeth Cruz at this address.", right: "ok", why: "It's good to go. A nickname is fine when the address matches and the signature is hers." },
        /* the script gives line D Los Angeles, 90034, and says to keep the build's values where they differ: the build has 90018 */
        { tag: "D", fill: { name: "James Okafor", sig: true, addr: "915 Marigold Blvd", city: "Los Angeles", zip: "90018", other: ["addr"] }, note: "The canvasser wrote this address for him.", right: "addr", why: "The signer has to write every word. An address in someone else's writing gets the line thrown out." },
      ] },
    { kind: "taps", name: "What now?", secs: 50,
      qs: [
        { pic: { line: { name: "Dana Whitfield", sig: true, addr: "PO Box 5512", city: "Culver City", zip: "90230" }, glow: ["addr"] }, ask: "A signer wrote the wrong address. How do you fix the line?", opts: ["Use white-out.", "Write the right address yourself.", "Have the signer cross out the line and fill in the next one."], right: 2,
          after: c("C is right. Never use white-out, and never write on a signer's line. A fresh line in the signer's own writing is the fix.") },
        { pic: { who: "theo" }, ask: "A passerby moved last month and hasn't updated his voter registration. What should he do?", opts: ["Write his old address.", "Write his new address and sign.", "Update his registration first, then sign."], right: 2,
          after: c("C is right. His line needs his current address, and it must match his voter record. He can update his registration at registertovote.ca.gov, then sign. Never promise his line will count.", { say: "C is right. His line needs his current address, and it must match his voter record. He can update his registration at register to vote dot C A dot gov, then sign. Never promise his line will count." }) },
      ] },
    { kind: "decl", name: "Your line", secs: 33,
      coach: c("Every sheet has one more line, and it's yours: the Declaration of Circulator. It says you gathered these signatures, watched each one being written and showed every signer this month's top funders.",
        { printed: "Every sheet has one more line, and it's yours: the Declaration of Circulator. It says you gathered these signatures and watched each one being written." }),
      cards: ["The canvasser filled it in after the last signature, then signed and dated it.", "The canvasser left it blank.", "The canvasser's lead filled it in, and the canvasser signed."],
      ask: "Which two get the whole sheet thrown out? Tap both.", right: [1, 2],
      after: c("The blank one and the one your lead filled in each cost the whole sheet. After the last signature, write your name, your address and the first and last days you gathered on that sheet. Then sign and date it, all in your own writing.") },
    { kind: "try2", name: "Your 2nd try", secs: 49, coach: c("A woman with her daughter is registered and ready to sign. Before the pen moves, ask if she's signed this one already. Then walk her through the line."),
      people: [{ who: "tanya", pic: "tanya-tug", stopped: true, note: "Stage note, art only: Tanya Brooks, 45, her daughter tugging at her sleeve.", scored: true, line: {},
        fill: { name: "Tanya Brooks", addr: "2748 Wren Ave.", city: "Los Angeles", zip: "90064" },
        replies: Object.assign({ nodbl: s("tanya", "No, I haven't signed it."), ask: s("tanya", "Can you fill in the address for me, though? I've got my hands full with this one."), ask0: s("tanya", "Can you fill in the address for me? I've got my hands full with this one."),
          self: s("tanya", "Okay, I'll write it. Hang on.", { act: "pen" }), set: s("tanya", "All set?"), oops: s("tanya", "Oh! I skipped it."), there: s("tanya", "There you go."), good: s("tanya", "Great, thanks!", { act: "go" }) }, fb("tanya")) }] },
    { kind: "end", name: "Feedback and lesson done", secs: 31 },
  ],
};

/* ---- Lesson 5. How to answer a hard question ---- */
const L5 = {
  n: 5, id: "sig5", title: "How to answer a hard question",
  parts: [
    { name: "Answers the question straight, first", step: "A straight, true answer", must: "A straight, true answer is a must. Try it once more.", done: "Answered the question straight, first.", missed: "Dodged the question.", missedAlt: "Said something that isn't true.",
      tip: "Answer first. When they ask about a tax, the first word is 'yes.'", tipPaid: "Answer first. When someone asks if you're a volunteer, say 'No, I'm paid to gather signatures.'" },
    { name: "Shows the petition", done: "Showed where it's printed.", missed: "Didn't show the petition.", tip: "Point to the page: 'It's printed right here.' The petition backs you up." },
    { name: "Asks once more", done: "Asked once more.", missed: "Didn't ask again.", tip: "After you answer, ask once: 'Want to sign?'" },
    { name: "Lets a no go", done: "Let the no go with a thank-you.", missed: "Argued after a no.", missedAlt: "Asked again after a no.", missedVague: "Didn't thank her and let her go.", tip: "When it's a no, say thanks and let them go. Someone else is always coming." },
  ],
  tipAll: "You answered straight, showed the page, asked once and said a clean goodbye. That's the whole job done right.",
  headsUp: "Heads up: answer the question first, and only with what's true.",
  nextShift: "On your next shift: when a question comes, answer it first. Then point to the page.",
  steps: [
    { kind: "try1", name: "Your 1st try", secs: 33, coach: c("Let's try one. An older man stopped, and you told him what the measure does. He has a question for you."), who: "hank", pic: "hank-pen", note: "Stage note, art only: Hank Dawson, 71, with a newspaper, holding the pen.",
      opens: s("hank", "Hold on. Is this a tax?"),
      replies: Object.assign({ straight: s("hank", "Huh. Okay. At least you told me straight. I'll sign.", { act: "pen" }), dodge: s("hank", "Says here it's a tax. I'll pass, thanks.", { act: "go" }) }, fb("hank")) },
    { kind: "hear", name: "Hear it done", secs: 48, coach: c("Listen to a trained canvasser answer a hard question. A woman has stopped at the table."),
      scenes: [{ who: "joan", stopped: true, head: "How a trained canvasser answers", note: "Stage note, art only: Joan Whitaker, 60, owns a print shop, in a work apron.",
        lines: [
          s("joan", "Is there a tax in this?"),
          s("lena", "Yes. It keeps today's tax on high incomes, so it doesn't end in 2031. It's printed right here in the summary. Take a look.", { act: "board", pauseAfter: 1800 }),
          s("lena", "Want to sign?"), s("joan", "No, not today. I don't like making a tax permanent."),
          s("lena", "No problem. Thanks for stopping. Have a good one."), s("joan", "You too. Thanks for being straight with me.", { act: "go" }),
        ],
        ticks: [{ text: "She answered the question, and the answer was true.", line: 1, at: "2031." }, { text: "She showed the woman where the tax is printed.", line: 1 }, { text: "She asked once more.", line: 2 }, { text: "When the woman said no, she let her go with a thank-you.", line: 4 }],
        after: c("Some people sign after a straight answer and some don't. Either way, she's free for the next person in twenty seconds.") }] },
    { kind: "taps", name: "Four straight answers", short: "straight answers", secs: 80, coach: c("You'll hear these four questions this week. Tap the straight answer to each one."),
      qs: [
        { pic: { who: "soojin" }, ask: "'Are you getting paid for this?' Which answer is straight?", opts: ["I'm just here for the schools.", "Yes, I'm paid to gather signatures."], quote: true, right: 1, after: c("B is right. You already said you're paid once, so say it again.") },
        { pic: { who: "bob" }, ask: "'If I sign, am I voting for it?' Which answer is straight?", opts: ["No. Signing only helps put it on the ballot. The voters decide.", "Pretty much. Signing means you support it."], quote: true, right: 0, after: c("A is right. A signature helps put the question on the ballot, and it isn't a vote.") },
        { pic: { who: "anika" }, ask: "'How much is the tax?' Which answer is straight?", opts: ["It's tiny. You won't notice it.", "I don't know. The summary doesn't say. The full text is right here."], quote: true, right: 1, after: c("B is right. Never guess. 'I don't know, but it's printed right here' is a whole answer, and you can ask your lead later.") },
        { pic: { who: "ines" }, ask: "'What do I get for signing?' Which answer is straight?", opts: ["Nothing from me. I can't give anything for a signature.", "You get a free pen if you sign."], quote: true, right: 0, after: c("A is right. Giving anything of value for a signature is against the law, even something small.") },
      ] },
    { kind: "spot", name: "Catch the mistake", secs: 44, head: "Listen for the part that goes wrong.", coach: c("Here's the new canvasser one last time. Listen for the part that goes wrong."), who: "karim", by: "rico", stopped: true, note: "Stage note, art only: Karim Nassar, 33, a rideshare driver between rides, car keys in his hand.",
      lines: [s("karim", "Is this a tax thing?"), s("rico", "Don't worry about that part. It's all about our schools. It's right here. Want to sign?", { act: "board" }), s("karim", "No, I'll pass."), s("rico", "No problem. Have a good one."), s("karim", "Thanks. You too.", { act: "go" })],
      ask: "Which part did the new canvasser get wrong?", opts: ["He didn't answer the question straight", "He didn't show the petition", "He didn't ask again", "He didn't let the no go"], right: 0,
      after: "He dodged. The man asked about a tax and got an answer about schools. Misleading a signer about what a petition does is a crime in California. Say yes, name the tax and point to the summary." },
    /* version 10 (rule 16): the line is about the first passerby only, and his line joins it on the sheet */
    { kind: "try2", name: "Your 2nd try", secs: 64, coach: c("Your last try. A man with a coffee has stopped, and you've told him what the measure does."),
      people: [
        { who: "ben", stopped: true, note: "Stage note, art only: Ben Feldman, 38, with a coffee.", scored: true, opens: s("ben", "Wait. Are you a volunteer?"), hint: "Walk him through the line.",
          replies: Object.assign({ paid: s("ben", "Fair enough. Thanks for telling me."), dodge: s("ben", "Sorry, but are you a volunteer or not?"), yes: s("ben", "Sure, I'll sign.", { act: "pen" }), noask: s("ben", "Okay. Is there something you want me to sign?") }, fb("ben")) },
        /* no card comes between the two in this lesson, so a sheet says who's next (the outside review, Nov 21; rule 16) */
        { who: "pat", stopped: true, note: "Stage note, art only: Pat Sullivan, 64, a retired bookkeeper.", scored: true, upBtn: "Next: an older woman", intro: "An older woman has stopped at the table too.", introBtn: "Talk to her", opens: s("pat", "Before I sign anything, is there a tax in this?"),
          replies: Object.assign({ wait: s("pat", "So what do you want me to do?"), dodge: s("pat", "That isn't what I asked. Is there a tax in it or not?"), no1: s("pat", "I appreciate the straight answer."), no2: s("pat", "No. I don't sign anything with a tax in it."),
            thanks: s("pat", "You're the first one out here who just told me. Good luck.", { act: "go" }), thanksDodge: s("pat", "Okay. Bye now.", { act: "go" }), argue: s("pat", "Like I said, no thanks.", { act: "go" }) }, fb("pat")) },
      ] },
    { kind: "end", name: "Feedback and the finish line", secs: 29, finish: true },
  ],
};

export const SIG_LESSONS = { 1: L1, 2: L2, 3: L3, 4: L4, 5: L5 };
/* the four steps at the top of each lesson, by name (Robert, Nov 20, 8:23 AM; playbook rule 56). Lessons 2 to 5 use the four every
   Warmup lesson shares, and every screen between Hear it done and the 2nd try (the taps, Rico) sits in Catch the mistake. Lesson 1
   has its own steps, so it gets its own four. of: the step each screen belongs to, in order. */
export const SIG_FOUR = ["Your 1st try", "Hear it done", "Catch the mistake", "Your 2nd try"];
/* the line under each step's name on its Part N of 4 screen, as the door-knocking lessons have (curriculum version 7) */
const FOUR_LINES = ["Now you talk. Say what you’d say first.", "Listen to a trained canvasser.", "Spot what a new canvasser gets wrong.", "Now put it all together."];
const PHASES = {
  1: { names: ["How it counts", "Sort and guess", "Say it", "A whole stop"], lines: ["See how the county checks a signature.", "Sort signed petition lines, then make a few guesses.", "Now you talk. Ask the question in your own words.", "Watch a trained canvasser do a whole stop, then say two of her lines."], of: [0, 0, 1, 1, 1, 2, 3, 3] },
  2: { names: SIG_FOUR, lines: FOUR_LINES, of: [0, 1, 2, 2, 2, 3, 3] },
  3: { names: SIG_FOUR, lines: FOUR_LINES, of: [0, 1, 2, 2, 3, 3] },
  4: { names: SIG_FOUR, lines: FOUR_LINES, of: [0, 1, 2, 2, 2, 3, 3] },
  5: { names: SIG_FOUR, lines: FOUR_LINES, of: [0, 1, 2, 2, 3, 3] },
};
Object.keys(PHASES).forEach((n) => { const L = SIG_LESSONS[n], P = PHASES[n]; if (P.of.length !== L.steps.length) throw new Error("lesson " + n + ": a step with no place among the four"); L.phases = P.names; L.beats = P.lines; L.four = P.names === SIG_FOUR; L.steps.forEach((st, i) => { st.ph = P.of[i]; }); });
/* what the coach says over a card that gives one more try (the scoring contract): the untrue card, a promise and each must */
export const SIG_SAY = { untrue: c("That part isn't true. Here's the true sentence. Try it once more."), promise: c("Only the county decides. Leave out the promise and try it once more.") };
[L3, L4, L5].forEach((L) => L.parts.forEach((p) => { if (p.must) p.mustSay = c(p.must); }));
/* which lessons open from their link. Robert, Nov 19, 9:23 PM: lesson 2 first; lessons 1, 3, 4 and 5 and the card stay hidden
   until he says his lesson 2 review is done. A hidden lesson still opens with ?preview, for the build's own checks. */
export const SIG_OPEN = [2];

/* ---- the first-shift card (sent when lesson 1 ends) ---- */
export const SIG_CARD = {
  title: "Before your first signature",
  rules: [
    ["Say you're paid and show the top funders.", "The Official Top Funders sheet lists who pays for the drive. Your lead, the person who runs your shift, gives you a new one each month. Say 'I'm paid to gather these signatures, and here are this month's top funders.' Do both before you hand over the petition, every time.", { printed: ["Say you're paid.", "Say 'I'm paid to gather these signatures' before you hand over the petition, every time."] }],
    ["Tell both halves.", "'It makes funding for schools and health care permanent. It's paid for by keeping today's tax on high incomes.' Never guess. Never cover the summary. Let anyone read it."],
    ["Registered voters only.", "Open with 'Hi there! I'm collecting signatures for a ballot measure to keep funding schools and health care. Are you registered to vote in LA County?' Your sheet is for LA County voters."],
    ["One signature per person.", "Ask: 'Have you signed this one already?' If they think so, thank them and move on."],
    ["The signer writes every word on their line.", "You never write on it. If someone can't write because of a disability, call your lead first."],
    ["Watch every signature.", "Never leave the petition alone."],
    ["Never give or promise anything.", "Never give anything of value for a signature, not even a dollar or a snack. And never promise a signature will count, because only the county decides."],
    ["No white-out, and your own line last.", "A wrong line gets crossed out and the signer starts a new one. Fill in your declaration yourself after the last signature. Then sign and date it."],
  ],
};

/* ---- filling in the firm's settings ---- */
/* what the page shows: the firm's county, lead and pay line */
export function sigFill(text, st) {
  st = st || SIG_SETTINGS;
  return String(text).split("LA County").join(st.county).split("{LEAD}").join(st.lead).split("{PAYLINE}").join(SIG_PAY_LINES[st.payLine] || "");
}
/* what the recorded voice says: the same words, with the county and a few written forms spelled the way they are spoken */
export function sigSay(line, st) {
  st = st || SIG_SETTINGS;
  const base = line.say || sigText(line, st);
  return sigFill(base, st).split(st.county).join(st.countySay).replace(/\s+/g, " ").trim();
}
/* a line's words under the firm's [FUNDERS] setting */
export function sigText(line, st) {
  st = st || SIG_SETTINGS;
  return st.funders === "printed" && line.printed ? line.printed : line.text;
}
/* every spoken line of the course, in order: { n (lesson), who, voice, text, say } */
export function sigVoiceLines(st) {
  st = st || SIG_SETTINGS;
  const out = [];
  let cur = 0;
  const walk = (x) => {
    if (!x || typeof x !== "object") return;
    if (Array.isArray(x)) { x.forEach(walk); return; }
    if (typeof x.who === "string" && typeof x.text === "string" && SIG_VOICES[x.who]) out.push({ n: cur, who: x.who, voice: SIG_VOICES[x.who], text: sigFill(sigText(x, st), st), say: sigSay(x, st) });
    Object.keys(x).forEach((k) => { if (k !== "printed" || st.funders === "printed") walk(x[k]); });
  };
  [1, 2, 3, 4, 5].forEach((n) => { cur = n; walk(SIG_LESSONS[n].steps); walk(SIG_LESSONS[n].parts); });
  cur = 0; walk(SIG_SAY);
  return out;
}
/* the only lines the server's voice may speak for this course: each distinct line once */
export const SIG_NARRATION = { sig: { narration: [...new Set(sigVoiceLines().map((x) => x.say))] } };
