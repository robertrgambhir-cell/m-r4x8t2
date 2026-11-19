/* ---------------- lesson 1's own steps, lesson 4's line checks, the first-shift card ---------------- */
/* how the county checks: four cards, one at a time as the coach reads them */
VIEW.cards = function (st) {
  var r = RUN + 0;
  top({ pp: true });
  show(kick(st) + '<div class="coach q3" id="coach">' + q(st.coach.text) + '</div><div class="fill"><div class="record"><div class="rec-h"><span>Voter record</span><span>County elections office</span></div><div class="stack" id="stack">' + st.cards.map(function (c) { var m = c.text.match(/^(\d)\. (.*)$/); return '<div class="cardq"><i>' + m[1] + '</i><span>' + q(m[2]) + '</span></div>'; }).join("") + '</div></div></div>' + foot(btn(nextLabel(), "go", "ghost")), "");
  $("#go").onclick = nextStep;
  (async function () {
    if (!(await sayLine(st.coach, r))) return;
    for (var i = 0; i < st.cards.length; i += 1) { $("#stack").children[i].classList.add("on"); if (!(await sayLine(st.cards[i], r))) return; await wait(150); }
    $("#coach").innerHTML = q(st.after.text);
    if (!(await sayLine(st.after, r))) return;
    $("#go").classList.remove("ghost");
  })();
};
/* sort six lines: Counts or Thrown out, with the reason after each tap */
VIEW.sort = function (st) {
  var r = RUN + 0, k = S.sub, n = st.cards.length;
  top({});
  if (k >= n) {
    var out = st.cards.filter(function (c) { return c.right === 1; });
    show(kick(st) + '<div class="fill"><div class="faces">' + out.map(function (c) { return '<div>' + face(c.face) + esc(CAST[c.face].name) + '</div>'; }).join("") + '</div><div class="coach q3" style="font-size:calc(19 * var(--u))">' + q(st.after.text) + '</div></div>' + foot(btn(nextLabel(), "go")), "g");
    $("#go").onclick = nextStep; sayLine(st.after, r); return;
  }
  var C = st.cards[k];
  show(kick(st) + (k === 0 ? '<div class="coach" id="coach">' + q(st.coach.text) + '</div>' : "") + '<div class="count">' + (k + 1) + " of " + n + '</div><div class="fill"><div class="panel short">' + sceneFace(C.face) + '</div><p class="sctext">' + q(C.text) + '</p>' +
    '<div class="opts row" id="opts">' + st.buttons.map(function (b, i) { return '<button class="opt" data-i="' + i + '"><span style="flex:1">' + q(b) + '</span></button>'; }).join("") + '</div><div id="why"></div></div><div id="ft"></div>', "abcdef"[k]);
  if (k === 0) sayLine(st.coach, r);
  [].forEach.call(document.querySelectorAll("#opts button"), function (b) {
    b.onclick = function () {
      var i = +b.getAttribute("data-i"), box = $("#opts"); if (box.classList.contains("done")) return; box.classList.add("done"); stopSound();
      [].forEach.call(box.children, function (x, j) { x.classList.add(j === C.right ? "right" : j === i ? "wrong" : "faded"); x.disabled = true; });
      var c = $("#coach"); if (c) c.remove();
      $("#why").innerHTML = why(i === C.right, C.why, true);
      $("#ft").innerHTML = foot(btn(k + 1 < n ? "Next line" : "Next: the four you threw out", "go"));
      $("#go").onclick = function () { go(S.step, k + 1); };
    };
  });
};
/* say it: the question to Marisol, then why you ask. This is lesson 1's scored part. */
VIEW.say = function (st) {
  var sub = S.sub;
  if (sub === 0) return vReady(st, st.coach, function () { go(S.step, 1); });
  if (sub === 90) { var s0 = S.score; vReady(st, null, function () { go(S.step, 1); }, '<div class="callout must">' + q(SH.promise) + " One more time." + '</div>'); tag("r"); return; }
  if (sub === 2) return vFeedback(st, S.score, nextStep, nextLabel(), "c", '<div class="tip" style="background:var(--green-soft)">' + q(st.oneWay) + '</div>');
  talk({ st: st, key: "1.marisol", who: st.who, replies: Object.assign({ ask: st.ask }, st.replies), walk: true, note: st.note, hint: st.hint, hintAfter: "ask", tag: "b",
    onEnd: function (T) {
      var g = T.grade(); g.musts = [];
      if (g.promise && !S.retried) { S.retried = true; S.score = g; return go(S.step, 90); }
      S.score = S.retried ? better(S.score && !S.score.promise ? S.score : null, g) : g; go(S.step, 2);
    } });
};
/* one whole stop: watch Lena do the job once, then say the two lines that are the law */
VIEW.stop = function (st) {
  var r = RUN + 0, sub = S.sub;
  if (sub === 0) {
    top({ pp: true });
    show(kick(st) + '<div class="panel" id="panel"></div><div class="grow" style="flex:0 0 8px"></div>', "a");
    $("#panel").onclick = function () { stopSound(); };
    playScenes({ coach: st.coach, labels: st.labels, scenes: [{ who: st.who, lines: st.lines, after: st.after }] }, "lena").then(function (ok) { if (ok && r === RUN) go(S.step, 1); });
    return;
  }
  var k = sub - 1, line = st.say[k], T = { n: 0 };
  top({});
  show(kick(st) + '<div class="panel" id="panel">' + sceneTwo("lena", st.who, "") + '</div><div class="sayq"><small>' + q(st.sayLead) + '</small>“' + q(line) + '”</div><div class="coach" id="coach" style="min-height:0"></div>' + micHtml() + '<div id="ft"></div>', "bc"[k]);
  var finish = function (text) {
    if (SIGG.misheard(text)) { micState("idle", "<b>" + q(SH.misheard) + "</b>"); return; }
    M.used = true; micState("wait", "");
    if (k + 1 < st.say.length) return go(S.step, sub + 1);
    $("#coach").innerHTML = q(st.done.text);
    sayLine(st.done, r).then(function () { if (r !== RUN) return; $(".mic").style.display = "none"; $("#ft").innerHTML = foot(btn(nextLabel(), "go")); $("#go").onclick = nextStep; });
  };
  if ($("#mic")) { micState("idle"); $("#mic").onclick = function () { if (!SR) { typedOn(finish); return; } if (M.rec) { M.rec.stop(); return; } audio(); stopSound(); micState("on"); M.rec = listen({ onWords: function (t) { var m = $("#mict"); if (m) m.innerHTML = "<b>Listening.</b> " + esc(t); }, onDone: function (t) { M.rec = null; if (r === RUN) finish(t); }, onError: function (c) { M.rec = null; if (r === RUN) micState("idle", micErr(c)); } }); }; }
};
/* check four lines: tap the box that gets the line thrown out, or Good to go */
VIEW.lines = function (st) {
  var r = RUN + 0, k = S.sub, X = st.lines[k], last = k === st.lines.length - 1;
  top({});
  show(kick(st) + (k === 0 ? '<div class="coach q3" id="coach">' + q(st.coach.text) + '</div>' : "") + '<div class="count">Line ' + X.tag + '</div><div id="pw">' + pet(X.fill, { tap: true, big: true, note: X.note }) + '</div>' +
    '<div class="fill"><div class="opts" id="opts"><button class="opt" id="okb"><span style="flex:1;text-align:center">' + q(st.ok) + '</span></button></div><div id="why"></div></div><div id="ft"></div>', "abcd"[k]);
  if (k === 0) sayLine(st.coach, r);
  var done = false, pick = function (key) {
    if (done) return; done = true; stopSound();
    var marks = {}; if (X.right !== "ok") marks[X.right] = "right"; if (key !== X.right && key !== "ok") marks[key] = "wrong";
    $("#pw").innerHTML = pet(X.fill, { big: true, note: X.note, marks: marks }); fitHw();
    $("#okb").classList.add(X.right === "ok" ? "right" : key === "ok" ? "wrong" : "faded"); $("#okb").disabled = true; $("#opts").classList.add("done");
    var c = $("#coach"); if (c) c.remove();
    $("#why").innerHTML = why(key === X.right, X.why, true);
    $("#ft").innerHTML = foot(btn(last ? nextLabel() : "Next line", "go")); $("#go").onclick = function () { last ? nextStep() : go(S.step, k + 1); };
  };
  $("#pw").onclick = function (e) { var b = e.target.closest ? e.target.closest("[data-box]") : null; if (b) pick(b.getAttribute("data-box")); };
  $("#okb").onclick = function () { pick("ok"); };
};
/* your line: the declaration. Two of three cost the whole sheet; tap both. */
VIEW.decl = function (st) {
  var r = RUN + 0, sel = [];
  top({});
  show(kick(st) + '<div class="coach q3" id="coach">' + q(st.coach.text) + '</div><h1 style="font-size:calc(19 * var(--u))">' + q(st.ask) + '</h1><div class="opts" id="opts">' +
    st.cards.map(function (c, i) { return '<button class="decl" data-i="' + i + '"><span class="lt" style="flex:none;width:24px;height:24px;border-radius:50%;background:var(--soft);display:grid;place-items:center;font:800 12px/1 Figtree;color:var(--muted)">' + (i + 1) + '</span><span>' + q(c) + '</span></button>'; }).join("") + '</div><div class="fill"><div id="why"></div></div><div id="ft"></div>', "");
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
  $("#top").innerHTML = ""; $("#tag").textContent = "Sig card";
  $("#scr").innerHTML = '<span class="drive"><b>' + esc(ST.drive.name) + '</b><small>' + esc(ST.drive.measure) + ' · petition drive</small></span><h1 class="lg">' + q(C.title) + '</h1><ol class="rules">' + C.rules.map(function (x) { return '<li><b>' + q(x[0]) + '</b> ' + q(x[1]) + '</li>'; }).join("") + '</ol>';
}

/* ---------------- start ---------------- */
document.title = LN ? "Lesson " + LN + ": " + L.title + " · Warmup" : "Before your first signature · Warmup";
if (!LN) vCard();
else if (qs.has("at")) { var at0 = qs.get("at").split("."); S.step = -1; go(Math.max(0, Math.min(L.steps.length - 1, (parseInt(at0[0], 10) || 1) - 1)), parseInt(at0[1], 10) || 0); }
else go(-1);
window.__sgBusy = function () { return playing.length > 0; };
window.__sg = { S: S, go: go, L: L, LN: LN, time: function () { var now = performance.now(), ms = Object.assign({}, TM.ms); if (TM.at >= 0) ms[TM.at] = (ms[TM.at] || 0) + now - TM.t0; return ms; }, run: function () { return RUN; }, M: M };
