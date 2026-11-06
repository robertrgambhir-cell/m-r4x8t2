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

# ---------- door-ready: the issue lessons open the next morning, one a day ----------
swap('<p class="lt-sub">Or close this. We@RQ@ll text you tomorrow at&nbsp;8&nbsp;AM.</p></div>`;',
     '<p class="lt-sub">${P1x.readyLine()}</p></div>`;')
swap("${head(`Door-ready, ${name}`, `${first}@RQ@s issue lessons are open.`, line)}",
     "${head(`Door-ready, ${name}`, P1x.readyHead(first), line)}")
swap("${all ? `<p class=\"cs-next\">${(CAMPAIGN[S.track] || CAMPAIGN.gotv).name.split(\" \")[0]}\\u2019s issue lessons are open.</p>` : \"\"}",
     "${all ? `<p class=\"cs-next\">${(CAMPAIGN[S.track] || CAMPAIGN.gotv).name.split(\" \")[0]}\\u2019s issue lessons ${P1.issuesNext().open ? \"are open\" : \"open tomorrow\"}.</p>` : \"\"}")
P1X = """
/* phase 1: what Today says once door-ready, from the daily rule */
const P1x = {
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
     """var slot = window.__p1 && !window.__p1.issuesNext().open ? "&slot=0" : ""; /* phase 1: one new lesson a day on the issue page too */
  ov.innerHTML = '<iframe src="issues/?all' + slot + (lesson ? "&lesson=" + lesson : "") + (dn ? "&done=" + dn : "") + '\"""")

# ---------- the issue lessons page (a copy for the dev build) ----------
swap("var ALL = /[?&#]all\\b/.test(location.search + location.hash), FAST = /[?&#]fast\\b/.test(location.search + location.hash);",
     "var ALL = /[?&#]all\\b/.test(location.search + location.hash), FAST = /[?&#]fast\\b/.test(location.search + location.hash);\n  var SLOT0 = /[?&#]slot=0\\b/.test(location.search + location.hash); /* phase 1: today's new lesson is used, so only finished lessons open */", src="iss")
swap("var open = ALL || k === 0 || S.done[k - 1], done = S.done[k];",
     "var open = ALL || k === 0 || S.done[k - 1], done = S.done[k]; open = open && (done || !SLOT0);", src="iss")
swap("'<span class=\"hr-st lock\">' + LOCK12 + 'Day ' + (k + 1) + '</span>'",
     "'<span class=\"hr-st lock\">' + LOCK12 + (SLOT0 && !done ? 'Tomorrow' : 'Day ' + (k + 1)) + '</span>'", src="iss")
swap('if (EMB) { try { window.parent.postMessage({ warmup: "brief-done", lesson: x.id }, "*"); } catch (er) {} }',
     'SLOT0 = true; if (EMB) { try { window.parent.postMessage({ warmup: "brief-done", lesson: x.id }, "*"); } catch (er) {} }', count=2, src="iss")

os.makedirs(os.path.join(OUT, "issues"), exist_ok=True)
open(os.path.join(OUT, "index.html"), "w", encoding="utf-8").write(s)
open(os.path.join(OUT, "issues", "index.html"), "w", encoding="utf-8").write(iss)
print("phase 1 build:", len(n_edits), "edits", "dev clock on" if DEV else "", "reminders on" if REMIND else "reminders off")
