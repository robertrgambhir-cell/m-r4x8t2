# Phase 1: production foundations (Nov 6, 2026)

Branch `phase1-foundations` only. Nothing here is deployed: Cloudflare builds the worker from `main`, and GitHub Pages serves `main`.

## Baseline (inspected before any edit)

- Live app: version 155 (`wdpfxqlsvp/app.html`, commit c64b12d). Staging: version 159 (`wdpfxqlsvp/staging/index.html`) plus three worker-only commits on `main` up to 784661e (Nov 5, 10:33 PM ET). Version 160 (the presenter guide) exists only as a builder in the project docs (`claude/warmup-maya-v160.py`); it was never pushed, and this branch doesn't include it.
- Lessons 2 to 5 were locked for everyone (`LOCK_ON = true`). Progress lived in memory only; a reload started over. Today promised "We'll text you lesson 2 tomorrow at 8 AM," and nothing sends texts.
- The issue lesson page reported a finished lesson to the app by `postMessage` ("brief-done"). The app passed the finished list back in the frame's URL. Nothing was saved.
- The AI server compared the admin token with `===` and accepted any length. On Nov 5, `SIGNING_KEY` and `ADMIN_TOKEN` appeared in a screenshot, and the key sat in plain dashboard variables. The free plan's daily KV write limit was used up during the Nov 5 red-team run.

## What Phase 1 adds

| Piece | Files | What it does |
|---|---|---|
| The daily rule | `ai/schedule.js` (+ `schedule.mjs` for node) | One new lesson each morning, starting at 5 AM local time: lessons 1 to 5 in order, then the five issue lessons in any order. A retake, a practice door or a redo never uses the day. A missed day isn't made up. The page and the reminder planner both use this file. |
| Progress on the phone | `ai/client/phase1.js` | Saves finished lessons in `localStorage`: which parts each lesson's first and best tries hit, the best try's words (for the record sheet), first finish times, issue lessons, doors, active days and retakes. A returning learner lands on Today, not the video. Presenter shortcuts (`?home`, `?ready`, `?learn`, `?issues`, `?convo`) never read or write a learner's record. |
| Progress on the server (optional) | `ai/learner.js` (routes added to `ai/worker.js`) | When `/health` reports `progress: true`, the page gets an anonymous signed learner token and keeps a server copy without any words. A personal link with `?l=<token>` restores progress on another phone. `DELETE /v1/progress` erases the server copy. |
| Events | `phase1.js`, `/v1/events` | app_open, return_visit, video_start, video_leave, lesson_start, part_view, attempt (part, parts hit, voice or typed, AI or not), feedback_shown, lesson_complete (with time spent), issue_open, issue_complete, locked_view, tab_view, practice_door, interruption, error. No words or free text. Events are queued on the phone and sent in batches with `sendBeacon`. |
| Inspecting the data | `GET /v1/admin/events?day=YYYY-MM-DD`, `GET /v1/admin/learners` | Both need the `x-admin-token` header. |
| Honest copy | `ai/build-phase1.py` | With reminders off (the default), every reachable "we'll text you" line now says what really happens: "Lesson 2 opens tomorrow morning, right here." The issue lessons open the morning after door-ready. |
| Issue page shares the rule | `build-phase1.py` (dev copy of `issues/index.html`) | The app tells the issue page `slot=0` when today's new lesson is used. Unfinished issue rows then show "Tomorrow" and can't start. A finished issue lesson keeps its first finish time. |
| Reminder boundary | `ai/reminders.js`, `ai/REMINDERS.md` | A planner decides who would get a text. The rules: consent given, not opted out, 8 AM local, a lesson open, at most one text a day, and a pause after three quiet mornings. A Quo sender refuses to send unless `REMINDERS_ENABLED=true` and a key and number are set. Nothing runs it yet. |
| Security | `worker.js`, `learner.js` | Admin compares are now constant-time, and any admin token under 24 characters counts as unset. Learner tokens need their own new secret (`LEARNER_KEY`, 32 or more characters) and never derive from the exposed keys. Storage failures answer 503 and never crash the page. |
| Assessment harness | `ai/assess/` | `export.mjs` runs the live keyword grader (read straight out of `app.html`) and, optionally, the AI coach on a set of cases. It writes one sheet with two blank columns for trainers. `agree.mjs` reports human-to-human agreement and each grader against the trainers (percent, Cohen's kappa, false credit). It reports nothing for an item with fewer than 50 labeled pairs. Real learner answers need `consent: true`. |

## Tests (all run in the build workspace on Nov 6)

- `node ai/tests/worker.test.mjs`: 63 pass (unchanged).
- `node ai/tests/learner.test.mjs`: 28 pass. Covers tokens, a forged signature, the missing or short secret, merges, junk and oversized records, the KV daily limit, no words stored, beacon events, admin views and erase.
- `node ai/tests/schedule.test.mjs`: 17 pass. Covers 5 AM boundaries, a 2 AM night owl, order, missed days, door-ready, one issue a day and time zones.
- `node ai/tests/reminders.test.mjs`: 15 pass. Covers consent, opt-out, send hour, one a day, the quiet pause, plain ASCII and the sender's refusals. Fetch is stubbed; nothing was sent.
- `node ai/tests/assess.test.mjs /abs/app.html`: 10 pass. Uses fixtures and synthetic labels only.
- `NODE_PATH=$(npm root -g) node ai/tests/test-p1.cjs` with `node ai/tests/p1-server.mjs <repo root>` running: 38 pass, in headless Chromium at 402x874 against the real worker with fake storage. The walk:
  - lesson 1 for real, then a reload;
  - the next day with a retake and lesson 2 for real, then the day after;
  - an interruption mid-lesson;
  - door-ready day and the next day, with the issue page's rows;
  - presenter shortcuts;
  - the server copy, and a personal link on a new phone;
  - the server down and storage full;
  - erase.
- Regression: 13 main screens compared between staging and this build. 10 are identical. The differences are the two intended copy changes plus Practice's random door order.
- Not runnable here: `test156.cjs` crashes the same way on unmodified staging in this headless browser (no page mic), so it gives no signal either way.

## To build

```
python3 ai/build-phase1.py wdpfxqlsvp/staging/index.html wdpfxqlsvp/issues/index.html wdpfxqlsvp/dev --dev
```

`--dev` turns on the test clock (`?day=+1` is tomorrow, `?day=+2` the day after). Drop it for anything learners see. `--remind` keeps the old text-message copy and is only for when reminders really send.

## What a deployment would need (Robert's decision; not done)

1. In Cloudflare, for the warmup-ai worker:
   - add the secret `LEARNER_KEY` (32 or more random characters);
   - change `ANTHROPIC_API_KEY`, `SIGNING_KEY` and `ADMIN_TOKEN` from Variables to Secrets;
   - give `SIGNING_KEY` and `ADMIN_TOKEN` new values (24 or more characters for the admin token).

   This takes about 10 minutes. Until it's done, the progress routes answer "off" and the page saves on the phone only.
2. Merge the branch to `main`. That redeploys the worker and publishes `wdpfxqlsvp/dev/` at yourwarmup.com/wdpfxqlsvp/dev/. Live (`/kaur`) and staging stay as they are until their own files are rebuilt from this builder.
3. KV's free plan allows about 1,000 writes a day across all uses. That's enough for a pilot of about 10 to 20 testers. Beyond that, move progress and events to D1 (100,000 writes a day free) or a paid plan.
