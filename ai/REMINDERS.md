# Lesson reminders by text: what's built and what's left

**Status (Nov 6, 2026): not sending.** `ai/reminders.js` plans and can hand a text to Quo, but it refuses unless `REMINDERS_ENABLED=true` and a key and number are set. Nothing runs it on a schedule yet. Because no reminder is sent, the app no longer promises one (see `ai/PHASE1.md`).

## The rules the planner enforces

- **Consent:** a text only to someone with a recorded yes (`consentAt`) and no opt-out (`optedOutAt`).
- **Timing:** only at 8 AM in their own time zone, only when a new lesson is open for them (the same rule as the app, `ai/schedule.js`), and at most once a day.
- **Pause:** stop after three reminders in a row with no new lesson taken.
- **Format:** plain ASCII, one segment (160 characters or fewer), and every text ends "Reply STOP to opt out."

## Why the roster isn't here

Phone numbers never go in this public repo. The roster, kept privately, maps each tester's learner id and personal link to their phone, time zone and consent. It and the job's state file belong in the private warmup-engine repo, next to a scheduled GitHub Action that runs hourly.

## Checklist before the first real text

1. **Quo API key:** Robert creates a Quo API key (Owner or Admin) and adds about $10 of prepaid credits.
2. **Message endpoint:** confirm Quo's Messages endpoint path and body against quo.com/docs. The sender assumes `POST https://api.quo.com/v1/messages` with `{ from, to: [phone], content }`, the `Authorization` header and `Quo-Api-Version: 2026-03-30`. Only the base URL and the two headers were confirmed on Nov 6.
3. **STOP replies:** confirm how Quo handles a STOP reply to an API-sent text, and whether opt-outs can be read back through the API so `optedOutAt` stays current.
4. **Consent wording:** each tester gives consent in writing, with the wording kept with the roster.
5. **First run:** run the job dry, printing what it would send, for two days, then switch on `REMINDERS_ENABLED`.
6. **Copy:** rebuild the app with `--remind` only once texts really go out.
7. **Scale:** the sole-proprietor texting registration suits a pilot. Campaign scale needs the company's own registration (an EIN), likely on Twilio or similar.
