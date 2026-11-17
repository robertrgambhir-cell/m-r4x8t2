# How Warmup's practice voters talk: the rules

Every rule here came from Robert testing the app on his phone. Each one says what went wrong, what the voter does now and where the rule is enforced, so it can't quietly come undone. Read this before changing a voter's instructions (ai/scenarios.js), the voter's server code (ai/worker.js) or the door screens.

**How a new piece of feedback gets saved (Robert, Nov 16, 2026):**
1. **Enforce it in code when you can.** A rule in the server's code holds every time; a rule only in the AI's instructions can drift.
2. **Replay it.** Add the exact conversation Robert flagged to `tests/voter-replays.mjs`, with the check it must pass. A unit test with a stand-in model goes in `tests/turn.test.mjs` when the rule is in code.
3. **Write it here** in plain words, with his before and after.
4. **Check the live voter.** Run `WARMUP_AI_URL=https://warmup-ai.robertrgambhir.workers.dev node tests/voter-replays.mjs 3` after any change to a voter. A scheduled task runs it every week, so a change in the AI model itself gets caught too.

## The bar for every practice door

- **All three, always (Robert, Nov 15):** the voter answers at once or close to it, over a real back-and-forth, and to what the canvasser actually said. "Boy, it sure is sunny today" gets a reply about the weather, not "Who are you with?" *Enforced:* the streamed voter (/turn), the 1 s pause rule on the page, smallTalk in worker.js (small talk always gets a reply before the voter's question), the live replays.

## Lesson 1 (Sofia's 1st intro and Kevin's 2nd intro)

1. **The two intros are the same experience, graded the same way (Robert, Nov 15).** A full back-and-forth at a door both times, graded on the same four parts. *Enforced:* sofia_intro copies kevin_intro's rubric, facts and wrong claims (scenarios.js).
2. **A friendly first door, not a test of everything (Robert, Nov 15).** Short, plain lines that are easy to answer. Before: "I'm planning to vote for her Tuesday morning, same as always" (sounds like Maya ran before). After: "Oh, Maya Kaur! Yes, I'm voting for her." *Enforced:* the voters' reactions (scenarios.js); the replays check line length and "same as always."
3. **Never ask what the canvasser couldn't know (Robert, Nov 15).** Before: "What time do the polls open Tuesday?" After: no questions about polling hours, places or Maya's positions. "Anything else?" gets "No, I'm all set, thanks for volunteering." *Enforced:* scenarios.js; the replays check for poll questions.
4. **Ask only for a part that's really missing, and ask it plainly (Robert, Nov 15 and 16).** The server works out which parts were said (name, Maya Kaur, why they came) and writes the question itself; the AI adds only a few words of reaction, dropped if odd. Before: he said "the election" and Sofia asked "What's this about?"; then "Oh, hi Robert. Yes, I know about Tuesday. Oh, nice. Who are you volunteering with?"; then, asked twice, "Sorry, I'm a bit confused by what you're after. Your name first? Then you're volunteering for someone?" After: "Oh, hi there. Sorry, and you are?", then once more "Sorry, I didn't catch your name.", then she moves on to the next missing part. *Enforced:* introParts, introPlan and cleanReaction in worker.js; turn.test.mjs; the replays.
5. **At most four of the canvasser's lines; the voter wraps up once the four parts are done (Robert, Nov 15).** *Enforced:* wrapAt 3 and hardStop 4 (scenarios.js), the page's cap.

## Every door

6. **A goodbye ends the door (Robert, Nov 15).** When the voter says goodbye, the door closes and grading starts; the canvasser gets no extra turn. A line that arrives after her goodbye gets "Bye now!" with no AI call. *Enforced:* FAREWELL and saidBye in worker.js; turn.test.mjs; the replays.
7. **The voter never steps out of character (Robert, Nov 15).** Before (after his "You too goodnight"): "I can't write Sofia's next line in this exchange, because the conversation already reached its goodbye..." After: any line that talks about lines, turns, the conversation, practicing or being an AI is never shown or spoken, and the door ends with a plain goodbye. *Enforced:* outOfCharacter in worker.js; turn.test.mjs; the replays.
8. **The goodbye isn't the canvasser's to miss when the voter closed the door (Nov 15).** *Enforced:* the close item's definition (scenarios.js).
9. **Spoken words get punctuation, never changed words (Robert, Nov 15).** *Enforced:* /tidy and sameWords in worker.js; turn.test.mjs.

## On screen

10. **A FaceTime call, not a transcript (Robert, Nov 15).** The voter fills the screen edge to edge, the button floats over the picture, and only the latest lines show as captions (on a short phone, only the voter's). *Enforced:* versions 168 and 169 (the app pages); test165.cjs checks the layout.

## Changelog

- 2026-11-16: written from Robert's Nov 15 and 16 phone runs (versions 165 to 169, practice AI 165-1 to 165-7).
- 2026-11-16: practice AI 165-8 and 165-9. The first replay run caught Sofia skipping the weather one run in two; the server now makes sure small talk gets a reply. 18 of 18 replays pass live.
