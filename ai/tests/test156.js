/* Version 156 (staging) UI checks: the live AI voter and coach inside the real app, against the real worker.js with a canned
   model (ai/tests/mock-server.mjs). This is plumbing, not model quality: turns reach the server and come back, the conversation
   runs past the old two-line cutoff, the voter ends it, failures say so and retry, the coach's rows and words land on the score
   card, the full coaching screen, the issue conversation, Type instead, and the page with no server stays the scripted app.
   Usage: NODE_PATH=$(npm root -g) node test156.js /abs/site-root /abs/nourl.html /abs/outdir [w h]
   (start the mock first: node ai/tests/mock-server.mjs /abs/site-root) */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const realFonts = require('/home/claude/work/fonts.js');
const [,, ROOT, NOURL, OUT, W = '402', H = '713'] = process.argv;
fs.mkdirSync(OUT, { recursive: true });
const END = '\nloadVoices();\nrender();\n})();\n</script>';
const HOOK = '\nloadVoices();\nrender();\nwindow.__T = { get S() { return S; }, go, render, WAI, DOORS };\n})();\n</script>';
const stagingDir = path.join(ROOT, 'wdpfxqlsvp', 'staging');
const src = fs.readFileSync(path.join(stagingDir, 'index.html'), 'utf8');
if (!src.includes(END)) throw new Error('IIFE end not found');
fs.writeFileSync(path.join(stagingDir, 'zzhooked156.html'), src.replace(END, HOOK));
const nsrc = fs.readFileSync(NOURL, 'utf8');
fs.writeFileSync(path.join(stagingDir, 'zznourl156.html'), nsrc.replace(END, HOOK));
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass += 1; else { fail += 1; console.log('FAIL', m); } };
const BASE = 'http://127.0.0.1:8765/wdpfxqlsvp/staging/';
const mock = async (q) => (await fetch('http://127.0.0.1:8799/__mock/' + q)).text();
const stats = async () => JSON.parse(await mock('stats'));
(async () => {
  const b = await chromium.launch();
  const pane = Number(W) >= 1000, tag = `${W}x${H}`;
  const ctx = await b.newContext({ viewport: { width: Number(W), height: Number(H) }, hasTouch: !pane, isMobile: !pane, deviceScaleFactor: 1 });
  const errs = [];
  ok(!/—/.test(src) && !/—/.test(nsrc), 'no em dashes in either page');
  ok(!/sk-ant|x-api-key|ANTHROPIC_API_KEY/.test(src), 'no key or key header in the page');
  const open = async (file, q) => { const p = await ctx.newPage(); p.on('pageerror', (e) => { const m = String(e); if (!/start is not defined|onHasParentDirectory|addRow is not defined/.test(m)) errs.push(m); }); await realFonts(p); await p.goto(BASE + file + q, { waitUntil: 'domcontentloaded', timeout: 180000 }); await p.waitForTimeout(1800); await p.evaluate(() => document.fonts.ready); return p; };
  const them = (p) => p.$$eval('#thread .bub.them', (xs) => xs.map((x) => x.textContent));
  const waitThem = async (p, n, ms = 15000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if ((await them(p)).length >= n) return true; await p.waitForTimeout(150); } return false; };
  const waitFor = async (p, fn, ms = 20000, arg) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn, arg)) return true; await p.waitForTimeout(200); } return false; };
  let typed = false;
  const say = async (p, text, twice) => {
    if (await p.$('#talk .wai-type')) { await p.click('#talk .wai-type'); typed = true; }
    await waitFor(p, () => { const s = document.querySelector('#say'); return s && !s.disabled; }, 15000);
    await p.evaluate((t) => { const s = document.querySelector('#say'); s.readOnly = false; s.value = t; }, text);
    await p.evaluate((tw) => { const btn = document.querySelector('#talk-tray [data-act="send"]'); btn.click(); if (tw) btn.click(); }, !!twice);
  };
  const fits = (p) => p.evaluate(() => { const c = document.querySelector('#content'); return c ? c.scrollHeight - c.clientHeight : 0; });

  /* A. lesson 1's 2nd try, Kevin, as a live conversation */
  let p = await open('zzhooked156.html', '?convo=kevin');
  ok((await p.evaluate(() => __T.WAI.state())) === 'on', 'the page reaches the worker: ' + await p.evaluate(() => __T.WAI.state()));
  ok((await p.evaluate(() => __T.S.screen)) === 'door', 'convo=kevin opens lesson 1' + "'" + 's 2nd try');
  await p.click('[data-act="knock"]');
  ok(await waitThem(p, 1), 'Kevin opens the door');
  ok((await p.$eval('#thread', (t) => t.textContent)).includes('Live AI voter'), 'the door says the voter is the live AI');
  const s0 = await stats();
  await say(p, "Hi, I'm Sam. I live a few blocks over and I'm volunteering for Maya Kaur.", true);
  ok(await waitThem(p, 2), 'Kevin answers turn 1');
  ok((await them(p))[1] === "Oh, hey. Yeah, I'm voting for her.", 'turn 1 came from the server: ' + (await them(p))[1]);
  ok((await stats()).voter - s0.voter === 1, 'a double tap on send makes one call, not two: ' + ((await stats()).voter - s0.voter));
  ok((await p.$$eval('#thread .bub.you', (x) => x.length)) === 1, 'a double tap adds one bubble');
  const ty = await p.evaluate(() => ({ mic: typeof pageMic === 'function' ? null : null, mode: !!__T.S.typeMode }));
  if (typed) { await waitFor(p, () => { const s = document.querySelector('#say'); return s && !s.disabled; }, 15000); ok(ty.mode && (await p.evaluate(() => !document.querySelector('#say').readOnly)), 'Type instead keeps the box open for typing on the next turn'); }
  else console.log('note: this browser has no page mic, so Type instead was not offered (expected in headless Chromium without speech recognition)');
  await say(p, 'Great! Election Day is Tuesday, so I wanted to check in.');
  ok(await waitThem(p, 3), 'Kevin answers turn 2, past the old two-line cutoff');
  ok((await p.evaluate(() => __T.S.screen)) === 'door' && !(await p.evaluate(() => __T.S.convo.ended)), 'the conversation keeps going after two lines');
  await mock('fail?voter=1');
  await say(p, "Honestly I'm not sure, but I can find out for you.");
  ok(await waitFor(p, () => !!document.querySelector('#thread .wai-err')), 'a failed answer says so on the door');
  ok((await them(p)).length === 3, 'no scripted line slips in when the AI fails');
  ok(/Try again/.test(await p.$eval('#thread .wai-err', (x) => x.textContent)), 'the failure offers Try again');
  await p.screenshot({ path: path.join(OUT, `a-fail-${tag}.png`) });
  await p.click('#thread .wai-err [data-act="wai-retry"]');
  ok(await waitThem(p, 4), 'Try again gets the same turn answered');
  await p.screenshot({ path: path.join(OUT, `a-door-${tag}.png`) });
  await say(p, 'Good luck with your call, thanks so much. Bye!');
  ok(await waitFor(p, () => __T.S.screen === 'score', 25000), 'the voter ends it and the coach scores it');
  await p.waitForTimeout(700);
  const sc = await p.evaluate(() => ({ rows: [...document.querySelectorAll('.sc-list li')].map((x) => x.className + ':' + x.textContent), coach: (document.querySelector('.sc-coach') || {}).textContent || '', ring: (document.querySelector('.ring-num') || {}).textContent, turns: (__T.S.last.turns || []).length, scen: __T.S.last.scen }));
  ok(sc.rows.length === 4 && sc.ring === '4/4', 'the card shows the coach' + "'" + 's four rows: ' + sc.rows.join(' | ') + ' ' + sc.ring);
  ok(/What worked:/.test(sc.coach) && /Try next:/.test(sc.coach) && /See your full coaching/.test(sc.coach), 'the card carries What worked, Try next and the full coaching: ' + sc.coach);
  ok(sc.turns === 9 && sc.scen === 'kevin_intro', 'the whole conversation was kept for the coach: ' + sc.turns);
  ok((await fits(p)) <= 2, 'the feedback fits without scrolling: ' + await fits(p));
  await p.screenshot({ path: path.join(OUT, `a-score-${tag}.png`) });
  await p.click('[data-act="coach-full"]');
  await p.waitForTimeout(500);
  const cf = await p.evaluate(() => ({ s: __T.S.screen, rows: document.querySelectorAll('.cf-list li').length, tr: document.querySelectorAll('.cf-t').length, src: (document.querySelector('.cf-src') || {}).textContent }));
  ok(cf.s === 'coachfull' && cf.rows >= 6 && cf.tr === 9 && /AI/.test(cf.src || ''), 'the full coaching lists every row and the transcript: ' + JSON.stringify(cf));
  await p.evaluate(() => { const d = document.querySelector('.cf-tr'); if (d) d.open = true; });
  await p.screenshot({ path: path.join(OUT, `a-full-${tag}.png`), fullPage: false });
  await p.click('footer [data-act="back"]');
  await p.waitForTimeout(400);
  ok((await p.evaluate(() => __T.S.screen)) === 'score', 'back returns to the feedback');
  /* B. the coach fails twice: an honest label, then the coaching on a tap */
  await p.evaluate(() => __T.go('door')); /* a 4 of 4 card offers only Finish, so open the door again directly */
  await p.waitForTimeout(600);
  if (await p.$('[data-act="knock"]')) await p.click('[data-act="knock"]');
  ok(await waitThem(p, 1), 'Retry opens the door again');
  await mock('fail?coach=2');
  await say(p, "Hi, I'm Sam with Maya Kaur. Bye!");
  ok(await waitThem(p, 2), 'Kevin answers');
  if (!(await p.evaluate(() => __T.S.convo.ended))) await p.evaluate(() => document.querySelector('[data-act="end-convo"]') ? document.querySelector('[data-act="end-convo"]').click() : null);
  if (!(await waitFor(p, () => __T.S.screen === 'score', 8000))) { await say(p, 'Thanks, bye now!'); await waitFor(p, () => __T.S.screen === 'score', 20000); }
  await p.waitForTimeout(600);
  const warn = await p.evaluate(() => (document.querySelector('.sc-coach.warn') || {}).textContent || '');
  ok(/quick word check, not the coach/.test(warn), 'when the coach is down the card says the rows are a word check: ' + warn);
  await p.screenshot({ path: path.join(OUT, `b-warn-${tag}.png`) });
  await p.click('[data-act="coach-retry"]');
  ok(await waitFor(p, () => /What worked:|Try next:/.test((document.querySelector('.sc-coach') || {}).textContent || '')), 'Get the coaching brings the coach' + "'" + 's words');
  /* E. the 1st try's line is coached by the server */
  const ft = await p.evaluate(async () => { const r = await __T.WAI.firstTry("Hi, I'm Sam! I'm volunteering for Maya Kaur. Election Day is Tuesday."); return { level: r[0], hits: r[1].hits, coach: !!r[1].coach }; });
  ok(ft.coach && ft.hits.length === 4 && ft.level === 'strong', 'the 1st try goes to the coach: ' + JSON.stringify(ft));
  await p.close();

  /* C. the issue conversation, Bri */
  p = await open('zzhooked156.html', '?convo=bri');
  ok(await waitThem(p, 1), 'Bri asks her question');
  ok((await them(p))[0] === 'Hi. Can I help you?' && (await p.$eval('#thread', (t) => t.textContent)).includes('Live AI voter'), 'Bri' + "'" + 's door is the live AI and she opens like anyone would');
  await say(p, "Hi, I'm Sam with Maya Kaur. You're one of about 200,000 people who make too much for Medicaid but can't afford a plan.");
  ok(await waitThem(p, 2), 'Bri answers turn 1');
  await say(p, 'Maya will push for full Medicaid expansion. Her opponent wants a smaller plan with work hours.');
  ok(await waitThem(p, 3), 'Bri answers turn 2');
  await say(p, 'Thanks so much, bye!');
  ok(await waitFor(p, () => __T.S.screen === 'score', 25000), 'Bri' + "'" + 's conversation is coached');
  await p.waitForTimeout(600);
  const bs = await p.evaluate(() => ({ rows: document.querySelectorAll('.sc-list li').length, ring: (document.querySelector('.ring-num') || {}).textContent, btns: [...document.querySelectorAll('footer .btn, footer .link')].map((x) => x.textContent), prior: !!document.querySelector('.prior-line') }));
  ok(bs.rows === 4 && /\/4$/.test(bs.ring || '') && !bs.prior && !(await p.evaluate(() => /Said your name/.test(document.body.innerText))), 'Bri' + "'" + 's card has her four rows (the three things and the facts), no lesson 1 rows: ' + JSON.stringify(bs));
  ok(bs.btns.includes('Try this conversation again') && bs.btns.includes('Done for now'), 'Bri' + "'" + 's card offers a retry and a way out');
  ok((await fits(p)) <= 2, 'Bri' + "'" + 's feedback fits: ' + await fits(p));
  await p.screenshot({ path: path.join(OUT, `c-bri-score-${tag}.png`) });
  await p.click('[data-act="door-again"]');
  ok(await waitThem(p, 1), 'Try this conversation again knocks again');
  await p.click('[data-act="back"]').catch(() => {});
  await p.waitForTimeout(400);
  /* F. the Practice tab offers Bri only after lesson 6 */
  const link = await p.evaluate(() => { const S = __T.S; S.drill = null; S.done5 = { 1: [true, true, true, true] }; S.briefsDoneIds = {}; __T.go('coach'); const a = !!document.querySelector('[data-act="wai-issue"]'); S.briefsDoneIds = { ga: Date.now() }; __T.render(); const b2 = !!document.querySelector('[data-act="wai-issue"]'); return { a, b: b2 }; });
  ok(link.b && !link.a, 'the Practice tab offers the health insurance conversation after lesson 6, not before: ' + JSON.stringify(link));
  await p.close();

  /* G. with the server on, a door that isn't an AI scenario (lesson 2) runs as in 155: no false Claude toast */
  p = await open('zzhooked156.html', '?convo=kevin');
  await p.evaluate(() => { const S = __T.S; S.lesson = 2; S.done5 = { 1: [true, true, true, true] }; __T.go('door'); });
  await p.waitForTimeout(600);
  if (await p.$('[data-act="knock"]')) await p.click('[data-act="knock"]');
  await waitThem(p, 1);
  await say(p, "Hi, I'm Sam with Maya Kaur. What issues matter most to you?");
  await p.waitForTimeout(2500);
  const body2 = await p.evaluate(() => document.body.innerText);
  ok(!/didn.t answer in time|scripted voter took over/.test(body2) && (await p.evaluate(() => __T.S.convo.mode)) === 'scripted', 'lesson 2' + "'" + 's door stays scripted with no false toast while the AI is on');
  await p.close();
  /* H. a slow health check that comes back not ok: the door waits for it and runs labeled as scripted */
  await mock('health?down=1');
  p = await open('zzhooked156.html', '?convo=kevin');
  await p.click('[data-act="knock"]');
  ok(await waitThem(p, 1, 9000), 'Kevin opens after the slow check');
  ok((await p.$eval('#thread', (t) => t.textContent)).includes('Scripted voter') && (await p.evaluate(() => __T.S.convo.wai === false)), 'a server that says not ok means a labeled scripted door, never AI on a guess');
  await p.close();
  p = await open('zzhooked156.html', '?convo=bri');
  await p.waitForTimeout(3500);
  ok((await p.evaluate(() => __T.S.screen)) !== 'door' || !(await p.evaluate(() => __T.S.drill && __T.S.drill.kind === 'aiissue')), 'Bri' + "'" + 's conversation refuses to start without the AI');
  await p.close();
  await mock('health?down=0');

  /* D. no server: the scripted app, labeled */
  p = await open('zznourl156.html', '?convo=kevin');
  ok((await p.evaluate(() => __T.WAI.state())) === 'off', 'without a server the engine is off');
  await p.click('[data-act="knock"]');
  ok(await waitThem(p, 1), 'Kevin opens the door (scripted)');
  ok((await p.$eval('#thread', (t) => t.textContent)).includes('Scripted voter'), 'the door says the voter is scripted');
  await say(p, "Hi, I'm Sam. I live nearby and I'm volunteering for Maya Kaur. Election Day is Tuesday.");
  ok(await waitFor(p, () => __T.S.screen === 'score', 20000), 'the scripted door ends after the opener, as in 155');
  await p.waitForTimeout(500);
  ok(!(await p.$('.sc-coach')), 'no coach card is claimed without the AI');
  await p.close();

  ok(errs.length === 0, 'page errors: ' + errs.slice(0, 3).join(' | '));
  console.log(`${tag}: ${pass} pass, ${fail} fail`);
  await b.close();
  process.exit(fail ? 1 : 0);
})();
