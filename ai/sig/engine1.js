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
/* the coach in writing (rule 68, Robert, Nov 21, 2026: "the only time you ever hear a voice is for an AI voter," tested as version B
   and picked at 12:11 PM: "I like this version B more than version A. Can you make that change throughout the app?"): the coach's
   lines show on screen and are never heard, so the only voices are the people in the scene. A line waits as long as it takes to read
   (700 ms and 270 ms a word, at least 1.4 s), its clock stops while the lesson is paused, and a tap anywhere but a button moves on.
   ?coach=voice brings back the talking coach, only to compare. */
var TEXTC = qs.get("coach") !== "voice", READ = null, CALM = 0;
if (TEXTC) document.documentElement.classList.add("textc");
function readWait(text, r) {
  var n = String(text || "").split(/\s+/).filter(Boolean).length, need = FAST ? HOLD : Math.max(1400, 700 + n * 270), got = 0, last = Date.now();
  return new Promise(function (ok) {
    var t = setInterval(function () { var now = Date.now(); if (!PAUSED) got += now - last; last = now; if (got >= need || r !== RUN) end(); }, FAST ? 5 : 50);
    function end() { clearInterval(t); if (READ === end) READ = null; ok(r === RUN); }
    if (READ) READ(); READ = end;
  });
}
/* with the coach silent, the people in the scene are the only sound, and the first thing a phone plays can come after the mic has been
   on (in A the coach talks first). A guess, after Robert's Nov 21 note that a passerby's words showed but weren't heard on his phone:
   so every tap but the mic's wakes the sound with a blip nobody can hear, as the coach's voice does in A. */
function blip() { try { var a = audio(), b = a.createBuffer(1, Math.ceil(a.sampleRate * 0.12), a.sampleRate), d = b.getChannelData(0); for (var i = 0; i < d.length; i += 1) d[i] = 1e-4; var s = a.createBufferSource(); s.buffer = b; s.connect(a.destination); s.start(); } catch (e) {} }
/* a tap that isn't on a button ends the written line and does nothing else, and for a moment after, another tap can't cut off the
   person who talks next */
if (TEXTC) document.addEventListener("click", function (e) {
  var btn = e.target.closest ? e.target.closest("button, a, input, textarea, select, [data-box]") : null;
  if (!(btn && btn.id === "mic") && !(M && M.rec)) blip(); /* never while the mic is open */
  if (btn) return;
  if (READ) { e.stopPropagation(); READ(); CALM = Date.now() + 900; return; }
  if (Date.now() < CALM) e.stopPropagation();
}, true);
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
  if ((AC.state === "suspended" || AC.state === "interrupted") && !PAUSED) AC.resume(); /* "interrupted": Safari's word for a context the phone stopped (the mic, a call) */
  try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}
  return AC;
}
function fetchClip(clip) { if (clip && !RAW[clip]) RAW[clip] = fetch("audio/" + clip + ".mp3").then(function (r) { if (!r.ok) throw new Error("clip"); return r.arrayBuffer(); }).catch(function () { return null; }); return RAW[clip] || Promise.resolve(null); }
function clipBuf(clip) { if (!BUF[clip]) BUF[clip] = fetchClip(clip).then(function (ab) { if (!ab) return null; return new Promise(function (res) { try { audio().decodeAudioData(ab.slice(0), res, function () { res(null); }); } catch (e) { res(null); } }); }); return BUF[clip]; }
var SKIPPED = false; /* a line was cut off by a tap (Hear it done's parts then land at once) */
function stopSound() { if (READ) READ(); var p = playing; playing = []; if (p.length) SKIPPED = true; p.forEach(function (x) { try { x.s.onended = null; x.s.stop(); } catch (e) {} x.done(false); }); try { speechSynthesis.cancel(); } catch (e) {} lip(null); }
/* live replies (playbook rule 37f; Robert, Nov 21, 2026, 2:11 PM: "Build live replies next. I agree with your one change: whether the
   passerby stops or keeps walking stays tied to how good my opener was"): the grader decides what a passerby does, as always, and the
   AI server writes their words to what the learner said, in their own voice (POST /sig/reply). Anything that doesn't come back in time,
   or comes back as {fallback}, plays the scripted line. ?live=off keeps the scripted lines, only to compare. */
var LIVE = !FAST && qs.get("live") !== "off";
function liveFetch(o, ms) {
  if (!LIVE) return Promise.resolve(null);
  return new Promise(function (res) {
    var done = false, end = function (x) { if (!done) { done = true; res(x); } }, t = setTimeout(function () { end(null); }, ms);
    fetch(AI_URL + "/sig/reply", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(o) })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j || !j.text || !j.audio || done) return null;
        var bin = atob(j.audio), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i += 1) u[i] = bin.charCodeAt(i);
        return new Promise(function (ok) { try { audio().decodeAudioData(u.buffer, function (buf) { ok({ text: j.text, buf: buf }); }, function () { ok(null); }); } catch (e) { ok(null); } });
      })
      .catch(function () { return null; })
      .then(function (x) { clearTimeout(t); end(x); });
  });
}
function playLive(who, lv, r) { lip(who); return playBuf(lv.buf).then(function () { if (r === RUN) lip(null); return r === RUN; }); }
function playBuf(buf) { return new Promise(function (res) { var a = audio(), s = a.createBufferSource(), rec = { s: s, done: res }; s.buffer = buf; s.connect(OUT); s.onended = function () { playing = playing.filter(function (x) { return x !== rec; }); res(true); }; s.start(); playing.push(rec); }); }
function ttsSay(text) { return new Promise(function (res) { try { var u = new SpeechSynthesisUtterance(text); u.rate = 1.02; u.onend = function () { res(true); }; u.onerror = function () { res(false); }; speechSynthesis.speak(u); } catch (e) { setTimeout(function () { res(false); }, 1200); } }); }
function level() { if (!AN) return 0; var d = new Uint8Array(AN.fftSize); AN.getByteTimeDomainData(d); var s = 0; for (var i = 0; i < d.length; i += 1) { var v = (d[i] - 128) / 128; s += v * v; } return Math.sqrt(s / d.length); }
/* say one line of the script: its recorded clip (the phone's own voice only if the clip can't be had), with the speaker's mouth moving */
function sayLine(line, r, onStart) { /* onStart: called as the voice starts (Hear it done's parts are timed from it) */
  if (!line) return Promise.resolve(true);
  if (TEXTC && line.who === "coach") return readWait(line.text, r); /* written, never heard (in fast mode too, so the checks see it) */
  if (FAST) return new Promise(function (ok) { setTimeout(function () { ok(r === RUN); }, HOLD); });
  return clipBuf(line.clip).then(function (buf) {
    if (r !== RUN) return false;
    lip(line.who);
    if (onStart) onStart();
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
     that sounds finished, 2.8 when it could go on or is under three words (SIGG.pauseMs). A tap on the mic ends it at once. Nobody is
     ever cut off: when the phone stops listening on its own partway through a line (iOS does, after a short pause), listening starts
     again and the words so far are kept, so the quiet rule or a tap ends a line (or, at most, a minute's talk, or an error, which still
     sends what was heard) (Robert, Nov 22, 2026, 4:10 PM: "it just cut off
     my voice. I was still talking, unfinished."; playbook rule 34a). */
  var text = "", base = "", changed = 0, done = false, started = 0, again = 0;
  try { if (navigator.audioSession) navigator.audioSession.type = "play-and-record"; } catch (e) {}
  var R = new SR(); R.lang = "en-US"; R.interimResults = true; R.continuous = true; R.maxAlternatives = 1;
  var tick = setInterval(function () { if (done || !text) return; if (performance.now() - changed > SIGG.pauseMs(text)) finish(); }, 50);
  var cap = setTimeout(function () { finish(); }, 60000);
  function end() { done = true; clearInterval(tick); clearTimeout(cap); try { R.onend = null; R.abort(); } catch (e) {} try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {} }
  function finish() { if (done) return; end(); o.onDone(text.trim()); }
  R.onresult = function (e) { var parts = [base]; for (var j = 0; j < e.results.length; j += 1) parts.push(String(e.results[j][0].transcript || "").trim()); var t = parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim(); if (t !== text) { text = t; changed = performance.now(); o.onWords(text); } };
  R.onstart = function () { if (o.onStart) o.onStart(); }; /* listening, after any permission prompt */
  R.onspeechstart = function () { if (text && again < 4) changed = performance.now(); if (o.onSpeech) o.onSpeech(true); }; R.onspeechend = function () { if (o.onSpeech) o.onSpeech(false); }; /* a walking passerby slows while you talk; talking again restarts the quiet clock */
  R.onerror = function (e) { var c = e && e.error; if (c === "no-speech" || c === "aborted") return; if (done) return; if (text) { finish(); return; } /* what was heard is still said (the outside review, Nov 22) */ end(); o.onError(c === "not-allowed" || c === "service-not-allowed" ? "denied" : c === "audio-capture" ? "busy" : "error"); };
  R.onend = function () { /* the phone stopped listening on its own: listen again and keep the words, unless the quiet rule says the line is done */
    if (done) return;
    if (text && performance.now() - changed > SIGG.pauseMs(text)) { finish(); return; }
    if ((!text && performance.now() - started >= 9000) || again >= 30) { finish(); return; }
    base = text; again += 1;
    try { R.start(); } catch (e) { finish(); }
  };
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
function walkable(who, pic) { var k = pic && IMG["w-" + pic] ? pic : who; return IMG["w-" + k] && IMG["w-" + k].stride && IMG["aerial-" + k] && IMG.walkway ? k : null; } /* only walkers drawn walking (rule 69b); anyone else comes face to face, never slid */
function sceneWalk(who, k) {
  var a = IMG["aerial-" + k].at || [0.5, 0.63];
  return '<div class="ph air" id="air-' + who + '" role="img" aria-label="Westside Market from above: the table out front, and ' + esc(someone(who).toLowerCase()) + ' walking up the sidewalk"><img src="' + imgUrl("aerial-" + k) + '" alt="" decoding="async" style="transform-origin:' + (a[0] * 100).toFixed(1) + '% ' + (a[1] * 100).toFixed(1) + '%"></div>' +
    '<div class="ph pov" id="pov-' + who + '" data-k="' + k + '" role="img" aria-label="' + esc(someone(who)) + ' walking toward you down the sidewalk"><img class="bg" src="' + imgUrl("walkway") + '" alt="" decoding="async">' + gait(k) + '</div>';
}
/* a walker walks like a person (rule 69b; Robert, Nov 22, 2026, 4:10 PM, on lesson 2: "the walking is very phony ... Their feet
   are mostly just kind of sliding, and then their feet are moving. It doesn't look natural at all for a person walking down a
   sidewalk."). Before: two pictures of the legs, flipped twice a second while the whole picture slid about 12 meters down the walk in
   3.6 seconds, three times walking speed, so the feet had to slide. Now the legs are drawn as they walk, from the hips down, and the
   walker's own picture lies over them down to where the legs start (ai/tools/sig-pictures/r11_stride.py measures each picture and
   sets each walker's legs, in body heights). The walk is driven by the ground covered: a foot on the ground stays where it landed
   while the body moves over it, the other swings through with its knee bent, the hips ride as high as the planted feet allow (so the
   body rises and falls with each step on its own), the back heel comes up before it leaves the ground and the last step brings the
   feet together. The walk-up covers about 2.4 body heights, about 4 meters, in POV_S: a calm walk of a little over a meter a second. */
var STRIDE = (function () {
  var Z0 = 8; /* the walkway picture's far point is 8 near-distances away (its perspective, below) */
  function proj(m, x, y, z) { var qq = (1 / z - 1 / Z0) / (1 - 1 / Z0), k = 1060 / z; return [(m.far[0] + (m.near[0] - m.far[0]) * qq) * m.w + x * k, (m.far[1] + (m.near[1] - m.far[1]) * qq) * m.h - y * k, k]; }
  function hex(h) { h = String(h).replace("#", ""); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function mix(a, b, t) { var A = hex(a), B = hex(b); return "rgb(" + [0, 1, 2].map(function (i) { return Math.round(A[i] + (B[i] - A[i]) * t); }).join(",") + ")"; }
  var sm = function (t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
  function Dend(o) { return (o.steps - 0.5) * o.step; }
  /* where each foot is, from the ground covered D (0 to Dend): planted feet stay put, so nothing slides */
  function gait(o, D) {
    var s = o.step, N = o.steps, De = Dend(o), dbl = 0.2, H = function (k) { return k * s + s / 2; };
    D = Math.max(0, Math.min(De, D));
    function foot(par) {
      var k = Math.floor(D / s); if ((((k % 2) + 2) % 2) !== par) k -= 1; /* this foot's last strike */
      var last = N - 1, off = (k + 1 + dbl) * s, to = H(k + 2), land = (k + 2) * s;
      if (k + 2 > last) { to = H(last); land = De; } /* the closing step: alongside the other foot, and stop */
      if (k >= last || D < off) return { d: H(Math.min(k, last)), lift: 0, swing: 0 };
      var tau = Math.min(1, (D - off) / Math.max(1e-6, land - off));
      if (tau >= 1) return { d: to, lift: 0, swing: 0 }; /* landed */
      return { d: H(k) + (to - H(k)) * sm(tau), lift: o.lift * Math.sin(Math.PI * tau) * Math.min(1, (to - H(k)) / s), swing: tau };
    }
    var ph = D / s, taper = sm((De - D) / (0.7 * s));
    return { D: D, a: foot(0), b: foot(1), sway: -o.sway * Math.sin(Math.PI * ph) * taper, tilt: 0.008 * Math.sin(Math.PI * ph) * taper, walking: sm((De - D) / (0.5 * s)) };
  }
  /* the knee, bending forward (toward you), for a hip and an ankle in the walking plane (y up, z away) */
  function knee(hy, hz, ay, az, a, b) {
    var dy = ay - hy, dz = az - hz, d = Math.sqrt(dy * dy + dz * dz) || 1e-6, vy = dy / d, vz = dz / d;
    if (d >= a + b - 1e-6) return [hy + vy * a, hz + vz * a];
    var al = Math.acos(Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d))));
    return [hy + a * (vy * Math.cos(al) - vz * Math.sin(al)), hz + a * (vy * Math.sin(al) + vz * Math.cos(al))];
  }
  /* the whole body's place at u (0 to 1 of the walk-up): hips, knees, ankles and soles on the walkway picture, in its pixels.
     The hips ride as high as the planted feet allow, a little lower while walking (soft knees), so the body rises and falls with each
     step. A back foot's heel comes up before it leaves the ground, pivoting on its toe, so its sole stays down. Someone pushing a cart
     walks a little behind the picture's plane, so their feet stay behind its wheels, and their body and the cart rise and fall less. */
  function pose(m, f, o, u) {
    var De = Dend(o), z0 = 1 + De, g = gait(o, Math.max(0, Math.min(1, u)) * De), zp = z0 - g.D, sy = (f.h - o.split) / f.h;
    var top = o.hipY, len = top - o.ankle, a = len * o.thigh, b = len - a, reach = len * 0.999, bk = o.back || 0, zl = zp + bk;
    var fx = Math.max(o.footX, 0.5 * o.shoeW + 0.004); /* each foot keeps one line across the walk, wide enough that the shoes never merge into one slab */
    var feet = [[-1, g.a], [1, g.b]].map(function (q) { return { side: q[0], ft: q[1], fz: z0 - q[1].d + bk }; });
    var rest = top - o.soft * g.walking, hy = rest;
    feet.forEach(function (ft) { if (ft.ft.swing) return; var dz = ft.fz - zl; hy = Math.min(hy, o.ankle + (dz > 0 ? o.heel : 0) + Math.sqrt(Math.max(0, reach * reach - dz * dz))); });
    var hx = g.sway, legs = feet.map(function (ft) {
      var dz = ft.fz - zl, ay = o.ankle + ft.ft.lift, need = hy - Math.sqrt(Math.max(0, reach * reach - dz * dz)), heel = 0;
      if (!ft.ft.swing) { ay = Math.max(ay, Math.min(o.ankle + o.heel, need)); heel = (ay - o.ankle) / Math.max(1e-6, o.heel); }
      var hipX = hx + ft.side * o.hipX, ax = ft.side * fx, kn = knee(hy, zl, ay, ft.fz, a, b); /* the sway moves the body, never a planted foot */
      return { side: ft.side, fz: ft.fz, heel: Math.max(0, Math.min(1, heel)), planted: !ft.ft.swing, lift: ft.ft.lift,
        hip: proj(m, hipX, hy, zl), knee: proj(m, hipX * 0.4 + ax * 0.6, kn[0], kn[1]), ankle: proj(m, ax, ay, ft.fz),
        sole: proj(m, ax, ft.ft.lift, ft.fz) }; /* the sole: on the ground when planted (a raised heel pivots on the toe) */
    });
    var drawnY = o.bobScale != null ? rest - (rest - hy) * o.bobScale : hy;
    return { g: g, zp: zp, zl: zl, hy: hy, hx: hx, sy: sy, legs: legs, crotch: proj(m, hx, drawnY - o.hipY + sy - 0.035, zl), hipW: 2 * o.hipX + o.wHip, /* the crotch rides with the picture's cut */
      body: proj(m, hx, drawnY - (o.hipY - sy), zp), ground: function (x, z) { return proj(m, x, 0, z); } };
  }
  var nrm = function (p, q) { var dx = q[0] - p[0], dy = q[1] - p[1], L = Math.sqrt(dx * dx + dy * dy) || 1; return [-dy / L, dx / L]; };
  /* a trouser leg: hip, knee and hem as one smooth shape, its middle line moved across by `off` of its width */
  function leg(ctx, P, K, A, w0, w1, w2, off) {
    off = off || 0;
    var n1 = nrm(P, K), n2 = nrm(K, A), nk = [n1[0] + n2[0], n1[1] + n2[1]], l = Math.sqrt(nk[0] * nk[0] + nk[1] * nk[1]) || 1;
    nk = [nk[0] / l, nk[1] / l]; var h1 = w1 / 2 * Math.min(1.4, 1 / Math.max(0.5, nk[0] * n1[0] + nk[1] * n1[1]));
    var c = function (p, n, w) { return [p[0] + n[0] * w * off, p[1] + n[1] * w * off]; }, P2 = c(P, n1, w0), K2 = c(K, nk, w1), A2 = c(A, n2, w2);
    ctx.beginPath();
    ctx.moveTo(P2[0] + n1[0] * w0 / 2, P2[1] + n1[1] * w0 / 2); ctx.lineTo(K2[0] + nk[0] * h1, K2[1] + nk[1] * h1); ctx.lineTo(A2[0] + n2[0] * w2 / 2, A2[1] + n2[1] * w2 / 2);
    ctx.lineTo(A2[0] - n2[0] * w2 / 2, A2[1] - n2[1] * w2 / 2); ctx.lineTo(K2[0] - nk[0] * h1, K2[1] - nk[1] * h1); ctx.lineTo(P2[0] - n1[0] * w0 / 2, P2[1] - n1[1] * w0 / 2); ctx.closePath();
  }
  /* a shoe seen from the front: its sole on the ground at yb; a raised heel tips it up, so it shows taller */
  function shoe(ctx, o, x, yb, k, col, sole, heel) {
    var w = o.shoeW * k, h = o.shoeH * k * (1 + 0.45 * heel), low = o.style === "flat";
    ctx.beginPath(); ctx.moveTo(x - w * 0.5, yb - h * 0.32);
    ctx.bezierCurveTo(x - w * 0.54, yb - h * (low ? 0.9 : 1.08), x + w * 0.54, yb - h * (low ? 0.9 : 1.08), x + w * 0.5, yb - h * 0.32);
    ctx.quadraticCurveTo(x + w * 0.5, yb, x + w * 0.36, yb); ctx.lineTo(x - w * 0.36, yb); ctx.quadraticCurveTo(x - w * 0.5, yb, x - w * 0.5, yb - h * 0.32); ctx.closePath();
    ctx.fillStyle = col; ctx.fill();
    ctx.save(); ctx.clip();
    if (o.style === "sneaker" || o.style === "lace") { /* the laces: a short darker panel down the middle of the top */
      ctx.fillStyle = o.style === "sneaker" ? "rgba(120,120,120,0.35)" : "rgba(0,0,0,0.25)"; ctx.beginPath(); ctx.ellipse(x, yb - h * 0.86, w * 0.13, h * 0.2, 0, 0, 2 * Math.PI); ctx.fill();
    }
    ctx.fillStyle = o.shoeHi || "#ffffff"; ctx.globalAlpha = 0.45; ctx.beginPath(); ctx.ellipse(x - w * 0.12, yb - h * 0.55, w * 0.2, h * 0.14, -0.2, 0, 2 * Math.PI); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = sole; ctx.fillRect(x - w, yb - h * o.soleH, 2 * w, h); ctx.restore();
    if (o.edge) { ctx.strokeStyle = o.edge; ctx.lineWidth = Math.max(0.6, 0.0016 * k); ctx.stroke(); }
  }
  /* the grain of the pictures' printed look (rule 67), laid over the drawn legs; it moves and grows with the walker */
  var GRAIN = null;
  function grain(ctx) {
    if (!GRAIN) { var c = document.createElement("canvas"); c.width = c.height = 96; var g = c.getContext("2d"), seed = 7, rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (var i = 0; i < 260; i += 1) { g.fillStyle = rnd() < 0.5 ? "rgba(255,255,255,0.20)" : "rgba(0,0,0,0.16)"; g.fillRect(Math.floor(rnd() * 96), Math.floor(rnd() * 96), 1, 1); }
      GRAIN = ctx.createPattern(c, "repeat"); }
    return GRAIN;
  }
  /* the walker's picture down to where the legs start, its last rows fading over the drawn hips; patch: spots of the picture's own
     trouser color laid over a painted detail that would end at the cut (Dwayne's fly) */
  function topOf(img, f, o) {
    if (img.__top) return img.__top;
    var c = document.createElement("canvas"); c.width = f.w; c.height = o.split + 1; var g = c.getContext("2d");
    g.drawImage(img, 0, 0, f.w, o.split + 1, 0, 0, f.w, o.split + 1);
    (o.patch || []).forEach(function (q) { var pg = g.createRadialGradient((q[0] + q[2]) / 2, (q[1] + q[3]) / 2, 0, (q[0] + q[2]) / 2, (q[1] + q[3]) / 2, Math.max(q[2] - q[0], q[3] - q[1]) / 2);
      pg.addColorStop(0, q[4]); pg.addColorStop(0.7, q[4]); pg.addColorStop(1, "rgba(0,0,0,0)"); g.save(); g.globalCompositeOperation = "source-atop"; g.fillStyle = pg; g.fillRect(q[0] - 4, q[1] - 4, q[2] - q[0] + 8, q[3] - q[1] + 8); g.restore(); });
    var gr = g.createLinearGradient(0, o.split + 1 - o.fade, 0, o.split + 1); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,1)");
    g.globalCompositeOperation = "destination-out"; g.fillStyle = gr; g.fillRect(0, o.split + 1 - o.fade, f.w, o.fade);
    return (img.__top = c);
  }
  /* one frame on the walkway's canvas: m the walkway, f and img the walker's picture, front the cart's legs (or null), o the walker's
     stride, u how far along the walk-up (0 to 1) */
  function draw(cv, m, f, img, front, o, u) {
    var W = cv.clientWidth, Hh = cv.clientHeight; if (!W || !Hh) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1), ctx = cv.getContext("2d");
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(Hh * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(Hh * dpr); }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
    if (!img.complete || !img.naturalWidth) return;
    var s = Math.max(W / m.w, Hh / m.h), ox = (W - m.w * s) / 2, oy = (Hh - m.h * s) * 0.5;
    ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);
    var P = pose(m, f, o, u), legs = P.legs.slice().sort(function (p, q) { return q.fz - p.fz; }); /* the farther leg first */
    /* the hips under the picture's fade: the trousers' own color down to the crotch, so the legs part where trousers do */
    var hipL = legs[0].hip, hipR = legs[1].hip, hw = P.hipW * P.crotch[2] / 2, cx = P.crotch[0], cy = P.crotch[1];
    if (o.hips !== false) { ctx.beginPath(); ctx.moveTo(cx - hw, Math.min(hipL[1], hipR[1])); ctx.lineTo(cx + hw, Math.min(hipL[1], hipR[1])); ctx.lineTo(cx + hw * 0.92, cy - 0.02 * P.crotch[2]);
    ctx.quadraticCurveTo(cx, cy + 0.03 * P.crotch[2], cx - hw * 0.92, cy - 0.02 * P.crotch[2]); ctx.closePath(); ctx.fillStyle = o.color; ctx.fill(); } /* not for the cart: her hips are behind its basket */
    legs.forEach(function (lg, i) {
      var t = sm(0.5 + (lg.fz - legs[1 - i].fz) / (0.5 * o.step)), dark = function (h) { return mix(h, "#000000", t * 0.22); };
      shoe(ctx, o, lg.ankle[0], lg.sole[1], lg.sole[2], dark(o.shoe), dark(o.sole), lg.heel);
      var hem = o.crop ? [lg.knee[0] + (lg.ankle[0] - lg.knee[0]) * o.crop, lg.knee[1] + (lg.ankle[1] - lg.knee[1]) * o.crop] : [lg.ankle[0], lg.ankle[1] + o.over * lg.ankle[2]];
      if (o.crop) { var sw = o.wSkin * lg.ankle[2]; leg(ctx, hem, [(hem[0] + lg.ankle[0]) / 2, (hem[1] + lg.ankle[1]) / 2], [lg.ankle[0], lg.ankle[1] + 0.012 * lg.ankle[2]], sw, sw, sw); ctx.fillStyle = dark(o.skin); ctx.fill(); }
      /* the leg's color: the picture's own trousers down to below the crotch, then darker toward the hem when this leg is behind */
      var L = Math.max(1, hem[1] - lg.hip[1]), t0 = Math.max(0, Math.min(0.9, (cy - lg.hip[1]) / L)), gr = ctx.createLinearGradient(lg.hip[0], lg.hip[1], hem[0], hem[1]);
      gr.addColorStop(0, o.color); gr.addColorStop(t0, o.color); gr.addColorStop(t0 + (1 - t0) * 0.35, mix(o.color, o.shade, t * 0.4)); gr.addColorStop(1, mix(o.color, o.shade, t));
      leg(ctx, lg.hip, lg.knee, hem, o.wHip * lg.hip[2], o.wKnee * lg.knee[2], o.wHem * lg.ankle[2]); ctx.fillStyle = gr; ctx.fill();
      /* a soft shadow down the inner side, so the trouser leg is round, not flat */
      var top = [lg.hip[0] + (lg.knee[0] - lg.hip[0]) * 0.3, Math.max(lg.hip[1], cy)], ig = ctx.createLinearGradient(top[0], top[1], lg.knee[0], lg.knee[1]);
      ig.addColorStop(0, "rgba(0,0,0,0)"); ig.addColorStop(1, "rgba(0,0,0,0.08)");
      leg(ctx, top, lg.knee, hem, o.wHip * 0.32 * lg.hip[2], o.wKnee * 0.32 * lg.knee[2], o.wHem * 0.32 * lg.ankle[2], 0.34 * lg.side); ctx.fillStyle = ig; ctx.fill();
      if (o.cuff) { var up = [hem[0] + (lg.knee[0] - hem[0]) * 0.1, hem[1] + (lg.knee[1] - hem[1]) * 0.1], cw = o.wHem * 1.1 * lg.ankle[2]; leg(ctx, up, [(up[0] + hem[0]) / 2, (up[1] + hem[1]) / 2], hem, cw, cw, cw); ctx.fillStyle = mix(o.cuff, o.shade, t * 0.7); ctx.fill(); }
    });
    var bodyScale = P.body[2] / f.h, gx = (P.body[0] * s + ox) * dpr, gy = (P.body[1] * s + oy) * dpr, pat = grain(ctx);
    if (pat.setTransform && window.DOMMatrix) pat.setTransform(new DOMMatrix().translateSelf(gx, gy).scaleSelf(Math.max(0.5, bodyScale * s * dpr)));
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = "source-atop"; ctx.fillStyle = pat; ctx.fillRect(0, 0, cv.width, cv.height); ctx.restore();
    /* shadows behind: a contact shadow under each planted foot, and a faint one under the body */
    ctx.save(); ctx.globalCompositeOperation = "destination-over";
    legs.forEach(function (lg) { var gp = P.ground(0, lg.fz), k = lg.sole[2], a = lg.planted ? 0.16 : Math.max(0, 0.16 - lg.lift * 3); ctx.fillStyle = "rgba(70,45,20," + a.toFixed(3) + ")"; ctx.beginPath(); ctx.ellipse(lg.ankle[0], gp[1] - 0.002 * k, o.shoeW * 0.62 * k, 0.012 * k, 0, 0, 2 * Math.PI); ctx.fill(); });
    var c = P.ground(P.hx, P.zl); ctx.fillStyle = "rgba(70,45,20,0.05)"; ctx.beginPath(); ctx.ellipse(c[0], c[1] - 0.004 * c[2], 0.09 * c[2], 0.016 * c[2], 0, 0, 2 * Math.PI); ctx.fill();
    ctx.restore();
    /* the body: the picture down to where the legs start, at the hips' place, leaning a touch with each step */
    var sc = bodyScale, ax0 = o.hipCx * sc, ay0 = o.split * sc;
    ctx.save(); ctx.translate(P.body[0], P.body[1]); if (o.bobScale == null) ctx.rotate(P.g.tilt);
    ctx.drawImage(topOf(img, f, o), 0, 0, f.w, o.split + 1, -ax0, -ay0, f.w * sc, (o.split + 1) * sc);
    if (front && front.complete && front.naturalWidth) ctx.drawImage(front, 0, o.split, f.w, f.h - o.split, -ax0, 0, f.w * sc, (f.h - o.split) * sc); /* the cart's legs, in front of hers */
    ctx.restore();
  }
  return { draw: draw, gait: gait, pose: pose, Dend: Dend };
})();
function gait(k) { /* the walker's canvas, and their picture for it (rule 69b) */
  var f = IMG["w-" + k], st = f && f.stride; if (!st) return "";
  return '<canvas class="stride" aria-hidden="true"></canvas><img class="wsrc" src="' + imgUrl("w-" + k) + '" alt="" hidden>' + (st.front ? '<img class="wfront" src="' + imgUrl(st.front) + '" alt="" hidden>' : "");
}
/* where a walker is on the sidewalk, u from 0 (down the walk) to 1 (in front of you) */
function walkAt(who, u) {
  var el = document.getElementById("pov-" + who); if (!el) return;
  var k = el.getAttribute("data-k"), f = IMG["w-" + k], cv = el.querySelector("canvas.stride");
  if (cv && f && f.stride) STRIDE.draw(cv, IMG.walkway, f, el.querySelector("img.wsrc"), el.querySelector("img.wfront"), f.stride, u);
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
  /* behind the table, sitting on the stool and watching the passersby walk up (version 10: the one difference from "stand" is sitting) */
  sit: function () { return '<img src="' + imgUrl("spot-sit") + '" alt="" decoding="async">'; },
  /* in front of the table, board out, facing someone who is walking up; the same stool behind the table */
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
      (ok ? '<circle cx="78" cy="' + (y + 1) + '" r="5.6" fill="#16C79A"/><path d="M75.200 ' + (y + 1) + ' l2 2.2 l3.800 -4.300" fill="none" stroke="#0E2F2B" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' /* the check is Warmup's mark, not the sheet's: mint with a pine check (version 12) */
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
