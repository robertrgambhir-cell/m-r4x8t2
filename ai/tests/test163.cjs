/* Version 163 checks on a built page: audio only (no offer to type anywhere a volunteer answers) and the laptop guide off
   unless asked for (?guide, the quiet link, or the G key).
   Usage: NODE_PATH=$(npm root -g) node ai/tests/test163.cjs /abs/site-root wdpfxqlsvp/app.html /abs/outdir
   (any static server for the site root on :8765, e.g. the mock or p1 server) */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const realFonts = require('/home/claude/work/fonts.js');
const [,, ROOT, REL = 'wdpfxqlsvp/app.html', OUT = '/tmp/t163'] = process.argv;
fs.mkdirSync(OUT, { recursive: true });
const src = fs.readFileSync(path.join(ROOT, REL), 'utf8');
const END = '\nloadVoices();\nrender();\n})();\n</script>';
const HOOK = '\nloadVoices();\nrender();\nwindow.__T = { micModal, micOff };\n})();\n</script>';
if (!src.includes(END)) throw new Error('IIFE end not found');
const HREL = path.join(path.dirname(REL), 'zzhooked163.html');
fs.writeFileSync(path.join(ROOT, HREL), src.replace(END, HOOK));
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass += 1; else { fail += 1; console.log('FAIL', m); } };

/* source: nothing a volunteer can tap offers the keyboard */
ok(!/>\s*Type it instead\s*</i.test(src), 'the mic card has no Type it instead button');
ok(!/Or type your words/.test(src), 'the mic card never says "Or type your words"');
ok(!/data-act="mic-type">type it instead/i.test(src), 'a turn that heard nothing offers no typing link');
ok(!/data-act="wai-type">Type instead/.test(src), 'the AI door has no Type instead link');
ok(/const gState = \{ on: !gClean && \(\/\[\?&\]guide\\b\/\.test\(location\.search\) \|\| store\.get\("guide", false\) === true\)/.test(src), 'the guide is off unless ?guide or a stored yes');
ok(!/—/.test(src), 'no em dashes');

(async () => {
  const b = await chromium.launch();
  const URL = 'http://127.0.0.1:8765/' + HREL;
  const open = async (ctx, q) => {
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', (e) => errs.push(String(e)));
    await realFonts(p);
    await p.route(/workers\.dev/, (r) => r.fulfill({ status: 503, body: '{}' }));
    await p.goto(URL + q, { waitUntil: 'domcontentloaded', timeout: 180000 });
    await p.waitForTimeout(1500); await p.evaluate(() => document.fonts.ready);
    p.errs = errs; return p;
  };

  /* laptop: the guide */
  const lap = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  let p = await open(lap, '?v=163');
  ok(!(await p.evaluate(() => document.body.classList.contains('guide-on'))), 'a plain laptop link opens without the guide');
  ok(await p.evaluate(() => { const s = document.querySelector('.g-show'); return !!s && getComputedStyle(s).display !== 'none'; }), 'the quiet "Show the demo guide" link shows on a laptop');
  await p.screenshot({ path: path.join(OUT, 'laptop-plain.png') });
  await p.click('.g-show');
  await p.waitForTimeout(500);
  ok(await p.evaluate(() => document.body.classList.contains('guide-on')), 'the link turns the guide on');
  ok(p.errs.length === 0, 'no page errors on the laptop: ' + p.errs.join(' | '));
  await p.close();
  p = await open(lap, '?guide&v=163');
  ok(await p.evaluate(() => document.body.classList.contains('guide-on')), '?guide opens with the guide on');
  await p.screenshot({ path: path.join(OUT, 'laptop-guide.png') });
  await p.close();
  p = await open(lap, '?noguide&v=163');
  ok(!(await p.evaluate(() => document.body.classList.contains('guide-on'))) && !(await p.$('.g-show')), '?noguide shows neither the guide nor its link');
  await p.close();
  ok(await (async () => { const q = await open(lap, '?v=163'); const on = await q.evaluate(() => document.body.classList.contains('guide-on')); await q.close(); return on; })(), 'a laptop that chose Show keeps the guide on next visit');
  const lapG = await b.newContext({ viewport: { width: 1440, height: 900 } });
  p = await open(lapG, '?v=163');
  await p.keyboard.press('g'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => document.body.classList.contains('guide-on')), 'the G key still turns it on');
  await p.close();
  const lap2 = await b.newContext({ viewport: { width: 1440, height: 900 } });
  p = await open(lap2, '?v=163');
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1200);
  ok(!(await p.evaluate(() => document.body.classList.contains('guide-on'))), 'a fresh browser never gets the guide by default');
  await p.close();

  /* phone: the mic card in both states */
  for (const [w, h] of [[402, 713], [375, 667]]) {
    const ph = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    p = await open(ph, '?v=163');
    for (const kind of ['busy', 'denied']) {
      await p.evaluate((k) => { if (!document.querySelector('#screen')) return; __T.micModal(k); }, kind);
      const card = await p.evaluate(() => { const m = document.querySelector('#mic-modal'); return m ? { text: m.textContent, buttons: [...m.querySelectorAll('button')].map((x) => x.textContent.trim()) } : null; });
      ok(card && card.buttons.length === 1 && card.buttons[0] === 'Try again', `${w}x${h} ${kind}: the mic card has one button, Try again: ` + JSON.stringify(card && card.buttons));
      ok(card && !/type/i.test(card.text), `${w}x${h} ${kind}: the mic card never mentions typing`);
      await p.screenshot({ path: path.join(OUT, `mic-${kind}-${w}x${h}.png`) });
      await p.evaluate(() => __T.micOff());
    }
    ok(!(await p.evaluate(() => document.body.classList.contains('guide-on'))), `${w}x${h}: no guide on a phone`);
    ok(p.errs.length === 0, `${w}x${h}: no page errors: ` + p.errs.join(' | '));
    await ph.close();
  }
  await b.close();
  fs.unlinkSync(path.join(ROOT, HREL));
  console.log(`test163: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
