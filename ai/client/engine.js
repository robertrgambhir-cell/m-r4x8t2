/* ---------- Warmup AI (version 156, staging): the voter and the coach come from Warmup's own server (ai/worker.js) ----------
   The page holds no key and no prompts: it sends a scenario id and the transcript, and gets back the voter's next line or the
   coach's checked report. When the server isn't reachable the page says so; it never passes the scripted voter or the word
   check off as AI. Scenario cards (names, rows) come from ai/scenarios.js, copied in at build time as WAI_PUB. */
const WAI_URL_DEFAULT = "__WAI_URL__";
const WAI_PUB = __WAI_PUB__;
const WAI = (() => {
  const qs = new URLSearchParams(location.search);
  const base = String(qs.get("ai") || WAI_URL_DEFAULT || "").replace(/\/+$/, "");
  let state = base && !qs.has("noai") ? "checking" : "off", inflight = null, pendingD = null, pendingScripted = null;
  const sigs = new Map(); /* the server signs each voter line; the page hands the signature back with the transcript */
  const hc = new AbortController(); setTimeout(() => hc.abort(), 4000); /* a check that hangs counts as down after 4 s */
  const ping = state === "checking"
    ? fetch(base + "/health", { cache: "no-store", signal: hc.signal }).then((r) => r.json()).then((j) => { state = j && j.ok ? "on" : "down"; }).catch(() => { state = "down"; }).then(() => { if (S.screen === "door" && !(S.convo && S.convo.knocked)) render(); })
    : Promise.resolve();
  const ready = () => state === "on"; /* only after the server said so: a door never starts as AI on a guess */
  const settle = () => ping;
  /* which scenario this door plays: lesson 1's 2nd try (Kevin) and the issue practice (Bri) */
  const scenFor = () => {
    if (S.drill) return S.drill.kind === "aiissue" ? (DOORS[S.drill.door] || {}).ai || null : null;
    return S.track === "gotv" && (S.lesson || 1) === 1 && doorKey() === "kevin" ? "kevin_intro" : null;
  };
  /* a door decides at the knock and keeps that mode for the whole conversation (S.convo.wai), so a failure shows as a failure */
  const full = (d) => { if (d && d !== DOORS[doorKey()]) return false; if (!scenFor()) return false; if (S.convo && S.convo.wai !== undefined) return !!S.convo.wai; return ready(); };
  async function post(path, body, ms) {
    if (!base) throw { wai: true, code: "off" };
    await ping;
    const ac = new AbortController(), t = setTimeout(() => ac.abort(), ms);
    try {
      const r = await fetch(base + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal: ac.signal });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw { wai: true, code: j.error || "http_" + r.status };
      return j;
    } catch (e) {
      if (e && e.wai) throw e;
      throw { wai: true, code: e && e.name === "AbortError" ? "timeout" : "network" };
    } finally { clearTimeout(t); }
  }
  const turnsOf = (turns) => turns.map((x, i) => (x.who === "you" ? { who: "you", text: String(x.text || "") } : { who: "them", text: String(x.text || ""), sig: sigs.get(i + "|" + String(x.text || "")) || "" }));
  async function voter(d, turns) {
    if (inflight) throw { wai: true, code: "busy" }; /* one voter answer at a time, so a double tap can't make two */
    const at = turns.length;
    inflight = post("/voter", { scenario: scenFor(), turns: turnsOf(turns) }, 15000);
    try { const j = await inflight; if (j.sig) sigs.set(at + "|" + j.say, j.sig); if (j.care) showCare(); prefetch(at, j.say); return { say: j.say, expr: j.mood || "neutral", end: !!j.end }; } finally { inflight = null; }
  }
  /* the voice: the server reads the voter's own line in a natural voice (Deepgram Aura-2 on Cloudflare); fetched while the line is
     drawn, decoded into the app's audio, played through the voter's analyser so the mouth follows it. Any failure falls back to
     the phone's voice, and a daily limit stops asking for the rest of the session. */
  let voiceDown = false;
  const clips = new Map();
  function fetchVoice(at, text) {
    if (!base || voiceDown) return Promise.resolve(null);
    const sig = at === 0 ? "" : sigs.get(at + "|" + text) || "";
    const ac = new AbortController(), t = setTimeout(() => ac.abort(), 9000);
    return fetch(base + "/speak", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ scenario: scenFor(), text, at, sig, voice: qs.get("voice") || "" }), signal: ac.signal })
      .then(async (r) => { if (!r.ok) { const j = await r.json().catch(() => ({})); if (j.error === "voice_limit" || j.error === "no_voice") voiceDown = true; return null; } return r.arrayBuffer(); })
      .catch(() => null).finally(() => clearTimeout(t));
  }
  /* outside the role-play: when the learner's words sound like they might hurt themselves, the server says care and the page
     shows the 988 Suicide and Crisis Lifeline once per conversation, above the voter's next line (version 159, the red-team fix) */
  function showCare() {
    const t = $("#thread");
    if (!t || t.querySelector(".wai-care")) return;
    const el = document.createElement("div");
    el.className = "wai-care";
    el.setAttribute("role", "note");
    el.innerHTML = `<b>Stepping out of practice for a second.</b> If you're going through something hard, you don't have to handle it alone. Call or text <a href="tel:988">988</a>, the Suicide and Crisis Lifeline, any time. <a href="sms:988">Text 988</a>`;
    t.appendChild(el);
    scrollDown();
  }
  /* the opening line is the same every time: fetch its voice when the door is drawn, so the knock answers at once */
  async function warmOpening() { await ping; const sc = scenFor(), pub = sc && WAI_PUB[sc]; if (ready() && pub && pub.voter && pub.voter.opening) prefetch(0, pub.voter.opening.say); }
  /* the typing dots while the voice is fetched */
  function dots() { const t = $("#thread"); if (!t) return null; const el = document.createElement("div"); el.className = "typing"; el.innerHTML = "<i></i><i></i><i></i>"; t.appendChild(el); scrollDown(); return el; }
  function prefetch(at, text) { if (!clips.has(at + "|" + text)) clips.set(at + "|" + text, fetchVoice(at, text)); }
  async function voiceClip(d, text) {
    if (!full(d) || voiceDown) return null;
    const at = S.convo ? Math.max(0, S.convo.turns.length - 1) : 0;
    try {
      await videoAudio();
      if (!vidCtx) return null;
      const key = at + "|" + text;
      if (!clips.has(key)) prefetch(at, text);
      const buf = await clips.get(key);
      clips.delete(key);
      return buf ? await vidCtx.decodeAudioData(buf) : null;
    } catch (e) { return null; }
  }
  const phrOf = (rep) => { const pub = WAI_PUB[rep.scen] || { rubric: [] }, card = pub.rubric.filter((r) => r.card); return card.map((r, i) => { const it = rep.items.find((x) => x.id === r.id); return i < 3 && it && it.status === "met" ? it.evidence || "" : ""; }); };
  async function coachConvo(d, turns) {
    const sc = scenFor(), rep = await post("/coach", { scenario: sc, turns: turnsOf(turns) }, 40000);
    rep.scen = sc;
    return { hits: rep.hits.slice(), praise: "", tip: rep.improvement ? rep.improvement.text : "", phr: phrOf(rep), coach: rep };
  }
  async function firstTry(text) {
    const rep = await post("/coach", { scenario: "opener_first_try", turns: [{ who: "you", text }] }, 25000);
    rep.scen = "opener_first_try";
    const h = rep.hits.slice(), n = h.filter(Boolean).length, note = openerNote(h);
    note.phr = phrOf(rep); note.coach = rep;
    return [!h[3] ? "weak" : n === 4 ? "strong" : n === 3 ? "ok" : "weak", note];
  }
  const FAIL = {
    budget: "The practice AI hit today’s spending limit.",
    rate_limited: "The practice AI is busy for this connection. Try again in a few minutes.",
    timeout: "The practice AI took too long to answer.",
    network: "The practice AI couldn’t be reached.",
    not_configured: "The practice AI isn’t switched on yet.",
    off: "The practice AI isn’t connected on this page.",
  };
  const failText = (e) => (FAIL[e && e.code] || "The practice AI didn’t answer.") + (S.screen === "try" ? " This 1st try used a quick word check instead." : "");
  /* the voter didn't answer: say so, keep the conversation, offer the same turn again */
  function voterFailed(d, e, scripted) {
    pendingD = d; pendingScripted = scripted;
    const t = $("#thread");
    if (t) {
      const p = document.createElement("p");
      p.className = "note wai-err";
      p.innerHTML = `${esc((FAIL[e && e.code] || "The practice AI didn’t answer."))} <button class="link" data-act="wai-retry">Try again</button>`;
      t.appendChild(p);
      scrollDown();
    }
  }
  async function retry() {
    const d = pendingD;
    if (!d || !S.convo || S.convo.ended) return;
    document.querySelectorAll("#thread .wai-err").forEach((x) => x.remove());
    const typing = document.createElement("div");
    typing.className = "typing";
    typing.innerHTML = "<i></i><i></i><i></i>";
    $("#thread").appendChild(typing);
    scrollDown();
    await voterReply(d, pendingScripted, typing);
  }
  async function recoach() {
    const L = S.last;
    if (!L || !L.turns) return;
    L.coachErr = false; L.coachBusy = true; render();
    try {
      const sc = L.scen, rep = await post("/coach", { scenario: sc, turns: L.turns }, 40000);
      rep.scen = sc;
      L.coach = rep; L.moves = rep.hits.slice(); L.tip = rep.improvement ? rep.improvement.text : "";
      L.noScore = false;
    } catch (e) { L.coachErr = true; }
    L.coachBusy = false;
    if (S.screen === "score") render();
  }
  /* the score card's rows: the scenario's own card items, as the coach judged them */
  function rows(L) {
    const pub = L && L.coach && WAI_PUB[L.coach.scen];
    if (!pub) return "";
    return pub.rubric.filter((r) => r.card).map((r) => { const it = L.coach.items.find((x) => x.id === r.id) || {}; const y = it.status === "met"; return `<li class="${y ? "y" : "n"}">${esc(y ? r.hit : it.status === "not_judged" ? r.label + ": not judged" : r.miss)}</li>`; }).join("");
  }
  /* under the card: one thing that worked, one thing to try, and the way into the full coaching */
  function block(L) {
    if (!L) return "";
    if (L.coachBusy) return `<p class="sc-coach">Your coach is reading the conversation…</p>`;
    if (L.coachErr) return `<div class="sc-coach warn"><p>${L.noScore ? "The AI coach didn\u2019t answer, so there\u2019s no score for this one yet." : "The AI coach didn\u2019t answer, so these rows come from a quick word check, not the coach."}</p><button class="link" data-act="coach-retry">Get the coaching</button></div>`;
    if (L.noScore && !L.coach) return `<div class="sc-coach warn"><p>The practice AI wasn\u2019t connected, so this conversation has no score.</p></div>`;
    const c = L.coach;
    if (!c) return "";
    const chk = c.invented && c.invented.length ? `<p class="cc-chk"><b>Check this:</b> ${c.invented[0].quote ? `\u201c${esc(c.invented[0].quote)}\u201d ` : ""}${esc(c.invented[0].issue)}</p>` : "";
    const st = !chk && c.strength && c.strength.text ? `<p><b>What worked:</b> ${esc(c.strength.text)}</p>` : "";
    const im = c.improvement && c.improvement.text ? `<p><b>Try next:</b> ${esc(c.improvement.text)}</p>` : "";
    return `<div class="sc-coach">${chk}${st}${im}<button class="link" data-act="coach-full">See your full coaching</button></div>`;
  }
  /* the honest label on the door: whether this voter is the AI or the scripted one */
  function pill() {
    if (!scenFor()) return "";
    if (full()) return `<p class="note wai-pill">Live AI voter · talk the way you would at a real door</p>`;
    return `<p class="note wai-pill off">Scripted voter · the practice AI isn’t connected</p>`;
  }
  /* a stated fact that isn't in the materials keeps a perfect card from reading Excellent */
  const flagged = (L) => !!(L && L.coach && L.coach.items.some((x) => x.id === "accurate" && x.status === "missed"));
  function issueLink() {
    if (!ready() || !(S.briefsDoneIds || {}).ga) return ""; /* after lesson 6 (health insurance); ?convo=bri opens it directly for review */
    return `<button class="link center" data-act="wai-issue">Practice a health insurance question</button>`;
  }
  function autoKnock() { setTimeout(() => { if (S.screen === "door" && S.convo && !S.convo.knocked) knock(); }, 380); }
  async function startIssue() {
    await ping;
    if (!ready()) { toast(state === "down" ? FAIL.network : FAIL.off); return; }
    if (!S.drill) S.drillBack = { lesson: lessonNo(), skipWatch: S.skipWatch };
    S.round = null;
    S.drill = { kind: "aiissue", door: "bri", step: 1 };
    S.lesson = 1; S.skipWatch = false; S.sayNow = null;
    go("door");
    autoKnock();
  }
  return { ready, settle, flagged, full, scenFor, voiceClip, warmOpening, dots, voter, coachConvo, firstTry, failText, voterFailed, retry, recoach, rows, block, pill, issueLink, startIssue, autoKnock, state: () => state };
})();
/* the full coaching: every rubric row with the volunteer's own words, anything to check, and the transcript */
function vCoachFull() {
  const L = S.last, c = L && L.coach, pub = c && WAI_PUB[c.scen];
  if (!c || !pub) return app(`<p class="lede">No coaching yet.</p>`, { back: "score" });
  const ICON = { met: "y", partial: "p", missed: "n", not_applicable: "na" };
  const row = (r) => {
    const it = c.items.find((x) => x.id === r.id) || { status: "missed" };
    if (it.status === "not_applicable") return "";
    const head = it.status === "not_judged" ? r.label + ": not judged" : it.status === "met" ? r.hit : it.status === "partial" ? "Partly: " + r.hit.charAt(0).toLowerCase() + r.hit.slice(1) : r.miss;
    return `<li class="${ICON[it.status]}"><b>${esc(head)}</b>${it.note && it.status !== "met" ? `<span>${esc(it.note)}</span>` : ""}${it.evidence ? `<q>${esc(it.evidence)}</q>` : ""}</li>`;
  };
  const inv = c.invented && c.invented.length ? `<div class="cf-flag"><b>Check this</b>${c.invented.map((x) => `<p>${x.quote ? `<q>${esc(x.quote)}</q> ` : ""}${esc(x.issue)}</p>`).join("")}</div>` : "";
  const uns = c.unsure && c.unsure.length ? `<div class="cf-flag soft"><b>The coach wasn\u2019t sure about</b>${c.unsure.map((x) => `<p>${esc(x)}</p>`).join("")}<p>It couldn\u2019t find this in your words, so it doesn\u2019t count against you.</p></div>` : "";
  const heard = c.transcription && c.transcription.length ? `<div class="cf-flag soft"><b>We may have misheard you</b>${c.transcription.map((x) => `<p>We heard <q>${esc(x.heard)}</q>${x.likely ? `, probably “${esc(x.likely)}”` : ""}. Not counted against you.</p>`).join("")}</div>` : "";
  const tr = (L.turns || []).map((x) => `<p class="cf-t ${x.who === "you" ? "you" : "them"}"><b>${x.who === "you" ? "You" : esc(pub.voter.name)}</b> ${esc(x.text)}</p>`).join("");
  return app(`
    <p class="kicker">Your coaching</p>
    <h1 class="h1">${esc(c.summary || "How it went")}</h1>
    ${c.strength && c.strength.text ? `<div class="cf-try good"><b>What worked</b><p>${esc(c.strength.text)}</p>${c.strength.quote ? `<p class="cc-line">\u201c${esc(c.strength.quote)}\u201d</p>` : ""}</div>` : ""}
    <ul class="cf-list">${pub.rubric.map(row).join("")}</ul>
    ${inv}${uns}${heard}
    ${c.improvement && c.improvement.text ? `<div class="cf-try"><b>Try next</b><p>${esc(c.improvement.text)}</p>${c.improvement.try_saying ? `<p class="cc-line">“${esc(c.improvement.try_saying)}”</p>` : ""}</div>` : ""}
    <details class="cf-tr"><summary>Your conversation</summary>${tr}</details>
    <p class="cf-src">Coached by AI from what you said. It can make mistakes.</p>
  `, { back: "score", footer: `<button class="btn" data-act="back" data-arg="score">Back to your feedback</button>` });
}
