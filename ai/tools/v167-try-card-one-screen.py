"""Version 167 (Nov 15, 2026), from Robert's 8:09 PM PT phone run. Applied to all four app pages (live, staging, dev and p1).

1. The 1st intro's card fits one screen (Robert: "a mountain of text", "you have to scroll"). After a conversation the card
   no longer repeats everything you said at the top; each of the four parts still shows the words that earned it.
2. Every lesson goes on to Hear it done after the 1st try, even with all four parts (Robert: "it should be Next: hear it
   done"). The "See the full lesson" link is gone, since the full lesson is now the only path (version 67's skip retired).

To undo: git revert the Version 167 commit. Usage: python3 v167-try-card-one-screen.py page.html ... (edits in place)
"""
import sys

for path in sys.argv[1:]:
    s = open(path, encoding="utf-8").read()

    def swap(old, new, n=1):
        global s
        assert s.count(old) == n, (path, s.count(old), old[:90])
        s = s.replace(old, new)

    swap('<div class="fb try${anim ? " cascade" : ""}"><p class="you-said">You said: \\u201c${evSaid(R.text, evParts)}\\u201d</p>',
         '<div class="fb try${anim ? " cascade" : ""}">${R.convo ? "" : `<p class="you-said">You said: \\u201c${evSaid(R.text, evParts)}\\u201d</p>`}') # version 167: after a conversation the rows carry your words
    swap('const sum = all ? "Amazing job! Let\\u2019s practice one more time." :',
         'const sum = all ? "Amazing job! Now hear it done, then try it once more." :') # version 167
    swap('footer: `${button([all ? "Next: your 2nd intro" : "Next: hear it done", "try-next"]).replace(\'class="btn \', anim ? \'class="btn late \' : \'class="btn \')}${all ? `<button class="link center" data-act="try-full">See the full lesson</button>` : ""}` });',
         'footer: `${button(["Next: hear it done", "try-next"]).replace(\'class="btn \', anim ? \'class="btn late \' : \'class="btn \')}` }); /* version 167 (Robert): always on to Hear it done, no See the full lesson */')
    swap("const skipNow = () => { const R = tryNow(); return !S.tryFull && !!(R && !R.pending && R.hits.every(Boolean)); };",
         "const skipNow = () => false; /* version 167 (Robert, Nov 15): the full lesson every time; version 67's skip after a perfect 1st try is retired */")
    swap("  S.skipWatch = hits.every(Boolean);\n", "  S.skipWatch = false; /* version 167 */\n")
    swap("    S.skipWatch = h1.every(Boolean);\n", "    S.skipWatch = false; /* version 167 */\n")

    open(path, "w", encoding="utf-8").write(s)
    print("patched", path)
