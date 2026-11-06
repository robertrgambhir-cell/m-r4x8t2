// Grader check: the hand-labeled example lines, the app's own model lines and a scripted walk of every lesson door.
// node grade.cjs g160.html g161.html  (prints a table per build, writes grade-results.json)
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const cases = JSON.parse(fs.readFileSync(path.join(__dirname, "cases.json"), "utf8"));
(async () => {
  const browser = await chromium.launch();
  const out = {};
  for (const file of process.argv.slice(2)) {
    const page = await browser.newPage();
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await page.goto("file://" + path.resolve(__dirname, file));
    await page.waitForFunction(() => window.__G);
    const res = await page.evaluate((cases) => {
      const G = window.__G, rows = [];
      let fc = 0, miss = 0, ok = 0, judged = 0;
      for (const k of ["open", "listen", "noargue", "plan", "friends"]) {
        for (const [t, exp] of cases[k]) {
          const got = G.FLOW[k].hits(G.norm(t)).map(Boolean);
          const marks = exp.map((e, i) => (e == null ? "-" : got[i] === e ? "ok" : got[i] ? "FALSE CREDIT" : "missed"));
          marks.forEach((m) => { if (m === "-") return; judged += 1; if (m === "ok") ok += 1; else if (m === "missed") miss += 1; else fc += 1; });
          rows.push({ k, t, exp, got, marks });
        }
      }
      // the app's own model lines must keep full credit on the parts they model
      const models = [];
      const SK = G.SKILLS;
      const L1 = SK.open;
      const all1 = (L1.lesson.lines || []).filter((x) => x.who === "you").map((x) => x.text.replace("{name}", "Rosa")).slice(0, 3).join(" ");
      models.push(["open", "Hear it done, lesson 1", all1, [true, true, true, true]]);
      Object.entries(G.FLOW).forEach(([k, f]) => Object.entries(f.fix || {}).forEach(([i, fx]) => {
        const t = fx.model.replace("{name}", "Rosa");
        models.push([k, "Catch the mistake fix, lesson " + k + " part " + (Number(i) + 1), t, null, fx.ok(G.norm(t))]);
      }));
      const m2 = models.map(([k, what, t, exp, okFix]) => {
        if (exp) { const got = G.FLOW[k].hits(G.norm(t)).map(Boolean); return { k, what, t, pass: exp.every((e, i) => e === got[i]), got }; }
        return { k, what, t, pass: !!okFix };
      });
      // the scripted doors, walked with their own suggested lines
      const doors = ["kevin", "priya", "gloria", "denise", "brianna"].map((id) => {
        const d = G.DOORS[id]; if (!d) return { id, err: "missing" };
        const st = { moves: new Set(), turns: 0 }; if (d.start) d.start(st);
        const said = []; let end = false;
        for (let i = 0; i < 9 && !end; i += 1) { const line = d.suggest(st, "Rosa"); said.push(line); const r = d.reply(st, line); end = !!r.end; }
        return { id, moves: [0, 1, 2, 3].map((i) => st.moves.has(i)), said };
      });
      return { rows, tally: { judged, ok, missed: miss, falseCredit: fc }, models: m2, doors };
    }, cases);
    out[file] = res;
    console.log("\n== " + file + "  judged " + res.tally.judged + ", agree " + res.tally.ok + ", false credit " + res.tally.falseCredit + ", missed " + res.tally.missed);
    res.rows.filter((r) => r.marks.some((m) => m !== "ok" && m !== "-")).forEach((r) => console.log("  " + r.k.padEnd(8) + r.marks.join(",").padEnd(40) + r.t.slice(0, 80)));
    console.log("  models: " + res.models.filter((m) => m.pass).length + "/" + res.models.length + " pass" + res.models.filter((m) => !m.pass).map((m) => "\n   FAIL " + m.what + ": " + m.t).join(""));
    console.log("  doors: " + res.doors.map((d) => d.id + " " + (d.moves || []).filter(Boolean).length + "/4").join(", "));
    await page.close();
  }
  fs.writeFileSync(path.join(__dirname, "grade-results.json"), JSON.stringify(out, null, 1));
  await browser.close();
})();
