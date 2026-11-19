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
  $("#top").innerHTML = (S.step < 0 ? "" : '<button class="x" id="close" aria-label="Back">' + ICON.back + '</button>') + '<div class="bar">' + segs + '</div>' + (o.pp ? '<button class="pp" id="pp" aria-label="Pause">' + ICON.pause + '</button>' : "");
  if ($("#close")) $("#close").onclick = back;
  if ($("#pp")) $("#pp").onclick = function () { PAUSED = !PAUSED; if (AC) { PAUSED ? AC.suspend() : AC.resume(); } $("#pp").innerHTML = PAUSED ? ICON.play : ICON.pause; $("#pp").setAttribute("aria-label", PAUSED ? "Play" : "Pause"); };
  [].forEach.call(document.querySelectorAll(".bar button"), function (b) { var i = +b.getAttribute("data-seg"); if (!S.seen[i] || i >= S.step) { b.disabled = true; return; } b.onclick = function () { go(i, 0); }; });
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
function show(html, sub) { $("#scr").innerHTML = html; tag(sub); fitHw(); }
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
  sh.innerHTML = '<div role="dialog" aria-label="Sources"><h2>Sources</h2><ul>' + (L.sources || []).map(function (g) { return '<li>' + q(g[0]) + ': ' + g[1].map(function (s) { return '<a href="' + esc(s[1]) + '" target="_blank" rel="noopener">' + q(s[0]) + '</a>'; }).join(", ") + (g[2] ? ", " + q(g[2]) : "") + '</li>'; }).join("") + '</ul><p class="fine">The coach and the passersby are AI voices. The Neighborhood Libraries Act, Libraries for All and every person here are made up for practice.</p><button class="btn ghost" id="shx">Close</button></div>';
  $("#app").appendChild(sh); $("#tag").textContent = was + "s"; $("#tag").className = "tag onpic";
  sh.addEventListener("click", function (e) { if (e.target === sh || e.target.id === "shx") { sh.remove(); $("#tag").textContent = was; $("#tag").className = "tag"; } });
}
/* what you said, shown whole or not at all: no clipped words */
function saidBlock(t) { t = tidy(t).replace(/'/g, "’"); return t && t.length <= 230 ? '<div class="said' + (t.length > 110 ? " sm" : "") + '"><b>You said</b>“' + esc(t) + '”</div>' : ""; }
function missedLine(p, g, i) { return g.alt && g.alt[i] && p.missedAlt ? p.missedAlt : p.missed; }
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
  var r = RUN, T = SIGG.talk(cfg.key, ST), who = cfg.who, fill = Object.assign({}, cfg.line || {});
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
      else { var ln = cfg.replies[k]; if (!ln) continue; act(who, ln.act); cap(CAST[who].name, ln.text, "them"); await sayLine(ln, r); if (k === cfg.hintAfter) cap("Coach", cfg.hint || "", "note"); }
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
function vCover() {
  S.step = -1; top({});
  show('<span class="drive" role="img" aria-label="Libraries for All, the Neighborhood Libraries Act petition drive"><b>' + esc(ST.drive.name) + '</b><small>' + esc(ST.drive.measure) + ' · petition drive</small></span>' +
    '<div class="kick" style="margin-top:18px">Lesson ' + LN + ' of 5</div><h1 class="lg">' + q(L.title) + '</h1><div class="meta"><span>5 minutes</span></div>' +
    '<div class="panel">' + sceneTwo("lena", LN === 1 ? "ines" : LN === 2 ? "ben" : LN === 3 ? "tanya" : LN === 4 ? "anika" : "hank", "") + '</div>' +
    (saved().must && saved().must[LN] ? '<p class="shift">' + q(SH.practice) + '</p>' : "") + foot(btn(L.start || SH.start, "start")), "");
  $("#start").onclick = function () { audio(); go(0, 0); };
  /* the lesson's voices load while the cover is read */
  (function walk(x) { if (!x || typeof x !== "object") return; if (x.clip) fetchClip(x.clip); Object.keys(x).forEach(function (k) { walk(x[k]); }); })(L.steps);
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
  top({});
  show(kick(st) + '<h1>' + q(h) + '</h1><div class="fill"><div class="panel short">' + sceneFace(st.who) + '<div class="who">' + whoTag(st.who) + '</div></div>' + saidBlock(t.said) +
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
  function setScene(sc) { var p = $("#panel"); p.innerHTML = sceneTwo(by, sc.who, sc.stopped ? "" : "off-l walk") + '<div class="capts" id="capts"></div>' + (st.labels ? '<div class="labels" id="labels">' + st.labels.map(function (l) { return '<span>' + q(l) + '</span>'; }).join("") + '</div>' : ""); }
  function redraw(o) { var p = $("#pet"); if (p) p.outerHTML = pet(fill, o || {}); fitHw(); }
  setScene(st.scenes[0]);
  if (st.coach) { cap("Coach", st.coach.text, "them"); if (!(await sayLine(st.coach, r))) return false; }
  for (var i = 0; i < st.scenes.length; i += 1) {
    var sc = st.scenes[i]; if (i) setScene(sc);
    if (!sc.stopped) { await enter(sc.who); if (r !== RUN) return false; }
    for (var j = 0; j < sc.lines.length; j += 1) {
      var ln = sc.lines[j], lab = $("#labels");
      if (ln.act === "sheet" || ln.act === "board") { var pr = document.querySelector("#p-" + ln.who + " .prop." + ln.act); if (pr) pr.classList.remove("hid"); } else if (ln.act) act(ln.who === by ? sc.who : ln.who, ln.act);
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

/* taps: the question, the options, and the coach's line that opens with the right answer */
VIEW.taps = function (st) {
  var r = RUN, k = S.sub, Q = st.qs[k], last = k === st.qs.length - 1, lt = "ABC";
  var opts = Q.pics
    ? '<div class="pics" id="opts">' + Q.pics.map(function (p, i) { return '<button class="pic" data-i="' + i + '" aria-label="' + lt[i] + ". " + esc(Q.alt[i]) + '"><span class="lt">' + lt[i] + '</span>' + PICS[p]() + '</button>'; }).join("") + '</div>'
    : '<div class="opts' + (Q.row && Q.opts.length > 2 ? " tall" : Q.row ? " row" : "") + '" id="opts">' + Q.opts.map(function (o, i) { return '<button class="opt' + (Q.quote ? " qt" : "") + '" data-i="' + i + '">' + (Q.row ? "" : '<span class="lt">' + lt[i] + '</span>') + '<span>' + (Q.quote ? "“" + q(o) + "”" : q(o)) + '</span></button>'; }).join("") + '</div>';
  top({});
  show(kick(st) + (k === 0 && st.coach ? '<div class="coach" id="coach">' + q(st.coach.text) + '</div>' : "") + '<h1>' + q(Q.ask) + '</h1><div class="fill">' + opts + '<div id="why"></div></div><div id="ft"></div>', st.qs.length > 1 ? "abcd"[k] : "");
  if (k === 0 && st.coach) sayLine(st.coach, r);
  [].forEach.call(document.querySelectorAll("#opts button"), function (b) {
    b.onclick = function () {
      var i = +b.getAttribute("data-i"), box = $("#opts"); if (box.classList.contains("done")) return; box.classList.add("done"); stopSound();
      [].forEach.call(box.children, function (x, j) { x.classList.add(j === Q.right ? "right" : j === i ? "wrong" : "faded"); x.disabled = true; });
      var c = $("#coach"); if (c) c.remove();
      $("#why").innerHTML = why(i === Q.right, Q.after.text);
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
  talk({ st: st, key: LN + "." + P.who, who: P.who, coach: P.coach, set: P.set, opens: P.opens, replies: P.replies, walk: P.walk, line: P.line, fill: P.fill, hint: P.hint, opener: LN === 2 || (LN === 3 && k === 0), tag: ("abcdefgh"[sub] || "") + again,
    onEnd: function (T) {
      var g = T.grade(); if (!g.quote) g.quote = T.pieces.slice(LN === 3 && k === 0 ? 1 : 0).join(" ");
      if (LN === 3 && k === 0) { g.musts = SIGG.mustsMissed(3, g.hits); if (S.keep0) { g = better(S.keep0, g); S.keep0 = null; } }
      S.people[k] = g;
      if (own) return go(S.step, sub + 1);
      if (LN === 5 && g.untrue) return try2Done(st);
      if (k + 1 < st.people.length) return go(S.step, sub + 2);
      try2Done(st);
    } });
};
/* the ready beat: one line on what happens next, the lesson's heads-up line and Ready. Nothing graded starts without this tap. */
function vReady(st, coach, onReady, extra, sub) {
  var r = RUN;
  top({});
  show(kick(st) + '<div class="panel">' + sceneStore() + '</div>' + (extra || "") + (coach ? '<div class="coach q3">' + q(coach.text) + '</div>' : "") + (L.headsUp ? '<div class="callout">' + q(L.headsUp) + '</div>' : "") + foot(btn(SH.ready, "go")), sub || "a");
  $("#go").onclick = function () { audio(); onReady(); };
  if (coach) sayLine(coach, r);
}
/* after one passerby: who it was, what you said, that try's four checks, and who is next */
function vChecks(st, k, sub) {
  var P = st.people[k], g = S.people[k] || { hits: [false, false, false, false] }, nextP = st.people[k + 1];
  var voidTry = LN === 2 && (g.untrue || g.promise), redo = voidTry && !(S.redo = S.redo || {})[k];
  if (LN === 3) g.musts = SIGG.mustsMissed(3, g.hits);
  var again = LN === 3 && k === 0 && !S.retried && (g.untrue || g.promise || g.musts.length), up = redo ? P : again ? null : nextP;
  top({});
  show(kick(st) + '<div class="fill"><div class="panel short">' + sceneFace(P.who) + '<div class="who">' + whoTag(P.who) + '</div>' + (st.people.length > 2 ? '<div class="who r">' + (k + 1) + " of " + st.people.length + '</div>' : "") + '</div>' + saidBlock(g.quote) +
    '<ul class="rows">' + L.parts.map(function (p, i) { return g.hits[i] ? row("on", p.done) : row("fix", missedLine(p, g, i)); }).join("") + '</ul>' +
    (voidTry ? fixBlock(g, redo) : "") + (P.from && g.from ? '<div class="from">' + ICON.ok + '<span>' + q(P.from) + '</span></div>' : "") + '</div>' +
    (up ? '<div class="nextp">' + face(up.who) + '<span>' + whoTag(up.who) + '</span></div>' : "") + foot(btn(redo || again || nextP ? SH.ready : nextLabel(), "go")), sub);
  expr(P.who, g.hits.filter(Boolean).length >= 3 ? "warm" : "neutral");
  $("#go").onclick = function () {
    if (redo) { S.redo[k] = true; return go(S.step, S.sub - 1); } /* lesson 2: an untrue opener gets one more try with the same passerby */
    if (again) { S.retried = true; S.keep0 = g; S.score = g; return go(S.step, 90); } /* lesson 3: a missed must gets one more try before Luis */
    if (nextP) return go(S.step, S.sub + 1);
    try2Done(st);
  };
}
/* the try is over: score it, and give one more try for a must, an untrue statement or a promise */
function scoreNow(st) {
  var P = S.people, s;
  if (LN === 2) { var list = P.filter(Boolean); s = SIGG.score2(list); var b = list[s.pick] || {}; s.quote = b.quote; s.who = P.indexOf(b) >= 0 ? st.people[P.indexOf(b)].who : null; }
  else if (LN === 5) s = SIGG.score5(P[0], P[1] || null);
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
  vReady(st, null, function () { S.people = []; go(S.step, 1); }, s.untrue || s.promise ? fixBlock(s, true) : '<div class="callout must"><b class="cl" style="margin:0">' + q(L.parts[i].must) + '</b></div>', "r");
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
  L.parts.forEach(function (p, i) { if (s.hits[i]) done.push(row("on", p.done)); else fix.push(row("fix", missedLine(p, s, i))); });
  var from = [];
  if (LN === 2 && S.people[1] && S.people[1].from) from.push(prevTry().people[1].from);
  if (LN === 3) { var pp = prevTry().people; if (s.from2) from.push(pp[0].from); if (s.from1) from.push(pp[1].from); }
  if ((LN === 4 || LN === 5) && s.from) from.push(prevTry().people[0].from);
  var who = LN === 1 ? st.who : s.who;
  top({});
  show(kick(LN === 1 ? st : "Feedback") + '<h1 class="scoreh">' + n + ' of 4</h1><div class="fill">' +
    (who ? '<div class="panel short">' + sceneFace(who) + '<div class="who">' + whoTag(who) + '</div></div>' : "") + (LN === 2 ? saidBlock(s.quote) : "") +
    (done.length ? '<div><div class="lbl">' + q(SH.blocks[0]) + '</div><ul class="rows">' + done.join("") + '</ul></div>' : "") +
    (fix.length ? '<div><div class="lbl">' + q(SH.blocks[1]) + '</div><ul class="rows">' + fix.join("") + '</ul></div>' : "") +
    '<div><div class="lbl">' + q(SH.blocks[2]) + '</div><div class="tip">' + q(t < 0 ? L.tipAll : L.parts[t].tip) + '</div></div>' +
    from.map(function (f) { return '<div class="from">' + ICON.ok + '<span>' + q(f) + '</span></div>'; }).join("") + (extra || "") + '</div>' + foot(btn(label, "go")), sub);
  if (who) expr(who, n >= 3 ? "warm" : "neutral");
  $("#go").onclick = onNext;
}
function prevTry() { for (var i = L.steps.length - 1; i >= 0; i -= 1) if (L.steps[i].kind === "try2") return L.steps[i]; return L.steps[S.step]; }
function vLessonEnd(st) {
  var left = 5 - LN, open = S.mustOpen && S.mustOpen.length, anyOpen = Object.keys(saved().must || {}).length > 0;
  S.done[S.step] = true; top({});
  show('<div class="fill"><div class="ringrow">' + ring(LN, 5, LN - 1) + '<div><h1 style="margin:0">' + q(SH.end.done.replace("{n}", LN)) + '</h1>' + (left ? '<div class="togo">' + q(SH.end.togo.replace("{m}", left)) + '</div>' : "") + '</div></div>' +
    (st.finish ? '<div><h1 class="lg" style="margin:0">' + q(anyOpen ? SH.ready5wait : SH.ready5) + '</h1><p class="course">' + q(SH.course) + '</p></div>'
      : '<div class="nx"><div class="lbl" style="margin:0">' + q(SH.end.whats) + '</div><p>' + q(SH.end.lead) + '</p><ol>' + SH.titles.map(function (t, i) { return i < LN ? "" : '<li class="' + (i === LN ? "lit" : "") + '"><i>' + (i + 1) + '</i><span>' + q(t) + '</span>' + (i === LN ? '<em>' + q(SH.end.tomorrow) + '</em>' : "") + '</li>'; }).join("") + '</ol></div>') +
    '<div>' + (open ? '<p class="shift" style="color:var(--red)">' + q(SH.practice) + '</p>' : "") + '<p class="shift">' + q(L.nextShift) + '</p>' + (L.endExtra ? '<p class="shift sm">' + q(L.endExtra) + '</p>' : "") + '</div></div>' +
    (st.finish && anyOpen ? foot(btn(SH.next.try2, "prac")) + '<button class="link" id="go">' + q(SH.done) + '</button>' : foot(btn(SH.done, "go"))), LN === 1 ? "" : "b");
  $("#go").onclick = function () { go(-1); };
  if ($("#prac")) $("#prac").onclick = function () { var m = saved().must || {}, n = +Object.keys(m)[0]; if (n === LN) { S.retried = true; go(prevIndex(), 0); } else location.href = "?l=" + n; };
  requestAnimationFrame(function () { setTimeout(function () { var a = $(".ring-arc"); if (a) a.setAttribute("stroke-dashoffset", a.getAttribute("data-to")); }, 250); });
}
function prevIndex() { for (var i = 0; i < L.steps.length; i += 1) if (L.steps[i].kind === "try2") return i; return 0; }
