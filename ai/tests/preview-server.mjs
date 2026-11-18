/* A preview of the app on one port, with a stand-in for the AI, for looking at a branch on a phone or a laptop before it
   is merged. Nothing here is deployed and nothing here talks to the real practice AI.

   What is real: the app's pages (wdpfxqlsvp/), the issue trainings and the server's own code (worker.js).
   What is a stand-in: the model and the voice. Sarah, Linda, Kevin and the coach are canned lines (tests/stand-in.mjs) and
   the voice is silent, because the real ones need the deployed server and its key.

   The pages are sent as they are in the repo except for three strings, swapped as each page is sent:
   the AI's address (this server, under /__ai) and the two labels that say "AI" (so nobody mistakes the stand-in for the
   real voter or the real coach). If a page no longer has one of the three, this server refuses to start.

   Usage (from ai/): node tests/preview-server.mjs [port]     default port 8173
   Then open http://localhost:8173/ (it forwards to the app on Learn, door-ready, with Maya's issues open). */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import worker from "../worker.js";
import { standIn } from "./stand-in.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const PORT = Number(process.argv[2] || process.env.PORT || 8173);
const START = "wdpfxqlsvp/?learn&ready";
const PAGES = ["wdpfxqlsvp/app.html", "wdpfxqlsvp/p1/index.html", "wdpfxqlsvp/dev/index.html", "wdpfxqlsvp/staging/index.html"];
const SWAPS = [
  ['const WAI_URL_DEFAULT = "https://warmup-ai.robertrgambhir.workers.dev";', 'const WAI_URL_DEFAULT = location.origin + location.pathname.split("/wdpfxqlsvp/")[0] + "/__ai";'],
  ["Live AI voter · talk the way you would at a real door", "Preview: a scripted stand-in, not the AI voter"],
  ["Coached by AI from what you said. It can make mistakes.", "Preview: a scripted stand-in scored this, not the AI coach."],
];
const swapped = (html, name) => {
  for (const [from, to] of SWAPS) {
    if (html.split(from).length !== 2) throw new Error(`${name}: expected one "${from.slice(0, 40)}..." and found ${html.split(from).length - 1}`);
    html = html.replace(from, () => to);
  }
  return html;
};
for (const rel of PAGES) swapped(fs.readFileSync(path.join(ROOT, rel), "utf8"), rel); /* fail now, not on a phone */

const stats = { voter: 0, coach: 0 };
const { fetch: standInFetch, AI } = standIn(stats);
globalThis.fetch = standInFetch;
const ENV = { ANTHROPIC_API_KEY: "preview-stand-in", AI, VOTER_PER_IP_HOUR: "1000", COACH_PER_IP_HOUR: "1000" };
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".txt": "text/plain; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".mp4": "video/mp4" };
const cache = new Map(); /* a swapped page, kept until its file changes */

http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, "http://preview.local");
    /* a preview pane may serve this port under a path of its own: find the part of the path this server knows */
    let p = u.pathname;
    const at = p.search(/\/(wdpfxqlsvp|__ai)(\/|$)/);
    p = at >= 0 ? p.slice(at) : "/";
    if (p === "/__ai" || p.startsWith("/__ai/")) {
      const origin = req.headers.origin || "";
      const chunks = []; for await (const c of req) chunks.push(c);
      const headers = new Headers(); for (const [k, v] of Object.entries(req.headers)) if (typeof v === "string") headers.set(k, v);
      const r = await worker.fetch(new Request("http://preview.local" + (p.slice(5) || "/") + u.search, { method: req.method, headers, body: req.method === "GET" || req.method === "HEAD" ? undefined : Buffer.concat(chunks) }), { ...ENV, ALLOWED_ORIGINS: origin || "http://preview.local" });
      res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer()));
      return;
    }
    if (p === "/") { res.writeHead(302, { location: START, "cache-control": "no-store" }); res.end(); return; }
    let rel = decodeURIComponent(p).replace(/^\/+/, "");
    if (rel.endsWith("/")) rel += "index.html";
    const file = path.resolve(ROOT, rel);
    if (!file.startsWith(path.join(ROOT, "wdpfxqlsvp") + path.sep) || rel.split("/").some((s) => s.startsWith(".")) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404, { "content-type": "text/plain" }); res.end("not found"); return; }
    const type = TYPES[path.extname(file)] || "application/octet-stream";
    if (PAGES.includes(rel)) {
      const m = fs.statSync(file).mtimeMs, hit = cache.get(rel);
      const body = hit && hit.m === m ? hit.body : Buffer.from(swapped(fs.readFileSync(file, "utf8"), rel));
      cache.set(rel, { m, body });
      res.writeHead(200, { "content-type": type, "cache-control": "no-store" }); res.end(body);
      return;
    }
    res.writeHead(200, { "content-type": type, "cache-control": "no-store" }); fs.createReadStream(file).pipe(res);
  } catch (e) { res.writeHead(500, { "content-type": "text/plain" }); res.end("preview server error"); console.log("error", String(e && e.message)); }
}).listen(PORT, "0.0.0.0", () => console.log(`preview ready on http://localhost:${PORT}/  (stand-in voter and coach; the real AI is not in this preview)`));
