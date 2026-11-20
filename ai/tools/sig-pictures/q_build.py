# q_build.py: the signature course's look Q pictures, built into wdpfxqlsvp/sig/img/ (Nov 19, playbook rules 54a, 67, 67a, 69).
# Every person is a cutout over one storefront, so a passerby walks in over the place (rule 54a) and the same person looks the
# same everywhere. Each face has two small patches laid over it while it talks and blinks (rule 69): a drawn open mouth, the same
# shape for every face (rule 67a: deep lips with a small highlight, a dark inside, no teeth, never lighter lips), and a closed-eye
# patch from a blink edit (or drawn where an edit failed). The sources are made by the lab tools in the demo chat's sandbox
# (how: ai/tools/sig-pictures.md, "Look Q"); this script only lays them out.
#   python3 q_build.py <sandbox q5 dir> <store plate> <out dir>
import json, os, sys
import numpy as np
from PIL import Image
Q5, STORE, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(OUT, exist_ok=True)
H = json.load(open(os.path.join(Q5, "heads.json")))
VARS = json.load(open(os.path.join(Q5, "variants.json")))
CUT = os.path.join(Q5, "cut-fix")
HEAD = {"lena-turn-sheet": "lena-turn", "rico-turn-sheet": "rico-turn", "kayla-out": "kayla", "tanya-cart": "tanya", "tanya-tug": "tanya", "anika-bags": "anika",
        "hank-pen": "hank", "hank-paper": "hank", "joan-apron": "joan", "karim-keys": "karim", "bob-pen": "bob"}
def head_of(k): return HEAD.get(k, k)
def webp(im, name, q=84):
    im.save(os.path.join(OUT, name + ".webp"), "WEBP", quality=q, method=6)
def cut(k):
    """the person's cutout, moved so their face sits exactly where their approved picture has it"""
    im = Image.open(os.path.join(CUT, k + ".png")).convert("RGBA")
    v = VARS.get(k)
    if v and (v["dx"] or v["dy"]):
        im = im.transform(im.size, Image.AFFINE, (1, 0, v["dx"], 0, 1, v["dy"]), resample=Image.BICUBIC)
    return im
PARTS = {}
def part(k):
    if k in PARTS: return
    webp(cut(k), "p-" + k, 86); PARTS[k] = True
PATCH = {}
def patches(h):
    if h in PATCH or h not in H: return
    for kind in ("mo", "bl"):
        webp(Image.open(os.path.join(Q5, "fin", f"{kind}-{h}.png")).convert("RGBA"), f"{kind}-{h}", 90)
    PATCH[h] = True
def frac(b, w, h): return [round(b[0] / w, 4), round(b[1] / h, 4), round(b[2] / w, 4), round(b[3] / h, 4)]
def pinfo(who, k, box, alt=None, walk=False):
    h = head_of(k); part(k); [part(a) for a in (alt or {}).values()]; patches(h)
    p = {"who": who, "src": "p-" + k, "box": box}
    if alt: p["alt"] = {a: "p-" + b for a, b in alt.items()}
    if h in H:
        W, Hh = H[h]["w"], H[h]["h"]
        p["mo"] = frac(H[h]["mo"], W, Hh); p["bl"] = frac(H[h]["bl"], W, Hh); p["head"] = h
    if walk: p["walk"] = True
    return p
M = {}
# the storefronts: one for a passerby seen from your table, one for a canvasser and a passerby together
store = Image.open(STORE).convert("RGB"); webp(store, "store", 82); M["store"] = {"w": store.width, "h": store.height}
two = Image.open(os.path.join(Q5, "out", "plate-two-1.jpg")).convert("RGB"); webp(two, "plate-two", 82); M["plate-two"] = {"w": two.width, "h": two.height}
# one person, from your table: the cutout fills the storefront picture
ONE = {"ben": "ben", "soojin": "soojin", "kayla": "kayla", "luis": "luis", "marisol": "marisol", "tanya": "tanya", "anika": "anika", "pat": "pat", "dwayne": "dwayne",
       "theo": "theo", "bob": "bob", "ines": "ines", "hank": "hank", "joan": "joan-apron", "karim": "karim-keys",
       "tanya-cart": "tanya-cart", "tanya-tug": "tanya-tug", "anika-bags": "anika-bags", "hank-pen": "hank-pen"}
ALT = {"kayla": {"turn": "kayla-out"}}
for name, k in ONE.items():
    who = name.split("-")[0]; h = head_of(k)
    e = {"w": 768, "h": 1344, "bg": "store", "parts": [pinfo(who, k, [0, 0, 1, 1], ALT.get(name), walk=True)]}
    if h in H: e["face"] = frac(H[h]["face"], 768, 1344)
    else: e["face"] = [0.27, 0.15, 0.73, 0.42]
    M[name] = e
# a canvasser and a passerby: the canvasser turned toward them, at the left in front of the table; the passerby walks in from the right
CW, CH, S = 896, 1216, 0.78
PW, PH = 768 * S, 1344 * S
LBOX = [-60 / CW, (CH - PH) / CH, PW / CW, PH / CH]
RBOX = [300 / CW, (CH - PH) / CH, PW / CW, PH / CH]
def place_face(h, box):
    f = H[h]["face"]; x, y, w, hh = box
    return [round(x + f[0] / 768 * w, 4), round(y + f[1] / 1344 * hh, 4), round(x + f[2] / 768 * w, 4), round(y + f[3] / 1344 * hh, 4)]
TWO = {"two-lena-ines": ("lena", "ines", "ines-stroller", None), "two-lena-tanya": ("lena", "tanya", "tanya-cart", None), "two-lena-dwayne": ("lena", "dwayne", "dwayne", None),
       "two-rico-hank": ("rico", "hank", "hank-paper", None), "two-lena-bob": ("lena", "bob", "bob", {"pen": "bob-pen"}), "two-lena-bob-pen": ("lena", "bob", "bob-pen", None),
       "two-rico-soojin": ("rico", "soojin", "soojin", None), "two-lena-joan": ("lena", "joan", "joan-apron", None), "two-rico-karim": ("rico", "karim", "karim-keys", None),
       "two-lena-ben": ("lena", "ben", "ben", None), "two-lena-anika": ("lena", "anika", "anika-bags", None), "two-lena-hank": ("lena", "hank", "hank-pen", None)}
for name, (by, who, k, alt) in TWO.items():
    ck = by + "-turn"
    c = pinfo(by, ck, [round(v, 4) for v in LBOX], {"sheet": ck + "-sheet"})
    p = pinfo(who, k, [round(v, 4) for v in RBOX], alt, walk=True)
    M[name] = {"w": CW, "h": CH, "bg": "plate-two", "faces": [place_face(ck, LBOX), place_face(head_of(k), RBOX)], "parts": [c, p]}
# close faces and small round ones, for cards: the person over the storefront, framed on the face
for who in ["ben", "soojin", "kayla", "luis", "marisol", "tanya", "anika", "pat", "dwayne", "theo", "bob", "ines", "hank", "joan", "karim", "lena", "rico", "carmen"]:
    k = {"joan": "joan-apron", "karim": "karim-keys"}.get(who, who)
    if not os.path.exists(os.path.join(CUT, k + ".png")): continue
    im = store.convert("RGBA").copy(); im.alpha_composite(Image.open(os.path.join(CUT, k + ".png")).convert("RGBA"))
    h = head_of(k); f = H[h]["face"] if h in H else [207, 200, 561, 565]
    cx, cy, s = (f[0] + f[2]) / 2, (f[1] + f[3]) / 2, (f[2] - f[0]) * .78
    cl = im.crop((int(cx - s), int(cy - s * 1.0), int(cx + s), int(cy + s * 1.5))).convert("RGB")
    webp(cl.resize((360, 450)), who + "-close", 84)
    s2 = (f[2] - f[0]) * .62; av = im.crop((int(cx - s2), int(cy - s2 * 1.18), int(cx + s2), int(cy + s2 * 1.06))).convert("RGB").resize((160, 160))  # the whole head, hair included
    webp(av, who + "-av", 84)
    M.setdefault(who, {})["close"] = True
# where to stand: four pictures of the same storefront
for n, src in json.load(open(os.path.join(Q5, "spot-pick.json"))).items():
    im = Image.open(os.path.join(Q5, "out", src + ".jpg")).convert("RGB"); webp(im, n, 84); M[n] = {"w": im.width, "h": im.height}
json.dump(M, open(os.path.join(OUT, "manifest.json"), "w"), indent=0)
print(len(M), "pictures,", len(PARTS), "cutouts,", len(PATCH), "faces with patches")
