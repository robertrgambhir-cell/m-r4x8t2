# spots.py: the two "where to stand" pairs (Robert, Nov 20, 3:51 PM). Each pair is one drawing of Westside Market with the same
# passersby in the same places; only the canvasser changes, "where the canvasser is standing or seated", never the passersby.
# Sitting, she sits behind the table on her phone; standing, she's in front of it, ready. At the door, she either blocks the way
# out or stands a few steps to the side. Look Q, the same canvasser as the course's other pictures.
import numpy as np
from PIL import Image, ImageOps
from scipy import ndimage as ndi
from rembg import remove, new_session
sess = new_session("isnet-general-use")
def cutout(path, flip=False):
    im = Image.open(path).convert("RGB")
    if flip: im = ImageOps.mirror(im)
    c = remove(im, session=sess); a = np.asarray(c)[..., 3] > 40
    lab, n = ndi.label(a); sizes = ndi.sum(a, lab, range(1, n + 1)); a = np.isin(lab, [i + 1 for i, z in enumerate(sizes) if z > 1500])
    arr = np.asarray(c).copy(); arr[..., 3] = np.clip(ndi.gaussian_filter(a.astype(np.float32), 0.7) * 255, 0, 255).astype(np.uint8)
    ys, xs = np.nonzero(a); return Image.fromarray(arr, "RGBA").crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
def put(base, fig, cx, feet, h):
    f = fig.resize((max(1, int(fig.width * h / fig.height)), int(h)), Image.LANCZOS)
    base.alpha_composite(f, (int(cx - f.width / 2), int(feet - f.height)))
sit = cutout("r8/out/pose-sit-1.jpg")
stand_r = cutout("r8/out/pose-stand-left-1.jpg", flip=True)   # turned toward the passersby on her right
stand_l = cutout("r8/out/pose-stand-left-1.jpg")              # turned toward the door on her right? (mirror kept for checks)
# --- the table pair ---
T = Image.open("r8/out/spotplate-table-2.jpg").convert("RGBA")
arr = np.asarray(T).copy()
arr[555:665, 384:427] = arr[555:665, 470:513]; arr[555:665, 427:470] = arr[555:665, 470:513]  # the plate's empty stool, painted out with the wall and sidewalk beside it
T = Image.fromarray(arr, "RGBA")
rgb = np.asarray(T.convert("RGB")).astype(np.float32) / 255
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]; mx = rgb.max(-1); mn = rgb.min(-1)
purple = (b > g + 0.08) & (r > g + 0.05) & (mx - mn > 0.12)
tbl = np.zeros(purple.shape, bool); tbl[505:615, 140:395] = purple[505:615, 140:395]
legs = np.zeros(purple.shape, bool); legs[590:660, 150:385] = (mx[590:660, 150:385] < 0.38)
tmask = ndi.binary_dilation(tbl | legs, iterations=1)
table_layer = np.asarray(T).copy(); table_layer[~tmask, 3] = 0; table_layer = Image.fromarray(table_layer, "RGBA")
A = T.copy(); put(A, sit, 268, 640, 235); A.alpha_composite(table_layer)
B = T.copy(); put(B, stand_r, 440, 678, 282)
A.convert("RGB").save("r8/spot-sit.jpg", quality=92); B.convert("RGB").save("r8/spot-stand.jpg", quality=92)
# --- the door pair ---
D = Image.open("r8/out/spotplate-door-2.jpg").convert("RGBA")
C = D.copy(); put(C, stand_r, 815, 648, 215)   # in the doorway, in the way of the people coming out
E = D.copy(); put(E, stand_r, 600, 632, 210)   # a few steps to the side of the door, the way out clear
C.convert("RGB").save("r8/spot-doorway.jpg", quality=92); E.convert("RGB").save("r8/spot-side.jpg", quality=92)
row = Image.new("RGB", (1024 * 2 + 10, 768 * 2 + 10), "white")
for i, p in enumerate(["spot-sit", "spot-stand", "spot-doorway", "spot-side"]): row.paste(Image.open(f"r8/{p}.jpg"), ((i % 2) * 1034, (i // 2) * 778))
row.resize((1029, 773)).save("/tmp/spotpairs.jpg", quality=85)
