/* node's door to ai/schedule.js (the page inlines that file as is) */
import fs from "node:fs";
const src = fs.readFileSync(new URL("./schedule.js", import.meta.url), "utf8");
export const SCHED = new Function(src + "\nreturn SCHED;")();
