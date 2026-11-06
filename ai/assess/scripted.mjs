/* The live app's lesson 1 keyword grader, read out of app.html itself (not copied), so the harness always scores with the
   exact rules learners see. Returns [name, maya, tuesday, nominute] for one learner line. */
import fs from "node:fs";
export function loadScripted(appPath) {
  const s = fs.readFileSync(appPath, "utf8");
  const a = s.indexOf("const norm = (s) =>"), b = s.indexOf("\n", s.indexOf("const openHits = (t) =>"));
  if (a < 0 || b < 0) throw new Error("grader not found in " + appPath);
  const body = s.slice(a, b);
  const make = new Function("NAME", body.replace(/\bme\(\)/g, "NAME") + "\nreturn (t) => openHits(norm(t));");
  return (text, name = "Rosa") => make(String(name).toLowerCase())(text);
}
