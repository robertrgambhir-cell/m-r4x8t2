"""Version 164 (Nov 6, 2026): the rebuilt issue trainings go live, Georgia is hidden and investors can open any lesson.

Robert's brief (Nov 6, 1:22 PM PT): show only issue trainings from Democrats who won 2026 U.S. Senate races (AP called all four
of Maya's Senate lessons for the Democrat: Texas, Ohio, Maine, Michigan), hide the governor's race (Georgia) without deleting it,
and rebuild two (electric bills from Ohio, school vouchers from Texas) as the new trainings in wdpfxqlsvp/train/.

App pages (live app.html, staging, dev, p1):
  - Maya's issue lessons are tx, oh, me, mi; the Georgia lesson stays in issues/ but no screen lists it, and every count follows
    (nine lessons, Briefed after four). The daily rule's issue list drops it too, so the ladder can finish.
  - Learn's Electric bill and School vouchers rows open the new trainings (train/?l=oh, ?l=tx) in the same overlay.
  - ?unlock (Robert, for investors): door-ready sample progress, every issue lesson open at any time, nothing saved.
Issue pages (issues/, dev/issues/, p1/issues/):
  - The Georgia lesson leaves the list (its code and sources stay in the file); counts follow.
  - Tapping Electric bill or School vouchers, or a deep link to them, opens the new training; its Back returns here.

To undo: git revert the Version 164 commit. Usage: python3 v164-issue-trainings.py APP.html ... --issues ISSUES.html ...
"""
import re
import sys

args = sys.argv[1:]
cut = args.index("--issues") if "--issues" in args else len(args)
APPS, ISSUES = args[:cut], args[cut + 1:]


def patcher(path):
    s = open(path, encoding="utf-8").read()

    def swap(old, new, n=1, optional=False):
        nonlocal s
        c = s.count(old)
        if optional and c == 0:
            return
        assert c == n, (path, c, old[:80])
        s = s.replace(old, new)

    def resub(pat, new, n=1):
        nonlocal s
        s2, c = re.subn(pat, new, s, flags=re.S)
        assert c == n, (path, c, pat[:80])
        s = s2

    return swap, resub, (lambda: s)


for path in APPS:
    swap, resub, get = patcher(path)
    # the campaign's issue lessons, without Georgia's governor race
    swap('briefs: ["Health insurance", "School vouchers", "Your electric bill", "Heating oil", "Tariffs and auto jobs"], briefIds: ["ga", "tx", "oh", "me", "mi"], briefShort: [["Health", "insurance"], ["School", "vouchers"], ["Electric", "bill"], ["Heating", "oil"], ["Tariffs and", "auto jobs"]] } };',
         'briefs: ["School vouchers", "Your electric bill", "Heating oil", "Tariffs and auto jobs"], briefIds: ["tx", "oh", "me", "mi"], briefShort: [["School", "vouchers"], ["Electric", "bill"], ["Heating", "oil"], ["Tariffs and", "auto jobs"]] } }; /* version 164 (Robert, Nov 6): only lessons from Democrats who won 2026 Senate races; Georgia (a governor\'s race) is hidden, not deleted */\n'
         'if (/[?&]unlock\\b/.test(location.search)) { window.__wuPreview = true; window.__wuUnlock = true; } /* version 164: the investor link, every lesson open, nothing saved */\n'
         'const NB = () => ((CAMPAIGN.gotv || {}).briefIds || []).length, NL = () => 5 + NB(), NWORD = (n) => ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][n] || String(n);')
    resub(r'(const ISSUE_ICONS = \[\s*)\[\'[^\]]*?"#e2557a"\],\s*', r'\1')  # Georgia's icon, so the icons stay with their lessons
    # Learn
    swap('${bar(ready ? nb : 0, 5, "blue")}', '${bar(ready ? nb : 0, briefs.length, "blue")}')
    swap('`${nb} of 5 done · five minutes each on what voters raise at the door` : "Where " + first + " stands on five issues voters raise at the door."',
         '`${nb} of ${briefs.length} done · five minutes each on what voters raise at the door` : "Where " + first + " stands on " + NWORD(briefs.length) + " issues voters raise at the door."')
    swap('goal("brief", briefed, briefed ? "Earned" : "After all five", "Briefed", "")', 'goal("brief", briefed, briefed ? "Earned" : "After all " + NWORD(briefs.length), "Briefed", "")')
    swap('<h1 class="h1 lp-h1">Ten lessons, one a day</h1>', '<h1 class="h1 lp-h1">${NWORD(total).replace(/^./, (c) => c.toUpperCase())} lessons, one a day</h1>')
    # Today and the locked lesson screen
    swap('line = briefs >= 5 ? "All 10 lessons done." : `Lesson ${6 + (openI < 0 ? briefs : openI)} of 10 next · briefed in ${mornings(5 - briefs)}`;',
         'line = briefs >= NB() ? `All ${NL()} lessons done.` : `Lesson ${6 + (openI < 0 ? briefs : openI)} of ${NL()} next · briefed in ${mornings(NB() - briefs)}`;')
    swap('`Lesson ${nx.n} of 10 next · door-ready in ${mornings(left)}`', '`Lesson ${nx.n} of ${NL()} next · door-ready in ${mornings(left)}`')
    swap('`Lesson ${nx.n} of 10 · door-ready in ${mornings(left)}`', '`Lesson ${nx.n} of ${NL()} · door-ready in ${mornings(left)}`')
    swap('<p class="kicker">Lesson ${n} of 10</p>', '<p class="kicker">Lesson ${n} of ${NL()}</p>')
    swap('By your canvass, all ten will feel like second nature at the door.', 'By your canvass, every one of them will feel like second nature at the door.')
    # Progress (locked for now, kept true)
    swap('briefs: Math.min(5, S.briefsDone || 0)', 'briefs: Math.min(NB(), S.briefsDone || 0)')
    swap('const brief = c.nd >= 5, n = brief ? c.briefs : c.nd, left = 5 - n;', 'const brief = c.nd >= 5, n = brief ? c.briefs : c.nd, left = (brief ? NB() : 5) - n;')
    swap('Briefed means you know where ${first} stands on all five issues.', 'Briefed means you know where ${first} stands on all ${NWORD(NB())} issues.')
    swap('frac("Briefed", c.briefs, 5, "The campaign’s five issue lessons")', 'frac("Briefed", c.briefs, NB(), "The campaign’s " + NWORD(NB()) + " issue lessons")')
    swap('After your ten lessons, the path keeps going', 'After these lessons, the path keeps going')
    # the guide's words
    swap("Part 2 is the campaign’s own five issue lessons", "Part 2 is the campaign’s own issue lessons", optional=True)
    swap('demo: "The five issues here are adapted from real 2026 races."', 'demo: "Each issue here is adapted from a Democrat who won a 2026 U.S. Senate race."', optional=True)
    # only this campaign's lessons count as done
    swap('S.briefsDone = Object.keys(S.briefsDoneIds).length;\n  render();', 'S.briefsDone = Object.keys(S.briefsDoneIds).filter((id) => NB() && CAMPAIGN.gotv.briefIds.includes(id)).length;\n  render();')
    swap('S.briefsDoneIds = Object.assign({}, p.issues || {}); S.briefsDone = Object.keys(S.briefsDoneIds).length;',
         'S.briefsDoneIds = Object.assign({}, p.issues || {}); S.briefsDone = Object.keys(S.briefsDoneIds).filter((id) => CAMPAIGN.gotv.briefIds.includes(id)).length;', optional=True)
    # the daily rule's issue list (Phase 1 pages)
    swap('var DAY_START_HOUR = 5, ISSUES = ["ga", "tx", "oh", "me", "mi"];', 'var DAY_START_HOUR = 5, ISSUES = ["tx", "oh", "me", "mi"]; /* version 164: Georgia hidden */', optional=True)
    # the investor link: door-ready sample progress on Learn, every issue lesson open
    swap('if ((new URLSearchParams(location.search).has("home") || new URLSearchParams(location.search).has("learn")) && S.track === "gotv") {',
         'if ((new URLSearchParams(location.search).has("home") || new URLSearchParams(location.search).has("learn") || window.__wuUnlock) && S.track === "gotv") {')
    swap('S.screen = new URLSearchParams(location.search).has("learn") ? "library" : "welcome"; S.hist = [];',
         'S.screen = new URLSearchParams(location.search).has("learn") || window.__wuUnlock ? "library" : "welcome"; S.hist = [];')
    swap('if (new URLSearchParams(location.search).has("ready")) {', 'if (new URLSearchParams(location.search).has("ready") || window.__wuUnlock) {')
    swap('case "brief-open": { const d5 = S.done5 || {}; if (LESSONS5.every((x) => d5[x.n]) && !P1.issueOpen(el.dataset.lesson || ""))',
         'case "brief-open": { const d5 = S.done5 || {}; if (LESSONS5.every((x) => d5[x.n]) && !window.__wuUnlock && !P1.issueOpen(el.dataset.lesson || ""))', optional=True)
    # the overlay: the two rebuilt trainings open the new page
    swap('var slot = window.__p1 && !window.__p1.issuesNext().open ? "&slot=0" : "";', 'var slot = !window.__wuUnlock && window.__p1 && !window.__p1.issuesNext().open ? "&slot=0" : "";', optional=True)
    pre = "../" if "ov.innerHTML = '<iframe src=\"../issues/?all'" in get() else ""
    swap("ov.innerHTML = '<iframe src=\"" + pre + "issues/?all'",
         "if (lesson === \"oh\" || lesson === \"tx\") { var dn1 = (\",\" + dn + \",\").indexOf(\",\" + lesson + \",\") >= 0; ov.innerHTML = '<iframe src=\"/wdpfxqlsvp/train/?l=' + lesson + '&emb=1' + (dn1 ? '&done=1' : '') + '\" title=\"Maya Kaur’s issue lesson\" allow=\"microphone; autoplay\"></iframe>'; host.appendChild(ov); return; } /* version 164: the rebuilt trainings */\n  ov.innerHTML = '<iframe src=\"" + pre + "issues/?all'")
    open(path, "w", encoding="utf-8").write(get())
    print("ok app", path)

for path in ISSUES:
    swap, resub, get = patcher(path)
    # leave Georgia's lesson in the file, out of the list
    swap('(((location.search + location.hash).match(/[?&#]done=([a-z,]+)/) || [])[1] || "").split(",")',
         '(function () { var keep = []; L.forEach(function (x, k) { if (x.id !== "ga") keep.push(k); }); ICONS = keep.map(function (k) { return ICONS[k]; }); HOME_Q = keep.map(function (k) { return HOME_Q[k]; }); L = keep.map(function (k) { return L[k]; }); })(); /* version 164: only lessons from 2026 Senate winners; Georgia is hidden */\n'
         '  var TRAIN = { oh: 1, tx: 1 }; function goTrain(id, fromHome) { var d = L.findIndex(function (x) { return x.id === id; }); location.href = "/wdpfxqlsvp/train/?l=" + id + (EMB ? "&emb=1" : "") + (S.done[d] ? "&done=1" : "") + (fromHome ? "&ret=" + encodeURIComponent(location.pathname + location.search) : ""); } /* version 164: the rebuilt trainings */\n'
         '  (((location.search + location.hash).match(/[?&#]done=([a-z,]+)/) || [])[1] || "").split(",")')
    swap("if (_li >= 0) { S.lesson = _li;", "if (_li >= 0 && TRAIN[_lq]) { location.replace(\"/wdpfxqlsvp/train/?l=\" + _lq + (EMB ? \"&emb=1\" : \"\") + (S.done[_li] ? \"&done=1\" : \"\")); return; } if (_li >= 0) { S.lesson = _li;")
    swap("if (t.dataset.lesson != null) { S.lesson = +t.dataset.lesson;", "if (t.dataset.lesson != null && L[+t.dataset.lesson] && TRAIN[L[+t.dataset.lesson].id]) { stopAll(); goTrain(L[+t.dataset.lesson].id, true); return; } if (t.dataset.lesson != null) { S.lesson = +t.dataset.lesson;")
    swap("' of 5 done</span>", "' of ' + L.length + ' done</span>", n=2)
    swap("(88 * ndone / 5)", "(88 * ndone / L.length)")
    resub(r'<path d=\\"M42 60 L36 74 L54 60 Z\\" fill=\\"#e2557a\\"/>.*?</svg></g>', '')  # Georgia's bubble leaves the home picture
    swap('A front door with five speech bubbles around it, one for each issue.', 'A front door with four speech bubbles around it, one for each issue.')
    swap("<h2>Five issues voters are raising at the door</h2>", "<h2>Four issues voters are raising at the door</h2>")
    swap("These are the five issues we’re hearing the most about from voters at the door.", "These are four of the issues we’re hearing the most about from voters at the door.")
    open(path, "w", encoding="utf-8").write(get())
    print("ok issues", path)
