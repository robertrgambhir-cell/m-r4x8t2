# Version 156: the live AI voter and coach. Test report and change log

Nov 4 to 5, 2026. Staging only; the live app stays at version 155.

## What's verified and what isn't

| Part | Status |
|---|---|
| Worker logic (prompts built server side, quote checks, caps, limits, timeouts, retries) | **Verified**, 34 unit checks with Claude stubbed |
| Staging page with the real worker code and a canned model (turns, retry, coach card, full coaching, Bri, Type instead, no-server fallback) | **Verified**, 45 checks at 402x713, 375x667 and 1280x792 |
| Prompt quality: the exact prompts, answered by Claude models standing in for the API (Haiku for the voter, Sonnet for the coach) | **Dry run**: 9 of 9 voter cases, the two-openers pair and 9 of 9 coach cases pass. A dry run is a strong sign, not proof; the deployed run below is the real test |
| The deployed worker calling Claude from the public page | **Not yet run.** It needs Robert's Cloudflare account and Anthropic key (ai/README.md). Then `tests/live-eval.mjs` runs the same cases against it |
| Microphone, speech recognition and voices on a real iPhone | **Not testable here.** Manual steps in ai/README.md |

## The difference, line by line (version 155's scripted Kevin vs the AI voter dry run)

| Case | Version 155 (scripted) | AI voter (dry run) |
|---|---|---|
| Clear opener | Oh, hey, neighbor! Yeah, I'm voting for Maya. Thanks for coming by. *(door closes)* | Oh, a neighbor, nice. Yeah, I'm voting for her. Thanks for the reminder, I'm going after work. What time do the polls close? |
| Incomplete ("Hi there.") | Sorry, who are you with? | Hi. Who are you with, though? |
| Asks for his time | Uh, sure, I guess. What's up? | Uh, sure, I guess. What's up? |
| Unexpected question (the side door) | Oh, is this about the election? I'm voting, don't worry. Thanks! *(door closes)* | I don't know, honestly. Why, what do you need the side door for? |
| Changes the subject (the game) | Oh, is this about the election? I'm voting, don't worry. Thanks! *(door closes)* | Nah, I missed it, been buried in work all day. Was it a good one? |
| Says "I'm not sure, I can find out" | *(the door had already closed)* | Oh, that's fine, I'll check the county site. Thanks for the reminder. |
| Corrects themselves | Okay. What's this about? | No worries. Oh, cool, I'm voting for her. |
| Speech slip ("maya core ... two's day") | Oh, okay. Yeah, I'm voting for her. Thanks for stopping by. | Oh, nice, Maya Kaur. I'm voting for her. Thanks for the reminder about Tuesday. |
| Sixth turn, he has a call | *(the door had already closed)* | Not really, no. Thanks for stopping by, I've got to hop on this call. Take care. *(ends)* |
| Same "Hey. Can I help you?", two openers | A: warm, door closes. B: "Uh, sure, I guess. What's up?" | A: "Oh, nice, a neighbor. Thanks for checking in, I'm planning to vote Tuesday after work. Do you know when the polls close?" B: "Uh, sure, I guess. Who are you with, though?" (word overlap 0.14) |

## The coach (dry run, after the worker's checks)

| Case | Result |
|---|---|
| A correct paraphrase ("Dana here ... helping Maya Kaur's Senate campaign ... the election's this Tuesday") | all four parts met |
| Missing parts ("Do you have a minute to talk?") | no part met |
| Invented facts ("polls close at 9 PM", "cut your taxes in half") | Stick to what you know missed, both claims listed; the suggested line says "I'm not sure about the poll hours, but I can find out" |
| Honest uncertainty | Stick to what you know, Listen and End it well all met |
| Asking about a plan instead of saying Tuesday | Election Day not met |
| Speech slip "maya core" | Maya met, listed as a likely mis-hearing |
| The 1st try's one line | all four met |
| Bri: "her opponent is against Medicaid" | Stick to the facts missed |
| Bri: the three things in her own words | all three met |

Never credited what wasn't said: the worker drops any credit whose quote isn't in the canvasser's own lines, and any praise or "check this" note tied to words they didn't say (unit-tested).

## Speed and cost (estimates until the live run measures them)

- Voter turn: about 1,500 input and 60 output tokens on Haiku 5.5, about $0.0002. Coaching: about 2,500 in and 700 out on Sonnet 5.5, about $0.012. One full conversation with coaching: about **$0.013**, so the $200 budget covers roughly 15,000 practice conversations a month.
- Guards: output caps (220 voter, 1,400 coach tokens), per-connection limits (150 voter and 30 coach calls an hour), a $6 daily and $150 monthly ceiling counted from Claude's own usage figures, and a $200 limit set on the Anthropic account itself.
- Latency guess: under 2 seconds a voter turn, 5 to 10 seconds for coaching. The live run reports real medians.

## Known limits

- **One voice.** AI lines use the phone's built-in voice; Kevin's recorded clips can't say new lines, so the whole AI conversation uses the built-in voice for consistency. A real-voice TTS is the next upgrade.
- **The dry run isn't the deployed run.** Run `tests/live-eval.mjs` after deploying; expect some variation between runs.
- **Strict quote checks** can cost a canvasser a credit when the model paraphrases its own quote. The live run counts these downgrades.
- **Bri's facts say Georgia** because the approved issue lesson does, while Maya now runs in Woodbridge. That's the campaign demos thread's content.

## Change log

New files (all under ai/ and wdpfxqlsvp/staging/; nothing else changed):
- ai/scenarios.js, ai/worker.js, ai/wrangler.toml, ai/package.json, ai/dist/warmup-ai-worker.js
- ai/client/engine.js, ai/client/engine.css, ai/build-staging.py (the exact-match builder, 37 asserted swaps)
- ai/tests/: worker.test.mjs, mock-server.mjs, test156.js, cases.mjs, live-eval.mjs, scripted-baseline.mjs, dryrun-export.mjs
- ai/README.md (deploy, links, rollback, manual iPhone tests), ai/REPORT.md (this file)
- wdpfxqlsvp/staging/index.html: the staging page

What the staging page changes, compared with 155:
- Lesson 1's 2nd try with Kevin is a full conversation (up to ten turns; Kevin ends it) when the AI is on. The 1st try's line is graded by the coach.
- The feedback card's rows come from the coach, with What worked, Try next and See your full coaching (every rubric row with your own words, anything to check, likely mis-hearings and the transcript).
- If the AI fails mid-conversation the door says so with Try again; if the coach fails, the card says its rows are a quick word check, with Get the coaching. The scripted voter never stands in silently.
- The door says whether the voter is the live AI or scripted. Only the last two lines show on the door, so Kevin stays in view.
- Type instead, under the mic, opens the box for typing when speech recognition fails.
- A Bri door (health insurance) opens from the Practice tab after lesson 6, or with ?convo=bri.

Preserved: the two courses, the ten lessons, their order and unlocks, the lesson flow (1st try, Hear it done, Catch the mistake, 2nd try, feedback), the brand, illustrations and navigation. No Play mode was added or unlocked. Without a server the staging page behaves as 155 does, with a "Scripted voter" label.
