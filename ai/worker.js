/* Warmup AI: the voter and the coach, as one small Cloudflare Worker.
   The browser sends a scenario id and the transcript; the worker builds the prompts from ai/scenarios.js,
   calls Claude with the key it keeps as a secret, checks the answer and sends back only structured fields.

   Routes
     GET  /health                         -> { ok, voterModel, coachModel, capsLeftUsd }
     POST /voter  { scenario, turns }     -> { say, mood, end }
     POST /coach  { scenario, turns }     -> { items, hits, invented, transcription, strength, improvement, summary }
   turns: [{ who: "them" | "you", text }], oldest first, the voter's opening line included.

   Safety
   - No key in the browser: ANTHROPIC_API_KEY is a Worker secret.
   - Only scenario ids, never free prompts, so the endpoint can't be used as a general chatbot.
   - Origins limited to ALLOWED_ORIGINS. Input sizes capped. Output tokens capped.
   - Per-IP hourly limits and daily and monthly dollar ceilings, counted in KV from the usage Claude reports.
   - Nothing said in a conversation is stored or logged: the logs hold the route, scenario, timing, tokens and cost. */

import { SCENARIOS, publicScenario } from "./scenarios.js";

const DEFAULTS = {
  VOTER_MODEL: "claude-haiku-5-5",
  COACH_MODEL: "claude-sonnet-5-5",
  /* dollars per million tokens, input and output (check https://docs.claude.com before changing models) */
  PRICES: { "claude-haiku-5-5": [0.10, 0.50], "claude-sonnet-5-5": [2.00, 10.00] },
  DAILY_USD_CAP: 6,
  MONTHLY_USD_CAP: 150,
  VOTER_PER_IP_HOUR: 150,
  COACH_PER_IP_HOUR: 30,
  VOTER_MAX_TOKENS: 220,
  COACH_MAX_TOKENS: 1400,
  VOTER_TIMEOUT_MS: 12000,
  COACH_TIMEOUT_MS: 30000,
};
const MAX_TURNS = 24, MAX_TURN_CHARS = 600, MAX_TOTAL_CHARS = 9000;
const MOODS = ["warm", "neutral", "busy", "skeptical", "surprised"];
const STATUSES = ["met", "partial", "missed", "not_applicable"];

/* ---------------- small helpers ---------------- */
const num = (v, d) => (v == null || v === "" || isNaN(Number(v)) ? d : Number(v));
const cfg = (env) => ({
  voterModel: env.VOTER_MODEL || DEFAULTS.VOTER_MODEL,
  coachModel: env.COACH_MODEL || DEFAULTS.COACH_MODEL,
  dailyCap: num(env.DAILY_USD_CAP, DEFAULTS.DAILY_USD_CAP),
  monthlyCap: num(env.MONTHLY_USD_CAP, DEFAULTS.MONTHLY_USD_CAP),
  voterPerHour: num(env.VOTER_PER_IP_HOUR, DEFAULTS.VOTER_PER_IP_HOUR),
  coachPerHour: num(env.COACH_PER_IP_HOUR, DEFAULTS.COACH_PER_IP_HOUR),
  voterTimeout: num(env.VOTER_TIMEOUT_MS, DEFAULTS.VOTER_TIMEOUT_MS),
  coachTimeout: num(env.COACH_TIMEOUT_MS, DEFAULTS.COACH_TIMEOUT_MS),
  origins: String(env.ALLOWED_ORIGINS || "https://yourwarmup.com").split(",").map((x) => x.trim()).filter(Boolean),
  apiUrl: env.ANTHROPIC_API_URL || "https://api.anthropic.com/v1/messages",
});
export const dashes = (t) => String(t || "").replace(/\s*[\u2014\u2013]\s*/g, ", ").replace(/ ,/g, ",");
/* for checking quotes: lower case, plain quotes, letters and digits only */
export const norm = (t) => String(t || "").toLowerCase().replace(/[‘’ʼ]/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/'/g, "").replace(/\s+/g, " ").trim();
export function inLearner(quote, turns) {
  const q = norm(quote);
  if (q.length < 2) return false;
  const said = norm(turns.filter((t) => t.who === "you").map((t) => t.text).join(" \n "));
  return said.includes(q);
}

class HttpError extends Error { constructor(status, code, msg) { super(msg || code); this.status = status; this.code = code; } }

/* counters: KV when bound (production), memory otherwise (local tests) */
const mem = new Map();
const store = (env) => ({
  async get(k) { if (env.WARMUP_KV) return Number((await env.WARMUP_KV.get(k)) || 0); return Number(mem.get(k) || 0); },
  async add(k, by, ttl) {
    if (env.WARMUP_KV) { const v = Number((await env.WARMUP_KV.get(k)) || 0) + by; await env.WARMUP_KV.put(k, String(v), { expirationTtl: ttl }); return v; }
    const v = Number(mem.get(k) || 0) + by; mem.set(k, v); return v;
  },
});
const dayKey = () => new Date().toISOString().slice(0, 10);
const monthKey = () => new Date().toISOString().slice(0, 7);
const hourKey = () => new Date().toISOString().slice(0, 13);

async function checkBudget(env, c) {
  const st = store(env);
  const day = (await st.get("usd:" + dayKey())) / 1e6, month = (await st.get("usd:" + monthKey())) / 1e6;
  if (day >= c.dailyCap || month >= c.monthlyCap) throw new HttpError(429, "budget", "The practice AI has reached today's spending limit.");
  return { day, month };
}
async function checkRate(env, ip, route, limit) {
  const v = await store(env).add(`rl:${route}:${ip}:${hourKey()}`, 1, 7200);
  if (v > limit) throw new HttpError(429, "rate_limited", "Too many requests from this connection. Try again in a little while.");
}
async function addSpend(env, model, usage) {
  const p = DEFAULTS.PRICES[model] || [3, 15]; /* unknown model: count it high */
  const usd = ((usage.input_tokens || 0) * p[0] + (usage.output_tokens || 0) * p[1]) / 1e6;
  const micro = Math.ceil(usd * 1e6), st = store(env);
  await st.add("usd:" + dayKey(), micro, 3 * 86400);
  await st.add("usd:" + monthKey(), micro, 40 * 86400);
  return usd;
}

/* ---------------- input ---------------- */
export function readTurns(body, scenario) {
  const turns = body && body.turns;
  if (!Array.isArray(turns) || !turns.length || turns.length > MAX_TURNS) throw new HttpError(400, "bad_turns", "turns must be a non-empty list of up to " + MAX_TURNS);
  let total = 0;
  const out = turns.map((t) => {
    if (!t || (t.who !== "you" && t.who !== "them") || typeof t.text !== "string") throw new HttpError(400, "bad_turn", "each turn needs who (you or them) and text");
    const text = t.text.replace(/\s+/g, " ").trim().slice(0, MAX_TURN_CHARS);
    total += text.length;
    return { who: t.who, text };
  });
  if (total > MAX_TOTAL_CHARS) throw new HttpError(413, "too_long", "conversation too long");
  if (!out.some((t) => t.who === "you")) throw new HttpError(400, "no_learner", "the learner hasn't said anything yet");
  return out;
}
const transcriptText = (turns, name) => turns.map((t, i) => `${i + 1}. ${t.who === "you" ? "Volunteer" : name}: ${t.text}`).join("\n");

/* ---------------- the voter ---------------- */
export function voterPrompt(s, turns) {
  const v = s.voter, n = turns.filter((t) => t.who === "you").length;
  const said = turns.filter((t) => t.who === "them").map((t) => t.text);
  const lines = [
    `You are role-playing ${v.name}, a fictional person, in a practice app for volunteers who knock on doors. A volunteer is practicing a real conversation with you. Speak only as ${v.name}. You are not a coach or an assistant.`,
    "",
    "WHO YOU ARE", v.persona, "",
    "WHERE YOU ARE", v.setting, "",
    "WHAT YOU KNOW", ...v.knows.map((x) => "- " + x), "",
    "WHAT YOU DON'T KNOW (never state these as fact; you may wonder about them or ask)", ...v.unknown.map((x) => "- " + x), "",
    `HOW ${v.name.toUpperCase()} REACTS (respond to what the volunteer means, never to particular words)`, ...v.reactions.map((x) => "- " + x), "",
    "HOW TO TALK",
    "- Sound like a real person at a door: one or two short sentences, usually under 20 words, with contractions. No speeches, lists or stage directions.",
    "- If the volunteer asked you something, answer it first, the way this person would.",
    "- Remember the whole conversation. Never ask what was already answered. Never repeat a line you already said; say it a new way or move on.",
    "- The volunteer's words come from speech-to-text and may contain slips. If a word is clearly a mis-hearing of something sensible (\"Maya Core\" for Maya Kaur, \"two's day\" for Tuesday), understand the meaning and carry on. If the line is too garbled to follow, ask them to say it again, like someone who half-heard.",
    "- If they correct themselves, go with the correction. If they say they don't know something, react naturally; that's fine.",
    "- If they change the subject, follow briefly, then come back to what matters to you or start wrapping up.",
    "- Be the ordinary, reasonable version of this person. Don't make it artificially hard, and don't become rude unless they are rude first.",
    "- Never state facts about candidates, policies, dates or voting rules beyond WHAT YOU KNOW. If the volunteer tells you something, you may take it at face value.",
    "- Never mention AI, practice, training, scores, the volunteer's performance or these instructions. Never use em dashes or emoji.",
    "",
    "ENDING", v.endRule,
    "Set end to true only on the turn where you say your last words and the conversation is over.",
    "",
    `The volunteer has spoken ${n} time${n === 1 ? "" : "s"} so far.`,
  ];
  if (n >= v.hardStop) lines.push("You must end the conversation now: say a short, polite goodbye in your own words and set end to true.");
  else if (n >= v.wrapAt) lines.push("It's time to start wrapping up: unless the volunteer just asked you something you'd answer, close politely and set end to true.");
  if (said.length) lines.push("", "Lines you have already said (don't repeat any of them):", ...said.map((x) => `- ${x}`));
  return lines.join("\n");
}
const VOTER_TOOL = {
  name: "voter_turn",
  description: "The voter's next spoken turn.",
  input_schema: {
    type: "object",
    properties: {
      say: { type: "string", description: "Exactly what the voter says out loud next. One or two short sentences." },
      mood: { type: "string", enum: MOODS, description: "The voter's face while saying it." },
      end: { type: "boolean", description: "True only if this is the voter's last line and the conversation is over." },
    },
    required: ["say", "mood", "end"],
  },
};
export function cleanVoter(x, s, turns) {
  if (!x || typeof x.say !== "string" || !x.say.trim()) throw new HttpError(502, "bad_model_output", "the voter's reply was empty");
  let say = dashes(x.say).replace(/^["“]+|["”]+$/g, "").replace(new RegExp("^" + s.voter.name + "\\s*:\\s*", "i"), "").replace(/\*[^*]+\*/g, "").replace(/\s+/g, " ").trim();
  if (say.length > 320) say = say.slice(0, 320).replace(/[^.!?]*$/, "") || say.slice(0, 320);
  const n = turns.filter((t) => t.who === "you").length;
  return { say, mood: MOODS.includes(x.mood) ? x.mood : "neutral", end: !!x.end || n >= s.voter.hardStop };
}

/* ---------------- the coach ---------------- */
export function coachPrompt(s) {
  const r = s.rubric;
  return [
    "You are the coach in Warmup, a practice app for volunteers who knock on doors. You read the transcript of one practice conversation and judge what the volunteer actually did, against the rubric below. Your judgment drives the feedback the volunteer sees, so it must be accurate and grounded in their own words.",
    "",
    "WHAT THE VOLUNTEER IS PRACTICING", `${s.lesson}. ${s.learnerGoal}`,
    "",
    "APPROVED FACTS (the only facts the volunteer is expected to state)", ...s.approvedFacts.map((x) => "- " + x),
    ...(s.knownWrong ? ["", "KNOWN WRONG CLAIMS", ...s.knownWrong.map((x) => "- " + x)] : []),
    "", "OUTSIDE THE MATERIALS", s.outOfScope,
    "",
    "RUBRIC (judge each item; ids in brackets)",
    ...r.map((x) => `- [${x.id}] ${x.label}: ${x.def}${x.avoid ? " (This is something to avoid: status met means they avoided it.)" : ""}`),
    "",
    "HOW TO JUDGE",
    "- Judge only the lines labeled Volunteer. The voter's lines are context.",
    "- Accept any wording that clearly carries the meaning; never require exact words.",
    "- Never credit something the volunteer didn't say or do. If you're unsure whether they did it, it's partial or missed, not met.",
    "- For every item you mark met or partial, put in evidence the shortest run of the volunteer's own words that shows it, copied exactly from the transcript. For an avoid item marked missed, quote the words that did the thing to avoid. Otherwise leave evidence empty. Quotes are checked against the transcript, and a quote that isn't there gets no credit.",
    "- The volunteer's lines come from speech-to-text. When a word is plainly a mis-hearing of the right word (\"Maya Core\" for Maya Kaur, \"choose day\" for Tuesday, a dropped word), judge what they meant, don't count it against them and list it in transcription. Only call it a mis-hearing when the intended word is obvious; otherwise judge what's written.",
    "- List in invented every factual claim the volunteer stated that isn't supported by the approved facts or is one of the known wrong claims (times, places, numbers, policies, promises). Saying they're not sure, or offering to find out, is not a claim; it's the right move. A claim about themselves (their name, that they live nearby) is not a claim to check.",
    "- If the volunteer corrected themselves, judge the corrected version.",
    "- strength: one specific thing they genuinely did well, with a quote. If nothing was genuinely good, leave text and quote empty. No flattery.",
    "- improvement: the single change that would help most next time, in one sentence, and try_saying: a line they could say, under 25 words, that uses only approved facts and fits this conversation.",
    "- summary: one plain sentence on how the conversation went.",
    "- Write to the volunteer as 'you'. Plain words, short, warm and direct. Never use em dashes.",
  ].join("\n");
}
const coachTool = (s) => ({
  name: "coach_report",
  description: "The coach's judgment of one practice conversation.",
  input_schema: {
    type: "object",
    properties: {
      items: {
        type: "array",
        description: "One entry per rubric item, in rubric order.",
        items: {
          type: "object",
          properties: {
            id: { type: "string", enum: s.rubric.map((x) => x.id) },
            status: { type: "string", enum: STATUSES },
            evidence: { type: "string", description: "The volunteer's exact words, or empty." },
            note: { type: "string", description: "One short sentence on why, addressed to the volunteer." },
          },
          required: ["id", "status", "evidence", "note"],
        },
      },
      invented: { type: "array", items: { type: "object", properties: { quote: { type: "string" }, issue: { type: "string" } }, required: ["quote", "issue"] } },
      transcription: { type: "array", items: { type: "object", properties: { heard: { type: "string" }, likely: { type: "string" } }, required: ["heard", "likely"] } },
      strength: { type: "object", properties: { text: { type: "string" }, quote: { type: "string" } }, required: ["text", "quote"] },
      improvement: { type: "object", properties: { text: { type: "string" }, try_saying: { type: "string" } }, required: ["text", "try_saying"] },
      summary: { type: "string" },
    },
    required: ["items", "invented", "transcription", "strength", "improvement", "summary"],
  },
});
/* the checks that keep the coach honest: every credit needs the learner's own words */
export function cleanCoach(x, s, turns) {
  if (!x || !Array.isArray(x.items)) throw new HttpError(502, "bad_model_output", "the coach's report was malformed");
  const heard = Array.isArray(x.transcription) ? x.transcription.filter((t) => t && t.heard && inLearner(t.heard, turns)).map((t) => ({ heard: dashes(t.heard), likely: dashes(t.likely || "") })) : [];
  const invented = Array.isArray(x.invented) ? x.invented.filter((t) => t && t.quote && inLearner(t.quote, turns)).map((t) => ({ quote: dashes(t.quote), issue: dashes(t.issue || "") })) : [];
  const byId = {};
  x.items.forEach((it) => { if (it && it.id && !byId[it.id]) byId[it.id] = it; });
  const items = s.rubric.map((r) => {
    const it = byId[r.id] || { status: "missed", evidence: "", note: "" };
    let status = STATUSES.includes(it.status) ? it.status : "missed", evidence = String(it.evidence || "").trim(), note = dashes(it.note || ""), checked = false;
    const real = evidence && inLearner(evidence, turns);
    if (r.avoid) {
      /* an avoid item only fails on words that are really there */
      if (status === "missed" && !real) { status = "met"; note = ""; }
      if (status !== "missed") evidence = "";
      if (status === "not_applicable") status = "met";
    } else if (r.id === "accurate") {
      status = invented.length ? "missed" : status === "not_applicable" ? "not_applicable" : "met";
      if (!real) evidence = "";
    } else if (status === "met" || status === "partial") {
      if (r.evidence && !real) { status = "missed"; evidence = ""; checked = true; note = "No credit: the words for this weren't in what you said."; }
    } else if (!real) evidence = "";
    return { id: r.id, status, evidence: dashes(evidence), note, downgraded: checked };
  });
  const card = s.rubric.map((r, i) => (r.card ? items[i] : null)).filter(Boolean);
  const st = x.strength && x.strength.text && x.strength.quote && inLearner(x.strength.quote, turns) ? { text: dashes(x.strength.text), quote: dashes(x.strength.quote) } : null;
  const imp = x.improvement && x.improvement.text ? { text: dashes(x.improvement.text), try_saying: dashes(x.improvement.try_saying || "") } : null;
  return { items, hits: card.map((c) => c.status === "met"), invented, transcription: heard, strength: st, improvement: imp, summary: dashes(x.summary || "") };
}

/* ---------------- calling Claude ---------------- */
async function claude(env, c, { model, system, user, tool, maxTokens, timeout, retries }) {
  if (!env.ANTHROPIC_API_KEY) throw new HttpError(503, "not_configured", "The AI key isn't set on the server.");
  const body = JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }], tools: [tool], tool_choice: { type: "tool", name: tool.name } });
  const t0 = Date.now();
  for (let attempt = 0; ; attempt += 1) {
    const left = timeout - (Date.now() - t0);
    if (left < 1500) throw new HttpError(504, "timeout", "The AI took too long to answer.");
    const ac = new AbortController(), timer = setTimeout(() => ac.abort(), left);
    let res;
    try {
      res = await fetch(c.apiUrl, { method: "POST", signal: ac.signal, headers: { "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" }, body });
    } catch (e) {
      clearTimeout(timer);
      if (attempt < retries) continue;
      throw new HttpError(504, e && e.name === "AbortError" ? "timeout" : "upstream", "The AI didn't answer.");
    }
    clearTimeout(timer);
    if (res.ok) {
      const j = await res.json();
      const use = (j.content || []).find((b) => b.type === "tool_use" && b.name === tool.name);
      const usd = await addSpend(env, model, j.usage || {});
      if (!use) throw new HttpError(502, "bad_model_output", "The AI's answer had no structured reply.");
      return { input: use.input, usage: j.usage || {}, usd, ms: Date.now() - t0 };
    }
    if ((res.status === 429 || res.status === 529 || res.status >= 500) && attempt < retries) { await new Promise((r) => setTimeout(r, 400)); continue; }
    throw new HttpError(res.status === 429 || res.status === 529 ? 503 : 502, "upstream_" + res.status, "The AI service returned an error.");
  }
}

/* ---------------- the server ---------------- */
function cors(origin, c) {
  const ok = origin && c.origins.includes(origin);
  return { "access-control-allow-origin": ok ? origin : c.origins[0], "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "content-type", "access-control-max-age": "86400", vary: "origin" };
}
const json = (obj, status, h) => new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", "cache-control": "no-store", ...h } });

export default {
  async fetch(req, env) {
    const c = cfg(env), origin = req.headers.get("origin") || "", h = cors(origin, c), url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
    const t0 = Date.now();
    let route = url.pathname.replace(/\/+$/, "") || "/", scen = "";
    try {
      if (route === "/health" && req.method === "GET") {
        const b = await checkBudget(env, c).catch(() => ({ day: c.dailyCap, month: c.monthlyCap }));
        return json({ ok: !!env.ANTHROPIC_API_KEY, voterModel: c.voterModel, coachModel: c.coachModel, dayLeftUsd: +(c.dailyCap - b.day).toFixed(2), monthLeftUsd: +(c.monthlyCap - b.month).toFixed(2) }, 200, h);
      }
      if (route.startsWith("/scenario/") && req.method === "GET") {
        const p = publicScenario(route.slice(10));
        return p ? json(p, 200, h) : json({ error: "unknown_scenario" }, 404, h);
      }
      if (req.method !== "POST" || (route !== "/voter" && route !== "/coach")) throw new HttpError(404, "not_found");
      if (!c.origins.includes(origin)) throw new HttpError(403, "origin", "This page isn't allowed to use the practice AI.");
      const ip = req.headers.get("cf-connecting-ip") || "local";
      let body;
      try { body = await req.json(); } catch (e) { throw new HttpError(400, "bad_json"); }
      const s = SCENARIOS[body && body.scenario];
      scen = String((body && body.scenario) || "");
      if (!s) throw new HttpError(400, "unknown_scenario");
      const turns = readTurns(body, s);
      await checkBudget(env, c);
      if (route === "/voter") {
        if (s.coachOnly) throw new HttpError(400, "no_voter");
        await checkRate(env, ip, "voter", c.voterPerHour);
        const r = await claude(env, c, { model: c.voterModel, system: voterPrompt(s, turns), user: `The conversation so far:\n${transcriptText(turns, s.voter.name)}\n\nWrite ${s.voter.name}'s next turn.`, tool: VOTER_TOOL, maxTokens: DEFAULTS.VOTER_MAX_TOKENS, timeout: c.voterTimeout, retries: 1 });
        const out = cleanVoter(r.input, s, turns);
        console.log(JSON.stringify({ route, scen, ms: r.ms, in: r.usage.input_tokens, out: r.usage.output_tokens, usd: +r.usd.toFixed(5) }));
        return json(out, 200, h);
      }
      await checkRate(env, ip, "coach", c.coachPerHour);
      const r = await claude(env, c, { model: c.coachModel, system: coachPrompt(s), user: `The transcript (Volunteer lines are speech-to-text):\n${transcriptText(turns, s.voter.name)}\n\nJudge it with the coach_report tool.`, tool: coachTool(s), maxTokens: DEFAULTS.COACH_MAX_TOKENS, timeout: c.coachTimeout, retries: 1 });
      const out = cleanCoach(r.input, s, turns);
      console.log(JSON.stringify({ route, scen, ms: r.ms, in: r.usage.input_tokens, out: r.usage.output_tokens, usd: +r.usd.toFixed(5) }));
      return json({ ...out, model: c.coachModel }, 200, h);
    } catch (e) {
      const status = e instanceof HttpError ? e.status : 500, code = e instanceof HttpError ? e.code : "server_error";
      console.log(JSON.stringify({ route, scen, ms: Date.now() - t0, error: code }));
      return json({ error: code, message: e instanceof HttpError ? e.message : "Something went wrong." }, status, h);
    }
  },
};
