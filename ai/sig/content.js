/* The California signature course: what a paid canvasser hears, sees and taps, lesson by lesson.

   The words come from the curriculum, claude/signature-curriculum-claude-v5.md in the Warmup project (version 5, Nov 20,
   2026: version 4 with Robert's answers to the build's five questions; every line that changed from version 4 is in
   claude/signature-v5-changed-lines.md), section 3. They are built exactly as written there. Since Nov 20 one thread owns
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
  drive: { name: "Libraries for All", measure: "Neighborhood Libraries Act", color: "#5A3E99" },
  site: "Westside Market",
};

/* lesson 1, step 5: the line has to be true for the firm */
export const SIG_PAY_LINES = {
  bonus: "Libraries for All checks your signatures. Your bonus is paid on the ones that count.",
  perValid: "You're paid for signatures that count. A thrown-out line pays nothing.",
  hourlyTracked: "Your lead sees how many of your signatures count. That number decides who gets the best spots and the most hours.",
  rawNoCheck: "The drive only wins with signatures that count, and your name goes on every sheet you turn in.",
};

/* the measure and the practice petition (curriculum, "The petition on screen") */
export const SIG_MEASURE = {
  name: "Neighborhood Libraries Act",
  label: "longer library hours",
  /* the opener's sentence for the measure: "This petition is for" and a few true words (version 3, Robert's note) */
  opener: "This petition is for longer library hours.",
  two: "It funds longer evening and weekend hours at branch libraries. It's paid for by a new state tax on digital ad sales.",
  paid: "I'm paid to gather these signatures.",
  summary: "Funds longer evening and weekend hours at public branch libraries. Pays for it with a new statewide tax on digital advertising sales.",
  stamp: "PRACTICE ONLY. NOT A REAL PETITION.",
  boxes: { name: "Print Your Name", sig: "Sign As Registered To Vote", addr: "Residence Address ONLY", city: "City", zip: "Zip" },
  fundersHead: "OFFICIAL TOP FUNDERS",
  fundersValid: "Valid only for",
};

/* what every lesson shares (curriculum, "What every lesson shares" and "The scoring contract") */
export const SIG_SHARED = {
  start: "Start your 1st try",
  next: { hear: "Next: hear it done", spot: "Next: catch the mistake", try2: "Next: your 2nd try" },
  done: "Done for today",
  ready: "Start your 2nd try",
  try1: { some: "You've got {n} of 4. Watch for the other {m}.", one: "You've got 3 of 4. Watch for the last one.", none: "You tried it first. That's the hard part. Watch for all four.", all: "You got all four. The taps come next, then your 2nd try.", watch: "Watch for" },
  listen: "Listen for four things:",
  blocks: ["What you did right", "What to fix", "My tip"],
  end: { done: "Lesson {n} done.", togo: "{m} to go.", whats: "What's next", lead: "{LEAD} texts you one lesson a day. Each takes 5 minutes.", tomorrow: "Tomorrow" },
  misheard: "I missed that. Try once more.",
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
  answering: { m: "He's answering.", f: "She's answering." },
  titles: ["How to spot a signature that counts", "How to stop a passerby", "How to ask for the signature", "How to make every line count", "How to answer a hard question"],
};

/* ElevenLabs voices, one per person, "el:<voice id>:<speed>" (playbook rule 68). Nov 19, 8:16 PM: the coach is Frank
   (Frank Sullivan, warm and authentic, a man in his late 60s), Robert's pick of six samples, at sample 4's settings
   (SIG_VOICE_SETTINGS). Lena Jessica, Rico Will, Ben Eric, Tanya and Pat Matilda, Dwayne Brian, Hank Bill, Soo-jin, Ines and
   Joan Bella, Kayla Laura, Luis Liam, Marisol and Anika Sarah, Bob Roger, Karim Adam, at 0.88 speed. A shared voice is
   never used twice in one lesson, and the coach's voice is the coach's alone. */
export const SIG_VOICES = {
  coach: "el:bRlp5mUWs01wX4H4oW4X:0.9",
  lena: "el:cgSgspJ2msm6clMCkdW9:0.88",
  rico: "el:bIHbv24MWmeRgasZH58o:0.88",
  ben: "el:cjVigY5qzO86Huf0OWal:0.88",
  tanya: "el:XrExE9yKIg1WjnnlVkGX:0.88",
  dwayne: "el:nPczCjzI2devNBz1zQrb:0.88",
  hank: "el:pqHfZKP75CvOlQylNhV4:0.88",
  soojin: "el:hpp4J3VqNfWAUOO0d1Us:0.88",
  kayla: "el:FGY2WhTYpPnrIDTdsKH5:0.88",
  luis: "el:TX3LPaxmHKxFdv7VOQHJ:0.88",
  marisol: "el:EXAVITQu4vr4xnSDxMaL:0.88",
  ines: "el:hpp4J3VqNfWAUOO0d1Us:0.88",
  bob: "el:CwhRBWXzGAHq8TQ4Fs17:0.88",
  anika: "el:EXAVITQu4vr4xnSDxMaL:0.88",
  joan: "el:hpp4J3VqNfWAUOO0d1Us:0.88",
  karim: "el:pNInz6obpgDQGcFmaJgB:0.88",
  pat: "el:XrExE9yKIg1WjnnlVkGX:0.88",
};
/* how each voice is recorded: the coach at Frank's sample 4, everyone else at the cast's settings */
export const SIG_VOICE_SETTINGS = {
  coach: { stability: 0.62, similarity_boost: 0.8, style: 0, use_speaker_boost: true, seed: 7 },
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

const OPENER = "Hi there! This petition is for longer library hours. Are you registered to vote in LA County?";
const s = (who, text, o) => Object.assign({ who, text }, o || {}); /* a spoken line */
const c = (text, o) => s("coach", text, o);
/* lines every passerby has, in their own voice, for the moments no script plans (the scoring contract, version 3): a greeting,
   small talk, a push to sign and a goodbye. A dodge gets their own question once more. */
const fb = (who) => ({ fHi: s(who, "Hi."), fSmall: s(who, "I'm good, thanks."), fPush: s(who, "I'd rather decide for myself."), fBye: s(who, "Okay, bye now.", { act: "go" }) });

/* ---- Lesson 1. How to spot a signature that counts ---- */
const L1 = {
  n: 1, id: "sig1", title: "How to spot a signature that counts", start: "Start with a guess",
  parts: [
    { name: "Asks if she's registered to vote", done: "Asked if she's registered to vote.", missed: "Didn't ask if she's registered to vote.", tip: "Use the word 'registered.' Plenty of people think of themselves as voters and aren't on the rolls." },
    { name: "Names the county", done: "Named LA County.", missed: "Didn't name the county.", tip: "Add 'in LA County.' Your sheet only counts LA County voters." },
    { name: "Says only registered voters count", done: "Said only registered voters count.", missed: "Didn't say only registered voters count.", tip: "Say the rule out loud: only registered voters count." },
    { name: "Says the county checks", done: "Said the county checks every line.", missed: "Didn't say who checks.", tip: "Say that the county checks. People relax when they hear it's a rule and not a judgment about them." },
  ],
  tipAll: "You got all four. You already think like the county.",
  headsUp: "Heads up: when she asks why, say who counts and who checks.",
  nextShift: "On your next shift: before anyone picks up the pen, ask 'Are you registered to vote in LA County?'",
  endExtra: "Your first-shift card is in your texts. It has the eight rules for your first signature.",
  steps: [
    { kind: "taps", name: "Guess how many get thrown out", secs: 18, coach: c("Welcome. You're about to gather signatures to put the Neighborhood Libraries Act on the ballot."),
      qs: [{ ask: "What share of the signatures a drive turns in get thrown out?", opts: ["5%", "25%", "50%"], row: true, right: 1, after: c("About 25% get thrown out. Today you learn which ones count."), sources: true }] },
    { kind: "cards", name: "How the county checks", secs: 25, coach: c("The county checks each signer's voter record for four things."),
      cards: [c("1. Is this person registered to vote?"), c("2. Are they registered in this county?"), c("3. Are they registered at the address they wrote?"), c("4. Does the signature look like theirs?")],
      after: c("With four yeses, the signature counts. With one no, it's thrown out. Only the county decides, so never promise anyone their signature will count.") },
    { kind: "sort", name: "Sort five lines", secs: 92, coach: c("Now you're the county. Five people signed at Westside Market today. Decide which lines count."), ask: "Will the county count this line?", buttons: ["Counts", "Thrown out"], last: "Next: the three thrown out",
      cards: [
        { face: "marisol", text: "Marisol Vega is registered to vote at her Culver City apartment. She wrote that address and signed.", right: 0, why: "It counts. She's registered at that address, and she wrote the line herself." },
        { face: "dwayne", text: "Dwayne Carter loves the library and filled in the line neatly. He has never registered to vote.", right: 1, why: "It's thrown out. Not being registered is the top reason lines get thrown out." },
        { face: "soojin", text: "Soo-jin Kim is registered at 412 Palm Avenue, Apartment 4. She left off the apartment number.", right: 0, why: "It counts. A missing apartment number is fine when the house number and street match." },
        { face: "theo", text: "Theo Lewis moved to Westwood last month and wrote his new address. His voter record still has his old one.", right: 1, why: "It's thrown out, because his voter record has the old address. He can update his registration first, then sign." },
        { face: "luis", text: "Luis Ortega is a registered voter. He signed this petition last week and signs again today.", right: 1, why: "It's thrown out. Each voter signs once, and a double can cost far more than one line." },
      ],
      after: c("Three of those five lines get thrown out. Not one was about handwriting. All three were about who signed.") },
    { kind: "taps", name: "Guess the cost of a double", short: "the cost of a double", secs: 25, coach: c("Luis signed twice. The county checks a sample, about 3 lines in every 100."),
      qs: [{ ask: "The sample catches one double. How many signatures does the drive lose?", opts: ["1", "2", "About 1,000"], row: true, right: 2, after: c("The drive loses about 1,000. One double in the sample tells the county the stack holds many more."), sources: true }] },
    { kind: "taps", name: "Who had the better hour?", secs: 21,
      qs: [{ ask: "Ana gathered 12 signatures in an hour, and 7 count. Nate gathered 10, and 8 count. Which canvasser had the better hour?", opts: ["Ana", "Nate"], row: true, right: 1, tally: [[12, 7], [10, 8]], /* each button is that canvasser's sheet: lines gathered, lines that count */ after: c("Nate had the better hour. Signatures that count are the score. {PAYLINE}") }] },
    { kind: "say", name: "Say it", secs: 43, coach: c("Here's the question that screens out the most bad lines. A woman in scrubs is walking up. Ask her if she's registered to vote in LA County."), ready: "Talk to the woman in scrubs",
      who: "marisol", note: "Stage note, art only: Marisol Vega, 34, in scrubs.", hint: "Tell her why. Who counts? Who checks?",
      /* asked whether she's registered, she answers that; told only what it's for, she asks what you need; asked any other question, she says so */
      ask: s("marisol", "I am. Why do you ask?"), askOther: s("marisol", "Me? I vote in every election. Why do you ask?"),
      replies: Object.assign({ lib: s("marisol", "Oh, the library? What do you need?"), yes: s("marisol", "Makes sense. I vote every time."), other: s("marisol", "Oh, okay.") }, fb("marisol")),
      oneWay: "One way to say it: 'Only registered voters in LA County count on this sheet, and the county checks every line.'" },
    { kind: "stop", name: "One whole stop", secs: 63, coach: c("Now watch Lena do the whole job once."), who: "ines", props: "stroller",
      note: "Stage note, art only: Lena stands in front of her table. Ines Romero, 39, walks up pushing a stroller.",
      labels: ["Right person", "True words", "Their own hand", "One good look"],
      lines: [
        s("lena", OPENER, { label: 0 }), s("ines", "I am."),
        s("lena", "I'm paid to gather signatures, and here are this month's top funders. It funds longer evening and weekend hours at branch libraries, paid for by a new state tax on digital ad sales. Have you signed this one already?",
          { label: 1, act: "sheet", printed: "I'm paid to gather signatures. It funds longer evening and weekend hours at branch libraries, paid for by a new state tax on digital ad sales. Have you signed this one already?" }),
        s("ines", "No."), s("lena", "Then here's the petition. Will you sign to put it on the ballot?", { act: "board" }), s("ines", "Sure."),
        s("lena", "Print your name, sign, then write the address where you're registered to vote.", { label: 2, act: "write" }),
        s("lena", "All set. Thank you!", { label: 3, act: "look" }),
      ],
      after: c("Two of Lena's lines are the law. Say each one once."), sayLead: "Say it:",
      say: ["I'm paid to gather these signatures.", "It funds longer evening and weekend hours at branch libraries. It's paid for by a new state tax on digital ad sales."],
      done: c("Good. Take those two lines with you today.") },
    { kind: "end", name: "Lesson done", secs: 16 },
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
    { name: "Says what the petition is for", done: "Said what the petition is for.", missed: "Didn't say what the petition is for.", missedAlt: "Said only the topic, not what the petition is for.", missedLong: "Said too much before the question.", missedUntrue: "Said something the measure doesn't say.", tip: "Say what the petition is for in one short sentence: 'This petition is for longer library hours.' Nothing in the measure says libraries are closing, so leave out 'save.'" },
    { name: "Asks if they're registered to vote in LA County", done: "Asked if they're registered in LA County.", missed: "Didn't ask about LA County.", tip: "End on the question: 'Are you registered to vote in LA County?' A yes is your stop." },
    { name: "Don't ask for a minute or say sorry", done: "Didn't ask for a minute.", missed: "Asked for a minute.", missedAlt: "Said sorry first.", missedSorry: "Said sorry.", tip: "Drop 'Do you have a minute?' Open with what the petition is for and the registered question." },
  ],
  tipAll: "You did all four parts in about five seconds, and every word was true. Say your opener to everyone.",
  headsUp: "Heads up: never ask for a minute.",
  nextShift: "On your next shift: say your opener to the first 20 people who walk by. Count how many stop.",
  steps: [
    { kind: "try1", name: "Your 1st try", secs: 34, coach: c("You're outside Westside Market with your table and your board. A man with a coffee is heading for the door. Say hello and see if he'll stop."),
      who: "ben", walk: true, note: "Stage note, art only: Ben Feldman, 38, coffee in hand, heading for the door.",
      replies: Object.assign({ stop: s("ben", "Uh, yeah, I'm registered. What's up?", { act: "slow" }), lib: s("ben", "Oh, the library? What do you need?", { act: "slow" }), time: s("ben", "Sorry, running late!", { act: "go" }), other: s("ben", "Sorry, what's this?", { act: "turn" }) }, fb("ben")) },
    { kind: "hear", name: "Hear it done", secs: 52, coach: c("Now listen to Lena. She does this all day."),
      scenes: [
        { who: "tanya", note: "Stage note, art only: Lena stands in front of her table, board in hand. Tanya Brooks, 45, pushes a shopping cart with her daughter riding in it.",
          lines: [s("lena", OPENER), s("tanya", "I am, yeah.", { act: "slow" })],
          ticks: [c("First, she said hi."), c("Second, she said what the petition is for in one short sentence."), c("Third, she asked if the woman is registered to vote in LA County. A yes means the woman can sign, and now they're talking."), c("Fourth, she never asked for a minute. The whole thing took about five seconds.")] },
        { who: "dwayne", note: "Stage note, art only: Dwayne Carter, 58, walks up.",
          lines: [s("lena", OPENER), s("dwayne", "Nope. Never got around to it."), s("lena", "No problem. Have a good one!", { act: "go" })],
          after: c("That man can't sign, so Lena lets him go and turns to the next person. His 'no' just saved her a minute.") },
      ] },
    { kind: "taps", name: "Where to stand", secs: 31, coach: c("Words are half the job. The other half is where you stand."),
      qs: [
        { ask: "Which canvasser gets more people to stop?", pics: ["sit", "stand"], alt: ["A canvasser sitting behind the table, looking down at a phone.", "A canvasser standing in front of the table, board in hand and pen out, facing people as they walk up."], right: 1,
          after: c("B is right. People stop for someone who is standing, looking at them and ready. The table is just where your things sit.") },
        { ask: "Where should you stand for more signatures an hour?", pics: ["doorway", "side"], alt: ["A canvasser standing in the middle of the doorway, with shoppers squeezing past.", "A canvasser a few steps to the side of the door, where people pass close by and have room to keep going."], right: 1,
          after: c("B is right. Stand where people pass, and never block the way. Anyone who wants to keep walking can.") },
      ] },
    { kind: "spot", name: "Catch the mistake", secs: 40, coach: c("Rico is new. Listen for the one thing that goes wrong."), who: "hank", by: "rico",
      note: "Stage note, art only: Hank Dawson, 71, walks up with a newspaper under his arm.",
      lines: [s("rico", "Hi! Do you have a minute? This petition is for longer library hours. Are you registered to vote in LA County?"), s("hank", "Not really, sorry.", { act: "go" })],
      ask: "Which part did Rico get wrong?", opts: ["He didn't say hi", "He didn't say what the petition is for", "He didn't ask if the man is registered in LA County", "He asked for a minute"], right: 3,
      after: "He asked for a minute, so 'Not really' was the easy answer. Without that question, the man might have stopped to hear about the library." },
    { kind: "taps", name: "Guess how many stop", secs: 22,
      qs: [{ ask: "What share of passersby stop for a good canvasser?", opts: ["5% to 10%", "30%", "60%"], row: true, right: 0, sources: true,
        after: c("About 5% to 10% stop. Most people keep walking, even past the best canvassers. A no isn't about you. The canvassers who gather the most ask everyone, and someone else is always coming.") }] },
    { kind: "try2", name: "Your 2nd try, three in a row", secs: 77, coach: c("It's your turn again. Three people are coming, one after another. Say your opener to each one, and your best opener counts."),
      people: [
        { who: "soojin", walk: true, note: "Stage note, art only: Soo-jin Kim, 67, with a tote bag.", replies: Object.assign({ stop: s("soojin", "Yes, I am, dear.", { act: "slow" }), lib: s("soojin", "Oh, the library? What do you need?", { act: "slow" }), other: s("soojin", "Sorry, what's this for?", { act: "turn" }) }, fb("soojin")) },
        { who: "kayla", walk: true, note: "Stage note, art only: Kayla Jones, 24, earbuds in.", up: "Next up: a young woman with earbuds.", upBtn: "Next: the woman with earbuds",
          replies: Object.assign({ not: s("kayla", "Oh. I'm not registered.", { act: "turn" }), lib: s("kayla", "Oh, the library? What do you need?", { act: "turn" }), bye: s("kayla", "Thanks! Have a good one.", { act: "go" }) }, fb("kayla")), from: "From lesson 1: you let her go." },
        { who: "luis", walk: true, note: "Stage note, art only: Luis Ortega, 29, in a kitchen apron, heading to work.", up: "Next up: a man in a kitchen apron.", upBtn: "Next: the man in the apron",
          replies: Object.assign({ stop: s("luis", "Yeah, I'm registered.", { act: "slow" }), lib: s("luis", "Oh, the library? What do you need?", { act: "slow" }), other: s("luis", "Sorry, what's this for?", { act: "turn" }) }, fb("luis")) },
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
    { name: "Says they're paid and shows the top funders", step: "Saying you're paid and showing the funders", must: "Saying you're paid and showing the funders is a must. Try it once more.", done: "Said you're paid and showed the top funders.", missed: "Didn't say you're paid.", missedAlt: "Didn't show the top funders.", missedVague: "Said you're paid too late.", missedFundersLate: "Showed the top funders too late.", tip: "Say 'I'm paid to gather these signatures' and show the top funders before the petition leaves your hand. Both are the law." },
    { name: "Says what it does and how it's paid for", step: "Telling both halves", must: "Telling both halves is a must. Try it once more.", done: "Said what it does and how it's paid for.", missed: "Left out how it's paid for.", missedAlt: "Left out what it does.", missedUntrue: "Said something the measure doesn't say.", tip: "Tell both halves every time: what the measure does and how it's paid for." },
    { name: "Asks if they've signed this one already", done: "Asked if she signed this one already.", missed: "Didn't ask about a double.", tip: "Ask 'Have you signed this one already?' before the pen moves." },
    { name: "Asks for the signature and leaves the choice with them", done: "Asked for the signature.", missed: "Didn't ask for the signature.", missedVague: "Pushed her to sign.", tip: "End by asking: 'Will you sign to put it on the ballot?' Hold out the pen. People sign when they're asked." },
  ],
  tipAll: "You said you're paid, told both halves, checked for a double and asked clearly. That's a signature you can stand behind.",
  headsUp: "Heads up: say you're paid and show the top funders before the petition leaves your hand.",
  nextShift: "On your next shift: say you're paid and show the top funders before the petition leaves your hand, every time.",
  steps: [
    { kind: "try1", name: "Your 1st try", secs: 33, coach: c("A woman with a shopping cart heard your opener and stopped. When you're ready, ask for her signature."), who: "tanya", pic: "tanya-cart",
      note: "Stage note, art only: Tanya Brooks, 45, her daughter in the cart, has stopped at the table.",
      opens: s("tanya", "Yeah, I'm registered. What's this about?"),
      replies: Object.assign({ yes: s("tanya", "Okay, sure.", { act: "pen" }), wait: s("tanya", "So, do you need something from me?"), nodbl: s("tanya", "No, I haven't signed it.") }, fb("tanya")) },
    { kind: "hear", name: "Hear it done", secs: 57, coach: c("Now listen to Lena. An older man heard her opener and stopped."), sources: true,
      scenes: [{ who: "bob", stopped: true, note: "Stage note, art only: Bob Hall, 73, has stopped at the table.",
        lines: [
          s("bob", "I'm registered. What've you got?"),
          s("lena", "Thanks for stopping. I'm paid to gather signatures, and here are this month's top funders.", { act: "sheet", printed: "Thanks for stopping. I'm paid to gather signatures." }),
          s("lena", "It funds longer evening and weekend hours at branch libraries, and it's paid for by a new state tax on digital ad sales. Have you signed this one already?"),
          s("bob", "No, first I've heard of it."),
          s("lena", "Then here's the petition. Will you sign to put it on the ballot?", { act: "board" }),
          s("bob", "All right.", { act: "pen" }),
        ],
        ticks: [
          c("First, she said she's paid and showed the top funders before the petition left her hand. The law requires both, even if nobody asks.", { printed: "First, she said she's paid before the petition left her hand. The law requires that." }),
          c("Second, she said what the measure does and how it's paid for."),
          c("Third, she asked if he signed already, because one double can cost about 1,000 signatures."),
          c("Fourth, she asked for the signature and left the choice with him, because people sign when they're asked."),
        ] }] },
    { kind: "taps", name: "Three taps on honest wording", short: "honest wording", secs: 64,
      qs: [
        /* pic: what the screen shows above the options. It has no words of its own: a person from the cast, or the thing the question describes. */
        { pic: { who: "tanya" }, ask: "Which line about the measure can you say?", opts: ["It keeps our libraries from closing.", "It gives libraries more hours, and it won't cost you a thing.", "It funds longer library hours with a new state tax on digital ad sales."], quote: true, right: 2,
          after: c("C is right. Nothing in the measure says libraries are closing, and nobody can promise what a tax will cost.") },
        { pic: { sheet: "October", day: ["November", "3"] }, ask: "Your top funders sheet says 'Valid only for October.' It's November 3. What do you do?", opts: ["Use it anyway.", "Get this month's sheet from your lead.", "Skip the sheet today."], right: 1,
          after: c("B is right. A sheet is only good for the month printed on it."),
          printed: { pic: { who: "soojin" }, ask: "A passerby asks who is paying for the drive. What do you do?", opts: ["Say you don't know.", "Point to the top funders box on the petition.", "Say it's the libraries."], right: 1, after: c("B is right. The top funders are printed in the box on the petition, so point to the box.") } },
        { pic: { who: "luis" }, ask: "A passerby thinks he signed this petition last week. What do you do?", opts: ["Thank him and move on.", "Have him sign again to be safe.", "Have him sign, then tell your lead it might be a double."], right: 0, sources: true,
          after: c("A is right. A second signature never helps, and it can cost the drive about 1,000.") },
      ] },
    { kind: "spot", name: "Catch the mistake", secs: 46, coach: c("Here's Rico again. One part is missing."), who: "soojin", by: "rico", stopped: true, note: "Stage note, art only: Soo-jin Kim, 67, with a tote bag, has stopped.",
      lines: [
        s("rico", "Here are this month's top funders. It funds longer evening and weekend hours at branch libraries, and it's paid for by a new state tax on digital ad sales. Have you signed this one already?",
          { act: "sheet", printed: "It funds longer evening and weekend hours at branch libraries, and it's paid for by a new state tax on digital ad sales. Have you signed this one already?" }),
        s("soojin", "No, I haven't."), s("rico", "Here's the petition. Will you sign to put it on the ballot?", { act: "board" }), s("soojin", "Are you with the library, dear?", { act: "pen" }),
      ],
      ask: "Which part did Rico leave out?", opts: ["He didn't say he's paid", "He didn't say what it does and how it's paid for", "He didn't ask if she already signed", "He didn't ask for the signature"], right: 0,
      after: "He never said he's paid, so she had to guess who he works for." },
    { kind: "try2", name: "Your 2nd try, two passersby", secs: 78, coach: c("Now do the whole stop, starting from hello."),
      people: [
        { who: "marisol", walk: true, note: "Stage note, art only: Marisol Vega, 34, in scrubs.", scored: true, from: "From lesson 2: your opener.",
          replies: Object.assign({ reg: s("marisol", "Yes, I'm registered. I've got a minute.", { act: "slow" }), what: s("marisol", "Hi. What's this one for?", { act: "slow" }), lib: s("marisol", "Oh, the library? What do you need?", { act: "slow" }), dbl: s("marisol", "No, I haven't signed it."), yes: s("marisol", "Sure. Where do I sign?", { act: "pen" }), wait: s("marisol", "So, what do you need from me?") }, fb("marisol")) },
        { who: "luis", stopped: true, coach: c("A man has stopped too. Try it with him."), up: "Next up: a man in a kitchen apron.", upBtn: "Next: the man in the apron", note: "Stage note, art only: Luis Ortega, 29, in a kitchen apron.", from: "From lesson 1: no doubles.",
          replies: Object.assign({ what: s("luis", "Hey. What's this one for?"), signed: s("luis", "Oh, the library one. I think I signed that at the farmers market last week."), go: s("luis", "Cool. Good luck out here.", { act: "go" }), again: s("luis", "Are you sure? I'm pretty sure I signed it.") }, fb("luis")) },
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
    { name: "Asks for the address where they're registered to vote", done: "Asked for the address where she's registered.", missed: "Didn't ask for the address where she's registered.", tip: "Say 'the address where you're registered to vote.' That phrase is your guard against a wrong address." },
    { name: "Keeps the pen in the signer's hand", step: "Keeping the pen in the signer's hand", must: "The signer writes every word on their line, and that's a must. Try it once more.", done: "Kept the pen in her hand.", missed: "Offered to write on her line.",
      missedAlt: "Didn't tell her she has to write it herself.", tip: "Keep the pen in their hand. Offer to hold the bag." },
    { name: "Catches the gap before the signer leaves", done: "Caught the empty signature box.", missed: "Let her go with the box empty.", missedVague: "Let her go before she filled in the line.", tip: "Before they leave, look at the name, signature, address and city. Then say thanks." },
  ],
  tipAll: "Every box was in her own writing, and you checked it before she left. That's a good line.",
  headsUp: "Heads up: the signer writes every word on their line.",
  nextShift: "On your next shift: before each signer walks away, look at the name, signature, address and city.",
  steps: [
    { kind: "try1", name: "Your 1st try", secs: 31, coach: c("A woman said yes. She's at your board with a grocery bag in each hand."), who: "anika", pic: "anika-bags", note: "Stage note, art only: Anika Rao, 41.", line: {},
      opens: s("anika", "Can you just fill in my address for me? My hands are full."),
      replies: Object.assign({ self: s("anika", "Oh, okay. Hold this for a second?", { act: "pen" }), agree: s("anika", "Thanks! It's 88 Hill Street."), other: s("anika", "So can you write it for me?") }, fb("anika")) },
    { kind: "hear", name: "Hear it done", secs: 49, coach: c("Watch the line as Lena helps an older man who said yes."),
      scenes: [{ who: "bob", pic: "bob-pen", stopped: true, note: "Stage note, art only: Bob Hall, 73, pen in hand.", line: {},
        lines: [
          s("lena", "Print your name right here. Then sign, and then write the address where you're registered to vote."),
          s("bob", "Can you write it for me? My handwriting's terrible."),
          s("lena", "It has to be in your handwriting. Terrible is fine. Take your time.", { fillAfter: { name: "Bob Hall", sig: true, addr: "1530 Juniper Ave." } }),
          s("lena", "Bob, your city and zip are still blank. Could you add them?", { glow: ["city", "zip"] }),
          s("bob", "It's Los Angeles, 90024. There you go.", { fill: { city: "Los Angeles", zip: "90024" }, say: "It's Los Angeles, nine oh oh two four. There you go." }),
          s("lena", "That's a good line. Thank you!"),
        ],
        ticks: [c("First, she asked him to print his name."), c("Second, she asked for the address where he's registered to vote."), c("Third, she kept the pen in his hand, because the signer writes every word."), c("Fourth, she looked at the line before he left and caught the gap.")] }] },
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
        { pic: { who: "theo" }, ask: "Theo moved last month and hasn't updated his voter registration. What should he do?", opts: ["Write his old address.", "Write his new address and sign.", "Update his registration first, then sign."], right: 2,
          after: c("C is right. His line needs his current address, and it must match his voter record. He can update his registration at registertovote.ca.gov, then sign. Never promise his line will count.", { say: "C is right. His line needs his current address, and it must match his voter record. He can update his registration at register to vote dot C A dot gov, then sign. Never promise his line will count." }) },
      ] },
    { kind: "decl", name: "Your line", secs: 33,
      coach: c("Every sheet has one more line, and it's yours: the Declaration of Circulator. It says you gathered these signatures, watched each one being written and showed every signer this month's top funders.",
        { printed: "Every sheet has one more line, and it's yours: the Declaration of Circulator. It says you gathered these signatures and watched each one being written." }),
      cards: ["The canvasser filled it in after the last signature, then signed and dated it.", "The canvasser left it blank.", "The canvasser's lead filled it in, and the canvasser signed."],
      ask: "Which two get the whole sheet thrown out? Tap both.", right: [1, 2],
      after: c("The blank one and the one your lead filled in each cost the whole sheet. After the last signature, write your name, your address and the first and last days you gathered on that sheet. Then sign and date it, all in your own writing.") },
    { kind: "try2", name: "Your 2nd try", secs: 49, coach: c("A woman with her daughter is registered and ready to sign. Before the pen moves, ask if she's signed this one already. Then walk her through the line."),
      people: [{ who: "tanya", pic: "tanya-tug", stopped: true, note: "Stage note, art only: Tanya Brooks, 45, her daughter tugging at her sleeve.", scored: true, line: {}, from: "From lesson 3: you asked about a double.",
        fill: { name: "Tanya Brooks", addr: "2748 Wren Ave.", city: "Los Angeles", zip: "90064" },
        replies: Object.assign({ nodbl: s("tanya", "No, I haven't signed it."), ask: s("tanya", "Can you fill in the address for me, though? I've got my hands full with this one."), ask0: s("tanya", "Can you fill in the address for me? I've got my hands full with this one."),
          self: s("tanya", "Okay. Hang on, sweetie.", { act: "pen" }), set: s("tanya", "All set?"), oops: s("tanya", "Oh! I skipped it."), there: s("tanya", "There you go."), good: s("tanya", "Great, thanks!", { act: "go" }) }, fb("tanya")) }] },
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
    { kind: "try1", name: "Your 1st try", secs: 33, coach: c("An older man stopped, and you told him what the measure does. He's holding the pen, and he has a question."), who: "hank", pic: "hank-pen", note: "Stage note, art only: Hank Dawson, 71, with a newspaper, holding the pen.",
      opens: s("hank", "Hold on. Is this a new tax?"),
      replies: Object.assign({ straight: s("hank", "Huh. Okay. At least you told me straight."), dodge: s("hank", "Says here it's a tax.", { act: "tap" }) }, fb("hank")) },
    { kind: "hear", name: "Hear it done", secs: 48, coach: c("Listen to Lena with a woman who has stopped."),
      scenes: [{ who: "joan", stopped: true, note: "Stage note, art only: Joan Whitaker, 60, owns a print shop, in a work apron.",
        lines: [
          s("joan", "Is this going to raise taxes?"),
          s("lena", "Yes. It's a new state tax on digital advertising sales. That's how it pays for the longer hours. It's printed right here in the summary. Take a look.", { act: "board", pauseAfter: 1800 }),
          s("lena", "Want to sign?"), s("joan", "Not today. I buy a lot of ads."),
          s("lena", "No problem. Thanks for stopping. Have a good one."), s("joan", "You too. Thanks for being straight with me.", { act: "go" }),
        ],
        ticks: [c("First, she answered the question, and the answer was true."), c("Second, she showed the woman where the tax is printed."), c("Third, she asked once more."), c("Fourth, the woman said no, and Lena let her go with a thank-you.")],
        after: c("Some people sign after a straight answer and some don't. Either way Lena is free for the next person in twenty seconds.") }] },
    { kind: "taps", name: "Four straight answers", short: "straight answers", secs: 80, coach: c("You'll hear these four questions this week. Tap the straight answer to each one."),
      qs: [
        { pic: { who: "soojin" }, ask: "'Are you getting paid for this?' Which answer is straight?", opts: ["I'm just here for the libraries.", "Yes, I'm paid to gather signatures."], quote: true, right: 1, after: c("B is right. You already said you're paid once, so say it again.") },
        { pic: { who: "bob" }, ask: "'If I sign, am I voting for it?' Which answer is straight?", opts: ["No. Signing only helps put it on the ballot. The voters decide.", "Pretty much. Signing means you support it."], quote: true, right: 0, after: c("A is right. A signature helps put the question on the ballot, and it isn't a vote.") },
        { pic: { who: "anika" }, ask: "'How much is the tax?' Which answer is straight?", opts: ["Just a few cents. You won't notice it.", "I don't know. The summary doesn't say. The full text is right here."], quote: true, right: 1, after: c("B is right. Never guess. 'I don't know, but it's printed right here' is a whole answer, and you can ask your lead later.") },
        { pic: { who: "ines" }, ask: "'What do I get for signing?' Which answer is straight?", opts: ["Nothing from me. I can't give anything for a signature.", "You get a free pen if you sign."], quote: true, right: 0, after: c("A is right. Giving anything of value for a signature is against the law, even something small.") },
      ] },
    { kind: "spot", name: "Catch the mistake", secs: 43, coach: c("This is Rico's last turn. Listen for the part that goes wrong."), who: "karim", by: "rico", stopped: true, note: "Stage note, art only: Karim Nassar, 33, a rideshare driver between rides, car keys in his hand.",
      lines: [s("karim", "Is this a tax thing?"), s("rico", "Don't worry about that part. It's all about keeping libraries open later. It's right here. Want to sign?", { act: "board" }), s("karim", "Hmm. I'll pass."), s("rico", "No problem. Have a good one.", { act: "go" })],
      ask: "Which part did Rico get wrong?", opts: ["He didn't answer the question straight", "He didn't show the petition", "He didn't ask again", "He didn't let the no go"], right: 0,
      after: "Rico dodged. The man asked about a tax and got an answer about libraries. Misleading a signer about what a petition does is a crime in California. Say yes, name the tax and point to the summary." },
    { kind: "try2", name: "Your 2nd try, two passersby", secs: 64, coach: c("This is your last try. Two people will ask two questions. Answer straight, show them the page, ask once and let a no go."),
      people: [
        { who: "ben", stopped: true, note: "Stage note, art only: Ben Feldman, 38, with a coffee.", scored: true, coach: c("A man with a coffee has stopped, and you've told him what the measure does."), opens: s("ben", "Wait. Are you a volunteer?"), hint: "Walk him through the line.", from: "From lesson 4: the line.",
          replies: Object.assign({ paid: s("ben", "Fair enough. Thanks for telling me."), dodge: s("ben", "Sorry, but are you a volunteer or not?"), yes: s("ben", "Sure, I'll sign.", { act: "pen" }), noask: s("ben", "Okay. Is there something you want me to sign?") }, fb("ben")) },
        { who: "pat", stopped: true, note: "Stage note, art only: Pat Sullivan, 64, a retired bookkeeper.", scored: true, up: "Next up: an older woman.", upBtn: "Next: the older woman", opens: s("pat", "Before I sign anything, is this a new tax?"),
          replies: Object.assign({ wait: s("pat", "So what do you want me to do?"), dodge: s("pat", "That isn't what I asked. Is it a new tax or not?"), no1: s("pat", "I appreciate the straight answer."), no2: s("pat", "I don't sign anything with a new tax in it."),
            thanks: s("pat", "You're the first one out here who just told me. Good luck.", { act: "go" }), thanksDodge: s("pat", "Okay. Bye now.", { act: "go" }), argue: s("pat", "Like I said, no thanks.", { act: "go" }) }, fb("pat")) },
      ] },
    { kind: "end", name: "Feedback and the finish line", secs: 29, finish: true },
  ],
};

export const SIG_LESSONS = { 1: L1, 2: L2, 3: L3, 4: L4, 5: L5 };
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
    ["Tell both halves.", "'It funds longer evening and weekend hours at branch libraries. It's paid for by a new state tax on digital ad sales.' Never guess. Never cover the summary. Let anyone read it."],
    ["Registered voters only.", "Open with 'Hi there! This petition is for longer library hours. Are you registered to vote in LA County?' Your sheet is for LA County voters."],
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
