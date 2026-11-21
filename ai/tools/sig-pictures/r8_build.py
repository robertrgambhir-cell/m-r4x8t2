# r8_build.py: the signature course's pictures for curriculum version 8 (Robert's notes on lesson 2, Nov 20, 3:51 PM), added to
# what q_build.py lays out in wdpfxqlsvp/sig/img/. Run it after q_build.py:   python3 r8_build.py <lab dir> <img dir>
#  - Cutouts with nothing but the person: the first cutouts kept a wedge of the store's orange crates between some people's
#    shoulder and neck ("these oranges are attached to him"). Each portrait was repainted on plain green, and whatever the old
#    cutout kept that the repaint shows as background was trimmed (r8/greenmask.py in the lab). Their close-ups are redrawn too.
#  - A passerby walks toward you down the sidewalk ("the vantage point of looking down a sidewalk where they are walking towards
#    you"): walkway.webp is the sidewalk from the canvasser's spot, and w-<who>.webp each walker, full length, facing you.
#  - The view from above first ("a view 30 feet from the sky, where you could see where the canvasser is stationed and see the
#    person walking"): aerial-<who>.webp, the canvasser seen from above and behind, the passerby down the sidewalk.
#  - Where to stand: two pairs of one drawing each, where only the canvasser moves (r8/spots.py in the lab).
import json, os, sys
import numpy as np
from PIL import Image
LAB, OUT = sys.argv[1], sys.argv[2]
Q5 = os.path.join(LAB, "q5"); R8 = os.path.join(LAB, "r8")
M = json.load(open(os.path.join(OUT, "manifest.json")))
H = json.load(open(os.path.join(Q5, "heads.json"))); VARS = json.load(open(os.path.join(Q5, "variants.json")))
def webp(im, name, q=84): im.save(os.path.join(OUT, name + ".webp"), "WEBP", quality=q, method=6)
CLEAN = ["ben", "bob", "bob-pen", "dwayne", "hank", "hank-paper", "hank-pen", "soojin", "tanya", "tanya-tug", "tanya-cart", "marisol", "theo", "luis"]
def defringe(im):
    """the cutout's edge still carried the crates' orange: a line up to about 8 pixels thick along the hair and shoulders, where the
    old wedge was cut away. Crate orange within 8 pixels of the edge goes when the person isn't orange 8 to 16 pixels in (so
    Tanya's orange top keeps its edge), then the edge comes in by one pixel and softens a little."""
    from PIL import ImageFilter
    a = np.array(im).astype(np.float32); A = a[..., 3]
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    crate = (r > 215) & (g > 70) & (g < 175) & (b < 50) & (r - b > 170)
    opaque = A > 128; clear = Image.fromarray((~opaque).astype(np.uint8) * 255)
    near8 = np.array(clear.filter(ImageFilter.MaxFilter(17))) > 0; near16 = np.array(clear.filter(ImageFilter.MaxFilter(33))) > 0
    ring = opaque & near8; deep = opaque & near16 & ~near8
    dc = np.array(Image.fromarray((deep & crate).astype(np.uint8) * 255).filter(ImageFilter.BoxBlur(10))).astype(np.float32)
    dd = np.array(Image.fromarray(deep.astype(np.uint8) * 255).filter(ImageFilter.BoxBlur(10))).astype(np.float32)
    A[ring & crate & (dc / np.maximum(1, dd) < 0.2)] = 0
    from scipy import ndimage  # specks cut loose from the person (a bit of crate by Luis's hair) go too
    lab, n = ndimage.label(A > 20)
    if n > 1:
        sizes = ndimage.sum(np.ones_like(A), lab, range(1, n + 1)); keep = np.zeros(n + 1, bool); keep[1:] = sizes >= sizes.max() * 0.01
        A[~keep[lab]] = 0
    alpha = Image.fromarray(A.astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.6))
    out = im.copy(); out.putalpha(alpha); return out
def cut(k):
    im = defringe(Image.open(os.path.join(R8, "cut-clean", k + ".png")).convert("RGBA")); v = VARS.get(k)
    if v and (v["dx"] or v["dy"]): im = im.transform(im.size, Image.AFFINE, (1, 0, v["dx"], 0, 1, v["dy"]), resample=Image.BICUBIC)
    return im
store = Image.open(os.path.join(OUT, "store.webp")).convert("RGB")
for k in CLEAN:
    c = cut(k); webp(c, "p-" + k, 86)
    who = k.split("-")[0]
    if k != who and not (who == "tanya" and k == "tanya"): continue
    im = store.convert("RGBA").copy(); im.alpha_composite(c)
    f = H[k]["face"] if k in H else [207, 200, 561, 565]
    cx, cy, s = (f[0] + f[2]) / 2, (f[1] + f[3]) / 2, (f[2] - f[0]) * .78
    webp(im.crop((int(cx - s), int(cy - s * 1.0), int(cx + s), int(cy + s * 1.5))).convert("RGB").resize((360, 450)), who + "-close", 84)
    s2 = (f[2] - f[0]) * .62; webp(im.crop((int(cx - s2), int(cy - s2 * 1.18), int(cx + s2), int(cy + s2 * 1.06))).convert("RGB").resize((160, 160)), who + "-av", 84)
# everyone else's cutout from the first build, with the same edge cleaned (the outside review found crate orange along Ines's, Joan's,
# Karim's and Pat's outlines too). Read from q_build's own sources, so running this again never thins an edge twice.
CUTQ = os.path.join(Q5, "cut-fix")
OTHER = [k for k in ["anika", "anika-bags", "ines", "ines-stroller", "joan-apron", "karim-keys", "kayla", "kayla-out", "pat", "lena-turn", "lena-turn-sheet", "rico-turn", "rico-turn-sheet", "carmen"] if os.path.exists(os.path.join(CUTQ, k + ".png"))]
def cutq(k):
    im = defringe(Image.open(os.path.join(CUTQ, k + ".png")).convert("RGBA")); v = VARS.get(k)
    if v and (v["dx"] or v["dy"]): im = im.transform(im.size, Image.AFFINE, (1, 0, v["dx"], 0, 1, v["dy"]), resample=Image.BICUBIC)
    return im
for k in OTHER: webp(cutq(k), "p-" + k, 86)
for who in ["kayla", "anika", "pat", "ines", "joan", "karim", "lena", "rico", "carmen"]:
    k = {"joan": "joan-apron", "karim": "karim-keys"}.get(who, who)
    if k not in OTHER: continue
    im = store.convert("RGBA").copy(); im.alpha_composite(cutq(k))
    hk = {"kayla-out": "kayla", "anika-bags": "anika", "joan-apron": "joan", "karim-keys": "karim"}.get(k, k)
    f = H[hk]["face"] if hk in H else [207, 200, 561, 565]
    cx, cy, sz = (f[0] + f[2]) / 2, (f[1] + f[3]) / 2, (f[2] - f[0]) * .78
    webp(im.crop((int(cx - sz), int(cy - sz * 1.0), int(cx + sz), int(cy + sz * 1.5))).convert("RGB").resize((360, 450)), who + "-close", 84)
    s2 = (f[2] - f[0]) * .62; webp(im.crop((int(cx - s2), int(cy - s2 * 1.18), int(cx + s2), int(cy + s2 * 1.06))).convert("RGB").resize((160, 160)), who + "-av", 84)
# the sidewalk, from the canvasser's spot: where it meets the sky (the far end of the walk) and where a walker's feet land up close
ww = Image.open(os.path.join(R8, "out", "walkway-1.jpg")).convert("RGB"); webp(ww, "walkway", 82)
M["walkway"] = {"w": ww.width, "h": ww.height, "far": [0.47, 0.455], "near": [0.25, 1.0]}
WALK = ["ben", "soojin", "kayla", "luis", "tanya-cart", "dwayne", "hank", "marisol", "ines-stroller"]
# the views from above (version 8, after the outside review): the canvasser stands out on the sidewalk facing the person walking up,
# never at the table with their back to them (rule 37c and where-to-stand, rule 67), and is the canvasser of that scene: a canvasser
# in a purple cap for the learner's own tries, Lena (a woman with a ponytail) in Hear it done and lesson 1's whole stop, and Rico in
# Catch the mistake. Prompts: r8/jobs-aerial9.json and r8/jobs-aerial10.json.
AER = {"ben": "aerial10-ben-313", "soojin": "aerial10-soojin-313", "kayla": "aerial10-kayla-313", "luis": "aerial10-luis-313", "tanya-cart": "aerial10-tanya-cart-311",
       "dwayne": "aerial9-dwayne-301", "hank": "aerial9-hank-301", "marisol": "aerial9-marisol-301", "ines-stroller": "aerial9-ines-stroller-301"}
for k in WALK:
    w = Image.open(os.path.join(R8, "walk-" + k + ".png")).convert("RGBA")
    if w.height > 900: w = w.resize((int(w.width * 900 / w.height), 900), Image.LANCZOS)
    webp(w, "w-" + k, 86); M["w-" + k] = {"w": w.width, "h": w.height}
    a = Image.open(os.path.join(R8, "out", AER[k] + ".jpg")).convert("RGB"); webp(a, "aerial-" + k, 80)
    px = np.asarray(a).astype(np.float32) / 255; pur = (px[..., 2] > px[..., 1] + .12) & (px[..., 0] > px[..., 1] + .08)
    # the zoom goes to the canvasser: of the purple shapes (the shirt and cap, the table), the one standing tallest for its width
    from scipy import ndimage
    lab, n = ndimage.label(ndimage.binary_closing(pur, iterations=3)); best, bs = None, -1
    for i in range(1, n + 1):
        ys, xs = np.nonzero(lab == i)
        if len(ys) < 400: continue
        score = (ys.max() - ys.min() + 1) / (xs.max() - xs.min() + 1)
        if score > bs: bs, best = score, (xs, ys)
    xs, ys = best if best else np.nonzero(pur)[::-1]
    M["aerial-" + k] = {"w": a.width, "h": a.height, "at": [round(float(xs.mean()) / a.width, 3), round(float(ys.mean()) / a.height, 3)]}
for n in ["spot-sit", "spot-stand", "spot-doorway", "spot-side"]:
    im = Image.open(os.path.join(R8, n + ".jpg")).convert("RGB"); webp(im, n, 84); M[n] = {"w": im.width, "h": im.height}
json.dump(M, open(os.path.join(OUT, "manifest.json"), "w"), indent=0)
print(len(CLEAN), "cutouts cleaned,", len(OTHER), "more edges cleaned,", len(WALK), "walkers and views from above, 4 places to stand")
