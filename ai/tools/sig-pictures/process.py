# process.py: turn the picked paintings into the course's picture files, wdpfxqlsvp/sig/img/, and its manifest.
# Portraits are trimmed so the face sits near the top third; each person also gets a small square (av) and a wide close-up
# strip (close). Variants (warm, turned, sheet) get the same crops as their base. Faces are stored as fractions [x0,y0,x1,y1].
import json, os
from PIL import Image
L = "/home/claude/work/lab/"; OUT = "/home/claude/m-r4x8t2/wdpfxqlsvp/sig/img/"
faces = json.load(open(L + "final/faces-final.json"))
var = {"warm": [], "turned": [], "sheet": []}
for f in os.listdir(L + "var"):
    if f.endswith(".jpg"):
        n = f[:-4]
        for k in var:
            if n.endswith("-" + k): var[k].append(n[: -len(k) - 1])
man = {}
def save(im, name, w):
    im = im.convert("RGB")
    if im.width != w: im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(OUT + name + ".webp", "WEBP", quality=80, method=6); return im.size
def src(name, kind=None): return Image.open(L + ("var/%s-%s.jpg" % (name, kind) if kind else "final/%s.jpg" % name))
people = [k for k in faces if not k.startswith("two-")]
for who in sorted(people):
    base = src(who); W, H = base.size; fx0, fy0, fx1, fy1 = faces[who][0]
    cy = (fy0 + fy1) / 2
    top = max(0, round((cy - 0.27) * H)) if cy > 0.27 else 0           # trim headroom so the face center sits near 27%
    box = (0, top, W, H)
    kinds = [None] + [k for k in var if who in var[k]]
    entry = {"v": [k for k in kinds if k]}
    for k in kinds:
        im = src(who, k).crop(box); sfx = "-" + k if k else ""
        w, h = save(im, who + sfx, 720)
        if not k: entry.update({"w": w, "h": h, "face": [round(fx0, 4), round((fy0 * H - top) / (H - top), 4), round(fx1, 4), round((fy1 * H - top) / (H - top), 4)]})
        # the wide close-up strip: about 3.4 face widths wide and 2.2 times as wide as tall, the face a little above center
        fw = (fx1 - fx0) * W; cx = (fx0 + fx1) / 2 * W; fcy = (fy0 + fy1) / 2 * H
        sw = min(W, fw * 3.4); sh = sw / 2.2; x0 = min(max(0, cx - sw / 2), W - sw); y0 = min(max(0, fcy - sh * 0.42), H - sh)
        save(src(who, k).crop((round(x0), round(y0), round(x0 + sw), round(y0 + sh))), who + sfx + "-close", 640)
        if not k:  # the small square: the head and a little of the shoulders
            s = fw * 2.1; ax = min(max(0, cx - s / 2), W - s); ay = min(max(0, fcy - s * 0.44), H - s)
            save(src(who).crop((round(ax), round(ay), round(ax + s), round(ay + s))), who + "-av", 200)
    man[who] = entry
for k in sorted(faces):
    if not k.startswith("two-"): continue
    w, h = save(src(k), k, 896); kinds = [x for x in var if k in var[x]]
    for x in kinds: save(src(k, x), k + "-" + x, 896)
    man[k] = {"w": w, "h": h, "faces": faces[k], "v": kinds}
for k in ("spot-sit", "spot-stand", "spot-doorway", "spot-side"):
    w, h = save(src(k), k, 960); man[k] = {"w": w, "h": h}
w, h = save(src("store"), "store", 896); man["store"] = {"w": w, "h": h}
json.dump(man, open(OUT + "manifest.json", "w"), separators=(",", ":"))
tot = sum(os.path.getsize(OUT + f) for f in os.listdir(OUT))
print(len(os.listdir(OUT)), "files,", round(tot / 1e6, 2), "MB")
