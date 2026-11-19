/* node's door to ai/sig/grade.js (the page inlines that file as is) */
import fs from "node:fs";
const src = fs.readFileSync(new URL("./grade.js", import.meta.url), "utf8");
export const SIGG = new Function(src + "\nreturn SIGG;")();
