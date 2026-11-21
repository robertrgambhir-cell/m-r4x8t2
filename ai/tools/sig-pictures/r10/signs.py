# signs.py: the drive's name on the table, real and readable (rule 67, Robert, Nov 21, 2026, 12:56 PM: "The table should also have the
# libraries for all" sign; words printed in a picture are real and readable). In the views from above the painter wrote made-up
# letters on the table's card; here the card is found (the white patch on the purple table), painted clean and given "LIBRARIES FOR
# ALL" in the drive's purple, laid into the card's own slant.
import sys, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont
IMG = "/home/claude/m-r4x8t2/wdpfxqlsvp/sig/img/"
FONT = "/home/claude/fonts/Figtree.ttf"
PURPLE = (90, 62, 153)
def text_card(w, h, paper):
    S = 8; W, H = int(w * S), int(h * S)
    im = Image.new("RGB", (W, H), paper); d = ImageDraw.Draw(im)
    d.rectangle((0, 0, W - 1, H - 1), outline=(196, 190, 204), width=max(2, int(S * 0.9)))  # a fine edge, as a card has
    try: f = ImageFont.truetype(FONT, 10); f.set_variation_by_axes([850])
    except Exception: f = None
    lines = ["LIBRARIES", "FOR ALL"]
    size = H * 0.36
    while True:
        f = ImageFont.truetype(FONT, int(size))
        try: f.set_variation_by_axes([850])
        except Exception: pass
        ws = [d.textlength(t, font=f) for t in lines]
        if max(ws) <= W * 0.84 or size < 6: break
        size *= 0.94
    asc, desc = f.getmetrics(); lh = (asc + desc) * 0.92; y0 = (H - lh * 2) / 2
    for i, t in enumerate(lines): d.text(((W - ws[i]) / 2, y0 + i * lh), t, font=f, fill=PURPLE)
    return im
def fix(name):
    im = Image.open(IMG + name + ".webp").convert("RGBA"); a = np.asarray(im).astype(np.uint8).copy(); rgb = a[..., :3].astype(int)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    purple = (b > g + 25) & (r > g + 15)
    purple[int(purple.shape[0] * 0.62):] = False  # the table stands up the walk; the canvasser's purple shirt and clipboard are below it
    # the table: the biggest purple blob; the card: bright pixels inside the table's outline
    n, lab, st, _ = cv2.connectedComponentsWithStats(purple.astype(np.uint8), 8)
    k = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA])); tbl = lab == k
    hull = cv2.convexHull(np.argwhere(tbl)[:, ::-1].astype(np.int32)); inside = np.zeros(tbl.shape, np.uint8); cv2.fillConvexPoly(inside, hull, 1)
    bright = (r > 175) & (g > 170) & (b > 160) & (inside > 0)
    bright = cv2.morphologyEx(bright.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    n2, lab2, st2, _ = cv2.connectedComponentsWithStats(bright, 8)
    if n2 < 2: print(name, "no card"); return False
    k2 = 1 + int(np.argmax(st2[1:, cv2.CC_STAT_AREA])); card = (lab2 == k2).astype(np.uint8)
    card = cv2.morphologyEx(card, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    cnts, _ = cv2.findContours(card, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE); c = max(cnts, key=cv2.contourArea)
    quad = cv2.approxPolyDP(cv2.convexHull(c), 0.06 * cv2.arcLength(cv2.convexHull(c), True), True).reshape(-1, 2).astype(np.float32)
    if len(quad) != 4: rect = cv2.minAreaRect(c); quad = cv2.boxPoints(rect).astype(np.float32)
    # order the corners: the card's long side runs along the reading direction
    ctr = quad.mean(0); ang = np.arctan2(quad[:, 1] - ctr[1], quad[:, 0] - ctr[0]); quad = quad[np.argsort(ang)]  # clockwise from the left
    # the text runs along the card's edge that's closest to level and points right, so it reads left to right on screen
    def lean(i): d = quad[(i + 1) % 4] - quad[i]; return abs(np.arctan2(d[1], d[0])) if d[0] > 0 else 9
    best = min(range(4), key=lean)
    q = np.array([quad[(best + j) % 4] for j in range(4)], np.float32)  # tl, tr, br, bl around the card
    q = (q - q.mean(0)) * 1.06 + q.mean(0)  # a little larger, so the painted card's old edge is covered
    w = float(np.linalg.norm(q[1] - q[0])); h = float(np.linalg.norm(q[3] - q[0]))
    paper = tuple(int(v) for v in np.median(rgb[card > 0], axis=0)); paper = tuple(min(255, max(v, 236)) for v in paper)
    tex = text_card(w, h, paper); src = np.float32([[0, 0], [tex.width, 0], [tex.width, tex.height], [0, tex.height]])
    Mx = cv2.getPerspectiveTransform(src, q)
    warped = cv2.warpPerspective(np.asarray(tex), Mx, (im.width, im.height), flags=cv2.INTER_AREA)
    mask = np.zeros(tbl.shape, np.float32); cv2.fillConvexPoly(mask, q.astype(np.int32), 1.0)
    mask = cv2.GaussianBlur(mask, (3, 3), 0.8)
    for ch in range(3): a[..., ch] = (a[..., ch] * (1 - mask) + warped[..., ch] * mask).clip(0, 255).astype(np.uint8)
    Image.fromarray(a, "RGBA").save(IMG + name + ".webp", quality=90, method=6)
    print(name, "card", [tuple(int(v) for v in p) for p in q], "size", round(w), round(h))
    return True
for nme in sys.argv[1].split(","): fix(nme)
