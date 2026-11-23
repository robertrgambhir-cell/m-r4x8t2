# r11_stride.py: walkers who walk like people (Robert, Nov 22, 2026, 4:10 PM, on lesson 2: "the walking is very phony ... Their feet
# are mostly just kind of sliding, and then their feet are moving. It doesn't look natural at all for a person walking down a
# sidewalk." Playbook rule 69b). Replaces r8_gait.py's two reflected steps: the page now draws each walker's legs as they walk (engine1's
# STRIDE), from the hips down, and lays the walker's own picture over them down to where the legs start. This writes, for each walker,
# what the page needs into img/manifest.json as "w-<who>".stride:
#   split  the picture's row where the legs start (below the hands, the apron or the cart's basket), and hipCx, the middle of the hips there
#   fade   how many rows above the split fade out, so the drawn legs come out from under the picture (never into the hands); patch, a
#          painted detail that would end at the cut, painted out in the trousers' own color (Dwayne's fly)
#   the walk (step, steps, lift, sway) and the legs (in body heights: hip height, widths, shoes, colors), set here by eye from each picture
# For the woman with the cart, it also writes w-tanya-cart-front.webp: the cart's lower legs and wheels with nothing behind them, which
# the page lays over her drawn legs, since the cart is in front of her.
# Run after r8_build.py (which rewrites the manifest): python3 ai/tools/sig-pictures/r11_stride.py wdpfxqlsvp/sig/img
import json, os, sys
import numpy as np
from PIL import Image
OUT = sys.argv[1] if len(sys.argv) > 1 else "wdpfxqlsvp/sig/img"
BASE = {"step": 0.37, "steps": 7, "lift": 0.045, "sway": 0.010, "hipY": 0.47, "ankle": 0.045, "thigh": 0.54, "soft": 0.02, "heel": 0.035,
        "over": 0.010, "soleH": 0.2}
# the legs, by eye from each picture. Colors: trousers (color) and their shade on the leg that's behind; shoe, sole and a highlight.
WALKERS = {
    "ben": {"split": 0.63, "hipX": 0.044, "footX": 0.037, "wHip": 0.094, "wKnee": 0.075, "wHem": 0.068, "shoeW": 0.09, "shoeH": 0.07, "style": "lace",
            "color": "#251a14", "shade": "#0d0705", "shoe": "#6e2c10", "sole": "#2a0f05", "shoeHi": "#c27a4c"},
    "kayla": {"split": 0.59, "hipX": 0.040, "footX": 0.033, "wHip": 0.086, "wKnee": 0.066, "wHem": 0.060, "shoeW": 0.088, "shoeH": 0.064,
              "soleH": 0.26, "style": "sneaker", "over": 0.0, "crop": 0.88, "skin": "#f2a684", "wSkin": 0.034, "cuff": "#6f9bc6",
              "color": "#1469b0", "shade": "#093f76", "shoe": "#f7f7f5", "sole": "#b5b8b7", "shoeHi": "#ffffff", "edge": "rgba(90,90,90,0.35)"},
    "soojin": {"split": 0.61, "step": 0.35, "lift": 0.04, "hipX": 0.039, "footX": 0.032, "wHip": 0.084, "wKnee": 0.068, "wHem": 0.064,
               "shoeW": 0.075, "shoeH": 0.048, "soleH": 0.25, "style": "flat", "over": 0.0, "crop": 0.78, "skin": "#f8b48e", "wSkin": 0.034,
               "color": "#d4d0cc", "shade": "#a9a198", "shoe": "#6d7651", "sole": "#3e392c", "shoeHi": "#a9b386"},
    "hank": {"split": 0.61, "step": 0.33, "lift": 0.035, "hipX": 0.045, "footX": 0.038, "wHip": 0.094, "wKnee": 0.076, "wHem": 0.070,
             "shoeW": 0.092, "shoeH": 0.066, "style": "lace", "color": "#857c7b", "shade": "#5b524f", "shoe": "#6e3806", "sole": "#261501", "shoeHi": "#b06a35"},
    "dwayne": {"split": 0.61, "fade": 12, "patch": [[150, 488, 184, 552, "#a8855d"]], "step": 0.35, "hipX": 0.048, "footX": 0.040, "wHip": 0.100, "wKnee": 0.080, "wHem": 0.074,
               "shoeW": 0.092, "shoeH": 0.068, "style": "lace", "color": "#ab885f", "shade": "#7d5e3c", "shoe": "#8a4413", "sole": "#311902", "shoeHi": "#c27a40"},
    "luis": {"split": 0.75, "hipX": 0.045, "footX": 0.037, "wHip": 0.090, "wKnee": 0.074, "wHem": 0.068, "shoeW": 0.090, "shoeH": 0.066,
             "color": "#0b0b0b", "shade": "#000000", "shoe": "#1c1c1c", "sole": "#050505", "shoeHi": "#5a5a5a"},
    "marisol": {"split": 0.61, "hipX": 0.042, "footX": 0.035, "wHip": 0.090, "wKnee": 0.072, "wHem": 0.068, "shoeW": 0.088, "shoeH": 0.064,
                "soleH": 0.26, "style": "sneaker", "color": "#01b1ac", "shade": "#007673", "shoe": "#f3f3f3", "sole": "#c9c8c6", "shoeHi": "#ffffff",
                "edge": "rgba(90,90,90,0.35)"},
    # pushing a cart: shorter steps, a step behind the picture's plane so her feet stay behind its wheels, and her body and the cart rise
    # and fall less; her legs show below its basket, between its legs
    "tanya-cart": {"splitRow": 708, "fade": 4, "step": 0.26, "steps": 7, "lift": 0.035, "sway": 0.006, "bobScale": 0.4, "hips": False, "front": [82, 222], "back": 0.16,
                   "hipX": 0.046, "footX": 0.040, "wHip": 0.100, "wKnee": 0.088, "wHem": 0.082, "shoeW": 0.076, "shoeH": 0.05, "style": "flat", "over": 0.0,
                   "crop": 0.55, "skin": "#8a4a22", "wSkin": 0.042, "color": "#172234", "shade": "#0a111c", "shoe": "#141414",
                   "sole": "#000000", "shoeHi": "#5a5a5a"},
}

def span(a, y):
    xs = np.nonzero(a[y])[0]
    return (int(xs.min()), int(xs.max())) if len(xs) else None

man = json.load(open(os.path.join(OUT, "manifest.json")))
for who, spec in WALKERS.items():
    src = Image.open(os.path.join(OUT, "w-" + who + ".webp")).convert("RGBA")
    px = np.asarray(src); H, W = px.shape[:2]; alpha = px[..., 3] > 200
    split = spec.get("splitRow") or int(round(spec["split"] * H))
    l, r = span(alpha, split - 4)
    # where the hands end: the lowest row with something outside the hips' span, so the fade never reaches a hand
    hands = 0
    for y in range(split - 90, split + 1):
        s = span(alpha, y)
        if s and (s[0] < l - 4 or s[1] > r + 4): hands = y
    fade = spec.get("fade") or max(4, min(18, split - hands - 2))
    st = dict(BASE); st.update({k: v for k, v in spec.items() if k not in ("split", "splitRow", "fade", "front")})
    st.update({"split": split, "hipCx": round((l + r) / 2.0, 1), "fade": fade})
    if "front" in spec:  # the cart's lower legs and wheels, with nothing behind them
        x0, x1 = spec["front"]; f = px.copy(); f[:split + 1, :, 3] = 0; f[:, x0:x1 + 1, 3] = 0
        Image.fromarray(f, "RGBA").save(os.path.join(OUT, "w-" + who + "-front.webp"), "WEBP", quality=88, method=6)
        man["w-" + who + "-front"] = {"w": W, "h": H}; st["front"] = "w-" + who + "-front"
    man["w-" + who]["stride"] = st
    if man.pop("w-" + who + "-b", None) is not None and os.path.exists(os.path.join(OUT, "w-" + who + "-b.webp")):
        os.remove(os.path.join(OUT, "w-" + who + "-b.webp"))  # r8_gait.py's reflected step, which the page no longer shows
    print(who, "split", split, "hips", l, r, "hands end", hands, "fade", fade)
json.dump(man, open(os.path.join(OUT, "manifest.json"), "w"), indent=0)
