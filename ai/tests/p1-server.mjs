/* Phase 1 UI tests only: the real worker.js (practice AI with a canned model, plus the new progress and event routes on an
   in-memory stand-in for Workers KV) on :8799, and a static server for the site on :8765.
   Usage: node tests/p1-server.mjs /abs/site-root    Extra test routes: /__p1/kv (dump), /__p1/down?on=1, /__p1/kvfail?on=1, /__p1/nokey?on=1, /__p1/reset */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import worker from "../worker.js";

const ROOT = process.argv[2];
class FakeKV {
  constructor() { this.m = new Map(); this.fail = false; }
  async get(k, type) { const v = this.m.get(k); return v === undefined ? null : type === "json" ? JSON.parse(v) : v; }
  async put(k, v) { if (this.fail) throw new Error("KV put() limit exceeded for the day."); this.m.set(k, v); }
  async delete(k) { this.m.delete(k); }
  async list({ prefix }) { return { keys: [...this.m.keys()].filter((k) => k.startsWith(prefix)).sort().map((name) => ({ name })), list_complete: true }; }
}
const KV = new FakeKV();
let down = false;
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  if (!String(url).includes("api.anthropic.com")) return realFetch(url, init);
  const body = JSON.parse(init.body), tool = body.tools[0].name;
  const input = tool === "voter_turn" ? { say: "Oh, hey. Yeah, I'm voting for her. Thanks for coming by.", mood: "warm", end: true }
    : (() => { /* the mock coach credits every part with the volunteer's own first line as its quote, so the server's quote check passes */
      const said = ((JSON.stringify(body.messages).match(/\d+\. Volunteer: ([^\\]+)/) || [])[1] || "").trim();
      return { items: body.tools[0].input_schema.properties.items.items.properties.id.enum.map((id) => ({ id, status: "met", evidence: said, note: "" })), invented: [], transcription: [], strength: { text: "", quote: "" }, improvement: { text: "Keep it up.", try_saying: "" }, summary: "MOCK" };
    })();
  return new Response(JSON.stringify({ content: [{ type: "tool_use", name: tool, input }], usage: { input_tokens: 100, output_tokens: 20 } }), { status: 200 });
};
const env = { ANTHROPIC_API_KEY: "mock", ALLOWED_ORIGINS: "http://127.0.0.1:8765", VOTER_PER_IP_HOUR: "1000", COACH_PER_IP_HOUR: "1000", LEARNER_KEY: "p1-test-learner-key-0123456789abcdefgh", ADMIN_TOKEN: "p1-test-admin-token-0123456789", WARMUP_KV: KV };
http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://127.0.0.1:8799");
  if (u.pathname === "/__p1/kv") { res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify(Object.fromEntries(KV.m))); return; }
  if (u.pathname === "/__p1/down") { down = u.searchParams.get("on") === "1"; res.end("ok"); return; }
  if (u.pathname === "/__p1/kvfail") { KV.fail = u.searchParams.get("on") === "1"; res.end("ok"); return; }
  if (u.pathname === "/__p1/reset") { KV.m.clear(); res.end("ok"); return; }
  if (u.pathname === "/__p1/nokey") { env.LEARNER_KEY = u.searchParams.get("on") === "1" ? "" : "p1-test-learner-key-0123456789abcdefgh"; res.end("ok"); return; } /* progress saving switched off, as before the secret is set */
  if (down) { req.socket.destroy(); return; }
  const chunks = []; for await (const c of req) chunks.push(c);
  const r = await worker.fetch(new Request(u.toString(), { method: req.method, headers: req.headers, body: ["POST", "PUT"].includes(req.method) ? Buffer.concat(chunks) : undefined }), env);
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
console.log("p1 servers ready");
