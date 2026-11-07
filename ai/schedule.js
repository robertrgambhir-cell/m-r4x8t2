/* Phase 1: the one rule for when a new lesson opens, shared by the page (inlined by ai/build-phase1.py) and the reminder
   planner (ai/reminders.js), so the app and any text can never disagree.
   The rule (Nov 1 decision, made real): a learner's day starts at 5 AM local time. Each day opens one new lesson, in order:
   lessons 1 to 5 of How to canvass, then the five issue lessons in any order. A lesson opens the morning after the previous
   new lesson was finished. Retakes, practice doors and Hear it done never use the day's lesson. A missed day isn't made up.
   progress: { lessons: { "1": { at } ... "5": { at } }, issues: { ga: at, ... } } with at = first finish time in ms.
   No exports keyword on purpose: the page inlines this file as is, and node reads it through ai/schedule.mjs. */
var SCHED = (function () {
  var DAY_START_HOUR = 5, ISSUES = ["tx", "oh", "me", "mi"]; /* version 164: Georgia hidden */
  /* the learner's calendar day for a moment, with the day starting at 5 AM; tz is an IANA zone (planner) or omitted (the phone's own) */
  function dayKey(t, tz) {
    /* the local calendar date and hour of t; before 5 AM it is still the day before. Done on the local clock, not by
       subtracting hours, so the day starts at 5 AM on daylight saving days too */
    var y, m, d, h;
    if (!tz) { var x = new Date(t); y = x.getFullYear(); m = x.getMonth() + 1; d = x.getDate(); h = x.getHours(); }
    else {
      var parts = {}; new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "numeric", day: "numeric", hour: "numeric", hourCycle: "h23" }).formatToParts(new Date(t)).forEach(function (q) { parts[q.type] = q.value; });
      y = Number(parts.year); m = Number(parts.month); d = Number(parts.day); h = Number(parts.hour) % 24;
    }
    if (h < DAY_START_HOUR) { var prev = new Date(Date.UTC(y, m - 1, d) - 86400000); y = prev.getUTCFullYear(); m = prev.getUTCMonth() + 1; d = prev.getUTCDate(); }
    return y + "-" + String(m).padStart(2, "0") + "-" + String(d).padStart(2, "0");
  }
  function finishes(p) {
    var out = [], L = (p && p.lessons) || {}, I = (p && p.issues) || {};
    for (var n = 1; n <= 5; n += 1) if (L[n] && L[n].at) out.push(L[n].at);
    ISSUES.forEach(function (id) { if (I[id]) out.push(I[id]); });
    return out;
  }
  /* did this learner already finish a new lesson today? */
  function usedToday(p, now, tz) { var k = dayKey(now, tz); return finishes(p).some(function (t) { return dayKey(t, tz) === k; }); }
  /* what's next: { kind: "lesson", n, open } | { kind: "issues", open } | { kind: "done" }; open says whether it can start now */
  function next(p, now, tz) {
    var L = (p && p.lessons) || {}, I = (p && p.issues) || {}, today = dayKey(now, tz), used = usedToday(p, now, tz);
    for (var n = 1; n <= 5; n += 1) {
      if (L[n] && L[n].at) continue;
      if (n === 1) return { kind: "lesson", n: 1, open: true };
      var prev = L[n - 1] && L[n - 1].at;
      return { kind: "lesson", n: n, open: !!prev && dayKey(prev, tz) < today && !used };
    }
    var left = ISSUES.filter(function (id) { return !I[id]; });
    if (!left.length) return { kind: "done" };
    return { kind: "issues", left: left, open: dayKey(L[5].at, tz) < today && !used };
  }
  /* may lesson n (1 to 5) start now? a finished lesson always may (a retake) */
  function lessonOpen(p, n, now, tz) {
    var L = (p && p.lessons) || {};
    if (L[n] && L[n].at) return true;
    var x = next(p, now, tz);
    return x.kind === "lesson" && x.n === n && x.open;
  }
  /* may a new issue lesson start now? a finished one always may */
  function issueOpen(p, id, now, tz) {
    if (p && p.issues && p.issues[id]) return true;
    var x = next(p, now, tz);
    return x.kind === "issues" && x.open;
  }
  return { DAY_START_HOUR: DAY_START_HOUR, ISSUES: ISSUES, dayKey: dayKey, usedToday: usedToday, next: next, lessonOpen: lessonOpen, issueOpen: issueOpen };
})();
