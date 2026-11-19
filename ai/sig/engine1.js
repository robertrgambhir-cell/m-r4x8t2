/* ---------------- the page's core: words, sound, listening and the pictures ---------------- */
var ST = DATA.st, SH = DATA.shared, ME = DATA.measure, CAST = DATA.cast;
var qs = new URLSearchParams(location.search);
var LN = qs.get("l") === "card" ? 0 : Math.max(1, Math.min(5, parseInt(qs.get("l"), 10) || 2));
var L = DATA.lessons[LN] || null;
var PRACTICE = qs.has("practice"); /* a practice round on one lesson's must, opened from lesson 5's last screen */
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
var tidy = function (t) { t = String(t || "").trim(); if (!t) return ""; t = t.charAt(0).toUpperCase() + t.slice(1); return /[.!?]$/.test(t) ? t : t + "."; }; /* a spoken line gets a capital and a period, never changed words */
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
/* the mouths: every recorded line moves its speaker's mouth from its own sound */
var MOUTH = { neutral: "M151.5 164 Q160 169 168.5 164", smile: "M150 162 Q160 172.5 170 162", flat: "M152 166.5 L168 163.5", open: "M151.5 162.5 Q160 176 168.5 162.5 Q160 165.5 151.5 162.5 Z", mid: "M153.5 163.5 Q160 170.5 166.5 163.5 Q160 165.5 153.5 163.5 Z", o: "M160 159.5 C163.6 159.5 165 162.6 165 165.6 C165 168.6 163 171 160 171 C157 171 155 168.6 155 165.6 C155 162.6 156.4 159.5 160 159.5 Z" };
var REST = {}; /* each person's resting mouth */
function setMouth(el, k) { if (!el) return; el.setAttribute("d", MOUTH[k]); el.setAttribute("fill", k === "open" || k === "mid" || k === "o" ? "#45261F" : "none"); }
function lip(who) { if (lipEl) setMouth(lipEl.el, REST[lipEl.who] || "neutral"); var el = who ? document.querySelector("#p-" + who + " .mouth") : null; lipEl = el ? { el: el, who: who } : null;
  [].forEach.call(document.querySelectorAll(".ph.talking"), function (e) { e.classList.remove("talking"); }); var pe = who && document.querySelector(".ph#p-" + who); if (pe) pe.classList.add("talking"); }
(function loop() { if (lipEl && !PAUSED) { var lv = level(); setMouth(lipEl.el, lv > 0.09 ? "open" : lv > 0.03 ? "mid" : REST[lipEl.who] || "neutral"); } requestAnimationFrame(loop); })();
function expr(who, e) { var p = $("#p-" + who); if (!p) return; p.classList.remove("warm", "surprised", "busy"); if (p.classList.contains("ph") && e === "surprised" && pv(who).indexOf("turned") >= 0) p.classList.add("turned"); if (e && e !== "neutral") p.classList.add(e); REST[who] = { warm: "smile", busy: "flat", surprised: "o" }[e] || "neutral"; if (!lipEl || lipEl.who !== who) setMouth(p.querySelector(".mouth"), REST[who]); }

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
  R.onerror = function (e) { var c = e && e.error; if (c === "no-speech" || c === "aborted") return; if (done) return; end(); o.onError(c === "not-allowed" || c === "service-not-allowed" ? "denied" : c === "audio-capture" ? "busy" : "error"); };
  R.onend = function () { if (done) return; if (text) { finish(); return; } if (performance.now() - started < 9000) { try { R.start(); } catch (e) { finish(); } return; } finish(); }; /* iOS ends a quiet session on its own */
  try { R.start(); started = performance.now(); } catch (e) { end(); setTimeout(function () { o.onError("error"); }, 0); }
  return { stop: finish, abort: end };
}

/* ---------------- the pictures: the app's cartoon people, at Westside Market ---------------- */
var LOOKS = {
  lena: { skin: "#A86B45", shade: "#8A5433", style: "long", hair: "#1F1512", shirt: "#5A3E99", shirtShade: "#48317C", pants: "#2F3A52", badge: true, board: true },
  rico: { skin: "#D9A27C", shade: "#B98261", style: "short", hair: "#2A1B14", shirt: "#5A3E99", shirtShade: "#48317C", pants: "#2F3A52", badge: true, board: true },
  ben: { skin: "#F0C9A8", shade: "#D5A884", style: "short", hair: "#6B4A2E", shirt: "#3F5F7A", shirtShade: "#324D64", beard: true, prop: "coffee" },
  tanya: { skin: "#7B4C33", shade: "#5F3924", style: "bob", hair: "#1E1714", shirt: "#C2603F", shirtShade: "#A04D31", prop: "cart" },
  dwayne: { skin: "#8E5B3E", shade: "#714630", style: "bald", hair: "#4A4541", shirt: "#6B7A4F", shirtShade: "#56633F", beard: true },
  hank: { skin: "#EBC4A4", shade: "#CFA583", style: "short", hair: "#B9B5AE", shirt: "#7E5B47", shirtShade: "#664837", pants: "#6F685F", glasses: true, prop: "paper" },
  soojin: { skin: "#EDC7A6", shade: "#D0A684", style: "bob", hair: "#6A6562", shirt: "#7A9A6B", shirtShade: "#627F55", prop: "tote" },
  kayla: { skin: "#C68E66", shade: "#A6714C", style: "long", hair: "#2B1D16", shirt: "#E0A23C", shirtShade: "#BE8730", prop: "buds" },
  luis: { skin: "#C98A5E", shade: "#A96E45", style: "short", hair: "#17110E", shirt: "#F2EEE6", shirtShade: "#D9D3C7", prop: "apron" },
  marisol: { skin: "#D9A27C", shade: "#B98261", style: "bob", hair: "#2A1B14", shirt: "#3E9A93", shirtShade: "#2F7D77", pants: "#3E9A93", vneck: true, badge: true },
  ines: { skin: "#E2B08C", shade: "#C48F6B", style: "long", hair: "#4A2F1F", shirt: "#9A5B7A", shirtShade: "#7D4862", prop: "stroller" },
  bob: { skin: "#F1D2B8", shade: "#D4B094", style: "bald", hair: "#C9C5BE", shirt: "#55708A", shirtShade: "#435A70", glasses: true },
  anika: { skin: "#B07A55", shade: "#93613F", style: "long", hair: "#1A1411", shirt: "#B5476B", shirtShade: "#953755", prop: "bags" },
  joan: { skin: "#F0CDB0", shade: "#D3AD8E", style: "bob", hair: "#A8A29A", shirt: "#4A5568", shirtShade: "#3A4352", glasses: true },
  karim: { skin: "#C99470", shade: "#A9774F", style: "short", hair: "#15110F", shirt: "#2F5D50", shirtShade: "#244A40", beard: true },
  pat: { skin: "#E9B995", shade: "#CB9370", style: "bob", hair: "#D8D4CC", shirt: "#7F6AA3", shirtShade: "#68568A", glasses: true },
  theo: { skin: "#6E4430", shade: "#56331F", style: "short", hair: "#17110E", shirt: "#4C6A8F", shirtShade: "#3D5776" },
  carmen: { skin: "#D8A47F", shade: "#B9845F", style: "bob", hair: "#3A2C26", shirt: "#B5654B", shirtShade: "#954F39" },
};
function figure(p) { /* the app's person (wdpfxqlsvp/app.html, figure()), drawn the same way */
  var back = { bob: '<path d="M128 152 C124 114 142 104 160 104 C178 104 196 114 192 152 C193 166 195 177 197 185 C187 188 182 178 182 166 L138 166 C138 178 133 188 123 185 C125 177 127 166 128 152 Z" fill="' + p.hair + '"/>', long: '<path d="M126 150 C122 110 142 100 160 100 C178 100 198 110 194 150 L199 216 C189 217 184 198 182 172 L138 172 C136 198 131 217 121 216 Z" fill="' + p.hair + '"/>', puff: '<circle cx="147" cy="106" r="12" fill="' + p.hair + '"/><circle cx="173" cy="106" r="12" fill="' + p.hair + '"/><circle cx="160" cy="97" r="15" fill="' + p.hair + '"/>' }[p.style] || "";
  var cap = '<path d="M133.5 135 C134 115 147 108 160 108 C174 108 187 116 186.5 136 C181 125 171 120 160 120 C150 120 140 125 133.5 135 Z" fill="' + p.hair + '"/>';
  var front = { bob: cap, long: cap, puff: '<path d="M134 138 C133 116 146 108 160 108 C174 108 187 116 186 138 C181 126 171 121 160 121 C149 121 139 126 134 138 Z" fill="' + p.hair + '"/>', bald: '<path d="M135 142 C134 131 137 124 142 120" fill="none" stroke="' + p.hair + '" stroke-width="5" stroke-linecap="round"/><path d="M185 142 C186 131 183 124 178 120" fill="none" stroke="' + p.hair + '" stroke-width="5" stroke-linecap="round"/>', short: '<path d="M134 134 C134 114 147 108 160 108 C173 108 186 114 186 134 C181 123 171 118.5 160 118.5 C149 118.5 139 123 134 134 Z" fill="' + p.hair + '"/>' }[p.style] || "";
  var beard = p.beard ? '<path d="M136.5 148 C137.5 167 148 177.5 160 177.5 C172 177.5 182.5 167 183.5 148 C178.5 158 170.5 162.5 160 162.5 C149.5 162.5 141.5 158 136.5 148 Z" fill="' + p.hair + '"/>' : "";
  var light = /^#(?:[A-D][0-9A-F]){3}$/i.test(p.hair) || p.hair === "#6A6562";
  return '<g class="fig">' + back +
    '<path d="M107 306 H213 L209 456 H167 L160 352 L153 456 H111 Z" fill="' + (p.pants || "#3B3631") + '"/><rect x="103" y="452" width="54" height="13" rx="6.5" fill="#262320"/><rect x="163" y="452" width="54" height="13" rx="6.5" fill="#262320"/>' + /* a whole person when the picture is tall: legs and shoes below the shirt */
    '<path d="M102 320 V218 C102 201 110 193 124 190 L148 185.5 Q160 191 172 185.5 L196 190 C210 193 218 201 218 218 V320 Q160 328 102 320 Z" fill="' + p.shirt + '"/><path d="M122 214 C119 250 119 290 121 318 M198 214 C201 250 201 290 199 318" fill="none" stroke="#000" stroke-opacity="0.14" stroke-width="2.5" stroke-linecap="round"/>' +
    (p.vneck ? '<path d="M147 192 L160 208 L173 192" fill="none" stroke="' + p.shirtShade + '" stroke-width="2.6" stroke-linejoin="round"/>' : "") +
    (p.badge ? '<rect x="178" y="207" width="12" height="16" rx="2" fill="#FCF8F2" stroke="' + p.shirtShade + '" stroke-width="1.5"/>' : "") +
    (p.strap ? '<path d="M137 197 L157 260" stroke="' + p.strap + '" stroke-width="6" stroke-linecap="round"/>' : "") +
    '<rect x="151" y="164" width="18" height="32" rx="7" fill="' + p.shade + '"/>' + (p.vneck ? "" : '<path d="M138 188 Q160 197 182 188 L186 202 H134 Z" fill="' + p.shirt + '"/><path d="M143 188.5 Q160 197.5 177 188.5" fill="none" stroke="#000" stroke-opacity="0.13" stroke-width="2" stroke-linecap="round"/>') +
    '<ellipse cx="134" cy="143" rx="4.6" ry="7" fill="' + p.shade + '"/><ellipse cx="186" cy="143" rx="4.6" ry="7" fill="' + p.shade + '"/><ellipse cx="160" cy="140" rx="26" ry="30" fill="' + p.skin + '"/>' + beard + front +
    '<g stroke="' + (light ? "#6E6B66" : "#241A16") + '" stroke-width="2.6" stroke-linecap="round"><path class="brow brow-l" d="M143 129.8 Q149 128.2 155 130"/><path class="brow brow-r" d="M165 130 Q171 128.2 177 129.8"/></g>' +
    '<g class="eyes"><ellipse cx="150" cy="142" rx="2.7" ry="3.3" fill="#1C1A24"/><ellipse cx="170" cy="142" rx="2.7" ry="3.3" fill="#1C1A24"/></g>' +
    (p.glasses ? '<g fill="none" stroke="#3A302A" stroke-width="1.8"><circle cx="150" cy="142" r="7"/><circle cx="170" cy="142" r="7"/><path d="M157 141.5 Q160 139.5 163 141.5 M143 141 L135 139 M177 141 L185 139"/></g>' : "") +
    '<path d="M160 146 Q157 154 161.5 156.5" fill="none" stroke="' + p.shade + '" stroke-width="2" stroke-linecap="round"/>' +
    '<path class="mouth" d="' + MOUTH.neutral + '" fill="none" stroke="#45261F" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></g>' + props(p);
}
function props(p) {
  var hand = function (x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="8" fill="' + p.skin + '"/>'; };
  var o = "";
  if (p.board) o += '<g class="prop board"><rect x="172" y="226" width="50" height="64" rx="4" fill="#8A6A45"/><rect x="176" y="233" width="42" height="53" rx="1" fill="#FFFEFA"/><rect x="187" y="222" width="20" height="8" rx="2.5" fill="#5B554D"/><path d="M181 244 H213 M181 252 H213 M181 260 H206 M181 270 H213" stroke="#C9C1B3" stroke-width="2"/>' + hand(174, 262) + '</g>' +
    '<g class="prop sheet hid"><rect x="92" y="212" width="46" height="60" rx="2" fill="#fff" stroke="#C9C1B3" stroke-width="1.5"/><rect x="96" y="217" width="38" height="8" fill="#262320"/><path d="M97 233 H133 M97 241 H133 M97 249 H127" stroke="#C9C1B3" stroke-width="4"/>' + hand(116, 268) + '</g>';
  if (p.prop === "coffee") o += '<g><rect x="186" y="222" width="22" height="30" rx="4" fill="#FFFDF9"/><rect x="185" y="217" width="24" height="7" rx="2.5" fill="#6B4A2E"/><rect x="186" y="231" width="22" height="10" fill="#C9A27A"/>' + hand(190, 248) + '</g>';
  if (p.prop === "paper") o += '<g transform="rotate(-6 100 262)"><rect x="88" y="236" width="24" height="58" rx="2" fill="#F4F1EA" stroke="#C9C1B3" stroke-width="1.5"/><path d="M92 244 H108 M92 251 H108 M92 258 H108 M92 265 H102" stroke="#9B9389" stroke-width="2"/></g><path d="M102 222 V300" stroke="' + p.shirtShade + '" stroke-width="5" stroke-linecap="round"/>';
  if (p.prop === "tote") o += '<path d="M113 196 L108 256 M126 193 L131 256" fill="none" stroke="#C9B48A" stroke-width="5" stroke-linecap="round"/><rect x="96" y="252" width="48" height="64" rx="5" fill="#D9C79E"/><path d="M104 268 H136" stroke="#C9B48A" stroke-width="3" stroke-linecap="round"/>';
  if (p.prop === "buds") o += '<g class="buds"><circle cx="134" cy="147" r="3.4" fill="#fff"/><path d="M134 150 V158" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><g class="prop bud-r"><circle cx="186" cy="147" r="3.4" fill="#fff"/><path d="M186 150 V158" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></g></g>';
  if (p.prop === "apron") o += '<path d="M141 192 L147 216 M179 192 L173 216" stroke="#2F3A44" stroke-width="4" stroke-linecap="round"/><path d="M142 214 H178 L184 372 H136 Z" fill="#2F3A44"/><rect x="151" y="238" width="18" height="14" rx="2" fill="none" stroke="#4A5661" stroke-width="2"/>';
  if (p.prop === "cart") o += '<g><rect x="88" y="270" width="144" height="9" rx="4.5" fill="#9AA3AD"/><path d="M96 279 V420 M224 279 V420 M128 279 V420 M160 279 V420 M192 279 V420 M92 348 H228 M92 420 H228" stroke="#B7BFC7" stroke-width="3" fill="none"/><circle cx="104" cy="448" r="11" fill="#5B6B6A"/><circle cx="216" cy="448" r="11" fill="#5B6B6A"/><g class="kid"><circle cx="116" cy="252" r="15" fill="#8A5A3F"/><path d="M101 250 C101 236 131 236 131 250 C126 243 106 243 101 250 Z" fill="#1E1714"/><circle cx="111" cy="254" r="1.8" fill="#1C1A24"/><circle cx="121" cy="254" r="1.8" fill="#1C1A24"/><path d="M112 260 Q116 263 120 260" stroke="#45261F" stroke-width="1.6" fill="none" stroke-linecap="round"/><circle cx="103" cy="238" r="5" fill="#E0A23C"/></g></g>';
  if (p.prop === "stroller") o += '<g><path d="M170 300 Q170 262 214 262" fill="none" stroke="#2A2A2E" stroke-width="6" stroke-linecap="round"/><path d="M176 400 V290 Q176 276 196 276 H240 V400 Z" fill="#5B6B8A"/><circle cx="186" cy="436" r="13" fill="none" stroke="#2A2A2E" stroke-width="5"/><circle cx="232" cy="436" r="13" fill="none" stroke="#2A2A2E" stroke-width="5"/><path d="M186 400 V424 M232 400 V424" stroke="#2A2A2E" stroke-width="4"/><path d="M176 296 Q178 270 212 272 L214 296 Z" fill="#46546E"/></g>';
  if (p.prop === "bags") o += '<g><rect x="78" y="244" width="40" height="80" rx="3" fill="#C9A27A"/><path d="M86 244 Q98 222 110 244" fill="none" stroke="#A9855F" stroke-width="3"/><rect x="202" y="244" width="40" height="80" rx="3" fill="#C9A27A"/><path d="M210 244 Q222 222 234 244" fill="none" stroke="#A9855F" stroke-width="3"/><path d="M84 256 H112 M208 256 H236" stroke="#B8926A" stroke-width="2"/></g>';
  return o;
}
function person(who, cls, dx) { return '<g transform="translate(' + (dx || 0) + ' 0)"><g class="p ' + (cls || "") + '" id="p-' + who + '"><g class="bobber">' + figure(LOOKS[who]) + '</g></g></g>'; }
/* Westside Market behind them: the wall, the sign, the door and the canvasser's table */
function store(o) {
  o = o || {};
  var sy = o.signY == null ? 52 : o.signY, dx = o.doorX == null ? 214 : o.doorX;
  return '<rect x="-80" y="0" width="480" height="900" fill="#EFE7D8"/><g stroke="#E4DAC8" stroke-width="1.5">' + [128, 160, 192, 224, 256, 288, 320].map(function (y) { return '<path d="M-80 ' + y + ' H400"/>'; }).join("") + '</g>' +
    '<rect x="-80" y="' + sy + '" width="480" height="32" fill="#2F5D50"/>' + (o.noText ? "" : '<text x="' + (o.signX || 160) + '" y="' + (sy + 22) + '" text-anchor="middle" font-family="Figtree, sans-serif" font-weight="800" font-size="14" letter-spacing="2.4" fill="#F6F1E6">WESTSIDE MARKET</text>') +
    (o.win ? '<g transform="translate(' + o.win + ' 0)"><rect x="0" y="' + (sy + 54) + '" width="112" height="96" fill="#D7E4E6" stroke="#5B6B6A" stroke-width="5"/><path d="M0 ' + (sy + 54) + ' h112 l8 -14 h-128 z" fill="#C2603F"/><circle cx="26" cy="' + (sy + 128) + '" r="11" fill="#E0A23C"/><circle cx="46" cy="' + (sy + 132) + '" r="11" fill="#C2412D"/><circle cx="68" cy="' + (sy + 128) + '" r="11" fill="#6B9A63"/><circle cx="88" cy="' + (sy + 132) + '" r="10" fill="#E0A23C"/><rect x="10" y="' + (sy + 136) + '" width="92" height="12" fill="#B08A5E"/></g>' : "") +
    '<g transform="translate(' + dx + ' 0)"><rect x="0" y="' + (sy + 46) + '" width="96" height="' + ((o.ground || 340) - sy - 46) + '" fill="#D7E4E6" stroke="#5B6B6A" stroke-width="6"/><path d="M48 ' + (sy + 46) + ' V' + (o.ground || 340) + '" stroke="#5B6B6A" stroke-width="4"/><rect x="38" y="' + (sy + 150) + '" width="5" height="34" rx="2.5" fill="#5B6B6A"/><rect x="53" y="' + (sy + 150) + '" width="5" height="34" rx="2.5" fill="#5B6B6A"/><path d="M10 ' + (sy + 62) + ' l24 24 M62 ' + (sy + 68) + ' l22 22" stroke="#fff" stroke-width="3" stroke-opacity=".6" stroke-linecap="round"/></g>' +
    '<rect x="-80" y="' + (o.ground || 340) + '" width="480" height="620" fill="#DDD5C6"/><path d="M-80 ' + (o.ground || 340) + ' H400" stroke="#CFC5B3" stroke-width="2"/>' +
    (o.table != null ? '<g transform="translate(' + o.table + ' ' + ((o.ground || 340) - 340) + ')"><rect x="-10" y="262" width="118" height="10" rx="3" fill="#B08A5E"/><rect x="-4" y="272" width="106" height="84" fill="#5A3E99"/><text x="49" y="304" text-anchor="middle" font-family="Figtree, sans-serif" font-weight="800" font-size="10" letter-spacing="1" fill="#fff">LIBRARIES</text><text x="49" y="318" text-anchor="middle" font-family="Figtree, sans-serif" font-weight="800" font-size="10" letter-spacing="1" fill="#fff">FOR ALL</text><rect x="6" y="246" width="30" height="16" rx="2" fill="#8A6A45" transform="rotate(-8 21 254)"/><rect x="56" y="250" width="34" height="12" rx="2" fill="#FFFEFA" stroke="#C9C1B3"/></g>' : "");
}
/* one passerby, close up: the practice voters' picture (face in the top third, the captions over the chest) */
/* ---------------- the painted pictures (Nov 19, Robert's note and playbook rule 67) ----------------
   Every person and every scene with people is a realistic painting, made ahead of time (ai/tools/sig-pictures.md says how)
   and served from wdpfxqlsvp/sig/img/. DATA.img is the manifest: each picture's size, where its faces are (fractions of
   the picture: x0, y0, x1, y1) and the versions it comes in (warm: a smile; turned: Kayla with an earbud out; sheet: the
   canvasser holding up the top funders sheet). place() frames each picture so the face sits where the screen needs it. */
var IMG = DATA.img || {};
function imgUrl(n) { return "img/" + n + ".webp"; }
function layers(name, v, sfx) { return '<img class="b" src="' + imgUrl(name + (sfx || "")) + '" alt="" decoding="async">' + (v || []).map(function (k) { return '<img class="v v-' + k + '" src="' + imgUrl(name + "-" + k + (sfx || "")) + '" alt="" decoding="async">'; }).join(""); }
function pv(name) { return (IMG[name] && IMG[name].v) || []; }
/* one person, framed from the waist up, outside Westside Market: the video call, a tap screen's picture, a portrait */
function sceneOne(who, cls) { return '<div class="ph one p ' + (cls || "") + '" id="p-' + who + '" data-img="' + who + '" role="img" aria-label="' + esc(CAST[who].full || CAST[who].name) + ' outside Westside Market"><div class="bobber">' + layers(who, pv(who)) + '</div></div>'; }
/* a canvasser and a passerby, for the parts you watch. Coming in, the scene fades in; it carries the passerby's id */
function sceneTwo(by, who, cls) { var n = "two-" + by + "-" + who; return '<div class="ph two p ' + (cls || "") + '" id="p-' + who + '" data-img="' + n + '" role="img" aria-label="' + esc(CAST[by].name + " and " + (CAST[who].full || CAST[who].name)) + ' outside Westside Market"><div class="bobber">' + layers(n, pv(n)) + '</div></div>'; }
/* the storefront with nobody in it yet, for the beat before a try */
function sceneStore() { return '<div class="ph shop" role="img" aria-label="Westside Market, with your table out front">' + layers("store") + '</div>'; }
/* the same person as a small picture on a card: the face, framed whole */
function sceneFace(who) { var v = pv(who).filter(function (k) { return k === "warm"; }); return '<div class="ph close" id="p-' + who + '" role="img" aria-label="' + esc(CAST[who].full || CAST[who].name) + '">' + layers(who, v, "-close") + '</div>'; }
function face(who) { return '<img class="av" src="' + imgUrl(who + "-av") + '" alt="" decoding="async">'; }
/* frame each picture: object-fit cover, shifted so the face (or the faces) sit near the top third, never past an edge */
function frameOf(el) {
  var m = IMG[el.getAttribute("data-img")], W = el.clientWidth, H = el.clientHeight; if (!m || !m.w || !W || !H) return null;
  var s0 = Math.max(W / m.w, H / m.h), fs = m.face ? [m.face] : m.faces || [];
  var x0 = 1, y0 = 1, x1 = 0, y1 = 0; fs.forEach(function (f) { x0 = Math.min(x0, f[0]); y0 = Math.min(y0, f[1]); x1 = Math.max(x1, f[2]); y1 = Math.max(y1, f[3]); });
  var cx = fs.length ? (x0 + x1) / 2 : 0.5, cy = fs.length ? (y0 + y1) / 2 : 0.3, ft = el.parentElement && el.parentElement.classList.contains("ft") ? el.parentElement : null;
  var ty = el.classList.contains("two") ? 0.3 : ft && ft.querySelector(".dock.haspet") ? 0.2 : 0.27; /* with the petition docked on the call, the face sits higher */
  /* when the picture has no room to move the face up to its place, it is drawn up to a quarter larger so it can */
  var s = s0; if (cy * m.h * s0 > H * ty + 1) s = Math.min(s0 * 1.25, Math.max(s0, (H - H * ty) / ((1 - cy) * m.h)));
  var rw = m.w * s, rh = m.h * s;
  return { m: m, fs: fs, rw: rw, rh: rh, ox: Math.min(0, Math.max(W - rw, W * 0.5 - cx * rw)), oy: Math.min(0, Math.max(H - rh, H * ty - cy * rh)) };
}
function place() { [].forEach.call(document.querySelectorAll(".ph[data-img]"), function (el) { var f = frameOf(el); if (!f) return; el.style.setProperty("--ox", f.ox.toFixed(1) + "px"); el.style.setProperty("--oy", f.oy.toFixed(1) + "px"); el.style.setProperty("--rw", f.rw.toFixed(1) + "px"); el.style.setProperty("--rh", f.rh.toFixed(1) + "px"); }); }
/* tests: where each face is on screen, for the checks that captions never cover a face */
window.__faces = function () { var out = []; [].forEach.call(document.querySelectorAll(".ph[data-img]"), function (el) { if (el.classList.contains("off-l") || el.classList.contains("off-r") || !el.getClientRects().length) return; var f = frameOf(el); if (!f) return; var r = el.getBoundingClientRect(); f.fs.forEach(function (b) { out.push({ ft: !!el.closest(".ft"), panelTop: r.top, panelH: r.height, left: r.left + f.ox + b[0] * f.rw, right: r.left + f.ox + b[2] * f.rw, top: r.top + f.oy + b[1] * f.rh, bottom: r.top + f.oy + b[3] * f.rh }); }); }); return out; };
/* the lesson's pictures load while its cover is read */
function preloadPics(names) { var seen = {}; names.forEach(function (n) { if (!n || seen[n] || !IMG[n]) return; seen[n] = 1; var u = [n].concat(pv(n).map(function (k) { return n + "-" + k; })); if (IMG[n].face) u.push(n + "-close", n + "-av"); u.forEach(function (x) { var i = new Image(); i.decoding = "async"; i.src = imgUrl(x); }); }); }
/* where to stand: four small pictures, drawn so the choice reads without words */
function mini(x, y, c, o) { /* a small standing or seated canvasser, drawn facing right unless flipped */
  o = o || {}; var skin = o.skin || "#C99470";
  return '<g transform="translate(' + x + ' ' + y + ') scale(' + (o.flip ? -1 : 1) + ' 1)">' + (o.sit ? "" : '<rect x="-8" y="30" width="7" height="28" rx="3.5" fill="#2F3A52"/><rect x="1" y="30" width="7" height="28" rx="3.5" fill="#2F3A52"/>') +
    '<rect x="-12" y="-2" width="24" height="38" rx="10" fill="' + c + '"/>' +
    '<g transform="rotate(' + (o.down ? 24 : 0) + ' 0 -6)"><circle cx="0" cy="-14" r="10.5" fill="' + skin + '"/><path d="M-10.5 -15 a10.5 10.5 0 0 1 21 0 Z" fill="' + (o.hair || "#1F1512") + '"/></g>' +
    (o.board ? '<path d="M8 8 L20 2" stroke="' + skin + '" stroke-width="5" stroke-linecap="round"/><rect x="15" y="-8" width="15" height="20" rx="2" fill="#8A6A45" transform="rotate(8 22 2)"/><rect x="17.5" y="-5" width="10" height="14" fill="#FFFEFA" transform="rotate(8 22 2)"/>' : "") +
    (o.phone ? '<path d="M-9 12 L-3 22 M9 12 L3 22" stroke="' + skin + '" stroke-width="5" stroke-linecap="round"/><rect x="-5" y="14" width="10" height="15" rx="2" fill="#262320"/><rect x="-3.4" y="15.6" width="6.8" height="11" rx="1" fill="#BFE0F5"/>' : "") + '</g>';
}
function walker(x, y, c, flip, still) { /* a passerby seen from the side, in stride unless still */
  return '<g transform="translate(' + x + ' ' + y + ') scale(' + (flip ? -1 : 1) + ' 1)">' + (still ? '<path d="M-3 28 L-3 54 M3 28 L3 54" stroke="#5B554D" stroke-width="6" stroke-linecap="round"/>' : '<path d="M-2 28 L-10 54 M2 28 L11 53" stroke="#5B554D" stroke-width="6" stroke-linecap="round"/>') +
    '<rect x="-10" y="-1" width="20" height="34" rx="9" fill="' + c + '"/>' + (still ? "" : '<path d="M0 8 L9 20" stroke="' + c + '" stroke-width="5" stroke-linecap="round" opacity=".75"/>') + '<circle cx="1.5" cy="-11" r="9.5" fill="#D9B38F"/><path d="M-8 -12 a9.5 9.5 0 0 1 16 -5 Q2 -14 -8 -12 Z" fill="#4A3A2E"/></g>';
}
/* the scene (160 by 130) always shows whole, as large as its tile allows and standing on the tile's bottom edge; the wall and the pavement run on beyond it, so a wide tile or a tall one is never blank */
var MINI_BG = '<svg viewBox="0 60 160 130" preserveAspectRatio="xMidYMax meet" style="overflow:visible"><rect x="-700" y="-900" width="1560" height="1050" fill="#EFE7D8"/><rect x="-700" y="150" width="1560" height="40" fill="#DDD5C6"/>';
var MINI_TABLE = function (x, y) { return '<rect x="' + x + '" y="' + y + '" width="66" height="8" rx="3" fill="#B08A5E"/><rect x="' + (x + 5) + '" y="' + (y + 8) + '" width="56" height="' + (150 - y - 2) + '" fill="#5A3E99"/>'; };
var MINI_DOOR = function (x) { return '<rect x="' + x + '" y="46" width="60" height="104" fill="#D7E4E6" stroke="#5B6B6A" stroke-width="5"/><path d="M' + (x + 30) + ' 46 V150" stroke="#5B6B6A" stroke-width="3"/>'; };
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
function sceneSheet(month, day) {
  var valid = ME.fundersValid + " " + month, bars = [92, 108, 124, 140].map(function (y, i) { return '<rect x="52" y="' + y + '" width="' + [112, 96, 104, 78][i] + '" height="8" rx="4" fill="#DDD6CA"/>'; }).join("");
  return '<svg viewBox="0 0 320 196" preserveAspectRatio="xMidYMid meet" role="img" aria-label="A top funders sheet that says ' + esc(valid) + ', next to a calendar page for ' + esc(day.join(" ")) + '">' +
    '<g transform="rotate(-3 110 98)"><rect x="36" y="20" width="148" height="156" rx="7" fill="#FFFEFA" stroke="#D9D2C4" stroke-width="2"/>' +
    '<text x="110" y="46" text-anchor="middle" font-family="Figtree, sans-serif" font-weight="800" font-size="10.5" letter-spacing=".4" fill="#262320">' + esc(ME.fundersHead) + '</text>' +
    '<rect x="50" y="56" width="120" height="24" rx="5" fill="#FCEFD9" stroke="#E08A1A" stroke-width="1.6"/><text x="110" y="72" text-anchor="middle" font-family="Figtree, sans-serif" font-weight="700" font-size="10.5" fill="#262320">' + esc(valid) + '</text>' + bars + '</g>' +
    '<g><rect x="212" y="46" width="84" height="100" rx="11" fill="#fff" stroke="#D9D2C4" stroke-width="2"/><path d="M212 57 a11 11 0 0 1 11 -11 h62 a11 11 0 0 1 11 11 v19 h-84 z" fill="#C4472F"/>' +
    '<text x="254" y="68" text-anchor="middle" font-family="Figtree, sans-serif" font-weight="800" font-size="11" letter-spacing="1" fill="#fff">' + esc(day[0].toUpperCase()) + '</text>' +
    '<text x="254" y="128" text-anchor="middle" font-family="Newsreader, Georgia, serif" font-weight="600" font-size="46" fill="#262320">' + esc(day[1]) + '</text></g></svg>';
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
