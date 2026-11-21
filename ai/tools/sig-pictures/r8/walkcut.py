# walkcut.py: cut each walking figure out of its plain background, trim to the figure, and note where its feet and head are
import json, numpy as np
from PIL import Image
from scipy import ndimage as ndi
from rembg import remove, new_session
sess = new_session("isnet-general-use")
PICK = {"ben": "walk-ben-1", "soojin": "walk-soojin-1", "kayla": "walk-kayla-1", "luis": "walk-luis-1", "tanya-cart": "walk-tanya-cart-4",
        "dwayne": "walk-dwayne-1", "hank": "walk-hank-1", "marisol": "walk-marisol-1", "ines-stroller": "walk-ines-stroller-1"}
info = {}
for k, src in PICK.items():
    im = Image.open(f"r8/out/{src}.jpg").convert("RGB")
    cut = remove(im, session=sess)
    a = np.asarray(cut)[..., 3] > 30
    lab, n = ndi.label(a)
    if n > 1:
        sizes = ndi.sum(a, lab, range(1, n + 1)); a = lab == (1 + int(np.argmax(sizes)))
        arr = np.asarray(cut).copy(); arr[~ndi.binary_dilation(a, iterations=2), 3] = 0; cut = Image.fromarray(arr)
    ys, xs = np.nonzero(a); x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    pad = 6
    box = (max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad))
    c = cut.crop(box); c.save(f"r8/walk-{k}.png")
    info[k] = {"w": c.width, "h": c.height}
    print(k, c.size)
json.dump(info, open("r8/walk-info.json", "w"))
