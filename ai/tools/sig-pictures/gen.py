# gen.py: make pictures through the server lab. usage: python3 gen.py jobs.json outdir [model]
# each job: {"name":..., "prompt":..., "w":1024, "h":768, "seed":1, "refs":["path.jpg", ...]}
import json, sys, subprocess, concurrent.futures as cf, os, time
jobs = json.load(open(sys.argv[1])); out = sys.argv[2]; model = sys.argv[3] if len(sys.argv) > 3 else "@cf/black-forest-labs/flux-2-dev"
key = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "key")).read().strip()
os.makedirs(out, exist_ok=True)
def one(j):
    dst = os.path.join(out, j["name"] + ".jpg")
    if os.path.exists(dst) and not os.environ.get("FORCE"): return j["name"], "kept"
    args = ["curl", "-s", "-o", dst + ".part", "-w", "%{http_code} %{content_type}", "-H", "x-lab-key: " + key, "-F", "prompt=" + j["prompt"], "-F", "width=%d" % j.get("w", 1024), "-F", "height=%d" % j.get("h", 768)]
    if "seed" in j: args += ["-F", "seed=%d" % j["seed"]]
    if "steps" in j: args += ["-F", "steps=%d" % j["steps"]]
    for i, r in enumerate(j.get("refs", [])): args += ["-F", "input_image_%d=@%s;type=image/jpeg" % (i, r)]
    args.append("https://warmup-ai.robertrgambhir.workers.dev/lab/form?model=" + j.get("model", model))
    for attempt in range(3):
        t0 = time.time(); r = subprocess.run(args, capture_output=True, text=True, timeout=240)
        st = r.stdout.strip()
        if st.startswith("200 image"):
            try:
                from PIL import Image; im = Image.open(dst + ".part"); im.load()
                os.replace(dst + ".part", dst); return j["name"], "ok %.0fs" % (time.time() - t0)
            except Exception as e: st = "truncated " + str(e)
        msg = open(dst + ".part", errors="replace").read()[:300] if os.path.exists(dst + ".part") else ""
        time.sleep(3)
    return j["name"], "FAIL " + st + " " + msg
with cf.ThreadPoolExecutor(int(os.environ.get("PAR", 4))) as ex:
    for name, res in ex.map(one, jobs): print(name, res, flush=True)
