/* The California signature course: what a paid canvasser hears, sees and taps, lesson by lesson.

   The words come from the approved curriculum, claude/signature-curriculum-claude-v2.md in the Warmup project (Robert,
   Nov 18, 2026; checked against claude/training-playbook.md the same day), section 3. They are built exactly as written
   there. A line that doesn't work goes back to the curriculum chat to be fixed at the source; nothing is reworded here.

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
  ready: "Ready",
  try1: { some: "You've got {n} of 4. Watch for the other {m}.", none: "You tried it first. That's the hard part. Watch for all four.", all: "Straight to your 2nd try.", watch: "Watch for" },
  listen: "Listen for four things:",
  blocks: ["What you did right", "What to fix", "My tip"],
  end: { done: "Lesson {n} done.", togo: "{m} to go.", whats: "What's next", lead: "{LEAD} texts you one lesson a day. Each takes 5 minutes.", tomorrow: "Tomorrow" },
  misheard: "I missed that. Try once more.",
  promise: "Only the county decides. Leave out the promise.",
  untrue: "Said something that isn't true.",
  practice: "Practice this before your next shift.",
  sources: "See sources",
  ready5: "You're table-ready.",
  ready5wait: "One step to go before you're table-ready.",
  course: "Right person. True words. Their own hand. One good look.",
  titles: ["How to spot a signature that counts", "How to stop a passerby", "How to ask for the signature", "How to make every line count", "How to answer a hard question"],
};

/* Deepgram Aura-2 speakers, one per person. The coach is the trainings' narrator. */
/* Nov 19 (Robert picked these after a side-by-side, playbook rule 68): ElevenLabs voices, "el:<voice id>:<speed>", at 0.88 speed.
   Coach Chris, Lena Jessica, Rico Will, Ben Eric, Tanya and Pat Matilda, Dwayne Brian, Hank Bill, Soo-jin, Ines and Joan Bella,
   Kayla Laura, Luis Liam, Marisol and Anika Sarah, Bob Roger, Karim Adam. A shared voice is never used twice in one lesson. */
export const SIG_VOICES = {
  coach: "el:iP95p4xoKVk53GoZ742B:0.88",
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

/* the cast keeps the same facts in every lesson; every name and address is invented */
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

const OPENER = "Hi there! Longer library hours. Are you registered to vote in LA County?";
const s = (who, text, o) => Object.assign({ who, text }, o || {}); /* a spoken line */
const c = (text, o) => s("coach", text, o);

/* ---- Lesson 1. How to spot a signature that counts ---- */
const L1 = {
  n: 1, id: "sig1", title: "How to spot a signature that counts", start: "Start with a guess",
  parts: [
    { name: "Asks if she's registered to vote", done: "Asked if she's registered to vote.", missed: "Didn't ask if she's registered to vote.", tip: "Use the word 'registered.' Plenty of people think of themselves as voters and aren't on the rolls." },
    { name: "Names the county", done: "Named LA County.", missed: "Didn't name the county.", tip: "Add 'in LA County.' Your sheet only counts LA County voters." },
    { name: "Says only registered voters count", done: "Said only registered voters count.", missed: "Didn't say only registered voters count.", tip: "Say the rule out loud: only registered voters count." },
    { name: "Says the county checks", done: "Said the county checks every line.", missed: "Didn't say who checks.", tip: "Say who checks: the county. People relax when they hear it's a rule and not a judgment about them." },
  ],
  tipAll: "All four. You already think like the county.",
  nextShift: "On your next shift: before anyone picks up the pen, ask 'Are you registered to vote in LA County?'",
  endExtra: "Your first-shift card is in your texts. It has the eight rules for your first signature.",
  steps: [
    { kind: "taps", name: "Guess how many get thrown out", secs: 20, coach: c("Welcome. You're about to gather signatures to put the Neighborhood Libraries Act on the ballot. First, a guess."),
      qs: [{ ask: "What share of the signatures a drive turns in get thrown out?", opts: ["5%", "25%", "50%"], row: true, right: 1, after: c("About 25%. Today you learn which ones count, and how to bring that number down."), sources: true }] },
    { kind: "cards", name: "How the county checks", secs: 25, coach: c("Who decides? The county elections office. It pulls up the voter's record and checks four things."),
      cards: [c("1. Is this person registered to vote?"), c("2. In this county?"), c("3. At the address they wrote?"), c("4. Does the signature look like theirs?")],
      after: c("Four yeses and it counts. One no and it's thrown out. Only the county decides, so never promise anyone their signature will count.") },
    { kind: "sort", name: "Sort six lines", secs: 90, coach: c("Now you're the county. Six people signed at Westside Market today. Sort each one."), buttons: ["Counts", "Thrown out"],
      cards: [
        { face: "marisol", text: "Marisol Vega, 34. Registered to vote at her apartment in Culver City. She printed her name, wrote that address and signed.", right: 0, why: "Counts. A registered voter, in LA County, at the address on her voter record, in her own writing. This is the line you want." },
        { face: "dwayne", text: "Dwayne Carter, 58. Loves the library. Has never registered to vote. He filled in the line neatly.", right: 1, why: "Thrown out. Only registered voters count. This is the number one reason signatures get thrown out." },
        { face: "soojin", text: "Soo-jin Kim, 67. Registered at 412 Palm Avenue, Apartment 4. She wrote 412 Palm Avenue and left off the apartment.", right: 0, why: "Counts. A missing apartment number is fine. The house number and the street have to match." },
        { face: "theo", text: "Theo Lewis, 22. Moved from Inglewood to Westwood last month. He wrote his new address. He hasn't updated his voter registration.", right: 1, why: "Thrown out. His voter record still shows the old address. He can update his registration first and then sign." },
        { face: "luis", text: "Luis Ortega, 29. Registered voter. He signed this same petition at the farmers market last week. He signs again today.", right: 1, why: "Thrown out. One signature per voter. A double never adds one, and it can cost a lot more. You'll see how much next." },
        { face: "carmen", text: "Carmen Ruiz, 52. Registered to vote in Orange County. She's visiting her sister and signs your LA County sheet.", right: 1, why: "Thrown out. Each sheet is for voters of one county. Yours is for LA County." },
      ],
      after: c("Look at the four you threw out. Not one was about handwriting. All four were about who signed.") },
    { kind: "taps", name: "Guess the cost of a double", short: "the cost of a double", secs: 25, coach: c("Back to Luis, who signed twice. The county checks a sample, about 3 lines in every 100."),
      qs: [{ ask: "The sample catches one double. How many signatures does the drive lose?", opts: ["1", "2", "About 1,000"], row: true, right: 2, after: c("About 1,000. One double in the sample tells the county the stack holds many more. In LA County in 2026, 26 doubles in one sample cost a drive about 28,000 signatures."), sources: true }] },
    { kind: "taps", name: "Who had the better hour?", secs: 20,
      qs: [{ ask: "Ana gathered 12 signatures in an hour. 7 count. Ben gathered 10. 8 count. Who had the better hour?", opts: ["Ana", "Ben"], row: true, right: 1, tally: [[12, 7], [10, 8]], /* each button is that canvasser's sheet: lines gathered, lines that count */ after: c("Ben. Signatures that count are the score. {PAYLINE}") }] },
    { kind: "say", name: "Say it", secs: 40, coach: c("Here's the question that screens out the most bad lines. Marisol is walking up. Ask her if she's registered to vote in LA County."),
      who: "marisol", note: "Marisol Vega, 34.", ask: s("marisol", "I am. Why do you ask?"), hint: "Tell her why. Who counts? Who checks?",
      replies: { yes: s("marisol", "Makes sense. I vote every time."), other: s("marisol", "Oh, okay.") },
      oneWay: "One way to say it: 'Only registered voters in LA County count on this sheet, and the county checks every line.'" },
    { kind: "stop", name: "One whole stop", secs: 65, coach: c("Now watch Lena do the whole job once."), who: "ines", props: "stroller",
      note: "Lena stands in front of her table. Ines Romero, 39, walks up pushing a stroller.",
      labels: ["Right person", "True words", "Their own hand", "One good look"],
      lines: [
        s("lena", OPENER, { label: 0 }), s("ines", "I am."),
        s("lena", "I'm paid to gather signatures, and here are this month's top funders. It funds longer evening and weekend hours at branch libraries, paid for by a new state tax on digital ad sales. Have you signed this one already?",
          { label: 1, printed: "I'm paid to gather signatures. It funds longer evening and weekend hours at branch libraries, paid for by a new state tax on digital ad sales. Have you signed this one already?" }),
        s("ines", "No."), s("lena", "Then here's the petition. Will you sign to put it on the ballot?"), s("ines", "Sure."),
        s("lena", "Print your name, sign, then the address where you're registered to vote.", { label: 2, act: "write" }),
        s("lena", "All set. Thank you!", { label: 3, act: "look" }),
      ],
      after: c("That's the job. Two of her lines are the law. Say each one once."), sayLead: "Say it:",
      say: ["I'm paid to gather these signatures.", "It funds longer evening and weekend hours at branch libraries. It's paid for by a new state tax on digital ad sales."],
      done: c("Good. Those two go with you today.") },
    { kind: "end", name: "Lesson done", secs: 15 },
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
    { name: "Says what it's for in a few true words", done: "Said what it's for in a few true words.", missed: "Didn't say what it's for.", tip: "Say what it's for in a few true words: 'longer library hours.' Nothing in the measure says libraries are closing, so leave out 'save.'" },
    { name: "Asks if they're registered to vote in LA County", done: "Asked if they're registered in LA County.", missed: "Didn't ask about LA County.", tip: "End on the question: 'Are you registered to vote in LA County?' A yes is your stop." },
    { name: "Don't ask for a minute or say sorry", done: "Didn't ask for a minute.", missed: "Asked for a minute.", missedAlt: "Said sorry first.", tip: "Drop 'Do you have a minute?' Open with the library and the question." },
  ],
  tipAll: "Five seconds, four parts and every word true. Say it to everyone.",
  headsUp: "Heads up: never ask for a minute.",
  nextShift: "On your next shift: say your opener to the first 20 people who walk by. Count how many stop.",
  steps: [
    { kind: "try1", name: "Your 1st try", secs: 30, coach: c("You're outside Westside Market with your table and your board. Here comes Ben. He's walking fast. You have five seconds. Get him to stop."),
      who: "ben", walk: true, note: "Ben Feldman, 38, coffee in hand, heading for the door.",
      replies: { stop: s("ben", "Uh, yeah, I'm registered. What's up?", { act: "slow" }), time: s("ben", "Sorry, running late!", { act: "go" }), other: s("ben", "Sorry, what's this?", { act: "turn" }) } },
    { kind: "hear", name: "Hear it done", secs: 40, coach: c("Now listen to Lena. She does this all day."),
      scenes: [
        { who: "tanya", note: "Lena stands in front of her table, board in hand. Tanya Brooks, 45, pushes a cart with her daughter riding in it.",
          lines: [s("lena", OPENER), s("tanya", "I am, yeah.", { act: "slow" })],
          ticks: [c("One. She said hi first."), c("Two. She said what it's for in three true words."), c("Three. She asked if Tanya is registered to vote in LA County. A yes means Tanya can sign, and now they're talking."), c("Four. She never asked for a minute. The whole thing took five seconds.")] },
        { who: "dwayne", note: "Dwayne Carter, 58, walks up.",
          lines: [s("lena", OPENER), s("dwayne", "Nope. Never got around to it."), s("lena", "No problem. Have a good one!", { act: "go" })],
          after: c("Dwayne can't sign, so Lena lets him go and turns to the next person. That 'no' just saved her a minute.") },
      ] },
    { kind: "taps", name: "Where to stand", secs: 35, coach: c("Words are half of it. The other half is where you stand."),
      qs: [
        { ask: "Tap the canvasser who gets more stops.", pics: ["sit", "stand"], alt: ["A canvasser sitting behind the table, looking down at a phone.", "A canvasser standing in front of the table, board in hand, pen out, facing people as they walk up."], right: 1,
          after: c("B. People stop for someone who is up, looking at them and ready. The table is where your things sit.") },
        { ask: "Tap the better spot.", pics: ["doorway", "side"], alt: ["A canvasser standing in the middle of the doorway.", "A canvasser a few steps to the side of the door, where people pass close by and have room to keep going."], right: 1,
          after: c("B. Stand where people pass, and never block the way. Anyone who wants to keep walking can.") },
      ] },
    { kind: "spot", name: "Catch the mistake", secs: 40, coach: c("Rico is new. Listen for the one thing that goes wrong."), who: "hank", by: "rico",
      note: "Hank Dawson, 71, walks up with a newspaper under his arm.",
      lines: [s("rico", "Hi! Do you have a minute? It's for longer library hours. Are you registered to vote in LA County?"), s("hank", "Not really, sorry.", { act: "go" })],
      ask: "What went wrong?", opts: ["He didn't say hi", "He didn't say what it's for", "He didn't ask if Hank is registered in LA County", "He asked for a minute"], right: 3,
      after: "He asked for a minute, and Hank answered that question. 'Not really' is the easy answer. Hank reads at the library every week. He would have stopped for it." },
    { kind: "taps", name: "Guess how many stop", secs: 25,
      qs: [{ ask: "What share of passersby stop for a good canvasser?", opts: ["5% to 10%", "30%", "60%"], row: true, right: 0, sources: true,
        after: c("About 5% to 10%. Most people keep walking, even past the best canvassers. It isn't about you. The canvassers who gather the most ask everyone, and the next person is five seconds away.") }] },
    { kind: "try2", name: "Your 2nd try, three in a row", secs: 100, coach: c("Your turn again. Three people are coming, one after another. Say your opener to each. Your best one counts."),
      people: [
        { who: "soojin", walk: true, note: "Soo-jin Kim, 67, with a tote bag.", replies: { stop: s("soojin", "Yes, I am, dear.", { act: "slow" }), other: s("soojin", "Sorry, what's this for?", { act: "turn" }) } },
        { who: "kayla", walk: true, note: "Kayla Jones, 24, earbuds in.", replies: { not: s("kayla", "Oh. I'm not registered.", { act: "turn" }), bye: s("kayla", "Thanks! Have a good one.", { act: "go" }) }, from: "From lesson 1: you let her go." },
        { who: "luis", walk: true, note: "Luis Ortega, 29, in a kitchen apron, heading to work.", replies: { stop: s("luis", "Yeah, I'm registered.", { act: "slow" }), other: s("luis", "Sorry, what's this for?", { act: "turn" }) } },
      ] },
    { kind: "end", name: "Feedback and lesson done", secs: 30 },
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
    ["The label has to be true", [["Elections Code 18600", "https://california.public.law/codes/elections_code_section_18600"]]],
    ["Registered voters of one county", [["Elections Code 100", "https://california.public.law/codes/elections_code_section_100"], ["Elections Code 9021", "https://california.public.law/codes/elections_code_section_9021"]]],
  ],
};

/* ---- Lesson 3. How to ask for the signature ---- */
const L3 = {
  n: 3, id: "sig3", title: "How to ask for the signature",
  parts: [
    { name: "Says they're paid and shows the top funders", must: "Saying you're paid and showing the funders is a must. One more time.", done: "Said you're paid and showed the top funders.", missed: "Didn't say you're paid.", missedAlt: "Didn't show the top funders.", tip: "Say 'I'm paid to gather these signatures' and show the top funders before the petition leaves your hand. Both are the law." },
    { name: "Says what it does and how it's paid for", must: "Both halves are a must. One more time.", done: "Said what it does and how it's paid for.", missed: "Left out how it's paid for.", missedAlt: "Left out what it does.", tip: "Tell both halves every time: what it does and how it's paid for." },
    { name: "Asks if they've signed this one already", done: "Asked if she signed this one already.", missed: "Didn't ask about a double.", tip: "Ask 'Have you signed this one already?' before the pen moves." },
    { name: "Asks for the signature and leaves the choice with them", done: "Asked for the signature.", missed: "Didn't ask for the signature.", tip: "End by asking: 'Will you sign to put it on the ballot?' Hold out the pen. People sign when they're asked." },
  ],
  tipAll: "Paid, both halves, no doubles and a clear ask. That's a signature you can stand behind.",
  headsUp: "Heads up: say you're paid and show the top funders before the petition leaves your hand.",
  nextShift: "On your next shift: say you're paid and show the top funders before the petition leaves your hand, every time.",
  steps: [
    { kind: "try1", name: "Your 1st try", secs: 35, coach: c("Tanya stopped for you. Now get her signature."), who: "tanya", note: "Tanya Brooks, 45, with her cart.",
      opens: s("tanya", "Yeah, I'm registered. What's this about?"),
      /* nodbl is Tanya's own line from lesson 4, so a canvasser who asks about a double here gets an answer */
      replies: { yes: s("tanya", "Okay, sure.", { act: "pen" }), wait: s("tanya", "So, do you need something from me?"), nodbl: s("tanya", "No, I haven't signed it.") } },
    { kind: "hear", name: "Hear it done", secs: 45, coach: c("Listen to Lena with Bob."),
      scenes: [{ who: "bob", stopped: true, note: "Bob Hall, 73, has stopped.",
        lines: [
          s("bob", "I'm registered. What've you got?"),
          s("lena", "Thanks for stopping. I'm paid to gather signatures, and here are this month's top funders.", { act: "sheet", printed: "Thanks for stopping. I'm paid to gather signatures." }),
          s("lena", "It's the Neighborhood Libraries Act. It funds longer evening and weekend hours at branch libraries, and it's paid for by a new state tax on digital ad sales. Have you signed this one already?"),
          s("bob", "No, first I've heard of it."),
          s("lena", "Then here's the petition. It's all there to read. Will you sign to put it on the ballot?", { act: "board" }),
          s("bob", "All right.", { act: "pen" }),
        ],
        ticks: [
          c("One. She said she's paid and showed the top funders before the petition left her hand. Both are the law.", { printed: "One. She said she's paid before the petition left her hand. That's the law." }),
          c("Two. She told both halves: what it does and how it's paid for."),
          c("Three. She asked if he signed already. A double can cost the drive a thousand signatures."),
          c("Four. She asked for the signature and left the choice with Bob. People sign when they're asked."),
        ] }] },
    { kind: "taps", name: "Four taps on honest wording", short: "honest wording", secs: 55,
      qs: [
        /* pic: what the screen shows above the options. It has no words of its own: a person from the cast, or the thing the question describes. */
        { pic: { who: "tanya" }, ask: "Which one can you say?", opts: ["It keeps our libraries from closing.", "It funds longer evening and weekend hours at branch libraries, paid for by a new state tax on digital ad sales.", "It gives libraries more hours and it won't cost you a thing."], quote: true, right: 1,
          after: c("B. It says what the measure does and how it's paid for. Nothing in the measure says libraries are closing. And nobody can promise what a tax will cost someone.") },
        { pic: { two: ["lena", "bob"] }, ask: "When do you say you're paid?", opts: ["Only if they ask.", "Before you hand over the petition.", "After they sign."], right: 1, after: c("B. Before you hand it over, every time, even if nobody asks.") },
        { pic: { sheet: "October", day: ["November", "3"] }, ask: "Your top funders sheet says 'Valid only for October.' Today is November 3. What do you do?", opts: ["Use it. It's close enough.", "Stop and get this month's sheet from your lead.", "Skip the sheet today."], right: 1,
          after: c("B. The sheet is only good for the month printed on it. An old sheet is the same as no sheet."),
          printed: { pic: { who: "soojin" }, ask: "A passerby asks who is paying for this. What do you do?", opts: ["Say you don't know.", "Point to the top funders box on the petition.", "Say it's the libraries."], right: 1, after: c("B. The top funders are printed in the box on the petition. Point to it.") } },
        { pic: { who: "luis" }, ask: "Luis thinks he signed this petition last week. What do you do?", opts: ["Have him sign again to be safe.", "Thank him and move on.", "Have him sign, then tell your lead it might be a double."], right: 1,
          after: c("B. One signature per voter. A second one never helps, and it can cost the drive about 1,000.") },
      ] },
    { kind: "spot", name: "Catch the mistake", secs: 35, coach: c("Rico again. One part is missing."), who: "soojin", by: "rico", stopped: true, note: "Soo-jin Kim, 67, has stopped.",
      lines: [
        s("rico", "Here are this month's top funders. It funds longer evening and weekend hours at branch libraries, and it's paid for by a new state tax on digital ad sales. Have you signed this one already?",
          { act: "sheet", printed: "It funds longer evening and weekend hours at branch libraries, and it's paid for by a new state tax on digital ad sales. Have you signed this one already?" }),
        s("soojin", "No, I haven't."), s("rico", "Great. Here's the petition. Will you sign to put it on the ballot?", { act: "board" }), s("soojin", "Are you with the library, dear?", { act: "pen" }),
      ],
      ask: "What did Rico leave out?", opts: ["He didn't say he's paid", "He didn't say what it does and how it's paid for", "He didn't ask if she already signed", "He didn't ask for the signature"], right: 0,
      after: "He never said he's paid. Mrs. Kim had to guess who he works for. The law says a paid canvasser tells every person before handing over the petition, even if nobody asks." },
    { kind: "try2", name: "Your 2nd try, two passersby", secs: 100, coach: c("Now the whole thing, starting from hello. Marisol is walking up."),
      people: [
        { who: "marisol", walk: true, note: "Marisol Vega, 34, in scrubs.", scored: true, from: "From lesson 2: your opener.",
          replies: { reg: s("marisol", "Yes, I'm registered. I've got a minute.", { act: "slow" }), dbl: s("marisol", "No, I haven't signed it."), yes: s("marisol", "Sure. Where do I sign?", { act: "pen" }), wait: s("marisol", "So, what do you need from me?") } },
        { who: "luis", stopped: true, coach: c("Luis stopped too. Go."), note: "Luis Ortega, 29, in a kitchen apron.", from: "From lesson 1: no doubles.",
          replies: { signed: s("luis", "Oh, the library one. I think I signed that at the farmers market last week."), go: s("luis", "Cool. Good luck out here.", { act: "go" }), again: s("luis", "Are you sure? I'm pretty sure I signed it.") } },
      ] },
    { kind: "end", name: "Feedback and lesson done", secs: 30 },
  ],
};

/* ---- Lesson 4. How to make every line count ---- */
const L4 = {
  n: 4, id: "sig4", title: "How to make every line count",
  parts: [
    { name: "Asks them to print their name", done: "Asked her to print her name.", missed: "Didn't ask her to print her name.", tip: "Start with 'Print your name here.' It gets the pen moving in the right box." },
    { name: "Asks for the address where they're registered to vote", done: "Asked for the address where she's registered.", missed: "Didn't ask for the address where she's registered.", tip: "Say 'the address where you're registered to vote.' That phrase is your guard against a wrong address." },
    { name: "Keeps the pen in the signer's hand", must: "The signer writing their own line is a must. One more time.", done: "Kept the pen in her hand.", missed: "Offered to write on her line.",
      /* the script has no missed line for a canvasser who says nothing when she asks, and "Offered to write" would be untrue of them, so the must's own sentence shows */
      missedAlt: "The signer writing their own line is a must.", tip: "Keep the pen in their hand. Offer to hold the bag." },
    { name: "Catches the gap before she leaves", done: "Caught the empty signature box.", missed: "Let her go with the box empty.", tip: "Look before they leave: name, signature, address, city. Then say thanks." },
  ],
  tipAll: "Every box, in her own writing, checked before she left. That's a good line.",
  headsUp: "Heads up: the signer writes every word on their line.",
  nextShift: "On your next shift: look at every line before the signer walks away. Name, signature, address, city.",
  steps: [
    { kind: "try1", name: "Your 1st try", secs: 30, coach: c("Anika said yes. She's at your board with a grocery bag in each hand."), who: "anika", note: "Anika Rao, 41.", line: {},
      opens: s("anika", "Can you just fill in my address for me? My hands are full."),
      replies: { self: s("anika", "Oh, okay. Hold this for a second?", { act: "pen" }), agree: s("anika", "Thanks! It's 88 Hill Street.") } },
    { kind: "hear", name: "Hear it done", secs: 40, coach: c("Watch the line while you listen to Lena and Bob."),
      scenes: [{ who: "bob", stopped: true, note: "Bob Hall, 73, pen in hand.", line: {},
        lines: [
          s("lena", "Print your name right here, Bob. Then sign. Then the address where you're registered to vote."),
          s("bob", "Can you write it for me? My handwriting's terrible."),
          s("lena", "It has to be in your handwriting, Bob. Terrible is fine. Take your time.", { fillAfter: { name: "Bob Hall", sig: true, addr: "1530 Juniper Ave." } }),
          s("lena", "One more thing, Bob. City and zip are still blank. Could you add those?", { glow: ["city", "zip"] }),
          s("bob", "Los Angeles, 90024. There.", { fill: { city: "Los Angeles", zip: "90024" }, say: "Los Angeles, nine oh oh two four. There." }),
          s("lena", "That's a good line. Thank you!"),
        ],
        ticks: [c("One. She asked him to print his name."), c("Two. She asked for the address where he's registered to vote."), c("Three. She kept the pen in Bob's hand. The signer writes every word."), c("Four. She looked at the line before he left and caught the gap.")] }] },
    { kind: "lines", name: "Check four lines", secs: 55, coach: c("Your turn to look. Four lines. Tap the box that will get the line thrown out. If the line is fine, tap Good to go."), ok: "Good to go",
      lines: [
        { tag: "A", fill: { name: "Dana Whitfield", sig: true, addr: "PO Box 5512", city: "Culver City", zip: "90230" }, right: "addr", why: "A PO box alone gets the line thrown out. Ask for the street address where she's registered to vote." },
        { tag: "B", fill: { name: "Marcus Bell", sig: false, addr: "3120 Alder St.", city: "Los Angeles", zip: "90066" }, right: "sig", why: "No signature. Ask him to sign before he goes." },
        { tag: "C", fill: { name: "Liz Cruz", sig: true, addr: "2210 Larkspur Blvd.", city: "Santa Monica", zip: "90405" }, note: "Her voter record says Elizabeth Cruz at this address.", right: "ok", why: "Good to go. A nickname is fine when the address matches and the signature is hers." },
        /* the script gives line D no city or zip; they are filled in the signer's own hand so the address stays the one problem */
        { tag: "D", fill: { name: "James Okafor", sig: true, addr: "915 Marigold Blvd", city: "Los Angeles", zip: "90018", other: ["addr"] }, note: "The canvasser wrote this address for him.", right: "addr", why: "The signer has to write it. An address in someone else's writing gets the line thrown out." },
      ] },
    { kind: "taps", name: "What now?", secs: 35,
      qs: [
        { pic: { line: { name: "Dana Whitfield", sig: true, addr: "PO Box 5512", city: "Culver City", zip: "90230" }, glow: ["addr"] }, ask: "A signer wrote the wrong address. What now?", opts: ["Cover it with white-out.", "Cross it out and write the right one yourself.", "Ask the signer to cross out the whole line and fill in the next one."], right: 2,
          after: c("C. No white-out, ever. And you never write on a signer's line. A fresh line in their own writing is the fix.") },
        { pic: { who: "theo" }, ask: "Theo says he moved last month and hasn't updated his voter registration. What now?", opts: ["He writes his old address.", "He writes his new address and signs.", "He updates his registration first, then signs."], right: 2,
          after: c("C. The line asks for where he lives now, and it has to match his voter record. He can update his registration on his phone at registertovote.ca.gov and sign right after. Don't promise it will count. The county decides.", { say: "C. The line asks for where he lives now, and it has to match his voter record. He can update his registration on his phone at register to vote dot C A dot gov and sign right after. Don't promise it will count. The county decides." }) },
      ] },
    { kind: "decl", name: "Your line", secs: 40,
      coach: c("Every sheet has one more line, and it's yours. It's called the Declaration of Circulator. It says you collected these signatures, watched each one being written and showed every signer this month's top funders.",
        { printed: "Every sheet has one more line, and it's yours. It's called the Declaration of Circulator. It says you collected these signatures and watched each one being written." }),
      cards: ["Filled in by the canvasser after the last signature. Signed and dated.", "Left blank. The canvasser forgot.", "The canvasser's lead filled in the name, address and dates. The canvasser signed."],
      ask: "Two of these get every signature on the sheet thrown out. Tap both.", right: [1, 2],
      after: c("The blank one, and the one somebody else filled in. Each takes the whole sheet with it. After the last signature, write your name, your address and the first and last day you collected on that sheet. Then sign it and date it. All of it in your own writing.") },
    { kind: "try2", name: "Your 2nd try", secs: 80, coach: c("Tanya is registered in LA County and ready to sign. Before the pen moves, ask the question from lesson 3. Then walk her through the line."),
      people: [{ who: "tanya", stopped: true, note: "Tanya Brooks, 45, her daughter tugging at her sleeve.", scored: true, line: {}, from: "From lesson 3: you asked about a double.",
        fill: { name: "Tanya Brooks", addr: "2748 Wren Ave.", city: "Los Angeles", zip: "90064" },
        replies: { nodbl: s("tanya", "No, I haven't signed it."), ask: s("tanya", "Can you fill in the address for me, though? I've got my hands full with this one."), self: s("tanya", "Okay. Hang on, sweetie.", { act: "pen" }), set: s("tanya", "All set?"),
          oops: s("tanya", "Oh! I skipped it."), there: s("tanya", "There you go."), good: s("tanya", "Great, thanks!", { act: "go" }) } }] },
    { kind: "end", name: "Feedback and lesson done", secs: 20 },
  ],
};

/* ---- Lesson 5. How to answer a hard question ---- */
const L5 = {
  n: 5, id: "sig5", title: "How to answer a hard question",
  parts: [
    { name: "Answers the question straight, first", must: "A straight, true answer is a must. One more time.", done: "Answered the question straight, first.", missed: "Dodged the question.", missedAlt: "Said something that isn't true.", tip: "Answer first. When they ask about a tax, the first word is 'yes.'" },
    { name: "Shows the petition", done: "Showed where it's printed.", missed: "Didn't show the petition.", tip: "Point to the page: 'It's printed right here.' The petition backs you up." },
    { name: "Asks once more", done: "Asked once more.", missed: "Didn't ask again.", tip: "After you answer, ask once: 'Want to sign?'" },
    { name: "Lets a no go", done: "Let the no go with a thank-you.", missed: "Argued after a no.", tip: "When it's a no, say thanks and let them go. The next person is five seconds away." },
  ],
  tipAll: "A straight answer, the page, one ask and a clean goodbye. That's the whole job done right.",
  headsUp: "Heads up: answer the question first, and only with what's true.",
  nextShift: "On your next shift: when a question comes, answer it first. Then point to the page.",
  steps: [
    { kind: "try1", name: "Your 1st try", secs: 35, coach: c("Hank stopped. You told him what the measure does. He's holding the pen, and he has a question."), who: "hank", note: "Hank Dawson, 71.",
      opens: s("hank", "Hold on. Is this a new tax?"),
      replies: { straight: s("hank", "Huh. Okay. At least you told me straight."), dodge: s("hank", "Says here it's a tax.", { act: "tap" }) } },
    { kind: "hear", name: "Hear it done", secs: 45, coach: c("Listen to Lena with Joan."),
      scenes: [{ who: "joan", stopped: true, note: "Joan Whitaker, 60, owns a print shop.",
        lines: [
          s("joan", "Is this going to raise taxes?"),
          s("lena", "Yes. It's a new state tax on digital advertising sales. That's how it pays for the longer hours. It's printed right here in the summary. Take a look.", { act: "board", pauseAfter: 1800 }),
          s("lena", "Want to sign?"), s("joan", "Not today. I buy a lot of ads."),
          s("lena", "No problem. Thanks for stopping, Joan. Have a good one."), s("joan", "You too. Thanks for being straight with me.", { act: "go" }),
        ],
        ticks: [c("One. She answered the question first, and the answer was true."), c("Two. She showed Joan where it's printed."), c("Three. She asked once more."), c("Four. Joan said no, and Lena let it go with a thank-you.")],
        after: c("Some people sign after a straight answer and some don't. Either way Lena is free for the next person in twenty seconds.") }] },
    { kind: "taps", name: "Four straight answers", short: "straight answers", secs: 55, coach: c("Four questions you'll hear this week. Tap the straight answer."),
      qs: [
        { pic: { who: "soojin" }, ask: "'Are you getting paid for this?'", opts: ["I'm just here for the libraries.", "Yes, I'm paid to gather signatures."], quote: true, right: 1, after: c("B. You already said it once. Say it again.") },
        { pic: { who: "bob" }, ask: "'If I sign, am I voting for it?'", opts: ["No. Signing only helps put it on the ballot. The voters decide.", "Pretty much. Signing means you support it."], quote: true, right: 0, after: c("A. A signature helps put the question on the ballot. It isn't a vote.") },
        { pic: { who: "anika" }, ask: "'How much is the tax?'", opts: ["Just a few cents. You won't notice it.", "I don't know. The summary doesn't say. The full text is right here."], quote: true, right: 1, after: c("B. Never guess. 'I don't know, it's printed right here' is a whole answer. You can ask your lead later.") },
        { pic: { who: "ines" }, ask: "'What do I get for signing?'", opts: ["Nothing from me. I can't give anything for a signature.", "You get a free pen if you sign."], quote: true, right: 0, after: c("A. Giving money or anything of value for a signature is against the law. Don't offer even small things.") },
      ] },
    { kind: "spot", name: "Catch the mistake", secs: 40, coach: c("Rico's last turn. One part goes wrong."), who: "karim", by: "rico", stopped: true, note: "Karim Nassar, 33, a rideshare driver between rides.",
      lines: [s("karim", "Is this a tax thing?"), s("rico", "Don't worry about that part. It's all about keeping libraries open later. It's right here. Want to sign?", { act: "board" }), s("karim", "Hmm. I'll pass."), s("rico", "No problem. Have a good one.", { act: "go" })],
      ask: "What went wrong?", opts: ["He didn't answer the question straight", "He didn't show the petition", "He didn't ask again", "He didn't let the no go"], right: 0,
      after: "Rico dodged. Karim asked about a tax and got an answer about libraries. A dodge on a tax question misleads the signer, and misleading someone about what a petition does is a crime in California. Say yes, say what the tax is and point to the summary." },
    { kind: "try2", name: "Your 2nd try, two passersby", secs: 100, coach: c("Last one. Two people, two questions. Answer straight, show them, ask once and let a no go."),
      people: [
        { who: "ben", stopped: true, note: "Ben Feldman, 38.", scored: true, set: "Ben stopped. You've told him what the measure does.", opens: s("ben", "Wait. Are you a volunteer?"), hint: "Walk him through the line.", from: "From lesson 4: the line.",
          replies: { paid: s("ben", "Fair enough. Thanks for telling me."), yes: s("ben", "Sure, I'll sign.", { act: "pen" }) } },
        { who: "pat", stopped: true, note: "Pat Sullivan, 64, a retired bookkeeper.", scored: true, opens: s("pat", "Before I sign anything. Is this a new tax?"),
          replies: { wait: s("pat", "So what do you want me to do?"), no1: s("pat", "I appreciate the straight answer."), no2: s("pat", "I don't sign anything with a new tax in it."), thanks: s("pat", "You're the first one out here who just told me. Good luck.", { act: "go" }), argue: s("pat", "Like I said, no thanks.", { act: "go" }) } },
      ] },
    { kind: "end", name: "Feedback and the finish line", secs: 25, finish: true },
  ],
};

export const SIG_LESSONS = { 1: L1, 2: L2, 3: L3, 4: L4, 5: L5 };

/* ---- the first-shift card (sent when lesson 1 ends) ---- */
export const SIG_CARD = {
  title: "Before your first signature",
  rules: [
    ["Say you're paid and show the top funders.", "'I'm paid to gather these signatures, and here are this month's top funders.' Do both before you hand over the petition, every time.", { printed: ["Say you're paid.", "'I'm paid to gather these signatures.' Say it before you hand over the petition, every time."] }],
    ["Tell both halves.", "'It funds longer evening and weekend hours at branch libraries. It's paid for by a new state tax on digital ad sales.' Never guess. Never cover the summary. Let anyone read it."],
    ["Registered voters only.", "Ask: 'Are you registered to vote in LA County?' Your sheet is for LA County voters."],
    ["One signature per person.", "Ask: 'Have you signed this one already?' If they think so, thank them and move on."],
    ["The signer writes every word on their line.", "You never write on it. If someone can't write because of a disability, call your lead first."],
    ["Watch every signature.", "Never leave the petition alone."],
    ["Never give or promise anything.", "Nothing of value for a signature, not a dollar and not a snack. And never promise a signature will count. Only the county decides."],
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
  [1, 2, 3, 4, 5].forEach((n) => { cur = n; walk(SIG_LESSONS[n].steps); });
  return out;
}
/* the only lines the server's voice may speak for this course: each distinct line once */
export const SIG_NARRATION = { sig: { narration: [...new Set(sigVoiceLines().map((x) => x.say))] } };
