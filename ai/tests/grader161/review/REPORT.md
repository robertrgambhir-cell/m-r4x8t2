# Warmup 161 independent review (Nov 6, 2026)

Written by an independent reviewer agent that did not build the app; saved by the builder because the reviewer could not write report files. Full working files are in this folder (heldout.json, heldout-run.txt, heldout-results.json, shots/).

## Grader tallies (blind held-out set: 50 lines, 172 judged parts)

| Build | Agree | False credit | Missed |
|---|---|---|---|
| 160 | 144 | 19 | 9 |
| 161, blind | 158 | 7 | 7 |
| 161 after the fixes below (no longer blind) | 167 | 3 | 2 |

## Findings and what was done

| # | Finding | Resolution |
|---|---|---|
| M1 | On a phone, the issue lessons overlay covers the tour pill at stop 7 | Fixed: the pill and sheet sit above the overlay |
| M2 | Regressions: noun-before-verb friend ask, "a Maya Kaur volunteer", "do after", a date as when | Fixed, all four |
| S1 | Course 2's header opened the issue lessons before door-ready | Fixed: the header is a plain heading until door-ready |
| S2 | Learn taught "the election is close", which the grader rejects | Fixed: lesson 1's line now names the four parts the grader checks |
| S3 | False credits: How are you, three more doors, voting right now, not volunteering | Fixed. Left as known limits: a pitch question counted as a real question; "Why do you like her" counted as responding |
| S4 | A name credit could show no quote ("im priya") | Fixed: the name quote accepts "im" and "this is" |
| N1 | The minute-ask quote took the whole clause, marking the election words red | Fixed: the quote stops at the ask |
| N2 | The mic card shows browser error text ("speech: not-allowed") | Left as is (an earlier debugging choice); flagged |
| N3 | At tour stop 1 the pill covers the video's chapter bar | Left as is; flagged |
| N4 | With no working mic, "Starting your mic..." stays about 7 seconds before "type it instead" | Left as is (the existing watchdog); flagged |
| N5 | Debatable labels ("thanks", imperative "Text your sister") | Imperative asks now count; "thanks" left |

## Verified working (reviewer)

- The election line is not credited as Election Day; the near miss and the minute ask show; a full line quotes the user's own words on both cards; 390, 375 and 1440 wide with no horizontal scroll.
- No mic permission, no speech stand-in: "type it instead" appears, typing is graded, typing carries over to the door (4 of 4). A simulated not-allowed or audio-capture error shows the mic card with Try again and Type it instead.
- Today, Learn and Progress: no clipping, counts agree, every Learn control goes where it should.
- ?tour: nine stops land correctly; localStorage and sessionStorage stay empty; no pill on a 1440 laptop.
- No console or page errors.
