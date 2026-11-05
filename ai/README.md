# Warmup practice AI (version 156, staging)

A live AI voter and an AI coach for Warmup's spoken practice. The voter answers what the canvasser actually says, remembers the conversation and ends it naturally; the coach reads the whole transcript and scores it against an explicit rubric, crediting only words the canvasser really said.

## How it fits together

```
phone (staging page)  --scenario id + transcript-->  Cloudflare Worker (ai/worker.js)  --key kept as a secret-->  Claude
                      <--voter line / checked report--
```

- **ai/scenarios.js**: one structured definition per conversation (the voter's persona, what they know and don't, how they react, approved facts, the rubric). Add a scenario here; no engine code changes.
- **ai/worker.js**: builds the prompts, calls Claude with a forced tool for structured output, checks the answer (every credited item needs a quote that really is in the transcript), caps tokens, rate-limits each connection and stops at daily and monthly dollar ceilings. Stores and logs no conversation text.
- **ai/client/engine.js and engine.css**: the browser side, inlined into the staging page by **ai/build-staging.py**. Sends only a scenario id and the transcript.
- **ai/dist/warmup-ai-worker.js**: the worker bundled into one file, for pasting into the Cloudflare dashboard.

Models: Claude Haiku 5.5 plays the voter (fast and cheap per turn); Claude Sonnet 5.5 coaches (more careful judgment). Both are settings (VOTER_MODEL, COACH_MODEL).

## Deploy the worker (about 15 minutes, no terminal needed)

1. **Anthropic key.** In the Claude Console (console.anthropic.com), create an API key for Warmup. Under Limits, set a monthly spend limit of $200 so the account itself can never pass the budget.
2. **Cloudflare.** Make a free Cloudflare account. Workers & Pages, Create, Worker, name it `warmup-ai`, Deploy. Then Edit code, delete what's there, paste the whole of `ai/dist/warmup-ai-worker.js`, Deploy.
3. **Counters.** Storage & Databases, KV, Create a namespace called `WARMUP_KV`. In the worker's Settings, Bindings, add a KV namespace binding with variable name `WARMUP_KV` pointing to it.
4. **Secret and settings.** In the worker's Settings, Variables and Secrets, add:
   - `ANTHROPIC_API_KEY` as a **Secret** (the key from step 1)
   - `ALLOWED_ORIGINS` = `https://yourwarmup.com`
   - `ADMIN_TOKEN` as a **Secret**: any long random phrase. It lets the live tests run made-up conversations and lets you see spend at `/health?spend=1`
   - `SIGNING_KEY` as a **Secret**: another long random phrase, to sign the voter's lines (without it they're signed with a key derived from the API key)
   - optional:, `DAILY_USD_CAP` (default 6), `MONTHLY_USD_CAP` (default 150), `VOTER_MODEL`, `COACH_MODEL`
5. **Check it.** Open `https://warmup-ai.<your-subdomain>.workers.dev/health`. It should say `"ok": true`.
6. **Point the staging page at it.** Send Claude the worker's address; Claude rebuilds staging with it (`python3 ai/build-staging.py wdpfxqlsvp/app.html wdpfxqlsvp/staging/index.html https://warmup-ai...workers.dev`) and pushes. Until then you can try it by adding `&ai=https://warmup-ai...workers.dev` to the staging link.

With a terminal instead: `cd ai && npx wrangler login && npx wrangler kv namespace create WARMUP_KV` (paste the id into wrangler.toml), `npx wrangler secret put ANTHROPIC_API_KEY`, `npx wrangler deploy`.

## Links

- Staging: https://yourwarmup.com/wdpfxqlsvp/staging/ (add `?convo=kevin` for lesson 1's 2nd try, `?convo=bri` for the health insurance conversation, `?v=` with anything to skip the cache)
- Live app, unchanged: https://yourwarmup.com/kaur (version 155)

## Rollback

The live app (`wdpfxqlsvp/app.html`, version 155) is untouched; staging is a separate page. Commit `c64b12d` (version 155) is the last commit before this work; `git checkout c64b12d -- wdpfxqlsvp/` restores it exactly. To remove staging, delete `wdpfxqlsvp/staging/`; to turn the AI off without a redeploy, set `DAILY_USD_CAP` to 0 (every call stops and the page says the AI isn't available).

## Tests

- `node tests/worker.test.mjs`: the worker's own logic with Claude stubbed (49 checks: origins, free prompts refused, the voter's signed lines, caps, rate limits, timeouts, retries, quote checks, no em dashes).
- `node tests/mock-server.mjs <site>` then `NODE_PATH=$(npm root -g) node tests/test156.cjs <site> <nourl.html> <out> [w h]`: the staging page against the real worker with a canned model (51 checks per screen size).
- `WARMUP_AI_URL=https://... WARMUP_ADMIN_TOKEN=... node tests/live-eval.mjs 3`: the real model on the deployed worker, 9 voter cases three times each, the two-openers pair and 9 coach cases, with latency and spend. About $0.11 a run.
- `node tests/scripted-baseline.mjs <app155.html> <out.json>`: what version 155's scripted Kevin says to the same lines (the "before" column).

## Manual tests on a real iPhone (can't be run headless)

1. Safari, staging link with `?convo=kevin`: tap Knock, hear Kevin, tap Tap to talk, allow the mic, speak your opener. Your words appear, the dots show while he thinks, and he answers out loud.
2. Talk for four to six turns, ask him something unexpected, then say goodbye. He should answer the question, remember what you said and close the door himself.
3. Speak in a noisy room once. Check the words that came through and whether he asks you to repeat a garbled line.
4. Deny the mic once (Settings, Safari, Microphone), reload, and check that Type instead lets you finish by typing.
5. Turn on airplane mode mid-conversation: the door should say the AI couldn't be reached with Try again, and Try again should work once you're back online.
6. Check the voice: the AI conversation uses the phone's own voice for every line (the recorded Kevin clips can't say new lines).
