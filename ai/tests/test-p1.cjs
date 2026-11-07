/* Phase 1 browser tests: progress that survives a reload, the daily rule across days (with the dev build's ?day= test clock),
   retakes, interruptions, door-ready and the issue lessons, presenter shortcuts, the server copy and its failures.
   Needs: node tests/p1-server.mjs <repo root> running, and the dev build at wdpfxqlsvp/dev (python3 ai/build-phase1.py ... --dev).
   Usage: NODE_PATH=$(npm root -g) node tests/test-p1.cjs */
const L = require("./p1-lib.cjs");
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass += 1; else { fail += 1; console.log("FAIL", m); } };
const S = (p) => p.evaluate(() => __p1S());
const scr = (p) => p.evaluate(() => __p1S().screen);
const DAY = 86400000;
const rec = (lessons, issues) => ({ v: 1, lessons, issues: issues || {}, doors: 0, practDays: [], activeDays: [] });
const L1 = (at) => ({ first: [true, false, true, true], best: [true, true, true, true], at, retakes: 0, words: "Hi, I'm Rosa. I'm volunteering for Maya Kaur. Election Day is Tuesday." });
const seed = (c, r) => c.addInitScript((r) => { if (!localStorage.getItem("test-seeded")) { localStorage.setItem("recognize-demo:p1", JSON.stringify(r)); localStorage.setItem("test-seeded", "1"); } }, r); /* once per browser profile, like a real phone */
const noText = (t) => !/text you|get a text|by text/i.test(t);
(async () => {
  const b = await L.launch(), errs = [];

  /* 1. a first-time learner, no server: lesson 1, honest copy, the lock */
  let c = await L.ctx(b), p = await L.open(c, "?noai", errs);
  ok((await scr(p)) === "video", "a first visit opens the welcome video");
  await L.lesson1(p);
  let t = await L.screen(p);
  ok((await scr(p)) === "welcome" && /See you tomorrow\./.test(t) && /Lesson 2 opens tomorrow morning, right here\./.test(t) && noText(t), "Today after lesson 1 says lesson 2 opens tomorrow and promises no text: " + t.slice(0, 220));
  let r = await L.state(p);
  ok(r && r.lessons[1] && r.lessons[1].at > 0 && r.lessons[1].best.every(Boolean), "lesson 1 is saved on the phone");
  const at1 = r.lessons[1].at;
  await L.act(p, "go", "library"); await p.waitForTimeout(600); await L.act(p, "lesson5", "2"); await p.waitForTimeout(800);
  t = await L.screen(p);
  ok((await scr(p)) === "locked" && /Come back to this link for lesson 2\./.test(t) && noText(t), "lesson 2 is locked today, with no text promised: " + t.slice(0, 160));

  /* 2. same day, reload: still saved, lands on Today, not the video */
  await p.reload({ waitUntil: "domcontentloaded" }); await p.waitForFunction(() => window.__p1S); await p.waitForTimeout(1500);
  t = await L.screen(p);
  ok((await scr(p)) === "welcome" && /See you tomorrow/.test(t), "a reload the same day lands on Today, done for today");
  await L.act(p, "ch-rec", "1"); await p.waitForTimeout(600);
  ok(/Election Day is Tuesday/.test(await L.screen(p)), "the lesson record still quotes the best intro after the reload");
  await p.close();

  /* 3. the next morning: lesson 2 is open; a retake of lesson 1 doesn't use the day or move the clock */
  p = await L.open(c, "?noai&day=1", errs);
  t = await L.screen(p);
  ok(/Today.s lesson is ready/.test(t) && /Lesson 2 of 9/.test(t), "the next day, lesson 2 is ready: " + t.slice(0, 160));
  await L.act(p, "go", "library"); await p.waitForTimeout(600); await L.act(p, "lesson5", "1"); await p.waitForTimeout(1500); if ((await scr(p)) === "session") { await L.act(p, "try-start"); } await p.waitForTimeout(4000);
  await L.lesson1(p, false);
  r = await L.state(p);
  ok(r.lessons[1].at === at1 && r.lessons[1].retakes === 1, "a retake keeps lesson 1's first finish time and counts the retake: " + JSON.stringify({ at: r.lessons[1].at === at1, retakes: r.lessons[1].retakes }));
  ok(/Today.s lesson is ready/.test(await L.screen(p)), "after the retake, lesson 2 is still today's lesson");

  /* 4. lesson 2 for real, then lesson 3 waits for the next morning */
  await L.act(p, "lesson5", "2"); await p.waitForTimeout(1500); await L.act(p, "try-start"); await p.waitForTimeout(4500);
  await L.say(p, "Are you planning to vote this year?"); await p.waitForSelector('[data-act="try-next"]', { state: "visible", timeout: 20000 }); await p.waitForTimeout(800);
  await L.act(p, "try-next"); await p.waitForTimeout(1500); await L.act(p, "watch-next"); await p.waitForTimeout(1500);
  await L.act(p, "spot-skip").catch(() => {});
  await p.waitForSelector('[data-act="spot-pick"]', { state: "visible", timeout: 60000 }); await L.act(p, "spot-pick", "1"); await p.waitForTimeout(1000);
  await L.act(p, "go", "main"); await p.waitForTimeout(4500); await L.act(p, "knock"); await p.waitForTimeout(3500);
  for (const line of ["Hi! Are you planning to vote this year?", "Oh wow, that's a lot. When could you get out on Tuesday?", "Thanks so much, have a good night!"]) { if ((await scr(p)) !== "door") break; await L.say(p, line); await p.waitForTimeout(6000); }
  ok((await scr(p)) === "score", "lesson 2 reaches its feedback card");
  await L.act(p, "go", "close"); await p.waitForTimeout(5500); await L.act(p, "done-card"); await p.waitForTimeout(3000); await L.act(p, "done-card"); await p.waitForTimeout(2000);
  t = await L.screen(p); r = await L.state(p);
  ok(r.lessons[2] && /See you tomorrow/.test(t) && /Lesson 3 opens tomorrow morning/.test(t), "lesson 2 saved; lesson 3 waits for tomorrow: " + t.slice(0, 200));
  await p.close();
  p = await L.open(c, "?noai&day=2", errs);
  ok(/Today.s lesson is ready/.test(await L.screen(p)) && /Lesson 3 of 9/.test(await L.screen(p)), "two days on, lesson 3 is ready");

  /* 5. an interrupted lesson: reload mid-lesson comes back to Today with the lesson waiting, and the log says so */
  await L.act(p, "lesson5", "3"); await p.waitForTimeout(1500); await L.act(p, "try-start"); await p.waitForTimeout(2500);
  ok((await scr(p)) === "try", "lesson 3 started");
  await p.reload({ waitUntil: "domcontentloaded" }); await p.waitForFunction(() => window.__p1S); await p.waitForTimeout(1500);
  ok((await scr(p)) === "welcome" && /Lesson 3 of 9/.test(await L.screen(p)), "after an interruption, Today offers lesson 3 again");
  const ev = await L.events(p), names = ev.map((e) => e.name);
  ok(["app_open", "video_start", "video_leave", "lesson_start", "attempt", "feedback_shown", "lesson_complete", "return_visit", "interruption", "locked_view", "tab_view"].every((n) => names.includes(n)), "the event log has every kind of event: " + [...new Set(names)].join(" "));
  ok(!JSON.stringify(ev).match(/Robert|volunteering|Election Day/), "no words in the event log");
  const lc = ev.filter((e) => e.name === "lesson_complete");
  ok(lc.length >= 2 && lc.every((e) => e.props.ms > 10000), "lesson_complete carries the time spent: " + lc.map((e) => e.props.ms).join(","));
  await c.close();

  /* 6. door-ready: the issue lessons open the next morning, one a day, on Today, Learn and the issue page */
  const now = Date.now();
  c = await L.ctx(b);
  await seed(c, rec({ 1: L1(now - 5 * DAY), 2: L1(now - 4 * DAY), 3: L1(now - 3 * DAY), 4: L1(now - 2 * DAY), 5: L1(now) }));
  p = await L.open(c, "?noai", errs);
  t = await L.screen(p);
  ok(/issue lessons open tomorrow\./.test(t) && /Your next issue lesson opens tomorrow morning, right here\./.test(t) && noText(t), "door-ready day: issue lessons open tomorrow: " + t.slice(0, 220));
  await L.act(p, "issues-open"); await p.waitForTimeout(2500);
  const src = await p.evaluate(() => (document.querySelector("#issues-ov iframe") || {}).src || "");
  ok(/slot=0/.test(src), "the issue page is told today's lesson is used: " + src);
  const fr = p.frames().find((f) => /issues\//.test(f.url()));
  await fr.waitForSelector(".hr", { timeout: 20000 });
  const rows = await fr.evaluate(() => [...document.querySelectorAll(".hr")].map((b) => (b.disabled ? "locked:" : "open:") + b.innerText.replace(/\s+/g, " ").slice(-12)));
  ok(rows.length === 4 && rows.every((x) => /^locked:.*Tomorrow/.test(x)), "on the issue page every issue lesson waits for tomorrow: " + rows.join(" | "));
  await p.evaluate(() => { const o = document.getElementById("issues-ov"); if (o) o.remove(); });
  await p.close();
  p = await L.open(c, "?noai&day=1", errs);
  t = await L.screen(p);
  ok(/issue lessons are open\./.test(t) && /One issue lesson a day/.test(t), "the next morning they're open: " + t.slice(0, 200));
  await L.act(p, "issues-open"); await p.waitForTimeout(2500);
  ok(!/slot=0/.test(await p.evaluate(() => (document.querySelector("#issues-ov iframe") || {}).src || "")), "the issue page opens without the slot lock");
  await p.evaluate(() => { const o = document.getElementById("issues-ov"); if (o) o.remove(); window.postMessage({ warmup: "brief-done", lesson: "oh" }, "*"); });
  await p.waitForTimeout(800); await L.act(p, "go", "welcome"); await p.waitForTimeout(600);
  t = await L.screen(p);
  ok(/See you tomorrow\./.test(t) && /next issue lesson opens tomorrow/.test(t), "after one issue lesson, Today says see you tomorrow: " + t.slice(0, 200));
  r = await L.state(p);
  ok(r.issues.oh > 0, "the issue lesson is saved with its time");
  const ohAt = r.issues.oh;
  await p.evaluate(() => window.postMessage({ warmup: "brief-done", lesson: "oh" }, "*")); await p.waitForTimeout(600);
  ok((await L.state(p)).issues.oh === ohAt, "redoing an issue lesson keeps its first finish time");
  await L.act(p, "go", "library"); await p.waitForTimeout(600);
  await p.evaluate(() => { const b = [...document.querySelectorAll('[data-act="brief-open"]')].find((x) => /Heating/.test(x.dataset.arg || x.innerText)); b.click(); }); /* version 164: Georgia hidden, so a lesson still on the issue page */
  await p.waitForTimeout(700);
  ok(!(await p.$("#issues-ov")) && /opens tomorrow morning/.test(await p.evaluate(() => document.body.innerText)), "a second new issue lesson the same day says it opens tomorrow");
  await p.close();
  p = await L.open(c, "?noai&day=1", errs);
  { const bd = (await S(p)).briefsDoneIds; ok(bd.oh === ohAt, "the issue lesson survives a reload: " + JSON.stringify(bd) + " vs " + ohAt + " stored " + JSON.stringify((await L.state(p)).issues)); }
  await c.close();

  /* 7. presenter shortcuts never touch a learner's record */
  c = await L.ctx(b);
  p = await L.open(c, "?home&ready&noai", errs);
  ok((await L.state(p)) === null && (await L.events(p)).length === 0, "?home&ready writes nothing and logs nothing");
  await c.close();

  /* 8. the server copy: a learner id, the record without words, events, and a personal link on a new phone */
  await fetch(L.AI + "/__p1/reset");
  c = await L.ctx(b);
  await seed(c, rec({ 1: L1(now - DAY) }));
  p = await L.open(c, "?ai=" + encodeURIComponent(L.AI), errs);
  await p.waitForTimeout(3500);
  const tok = await p.evaluate(() => JSON.parse(localStorage.getItem("recognize-demo:learner") || "null"));
  ok(/^[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{32}$/.test(tok || ""), "the page gets an anonymous learner token");
  await p.close(); await new Promise((r) => setTimeout(r, 800)); /* pagehide flushes the event log */
  let kv = await (await fetch(L.AI + "/__p1/kv")).json();
  const id = tok.split(".")[0], lp = kv["lp:" + id];
  ok(lp && JSON.parse(lp).lessons[1] && !/Rosa|volunteering|Election/.test(lp), "the server has lesson 1 without the learner's words: " + (lp || "").slice(0, 100));
  ok(Object.keys(kv).some((k) => k.startsWith("ev:") && k.includes(id)), "the event log reached the server");
  const adm = await (await fetch(L.AI + "/v1/admin/learners", { headers: { "x-admin-token": "p1-test-admin-token-0123456789" } })).json();
  ok(adm.count === 1, "the admin view lists the learner");
  const c2 = await L.ctx(b);
  p = await L.open(c2, "?ai=" + encodeURIComponent(L.AI) + "&l=" + tok, errs);
  await p.waitForTimeout(4000);
  t = await L.screen(p);
  ok((await S(p)).doneAt[1] === now - DAY && (await scr(p)) === "welcome" && /Today.s lesson is ready/.test(t), "a personal link on a new phone brings lesson 1 back: " + t.slice(0, 120));
  ok(!(await p.evaluate(() => location.search)).includes("l="), "the token leaves the address bar");
  await c2.close(); await c.close();

  /* 9. the server down or storage full: the app keeps working from the phone */
  await fetch(L.AI + "/__p1/down?on=1");
  c = await L.ctx(b);
  p = await L.open(c, "?ai=" + encodeURIComponent(L.AI), errs);
  await L.lesson1(p);
  ok((await L.state(p)).lessons[1] && (await scr(p)) === "welcome", "with the server down, lesson 1 still saves on the phone");
  await fetch(L.AI + "/__p1/down?on=0"); await fetch(L.AI + "/__p1/kvfail?on=1");
  await p.reload({ waitUntil: "domcontentloaded" }); await p.waitForFunction(() => window.__p1S); await p.waitForTimeout(3500);
  ok((await scr(p)) === "welcome" && (await L.state(p)).lessons[1], "with storage full on the server, the app still opens on Today with lesson 1 saved");
  await fetch(L.AI + "/__p1/kvfail?on=0");
  /* 10. erase */
  await p.evaluate(() => __p1.erase()); await p.waitForTimeout(300);
  ok((await L.state(p)) === null, "erase clears the record on the phone");
  await c.close();


  /* 11. the review's fixes: a crafted ?ai= link, a poisoned record, Progress agreeing with Today, a planted personal link,
     a rejected token, the sandboxed test clock */
  {
    const fs = require("fs"), path = require("path"), cp = require("child_process");
    const repo = path.resolve(__dirname, "..", "..");
    cp.execFileSync("python3", ["ai/build-phase1.py", "wdpfxqlsvp/staging/index.html", "ai/assets/issues-source.html", "wdpfxqlsvp/.p1-test-prod"], { cwd: repo });
    await fetch(L.AI + "/__p1/reset");
    const PROD = "http://127.0.0.1:8765/wdpfxqlsvp/.p1-test-prod/";
    c = await L.ctx(b);
    const hits = [];
    await c.route("https://evil.example/**", (r) => { hits.push(r.request().url() + " " + (r.request().headers().authorization || "")); r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true,"progress":true}' }); });
    await seed(c, rec({ 1: L1(now - DAY) }));
    p = await c.newPage(); p.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
    await p.goto(PROD + "?ai=https://evil.example", { waitUntil: "domcontentloaded", timeout: 180000 }); await p.waitForTimeout(5000);
    ok(!hits.some((h) => /v1\/|Bearer/.test(h)), "a production build ignores ?ai= for progress: no token or record sent elsewhere: " + hits.join(" | ").slice(0, 200));
    ok(await p.evaluate(() => typeof window.__p1S === "undefined"), "a production build exposes no test hooks and no test clock");
    await c.close();
    c = await L.ctx(b);
    await seed(c, { v: 1, lessons: { 1: L1(now - 5 * DAY), 2: L1(now - 4 * DAY), 3: L1(now - 3 * DAY), 4: L1(now - 2 * DAY), 5: L1(now - DAY), "<img src=x onerror=window.__pwn=1>": L1(now) }, issues: { ga: now - DAY / 2, 'x" onload="window.__pwn=1" data-x="': now } });
    p = await L.open(c, "?noai", errs);
    await L.act(p, "issues-open"); await p.waitForTimeout(2500);
    ok(!(await p.evaluate(() => window.__pwn)) && !/onload|onerror/.test(await p.evaluate(() => (document.querySelector("#issues-ov iframe") || {}).src || "")), "a poisoned record can't put script into the page");
    const st = await L.state(p);
    ok(Object.keys(st.lessons).join() === "1,2,3,4,5" && Object.keys(st.issues).join() === "ga", "and the stored record is rebuilt from known fields only: " + JSON.stringify(Object.keys(st.issues)));
    await c.close();
    c = await L.ctx(b);
    await seed(c, rec({ 1: L1(now - 2 * DAY) }));
    p = await L.open(c, "?noai", errs);
    await L.act(p, "go", "me"); await p.waitForTimeout(800);
    t = await L.screen(p);
    ok(/Start lesson 2/.test(t) && !/Lesson 2 opens tomorrow/.test(t), "Progress offers lesson 2 when Today does: " + t.slice(0, 160));
    await c.close();
    /* a planted personal link doesn't take over a phone that has its own record; a rejected token is replaced */
    c = await L.ctx(b);
    await seed(c, rec({ 1: L1(now - DAY) }));
    await c.addInitScript(() => { if (!localStorage.getItem("test-tok")) { localStorage.setItem("recognize-demo:learner", JSON.stringify("AAAAAAAAAAAAAAAAAAAAAA.BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB")); localStorage.setItem("test-tok", "1"); } });
    p = await L.open(c, "?ai=" + encodeURIComponent(L.AI) + "&l=CCCCCCCCCCCCCCCCCCCCCC.DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD", errs);
    await p.waitForTimeout(4500);
    const tk = await p.evaluate(() => JSON.parse(localStorage.getItem("recognize-demo:learner")));
    ok(!/^CCCC/.test(tk) && !/^AAAA/.test(tk) && /^[A-Za-z0-9_-]{22}\./.test(tk), "a planted link is ignored and a rejected token is replaced with a fresh one: " + tk.slice(0, 8));
    await c.close();
    /* the test clock never touches the real record */
    c = await L.ctx(b);
    await seed(c, rec({ 1: L1(now - DAY) }));
    p = await L.open(c, "?noai&day=3", errs);
    await L.act(p, "lesson5", "2"); await p.waitForTimeout(1500);
    const real = await L.realState(p);
    ok(Object.keys(real.lessons).join() === "1" && real.lessons[1].at === now - DAY, "a page on the test clock leaves the real record alone");
    await c.close();
    fs.rmSync(path.join(repo, "wdpfxqlsvp", ".p1-test-prod"), { recursive: true, force: true });
  }
  /* 12. two tabs on one phone: a lesson finished in one tab survives the other tab's next save */
  {
    c = await L.ctx(b);
    await seed(c, rec({ 1: L1(now - 2 * DAY) }));
    const tA = await L.open(c, "?noai", errs), tB = await L.open(c, "?noai", errs);
    await tA.evaluate((r) => { const x = JSON.parse(localStorage.getItem("recognize-demo:p1")); x.lessons[2] = r; localStorage.setItem("recognize-demo:p1", JSON.stringify(x)); }, L1(now - 3600000)); /* tab A finished lesson 2 */
    await tB.evaluate(() => { const s = __p1S(); s.doorsN = 3; __p1.after(); }); await tB.waitForTimeout(400); /* tab B, still showing the old state, saves a practice door */
    const both = await L.state(tB);
    ok(both.lessons[2] && both.doors === 3 && (await tB.evaluate(() => __p1S().screen)) === "welcome", "a second tab's save keeps the lesson the first tab finished: " + JSON.stringify({ l2: !!both.lessons[2], doors: both.doors }));
    await c.close();
  }
  ok(errs.length === 0, "no page errors: " + errs.slice(0, 3).join(" | "));
  console.log(`phase 1: ${pass} pass, ${fail} fail`);
  await b.close();
  process.exit(fail ? 1 : 0);
})();
