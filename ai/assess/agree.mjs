/* Phase 1 assessment harness, step 2: once two trainers have labeled a sheet from export.mjs, measure agreement.
   For each rubric item: how often the two humans agree (and Cohen's kappa), then how often each grader agrees with the
   humans where the humans agree with each other. Labels: met or missed (partial counts as missed; blank rows are skipped).
   It reports "not enough labels" for any item under MIN pairs and never prints an accuracy claim for those.
   Usage: node assess/agree.mjs LABELED.csv [--min 50] [--json] */
import fs from "node:fs";
export function parseCsv(text) {
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i += 1; } else if (ch === '"') q = false; else cell += ch; continue; }
    if (ch === '"') q = true; else if (ch === ",") { row.push(cell); cell = ""; } else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; } else if (ch !== "\r") cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows;
  return body.filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] || ""])));
}
const bin = (x) => { x = String(x || "").trim().toLowerCase(); return x === "met" ? 1 : x === "missed" || x === "partial" ? 0 : null; };
export function kappa(pairs) {
  const n = pairs.length; if (!n) return null;
  const po = pairs.filter(([a, b]) => a === b).length / n;
  const pa = pairs.filter(([a]) => a === 1).length / n, pb = pairs.filter(([, b]) => b === 1).length / n;
  const pe = pa * pb + (1 - pa) * (1 - pb);
  return pe === 1 ? (po === 1 ? 1 : 0) : (po - pe) / (1 - pe);
}
export function agreement(rows, min = 50) {
  const items = [...new Set(rows.map((r) => r.item))], out = [];
  for (const item of items) {
    const rs = rows.filter((r) => r.item === item);
    const hh = rs.map((r) => [bin(r.human_a), bin(r.human_b)]).filter(([a, b]) => a !== null && b !== null);
    const cons = rs.filter((r) => bin(r.human_a) !== null && bin(r.human_a) === bin(r.human_b));
    const vs = (col) => { const p = cons.map((r) => [bin(r[col]), bin(r.human_a)]).filter(([g]) => g !== null); return { n: p.length, agree: p.length ? p.filter(([a, b]) => a === b).length / p.length : null, kappa: kappa(p), falseCredit: p.filter(([g, h]) => g === 1 && h === 0).length, missedCredit: p.filter(([g, h]) => g === 0 && h === 1).length }; };
    const enough = hh.length >= min;
    out.push({ item, humanPairs: hh.length, humanAgree: hh.length ? hh.filter(([a, b]) => a === b).length / hh.length : null, humanKappa: kappa(hh), consensus: cons.length, scripted: vs("scripted"), ai: vs("ai"), enough });
  }
  return out;
}
if (import.meta.url === "file://" + process.argv[1]) {
  const [,, CSV, ...rest] = process.argv;
  const i = rest.indexOf("--min"), min = i >= 0 ? Number(rest[i + 1]) : 50;
  const res = agreement(parseCsv(fs.readFileSync(CSV, "utf8")), min);
  if (rest.includes("--json")) { console.log(JSON.stringify(res, null, 1)); process.exit(0); }
  const f = (x) => (x == null ? "  -  " : (x * 100).toFixed(0).padStart(3) + "%");
  const k = (x) => (x == null ? "  -  " : x.toFixed(2).padStart(5));
  console.log("item        humans(n)  agree  kappa | scripted agree kappa falseCr | ai agree kappa falseCr");
  for (const r of res) {
    if (!r.enough) { console.log(`${r.item.padEnd(11)} ${String(r.humanPairs).padStart(6)}     not enough labels yet (need ${min} pairs per item); no accuracy reported`); continue; }
    console.log(`${r.item.padEnd(11)} ${String(r.humanPairs).padStart(6)}   ${f(r.humanAgree)} ${k(r.humanKappa)} | ${f(r.scripted.agree)} ${k(r.scripted.kappa)} ${String(r.scripted.falseCredit).padStart(4)} | ${f(r.ai.agree)} ${k(r.ai.kappa)} ${String(r.ai.falseCredit).padStart(4)}`);
  }
}
