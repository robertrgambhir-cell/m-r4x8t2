"""Version 175 (Nov 23, 2026), Robert's note of 12:17 PM PT: "Yes, let's do all five of these," and save them in the rule book so every
future version of the app starts in this look. The look is the investor deck's "five-minute refresh": white, deep pine and mint.

What changes for the canvasser (the look only; no words, steps, timing, voices, grading or voters):
1. Fresh white base. Cream, beige and brown-black become white, pale blue and deep pine: type #0E2F2B, quieter words #4C5F62 and
   #586E71, words on a filled color #FFFFFF, screens #FBFEFD, cards #FFFFFF, soft panels #E9F5FA, lines and tracks #D8E8E5,
   warnings #5B4A1E on #FFF1B0, wrong answers #B4472B on #FFECE3, the laptop stage #E9F5FA (dark mode stays dark).
2. Mint go button. Every main button, the send button and Tap to talk: mint #16C79A with deep pine words. The mic sits in a white
   circle, deep green #00795F; while listening ("I'm done") the button is #00795F with white words. Second buttons are white with
   a 1.5px #D8E8E5 line. Buttons have their own tokens (--btn, --btn-ink, --btn2...), so no main button is dark anywhere.
3. Mint marks, deep green words. Bars, rings, checks' circles, the lesson bar, the mic and the Warmup ring logo are mint on #D8E8E5;
   every green word is #00795F; a check drawn on mint is pine. The trend arrow beside the coach's score is gone: the ring is the only
   mark. Maya's issue icons sit on the deck's tints with a darker drawing.
4. The ring closes the win. A lesson's end, door-ready and the Silver moment show a light mint panel #D5F8EB (24px corners) holding
   the Warmup ring, which closes from its logo gap to a full mint circle, then a pine check where the count was; the headline in
   pine, the line under it #00795F, and what comes next in a pale blue panel. No confetti. Medals become the ring: one part per
   lesson, open until earned, then closed with a check.
5. Flat and calm. No shadows, glows, gradients or colored outlines in the frame; cards are white with a 1.5px #D8E8E5 line. The
   welcome video keeps its caption shading (it sits on video), and pictures keep their own colors.
Also: the review copy opens its own copy of the rebuilt issue trainings (review/train/, the deck look), so the live demo's train/
stays as it was until "ship it". review/train/ is built from ai/train/ with `node ai/tools/build-train.mjs --out
wdpfxqlsvp/review/train` (its audio copied from train/audio/); "ship it" copies it over train/.
The look check, ai/tests/look-check.cjs (playbook rule 62b), fails on the old look and passes on all of this.

Applied to the review copy and the older variants (wdpfxqlsvp/review/index.html, staging/, dev/) and, after --issues, to Maya's
issue lessons page (review/issues/, dev/issues/ and its source ai/assets/issues-source.html, so a rebuild can't bring the old look back).
To undo: git revert the Version 175 commit.
Usage: python3 ai/tools/v175-deck-look.py APP.html ... --issues ISSUES.html ...   (edits in place)
"""
import re
import sys

args = sys.argv[1:]
cut = args.index("--issues") if "--issues" in args else len(args)
APPS, ISSUES = args[:cut], args[cut + 1:]


class Page:
    def __init__(self, path):
        self.path = path
        self.s = open(path, encoding="utf-8").read()

    def swap(self, old, new, n=1, opt=False):
        c = self.s.count(old)
        if opt and c == 0:  # a piece staging/ never had (it predates Phase 1)
            return
        assert c == n, (self.path, c, n, old[:110])
        self.s = self.s.replace(old, new)

    def resub(self, pat, new, n=1):
        s2, c = re.subn(pat, new, self.s, flags=re.S)
        assert c == n, (self.path, c, n, pat[:110])
        self.s = s2

    def save(self):
        open(self.path, "w", encoding="utf-8").write(self.s)
        print("patched", self.path)


# ---------------------------------------------------------------------------------------------------------------------------
# the app pages
# ---------------------------------------------------------------------------------------------------------------------------
def patch_app(P):
    sw = P.swap

    # 1. the laptop stage and the phone's bezel (dark mode keeps its values)
    sw("    --stage-bg: #F4EEE5;\n    --stage-ink: #262320;\n    --stage-muted: #6F685F;\n    --frame: #262320;\n",
       "    --stage-bg: #E9F5FA; /* version 175 (Robert, Nov 23): the deck look, a pale blue stage */\n    --stage-ink: #0E2F2B;\n    --stage-muted: #586E71;\n    --frame: #0E2F2B;\n")
    sw(".vid-camp { flex: none; background: #FCF8F2; border-radius: 10px; padding: 7px 10px 6px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18); }",
       ".vid-camp { flex: none; background: #FFFFFF; border-radius: 10px; padding: 7px 10px 6px; }")
    sw(".vid-end .pw-line { color: rgba(255, 253, 249, 0.72);", ".vid-end .pw-line { color: rgba(255, 255, 255, 0.8);")

    # the skins: Warmup's own (recognize) takes the deck's tokens; the other campaigns' skins keep their look through the defaults
    sw('''  [data-skin="recognize"] {
    --ink: #262320; --ink-2: #5B554D; --ink-3: #6F685F; --on-ink: #FCF8F2;
    --paper: #FCF8F2; --card: #FFFDF9; --soft: #F4EEE5; --line: #E3DBCF; --track: #E6DFD3;
    --accent: #35B57C; --accent-ink: #1B7A4D; --accent-soft: #DDF0E4; --door: #2E6A50;
''', '''  /* version 175 (Robert, Nov 23, 2026): buttons, the talk control, the learner's own words, chosen chips, the win panel and the
     panels that were dark get their own tokens. These defaults keep the other campaigns' skins as they were. */
  [data-skin] { --btn: var(--ink); --btn-ink: var(--on-ink); --btn2: var(--card); --btn2-ink: var(--ink); --btn2-line: var(--line); --listen: var(--accent-ink); --on-listen: #FFFFFF; --mic: var(--accent); --mic-ink: #FFFFFF; --mark-ink: #FFFFFF; --you: var(--ink); --on-you: var(--on-ink); --sel: var(--ink); --on-sel: var(--on-ink); --deep: var(--ink); --on-deep: var(--on-ink); --win: var(--accent-soft); --win-ink: var(--accent-ink); --next: var(--soft); }
  [data-skin="recognize"] {
    --ink: #0E2F2B; --ink-2: #4C5F62; --ink-3: #586E71; --on-ink: #FFFFFF;
    --paper: #FBFEFD; --card: #FFFFFF; --soft: #E9F5FA; --line: #D8E8E5; --track: #D8E8E5;
    --accent: #16C79A; --accent-ink: #00795F; --accent-soft: #DDF7EE; --door: #2E6A50;
    --btn: #16C79A; --btn-ink: #0E2F2B; --btn2: #FFFFFF; --btn2-ink: #0E2F2B; --btn2-line: #D8E8E5; --listen: #00795F; --on-listen: #FFFFFF; --mic: #FFFFFF; --mic-ink: #00795F; --mark-ink: #0E2F2B;
    --you: #00795F; --on-you: #FFFFFF; --sel: #00795F; --on-sel: #FFFFFF; --deep: #E9F5FA; --on-deep: #0E2F2B; --win: #D5F8EB; --win-ink: #00795F; --next: #E9F5FA;
''')

    # 2. buttons, the send button and the talk control
    sw("font-size: 15px; box-shadow: inset 0 0 0 2.5px var(--accent); flex: none; }", "font-size: 15px; flex: none; }")
    sw("min-height: 54px; border-radius: 16px; border: 1.5px solid var(--ink); background: var(--ink); color: var(--on-ink); font-weight: 700; font-size: 16.5px;",
       "min-height: 54px; border-radius: 16px; border: 1.5px solid var(--btn); background: var(--btn); color: var(--btn-ink); font-weight: 700; font-size: 16.5px;")
    sw(".btn.secondary { background: transparent; color: var(--ink); border-color: var(--line); }",
       ".btn.secondary { background: var(--btn2); color: var(--btn2-ink); border-color: var(--btn2-line); }")
    sw(".btn-pair .btn.secondary { color: var(--ink-2); font-weight: 600; border-color: var(--line); background: var(--card); }",
       ".btn-pair .btn.secondary { color: var(--btn2-ink); font-weight: 600; border-color: var(--btn2-line); background: var(--btn2); }")
    sw(".iconbtn.primary { background: var(--ink); border-color: var(--ink); color: var(--on-ink); }",
       ".iconbtn.primary { background: var(--btn); border-color: var(--btn); color: var(--btn-ink); }")
    sw("min-height: 56px; padding: 0 18px; border-radius: 999px; border: 1.5px solid var(--ink); background: var(--ink); color: var(--on-ink);",
       "min-height: 56px; padding: 0 18px; border-radius: 999px; border: 1.5px solid var(--btn); background: var(--btn); color: var(--btn-ink);")
    sw("border-radius: 50%; display: grid; place-items: center; background: var(--accent); color: #FFFFFF; }\n  .mic-dot svg",
       "border-radius: 50%; display: grid; place-items: center; background: var(--mic); color: var(--mic-ink); }\n  .mic-dot svg")
    sw(".mic-btn.on { background: var(--accent-ink); border-color: var(--accent-ink); }",
       ".mic-btn.on { background: var(--listen); border-color: var(--listen); color: var(--on-listen); }")
    sw("border: 0; padding: 0; background: var(--ink-3); color: #FFFDF9; display: grid; place-items: center; cursor: pointer; transition: background .3s; }",
       "border: 0; padding: 0; background: var(--card); color: var(--accent-ink); box-shadow: inset 0 0 0 1.5px var(--line); display: grid; place-items: center; cursor: pointer; transition: background .3s; }")
    sw(".talk-live.live .tl-mic { background: var(--accent); }", ".talk-live.live .tl-mic { background: var(--accent); color: var(--mark-ink); box-shadow: none; }")
    sw(".talk-live.warm .tl-mic { background: var(--ink-3); }", ".talk-live.warm .tl-mic { background: var(--card); color: var(--ink-3); }")
    sw(".vid-end .btn { background: #FFFDF9; color: #201D1A; border-color: #FFFDF9; }",
       ".vid-end .btn { background: var(--btn); color: var(--btn-ink); border-color: var(--btn); }")
    sw(".banner .btn { background: var(--on-ink); color: var(--ink); border-color: var(--on-ink); min-height: 46px; }",
       ".banner .btn { min-height: 46px; }\n  [data-skin]:not([data-skin=\"recognize\"]) .banner .btn { background: var(--on-ink); color: var(--ink); border-color: var(--on-ink); }")
    sw(".coach-pick .btn { margin-top: 8px; min-height: 46px; background: var(--paper); color: var(--ink); border-color: var(--paper); }",
       ".coach-pick .btn { margin-top: 8px; min-height: 46px; }\n  [data-skin]:not([data-skin=\"recognize\"]) .coach-pick .btn { background: var(--paper); color: var(--ink); border-color: var(--paper); }")
    sw("border-radius: 15px; background: #3E7C4F; color: #FDFBF6; font-family: \"Figtree\", system-ui, sans-serif; font-weight: 700; font-size: 16.5px; box-shadow: 0 4px 0 #2B5C3A;",
       "border-radius: 15px; background: var(--btn); color: var(--btn-ink); font-family: \"Figtree\", system-ui, sans-serif; font-weight: 700; font-size: 16.5px;")
    sw(".pg-cta:active { transform: translateY(3px); box-shadow: 0 1px 0 #2B5C3A; }", ".pg-cta:active { transform: translateY(1px); }")
    sw(".pg-cta { min-height: 54px; border-radius: 16px; background: var(--ink); color: var(--on-ink); box-shadow: none;",
       ".pg-cta { min-height: 54px; border-radius: 16px; background: var(--btn); color: var(--btn-ink); box-shadow: none;")
    sw("border: 0; border-radius: 999px; background: var(--stage-ink); color: var(--stage-bg); font: 600 14.5px/1",
       "border: 0; border-radius: 999px; background: #16C79A; color: #0E2F2B; font: 600 14.5px/1")
    sw(".tour-sheet .t-foot .t-go { background: #262320; color: #FCF8F2; border-color: #262320; }",
       ".tour-sheet .t-foot .t-go { background: #16C79A; color: #0E2F2B; border-color: #16C79A; }")
    sw("border-radius: 999px; border: 0; background: #262320; color: #FCF8F2; font: 700 12.5px/1",
       "border-radius: 999px; border: 1.5px solid #D8E8E5; background: #FFFFFF; color: #0E2F2B; font: 700 12.5px/1")
    sw("box-shadow: 0 6px 18px -6px rgba(0,0,0,.45); cursor: pointer; }", "cursor: pointer; }")
    sw(".tour-pill i { width: 8px; height: 8px; border-radius: 50%; background: #35B57C; }", ".tour-pill i { width: 8px; height: 8px; border-radius: 50%; background: #16C79A; }")

    # the learner's own words, chosen chips, and the panels that were dark
    sw(".caption.you { background: var(--ink); color: var(--on-ink); border-color: var(--ink); }\n  .caption.you .cap-who { color: var(--on-ink); opacity: 0.7; }",
       ".caption.you { background: var(--you); color: var(--on-you); border-color: var(--you); }\n  .caption.you .cap-who { color: var(--on-you); opacity: 0.8; }")
    sw(".bub.you { align-self: flex-end; background: var(--ink); color: var(--on-ink);", ".bub.you { align-self: flex-end; background: var(--you); color: var(--on-you);")
    sw(".cam-btn[aria-pressed=\"true\"] { background: var(--ink); color: var(--on-ink); }", ".cam-btn[aria-pressed=\"true\"] { background: var(--sel); color: var(--on-sel); }")
    sw(".seg button[aria-pressed=\"true\"] { background: var(--ink); color: var(--on-ink); }", ".seg button[aria-pressed=\"true\"] { background: var(--sel); color: var(--on-sel); }")
    sw(".tags button[aria-pressed=\"true\"] { border-color: var(--ink); background: var(--ink); color: var(--on-ink); }",
       ".tags button[aria-pressed=\"true\"] { border-color: var(--sel); background: var(--sel); color: var(--on-sel); }")
    sw(".time-chips button[aria-pressed=\"true\"] { border-color: var(--ink); background: var(--ink); color: var(--on-ink); }",
       ".time-chips button[aria-pressed=\"true\"] { border-color: var(--sel); background: var(--sel); color: var(--on-sel); }")
    sw(".tt-chip.on { background: var(--ink); border-color: var(--ink); color: var(--on-ink); }", ".tt-chip.on { background: var(--sel); border-color: var(--sel); color: var(--on-sel); }")
    sw(".p5.today .p5-dot { background: var(--accent-ink); border-color: var(--accent-ink); color: var(--on-ink); box-shadow: 0 0 0 6px var(--accent-soft); }",
       ".p5.today .p5-dot { background: var(--sel); border-color: var(--sel); color: var(--on-sel); }")
    sw(".p5.today .p5-tag { background: var(--ink); color: var(--on-ink); }", ".p5.today .p5-tag { background: var(--sel); color: var(--on-sel); }")
    sw(".today-list li.next .tick { background: var(--ink); color: var(--on-ink); }", ".today-list li.next .tick { background: var(--sel); color: var(--on-sel); }")
    sw(".plan li.next .tick { background: var(--ink); color: var(--on-ink); }", ".plan li.next .tick { background: var(--sel); color: var(--on-sel); }")
    sw(".lr.next .lr-n { background: var(--ink); color: var(--on-ink); }", ".lr.next .lr-n { background: var(--sel); color: var(--on-sel); }")
    sw(".chp.next .chp-n { background: var(--ink); border-color: var(--ink); color: var(--on-ink); }", ".chp.next .chp-n { background: var(--sel); border-color: var(--sel); color: var(--on-sel); }")
    sw(".cycle-dot.day { left: auto; right: -2px; transform: none; background: var(--ink); border-color: var(--ink); }",
       ".cycle-dot.day { left: auto; right: -2px; transform: none; background: var(--accent); border-color: var(--accent); }")
    sw(".banner { padding: 18px; border-radius: 22px; background: var(--ink); color: var(--on-ink);", ".banner { padding: 18px; border-radius: 22px; background: var(--deep); color: var(--on-deep);")
    sw(".pass-top { display: flex; align-items: center; gap: 12px; padding: 16px 16px 14px; background: var(--ink); color: var(--on-ink); }",
       ".pass-top { display: flex; align-items: center; gap: 12px; padding: 16px 16px 14px; background: var(--deep); color: var(--on-deep); }")
    sw("place-items: center; color: #FFFDF9; font-weight: 800; font-size: 18px; box-shadow: inset 0 0 0 2.5px rgba(255,255,255,.35); }",
       "place-items: center; color: #FFFFFF; font-weight: 800; font-size: 18px; }")
    sw(".status-card { padding: 16px; border-radius: 22px; background: var(--ink); color: var(--on-ink);", ".status-card { padding: 16px; border-radius: 22px; background: var(--deep); color: var(--on-deep);")
    sw(".status-card .kicker { color: var(--on-ink); opacity: .7;", ".status-card .kicker { color: var(--on-deep); opacity: .7;")
    sw(".status-card small, .status-card .small { display: block; color: var(--on-ink); opacity: .8; }", ".status-card small, .status-card .small { display: block; color: var(--on-deep); opacity: .8; }")
    sw(".coach-pick { display: grid; gap: 4px; padding: 14px; border-radius: 18px; background: var(--ink); color: var(--on-ink);",
       ".coach-pick { display: grid; gap: 4px; padding: 14px; border-radius: 18px; background: var(--deep); color: var(--on-deep);")
    sw(".coach-pick .kicker { color: var(--on-ink); opacity: .7; margin: 0; }", ".coach-pick .kicker { color: var(--on-deep); opacity: .7; margin: 0; }")
    sw(".plan li.shift > div { background: var(--ink); border-color: var(--ink); color: var(--on-ink); cursor: default; }",
       ".plan li.shift > div { background: var(--deep); border-color: var(--deep); color: var(--on-deep); cursor: default; }")
    sw(".plan li.shift small { color: var(--on-ink); opacity: .75; }", ".plan li.shift small { color: var(--on-deep); opacity: .75; }")
    sw("border-top: 1px solid rgba(255, 255, 255, 0.14); font-size: 13.5px; line-height: 1.35; color: var(--on-ink); }",
       "border-top: 1px solid var(--line); font-size: 13.5px; line-height: 1.35; color: var(--on-deep); }")

    # 3. a check or a word on a mint mark is pine (white on mint is 2.2 to 1)
    for rule in (".funnel li:last-child { background: var(--accent); color: #FFFFFF; }",
                 ".today-list li.done .tick { background: var(--accent); color: #FFFFFF; }",
                 ".plan li.done .tick { background: var(--accent); color: #FFFFFF; }",
                 ".plan li.shift .tick { background: var(--accent); color: #FFFFFF; }",
                 ".next-path li.on .np-d { background: var(--accent); color: #FFFFFF; box-shadow: none; }",
                 ".gw-chip.new { color: #FFFFFF; background: var(--accent); border-color: var(--accent); }",
                 ".wl-dot.on { background: var(--accent); color: #FFFFFF; }",
                 ".lr.done .lr-n { background: var(--accent); color: #FFFFFF; }",
                 ".cr-dot.ok { background: var(--accent); color: #FFFFFF; }"):
        sw(rule, rule.replace("#FFFFFF", "var(--mark-ink)"))
    sw("border-radius: 50%; background: var(--accent); color: #FFFFFF; display: grid; place-items: center; }\n  .td-done .tick svg",
       "border-radius: 50%; background: var(--accent); color: var(--mark-ink); display: grid; place-items: center; }\n  .td-done .tick svg")
    sw(".pg-done { display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; background: var(--accent); color: #FFFFFF; }",
       ".pg-done { display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; background: var(--accent); color: var(--mark-ink); }")
    sw("border-radius: 50%; background: var(--soft); display: grid; place-items: center; color: #FFFFFF; }\n  .sk-week li.on span",
       "border-radius: 50%; background: var(--soft); display: grid; place-items: center; color: var(--mark-ink); }\n  .sk-week li.on span")
    sw(".cf-list li.y::before { background: var(--accent); content: \"\\2713\"; color: #fff;", ".cf-list li.y::before { background: var(--accent); content: \"\\2713\"; color: var(--mark-ink);")
    sw("border: 2px solid var(--line); display: grid; place-items: center; color: #FFFFFF; }\n  .pd-dot svg",
       "border: 2px solid var(--line); display: grid; place-items: center; color: var(--mark-ink); }\n  .pd-dot svg")
    sw("M3.5 8.5 L6.6 11.5 L12.5 5' fill='none' stroke='%23FFFFFF'", "M3.5 8.5 L6.6 11.5 L12.5 5' fill='none' stroke='%230E2F2B'", 2)
    sw("fill='none' stroke='%235B554D'", "fill='none' stroke='%234C5F62'")
    sw("fill='%235B554D'", "fill='%234C5F62'")
    sw("fill='none' stroke='%236F685F'", "fill='none' stroke='%23586E71'", 2)

    # hard-coded frame colors: the demo menu, the toast, scrims, video controls, Progress, the record, the tour
    sw("z-index: 50; background: rgba(24, 21, 18, 0.42);", "z-index: 50; background: rgba(14, 47, 43, 0.4);")
    sw("overflow-y: auto; background: #FFFDF9; color: #262320; border-radius: 22px;", "overflow-y: auto; background: #FFFFFF; color: #0E2F2B; border-radius: 22px;")
    sw(".menu-label { margin: 14px 0 6px; font-size: 12.5px; font-weight: 700; color: #6F685F; }", ".menu-label { margin: 14px 0 6px; font-size: 12.5px; font-weight: 700; color: #586E71; }")
    sw("text-align: left; border: 1.5px solid #E3DBCF; background: #FFFFFF; border-radius: 12px; padding: 8px 10px; font-size: 13.5px; cursor: pointer; color: #262320; }",
       "text-align: left; border: 1.5px solid #D8E8E5; background: #FFFFFF; border-radius: 12px; padding: 8px 10px; font-size: 13.5px; cursor: pointer; color: #0E2F2B; }")
    sw(".menu-row button[aria-pressed=\"true\"] { background: #262320; color: #FCF8F2; border-color: #262320; }",
       ".menu-row button[aria-pressed=\"true\"] { background: #00795F; color: #FFFFFF; border-color: #00795F; }")
    sw("border-radius: 12px; border: 1.5px solid #E3DBCF; background: #FFFFFF; color: #262320; margin-bottom: 6px; }",
       "border-radius: 12px; border: 1.5px solid #D8E8E5; background: #FFFFFF; color: #0E2F2B; margin-bottom: 6px; }")
    sw("width: 100%; border: 1.5px solid #E3DBCF; background: transparent; border-radius: 14px; padding: 10px; font-weight: 700; cursor: pointer; color: #262320; }",
       "width: 100%; border: 1.5px solid #D8E8E5; background: transparent; border-radius: 14px; padding: 10px; font-weight: 700; cursor: pointer; color: #0E2F2B; }")
    sw("border-radius: 12px; border: 1.5px solid #E3DBCF; background: #FFFFFF; color: #262320; }\n  .menu .menu-note { font-size: 12.5px; color: #6F685F;",
       "border-radius: 12px; border: 1.5px solid #D8E8E5; background: #FFFFFF; color: #0E2F2B; }\n  .menu .menu-note { font-size: 12.5px; color: #586E71;")
    sw("z-index: 60; background: #262320; color: #FCF8F2; padding: 11px 16px; border-radius: 14px; font-size: 14px; max-width: min(440px, calc(100vw - 32px)); box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18); }",
       "z-index: 60; background: #0E2F2B; color: #FFFFFF; padding: 11px 16px; border-radius: 14px; font-size: 14px; max-width: min(440px, calc(100vw - 32px)); }")
    sw("border-radius: 2px; background: rgba(38,35,32,.16); overflow: hidden; }", "border-radius: 2px; background: rgba(14,47,43,.16); overflow: hidden; }")
    sw("border: 1px solid var(--line); box-shadow: 0 8px 24px rgba(38, 35, 32, 0.08); margin: 2px 0 14px;", "border: 1px solid var(--line); margin: 2px 0 14px;")
    sw("padding: 7px 14px; background: rgba(38, 35, 32, .88); color: var(--on-ink);", "padding: 7px 14px; background: rgba(14, 47, 43, .88); color: #FFFFFF;")
    sw(".vid { position: relative; height: 100%; overflow: hidden; background: #201D1A; color: #FFFDF9;", ".vid { position: relative; height: 100%; overflow: hidden; background: #0E2F2B; color: #FFFFFF;")
    sw(".vp-row .vp-dot { fill: #E6DFD3; }", ".vp-row .vp-dot { fill: #D8E8E5; }")
    sw("@keyframes vpdot { to { fill: #35B57C; } }", "@keyframes vpdot { to { fill: #16C79A; } }")
    sw("border-radius: 2px; background: rgba(255,253,249,.35); overflow: hidden; }", "border-radius: 2px; background: rgba(255,255,255,.35); overflow: hidden; }")
    sw(".vid-seg i span { display: block; height: 100%; width: 0; background: #FFFDF9; }", ".vid-seg i span { display: block; height: 100%; width: 0; background: #FFFFFF; }")
    sw(".vid-head button { border: 0; background: rgba(255,253,249,.18); color: #FFFDF9;", ".vid-head button { border: 0; background: rgba(255,255,255,.18); color: #FFFFFF;")
    sw(".vid-end .link { color: #FFFDF9;", ".vid-end .link { color: #FFFFFF;")
    sw("z-index: 1; cursor: pointer; background: #201D1A; overflow: hidden; }", "z-index: 1; cursor: pointer; background: #0E2F2B; overflow: hidden; }")
    sw("border-radius: 50%; background: rgba(255,253,249,.94); color: #201D1A; display: grid; place-items: center; box-shadow: 0 8px 24px rgba(0,0,0,.25); transition: opacity .3s ease; }",
       "border-radius: 50%; background: rgba(255,255,255,.94); color: #0E2F2B; display: grid; place-items: center; transition: opacity .3s ease; }")
    sw("border-radius: 50%; background: var(--ink-3); color: #FFFDF9; display: grid; place-items: center; transition: background .3s; }\n  .cut-voice.live .cut-mic { background: var(--accent); }",
       "border-radius: 50%; background: var(--card); color: var(--accent-ink); box-shadow: inset 0 0 0 1.5px var(--line); display: grid; place-items: center; transition: background .3s; }\n  .cut-voice.live .cut-mic { background: var(--accent); color: var(--mark-ink); box-shadow: none; }")
    sw("border-radius: 50%; border: 0; background: rgba(255,253,249,.92); color: #201D1A; display: grid; place-items: center; cursor: pointer; box-shadow: 0 10px 30px rgba(0,0,0,.25); }",
       "border-radius: 50%; border: 0; background: rgba(255,255,255,.92); color: #0E2F2B; display: grid; place-items: center; cursor: pointer; }")
    sw(".screen:has(.vid-cut.on) { background: #201D1A; }", ".screen:has(.vid-cut.on) { background: #0E2F2B; }")
    sw("border-radius: 50%; color: #FFFDF9; font-size: 11.5px; font-weight: 800; letter-spacing: .3px; }", "border-radius: 50%; color: #FFFFFF; font-size: 11.5px; font-weight: 800; letter-spacing: .3px; }")
    sw("font-weight: 800; font-size: 14px; color: #FFFDF9; }\n.camp b", "font-weight: 800; font-size: 14px; color: #FFFFFF; }\n.camp b")
    sw(".phases li.now .dot { background: var(--accent); border-color: var(--accent); box-shadow: 0 0 0 5px var(--accent-soft); }", ".phases li.now .dot { background: var(--accent); border-color: var(--accent); }")
    sw("inset: 0; z-index: 30; background: rgba(38, 35, 32, .45); display: flex;", "inset: 0; z-index: 30; background: rgba(14, 47, 43, .4); display: flex;")
    sw(".spot-ans.strong .ans-fix { border-top-color: rgba(27, 122, 77, .22); }", ".spot-ans.strong .ans-fix { border-top-color: rgba(0, 121, 95, .22); }")
    sw(".dg-ck.new { box-shadow: 0 0 0 4px rgba(53,181,124,.28); }", ".dg-ck.new { box-shadow: none; }")
    sw("color: var(--ink); box-shadow: 0 6px 16px -10px rgba(40, 30, 10, 0.35); }", "color: var(--ink); }")
    sw("bottom: 12px; margin: 0; z-index: 2; box-shadow: 0 8px 24px rgba(30, 24, 18, .16); }", "bottom: 12px; margin: 0; z-index: 2; }")
    sw("border-radius: 999px; background: rgba(255, 253, 249, .95); box-shadow: 0 6px 20px rgba(30, 24, 18, .16); z-index: 2; }",
       "border-radius: 999px; background: rgba(255, 255, 255, .95); z-index: 2; }")
    sw(".wl-gap { flex: 1; height: 2px; margin: 0 7px; background: repeating-linear-gradient(90deg, var(--line) 0 4px, transparent 4px 8px); }",
       ".wl-gap { flex: 1; height: 0; margin: 0 7px; border-top: 2px dashed var(--line); }")
    sw("padding: 0; background: rgba(255, 253, 249, .92); color: var(--ink); display: grid; place-items: center; cursor: pointer; box-shadow: 0 2px 8px rgba(0, 0, 0, .14); }",
       "padding: 0; background: rgba(255, 255, 255, .92); color: var(--ink); display: grid; place-items: center; cursor: pointer; }")
    sw(".moves.wgrid li.lit { background: var(--card); color: var(--ink); box-shadow: 0 1px 2px rgba(38, 35, 32, .06); }", ".moves.wgrid li.lit { background: var(--card); color: var(--ink); }")
    sw("background: var(--card); border: 1.5px solid var(--accent); box-shadow: 0 12px 26px -14px rgba(27, 122, 77, 0.45); }",
       "background: var(--card); border: 1.5px solid var(--line); }")
    sw("@keyframes heroPulse { 0% { box-shadow: 0 0 0 0 rgba(53, 181, 124, 0.5), 0 12px 26px -14px rgba(27, 122, 77, 0.45); transform: scale(1); } 30% { transform: scale(1.015); } 100% { box-shadow: 0 0 0 14px rgba(53, 181, 124, 0), 0 12px 26px -14px rgba(27, 122, 77, 0.45); transform: scale(1); } }",
       "@keyframes heroPulse { 0%, 100% { transform: none; } } /* version 175: no glow */")
    sw("filter: drop-shadow(0 0 6px rgba(53, 181, 124, 0.85)); }", "filter: drop-shadow(0 0 6px rgba(22, 199, 154, 0.85)); }")
    sw(".cut-lrn2 .chp.next.lit .chp-n { background: var(--paper); border-color: #BFB8A8;", ".cut-lrn2 .chp.next.lit .chp-n { background: var(--paper); border-color: var(--line);")
    sw("background: var(--card); color: var(--ink-2); display: grid; place-items: center; box-shadow: 0 6px 16px -6px rgba(0, 0, 0, 0.35); }",
       "background: var(--card); color: var(--ink-2); display: grid; place-items: center; }")
    sw("border: 3px solid var(--card); box-shadow: 0 6px 16px -8px rgba(0,0,0,.35); }", "border: 3px solid var(--card); }")
    sw(".pd.next .pd-dot { border-color: var(--ink); box-shadow: 0 0 0 3px var(--accent-soft); }", ".pd.next .pd-dot { border-color: var(--ink); }")
    sw(".pd.brief.next .pd-dot { border-color: var(--camp); box-shadow: 0 0 0 3px var(--camp-soft); }", ".pd.brief.next .pd-dot { border-color: var(--camp); }")
    sw(".lrn-list li + li { border-top: 1px solid rgba(20, 40, 30, 0.08); }", ".lrn-list li + li { border-top: 1px solid var(--line); }")
    sw(".chp.next .chp-art { box-shadow: 0 0 0 2.5px var(--accent-ink), 0 0 0 6px var(--accent-soft); }", ".chp.next .chp-art { box-shadow: 0 0 0 2.5px var(--accent); }")
    sw("margin-top: -1.5px; background: #A69D8C; }", "margin-top: -1.5px; background: var(--track); }")
    sw("background: var(--paper); border: 1.3px solid #BFB8A8; font-size: 9px;", "background: var(--paper); border: 1.3px solid var(--line); font-size: 9px;")
    sw("border-radius: 50%; display: grid; place-items: center; box-shadow: 0 0 0 2px var(--paper); z-index: 2; }", "border-radius: 50%; display: grid; place-items: center; outline: 2px solid var(--paper); z-index: 2; }")
    sw(".chp-badge.lock { background: var(--paper); border: 1.3px solid #BFB8A8;", ".chp-badge.lock { background: var(--paper); border: 1.3px solid var(--line);")
    sw(".lp-art .chp-badge { right: -5px; bottom: -5px; box-shadow: 0 0 0 2px var(--card); }", ".lp-art .chp-badge { right: -5px; bottom: -5px; outline: 2px solid var(--card); }")
    sw(".lk-art.ring { box-shadow: 0 0 0 2.5px var(--accent-ink); }", ".lk-art.ring { box-shadow: 0 0 0 2.5px var(--accent); }")
    sw("border-radius: 50%; background: #FFF0E3; color: #E0611F;", "border-radius: 50%; background: #FFECE3; color: #B4472B;")
    sw(".sk-week li.today span { box-shadow: 0 0 0 2px var(--paper), 0 0 0 3.5px var(--ink); }", ".sk-week li.today span { outline: 1.5px solid var(--ink); outline-offset: 2px; }")
    sw(".pgn { fill: none; stroke: rgba(53, 181, 124, 0.32);", ".pgn { fill: none; stroke: rgba(22, 199, 154, 0.32);")
    sw("opacity: 1; border: 2px solid #C0564B; border-style: solid; background: #FBEDEA; }", "opacity: 1; border: 2px solid var(--bad); border-style: solid; background: var(--bad-soft); }")
    sw(".spot-tiles .tile.wrong .sp-mk { background: #C0564B; }", ".spot-tiles .tile.wrong .sp-mk { background: var(--bad); }")
    sw(".spot-tiles.done .tile.wrong small { color: #9C3B31; }", ".spot-tiles.done .tile.wrong small { color: var(--bad); }")
    sw("color: var(--paper); display: grid; place-items: center; box-shadow: 0 0 0 2px var(--paper); }", "color: var(--paper); display: grid; place-items: center; outline: 2px solid var(--paper); }")
    sw("overflow: hidden; background: #F0E8DC; box-shadow: 0 10px 26px rgba(38, 35, 32, 0.16), 0 1px 2px rgba(38, 35, 32, 0.12); }", "overflow: hidden; background: #F0E8DC; border: 1.5px solid var(--line); }")
    sw(".pk-c1, .pk-c2 { box-shadow: 0 4px 12px rgba(38, 35, 32, 0.1); }", ".pk-c1, .pk-c2 { box-shadow: none; }")
    sw("padding: 0; background: rgba(28, 26, 22, 0.42); cursor: pointer;", "padding: 0; background: rgba(14, 47, 43, 0.4); cursor: pointer;")
    sw("calc(14px + env(safe-area-inset-bottom, 0px)); box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.18); animation: crUp", "calc(14px + env(safe-area-inset-bottom, 0px)); animation: crUp")
    sw(".cr-dot.open { border: 2px solid #D99A2B; background: #FFF7E6; }", ".cr-dot.open { border: 2px solid var(--warn); background: var(--warn-soft); }")
    sw("text-transform: uppercase; color: #8A5A0B; }", "text-transform: uppercase; color: var(--warn); }")
    sw("font-style: italic; font-size: 15.5px; color: #3E7C4F; }", "font-style: italic; font-size: 15.5px; color: #00795F; }")
    sw("letter-spacing: 0.08em; color: #B4AE9E; white-space: nowrap; }", "letter-spacing: 0.08em; color: #586E71; white-space: nowrap; }")
    sw("letter-spacing: 0.17em; color: #8D877A; margin-top: 4px; }", "letter-spacing: 0.17em; color: #586E71; margin-top: 4px; }")
    sw(".pg-when { margin: 10px 0 0; font-size: 13px; font-weight: 600; color: #5B554D; }", ".pg-when { margin: 10px 0 0; font-size: 13px; font-weight: 600; color: #4C5F62; }")
    sw("border-radius: 50%; background: #F8E7D6; display: grid;", "border-radius: 50%; background: #FFECE3; display: grid;")
    sw(".pg-sk small { font-size: 12.5px; line-height: 1.4; color: #8D877A;", ".pg-sk small { font-size: 12.5px; line-height: 1.4; color: #586E71;")
    sw("letter-spacing: 0.04em; color: #8D877A; }\n  .pg-week span", "letter-spacing: 0.04em; color: #586E71; }\n  .pg-week span")
    sw(".pg-week span { width: 28px; height: 28px; border-radius: 50%; background: #EFEAE0;", ".pg-week span { width: 28px; height: 28px; border-radius: 50%; background: #E9F5FA;")
    sw(".pg-week li.on span { background: #3E7C4F; }", ".pg-week li.on span { background: #16C79A; }")
    sw("box-shadow: inset 0 0 0 1.5px #E2DCCF; }", "box-shadow: inset 0 0 0 1.5px #D8E8E5; }")
    sw(".pg-foot p { margin: 0; font-size: 12px; line-height: 1.5; color: #8D877A; }", ".pg-foot p { margin: 0; font-size: 12px; line-height: 1.5; color: #586E71; }")
    sw(".pg-links .link { color: #3E7C4F;", ".pg-links .link { color: #00795F;")
    sw(".pg-links span { color: #C9C2B2; }", ".pg-links span { color: #586E71; }")
    # the status ladder's medals become rings (drawn by ringMedal, version 175)
    sw(".sh-medal { flex: none; width: 20px; height: 20px; border-radius: 50%; box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.75), inset 0 -2px 3px rgba(0, 0, 0, 0.18); }\n"
       "  .sh-medal.m-silver { background: linear-gradient(140deg, #DFE3E9 8%, #A9AFBA 52%, #79818E); }\n"
       "  .sh-medal.m-gold { background: linear-gradient(140deg, #EDCF83 8%, #D2A43C 52%, #A3791F); }\n"
       "  .sh-medal.m-platinum { background: linear-gradient(140deg, #E9EEF2 8%, #BEC7CF 52%, #909BA6); }\n"
       "  .sh-medal.m-diamond { background: linear-gradient(140deg, #CBE6F1 8%, #7FB2C9 52%, #4E88A5); }\n",
       "  .sh-medal { flex: none; width: 20px; height: 20px; display: grid; } .sh-medal svg { width: 20px; height: 20px; display: block; } /* version 175: the medals are rings */\n")
    # the Silver moment (its markup changes in vSilverG below)
    sw(".sv-x { position: absolute; top: 14px; right: 16px; z-index: 3; width: 32px; height: 32px; border-radius: 50%; border: 0; background: #EFEAE0; color: #77725F;",
       ".sv-x { position: absolute; top: 14px; right: 16px; z-index: 3; width: 32px; height: 32px; border-radius: 50%; border: 0; background: #E9F5FA; color: #4C5F62;")
    P.resub(r"  \.sv-glow \{[^\n]*\}\n  \.sv-medal \{[^\n]*\}\n  \.sv-medal::after \{[^\n]*\}\n  \.sv-medal svg \{[^\n]*\}\n", "")
    sw("text-wrap: balance; max-width: 300px; margin: 6px 0 0; font-size: 14.5px; line-height: 1.5; color: #8D877A; }",
       "text-wrap: balance; max-width: 300px; margin: 6px 0 0; font-size: 14.5px; line-height: 1.5; font-weight: 600; color: var(--win-ink); }")
    sw("padding: 10px; border-radius: 16px; background: #FFFEFA; border: 1px solid var(--line);", "padding: 10px; border-radius: 16px; background: #FFFFFF; border: 1.5px solid var(--line);")
    sw("border-radius: 50%; background: rgba(253, 251, 246, 0.95); display: grid; place-items: center; }", "border-radius: 50%; background: rgba(255, 255, 255, 0.95); display: grid; place-items: center; }")
    sw(".sv-vid small { font-size: 12.5px; color: #8D877A;", ".sv-vid small { font-size: 12.5px; color: #586E71;")
    sw("border-radius: 14px; background: #FFFEFA; border: 1px solid #DED7C7; box-shadow: 0 10px 22px rgba(36, 35, 28, 0.14); transform: rotate(-2deg);",
       "border-radius: 14px; background: #FFFFFF; border: 1.5px solid #D8E8E5; transform: rotate(-2deg);")
    sw("letter-spacing: 0.2em; color: #8D877A; }", "letter-spacing: 0.2em; color: #586E71; }")
    sw(".sv-camp { display: block; font-size: 11px; color: #8D877A;", ".sv-camp { display: block; font-size: 11px; color: #586E71;")
    sw("font-size: 10.5px; font-weight: 600; color: #3E7C4F; }", "font-size: 10.5px; font-weight: 600; color: #00795F; }")
    sw(".sv-note { margin: 9px 0 0; font-size: 12.5px; color: #8D877A; }", ".sv-note { margin: 9px 0 0; font-size: 12.5px; color: #586E71; }")
    sw(".sv-back { color: #3E7C4F;", ".sv-back { color: #00795F;")
    sw("@media (max-height: 700px) { .sv-medal { width: 84px; height: 84px; } .sv-h", "@media (max-height: 700px) { .sv-h")
    # the presenter guide on the laptop stage (dark mode keeps its values)
    sw(":root { --g-acc: #2F8A5F; --g-acc-2: #35B57C; --g-soft: rgba(38, 35, 32, 0.06); --g-line: rgba(38, 35, 32, 0.12); }",
       ":root { --g-acc: #00795F; --g-acc-2: #16C79A; --g-soft: rgba(14, 47, 43, 0.06); --g-line: rgba(14, 47, 43, 0.12); }")
    sw(".gp-list [aria-current=\"step\"] .gp-n { background: var(--g-acc-2); color: #fff; box-shadow: 0 0 0 4px color-mix(in srgb, var(--g-acc-2) 22%, transparent); }",
       ".gp-list [aria-current=\"step\"] .gp-n { background: var(--g-acc-2); color: #0E2F2B; box-shadow: none; }")
    sw("color: var(--accent-ink, #23744F);", "color: var(--accent-ink, #00795F);")
    # the warnings and wrong answers (light mode)
    sw("--sp-5: 24px; --warn: #9A6A0C; --warn-soft: #F6E7C1; --bad: #A4432F; --bad-soft: #F5DDD6; }", "--sp-5: 24px; --warn: #5B4A1E; --warn-soft: #FFF1B0; --bad: #B4472B; --bad-soft: #FFECE3; }")
    sw("max-height: 82vh; overflow: auto; padding: 18px 18px calc(env(safe-area-inset-bottom, 0px) + 16px); border-radius: 22px 22px 0 0; background: var(--stage-bg); color: var(--stage-ink); box-shadow: 0 -12px 40px -10px rgba(0,0,0,.4);",
       "max-height: 82vh; overflow: auto; padding: 18px 18px calc(env(safe-area-inset-bottom, 0px) + 16px); border-radius: 22px 22px 0 0; background: var(--stage-bg); color: var(--stage-ink);")
    sw("z-index: 81; background: rgba(20,18,16,.42); }", "z-index: 81; background: rgba(14,47,43,.4); }")
    sw("border-radius: 6px; background: #F6E7C1; color: #6B4A06;", "border-radius: 6px; background: #FFF1B0; color: #5B4A1E;")
    sw(".tour-sheet ol [aria-current] .n { background: #35B57C; color: #fff; box-shadow: none; }", ".tour-sheet ol [aria-current] .n { background: #16C79A; color: #0E2F2B; box-shadow: none; }")
    # the live AI door
    sw(".thread .note.wai-pill.off { color: #9a5b12; }", ".thread .note.wai-pill.off { color: #5B4A1E; }")
    sw(".thread .note.wai-err { color: #9a3412; }", ".thread .note.wai-err { color: #B4472B; }")
    sw(".sc-coach .cc-chk, .sc-coach .cc-chk b { color: #9a3412; }", ".sc-coach .cc-chk, .sc-coach .cc-chk b { color: #B4472B; }")
    sw(".sc-coach.warn { border-color: #e8b26a; }", ".sc-coach.warn { background: #FFF1B0; border-color: #FFF1B0; }")
    sw(".cf-flag { margin: 0 0 10px; padding: 10px 12px; border-radius: 14px; background: #FDF0E6;", ".cf-flag { margin: 0 0 10px; padding: 10px 12px; border-radius: 14px; background: #FFECE3;")
    sw(".cf-flag.soft { background: #EEF3FB; }", ".cf-flag.soft { background: #E9F5FA; }")
    P.resub(r"(\.frame\.convo-stage > \.thread \{ position: absolute; inset: 0; z-index: 2; margin: 0; padding: 12px 12px 14px; display: flex; flex-direction: column; justify-content: flex-end; gap: 8px; overflow: hidden; )background: linear-gradient\([^;]*\); \}",
            r"\1}")
    sw("background: rgba(255, 253, 249, .88); font-size: 11px;", "background: rgba(255, 255, 255, .9); font-size: 11px;")
    sw(".frame.convo-stage > .thread .bub { max-width: 90%; font-size: 15.5px; box-shadow: 0 2px 12px rgba(0, 0, 0, .16); }", ".frame.convo-stage > .thread .bub { max-width: 90%; font-size: 15.5px; }")
    sw(".frame.convo-stage > .thread .bub.them { background: rgba(255, 253, 249, .96); border-color: transparent; }", ".frame.convo-stage > .thread .bub.them { background: rgba(255, 255, 255, .96); border-color: var(--line); }")
    sw(".frame.convo-stage > .thread .typing { align-self: flex-start; background: rgba(255, 253, 249, .96); }", ".frame.convo-stage > .thread .typing { align-self: flex-start; background: rgba(255, 255, 255, .96); }")
    sw("bottom: 10px; z-index: 3; margin: 0; box-shadow: 0 6px 24px rgba(0, 0, 0, .22); }", "bottom: 10px; z-index: 3; margin: 0; }")
    sw(".app.ft > .actions .btn { box-shadow: 0 6px 22px rgba(0, 0, 0, .28); }", ".app.ft > .actions .btn { box-shadow: none; }")
    P.resub(r"(\.app\.ft \.frame\.convo-stage > \.thread \{ padding-bottom: calc\(92px \+ env\(safe-area-inset-bottom, 0px\)\); )background: linear-gradient\([^;]*\); \}", r"\1}")
    sw("background: #EEF3FB; border: 1.5px solid #9DB5DE; color: var(--ink);", "background: #E9F5FA; border: 1.5px solid #D8E8E5; color: var(--ink);")
    sw(".thread .wai-care a { color: #1F4C91; font-weight: 600; }", ".thread .wai-care a { color: var(--ink); font-weight: 600; }")
    # Maya's campaign tile keeps her blue, flat; the issue lessons' overlay sits on the new paper
    sw("color: #fff; background: linear-gradient(160deg,#2a5fae 0%,#1F4C91 55%,#173b74 100%); font: inherit; }", "color: #fff; background: #1F4C91; font: inherit; }")
    sw("overflow: hidden; background: #FCF8F2; animation: issuesIn", "overflow: hidden; background: #FBFEFD; animation: issuesIn")
    sw(".sms-card .art { display: grid; place-items: center; background: #FCF8F2; }", ".sms-card .art { display: grid; place-items: center; background: #FBFEFD; }")
    sw(".screen :focus-visible, .wide :focus-visible, .menu :focus-visible, .wordmark:focus-visible { outline: 3px solid var(--accent, #35B57C);",
       ".screen :focus-visible, .wide :focus-visible, .menu :focus-visible, .wordmark:focus-visible { outline: 3px solid var(--accent, #16C79A);")
    sw("justify-items: center; gap: 10px; text-align: center; background: var(--card); border: 1.5px solid var(--line); border-radius: 22px; padding: 22px 18px 18px; box-shadow: 0 14px 38px -18px rgba(40, 30, 10, 0.35); }",
       "justify-items: center; gap: 10px; text-align: center; background: var(--card); border: 1.5px solid var(--line); border-radius: 22px; padding: 22px 18px 18px; }")
    sw(".frame .ctrl.in-frame button { background: var(--card); box-shadow: 0 2px 8px rgba(0, 0, 0, .12); padding: 6px 10px; font-size: 12px; }",
       ".frame .ctrl.in-frame button { background: var(--card); border: 1.5px solid var(--line); padding: 6px 10px; font-size: 12px; }")
    sw(".fb.strong { border-color: var(--accent); background: var(--accent-soft); }", ".fb.strong { border-color: var(--accent-soft); background: var(--accent-soft); }")
    sw(".fb.try { border-color: var(--accent); background: var(--accent-soft); }", ".fb.try { border-color: var(--accent-soft); background: var(--accent-soft); }")
    sw(".lrn-card { flex: 1 0 auto; margin-top: 12px; border: 1.5px solid var(--accent-soft);", ".lrn-card { flex: 1 0 auto; margin-top: 12px; border: 1.5px solid var(--line);")
    sw(".td2-ck { position: absolute; left: 50%; top: 50%; width: 38%; height: 38%; transform: translate(-50%, -50%); color: var(--accent-ink); }",
       ".td2-ck { position: absolute; left: 50%; top: 50%; width: 38%; height: 38%; transform: translate(-50%, -50%); color: var(--ink); }")

    # 4. the win panel, the closing ring and the medal rings (version 175)
    sw("</style>\n</head>", """</style>
<style id="v175-css">
  /* ---------- version 175 (Robert, Nov 23, 2026): the deck look. The ring closes the win ---------- */
  .win { display: grid; justify-items: center; text-align: center; width: 100%; padding: 22px 18px 20px; border-radius: 24px; background: var(--win); }
  .win .ring-wrap { margin: 0 0 14px; }
  .win .kicker { margin: 0 0 4px; color: var(--win-ink); }
  .win .h1 { margin: 0; color: var(--ink); }
  .win .lede, .win .togo, .win .win-line { margin: 6px 0 0; max-width: 300px; color: var(--win-ink); font-weight: 600; }
  .win-next { width: 100%; margin-top: 10px; padding: 14px 16px; border-radius: 24px; background: var(--next); text-align: center; }
  .win-next > p { margin: 0; } .win-next > p + p { margin-top: 6px; }
  .win-next .cs-saved { margin: 0; color: var(--ink); }
  .win-next .cs-next { color: var(--ink-2); font-size: 14.5px; line-height: 1.4; }
  .ring-num.win-ck { color: var(--ink); }
  .win-ck svg { width: 100%; height: 100%; display: block; }
  .win-ck.pop { animation: winck .28s ease 1.2s both; }
  .win-ck.pop[data-late] { animation-delay: 4.5s; }
  @keyframes winck { from { opacity: 0; transform: scale(.6); } }
  @media (prefers-reduced-motion: reduce) { .win-ck.pop { animation: none; } }
  .cs-one.cs-win { width: 100%; }
  .cs-one.cs-win .h1 { font-size: 36px; }
  .done-hero.win { margin-top: 2px; }
  .done-hero.win + .next-two { margin-top: 10px; padding: 14px 16px; border-radius: 24px; background: var(--next); text-align: center; }
  .sv-body { justify-content: center; gap: 0; padding: 40px 20px 6px; }
  .sv-win .sv-h { margin: 0; color: var(--ink); }
  .sv-win .sv-sub { margin: 6px auto 0; }
  .sv-next { display: grid; justify-items: center; gap: 12px; padding: 12px; }
  .sv-next .sv-vid, .sv-next .sv-card { margin-top: 0; }
  .lp-medal svg, .medal-art svg { overflow: visible; }
  .frame.convo-stage > .thread > .note:not(.wai-pill) { padding: 6px 12px; border-radius: 14px; background: rgba(255, 255, 255, .94); } /* a note on the call stays readable on the picture, with no shading behind it */
  @media (max-height: 700px) { .win { padding: 16px 16px 14px; } .win .ring-wrap { margin-bottom: 10px; } .cs-one.cs-win .h1 { font-size: 32px; } .sv-body { padding-top: 34px; } .sv-next { gap: 8px; padding: 10px; } .sv-next .sv-card { padding: 10px 14px 9px; } }
</style>
</head>""")

    # ---------------------------------------------------------------- the script
    # the Warmup ring logo: mint on the new track
    sw('stroke="#E6DFD3" stroke-width="12"/><circle cx="42" cy="42" r="32" fill="none" stroke="#35B57C"', 'stroke="#D8E8E5" stroke-width="12"/><circle cx="42" cy="42" r="32" fill="none" stroke="#16C79A"', 4)
    # a check drawn on mint is pine (the other skins keep their white)
    sw('const CHECK = `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5 L6.6 11.5 L12.5 5" fill="none" stroke="#FFFFFF"',
       'const CHECK = `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5 L6.6 11.5 L12.5 5" fill="none" stroke="var(--mark-ink, #FFFFFF)"')
    sw('<path d="m1.5 5 3.4 3.4L11.5 1.4" fill="none" stroke="#FDFBF6"', '<path d="m1.5 5 3.4 3.4L11.5 1.4" fill="none" stroke="var(--mark-ink, #FFFFFF)"')
    # Mia's avatar in mint, its glyph pine
    sw('mia: { name: "Mia R.", role: "field director", color: "#35B57C" },', 'mia: { name: "Mia R.", role: "field director", color: "#16C79A" },')
    sw('style="background:${tr.color}" aria-hidden="true">${TR_GLYPH}</span>', 'style="background:${tr.color}${tr.color === "#16C79A" ? ";color:#0E2F2B" : ""}" aria-hidden="true">${TR_GLYPH}</span>')
    # the personal link box on Progress
    sw("border:1px solid #D8D2C6;border-radius:8px;background:#fff;color:#24231C", "border:1px solid #D8E8E5;border-radius:8px;background:#fff;color:#0E2F2B", opt=True)
    # Progress's icons
    sw('PG_LOCK("#24231C")', 'PG_LOCK("#0E2F2B")')
    sw('PG_LOCK("#8D877A")', 'PG_LOCK("#586E71")')
    sw('fill="#E0813B"/><path d="M7.6 17.4', 'fill="#B4472B"/><path d="M7.6 17.4')
    sw('3.2 2.9Z" fill="#F3B16B"/></svg>`;', '3.2 2.9Z" fill="#FFECE3"/></svg>`;')
    # Maya's issue icons on the deck's tints, the drawing darker (School vouchers, Your electric bill, Heating oil, Tariffs and auto jobs)
    sw('stroke="#fff" stroke-width="2" stroke-linecap="round"/>\', "#3b80b6"],', 'stroke="#fff" stroke-width="2" stroke-linecap="round"/>\', "#E2F3FC", "#0B6199"],')
    sw('stroke-linejoin="round"/>\', "#e8a21a"],', 'stroke-linejoin="round"/>\', "#FFF1B0", "#5B4A1E"],')
    sw('fill="COL"/>\', "#f07c3c"],', 'fill="COL"/>\', "#FFECE3", "#B4472B"],')
    sw('stroke="COL" stroke-width="1.4"/>\', "#2a9d8f"],', 'stroke="COL" stroke-width="1.4"/>\', "#DDF7EE", "#00795F"],')
    sw('''  const [p, c] = ISSUE_ICONS[i % ISSUE_ICONS.length], C = dim ? tileMix(c, 0.62) : c;
  return `<svg class="ta" viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="11" fill="${C}"/><g transform="translate(7 7) scale(1.42)">${p.split("COL").join(C)}</g></svg>`;''',
       '''  const [p, c, k] = ISSUE_ICONS[i % ISSUE_ICONS.length], C = dim ? tileMix(c, 0.5) : c, K = dim ? tileMix(k, 0.55) : k; /* version 175: a tint with a darker drawing */
  return `<svg class="ta" viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="11" fill="${C}"/><g transform="translate(7 7) scale(1.42)">${p.split('"#fff"').join(`"${K}"`).split("COL").join(C)}</g></svg>`;''')
    sw("P = [252, 248, 242];", "P = [251, 254, 253]; /* version 175: dimmed toward the new paper */")
    # the score's verdict loses its glyph: the ring is the only mark beside the coach's score
    sw('<h1 class="h1 verdict-h" style="margin:0">${emoIcon(emo)}${word}</h1>', '<h1 class="h1 verdict-h" style="margin:0">${word}</h1>', 2)
    # no confetti: the ring closing is the reward
    P.resub(r"function confettiHtml\(late\) \{\n.*?\n  return `<div class=\"confetti\" aria-hidden=\"true\">\$\{h\}</div>`;\n\}\n",
            "function confettiHtml() { return \"\"; } /* version 175 (Robert, Nov 23): no confetti; the ring closing is the reward */\n")
    # the medals become rings: one part per lesson, open until earned, then closed with a check
    P.resub(r"/\* the two medals, 40 x 46: [^\n]*\*/\nfunction medalSvg\(kind, earned\) \{\n.*?\n\}\n", r'''/* version 175 (Robert, Nov 23, 2026): medals become the ring. One part per lesson, mint when it's done (Maya's blue for her issue
   lessons), open until every part is earned; then one closed ring with a pine check where the count was */
function ringMedal(parts, done, size, color) {
  const s = size, sw = Math.max(3, Math.round(s * 0.15)), r = (s - sw) / 2, m = s / 2, c = 2 * Math.PI * r, on = color || "var(--accent, #16C79A)";
  if (done >= parts) return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" aria-hidden="true"><circle cx="${m}" cy="${m}" r="${r}" fill="none" stroke="${on}" stroke-width="${sw}"/><path d="M${(s * 0.31).toFixed(1)} ${(s * 0.52).toFixed(1)} L${(s * 0.44).toFixed(1)} ${(s * 0.65).toFixed(1)} L${(s * 0.69).toFixed(1)} ${(s * 0.39).toFixed(1)}" fill="none" stroke="var(--ink, #0E2F2B)" stroke-width="${Math.max(2, s * 0.08).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const gap = s <= 48 ? 14 : 8, seg = 360 / parts, arc = ((seg - gap) / 360) * c;
  return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" aria-hidden="true">${Array.from({ length: parts }, (_, i) => `<circle cx="${m}" cy="${m}" r="${r}" fill="none" stroke="${i < done ? on : "var(--track, #D8E8E5)"}" stroke-width="${sw}" stroke-dasharray="${arc.toFixed(2)} ${(c - arc).toFixed(2)}" transform="rotate(${(-90 + i * seg + gap / 2).toFixed(2)} ${m} ${m})"/>`).join("")}</svg>`;
}
/* the two medals on Learn: Door-ready (five lessons) and Briefed (the issue lessons), as rings */
function medalSvg(kind, earned) {
  const brief = kind !== "door", parts = brief ? Math.max(1, NB()) : 5;
  const done = earned ? parts : brief ? Math.min(parts, S.briefsDone || 0) : LESSONS5.filter((x) => (S.done5 || {})[x.n]).length;
  return ringMedal(parts, done, 40, brief ? "var(--maya, #1F4C91)" : "");
}
''')
    # the win: one closed ring with a pine check (version 175)
    sw("const ringW = (s) => Math.round(s * 0.15);", '''const WIN_CK = `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M31 52 L44 65 L69 39" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>`; /* version 175 */
const ringW = (s) => Math.round(s * 0.15);''')
    # the lesson's end, card 2 of 3: the win panel, then what comes next on pale blue
    sw("const r = (ringNew ? ringGrow((cnt - 1) / 5, cnt / 5, 132, ringW(132)) : ring(cnt / 5, 132, ringW(132))).replace(",
       "const r = (ringNew ? ringGrow(0.75, 1, 116, ringW(116)) : ring(1, 116, ringW(116))).replace(")  # the Warmup ring closes
    sw(r'''body = `${ringNew ? confettiHtml(S.beat === "close") : ""}<div class="cs-one cs-auto" data-act="done-card" data-arg="2" role="button" tabindex="0" aria-label="Next: Today"><div class="ring-wrap" style="width:132px;height:132px">${r}<span class="ring-num num" style="font-size:34px">${cnt}/5</span></div><p class="kicker">Lesson ${n}</p><h1 class="h1">${all ? "You\u2019re door-ready." : `Lesson ${n} done.`}</h1><p class="lede">${all ? "All five moves, from memory." : `Good work ${what}.`}</p><p class="cs-saved">''',
       r'''body = `<div class="cs-one cs-auto cs-win" data-act="done-card" data-arg="2" role="button" tabindex="0" aria-label="Next: Today"><div class="win"><div class="ring-wrap" style="width:116px;height:116px">${r}<span class="ring-num win-ck${ringNew ? " pop" : ""}"${ringNew && S.beat === "close" ? " data-late" : ""}>${WIN_CK}</span></div><p class="kicker">Lesson ${n}</p><h1 class="h1">${all ? "You\u2019re door-ready." : `Lesson ${n} done.`}</h1><p class="lede">${all ? "All five moves, from memory." : `Good work ${what}.`}</p></div><div class="win-next"><p class="cs-saved">''')
    sw(''' : ""}</div>`; /* version 129 (Robert, Oct 27, from Suman): was it saved? Yes, and it says so */''',
       ''' : ""}</div></div>`; /* version 129 (Robert, Oct 27, from Suman): was it saved? Yes, and it says so */ /* version 175: the win panel, then what comes next */''')
    # the older one-screen end
    sw('''  const r = anim && cnt > 0 ? ringGrow((cnt - 1) / 5, cnt / 5, 76, ringW(76)) : ring(cnt / 5, 76, ringW(76));
  return `<div class="done-hero"><div class="ring-wrap" style="width:76px;height:76px">${r}<span class="ring-num num" style="font-size:20px">${cnt}/5</span></div>''',
       '''  const r = anim ? ringGrow(0.75, 1, 76, ringW(76)) : ring(1, 76, ringW(76)); /* version 175: the ring closes the win */
  return `<div class="done-hero win"><div class="ring-wrap" style="width:76px;height:76px">${r}<span class="ring-num win-ck${anim ? " pop" : ""}">${WIN_CK}</span></div>''')
    # Progress's ring: the five parts in mint (Maya's blue for her issues) and, at its end, a ring that closes with a check once earned
    sw('const on = brief ? "#1F4C91" : "#3E7C4F", off = brief ? "#D3DCEB" : "#D2DECB";', 'const on = brief ? "#1F4C91" : "#16C79A", off = brief ? "#D3DCEB" : "#D8E8E5", won = n >= (brief ? NB() : 5); /* version 175 */')
    P.resub(r"  const medal = brief\n    \? `<circle r=\"16\" fill=\"url\(#pgBlue\)\".*?\n    : `<circle r=\"16\" fill=\"url\(#pgSilver\)\".*?`;\n",
            '  const medal = `<circle r="15" fill="#FFFFFF" stroke="${won ? on : off}" stroke-width="5"/>${won ? `<path d="M -6 0.5 L -2 4.5 L 6 -3.5" fill="none" stroke="#0E2F2B" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>` : ""}`; /* version 175: the medal is a ring */\n')
    sw('<svg viewBox="0 0 260 218" aria-hidden="true"><defs>${PG_SILVER}${PG_BLUE}</defs>', '<svg viewBox="0 0 260 218" aria-hidden="true">')
    # Your record: an earned badge is a closed ring with a pine check; Door-ready and Briefed are rings in one part per lesson
    sw('''const frac = (name, k, of, what) => { const on = k >= of; return `<li class="${on ? "on" : ""}${k === 0 ? " zero" : ""}"><span class="ring-wrap" style="width:46px;height:46px">${ring(Math.min(1, k / of), 46, 6)}<span class="ring-num">${on ? `<span class="pg-done">${PG_TICK}</span>` : `<small class="pg-frac num${String(k).length + String(of).length >= 3 ? " long" : ""}">${k}/${of}</small>`}</span></span>''',
       '''const frac = (name, k, of, what, parts) => { const on = k >= of; return `<li class="${on ? "on" : ""}${k === 0 ? " zero" : ""}"><span class="ring-wrap" style="width:46px;height:46px">${on ? ringMedal(1, 1, 46) : parts ? ringMedal(of, k, 46, parts === true ? "" : parts) : ring(Math.min(1, k / of), 46, 6)}<span class="ring-num">${on ? "" : `<small class="pg-frac num${String(k).length + String(of).length >= 3 ? " long" : ""}">${k}/${of}</small>`}</span></span>''')
    sw('${frac("Door-ready", c.nd, 5, "Five lessons on how to canvass")}${frac("Briefed", c.briefs, NB(), "The campaign’s " + NWORD(NB()) + " issue lessons")}',
       '${frac("Door-ready", c.nd, 5, "Five lessons on how to canvass", true)}${frac("Briefed", c.briefs, NB(), "The campaign’s " + NWORD(NB()) + " issue lessons", "var(--maya, #1F4C91)")}')
    # How status works: each tier's medal is a ring (Silver in one part per lesson; the others open)
    sw('<span class="sh-medal m-${t[0].toLowerCase()}" aria-hidden="true"></span>',
       '<span class="sh-medal" aria-hidden="true">${t[0] === "Silver" ? ringMedal(5, LESSONS5.filter((x) => (S.done5 || {})[x.n]).length, 20) : ringMedal(1, 0, 20)}</span>')
    # the Silver moment: the win panel (the ring closes, a pine check), then Maya's thank-you and the card on pale blue
    sw('''    <div class="sv-body"><div class="sv-glow" aria-hidden="true"></div>
      <div class="sv-medal" aria-hidden="true"><svg viewBox="-10 -10 20 20">${PG_DOOR("#4E555F")}</svg></div>
      <h1 class="sv-h">You’re door-ready</h1>
      <p class="sv-sub">Five lessons in five mornings. ${first} recorded a&nbsp;thank-you for you.</p>
''', '''    <div class="sv-body"><div class="win sv-win"><div class="ring-wrap" style="width:96px;height:96px">${ringGrow(0.75, 1, 96, ringW(96))}<span class="ring-num win-ck pop">${WIN_CK}</span></div>
      <h1 class="sv-h">You’re door-ready</h1>
      <p class="sv-sub">Five lessons in five mornings. ${first} recorded a&nbsp;thank-you for you.</p></div><div class="win-next sv-next">
''')
    sw('<path d="M1 1.2v7.6a.7.7 0 0 0 1 .6l6-3.8a.7.7 0 0 0 0-1.2l-6-3.8a.7.7 0 0 0-1 .6Z" fill="#2B5C3A"/>', '<path d="M1 1.2v7.6a.7.7 0 0 0 1 .6l6-3.8a.7.7 0 0 0 0-1.2l-6-3.8a.7.7 0 0 0-1 .6Z" fill="#0E2F2B"/>')
    sw('<path d="M5.4 17a8 8 0 1 1 11.2 0" fill="none" stroke="#3E7C4F" stroke-width="3" stroke-linecap="round"/>', '<path d="M5.4 17a8 8 0 1 1 11.2 0" fill="none" stroke="#16C79A" stroke-width="3" stroke-linecap="round"/>')
    sw('<div class="sv-ct"><svg width="25" height="25" viewBox="-12.5 -12.5 25 25" aria-hidden="true"><defs>${PG_SILVER}</defs><circle r="11" fill="url(#pgSilver)"/><g transform="scale(.92)">${PG_DOOR("#4E555F")}</g></svg>Door-ready</div>',
       '<div class="sv-ct">${ringMedal(5, 5, 25)}Door-ready</div>')
    sw('''        <p class="sv-link">Knock with ${esc(nm.split(" ")[0])} · yourwarmup.com/${slug}</p></div>
    </div>''', '''        <p class="sv-link">Knock with ${esc(nm.split(" ")[0])} · yourwarmup.com/${slug}</p></div>
    </div></div>''')
    P.resub(r'(const share = `<svg width="15" height="17" viewBox="0 0 15 17" aria-hidden="true">.*?)`;',
            lambda m: m.group(1).replace('stroke="#FDFBF6"', 'stroke="currentColor"') + "`;")
    # Today's done row: the ring on the new track, the check pine
    sw('fill="none" stroke="var(--accent-soft)" stroke-width="${w}"/>${f ?', 'fill="none" stroke="var(--track)" stroke-width="${w}"/>${f ?')
    # the review copy opens its own copy of the rebuilt issue trainings (review/train/); the live demo keeps train/ until "ship it"
    sw("ov.innerHTML = '<iframe src=\"/wdpfxqlsvp/train/?l=' + lesson",
       "ov.innerHTML = '<iframe src=\"' + (/\\/review\\//.test(location.pathname) ? \"/wdpfxqlsvp/review/train/\" : \"/wdpfxqlsvp/train/\") + '?l=' + lesson")
    return P


for path in APPS:
    patch_app(Page(path)).save()

# ---------------------------------------------------------------------------------------------------------------------------
# Maya's issue lessons page
# ---------------------------------------------------------------------------------------------------------------------------
# Version 175, Maya's issue lessons page in Warmup's deck look (Robert, Nov 23, 2026, 12:17 PM PT: "Yes, let's do all five of these").
#
# What changes for the canvasser: only the look of the issue lessons page (the issues home, the heating oil and the tariffs and
# auto jobs lessons, their sources and their ends). White screens with deep pine words, pale blue panels, mint marks and mint
# main buttons with pine words; the talk button is mint with a white circle holding a deep green mic, and deep green with white
# words while it listens; the learner's words come in deep green on a white live card, then sit in a deep green bubble with
# white words; the issue icons are tinted tiles with a darker drawing; the briefing hero is a flat Maya blue; no shadows,
# glows, gradients or 3D button edges in the frame. A lesson's end holds the win panel: a light mint panel with the Warmup
# ring, whose last quarter closes to a full circle before a pine check appears (closed at once with reduced motion), and the
# next step under it in a pale blue panel. Words, screens, order, timing, voices, grading and the train links are unchanged.
# Pictures (people, doors, houses, the news clippings, charts' data colors) keep their colors.
#
# How: patch_issues(s, path) takes the text of one issue lessons page (ai/assets/issues-source.html,
# wdpfxqlsvp/review/issues/index.html or wdpfxqlsvp/dev/issues/index.html) and returns it patched. Every change is an
# exact-match swap that asserts its count, so a page that drifted stops the build instead of half-patching. The counts are
# the same on all three pages (the source differs from the review copy only in its "SLOT0" lines, which no swap touches).
#
# To undo: restore the three pages from the commit before version 175.

# Warmup's deck look (the five-minute refresh)
PINE, QUIET, QUIET2, SCREEN, CARD, PANEL, LINE = "#0E2F2B", "#4C5F62", "#586E71", "#FBFEFD", "#FFFFFF", "#E9F5FA", "#D8E8E5"
MINT, MINT_SOFT, DEEP, WIN = "#16C79A", "#DDF7EE", "#00795F", "#D5F8EB"
WRONG, WRONG_SOFT, WARN, WARN_SOFT = "#B4472B", "#FFECE3", "#5B4A1E", "#FFF1B0"

# the ring that closes the win: a 3/4 mint arc from 12 o'clock on a #D8E8E5 track, closing to a full circle, then a pine check
RING12 = ('<svg class="ring12" viewBox="0 0 100 100" aria-hidden="true">'
          '<circle class="rt" cx="50" cy="50" r="42.5" fill="none" stroke="#D8E8E5" stroke-width="15"/>'
          '<circle class="ra" cx="50" cy="50" r="42.5" fill="none" stroke="#16C79A" stroke-width="15" transform="rotate(-90 50 50)"/>'
          '<path class="rc" d="M31 52 L44 65 L69 39" fill="none" stroke="#0E2F2B" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>')

# retired values still in the page's style block once the swaps in patch_issues are done, mapped to the deck look (see CSS_KEEP)
RETIRED = {
    "#FCF8F2": SCREEN, "#FFFDF9": CARD, "#262320": PINE, "#5B554D": QUIET, "#6F685F": QUIET2, "#F4EEE5": PANEL,
    "#F3F0EA": PANEL, "#E3DBCF": LINE, "#E6E0D6": LINE, "#E6DFD3": LINE, "#35B57C": MINT, "#1B7A4D": DEEP,
    "#DDF0E4": MINT_SOFT, "#E6F5EC": MINT_SOFT, "#2F8A5F": DEEP, "#3E7C4F": DEEP, "#23744F": DEEP, "#9A6A0C": WARN,
    "#F6E7C1": WARN_SOFT, "#A4432F": WRONG, "#C2412D": WRONG, "#F5DDD6": WRONG_SOFT, "#FBE8E4": WRONG_SOFT,
}
# a picture inside the frame keeps its look: the news clipping's outlet line stays the paper's warm gray
CSS_KEEP = [".g12 .nw-o { font: 600 12.5px/1 var(--serif); font-style: italic; color: #5b554d;"]
# how many of each the older rules still hold once the swaps in patch_issues are done (asserted, so a drifted page stops the build)
WHITE_ON_MINT = 10
SWEEP = {"#FCF8F2": 1, "#FFFDF9": 1, "#E6DFD3": 3, "#1B7A4D": 5, "#E6F5EC": 1}
DEBUG = False


def patch_issues(s, path):
    pre, a, rest = s.partition("<style>")
    css, b, js = rest.partition("</style>")
    assert a and b, (path, "no style block")
    box = {"css": css, "js": js}

    def swap(where, old, new, n=1):
        t = box[where]
        assert t.count(old) == n, (path, where, t.count(old), old[:90])
        box[where] = t.replace(old, new)

    def recolor(seg, pairs):
        for x, y in pairs:
            assert x in seg, (path, x, seg[:60])
            seg = seg.replace(x, y)
        return seg

    C = lambda old, new, n=1: swap("css", old, new, n)
    J = lambda old, new, n=1: swap("js", old, new, n)

    # ---------- 1. fresh white base: the page's tokens ----------
    C("    --bg: #efe9df; --fg: #2b2723; --mute: #6f685f; --line: #ddd5c8; --panel: #f7f3ec; --accent: #1b7a4d;\n"
      "    --p-bg: #fcf8f2; --p-card: #f4eee5; --p-ink: #262320; --p-muted: #5b554d; --p-kick: #6f685f;\n"
      "    --p-green: #35b57c; --p-deep: #1b7a4d; --p-soft: #dff2e8; --p-track: #e6dfd3; --p-red: #b3261e; --p-red-soft: #f8e1de;\n"
      "    --p-k: #2f6f9f; --p-k-soft: #e3eef7; --p-j: #8d4b3c; --p-j-soft: #f6e6e1; --p-door: #e9dccb; --p-src: #fff4dc; --p-src-ink: #6b4a00;\n"
      "    --maya: #1F4C91;\n",
      "    --bg: #E9F5FA; --fg: #0E2F2B; --mute: #586E71; --line: #D8E8E5; --panel: #E9F5FA; --accent: #00795F;\n"
      "    --p-bg: #FBFEFD; --p-card: #E9F5FA; --p-ink: #0E2F2B; --p-muted: #4C5F62; --p-kick: #586E71;\n"
      "    --p-green: #16C79A; --p-deep: #00795F; --p-soft: #DDF7EE; --p-track: #D8E8E5; --p-red: #B4472B; --p-red-soft: #FFECE3;\n"
      "    --p-k: #2f6f9f; --p-k-soft: #e3eef7; --p-j: #8d4b3c; --p-j-soft: #f6e6e1; --p-door: #e9dccb; --p-src: #FFF1B0; --p-src-ink: #5B4A1E;\n"
      "    --maya: #1F4C91;\n"
      "    /* version 175 (Robert, Nov 23): the deck look's buttons, talk control and win panel get their own tokens */\n"
      "    --btn: #16C79A; --btn-ink: #0E2F2B; --btn2: #FFFFFF; --btn2-line: #D8E8E5; --btn2-ink: #0E2F2B;\n"
      "    --listen: #00795F; --on-listen: #FFFFFF; --mic: #FFFFFF; --mic-ink: #00795F; --win: #D5F8EB; --win-next: #E9F5FA;\n")
    C("button:focus-visible, a:focus-visible, textarea:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }",
      "button:focus-visible, a:focus-visible, textarea:focus-visible { outline: 2px solid var(--p-ink); outline-offset: 2px; }")
    C(":root { --ink: #262320; --ink-3: #8a8178; --accent: #35B57C; --accent-ink: #1B7A4D; --accent-soft: #DDF0E4; --card: #FFFDF9; --soft: #F4EEE5; --bad: #C2412D; --bad-soft: #FBE3DD; }",
      ":root { --ink: #0E2F2B; --ink-3: #586E71; --accent: #16C79A; --accent-ink: #00795F; --accent-soft: #DDF7EE; --card: #FFFFFF; --soft: #E9F5FA; --bad: #B4472B; --bad-soft: #FFECE3; }")
    C(".story.door { --line: #E3DBCF; --soft: #F4EEE5; --card: #FFFDF9; --ink-2: #4A453F; }",
      ".story.door { --line: #D8E8E5; --soft: #E9F5FA; --card: #FFFFFF; --ink-2: #4C5F62; }")
    C("    --ink: #3c3c3c; --body: #4b4b4b; --muted: #5a5a5a; --line: #e5e5e5; --panel: #f4f6f8;\n"
      "    --green: #35b57c; --green-deep: #1b7a4d; --red: #b3261e; --page: #ece7df; --k: 1;\n",
      "    --ink: #0E2F2B; --body: #0E2F2B; --muted: #4C5F62; --line: #D8E8E5; --panel: #E9F5FA;\n"
      "    --green: #16C79A; --green-deep: #00795F; --red: #b3261e; --page: #E9F5FA; --k: 1;\n")
    # the phone on a laptop: flat, a 1.5px line instead of a shadow
    C("border-radius: 30px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 18px 48px -24px rgba(40,30,10,.35); border: 1px solid rgba(0,0,0,.06); }",
      "border-radius: 30px; overflow: hidden; display: flex; flex-direction: column; border: 1.5px solid #D8E8E5; }")
    # the screen number tag for review: pine instead of a near black
    C("color: #fff; background: rgba(20,20,30,.6); padding: 3px 7px; border-radius: 8px; }",
      "color: #fff; background: rgba(14,47,43,.72); padding: 3px 7px; border-radius: 8px; }")

    # ---------- the issues home and every lesson screen (the v12 look) ----------
    C(".g12 .x { border: 0; background: none; padding: 0; width: 22px; height: 22px; color: #afafaf;",
      ".g12 .x { border: 0; background: none; padding: 0; width: 22px; height: 22px; color: #586E71;")
    # 2. the main button: mint with pine words, flat; the second button: white with a 1.5px line
    C(".g12 .src { flex: none; align-self: stretch; min-height: 54px; padding: 0 11px; border: 2px solid var(--line); border-bottom-width: 4px; background: #fff; border-radius: 16px; font: 800 13px/1 var(--sans); color: var(--muted);",
      ".g12 .src { flex: none; align-self: stretch; min-height: 54px; padding: 0 11px; border: 1.5px solid var(--btn2-line); background: var(--btn2); border-radius: 16px; font: 800 13px/1 var(--sans); color: var(--btn2-ink);")
    C("text-wrap: balance; background: var(--green); color: #fff; font: 800 15.5px/1.2 var(--sans); box-shadow: 0 4px 0 var(--green-deep); cursor: pointer; }",
      "text-wrap: balance; background: var(--btn); color: var(--btn-ink); font: 800 15.5px/1.2 var(--sans); cursor: pointer; }")
    C(".g12 .next:active { transform: translateY(4px); box-shadow: none; }", ".g12 .next:active { transform: scale(.985); }")
    C(".g12 .next:focus-visible, .g12 .src:focus-visible, .g12 .x:focus-visible { outline: 3px solid #1F4C91; outline-offset: 2px; }",
      ".g12 .next:focus-visible, .g12 .src:focus-visible, .g12 .x:focus-visible { outline: 3px solid #0E2F2B; outline-offset: 2px; }")
    C(".g12 svg .t.m { font-size: 13.5px; fill: #6f7d8c; }", ".g12 svg .t.m { font-size: 13.5px; fill: #586E71; }")
    # the sources sheet: a pine scrim and a white second button
    C(".g12 .sheet { position: absolute; inset: 0; background: rgba(0,0,0,.28);",
      ".g12 .sheet { position: absolute; inset: 0; background: rgba(14, 47, 43, .40);")
    C(".g12 .sheet .close { margin-top: 16px; width: 100%; height: 46px; border: 2px solid var(--line); border-bottom-width: 4px; border-radius: 14px; background: #fff; font: 800 15px/1 var(--sans); color: var(--ink);",
      ".g12 .sheet .close { margin-top: 16px; width: 100%; height: 46px; border: 1.5px solid var(--btn2-line); border-radius: 14px; background: var(--btn2); font: 800 15px/1 var(--sans); color: var(--btn2-ink);")
    C(".g12 { flex: 1; min-height: 0; height: 100%; position: relative; display: flex; flex-direction: column; background: #fff;",
      ".g12 { flex: 1; min-height: 0; height: 100%; position: relative; display: flex; flex-direction: column; background: #FBFEFD;")
    # home: the count chip, the back arrow, the flat Maya blue hero, the tinted icon tiles, the quotes and the Start pill
    C("color: var(--green-deep); background: #e6f6ee; border-radius: 99px; padding: 7px 10px; }",
      "color: var(--green-deep); background: #DDF7EE; border-radius: 99px; padding: 7px 10px; }")
    C(".g12 .hm-top .back { border: 0; background: none; font: 600 26px/1 var(--sans); color: #8a8a8a;",
      ".g12 .hm-top .back { border: 0; background: none; font: 600 26px/1 var(--sans); color: #586E71;")
    C("border-radius: 20px; background: linear-gradient(160deg, #24569f, #163a72); box-sizing: border-box;",
      "border-radius: 20px; background: #1F4C91; box-sizing: border-box;")
    C("border-radius: 50%; background: var(--c); display: grid; place-items: center; box-shadow: 0 4px 0 rgba(0,0,0,.14); }",
      "border-radius: 50%; background: var(--c); display: grid; place-items: center; }")
    C("background: #fff; color: var(--ink); font: 800 12px/22px var(--sans); font-style: normal; text-align: center; box-shadow: 0 0 0 2px var(--c); }",
      "background: #fff; color: var(--ink); font: 800 12px/19px var(--sans); font-style: normal; text-align: center; border: 1.5px solid var(--line); }")
    C("color: var(--body); background: #f1f3f5; border-radius: 4px 12px 12px 12px;",
      "color: var(--body); background: #E9F5FA; border-radius: 4px 12px 12px 12px;")
    C(".g12 .hr-st.go { color: #fff; background: var(--green); border-radius: 12px; padding: 9px 12px; box-shadow: 0 3px 0 var(--green-deep); }",
      ".g12 .hr-st.go { color: var(--btn-ink); background: var(--btn); border-radius: 12px; padding: 9px 12px; }")
    C(".g12 .hr-st.chev { color: #9a9a9a;", ".g12 .hr-st.chev { color: #586E71;")
    C(".g12 .hr-st.lock { color: #9a9a9a; }", ".g12 .hr-st.lock { color: #586E71; }")
    # practice: the Learn chip, the play button over the door, the chat bubbles
    C("color: var(--green-deep); background: #e7f6ee; border-radius: 99px; padding: 4px 8px 4px 6px; }",
      "color: var(--green-deep); background: #DDF7EE; border-radius: 99px; padding: 4px 8px 4px 6px; }")
    C("border-radius: 50%; border: 0; background: #fff; color: var(--ink); display: grid; place-items: center; box-shadow: 0 3px 10px rgba(0,0,0,.15); cursor: pointer; }",
      "border-radius: 50%; border: 1.5px solid var(--line); background: #fff; color: var(--ink); display: grid; place-items: center; cursor: pointer; }")
    C(".g12 .msg.you { align-self: flex-end; background: #e7f6ee; border-bottom-right-radius: 6px; }",
      ".g12 .msg.you { align-self: flex-end; background: #DDF7EE; border-bottom-right-radius: 6px; }")
    # the learner's own words: a deep green bubble with white words
    C(".g12 .msg.you b { color: var(--green-deep); }",
      ".g12 .msg.you b { color: var(--green-deep); }\n"
      "  .g12 .msg.you.me { background: var(--listen); }\n"
      "  .g12 .msg.you.me b, .g12 .msg.you.me p { color: var(--on-listen); }")
    # the live card while the learner talks (as the door-knocking lessons' live card, rule 59): a white card with a 1.5px line,
    # mint bars and the words in deep green; its start-over mic is white with a deep green mic, and mint while it listens and rings
    C(".g12 .live12 { flex: none; display: flex; align-items: center; gap: 12px; border: 2px solid var(--line); border-radius: 18px;",
      ".g12 .live12 { flex: none; display: flex; align-items: center; gap: 12px; border: 1.5px solid var(--line); background: #fff; border-radius: 18px;")
    C("border-radius: 50%; border: 0; background: var(--green); color: #fff; display: grid; place-items: center; cursor: pointer; }",
      "border-radius: 50%; border: 1.5px solid var(--line); background: var(--mic); color: var(--mic-ink); display: grid; place-items: center; cursor: pointer; }\n"
      "  .g12 .live12.on .mic { border-color: var(--btn); background: var(--btn); color: var(--btn-ink); }")
    # the talk button: idle mint with pine words and a white circle holding a deep green mic; listening deep green with white words
    C(".g12 .next svg { width: 18px; height: 18px; margin-right: 8px; vertical-align: -3px; }",
      ".g12 .next svg { width: 18px; height: 18px; margin-right: 8px; vertical-align: -3px; }\n"
      "  .g12 .next.talk12 svg { width: 28px; height: 28px; padding: 5px; margin-right: 10px; vertical-align: middle; border-radius: 50%; background: var(--mic); color: var(--mic-ink); }\n"
      "  .g12 .next.talk12.on { background: var(--listen); color: var(--on-listen); }")
    C(".g12 .warn12 { margin: 0; font: 600 14px/1.4 var(--sans); color: #8a2a1e; background: #f8e1de;",
      ".g12 .warn12 { margin: 0; font: 600 14px/1.4 var(--sans); color: #B4472B; background: #FFECE3;")
    C(".g12 .typed12 textarea { width: 100%; border: 2px solid var(--line);",
      ".g12 .typed12 textarea { width: 100%; border: 1.5px solid var(--line); background: #fff;")
    C(".g12 .things12 li.n small { color: #8a8a8a; }", ".g12 .things12 li.n small { color: #586E71; }")
    # catch the mistake: white answer cards with a 1.5px line; the mistake in the wrong-answer colors, no colored outline
    C(".g12 .tiles12 .tile { width: 100%; text-align: left; border: 2px solid var(--line); border-bottom-width: 4px; background: #fff;",
      ".g12 .tiles12 .tile { width: 100%; text-align: left; border: 1.5px solid var(--line); background: #fff;")
    C(".g12 .tiles12 .tile.miss { border-color: #b3261e; background: #fbeceb; }",
      ".g12 .tiles12 .tile.miss { border-color: #FFECE3; background: #FFECE3; }")
    C(".g12 .tiles12 .tile.miss small { color: #b3261e; }", ".g12 .tiles12 .tile.miss small { color: #B4472B; }")
    C(".g12 .tiles12 .tile.wrong { border-color: #cfcfcf; }", ".g12 .tiles12 .tile.wrong { border-color: var(--line); }")
    C(".g12 .fix12 { flex: none; border-radius: 16px; padding: 11px 14px; background: #fbeceb; }",
      ".g12 .fix12 { flex: none; border-radius: 16px; padding: 11px 14px; background: #FFECE3; }")
    C(".g12 .fix12.ok { background: #e7f6ee; }", ".g12 .fix12.ok { background: #DDF7EE; }")
    # 4. the lesson's end: the next step in a pale blue panel with 24px corners, under the win panel
    C(".g12 .reveal12 { background: var(--panel); border-radius: 16px; padding: 12px 14px; }",
      ".g12 .reveal12 { background: var(--win-next); border-radius: 24px; padding: 12px 14px; }")

    # ---------- the lesson's sources page and the older story screens ----------
    C(".st-next { border: 0; border-radius: 99px; height: 54px; background: var(--p-ink); color: #fff;",
      ".st-next { border: 0; border-radius: 16px; height: 54px; background: var(--btn); color: var(--btn-ink);")
    C(".story.dark .st-next { background: #fff; color: #1d1c22; }", ".story.dark .st-next { background: var(--btn); color: var(--btn-ink); }")
    C(".story .st-next.green { background: var(--accent-ink); color: #fff; }", ".story .st-next.green { background: var(--btn); color: var(--btn-ink); }")
    C(".sb2 .pseg button.cur .seg, .sb2 .pseg button.done .seg { opacity: 1; background: rgba(0,0,0,.1); }",
      ".sb2 .pseg button.cur .seg, .sb2 .pseg button.done .seg { opacity: 1; background: var(--p-track); }")
    # older screens no lesson reaches today: dark buttons become mint, glow rings, 3D edges, blobs and gradient rings go
    C(".lesson.done .n { background: var(--p-green); border-color: var(--p-green); color: #fff; }",
      ".lesson.done .n { background: var(--p-green); border-color: var(--p-green); color: var(--btn-ink); }")
    C(".mic { width: 112px; height: 112px; border-radius: 50%; border: 0; background: var(--p-ink); color: #fff;",
      ".mic { width: 112px; height: 112px; border-radius: 50%; border: 0; background: var(--btn); color: var(--btn-ink);")
    C(".mic.on { background: var(--p-red); }", ".mic.on { background: var(--listen); color: var(--on-listen); }")
    C(".mic.on::after { content: \"\";", ".mic.on::after { content: none;")
    C(".btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; min-height: 54px; border-radius: 16px; border: 1.5px solid var(--ink); background: var(--ink); color: #fff;",
      ".btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; min-height: 54px; border-radius: 16px; border: 1.5px solid var(--btn); background: var(--btn); color: var(--btn-ink);")
    C("border-radius: 999px; border: 1.5px solid var(--ink); background: var(--ink); color: #fff; font: 700 17px/1 var(--sans);",
      "border-radius: 999px; border: 1.5px solid var(--btn); background: var(--btn); color: var(--btn-ink); font: 700 17px/1 var(--sans);")
    C(".mic-btn.on { background: var(--accent-ink); border-color: var(--accent-ink); }",
      ".mic-btn.on { background: var(--listen); border-color: var(--listen); color: var(--on-listen); }")
    C("border-radius: 50%; display: grid; place-items: center; background: var(--accent); color: #fff; }\n  .mic-dot svg",
      "border-radius: 50%; display: grid; place-items: center; background: var(--mic); color: var(--mic-ink); }\n  .mic-dot svg")
    C(".mic-btn.on .mic-dot::before, .mic-btn.on .mic-dot::after { content: \"\";",
      ".mic-btn.on .mic-dot::before, .mic-btn.on .mic-dot::after { content: none;")
    C(".talk-live.live .tl-mic { background: var(--accent); }", ".talk-live.live .tl-mic { background: var(--accent); color: var(--btn-ink); }")
    C(".talk-live .tl-pulse { position: absolute;", ".talk-live .tl-pulse { display: none; position: absolute;")
    C("border: 0; background: #1F4C91; color: #fff; display: grid; place-items: center; cursor: pointer; box-shadow: 0 0 0 12px rgba(31,76,145,.1), 0 0 0 26px rgba(31,76,145,.05), 0 12px 24px -10px rgba(31,76,145,.5); transition:",
      "border: 0; background: var(--btn); color: var(--mic-ink); display: grid; place-items: center; cursor: pointer; transition:")
    C(".sy-mic svg { width: 42px; height: 42px; }",
      ".sy-mic svg { box-sizing: content-box; width: 40px; height: 40px; padding: 13px; border-radius: 50%; background: var(--mic); }")
    C(".sy-mic.on { background: #e2554a; animation: breathe 1.6s ease-in-out infinite; }", ".sy-mic.on { background: var(--listen); }")
    C("color: #fff; font: 700 12.5px/1 var(--sans); letter-spacing: .04em; text-transform: uppercase; padding: 8px 11px; border-radius: 10px; }",
      "color: var(--btn-ink); font: 700 12.5px/1 var(--sans); letter-spacing: .04em; text-transform: uppercase; padding: 8px 11px; border-radius: 10px; }")
    C(".nd-go { position: absolute; left: 50%; top: -74px; transform: translateX(-50%); white-space: nowrap; background: var(--p-ink);",
      ".nd-go { position: absolute; left: 50%; top: -74px; transform: translateX(-50%); white-space: nowrap; background: var(--btn);")
    C("width: 10px; height: 10px; background: var(--p-ink); transform: translateX(-50%) rotate(45deg);",
      "width: 10px; height: 10px; background: var(--btn); transform: translateX(-50%) rotate(45deg);")
    C("cursor: pointer; box-shadow: 0 6px 0 rgba(0,0,0,.16), inset 0 -4px 0 rgba(0,0,0,.12); transition: transform .15s; }",
      "cursor: pointer; transition: transform .15s; }")
    C(".nd-b:active { transform: translateY(3px); box-shadow: 0 3px 0 rgba(0,0,0,.16); }", ".nd-b:active { transform: scale(.985); }")
    C(".nd.cur .nd-b {  box-shadow: 0 6px 0 rgba(0,0,0,.16), 0 0 0 8px color-mix(in srgb, var(--c) 22%, transparent); }",
      ".nd.cur .nd-b { box-shadow: none; }")
    C(".nd.locked .nd-b { background: #e4ddd2; cursor: default; box-shadow: 0 5px 0 #d2c9bb; }",
      ".nd.locked .nd-b { background: #D8E8E5; cursor: default; }")
    C(".nd.locked .nd-b svg path, .nd.locked .nd-b svg circle { fill: #fff; }",
      ".nd.locked .nd-b svg path, .nd.locked .nd-b svg circle { fill: #586E71; }")
    C("font: 800 14px/1 var(--sans); font-style: normal; box-shadow: 0 2px 6px rgba(0,0,0,.15); }",
      "font: 800 14px/1 var(--sans); font-style: normal; border: 1.5px solid #D8E8E5; }")
    C(".hm-hero { position: relative; overflow: hidden; background: linear-gradient(160deg,#2a5fae 0%,#1F4C91 50%,#173b74 100%);",
      ".hm-hero { position: relative; overflow: hidden; background: #1F4C91;")
    C(".hm-blob { position: absolute; border-radius: 50%; pointer-events: none; }", ".hm-blob { display: none; }")
    C(".st-photo { width: 116px; height: 116px; border-radius: 50%; padding: 4px; background: linear-gradient(135deg,#ffd27a,#ff8a5c,#e2557a); }",
      ".st-photo { width: 116px; height: 116px; border-radius: 50%; padding: 0; background: none; }")
    C("object-fit: cover; border: 3px solid #1F4C91; display: block; }", "object-fit: cover; border: 3px solid #16C79A; display: block; }")
    C("padding: 16px 16px 14px; box-shadow: 0 18px 40px -16px var(--ish, rgba(150,40,70,.45)); transform: rotate(-4deg);",
      "padding: 16px 16px 14px; border: 1.5px solid #D8E8E5; transform: rotate(-4deg);")
    # the older lesson end (".story.donec"): the win panel and the next step under it
    C(".story.donec .reveal { background: rgba(255,255,255,.95); }",
      ".story.donec .dn-top { background: var(--win); border-radius: 24px; padding: 18px; color: var(--p-ink); }\n"
      "  .story.donec .dn-top .st-p { color: #00795F; opacity: 1; }\n"
      "  .story.donec .reveal { background: var(--win-next); border-radius: 24px; }\n"
      "  .story.donec .reveal .kick { color: var(--p-muted); }")
    # older screens no lesson reaches today, so the look check (rule 62b) finds nothing raised or glowing: shadows become a 1.5px
    # line or go, gradients become their main color, glow rings and halos go (old charts and pictures included: none is shown)
    for old, new in [
        (".gapbar .g { background: repeating-linear-gradient(135deg, #f7e2c3 0 8px, #f2d6ae 8px 16px);", ".gapbar .g { background: #f2d6ae;"),
        ("font: 400 16.5px/1.35 var(--serif); box-shadow: 0 6px 18px -10px rgba(0,0,0,.35); z-index: 1; }", "font: 400 16.5px/1.35 var(--serif); border: 1.5px solid #D8E8E5; z-index: 1; }"),
        (".st-grid i.ga { background: #fff; box-shadow: 0 0 0 2.5px #b3261e; }", ".st-grid i.ga { background: #fff; border: 2.5px solid #b3261e; }"),
        (".st-bars2 .bar.got { background: linear-gradient(#ffd27a,#f08a24); box-shadow: 0 0 28px rgba(255,170,60,.55);", ".st-bars2 .bar.got { background: #f08a24;"),
        (".st-vs .half.k { background: linear-gradient(150deg,#3b80b6,#2a5f8c);", ".st-vs .half.k { background: #2a5f8c;"),
        (".st-vs .half.j { background: linear-gradient(150deg,#a35a48,#7c3f31);", ".st-vs .half.j { background: #7c3f31;"),
        ("text-transform: uppercase; box-shadow: 0 0 0 5px #FBF6EE; }", "text-transform: uppercase; }"),
        ("top: -80px; background: radial-gradient(circle, rgba(255,210,122,.35), transparent 65%); }", "top: -80px; background: none; }"),
        ("bottom: -90px; background: radial-gradient(circle, rgba(126,224,168,.28), transparent 65%); }", "bottom: -90px; background: none; }"),
        (".mt-exp { width: 14%; background: linear-gradient(90deg,#4fbf86,#2f9e68);", ".mt-exp { width: 14%; background: #16C79A;"),
        ("padding: 5px 8px; border-radius: 8px; box-shadow: 0 3px 10px rgba(0,0,0,.1); opacity: 0;", "padding: 5px 8px; border-radius: 8px; border: 1.5px solid #D8E8E5; opacity: 0;"),
        ("@keyframes breathe { 50% { box-shadow: 0 0 0 16px rgba(226,85,74,.2), 0 0 0 34px rgba(226,85,74,.08); } }", "@keyframes breathe { 50% { box-shadow: none; } }"),
        (".sy-bubble { background: #fff; border-radius: 20px 20px 20px 6px; padding: 11px 14px; box-shadow: 0 6px 18px -12px rgba(60,40,10,.35); }",
         ".sy-bubble { background: #fff; border-radius: 20px 20px 20px 6px; padding: 11px 14px; border: 1.5px solid #D8E8E5; }"),
        ("place-items: center; border: 0; background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,.15); font-size: 14px; z-index: 2; }",
         "place-items: center; border: 1.5px solid #D8E8E5; background: #fff; font-size: 14px; z-index: 2; }"),
        (".sk-duo .bar { width: 100%; height: 0; border-radius: 14px 14px 6px 6px; background: linear-gradient(#f5a058,#d2641f);", ".sk-duo .bar { width: 100%; height: 0; border-radius: 14px 14px 6px 6px; background: #d2641f;"),
        ("height: 0; background: linear-gradient(#ffc861,#e07a1e); box-shadow: 0 0 30px rgba(255,170,60,.5); transition:", "height: 0; background: #e07a1e; transition:"),
        ("transform: rotate(6deg); box-shadow: 0 6px 18px rgba(0,0,0,.3); }", "transform: rotate(6deg); border: 1.5px solid #D8E8E5; }"),
        ("flex-direction: column; gap: 10px; box-shadow: 0 14px 30px -18px rgba(60,40,10,.4); }", "flex-direction: column; gap: 10px; border: 1.5px solid #D8E8E5; }"),
        ("padding: 11px 12px; box-shadow: 0 6px 16px -12px rgba(30,50,90,.35); }", "padding: 11px 12px; border: 1.5px solid #D8E8E5; }"),
        (".tiles i.ga { background: #fff; color: #b3261e; box-shadow: 0 0 0 2.5px #b3261e; }", ".tiles i.ga { background: #fff; color: #b3261e; border: 2.5px solid #b3261e; }"),
        ("border-radius: 50%; background: conic-gradient(#1b9a5f calc(var(--p) * 1%), #cfe3d8 0);", "border-radius: 50%; background: #cfe3d8;"),
        ("width: 0; background: linear-gradient(90deg,#ffc861,#e07a1e); transition:", "width: 0; background: #e07a1e; transition:"),
        ("transform: translateY(-6px); box-shadow: 0 10px 22px -14px rgba(194,65,45,.7); }", "transform: translateY(-6px); }"),
        ("transition: opacity .35s, transform .35s; box-shadow: inset 0 0 0 2px rgba(255,255,255,.25); }", "transition: opacity .35s, transform .35s; border: 2px solid rgba(255,255,255,.25); }"),
        (".usmap i.ga { background: var(--bad); color: #fff; box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--bad); z-index: 1; }", ".usmap i.ga { background: var(--bad); color: #fff; outline: 2px solid var(--bad); outline-offset: 2px; z-index: 1; }"),
        ("border-radius: 22px 22px 0 0; background: linear-gradient(#efe4d4, #e6d8c4);", "border-radius: 22px 22px 0 0; background: #e6d8c4;"),
        (".dv .fc.mo { background: linear-gradient(#dcefe3, #cfe6d7); }", ".dv .fc.mo { background: #cfe6d7; }"),
        ("padding: 0; background: rgba(255, 253, 249, .92); color: var(--ink); display: grid; place-items: center; cursor: pointer; box-shadow: 0 2px 8px rgba(0, 0, 0, .14); }",
         "padding: 0; background: #FFFFFF; border: 1.5px solid #D8E8E5; color: var(--ink); display: grid; place-items: center; cursor: pointer; }"),
        ("stroke='%235B554D' stroke-width='2' stroke-linejoin='round'/%3E%3Ccircle cx='12' cy='12' r='3' fill='%235B554D'/%3E", "stroke='%234C5F62' stroke-width='2' stroke-linejoin='round'/%3E%3Ccircle cx='12' cy='12' r='3' fill='%234C5F62'/%3E"),
        ("text-decoration: none; box-shadow: 0 6px 18px -10px rgba(0,0,0,.45); border-top: 3px solid #1d1b18;", "text-decoration: none; border-top: 3px solid #1d1b18;"),
        (".hw-door .hw-ic { box-shadow: 0 0 0 4px #F1F8F3; }", ".hw-door .hw-ic { box-shadow: none; }"),
        ("border-bottom: 2px solid rgba(38,35,32,.16); overflow: visible; }", "border-bottom: 2px solid rgba(14,47,43,.16); overflow: visible; }"),
        (".g12 .tiles i.ga { background: #fff; color: var(--red); box-shadow: inset 0 0 0 2.5px var(--red); font-weight: 800; }", ".g12 .tiles i.ga { background: #fff; color: var(--red); border: 2.5px solid var(--red); font-weight: 800; }"),
        (".g12 .key i.ga { background: #fff; box-shadow: inset 0 0 0 2px var(--red); }", ".g12 .key i.ga { background: #fff; border: 2px solid var(--red); }"),
    ]:
        C(old, new)

    # a mark on mint is pine, never white (checks, numbers and mics on mint)
    WOM = re.compile(r"(background: var\(--(?:p-green|accent)\); color: )#fff;")
    n = len(WOM.findall(box["css"]))
    if DEBUG: print("white on mint", n, [box["css"][m.start() - 60:m.end()] for m in WOM.finditer(box["css"])])
    assert n == WHITE_ON_MINT, (path, "white on mint", n)
    box["css"] = WOM.sub(r"\1var(--btn-ink);", box["css"])

    # 3 and 5. every retired value still in the style block (older rules no lesson reaches today), mapped to the deck look;
    # the news clipping keeps its paper look (a picture)
    for k, keep in enumerate(CSS_KEEP):
        swap("css", keep, "\0KEEP%d\0" % k)
    for old, new in RETIRED.items():
        pat = re.compile(re.escape(old), re.I)
        n = len(pat.findall(box["css"]))
        if DEBUG and n: print("retired", old, n, [box["css"][max(0, m.start() - 70):m.end() + 10].replace("\n", " ") for m in pat.finditer(box["css"])])
        assert n == SWEEP.get(old, 0), (path, "retired", old, n)
        box["css"] = pat.sub(new, box["css"])
    for k, keep in enumerate(CSS_KEEP):
        swap("css", "\0KEEP%d\0" % k, keep)

    # 4. the ring that closes the win, and the win panel
    C("  @media (max-height: 620px) {\n    .g12 .body.chat h2 { font-size: 20px; }",
      "  /* version 175 (Robert, Nov 23): the ring closes the win. A lesson's end holds a light mint panel with the Warmup ring: a mint arc\n"
      "     from 12 o'clock around to 9 on a #D8E8E5 track closes its last quarter (0.9 s), then a pine check appears (0.25 s). Reduced motion: closed, with the check */\n"
      "  .ring12 { display: block; overflow: visible; }\n"
      "  .ring12 .ra { stroke-dasharray: 267.04 267.04; stroke-dashoffset: 0; animation: ring12close .9s cubic-bezier(.3,.7,.2,1) both; }\n"
      "  .ring12 .rc { transform-box: view-box; transform-origin: 50px 50px; animation: ring12check .25s ease-out .9s both; }\n"
      "  @keyframes ring12close { from { stroke-dashoffset: 66.76; } to { stroke-dashoffset: 0; } }\n"
      "  @keyframes ring12check { from { opacity: 0; transform: scale(.6); } to { opacity: 1; transform: none; } }\n"
      "  @media (prefers-reduced-motion: reduce) { .ring12 .ra, .ring12 .rc { animation: none; } }\n"
      "  .g12 .win12 { flex: none; display: flex; flex-direction: column; align-items: flex-start; gap: calc(12px * var(--k)); background: var(--win); border-radius: 24px; padding: calc(18px * var(--k)) 18px; }\n"
      "  .g12 .win12 .ring12 { width: calc(64px * var(--k)); height: calc(64px * var(--k)); }\n"
      "  .g12 .win12 h2 { color: var(--ink); }\n"
      "  @media (max-height: 620px) {\n    .g12 .body.chat h2 { font-size: 20px; }")

    # ---------- the page's script: icons, hero, marks and the win panel's markup ----------
    # the issue icons become tinted tiles with a darker drawing (the drawing's white parts take the dark ink, the fill takes the tint)
    ICON_INK = [("#e2557a", "#E2F3FC", "#0B6199"), ("#3b80b6", "#E2F3FC", "#0B6199"), ("#e8a21a", "#FFF1B0", "#5B4A1E"),
                ("#f07c3c", "#FFECE3", "#B4472B"), ("#2a9d8f", "#DDF7EE", "#00795F")]
    lines = box["js"].split("\n")
    at = [i for i, l in enumerate(lines) if l.strip() == "var ICONS = ["]
    assert len(at) == 1, (path, "ICONS", len(at))
    for k, (was, tint, ink) in enumerate(ICON_INK):
        l = lines[at[0] + 1 + k]
        assert l.rstrip(",").endswith('"' + was + '"]'), (path, "icon", k, l[-40:])
        lines[at[0] + 1 + k] = recolor(l, [('"#fff"', '"' + ink + '"'), ('"' + was + '"]', '"' + tint + '"]')])
    box["js"] = "\n".join(lines)
    # the speech bubbles in the home hero's door picture: the same tints and inks; Maya's ring there turns mint
    hero = [("#3b80b6", "#E2F3FC", "#0B6199", 'cx=\\"282\\" cy=\\"36\\"'), ("#e8a21a", "#FFF1B0", "#5B4A1E", 'cx=\\"36\\" cy=\\"112\\"'),
            ("#f07c3c", "#FFECE3", "#B4472B", 'cx=\\"294\\" cy=\\"108\\"'), ("#2a9d8f", "#DDF7EE", "#00795F", 'cx=\\"165\\" cy=\\"18\\"')]
    h0 = box["js"].index('HOME_HERO = "<svg class=\\"hm-hero\\"')
    h1 = box["js"].index('", HOME_Q = [', h0)
    H = box["js"][h0:h1]
    for was, tint, ink, where in hero:
        b0 = H.rindex("<path d=", 0, H.index(where))
        b1 = H.index("</svg></g>", b0) + len("</svg></g>")
        seg = H[b0:b1]
        assert seg.count(was) >= 2 and seg.count("#fff") >= 1, (path, "bubble", was)
        H = H[:b0] + recolor(seg, [(was, tint), ('\\"#fff\\"', '\\"' + ink + '\\"')]) + H[b1:]
    H = recolor(H, [('<circle cx=\\"88\\" cy=\\"136\\" r=\\"23\\" fill=\\"#7ee0a8\\"/>', '<circle cx=\\"88\\" cy=\\"136\\" r=\\"23\\" fill=\\"#16C79A\\"/>')])
    box["js"] = box["js"][:h0] + H + box["js"][h1:]
    # the cover's "Learn" mark is a green word's icon: deep green
    J('stroke=\\"#1b7a4d\\" stroke-width=\\"2.2\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\"><path d=\\"M4 5.5A2.5',
      'stroke=\\"#00795F\\" stroke-width=\\"2.2\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\"><path d=\\"M4 5.5A2.5', 5)
    # checks on mint are pine; a missed mark sits on the line color; the mistake mark in the wrong-answer color
    J('<circle cx="12" cy="12" r="11" fill="#35b57c"/><path d="M7 12.5l3.2 3.2L17 9" stroke="#fff"',
      '<circle cx="12" cy="12" r="11" fill="#16C79A"/><path d="M7 12.5l3.2 3.2L17 9" stroke="#0E2F2B"')
    J('<circle cx="12" cy="12" r="11" fill="#e5e5e5"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="#8a8a8a"',
      '<circle cx="12" cy="12" r="11" fill="#D8E8E5"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="#586E71"')
    J('<circle cx="12" cy="12" r="11" fill="#b3261e"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="#fff"',
      '<circle cx="12" cy="12" r="11" fill="#B4472B"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="#fff"')
    J("  var BAD12 = '", "  var RING12 = '" + RING12 + "'; /* version 175: the ring that closes the win */\n  var BAD12 = '")
    # the learner's own lines get their own class, for the deep green bubble
    J("return '<div class=\"msg ' + (me || cv ? \"you\" : \"bri\") + ", "return '<div class=\"msg ' + (me ? \"you me\" : cv ? \"you\" : \"bri\") + ")
    # the talk button knows when it is listening
    J("btns = '<button class=\"next\" type=\"button\" id=\"talk\">' + MIC12 + ",
      "btns = '<button class=\"next talk12' + (r.listening ? \" on\" : \"\") + '\" type=\"button\" id=\"talk\">' + MIC12 + ")
    # the win panel: the ring and the headline in a light mint panel (the medal on a won 2nd try becomes the ring)
    J("'\" id=\"g12b\"><h2>' + o.h + '</h2>' + o.body + '</div>",
      "'\" id=\"g12b\">' + (o.win ? '<div class=\"win12\">' + RING12 + '<h2>' + o.h + '</h2></div>' : '<h2>' + o.h + '</h2>') + o.body + '</div>")
    J("cls: all ? \"won\" : \"\",\n      body: (all ? '<div class=\"badge12\">' + OK12 + '</div>' : '') + things12(R.hits)",
      "cls: all ? \"won\" : \"\", win: all,\n      body: things12(R.hits)")
    J("\" of the 3 things, twice\",\n      body: '<table class=\"grow12\">", "\" of the 3 things, twice\", win: true,\n      body: '<table class=\"grow12\">")
    # the older lesson end: the same ring on a white screen
    J("shell({ bg: BLUE_BG, dark: true, cls: \"donec\", body: '<div class=\"dn-top\"><svg viewBox=\"0 0 48 48\" width=\"74\" height=\"74\" aria-hidden=\"true\"><circle cx=\"24\" cy=\"24\" r=\"20\" fill=\"#7ee0a8\"/><path d=\"M15.5 24.5 L21.5 30.5 L33 18.5\" fill=\"none\" stroke=\"#163a72\" stroke-width=\"3.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>",
      "shell({ bg: \"#FBFEFD\", dark: false, cls: \"donec\", body: '<div class=\"dn-top\">' + RING12 + '")
    # screens: the page white; Maya's blue flat; the older dark cards flat
    J('var BLUE_BG = "linear-gradient(165deg,#24569f 0%,#1F4C91 55%,#163a72 100%)", ANCHOR_BG = "radial-gradient(110% 70% at 50% 0%,#2b3d5e 0%,#1d1c22 62%)", DARK_BG = "radial-gradient(120% 80% at 50% 100%,#3a2c18 0%,#1b1a1f 60%)";',
      'var BLUE_BG = "#1F4C91", ANCHOR_BG = "#1d1c22", DARK_BG = "#1b1a1f";')
    J('shell({ bg: "#FCF8F2", ', 'shell({ bg: "#FBFEFD", ', 6)
    J('function renderSources() { var x = X(); shell({ bg: "#FBF6EE", ', 'function renderSources() { var x = X(); shell({ bg: "#FBFEFD", ')
    # the older home's path and progress ring
    J('fill="none" stroke="#d9cfbf" stroke-width="5" stroke-linecap="round" stroke-dasharray="2 12"',
      'fill="none" stroke="#D8E8E5" stroke-width="5" stroke-linecap="round" stroke-dasharray="2 12"')
    J('<circle cx="18" cy="18" r="14" fill="none" stroke="#7ee0a8" stroke-width="5"', '<circle cx="18" cy="18" r="14" fill="none" stroke="#16C79A" stroke-width="5"')

    return pre + a + box["css"] + b + box["js"]


def issues_train_links(P):
    """the review copy's issue lessons open the review copy of the rebuilt trainings (review/train/); the live pages keep train/"""
    P.swap('location.href = "/wdpfxqlsvp/train/?l=" + id', 'location.href = (/\\/review\\//.test(location.pathname) ? "/wdpfxqlsvp/review/train/" : "/wdpfxqlsvp/train/") + "?l=" + id')
    P.swap('location.replace("/wdpfxqlsvp/train/?l=" + _lq', 'location.replace((/\\/review\\//.test(location.pathname) ? "/wdpfxqlsvp/review/train/" : "/wdpfxqlsvp/train/") + "?l=" + _lq')


for path in ISSUES:
    P = Page(path)
    P.s = patch_issues(P.s, P.path)
    issues_train_links(P)
    P.save()
