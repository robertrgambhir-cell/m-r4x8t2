"""Version 163 (Nov 6, 2026). Two changes, applied to all four app pages (live, staging, dev and p1).

1. Audio only (Robert, Nov 6, 10:52 AM PT: "I never want typing to be an option"). The three offers to type that
   came in with versions 156 and 161 are gone: the mic card's "Type it instead" button and its "Or type your words
   for now." sentences, the "or type it instead" link after a turn where the recognizer heard nothing, and the AI
   door's "Type instead" link. The mic card is version 94's again: one clear card and Try again.
2. The laptop guide is off unless asked for (made the call, Nov 6). A shared link opens on the app with a quiet
   "Show the demo guide" link at the bottom left; ?guide (or that link, or the G key) turns it on for a screen-share,
   and ?noguide still hides the link too.

To undo: git revert the Version 163 commit. Usage: python3 v163-audio-only-guide-off.py page.html ... (edits in place)
"""
import sys

for path in sys.argv[1:]:
    s = open(path, encoding="utf-8").read()

    def swap(old, new, n=1):
        global s
        assert s.count(old) == n, (path, s.count(old), old[:70])
        s = s.replace(old, new)

    # 1a. the mic card: no typing button, no "or type" sentences
    swap(" Close or mute that app, then tap Try again. Or type your words for now.\"",
         " Close or mute that app, then tap Try again.\"")
    swap("Allow the microphone for this site in your browser settings, then tap Try again. Or type your words for now.\"",
         "Allow the microphone for this site in your browser settings, then tap Try again.\"")
    swap("<button class=\"btn secondary mm-type\" data-act=\"mic-type\">Type it instead</button>", "")
    # 1b. a turn that heard nothing: talk again, no keyboard
    swap("const tl = 'Nothing came through. Tap to talk and try again, or <button class=\"link\" data-act=\"mic-type\">type it instead</button>.'; if (note) note.innerHTML = tl;",
         "if (note) note.textContent = \"Nothing came through. Tap to talk and try again.\"; /* version 163: audio only */")
    # 1c. the AI door: no Type instead link
    swap("${live && S.screen === \"door\" && !S.typeMode && WAI.full() ? `<button class=\"link wai-type\" data-act=\"wai-type\">Type instead</button>` : \"\"}",
         "")
    # the handlers stay harmless if anything old calls them
    swap("    case \"mic-type\": micType(); break; /* version 161 */",
         "    case \"mic-type\": break; /* version 163: audio only, typing is never offered */")
    swap("case \"wai-type\": { S.typeMode = true;", "case \"wai-type\": break; case \"wai-type-off\": { S.typeMode = true;")

    # 2. the guide: off unless ?guide, the link or the G key turns it on (a stored choice still counts)
    swap("const gState = { on: !gClean && store.get(\"guide\", true) !== false,",
         "const gState = { on: !gClean && (/[?&]guide\\b/.test(location.search) || store.get(\"guide\", false) === true), /* version 163: off unless asked for */")

    open(path, "w", encoding="utf-8").write(s)
    print("ok", path)
