# faces.py: find faces in each picked picture with OpenCV's frontal and profile Haar cascades; writes final/faces.json as
# fractions of the picture: [x0, y0, x1, y1] per face, left to right
import cv2, json, glob, os, sys
fr = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
pr = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_profileface.xml")
out = {}
for f in sorted(glob.glob(sys.argv[1] + "/*.jpg")):
    im = cv2.imread(f); g = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY); H, W = g.shape
    minsz = int(min(W, H) * 0.045)
    boxes = list(fr.detectMultiScale(g, 1.08, 6, minSize=(minsz, minsz)))
    for flip in (False, True):
        gg = cv2.flip(g, 1) if flip else g
        for (x, y, w, h) in pr.detectMultiScale(gg, 1.08, 6, minSize=(minsz, minsz)):
            if flip: x = W - x - w
            boxes.append((x, y, w, h))
    # merge overlapping boxes, keep the larger
    keep = []
    for b in sorted(boxes, key=lambda b: -b[2] * b[3]):
        x, y, w, h = b
        if any(not (x + w < k[0] or k[0] + k[2] < x or y + h < k[1] or k[1] + k[3] < y) for k in keep): continue
        keep.append(b)
    keep = sorted(keep, key=lambda b: b[0])
    out[os.path.basename(f)[:-4]] = [[round(x / W, 4), round(y / H, 4), round((x + w) / W, 4), round((y + h) / H, 4)] for x, y, w, h in keep]
json.dump(out, open(sys.argv[1] + "/faces.json", "w"), indent=0)
for k, v in out.items(): print(k, len(v), v)
