"""Phase 1 (Nov 6, 2026): production foundations on top of the staging page (version 159), into a separate dev build.
Robert's Phase 1 brief: persistent progress, a daily lesson rule that really works, a small event log, no promised text that
isn't sent, and the issue lessons sharing completion with the app. No new product design: the screens, the ten lessons and
their order stay as they are.
What it does:
- inlines ai/schedule.js (the one daily rule) and ai/client/phase1.js (progress on the phone and, when Warmup's server says
  it's on, a copy there; the event log) at the end of the app's script, then boots it before the first render;
- lessonLocked and lessonGated follow the daily rule instead of the permanent lock (LOCK_ON) and the 3-hour gate;
- a retake never moves a lesson's first finish time and is counted; issue lessons keep their first finish time;
- every visible promise of a text says what really happens unless reminders are switched on (REMIND, off by default);
- the door-ready Today and the lesson 5 card say the issue lessons open tomorrow when they do; Learn's issue tiles and the
  issue lessons' own page both hold to one new lesson a day (the page gets slot=0 when today's new lesson is used);
- the issue frame loads issues/ beside the dev page; the issue page copy gets the slot rule.
Usage: python3 ai/build-phase1.py STAGING.html ISSUES.html OUT_DIR [--dev] [--remind]
  writes OUT_DIR/index.html and OUT_DIR/issues/index.html. --dev turns on the test clock (?day=+1).
No backslashes or non-ASCII in this file: @RQ@ is a right single quote, @NB@ a no-break space."""
import os
import sys

args = [a for a in sys.argv[1:] if not a.startswith("--")]
APP, ISSUES, OUT = args
DEV = "--dev" in sys.argv
REMIND = "--remind" in sys.argv
HERE = os.path.dirname(os.path.abspath(__file__))
RQ, NB = chr(8217), chr(160)
s = open(APP, encoding="utf-8").read()
iss = open(ISSUES, encoding="utf-8").read()
n_edits = []


def tok(x):
    return x.replace("@RQ@", RQ).replace("@NB@", NB)


def swap(old, new, count=1, src="app"):
    global s, iss
    old, new = tok(old), tok(new)
    t = s if src == "app" else iss
    c = t.count(old)
    assert c == count, (src, old[:80], c, count)
    t = t.replace(old, new)
    if src == "app":
        s = t
    else:
        iss = t
    n_edits.append(old[:40])


# ---------- the rule and the module, booted before the first render ----------
sched = open(os.path.join(HERE, "schedule.js"), encoding="utf-8").read()
p1 = open(os.path.join(HERE, "client", "phase1.js"), encoding="utf-8").read()
p1 = p1.replace("__P1_DEV__", "true" if DEV else "false").replace("__P1_REMIND__", "true" if REMIND else "false")
END = "\nloadVoices();\nrender();\n})();\n</script>"
swap(END, "\n/* phase 1: the daily rule and the learner's record (ai/schedule.js, ai/client/phase1.js) */\n" + sched + "\n" + p1
     + "\nP1.boot();\n{ const render0 = render; render = function () { render0(); try { P1.after(); } catch (e) { /* never break a screen */ } }; }" + END)

# ---------- the daily rule replaces the permanent lock and the 3-hour gate ----------
swap('const lessonLocked = (n) => LOCK_ON && S.track === "gotv" && Number(n) >= 2 && !((S.done5 || {})[Number(n)]);',
     'const lessonLocked = (n) => S.track === "gotv" && Number(n) >= 2 && !P1.lessonOpen(Number(n)); /* phase 1: one new lesson each morning (ai/schedule.js), not a permanent lock */')
swap("const lessonGated = () => { const ts = Object.values(S.doneAt || {}); return ts.length > 0 && Date.now() - Math.max(...ts) < 3 * 3600 * 1000; };",
     "const lessonGated = () => P1.usedToday(); /* phase 1: today's new lesson is used */")

# ---------- finish times: the first finish only, on the learner's clock; retakes counted ----------
swap("if (!S.doneAt[n5]) S.doneAt[n5] = Date.now(); }",
     "if (!S.doneAt[n5]) S.doneAt[n5] = P1.now(); else if (prev) P1.retake(n5); }")
swap("S.briefsDoneIds = Object.assign({}, S.briefsDoneIds, { [d.lesson]: Date.now() });",
     "S.briefsDoneIds = Object.assign({}, S.briefsDoneIds, { [d.lesson]: (S.briefsDoneIds || {})[d.lesson] || P1.now() }); /* phase 1: the first finish counts; a redo never moves it */")

# ---------- no promise of a text that isn't sent ----------
if not REMIND:
    swap("const LOCK_LINE = (n) => `A new lesson opens every morning. You\\u2019ll get a text as soon as lesson ${n} is ready.`;",
         "const LOCK_LINE = (n) => `A new lesson opens every morning. Come back to this link for lesson ${n}.`; /* phase 1: reminders aren't sent yet */")
    swap('<p class="lt-sub">You can close this. We@RQ@ll text you lesson ${nx.n} tomorrow at&nbsp;8&nbsp;AM.</p>',
         '<p class="lt-sub">You can close this. Lesson ${nx.n} opens tomorrow morning, right here.</p>')
    swap('locked ? `Lesson ${nx.n} unlocks tomorrow.` : `Lesson ${nx.n} comes by text tomorrow.`',
         'locked ? `Lesson ${nx.n} unlocks tomorrow.` : `Lesson ${nx.n} opens tomorrow.`')
    swap('locked ? "There\\u2019ll be a new 5 minute lesson every morning. You\\u2019ll get a text when it\\u2019s ready."',
         'locked ? "There\\u2019ll be a new 5 minute lesson every morning, right here."')
    swap(': nx ? `<p><b>Lesson ${nx.n} comes by text tomorrow.</b></p>`',
         ': nx ? `<p><b>Lesson ${nx.n} opens tomorrow.</b></p>`')

    # the welcome video's line 9, voice and caption: the sentence "Finish today's, and we'll text you the next one tomorrow
    # morning." is cut out of the recording itself (ai/assets/welcome-line9-honest.mp3, made by ai/assets/make-line9.py from
    # the staging clip; both cuts sit in silence), so no learner hears a promise of a text. The phone shot for the cut
    # sentence (Today after lesson 1) goes with it, and the Learn shot and line 10 move 3.78 seconds earlier.
    import base64, re
    i9 = s.find("const WELCOME_AUDIO = [")
    clips = re.findall(r'"([A-Za-z0-9+/=]{1000,})"', s[i9:s.find("];", i9)])
    assert len(clips) == 10, len(clips)
    honest = base64.b64encode(open(os.path.join(HERE, "assets", "welcome-line9-honest.mp3"), "rb").read()).decode()
    swap('"' + clips[8] + '"', '"' + honest + '"')
    swap("text: \"The lessons come one a day. Finish today\\u2019s, and we\\u2019ll text you the next one tomorrow morning. Ten mornings in,",
         "text: \"The lessons come one a day. Ten mornings in,")
    swap("const LINE_T = [0, 5.18, 14.4, 21.4, 29.48, 38.07, 54.41, 64.22, 69.89, 80.79];",
         "const LINE_T = [0, 5.18, 14.4, 21.4, 29.48, 38.07, 54.41, 64.22, 69.89, 77.01]; /* phase 1: line 9 is 3.78 s shorter */")
    swap("const LINE_DUR = [4.32, 9.22, 7, 8.08, 8.59, 16.34, 9.81, 5.67, 10.9, 8.36];",
         "const LINE_DUR = [4.32, 9.22, 7, 8.08, 8.59, 16.34, 9.81, 5.67, 7.12, 8.36];")
    a9 = s.find('  { at: 71.76, screen: "welcome", name: "Today, after lesson 1"')
    b9 = s.find('  { at: 75.56, screen: "library", name: "Learn: ten mornings in"')
    e9 = s.find("];\nconst CUT_T = VID_SHOTS.map")
    assert 0 < a9 < b9 < e9, (a9, b9, e9)
    learn = s[b9:e9]
    moved = re.sub(r"(?<![\w.])(7[5-9]\.\d{1,2})(?![\w.])", lambda m: ("%.2f" % (float(m.group(1)) - 3.78)).rstrip("0").rstrip("."), learn)
    assert learn.count("77.17") == 3 and "79.5" in learn and moved.count("73.39") == 3 and "75.72" in moved, "learn shot timings"
    s = s[:a9] + moved + s[e9:]
    n_edits.append("video shots")

    # waiting lists in Learn: asking for a lesson that isn't built yet puts you on a list; nothing texts you when it's ready
    swap('["On the list. We\\u2019ll text you when it\\u2019s ready", "noop", "", true]', '["On the list. It\\u2019ll show up in Learn when it\\u2019s ready", "noop", "", true]')
    swap('["Asked. We\\u2019ll text you when it\\u2019s ready", "noop", "", true]', '["Asked. It\\u2019ll show up in Learn when it\\u2019s ready", "noop", "", true]', count=2)
    swap('toast("Asked. We\\u2019ll text you when it\\u2019s ready.");', 'toast("Asked. It\\u2019ll show up in Learn when it\\u2019s ready.");')
    swap('" You\\u2019re on the list, and we\\u2019ll text you when it\\u2019s ready."', '" You\\u2019re on the list, and it\\u2019ll show up in Learn when it\\u2019s ready."', count=3)
    swap('toast("You\\u2019re on the list. We\\u2019ll text you when it\\u2019s ready.");', 'toast("You\\u2019re on the list. It\\u2019ll show up in Learn when it\\u2019s ready.");')

# ---------- the practice AI's server: ?ai= only in dev builds, and only this computer or Warmup's own account ----------
swap('  const base = String(qs.get("ai") || WAI_URL_DEFAULT || "").replace(/\\/+$/, "");',
     ('  const base = String((/^(http:\\/\\/(127\\.0\\.0\\.1|localhost)(:\\d{2,5})?|https:\\/\\/warmup-ai[a-z0-9-]*\\.robertrgambhir\\.workers\\.dev)\\/?$/.test(qs.get("ai") || "") && qs.get("ai")) || WAI_URL_DEFAULT || "").replace(/\\/+$/, ""); /* phase 1: dev builds only, allowlisted */'
      if DEV else '  const base = String(WAI_URL_DEFAULT || "").replace(/\\/+$/, ""); /* phase 1: a learner build always talks to Warmup\'s own server; ?ai= is ignored */'))

# ---------- Progress: the button and the line follow the daily rule ----------
swap(': lastL ? [`Retake lesson ${lastL.n}`, "retake5", String(lastL.n)] : ["Start lesson 1", "lesson5", "1"];',
     ': c.nd < 5 && P1.lessonOpen(c.nd + 1) ? [`Start lesson ${c.nd + 1}`, "lesson5", String(c.nd + 1)] : lastL ? [`Retake lesson ${lastL.n}`, "retake5", String(lastL.n)] : ["Start lesson 1", "lesson5", "1"]; /* phase 1: today\'s lesson when it\'s open */')
swap("const when = !brief && !mid && c.nd >= 1 && c.nd < 5 ? `Lesson ${c.nd + 1} opens tomorrow morning.` : \"\";",
     "const when = !brief && !mid && c.nd >= 1 && c.nd < 5 && !P1.lessonOpen(c.nd + 1) ? `Lesson ${c.nd + 1} opens tomorrow morning.` : \"\";")

# ---------- door-ready: the issue lessons open the next morning, one a day ----------
swap('<p class="lt-sub">Or close this. We@RQ@ll text you tomorrow at&nbsp;8&nbsp;AM.</p></div>`;',
     '<p class="lt-sub">${P1x.readyLine()}</p></div>`;')
swap("${head(`Door-ready, ${name}`, `${first}@RQ@s issue lessons are open.`, line)}",
     "${head(`Door-ready, ${name}`, P1x.readyHead(first), line)}")
swap("${all ? `<p class=\"cs-next\">${(CAMPAIGN[S.track] || CAMPAIGN.gotv).name.split(\" \")[0]}\\u2019s issue lessons are open.</p>` : \"\"}",
     "${all ? `<p class=\"cs-next\">${(CAMPAIGN[S.track] || CAMPAIGN.gotv).name.split(\" \")[0]}\\u2019s issue lessons ${P1.issuesNext().open ? \"are open\" : \"open tomorrow\"}.</p>` : \"\"}")
P1X = """
/* phase 1: what Today says once door-ready, from the daily rule; and Progress's line on where the record is saved */
const P1x = {
  erasing: false,
  saveFoot() {
    if (P1.DEMO) return ""; /* presenter shortcuts never save, so they say nothing about saving */
    const st = P1.saved();
    if (st === "none" && !this.erasing) return "";
    const say = { backed: "Your progress is saved on this phone and backed up to Warmup.", pending: "Your progress is saved on this phone. It isn@RQ@t backed up yet.", local: "Your progress is saved on this phone only.", nolocal: "This browser isn@RQ@t letting Warmup save your progress. Finish today@RQ@s lesson before you close it.", none: "" }[st];
    if (this.erasing) return `<p class="pg-save">Erase your lessons from this phone${P1.link() ? " and Warmup@RQ@s backup" : ""}? This can@RQ@t be undone.</p><p class="pg-links"><button class="link" data-act="p1-erase-yes">Erase</button><span aria-hidden="true">\u00b7</span><button class="link" data-act="p1-erase" data-arg="no">Keep them</button></p>`;
    const link = st === "backed" && P1.link() ? `<button class="link" data-act="p1-link">Copy my personal link</button><span aria-hidden="true">\u00b7</span>` : "";
    const box = this.shown && this.shown === P1.link() ? `<input class="pg-linkbox" readonly value="${esc(this.shown)}" aria-label="Your personal link" style="width:100%;font:13px/1.4 inherit;padding:8px;border:1px solid #D8D2C6;border-radius:8px;background:#fff;color:#24231C" onfocus="this.select()">` : "";
    return `<p class="pg-save">${say}</p>${box}<p class="pg-links">${link}<button class="link" data-act="p1-erase" data-arg="ask">Erase my progress</button></p>`;
  },
  copyLink() {
    const u = P1.link(); if (!u) return;
    const done = () => toast("Copied. Open it on another phone to bring your lessons. Keep it to yourself.");
    const show = () => { this.shown = u; render(); }; /* no clipboard: the link shows in a box to copy by hand */
    try { navigator.clipboard.writeText(u).then(done, show); } catch (e) { show(); }
  },
  shown: "",
  async eraseNow() {
    this.erasing = false;
    const r = await P1.erase();
    S.screen = "me"; S.hist = [];
    render();
    toast(r === "failed" ? "Erased from this phone. Warmup@RQ@s server couldn@RQ@t be reached, so the backup wasn@RQ@t erased. Try again later." : r === "erased" ? "Erased from this phone and Warmup@RQ@s backup." : "Erased from this phone.");
  },
  readyHead(first) { const x = P1.issuesNext(); if (x.kind === "done" || x.open) return `${first}@RQ@s issue lessons are open.`; return P1.usedToday() && Object.keys(S.briefsDoneIds || {}).length ? "See you tomorrow." : `${first}@RQ@s issue lessons open tomorrow.`; },
  readyLine() { const x = P1.issuesNext(); if (x.kind === "done") return "You can close this."; if (x.open) return P1.REMIND ? "Or close this. We@RQ@ll text you tomorrow at&nbsp;8&nbsp;AM." : "Or close this. One issue lesson a day."; return P1.REMIND ? "You can close this. We@RQ@ll text you tomorrow at&nbsp;8&nbsp;AM." : "You can close this. Your next issue lesson opens tomorrow morning, right here."; },
};
"""
swap("function vTodayG() {", tok(P1X) + "function vTodayG() {")
swap('case "brief-open": { const d5 = S.done5 || {}; if (LESSONS5.every((x) => d5[x.n])) issuesOpen(el.dataset.lesson || "");',
     'case "brief-open": { const d5 = S.done5 || {}; if (LESSONS5.every((x) => d5[x.n]) && !P1.issueOpen(el.dataset.lesson || "")) { toast("One new lesson a day. This one opens tomorrow morning."); break; } if (LESSONS5.every((x) => d5[x.n])) issuesOpen(el.dataset.lesson || "");')
swap('case "issues-open": issuesOpen(); break;', 'case "issues-open": P1.ev("issue_open", {}); issuesOpen(); break;')

# ---------- the issue frame: beside the dev page, told whether today's new lesson is free ----------
swap("""ov.innerHTML = '<iframe src="../issues/?all' + (lesson ? "&lesson=" + lesson : "") + (dn ? "&done=" + dn : "") + '\"""",
     """var slot = window.__p1 && !window.__p1.issuesNext().open ? "&slot=0" : ""; /* phase 1: one new lesson a day on the issue page too; the done list stays plain ids and commas, which is all the issue page reads */
  ov.innerHTML = '<iframe src="issues/?all' + slot + (lesson ? "&lesson=" + encodeURIComponent(lesson) : "") + (dn ? "&done=" + String(dn).split(",").filter(function (x) { return /^[a-z]{2}$/.test(x); }).join(",") : "") + '\"""")

# ---------- the issue lessons page (a copy for the dev build) ----------
swap("var ALL = /[?&#]all\\b/.test(location.search + location.hash), FAST = /[?&#]fast\\b/.test(location.search + location.hash);",
     "var ALL = /[?&#]all\\b/.test(location.search + location.hash), FAST = /[?&#]fast\\b/.test(location.search + location.hash);\n  var SLOT0 = /[?&#]slot=0\\b/.test(location.search + location.hash); /* phase 1: today's new lesson is used, so only finished lessons open */", src="iss")
swap("var open = ALL || k === 0 || S.done[k - 1], done = S.done[k];",
     "var open = ALL || k === 0 || S.done[k - 1], done = S.done[k]; open = open && (done || !SLOT0);", src="iss")
swap("'<span class=\"hr-st lock\">' + LOCK12 + 'Day ' + (k + 1) + '</span>'",
     "'<span class=\"hr-st lock\">' + LOCK12 + (SLOT0 && !done ? 'Tomorrow' : 'Day ' + (k + 1)) + '</span>'", src="iss")
swap('if (EMB) { try { window.parent.postMessage({ warmup: "brief-done", lesson: x.id }, "*"); } catch (er) {} }',
     'SLOT0 = true; if (EMB) { try { window.parent.postMessage({ warmup: "brief-done", lesson: x.id }, "*"); } catch (er) {} }', count=2, src="iss")

# ---------- Progress: where the record is saved, the personal link and erase ----------
swap('<p class="pg-links"><button class="link" data-act="go" data-arg="statushow">How status works</button><span aria-hidden="true">\u00b7</span><button class="link" data-act="go" data-arg="record">Your record</button></p></div>',
     '<p class="pg-links"><button class="link" data-act="go" data-arg="statushow">How status works</button><span aria-hidden="true">\u00b7</span><button class="link" data-act="go" data-arg="record">Your record</button></p>${P1x.saveFoot()}</div>')
swap('case "issues-open": P1.ev("issue_open", {}); issuesOpen(); break;',
     'case "issues-open": P1.ev("issue_open", {}); issuesOpen(); break;\n    case "p1-link": P1x.copyLink(); break;\n    case "p1-erase": P1x.erasing = arg === "ask"; render(); break;\n    case "p1-erase-yes": P1x.eraseNow(); break;')

# ---------- the laptop guide (Version 160): its stops load sample progress, so nothing is saved from the first jump ----------
swap("function guideJump(n) {", "function guideJump(n) {\n  window.__wuPreview = true; /* phase 1: sample progress from here on; the learner's record is left alone (a reload brings it back) */")

os.makedirs(os.path.join(OUT, "issues"), exist_ok=True)
open(os.path.join(OUT, "index.html"), "w", encoding="utf-8").write(s)
open(os.path.join(OUT, "issues", "index.html"), "w", encoding="utf-8").write(iss)
print("phase 1 build:", len(n_edits), "edits", "dev clock on" if DEV else "", "reminders on" if REMIND else "reminders off")
