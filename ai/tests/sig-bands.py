# The signature course's blank-band check (training playbook A50: content fills the screen, no blank bands).
# Run sig-walk.cjs first with OUT=<dir>, then:  python3 ai/tests/sig-bands.py <dir>/L2-375 <dir>/L2-390 ...
# It reads every screenshot of a walk and reports any run of empty white rows taller than LIM (58 px unless set),
# measured across the screen's whole width, so flat color inside a picture never counts. ALL=1 (the default here)
# measures every frame, including a screen before its answer; ALL=0 measures each screen's last frame only.
# Needs Pillow and numpy. Exits 1 if any band is found. The cover's top margin in the laptop frame is not a band.
import sys, os, re
from PIL import Image
import numpy as np

def bands(path, crop=None, dpr=2, inset=10):
    im = Image.open(path).convert('RGB')
    if crop: im = im.crop(crop)
    a = np.asarray(im).astype(np.int16)[:, inset * dpr: -inset * dpr or None, :]
    flat = ((a.max(axis=1) - a.min(axis=1)).max(axis=1) < 7) & (a.min(axis=1).min(axis=1) > 244)
    runs = []; start = None
    for y, f in enumerate(list(flat) + [False]):
        if f and start is None: start = y
        if not f and start is not None: runs.append((y - start, start)); start = None
    H = im.height
    runs = [(n / dpr, s / dpr) for n, s in runs if s > 0 and s + n < H]  # the margin above the first thing and under the last is no band
    return sorted(runs, reverse=True)[:3], H / dpr

if __name__ == '__main__':
    lim = float(os.environ.get('LIM', 58)); every = os.environ.get('ALL', '1') != '0'; found = 0
    for d in sys.argv[1:]:
        crop = (880, 60, 1660, 1548) if d.rstrip('/').split('-')[-1] == '1280' or '-1280-' in d else None  # the phone inside the laptop frame
        fs = sorted(f for f in os.listdir(d) if f.endswith('.png')); last = {}
        for f in fs: last[f[:-4] if every else re.sub(r'^\d+-|\.png$', '', f)] = f
        for tag in sorted(last, key=lambda t: fs.index(last[t])):
            if re.search(r'Sig\d\.0$', tag) and crop: continue
            r, H = bands(os.path.join(d, last[tag]), crop)
            big = [(round(n), round(s)) for n, s in r if n >= lim]
            if big: found += 1; print(f'{d} {tag} (screen {round(H)} px tall): ' + ', '.join(f'{n} px empty at y {s}' for n, s in big))
    print('blank bands:', found); sys.exit(1 if found else 0)
