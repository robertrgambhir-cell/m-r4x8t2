/* ---------------- the page's core: words, sound, listening and the pictures ---------------- */
var ST = DATA.st, SH = DATA.shared, ME = DATA.measure, CAST = DATA.cast;
var qs = new URLSearchParams(location.search);
var LN = qs.get("l") === "card" ? 0 : Math.max(1, Math.min(5, parseInt(qs.get("l"), 10) || 2));
var L = DATA.lessons[LN] || null;
var PRACTICE = qs.has("practice"); /* a practice round on one lesson's must, opened from lesson 5's last screen */
var WALKTEST = qs.has("walk"); /* tests: lesson 2's passersby walk past even in fast mode, eight times as fast */
var BEATTEST = qs.has("beat"); /* tests: the Part N of 4 screens show even in fast mode */
/* the small screen number ("Sig 2.4") shows only with ?tags (version 8, Robert, Nov 20, 3:51 PM: "We don't want that little number
   there. I don't know what that means.") It stays in the page, hidden, for the build's own checks. */
var TAGS = qs.has("tags"); if (TAGS) document.documentElement.classList.add("tags");
var FAST = qs.has("fast"), HOLD = Math.max(10, parseInt(qs.get("fast"), 10) || 10); /* tests: no sound, no waiting. fast=300 holds each spoken line 300 ms so a test sees every caption */
var SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
var $ = function (s) { return document.querySelector(s); };
var esc = function (t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
/* straight quotes in the script become curly ones on screen; a quote inside a line is set as a double quote */
function curl(t) {
  var s = String(t == null ? "" : t), out = "", open = false, open2 = false;
  for (var i = 0; i < s.length; i += 1) {
    var ch = s[i], p = i ? s[i - 1] : " ", n = i + 1 < s.length ? s[i + 1] : " ";
    if (ch === "'") {
      if (/[A-Za-z0-9]/.test(p) && /[A-Za-z]/.test(n)) out += "’";
      else if (!open && /[\s(]/.test(p) && /\S/.test(n)) { out += "“"; open = true; }
      else if (open) { out += "”"; open = false; }
      else out += "’";
    } else if (ch === '"') { out += open2 ? "”" : "“"; open2 = !open2; }
    else out += ch;
  }
  return out;
}
var q = function (t) { return esc(curl(t)); };
var tidy = function (t) { t = String(t || "").trim(); if (!t) return ""; if (TIDY[t]) return TIDY[t]; t = t.replace(/\bi(?=\b|')/g, "I"); t = t.charAt(0).toUpperCase() + t.slice(1); return /[.!?]$/.test(t) ? t : t + "."; }
/* version 8 (Robert, Nov 20, 3:51 PM: "make sure the AI attempts to punctuate and capitalize things correctly and show proper
   sentences, not just one long run-on sentence"): what the canvasser said goes to the AI server's punctuation route, the one the
   door-knocking lessons use (/tidy, version 165-6). It adds only periods, commas, question marks, apostrophes and capitals, never a
   word. The grader still reads the words as heard. Until the answer comes, and if it never does, the words show with a capital
   and a period. */
var TIDY = {}, AI_URL = "https://warmup-ai.robertrgambhir.workers.dev";
function tidyFetch(text) {
  var t = String(text || "").trim();
  if (!t || TIDY[t] || FAST || /[.?!,]\s+\S/.test(t)) return Promise.resolve(TIDY[t] || null); /* already punctuated inside: a phone that punctuates. A run-on that only ends in a mark still goes (version 8, after the review) */
  return fetch(AI_URL + "/tidy", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ scenario: "opener_first_try", text: t }) })
    .then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { if (j && j.text) { TIDY[t] = j.text; return j.text; } return null; }).catch(function () { return null; });
}; /* a spoken line gets a capital and a period, never changed words */
var ICON = {
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 5 8 12l6.5 7"/></svg>',
  x: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/></svg>',
  mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
  stop: '<svg viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor"/></svg>',
  ok: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.5 6.6 11.4 12.5 5"/></svg>',
  dot: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="3" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.3"/><rect x="14" y="5" width="4" height="14" rx="1.3"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.9l10.2-6.5a1 1 0 0 0 0-1.7L9.5 4.6A1 1 0 0 0 8 5.5z"/></svg>',
};
var wait = function (ms) { return new Promise(function (r) { setTimeout(r, FAST ? Math.min(ms, 15) : ms); }); };

/* ---------------- sound: one AudioContext, unlocked by the first tap ---------------- */
var AC = null, OUT = null, AN = null, RAW = {}, BUF = {}, playing = [], lipEl = null, PAUSED = false;
function audio() {
  if (!AC) { var C = window.AudioContext || window.webkitAudioContext; AC = new C(); OUT = AC.createGain(); AN = AC.createAnalyser(); AN.fftSize = 512; OUT.connect(AN); AN.connect(AC.destination); }
  if (AC.state === "suspended" && !PAUSED) AC.resume();
  try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}
  return AC;
}
function fetchClip(clip) { if (clip && !RAW[clip]) RAW[clip] = fetch("audio/" + clip + ".mp3").then(function (r) { if (!r.ok) throw new Error("clip"); return r.arrayBuffer(); }).catch(function () { return null; }); return RAW[clip] || Promise.resolve(null); }
function clipBuf(clip) { if (!BUF[clip]) BUF[clip] = fetchClip(clip).then(function (ab) { if (!ab) return null; return new Promise(function (res) { try { audio().decodeAudioData(ab.slice(0), res, function () { res(null); }); } catch (e) { res(null); } }); }); return BUF[clip]; }
function stopSound() { var p = playing; playing = []; p.forEach(function (x) { try { x.s.onended = null; x.s.stop(); } catch (e) {} x.done(false); }); try { speechSynthesis.cancel(); } catch (e) {} lip(null); }
function playBuf(buf) { return new Promise(function (res) { var a = audio(), s = a.createBufferSource(), rec = { s: s, done: res }; s.buffer = buf; s.connect(OUT); s.onended = function () { playing = playing.filter(function (x) { return x !== rec; }); res(true); }; s.start(); playing.push(rec); }); }
function ttsSay(text) { return new Promise(function (res) { try { var u = new SpeechSynthesisUtterance(text); u.rate = 1.02; u.onend = function () { res(true); }; u.onerror = function () { res(false); }; speechSynthesis.speak(u); } catch (e) { setTimeout(function () { res(false); }, 1200); } }); }
function level() { if (!AN) return 0; var d = new Uint8Array(AN.fftSize); AN.getByteTimeDomainData(d); var s = 0; for (var i = 0; i < d.length; i += 1) { var v = (d[i] - 128) / 128; s += v * v; } return Math.sqrt(s / d.length); }
/* say one line of the script: its recorded clip (the phone's own voice only if the clip can't be had), with the speaker's mouth moving */
function sayLine(line, r) {
  if (!line) return Promise.resolve(true);
  if (FAST) return new Promise(function (ok) { setTimeout(function () { ok(r === RUN); }, HOLD); });
  return clipBuf(line.clip).then(function (buf) {
    if (r !== RUN) return false;
    lip(line.who);
    return (buf ? playBuf(buf) : ttsSay(line.text)).then(function () { if (r === RUN) lip(null); return r === RUN; }); /* a tap that skips the line still moves on */
  });
}
/* the mouths and the blinks (rule 69): whoever is talking opens and closes their mouth with the sound of their own line, and
   everyone in a picture blinks now and then. A face's talking mouth and closed eyes are small patches laid over the picture. */
var TALKER = null, LEVEL = 0;
function lip(who) {
  [].forEach.call(document.querySelectorAll(".pt.talking"), function (e) { e.classList.remove("talking"); var m = e.querySelector(".mo"); if (m) m.style.opacity = 0; });
  TALKER = who ? document.querySelector('#panel .pt[data-who="' + who + '"], #scr .pt[data-who="' + who + '"]') : null;
  if (TALKER) TALKER.classList.add("talking");
}
(function loop() {
  if (TALKER && !PAUSED) {
    var lv = level(); LEVEL = lv > LEVEL ? LEVEL * 0.3 + lv * 0.7 : LEVEL * 0.72 + lv * 0.28; /* opens fast, closes a little slower */
    var m = TALKER.querySelector(".mo"); if (m) m.style.opacity = LEVEL > 0.085 ? 1 : LEVEL > 0.035 ? 0.55 : 0;
  }
  requestAnimationFrame(loop);
})();
(function blinks() {
  var now = performance.now();
  [].forEach.call(document.querySelectorAll(".pt .bl"), function (b) {
    var t = +b.getAttribute("data-t") || 0;
    if (!t) { b.setAttribute("data-t", now + 900 + Math.random() * 3200); return; }
    if (now >= t && !b.classList.contains("on")) { b.classList.add("on"); setTimeout(function () { b.classList.remove("on"); b.setAttribute("data-t", performance.now() + 2600 + Math.random() * 3400); }, 140); }
  });
  setTimeout(blinks, 120);
})();
function expr() {} /* the pictures keep one calm face; feelings show in the words */

/* ---------------- listening: the phone's speech recognition, ended by quiet ---------------- */
function listen(o) {
  /* o: { onWords(text), onDone(text), onError(code) }. Quiet ends the turn by the practice voters' rule: 1.2 seconds after a line
     that sounds finished, 2.8 mid-thought or under three words. A tap on the mic ends it at once. Nobody is ever cut off. */
  var text = "", changed = 0, done = false, started = 0;
  try { if (navigator.audioSession) navigator.audioSession.type = "play-and-record"; } catch (e) {}
  var R = new SR(); R.lang = "en-US"; R.interimResults = true; R.continuous = true; R.maxAlternatives = 1;
  var tick = setInterval(function () { if (done || !text) return; if (performance.now() - changed > SIGG.pauseMs(text)) finish(); }, 50);
  var cap = setTimeout(function () { finish(); }, 60000);
  function end() { done = true; clearInterval(tick); clearTimeout(cap); try { R.onend = null; R.abort(); } catch (e) {} try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {} }
  function finish() { if (done) return; end(); o.onDone(text.trim()); }
  R.onresult = function (e) { var parts = []; for (var j = 0; j < e.results.length; j += 1) parts.push(String(e.results[j][0].transcript || "").trim()); var t = parts.filter(Boolean).join(" ").replace(/\s+/g, " "); if (t !== text) { text = t; changed = performance.now(); o.onWords(text); } };
  R.onstart = function () { if (o.onStart) o.onStart(); }; /* listening, after any permission prompt */
  R.onspeechstart = function () { if (o.onSpeech) o.onSpeech(true); }; R.onspeechend = function () { if (o.onSpeech) o.onSpeech(false); }; /* a walking passerby slows while you talk */
  R.onerror = function (e) { var c = e && e.error; if (c === "no-speech" || c === "aborted") return; if (done) return; end(); o.onError(c === "not-allowed" || c === "service-not-allowed" ? "denied" : c === "audio-capture" ? "busy" : "error"); };
  R.onend = function () { if (done) return; if (text) { finish(); return; } if (performance.now() - started < 9000) { try { R.start(); } catch (e) { finish(); } return; } finish(); }; /* iOS ends a quiet session on its own */
  try { R.start(); started = performance.now(); } catch (e) { end(); setTimeout(function () { o.onError("error"); }, 0); }
  return { stop: finish, abort: end };
}

/* ---------------- the pictures (Nov 19: look Q, the mid-century cartoon, playbook rules 54a, 67, 67a and 69) ----------------
   Every person is a cutout over one storefront, made ahead of time (ai/tools/sig-pictures/q_build.py) and served from
   wdpfxqlsvp/sig/img/. DATA.img is the manifest: each picture's size, its storefront (bg), where its faces are (fractions of the
   picture: x0, y0, x1, y1) and its people (parts): each one's cutout, where it sits, its other versions (alt: sheet, the canvasser
   holding up the top funders sheet; turn, a passerby with an earbud out; pen, a signer with the pen) and where its talking mouth
   (mo) and closed eyes (bl) go, as fractions of the cutout. place() frames each picture so the faces sit where the screen needs them. */
var IMG = DATA.img || {};
function imgUrl(n) { return "img/" + n + ".webp"; }
var box = function (b) { return "left:" + (b[0] * 100).toFixed(2) + "%;top:" + (b[1] * 100).toFixed(2) + "%;width:" + (b[2] * 100).toFixed(2) + "%;height:" + (b[3] * 100).toFixed(2) + "%"; };
var box2 = function (b) { return box([b[0], b[1], b[2] - b[0], b[3] - b[1]]); };
function partHtml(p) {
  return '<div class="pt' + (p.walk ? " walker" : "") + '" data-who="' + p.who + '" style="' + box(p.box) + '"><div class="bob">' +
    '<img class="cut" src="' + imgUrl(p.src) + '" alt="" decoding="async">' +
    Object.keys(p.alt || {}).map(function (k) { return '<img class="cut alt alt-' + k + '" src="' + imgUrl(p.alt[k]) + '" alt="" decoding="async">'; }).join("") +
    (p.mo ? '<img class="mo" src="' + imgUrl("mo-" + p.head) + '" alt="" style="' + box2(p.mo) + '">' : "") +
    (p.bl ? '<img class="bl" src="' + imgUrl("bl-" + p.head) + '" alt="" style="' + box2(p.bl) + '">' : "") + '</div></div>';
}
function picHtml(name) { var m = IMG[name] || {}; return '<div class="fr">' + (m.bg ? '<img class="bg" src="' + imgUrl(m.bg) + '" alt="" decoding="async">' : "") + (m.parts || []).map(partHtml).join("") + '</div>'; }
/* Show and say only what the learner would know (Nov 19, Robert's note; playbook rule 30a): a canvasser is known by first name.
   A passerby is a stranger, with no name or age, until their name is written on a petition line. */
function canvasser(who) { return !!CAST[who] && !CAST[who].full; }
function someone(who) { return canvasser(who) ? CAST[who].name : CAST[who].g === "f" ? "A woman" : "A man"; }
/* one person outside Westside Market, seen from your table: the call, a tap screen's picture, a portrait. pic: one of their versions (tanya-cart) */
function sceneOne(who, cls, pic) { var n = pic && IMG[pic] ? pic : who; return '<div class="ph one p ' + (cls || "") + '" id="p-' + who + '" data-img="' + n + '" role="img" aria-label="' + esc(someone(who)) + ' outside Westside Market">' + picHtml(n) + '</div>'; }
/* a canvasser and a passerby, for the parts you watch: the canvasser is there, and the passerby walks in from the right */
function sceneTwo(by, who, cls, pic) { var n = "two-" + by + "-" + (pic || who); if (!IMG[n]) n = "two-" + by + "-" + who; return '<div class="ph two p ' + (cls || "") + '" id="p-' + who + '" data-img="' + n + '" role="img" aria-label="' + esc(CAST[by].name + " and " + (canvasser(who) ? CAST[who].name : someone(who).toLowerCase())) + ' outside Westside Market">' + picHtml(n) + '</div>'; }
/* a passerby who walks up (version 8, Robert, Nov 20, 3:51 PM): first the view from above ("a view 30 feet from the sky, where you
   could see where the canvasser is stationed and see the person walking"), then the canvasser's own view down the sidewalk ("the
   vantage point of looking down a sidewalk where they are walking towards you"), then face to face. The canvasser's face never
   shows ("we only see the pedestrian's face"). walkable(who, pic): the walker's own pictures, or null. */
function walkable(who, pic) { var k = pic && IMG["w-" + pic] ? pic : who; return IMG["w-" + k] && IMG["aerial-" + k] && IMG.walkway ? k : null; }
function sceneWalk(who, k) {
  var a = IMG["aerial-" + k].at || [0.5, 0.63];
  return '<div class="ph air" id="air-' + who + '" role="img" aria-label="Westside Market from above: the table out front, and ' + esc(someone(who).toLowerCase()) + ' walking up the sidewalk"><img src="' + imgUrl("aerial-" + k) + '" alt="" decoding="async" style="transform-origin:' + (a[0] * 100).toFixed(1) + '% ' + (a[1] * 100).toFixed(1) + '%"></div>' +
    '<div class="ph pov" id="pov-' + who + '" data-k="' + k + '" role="img" aria-label="' + esc(someone(who)) + ' walking toward you down the sidewalk"><img class="bg" src="' + imgUrl("walkway") + '" alt="" decoding="async"><div class="wk"><img src="' + imgUrl("w-" + k) + '" alt="" decoding="async"></div></div>';
}
/* where a walker is on the sidewalk, u from 0 (far down the walk) to 1 (in front of you): they keep a steady pace, so they grow
   slowly at first and quickly at the end, as anyone walking toward you does */
function walkAt(who, u) {
  var el = document.getElementById("pov-" + who); if (!el) return;
  var wk = el.querySelector(".wk"), k = el.getAttribute("data-k"), m = IMG.walkway, f = IMG["w-" + k], W = el.clientWidth, Hh = el.clientHeight; if (!wk || !W || !Hh) return;
  var s = Math.max(W / m.w, Hh / m.h), ox = (W - m.w * s) / 2, oy = (Hh - m.h * s) * 0.5;
  var z0 = 8, z1 = 1, z = z0 - (z0 - z1) * Math.max(0, Math.min(1, u)), qq = (1 / z - 1 / z0) / (1 / z1 - 1 / z0);
  var fx = (m.far[0] + (m.near[0] - m.far[0]) * qq) * m.w, fy = (m.far[1] + (m.near[1] - m.far[1]) * qq) * m.h, h = 1060 * z1 / z, w = h * f.w / f.h;
  wk.style.width = (w * s).toFixed(1) + "px"; wk.style.height = (h * s).toFixed(1) + "px";
  wk.style.transform = "translate(" + (ox + fx * s - w * s / 2).toFixed(1) + "px," + (oy + fy * s - h * s).toFixed(1) + "px)";
}
/* the storefront with nobody in it yet */
function sceneStore() { return '<div class="ph shop" data-img="store" role="img" aria-label="Westside Market, with your table out front"><div class="fr"><img class="bg" src="' + imgUrl("store") + '" alt="" decoding="async"></div></div>'; }
/* the same person as a small picture on a card: the face, framed whole */
function sceneFace(who) { return '<div class="ph close" id="p-' + who + '" role="img" aria-label="' + esc(someone(who)) + '"><img src="' + imgUrl(who + "-close") + '" alt="" decoding="async"></div>'; }
function face(who) { return '<img class="av" src="' + imgUrl(who + "-av") + '" alt="" decoding="async">'; }
/* a version of a person: the canvasser holding up the sheet, a passerby with an earbud out or the pen in hand */
function showAlt(who, k, on) { [].forEach.call(document.querySelectorAll('.pt[data-who="' + who + '"]'), function (pt) { var any = false; [].forEach.call(pt.querySelectorAll(".alt"), function (a) { var o = !!on && a.classList.contains("alt-" + k); a.classList.toggle("on", o); any = any || o; }); pt.classList.toggle("alton", any); }); }
/* frame each picture: cover, shifted so the face (or the faces) sit near the top third, never past an edge */
function frameOf(el) {
  var m = IMG[el.getAttribute("data-img")], W = el.clientWidth, H = el.clientHeight; if (!m || !m.w || !W || !H) return null;
  var s0 = Math.max(W / m.w, H / m.h), fs = m.face ? [m.face] : m.faces || [];
  var x0 = 1, y0 = 1, x1 = 0, y1 = 0; fs.forEach(function (f) { x0 = Math.min(x0, f[0]); y0 = Math.min(y0, f[1]); x1 = Math.max(x1, f[2]); y1 = Math.max(y1, f[3]); });
  var cx = fs.length ? (x0 + x1) / 2 : 0.5, cy = fs.length ? (y0 + y1) / 2 : 0.3, ft = el.parentElement && el.parentElement.classList.contains("ft") ? el.parentElement : null;
  var ty = el.classList.contains("two") ? 0.3 : ft && ft.querySelector(".dock.haspet") ? 0.2 : 0.27; /* with the petition docked on the call, the face sits higher */
  /* when the picture has no room to move the face up to its place, it is drawn up to a quarter larger so it can */
  var s = s0; if (!el.classList.contains("two") && fs.length && cy * m.h * s0 > H * ty + 1) s = Math.min(s0 * 1.25, Math.max(s0, (H - H * ty) / ((1 - cy) * m.h))); /* never a two-person scene: it would cut someone at the edge */
  var rw = m.w * s, rh = m.h * s;
  return { m: m, fs: fs, rw: rw, rh: rh, ox: Math.min(0, Math.max(W - rw, W * 0.5 - cx * rw)), oy: Math.min(0, Math.max(H - rh, H * ty - cy * rh)) };
}
/* a picture shows once its storefront and its people have loaded, so nobody pops in after the place (the cover's first paint) */
function loadIn() { [].forEach.call(document.querySelectorAll(".ph .fr:not(.ok)"), function (fr) { if (fr.getAttribute("data-w")) return; fr.setAttribute("data-w", "1"); var ims = [].slice.call(fr.querySelectorAll("img.bg, img.cut:not(.alt)")), left = ims.length, done = function () { left -= 1; if (left <= 0) fr.classList.add("ok"); };
  if (!left) { fr.classList.add("ok"); return; } ims.forEach(function (im) { var d = function () { if (im.decode) im.decode().then(done, done); else done(); }; if (im.complete) d(); else { im.addEventListener("load", d, { once: true }); im.addEventListener("error", done, { once: true }); } }); setTimeout(function () { fr.classList.add("ok"); }, 8000); }); } /* shown once every part has loaded and decoded; 8 seconds is only a safety net */
function place() { loadIn(); [].forEach.call(document.querySelectorAll(".ph[data-img]"), function (el) { var f = frameOf(el); if (!f) return; el.style.setProperty("--ox", f.ox.toFixed(1) + "px"); el.style.setProperty("--oy", f.oy.toFixed(1) + "px"); el.style.setProperty("--rw", f.rw.toFixed(1) + "px"); el.style.setProperty("--rh", f.rh.toFixed(1) + "px"); }); }
/* tests: where each face is on screen, for the checks that captions never cover a face */
window.__faces = function () { var out = []; [].forEach.call(document.querySelectorAll(".ph[data-img]"), function (el) { if (el.classList.contains("off") || !el.getClientRects().length) return; var f = frameOf(el); if (!f) return; var r = el.getBoundingClientRect(); f.fs.forEach(function (b) { out.push({ x0: r.left + f.ox + b[0] * f.rw, y0: r.top + f.oy + b[1] * f.rh, x1: r.left + f.ox + b[2] * f.rw, y1: r.top + f.oy + b[3] * f.rh, who: el.id }); }); }); return out; };
/* the lesson's pictures load while its cover is read */
function preloadPics(names) { var seen = {}, urls = {}; names.forEach(function (n) { if (!n || seen[n] || !IMG[n]) return; seen[n] = 1; var m = IMG[n]; if (m.bg) urls[m.bg] = 1; (m.parts || []).forEach(function (p) { urls[p.src] = 1; Object.keys(p.alt || {}).forEach(function (k) { urls[p.alt[k]] = 1; }); if (p.head) { urls["mo-" + p.head] = 1; urls["bl-" + p.head] = 1; } }); if (m.close) { urls[n + "-close"] = 1; urls[n + "-av"] = 1; } if (!m.parts && !m.close) urls[n] = 1; });
  Object.keys(urls).forEach(function (x) { var i = new Image(); i.decoding = "async"; i.src = imgUrl(x); }); }
var PICS = {
  /* behind the table, head down over a phone, while people walk past */
  sit: function () { return '<img src="' + imgUrl("spot-sit") + '" alt="" decoding="async">'; },
  /* in front of the table, board out, facing someone who is walking up */
  stand: function () { return '<img src="' + imgUrl("spot-stand") + '" alt="" decoding="async">'; },
  /* in the middle of the doorway, with people bunched up on both sides */
  doorway: function () { return '<img src="' + imgUrl("spot-doorway") + '" alt="" decoding="async">'; },
  /* a few steps to the side of the door, with the way in clear */
  side: function () { return '<img src="' + imgUrl("spot-side") + '" alt="" decoding="async">'; },
};
/* handwriting always fits its box: the writing shrinks, it is never clipped */
/* ---- pictures for the tap screens: each shows what its question is about, with no words of its own ---- */
/* a top funders sheet and today's date. The sheet carries its real header and gray bars where the funders would be: the app never invents funders. */
/* with no calendar day (version 8), just the sheet: the one a canvasser holds up, coming into their own view */
function sceneSheet(month, day) {
  if (!day) return heldSheet(month);
  var valid = ME.fundersValid + " " + month, bars = [92, 108, 124, 140].map(function (y, i) { return '<rect x="52" y="' + y + '" width="' + [112, 96, 104, 78][i] + '" height="8" rx="4" fill="#DDD6CA"/>'; }).join("");
  return '<svg viewBox="0 0 320 196" preserveAspectRatio="xMidYMid meet" role="img" aria-label="A top funders sheet that says ' + esc(valid) + ', next to a calendar page for ' + esc(day.join(" ")) + '">' +
    '<g transform="rotate(-3 110 98)"><rect x="36" y="20" width="148" height="156" rx="7" fill="#FFFEFA" stroke="#D9D2C4" stroke-width="2"/>' +
    '<text x="110" y="46" text-anchor="middle" font-family="Figtree, sans-serif" font-weight="800" font-size="10.5" letter-spacing=".4" fill="#262320">' + esc(ME.fundersHead) + '</text>' +
    '<rect x="50" y="56" width="120" height="24" rx="5" fill="#FCEFD9" stroke="#E08A1A" stroke-width="1.6"/><text x="110" y="72" text-anchor="middle" font-family="Figtree, sans-serif" font-weight="700" font-size="10.5" fill="#262320">' + esc(valid) + '</text>' + bars + '</g>' +
    '<g><rect x="212" y="46" width="84" height="100" rx="11" fill="#fff" stroke="#D9D2C4" stroke-width="2"/><path d="M212 57 a11 11 0 0 1 11 -11 h62 a11 11 0 0 1 11 11 v19 h-84 z" fill="#C4472F"/>' +
    '<text x="254" y="68" text-anchor="middle" font-family="Figtree, sans-serif" font-weight="800" font-size="11" letter-spacing="1" fill="#fff">' + esc(day[0].toUpperCase()) + '</text>' +
    '<text x="254" y="128" text-anchor="middle" font-family="Newsreader, Georgia, serif" font-weight="600" font-size="46" fill="#262320">' + esc(day[1]) + '</text></g></svg>';
}
function heldSheet(month) {
  var valid = ME.fundersValid + " " + month, bars = [80, 96, 112, 128, 144].map(function (y, i) { return '<rect x="20" y="' + y + '" width="' + [112, 96, 104, 78, 90][i] + '" height="8" rx="4" fill="#DDD6CA"/>'; }).join("");
  return '<svg viewBox="0 0 152 176" role="img" aria-label="The top funders sheet, held up: ' + esc(valid) + '"><rect x="4" y="4" width="144" height="168" rx="8" fill="#FFFEFA" stroke="#D9D2C4" stroke-width="2"/>' +
    '<text x="76" y="30" text-anchor="middle" font-family="Figtree, sans-serif" font-weight="800" font-size="10.5" letter-spacing=".4" fill="#262320">' + esc(ME.fundersHead) + '</text>' +
    '<rect x="16" y="40" width="120" height="24" rx="5" fill="#FCEFD9" stroke="#E08A1A" stroke-width="1.6"/><text x="76" y="56" text-anchor="middle" font-family="Figtree, sans-serif" font-weight="700" font-size="10.5" fill="#262320">' + esc(valid) + '</text>' + bars + '</svg>';
}
/* one canvasser's sheet for an hour: every line gathered, top to bottom, with a green check on each one that counts and a gray stroke through each one thrown out */
function tally(n, good, label) {
  var h = 14 + n * 15, out = "";
  for (var i = 0; i < n; i += 1) {
    var y = 14 + i * 15, ok = i < good;
    out += '<path d="M12 ' + (y + 4) + ' c5 -9 9 -8 9 -1 c0 6 5 -7 9 -2 c3 4 5 -4 9 -1 c4 3 6 -6 11 -1 c3 3 5 -3 8 -1" fill="none" stroke="' + (ok ? "#2A3F8F" : "#B9B1A4") + '" stroke-width="1.6" stroke-linecap="round"/>' +
      (ok ? '<circle cx="78" cy="' + (y + 1) + '" r="5.6" fill="#35B57C"/><path d="M75.200 ' + (y + 1) + ' l2 2.2 l3.800 -4.300" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'
        : '<path d="M9 ' + (y + 1) + ' h54" stroke="#8E867A" stroke-width="1.4" stroke-linecap="round"/>');
  }
  return '<svg viewBox="0 0 92 ' + h + '" preserveAspectRatio="xMidYMin meet" role="img" aria-label="' + esc(label) + '"><rect x="1" y="1" width="90" height="' + (h - 2) + '" rx="7" fill="#FFFEFA" stroke="#D9D2C4" stroke-width="1.5"/>' + out + '</svg>';
}
/* the canvasser's own declaration at the foot of a sheet, three ways: filled in and signed in one hand, left blank, or filled in by somebody else and then signed */
function declPic(kind) {
  var pen = "#2A3F8F", lines = [16, 30, 44].map(function (y) { return '<path d="M10 ' + y + ' h76" stroke="#D9D2C4" stroke-width="1.4"/>'; }).join("") + '<path d="M10 60 h46 M64 60 h22" stroke="#D9D2C4" stroke-width="1.4"/>';
  var hand = function (y, w) { return '<path d="M12 ' + (y - 2) + ' c4 -8 7 -7 7 -1 c0 5 4 -6 8 -2 c3 3 4 -4 8 -1 c3 3 5 -5 9 -1 c3 3 5 -3 8 -1' + (w > 52 ? ' c3 2 5 -4 8 -1 c3 3 4 -3 8 -1' : "") + '" fill="none" stroke="' + pen + '" stroke-width="1.5" stroke-linecap="round"/>'; };
  var block = function (y, n) { var s = ""; for (var i = 0; i < n; i += 1) s += '<rect x="' + (12 + i * 6.4) + '" y="' + (y - 8) + '" width="4" height="6.5" rx=".8" fill="#262320"/>'; return s; };
  var sig = '<path d="M12 57 c5 -10 9 -9 8 -1 c-1 6 6 -7 10 -3 c3 4 5 -5 9 -1 c3 3 5 -2 8 -1" fill="none" stroke="' + pen + '" stroke-width="1.6" stroke-linecap="round"/>', date = '<path d="M66 57 c2 -5 4 -5 5 0 c1 -5 3 -5 4 0 m4 -5 l-3 6" fill="none" stroke="' + pen + '" stroke-width="1.4" stroke-linecap="round"/>';
  var body = kind === "own" ? hand(16, 60) + hand(30, 50) + hand(44, 60) + sig + date : kind === "other" ? block(16, 9) + block(30, 11) + block(44, 7) + sig : "";
  return '<svg class="dpic" viewBox="0 0 96 70" aria-hidden="true"><rect x="1" y="1" width="94" height="68" rx="7" fill="#FFFEFA" stroke="#D9D2C4" stroke-width="1.5"/>' + lines + body + '</svg>';
}
/* how the county checks, as four small pictures: on the voter rolls, in this county, at this address, in this hand */
var CHECK_PICS = [
  '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="14" width="48" height="36" rx="6" fill="#fff" stroke="currentColor" stroke-width="3"/><circle cx="22" cy="28" r="5" fill="currentColor"/><path d="M14 42 c2 -7 14 -7 16 0" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M36 26 h14 M36 34 h14 M36 42 h9" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
  '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 20 l12 -6 l14 5 l16 -7 v34 l-16 7 l-14 -5 l-12 6 z" fill="#fff" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M32 22 c-5 0 -8 3.5 -8 8 c0 6 8 13 8 13 s8 -7 8 -13 c0 -4.500 -3 -8 -8 -8 z" fill="currentColor"/><circle cx="32" cy="30" r="3" fill="#fff"/></svg>',
  '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 30 l22 -18 l22 18" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 28 v24 h32 v-24" fill="#fff" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><rect x="27" y="36" width="10" height="16" rx="1.5" fill="currentColor"/></svg>',
  '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 50 h48" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M10 40 c6 -26 13 -24 11 -4 c-1 12 9 -16 15 -6 c4 7 7 -9 12 -2 c3 5 5 -2 8 -1" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
];
function fitHw() { [].forEach.call(document.querySelectorAll(".box .hw"), function (h) { var n = 0; h.style.fontSize = ""; while (h.scrollWidth > h.clientWidth + 1 && n < 12) { n += 1; h.style.fontSize = (parseFloat(getComputedStyle(h).fontSize) - 1) + "px"; } }); }
/* the practice petition's line. fill: { name, sig, addr, city, zip, other: [boxes in someone else's writing] }; o: { tap, glow: [], marks: {}, top } */
var SIGN = '<svg viewBox="0 0 120 26" aria-label="signed"><path d="M4 18 C10 2 16 2 15 14 C14 24 22 6 27 12 C31 17 33 8 38 12 C42 16 44 9 50 13 C56 17 58 4 64 12 C70 20 76 8 84 13 C92 18 100 10 116 9" fill="none" stroke="#1F3F8F" stroke-width="2.2" stroke-linecap="round"/></svg>';
function pet(fill, o) {
  fill = fill || {}; o = o || {};
  var other = fill.other || [], B = ME.boxes;
  var box = function (k, flex) {
    var v = k === "sig" ? (fill.sig ? SIGN : "") : esc(fill[k] || ""), cls = "box" + ((o.glow || []).indexOf(k) >= 0 ? " glow" : "") + (o.marks && o.marks[k] ? " " + o.marks[k] : "");
    var inner = '<i>' + esc(B[k]) + '</i><span class="hw' + (other.indexOf(k) >= 0 ? " other" : "") + ((o.fresh || []).indexOf(k) >= 0 ? " in" : "") + '">' + v + '</span>';
    return o.tap ? '<button class="' + cls + '" data-box="' + k + '" style="flex:' + flex + '" aria-label="' + esc(B[k]) + '">' + inner + '</button>' : '<div class="' + cls + '" data-box="' + k + '" style="flex:' + flex + '">' + inner + '</div>';
  };
  return '<div class="pet' + (o.big ? " big" : "") + '" id="pet"><div class="pet-h"><div class="pet-t"><span>' + esc(ME.name) + '</span>' + (o.top === false ? "" : '<div class="pet-s">' + esc(ME.summary) + '</div>') + '</div><div class="stamp">' + esc(ME.stamp).replace(". ", ".<br>") + '</div></div>' + /* the stamp sits in the heading, so no box can cover it */
    '<div class="pet-r">' + box("name", 1) + box("sig", 1) + '</div><div class="pet-r">' + box("addr", 1.7) + box("city", 1.05) + box("zip", .62) + '</div>' + (o.note ? '<div class="pn">' + q(o.note) + '</div>' : "") +
    /* a sheet: the next lines, still empty, run on under this one for as far as the screen has room (they take no room of their own) */
    (o.sheet ? '<div class="pet-more" aria-hidden="true">' + [1, 2, 3, 4, 5].map(function () { return '<div class="pet-r"><div class="box" style="flex:1"></div><div class="box" style="flex:1"></div></div><div class="pet-r"><div class="box" style="flex:1.7"></div><div class="box" style="flex:1.05"></div><div class="box" style="flex:.62"></div></div>'; }).join("") + '</div>' : "") + '</div>';
}
