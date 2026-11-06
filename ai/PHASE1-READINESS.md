# PHASE 1: DEPLOYMENT READINESS REVIEW (Nov 6, 2026)

Branch `phase1-foundations` only. Nothing is merged or deployed. Labels: **VERIFIED** means an automated test passes against the code on this branch. **PARTIALLY VERIFIED** means tested, but not in every condition that matters. **UNTESTED** means not tested.

## 1. The code-review findings and what happened to each

One correction first: the independent review listed **ten** numbered findings, not the eight I reported on Nov 5. All ten are below.

| # | Finding | Severity | Status | Where | Test | What's left |
|---|---|---|---|---|---|---|
| 1 | A crafted `?ai=` link could send a learner's token to another server and save a script that ran later | High | Fixed. VERIFIED | `ai/client/phase1.js` (`AI_OK`, `clean()`, boot replaces a damaged record); `ai/build-phase1.py` (practice AI address, issue frame address) | test-p1 §11; journey day 10 | A dev build still accepts this computer or Warmup's own Cloudflare account. Never give testers the dev build. |
| 2 | The welcome video promised a text, in its caption and its voice | Medium | Fixed. VERIFIED by machine, not yet by ear | `build-phase1.py` (video block); `ai/assets/welcome-line9-honest.mp3`, `make-line9.py` | journey: caption text, clip length 7.1 s, on-screen promise scan | Robert listens to the new line 9 |
| 3 | Progress and Today disagreed about the next lesson | Medium | Fixed. VERIFIED | `build-phase1.py` (Progress button and line) | test-p1 §11; journey days 0, 1 and 4 | none |
| 4 | The account's 1,000 KV writes a day could run out, by normal use or on purpose | Medium | Partly fixed | `phase1.js` (no empty records, no unchanged saves); `learner.js` (no write when nothing changed, per-learner limits) | learner.test (unchanged save writes nothing) | **Blocker:** the free plan's cap is shared with the AI's spending counters. Fix: Workers Paid, $5 a month |
| 5 | The build that would go public had the test clock on | Low-medium | Fixed. VERIFIED | learner build at `wdpfxqlsvp/p1/`, built without `--dev`; dev clock sandboxed | journey day 10; test-p1 §11 | `wdpfxqlsvp/dev/` also goes public on merge (sandboxed, for Robert only) |
| 6 | A token the server rejected was never replaced | Low | Fixed. VERIFIED | `phase1.js` `connect()` | test-p1 §11 | none |
| 7 | Per-IP limits would hit a group on shared Wi-Fi; events were lost silently | Low | Fixed. VERIFIED | `learner.js` limits; `phase1.js` `flush()` keeps a batch until the server confirms it; the admin view counts each event id once | learner.test (resent event counted once); journey (an interruption logged as the page closed reaches the server by the next visit) | Limits count per server copy, in memory. An event is lost only if the learner never opens the app again |
| 8 | Erase and the personal link were described but not usable | Low | Fixed. VERIFIED | Progress: save line, Copy my personal link, Erase my progress (asks first) | journey (link on a new phone, planted link refused, erase) | none |
| 9 | Two open tabs could overwrite each other | Low | Fixed. VERIFIED | `phase1.js` `after()` merges with what's stored | test-p1 §12 | none |
| 10 | The day started at 6 AM or 4 AM on daylight saving days | Low | Fixed. VERIFIED | `ai/schedule.js` `dayKey()` | schedule.test (both changes) | none |

## 2. Other issues found and fixed in this review

- **Finished issue lessons looked unfinished (introduced Nov 6, caught by the journey test):** my earlier escaping of the list turned the commas into `%2C`. The issue page then saw only the first finished lesson, so from the third issue lesson on it showed finished ones as open. The list is now plain ids and commas. VERIFIED (journey days 5 to 9).
- **The practice AI's server address:** a learner build ignored `?ai=` for progress, but the practice AI still sent transcripts to any address in a link. It's ignored there too now. VERIFIED (journey: no request left the test machine).
- **"We'll text you when it's ready":** six waiting-list lines in Learn said this. They now say "It'll show up in Learn when it's ready." VERIFIED (scan of every screen the journey reached).
- **No honest save status:** Progress now says "saved on this phone only," "saved on this phone. It isn't backed up yet" or "saved on this phone and backed up to Warmup," and the last only when the server's copy matches. In presenter mode it says nothing. VERIFIED (offline, server failing, saving off and normal).
- **Personal link in server logs:** the token moved from `?l=` to `#l=`, which browsers never send to a server. It's removed from the address bar before anything else loads. VERIFIED.
- **Silent link failures:** a link on a phone that has its own lessons, a broken link and a link while the server is down each now say what happened. VERIFIED.
- **The server rewrote every save:** it now skips writes when nothing changed. VERIFIED.
- **My Nov 5 report was wrong on two points:**
  - The review had ten findings, not eight.
  - The keys didn't still need rotating. The project log shows you rotated `ANTHROPIC_API_KEY`, `SIGNING_KEY` and `ADMIN_TOKEN` and moved them to Secrets on Nov 5 at about 10 PM ET.

## 3. Test results (Nov 6, this branch)

| Suite | Result |
|---|---|
| worker.test (AI server) | 63 pass |
| learner.test (progress, events, admin) | 30 pass |
| schedule.test (the daily rule, DST) | 19 pass |
| reminders.test | 15 pass |
| assess.test | 10 pass |
| test-p1 (browser, dev build) | 46 pass |
| test-journey (browser, learner build, ten mornings) | 76 pass |
| Staging vs learner build, 13 main screens (presenter views) | 10 identical; the 3 differences are the two intended copy changes and Practice's random door order |

The journey runs in headless Chromium at 402x874 with touch, on a phone clock moved day by day in New York time. The real worker code runs on fake storage, and the practice AI's model is canned.

## 4. Real devices

**UNTESTED on any real phone.** Every browser test above used headless Chromium on Linux, emulating a touch screen. Nothing ran on an iPhone, in Safari (WebKit), with a real microphone, on cellular or with a real network drop. Safari matters most:

- **Safari's seven-day rule:** Safari can delete a site's saved data after seven days without a visit. A tester who skips a week could lose their progress unless they saved their personal link. UNTESTED.
- **Private browsing:** saved data ends with the session.
- **Voice input:** the recorded voice and speech recognition on iOS were not exercised here.

## 5. Security and infrastructure setup still to do

| Item | Status | Needs you |
|---|---|---|
| `ANTHROPIC_API_KEY`, `SIGNING_KEY`, `ADMIN_TOKEN` | Rotated and stored as Secrets on Nov 5 (project log). No replacement needed now. | No |
| `LEARNER_KEY` (new, 32+ characters) | Not set. Until it is, progress saves on the phone only, and the app says so. | Yes |
| `ADMIN_TOKEN` length | Must be 24+ characters, or the admin views and the red-team's admin checks stop after the merge. I can't see its value. | Yes, check it |
| Workers Paid ($5 a month) | Not on. The free plan's 1,000 KV writes a day are shared with the AI's dollar counters. Once they run out, the AI's caps hold less well and backups stop. | Yes |
| Anthropic spending | Prepaid credits, no card on file (Nov 5). That balance is the hard stop. Keep it that way. | No |
| Secrets in the repo | Scanned: none in the branch or the history. The tests use placeholder values only. | No |
| Texts (Quo) | Off, and refuses to send. Not needed for Phase 1. | Later |

**AI endpoints:**
- The voter speaks only lines the server signed.
- The voice reads only the voter's own lines.
- Browsers from other sites are refused.
- The daily ($6) and monthly ($150) caps sit in KV, with the prepaid balance behind them.
- A script can fake its origin, so the caps and the prepaid balance are the real limits. That's why Workers Paid matters.

**Admin endpoints:**
- They need the admin token in a header, compared in constant time, and refuse any token under 24 characters.
- They show learner ids, progress without words, and events. They never show answers.

## 6. Blockers to a small outside-tester pilot

1. **`LEARNER_KEY` set:** without it the pilot works, but on phones only, with no backup or personal links.
2. **Workers Paid on:** without it a busy day or a bad actor can use up the writes and weaken the AI spending caps.
3. **One real iPhone pass in Safari:**
   - lesson 1;
   - a reload;
   - the next morning;
   - the video's line 9;
   - the personal link on a second phone.
4. **You listen to the new line 9,** and decide whether the cut is good enough or wants a re-record.
5. **Combine with Round 2** (section 9) and rerun every suite on the combined build. Don't deploy either branch alone over the other.

## 7. Is it safe to merge?

**Yes, once items 1, 2 and 5 above are done. Wait for items 3 and 4 before testers get the link.**

The code is ready: the suites pass, the learner build ignores test parameters, nothing promises a text and nothing claims a backup it doesn't have.

Merging does three things:
- it redeploys the AI server, which the live app at `/kaur` also uses (the AI routes are unchanged and their 63 tests pass);
- it publishes two new unlisted pages, `/wdpfxqlsvp/p1/` (learners) and `/wdpfxqlsvp/dev/` (you, with the test clock);
- it does **not** change `/kaur`.

The live app (version 155) still promises texts today. That ends only when testers get the Phase 1 page.

## 8. Your setup, step by step

1. **Cloudflare, about 10 minutes:**
   1. Open dash.cloudflare.com, then Workers & Pages, then warmup-ai, then Settings, then Variables and Secrets.
   2. Add `LEARNER_KEY` as type **Secret**. For the value, generate a random 40-character password in your password manager.
   3. Don't paste it into a chat, a doc or a screenshot.
   4. Check the length of the `ADMIN_TOKEN` you set on Nov 5, wherever you saved it. If it's under 24 characters, use Rotate to give it a new 32-character value.
2. **Cloudflare billing, about 3 minutes:** in Workers & Pages, open the plan settings and upgrade to Workers Paid ($5 a month). Keep the Anthropic account on prepaid credits.
3. **Tell me "secrets set."** I'll check `/health` (it reports progress on or off, never the values). Then I'll wait for your merge decision.
4. **Listen to the line 9 files** I sent with this report. Reply "keep the cut" or "re-record."
5. **When both branches are combined and pass,** tell me "merge." Only then do I merge to `main`.

## 9. What changed on the branch, and how to combine it with Round 2

**Commits:**
- c5e1ae4, Phase 1 foundations;
- 9498570, review fixes;
- this review's commit (listed in the reply).

**Files:**
- **This review changed:** `ai/client/phase1.js`, `ai/learner.js`, `ai/build-phase1.py`, `ai/assets/*` (new), `ai/tests/*` (`test-journey.cjs` new), `ai/PHASE1.md`, `ai/PHASE1-READINESS.md` (new) and `.gitignore` (new).
- **The builder writes:** `wdpfxqlsvp/dev/` and `wdpfxqlsvp/p1/`.
- **Never edited on this branch:** `wdpfxqlsvp/staging/`, `wdpfxqlsvp/issues/`, `wdpfxqlsvp/app.html`, `kaur/`, `index.html`.

**Combining safely with the Round 2 (version 160) work:**
1. Round 2 finishes on its own branch, starting from the same `main` (784661e).
2. Make an integration branch from Round 2's branch and merge `phase1-foundations` into it. Git conflicts are unlikely, because Phase 1 doesn't touch the staging or issue pages. The exception is `ai/worker.js`, if Round 2 edits the server too.
3. Rerun the builder on Round 2's new staging page. It makes 36 exact text swaps and stops loudly if Round 2 changed any text one of them anchors on, so nothing is missed silently. Each failed swap gets re-pointed at the new text. Two need special care:
   - **The video swap** assumes line 9's audio and timings are unchanged. If Round 2 re-recorded or retimed the video, remake the cut with `ai/assets/make-line9.py`.
   - **Round 2 must not bring back** any "we'll text you" line. The journey test fails if it does.
4. Rebuild `wdpfxqlsvp/dev/` and `wdpfxqlsvp/p1/`, then run every suite and the journey on the combined build.
5. Merge the integration branch to `main` only with your go-ahead.
