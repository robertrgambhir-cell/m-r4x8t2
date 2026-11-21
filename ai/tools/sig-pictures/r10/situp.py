# situp.py: the where-to-stand pair differs in one thing only (rule 67, Robert, Nov 21, 2026, 12:56 PM: "you're seated and paying
# attention, or you're standing and paying attention," and "We still want the chair there"). Run in a folder holding gen.py's output
# for jobs-sit.json (out/sit-up-3.jpg, an edit of the seated canvasser's crop: phone away, sitting up, watching the passersby).
# 1. spot-sit: the old upper body goes (the storefront behind her, from spot-stand), the new one is cut out (rembg) and laid in at the
#    crop's place; below the table's back edge only her hands stay. Her legs, the stool and the table are the old picture's.
# 2. spot-stand: the same stool behind the table, its two legs and rung copied from spot-sit, its third leg (hidden there by her legs)
#    the right leg mirrored.
# 3. both, and the door pair: "LIBRARIES FOR ALL" on the cloth (clothsign.py).
import numpy as np
from PIL import Image
from rembg import remove, new_session
IMG = "/home/claude/m-r4x8t2/wdpfxqlsvp/sig/img/"
A0 = np.asarray(Image.open(IMG + "spot-sit.webp").convert("RGB")).copy()   # the Nov 20 pictures (before this script's first run)
B0 = np.asarray(Image.open(IMG + "spot-stand.webp").convert("RGB")).copy()
A = A0.copy(); A[388:526, 192:350] = B0[388:526, 192:350]
im = Image.open("out/sit-up-3.jpg").convert("RGB"); cut = np.asarray(remove(im, session=new_session("isnet-general-use"))).astype(np.float32)
src = np.asarray(im).astype(np.int32); r, g, b = src[..., 0], src[..., 1], src[..., 2]
skin = (r > g + 12) & (r < 200) & (b < g + 20) & (r > 60)
cut[..., 3] *= ~((np.arange(src.shape[0])[:, None] >= 578) & ~skin)
fig = Image.fromarray(cut.clip(0, 255).astype(np.uint8), "RGBA").resize((200, 160), Image.LANCZOS)
outA = Image.fromarray(A).convert("RGBA"); outA.alpha_composite(fig, (180, 380)); outA.convert("RGB").save("spot-sit-new.png")
B = B0.copy(); B[588:645, 265:316] = A0[588:645, 265:316]
leg = A0[588:645, 299:312][:, ::-1].copy(); dark = leg.astype(int).sum(-1) < 300; leg[dark] = B0[588:645, 241:254][dark]
B[588:645, 241:254] = leg; B[594:606, 252:268] = A0[594:606, 282:298]
Image.fromarray(B).save("spot-stand-new.png")
# then: python3 clothsign.py spot-sit-new.png spot-sit-signed.png 530 585 (and spot-stand; the door pair with 525 560), saved as webp 84
# 4. After the outside review (Nov 21): only one difference, as Robert asked ("you're seated and paying attention, or you're standing
#    and paying attention"). spot-stand is now the same picture with her standing behind the table instead: jobs-stand.json edits a
#    crop of the new spot-sit (out/stand-up-1.jpg); its upper body is cut out the same way and laid on the empty storefront (plate:
#    spot-sit before this script, with the old upper body replaced from spot-stand before this script). The table, the stool and her
#    legs under the cloth are the seated picture's, so sitting or standing is all that changes. Then clothsign.py.
