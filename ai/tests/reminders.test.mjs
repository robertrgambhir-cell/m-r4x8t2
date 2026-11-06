/* Phase 1: the reminder planner and the sender's refusals. Nothing is sent: fetch is a stub. Run: node tests/reminders.test.mjs */
import { plan, nextState, messageFor, sendViaQuo } from "../reminders.js";
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass += 1; else { fail += 1; console.log("FAIL", m); } };
const la = (d, h, m = 0) => Date.UTC(2026, 10, d, h + 8, m);
const base = { learner: "A", link: "https://yourwarmup.com/kaur/?l=TOKEN", phone: "+15555550100", tz: "America/Los_Angeles", consentAt: la(1, 9), optedOutAt: null, name: "Ana" };
const prog = { A: { lessons: { 1: { at: la(6, 21) } }, issues: {} } };
let r = plan([base], prog, {}, la(7, 8, 5));
ok(r.send.length === 1 && /lesson 2 is ready/.test(r.send[0].text) && /Reply STOP/.test(r.send[0].text), "8 AM the morning after lesson 1: one text for lesson 2: " + JSON.stringify(r.send[0]));
ok(r.send[0].text.length <= 160, "the text fits one segment: " + r.send[0].text.length);
ok(plan([base], prog, {}, la(7, 9, 5)).send.length === 0, "not at 9 AM");
ok(plan([base], prog, {}, la(6, 22)).send.length === 0, "not the same night");
ok(plan([{ ...base, consentAt: null }], prog, {}, la(7, 8)).skipped[0].reason === "no_consent", "no consent, no text");
ok(plan([{ ...base, optedOutAt: la(6, 10) }], prog, {}, la(7, 8)).skipped[0].reason === "opted_out", "opted out, no text");
ok(plan([base], { A: { lessons: { 1: { at: la(6, 9) }, 2: { at: la(7, 7) } } } }, {}, la(7, 8)).skipped[0].reason === "nothing_new_today", "already took today's lesson before 8: no text");
ok(plan([base], prog, { A: { lastSentDay: "2026-11-07" } }, la(7, 8, 30)).skipped[0].reason === "already_sent_today", "one text a day at most");
ok(plan([base], prog, { A: { quietSends: 3 } }, la(7, 8)).skipped[0].reason === "paused_after_quiet_days", "pauses after three quiet mornings");
let st = nextState({}, r.send, prog, la(7, 8, 5));
ok(st.A.quietSends === 1 && st.A.lastSentDay === "2026-11-07", "state records the send");
st = nextState(st, [], { A: { lessons: { 1: { at: la(6, 21) }, 2: { at: la(7, 12) } } } }, la(8, 8));
ok(st.A.quietSends === 0, "taking a lesson after a text resets the quiet count");
let threw = "";
try { messageFor({ ...base, name: "Zoë" }, { kind: "lesson", n: 2 }); } catch (e) { threw = e.message; }
ok(threw === "", "a name with an accent is left out, not sent");
const calls = [];
const fake = async (url, init) => { calls.push({ url, init }); return new Response("{}", { status: 202 }); };
let e1 = ""; try { await sendViaQuo({}, r.send[0], fake); } catch (e) { e1 = e.message; }
ok(/reminders_disabled/.test(e1) && calls.length === 0, "the sender refuses while REMINDERS_ENABLED isn't true");
let e2 = ""; try { await sendViaQuo({ REMINDERS_ENABLED: "true" }, r.send[0], fake); } catch (e) { e2 = e.message; }
ok(/not_configured/.test(e2) && calls.length === 0, "and without a key and number");
await sendViaQuo({ REMINDERS_ENABLED: "true", QUO_API_KEY: "k", QUO_FROM: "+15555550199" }, r.send[0], fake);
ok(calls.length === 1 && calls[0].url === "https://api.quo.com/v1/messages" && JSON.parse(calls[0].init.body).to[0] === "+15555550100", "configured, it posts one message to Quo (stubbed here)");
console.log(`reminders: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
