/* Phase 1 unit tests: learner tokens, progress merge, events and the admin views, against an in-memory stand-in for Workers KV.
   No network, no key. Run: node tests/learner.test.mjs */
import worker from "../worker.js";
import { mergeProgress, cleanProgress, cleanEvents, makeToken, readToken, safeEqual } from "../learner.js";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass += 1; else { fail += 1; console.log("FAIL", m); } };
class FakeKV {
  constructor() { this.m = new Map(); this.writes = 0; this.failWrites = false; }
  async get(k, type) { const v = this.m.get(k); return v === undefined ? null : type === "json" ? JSON.parse(v) : v; }
  async put(k, v, opts) { if (this.failWrites) throw new Error("KV put() limit exceeded for the day."); this.writes += 1; this.m.set(k, v); this.ttl = opts && opts.expirationTtl; }
  async delete(k) { this.m.delete(k); }
  async list({ prefix, cursor }) { const keys = [...this.m.keys()].filter((k) => k.startsWith(prefix)).sort().map((name) => ({ name })); return { keys, list_complete: true }; }
}
const ORIGIN = "https://yourwarmup.com", ADMIN = "a-long-admin-token-for-tests-0123456789";
const KV = new FakeKV();
const env = { ANTHROPIC_API_KEY: "k", LEARNER_KEY: "learner-key-for-tests-0123456789abcdef", ADMIN_TOKEN: ADMIN, WARMUP_KV: KV };
const call = (method, path, { body, token, origin = ORIGIN, admin, raw, e = env, ip = "9.9.9.9" } = {}) => worker.fetch(new Request("https://w.example" + path, {
  method, headers: { origin, "cf-connecting-ip": ip, "content-type": raw ? "text/plain" : "application/json", ...(token ? { authorization: "Bearer " + token } : {}), ...(admin ? { "x-admin-token": admin } : {}) },
  body: body === undefined ? undefined : raw ? body : JSON.stringify(body) }), e);

/* 1. tokens */
let r = await call("POST", "/v1/learner"); let j = await r.json();
ok(r.status === 200 && /^[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{32}$/.test(j.token), "a new learner gets a signed token: " + JSON.stringify(j));
const tok = j.token;
ok((await readToken(env, tok)) === tok.split(".")[0], "the token reads back to its id");
r = await call("GET", "/v1/progress", { token: tok.slice(0, -1) + (tok.endsWith("A") ? "B" : "A") });
ok(r.status === 401, "a token with a changed signature is refused: " + r.status);
r = await call("POST", "/v1/learner", { origin: "https://evil.example" });
ok(r.status === 403, "another site can't mint learners");
r = await call("POST", "/v1/learner", { e: { ...env, LEARNER_KEY: "short" } });
ok(r.status === 503 && (await r.json()).error === "learner_off", "without a 32-character LEARNER_KEY the routes are off, not insecure");
r = await call("POST", "/v1/learner", { e: { ...env, LEARNER_KEY: "", SIGNING_KEY: "a-signing-key-that-is-long-enough-123" } });
ok(r.status === 503, "the old SIGNING_KEY is never used to sign learner tokens");
ok(safeEqual("abc", "abc") && !safeEqual("abc", "abd") && !safeEqual("abc", "abcd"), "constant-time compare");

/* 2. progress */
r = await call("GET", "/v1/progress", { token: tok }); j = await r.json();
ok(r.status === 200 && j.progress === null, "a new learner has no record yet");
const day0 = Date.UTC(2026, 10, 6, 14);
const p1 = { v: 1, campaign: "kaur", lessons: { 1: { first: [true, false, false, true], best: [true, true, false, true], at: day0, retakes: 0 } }, issues: {}, doors: 2, activeDays: ["2026-11-06"],
  transcript: "Hi I'm Rosa", lessonsText: { 1: "my words" } };
r = await call("PUT", "/v1/progress", { token: tok, body: { progress: p1 } }); j = await r.json();
ok(r.status === 200 && j.progress.lessons[1].at === day0 && j.progress.doors === 2, "progress saves");
const stored = KV.m.get("lp:" + tok.split(".")[0]);
ok(!/Rosa|my words|transcript/.test(stored), "no words reach the server, even if the page sends them: " + stored.slice(0, 120));
/* a second phone (or an old copy) sends a retake with a later time and a worse score, plus lesson 2 */
const p2 = { lessons: { 1: { first: [false, false, false, false], best: [true, false, false, false], at: day0 + 86400000, retakes: 1 }, 2: { first: null, best: [true, true, true, true], at: day0 + 86400000 } }, issues: { ga: day0 + 2 * 86400000 }, doors: 1 };
r = await call("PUT", "/v1/progress", { token: tok, body: { progress: p2 } }); j = await r.json();
const L1 = j.progress.lessons[1];
ok(L1.at === day0 && L1.best.filter(Boolean).length === 3 && L1.first[0] === true && L1.retakes === 1, "a merge keeps the earliest finish, the better best and the real first try: " + JSON.stringify(L1));
ok(j.progress.lessons[2] && j.progress.issues.ga === day0 + 2 * 86400000 && j.progress.doors === 2, "a merge adds lesson 2, the issue lesson and keeps the higher door count");
r = await call("PUT", "/v1/progress", { token: tok, body: { progress: { lessons: { 1: { best: "lots", at: "yesterday" } }, issues: { zz: day0 }, campaign: "<script>" } } });
j = await r.json();
ok(r.status === 200 && j.progress.lessons[1].at === day0 && !j.progress.issues.zz && j.progress.campaign === "kaur", "junk fields are dropped and nothing is lost");
r = await call("PUT", "/v1/progress", { token: tok, body: { progress: { pad: "x".repeat(20000) } } });
ok(r.status === 413, "an oversized record is refused");
KV.failWrites = true;
r = await call("PUT", "/v1/progress", { token: tok, body: { progress: p1 } }); j = await r.json();
ok(r.status === 503 && j.error === "storage_error", "a full KV day answers 503 with a plain message, no crash: " + JSON.stringify(j));
KV.failWrites = false;
r = await call("GET", "/v1/progress", { token: tok, e: { ...env, WARMUP_KV: undefined } });
ok(r.status === 503 && (await r.json()).error === "storage_off", "no KV bound: 503 storage_off");

/* 3. events */
const evs = [{ name: "app_open", t: day0, sid: "s1abcdef", props: { entry: "link", returning: false, text: "should not be kept" } },
  { name: "attempt", t: day0 + 5000, sid: "s1abcdef", props: { lesson: 1, part: "try1", hits: 2, of: 4, mode: "voice", words: "Hi I'm Rosa" } },
  { name: "not_an_event", t: day0 }, { name: "lesson_complete", props: { lesson: 1, ms: 312000, retake: false } }];
r = await call("POST", "/v1/events", { raw: true, body: JSON.stringify({ token: tok, events: evs }) }); j = await r.json();
ok(r.status === 200 && j.stored === 3, "a text/plain beacon stores the three known events: " + JSON.stringify(j));
ok(KV.ttl === 120 * 86400, "event batches expire after 120 days");
r = await call("POST", "/v1/events", { body: { token: "nope", events: evs } });
ok(r.status === 401, "events need a valid learner token");
const cleaned = cleanEvents(evs);
ok(!JSON.stringify(cleaned).includes("Rosa") && !JSON.stringify(cleaned).includes("should not"), "free text in props is dropped");

/* 4. admin views */
r = await call("GET", "/v1/admin/events?day=" + new Date().toISOString().slice(0, 10));
ok(r.status === 401, "admin views need the admin token");
r = await call("GET", "/v1/admin/events?day=" + new Date().toISOString().slice(0, 10), { admin: ADMIN }); j = await r.json();
ok(r.status === 200 && j.count === 3 && j.events[0].learner === tok.split(".")[0], "admin sees the day's events with the learner id: " + j.count);
r = await call("GET", "/v1/admin/learners", { admin: ADMIN }); j = await r.json();
ok(r.status === 200 && j.count === 1 && j.learners[0].progress.lessons[1], "admin sees every learner's progress");
r = await call("GET", "/v1/admin/learners", { admin: "short", e: { ...env, ADMIN_TOKEN: "short" } });
ok(r.status === 401, "an admin token under 24 characters counts as unset");
r = await worker.fetch(new Request("https://w.example/health?spend=1", { headers: { "x-admin-token": "short" } }), { ...env, ADMIN_TOKEN: "short" }); j = await r.json();
ok(j.dayUsd === undefined, "the spend view is closed with a short admin token too");
r = await worker.fetch(new Request("https://w.example/health"), env); j = await r.json();
ok(j.progress === true && j.reminders === false, "health says progress is on and reminders are off: " + JSON.stringify(j));

/* 5. erase */
r = await call("DELETE", "/v1/progress", { token: tok }); j = await r.json();
ok(r.status === 200 && j.erased && !KV.m.has("lp:" + tok.split(".")[0]), "the learner can erase their record");

/* 6. merge as a pure function */
const m = mergeProgress(cleanProgress({ issues: { ga: 5e12 } }), cleanProgress({ issues: { ga: day0 } }));
ok(m.issues.ga === day0, "out-of-range times are dropped before a merge");
console.log(`learner: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
