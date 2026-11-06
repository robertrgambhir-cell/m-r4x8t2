/* Phase 1 (Nov 6, 2026), inlined into the page by ai/build-phase1.py: the learner's progress survives a reload, the daily
   lesson rule is real (ai/schedule.js), the page keeps a small event log, and nothing promises a text that isn't sent.
   The phone is the source of truth (localStorage); when Warmup's server says progress saving is on, the page also keeps a copy
   there under an anonymous learner id, so a personal link (?l=token) can carry progress to another phone.
   Stored on the phone: which parts each lesson's first and best tries hit, the best try's own words (for the record sheet),
   finish times, issue lessons finished, practice doors, active days. Sent to the server: the same minus the words. */
const P1 = (() => {
  const KEY0 = "recognize-demo:p1", TOK = "recognize-demo:learner", EVQ0 = "recognize-demo:events", SEEN = "recognize-demo:lastSeen";
  const qs = new URLSearchParams(location.search);
  const DEV = __P1_DEV__, REMIND = __P1_REMIND__;
  /* the server is Warmup's own. ?ai= is honored only in dev builds, and only for this computer or Warmup's own Cloudflare
     account, so a crafted link can never send a learner's token or record anywhere else */
  const AI_OK = /^(http:\/\/(127\.0\.0\.1|localhost)(:\d{2,5})?|https:\/\/warmup-ai[a-z0-9-]*\.robertrgambhir\.workers\.dev)$/;
  const aiArg = String(qs.get("ai") || "").replace(/\/+$/, "");
  const base = String((DEV && AI_OK.test(aiArg) && aiArg) || (typeof WAI_URL_DEFAULT === "string" ? WAI_URL_DEFAULT : "") || "").replace(/\/+$/, "");
  /* a personal link carries the token after # (#l=...), so it never reaches a web server's logs; ?l= still works. It is
     read once and taken out of the address bar at once, before anything else loads */
  const okTok = (t) => typeof t === "string" && /^[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{32}$/.test(t);
  const linkTok = (() => { let t = ""; try { t = new URLSearchParams(location.hash.slice(1)).get("l") || qs.get("l") || ""; if (t) { const u = new URL(location.href); u.searchParams.delete("l"); u.hash = ""; history.replaceState(null, "", u); } } catch (e) { /* ignore */ } return t; })();
  const DEMO = ["home", "learn", "ready", "issues", "convo"].some((k) => qs.has(k)); /* presenter shortcuts never read or write a learner's record */
  let shift = 0;
  if (DEV && /^[+-]?\d{1,3}$/.test(qs.get("day") || "")) shift = Number(qs.get("day")) * 86400000; /* test clock, dev builds only: ?day=+1 is tomorrow */
  /* a shifted clock runs in a sandbox: its own copy of the record, never synced, no events, so test days can't leak into real data */
  const SANDBOX = shift !== 0;
  const now = () => Date.now() + shift;
  const ls = { get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } } };
  const KEY = SANDBOX ? KEY0 + ":sandbox" : KEY0, EVQ = SANDBOX ? EVQ0 + ":sandbox" : EVQ0; /* sandbox events stay on the phone, never sent */
  if (SANDBOX && ls.get(KEY, null) === null) ls.set(KEY, ls.get(KEY0, null));
  let serverOn = false, token = "", putTimer = 0, lastSaved = "", lastSent = "", localOk = true, syncFailed = false, linkNote = "";
  const sid = Math.random().toString(36).slice(2, 12);

  /* ---- the record ---- */
  function fromS() {
    const d5 = S.done5 || {}, at = S.doneAt || {}, out = { v: 1, campaign: "kaur", lessons: {}, issues: {}, doors: S.doorsN || 0, practDays: (S.practDays || []).slice(-60), activeDays: (S.p1Days || []).slice(-400) };
    LESSONS5.forEach((L) => {
      if (!d5[L.n] || !at[L.n]) return;
      const b = (S.best5 || {})[L.n];
      out.lessons[L.n] = { first: (S.first5 || {})[L.n] || null, best: d5[L.n].slice(), at: at[L.n], retakes: (S.p1Retakes || {})[L.n] || 0, words: b && b.text ? String(b.text).slice(0, 400) : "" };
    });
    Object.entries(S.briefsDoneIds || {}).forEach(([id, t]) => { if (typeof t === "number") out.issues[id] = t; });
    return out;
  }
  const sched = (p) => ({ lessons: p.lessons, issues: p.issues });
  /* every record read from the phone or the server is rebuilt from known fields only: lessons 1 to 5, the five issue ids,
     booleans, numbers, short words; nothing else can reach the page (a crafted key must never reach HTML) */
  const ISS = ["ga", "tx", "oh", "me", "mi"];
  const b4 = (x) => (Array.isArray(x) && x.length === 4 && x.every((v) => typeof v === "boolean") ? x.slice() : null);
  const tm = (x) => (Number.isFinite(x) && x > 1.6e12 && x < 4.1e12 ? x : null);
  const dk = (x) => (typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x) ? x : null);
  function clean(p) {
    if (!p || typeof p !== "object") return null;
    const out = { v: 1, campaign: "kaur", lessons: {}, issues: {}, doors: Number.isInteger(p.doors) && p.doors >= 0 ? Math.min(p.doors, 1e5) : 0, practDays: (Array.isArray(p.practDays) ? p.practDays : []).map(dk).filter(Boolean).slice(-60), activeDays: (Array.isArray(p.activeDays) ? p.activeDays : []).map(dk).filter(Boolean).slice(-400) };
    ["1", "2", "3", "4", "5"].forEach((n) => { const L = p.lessons && p.lessons[n]; if (!L || !b4(L.best) || !tm(L.at)) return; out.lessons[n] = { first: b4(L.first), best: b4(L.best), at: tm(L.at), retakes: Number.isInteger(L.retakes) && L.retakes >= 0 ? Math.min(L.retakes, 1000) : 0, words: typeof L.words === "string" ? L.words.slice(0, 400) : "" }; });
    ISS.forEach((id) => { const t = tm(p.issues && p.issues[id]); if (t) out.issues[id] = t; });
    return out;
  }
  const hasAny = (p) => !!(p && (Object.keys(p.lessons || {}).length || Object.keys(p.issues || {}).length));
  function into(p) {
    S.done5 = {}; S.best5 = {}; S.first5 = {}; S.doneAt = {}; S.p1Retakes = {};
    Object.entries(p.lessons || {}).forEach(([n, L]) => {
      S.done5[n] = L.best.slice(); S.doneAt[n] = L.at; S.p1Retakes[n] = L.retakes || 0;
      if (L.first) S.first5[n] = L.first.slice();
      S.best5[n] = { text: L.words || "", phr: null, hits: L.best.slice() };
    });
    S.briefsDoneIds = Object.assign({}, p.issues || {}); S.briefsDone = Object.keys(S.briefsDoneIds).length;
    S.doorsN = p.doors || 0; S.practDays = (p.practDays || []).slice(); S.p1Days = (p.activeDays || []).slice();
  }
  const hitsN = (h) => (h || []).filter(Boolean).length;
  function merge(a, b) { /* the same rule as the server's mergeProgress: no finished lesson is ever lost */
    if (!a) return b; if (!b) return a;
    const out = { v: 1, campaign: "kaur", lessons: {}, issues: {}, doors: Math.max(a.doors || 0, b.doors || 0), practDays: [...new Set([...(a.practDays || []), ...(b.practDays || [])])].sort().slice(-60), activeDays: [...new Set([...(a.activeDays || []), ...(b.activeDays || [])])].sort().slice(-400) };
    new Set([...Object.keys(a.lessons || {}), ...Object.keys(b.lessons || {})]).forEach((n) => {
      const x = (a.lessons || {})[n], y = (b.lessons || {})[n];
      if (!x || !y) { out.lessons[n] = x || y; return; }
      const better = hitsN(y.best) > hitsN(x.best) ? y : x;
      out.lessons[n] = { first: (x.at <= y.at ? x.first || y.first : y.first || x.first), best: better.best, at: Math.min(x.at, y.at), retakes: Math.max(x.retakes || 0, y.retakes || 0), words: better.words || x.words || y.words || "" };
    });
    new Set([...Object.keys(a.issues || {}), ...Object.keys(b.issues || {})]).forEach((id) => { out.issues[id] = Math.min((a.issues || {})[id] || Infinity, (b.issues || {})[id] || Infinity); });
    return out;
  }
  const forServer = (p) => ({ v: 1, campaign: p.campaign, doors: p.doors, activeDays: p.activeDays, issues: p.issues, lessons: Object.fromEntries(Object.entries(p.lessons).map(([n, L]) => [n, { first: L.first, best: L.best, at: L.at, retakes: L.retakes }])) });

  /* ---- the server copy (optional) ---- */
  async function api(method, path, body, auth) {
    const r = await fetch(base + path, { method, headers: Object.assign({ "content-type": "application/json" }, auth ? { authorization: "Bearer " + auth } : {}), body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "http_" + r.status);
    return j;
  }
  async function connect() {
    if (!base || qs.has("noai") || DEMO) return;
    try {
      const ac = new AbortController(); setTimeout(() => ac.abort(), 4000);
      const h = await fetch(base + "/health", { cache: "no-store", signal: ac.signal }).then((r) => r.json());
      if (!h || !h.progress) throw new Error("off"); /* progress saving isn't switched on: this phone only */
      if (linkTok) {
        /* a personal link restores progress on a phone that has none of its own; it never takes over a phone that already has a record */
        if (okTok(linkTok) && !hasAny(fromS())) { ls.set(TOK, linkTok); linkNote = "used"; }
        else { linkNote = okTok(linkTok) ? "kept" : "bad"; ev("error", { code: "link_ignored" }); toast(linkNote === "kept" ? "This phone already has its own lessons, so the link wasn\u2019t used." : "That personal link isn\u2019t complete. Check that you copied all of it."); }
      }
      token = ls.get(TOK, "");
      if (!okTok(token)) token = "";
      let there = null;
      if (token) { try { there = (await api("GET", "/v1/progress", null, token)).progress; } catch (e) { if (/bad_token/.test(String(e && e.message))) token = ""; else throw e; } }
      if (!token) { token = (await api("POST", "/v1/learner")).token; ls.set(TOK, token); there = null; }
      if (!okTok(token)) throw new Error("bad_token");
      serverOn = true;
      there = clean(there);
      if (there) lastSent = JSON.stringify(forServer(there));
      if (linkNote === "used") toast(there && hasAny(there) ? "Your lessons are back on this phone." : "That link has no saved lessons yet.");
      if (there) {
        const mine = fromS(), m = merge(mine, there);
        if (JSON.stringify(m.lessons) !== JSON.stringify(mine.lessons) || JSON.stringify(m.issues) !== JSON.stringify(mine.issues)) {
          into(m); if (S.screen === "video" && Object.keys(m.lessons).length) { try { pauseVideo(); } catch (e) { /* ignore */ } S.screen = "welcome"; S.hist = []; }
          render();
        }
      }
      push(false); flush();
    } catch (e) { serverOn = false; ev("error", { code: "sync_" + String((e && e.message) || "x").slice(0, 16).replace(/[^a-z0-9_]/gi, "") }); }
    if (linkTok && !linkNote) toast("Warmup\u2019s server couldn\u2019t be reached, so the link couldn\u2019t bring your lessons back. Try it again later.");
    if (S.screen === "me") render(); /* Progress says where the record is saved */
  }
  function push(force) {
    if (!serverOn || DEMO || SANDBOX) return;
    const rec = fromS();
    if (!hasAny(rec)) return; /* no record for someone who hasn't finished anything: saves the account's daily writes */
    const body = JSON.stringify(forServer(rec));
    if (!force && body === lastSent) return;
    clearTimeout(putTimer);
    putTimer = setTimeout(() => { api("PUT", "/v1/progress", { progress: JSON.parse(body) }, token).then(() => { lastSent = body; syncFailed = false; }).catch(() => { syncFailed = true; /* the phone keeps it; the next change or the next visit tries again */ }).then(() => { if (S.screen === "me") render(); }); }, force ? 0 : 1500);
  }

  /* ---- events ---- */
  function ev(name, props) {
    if (DEMO) return;
    const q = ls.get(EVQ, []);
    q.push({ name, t: now(), sid, id: Math.random().toString(36).slice(2, 12).padEnd(10, "0"), props: props || {} });
    ls.set(EVQ, q.slice(-300));
    if (q.length >= 40 || name === "lesson_complete" || name === "issue_complete") flush();
  }
  /* a batch leaves the phone's queue only after the server says it stored it. When the page is closing there is no time to
     wait for that, so the beacon is a best try and the batch stays queued: the next visit sends it again, and the server's
     admin view counts an event once by its id. An event is lost only if the learner never opens the app again. */
  let flushing = false;
  function flush(closing) {
    if (!serverOn || !token || SANDBOX) return;
    const q = ls.get(EVQ, []);
    if (!q.length) return;
    const batch = q.slice(0, 60), body = JSON.stringify({ token, events: batch }), ids = new Set(batch.map((e) => e.id));
    const drop = () => ls.set(EVQ, ls.get(EVQ, []).filter((e) => !ids.has(e.id)));
    if (closing) {
      try { if (navigator.sendBeacon) navigator.sendBeacon(base + "/v1/events", new Blob([body], { type: "text/plain" })); } catch (e) { /* the next visit tries again */ }
      return;
    }
    if (flushing) return;
    flushing = true;
    fetch(base + "/v1/events", { method: "POST", body, headers: { "content-type": "text/plain" }, keepalive: true, cache: "no-store" })
      .then((r) => { if (r.ok) { drop(); if (q.length > batch.length) setTimeout(() => flush(false), 0); } })
      .catch(() => { /* kept on the phone for the next try */ })
      .then(() => { flushing = false; });
  }
  const LESSON = new Set(["session", "try", "watch", "spot", "main", "door", "score", "close"]);
  const TABS = { welcome: "today", library: "learn", coach: "practice", me: "progress" };
  let prev = null, t0 = 0;
  function observe() {
    const cur = { screen: S.screen, lesson: S.lesson || 1, drill: !!S.drill, tryKey: S.tryRes && !S.tryRes.pending && S.tryRes.hits ? S.tryRes.lesson + ":" + S.tryRes.hits.join("") + ":" + (S.tryRes.at || 0) : "", done: Object.keys(S.doneAt || {}).join(","), briefs: Object.keys(S.briefsDoneIds || {}).join(","), doors: S.doorsN || 0 };
    if (!prev) { prev = cur; if (cur.screen === "video") ev("video_start"); return; }
    const inL = (x) => LESSON.has(x.screen) && !x.drill;
    if (cur.screen !== prev.screen) {
      if (prev.screen === "video") ev("video_leave", { to: cur.screen });
      if (inL(cur) && !inL(prev)) { t0 = now(); ev("lesson_start", { lesson: cur.lesson, retake: !!(S.done5 || {})[cur.lesson] }); }
      else if (inL(cur)) ev("part_view", { lesson: cur.lesson, screen: cur.screen });
      if (cur.screen === "score" && !cur.drill) { const m = (S.last && S.last.moves) || []; ev("attempt", { lesson: cur.lesson, part: "try2", hits: hitsN(m), of: m.length || 4, mode: S.mode || "voice", ai: !!(S.last && S.last.coach) }); ev("feedback_shown", { lesson: cur.lesson, score: hitsN(m) }); }
      if (cur.screen === "locked") ev("locked_view", { lesson: S.lockN || 0 });
      if (TABS[cur.screen]) ev("tab_view", { tab: TABS[cur.screen] });
    }
    if (cur.tryKey && cur.tryKey !== prev.tryKey && !cur.drill) { const h = S.tryRes.hits; ev("attempt", { lesson: cur.lesson, part: "try1", hits: hitsN(h), of: h.length, mode: S.mode || "voice" }); }
    if (cur.done !== prev.done) cur.done.split(",").filter((k) => k && !prev.done.split(",").includes(k)).forEach((k) => ev("lesson_complete", { lesson: Number(k), ms: t0 ? now() - t0 : 0, retake: false }));
    if (cur.briefs !== prev.briefs) cur.briefs.split(",").filter((k) => k && !prev.briefs.split(",").includes(k)).forEach((k) => ev("issue_complete", { issue: k }));
    if (cur.doors > prev.doors) ev("practice_door", {});
    prev = cur;
  }

  /* ---- after every render: save if something real changed, then note what happened ---- */
  function after() {
    if (DEMO || S.screen === "video" && !Object.keys(S.doneAt || {}).length) { observe(); return; }
    const p = fromS(), key = JSON.stringify([p.lessons, p.issues, p.doors, p.practDays]);
    if (key !== lastSaved) { lastSaved = key; const stored = clean(ls.get(KEY, null)); localOk = ls.set(KEY, stored ? merge(stored, p) : p); push(false); } /* another tab's finished lessons are kept */
    observe();
  }

  /* ---- start ---- */
  function boot() {
    if (DEMO) return;
    const p = ls.get(KEY, null), hadAny = hasAny(clean(p));
    const today = SCHED.dayKey(now()), lastSeen = ls.get(SEEN, 0), days = lastSeen ? Math.round((now() - lastSeen) / 86400000) : -1;
    const pc = clean(p);
    if (pc) { into(pc); if (JSON.stringify(pc) !== JSON.stringify(p)) ls.set(KEY, pc); } /* a damaged or crafted record is replaced by its clean copy */
    S.p1Days = [...new Set([...(S.p1Days || []), today])].slice(-400);
    ls.set(SEEN, now());
    ev("app_open", { entry: /^[a-z0-9_-]{1,24}$/i.test(qs.get("src") || "") ? qs.get("src") : "link", returning: hadAny, days });
    if (hadAny && days >= 1) ev("return_visit", { days });
    if (hadAny && !qs.has("video")) { S.track = "gotv"; S.intakeDone = true; S.mode = S.mode || "voice"; S.screen = "welcome"; S.hist = []; const nx = LESSONS5.find((x) => !(S.done5 || {})[x.n]); S.lesson = nx ? nx.n : 5; }
    lastSaved = JSON.stringify([fromS().lessons, fromS().issues, S.doorsN || 0, S.practDays || []]);
    addEventListener("pagehide", () => { if (LESSON.has(S.screen) && !S.drill) ev("interruption", { screen: S.screen, lesson: S.lesson || 1, ms: t0 ? now() - t0 : 0 }); flush(true); });
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") { if (LESSON.has(S.screen) && !S.drill) ev("interruption", { screen: S.screen, lesson: S.lesson || 1, ms: t0 ? now() - t0 : 0 }); flush(true); } else flush(false); });
    addEventListener("online", () => { push(false); flush(false); });
    let errs = 0; addEventListener("error", () => { if (errs++ < 3) ev("error", { code: "js" }); });
    connect();
  }

  /* ---- the rule, read from the state the screens use ---- */
  const prog = () => sched(fromS());
  return {
    now, boot, after, ev, flush, DEV, REMIND, DEMO,
    lessonOpen: (n) => SCHED.lessonOpen(prog(), n, now()),
    usedToday: () => SCHED.usedToday(prog(), now()),
    issuesNext: () => SCHED.next(prog(), now()),
    issueOpen: (id) => SCHED.issueOpen(prog(), id, now()),
    retake: (n) => { S.p1Retakes = S.p1Retakes || {}; S.p1Retakes[n] = (S.p1Retakes[n] || 0) + 1; },
    /* Progress's "Erase my progress": the server copy first (when there is one), then everything on this phone; says which happened */
    erase: async () => {
      let server = "none";
      if (serverOn && token) { try { await api("DELETE", "/v1/progress", null, token); server = "erased"; } catch (e) { server = "failed"; } }
      try { [KEY0, KEY0 + ":sandbox", EVQ0, EVQ0 + ":sandbox", SEEN, TOK].forEach((k) => localStorage.removeItem(k)); } catch (e) { /* ignore */ }
      clearTimeout(putTimer); serverOn = false; token = ""; lastSent = ""; syncFailed = false;
      into(clean({}) || { lessons: {}, issues: {} }); S.p1Days = []; lastSaved = JSON.stringify([{}, {}, 0, []]);
      return server;
    },
    /* where the record is saved, said only as far as it's true: "none" (nothing finished yet), "local" (this phone only),
       "pending" (this phone; the backup hasn't confirmed yet), "backed" (this phone and the server copy match), "nolocal" */
    saved: () => {
      const rec = fromS();
      if (!hasAny(rec)) return "none";
      if (!localOk) return "nolocal";
      if (!serverOn || SANDBOX || DEMO) return "local";
      return JSON.stringify(forServer(rec)) === lastSent ? "backed" : "pending";
    },
    link: () => (serverOn && okTok(token) && !SANDBOX ? location.origin + location.pathname + "#l=" + token : ""),
    status: () => ({ serverOn, hasToken: !!token, queued: ls.get(EVQ, []).length, shiftDays: shift / 86400000, sandbox: SANDBOX, localOk, syncFailed, linkNote }),
  };
})();
window.__p1 = P1;
if (P1.DEV) window.__p1S = () => S; /* dev builds only: lets the tests read the screen state */
