/* Serve the real Newsreader, Figtree and Archivo to a Playwright page (the sandbox can't reach Google Fonts).
   The fonts are three npm packages, unpacked outside the repo:
     mkdir -p /root/.warmup-fonts && cd /root/.warmup-fonts
     npm pack @fontsource/newsreader@5.3.0 @fontsource/figtree@5.3.0 @fontsource/archivo@5.3.0
   then unpack each tarball's `package` folder as a folder named like the tarball (fontsource-newsreader-5.3.0 and so on).
   WARMUP_FONTS names another folder that holds them. */
const fs = require('fs');
const D = (process.env.WARMUP_FONTS || '/root/.warmup-fonts').replace(/\/?$/, '/');
const face = (fam, dir, w, st) => `@font-face{font-family:"${fam}";font-style:${st};font-weight:${w};font-display:block;src:url(data:font/woff2;base64,${fs.readFileSync(`${D}${dir}/files/${dir.split('-')[1]}-latin-${w}-${st}.woff2`).toString('base64')}) format("woff2");}`;
const CSS = [400, 500, 600].map((w) => face('Newsreader', 'fontsource-newsreader-5.3.0', w, 'normal')).concat([500, 600].map((w) => face('Newsreader', 'fontsource-newsreader-5.3.0', w, 'italic')))
  .concat([400, 500, 600, 700, 800].map((w) => face('Figtree', 'fontsource-figtree-5.3.0', w, 'normal')))
  .concat([600, 800].map((w) => face('Archivo', 'fontsource-archivo-5.3.0', w, 'normal'))).join('\n');
module.exports = async (page) => {
  await page.route(/fonts\.googleapis\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/css', body: CSS }));
  await page.route(/fonts\.gstatic\.com/, (r) => r.abort());
};
