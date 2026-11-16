"""Version 169 (Nov 15, 2026), from Robert's 11:38 PM PT phone run. Applied to all four app pages (live, staging, dev and p1).

The door goes full screen, like FaceTime (Robert: "cover up more of the screen... full left to right and bottom, the click
to talk would just be over the voter"):
1. On the door conversation (lesson doors and Practice doors) and on the 1st intro's Knock screen, the picture runs edge to
   edge and down to the bottom of the phone, under the header; the main button floats over the picture.
2. The picture zooms to the door, so the door and the voter are what you see, not the siding (Robert: "you're mostly looking
   at just the siding of a house").
3. The voter sits higher, so the captions cover less of her (Robert: "a lot of her body covered by the text").
The captions and the live words card sit just above the floating button.

To undo: git revert the Version 169 commit. Usage: python3 v169-full-screen-door.py page.html ... (edits in place)
"""
import sys

CSS = '''
  /* version 169 (Robert, Nov 15, 11:38 PM PT): the door goes full screen, like FaceTime. The picture runs edge to edge and
     to the bottom of the phone; the main button floats over it; the picture zooms to the door and the voter sits higher. */
  .app.ft > .content.stage { padding: 4px 0 0; overflow: hidden; }
  .app.ft > .content.stage > :not(.frame):not(.rep-card) { margin-left: 20px; margin-right: 20px; }
  .app.ft > .content.stage > .frame.convo-stage, .app.ft > .content.stage > .rep-card { flex: 1 1 auto; min-height: 0; margin: 10px 0 0; border-radius: 22px 22px 0 0; }
  .app.ft > .content.stage > .rep-card { display: flex; flex-direction: column; padding: 0; background: none; border: 0; box-shadow: none; }
  .app.ft > .content.stage > .rep-card > .frame { position: relative; flex: 1 1 auto; min-height: 0; height: auto; max-height: none; margin: 0; border: 0; border-radius: 22px 22px 0 0; }
  .app.ft .rep-card > .frame > svg, .app.ft > .content.stage > .rep-card.whole .frame.full svg.voter { position: absolute; inset: 0; left: 0; top: 0; bottom: auto; width: 100%; height: 100%; margin: 0; display: block; }
  .app.ft > .actions { position: absolute; left: 0; right: 0; bottom: 0; z-index: 6; padding: 10px 20px calc(18px + env(safe-area-inset-bottom, 0px)); background: none; }
  .app.ft > .actions .btn { box-shadow: 0 6px 22px rgba(0, 0, 0, .28); }
  .app.ft .frame.convo-stage > .thread { padding-bottom: calc(92px + env(safe-area-inset-bottom, 0px)); background: linear-gradient(to top, rgba(28, 24, 20, .62) 0, rgba(28, 24, 20, .22) 30%, rgba(28, 24, 20, 0) 46%); }
  .app.ft .frame.convo-stage > .talk-live { bottom: calc(88px + env(safe-area-inset-bottom, 0px)); }
  @media (max-height: 760px) { .app.ft .frame.convo-stage > .thread .bub.you:has(~ .bub.them) { display: none; } } /* on a short phone only the voter's latest line stays, so her face stays clear */
'''
# the door fills the picture: the whole doorway and its frame, a little siding above (the phone's tall shape crops the sides)
DOOR_VB = 'viewBox="0 18 320 222" preserveAspectRatio="xMidYMid slice" '

for path in sys.argv[1:]:
    s = open(path, encoding="utf-8").read()

    def swap(old, new, n=1):
        global s
        assert s.count(old) == n, (path, s.count(old), old[:90])
        s = s.replace(old, new)

    swap("  .frame.convo-stage:has(> .talk-live) > .thread .bub,", CSS + "  .frame.convo-stage:has(> .talk-live) > .thread .bub,")
    # the app shell gets a full-screen mode
    swap('''  return `<div class="app${o.noBrand ? " no-brand" : ""}">${head}''', '''  return `<div class="app${o.noBrand ? " no-brand" : ""}${o.ft ? " ft" : ""}">${head}''')
    # both door conversations: full screen, zoomed to the door
    swap('''.replace("<svg ", '<svg preserveAspectRatio="xMidYMid slice" ')}<video class="selfie"''', '''.replace(/<svg ([^>]*?)viewBox="[^"]*" /, '<svg $1').replace("<svg ", '<svg ''' + DOOR_VB + '''')}<video class="selfie"''', 2)
    swap('''  `, { back: "coach", stage: true, footer: composer("send", "Type what you\\u2019d say") }); /* version 150: a Practice knock opens straight on the door */''',
         '''  `, { back: "coach", stage: true, ft: true, footer: composer("send", "Type what you\\u2019d say") }); /* version 150: a Practice knock opens straight on the door; version 169: full screen */''')
    swap('''  `, { tag: "", back: "path", stage: true, footer: composer("send", "Type what you\\u2019d say") }); /* version 168: the FaceTime door */''',
         '''  `, { tag: "", back: "path", stage: true, ft: true, footer: composer("send", "Type what you\\u2019d say") }); /* version 168: the FaceTime door; version 169: full screen */''')
    # the 1st intro's Knock screen: full screen, zoomed to the door (before the knock only; the one-line fallback keeps its layout)
    swap('''    return app(`${head}${lede}${scenePart}`, { tag: "", footer, stage: true });''',
         '''    return app(`${head}${lede}${knocked ? scenePart : scenePart.replace(/<svg ([^>]*?)viewBox="[^"]*" /, '<svg $1').replace("<svg ", '<svg ''' + DOOR_VB + '''')}`, { tag: "", footer, stage: true, ft: !knocked }); /* version 169: the Knock screen is full screen, zoomed to the door */''')

    open(path, "w", encoding="utf-8").write(s)
    print("patched", path)
