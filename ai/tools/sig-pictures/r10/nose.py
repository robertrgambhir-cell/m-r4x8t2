# nose.py: a nose for a face drawn without one (rule 67a, Robert, Nov 21, 2026, 12:56 PM, on Soo-jin: "I don't know why she doesn't
# have a nose"). A thin, warm line down the side of the nose and a small hook at its tip, as the cast's other faces have it, in a
# darker shade of the face's own skin. Drawn at 4x and laid on the person's layer, over skin only. Then the close-up and the round
# face are cut again from the storefront and the new layer, the same way q_build.py cuts them.
import sys, json, numpy as np
from PIL import Image, ImageDraw
IMG = "/home/claude/m-r4x8t2/wdpfxqlsvp/sig/img/"
M = json.load(open(IMG + "manifest.json"))
def bez(p0, p1, p2, p3, n=40):
    t = np.linspace(0, 1, n)[:, None]; P = [np.array(p, float) for p in (p0, p1, p2, p3)]
    return ((1-t)**3*P[0] + 3*(1-t)**2*t*P[1] + 3*(1-t)*t**2*P[2] + t**3*P[3]).tolist()
def nose(who, pts_fn, width=3.3, tone=(0.80, 0.64, 0.58), out_dir=IMG):
    m = M[who]; part = m["parts"][0]; src = part["src"]
    im = Image.open(IMG + src + ".webp").convert("RGBA"); W, H = im.size
    bl = [v * (W if i % 2 == 0 else H) for i, v in enumerate(part["bl"])]; mo = [v * (W if i % 2 == 0 else H) for i, v in enumerate(part["mo"])]
    path = pts_fn(bl, mo)
    arr = np.asarray(im).astype(np.float32)
    cx, cy = int(path[len(path)//2][0]), int(path[len(path)//2][1])
    skin = np.median(arr[cy-6:cy+6, cx+14:cx+26, :3].reshape(-1, 3), axis=0)
    col = tuple(int(c * k) for c, k in zip(skin, tone))
    S = 4; layer = Image.new("L", (W * S, H * S), 0); d = ImageDraw.Draw(layer)
    d.line([(x * S, y * S) for x, y in path], fill=255, width=int(width * S), joint="curve")
    r = width * S / 2
    for x, y in (path[0], path[-1]): d.ellipse((x * S - r, y * S - r, x * S + r, y * S + r), fill=255)
    a = np.asarray(layer.resize((W, H), Image.LANCZOS)).astype(np.float32) / 255
    a *= (arr[..., 3] > 200)  # on the person only
    for c in range(3): arr[..., c] = arr[..., c] * (1 - a) + col[c] * a
    Image.fromarray(arr.clip(0, 255).astype(np.uint8), "RGBA").save(out_dir + src + ".webp", quality=90, method=6)
    # the close-up and the round face, cut as q_build.py cuts them
    store = Image.open(IMG + m.get("bg", "store") + ".webp").convert("RGBA")
    comp = store.copy(); comp.alpha_composite(Image.open(out_dir + src + ".webp").convert("RGBA"))
    f = [v * (W if i % 2 == 0 else H) for i, v in enumerate(m["face"])]
    fx, fy, s = (f[0] + f[2]) / 2, (f[1] + f[3]) / 2, (f[2] - f[0]) * .78
    comp.crop((int(fx - s), int(fy - s * 1.0), int(fx + s), int(fy + s * 1.5))).convert("RGB").resize((360, 450)).save(out_dir + who + "-close.webp", quality=84)
    s2 = (f[2] - f[0]) * .62
    comp.crop((int(fx - s2), int(fy - s2 * 1.18), int(fx + s2), int(fy + s2 * 1.06))).convert("RGB").resize((160, 160)).save(out_dir + who + "-av.webp", quality=84)
    print(who, "nose", [tuple(round(v) for v in p) for p in (path[0], path[-1])], "tone", col)
# where each nose goes, from the eyes' box (bl) and the mouth's box (mo): down from between the eyes, slightly to one side, to a
# small hook just above the mouth, as Anika's and Pat's are drawn
def side_hook(bl, mo):
    ex = (bl[0] + bl[2]) / 2; top = bl[1] + (bl[3] - bl[1]) * 0.55; mtop = mo[1] + (mo[3] - mo[1]) * 0.18
    x0, y0 = ex + 10, top; x1, y1 = ex - 6, mtop - 4
    line = bez((x0, y0), (x0 - 2, y0 + (y1 - y0) * 0.45), (x1 - 4, y1 - (y1 - y0) * 0.25), (x1, y1))
    hook = bez((x1, y1), (x1 + 2, y1 + 7), (x1 + 13, y1 + 8), (x1 + 19, y1 + 2), 16)
    return line + hook[1:]
if __name__ == "__main__":
    for who in sys.argv[1].split(","): nose(who, side_hook)
