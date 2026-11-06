/* Phase 1: the boundary for real lesson reminders by text. It plans who would get a text and can hand texts to Quo, but it
   sends nothing unless REMINDERS_ENABLED is "true" and a Quo key and number are configured. Nothing here runs on its own:
   the intended runner is an hourly scheduled job in the private warmup-engine repo (see ai/REMINDERS.md), because the roster
   of phone numbers must never sit in this public repo.

   roster entry (private): { learner: "<learner id>", link: "<personal app link with ?l=token>", phone: "+1...", tz: "America/Los_Angeles",
                             consentAt: ms, optedOutAt: ms|null, name: "Ana" }
   state (private, the job's own file): { "<learner id>": { lastSentDay: "2026-11-07", quietSends: 2 } } */
import { SCHED } from "./schedule.mjs";

export const SEND_HOUR = 8;          /* local hour a reminder may go out */
export const MAX_QUIET = 3;          /* stop after three reminders in a row with no new lesson taken */
const ASCII = /^[\x20-\x7E]*$/;

export function messageFor(entry, nx) {
  const who = entry.name && /^[A-Za-z' -]{1,20}$/.test(entry.name) ? entry.name + ", " : "";
  const what = nx.kind === "lesson" ? "lesson " + nx.n + " is ready" : "your next issue lesson is ready";
  const text = "Warmup: " + who + what + ". 5 minutes: " + entry.link + " Reply STOP to opt out.";
  if (!ASCII.test(text)) throw new Error("reminder text must be plain ASCII so it stays one segment");
  return text;
}

/* who gets a text this hour: consented, not opted out, a new lesson open right now, the local hour is SEND_HOUR,
   not already texted today, and fewer than MAX_QUIET unanswered reminders in a row */
export function plan(roster, progressById, state, now) {
  const out = [], skipped = [];
  for (const e of roster) {
    const why = (r) => skipped.push({ learner: e.learner, reason: r });
    if (!e.consentAt) { why("no_consent"); continue; }
    if (e.optedOutAt) { why("opted_out"); continue; }
    if (!e.tz || !e.phone || !e.link) { why("incomplete_entry"); continue; }
    const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: e.tz, hour: "numeric", hour12: false }).format(now)) % 24;
    if (hour !== SEND_HOUR) { why("not_send_hour"); continue; }
    const p = progressById[e.learner] || { lessons: {}, issues: {} }, nx = SCHED.next(p, now, e.tz);
    if (nx.kind === "done") { why("all_done"); continue; }
    if (!nx.open) { why("nothing_new_today"); continue; }
    const st = state[e.learner] || {}, today = SCHED.dayKey(now, e.tz);
    if (st.lastSentDay === today) { why("already_sent_today"); continue; }
    if ((st.quietSends || 0) >= MAX_QUIET) { why("paused_after_quiet_days"); continue; }
    out.push({ learner: e.learner, phone: e.phone, text: messageFor(e, nx), day: today });
  }
  return { send: out, skipped };
}

/* after a run: a learner who took a new lesson since the last text resets the quiet count */
export function nextState(state, sent, progressById, now) {
  const s = JSON.parse(JSON.stringify(state || {}));
  for (const [id, st] of Object.entries(s)) {
    const p = progressById[id];
    if (p && st.lastSentAt && Object.values(p.lessons || {}).concat(Object.values(p.issues || {}).map((at) => ({ at }))).some((x) => x && x.at > st.lastSentAt)) st.quietSends = 0;
  }
  for (const m of sent) { const st = s[m.learner] || (s[m.learner] = {}); st.lastSentDay = m.day; st.lastSentAt = now; st.quietSends = (st.quietSends || 0) + 1; }
  return s;
}

/* the sender. Quo's base URL and headers are from quo.com/docs (checked Nov 6); the message path and body are the
   OpenPhone-era shape and must be confirmed against Quo's Messages reference before the first real send. */
export async function sendViaQuo(cfg, msg, fetchImpl = fetch) {
  if (cfg.REMINDERS_ENABLED !== "true") throw new Error("reminders_disabled: set REMINDERS_ENABLED=true only after the checklist in ai/REMINDERS.md");
  if (!cfg.QUO_API_KEY || !cfg.QUO_FROM) throw new Error("reminders_not_configured: QUO_API_KEY and QUO_FROM are required");
  const r = await fetchImpl((cfg.QUO_BASE || "https://api.quo.com") + (cfg.QUO_MESSAGES_PATH || "/v1/messages"), {
    method: "POST",
    headers: { authorization: cfg.QUO_API_KEY, "content-type": "application/json", "quo-api-version": cfg.QUO_API_VERSION || "2026-03-30" },
    body: JSON.stringify({ from: cfg.QUO_FROM, to: [msg.phone], content: msg.text }),
  });
  if (!r.ok) throw new Error("quo_" + r.status);
  return true;
}
