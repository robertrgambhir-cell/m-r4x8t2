/* ---------------- lesson 1's own steps, lesson 4's line checks, the first-shift card ---------------- */
/* how the county checks: four cards, one at a time as the coach reads them */
VIEW.cards = function (st) {
  var r = RUN + 0;
  top({ pp: true });
  show(kick(st) + '<div class="coach q3" id="coach">' + q(st.coach.text) + '</div><div class="checks4" id="stack">' + st.cards.map(function (c, i) { var m = c.text.match(/^(\d)\. (.*)$/); return '<div class="cardq">' + CHECK_PICS[i] + '<span><i>' + m[1] + '</i>' + q(m[2]) + '</span></div>'; }).join("") + '</div>' + foot(btn(nextLabel(), "go")), "");
  $("#go").onclick = nextStep;
  (async function () {
    if (!(await sayLine(st.coach, r))) return;
    for (var i = 0; i < st.cards.length; i += 1) { $("#stack").children[i].classList.add("on"); if (!(await sayLine(st.cards[i], r))) return; await wait(150); }
    $("#coach").innerHTML = q(st.after.text);
    if (!(await sayLine(st.after, r))) return;
    noPause(); /* nothing left to play */
  })();
};
/* sort five lines: Counts or Thrown out, with the reason after each tap. The card's words name the signer, as the county reads the voter
   record (B3); the picture carries no name tag and its count sits on it, as on a 2nd try's card (version 8: no name tags, no eyebrows) */
VIEW.sort = function (st) {
  var r = RUN + 0, k = S.sub, n = st.cards.length;
  top({});
  if (k >= n) {
    var out = st.cards.filter(function (c) { return c.right === 1; });
    show(kick(st) + '<div class="fill"><div class="quad">' + out.map(function (c) { return '<div class="panel">' + sceneOne(c.face, "") + '</div>'; }).join("") + '</div><div class="coach q3" style="font-size:calc(19 * var(--u))">' + q(st.after.text) + '</div></div>' + foot(btn(nextLabel(), "go")), "abcdefgh"[n]); /* the screen after the last card: Sig 1.3f with five cards */
    $("#go").onclick = nextStep; sayLine(st.after, r); return;
  }
  var C = st.cards[k];
  show(kick(st) + (k === 0 ? '<div class="coach" id="coach">' + q(st.coach.text) + '</div>' : "") + '<div class="fill"><div class="panel grow" data-who="' + C.face + '">' + sceneOne(C.face, "") + '<div class="who r">Line ' + (k + 1) + " of " + n + '</div></div><p class="sctext">' + q(C.text) + '</p>' + (st.ask ? '<div class="sqq">' + q(st.ask) + '</div>' : "") +
    '<div class="opts row" id="opts">' + st.buttons.map(function (b, i) { return '<button class="opt" data-i="' + i + '"><span style="flex:1">' + q(b) + '</span></button>'; }).join("") + '</div><div id="why"></div></div><div id="ft"></div>', "abcdef"[k]);
  if (k === 0) sayLine(st.coach, r);
  fitPic();
  [].forEach.call(document.querySelectorAll("#opts button"), function (b) {
    b.onclick = function () {
      var i = +b.getAttribute("data-i"), box = $("#opts"); if (box.classList.contains("done")) return; box.classList.add("done"); stopSound();
      [].forEach.call(box.children, function (x, j) { x.classList.add(j === C.right ? "right" : j === i ? "wrong" : "faded"); x.disabled = true; });
      var c = $("#coach"); if (c) c.remove();
      $("#why").innerHTML = why(i === C.right, C.why, true);
      shrinkPic();
      $("#ft").innerHTML = foot(btn(k + 1 < n ? "Next: line " + (k + 2) + " of " + n : st.last || nextLabel(), "go")); /* a button names what comes next (version 8) */
      $("#go").onclick = function () { go(S.step, k + 1); };
    };
  });
};
/* say it: the question to Marisol, then why you ask. This is lesson 1's scored part. */
VIEW.say = function (st) {
  var sub = S.sub;
  if (sub === 0) S.retried = false; /* sub 0: the talk opens on its sheet (rules 16 and 49a); sub 1: one more try, no sheet */
  if (sub === 90) { vReady(st, null, function () { go(S.step, 1); }, fixBlock(S.score, true), "r", true, SH.tryAgain); sayFix(S.score); return; }
  if (sub === 2) return vFeedback(st, S.score, nextStep, nextLabel(), "c", '<div class="tip" style="background:var(--green-soft)">' + q(st.oneWay) + '</div>');
  talk({ st: st, key: "1.marisol", who: st.who, sheet: sub === 0 ? { text: st.coach.text, coach: st.coach, extra: L.headsUp ? '<div class="callout">' + q(L.headsUp) + '</div>' : "", label: st.ready || SH.ready } : null, replies: Object.assign({ ask: st.ask, askOther: st.askOther }, st.replies), walk: true, hint: st.hint, hintAfter: "ask|askOther", tag: "b",
    onEnd: function (T) {
      var g = T.grade(); g.musts = [];
      if ((g.promise || g.untrue) && !S.retried) { S.retried = true; S.score = g; return go(S.step, 90); } /* a promise or something untrue: one more try */
      S.score = g; go(S.step, 2); /* the one more try is the one that stands: a promise or an untrue line can't be averaged away */
    } });
};
/* one whole stop: watch a trained canvasser do the job once, from her view, then say the two lines that are the law */
VIEW.stop = function (st) {
  var r = RUN + 0, sub = S.sub;
  if (sub === 0) { /* the guidance on a sheet, then the stop plays (rule 49a) */
    var sc = { who: st.who, lines: st.lines, after: st.after };
    top({ pp: true });
    show(kick(st) + scenePanel(sc, st.labels) + '<div class="grow" style="flex:0 0 8px"></div>', "a");
    $("#panel").onclick = function () { stopSound(); };
    guide({ text: st.coach.text, coach: st.coach, label: st.play || SH.play }).then(function (ok) { return ok && r === RUN ? playScene(sc, { by: "lena" }) : false; }).then(function (ok) { if (ok && r === RUN) go(S.step, 1); });
    return;
  }
  var k = sub - 1, line = st.say[k], T = { n: 0 };
  top({});
  show('<div class="panel" id="panel">' + sceneOne(st.who, "") + '</div><div class="sayq"><small>' + q(st.sayLead) + '</small>“' + q(line) + '”</div><div class="coach" id="coach" style="min-height:0"></div>' + micHtml() + '<div id="ft"></div>', "bc"[k]);
  var finish = function (text) {
    if (SIGG.misheard(text)) { micState("idle", "<b>" + q(SH.misheard) + "</b>"); return; }
    /* "Say each one once": the line has to be the line. Something untrue gets "Said something that isn't true." and the line
       stays up. Other words get "I missed that. Try once more." twice, then the lesson moves on so nobody is stuck here. */
    var g = SIGG.grade3(text, ST), said = k === 0 ? g.paid || /\bpaid\b/.test(SIGG.norm(text)) : g.hours && g.tax;
    if (SIGG.untrueOf(text)) { micState("idle", "<b>" + q(SH.untrue) + "</b>"); return; }
    T.n += 1;
    if (!said && T.n < 3) { micState("idle", "<b>" + q(SH.misheard) + "</b>"); return; }
    M.used = true; micState("wait", "");
    if (k + 1 < st.say.length) return go(S.step, sub + 1);
    $("#coach").innerHTML = q(st.done.text);
    sayLine(st.done, r).then(function () { if (r !== RUN) return; $(".mic").style.display = "none"; $("#ft").innerHTML = foot(btn(nextLabel(), "go")); $("#go").onclick = nextStep; });
  };
  if ($("#mic")) { micState("idle"); $("#mic").onclick = function () { if (!SR) { typedOn(finish); return; } if (M.rec) { M.rec.stop(); return; } audio(); stopSound(); micState("on"); M.rec = listen({ onStart: function () { if (r === RUN) liveGo(); }, onWords: function (t) { if (r === RUN) liveWords(t); }, onDone: function (t) { M.rec = null; if (r === RUN) finish(t); }, onError: function (c) { M.rec = null; if (r === RUN) micState("idle", micErr(c)); } }); }; }
};
/* check four lines: tap the box that gets the line thrown out, or Good to go */
VIEW.lines = function (st) {
  var r = RUN + 0, k = S.sub, X = st.lines[k], last = k === st.lines.length - 1;
  top({});
  show((TEXTC && k === 0 && st.coach ? '<p class="coachw">' + q(st.coach.text) + '</p>' : "") + '<h1 class="lineh">Line ' + X.tag + (st.ask ? ': ' + q(st.ask.charAt(0).toLowerCase() + st.ask.slice(1)) : "") + '</h1><div id="pw" class="psheet">' + pet(X.fill, { tap: true, big: true, note: X.note, sheet: true }) + '</div>' +
    '<div class="fill"><div class="opts" id="opts"><button class="opt" id="okb"><span style="flex:1;text-align:center">' + q(st.ok) + '</span></button></div><div id="why"></div></div><div id="ft"></div>', "abcd"[k]);
  if (k === 0) sayLine(st.coach, r);
  var done = false, pick = function (key) {
    if (done) return; done = true; stopSound();
    var marks = {}; if (X.right !== "ok") marks[X.right] = "right"; if (key !== X.right && key !== "ok") marks[key] = "wrong";
    $("#pw").innerHTML = pet(X.fill, { big: true, note: X.note, marks: marks, sheet: true }); fitHw();
    $("#okb").classList.add(X.right === "ok" ? "right" : key === "ok" ? "wrong" : "faded"); $("#okb").disabled = true; $("#opts").classList.add("done");
    var c = $("#coach"); if (c) c.remove();
    $("#why").innerHTML = why(key === X.right, X.why, true);
    $("#ft").innerHTML = foot(btn(last ? nextLabel() : labelTo(S.step, k + 1), "go")); $("#go").onclick = function () { last ? nextStep() : go(S.step, k + 1); };
  };
  $("#pw").onclick = function (e) { var b = e.target.closest ? e.target.closest("[data-box]") : null; if (b) pick(b.getAttribute("data-box")); };
  $("#okb").onclick = function () { pick("ok"); };
};
/* your line: the declaration. Two of three cost the whole sheet; tap both. */
VIEW.decl = function (st) {
  var r = RUN + 0, sel = [];
  top({});
  /* one header, the question, with the coach's words under it while they play (version 8: one header per screen) */
  show('<h1>' + q(st.ask) + '</h1><p class="sub coachsub" id="coach">' + q(st.coach.text) + '</p><div class="opts decls" id="opts">' +
    st.cards.map(function (c, i) { return '<button class="decl" data-i="' + i + '">' + declPic(["own", "blank", "other"][i]) + '<span>' + q(c) + '</span></button>'; }).join("") + '</div><div class="fill"><div id="why"></div></div><div id="ft"></div>', "");
  sayLine(st.coach, r);
  [].forEach.call(document.querySelectorAll(".decl"), function (b) {
    b.onclick = function () {
      var i = +b.getAttribute("data-i"); if (sel.length >= 2) return;
      if (sel.indexOf(i) >= 0) { sel.splice(sel.indexOf(i), 1); b.classList.remove("sel"); return; }
      sel.push(i); b.classList.add("sel");
      if (sel.length < 2) return;
      stopSound();
      [].forEach.call(document.querySelectorAll(".decl"), function (x, j) { x.classList.remove("sel"); x.classList.add(st.right.indexOf(j) >= 0 ? "right" : sel.indexOf(j) >= 0 ? "wrong" : "keep"); x.disabled = true; });
      var ok = st.right.every(function (x) { return sel.indexOf(x) >= 0; }); $("#opts").classList.add("done");
      $("#coach").remove();
      $("#why").innerHTML = why(ok, st.after.text);
      $("#ft").innerHTML = foot(btn(nextLabel(), "go")); $("#go").onclick = nextStep;
      sayLine(st.after, RUN);
    };
  });
};
/* the first-shift card: one page, sent when lesson 1 ends */
function vCard() {
  var C = DATA.card;
  $("#top").innerHTML = ""; $("#top").style.display = "none"; $("#tag").textContent = "Sig card"; /* the card has no lesson bar, so the rules get its room */
  $("#scr").innerHTML = '<span class="drive"><b>' + esc(ST.drive.name) + '</b><small>' + esc(ST.drive.measure) + ' · petition drive</small></span><h1 class="lg">' + q(C.title) + '</h1><ol class="rules">' + C.rules.map(function (x) { return '<li><b>' + q(x[0]) + '</b> ' + q(x[1]) + '</li>'; }).join("") + '</ol>';
  /* the card is one page: all eight rules show with no scrolling. The type is as large as fits, and what room is left goes between the rules. */
  var fit = function () {
    var r = $(".rules"); if (!r) return; var li = r.children, f = 18, i;
    for (i = 0; i < li.length; i += 1) li[i].style.marginBottom = "0";
    r.style.fontSize = f + "px";
    while (f > 10.5 && r.scrollHeight > r.clientHeight + 0.5) { f -= 0.25; r.style.fontSize = f + "px"; }
    var used = 0; for (i = 0; i < li.length; i += 1) used += li[i].getBoundingClientRect().height;
    var gap = Math.max(0, Math.min(16, Math.floor((r.clientHeight - used - 1) / (li.length - 1))));
    for (i = 0; i < li.length - 1; i += 1) li[i].style.marginBottom = gap + "px";
  };
  fit(); window.addEventListener("resize", fit); if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
}

/* ---------------- start ---------------- */
document.title = LN ? "Lesson " + LN + ": " + L.title + " · Warmup" : "Before your first signature · Warmup";
var OPEN = !DATA.open || qs.has("preview") || DATA.open.indexOf(LN || "card") >= 0; /* a lesson that isn't open yet shows nothing of itself */
if (!OPEN) { $("#top").style.display = "none"; $("#tag").textContent = ""; $("#scr").innerHTML = '<div class="fill" style="justify-content:center"><h1 style="text-align:center">' + q(LN ? "Lesson " + LN + " isn't open yet." : "This card isn't open yet.") + '</h1></div>'; }
else if (!LN) vCard();
else if (qs.has("at")) { var at0 = qs.get("at").split("."); S.step = -1; go(Math.max(0, Math.min(L.steps.length - 1, (parseInt(at0[0], 10) || 1) - 1)), parseInt(at0[1], 10) || 0); }
else go(-1);
window.__sgBusy = function () { return playing.length > 0 || !!READ; };
window.__sg = { S: S, go: go, L: L, LN: LN, time: function () { var now = performance.now(), ms = Object.assign({}, TM.ms); if (TM.at >= 0) ms[TM.at] = (ms[TM.at] || 0) + now - TM.t0; return ms; }, run: function () { return RUN; }, M: M,
  walk: { walkAt: walkAt, sceneWalk: sceneWalk, walkable: walkable, IMG: IMG, STRIDE: STRIDE } }; /* the walk checks (tests/sig-stride.cjs) draw a walker at set points */
