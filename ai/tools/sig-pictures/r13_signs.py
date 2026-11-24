# r13_signs.py: the drive's new name in the pictures (version 13, Robert's go, Nov 23, 2026: the course's measure is Prop 3, and the
# drive's name is "Schools and Health Care"). Every picture that carried "LIBRARIES FOR ALL" gets "SCHOOLS & HEALTH CARE" the way
# version 10 first painted it (rule 67: words printed in a picture are real and readable):
#   - on the cloth's front, in white, in the four where-to-stand pictures (version 10's r10/clothsign.py): the old letters are lifted
#     first, inpainted from the cloth around them, then the new name is laid on the cloth's front in Figtree, heavy;
#   - on the table's card, in the drive's purple, in the four views from above that have one (version 10's r10/signs.py): the card
#     is repainted whole, laid into its own slant.
# Run from the repo root: python3 -I ai/tools/sig-pictures/r13_signs.py [path to Figtree.ttf] [only these, comma-separated]
import os, sys, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".."))
IMG = os.path.join(ROOT, "wdpfxqlsvp", "sig", "img")
FONT = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("FIGTREE", "/root/sig-fonts/Figtree.ttf")
LINES = ["SCHOOLS &", "HEALTH CARE"]
CARD_LINES = ["SCHOOLS &", "HEALTH", "CARE"]  # the card is small and nearly square: three short lines read bigger than two long ones
PURPLE = (90, 62, 153)
CLOTH = ["spot-sit", "spot-stand", "spot-doorway", "spot-side"]
CARDS = ["aerial-ben", "aerial-soojin", "aerial-kayla", "aerial-luis"]

def font(px, weight):
    f = ImageFont.truetype(FONT, max(6, int(px)))
    try: f.set_variation_by_axes([weight])
    except Exception: pass
    return f
def is_purple(rgb): r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]; return (b > g + 25) & (r > g + 15)

def cloth(name):
    path = os.path.join(IMG, name + ".webp"); im = Image.open(path).convert("RGB"); a = np.asarray(im).copy(); rgb = a.astype(int)
    pur = is_purple(rgb)
    # the old letters: light pixels in holes of the purple cloth (a closing fills the letters; what it filled that's light is ink)
    closed = cv2.morphologyEx(pur.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((17, 17), np.uint8)).astype(bool)
    light = (rgb.min(axis=2) > 150) & (rgb.max(axis=2) - rgb.min(axis=2) < 70)
    ink = closed & ~pur & light
    n, lab, st, _ = cv2.connectedComponentsWithStats(ink.astype(np.uint8), 8)
    keep = np.zeros_like(ink)
    for k in range(1, n):
        if st[k, cv2.CC_STAT_AREA] >= 3: keep |= lab == k
    ys, xs = np.nonzero(keep)
    if not len(ys): print(name, "no letters found"); return False
    y_lo, y_hi = int(ys.min()), int(ys.max())
    mask = cv2.dilate(keep.astype(np.uint8), np.ones((3, 3), np.uint8)) * 255
    a = cv2.inpaint(a, mask, 4, cv2.INPAINT_TELEA)
    rgb = a.astype(int); pur = is_purple(rgb)
    # the cloth's front, found as version 10 found it: the purple columns in the letters' band, then its purple rows
    band = pur[y_lo:y_hi + 1]; cols = np.nonzero(band.mean(0) > 0.6)[0]
    rows = np.nonzero(pur[:, cols.min():cols.max()].mean(1) > 0.7)[0]; rows = rows[(rows >= y_lo - 30) & (rows <= y_hi + 30)]
    x0, x1, y0, y1 = int(cols.min()), int(cols.max()), int(rows.min()), int(rows.max())
    top = y0 + int((y1 - y0) * 0.22); bot = y1 - int((y1 - y0) * 0.12); W, H = x1 - x0, bot - top
    S = 6; lay = Image.new("L", (W * S, H * S), 0); d = ImageDraw.Draw(lay); size = H * S * 0.42
    while True:
        f = font(size, 860); ws = [d.textlength(t, font=f) for t in LINES]
        if max(ws) <= W * S * 0.70 or size < 8: break
        size *= 0.95
    asc, desc = f.getmetrics(); lh = asc * 1.02; yy = (H * S - lh * 2) / 2 - desc * 0.15
    for i, t in enumerate(LINES): d.text(((W * S - ws[i]) / 2, yy + i * lh), t, font=f, fill=255)
    m = np.asarray(lay.resize((W, H), Image.LANCZOS)).astype(np.float32) / 255
    m *= pur[top:bot, x0:x1]
    out = a.astype(np.float32); inkc = np.array([252, 249, 244], np.float32)
    for c in range(3): out[top:bot, x0:x1, c] = out[top:bot, x0:x1, c] * (1 - m) + inkc[c] * m
    Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(path, quality=90, method=6)
    print(name, "letters", (int(xs.min()), y_lo, int(xs.max()), y_hi), "cloth", (x0, top, x1, bot), "font", int(size / S))
    return True

def text_card(w, h, paper):
    S = 8; W, H = int(w * S), int(h * S)
    im = Image.new("RGB", (W, H), paper); d = ImageDraw.Draw(im)
    d.rectangle((0, 0, W - 1, H - 1), outline=(196, 190, 204), width=max(2, int(S * 0.9)))
    L = CARD_LINES; size = H * 0.36
    while True:
        f = font(size, 850); ws = [d.textlength(t, font=f) for t in L]; asc, desc = f.getmetrics(); lh = (asc + desc) * 0.92
        if (max(ws) <= W * 0.86 and lh * len(L) <= H * 0.84) or size < 6: break
        size *= 0.94
    y0 = (H - lh * len(L)) / 2
    for i, t in enumerate(L): d.text(((W - ws[i]) / 2, y0 + i * lh), t, font=f, fill=PURPLE)
    return im

def card(name):
    path = os.path.join(IMG, name + ".webp"); im = Image.open(path).convert("RGBA"); a = np.asarray(im).astype(np.uint8).copy(); rgb = a[..., :3].astype(int)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    purple = (b > g + 25) & (r > g + 15); purple[int(purple.shape[0] * 0.62):] = False
    n, lab, st, _ = cv2.connectedComponentsWithStats(purple.astype(np.uint8), 8)
    k = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA])); tbl = lab == k
    hull = cv2.convexHull(np.argwhere(tbl)[:, ::-1].astype(np.int32)); inside = np.zeros(tbl.shape, np.uint8); cv2.fillConvexPoly(inside, hull, 1)
    bright = (r > 175) & (g > 170) & (b > 160) & (inside > 0)
    bright = cv2.morphologyEx(bright.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))  # the old purple letters are closed over
    n2, lab2, st2, _ = cv2.connectedComponentsWithStats(bright, 8)
    if n2 < 2: print(name, "no card"); return False
    k2 = 1 + int(np.argmax(st2[1:, cv2.CC_STAT_AREA])); cd = (lab2 == k2).astype(np.uint8)
    cd = cv2.morphologyEx(cd, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    cnts, _ = cv2.findContours(cd, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE); c = max(cnts, key=cv2.contourArea)
    quad = cv2.approxPolyDP(cv2.convexHull(c), 0.06 * cv2.arcLength(cv2.convexHull(c), True), True).reshape(-1, 2).astype(np.float32)
    if len(quad) != 4: quad = cv2.boxPoints(cv2.minAreaRect(c)).astype(np.float32)
    ctr = quad.mean(0); ang = np.arctan2(quad[:, 1] - ctr[1], quad[:, 0] - ctr[0]); quad = quad[np.argsort(ang)]
    def lean(i): dd = quad[(i + 1) % 4] - quad[i]; return abs(np.arctan2(dd[1], dd[0])) if dd[0] > 0 else 9
    best = min(range(4), key=lean)
    q = np.array([quad[(best + j) % 4] for j in range(4)], np.float32)
    q = (q - q.mean(0)) * 1.04 + q.mean(0)  # just over the old card's edge (version 10 already grew it 6%)
    w = float(np.linalg.norm(q[1] - q[0])); h = float(np.linalg.norm(q[3] - q[0]))
    paper = tuple(int(v) for v in np.median(rgb[cd > 0], axis=0)); paper = tuple(min(255, max(v, 236)) for v in paper)
    tex = text_card(w, h, paper); src = np.float32([[0, 0], [tex.width, 0], [tex.width, tex.height], [0, tex.height]])
    Mx = cv2.getPerspectiveTransform(src, q)
    warped = cv2.warpPerspective(np.asarray(tex), Mx, (im.width, im.height), flags=cv2.INTER_AREA)
    mask = np.zeros(tbl.shape, np.float32); cv2.fillConvexPoly(mask, q.astype(np.int32), 1.0); mask = cv2.GaussianBlur(mask, (3, 3), 0.8)
    for ch in range(3): a[..., ch] = (a[..., ch] * (1 - mask) + warped[..., ch] * mask).clip(0, 255).astype(np.uint8)
    Image.fromarray(a, "RGBA").save(path, quality=90, method=6)
    print(name, "card", [tuple(int(v) for v in p) for p in q], "size", round(w), round(h))
    return True

if __name__ == "__main__":
    only = sys.argv[2].split(",") if len(sys.argv) > 2 else None
    for n in CLOTH:
        if not only or n in only: cloth(n)
    for n in CARDS:
        if not only or n in only: card(n)
