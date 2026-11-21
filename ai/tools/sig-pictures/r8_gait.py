# r8_gait.py: the walkers' second step (Robert, Nov 21, 2026, 12:11 PM: the passerby "is just kind of sliding down the street ... as if
# he were frozen on a moving walkway"; he wants "at least some gait of their feet walking"). Each walker's picture (w-<who>.webp) is
# drawn mid-stride, one foot forward. Its legs, reflected about their own center line, are the other step: the other foot forward. The
# page shows the two steps in turn while the walker moves (engine2's sceneWalk and walkAt), so the feet step instead of sliding.
# The legs start below the hands (or below the apron or the cart's basket; for the stroller, inside its seat, so they come out from under it). The center line runs from the middle of
# the hips there to the middle of the lower legs, so the feet keep their place across the sidewalk; for the cart and the stroller it is
# their own middle (the frame at the top, the wheels at the bottom), so they stay as they are and only the legs change. The first rows blend from the picture into the reflection, so
# no seam shows. Writes w-<who>-b.webp (the whole picture with the second step's legs; above the legs it is the first picture, so
# nothing blinks where the page lays the first picture's top over it) and adds them to img/manifest.json. The stroller is left out
# for now: its frame's braces would flip with each step (outside review, Nov 21), and no lesson uses her yet; reflect only her legs first.
# Run after r8_build.py (which rewrites the manifest): python3 ai/tools/sig-pictures/r8_gait.py wdpfxqlsvp/sig/img
import json, os, sys
import numpy as np
from PIL import Image
OUT = sys.argv[1] if len(sys.argv) > 1 else "wdpfxqlsvp/sig/img"
# where the legs start, as a share of the picture's height (measured on each picture: the first row below the hands)
SPLIT = {"ben": 0.63, "soojin": 0.61, "kayla": 0.59, "luis": 0.75, "marisol": 0.61, "hank": 0.61, "dwayne": 0.61,
         "tanya-cart": 0.775}
WHEELS = {"tanya-cart"}  # pushing something with wheels: reflect about its middle
BLEND = 0.035  # rows that blend from the picture into the reflection, as a share of the height
SHARP = {}  # a walker whose switch needs a shorter blend (the stroller had one, inside its seat)

def span(a, y):
    xs = np.nonzero(a[y])[0]
    return (xs.min(), xs.max()) if len(xs) else None

def make(who, man):
    src = Image.open(os.path.join(OUT, "w-" + who + ".webp")).convert("RGBA")
    px = np.asarray(src).astype(np.float32) / 255.0
    H, W = px.shape[:2]; alpha = px[..., 3] > 0.5
    ys = int(round(SPLIT[who] * H)); yb = int(0.88 * H); F = max(3, int(SHARP.get(who, BLEND) * H))
    if who in WHEELS:
        rows = [r for r in (span(alpha, y) for y in range(int(0.85 * H), int(0.97 * H))) if r]
        widest = max(r - l for l, r in rows)
        c_bot = float(np.mean([(l + r) / 2 for l, r in rows if r - l >= 0.9 * widest]))  # the rows across the wheels
        l, r = span(alpha, ys); c_top = (l + r) / 2.0  # the frame where the legs start, so its posts line up
    else:
        l, r = span(alpha, ys); c_top = (l + r) / 2.0
        mids = [sum(s) / 2.0 for s in (span(alpha, y) for y in range(int(0.80 * H), int(0.90 * H))) if s]
        c_bot = float(np.mean(mids))
    pm = px.copy(); pm[..., :3] *= pm[..., 3:4]  # premultiplied, so edges blend cleanly
    out = pm.copy()  # above the legs: the first picture itself
    xs = np.arange(W, dtype=np.float32)
    for y in range(ys, H):
        c = c_top + (c_bot - c_top) * min(1.0, max(0.0, (y - ys) / float(max(1, yb - ys))))
        sx = 2.0 * c - xs; x0 = np.floor(sx).astype(int); f = (sx - x0)[:, None]
        ok0 = (x0 >= 0) & (x0 < W); ok1 = (x0 + 1 >= 0) & (x0 + 1 < W)
        a0 = np.where(ok0[:, None], pm[y, np.clip(x0, 0, W - 1)], 0); a1 = np.where(ok1[:, None], pm[y, np.clip(x0 + 1, 0, W - 1)], 0)
        refl = a0 * (1 - f) + a1 * f
        t = min(1.0, (y - ys) / float(F)); t = t * t * (3 - 2 * t)
        out[y] = pm[y] * (1 - t) + refl * t
    a = out[..., 3:4]; rgb = np.where(a > 1e-4, out[..., :3] / np.maximum(a, 1e-4), 0)
    img = Image.fromarray((np.concatenate([rgb, a], axis=2) * 255 + 0.5).clip(0, 255).astype(np.uint8), "RGBA")
    img.save(os.path.join(OUT, "w-" + who + "-b.webp"), "WEBP", quality=86, method=6)
    man["w-" + who + "-b"] = {"w": W, "h": H, "split": round(ys / H, 4)}
    print(who, "legs from", ys, "of", H, "center", round(c_top, 1), "to", round(c_bot, 1))

man = json.load(open(os.path.join(OUT, "manifest.json")))
for who in SPLIT: make(who, man)
json.dump(man, open(os.path.join(OUT, "manifest.json"), "w"), indent=0)
