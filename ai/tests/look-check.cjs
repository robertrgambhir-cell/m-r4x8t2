/* The look check (playbook rule 62b; Robert, Nov 23, 2026): it fails when Warmup's frame uses a value retired by the deck look
   (rule 58's befores), when a main button is dark or not mint with pine words, or when the frame has a shadow, glow or gradient
   (rule 58d). Pictures inside a scene keep their own colors, so they are skipped.
   Two halves:
   1. Static: every <style> block of the pages and sources below, comments and dark-mode blocks stripped. No retired value (hex,
      %23-encoded hex in data URIs, or an rgb() of one) and no box-shadow, text-shadow, drop-shadow or gradient, except in a rule
      that PICTURE (pictures, video and the video's own captions) or MARKS (hairlines and mint marks drawn with a shadow) allows.
   2. Rendered: real screens at 390x844 with the real fonts. Every visible element and its ::before and ::after outside a
      picture: no retired color in its words, fill or border; no shadow unless it's a hairline or a mark (no blur, no offset, in a
      palette color); no gradient unless MARKS allows it; every main button mint #16C79A with deep pine #0E2F2B words, the
      listening button deep green #00795F with white words, and no dark button anywhere.
   Usage (from the repo's top folder): NODE_PATH=/opt/node-tools/node_modules node ai/tests/look-check.cjs [--live] [--static]
     --live    adds the live demo (app.html, p1/, issues/, p1/issues/, train/) and the front pages: run it after "ship it".
     --static  only the first half (no browser).
   Fonts: ai/tests/fonts.cjs (the fontsource packages in /root/.warmup-fonts). */
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = process.cwd();
const LIVE = process.argv.includes('--live'), STATIC = process.argv.includes('--static');

/* the values rule 58 retired (its "before"), and their rgb forms */
const RETIRED = ['FCF8F2', 'FFFDF9', '262320', '5B554D', '6F685F', 'F4EEE5', 'F3F0EA', 'E3DBCF', 'E6E0D6', 'E6DFD3', '35B57C', '22895A', '1B7A4D', 'DDF0E4',
  'E6F5EC', '2F8A5F', '3E7C4F', '23744F', '9A6A0C', 'F6E7C1', 'A4432F', 'C2412D', 'F5DDD6', 'FBE8E4',
  /* warm grays and greens the pass retired in the frame */ '8D877A', '9B9389', 'A69E92', 'B8B0A3', 'BFB8A8', 'B4AE9E', 'FDFBF6', 'FFFEFA', '1C1A18', '201D1A'];
const rgbOf = (h) => [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
const RET_RGB = new Set(RETIRED.map((h) => rgbOf(h).join(',')));
const OK_RING = new Set(['216,232,229', '22,199,154', '0,121,95', '251,254,253', '255,255,255', '31,76,145', '14,47,43', '221,247,238', '233,245,250']); /* line, mint, deep green, paper, card, Maya blue, pine, light mint, pale blue */

/* pages: [file, kind]. The review copy and its two issue pages, the signature course's built page, landing page and source */
const PAGES = [['wdpfxqlsvp/review/index.html', 'app'], ['wdpfxqlsvp/review/issues/index.html', 'issues'], ['wdpfxqlsvp/review/train/index.html', 'train'],
  ['wdpfxqlsvp/staging/index.html', 'app'], ['wdpfxqlsvp/dev/index.html', 'app'], ['wdpfxqlsvp/dev/issues/index.html', 'issues'],
  ['ai/assets/issues-source.html', 'issues'], ['ai/train/train.html', 'train'],
  ['wdpfxqlsvp/sig/lesson.html', 'sig'], ['wdpfxqlsvp/sig/index.html', 'sig'], ['ai/sig/sig.html', 'sig']];
if (LIVE) PAGES.push(['wdpfxqlsvp/app.html', 'app'], ['wdpfxqlsvp/p1/index.html', 'app'], ['wdpfxqlsvp/issues/index.html', 'issues'], ['wdpfxqlsvp/p1/issues/index.html', 'issues'],
  ['wdpfxqlsvp/train/index.html', 'train'], ['index.html', 'front'], ['wdpfxqlsvp/index.html', 'front'], ['kaur/index.html', 'front'], ['demo/index.html', 'front']);

/* rules a picture owns (their colors and shading are the picture's): selectors matched as regular expressions */
const PICTURE = {
  app: [/^\.?(vid|cut|real-door|rd-|maria-vid|sms|sb-|selfie|hl\b|voter|story-art|st-)/, /\.frame\.full::before/, /\.av\.anon/, /^\.vid-cap/, /^@keyframes (cut|vpdot)/, /\.cut-/, /\.vid-/],
  issues: [/^\.g12 \.(news|nw-o)\b/], /* the news clipping is a picture of a newspaper: its paper, shadow and print */
  train: [/^\.a-(donut|dash)\b/], /* a donut chart and a striped bar: the charts' own colors */
  front: [],
  sig: [/^\.(dock \.)?pet\b/, /^\.pet-[a-z]/, /^\.stamp\b/, /^\.box\b/], /* the practice petition is a document drawn as a picture: its paper, print and PRACTICE ONLY stamp keep their own colors */
};
/* marks drawn with a gradient or a shadow that are not decoration (a half-filled near miss, a dashed line, hairlines, the bottom fade
   that says the screen scrolls) */
const MARKS = [/li\.near::before/, /li\.p::before/, /\.app\.more \.content/, /mask-image/];

let problems = 0;
const fail = (where, what) => { problems += 1; if (problems <= 80) console.log('  ' + where + ': ' + what); };

/* ------------------------------------------------------------------ 1. static */
function stripDark(css) {
  let out = '', i = 0;
  const re = /@media[^{]*prefers-color-scheme:\s*dark[^{]*\{|[^{}]*\[data-theme="dark"\][^{]*\{/g;
  let m;
  while ((m = re.exec(css))) {
    out += css.slice(i, m.index);
    let depth = 1, j = re.lastIndex;
    while (j < css.length && depth) { if (css[j] === '{') depth += 1; else if (css[j] === '}') depth -= 1; j += 1; }
    i = j; re.lastIndex = j;
  }
  return out + css.slice(i);
}
function rulesOf(css) { /* [selector, body] pairs, @media wrappers flattened */
  const out = []; const re = /([^{}]+)\{([^{}]*)\}/g; let m;
  while ((m = re.exec(css))) out.push([m[1].trim().replace(/^@media[^{]*$/, '').trim(), m[2]]);
  return out;
}
function staticCheck(file, kind) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) { fail(file, 'missing'); return; }
  const src = fs.readFileSync(full, 'utf8');
  let css = '';
  for (const m of src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) css += m[1] + '\n';
  if (kind === 'train') { const d = src.match(/"css":"((?:[^"\\]|\\.)*)"/); if (d) css += JSON.parse('"' + d[1] + '"'); } /* the training's own CSS travels in its DATA */
  css = stripDark(css.replace(/\/\*[\s\S]*?\*\//g, ''));
  const before = problems;
  for (const [sel, body] of rulesOf(css)) {
    const pic = (PICTURE[kind] || []).some((r) => r.test(sel)), mark = MARKS.some((r) => r.test(sel) || r.test(body));
    if (pic) continue;
    for (const h of RETIRED) {
      if (new RegExp('(#|%23)' + h + '\\b', 'i').test(body)) fail(file, `${sel} { ... #${h} ... } uses a retired value`);
      const [r, g, b] = rgbOf(h);
      if (new RegExp(`rgba?\\(\\s*${r}\\s*,\\s*${g}\\s*,\\s*${b}\\b`).test(body)) fail(file, `${sel} uses rgb(${r}, ${g}, ${b}), a retired value`);
    }
    if (mark) continue;
    for (const d of body.split(';')) {
      const [prop, ...rest] = d.split(':'), v = rest.join(':').trim(), p = (prop || '').trim();
      if (!p || !v) continue;
      if (p === 'box-shadow' && v !== 'none') {
        const ok = v.split(/,(?![^(]*\))/).every((sh) => /^(inset\s+)?0(px)?\s+0(px)?\s+0(px)?\s+[\d.]+px\s+(var\(--(line|track|paper|card|accent|accent-ink|maya|camp|ink|g-line|g-acc-2)[^)]*\)|#D8E8E5|#16C79A|#FFFFFF|#FBFEFD)(\s+inset)?$/i.test(sh.trim()));
        if (!ok) fail(file, `${sel} has a shadow (${v.slice(0, 70)})`);
      }
      if (p === 'text-shadow' && v !== 'none') fail(file, `${sel} has a text shadow`);
      if (/drop-shadow\(/.test(v) && p === 'filter') fail(file, `${sel} has a drop shadow`);
      if (/^background(-image)?$/.test(p) && /gradient\(/.test(v)) fail(file, `${sel} has a gradient`);
    }
  }
  console.log(`${problems === before ? 'ok  ' : 'FAIL'} static ${file}`);
}

/* ------------------------------------------------------------------ 2. rendered */
const SCREENS = {
  app: [
    ['Today', '?home', []], ['Today, door-ready', '?home&ready', []], ['Learn', '?learn', []], ['Learn, door-ready', '?learn&ready', []],
    ['a lesson start (Part 1 of 4 over the Knock screen)', '?home', ['__H.S.lesson=2; __H.go("door")', 400]],
    ['the Knock screen', '?home', ['__H.S.lesson=2; __H.go("door")', 3600]],
    ['Hear it done', '?home', ['__H.S.lesson=2; __H.go("watch")', 3800]],
    ['Catch the mistake', '?home', ['__H.S.lesson=2; __H.go("spot")', 3800]],
    ['the 1st try card', '?home', ["__H.S.lesson=1; __H.S.tryRes={lesson:1,hits:[true,false,true,false],text:'Hi, I am Rosa with Maya Kaur.',at:Date.now()}; __H.go('try',{noBeat:true})", 2500]],
    ["the coach's score", '?home', ["__H.S.lesson=2; __H.S.last={skill:'listen',lesson:2,moves:[true,true,false,true],prior:[],text:'Hi there, I am Rosa. What matters to you this year?',who:'Jamal',day:1}; __H.go('score',{noBeat:true})", 2500]],
    ['How you grew', '?home', ["__H.S.lesson=2; __H.S.done5[2]=[true,true,true,true]; __H.S.doneAt[2]=Date.now(); __H.S.tryRes={lesson:2,hits:[true,false,true,false],text:'Hi',at:1}; __H.S.doneCard=0; __H.go('close',{noBeat:true})", 4000]],
    ['the finish (Lesson 2 done)', '?home', ["__H.S.lesson=2; __H.S.done5[2]=[true,true,true,true]; __H.S.doneAt[2]=Date.now(); __H.S.tryRes={lesson:2,hits:[true,false,true,false],text:'Hi',at:1}; __H.go('close',{noBeat:true}); __H.S.doneCard=1; __H.render()", 2600]],
    ["what's next", '?home', ["__H.S.lesson=2; __H.S.done5[2]=[true,true,true,true]; __H.S.doneAt[2]=Date.now(); __H.S.tryRes={lesson:2,hits:[true,false,true,false],text:'Hi',at:1}; __H.go('close',{noBeat:true}); __H.S.doneCard=2; __H.render()", 1500]],
    ['door-ready (the Silver moment)', '?home&ready', ["__H.go('silver',{noBeat:true})", 2000]],
    ['Practice', '?home', ["__H.go('coach',{noBeat:true})", 1200]], ['Your record', '?home&ready', ["__H.go('record',{noBeat:true})", 1200]],
    ['How status works', '?home&ready', ["__H.go('statushow',{noBeat:true})", 1200]],
  ],
  issues: [['the issues home', '?all', []], ['the issues home, two done', '?all&done=tx,oh', []], ['heating oil', '?all&lesson=me&fast', [2500]], ['tariffs and auto jobs', '?all&lesson=mi&fast', [2500]]],
  train: [['the electric bill training', '?l=oh', []], ['its first beat', '?l=oh&at=beat', []], ['its question', '?l=oh&at=quiz', []], ['its talk screen', '?l=oh&at=say', []],
    ['its door', '?l=oh&at=doorIntro', []], ['its finish', '?l=oh&at=done', [2000]], ['the school vouchers training', '?l=tx', []]],
  sig: [['lesson 2', '?preview&l=2', []], ['lesson 2, the 1st try', '?preview&l=2&at=1.0', [1500]], ['lesson 2, Hear it done', '?preview&l=2&at=2.0', [1500]],
    ['lesson 2, the 2nd try', '?preview&l=2&at=7.0', [1500]], ['lesson 1', '?preview&l=1', []], ['lesson 5', '?preview&l=5', []]],
};
const SKIP = { /* picture containers: their insides keep their own colors */
  app: 'svg, img, video, canvas, iframe, .vid, .vid-cut, .frame, .hn-art, .lk-art, .pk-stack, .chp-art, .lp-art, .gv-pic, .rd-ring, .sms, .story-art, .td2-ring, .ring-wrap, .medal-art, .sat-doors, .gv-faces, .stage-top .camp-mark, .tabs svg',
  issues: 'svg, img, video, canvas, iframe, .fig, .ph, .pic, .art', train: 'svg, img, video, canvas, iframe, .fig, .ph, .pic, .art', sig: 'svg, img, video, canvas, iframe, .ph, .pic, .ft .ph, .dock .pet, .pet, .record, .grew img',
};
const MAIN = { app: '.btn:not(.secondary), .iconbtn.primary, .mic-btn:not(.on), .pg-cta, .g-next', issues: '.btn:not(.ghost):not(.secondary), .st-next', train: '.btn:not(.ghost):not(.secondary)', sig: '.btn:not(.ghost):not(.secondary):not(.sec)' };

async function rendered() {
  const { chromium } = require('playwright');
  const realFonts = require('./fonts.cjs');
  const END = '\nloadVoices();\nrender();\n})();\n</script>';
  const HOOK = '\nloadVoices();\nrender();\nwindow.__H = { S, go, render };\n})();\n</script>';
  const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml' };
  const srv = http.createServer((q, r) => {
    let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    if (!fs.existsSync(f)) { r.writeHead(404); r.end(); return; }
    let b = fs.readFileSync(f); if (f.endsWith('.html') && b.includes(END)) b = Buffer.from(b.toString('utf8').replace(END, HOOK));
    r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); r.end(b);
  });
  await new Promise((res) => srv.listen(0, '127.0.0.1', res));
  const base = `http://127.0.0.1:${srv.address().port}/`;
  const browser = await chromium.launch();
  const pages = PAGES.filter(([f, k]) => SCREENS[k] && /^wdpfxqlsvp\//.test(f) && !/staging|\/dev\//.test(f));
  for (const [file, kind] of pages) {
    for (const [name, q, steps] of SCREENS[kind]) {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
      const p = await ctx.newPage(); await realFonts(p); const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 120)));
      await p.route(/workers\.dev/, (r) => r.fulfill({ status: 503, body: '{}' }));
      await p.goto(base + file.replace(/index\.html$/, '') + q, { waitUntil: 'domcontentloaded', timeout: 120000 });
      await p.waitForTimeout(1500); await p.evaluate(() => document.fonts.ready);
      for (const s of steps) { if (typeof s === 'number') await p.waitForTimeout(s); else await p.evaluate(s); }
      await p.waitForTimeout(500);
      const bad = await p.evaluate(({ RET, OKR, SKIPSEL, MAINSEL }) => {
        const ret = new Set(RET), okr = new Set(OKR), out = [];
        const rgb = (c) => { const m = String(c).match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/); return m ? { k: `${+m[1]},${+m[2]},${+m[3]}`, a: m[4] == null ? 1 : +m[4], r: +m[1], g: +m[2], b: +m[3] } : null; };
        const lum = (o) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(o.r) + 0.7152 * f(o.g) + 0.0722 * f(o.b); };
        const name = (el) => (el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.classList.length ? '.' + [...el.classList].slice(0, 3).join('.') : ''));
        const visible = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05 && r.bottom > 0 && r.top < innerHeight; };
        const shadowsOk = (v) => v === 'none' || v.split(/,(?![^(]*\))/).every((sh) => { const c = rgb(sh); const nums = sh.replace(/rgba?\([^)]*\)/, '').replace('inset', '').trim().split(/\s+/).map(parseFloat); return c && nums[0] === 0 && nums[1] === 0 && (nums[2] || 0) === 0 && (okr.has(c.k) || c.a === 0); });
        const look = (el, cs, who) => {
          const c = rgb(cs.color), bg = rgb(cs.backgroundColor);
          const hasText = who === 'el' ? [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) : cs.content && cs.content !== 'none' && cs.content !== '""';
          if (hasText && c && c.a > 0.1 && ret.has(c.k)) out.push(`${who === 'el' ? '' : who + ' of '}${name(el)}: words in retired rgb(${c.k})`);
          if (bg && bg.a > 0.1 && ret.has(bg.k)) out.push(`${who === 'el' ? '' : who + ' of '}${name(el)}: fill in retired rgb(${bg.k})`);
          for (const side of ['Top', 'Right', 'Bottom', 'Left']) { const w = parseFloat(cs['border' + side + 'Width']); const bc = rgb(cs['border' + side + 'Color']); if (w > 0 && cs['border' + side + 'Style'] !== 'none' && bc && bc.a > 0.1 && ret.has(bc.k)) { out.push(`${name(el)}: border in retired rgb(${bc.k})`); break; } }
          if (!shadowsOk(cs.boxShadow)) out.push(`${who === 'el' ? '' : who + ' of '}${name(el)}: a shadow (${cs.boxShadow.slice(0, 60)})`);
          if (cs.textShadow && cs.textShadow !== 'none') out.push(`${name(el)}: a text shadow`);
          if (/drop-shadow/.test(cs.filter)) out.push(`${name(el)}: a drop shadow`);
          if (/gradient\(/.test(cs.backgroundImage) && !/near|\bp\b/.test(el.className)) out.push(`${who === 'el' ? '' : who + ' of '}${name(el)}: a gradient`);
        };
        const all = [...document.querySelectorAll('body *')].filter((el) => !el.closest(SKIPSEL) && visible(el));
        for (const el of all) {
          look(el, getComputedStyle(el), 'el');
          for (const pe of ['::before', '::after']) { const cs = getComputedStyle(el, pe); if (cs.content && cs.content !== 'none') look(el, cs, pe); }
          if (el.matches('button, [role=button], a.btn')) {
            const bg = rgb(getComputedStyle(el).backgroundColor);
            if (bg && bg.a > 0.6 && lum(bg) < 0.06 && !el.matches('.vid *')) out.push(`${name(el)}: a dark button (rgb(${bg.k}))`);
          }
        }
        for (const el of document.querySelectorAll(MAINSEL)) {
          if (!visible(el) || el.closest(SKIPSEL)) continue;
          const cs = getComputedStyle(el), bg = rgb(cs.backgroundColor), c = rgb(cs.color);
          if (!bg || bg.k !== '22,199,154' || !c || c.k !== '14,47,43') out.push(`main button "${el.textContent.trim().slice(0, 30)}": rgb(${bg && bg.k}) with words rgb(${c && c.k}), not mint with pine words`);
        }
        for (const el of document.querySelectorAll('.mic-btn.on')) { const cs = getComputedStyle(el); if (visible(el) && (rgb(cs.backgroundColor).k !== '0,121,95' || rgb(cs.color).k !== '255,255,255')) out.push('the listening button is not deep green with white words'); }
        return [...new Set(out)];
      }, { RET: [...RET_RGB], OKR: [...OK_RING], SKIPSEL: SKIP[kind], MAINSEL: MAIN[kind] });
      for (const e of errs) bad.push('page error: ' + e);
      for (const b of bad) fail(`${file} ${name}`, b);
      console.log(`${bad.length ? 'FAIL' : 'ok  '} screen ${file}: ${name}`);
      await ctx.close();
    }
  }
  await browser.close(); srv.close();
}

(async () => {
  console.log('== the look check (rule 62b): static');
  for (const [f, k] of PAGES) staticCheck(f, k);
  if (!STATIC) { console.log('== rendered, 390x844'); await rendered(); }
  console.log(`look: ${problems} problems`);
  process.exit(problems ? 1 : 0);
})();
