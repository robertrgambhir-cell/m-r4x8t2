/* Records the signature course's spoken lines from the live AI server's voice into wdpfxqlsvp/sig/audio/.
   The lines and each person's voice come from ai/sig/content.js; the server reads only those lines (GET /narrate?s=sig&k=N).
   A clip is named by a hash of its voice and words, so a line that repeats is recorded once and a line is fetched again only
   when its words or its voice change. Each clip is trimmed and leveled to -20 LUFS like the app's other clips (48 kbps mono,
   24 kHz) with ffmpeg when it is installed. Clips no line uses any more are removed.
   Usage: node ai/tools/sig-audio.mjs [--force] [--first=2]   (from the repo root; WARMUP_AI_URL overrides the server) */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { sigVoiceLines, SIG_NARRATION } from "../sig/content.js";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const OUT = path.join(ROOT, "wdpfxqlsvp/sig/audio");
const AI = process.env.WARMUP_AI_URL || "https://warmup-ai.robertrgambhir.workers.dev";
const force = process.argv.includes("--force");
const first = Number((process.argv.find((a) => a.startsWith("--first=")) || "").slice(8)) || 0;
export const clipKey = (voice, say) => crypto.createHash("sha256").update(voice + "|" + say).digest("hex").slice(0, 12);
const has = (cmd) => { try { execFileSync(cmd, ["-version"], { stdio: "ignore" }); return true; } catch (e) { return false; } };
const FF = has("ffmpeg"), FP = has("ffprobe");
const sleep = (ms) => new Promise((z) => setTimeout(z, ms));

fs.mkdirSync(OUT, { recursive: true });
const mf = path.join(OUT, "manifest.json");
let man = fs.existsSync(mf) ? JSON.parse(fs.readFileSync(mf, "utf8")) : {};
if (Object.values(man).some((x) => !x.file || !/^[0-9a-f]{12}\.mp3$/.test(x.file))) man = {}; /* an older manifest, keyed by line */
const N = SIG_NARRATION.sig.narration;
const all = sigVoiceLines().sort((a, b) => (a.n === first ? 0 : 1) - (b.n === first ? 0 : 1));
const next = {}; let made = 0;
for (const L of all) {
  const h = clipKey(L.voice, L.say), file = h + ".mp3", full = path.join(OUT, file);
  if (next[h]) continue;
  if (!force && man[h] && fs.existsSync(full)) { next[h] = man[h]; continue; }
  const k = N.indexOf(L.say); if (k < 0) throw new Error("not in the server's list: " + L.say);
  let r = null;
  for (let tryN = 0; tryN < 40 && !(r && r.ok); tryN += 1) {
    r = await fetch(`${AI}/narrate?s=sig&k=${k}&voice=${L.voice}`).catch(() => null);
    if (r && r.ok) break;
    const st = r ? r.status : 0;
    if (st === 404) throw new Error("the server doesn't know this line yet (is the new build live?): " + L.say);
    console.log("  waiting,", st === 429 ? "the hourly voice limit" : "status " + st); await sleep(st === 429 ? 90000 : 2500);
  }
  if (!r || !r.ok) throw new Error(`${L.say}: ${r ? r.status : "no answer"}`);
  const raw = Buffer.from(await r.arrayBuffer());
  if (FF) {
    const tmp = full + ".raw.mp3"; fs.writeFileSync(tmp, raw);
    /* trim the silence at both ends, level it, keep a short tail so words don't clip */
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", tmp, "-af", "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.04,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.10,areverse,loudnorm=I=-20:TP=-1.5:LRA=11", "-ar", "24000", "-ac", "1", "-b:a", "48k", full]);
    fs.unlinkSync(tmp);
  } else fs.writeFileSync(full, raw);
  const dur = FP ? Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", full]).toString().trim()) : 0;
  next[h] = { file, who: L.who, voice: L.voice, dur: Math.round(dur * 100) / 100, bytes: fs.statSync(full).size, text: L.say };
  made += 1;
  console.log("recorded", ("L" + L.n).padEnd(3), L.who.padEnd(8), String(next[h].dur).padStart(5) + " s", L.say.slice(0, 64));
  fs.writeFileSync(mf, JSON.stringify(Object.assign({}, man, next), null, 1) + "\n"); /* keep what's done if the run stops */
}
/* clips no line uses any more go away */
const keep = new Set(Object.values(next).map((x) => x.file));
fs.readdirSync(OUT).filter((f) => f.endsWith(".mp3") && !keep.has(f)).forEach((f) => { fs.unlinkSync(path.join(OUT, f)); console.log("removed", f); });
fs.writeFileSync(mf, JSON.stringify(next, null, 1) + "\n");
const v = Object.values(next), total = v.reduce((a, x) => a + (x.dur || 0), 0), bytes = v.reduce((a, x) => a + x.bytes, 0);
console.log(`${v.length} clips (${made} new), ${total.toFixed(1)} s, ${(bytes / 1024).toFixed(0)} KB, in ${path.relative(ROOT, OUT)}`);
