"""Version 171 (Nov 16, 2026), from Robert's 10:02 PM PT run: "This body looks weird... a really, really long trunk. It should be
like a normal-looking body."

Every voter gets a real upper body: square shoulders that reach the doorframe (a person fills a doorway), arms hanging at the
sides (a soft line down each side) and a collar, in place of one long rounded dome. The same drawing serves every screen; on
the door conversation (version 170's tall door) it simply runs on below. Applied to all four app pages (live, staging, dev, p1).

To undo: git revert the Version 171 commit. Usage: python3 v171-voter-body.py page.html ... (edits in place)
"""
import sys

OLD = '<path d="${tall ? "M108 380 V248" : "M108 248"} C110 209 128 191 160 191 C192 191 210 209 212 248${tall ? " V380" : ""} Z" fill="${p.shirt}"/>'
NEW = ('<path d="M102 ${tall ? 380 : 248} V218 C102 201 110 193 124 190 L148 185.5 Q160 191 172 185.5 L196 190 C210 193 218 201 218 218 V${tall ? 380 : 248} Z" fill="${p.shirt}"/>'
       '<path d="M122 214 C119 250 119 300 121 ${tall ? 380 : 248} M198 214 C201 250 201 300 199 ${tall ? 380 : 248}" fill="none" stroke="#000" stroke-opacity="0.14" stroke-width="2.5" stroke-linecap="round"/>'
       ' <!-- version 171 (Robert): square shoulders to the doorframe, arms at the sides, a collar -->')

# a crew neckline over the bottom of the neck, so the neck goes into the shirt (not with a v-neck or headphones, which have their own)
NECK = '<rect x="151" y="164" width="18" height="32" rx="7" fill="${p.shade}"/>'
NECK2 = NECK + '${p.vneck || p.phones ? "" : `<path d="M138 188 Q160 197 182 188 L186 202 H134 Z" fill="${p.shirt}"/><path d="M143 188.5 Q160 197.5 177 188.5" fill="none" stroke="#000" stroke-opacity="0.13" stroke-width="2" stroke-linecap="round"/>`}'

for path in sys.argv[1:]:
    s = open(path, encoding="utf-8").read()
    assert s.count(OLD) == 1, (path, s.count(OLD))
    s = s.replace(OLD, NEW)
    assert s.count(NECK) == 1, (path, s.count(NECK))
    s = s.replace(NECK, NECK2)
    open(path, "w", encoding="utf-8").write(s)
    print("patched", path)
