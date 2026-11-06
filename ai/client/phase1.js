/* Phase 1 (Nov 6, 2026), inlined into the page by ai/build-phase1.py: the learner's progress survives a reload, the daily
   lesson rule is real (ai/schedule.js), the page keeps a small event log, and nothing promises a text that isn't sent.
   The phone is the source of truth (localStorage); when Warmup's server says progress saving is on, the page also keeps a copy
   there under an anonymous learner id, so a personal link (?l=token) can carry progress to another phone.
   Stored on the phone: which parts each lesson's first and best tries hit, the best try's own words (for the record sheet),
   finish times, issue lessons finished, practice doors, active days. Sent to the server: the same minus the words. */
const P1 = (() => {
  const KEY = "recognize-demo:p1", TOK = "recognize-demo:learner", EVQ = "recognize-demo:events", SEEN = "recognize-demo:lastSeen";
  const qs = new URLSearchParams(location.search);
  const DEV = __P1_DEV__, REMIND = __P1_REMIND__;
  const base = String(qs.get("ai") || (typeof WAI_URL_DEFAULT === "string" ? WAI_URL_DEFAULT : "") || "").replace(/\/+$/, "");
  const DEMO = ["home", "learn", "ready", "issues", "convo"].some((k) => qs.has(k)); /* presenter shortcuts never read or write a learner's record */
  let shift = 0;
  if (DEV && /^[+-]?\d{1,3}$/.test(qs.get("day") || "")) shift = Number(qs.get("day")) * 86400000; /* test clock, dev builds only: ?day=+1 is tomorrow */
  const now = () => Date.now() + shift;
  const ls = { get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } } };
  let serverOn = false, token = "", putTimer = 0, lastSaved = "", lastSent = "";
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
      if (!h || !h.progress) return;
      const fromLink = qs.get("l");
      if (fromLink && /^[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{32}$/.test(fromLink)) { ls.set(TOK, fromLink); try { const u = new URL(location.href); u.searchParams.delete("l"); history.replaceState(null, "", u); } catch (e) { /* ignore */ } }
      token = ls.get(TOK, "");
      if (!token) { token = (await api("POST", "/v1/learner")).token; ls.set(TOK, token); }
      serverOn = true;
      const there = (await api("GET", "/v1/progress", null, token)).progress;
      if (there) {
        const mine = fromS(), m = merge(mine, Object.assign({ practDays: [] }, there));
        if (JSON.stringify(m.lessons) !== JSON.stringify(mine.lessons) || JSON.stringify(m.issues) !== JSON.stringify(mine.issues)) {
          into(m); if (S.screen === "video" && Object.keys(m.lessons).length) { try { pauseVideo(); } catch (e) { /* ignore */ } S.screen = "welcome"; S.hist = []; }
          render();
        }
      }
      push(true); flush();
    } catch (e) { serverOn = false; ev("error", { code: "sync_" + String((e && e.message) || "x").slice(0, 16).replace(/[^a-z0-9_]/gi, "") }); }
  }
  function push(force) {
    if (!serverOn || DEMO) return;
    const body = JSON.stringify(forServer(fromS()));
    if (!force && body === lastSent) return;
    clearTimeout(putTimer);
    putTimer = setTimeout(() => { api("PUT", "/v1/progress", { progress: JSON.parse(body) }, token).then(() => { lastSent = body; }).catch(() => { /* the phone keeps it; the next change tries again */ }); }, force ? 0 : 1500);
  }

  /* ---- events ---- */
  function ev(name, props) {
    if (DEMO) return;
    const q = ls.get(EVQ, []);
    q.push({ name, t: now(), sid, props: props || {} });
    ls.set(EVQ, q.slice(-300));
    if (q.length >= 20 || name === "lesson_complete" || name === "issue_complete") flush();
  }
  function flush() {
    if (!serverOn || !token) return;
    const q = ls.get(EVQ, []);
    if (!q.length) return;
    const batch = q.slice(0, 60), body = JSON.stringify({ token, events: batch });
    let sent = false;
    try { sent = navigator.sendBeacon && navigator.sendBeacon(base + "/v1/events", new Blob([body], { type: "text/plain" })); } catch (e) { sent = false; }
    if (!sent) { try { fetch(base + "/v1/events", { method: "POST", body, headers: { "content-type": "text/plain" }, keepalive: true }); sent = true; } catch (e) { sent = false; } }
    if (sent) ls.set(EVQ, q.slice(batch.length));
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
    if (key !== lastSaved) { lastSaved = key; ls.set(KEY, p); push(false); }
    observe();
  }

  /* ---- start ---- */
  function boot() {
    if (DEMO) return;
    const p = ls.get(KEY, null), hadAny = !!(p && (Object.keys(p.lessons || {}).length || Object.keys(p.issues || {}).length));
    const today = SCHED.dayKey(now()), lastSeen = ls.get(SEEN, 0), days = lastSeen ? Math.round((now() - lastSeen) / 86400000) : -1;
    if (p) into(p);
    S.p1Days = [...new Set([...(S.p1Days || []), today])].slice(-400);
    ls.set(SEEN, now());
    ev("app_open", { entry: /^[a-z0-9_-]{1,24}$/i.test(qs.get("src") || "") ? qs.get("src") : "link", returning: hadAny, days });
    if (hadAny && days >= 1) ev("return_visit", { days });
    if (hadAny && !qs.has("video")) { S.track = "gotv"; S.intakeDone = true; S.mode = S.mode || "voice"; S.screen = "welcome"; S.hist = []; const nx = LESSONS5.find((x) => !(S.done5 || {})[x.n]); S.lesson = nx ? nx.n : 5; }
    lastSaved = JSON.stringify([fromS().lessons, fromS().issues, S.doorsN || 0, S.practDays || []]);
    addEventListener("pagehide", () => { if (LESSON.has(S.screen) && !S.drill) ev("interruption", { screen: S.screen, lesson: S.lesson || 1, ms: t0 ? now() - t0 : 0 }); flush(); });
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") { if (LESSON.has(S.screen) && !S.drill) ev("interruption", { screen: S.screen, lesson: S.lesson || 1, ms: t0 ? now() - t0 : 0 }); flush(); } });
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
    erase: () => { try { [KEY, EVQ, SEEN].forEach((k) => localStorage.removeItem(k)); } catch (e) { /* ignore */ } if (serverOn) api("DELETE", "/v1/progress", null, token).catch(() => {}); },
    status: () => ({ serverOn, hasToken: !!token, queued: ls.get(EVQ, []).length, shiftDays: shift / 86400000 }),
  };
})();
window.__p1 = P1;
if (P1.DEV) window.__p1S = () => S; /* dev builds only: lets the tests read the screen state */
