/* For the UI tests only: the real worker.js on a local port, with Claude replaced by a canned stand-in, plus a static server
   for the staging page. It proves the page and the worker work together (turns, retries, errors, the coach card); it says
   nothing about the model's quality, which ai/tests/live-eval.mjs measures against the deployed worker.
   Usage: node tests/mock-server.mjs /abs/site-root   (page on :8765, worker on :8799) */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import worker from "../worker.js";

const ROOT = process.argv[2];
const stats = { voter: 0, coach: 0 }, failNext = { voter: 0, coach: 0 };
let healthDown = false, healthHang = false;
const realFetch = globalThis.fetch;
const said = (body) => body.messages[0].content;
globalThis.fetch = async (url, init) => {
  if (!String(url).includes("api.anthropic.com")) return realFetch(url, init);
  const body = JSON.parse(init.body), tool = body.tools[0].name, text = said(body);
  const you = text.split("\n").filter((l) => /^\d+\. Volunteer: /.test(l)).map((l) => l.replace(/^\d+\. Volunteer: /, ""));
  await new Promise((r) => setTimeout(r, 250));
  let input;
  if (tool === "voter_turn") {
    stats.voter += 1;
    const n = you.length, last = (you[n - 1] || "").toLowerCase();
    const lines = ["Oh, hey. Yeah, I'm voting for her.", "Do you know what time the polls close Tuesday?", "Okay, no worries. Thanks.", "I've got to hop on a call. Thanks for coming by!"];
    input = /bye|thanks|have a good/.test(last) && n > 1 ? { say: "You too, bye!", mood: "warm", end: true } : { say: lines[Math.min(n - 1, 3)], mood: n === 1 ? "warm" : "neutral", end: n >= 4 };
  } else {
    stats.coach += 1;
    const all = you.join(" "), first = you[0] || "";
    const q = (re) => { const m = all.match(re); return m ? m[0] : ""; };
    const ids = body.tools[0].input_schema.properties.items.items.properties.id.enum;
    const ev = { name: q(/I'?m [A-Z][a-z]+/), maya: q(/Maya Kaur/i), tuesday: q(/Tuesday/i), listen: you[1] ? you[1].split(" ").slice(0, 4).join(" ") : "", close: q(/(thanks|bye)[^.!?]*/i), gap: q(/200,000/), plan: q(/Medicaid expansion/i), opp: q(/work hours/i) };
    input = {
      items: ids.map((id) => ({ id, status: id === "nominute" || id === "accurate" ? "met" : ev[id] ? "met" : "missed", evidence: ev[id] || "", note: ev[id] ? "" : "Not in what you said." })),
      invented: [], transcription: [],
      strength: first ? { text: "You opened with who you are.", quote: first.split(" ").slice(0, 3).join(" ") } : { text: "", quote: "" },
      improvement: { text: "Remind him Election Day is Tuesday in your first line.", try_saying: "Hi, I'm Sam, a neighbor with Maya Kaur. Election Day is Tuesday." },
      summary: "MOCK coach: a friendly start.",
    };
  }
  return new Response(JSON.stringify({ content: [{ type: "tool_use", name: tool, input }], usage: { input_tokens: 1000, output_tokens: 80 } }), { status: 200 });
};
const env = { ANTHROPIC_API_KEY: "mock", ALLOWED_ORIGINS: "http://127.0.0.1:8765", VOTER_PER_IP_HOUR: "1000", COACH_PER_IP_HOUR: "1000" };
http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://127.0.0.1:8799");
  if (u.pathname === "/__mock/stats") { res.end(JSON.stringify(stats)); return; }
  if (u.pathname === "/__mock/health") { healthDown = u.searchParams.get("down") === "1"; healthHang = u.searchParams.get("hang") === "1"; res.end("ok"); return; }
  if (u.pathname === "/health" && healthHang) return; /* never answers */
  if (u.pathname === "/health" && healthDown) { await new Promise((r) => setTimeout(r, 2500)); res.writeHead(200, { "access-control-allow-origin": "*", "content-type": "application/json" }); res.end(JSON.stringify({ ok: false })); return; }
  if (u.pathname === "/__mock/fail") { failNext.voter = Number(u.searchParams.get("voter") || 0); failNext.coach = Number(u.searchParams.get("coach") || 0); res.end("ok"); return; }
  const route = u.pathname.slice(1);
  if (req.method === "POST" && failNext[route] > 0) { failNext[route] -= 1; stats[route] += 1; res.writeHead(504, { "access-control-allow-origin": req.headers.origin || "*", "content-type": "application/json" }); res.end(JSON.stringify({ error: "timeout" })); return; }
  const chunks = []; for await (const c of req) chunks.push(c);
  const r = await worker.fetch(new Request(u.toString(), { method: req.method, headers: req.headers, body: req.method === "POST" ? Buffer.concat(chunks) : undefined }), env);
  res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer()));
}).listen(8799, "127.0.0.1");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg" };
http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); res.end("nf"); return; }
  res.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res);
}).listen(8765, "127.0.0.1");
console.log("mock ready");
