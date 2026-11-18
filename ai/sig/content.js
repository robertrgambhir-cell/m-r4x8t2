/* The California signature course: what a paid canvasser hears, sees and taps, lesson by lesson.

   The words come from the approved curriculum, claude/signature-curriculum-claude-v2.md in the Warmup project (Robert,
   Nov 18, 2026), section 3. They are built exactly as written there. A line that doesn't work goes back to the curriculum
   chat to be fixed at the source; nothing is reworded here.

   One file holds the words so the page's captions, the recorded voices and the grader's test cases can't drift apart:
   - ai/build-sig.py fills the page from it (through ai/tools/sig-data.mjs);
   - the AI server reads SIG_NARRATION, the only lines its voice may speak for this course (GET /narrate?s=sig2&k=N);
   - ai/tools/sig-audio.mjs records those lines into wdpfxqlsvp/sig/audio/.

   Firm settings live in SIG_SETTINGS and nowhere else. A script line names them with {county}, {label}, {Label},
   {labelN} and {stops}. Straight quotes here; the page sets them as curly quotes. No em dashes. */

/* ---- firm settings: the one place ---- */
export const SIG_SETTINGS = {
  /* [COUNTY]: the opener, the tips and every county mention */
  county: "LA County",
  /* other names for the same county that count in the registered question */
  countyAlso: ["Los Angeles County", "County of Los Angeles"],
  /* how a phone's speech recognition tends to spell the county; all of these are heard as the county */
  countyHeard: ["L.A. County", "L A County", "LA County", "el a County", "ella County", "elay County", "L.A County"],
  /* how the recorded voices say it */
  countySay: "L.A. County",
  /* the short label for the opener (section 3, "The two sentences every canvasser uses for the measure") */
  label: "longer library hours",
  /* the stop figure in step 5. A guess built on one strategist's estimate; a firm replaces it with its own number */
  stops: "5 to 10",
  stopsSay: "five to ten",
  /* the drive, for the app's header */
  drive: { name: "Libraries for All", line: "Neighborhood Libraries Act", aria: "Libraries for All, the Neighborhood Libraries Act petition drive", color: "#5A3E99" },
  site: "Westside Market",
};

/* Deepgram Aura-2 speakers, one per person. The coach is the trainings' narrator. */
export const SIG_VOICES = { coach: "orpheus", tasha: "asteria", rico: "atlas", ben: "apollo", tanya: "andromeda", dwayne: "mars", hank: "pluto", soojin: "athena", kayla: "luna", luis: "aries" };

/* the cast keeps the same facts in every lesson; every name is invented */
export const SIG_CAST = {
  tasha: { name: "Tasha", note: "the trained canvasser", g: "f" },
  rico: { name: "Rico", note: "a newer canvasser", g: "m" },
  ben: { name: "Ben", full: "Ben Feldman", age: 38, note: "coffee in hand, heading for the door", g: "m" },
  tanya: { name: "Tanya", full: "Tanya Brooks", age: 45, note: "pushes a cart with her daughter riding in it", g: "f" },
  dwayne: { name: "Dwayne", full: "Dwayne Carter", age: 58, note: "walks up", g: "m" },
  hank: { name: "Hank", full: "Hank Dawson", age: 71, note: "walks up with a newspaper under his arm", g: "m" },
  soojin: { name: "Soo-jin", full: "Soo-jin Kim", age: 67, note: "with a tote bag", g: "f" },
  kayla: { name: "Kayla", full: "Kayla Jones", age: 24, note: "earbuds in", g: "f" },
  luis: { name: "Luis", full: "Luis Ortega", age: 29, note: "in a kitchen apron, heading to work", g: "m" },
};

/* ---- Lesson 2. How to stop a passerby ---- */
const OPENER = "Hi there! {Label}. Are you registered to vote in {county}?";
export const SIG_LESSON2 = {
  id: "sig2", n: 2, of: 5, title: "How to stop a passerby",
  /* the flow table: the seven steps and their designed seconds (300 in all, never a cutoff) */
  steps: ["Your 1st try", "Hear it done", "Where to stand", "Catch the mistake", "Guess how many stop", "Your 2nd try", "Tip and next shift"],
  seconds: [30, 40, 35, 40, 25, 100, 30],
  /* the four graded parts, named as the grading table names them */
  parts: ["Says hello first", "Says what it's for in a few true words", "Asks if they're registered to vote in {county}", "Doesn't ask for time or say sorry"],
  /* the scoring contract's lines */
  missed: "I missed that. Try once more.",
  /* Step 1. Your 1st try */
  try1: {
    coach: "You're outside Westside Market with your table and your board. Here comes Ben. He's walking fast. You have five seconds. Get him to stop.",
    who: "ben",
    replies: { stop: "Uh, yeah, I'm registered. What's up?", time: "Sorry, running late!", other: "Sorry, what's this?" },
    heard: "Not scored. Here's what we heard.",
  },
  /* Step 2. Hear it done */
  hear: {
    coach: "Now listen to Tasha. She does this all day.",
    first: [["tasha", OPENER], ["tanya", "I am, yeah."]],
    ticks: [
      "One. She said hi first.",
      "Two. She said what it's for in {labelN} true words.",
      "Three. She asked if Tanya is registered to vote in {county}. A yes means Tanya can sign, and now they're talking.",
      "Four. She never asked for a minute. The whole thing took five seconds.",
    ],
    second: [["tasha", OPENER], ["dwayne", "Nope. Never got around to it."], ["tasha", "No problem. Have a good one!"]],
    after: "Dwayne can't sign, so Tasha lets him go and turns to the next person. That 'no' just saved her a minute.",
  },
  /* Step 3. Where to stand */
  stand: {
    coach: "Words are half of it. The other half is where you stand.",
    taps: [
      { ask: "Tap the canvasser who gets more stops.",
        a: "A canvasser sitting behind the table, looking down at a phone.",
        b: "A canvasser standing in front of the table, board in hand, pen out, facing people as they walk up.",
        right: "b",
        after: "B. People stop for someone who is up, looking at them and ready. The table is where your things sit." },
      { ask: "Tap the better spot.",
        a: "A canvasser standing in the middle of the doorway.",
        b: "A canvasser a few steps to the side of the door, where people pass close by and have room to keep going.",
        right: "b",
        after: "B. Stand where people pass, and never block the way. Anyone who wants to keep walking can." },
    ],
  },
  /* Step 4. Catch the mistake. The planted mistake is part 4 */
  spot: {
    coach: "Rico is new. Listen for the one thing that goes wrong.",
    lines: [["rico", "Hi! Do you have a minute? It's for {label}. Are you registered to vote in {county}?"], ["hank", "Not really, sorry."]],
    ask: "What went wrong?",
    picks: ["He didn't say hi", "He didn't say what it's for", "He didn't ask if Hank is registered in {county}", "He asked for a minute"],
    right: 3,
    after: "He asked for a minute, and Hank answered that question. 'Not really' is the easy answer. Hank reads at the library every week. He would have stopped for it.",
  },
  /* Step 5. Guess how many stop */
  guess: {
    ask: "100 people walk past a good canvasser. About how many stop?",
    picks: ["{stops}", "30", "60"],
    right: 0,
    after: "About {stops}. Most people keep walking, even past the best canvassers. It isn't about you. The canvassers who gather the most ask everyone, and the next person is five seconds away.",
  },
  /* Step 6. Your 2nd try, three in a row */
  try2: {
    coach: "Your turn again. Three people are coming, one after another. Say your opener to each. Your best one counts.",
    people: [
      { who: "soojin", stop: "Yes, I am, dear.", other: "Sorry, what's this for?" },
      { who: "kayla", first: "Oh. I'm not registered.", bye: "Thanks! Have a good one.", tick: "From lesson 1: you let her go." },
      { who: "luis", stop: "Yeah, I'm registered.", other: "Sorry, what's this for?" },
    ],
  },
  /* Step 7. Tip and next shift: one tip, by the first missed part of the opener that counts */
  tips: [
    "Start with 'Hi there.' A hello turns a stranger into a person.",
    "Say what it's for in a few true words: '{label}.' Nothing in the measure says libraries are closing, so leave out 'save.'",
    "End on the question: 'Are you registered to vote in {county}?' A yes is your stop.",
    "Drop 'Do you have a minute?' Open with the library and the question.",
  ],
  tipAll: "Five seconds, four parts and every word true. Say it to everyone.",
  next: "On your next shift: say your opener to the first 20 people who walk by. Count how many stop.",
  nextBtn: "I'll do it",
  /* the true words the app shows when an opener says something the measure doesn't (the scoring contract gives the rule
     and no wording, so these are taken from the script: the label, the part 2 tip and the measure's second sentence) */
  true: { closing: "Nothing in the measure says libraries are closing.", cost: "It's paid for by a new state tax on digital ad sales.", promise: "Only the county decides. Leave out the promise.", again: "One more time." },
};

/* ---- filling a line with the firm's settings ---- */
const NUM = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export function sigFill(text, st = SIG_SETTINGS, voice = false) {
  const n = st.label.trim().split(/\s+/).length;
  return String(text)
    .split("{county}").join(voice ? st.countySay || st.county : st.county)
    .split("{Label}").join(cap(st.label))
    .split("{label}").join(st.label)
    .split("{labelN}").join(NUM[n] || String(n))
    .split("{stops}").join(voice ? st.stopsSay || st.stops : st.stops);
}
/* a whole lesson with every string filled, for the page */
export function sigFilled(x, st = SIG_SETTINGS) {
  if (typeof x === "string") return sigFill(x, st);
  if (Array.isArray(x)) return x.map((y) => sigFilled(y, st));
  if (x && typeof x === "object") return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, sigFilled(v, st)]));
  return x;
}

/* ---- every spoken line of lesson 2, in order: { id, who, voice, text (as shown), say (as the voice reads it) } ---- */
export function sigVoiceLines(L = SIG_LESSON2, st = SIG_SETTINGS) {
  const out = [], seen = new Map();
  const add = (id, who, raw) => {
    const say = sigFill(raw, st, true), key = who + "|" + say;
    if (seen.has(key)) { out.push({ id, who, same: seen.get(key) }); return; } /* the same words in the same voice are recorded once */
    seen.set(key, id);
    out.push({ id, who, voice: SIG_VOICES[who], text: sigFill(raw, st), say });
  };
  add("try1.coach", "coach", L.try1.coach);
  Object.entries(L.try1.replies).forEach(([k, t]) => add("try1." + k, L.try1.who, t));
  add("hear.coach", "coach", L.hear.coach);
  L.hear.first.forEach(([who, t], i) => add("hear.first." + i, who, t));
  L.hear.ticks.forEach((t, i) => add("hear.tick." + i, "coach", t));
  L.hear.second.forEach(([who, t], i) => add("hear.second." + i, who, t));
  add("hear.after", "coach", L.hear.after);
  add("stand.coach", "coach", L.stand.coach);
  L.stand.taps.forEach((t, i) => add("stand.after." + i, "coach", t.after));
  add("spot.coach", "coach", L.spot.coach);
  L.spot.lines.forEach(([who, t], i) => add("spot.line." + i, who, t));
  add("spot.after", "coach", L.spot.after);
  add("guess.after", "coach", L.guess.after);
  add("try2.coach", "coach", L.try2.coach);
  L.try2.people.forEach((p) => ["stop", "other", "first", "bye"].forEach((k) => { if (p[k]) add("try2." + p.who + "." + k, p.who, p[k]); }));
  return out;
}

/* what the AI server's voice may read for this course: lesson id -> the lines, by index (recorded once each) */
export const SIG_NARRATION = { sig2: { narration: sigVoiceLines().filter((x) => !x.same).map((x) => x.say) } };
