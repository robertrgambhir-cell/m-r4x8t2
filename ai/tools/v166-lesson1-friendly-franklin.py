"""Version 166 (Nov 15, 2026), from Robert's phone run of version 165 (7:44 PM PT). Applied to all four app pages (live,
staging, dev and p1).

1. No "Powered by Warmup" on the welcome video's last screen (Robert). It stays on Today.
2. Franklin, not Woodbridge (Robert, Nov 6, 6:56 PM PT, and again Nov 15): the campaign lockup ("FOR U.S. SENATE ·
   FRANKLIN"), its spoken label and every voter's description. Maya's own words in the welcome video still say Woodbridge,
   so its caption keeps the word she says (Robert: the audio can say Woodbridge for now).
3. The voter's picture holds its size on an AI door (Robert: "a constant-sized image of the voter"). The conversation
   shows under it; when a new line doesn't fit, the oldest slides up out of view, with no scrolling back (at a real door
   there's no transcript). The live words card keeps one height, showing the latest words.
4. WAI_PUB refreshed from ai/scenarios.js (lesson 1's voters now check only the four parts; practice AI 165-3).

To undo: git revert the Version 166 commit. Usage: python3 v166-lesson1-friendly-franklin.py page.html ... (edits in place)
"""
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SCEN = os.path.join(HERE, "..", "scenarios.js")
PUB = subprocess.run(["node", "--input-type=module", "-e",
                      "import { SCENARIOS, publicScenario } from " + json.dumps(SCEN) + ";"
                      "const o = {}; for (const k of Object.keys(SCENARIOS)) o[k] = publicScenario(k); console.log(JSON.stringify(o));"],
                     capture_output=True, text=True, check=True).stdout.strip()
assert PUB.startswith("{") and "sofia_intro" in PUB and "Woodbridge" not in PUB

CSS = '''
  /* version 166 (Robert, Nov 15): on an AI door the voter's picture holds one size; the conversation lives under it and the
     oldest line slides up out of view when a new one doesn't fit (no scrolling back: a real door has no transcript) */
  .content.stage > .frame.convo-stage { flex: 0 0 44%; min-height: 0; }
  .content.stage > .frame.convo-stage + .thread { flex: 1 1 0; min-height: 0; overflow: hidden; justify-content: flex-end; -webkit-mask-image: linear-gradient(transparent 0, #000 22px); mask-image: linear-gradient(transparent 0, #000 22px); }
  .content.stage > .frame.convo-stage + .thread > .note.wai-pill { order: -1; margin-bottom: auto; }
  .content.stage > .frame.convo-stage ~ .talk-live .tl-said { height: 3.9em; max-height: 3.9em; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-end; }
'''

for path in sys.argv[1:]:
    s = open(path, encoding="utf-8").read()

    def swap(old, new, n=1):
        global s
        assert s.count(old) == n, (path, s.count(old), old[:90])
        s = s.replace(old, new)

    i = s.index("const WAI_PUB = ")
    j = s.index("\n", i)
    s = s[:i] + "const WAI_PUB = " + PUB + ";" + s[j:]

    # 1. no Powered by on the video's last screen
    swap('<button class="link" data-act="video-again">Watch again</button>${campNow() ? pwLine() : ""}</div>`',
         '<button class="link" data-act="video-again">Watch again</button></div>` /* version 166 (Robert): no Powered by here */')

    # 2. Franklin everywhere but the caption of Maya's own recorded words
    keep = "running to make Woodbridge more affordable"
    n_keep = s.count(keep)
    s = s.replace(keep, "@@KEEP@@")
    s = s.replace("Woodbridge", "Franklin").replace("WOODBRIDGE", "FRANKLIN")
    s = s.replace("@@KEEP@@", keep)
    assert s.count("Woodbridge") == n_keep, (path, s.count("Woodbridge"))

    # 3. the door holds its size
    swap("  .thread .bub.old { display: none; }\n", "  .thread .bub.old { display: none; }\n" + CSS)

    open(path, "w", encoding="utf-8").write(s)
    print("patched", path)
