"""Version 170 (Nov 16, 2026), from Robert's 8:51 PM PT phone run: on the FaceTime door the captions covered Sofia's face.
"The voter's face should be higher... more like their chest it's covering. We want to be able to see their face there moving."

The door conversation now draws a taller doorway (the wall, the door and the voter's shirt run on below the old bottom edge) and
frames it from the top of the doorway down, so the face sits in the top third of the picture and the captions sit over her chest.
Only the conversation screen draws the taller door (scene option tall); every other screen draws the door as before.
Applied to all four app pages (live, staging, dev and p1).

To undo: git revert the Version 170 commit. Usage: python3 v170-face-above-captions.py page.html ... (edits in place)
"""
import sys

OLD_VB = """.replace("<svg ", '<svg viewBox="0 18 320 222" preserveAspectRatio="xMidYMid slice" ')"""
NEW_VB = """.replace("<svg ", d.scene === "store" ? '<svg viewBox="0 18 320 222" preserveAspectRatio="xMidYMid slice" ' : '<svg viewBox="0 60 320 256" preserveAspectRatio="xMidYMin slice" ')"""

SUB = """${d.sub}` }).replace(/<svg ([^>]*?)viewBox="[^"]*" /, '<svg $1')"""

for path in sys.argv[1:]:
    s = open(path, encoding="utf-8").read()

    def swap(old, new, n=1):
        global s
        assert s.count(old) == n, (path, s.count(old), old[:90])
        s = s.replace(old, new)

    # the figure: the shirt runs on down when tall
    swap("function figure(p) {", "function figure(p, tall) { /* version 170: tall runs the shirt on below the old bottom edge */")
    swap('<path d="M108 248 C110 209 128 191 160 191 C192 191 210 209 212 248 Z" fill="${p.shirt}"/>',
         '<path d="${tall ? "M108 380 V248" : "M108 248"} C110 209 128 191 160 191 C192 191 210 209 212 248${tall ? " V380" : ""} Z" fill="${p.shirt}"/>')
    # homeScene (named homes)
    swap("const fig = figure(LOOKS[personaKey]);", "const fig = figure(LOOKS[personaKey], o.tall);")
    swap('const D = "M106 244 V62 H214 V244 Z";', "const B = o.tall ? 380 : 244, D = `M106 ${B} V62 H214 V${B} Z`; /* version 170 */")
    swap("[24, 48, 72, 96, 120, 144, 168, 192, 216].map(", "[24, 48, 72, 96, 120, 144, 168, 192, 216, ...(o.tall ? [240, 264, 288, 312, 336, 360] : [])].map(")
    swap("for (let r = 0; r < 15; r += 1)", "for (let r = 0; r < (o.tall ? 24 : 15); r += 1)")
    swap('<rect y="196" width="320" height="44" fill="${h.floor}"/>', '<rect y="196" width="320" height="${o.tall ? 184 : 44}" fill="${h.floor}"/>')
    swap('<rect width="320" height="240" fill="${h.wall}"/>', '<rect width="320" height="${o.tall ? 380 : 240}" fill="${h.wall}"/>')
    swap('<path d="M102 244 V58 H218 V244" fill="none"', '<path d="M102 ${B} V58 H218 V${B}" fill="none"')
    swap('    <rect x="${apt ? 96 : 86}" y="${apt ? 232 : 234}" width="${apt ? 128 : 148}" height="${apt ? 8 : 6}" rx="2" fill="${apt ? "#8C6B52" : "#B9AE9C"}"/>\n',
         '    ${o.tall ? "" : `<rect x="${apt ? 96 : 86}" y="${apt ? 232 : 234}" width="${apt ? 128 : 148}" height="${apt ? 8 : 6}" rx="2" fill="${apt ? "#8C6B52" : "#B9AE9C"}"/>`}\n')
    # scene (the plain arched door)
    swap('const fig = personaKey ? figure(LOOKS[personaKey]) : "";', 'const fig = personaKey ? figure(LOOKS[personaKey], o.tall && kind !== "store") : "";')
    swap("  const siding = [22, 44, 66, 88, 110, 132, 154, 176, 198, 220].map(",
         "  const B = o.tall ? 380 : 244; /* version 170 */\n  const siding = [22, 44, 66, 88, 110, 132, 154, 176, 198, 220, ...(o.tall ? [242, 264, 286, 308, 330, 352, 374] : [])].map(")
    swap("M104 244 V104 A56 56 0 0 1 216 104 V244 Z", "M104 ${B} V104 A56 56 0 0 1 216 104 V${B} Z", 3)
    swap('<rect width="320" height="240" fill="#F0E8DC"/>', '<rect width="320" height="${B === 244 ? 240 : B}" fill="#F0E8DC"/>')
    swap("M100 244 V104 A60 60 0 0 1 220 104 V244", "M100 ${B} V104 A60 60 0 0 1 220 104 V${B}")
    swap('<rect x="86" y="234" width="148" height="6" fill="#D9CEBC"/>', '${o.tall ? "" : `<rect x="86" y="234" width="148" height="6" fill="#D9CEBC"/>`}')
    swap(SUB + OLD_VB, SUB + NEW_VB, 2)  # the two conversation screens, not the Knock screen
    # the picture fills the call exactly, so the viewBox above decides the framing (the older stage rule zoomed it to 120%)
    swap("  .frame.convo-stage:has(> .talk-live) > .thread .bub,",
         "  .app.ft .content.stage .frame.convo-stage > svg.voter { left: 0; top: 0; width: 100%; height: 100%; margin: 0; transform: none; } /* version 170: the face in the top third, the captions over the chest */\n  .frame.convo-stage:has(> .talk-live) > .thread .bub,")
    # the conversation screens draw the tall door and frame it from the top of the doorway
    swap("scene(d.scene, d.persona, { main: true, shut: true, label: `${d.name}, ${d.sub}` }).replace(/<svg",
         "scene(d.scene, d.persona, { main: true, shut: true, tall: true, label: `${d.name}, ${d.sub}` }).replace(/<svg")
    swap('scene(d.scene, d.persona, { main: true, sign: d.sign, shut: d.scene === "door", away: d.scene === "store", label: `${d.name}, ${d.sub}` }).replace(/<svg',
         'scene(d.scene, d.persona, { main: true, sign: d.sign, shut: d.scene === "door", away: d.scene === "store", tall: true, label: `${d.name}, ${d.sub}` }).replace(/<svg')

    open(path, "w", encoding="utf-8").write(s)
    print("patched", path)
