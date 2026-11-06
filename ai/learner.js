/* Phase 1 (Nov 6, 2026): the learner's record, the event log and the admin views, on the same worker as the practice AI.
   Small on purpose. A learner is an anonymous id the server signs; there is no account, name or phone number here.

   Routes (all JSON; the page's origin must be on ALLOWED_ORIGINS, like the AI routes):
     POST /v1/learner                    -> { token }            a new anonymous learner (rate limited per connection)
     GET  /v1/progress                   -> { progress }         Authorization: Bearer <token>
     PUT  /v1/progress   { progress }    -> { progress }         merged with what the server has (see mergeProgress)
     DELETE /v1/progress                 -> { erased: true }     erases the server copy (no screen calls it yet; P1.erase() does, for data requests)
     POST /v1/events     { token, events }                       accepts text/plain too, so navigator.sendBeacon works
     GET  /v1/admin/events?day=YYYY-MM-DD   x-admin-token        the raw events for one UTC day
     GET  /v1/admin/learners                x-admin-token        every learner's progress, no words
   Storage: Workers KV (binding WARMUP_KV). Progress lives under lp:<id>; each event batch is one KV write under
   ev:<day>:<id>:<time><rand>, kept 120 days. The free plan allows about 1,000 KV writes a day for the whole account, so
   the page batches events and only writes progress when something real changes. Every storage failure answers 503 and
   the page keeps working from the copy on the phone.
   Privacy: no audio, no transcripts, no free text. Progress keeps which parts each attempt hit (booleans) and times.
   Events keep a name, a time and a few whitelisted numbers or short codes. */

const enc = new TextEncoder();
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export class LearnerError extends Error { constructor(status, code, msg) { super(msg || code); this.status = status; this.code = code; } }

/* the key that signs learner tokens (a Cloudflare secret, LEARNER_KEY, 32 characters or more) */
async function tokenKey(env) {
  /* its own secret only: SIGNING_KEY and ADMIN_TOKEN appeared in a screenshot on Nov 5, so nothing new is derived from them */
  const seed = env.LEARNER_KEY || "";
  if (String(seed).length < 32) throw new LearnerError(503, "learner_off", "Progress saving isn't set up on the server.");
  return crypto.subtle.importKey("raw", enc.encode("warmup-learner:" + seed), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}
export async function makeToken(env, id) {
  const sig = await crypto.subtle.sign("HMAC", await tokenKey(env), enc.encode(id));
  return id + "." + b64u(sig).slice(0, 32);
}
export async function readToken(env, tok) {
  const m = /^([A-Za-z0-9_-]{22})\.([A-Za-z0-9_-]{32})$/.exec(String(tok || ""));
  if (!m) throw new LearnerError(401, "bad_token", "That progress link isn't valid.");
  const want = await makeToken(env, m[1]);
  if (!safeEqual(want, m[0])) throw new LearnerError(401, "bad_token", "That progress link isn't valid.");
  return m[1];
}
export function safeEqual(a, b) {
  a = String(a); b = String(b);
  let d = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return d === 0;
}
/* an admin token shorter than 24 characters is treated as not set, so a weak or leaked short phrase can't open the admin views */
export const isAdmin = (env, req) => !!env.ADMIN_TOKEN && String(env.ADMIN_TOKEN).length >= 24 && safeEqual(req.headers.get("x-admin-token") || "", env.ADMIN_TOKEN);

/* ---------------- the progress record ---------------- */
/* { v: 1, campaign: "kaur", lessons: { "1": { first: [b,b,b,b], best: [b,b,b,b], at: ms, retakes: n } },
     issues: { ga: ms }, doors: n, activeDays: ["2026-11-06"], updatedAt: ms } */
const LESSON_IDS = ["1", "2", "3", "4", "5"], ISSUE_IDS = ["ga", "tx", "oh", "me", "mi"];
const bools = (x, n) => (Array.isArray(x) && x.length === n && x.every((v) => typeof v === "boolean") ? x.slice() : null);
const time = (x) => (Number.isFinite(x) && x > 1.6e12 && x < 4.1e12 ? Math.round(x) : null);
const count = (x, max) => (Number.isInteger(x) && x >= 0 ? Math.min(x, max) : 0);
export function cleanProgress(p) {
  if (!p || typeof p !== "object") throw new LearnerError(400, "bad_progress");
  const out = { v: 1, campaign: /^[a-z0-9-]{1,24}$/.test(p.campaign || "") ? p.campaign : "kaur", lessons: {}, issues: {}, doors: count(p.doors, 100000), activeDays: [], updatedAt: Date.now() };
  for (const id of LESSON_IDS) {
    const L = p.lessons && p.lessons[id];
    if (!L) continue;
    const at = time(L.at), best = bools(L.best, 4);
    if (!at || !best) continue;
    out.lessons[id] = { first: bools(L.first, 4), best, at, retakes: count(L.retakes, 1000) };
  }
  for (const id of ISSUE_IDS) { const at = time(p.issues && p.issues[id]); if (at) out.issues[id] = at; }
  if (Array.isArray(p.activeDays)) out.activeDays = [...new Set(p.activeDays.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)))].sort().slice(-400);
  return out;
}
const hitsOf = (h) => (h || []).filter(Boolean).length;
/* two copies of one learner's record (the phone's and the server's) never lose a finished lesson: the earliest finish time
   wins (so a retake never moves the daily clock), the better best attempt wins, the first try is never replaced */
export function mergeProgress(a, b) {
  if (!a) return b; if (!b) return a;
  const out = { v: 1, campaign: b.campaign || a.campaign, lessons: {}, issues: {}, doors: Math.max(a.doors || 0, b.doors || 0), activeDays: [...new Set([...(a.activeDays || []), ...(b.activeDays || [])])].sort().slice(-400), updatedAt: Date.now() };
  for (const id of LESSON_IDS) {
    const x = a.lessons && a.lessons[id], y = b.lessons && b.lessons[id];
    if (!x && !y) continue;
    if (!x || !y) { out.lessons[id] = x || y; continue; }
    out.lessons[id] = { first: (x.at <= y.at ? x.first || y.first : y.first || x.first), best: hitsOf(y.best) > hitsOf(x.best) ? y.best : x.best, at: Math.min(x.at, y.at), retakes: Math.max(x.retakes || 0, y.retakes || 0) };
  }
  for (const id of ISSUE_IDS) {
    const x = a.issues && a.issues[id], y = b.issues && b.issues[id];
    if (x || y) out.issues[id] = Math.min(x || Infinity, y || Infinity);
  }
  return out;
}

/* ---------------- events ---------------- */
export const EVENT_NAMES = ["app_open", "video_start", "video_leave", "lesson_start", "part_view", "attempt", "feedback_shown", "lesson_complete", "issue_open", "issue_complete", "locked_view", "tab_view", "practice_door", "interruption", "return_visit", "error"];
const PROP_KEYS = { lesson: "n", part: "s", hits: "n", of: "n", ms: "n", retake: "b", entry: "s", returning: "b", days: "n", tab: "s", screen: "s", issue: "s", mode: "s", code: "s", pct: "n", to: "s", ai: "b", score: "n" };
export function cleanEvents(list) {
  if (!Array.isArray(list)) throw new LearnerError(400, "bad_events");
  return list.slice(0, 60).map((e) => {
    if (!e || !EVENT_NAMES.includes(e.name)) return null;
    const out = { name: e.name, t: time(e.t) || Date.now(), sid: /^[A-Za-z0-9_-]{6,24}$/.test(e.sid || "") ? e.sid : "" };
    if (/^[a-z0-9]{8,16}$/.test(e.id || "")) out.id = e.id; /* the phone's own id for the event: a batch sent twice (a beacon, then a retry) counts once */
    const p = e.props && typeof e.props === "object" ? e.props : {};
    for (const [k, kind] of Object.entries(PROP_KEYS)) {
      const v = p[k];
      if (v === undefined) continue;
      if (kind === "n" && Number.isFinite(v)) out[k] = Math.max(-1e9, Math.min(1e9, Math.round(v)));
      if (kind === "b" && typeof v === "boolean") out[k] = v;
      if (kind === "s" && typeof v === "string" && /^[a-z0-9_.-]{1,24}$/i.test(v)) out[k] = v;
    }
    return out;
  }).filter(Boolean);
}

/* ---------------- storage ---------------- */
function kv(env) {
  if (!env.WARMUP_KV) throw new LearnerError(503, "storage_off", "Progress saving isn't set up on the server.");
  return env.WARMUP_KV;
}
async function kvTry(fn) {
  try { return await fn(); } catch (e) { if (e instanceof LearnerError) throw e; console.log(JSON.stringify({ storage: "error", detail: String((e && e.message) || e).slice(0, 160) })); throw new LearnerError(503, "storage_error", "Saving didn't work just now. Your progress is still on this phone."); }
}
const newId = () => b64u(crypto.getRandomValues(new Uint8Array(16)));
const utcDay = (t) => new Date(t).toISOString().slice(0, 10);

/* ---------------- the routes ---------------- */
const mem = new Map();
function rate(ip, route, limit) {
  const k = route + ":" + ip + ":" + new Date().toISOString().slice(0, 13), v = (mem.get(k) || 0) + 1;
  mem.set(k, v); if (mem.size > 5000) mem.clear();
  if (v > limit) throw new LearnerError(429, "rate_limited", "Too many requests from this connection.");
}
const bearer = (req) => (/^Bearer\s+(\S+)$/i.exec(req.headers.get("authorization") || "") || [])[1] || "";

export function isLearnerRoute(route) { return route.startsWith("/v1/"); }

export async function learnerRoute(req, env, route, ctx) {
  const { json, origin, origins, ip } = ctx, url = new URL(req.url);
  if (route.startsWith("/v1/admin/")) {
    if (!isAdmin(env, req)) throw new LearnerError(401, "admin_only");
    if (route === "/v1/admin/events" && req.method === "GET") {
      const day = url.searchParams.get("day") || utcDay(Date.now());
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new LearnerError(400, "bad_day");
      const store = kv(env), out = [];
      let cursor;
      do {
        const page = await kvTry(() => store.list({ prefix: "ev:" + day + ":", cursor }));
        for (const k of page.keys) {
          const batch = await kvTry(() => store.get(k.name, "json"));
          const learner = k.name.split(":")[2];
          (batch || []).forEach((e) => out.push({ learner, ...e }));
        }
        cursor = page.list_complete ? null : page.cursor;
      } while (cursor && out.length < 20000);
      const seen = new Set(), uniq = out.filter((e) => { if (!e.id) return true; const k = e.learner + ":" + e.id; if (seen.has(k)) return false; seen.add(k); return true; });
      uniq.sort((a, b) => a.t - b.t);
      return json({ day, count: uniq.length, duplicates: out.length - uniq.length, events: uniq });
    }
    if (route === "/v1/admin/learners" && req.method === "GET") {
      const store = kv(env), out = [];
      let cursor;
      do {
        const page = await kvTry(() => store.list({ prefix: "lp:", cursor }));
        for (const k of page.keys) out.push({ learner: k.name.slice(3), progress: await kvTry(() => store.get(k.name, "json")) });
        cursor = page.list_complete ? null : page.cursor;
      } while (cursor && out.length < 5000);
      return json({ count: out.length, learners: out });
    }
    throw new LearnerError(404, "not_found");
  }
  if (!origins.includes(origin)) throw new LearnerError(403, "origin", "This page isn't allowed to save progress here.");
  if (route === "/v1/learner" && req.method === "POST") {
    rate(ip, "learner", 120); /* a group training on one Wi-Fi network can start many phones at once */
    const id = newId();
    return json({ token: await makeToken(env, id) });
  }
  if (route === "/v1/progress") {
    const id = await readToken(env, bearer(req));
    rate(ip, "progress", 600); rate(id, "progress-learner", 60); /* per learner too, so one token can't burn the account's daily KV writes */
    const store = kv(env), key = "lp:" + id;
    if (req.method === "GET") return json({ progress: await kvTry(() => store.get(key, "json")) });
    if (req.method === "DELETE") { await kvTry(() => store.delete(key)); return json({ erased: true }); }
    if (req.method === "PUT") {
      let body; try { body = await req.json(); } catch (e) { throw new LearnerError(400, "bad_json"); }
      const raw = JSON.stringify(body || {});
      if (raw.length > 16000) throw new LearnerError(413, "too_big");
      const mine = cleanProgress(body && body.progress), theirs = await kvTry(() => store.get(key, "json"));
      const merged = mergeProgress(theirs ? cleanProgress(theirs) : null, mine);
      const same = (x, y) => JSON.stringify({ ...x, updatedAt: 0 }) === JSON.stringify({ ...y, updatedAt: 0 });
      if (!theirs || !same(merged, cleanProgress(theirs))) await kvTry(() => store.put(key, JSON.stringify(merged))); /* no write when nothing changed: saves the account's daily KV writes */
      return json({ progress: merged });
    }
    throw new LearnerError(405, "method");
  }
  if (route === "/v1/events" && req.method === "POST") {
    rate(ip, "events", 600);
    let body; try { body = JSON.parse(await req.text()); } catch (e) { throw new LearnerError(400, "bad_json"); }
    const id = await readToken(env, body && body.token);
    rate(id, "events-learner", 30);
    const events = cleanEvents(body && body.events);
    if (!events.length) return json({ stored: 0 });
    const t = Date.now(), key = "ev:" + utcDay(t) + ":" + id + ":" + t + b64u(crypto.getRandomValues(new Uint8Array(3)));
    await kvTry(() => kv(env).put(key, JSON.stringify(events), { expirationTtl: 120 * 86400 }));
    return json({ stored: events.length });
  }
  throw new LearnerError(404, "not_found");
}
