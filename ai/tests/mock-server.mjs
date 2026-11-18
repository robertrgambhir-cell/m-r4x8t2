/* For the UI tests only: the real worker.js on a local port, with Claude replaced by a canned stand-in, plus a static server
   for the staging page. It proves the page and the worker work together (turns, retries, errors, the coach card); it says
   nothing about the model's quality, which ai/tests/live-eval.mjs measures against the deployed worker.
   Usage: node tests/mock-server.mjs /abs/site-root   (page on :8765, worker on :8799) */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import worker from "../worker.js";
import { standIn } from "./stand-in.mjs";

const ROOT = process.argv[2];
/* version 174: the two ports can be moved (WARMUP_SITE_PORT, WARMUP_AI_PORT) so two test runs can share a machine */
const SITE_PORT = Number(process.env.WARMUP_SITE_PORT || 8765), AI_PORT = Number(process.env.WARMUP_AI_PORT || 8799);
const stats = { voter: 0, coach: 0 }, failNext = { voter: 0, coach: 0 };
let coachDelay = 0; /* version 173: /__mock/coach-delay?ms=N slows the coach so a test can see the card fill in */
let healthDown = false, healthHang = false;
/* version 174: the canned model and the quiet voice live in stand-in.mjs, which the preview server shares */
const { fetch: standInFetch, AI } = standIn(stats);
globalThis.fetch = standInFetch;
const env = { ANTHROPIC_API_KEY: "mock", AI, ALLOWED_ORIGINS: "http://127.0.0.1:" + SITE_PORT, VOTER_PER_IP_HOUR: "1000", COACH_PER_IP_HOUR: "1000" };
http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://127.0.0.1:8799");
  if (u.pathname === "/__mock/stats") { res.end(JSON.stringify(stats)); return; }
  if (u.pathname === "/__mock/health") { healthDown = u.searchParams.get("down") === "1"; healthHang = u.searchParams.get("hang") === "1"; res.end("ok"); return; }
  if (u.pathname === "/health" && healthHang) return; /* never answers */
  if (u.pathname === "/health" && healthDown) { await new Promise((r) => setTimeout(r, 2500)); res.writeHead(200, { "access-control-allow-origin": "*", "content-type": "application/json" }); res.end(JSON.stringify({ ok: false })); return; }
  if (u.pathname === "/__mock/coach-delay") { coachDelay = Number(u.searchParams.get("ms") || 0); res.writeHead(200, { "access-control-allow-origin": "*" }); res.end("ok"); return; }
  if (u.pathname === "/__mock/fail") { failNext.voter = Number(u.searchParams.get("voter") || 0); failNext.coach = Number(u.searchParams.get("coach") || 0); res.end("ok"); return; }
  const route = u.pathname.slice(1) === "turn" ? "voter" : u.pathname.slice(1); /* version 165: /turn counts and fails as the voter */
  if (req.method === "POST" && failNext[route] > 0) { failNext[route] -= 1; stats[route] += 1; res.writeHead(504, { "access-control-allow-origin": req.headers.origin || "*", "content-type": "application/json" }); res.end(JSON.stringify({ error: "timeout" })); return; }
  const chunks = []; for await (const c of req) chunks.push(c);
  if (req.method === "POST" && route === "coach" && coachDelay) await new Promise((r) => setTimeout(r, coachDelay));
  const r = await worker.fetch(new Request(u.toString(), { method: req.method, headers: req.headers, body: req.method === "POST" ? Buffer.concat(chunks) : undefined }), env);
  res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer()));
}).listen(AI_PORT, "127.0.0.1");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg" };
http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); res.end("nf"); return; }
  res.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res);
}).listen(SITE_PORT, "127.0.0.1");
console.log("mock ready");
