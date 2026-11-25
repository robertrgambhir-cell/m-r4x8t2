/* Version 176: how long the door waits before a volunteer's line is done (playbook rules 34 and 34a, voter rule 15).
   Only a line that sounds finished gets the quick answer (1.2 s of quiet); one that could go on waits 2.8 s. Robert's notes on the
   signature course, which share the rule: Nov 22, 2026, "it just cut off my voice. I was still talking, unfinished." (his line ended
   "...to get"), and Nov 23, "It cut me off when I was talking too soon" (his phone heard "Hi how are you").
   It reads waiPause() and its word lists straight out of the page, so it tests what ships, and checks that the issue training
   page's door (wdpfxqlsvp/review/train/index.html, built from ai/train/train.html) uses the same rule, word for word.
   Usage: node ai/tests/door-pause.test.mjs [page] [training page] (defaults: the review copy and its training page, from the repo's
   top folder) */
import fs from "node:fs";

const PAGE = process.argv[2] || "wdpfxqlsvp/review/index.html", TRAIN = process.argv[3] || "wdpfxqlsvp/review/train/index.html";
const blockOf = (file) => { /* from the word lists through the end of waiPause() */
  const src = fs.readFileSync(file, "utf8"), from = src.indexOf("const WAI_MID = "), fn = src.indexOf("function waiPause(text) {", from), to = src.indexOf("\n}\n", fn);
  if (from < 0 || fn < 0 || to < 0) { console.log("FAIL waiPause not found in " + file); process.exit(1); }
  return src.slice(from, to + 3);
};
const block = blockOf(PAGE);
const waiPause = new Function(block + "\nreturn waiPause;")();
const LONG = 2800, SHORT = 1200;
let pass = 0, fail = 0;
const code = (b) => b.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").trim();
if (fs.existsSync(TRAIN) && code(blockOf(TRAIN)) === code(block)) pass += 1;
else { fail += 1; console.log("FAIL the issue training page's door (" + TRAIN + ") doesn't use the same waiPause() as " + PAGE); }
const check = (line, want, why) => {
  const got = waiPause(line)[1];
  if (got === want) pass += 1; else { fail += 1; console.log(`FAIL ${JSON.stringify(line)}: ${got} ms, want ${want} (${why})`); }
};

/* Robert's own words */
check("We're collecting signatures on Uh have something on the ballot in November to get", LONG, "his Nov 22 line, as the phone heard it");
check("Hi how are you", LONG, "his Nov 23 line: a hello and small talk wait for the rest");
check("Hi, I'm Robert, um, I'm", LONG, "his Nov 17 door line (version 172)");
check("Hi I'm Robert how are you", LONG, "his Nov 17 door run");
check("Hi um I'm here", LONG, "his Nov 16 door run");
check("Hi, I'm Robert. I live down the street and I'm volunteering for Maya Kaur. Election Day is Tuesday.", SHORT, "his Nov 15 door: a finished intro");
check("Hi I'm Robert I'm with the Maya Kaur campaign do you know about the election on Tuesday", SHORT, "his Nov 15 door: a question without a question mark");
check("Hi I'm Robert um I'm volunteering do you know that we have an election here next Tuesday", SHORT, "his Nov 17 door");
check("Hi, I'm Robert, I'm volunteering for Maya Kaur. Boy, it sure is sunny today.", SHORT, "his Nov 15 small talk at the end of a finished line");

/* a hello or small talk on its own waits (Nov 23) */
for (const l of ["Hi", "Hi there", "Hey there neighbor", "Hello, good morning", "Hey, how's it going?", "Hi, how are you doing today?", "Good evening", "Hi! How's your day going?", "Hey, what's up", "Um, hi"]) check(l, LONG, "a hello or small talk");

/* a line that could go on waits (Nov 22) */
for (const l of ["Hi, I'm Sam, and we're trying to get", "I'm volunteering with", "Maya Kaur is running for", "Maya Kaur is running", "I just wanted to remind",
  "Did you know there's", "Election Day is", "I wanted to see if you're planning to", "Can I ask", "So I'm out here knocking", "We're hoping to make",
  "She wants to keep", "I'm here because", "Do you know where", "And their", "I'm volunteering", "um", "Okay", "Sure", "Oh, okay", "No worries", "Of course", "I wanted to talk to you"]) check(l, LONG, "it could go on");

/* a finished line still gets the quick answer */
for (const l of ["Election Day is Tuesday.", "I'm volunteering for Maya Kaur.", "Can we count on your vote?", "Can we count on you?", "Thank you so much.",
  "Thanks, have a good night.", "Nice to meet you", "Okay, thanks", "Are you planning to vote?", "Are you planning to vote", "I'm reminding everyone to vote",
  "Hi, I'm Sam.", "I'm Sam, a neighbor volunteering for Maya Kaur.", "I'm not sure, but I can find out for you. Thanks so much, have a good night.",
  "Do you want to hear more", "Just wanted to stop by", "Not sure, I can find out.", "One more thing about the polls.", "Bye!", "You too",
  "Hi, I'm Robert, um, I'm your neighbor down the street.", "Sure, no problem.", "Okay, that's all good", "We're out talking to voters", "I'm going door to door", "Polls are open seven to eight",
  "It matters to me", "Maya would make the data centers pay the full cost of their own electricity, not you."]) check(l, SHORT, "it sounds finished");

/* the early answer starts before the send, in both cases */
const a = waiPause("Hi how are you"), b = waiPause("Election Day is Tuesday.");
if (a[0] === 2000 && b[0] === 500) pass += 1; else { fail += 1; console.log("FAIL the early answer starts at 2 s and 0.5 s:", a, b); }

console.log(`door pause (${PAGE}): ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
