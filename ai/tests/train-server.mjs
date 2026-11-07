/* For the training page's browser tests only: a static server for the site on :8765 and the real worker.js on :8799 with the
   model and the voice stubbed (the model streams a canned line that depends on the turn; the voice returns 0.4 s of PCM).
   Usage: node ai/tests/train-server.mjs /abs/site-root    Extra routes: /__t/fail?n=1 (the next n turns fail), /__t/stats */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import worker from "../worker.js";

const ROOT = process.argv[2];
const stats = { turn: 0, coach: 0, voice: 0 }; let failN = 0;
const realFetch = globalThis.fetch;
const sse = (text) => { const enc = new TextEncoder(); return new ReadableStream({ async start(ctl) {
  ctl.enqueue(enc.encode(`event: message_start\ndata: ${JSON.stringify({ type: "message_start", message: { usage: { input_tokens: 1500 } } })}\n\n`));
  for (const p of text.match(/.{1,6}/gs)) { await new Promise((r) => setTimeout(r, 15)); ctl.enqueue(enc.encode(`event: content_block_delta\ndata: ${JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text: p } })}\n\n`)); }
  ctl.enqueue(enc.encode(`event: message_delta\ndata: ${JSON.stringify({ type: "message_delta", usage: { output_tokens: 40 } })}\n\n`)); ctl.close(); } }); };
globalThis.fetch = async (url, init) => {
  if (!String(url).includes("api.anthropic.com")) return realFetch(url, init);
  const body = JSON.parse(init.body);
  await new Promise((r) => setTimeout(r, 200));
  if (body.stream) {
    stats.turn += 1;
    if (failN > 0) { failN -= 1; return new Response(JSON.stringify({ error: { message: "overloaded" } }), { status: 529 }); }
    const n = (body.messages[0].content.match(/\d+\. Volunteer: /g) || []).length;
    const lines = ["neutral|Oh, okay. So what is Maya going to do about it?", "skeptical|Hm. Don't those places bring jobs, though?", "neutral|And what about the other candidate? I heard he has a bill too.", "warm|Well, that sounds fair. Thanks, I've got to get back inside. <end>"];
    return new Response(sse(lines[Math.min(n - 1, 3)]), { status: 200 });
  }
  stats.coach += 1;
  const ids = body.tools[0].input_schema.properties.items.items.properties.id.enum;
  const you = body.messages[0].content.split("\n").filter((l) => /^\d+\. Volunteer: /.test(l)).map((l) => l.replace(/^\d+\. Volunteer: /, ""));
  const items = ids.map((id, k) => ({ id, status: k % 3 === 2 ? "missed" : "met", evidence: k % 3 === 2 ? "" : you[0].split(" ").slice(0, 5).join(" "), note: "A short note." }));
  return new Response(JSON.stringify({ content: [{ type: "tool_use", name: body.tools[0].name, input: { items, invented: [], transcription: [], strength: { text: "Good start.", quote: you[0].slice(0, 20) }, improvement: { text: "Say why bills went up.", try_saying: "The biggest new reason is data centers." }, summary: "It went fine." } }], usage: { input_tokens: 2000, output_tokens: 300 } }), { status: 200 });
};
const AI = { run: async (model, o) => { stats.voice += 1; await new Promise((r) => setTimeout(r, 120)); if (o.encoding === "linear16") return new ReadableStream({ start(c) { for (let k = 0; k < 4; k++) c.enqueue(new Uint8Array(4800)); c.close(); } }); return new Uint8Array(600).buffer; } };
const env = { ANTHROPIC_API_KEY: "test", AI, ALLOWED_ORIGINS: "http://127.0.0.1:8765" };
http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  if (u.pathname === "/__t/stats") { res.end(JSON.stringify(stats)); return; }
  if (u.pathname === "/__t/fail") { failN = Number(u.searchParams.get("n") || 1); res.end("ok"); return; }
  const chunks = []; for await (const c of req) chunks.push(c);
  const r = await worker.fetch(new Request("http://127.0.0.1:8799" + req.url, { method: req.method, headers: { ...req.headers, "cf-connecting-ip": "9.9.9.9" }, body: ["GET", "HEAD", "OPTIONS"].includes(req.method) ? undefined : Buffer.concat(chunks) }), env);
  res.writeHead(r.status, Object.fromEntries(r.headers));
  if (r.body) { const rd = r.body.getReader(); for (;;) { const { done, value } = await rd.read(); if (done) break; res.write(Buffer.from(value)); } }
  res.end();
}).listen(8799);
const TYPES = { ".html": "text/html; charset=utf-8", ".mp3": "audio/mpeg", ".js": "text/javascript", ".png": "image/png", ".json": "application/json" };
http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = path.join(ROOT, decodeURIComponent(u.pathname));
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, "index.html");
  if (!p.startsWith(ROOT) || !fs.existsSync(p)) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, { "content-type": TYPES[path.extname(p)] || "application/octet-stream" }); fs.createReadStream(p).pipe(res);
}).listen(8765, () => console.log("train servers ready"));
