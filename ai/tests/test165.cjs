/* Version 165 UI checks, against the real worker.js with a canned model (ai/tests/mock-server.mjs):
   - lesson 1's 1st intro is a full AI conversation at Sofia's door on the same door screen as Kevin's 2nd intro, with nothing
     taught first, and comes back to the 1st intro's card graded on the same four parts;
   - the voter streams (/turn): one request per turn, the words appear as the voice starts;
   - on an AI door the mic sends by itself after 1 s of quiet (no "I'm done" tap), and the answer started early at 0.45 s is
     the one used (no second request);
   - lesson 1's doors end within four of your lines; with the practice AI off the 1st intro is still one line.
   Usage: (mock-server running on a copy of the site whose staging page points at 127.0.0.1:8799)
   NODE_PATH=$(npm root -g) node test165.cjs /abs/site-root /abs/nourl.html [w h] */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const [,, ROOT, NOURL, W = '390', H = '844'] = process.argv;
const END = '\nloadVoices();\nrender();\n})();\n</script>';
const HOOK = '\nloadVoices();\nrender();\nwindow.__T = { get S() { return S; }, go, render, WAI, DOORS, doorKey };\n})();\n</script>';
const dir = path.join(ROOT, 'wdpfxqlsvp', 'staging');
const src = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
fs.writeFileSync(path.join(dir, 'zzhooked165.html'), src.replace(END, HOOK));
fs.writeFileSync(path.join(dir, 'zznourl165.html'), fs.readFileSync(NOURL, 'utf8').replace(END, HOOK));
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass += 1; else { fail += 1; console.log('FAIL', m); } };
const BASE = 'http://127.0.0.1:8765/wdpfxqlsvp/staging/';
const stats = async () => JSON.parse(await (await fetch('http://127.0.0.1:8799/__mock/stats')).text());
/* a stand-in recognizer: the test says words; nothing ends unless the page stops it */
const FAKE_SR = () => {
  window.__srs = [];
  class FakeSR {
    constructor() { this.continuous = false; this.interimResults = false; window.__srs.push(this); }
    start() { window.__sr = this; this.on = true; setTimeout(() => { if (this.onstart) this.onstart(); if (this.onaudiostart) this.onaudiostart(); }, 10); }
    stop() { if (!this.on) return; this.on = false; setTimeout(() => { if (this.onend) this.onend(); }, 400); }
    abort() { if (!this.on) return; this.on = false; setTimeout(() => { if (this.onend) this.onend(); }, 0); }
  }
  window.SpeechRecognition = FakeSR; window.webkitSpeechRecognition = FakeSR;
  window.__speak = (text) => { const r = window.__sr; if (!r || !r.onresult) return false; const res = { 0: { transcript: text, confidence: 0.9 }, isFinal: false, length: 1 }; const list = { length: 1, 0: res }; r.onresult({ results: list, resultIndex: 0 }); return true; };
};
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const pane = Number(W) >= 1000;
  const ctx = await b.newContext({ viewport: { width: Number(W), height: Number(H) }, hasTouch: !pane, isMobile: !pane });
  await ctx.addInitScript(FAKE_SR);
  const errs = [];
  const open = async (file, q) => { const p = await ctx.newPage(); p.on('pageerror', (e) => { const m = String(e); if (!/start is not defined|onHasParentDirectory|addRow is not defined/.test(m)) errs.push(m); }); await p.goto(BASE + file + q, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1500); return p; };
  const them = (p) => p.$$eval('#thread .bub.them', (xs) => xs.map((x) => x.textContent));
  const you = (p) => p.$$eval('#thread .bub.you', (xs) => xs.map((x) => x.textContent));
  const waitFor = async (p, fn, ms = 15000, arg) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn, arg)) return true; await p.waitForTimeout(50); } return false; };
  const waitThem = (p, n, ms) => waitFor(p, (k) => document.querySelectorAll('#thread .bub.them').length >= k, ms, n);
  /* speak a line through the mic and never tap "I'm done": the page must send it by itself */
  const speakLine = async (p, text) => {
    await waitFor(p, () => { const b0 = document.querySelector('#talk [data-act="talk"]'); return b0 && !b0.disabled && __T.S.convo && !__T.S.convo.busy; }, 20000);
    await p.click('#talk [data-act="talk"]', { force: true });
    await waitFor(p, () => !!(window.__sr && window.__sr.on && window.__sr.onresult), 5000);
    await p.waitForTimeout(150);
    await p.evaluate((t) => { const w = t.split(' '); window.__speak(w.slice(0, Math.ceil(w.length / 2)).join(' ')); }, text);
    await p.waitForTimeout(250); /* still talking: the early answer for the half line is thrown away */
    await p.evaluate((t) => window.__speak(t), text);
    return Date.now();
  };

  /* A. the 1st intro: Knock opens Sofia's door as a live conversation */
  let p = await open('zzhooked165.html', '?convo=kevin');
  ok((await p.evaluate(() => __T.WAI.state())) === 'on', 'the page reaches the worker');
  await p.evaluate(() => { const S = __T.S; S.tryRes = null; S.tryKnocked = false; S.trySaid = false; S.tryHeard = false; S.tryPend = false; __T.go('try', { noBeat: true }); });
  await p.waitForTimeout(600);
  ok((await p.evaluate(() => __T.S.screen)) === 'try', 'the 1st intro opens on its knock screen');
  await p.screenshot({ path: path.join(ROOT, '..', `t165-knock-${W}x${H}.png`) });
  ok(await p.evaluate(() => { const f = document.querySelector('.app.ft .rep-card > .frame'), b = document.querySelector('.app.ft > .actions .btn'); if (!f || !b) return false; const fr = f.getBoundingClientRect(), br = b.getBoundingClientRect(); return fr.left <= 1 && fr.right >= innerWidth - 1 && br.top > fr.top && br.bottom <= fr.bottom + 1; }), 'the Knock screen is full screen with Knock over the picture (version 169)');
  await p.click('[data-act="try-knock"]', { force: true });
  ok(await waitFor(p, () => __T.S.screen === 'door' && __T.S.try1 === true, 5000), 'Knock opens the door screen in 1st intro mode');
  ok((await p.evaluate(() => __T.doorKey())) === 'sofia' && (await p.evaluate(() => __T.WAI.scenFor())) === 'sofia_intro', "it is Sofia's door, scenario sofia_intro");
  ok(!(await p.$('.door-four')), 'nothing is taught before the 1st intro (no four parts on the door)');
  ok(await waitThem(p, 1, 8000), 'Sofia opens the door');
  ok(await p.evaluate(() => { const f = document.querySelector('.app.ft .frame.convo-stage'), b = document.querySelector('.app.ft > .actions'); if (!f || !b) return false; const fr = f.getBoundingClientRect(), br = b.getBoundingClientRect(); return fr.left <= 1 && fr.right >= innerWidth - 1 && fr.bottom >= br.bottom - 2; }), 'the door is full screen, the button floats over it (version 169)');
  ok((await them(p))[0] === 'Hi, can I help you?', "Sofia's first line: " + (await them(p))[0]);
  ok((await p.$eval('#thread', (t) => t.textContent)).includes('Live AI voter'), 'the door says the voter is the live AI');
  const s0 = await stats();
  const lines = ["Hi, I'm Sam. I live a few blocks over and I'm volunteering for Maya Kaur.", "Election Day is Tuesday, so I'm checking in with neighbors.", "I'm not sure, but I can find out for you. Thanks so much, have a good night."];
  const lat = [];
  const frameH = [await p.evaluate(() => { const f = document.querySelector('#screen .frame.convo-stage'); return f ? Math.round(f.getBoundingClientRect().height) : 0; })];
  for (let i = 0; i < lines.length; i += 1) {
    const t0 = await speakLine(p, lines[i]);
    const sent = await waitFor(p, (k) => document.querySelectorAll('#thread .bub.you').length >= k, 2500, i + 1);
    ok(sent, `line ${i + 1} sends by itself after a pause, no "I'm done" tap`);
    if (i === 0) { const y0 = (await you(p))[0]; ok(y0 === lines[0], 'your words are what you said: ' + y0); }
    const got = await waitThem(p, i + 2, 15000);
    lat.push(Date.now() - t0);
    ok(got, `Sofia answers line ${i + 1}`);
    frameH.push(await p.evaluate(() => { const f = document.querySelector('#screen .frame.convo-stage'); return f ? Math.round(f.getBoundingClientRect().height) : 0; }));
    await waitFor(p, () => __T.S.screen !== 'door' || !__T.S.convo || !__T.S.convo.busy, 15000);
    if (i === 1) { await p.waitForTimeout(900); await p.screenshot({ path: path.join(ROOT, '..', `t165-sofia-door-${W}x${H}.png`) });
      /* version 170 (Robert, Nov 16): the captions sit over her chest, never her face */
      const g = await p.evaluate(() => { const face = [...document.querySelectorAll('#screen .frame.convo-stage > svg ellipse')].find((e) => e.getAttribute('rx') === '26'); const tops = [...document.querySelectorAll('#thread .bub')].filter((x) => getComputedStyle(x).display !== 'none' && getComputedStyle(x).visibility !== 'hidden').map((x) => x.getBoundingClientRect().top); return face ? { chin: face.getBoundingClientRect().bottom, cap: Math.min(...tops) } : null; });
      ok(g && g.chin < g.cap, 'the voter\'s face is above the captions: ' + JSON.stringify(g)); }
    if (await p.evaluate(() => __T.S.screen !== 'door' || __T.S.convo.ended)) break;
  }
  ok(frameH.length > 1 && frameH.slice(1).every((h) => h > 0 && Math.abs(h - frameH[frameH.length - 1]) <= 6), 'the voter\'s picture holds its size through the conversation (version 166): ' + frameH.join(', '));
  const s1 = await stats();
  const nYou = (await p.evaluate(() => (__T.S.convo ? __T.S.convo.turns : []).filter((x) => x.who === 'you').length)) || lines.length;
  ok(s1.voter - s0.voter <= nYou + 1, `about one voter request per line, the early answer reused (requests ${s1.voter - s0.voter}, lines ${nYou})`);
  ok(s1.voter - s0.voter >= 1, 'the voter came from the server');
  console.log('   last word to the voter’s first words (mock: 0.25 s model, 0.08 s voice):', lat.map((x) => (x / 1000).toFixed(2) + ' s').join(', '));
  ok(lat.every((x) => x < 3000), 'each answer arrives within 3 s of the last word against the mock');
  ok(await waitFor(p, () => __T.S.screen === 'try', 20000), 'the conversation comes back to the 1st intro');
  const R = await p.evaluate(() => __T.S.tryRes);
  ok(R && !R.pending && R.lesson === 1 && Array.isArray(R.hits) && R.hits.length === 4, 'the 1st intro is graded on the same four parts');
  ok(R && Array.isArray(R.convo) && R.convo.filter((x) => x.who === 'you').length >= 2, 'the graded 1st intro is the whole conversation');
  ok(R && R.coach && R.coach.scen === 'sofia_intro', 'graded by the coach on sofia_intro');
  ok(/Your 1st intro/.test(await p.$eval('#screen', (s) => s.textContent)), 'the 1st intro card shows');
  ok((await p.evaluate(() => __T.S.try1)) === false, '1st intro mode ends');
  await p.waitForTimeout(7000); /* the card's rows cascade in */
  await p.screenshot({ path: path.join(ROOT, '..', `t165-try-card-${W}x${H}.png`) });

  /* B. the 2nd intro is the same kind of door, with Kevin, and ends within four of your lines */
  await p.evaluate(() => __T.go('door', { noBeat: true }));
  await p.waitForTimeout(500);
  ok((await p.evaluate(() => __T.doorKey())) === 'kevin' && (await p.evaluate(() => __T.WAI.scenFor())) === 'kevin_intro', "the 2nd intro is Kevin's door");
  ok(!!(await p.$('.door-four')), 'the 2nd intro still shows the four parts before its knock (after the teaching)');
  await p.click('[data-act="knock"]', { force: true });
  ok(await waitThem(p, 1, 8000), 'Kevin opens the door');
  const kl = ["Hi, I'm Sam, a neighbor volunteering for Maya Kaur.", 'Election Day is Tuesday.', 'Not sure, I can find out.', 'One more thing about the polls.', 'And another thing.'];
  let n = 0;
  for (const l of kl) { if (await p.evaluate(() => __T.S.screen !== 'door' || __T.S.convo.ended)) break; await speakLine(p, l); n += 1; await waitThem(p, n + 1, 15000); await waitFor(p, () => __T.S.screen !== 'door' || !__T.S.convo || !__T.S.convo.busy || __T.S.convo.ended, 15000); }
  ok(n <= 4, `Kevin's door ends within four of your lines (${n})`);
  ok(await waitFor(p, () => __T.S.screen === 'score', 20000), 'the 2nd intro goes to its feedback');
  await p.close();

  /* C. leaving the 1st intro's door mid-way ends 1st intro mode */
  p = await open('zzhooked165.html', '?convo=kevin');
  await p.evaluate(() => { const S = __T.S; S.tryRes = null; S.tryKnocked = false; __T.go('try', { noBeat: true }); });
  await p.waitForTimeout(400);
  await p.click('[data-act="try-knock"]', { force: true });
  await waitThem(p, 1, 8000);
  await p.evaluate(() => __T.go('watch'));
  ok((await p.evaluate(() => __T.S.try1)) === false, 'leaving the door ends 1st intro mode');
  await p.close();

  /* D. with no practice AI, the 1st intro stays one line */
  p = await open('zznourl165.html', '?convo=kevin');
  await p.evaluate(() => { const S = __T.S; S.tryRes = null; S.tryKnocked = false; __T.go('try', { noBeat: true }); });
  await p.waitForTimeout(400);
  await p.click('[data-act="try-knock"]', { force: true });
  await p.waitForTimeout(1500);
  ok((await p.evaluate(() => __T.S.screen)) === 'try' && !(await p.evaluate(() => __T.S.try1)), 'with the practice AI off, Knock stays on the one-line 1st intro');
  await p.close();

  ok(!errs.length, 'no page errors: ' + errs.slice(0, 3).join(' | '));
  console.log(`${W}x${H}: ${pass} pass, ${fail} fail`);
  await b.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('CRASH', e); process.exit(2); });
