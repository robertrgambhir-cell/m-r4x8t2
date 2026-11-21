# clothsign.py: the drive's name on the table's cloth (rule 67, Robert, Nov 21, 2026, 12:56 PM: "The table should also have the
# libraries for all" sign), in white on the purple cloth's front, in the course's type (Figtree, heavy)
import sys, numpy as np
from PIL import Image, ImageDraw, ImageFont
FONT = "/home/claude/fonts/Figtree.ttf"
def sign(src, dst, y_lo, y_hi):
    im = Image.open(src).convert("RGB"); a = np.asarray(im).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    purple = (b > g + 25) & (r > g + 15)
    band = purple[y_lo:y_hi]
    cols = np.nonzero(band.mean(0) > 0.6)[0]
    rows = np.nonzero(purple[:, cols.min():cols.max()].mean(1) > 0.7)[0]; rows = rows[(rows >= y_lo - 30) & (rows <= y_hi + 30)]
    x0, x1, y0, y1 = cols.min(), cols.max(), rows.min(), rows.max()
    # the cloth's front: below its top edge (the first rows are the table top seen from above)
    top = y0 + int((y1 - y0) * 0.22); bot = y1 - int((y1 - y0) * 0.12)
    W, H = x1 - x0, bot - top
    S = 6; lay = Image.new("L", (W * S, H * S), 0); d = ImageDraw.Draw(lay)
    lines = ["LIBRARIES", "FOR ALL"]
    size = H * S * 0.42
    while True:
        f = ImageFont.truetype(FONT, int(size))
        try: f.set_variation_by_axes([860])
        except Exception: pass
        ws = [d.textlength(t, font=f) for t in lines]
        if max(ws) <= W * S * 0.66: break
        size *= 0.95
    asc, desc = f.getmetrics(); lh = asc * 1.02; yy = (H * S - lh * 2) / 2 - desc * 0.15
    for i, t in enumerate(lines): d.text(((W * S - ws[i]) / 2, yy + i * lh), t, font=f, fill=255)
    m = np.asarray(lay.resize((W, H), Image.LANCZOS)).astype(np.float32) / 255
    m *= purple[top:bot, x0:x1]  # on the cloth only
    out = a.copy().astype(np.float32)
    ink = np.array([252, 249, 244], np.float32)
    for c in range(3): out[top:bot, x0:x1, c] = out[top:bot, x0:x1, c] * (1 - m) + ink[c] * m
    Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(dst)
    print(dst, "cloth", (x0, top, x1, bot), "font", int(size / S))
if __name__ == "__main__":
    sign(sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]))
