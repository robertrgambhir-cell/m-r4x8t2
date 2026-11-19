/* ---------------- the flow: one lesson, step by step ---------------- */
var S = { step: -1, sub: 0, seen: {}, done: {}, try1: null, perfect1: false, people: [], score: null, retried: false, mustOpen: [] };
var RUN = 0, M = { rec: null, busy: false, used: false }, TM = { at: -2, t0: 0, ms: {} };
var KEY = "wu_sig_v1";
function saved() { try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { return {}; } }
function save(o) { try { localStorage.setItem(KEY, JSON.stringify(Object.assign(saved(), o))); } catch (e) {} }
function tag(sub) { var t = $("#tag"); t.textContent = LN ? "Sig " + LN + "." + (S.step + 1) + (sub || "") : "Sig card"; t.className = "tag" + ($("#scr .ft") ? " onpic" : ""); }
/* the lesson bar: one segment per step, full once the step is done and empty until then. Tapping goes back to a step already seen. */
function top(o) {
  o = o || {};
  var segs = S.step < 0 ? "" : L.steps.map(function (s, i) { return '<button class="' + (S.done[i] ? "full" : "") + (i === S.step ? " cur" : "") + '" data-seg="' + i + '" aria-label="' + esc(s.name) + '"></button>'; }).join("");
  /* a result (a card after a try, the feedback, the lesson end) has no way back: back works on every screen that isn't home or a result */
  $("#top").innerHTML = (S.step < 0 ? "" : o.result ? '<span class="x" aria-hidden="true"></span>' : '<button class="x" id="close" aria-label="Back">' + ICON.back + '</button>') + '<div class="bar">' + segs + '</div>' + (o.pp ? '<button class="pp" id="pp" aria-label="Pause">' + ICON.pause + '</button>' : "");
  $("#top").style.display = S.step < 0 ? "none" : "";
  if ($("#close")) $("#close").onclick = back;
  if ($("#pp")) $("#pp").onclick = function () { PAUSED = !PAUSED; if (AC) { PAUSED ? AC.suspend() : AC.resume(); } $("#pp").innerHTML = PAUSED ? ICON.play : ICON.pause; $("#pp").setAttribute("aria-label", PAUSED ? "Play" : "Pause"); };
  [].forEach.call(document.querySelectorAll(".bar button"), function (b) { var i = +b.getAttribute("data-seg"); if (o.result || !S.seen[i] || i >= S.step) { b.disabled = true; return; } b.onclick = function () { go(i, 0); }; });
}
function noPause() { var p = $("#pp"); if (p) p.remove(); } /* nothing is playing, so there is nothing to pause */
function micAbort() { if (M.rec) { try { M.rec.abort(); } catch (e) {} M.rec = null; } M.busy = false; }
function go(step, sub) {
  RUN += 1; stopSound(); micAbort(); PAUSED = false; if (AC && AC.state === "suspended") AC.resume();
  var sh = $(".sheet"); if (sh) sh.remove();
  var now = performance.now(); if (TM.at >= 0) TM.ms[TM.at] = (TM.ms[TM.at] || 0) + now - TM.t0; TM.at = step; TM.t0 = now;
  if (step > S.step && S.step >= 0) S.done[S.step] = true;
  S.step = step; S.sub = sub || 0;
  if (step < 0) { S.seen = {}; S.done = {}; S.try1 = null; S.perfect1 = false; S.people = []; S.score = null; S.retried = false; S.mustOpen = []; return vCover(); }
  S.seen[step] = true;
  VIEW[L.steps[step].kind](L.steps[step]);
}
/* back: the question before this one, or the start of this step, or the end of the step before it. Going back clears the answer. */
function back() {
  var k = S.step < 0 ? "" : L.steps[S.step].kind;
  if (S.sub > 0 && (k === "taps" || k === "sort" || k === "lines") && S.sub < 50) return go(S.step, S.sub - 1);
  if (S.sub > 0) return go(S.step, 0);
  var i = S.step - 1; while (i >= 0 && !S.seen[i]) i -= 1;
  var p = i >= 0 ? L.steps[i] : null;
  go(i, p && p.kind === "taps" ? p.qs.length - 1 : p && p.kind === "lines" ? p.lines.length - 1 : 0);
}
/* one rule, two paths: all four parts on the 1st try skips Hear it done and Catch the mistake; the tap exercises stay */
function nextIndex() { var i = S.step + 1; if (S.perfect1) while (L.steps[i] && (L.steps[i].kind === "hear" || L.steps[i].kind === "spot")) i += 1; return i; }
function nextLabel() {
  var s = L.steps[nextIndex()]; if (!s) return SH.done;
  if (s.kind === "hear") return SH.next.hear; if (s.kind === "spot") return SH.next.spot; if (s.kind === "try2") return SH.next.try2;
  var n = s.short || s.name; return "Next: " + n.charAt(0).toLowerCase() + n.slice(1);
}
function nextStep() { go(nextIndex(), 0); }
var kick = function (st) { return '<div class="kick">' + q(typeof st === "string" ? st : st.name) + '</div>'; };
var foot = function (html) { return '<div class="foot">' + html + '</div>'; };
var btn = function (label, id, cls) { return '<button class="btn' + (cls ? " " + cls : "") + '" id="' + id + '">' + q(label) + '</button>'; };
var row = function (cls, text, small) { return '<li class="' + cls + '"><span class="ck">' + (cls === "fix" ? ICON.dot : ICON.ok) + '</span><span>' + (small ? '<small>' + q(small) + '</small>' : "") + q(text) + '</span></li>'; };
var why = function (right, text, plain) { return '<div class="why' + (plain ? " plain" : "") + '"><span class="dot' + (right ? "" : " no") + '">' + (right ? ICON.ok : ICON.dot) + '</span><span>' + q(text) + '</span></div>'; };
var whoTag = function (who) { var c = CAST[who]; return esc((c.full || c.name) + (c.age ? ", " + c.age : "")); };
function show(html, sub) { $("#scr").innerHTML = html; tag(sub); fillUp(); fitPic(); place(); fitHw(); }
/* fill: a screen with room to spare grows its words and pictures together, up to FILL_MAX times their size, until the room is
   used (playbook A50: content scaled to fill the screen, no blank bands). The main button keeps its size. A screen whose
   picture already takes the spare room is left alone. The measuring is done with the blocks packed at the sizes they would
   like (#scr.fitting in the styles), and it runs again whenever a screen's words change, the window changes or the fonts land. */
var FILL_MAX = 1.4, fillWatch = null;
function fillUp() {
  var scr = $("#scr"); if (!scr) return;
  scr.style.removeProperty("--k");
  if (!fillWatch && window.MutationObserver) {
    var pend = false, later = function () { if (pend) return; pend = true; requestAnimationFrame(function () { pend = false; fillUp(); fitPic(); place(); fitHw(); }); };
    fillWatch = new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i += 1) { var x = ms[i].target; if (x.nodeType !== 1) x = x.parentElement; if (x && !x.closest("svg, .capts, .mic, .dock, .pet, .ft")) return later(); } });
    fillWatch.observe(scr, { childList: true, subtree: true });
    window.addEventListener("resize", later);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(later);
  }
  var f = scr.querySelector(":scope > .fill");
  var shown = function (e) { return e.getClientRects().length > 0; }, capped = function (e) { return getComputedStyle(e).maxHeight !== "none"; };
  /* a picture or a set of tiles that takes the spare room: the words keep their size. A wide picture stops growing at its own
     height (it never shows empty pavement), so past that point the words grow instead */
  var pics = [].filter.call(scr.querySelectorAll(":scope > .panel, :scope > .fill > .panel"), shown), caps = pics.filter(capped);
  if (pics.length > caps.length) return;
  if ([].some.call(scr.querySelectorAll(":scope > .ft, .checks4, .opts.tallies, .opts.tall, .quad, #pw.psheet, .picpet, .pics"), shown)) return;
  if (!f && !caps.length) return;
  /* layout positions, never painted ones: a line that is still sliding in must not read as running off the screen */
  var room = scr.clientHeight, end = function (c) { return c.offsetTop + c.offsetHeight; };
  var need = function (k) { scr.style.setProperty("--k", k.toFixed(3)); var m = 0; [].forEach.call(scr.children, function (c) { var cs = getComputedStyle(c); if (!shown(c) || cs.position === "absolute") return; var b = end(c) + (parseFloat(cs.marginBottom) || 0); if (b > m) m = b; }); return m; };
  scr.classList.add("fitting");
  var lo = 1, hi = FILL_MAX;
  if (need(1) <= room - 16) { if (need(hi) <= room) lo = hi; else for (var i = 0; i < 7; i += 1) { var mid = (lo + hi) / 2; if (need(mid) <= room) lo = mid; else hi = mid; } }
  scr.classList.remove("fitting");
  var over = function () { var kids = f ? [].filter.call(f.children, shown) : [], a = kids[0], z = kids[kids.length - 1], last = [].filter.call(scr.children, function (c) { return shown(c) && getComputedStyle(c).position !== "absolute"; }).pop();
    return (a && a.offsetTop < f.offsetTop - 1) || (z && end(z) > end(f) + 1) || (last && end(last) > room + 1); };
  for (lo = Math.floor(lo * 100) / 100; lo > 1.005; lo -= 0.03) { scr.style.setProperty("--k", lo.toFixed(3)); if (!over()) return; }
  scr.style.removeProperty("--k");
}
function cap(who, text, cls) { var c = $("#capts"); if (!c) return null; var el = c.querySelector(".capt." + (cls || "them").split(" ")[0]); if (!el) el = document.createElement("div"); if (c.lastChild !== el) c.appendChild(el); el.className = "capt " + (cls || "them"); el.innerHTML = (who ? "<b>" + esc(who) + "</b>" : "") + q(text); return el; }
function nameOf(who) { return who === "coach" ? "Coach" : who === "you" ? "You" : CAST[who].name; }
function act(who, a) {
  var p = $("#p-" + who); if (!p || !a) return;
  if (a === "slow") { p.classList.remove("walk"); expr(who, "warm"); }
  else if (a === "turn") { p.classList.remove("walk"); expr(who, "surprised"); setTimeout(function () { expr(who, "neutral"); }, 1400); var b = p.querySelector(".bud-r"); if (b) b.classList.add("hid"); }
  else if (a === "go") { p.classList.add("walk"); p.classList.add("off-r"); }
  else if (a === "pen") expr(who, "warm");
}
function enter(who) { var p = $("#p-" + who); if (p) { p.classList.remove("off-l"); } return wait(FAST ? 0 : 850); }
function sources() {
  var sh = document.createElement("div"), was = $("#tag").textContent; sh.className = "sheet";
  sh.innerHTML = '<div role="dialog" aria-label="Sources"><h2>Sources</h2><ul>' + (L.sources || []).map(function (g) { var link = function (n, u) { return '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + q(n) + '</a>'; }; return '<li>' + q(g[0]) + ': ' + (typeof g[1] === "string" ? g[1].split(/(\{[^|}]+\|[^}]+\})/).map(function (x) { var m = x.match(/^\{([^|}]+)\|([^}]+)\}$/); return m ? link(m[1], m[2]) : q(x); }).join("") : g[1].map(function (s) { return link(s[0], s[1]); }).join(", ") + (g[2] ? ", " + q(g[2]) : "")) + '</li>'; }).join("") + '</ul><p class="fine">The coach and the passersby are AI voices. The Neighborhood Libraries Act, Libraries for All and every person here are made up for practice.</p><button class="btn ghost" id="shx">Close</button></div>';
  $("#app").appendChild(sh); $("#tag").textContent = was + "s"; $("#tag").className = "tag onpic";
  sh.addEventListener("click", function (e) { if (e.target === sh || e.target.id === "shx") { sh.remove(); $("#tag").textContent = was; $("#tag").className = "tag"; } });
}
/* what you said, shown whole or not at all: no clipped words */
function saidBlock(t) { t = tidy(t).replace(/'/g, "’"); return t && t.length <= 230 ? '<div class="said' + (t.length > 110 ? " sm" : "") + '"><b>You said</b>“' + esc(t) + '”</div>' : ""; }
function missedLine(p, g, i) { return g.alt && g.alt[i] && p.missedAlt ? p.missedAlt : p.missed; }
/* a missed part, as a row. Where the script's "missed" line wouldn't be true of what happened (the paid line came late, a no was
   met with "Hmm."), the row is the part's own name under "Watch for", the 1st try card's words. */
function fixRow(p, g, i) { return g.vague && g.vague[i] && !(g.alt && g.alt[i] && p.missedAlt) ? row("fix", p.name, SH.try1.watch) : row("fix", missedLine(p, g, i)); }
/* something untrue, or a promise: what was said, the true words, and (on a scored try) one more time */
function fixBlock(g, again) {
  var more = again ? '<div class="cl2">One more time.</div>' : "";
  if (g.promise && !g.untrue) return '<div class="callout must"><b class="cl">' + q(SH.promise) + '</b>' + more + '</div>';
  var truth = LN === 2 ? ME.label.charAt(0).toUpperCase() + ME.label.slice(1) + "." : g.untrue === "volunteer" ? ME.paid : ME.two;
  return '<div class="callout must"><b class="cl">' + q(SH.untrue) + '</b>' + (g.untrueSaid ? '<div class="xo no">' + ICON.x + '<span>“' + esc(g.untrueSaid) + '”</span></div>' : "") + '<div class="xo ok">' + ICON.ok + '<span>“' + q(truth) + '”</span></div>' + more + '</div>';
}

/* ---------------- talking with a passerby ---------------- */
/* cfg: { st, key, who, coach, set, opens, replies, walk, line, fill, hint, hintAfter, opener, tag, onEnd(T) } */
function micHtml() { return '<div class="mic" id="microw"><button class="micb wait" id="mic" aria-label="Tap to talk">' + ICON.mic + '</button><div class="mict" id="mict"></div></div>'; }
/* a browser that can't listen: the box appears only after the mic is tapped */
function typedOn(onSend) {
  var m = $("#microw"); if (!m || $("#typed")) return;
  m.innerHTML = '<form class="typed" id="typed"><input id="say" autocomplete="off" placeholder="This browser can’t listen. Type it." aria-label="Type what you would say"><button class="btn" id="send" style="flex:none;min-height:46px;padding:8px 14px">Send</button></form>';
  $("#typed").onsubmit = function (e) { e.preventDefault(); var v = $("#say").value.trim(); if (!v) return; $("#say").value = ""; onSend(v); };
  if (!FAST) $("#say").focus();
}
function micState(k, html) { var b = $("#mic"), t = $("#mict"); if (b) { b.className = "micb" + (k === "idle" ? " pulse" : k === "on" ? " on" : " wait"); b.innerHTML = k === "on" ? ICON.stop : ICON.mic; } if (t) t.innerHTML = html != null ? html : k === "idle" ? "<b>Tap to talk.</b>" : k === "on" ? '<b>Listening.</b> Pause when you’re done.' : ""; var f = $("#typed"); if (f) { f.style.opacity = k === "wait" ? .5 : 1; $("#say").disabled = k === "wait"; } }
function micErr(c) { return c === "denied" ? "<b>The microphone is off for this site.</b> Allow it in your browser’s settings, then tap to try again." : c === "busy" ? "<b>Another app is using the microphone.</b> Close it, then tap to try again." : "<b>Something stopped the microphone.</b> Tap to try again."; }
function talk(cfg) {
  var r = RUN, T = SIGG.talk(cfg.key, cfg.again ? Object.assign({}, ST, { again: true }) : ST), who = cfg.who, fill = Object.assign({}, cfg.line || {});
  var petOpts = { top: false };
  function redrawPet(o) { var p = $("#pet"); if (p) p.outerHTML = pet(fill, Object.assign({}, petOpts, o || {})); fitHw(); }
  function your(first) {
    M.busy = false; if (r !== RUN) return;
    if (!SR) { micState("idle"); var i = $("#say"); if (i && !FAST) i.focus(); return; }
    micState("idle");
    if (!first && M.used && !FAST) setTimeout(function () { if (r === RUN && !M.rec && !M.busy) start(true); }, 280); /* the mic reopens for the next line; a tap works too */
  }
  function start(auto) {
    if (r !== RUN || M.rec || M.busy) return;
    audio(); stopSound(); micState("on");
    M.rec = listen({
      onWords: function (t) { if (r !== RUN) return; cap("You", t, "you live"); },
      onDone: function (t) { M.rec = null; M.used = true; heard(t); },
      onError: function (c) { M.rec = null; if (r !== RUN) return; if (auto) { micState("idle"); return; } micState("idle", micErr(c)); },
    });
  }
  function heard(text) {
    if (r !== RUN) return;
    if (SIGG.misheard(text, cfg.opener && !T.pieces.length)) { var y = $("#capts .capt.you"); if (y && y.classList.contains("live")) y.remove(); micState("idle", "<b>" + q(SH.misheard) + "</b>"); return; }
    cap("You", tidy(text).replace(/'/g, "’"), "you"); M.busy = true;
    var res = T.hear(text);
    micState("wait", res.say.some(function (k) { return k.charAt(0) !== "@"; }) ? "<b>" + esc(CAST[who].name) + " is answering.</b>" : "");
    replies(res.say).then(function () { if (r !== RUN) return; if (res.end) { micState("wait", ""); wait(650).then(function () { if (r === RUN) cfg.onEnd(T); }); } else your(false); });
  }
  async function replies(list) {
    for (var i = 0; i < list.length; i += 1) {
      if (r !== RUN) return;
      var k = list[i];
      if (k === "@fill" || k === "@fillOther") {
        var f = cfg.fill || {}, order = ["name", "addr", "city", "zip"];
        for (var j = 0; j < order.length; j += 1) { fill[order[j]] = f[order[j]]; if (k === "@fillOther" && order[j] === "addr") fill.other = ["addr"]; redrawPet({ fresh: [order[j]] }); await wait(520); if (r !== RUN) return; }
        await wait(300);
      } else if (k === "@sign") { fill.sig = true; redrawPet({ fresh: ["sig"] }); await wait(600); }
      else if (k === "@glowSig") { petOpts.glow = (petOpts.glow || []).concat(["sig"]); redrawPet(); await wait(900); }
      else if (k === "@glowAddr") { petOpts.glow = (petOpts.glow || []).concat(["addr"]); redrawPet(); await wait(900); }
      else if (k === "@hint") cap("Coach", cfg.hint || "", "note");
      else if (k === "@look") { act(who, "turn"); await wait(600); } /* they slow and look over, and wait for the rest */
      else if (k === "@go") { act(who, "go"); await wait(700); }
      else { var ln = k === "again" ? cfg.opens : cfg.replies[k]; if (!ln) continue; act(who, ln.act); /* "again": their own question, asked once more */ cap(CAST[who].name, ln.text, "them"); await sayLine(ln, r); if (k === cfg.hintAfter) cap("Coach", cfg.hint || "", "note"); }
    }
  }
  show(kick(cfg.st) + (cfg.set ? '<p class="sub">' + q(cfg.set) + '</p>' : "") +
    '<div class="ft" id="panel">' + sceneOne(who, cfg.walk ? "off-l walk" : "") + '<div class="who">' + whoTag(who) + '</div>' +
    '<div class="dock' + (cfg.line ? " haspet" : "") + '"><div class="capts" id="capts"></div>' + (cfg.line ? pet(fill, petOpts) : "") + micHtml() + '</div></div>', cfg.tag);
  top({});
  $("#mic").onclick = function (e) { e.stopPropagation(); if (!SR) { typedOn(function (v) { if (M.busy) return; M.used = true; heard(v); }); return; } if (M.rec) { M.rec.stop(); return; } if (M.busy) return; start(false); };
  $("#panel").onclick = function (e) { if (e.target.closest && e.target.closest(".dock")) return; if (!M.rec) stopSound(); };
  M.busy = true; micState("wait", "");
  (async function () {
    if (cfg.coach) { cap("Coach", cfg.coach.text, "them"); await sayLine(cfg.coach, r); }
    if (r !== RUN) return;
    if (cfg.walk) await enter(who);
    if (cfg.opens) { cap(CAST[who].name, cfg.opens.text, "them"); await sayLine(cfg.opens, r); }
    if (r !== RUN) return;
    your(true);
  })();
  return T;
}

/* ---------------- the views ---------------- */
var VIEW = {};
function coverPic() { return sceneTwo("lena", LN === 1 ? "ines" : LN === 2 ? "ben" : LN === 3 ? "tanya" : LN === 4 ? "anika" : "hank", ""); } /* the lesson's picture: on its cover and on its last screen */
function vCover() {
  S.step = -1; top({});
  show('<span class="drive" role="img" aria-label="Libraries for All, the Neighborhood Libraries Act petition drive"><b>' + esc(ST.drive.name) + '</b><small>' + esc(ST.drive.measure) + ' · petition drive</small></span>' +
    '<div class="kick" style="margin-top:18px">Lesson ' + LN + ' of 5</div><h1 class="lg">' + q(L.title) + '</h1><div class="meta"><span>5 minutes</span></div>' +
    '<div class="panel cap">' + coverPic() + '</div>' +
    (saved().must && saved().must[LN] ? mustNote(LN, saved().must).replace(' style="color:var(--red)"', "") : "") + foot(btn(L.start || SH.start, "start")), "");
  $("#start").onclick = function () { audio(); go(0, 0); };
  /* the lesson's voices load while the cover is read */
  (function walk(x) { if (!x || typeof x !== "object") return; if (x.clip) fetchClip(x.clip); Object.keys(x).forEach(function (k) { walk(x[k]); }); })(L.steps);
  /* and its pictures: everyone it shows, the two-person scenes, the storefront and the four places to stand */
  var pics = ["store", "spot-sit", "spot-stand", "spot-doorway", "spot-side"];
  L.steps.forEach(function (st) { var by = st.by || "lena"; (st.scenes || []).concat(st.people || [], [st]).forEach(function (x) { if (x && x.who) { pics.push(x.who); pics.push("two-" + (x.by || by) + "-" + x.who); } });
    JSON.stringify(st, function (k, v) { if (k === "pic" && v && v.who) pics.push(v.who); if (k === "pic" && v && v.two) pics.push("two-" + v.two[0] + "-" + v.two[1]); if (k === "face" && typeof v === "string") pics.push(v); return v; }); });
  preloadPics(pics);
}

/* Your 1st try: never scored. Then the card: what you did, and what to watch for. */
VIEW.try1 = function (st) {
  if (S.sub === 1) return vTry1Card(st);
  talk({ st: st, key: LN + "." + st.who, who: st.who, coach: st.coach, opens: st.opens, replies: st.replies, walk: st.walk, line: st.line, opener: LN === 2, tag: "a",
    onEnd: function (T) { var g = T.grade(); S.try1 = { hits: g.hits, said: g.quote || T.pieces.join(" "), g: g }; S.perfect1 = g.hits.every(Boolean); go(S.step, 1); } });
};
function vTry1Card(st) {
  var t = S.try1 || { hits: [false, false, false, false], said: "", g: {} }, n = t.hits.filter(Boolean).length;
  var h = n === 4 ? SH.try1.all : n === 0 ? SH.try1.none : SH.try1.some.replace("{n}", n).replace("{m}", 4 - n);
  top({ result: true });
  var fx = t.g && (t.g.untrue || t.g.promise); /* the card then shows the untrue words itself, so "You said" would say them twice */
  show(kick(st) + '<h1>' + q(h) + '</h1><div class="fill"><div class="panel short" data-who="' + st.who + '">' + sceneFace(st.who) + '<div class="who">' + whoTag(st.who) + '</div></div>' + (fx ? "" : saidBlock(t.said)) +
    '<ul class="rows">' + L.parts.map(function (p, i) { return t.hits[i] ? row("on", p.done) : row("off", p.name, SH.try1.watch); }).join("") + '</ul>' +
    (t.g && (t.g.untrue || t.g.promise) ? fixBlock(t.g, false) : "") + '</div>' + foot(btn(nextLabel(), "go")), "b");
  expr(st.who, n >= 3 ? "warm" : "neutral");
  $("#go").onclick = nextStep;
}

/* Hear it done: the four parts named first, each ticked as it lands, with its why */
VIEW.hear = function (st) {
  var r = RUN, sc0 = st.scenes[0];
  top({ pp: true });
  show(kick(st) + '<div class="panel" id="panel"></div>' + (sc0.line ? pet(sc0.line, {}) : "") +
    '<div class="lbl">' + q(SH.listen) + '</div><ul class="rows" id="parts">' + L.parts.map(function (p) { return row("off", p.name); }).join("") + '</ul>' + foot(btn(nextLabel(), "go", "ghost")), "");
  $("#go").onclick = nextStep;
  $("#panel").onclick = function () { stopSound(); };
  playScenes(st, "lena").then(function (ok) { if (!ok || r !== RUN) return; noPause(); if ($("#go")) $("#go").classList.remove("ghost"); });
};
/* plays a watched scene: who speaks, what happens on screen, then the coach's ticks */
async function playScenes(st, by) {
  var r = RUN, fill = {};
  function setScene(sc) { var p = $("#panel"); if (st.labels) p.classList.add("lab"); p.innerHTML = sceneTwo(by, sc.who, sc.stopped ? "" : "off-l walk") + '<div class="capts" id="capts"></div>' + (st.labels ? '<div class="labels" id="labels">' + st.labels.map(function (l) { return '<span>' + q(l) + '</span>'; }).join("") + '</div>' : ""); }
  function redraw(o) { var p = $("#pet"); if (p) p.outerHTML = pet(fill, o || {}); fitHw(); }
  setScene(st.scenes[0]);
  if (st.coach) { cap("Coach", st.coach.text, "them"); if (!(await sayLine(st.coach, r))) return false; }
  for (var i = 0; i < st.scenes.length; i += 1) {
    var sc = st.scenes[i]; if (i) setScene(sc);
    if (!sc.stopped) { await enter(sc.who); if (r !== RUN) return false; }
    for (var j = 0; j < sc.lines.length; j += 1) {
      var ln = sc.lines[j], lab = $("#labels");
      if (ln.act === "sheet" || ln.act === "board") { var pr = document.querySelector("#p-" + ln.who + " .prop." + ln.act); if (pr) pr.classList.remove("hid"); var scn = document.querySelector("#panel .ph.two"); if (scn) scn.classList.add(ln.act); } else if (ln.act) act(ln.who === by ? sc.who : ln.who, ln.act);
      if (ln.label != null && lab) lab.children[ln.label].classList.add("on");
      if (ln.glow) redraw({ glow: ln.glow });
      if (ln.fill) { Object.assign(fill, ln.fill); redraw({ fresh: Object.keys(ln.fill) }); }
      cap(nameOf(ln.who), ln.text, "them");
      if (!(await sayLine(ln, r))) return false;
      if (ln.fillAfter) { var ks = Object.keys(ln.fillAfter); for (var k = 0; k < ks.length; k += 1) { fill[ks[k]] = ln.fillAfter[ks[k]]; redraw({ fresh: [ks[k]] }); await wait(650); if (r !== RUN) return false; } }
      await wait(ln.pauseAfter || 180); if (r !== RUN) return false;
    }
    for (var t = 0; sc.ticks && t < sc.ticks.length; t += 1) {
      var li = $("#parts") && $("#parts").children[t]; if (li) li.className = "on tick";
      cap("Coach", sc.ticks[t].text, "them");
      if (!(await sayLine(sc.ticks[t], r))) return false;
      await wait(200); if (r !== RUN) return false;
    }
    if (sc.after) { cap("Coach", sc.after.text, "them"); if (!(await sayLine(sc.after, r))) return false; }
  }
  return true;
}

/* once the answer is on screen the picture gives it room; a sliver of a picture is no picture, so then it goes */
function shrinkPic() { var f = $(".fill"), pg = $(".fill > .panel.grow"); if (!f || !pg) return; f.classList.add("answered"); requestAnimationFrame(function () { if (pg.getBoundingClientRect().height < 76) { pg.style.display = "none"; fillUp(); } else fitPic(); }); }
/* a person's picture that takes the room that is left: in a short strip the face is framed whole, in a tall one the person is */
function fitPic() { var pg = $(".fill > .panel[data-who]"); if (!pg) return; var h = pg.getBoundingClientRect().height, close = h < 150, who = pg.getAttribute("data-who"); if (pg.getAttribute("data-close") === String(close)) return; pg.setAttribute("data-close", String(close)); var s = pg.querySelector(".ph, svg"); if (s) { s.outerHTML = close ? sceneFace(who) : sceneOne(who, ""); place(); } }
/* taps: the question, the options, and the coach's line that opens with the right answer */
VIEW.taps = function (st) {
  var r = RUN, k = S.sub, Q = st.qs[k], last = k === st.qs.length - 1, lt = "ABC";
  /* what the question is about, above the options: a person, the sheet it describes or the line it's about. It takes the room that is left. */
  var pic = !Q.pic ? "" : Q.pic.who ? '<div class="panel grow" data-who="' + Q.pic.who + '">' + sceneOne(Q.pic.who, "") + '<div class="who">' + whoTag(Q.pic.who) + '</div></div>'
    : Q.pic.two ? '<div class="panel grow">' + sceneTwo(Q.pic.two[0], Q.pic.two[1], "") + '</div>'
    : Q.pic.sheet ? '<div class="panel grow paper">' + sceneSheet(Q.pic.sheet, Q.pic.day) + '</div>'
    : Q.pic.line ? '<div class="picpet">' + pet(Q.pic.line, { top: false, glow: Q.pic.glow, sheet: true }) + '</div>' : "";
  var opts = Q.tally
    ? '<div class="opts row tallies" id="opts">' + Q.opts.map(function (o, i) { return '<button class="opt" data-i="' + i + '"><span class="tn">' + q(o) + '</span>' + tally(Q.tally[i][0], Q.tally[i][1], o + ": " + Q.tally[i][0] + " signatures, " + Q.tally[i][1] + " count") + '</button>'; }).join("") + '</div>'
    : Q.pics
    ? '<div class="pics" id="opts">' + Q.pics.map(function (p, i) { return '<button class="pic" data-i="' + i + '" aria-label="' + lt[i] + ". " + esc(Q.alt[i]) + '"><span class="lt">' + lt[i] + '</span>' + PICS[p]() + '</button>'; }).join("") + '</div>'
    : '<div class="opts' + (Q.row && Q.opts.length > 2 ? " tall" : Q.row ? " row" : "") + '" id="opts">' + Q.opts.map(function (o, i) { return '<button class="opt' + (Q.quote ? " qt" : "") + '" data-i="' + i + '">' + (Q.row ? "" : '<span class="lt">' + lt[i] + '</span>') + '<span>' + (Q.quote ? "“" + q(o) + "”" : q(o)) + '</span></button>'; }).join("") + '</div>';
  top({});
  show(kick(st) + (k === 0 && st.coach ? '<div class="coach" id="coach">' + q(st.coach.text) + '</div>' : "") + '<h1>' + q(Q.ask) + '</h1><div class="fill">' + pic + opts + '<div id="why"></div></div><div id="ft"></div>', st.qs.length > 1 ? "abcd"[k] : "");
  if (k === 0 && st.coach) sayLine(st.coach, r);
  fitPic();
  [].forEach.call(document.querySelectorAll("#opts button"), function (b) {
    b.onclick = function () {
      var i = +b.getAttribute("data-i"), box = $("#opts"); if (box.classList.contains("done")) return; box.classList.add("done"); stopSound();
      var guess = /^Guess\b/.test(st.name); /* a guess isn't a test: the pick is kept plain, and the answer turns green */
      [].forEach.call(box.children, function (x, j) { x.classList.add(j === Q.right ? "right" : j === i ? (guess ? "picked" : "wrong") : "faded"); x.disabled = true; });
      var c = $("#coach"); if (c) c.remove();
      $("#why").innerHTML = why(i === Q.right, Q.after.text);
      shrinkPic();
      $("#ft").innerHTML = foot(btn(last ? nextLabel() : "Next: question " + (k + 2) + " of " + st.qs.length, "go")) + (Q.sources ? '<button class="link" id="src">' + q(SH.sources) + '</button>' : "");
      $("#go").onclick = function () { last ? nextStep() : go(S.step, k + 1); };
      if ($("#src")) $("#src").onclick = sources;
      sayLine(Q.after, RUN);
    };
  });
};

/* Catch the mistake: one planted mistake. It ends on the tap and its answer; nothing is said out loud there. */
VIEW.spot = function (st) {
  var r = RUN;
  top({ pp: true });
  show(kick(st) + '<div class="fill" id="sf"><div class="panel" id="panel"></div><div id="ask"></div></div><div id="ft"></div>', "");
  $("#panel").onclick = function () { stopSound(); };
  playScenes({ coach: st.coach, scenes: [{ who: st.who, stopped: st.stopped, lines: st.lines }] }, st.by).then(function (ok) {
    if (!ok || r !== RUN) return;
    noPause(); $("#panel").classList.add("short"); var cp = $("#capts"); if (cp) cp.innerHTML = "";
    $("#ask").innerHTML = '<h1>' + q(st.ask) + '</h1><div class="opts two" id="opts">' + st.opts.map(function (o, i) { return '<button class="opt" data-i="' + i + '"><span>' + q(o) + '</span></button>'; }).join("") + '</div><div id="why"></div>';
    $("#ft").innerHTML = '<button class="link" id="again">Hear it again</button>';
    $("#again").onclick = function () { go(S.step, 0); };
    [].forEach.call(document.querySelectorAll("#opts button"), function (b) {
      b.onclick = function () {
        var i = +b.getAttribute("data-i"), box = $("#opts"); if (box.classList.contains("done")) return; box.classList.add("done");
        [].forEach.call(box.children, function (x, j) { x.classList.add(j === st.right ? "right" : j === i ? "wrong" : "faded"); x.disabled = true; });
        $("#why").innerHTML = why(i === st.right, st.after, true);
        $("#ft").innerHTML = foot(btn(nextLabel(), "go")); $("#go").onclick = nextStep;
      };
    });
  });
};

/* Your 2nd try: the ready beat, then each passerby, then (lessons 3 to 5) a must that gives one more try */
VIEW.try2 = function (st) {
  var sub = S.sub;
  if (sub === 0) return vReady(st, st.coach, function () { S.people = []; S.redo = {}; S.keep0 = null; S.retried = false; go(S.step, 1); });
  if (sub === 90) return vAgain(st);
  var k = Math.floor((sub - 1) / 2), P = st.people[k], card = (sub - 1) % 2 === 1, own = LN === 2 || (LN === 3 && k === 0), again = (S.redo && S.redo[k]) || S.retried ? "2" : "";
  if (card) return vChecks(st, k, "abcdefgh"[sub] + again);
  talk({ st: st, key: LN + "." + P.who, who: P.who, coach: P.coach, set: P.set, opens: P.opens, replies: P.replies, walk: P.walk, line: P.line, fill: P.fill, hint: P.hint, opener: LN === 2 || (LN === 3 && k === 0), tag: ("abcdefgh"[sub] || "") + again, again: !!S.retried,
    onEnd: function (T) {
      var g = T.grade(); if (!g.quote) g.quote = T.pieces.join(" ");
      if (LN === 3 && k === 0) { g.musts = SIGG.mustsMissed(3, g.hits); if (S.keep0) { g = better(S.keep0, g); S.keep0 = null; } }
      S.people[k] = g;
      if (own) return go(S.step, sub + 1);
      if (LN === 5 && g.untrue && !S.retried) return try2Done(st);
      if (k + 1 < st.people.length) return go(S.step, sub + 2);
      try2Done(st);
    } });
};
/* the ready beat: one line on what happens next, the lesson's heads-up line and Ready. Nothing graded starts without this tap. */
function vReady(st, coach, onReady, extra, sub, result) {
  var r = RUN;
  top(result ? { result: true } : {});
  show(kick(st) + '<div class="panel cap">' + sceneStore() + '</div>' + (extra || "") + (coach ? '<div class="coach q3">' + q(coach.text) + '</div>' : "") + (L.headsUp ? '<div class="callout">' + q(L.headsUp) + '</div>' : "") + foot(btn(SH.ready, "go")), sub || "a");
  $("#go").onclick = function () { audio(); onReady(); };
  if (coach) sayLine(coach, r);
}
/* after one passerby: who it was, what you said, that try's four checks, and who is next */
function vChecks(st, k, sub) {
  var P = st.people[k], g = S.people[k] || { hits: [false, false, false, false] }, nextP = st.people[k + 1];
  var voidTry = LN === 2 && (g.untrue || g.promise), redo = voidTry && !(S.redo = S.redo || {})[k];
  if (LN === 3) g.musts = SIGG.mustsMissed(3, g.hits);
  var again = LN === 3 && k === 0 && !S.retried && (g.untrue || g.promise || g.musts.length), up = redo || again ? null : nextP;
  /* lesson 3: what gives one more try (a must, something untrue, a promise) is said on this card, so one Ready starts it */
  var oneMore = !again ? "" : g.untrue || g.promise ? fixBlock(g, true) : '<div class="callout must"><b class="cl" style="margin:0">' + q(L.parts[g.musts[0]].must) + '</b></div>';
  top({ result: true });
  /* with the untrue words and the true ones on the card there is no room for the big picture: her face and name stay, small */
  var small = again && (g.untrue || g.promise);
  show(kick(st) + '<div class="fill">' + (small ? '<div class="nextp" style="margin:0">' + face(P.who) + '<span>' + whoTag(P.who) + '</span></div>' : '<div class="panel short" data-who="' + P.who + '">' + sceneFace(P.who) + '<div class="who">' + whoTag(P.who) + '</div>' + (st.people.length > 2 ? '<div class="who r">' + (k + 1) + " of " + st.people.length + '</div>' : "") + '</div>') + (again ? "" : saidBlock(g.quote)) +
    '<ul class="rows">' + L.parts.map(function (p, i) { return g.hits[i] ? row("on", p.done) : fixRow(p, g, i); }).join("") + '</ul>' +
    (voidTry ? fixBlock(g, redo) : "") + oneMore + (again && L.headsUp ? '<div class="callout">' + q(L.headsUp) + '</div>' : "") + (!again && P.from && g.from ? '<div class="from">' + ICON.ok + '<span>' + q(P.from) + '</span></div>' : "") + '</div>' +
    (up ? '<div class="nextp">' + face(up.who) + '<span>' + whoTag(up.who) + '</span></div>' : "") + foot(btn(redo || again || nextP ? SH.ready : nextLabel(), "go")), sub);
  expr(P.who, g.hits.filter(Boolean).length >= 3 ? "warm" : "neutral");
  $("#go").onclick = function () {
    if (redo) { S.redo[k] = true; return go(S.step, S.sub - 1); } /* lesson 2: an untrue opener gets one more try with the same passerby */
    if (again) { S.retried = true; S.keep0 = g; S.score = g; audio(); return go(S.step, 1); } /* lesson 3: a missed must gets one more try before Luis */
    if (nextP) return go(S.step, S.sub + 1);
    try2Done(st);
  };
}
/* the try is over: score it, and give one more try for a must, an untrue statement or a promise */
function scoreNow(st) {
  var P = S.people, s;
  if (LN === 2) { var list = P.filter(Boolean); s = SIGG.score2(list); var b = list[s.pick] || {}; s.quote = b.quote; s.who = P.indexOf(b) >= 0 ? st.people[P.indexOf(b)].who : null; }
  else if (LN === 5) { s = SIGG.score5(P[0], P[1] || null); s.who = st.people[P[1] ? 1 : 0].who; }
  else if (LN === 3) { s = P[0]; s.from2 = P[0].from; s.from1 = !!(P[1] && P[1].from); s.who = st.people[0].who; }
  else { s = P[0]; s.who = st.people[0].who; }
  s.musts = SIGG.mustsMissed(LN, s.hits);
  return s;
}
function better(a, b) { if (!a) return b; if (!b) return a; var am = (a.musts || []).length + (a.untrue || a.promise ? 1 : 0), bm = (b.musts || []).length + (b.untrue || b.promise ? 1 : 0); return b.n > a.n || (b.n === a.n && bm <= am) ? b : a; }
function try2Done(st) {
  var s = scoreNow(st), again = LN !== 2 && (s.untrue || s.promise || s.musts.length);
  if (LN === 2 || !again || S.retried) {
    var best = S.retried && LN !== 3 ? better(S.score, s) : s; /* the better score stands */
    best.open = again ? (s.musts.length ? s.musts : SIGG.mustsMissed(LN, [false, false, false, false]).slice(0, 1)) : [];
    S.score = best; S.mustOpen = best.open;
    var m = saved().must || {}; if (best.open.length) m[LN] = best.open; else delete m[LN]; save({ must: m });
    return go(nextIndex(), 0);
  }
  S.score = s; S.retried = true; go(S.step, 90);
}
function vAgain(st) {
  var s = S.score, i = (s.musts || [])[0];
  vReady(st, null, function () { S.people = []; go(S.step, 1); }, s.untrue || s.promise ? fixBlock(s, true) : '<div class="callout must"><b class="cl" style="margin:0">' + q(L.parts[i].must) + '</b></div>', "r", true);
}

/* the feedback card (three blocks), then the lesson end */
VIEW.end = function (st) {
  if (S.sub === 0 && LN !== 1) return vFeedback(st, S.score, function () { go(S.step, 1); }, "Finish lesson " + LN, "a");
  vLessonEnd(st);
};
function ring(n, of, from) {
  var R = 34, C = 2 * Math.PI * R;
  return '<svg viewBox="0 0 84 84" role="img" aria-label="' + n + " of " + of + '"><circle cx="42" cy="42" r="' + R + '" fill="none" stroke="var(--line)" stroke-width="8"/><circle class="ring-arc" cx="42" cy="42" r="' + R + '" fill="none" stroke="var(--green)" stroke-width="8" stroke-linecap="round" transform="rotate(-90 42 42)" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - (from == null ? n : from) / of)).toFixed(1) + '" data-to="' + (C * (1 - n / of)).toFixed(1) + '"/><text x="42" y="48" text-anchor="middle" font-family="Figtree, sans-serif" font-weight="800" font-size="19" fill="#262320">' + n + "/" + of + '</text></svg>';
}
function vFeedback(st, s, onNext, label, sub, extra) {
  s = s || { hits: [false, false, false, false], n: 0 };
  var done = [], fix = [], t = SIGG.tipFor(s.hits), n = s.hits.filter(Boolean).length;
  L.parts.forEach(function (p, i) { if (s.hits[i]) done.push(row("on", p.done)); else fix.push(fixRow(p, s, i)); });
  var from = [];
  if (LN === 2 && S.people[1] && S.people[1].from) from.push(prevTry().people[1].from);
  if (LN === 3) { var pp = prevTry().people; if (s.from2) from.push(pp[0].from); if (s.from1) from.push(pp[1].from); }
  if ((LN === 4 || LN === 5) && s.from) from.push(prevTry().people[0].from);
  var who = LN === 1 ? st.who : s.who;
  /* said again on the one more try: something untrue or a promise still can't pass, so the card says so where the tip would be */
  var still = (s.untrue && !(LN === 5 || LN === 2)) || (s.promise && LN !== 2) ? fixBlock(s, false) : "";
  top({ result: true });
  show(kick(LN === 1 ? st : "Feedback") + '<h1 class="scoreh">' + n + ' of 4</h1><div class="fill">' +
    (who && !(still && extra) ? '<div class="panel short" data-who="' + who + '">' + sceneFace(who) + '<div class="who">' + whoTag(who) + '</div></div>' : "") + (LN === 2 ? saidBlock(s.quote) : "") +
    (done.length ? '<div><div class="lbl">' + q(SH.blocks[0]) + '</div><ul class="rows">' + done.join("") + '</ul></div>' : "") +
    (fix.length ? '<div><div class="lbl">' + q(SH.blocks[1]) + '</div><ul class="rows">' + fix.join("") + '</ul></div>' : "") +
    (still ? '<div>' + still + '</div>' : '<div><div class="lbl">' + q(SH.blocks[2]) + '</div><div class="tip">' + q(t < 0 ? L.tipAll : L.parts[t].tip) + '</div></div>') +
    from.map(function (f) { return '<div class="from">' + ICON.ok + '<span>' + q(f) + '</span></div>'; }).join("") + (extra || "") + '</div>' + foot(btn(label, "go")), sub);
  if (who) expr(who, n >= 3 ? "warm" : "neutral");
  $("#go").onclick = onNext;
}
function prevTry() { for (var i = L.steps.length - 1; i >= 0; i -= 1) if (L.steps[i].kind === "try2") return L.steps[i]; return L.steps[S.step]; }
function vLessonEnd(st) {
  var left = 5 - LN, open = S.mustOpen && S.mustOpen.length, musts = saved().must || {}, anyOpen = Object.keys(musts).length > 0;
  if (st.finish) save({ fin: true });
  var finish = st.finish || (PRACTICE && saved().fin), other = +Object.keys(musts)[0] || 0; /* a practice round reached from lesson 5's end finishes like lesson 5 */
  S.done[S.step] = true; top({ result: true });
  show('<div class="fill"><div class="ringrow">' + (finish ? ring(5, 5, st.finish ? 4 : 5) : ring(LN, 5, LN - 1)) + '<div><h1 style="margin:0">' + q(SH.end.done.replace("{n}", LN)) + '</h1>' + (left && !finish ? '<div class="togo">' + q(SH.end.togo.replace("{m}", left)) + '</div>' : "") + '</div></div>' +
    '<div class="panel grow end">' + coverPic() + '</div>' + /* the lesson's picture takes the room the words leave */
    (finish ? '<div><h1 class="lg" style="margin:0">' + q(anyOpen ? SH.ready5wait : SH.ready5) + '</h1><p class="course">' + q(SH.course) + '</p></div>'
      : '<div class="nx"><div class="lbl" style="margin:0">' + q(SH.end.whats) + '</div><p>' + q(SH.end.lead) + '</p><ol>' + SH.titles.map(function (t, i) { return i < LN ? "" : '<li class="' + (i === LN ? "lit" : "") + '"><i>' + (i + 1) + '</i><span>' + q(t) + (i === LN ? ' <em>' + q(SH.end.tomorrow) + '</em>' : "") + '</span></li>'; }).join("") + '</ol></div>') +
    '<div>' + (open || (finish && anyOpen) ? mustNote(open ? LN : other, musts) : "") + '<p class="shift">' + q(L.nextShift) + '</p>' + (L.endExtra ? '<p class="shift sm">' + q(L.endExtra) + '</p>' : "") + '</div></div>' +
    (finish && anyOpen ? foot(btn(other === LN ? SH.next.try2 : "Next: lesson " + other + "’s 2nd try", "prac")) + '<button class="link" id="go">' + q(SH.done) + '</button>' : foot(btn(SH.done, "go"))), LN === 1 ? "" : "b");
  var ep = $(".fill > .panel.end"); if (ep && ep.getBoundingClientRect().height < 104) { ep.style.display = "none"; fillUp(); } /* a sliver of a picture is no picture */
  $("#go").onclick = function () { go(-1); };
  if ($("#prac")) $("#prac").onclick = function () { if (other === LN) { S.retried = false; go(prevIndex(), 0); } else location.href = "?l=" + other + "&practice&at=" + (try2At(other) + 1) + ".0"; };
  requestAnimationFrame(function () { setTimeout(function () { var a = $(".ring-arc"); if (a) a.setAttribute("stroke-dashoffset", a.getAttribute("data-to")); }, 250); });
}
function prevIndex() { for (var i = 0; i < L.steps.length; i += 1) if (L.steps[i].kind === "try2") return i; return 0; }
function try2At(n) { var s = DATA.lessons[n].steps; for (var i = 0; i < s.length; i += 1) if (s[i].kind === "try2") return i; return 0; }
/* the step still to practice, in the script's own words for it (its must sentence), then "Practice this before your next shift." */
function mustNote(n, musts) { var i = (musts[n] || [])[0], p = DATA.lessons[n] && DATA.lessons[n].parts[i], m = p && p.must ? p.must.replace(/ One more time\.$/, "") : ""; return '<p class="shift" style="color:var(--red)">' + (m ? q(m) + " " : "") + q(SH.practice) + '</p>'; }
