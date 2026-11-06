"""Version 162 (Robert, Nov 6, 11:35 AM PT): lock the Progress tab. The tab wears the lock, and tapping it (or the guide's
stop 9) shows one line: "This is locked while we prioritize editing the other parts of the app."
To unlock: set SOON_TABS back to {} and drop this swap. Usage: python3 v162-lock-progress.py page.html (edits in place)"""
import sys

LINE = "This is locked while we prioritize editing the other parts of the app."
for path in sys.argv[1:]:
    s = open(path, encoding="utf-8").read()

    def swap(old, new):
        global s
        assert s.count(old) == 1, (path, old[:60])
        s = s.replace(old, new)

    swap("const SOON_TABS = {};", "const SOON_TABS = { me: \"me\" }; /* version 162 (Robert, Nov 6): Progress locked while the other parts get edited */")
    swap("<p class=\"kicker\">Coming soon</p>\n      <h1 class=\"h1\">${c[0]}</h1>",
         "<p class=\"kicker\">${k === \"me\" ? \"Locked\" : \"Coming soon\"}</p>\n      <h1 class=\"h1\"${k === \"me\" ? \" style=\\\"font-size:24px;line-height:1.25\\\"\" : \"\"}>${c[0]}</h1>")
    swap("  me: [\"Your shifts, streaks and badges.\",", "  me: [\"" + LINE + "\",")
    swap("sub: \"Streak, medals, record\",", "sub: \"Locked for now\",")
    swap("h: \"Progress the volunteer owns.\",", "h: \"Progress is locked for now.\",")
    swap("b: \"A streak that forgives one missed day a week, medals for Door-ready and Briefed, and a record that travels from campaign to campaign.\",",
         "b: \"" + LINE + "\",")
    swap("k: \"Progress\", sample: \"Sample progress: Rosa, five days in and door-ready.\",", "k: \"Progress\", sample: \"\",")
    swap("why: \"The campaign sees status, never scores, so practice stays safe to get wrong.\" },", "why: \"\" },")
    open(path, "w", encoding="utf-8").write(s)
    print("ok", path)
