/* Phase 1: the daily lesson rule, in the learner's own time zone. Run: node tests/schedule.test.mjs */
import { SCHED } from "../schedule.mjs";
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass += 1; else { fail += 1; console.log("FAIL", m); } };
const TZ = "America/Los_Angeles";
/* local times in Los Angeles (PST after Nov 1, UTC-8) */
const la = (d, h, m = 0) => Date.UTC(2026, 10, d, h + 8, m);
const P = (lessons, issues) => ({ lessons: Object.fromEntries(Object.entries(lessons).map(([n, at]) => [n, { at }])), issues: issues || {} });

let p = P({});
ok(SCHED.lessonOpen(p, 1, la(6, 9), TZ) && !SCHED.lessonOpen(p, 2, la(6, 9), TZ), "fresh: lesson 1 open, lesson 2 not");
p = P({ 1: la(6, 21) });
ok(!SCHED.lessonOpen(p, 2, la(6, 23, 59), TZ), "lesson 1 at 9 PM: lesson 2 still shut at 11:59 PM");
ok(!SCHED.lessonOpen(p, 2, la(7, 4, 59), TZ), "and at 4:59 AM, before the day starts");
ok(SCHED.lessonOpen(p, 2, la(7, 5, 0), TZ), "lesson 2 opens at 5:00 AM the next morning");
ok(SCHED.lessonOpen(p, 1, la(6, 22), TZ), "a retake of lesson 1 is always open");
p = P({ 1: la(7, 2) }); /* a night owl: 2 AM counts as the day before */
ok(SCHED.lessonOpen(p, 2, la(7, 6), TZ), "a lesson done at 2 AM belongs to yesterday, so the next opens at 5 AM");
p = P({ 1: la(6, 9), 2: la(7, 9) });
ok(!SCHED.lessonOpen(p, 3, la(7, 20), TZ) && SCHED.lessonOpen(p, 3, la(8, 6), TZ), "one new lesson a day, every day");
ok(!SCHED.lessonOpen(p, 4, la(9, 6), TZ), "lessons stay in order: 4 waits for 3");
p = P({ 1: la(1, 9) });
ok(SCHED.lessonOpen(p, 2, la(6, 9), TZ), "a missed week just means lesson 2 is waiting; nothing piles up");
ok(!SCHED.lessonOpen(p, 3, la(6, 9), TZ), "and only one lesson opens, not five");
p = P({ 1: la(1, 9), 2: la(2, 9), 3: la(3, 9), 4: la(4, 9), 5: la(5, 21) });
let n = SCHED.next(p, la(5, 22), TZ);
ok(n.kind === "issues" && !n.open, "door-ready at 9 PM: the issue lessons open tomorrow, not tonight");
n = SCHED.next(p, la(6, 6), TZ);
ok(n.kind === "issues" && n.open && n.left.length === 5, "next morning: any of the five issue lessons");
p.issues.oh = la(6, 7);
ok(!SCHED.issueOpen(p, "ga", la(6, 12), TZ) && SCHED.issueOpen(p, "oh", la(6, 12), TZ), "after one issue lesson today, the others wait; the done one can be redone");
ok(SCHED.issueOpen(p, "ga", la(7, 5, 30), TZ), "the next issue lesson opens the next morning");
p.issues = { ga: 1, tx: 1, oh: 1, me: 1, mi: 1 };
ok(SCHED.next(p, la(12, 9), TZ).kind === "done", "all ten: done");
/* a retake today doesn't use the day: retakes don't change the first-finish time, and only first finishes count */
p = P({ 1: la(6, 9) });
ok(!SCHED.usedToday(p, la(7, 9), TZ), "yesterday's finish doesn't use today");
/* time zones: the same instant is a different day in New York */
ok(SCHED.dayKey(Date.UTC(2026, 10, 7, 10, 30), "America/New_York") === "2026-11-07" && SCHED.dayKey(Date.UTC(2026, 10, 7, 10, 30), TZ) === "2026-11-06", "the day starts at 5 AM local: 5:30 AM in New York is Nov 7 there and 2:30 AM, still Nov 6, in Los Angeles");
/* daylight saving: the day still starts at 5 AM local (US 2027: spring forward Mar 14, fall back Nov 7) */
ok(SCHED.dayKey(Date.UTC(2027, 2, 14, 12, 30), TZ) === "2027-03-14" && SCHED.dayKey(Date.UTC(2027, 2, 14, 11, 59), TZ) === "2027-03-13", "spring forward: 5:30 AM PDT is the new day, 4:59 AM PDT isn't");
ok(SCHED.dayKey(Date.UTC(2026, 10, 1, 13, 0), TZ) === "2026-11-01" && SCHED.dayKey(Date.UTC(2026, 10, 1, 12, 59), TZ) === "2026-10-31", "fall back: 5:00 AM PST is the new day, 4:59 AM PST isn't");
console.log(`schedule: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
