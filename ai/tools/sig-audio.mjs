/* Records the signature course's spoken lines from the live AI server's voice into wdpfxqlsvp/sig/audio/.
   The lines and each person's voice come from ai/sig/content.js; the server reads only those lines (GET /narrate?s=sig&k=N).
   A clip is named by a hash of its voice and words, so a line that repeats is recorded once and a line is fetched again only
   when its words or its voice change. Each clip is trimmed and leveled to -20 LUFS like the app's other clips (48 kbps mono,
   24 kHz) with ffmpeg when it is installed. Clips no line uses any more are removed.
   The voice says the same line at a different pace each time it is asked (the same words came back 17% shorter to 36%
   longer on a second ask). --pace finds the clips that came out fast (over 5.4 syllables a second, in lines of 6 syllables
   or more), asks for up to three more takes of each (take=1 to 9 on the server) and keeps the one nearest 4.4 syllables a
   second, the coach's usual pace. The manifest records which take a clip is.
   Usage: node ai/tools/sig-audio.mjs [--force] [--first=2] [--pace]   (from the repo root; WARMUP_AI_URL overrides the server) */
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
const pace = process.argv.includes("--pace");
const TARGET = 4.4, FAST = 5.4, CALM = [3.4, 5.2], MIN_SYL = 6, MORE_TAKES = 3;
/* a rough count of the syllables a voice says, good enough to compare two takes of one line */
const NUMS = { "1000": 3, "28000": 5, "2026": 5, "26": 3, "100": 3, "88": 3, "12": 1, "10": 1, "7": 2, "3": 1, "8": 1, "1": 1, "2": 1 };
export const syllables = (text) => String(text).split(/[\s-]+/).reduce((n, word) => {
  let w = word.toLowerCase().replace(/[^a-z0-9]/g, ""); if (!w) return n;
  if (/^\d+$/.test(w)) return n + (NUMS[w] || (w.length >= 5 ? w.length : Math.max(1, Math.round(w.length * 1.5))));
  if (/^[a-z]\.?$/.test(word.toLowerCase()) || /^([a-z]\.){2,}$/.test(word.toLowerCase())) return n + w.length; /* "B." and "L.A." are said letter by letter */
  if (w.length > 3 && w.endsWith("e") && !/(le|ee)$/.test(w)) w = w.slice(0, -1);
  return n + Math.max(1, (w.match(/[aeiouy]+/g) || []).length);
}, 0);
const rate = (say, dur) => (dur > 0 ? syllables(say) / dur : 0);
export const clipKey = (voice, say) => crypto.createHash("sha256").update(voice + "|" + say).digest("hex").slice(0, 12);
const has = (cmd) => { try { execFileSync(cmd, ["-version"], { stdio: "ignore" }); return true; } catch (e) { return false; } };
const FF = has("ffmpeg"), FP = has("ffprobe");
const sleep = (ms) => new Promise((z) => setTimeout(z, ms));

fs.mkdirSync(OUT, { recursive: true });
const mf = path.join(OUT, "manifest.json");
let man = fs.existsSync(mf) ? JSON.parse(fs.readFileSync(mf, "utf8")) : {};
if (Object.values(man).some((x) => !x.file || !/^[0-9a-f]{12}\.mp3$/.test(x.file))) man = {}; /* an older manifest, keyed by line */
const N = SIG_NARRATION.sig.narration;
/* one take of one line from the voice server, trimmed and leveled, written to `full` */
async function record(k, voice, take, full, say) {
  let r = null;
  for (let tryN = 0; tryN < 40 && !(r && r.ok); tryN += 1) {
    r = await fetch(`${AI}/narrate?s=sig&k=${k}&voice=${voice}${take ? "&take=" + take : ""}`).catch(() => null);
    if (r && r.ok) break;
    const st = r ? r.status : 0;
    if (st === 404) throw new Error("the server doesn't know this line yet (is the new build live?): " + say);
    console.log("  waiting,", st === 429 ? "the hourly voice limit" : "status " + st); await sleep(st === 429 ? 90000 : 2500);
  }
  if (!r || !r.ok) throw new Error(`${say}: ${r ? r.status : "no answer"}`);
  const raw = Buffer.from(await r.arrayBuffer());
  if (FF) {
    const tmp = full + ".raw.mp3"; fs.writeFileSync(tmp, raw);
    /* trim the silence at both ends, level it, keep a short tail so words don't clip */
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", tmp, "-af", "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.04,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.10,areverse,loudnorm=I=-20:TP=-1.5:LRA=11", "-ar", "24000", "-ac", "1", "-b:a", "48k", full]);
    fs.unlinkSync(tmp);
  } else fs.writeFileSync(full, raw);
  const dur = FP ? Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", full]).toString().trim()) : 0;
  return { dur: Math.round(dur * 100) / 100, bytes: fs.statSync(full).size };
}
const all = sigVoiceLines().sort((a, b) => (a.n === first ? 0 : 1) - (b.n === first ? 0 : 1));
const next = {}; let made = 0;
for (const L of all) {
  const h = clipKey(L.voice, L.say), file = h + ".mp3", full = path.join(OUT, file);
  if (next[h]) continue;
  const have = !force && man[h] && fs.existsSync(full);
  if (have && !(pace && syllables(L.say) >= MIN_SYL && rate(L.say, man[h].dur) > FAST)) { next[h] = man[h]; continue; }
  const k = N.indexOf(L.say); if (k < 0) throw new Error("not in the server's list: " + L.say);
  if (have && pace) {
    /* a clip that came out fast: ask for more takes and keep the one nearest the coach's usual pace */
    const was = man[h], from = (was.take || 0) + 1; let best = { r: rate(L.say, was.dur), entry: was, tmp: "" };
    console.log("fast    ", ("L" + L.n).padEnd(3), L.who.padEnd(8), String(was.dur).padStart(5) + " s", best.r.toFixed(1) + " syl/s", L.say.slice(0, 50));
    if (process.argv.includes("--list")) { next[h] = was; continue; } /* --pace --list only names the fast clips */
    for (let take = from; take < from + MORE_TAKES && take <= 9; take += 1) {
      const tmp = full + ".take" + take + ".mp3", got = await record(k, L.voice, take, tmp, L.say), r = rate(L.say, got.dur), better = Math.abs(r - TARGET) < Math.abs(best.r - TARGET);
      console.log("   take", take, String(got.dur).padStart(5) + " s", r.toFixed(1) + " syl/s", better ? "(kept)" : "");
      if (better) { if (best.tmp) fs.unlinkSync(best.tmp); best = { r, tmp, entry: { file, who: L.who, voice: L.voice, dur: got.dur, bytes: got.bytes, text: L.say, take } }; } else fs.unlinkSync(tmp);
      if (best.r >= CALM[0] && best.r <= CALM[1]) break;
    }
    if (best.tmp) { fs.renameSync(best.tmp, full); made += 1; }
    next[h] = best.entry; fs.writeFileSync(mf, JSON.stringify(Object.assign({}, man, next), null, 1) + "\n");
    continue;
  }
  const got = await record(k, L.voice, 0, full, L.say);
  next[h] = { file, who: L.who, voice: L.voice, dur: got.dur, bytes: got.bytes, text: L.say };
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
