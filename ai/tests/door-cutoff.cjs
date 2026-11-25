/* Version 176: nobody is cut off mid-sentence at the door (playbook rule 34a, voter rule 15). Robert's notes on the signature course,
   which share the rule: Nov 22, 2026, 4:10 PM, "it just cut off my voice. I was still talking, unfinished." (a pause after "...to
   get" ended his line), and Nov 23, 4:10 PM, "It cut me off when I was talking too soon" (his phone heard "Hi how are you").
   In a real browser, with a stand-in mic, against the real worker with a canned model (ai/tests/mock-server.mjs):
   A. Sofia's door (an AI door):
      1. a line that stops on "to get", then 1.7 s of quiet (past the 1.2 for a finished line), then the rest: heard whole, once;
      2. the phone stops listening on its own partway through a line (iOS does, after a short pause): the page listens again,
         keeps the words and hears the line whole, with no "Send it" step;
      3. the phone stops after a line that sounds finished and takes 1.5 s to listen again: that time isn't the volunteer's quiet,
         so the rest that follows is the same line;
   B. Sofia's door again: "Hi how are you" (his exact words) and 1.7 s of quiet wait for the rest; a mic error partway through a
      line still sends what was heard; a finished line still gets its answer after about 1.2 s; when the phone refuses to listen
      again after stopping on its own (WebKit fires only an error), what was heard still goes, with no blocked-mic card; and when the
      page is hidden (the phone locked mid-line) the words wait behind "Send it" instead of going.
   C. Kevin's door with no server (a scripted door): the phone stops on its own mid-line, the page listens again, and "I'm done"
      sends the whole line; when the phone then refuses to listen again, the words wait behind "Send it", never the blocked-mic card.
   Usage: (mock-server running on a copy of the site whose staging page is the page under test, pointed at 127.0.0.1:8799)
   NODE_PATH=/opt/node-tools/node_modules node ai/tests/door-cutoff.cjs /abs/site-root /abs/nourl.html [w h] */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const [,, ROOT, NOURL, W = '390', H = '844'] = process.argv;
const END = '\nloadVoices();\nrender();\n})();\n</script>';
const HOOK = '\nloadVoices();\nrender();\nwindow.__T = { get S() { return S; }, go, render, WAI, DOORS, doorKey };\n})();\n</script>';
const dir = path.join(ROOT, 'wdpfxqlsvp', 'staging');
const src = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
if (!src.includes(END)) { console.log('FAIL the page has no hook point'); process.exit(1); }
fs.writeFileSync(path.join(dir, 'zzhooked176.html'), src.replace(END, HOOK));
fs.writeFileSync(path.join(dir, 'zznourl176.html'), fs.readFileSync(NOURL, 'utf8').replace(END, HOOK));
const BASE = 'http://127.0.0.1:8765/wdpfxqlsvp/staging/';
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass += 1; console.log('ok  ', m); } else { fail += 1; console.log('FAIL', m); } };
/* a stand-in recognizer: the test says words; window.__phoneStops() is the phone ending a listening session on its own */
const FAKE_SR = () => {
  window.__starts = 0;
  class FakeSR {
    start() { window.__sr = this; window.__starts += 1; this.on = true; const bad = window.__failNextStart; window.__failNextStart = ''; if (bad) { setTimeout(() => { if (this.onerror) this.onerror({ error: bad }); this.on = false; }, 30); return; } setTimeout(() => { if (this.on) { if (this.onstart) this.onstart(); if (this.onaudiostart) this.onaudiostart(); } }, window.__startDelay || 10); } /* __failNextStart: the phone refuses to listen again; WebKit then fires only the error, with no end */
    stop() { if (!this.on) return; this.on = false; setTimeout(() => { if (this.onend) this.onend(); }, 50); }
    abort() { if (!this.on) return; this.on = false; setTimeout(() => { if (this.onend) this.onend(); }, 0); }
  }
  window.SpeechRecognition = FakeSR; window.webkitSpeechRecognition = FakeSR;
  /* the words so far in this listening session, as a phone sends them while you talk */
  window.__speak = (text) => { const r = window.__sr; if (!r || !r.onresult || !r.on) return false; r.onresult({ results: { length: 1, 0: { 0: { transcript: text, confidence: 0.9 }, isFinal: false, length: 1 } }, resultIndex: 0 }); return true; };
  window.__phoneStops = () => { const r = window.__sr; if (!r || !r.on) return false; r.on = false; if (r.onend) r.onend(); return true; };
  window.__micError = (code) => { const r = window.__sr; if (!r || !r.on) return false; if (r.onerror) r.onerror({ error: code }); r.on = false; setTimeout(() => { if (r.onend) r.onend(); }, 20); return true; };
};
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: Number(W), height: Number(H) }, hasTouch: true, isMobile: true });
  await ctx.addInitScript(FAKE_SR);
  const errs = [];
  const open = async (file, q) => { const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(String(e).slice(0, 200))); await p.goto(BASE + file + q, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1500); return p; };
  const waitFor = async (p, fn, ms = 15000, arg) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn, arg)) return true; await p.waitForTimeout(40); } return false; };
  const you = (p) => p.$$eval('#thread .bub.you', (xs) => xs.map((x) => x.textContent.trim()));
  const nYou = (p) => p.evaluate(() => document.querySelectorAll('#thread .bub.you').length);
  const sofia = async () => {
    const p = await open('zzhooked176.html', '?convo=kevin');
    await p.evaluate(() => { const S = __T.S; S.tryRes = null; S.tryKnocked = false; S.trySaid = false; S.tryHeard = false; S.tryPend = false; __T.go('try', { noBeat: true }); });
    await p.waitForTimeout(600);
    await p.click('[data-act="try-knock"]', { force: true });
    await waitFor(p, () => document.querySelectorAll('#thread .bub.them').length >= 1, 8000);
    return p;
  };
  const talk = async (p) => { /* tap to talk once the voter is done */
    await waitFor(p, () => { const b0 = document.querySelector('#talk [data-act="talk"]'); return b0 && !b0.disabled && (!__T.S.convo || !__T.S.convo.busy); }, 20000);
    await p.click('#talk [data-act="talk"]', { force: true });
    await waitFor(p, () => !!(window.__sr && window.__sr.on && window.__sr.onresult), 5000);
    await p.waitForTimeout(150);
  };
  const sentWithin = async (p, n, ms) => { const t0 = Date.now(); const got = await waitFor(p, (k) => document.querySelectorAll('#thread .bub.you').length >= k, ms, n); return got ? Date.now() - t0 : -1; };
  const nextTurn = (p) => waitFor(p, () => __T.S.screen !== 'door' || !__T.S.convo || (!__T.S.convo.busy && document.querySelectorAll('#thread .bub.them').length > document.querySelectorAll('#thread .bub.you').length), 15000);

  /* A1. a pause after "to get" doesn't end the line */
  let p = await sofia();
  ok((await p.evaluate(() => __T.WAI.state())) === 'on' && (await p.evaluate(() => __T.WAI.scenFor())) === 'sofia_intro', "Sofia's door is a live AI door");
  await talk(p);
  await p.evaluate(() => window.__speak("Hi, I'm Sam, and we're trying to get"));
  await p.waitForTimeout(1700);
  ok((await nYou(p)) === 0, 'a pause of 1.7 s after "we\'re trying to get" doesn\'t send the line');
  await p.evaluate(() => window.__speak("Hi, I'm Sam, and we're trying to get the word out for Maya Kaur."));
  let dt = await sentWithin(p, 1, 3000);
  ok(dt >= 900 && dt < 2200, 'the finished line sends after about 1.2 s of quiet: ' + (dt / 1000).toFixed(2) + ' s');
  ok(JSON.stringify(await you(p)) === JSON.stringify(["Hi, I'm Sam, and we're trying to get the word out for Maya Kaur."]), 'heard whole, once: ' + JSON.stringify(await you(p)));
  await nextTurn(p);

  /* A2. the phone stops listening on its own partway through a line */
  await talk(p);
  const s0 = await p.evaluate(() => window.__starts);
  await p.evaluate(() => window.__speak('Election Day is Tuesday and I'));
  await p.waitForTimeout(400);
  await p.evaluate(() => window.__phoneStops());
  ok(await waitFor(p, (k) => window.__starts > k && window.__sr.on, 2000, s0), 'when the phone stops on its own mid-line, the page listens again');
  ok(await p.evaluate(() => { const l = document.querySelector('#talk-label'); return !l || !/send it/i.test(l.textContent); }), 'no "Send it" step: the mic stays on (' + (await p.evaluate(() => (document.querySelector('#talk-label') || {}).textContent)) + ')');
  ok((await nYou(p)) === 1, 'nothing is sent while the page listens again');
  await p.waitForTimeout(500);
  await p.evaluate(() => window.__speak('wanted to check in with you about it.'));
  dt = await sentWithin(p, 2, 3500);
  const y2 = (await you(p))[1] || '';
  ok(dt > 0 && y2 === 'Election Day is Tuesday and I wanted to check in with you about it.', 'the words are kept and the line goes whole: ' + JSON.stringify(y2));
  await nextTurn(p);

  /* A3. a restart that takes 1.5 s isn't counted as quiet */
  if (await p.evaluate(() => __T.S.screen === 'door' && __T.S.convo && !__T.S.convo.ended)) {
    await talk(p);
    await p.evaluate(() => { window.__startDelay = 1500; window.__speak('I live a few blocks over.'); });
    await p.waitForTimeout(600);
    await p.evaluate(() => window.__phoneStops());
    await p.waitForTimeout(1700); /* the phone is back at about 1.5 s; 2.3 s since the last word, 0.8 s of it counted */
    ok((await nYou(p)) === 2, 'the 1.5 s the phone takes to listen again is not counted as quiet');
    await p.evaluate(() => { window.__startDelay = 10; window.__speak('Do you know about the election on Tuesday?'); });
    dt = await sentWithin(p, 3, 3500);
    const y3 = (await you(p))[2] || '';
    ok(dt > 0 && y3 === 'I live a few blocks over. Do you know about the election on Tuesday?', 'the rest after the restart is the same line: ' + JSON.stringify(y3));
  } else ok(false, 'Sofia\'s door stayed open for a third line');
  await p.close();

  /* B. "Hi how are you" waits; a mic error still sends what was heard; a finished line is quick */
  p = await sofia();
  await talk(p);
  await p.evaluate(() => window.__speak('Hi how are you'));
  await p.waitForTimeout(1700);
  ok((await nYou(p)) === 0, 'his exact words, "Hi how are you", and 1.7 s of quiet don\'t end the line');
  await p.evaluate(() => window.__speak("Hi how are you I'm Sam and I'm volunteering for Maya Kaur."));
  dt = await sentWithin(p, 1, 3000);
  ok(dt > 0 && ((await you(p))[0] || '') === "Hi how are you I'm Sam and I'm volunteering for Maya Kaur.", 'the hello and the rest are one line: ' + JSON.stringify((await you(p))[0]));
  await nextTurn(p);
  await talk(p);
  await p.evaluate(() => window.__speak('Election Day is Tuesday, so I just wanted to'));
  await p.waitForTimeout(300);
  await p.evaluate(() => window.__micError('network'));
  dt = await sentWithin(p, 2, 1500);
  ok(dt >= 0 && ((await you(p))[1] || '') === 'Election Day is Tuesday, so I just wanted to', 'a mic error partway through still sends what was heard, at once: ' + JSON.stringify((await you(p))[1]) + ' in ' + (dt / 1000).toFixed(2) + ' s');
  await nextTurn(p);
  if (await p.evaluate(() => __T.S.screen === 'door' && __T.S.convo && !__T.S.convo.ended)) {
    await talk(p);
    await p.evaluate(() => window.__speak('Thanks so much, have a good night.'));
    dt = await sentWithin(p, 3, 3000);
    ok(dt >= 900 && dt < 2200, 'a goodbye still gets its answer after about 1.2 s: ' + (dt / 1000).toFixed(2) + ' s');
  }
  await p.close();

  /* B2. the phone refuses to listen again after it stops on its own: what was heard still goes, and no blocked-mic card */
  p = await sofia();
  await talk(p);
  await p.evaluate(() => window.__speak('Election Day is Tuesday and I'));
  await p.waitForTimeout(400);
  await p.evaluate(() => { window.__failNextStart = 'not-allowed'; window.__phoneStops(); });
  dt = await sentWithin(p, 1, 3000);
  ok(dt >= 0 && ((await you(p))[0] || '') === 'Election Day is Tuesday and I', 'a phone that won\'t listen again still sends what was heard: ' + JSON.stringify((await you(p))[0]));
  ok(!(await p.$('#mic-modal')), 'and no blocked-mic card for a restart that failed');
  await nextTurn(p);
  /* the phone locked mid-line: the page doesn't try to listen again while it's hidden, and the words wait for a tap */
  if (await p.evaluate(() => __T.S.screen === 'door' && __T.S.convo && !__T.S.convo.ended)) {
    await talk(p);
    const h0 = await p.evaluate(() => window.__starts);
    await p.evaluate(() => window.__speak('I live a few blocks over and I'));
    await p.waitForTimeout(300);
    await p.evaluate(() => { Object.defineProperty(document, 'visibilityState', { get: () => 'hidden', configurable: true }); window.__phoneStops(); });
    await p.waitForTimeout(3500);
    const hs = await p.evaluate(() => ({ starts: window.__starts, label: (document.querySelector('#talk-label') || {}).textContent || '', modal: !!document.querySelector('#mic-modal') }));
    ok((await nYou(p)) === 1 && hs.starts === h0 && /send it/i.test(hs.label) && !hs.modal, 'a hidden page keeps the words behind "Send it": ' + JSON.stringify(Object.assign(hs, { h0, sent: await nYou(p) })));
    await p.evaluate(() => { delete document.visibilityState; });
    await p.click('#talk [data-act="talk"]', { force: true });
    dt = await sentWithin(p, 2, 3000);
    ok(dt >= 0 && ((await you(p))[1] || '') === 'I live a few blocks over and I', 'and a tap on Send sends them: ' + JSON.stringify((await you(p))[1]));
  } else ok(false, 'Sofia\'s door stayed open for the hidden-page line');
  await p.close();

  /* C. a scripted door (no server): the phone stops on its own mid-line; the page listens again and "I'm done" sends it whole */
  p = await open('zznourl176.html', '?convo=kevin');
  ok((await p.evaluate(() => __T.WAI.state())) === 'off', 'without a server the door is scripted');
  await p.waitForTimeout(2000); /* Part 1 of 4 shows over the Knock screen first (rule 58a) */
  await p.click('[data-act="knock"]');
  await waitFor(p, () => document.querySelectorAll('#thread .bub.them').length >= 1, 9000);
  await talk(p);
  const c0 = await p.evaluate(() => window.__starts);
  await p.evaluate(() => window.__speak("Hi, I'm Sam. I live nearby and I'm volunteering for"));
  await p.waitForTimeout(300);
  await p.evaluate(() => window.__phoneStops());
  ok(await waitFor(p, (k) => window.__starts > k && window.__sr.on, 2000, c0), 'a scripted door listens again too');
  await p.waitForTimeout(300);
  await p.evaluate(() => window.__speak('Maya Kaur. Election Day is Tuesday.'));
  await p.waitForTimeout(300);
  ok((await nYou(p)) === 0, 'a scripted door still waits for "I\'m done"');
  await p.click('#talk [data-act="talk"]', { force: true });
  await sentWithin(p, 1, 4000);
  ok(((await you(p))[0] || '') === "Hi, I'm Sam. I live nearby and I'm volunteering for Maya Kaur. Election Day is Tuesday.", '"I\'m done" sends the whole line: ' + JSON.stringify((await you(p))[0]));
  await p.close();
  /* a fresh scripted door: the phone stops on its own and then refuses to listen again (WebKit fires only an error) */
  p = await open('zznourl176.html', '?convo=kevin');
  await p.waitForTimeout(2000);
  await p.click('[data-act="knock"]');
  await waitFor(p, () => document.querySelectorAll('#thread .bub.them').length >= 1, 9000);
  await talk(p);
  await p.evaluate(() => window.__speak("Hi, I'm Sam. I live nearby and I"));
  await p.waitForTimeout(300);
  await p.evaluate(() => { window.__failNextStart = 'not-allowed'; window.__phoneStops(); });
  await p.waitForTimeout(1500);
  const cs = await p.evaluate(() => ({ label: (document.querySelector('#talk-label') || {}).textContent || '', modal: !!document.querySelector('#mic-modal'), said: (document.querySelector('#say') || {}).value || '' }));
  ok(!cs.modal && /send it/i.test(cs.label) && cs.said === "Hi, I'm Sam. I live nearby and I", 'a scripted door whose phone won\'t listen again keeps the words behind "Send it", no blocked-mic card: ' + JSON.stringify(cs));
  await p.close();

  ok(!errs.length, 'no page errors: ' + errs.slice(0, 3).join(' | '));
  console.log(`door cut-off ${W}x${H}: ${pass} pass, ${fail} fail`);
  for (const f of ['zzhooked176.html', 'zznourl176.html']) { try { fs.unlinkSync(path.join(dir, f)); } catch (e) { /* ignore */ } }
  await b.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('CRASH', e); process.exit(2); });
