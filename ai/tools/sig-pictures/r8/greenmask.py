# greenmask.py: the person's outline from their portrait repainted on plain green (r8/out/plain-<n>.jpg), laid over the
# original cutout: whatever the old cutout kept that the repaint shows as background (a crate wedge, a window post) goes.
# The repaint can move an edge by a pixel or two, so the green mask is widened a little before it trims anything.
import sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi
names = sys.argv[1].split(",")
for n in names:
    c = np.asarray(Image.open(f"q5/cut-fix/{n}.png").convert("RGBA")).copy()
    g = np.asarray(Image.open(f"r8/out/plain-{n}.jpg").convert("RGB")).astype(np.float32)
    if g.shape[:2] != c.shape[:2]: g = np.asarray(Image.fromarray(g.astype(np.uint8)).resize((c.shape[1], c.shape[0]))).astype(np.float32)
    green = (g[..., 1] > 150) & (g[..., 0] < 120) & (g[..., 2] < 120)
    person = ~green
    person = ndi.binary_opening(person, iterations=2)
    lab, k = ndi.label(person)
    if k: sizes = ndi.sum(person, lab, range(1, k + 1)); person = np.isin(lab, [i + 1 for i, z in enumerate(sizes) if z > 3000])
    person = ndi.binary_fill_holes(person)
    keep = ndi.binary_dilation(person, iterations=6)
    drop = (c[..., 3] > 20) & ~keep
    # only sizable patches go (a wedge, a post), never a few edge pixels the repaint drew a little differently
    lab, k = ndi.label(drop)
    big = np.zeros_like(drop)
    if k:
        sizes = ndi.sum(drop, lab, range(1, k + 1)); big = np.isin(lab, [i + 1 for i, z in enumerate(sizes) if z > 400])
    c[big, 3] = 0
    a = c[..., 3] > 20; lab, k = ndi.label(a)
    if k > 1:
        sizes = ndi.sum(a, lab, range(1, k + 1)); keepc = np.isin(lab, [i + 1 for i, z in enumerate(sizes) if z >= max(2500, 0.004 * sizes.max())]); c[~keepc & a, 3] = 0
    Image.fromarray(c, "RGBA").save(f"r8/cut-clean/{n}.png"); print(n, "dropped", int(big.sum()))
