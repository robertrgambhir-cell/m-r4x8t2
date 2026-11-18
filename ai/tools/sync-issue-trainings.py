"""Copies the issue trainings the app shows from the issue-trainings repo into this one.

The trainings are built in robertrgambhir-cell/issue-trainings (one page per training in dist/, the voter sheets for the
spoken practice in voters/scenarios.js). The app holds copies, so the live site never depends on that repo:
  dist/<id>.html        ->  wdpfxqlsvp/trainings/<id>.html   (opened from Learn, in the app's own frame)
  voters/scenarios.js   ->  ai/voters/scenarios.js           (the AI server plays the voter and grades from it)
and wdpfxqlsvp/trainings/source.txt records which commit they came from, with a fingerprint of each file.
It also refreshes the four app pages' own copy of the voters' cards (WAI_PUB: names, opening lines, voices and the score
card's rows, read from ai/scenarios.js), so a changed opening line or card row reaches the pages in the same step.

Which trainings: the ids in ai/scenarios-issues.js (ISSUE_IDS). To add one, add its id there and to briefIds on the app
pages (see ai/tools/v173-two-issue-trainings.py), then run this.

Usage: python3 ai/tools/sync-issue-trainings.py /path/to/issue-trainings   (from anywhere; add --check to compare only)
"""
import hashlib
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
args = [a for a in sys.argv[1:] if not a.startswith("--")]
CHECK = "--check" in sys.argv
if len(args) != 1:
    sys.exit(__doc__)
SRC = pathlib.Path(args[0]).resolve()

ids_js = (ROOT / "ai" / "scenarios-issues.js").read_text(encoding="utf-8")
m = re.search(r"export const ISSUE_IDS = \[([^\]]*)\]", ids_js)
assert m, "ISSUE_IDS not found in ai/scenarios-issues.js"
IDS = re.findall(r'"([a-z]+)"', m.group(1))
assert IDS, "no ids"

sha = lambda b: hashlib.sha256(b).hexdigest()
pairs = [(SRC / "dist" / f"{i}.html", ROOT / "wdpfxqlsvp" / "trainings" / f"{i}.html") for i in IDS]
pairs.append((SRC / "voters" / "scenarios.js", ROOT / "ai" / "voters" / "scenarios.js"))

lines, changed = [], 0
for src, dst in pairs:
    data = src.read_bytes()
    assert "—".encode("utf-8") not in data, f"an em dash in {src}"
    same = dst.exists() and dst.read_bytes() == data
    if not same:
        changed += 1
        if not CHECK:
            dst.parent.mkdir(parents=True, exist_ok=True)
            dst.write_bytes(data)
    print(("same     " if same else "DIFFERENT" if CHECK else "copied   "), dst.relative_to(ROOT))
    lines.append(f"{dst.relative_to(ROOT)}  sha256 {sha(data)}")

try:
    commit = subprocess.run(["git", "-C", str(SRC), "rev-parse", "HEAD"], capture_output=True, text=True, check=True).stdout.strip()
    dirty = subprocess.run(["git", "-C", str(SRC), "status", "--porcelain", "--", "dist", "voters"], capture_output=True, text=True, check=True).stdout.strip()
    branch = subprocess.run(["git", "-C", str(SRC), "rev-parse", "--abbrev-ref", "HEAD"], capture_output=True, text=True, check=True).stdout.strip()
except Exception:
    commit, dirty, branch = "unknown", "", "unknown"
note = (f"Copied from robertrgambhir-cell/issue-trainings, branch {branch}, commit {commit}"
        + (" (with uncommitted changes)" if dirty else "") + " by ai/tools/sync-issue-trainings.py.\n" + "\n".join(lines) + "\n")
# the pages' copy of the cards, from the server's own definitions (the same lines version 173's patch wrote)
import json
pub = subprocess.run(["node", "--input-type=module", "-e",
                      "import { SCENARIOS, publicScenario } from " + json.dumps(str(ROOT / "ai" / "scenarios.js")) + ";"
                      "const o = {}; for (const k of Object.keys(SCENARIOS)) if (k !== 'bri_health') o[k] = publicScenario(k); console.log(JSON.stringify(o));"],
                     capture_output=True, text=True, check=True).stdout.strip()
assert pub.startswith("{") and all(i in json.loads(pub) for i in IDS) and "\u2014" not in pub and "</script" not in pub.lower()
for page in ["wdpfxqlsvp/app.html", "wdpfxqlsvp/p1/index.html", "wdpfxqlsvp/dev/index.html", "wdpfxqlsvp/staging/index.html"]:
    f = ROOT / page
    t = f.read_text(encoding="utf-8")
    hits = re.findall(r"const WAI_PUB = \{.*?\};\n", t)
    assert len(hits) == 1, (page, len(hits))
    same = hits[0] == "const WAI_PUB = " + pub + ";\n"
    if not same:
        changed += 1
        if not CHECK:
            f.write_text(t.replace(hits[0], "const WAI_PUB = " + pub + ";\n"), encoding="utf-8")
    print(("same     " if same else "DIFFERENT" if CHECK else "refreshed"), page, "(the voters' cards)")
if CHECK:
    sys.exit(1 if changed else 0)
(ROOT / "wdpfxqlsvp" / "trainings" / "source.txt").write_text(note, encoding="utf-8")
print(note)
