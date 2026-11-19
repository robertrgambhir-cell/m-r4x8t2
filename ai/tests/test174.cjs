/* Version 174 checks on a built page, the way a canvasser meets it: Maya's issue trainings are Heating oil and Social
   Security; a row on Learn opens its training in the overlay; the canvasser taps through it; its last screen checks it off;
   Practice the conversation opens the door practice with the training's voter (Sarah or Linda), shut, with Knock; the
   conversation is spoken, the coach scores the four parts of the door answer; Try this conversation again and Done for
   now work; close closes. Also: the practice AI not answering, messages from anywhere but the training, the Practice tab,
   the links (?issues, ?convo), the old issue addresses, and what a practice the canvasser has left may still do (F6 to
   F11: nothing, to any door or screen that is open next).
   The AI is the real worker.js with a canned model (ai/tests/mock-server.mjs): this is plumbing, not model quality.
   Usage: (mock-server.mjs running on a copy of the site whose pages point at 127.0.0.1:8799)
   NODE_PATH=$(npm root -g) node ai/tests/test174.cjs /abs/site-root [page=wdpfxqlsvp/app.html] [outdir] [w h] */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const realFonts = require('/home/claude/work/fonts.js');
const [,, ROOT, REL = 'wdpfxqlsvp/app.html', OUT = '/tmp/t174', W = '390', H = '844'] = process.argv;
fs.mkdirSync(OUT, { recursive: true });
const END = '\nloadVoices();\nrender();\n})();\n</script>';
const HOOK = '\nloadVoices();\nrender();\nwindow.__T = { get S() { return S; }, go, render, WAI, DOORS, CAMPAIGN };\n})();\n</script>';
const src = fs.readFileSync(path.join(ROOT, REL), 'utf8');
if (!src.includes(END)) throw new Error('IIFE end not found');
const HREL = path.join(path.dirname(REL), 'zzhooked174.html');
fs.writeFileSync(path.join(ROOT, HREL), src.replace(END, HOOK));
const SITE = 'http://127.0.0.1:' + (process.env.WARMUP_SITE_PORT || 8765) + '/', PAGE = SITE + HREL, AI = 'http://127.0.0.1:' + (process.env.WARMUP_AI_PORT || 8799);
let pass = 0, fail = 0, shots = 0;
const ok = (c, m) => { if (c) pass += 1; else { fail += 1; console.log('FAIL', m); } };
const mock = async (q) => (await fetch(AI + '/__mock/' + q)).text();
const stats = async () => JSON.parse(await mock('stats'));
const tag = `${W}x${H}`, pane = Number(W) >= 1000;
const T = {
  oil: { name: 'Sarah', title: 'Heating oil', cover: /Franklin voters keep asking about heating oil at the door/, open: "I can't afford to fill my tank this winter.", rows: ['Agreed with Sarah', 'Offered the heating help', 'Gave the choice between the candidates', 'Asked for her vote'],
    say: ["That sounds really hard. Heating oil costs about 80% more than last fall.", "The state's heating help covers renters too. I can text you the link.", "Jack Dufner voted five times against ending the war before he voted to end it. Maya Kaur would end the war and send more money to LIHEAP.", "Can Maya count on your vote on Tuesday?"] },
  social: { name: 'Linda', title: 'Social Security', cover: /Franklin voters keep asking about Social Security at the door/, open: 'Is my Social Security going to run out?', rows: ['Agreed with Linda', 'Explained the cause', 'Gave the choice between the candidates', 'Asked for her vote'],
    say: ["You're right to worry. Checks get smaller, they don't stop.", "Fewer workers pay in for each person getting a check, so the trust fund runs out in late 2032.", "Jack Dufner voted for the 2025 federal law, though it gave people 65 and over a tax break. Maya Kaur would end the wage cap.", "Can Maya count on your vote?"] },
};
/* a stand-in for the phone's speech recognizer: the test says the words; nothing ends unless the page stops it */
const FAKE_SR = () => {
  class FakeSR {
    constructor() { this.continuous = false; this.interimResults = false; }
    start() { window.__sr = this; this.on = true; setTimeout(() => { if (this.onstart) this.onstart(); if (this.onaudiostart) this.onaudiostart(); }, 10); }
    stop() { if (!this.on) return; this.on = false; setTimeout(() => { if (this.onend) this.onend(); }, 400); }
    abort() { if (!this.on) return; this.on = false; setTimeout(() => { if (this.onend) this.onend(); }, 0); }
  }
  window.SpeechRecognition = FakeSR; window.webkitSpeechRecognition = FakeSR;
  window.__speak = (text) => { const r = window.__sr; if (!r || !r.onresult) return false; r.onresult({ results: { length: 1, 0: { 0: { transcript: text, confidence: 0.9 }, isFinal: false, length: 1 } }, resultIndex: 0 }); return true; };
};
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: Number(W), height: Number(H) }, hasTouch: !pane, isMobile: !pane, deviceScaleFactor: 2 });
  await ctx.addInitScript(FAKE_SR);
  const errs = [], outside = [];
  const open = async (url) => {
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errs.push(String(e)));
    p.on('request', (r) => { if (/workers\.dev|yourwarmup\.com/.test(r.url())) outside.push(r.url()); });
    await realFonts(p);
    await p.goto(url, { waitUntil: 'load', timeout: 180000 }); await p.waitForTimeout(2600); await p.evaluate(() => document.fonts.ready);
    return p;
  };
  const text = (p) => p.evaluate(() => document.body.innerText);
  const waitFor = async (p, fn, ms = 20000, arg) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn, arg).catch(() => false)) return true; await p.waitForTimeout(100); } return false; };
  const shot = async (p, name) => { shots += 1; await p.screenshot({ path: path.join(OUT, `${tag}-${String(shots).padStart(2, '0')}-${name}.png`) }); };
  const frame = (p) => p.frames().find((f) => /\/trainings\//.test(f.url()));
  /* version 173 (main, Nov 18): the score card opens as the door shuts, its parts pulsing, and fills in when the coach answers */
  const cardFilled = (p, ms = 20000) => waitFor(p, () => __T.S.screen === 'score' && !!__T.S.last && !__T.S.last.grading && !document.querySelector('.sc-list li.wait'), ms);
  const row = (p, id) => p.$(`[data-act="brief-open"][data-lesson="${id}"]`);
  const them = (p) => p.$$eval('#thread .bub.them', (xs) => xs.map((x) => x.textContent));
  const waitThem = (p, n, ms) => waitFor(p, (k) => document.querySelectorAll('#thread .bub.them').length >= k, ms, n);
  /* speak a line through the mic, as on a phone, and never tap "I'm done": the page sends it by itself */
  const speakLine = async (p, line) => {
    await waitFor(p, () => { const b0 = document.querySelector('#talk [data-act="talk"]'); return b0 && !b0.disabled && __T.S.convo && !__T.S.convo.busy; }, 25000);
    await p.click('#talk [data-act="talk"]', { force: true });
    await waitFor(p, () => !!(window.__sr && window.__sr.on && window.__sr.onresult), 5000);
    await p.waitForTimeout(150);
    await p.evaluate((t) => window.__speak(t), line);
  };
  /* tap through a training the way a canvasser would (the same taps as the trainings' own tests/walk.js) */
  const walk = async (p, fr, id, snap) => {
    const A = '.screen.is-active ';
    const S = await fr.evaluate(() => window.TRAINING.screens);
    const next = async () => { await p.waitForTimeout(450); await fr.click(A + '[data-next]:not(.hide)'); };
    let slid = 0; /* a tap that lands while a screen is still sliding in must not push the training sideways (it once scrolled 18px) */
    const side = async () => { slid = Math.max(slid, await fr.evaluate(() => Math.abs(document.getElementById('phone').scrollLeft) + Math.abs(document.scrollingElement.scrollLeft))); };
    for (let i = 0; i < S.length - 1; i += 1) {
      const s = S[i];
      if (s.type === 'count') { await fr.click(A + '.houses button:nth-child(4)'); await fr.click(A + '.check'); }
      if (s.type === 'price') { await fr.waitForSelector(A + '.range'); await fr.$eval(A + '.range', (r) => { r.value = r.max; r.dispatchEvent(new Event('input', { bubbles: true })); }); await fr.click(A + '.lock'); await p.waitForTimeout(1500); }
      if (s.type === 'pick') { await fr.click(A + `.opt[data-v="${s.right}"]`); await p.waitForTimeout(2200); }
      if (s.type === 'steps') await p.waitForTimeout(1500);
      if (s.type === 'quiz') {
        await fr.click(A + '.round.cur .opt[data-v=ok]'); await fr.click(A + '.rnext');
        await fr.click(A + '.round.cur .opt[data-v=ok]'); await fr.click(A + '.rnext');
        await fr.click(A + '.round.cur .opt[data-v=ok]');
      }
      await side();
      if (snap) { await p.waitForTimeout(500); await shot(p, `${id}-step${String(i).padStart(2, '0')}-${s.type}`); }
      await next();
    }
    await p.waitForTimeout(900);
    await side();
    return slid;
  };

  /* ---------- the source: nothing of the removed trainings is left on the page ---------- */
  ok(!/—/.test(src), 'no em dash in the page');
  ok(src.includes('briefs: ["Heating oil", "Social Security"], briefIds: ["oil", "social"]') && !/briefIds: \["(tx|ga)"/.test(src) && !/School vouchers|Your electric bill|Tariffs and auto jobs/.test(src.replace(/const ASK_ISSUES[\s\S]*?\n\];/, '')), 'the lesson list is Heating oil and Social Security; the four older issue lessons are off the page');
  ok(!/door: "bri"|bri_health|issues\/\?all'|\/wdpfxqlsvp\/train\/|"brief-done"/.test(src), "Bri's door, the old issue frame and the old trainings are gone from the page");
  ok(!/sk-ant|x-api-key|ANTHROPIC_API_KEY/.test(src), 'no key or key header in the page');
  for (const id of ['oil', 'social']) {
    const f = path.join(ROOT, 'wdpfxqlsvp', 'trainings', id + '.html');
    ok(fs.existsSync(f) && fs.readFileSync(f, 'utf8').includes(`id: '${id}'`), `the ${id} training is in wdpfxqlsvp/trainings/`);
  }
  for (const gone of ['wdpfxqlsvp/p1/issues/index.html', 'wdpfxqlsvp/dev/issues/index.html', 'wdpfxqlsvp/train/audio']) ok(!fs.existsSync(path.join(ROOT, gone)), 'removed from the site: ' + gone);

  /* ---------- A. Learn lists the two ---------- */
  let p = await open(PAGE + '?unlock&v=174');
  ok((await p.evaluate(() => __T.WAI.state())) === 'on', 'the page reaches the practice AI: ' + await p.evaluate(() => __T.WAI.state()));
  let t = await text(p);
  ok(/Seven lessons, one a day/.test(t), 'Learn says seven lessons');
  ok(/Heating oil/.test(t) && /Social Security/.test(t) && !/School vouchers|electric bill|Tariffs|Health insurance/i.test(t), 'Course 2 lists Heating oil and Social Security and nothing else');
  ok(/0 of 2 done · about six minutes each/.test(t) && /After both/.test(t), 'the counts follow: ' + (t.match(/\d of \d done[^\n]*/) || [''])[0]);
  ok(!!(await row(p, 'oil')) && !!(await row(p, 'social')) && (await p.$$('[data-act="brief-open"]')).length === 2, 'two rows, with the ids oil and social');
  ok(await p.evaluate(() => window.__wuPreview === true && window.__wuUnlock === true), 'unlock is a preview: nothing saved');
  await shot(p, 'learn');

  /* ---------- B. each training, start to finish, then its practice ---------- */
  for (const id of ['oil', 'social']) {
    const X = T[id];
    if (!(await p.evaluate(() => __T.S.screen === 'library'))) { await p.evaluate(() => __T.go('library')); await p.waitForTimeout(500); }
    await (await row(p, id)).click();
    ok(await waitFor(p, (k) => { const f = document.querySelector('#issues-ov iframe'); return f && f.src.endsWith('/wdpfxqlsvp/trainings/' + k + '.html?app=1&v=174'); }, 15000, id), `${id}: its row opens the training in the overlay`);
    await p.waitForTimeout(1500);
    let fr = frame(p);
    ok(fr && X.cover.test(await fr.evaluate(() => document.body.innerText)), `${id}: the training's cover shows inside the app`);
    ok(await p.evaluate(() => { const o = document.getElementById('issues-ov').getBoundingClientRect(), d = (document.getElementById('device') || document.body).getBoundingClientRect(); return o.width > 300 && o.left >= d.left - 1 && o.right <= d.right + 1 && o.top >= d.top - 1 && o.bottom <= d.bottom + 1; }), `${id}: the overlay sits inside the phone`);
    await shot(p, `${id}-cover`);
    /* close on the cover: back to Learn, nothing checked off */
    await fr.click('#close'); await p.waitForTimeout(500);
    ok(!(await p.$('#issues-ov')) && (await p.evaluate((k) => !__T.S.briefsDoneIds || !__T.S.briefsDoneIds[k], id)), `${id}: close on the cover closes the training and checks nothing off`);
    await (await row(p, id)).click(); await p.waitForSelector('#issues-ov iframe'); await p.waitForTimeout(1500);
    fr = frame(p);
    /* a message that doesn't come from the training is ignored */
    await p.evaluate((k) => { window.postMessage({ warmup: 'issues-done', lesson: k }, '*'); window.postMessage({ warmup: 'issues-practice', lesson: k }, '*'); window.postMessage({ warmup: 'issues-close' }, '*'); }, id); await p.waitForTimeout(500);
    ok(!!(await p.$('#issues-ov')) && (await p.evaluate((k) => !(__T.S.briefsDoneIds || {})[k] && __T.S.screen === 'library', id)), `${id}: messages from anywhere but the training do nothing`);
    const slid = await walk(p, fr, id, true); /* a screenshot of every step of both trainings */
    ok(slid === 0, `${id}: fast taps never push the training sideways inside the app: ` + slid + 'px');
    ok(/Done$/.test(await fr.$eval('#tag-screen', (e) => e.textContent)), `${id}: tapping through reaches the last screen`);
    ok(await waitFor(p, (k) => !!(__T.S.briefsDoneIds || {})[k], 5000, id), `${id}: the last screen checks the training off`);
    await shot(p, `${id}-last-screen`);
    if (id === 'oil') await mock('coach-delay?ms=4000'); /* a slow coach at Sarah's door, so the walk sees the card open and then fill in */
    const before = await stats();
    await fr.click('.screen.is-active .practice');
    ok(await waitFor(p, () => !document.getElementById('issues-ov') && __T.S.screen === 'door', 8000), `${id}: Practice the conversation closes the training and opens the door`);
    ok(await p.evaluate((k) => __T.S.drill && __T.S.drill.kind === 'aiissue' && __T.S.drill.door === k && __T.WAI.scenFor() === k, id), `${id}: it is ${X.name}'s door, scenario ${id}`);
    await p.waitForTimeout(600);
    ok(!!(await p.$('[data-act="knock"]')) && (await them(p)).length === 0 && (await stats()).voter === before.voter && (await p.evaluate(() => !__T.S.convo.knocked && document.querySelector('#screen .voter.main').classList.contains('shut'))), `${id}: the door waits shut for a knock (she hasn't said a word)`);
    ok((await p.$eval('#thread', (x) => x.textContent)).includes('Live AI voter'), `${id}: the door says the voter is the live AI`);
    ok(await p.evaluate(() => { const b0 = document.querySelector('.app.ft > .actions .btn[data-act="knock"]'), f = document.querySelector('.app.ft .frame.convo-stage'); if (!b0 || !f) return false; const r = b0.getBoundingClientRect(), q = f.getBoundingClientRect(); return r.width > 200 && r.bottom <= innerHeight && r.top > q.top; }), `${id}: Knock sits over the door picture, on screen`);
    await shot(p, `${id}-door-knock`);
    await p.click('[data-act="knock"]');
    ok(await waitThem(p, 1, 9000), `${id}: ${X.name} opens the door`);
    ok((await them(p))[0] === X.open, `${id}: her first line is the training's: ` + (await them(p))[0]);
    await p.waitForTimeout(700);
    await shot(p, `${id}-door-open`);
    for (let k = 0; k < X.say.length; k += 1) {
      await speakLine(p, X.say[k]);
      ok(await waitFor(p, (n) => document.querySelectorAll('#thread .bub.you').length >= n, 9000, k + 1), `${id}: line ${k + 1} is sent by itself after the pause`);
      if (k < X.say.length - 1) ok(await waitThem(p, k + 2, 12000), `${id}: ${X.name} answers line ${k + 1}`);
      if (k === 1) { await p.waitForTimeout(500); await shot(p, `${id}-door-talking`); }
    }
    ok(await waitFor(p, () => __T.S.screen === 'score', 30000), `${id}: she ends it and the coach scores it`);
    if (id === 'oil') { /* the coach is slow here (set before her door): the card is open and waiting on the sheet's four parts, with her picture */
      const w = await p.evaluate(() => ({ grading: !!(__T.S.last && __T.S.last.grading), rows: [...document.querySelectorAll('.sc-card.grading .sc-list li.wait')].map((x) => x.textContent), head: (document.querySelector('.sc-top.grading') || {}).textContent || '', who: (document.querySelector('.sc-voter svg, .sc-voter [aria-label]') || { getAttribute: () => '' }).getAttribute('aria-label') || '', noBack: !document.querySelector('header [data-act="back"]') }));
      ok(w.grading && w.rows.join('|') === 'Agree with Sarah|Offer the heating help|Give the choice|Ask for her vote', `${id}: the card opens while the coach reads, listing the four parts of her door answer: ` + w.rows.join(' | '));
      ok(/Checking your conversation/.test(w.head) && /Your coach is reading the conversation/.test(await text(p)), `${id}: and says the coach is reading`);
      ok((await p.$$eval('footer [data-act]', (xs) => xs.map((x) => x.dataset.act + ':' + x.textContent)).catch(() => [])).join('|') === 'coach-back:Done for now', `${id}: the waiting card of a practice has one way out, Done for now`);
      await p.waitForTimeout(500);
      await shot(p, `${id}-score-reading`);
    }
    ok(await cardFilled(p), `${id}: the card fills in when the coach answers`);
    if (id === 'oil') await mock('coach-delay?ms=0');
    await p.waitForTimeout(900);
    const sc = await p.evaluate(() => ({ rows: [...document.querySelectorAll('.sc-list li')].map((x) => x.className + ':' + x.textContent), ring: (document.querySelector('.ring-num') || {}).textContent, coach: (document.querySelector('.sc-coach') || {}).textContent || '', btns: [...document.querySelectorAll('footer .btn, footer .link')].map((x) => x.textContent), prior: !!document.querySelector('.prior-line'), scen: __T.S.last.scen, over: (() => { const c = document.querySelector('#content'); return c ? c.scrollHeight - c.clientHeight : 0; })() }));
    ok(sc.rows.length === 4 && sc.rows.every((r, k) => r === 'y:' + X.rows[k]) && sc.ring === '4/4', `${id}: the card is the four parts of the door answer: ` + sc.rows.join(' | ') + ' ' + sc.ring);
    ok(sc.scen === id && !sc.prior && !/Said your name/.test(await text(p)), `${id}: no lesson 1 rows on an issue card`);
    ok(/What worked:/.test(sc.coach) && /See your full coaching/.test(sc.coach), `${id}: the coach's words are on the card`);
    ok(sc.btns.includes('Try this conversation again') && sc.btns.includes('Done for now'), `${id}: the card offers a retry and a way out`);
    ok(sc.over <= 2, `${id}: the feedback fits without scrolling: ` + sc.over);
    await shot(p, `${id}-score`);
    await p.click('[data-act="coach-full"]'); await p.waitForTimeout(500);
    const cf = await p.evaluate(() => ({ s: __T.S.screen, rows: [...document.querySelectorAll('.cf-list li')].map((x) => x.textContent).join(' | ') }));
    ok(cf.s === 'coachfull' && /Stuck to the facts|Stick to the facts/.test(cf.rows), `${id}: the full coaching also judges sticking to the facts: ` + cf.rows.slice(0, 160));
    await shot(p, `${id}-full-coaching`);
    await p.click('footer [data-act="back"]'); await p.waitForTimeout(400);
    await p.click('[data-act="door-again"]');
    ok(await waitThem(p, 1, 9000) && !(await p.$('[data-act="knock"]')), `${id}: Try this conversation again knocks by itself`);
    await p.click('[data-act="back"]'); await p.waitForTimeout(500);
    ok(await waitFor(p, () => __T.S.screen === 'score' || __T.S.screen === 'library', 3000), `${id}: back leaves the door`);
    if (await p.evaluate(() => __T.S.screen === 'score')) { await p.click('[data-act="coach-back"]'); await p.waitForTimeout(500); }
    ok(await p.evaluate(() => __T.S.screen === 'library' && !__T.S.drill), `${id}: Done for now goes back to Learn`);
    t = await text(p);
    ok(id === 'oil' ? /1 of 2 done/.test(t) : /Done\. You.re briefed\./.test(t), `${id}: Learn counts it: ` + (t.match(/\d of \d done|Done\. You.re briefed\./) || [''])[0]);
    await shot(p, `${id}-learn-after`);
  }
  t = await text(p);
  ok(/Done\. You.re briefed\./.test(t) && /Earned/.test(t), 'with both done, Course 2 says briefed');

  /* ---------- C. the Practice tab keeps the conversations ---------- */
  await p.evaluate(() => __T.go('coach')); await p.waitForTimeout(500);
  let links = await p.$$eval('[data-act="wai-issue"]', (x) => x.map((e) => e.textContent));
  ok(links.join('|') === 'Practice the heating oil conversation with Sarah|Practice the Social Security conversation with Linda', 'the Practice tab offers both conversations once their trainings are done: ' + links.join('|'));
  ok((await p.evaluate(() => { const c = document.querySelector('#content'); return c.scrollHeight - c.clientHeight; })) <= 2, 'the Practice tab still fits');
  await shot(p, 'practice-tab');
  await p.click('[data-act="wai-issue"][data-arg="social"]');
  ok(await waitThem(p, 1, 9000) && (await them(p))[0] === T.social.open && !(await p.$('[data-act="knock"]')), "from the Practice tab, Linda's door knocks by itself (the tap was on this page)");
  await p.click('[data-act="back"]'); await p.waitForTimeout(500);
  ok(await p.evaluate(() => __T.S.screen === 'coach'), 'back from there returns to Practice');
  await p.evaluate(() => { __T.S.briefsDoneIds = {}; __T.go('coach'); }); await p.waitForTimeout(300);
  ok((await p.$$('[data-act="wai-issue"]')).length === 0, 'before a training is done, the Practice tab offers no issue conversation');
  await p.close();

  /* ---------- D. the practice AI doesn't answer ---------- */
  await mock('health?down=1');
  p = await open(PAGE + '?unlock&v=174d');
  await p.waitForTimeout(2800);
  ok((await p.evaluate(() => __T.WAI.state())) === 'down', 'with the server not ok, the page knows');
  await (await row(p, 'oil')).click(); await p.waitForSelector('#issues-ov iframe'); await p.waitForTimeout(1500);
  let fr = frame(p);
  await fr.evaluate(() => window.Lesson.show(window.Lesson.total - 1, 1)); await p.waitForTimeout(500);
  await fr.click('.screen.is-active .practice');
  ok(await waitFor(p, () => { const x = document.getElementById('toast'); return x && !x.hidden && /practice AI/.test(x.textContent); }, 9000), 'the page says the practice AI could not be reached: ' + await p.$eval('#toast', (x) => x.textContent));
  ok(await p.evaluate(() => { const x = document.getElementById('toast'), r = x.getBoundingClientRect(), top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return top === x || x.contains(top); }), 'and the message shows over the training');
  ok(!!(await p.$('#issues-ov')) && (await p.evaluate(() => __T.S.screen === 'library' && !__T.S.drill)), 'the training stays open and no door is faked');
  ok(!(await fr.evaluate(() => document.getElementById('practice-sheet').classList.contains('show'))), "inside the app the training's own preview note stays hidden");
  ok(await p.evaluate(() => !!(__T.S.briefsDoneIds || {}).oil), 'the training still counts as done');
  await shot(p, 'ai-not-reached');
  await mock('health?down=0');
  await p.waitForTimeout(3800);
  await fr.click('.screen.is-active .practice');
  ok(await waitFor(p, () => !document.getElementById('issues-ov') && __T.S.screen === 'door', 9000), 'once the server answers again, the same tap opens the door (the page asks again)');
  await p.close();

  /* ---------- E. the links ---------- */
  p = await open(PAGE + '?unlock&issues');
  ok(await waitFor(p, () => { const f = document.querySelector('#issues-ov iframe'); return f && /trainings\/oil\.html/.test(f.src); }, 6000), '?issues opens the first training not done yet');
  await p.close();
  p = await open(PAGE + '?unlock&issues=social');
  ok(await waitFor(p, () => { const f = document.querySelector('#issues-ov iframe'); return f && /trainings\/social\.html/.test(f.src); }, 6000), '?issues=social opens Social Security');
  await p.close();
  p = await open(PAGE + '?convo=oil');
  ok(await waitThem(p, 1, 12000) && (await them(p))[0] === T.oil.open, "?convo=oil opens Sarah's door for review");
  await p.close();
  p = await open(PAGE + '?unlock');
  await p.evaluate(() => __T.go('welcome')); await p.waitForTimeout(600);
  t = await text(p);
  ok(/Lesson 6 of 7 next/.test(t) && /Open Maya.s issues/.test(t), 'Today counts seven lessons: ' + (t.match(/Lesson \d of \d[^\n]*/) || [''])[0]);
  await shot(p, 'today');
  await p.click('[data-act="issues-open"]'); await p.waitForTimeout(600);
  ok(await p.evaluate(() => __T.S.screen === 'library' && !document.getElementById('issues-ov')), "Open Maya's issues on Today goes to Learn, where the two rows lead");
  await p.evaluate(() => { __T.S.briefsDoneIds = { oil: Date.now() }; __T.render(); }); await p.waitForTimeout(300);
  await p.click('.lp-cta [data-act="issues-open"]');
  ok(await waitFor(p, () => { const f = document.querySelector('#issues-ov iframe'); return f && /trainings\/social\.html/.test(f.src); }, 6000), "on Learn it opens the first training not done yet (Social Security once Heating oil is done)");
  await p.close();
  /* the old issue addresses forward to the app's issue trainings */
  const base = SITE + path.dirname(REL).split(path.sep).join('/') + '/';
  if (/wdpfxqlsvp$/.test(path.dirname(REL))) {
    for (const [old, want] of [['issues/?all', /\?issues$/], ['issues/?all&lesson=me', /\?issues=oil$/], ['train/?l=oh', /\?issues$/]]) {
      const p2 = await ctx.newPage();
      await p2.goto(base + old, { waitUntil: 'load' }); await p2.waitForTimeout(1500);
      ok(want.test(p2.url()), `the old address ${old} forwards to the app's issue trainings: ` + p2.url().replace(SITE, '/'));
      await p2.close();
    }
  }
  /* ---------- F. found by an independent review of version 174 (Nov 18) ---------- */
  /* F1. an issue practice is a whole conversation: it is not cut at lesson 1's four lines. Sarah keeps asking until she is
     asked for her vote, here on the canvasser's fifth line. */
  p = await open(PAGE + '?convo=oil');
  ok(await waitThem(p, 1, 12000), "F1: Sarah's door opens");
  { const five = [T.oil.say[0], "The state's heating help covers renters too.", 'I can text you the link.', T.oil.say[2], T.oil.say[3]];
    for (let k = 0; k < five.length; k += 1) {
      await speakLine(p, five[k]);
      await waitFor(p, (n) => document.querySelectorAll('#thread .bub.you').length >= n, 9000, k + 1);
      if (k < five.length - 1) ok(await waitThem(p, k + 2, 12000), `F1: Sarah answers line ${k + 1} of five`);
      if (k === 3) { await p.waitForTimeout(2500); ok(await p.evaluate(() => __T.S.screen === 'door' && !!__T.S.convo), 'F1: after four of the canvasser\'s lines the door is still open (it used to shut here, on her open question)'); }
    }
    ok(await waitFor(p, () => __T.S.screen === 'score', 30000), 'F1: she ends it once she is asked for her vote, on line five');
    await cardFilled(p);
    await p.waitForTimeout(700);
    ok((await p.evaluate(() => (document.querySelector('.ring-num') || {}).textContent)) === '4/4', 'F1: all four parts are credited across the five lines: ' + await p.evaluate(() => (document.querySelector('.ring-num') || {}).textContent)); }
  await p.close();

  /* F2. the practice only opens where the canvasser still is. Here the check at load fails and every later answer takes
     2.5 s: the canvasser taps Practice, gives up, closes the training and goes elsewhere. No door may open over that. */
  const slowPage = async (url) => {
    const q = await ctx.newPage();
    q.on('pageerror', (e) => errs.push(String(e)));
    q.on('request', (r) => { if (/workers\.dev|yourwarmup\.com/.test(r.url())) outside.push(r.url()); });
    await realFonts(q);
    let n = 0;
    await q.route(AI + '/health', async (route) => { n += 1; if (n === 1) { await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: false }) }); return; } await new Promise((r) => setTimeout(r, 2500)); await route.continue().catch(() => {}); });
    await q.goto(url, { waitUntil: 'load', timeout: 180000 }); await q.waitForTimeout(2600); await q.evaluate(() => document.fonts.ready);
    return q;
  };
  const tapPractice = async (q) => {
    await (await row(q, 'oil')).click(); await q.waitForSelector('#issues-ov iframe'); await q.waitForTimeout(1500);
    const f = frame(q);
    await f.evaluate(() => window.Lesson.show(window.Lesson.total - 1, 1)); await q.waitForTimeout(500);
    await f.click('.screen.is-active .practice'); await q.waitForTimeout(300);
    return f;
  };
  const quiet = (q) => q.evaluate(() => { const x = document.getElementById('toast'); return !x || x.hidden; });
  p = await slowPage(PAGE + '?unlock&v=174f');
  ok((await p.evaluate(() => __T.WAI.state())) === 'down', 'F2: the first check failed, so the tap has to ask the server again');
  fr = await tapPractice(p);
  await fr.click('#close');
  ok(await waitFor(p, () => !document.getElementById('issues-ov'), 3000), 'F2: the canvasser closes the training while the server is still answering');
  await p.evaluate(() => __T.go('welcome'));
  await p.waitForTimeout(4200);
  ok(await p.evaluate(() => __T.S.screen === 'welcome' && !__T.S.drill) && (await quiet(p)), 'F2: the answer comes back and nothing opens over Today: ' + await p.evaluate(() => __T.S.screen));
  await p.close();
  p = await slowPage(PAGE + '?unlock&v=174h'); /* a fresh page: the first one has heard from the server by now */
  fr = await tapPractice(p);
  await fr.click('#close');
  await waitFor(p, () => !document.getElementById('issues-ov'), 3000);
  await p.waitForTimeout(4200);
  ok(await p.evaluate(() => __T.S.screen === 'library' && !__T.S.drill && !document.getElementById('issues-ov')) && (await quiet(p)), 'F2: closed and still on Learn: no door opens either');
  await p.close();
  /* F3. the Practice tab lists a finished training's conversation even though the first check failed; the tap asks again */
  p = await slowPage(PAGE + '?unlock&v=174i');
  ok((await p.evaluate(() => __T.WAI.state())) === 'down', 'F3: the first check failed');
  await p.evaluate(() => { __T.S.briefsDoneIds = { oil: Date.now() }; __T.go('coach'); }); await p.waitForTimeout(400);
  ok(!!(await p.$('[data-act="wai-issue"][data-arg="oil"]')), 'F3: the Practice tab offers the conversation though the check at load failed');
  await p.click('[data-act="wai-issue"][data-arg="oil"]');
  ok(await waitFor(p, () => __T.S.screen === 'door' && __T.S.drill && __T.S.drill.door === 'oil', 9000) && await waitThem(p, 1, 9000), 'F3: the tap asks the server again and the door opens');
  await p.close();

  /* F4. leaving an issue door between the knock and her first line: she says nothing on the next screen */
  p = await open(PAGE + '?unlock&v=174g');
  await p.evaluate(() => __T.WAI.startIssue('oil', { knock: true, back: 'library' }));
  ok(await waitFor(p, () => __T.S.screen === 'door' && !!document.querySelector('[data-act="knock"]'), 9000), 'F4: the door waits for a knock');
  await p.click('[data-act="knock"]'); await p.waitForTimeout(250);
  await p.evaluate(() => __T.go('library'));
  await p.waitForTimeout(3200);
  ok(await p.evaluate(() => __T.S.screen === 'library' && !(__T.S.convo && __T.S.convo.turns.some((x) => x.who === 'them')) && !document.querySelector('#thread .bub.them')), 'F4: knock, then straight back to Learn: Sarah says nothing there');
  await p.close();

  /* F5. on a laptop, the presenter guide keeps the practice after an issue training at its issues stop (7), not at Practice (8) */
  if (pane) {
    p = await open(PAGE + '?unlock&guide');
    await p.evaluate(() => __T.WAI.startIssue('oil', { knock: true, back: 'library' }));
    await waitFor(p, () => __T.S.screen === 'door', 9000); await p.waitForTimeout(700);
    const stop = await p.evaluate(() => { const b0 = document.querySelector('#gpath [aria-current="step"]'); return b0 ? b0.dataset.g : 'no guide'; });
    ok(stop === '7', 'F5: the guide stays on stop 7 while the issue practice is open: ' + stop);
    await p.close();
  }

  /* F6. (on main's Version 173 card) the canvasser leaves an issue practice's card while the coach is still reading. The
     grade that comes back later is not a lesson's result: the canvassing record stays as it was, and no waiting card is
     left behind. */
  await mock('coach-delay?ms=5000');
  p = await open(PAGE + '?unlock&v=174k');
  { const snap = () => p.evaluate(() => JSON.stringify([__T.S.done5, __T.S.best5, __T.S.doneAt, __T.S.sessions, __T.S.first5, __T.S.lesson, __T.S.doorsN || 0]));
    const before6 = await snap(), last6 = await p.evaluate(() => JSON.stringify(__T.S.last || null));
    await p.evaluate(() => __T.WAI.startIssue('oil', { back: 'library' }));
    ok(await waitThem(p, 1, 12000), "F6: Sarah's door opens");
    for (let k = 0; k < T.oil.say.length; k += 1) { await speakLine(p, T.oil.say[k]); await waitFor(p, (n) => document.querySelectorAll('#thread .bub.you').length >= n, 9000, k + 1); if (k < T.oil.say.length - 1) await waitThem(p, k + 2, 12000); }
    ok(await waitFor(p, () => __T.S.screen === 'score' && !!__T.S.last && __T.S.last.grading === true, 30000), 'F6: the card is open and the coach is still reading');
    await p.click('footer [data-act="coach-back"]'); /* Done for now, on the waiting card */
    ok(await waitFor(p, () => __T.S.screen === 'library' && !__T.S.drill, 3000), 'F6: Done for now on the waiting card goes back to Learn');
    await p.waitForTimeout(7500); /* the slow coach answers in here */
    ok((await snap()) === before6, 'F6: the grade that came back after the canvasser left is not saved as a lesson result');
    ok((await p.evaluate(() => JSON.stringify(__T.S.last || null))) === last6, 'F6: and the last result is what it was before the practice (no waiting card left behind): ' + (await p.evaluate(() => JSON.stringify(__T.S.last || null))).slice(0, 80));
    ok(await p.evaluate(() => __T.S.screen === 'library' && !__T.S.drill), 'F6: the canvasser is still on Learn'); }
  await mock('coach-delay?ms=0');
  await p.close();

  /* F7. a goodbye still playing from an issue practice the canvasser left must not end the next one. After a first try:
     Try this conversation again, talk, leave with the back arrow while Sarah is saying goodbye, and tap Try this
     conversation again once more. The old goodbye used to shut the new door with "no score". */
  p = await open(PAGE + '?convo=oil');
  ok(await waitThem(p, 1, 12000), "F7: Sarah's door opens");
  { const talkAll = async (stopAtBye, from = 0) => { for (let k = from; k < T.oil.say.length; k += 1) { await speakLine(p, T.oil.say[k]); await waitFor(p, (n) => document.querySelectorAll('#thread .bub.you').length >= n, 9000, k + 1); if (k < T.oil.say.length - 1) await waitThem(p, k + 2, 12000); } if (stopAtBye) await waitThem(p, T.oil.say.length + 1, 12000); };
    await talkAll(false);
    ok(await cardFilled(p, 30000), 'F7: the first try is scored');
    await p.click('[data-act="door-again"]');
    ok(await waitThem(p, 1, 9000), 'F7: the second door opens');
    await talkAll(true); /* her goodbye has started (its words are on screen) and its sound is still playing */
    const left = await p.evaluate(() => { const b0 = document.querySelector('header [data-act="back"]'); if (!b0) return 'no back arrow'; b0.click(); const again = document.querySelector('[data-act="door-again"]'); if (!again) return 'no retry button on ' + __T.S.screen; again.click(); return 'ok'; });
    ok(left === 'ok', 'F7: back during her goodbye returns to the first card, and Try this conversation again opens a third door: ' + left);
    const conv3 = await p.evaluate(() => { window.__c3 = __T.S.convo; return !!window.__c3; });
    ok(conv3 && await waitThem(p, 1, 9000), 'F7: the third door opens and Sarah says her first line');
    await p.waitForTimeout(4500); /* the second door's goodbye has finished playing by now */
    ok(await p.evaluate(() => __T.S.screen === 'door' && __T.S.convo === window.__c3 && !__T.S.convo.ended && !__T.S.convo.finishing), 'F7: the old goodbye does nothing to the new conversation: ' + await p.evaluate(() => JSON.stringify({ screen: __T.S.screen, same: __T.S.convo === window.__c3, ended: !!(__T.S.convo && __T.S.convo.ended) })));
    await speakLine(p, T.oil.say[0]);
    ok(await waitThem(p, 2, 12000), 'F7: and the new conversation goes on');

    /* F8 to F11 were found by the fifth independent reader: what an issue practice leaves running when the canvasser leaves
       it (her goodbye, her door's shutting timer, her knock, a failed grade) must do nothing to the door or the screen that
       is open next. The taps are timed inside the page, so a busy test machine cannot move them. Each of the four fails on
       the pages from before the fix.

       F8. the 1.3 s an issue door takes to shut after her goodbye belongs to that door only. Finish the third door's
       conversation, then tap back and Try this conversation again while the door is shutting: the old timer used to shut
       the new door with a false "no score" card. */
    await talkAll(false, 1);
    const taps8 = await p.evaluate(() => new Promise((res) => {
      const t0 = Date.now();
      const tick = () => {
        const c = __T.S.convo;
        if (__T.S.screen === 'door' && c && c.ended) { /* her goodbye has finished: the door is shutting */
          setTimeout(() => {
            const b0 = document.querySelector('header [data-act="back"]'); if (!b0) { res('no back arrow on ' + __T.S.screen); return; }
            b0.click();
            setTimeout(() => { const again = document.querySelector('[data-act="door-again"]'); if (!again) { res('no retry button on ' + __T.S.screen); return; } again.click(); window.__c4 = __T.S.convo; res('ok'); }, 400);
          }, 150);
          return;
        }
        if (Date.now() - t0 > 30000) { res('her goodbye never finished (' + __T.S.screen + ')'); return; }
        setTimeout(tick, 20);
      };
      tick();
    }));
    ok(taps8 === 'ok', 'F8: back and Try this conversation again while the door is shutting: ' + taps8);
    await p.waitForTimeout(4000); /* the old door's 1.3 s are long over */
    const d8 = await p.evaluate(() => ({ screen: __T.S.screen, same: __T.S.convo === window.__c4, ended: !!(__T.S.convo && __T.S.convo.ended), finishing: !!(__T.S.convo && __T.S.convo.finishing), bubbles: document.querySelectorAll('#thread .bub.them').length }));
    ok(d8.screen === 'door' && d8.same && !d8.ended && !d8.finishing && d8.bubbles === 1, "F8: the old door's timer does not shut the new door: " + JSON.stringify(d8));
    if (d8.screen === 'door') { await speakLine(p, T.oil.say[0]); ok(await waitThem(p, 2, 12000), 'F8: and the new conversation goes on'); } else ok(false, 'F8: and the new conversation goes on (no door is open)');

    /* F9. a knock still on its way from a door the canvasser left must not land on the next one. From the card: Try this
       conversation again, back before Sarah has said her first line, and Try this conversation again once more. She used
       to say her first line twice, and the door then stopped answering. */
    if (await p.evaluate(() => __T.S.screen === 'door')) await p.click('header [data-act="back"]');
    ok(await waitFor(p, () => __T.S.screen === 'score' && !!document.querySelector('[data-act="door-again"]'), 3000), 'F9: back from the door returns to the card');
    await p.waitForTimeout(400);
    const taps9 = await p.evaluate(() => new Promise((res) => {
      const first = document.querySelector('[data-act="door-again"]'); if (!first) { res('no retry button on ' + __T.S.screen); return; }
      first.click(); /* this door knocks by itself 0.38 s from now */
      setTimeout(() => {
        const b0 = document.querySelector('header [data-act="back"]'); if (!b0) { res('no back arrow on ' + __T.S.screen); return; }
        b0.click();
        setTimeout(() => { const again = document.querySelector('[data-act="door-again"]'); if (!again) { res('no retry button on ' + __T.S.screen); return; } again.click(); window.__c5 = __T.S.convo; res('ok'); }, 150);
      }, 450);
    }));
    ok(taps9 === 'ok', 'F9: Try this conversation again, back after the knock, Try this conversation again: ' + taps9);
    await p.waitForTimeout(4500);
    const d9 = await p.evaluate(() => ({ screen: __T.S.screen, same: __T.S.convo === window.__c5, bubbles: document.querySelectorAll('#thread .bub.them').length, turns: ((__T.S.convo && __T.S.convo.turns) || []).filter((x) => x.who === 'them').length, busy: !!(__T.S.convo && __T.S.convo.busy), ended: !!(__T.S.convo && __T.S.convo.ended) }));
    ok(d9.screen === 'door' && d9.same && d9.bubbles === 1 && d9.turns === 1 && !d9.busy && !d9.ended, 'F9: the door that is open now knocked once and Sarah says her first line once: ' + JSON.stringify(d9));
    if (d9.screen === 'door') { await speakLine(p, T.oil.say[0]); ok(await waitThem(p, d9.bubbles + 1, 12000) && !(await p.$('[data-act="wai-retry"]')), 'F9: and she answers the canvasser (the door has not stopped answering)'); } else ok(false, 'F9: and she answers the canvasser (no door is open)'); }
  await p.close();

  /* F10. Sarah's goodbye still playing must not touch a door of ANOTHER kind either. From the Practice tab: her
     conversation, back while she is saying goodbye, then the tab's own Knock, a canvassing practice door. Her goodbye used
     to shut that door with a 0 of 4 card and count it as a practice door knocked. */
  p = await open(PAGE + '?learn&ready&v=174m');
  await p.evaluate(() => { __T.S.briefsDoneIds = { oil: Date.now() }; __T.go('coach'); }); await p.waitForTimeout(400);
  ok(!!(await p.$('[data-act="wai-issue"][data-arg="oil"]')) && !!(await p.$('[data-act="knock-start"]')), "F10: the Practice tab has Sarah's conversation and its own Knock");
  { const saved10 = () => p.evaluate(() => JSON.stringify([__T.S.done5, __T.S.best5, __T.S.doneAt, __T.S.sessions, __T.S.first5, __T.S.doorsN || 0, __T.S.practDays || [], __T.S.p1Retakes || {}]));
    const before10 = await saved10();
    await p.click('[data-act="wai-issue"][data-arg="oil"]');
    ok(await waitThem(p, 1, 12000), "F10: Sarah's door opens");
    for (let k = 0; k < T.oil.say.length; k += 1) { await speakLine(p, T.oil.say[k]); await waitFor(p, (n) => document.querySelectorAll('#thread .bub.you').length >= n, 9000, k + 1); if (k < T.oil.say.length - 1) await waitThem(p, k + 2, 12000); }
    await waitThem(p, T.oil.say.length + 1, 12000); /* her goodbye has started (its words are on screen) and its sound is still playing */
    const taps10 = await p.evaluate(() => new Promise((res) => {
      const b0 = document.querySelector('header [data-act="back"]'); if (!b0) { res('no back arrow on ' + __T.S.screen); return; }
      b0.click();
      const mid = __T.S.screen;
      setTimeout(() => { const k0 = document.querySelector('[data-act="knock-start"]'); if (!k0) { res('no Knock on ' + __T.S.screen); return; } k0.click(); window.__c10 = __T.S.convo; res(mid + ' > ' + __T.S.screen + ' ' + (__T.S.drill ? __T.S.drill.kind : 'no drill')); }, 250);
    }));
    ok(taps10 === 'coach > door knock', 'F10: back during her goodbye returns to the Practice tab, and Knock opens a canvassing practice door: ' + taps10);
    await p.waitForTimeout(4500); /* Sarah's goodbye, and the 1.3 s her door would take to shut, are over by now */
    const d10 = await p.evaluate(() => ({ screen: __T.S.screen, kind: __T.S.drill ? __T.S.drill.kind : null, same: __T.S.convo === window.__c10, ended: !!(__T.S.convo && __T.S.convo.ended), finishing: !!(__T.S.convo && __T.S.convo.finishing), bubbles: document.querySelectorAll('#thread .bub.them').length, last: __T.S.last ? (__T.S.last.who || 'a card') : null }));
    ok(d10.screen === 'door' && d10.kind === 'knock' && d10.same && !d10.ended && !d10.finishing && d10.bubbles === 1 && d10.last === null, "F10: Sarah's goodbye does nothing to the canvassing door (open, its own voter's first line, no card): " + JSON.stringify(d10));
    ok((await saved10()) === before10, 'F10: and nothing is saved for it (no lesson result, no practice door counted)'); }
  await p.close();

  /* F11. the grade of an issue practice the canvasser has left FAILS later (here the server's own "timeout", after Done
     for now). Nobody is waiting for it: no message on the screen that is open now, and the conversation is not sent to the
     coach a second time. */
  p = await open(PAGE + '?unlock&v=174n');
  { let gate11 = null, coach11 = 0;
    await p.route(AI + '/coach', async (route) => {
      coach11 += 1;
      if (coach11 === 1) { await new Promise((r) => { gate11 = r; }); await route.fulfill({ status: 504, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ error: 'timeout' }) }); return; }
      await route.continue();
    });
    const last11 = await p.evaluate(() => JSON.stringify(__T.S.last || null));
    await p.evaluate(() => __T.WAI.startIssue('oil', { back: 'library' }));
    ok(await waitThem(p, 1, 12000), "F11: Sarah's door opens");
    for (let k = 0; k < T.oil.say.length; k += 1) { await speakLine(p, T.oil.say[k]); await waitFor(p, (n) => document.querySelectorAll('#thread .bub.you').length >= n, 9000, k + 1); if (k < T.oil.say.length - 1) await waitThem(p, k + 2, 12000); }
    ok(await waitFor(p, () => __T.S.screen === 'score' && !!__T.S.last && __T.S.last.grading === true, 30000), 'F11: the card is open and the coach is still reading');
    for (let k = 0; k < 50 && !gate11; k += 1) await p.waitForTimeout(100);
    ok(coach11 === 1 && !!gate11, 'F11: one request is with the coach: ' + coach11);
    await p.click('footer [data-act="coach-back"]'); /* Done for now, on the waiting card */
    ok(await waitFor(p, () => __T.S.screen === 'library' && !__T.S.drill, 3000), 'F11: Done for now goes back to Learn');
    await p.waitForTimeout(600);
    if (gate11) gate11(); /* the coach's answer arrives now, and it is a failure */
    let toast11 = '';
    for (let k = 0; k < 45 && !toast11; k += 1) { toast11 = await p.evaluate(() => { const x = document.getElementById('toast'); return x && !x.hidden ? x.textContent : ''; }); await p.waitForTimeout(100); }
    ok(toast11 === '', 'F11: no message appears on Learn about a coach nobody is waiting for: ' + toast11);
    ok(coach11 === 1, 'F11: and the conversation is not sent to the coach a second time: ' + coach11 + ' requests');
    ok(await p.evaluate(() => __T.S.screen === 'library' && !__T.S.drill) && (await p.evaluate(() => JSON.stringify(__T.S.last || null))) === last11, 'F11: the canvasser is still on Learn and no card is left behind');
    await p.unroute(AI + '/coach'); }
  await p.close();

  ok(errs.length === 0, 'no page errors: ' + errs.join(' | '));
  ok(outside.length === 0, 'nothing reached the live site or the live AI server: ' + [...new Set(outside)].join(' '));
  await b.close();
  console.log(`v174 ${REL} ${tag}: ${pass} pass, ${fail} fail (${shots} screenshots in ${OUT})`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('test174 stopped:', e); process.exit(1); });
