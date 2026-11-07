/* The page content of the two rebuilt issue trainings: the story's beats and pictures, the checks, the voter at the door, the
   credit and the sources. The narration lines and the voter's facts live in ai/scenarios-issues.js (the server speaks and
   checks them); each beat here names the narration lines it plays by number. Built into wdpfxqlsvp/train/ by
   ai/tools/build-train.mjs. Every number on a screen comes from a source in the lesson's sources list. */

const BOLT = '<svg viewBox="0 0 24 24"><path d="M13.5 2 5 13.5h6L9.5 22 19 9.8h-6.2z" fill="currentColor"/></svg>';
const SERVER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="4" y="3.5" width="16" height="6" rx="1.5"/><rect x="4" y="14.5" width="16" height="6" rx="1.5"/><circle cx="8" cy="6.5" r="1" fill="currentColor"/><circle cx="8" cy="17.5" r="1" fill="currentColor"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17.5 19 7"/></svg>';
const SPLIT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21v-7M12 14 5 6M12 14l7-8M5 6v4M5 6h4M19 6v4M19 6h-4"/></svg>';
const SCHOOL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"><path d="M3 10 12 4l9 6"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/></svg>';
const KIDS = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="8" cy="7" r="3"/><circle cx="16.5" cy="8" r="2.6"/><path d="M2.5 20c0-3.6 2.4-6.5 5.5-6.5s5.5 2.9 5.5 6.5zM12.2 20c.3-2.9 2.1-5 4.3-5 2.6 0 4.6 2.3 4.6 5z"/></svg>';
const SHIELD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M12 3 5 6v5.5c0 4.3 3 8 7 9.5 4-1.5 7-5.2 7-9.5V6z"/></svg>';

/* the door, with the voter in it; .mouth moves with the voice */
function doorArt(p) {
  return `<svg viewBox="0 0 340 210" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <rect width="340" height="210" fill="${p.wall}"/>
  <rect x="0" y="186" width="340" height="24" fill="${p.floor}"/>
  <rect x="96" y="14" width="148" height="176" rx="3" fill="${p.frame}"/>
  <rect x="106" y="24" width="128" height="166" fill="#2E2A26"/>
  <rect x="106" y="24" width="128" height="166" fill="url(#lt)" opacity=".55"/>
  <defs><linearGradient id="lt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE7B0"/><stop offset="1" stop-color="#8A6A3E"/></linearGradient></defs>
  <rect x="234" y="24" width="10" height="166" fill="${p.doorEdge}"/>
  <circle cx="268" cy="52" r="7" fill="#FFE29A"/><circle cx="268" cy="52" r="16" fill="#FFE29A" opacity=".25"/>
  <g transform="translate(170 0)">
    <path d="M-52 210 C-52 156 -36 140 0 140 C36 140 52 156 52 210 Z" fill="${p.shirt}"/>
    ${p.collar || ""}
    <rect x="-9" y="116" width="18" height="26" rx="6" fill="${p.skin}"/>
    <ellipse cx="0" cy="96" rx="30" ry="34" fill="${p.skin}"/>
    ${p.hair}
    <circle cx="-11" cy="94" r="3.2" fill="#2B2420"/><circle cx="11" cy="94" r="3.2" fill="#2B2420"/>
    ${p.face || ""}
    <path d="M-12 82 q5 -4 9 -1 M12 82 q-5 -4 -9 -1" stroke="#4A3B30" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <g class="mouth" style="transform-origin:0px 114px;transform-box:view-box"><ellipse cx="0" cy="114" rx="8" ry="4" fill="#7A3B33"/></g>
    ${p.top || ""}
  </g>
  </svg>`;
}
const BARB = doorArt({
  wall: "#E7DDCC", floor: "#C9B79B", frame: "#F4F0E8", doorEdge: "#E4DDCF", skin: "#E9C2A4", shirt: "#7E5AA2",
  collar: '<path d="M-20 142 L0 162 L20 142" fill="#F1E9F7"/>',
  hair: '<path d="M-31 92 C-36 58 -14 50 0 52 C16 50 36 58 31 92 C28 74 18 66 0 66 C-18 66 -28 74 -31 92Z" fill="#C9C5C0"/><circle cx="0" cy="52" r="13" fill="#C9C5C0"/>',
  face: '<circle cx="-11" cy="94" r="8.5" fill="none" stroke="#6B5A4C" stroke-width="1.8"/><circle cx="11" cy="94" r="8.5" fill="none" stroke="#6B5A4C" stroke-width="1.8"/><path d="M-2.5 94 h5" stroke="#6B5A4C" stroke-width="1.8"/>',
});
const RAY = doorArt({
  wall: "#DCE3E6", floor: "#B9B1A2", frame: "#7A5C3E", doorEdge: "#6A4F35", skin: "#C98E64", shirt: "#B5493B",
  collar: '<path d="M-52 172 H52 M-52 190 H52 M-30 140 V210 M30 140 V210" stroke="#8E362B" stroke-width="3" opacity=".6"/>',
  hair: '<path d="M-29 88 C-31 70 -20 62 0 62 C20 62 31 70 29 88 C26 78 16 72 0 72 C-16 72 -26 78 -29 88Z" fill="#3B2A20"/>',
  face: '<path d="M-14 108 q14 -8 28 0 q-4 5 -14 4 q-10 1 -14 -4z" fill="#3B2A20"/>',
  top: '<path d="M-36 70 C-34 46 34 46 36 70 Z" fill="#6E5236"/><path d="M-50 72 C-30 62 30 62 50 72 C30 78 -30 78 -50 72Z" fill="#5C4329"/>',
});

export const CSS = `
.a { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 16px; position: relative; }
.a-bill { width: min(78%, 270px); height: 92%; max-height: 330px; background: #fff; border-radius: 14px; box-shadow: 0 10px 30px rgba(60,40,10,.12); padding: 16px 18px; display: flex; flex-direction: column; position: relative; }
.a-bill-h { display: flex; align-items: center; gap: 8px; font: 800 13px/1 Figtree; letter-spacing: .05em; text-transform: uppercase; color: #8A6A3E; }
.a-bill-h svg { width: 18px; height: 18px; color: #E08A1A; }
.a-bill hr { border: 0; border-top: 2px dashed #EADFCC; margin: 12px 0 0; }
.a-bars { flex: 1; display: flex; align-items: flex-end; justify-content: space-around; gap: 18px; padding-top: 10px; }
.a-b { flex: 1; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 6px; }
.a-b i { width: 100%; border-radius: 8px 8px 3px 3px; background: #F2C76B; display: block; transform-origin: bottom; }
.a-b.hot i { background: #E08A1A; }
.a-b .v { font: 800 26px/1 Figtree; color: #262320; }
.a-b.hot .v { color: #C2410C; font-size: 32px; }
.a-b small { font: 700 13px/1.1 Figtree; color: #6F685F; text-align: center; }
.a-stamp { position: absolute; right: -14px; top: 30%; transform: rotate(10deg); background: #C2412D; color: #fff; font: 800 13px/1.1 Figtree; letter-spacing: .02em; text-transform: uppercase; padding: 9px 11px; border-radius: 10px; box-shadow: 0 6px 16px rgba(194,65,45,.3); text-align: center; }
.a-stamp.pop[data-at].on { transform: rotate(10deg); }
.a-stamp.pop[data-at] { transform: rotate(10deg) scale(.6); }
.a-dc { display: flex; align-items: center; justify-content: center; gap: 4%; width: 100%; height: 100%; }
.a-dc svg.b { width: 52%; height: auto; max-height: 100%; }
.a-donut { width: 40%; aspect-ratio: 1; border-radius: 50%; background: conic-gradient(#E08A1A 0 45%, #E8E1D4 45% 100%); display: grid; place-items: center; position: relative; }
.a-donut::before { content: ""; position: absolute; inset: 18%; border-radius: 50%; background: #F3F0EA; }
.a-donut b { position: relative; font: 800 clamp(24px, 9vw, 40px)/1 Figtree; color: #C2410C; }
.a-donut small { position: absolute; top: 104%; left: -20%; right: -20%; text-align: center; font: 700 12px/1.25 Figtree; color: #6F685F; }
.a-quote { margin: 0; width: 100%; max-width: 360px; display: flex; flex-direction: column; gap: 14px; }
.a-quote .qm { font: 600 72px/0.6 Newsreader, Georgia, serif; color: #1F4C91; height: 34px; }
.a-quote blockquote { margin: 0; font: 600 clamp(21px, 6.1vw, 27px)/1.28 Newsreader, Georgia, serif; color: #1A2C4F; text-wrap: balance; }
.a-quote figcaption { display: flex; align-items: center; gap: 10px; font: 800 14px/1 Figtree; letter-spacing: .04em; text-transform: uppercase; color: #1F4C91; }
.a-quote figcaption i { width: 26px; height: 3px; background: #1F4C91; border-radius: 2px; }
.a-pill { align-self: flex-start; display: inline-flex; align-items: center; gap: 8px; background: #fff; border-radius: 99px; padding: 10px 14px; font: 700 15px/1.2 Figtree; box-shadow: 0 6px 18px rgba(31,76,145,.12); }
.a-pill svg { width: 18px; height: 18px; color: #35B57C; flex: none; }
.a-vs { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 100%; max-width: 380px; }
.a-side { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 10px; padding: 16px 10px; border-radius: 18px; }
.a-side.m { background: #1F4C91; color: #fff; }
.a-side.o { background: #fff; color: #262320; box-shadow: inset 0 0 0 2px #E6E0D6; }
.a-side .who { font: 800 12px/1 Figtree; letter-spacing: .06em; text-transform: uppercase; opacity: .8; }
.a-side .ic { width: 58px; height: 58px; border-radius: 50%; display: grid; place-items: center; }
.a-side.m .ic { background: rgba(255,255,255,.16); } .a-side.o .ic { background: #F3F0EA; color: #8E8579; }
.a-side .ic svg { width: 32px; height: 32px; }
.a-side b { font: 800 clamp(17px, 5vw, 20px)/1.2 Figtree; }
.a-side small { font: 600 13px/1.3 Figtree; opacity: .85; }
.a-stall { grid-column: 1 / -1; justify-self: center; display: inline-flex; align-items: center; gap: 8px; background: #FBE8E4; color: #9A3222; border-radius: 99px; padding: 9px 14px; font: 800 13px/1 Figtree; letter-spacing: .03em; text-transform: uppercase; }
.a-steps { display: flex; flex-direction: column; gap: 0; width: 100%; max-width: 300px; }
.a-step { display: flex; align-items: center; gap: 16px; position: relative; padding: 10px 0; }
.a-step .n { flex: none; width: 58px; height: 58px; border-radius: 18px; display: grid; place-items: center; color: #fff; box-shadow: 0 5px 0 rgba(0,0,0,.12); }
.a-step .n svg { width: 30px; height: 30px; }
.a-step b { font: 800 clamp(18px, 5.4vw, 22px)/1.2 Figtree; }
.a-step small { display: block; font: 600 14px/1.3 Figtree; color: #6F685F; margin-top: 2px; }
.a-step + .a-step::before { content: ""; position: absolute; left: 28px; top: -12px; height: 22px; border-left: 3px dotted #CFC8BC; }
.a-flow { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 6px; width: 100%; max-width: 380px; }
.a-bld { display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; font: 800 14px/1.2 Figtree; }
.a-bld svg { width: 82%; max-width: 120px; height: auto; }
.a-arrow { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.a-big { grid-column: 1 / -1; text-align: center; margin-top: 14px; }
.a-big b { display: block; font: 800 clamp(38px, 12vw, 54px)/1 Figtree; color: #1F4C91; }
.a-big small { font: 700 14px/1.3 Figtree; color: #6F685F; }
.a-kids { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px 12px; width: 100%; max-width: 330px; }
.a-kids svg { width: 100%; height: auto; color: #3B80B6; transition: color .5s; }
.a-legend { display: flex; flex-direction: column; gap: 6px; margin-top: 16px; font: 700 13px/1.25 Figtree; color: #4A453F; }
.a-legend span { display: flex; gap: 8px; align-items: center; } .a-legend i { width: 12px; height: 12px; border-radius: 3px; flex: none; }
.a-col { display: flex; flex-direction: column; align-items: center; width: 100%; }
.a-grow { display: flex; align-items: flex-end; justify-content: center; gap: 28px; height: 78%; width: 100%; max-width: 300px; }
.a-grow > div { flex: 1; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 8px; }
.a-grow i { display: block; width: 100%; border-radius: 10px 10px 4px 4px; }
.a-grow .v { font: 800 30px/1 Figtree; }
.a-grow small { font: 700 13px/1.2 Figtree; color: #6F685F; text-align: center; }
.a-dash { background: repeating-linear-gradient(135deg, #E08A2C 0 10px, #F2B36B 10px 20px) !important; }
.a-chips { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
.a-caps { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; max-width: 360px; align-items: end; }
.a-cap { display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; font: 800 14px/1.2 Figtree; }
.a-cap svg { width: 100%; max-width: 140px; height: auto; }
.a-no { grid-column: 1 / -1; justify-self: center; display: inline-flex; gap: 8px; align-items: center; background: #FBE8E4; color: #9A3222; border-radius: 99px; padding: 10px 14px; font: 800 14px/1.2 Figtree; }
.a-no svg { width: 18px; height: 18px; }
.kids-in svg { transition: color .5s ease; transition-delay: calc(700ms + var(--k) * 160ms); }
.kids-in.turn svg.kid7 { color: #E08A2C; }
.stag > [data-at]:nth-child(2) { transition-delay: .35s; } .stag > [data-at]:nth-child(3) { transition-delay: .7s; }

/* scale every picture to its panel (container units), so a tall phone gets a big picture, never a small one in a sea of beige */
.a { padding: 6cqmin; }
.a-bill { width: min(78cqw, 62cqh); height: min(86cqh, 120cqw); max-height: none; padding: 5cqmin 5.5cqmin; }
.a-bill-h { font-size: max(12px, 3.6cqmin); } .a-bill-h svg { width: 5cqmin; height: 5cqmin; }
.a-b .v { font-size: max(22px, 7.5cqmin); } .a-b.hot .v { font-size: max(26px, 9.5cqmin); } .a-b small { font-size: max(12px, 3.6cqmin); }
.a-stamp { font-size: max(12px, 3.6cqmin); padding: 2.6cqmin 3cqmin; }
.a-dc svg.b { width: 100%; }
.a-donut b { font-size: max(24px, 11cqmin); } .a-donut small { font-size: max(12px, 3.4cqmin); }
.a-quote { max-width: 94cqw; gap: 3.5cqmin; }
.a-quote .qm { font-size: max(64px, 24cqmin); height: 9cqmin; }
.a-quote blockquote { font-size: max(20px, min(8.4cqw, 6.2cqh)) !important; }
.a-quote figcaption { font-size: max(12px, 3.8cqmin); }
.a-pill { font-size: max(14px, min(4.6cqw, 3.4cqh)); padding: 2.6cqmin 3.6cqmin; }
.a-pill svg { width: max(16px, 4.6cqmin); height: max(16px, 4.6cqmin); }
.a-vs { max-width: 100%; gap: 3cqmin; }
.a-side { padding: 5cqmin 3cqmin; gap: 3cqmin; }
.a-side .who { font-size: max(11px, 3.4cqmin); }
.a-side .ic { width: max(52px, 17cqmin); height: max(52px, 17cqmin); } .a-side .ic svg { width: 55%; height: 55%; }
.a-side b { font-size: max(16px, min(6cqw, 4.4cqh)); } .a-side small { font-size: max(12px, 3.8cqmin); }
.a-stall { font-size: max(12px, 3.6cqmin); padding: 2.6cqmin 4cqmin; }
.a-steps { max-width: 100%; }
.a-step { gap: 4.5cqmin; padding: 3cqmin 0; }
.a-step .n { width: max(52px, 17cqmin); height: max(52px, 17cqmin); border-radius: 5cqmin; } .a-step .n svg { width: 52%; height: 52%; }
.a-step b { font-size: max(18px, min(6.8cqw, 4.8cqh)); } .a-step small { font-size: max(13px, min(4.2cqw, 3cqh)); }
.a-step + .a-step::before { left: max(26px, 8.5cqmin); }
.a-flow { max-width: 100%; }
.a-bld { font-size: max(13px, 4.2cqmin); } .a-bld svg { max-width: none; width: 100%; }
.a-big b { font-size: max(36px, 15cqmin); } .a-big small { font-size: max(13px, 4cqmin); }
.a-kids { max-width: min(92cqw, 78cqh); gap: 3cqmin 3.6cqmin; }
.a-legend { font-size: max(12px, 3.8cqmin); } .a-legend i { width: 3.6cqmin; height: 3.6cqmin; }
.a-grow { max-width: 86cqw; height: 84%; } .a-grow .v { font-size: max(28px, 10cqmin); } .a-grow small { font-size: max(12px, 3.8cqmin); }
.a-caps { max-width: 100%; } .a-cap { font-size: max(13px, 4.2cqmin); } .a-cap svg { max-width: none; }
.a-no { font-size: max(13px, 4.2cqmin); padding: 2.8cqmin 4cqmin; }
.a-opp { flex-direction: column !important; text-align: center !important; padding: 7cqmin 5cqmin !important; gap: 4cqmin !important; }
.a-opp b { font-size: max(21px, min(8cqw, 6cqh)) !important; }
@container (aspect-ratio < 0.9) {
  .a-dc { flex-direction: column; gap: 9cqmin; }
  .a-dc > div:first-child { width: min(74cqw, 44cqh) !important; }
  .a-donut { width: min(52cqw, 30cqh); }
  .a-flow { grid-template-columns: 1fr; justify-items: center; gap: 2cqmin; }
  .a-flow .a-bld { width: min(46cqw, 24cqh); }
  .a-flow .a-arrow svg { transform: rotate(90deg); }
  .a-flow .a-big { margin-top: 3cqmin; }
  .a-vs { grid-template-columns: 1fr; }
  .a-side { display: grid; grid-template-columns: auto 1fr; column-gap: 5cqmin; row-gap: 1.2cqmin; align-items: center; justify-items: start; text-align: left; padding: 5cqmin 6cqmin; } .a-side .ic { grid-row: 1 / span 3; } .a-side .who, .a-side b, .a-side small { grid-column: 2; }
  .a-caps { grid-template-columns: 1fr; justify-items: center; gap: 4cqmin; } .a-caps .a-cap { width: min(60cqw, 30cqh); }
}
`;

const PERSON = (cls, k) => `<svg class="${cls}" style="--k:${k}" viewBox="0 0 24 30" aria-hidden="true"><circle cx="12" cy="7" r="5.5" fill="currentColor"/><path d="M2 29c0-7 4.5-12.5 10-12.5S22 22 22 29z" fill="currentColor"/></svg>`;
const DC_SVG = `<svg class="b" viewBox="0 0 200 190" aria-hidden="true">
  <path d="M12 40 L40 12 L68 40 M40 12 V150 M24 70 H56 M20 110 H60" stroke="#8E8579" stroke-width="4" fill="none" stroke-linejoin="round"/>
  <path class="flow" d="M40 40 C70 30 90 50 104 64" stroke="#E08A1A" stroke-width="4" fill="none"/>
  <rect x="88" y="62" width="108" height="122" rx="10" fill="#1F2A3D"/>
  ${Array.from({ length: 5 }, (_, r) => Array.from({ length: 2 }, (_, c) => `<rect x="${100 + c * 48}" y="${76 + r * 21}" width="40" height="13" rx="3" fill="#33435F"/><circle class="blink" style="animation-delay:${(r * 2 + c) * 210 % 1300}ms" cx="${132 + c * 48}" cy="${82.5 + r * 21}" r="2.6" fill="#7EE0A8"/>`).join("")).join("")}
  <path d="M168 40 L154 64 H166 L156 86 L184 52 H170 L178 40z" fill="#F2B134"/>
</svg>`;
const SCHOOL_BLD = (col, roof, label) => `<svg viewBox="0 0 120 100" aria-hidden="true"><path d="M8 44 L60 12 L112 44" fill="${roof}"/><rect x="16" y="42" width="88" height="54" fill="${col}"/><rect x="50" y="64" width="20" height="32" fill="#fff" opacity=".85"/><rect x="24" y="52" width="16" height="14" fill="#fff" opacity=".7"/><rect x="80" y="52" width="16" height="14" fill="#fff" opacity=".7"/><path d="M60 12 V-2 M60 -2 h16 v9 h-16" stroke="${roof}" stroke-width="3" fill="${label}"/></svg>`;
const CAPITOL = (col) => `<svg viewBox="0 0 140 100" aria-hidden="true"><path d="M70 6 v10" stroke="${col}" stroke-width="3"/><path d="M48 40 C48 24 92 24 92 40 Z" fill="${col}"/><rect x="42" y="40" width="56" height="8" fill="${col}"/><rect x="14" y="56" width="112" height="6" fill="${col}"/>${[24, 40, 56, 72, 88, 104].map((x) => `<rect x="${x}" y="62" width="8" height="28" fill="${col}" opacity=".85"/>`).join("")}<rect x="8" y="90" width="124" height="8" fill="${col}"/><path d="M20 56 L70 46 L120 56Z" fill="${col}"/></svg>`;
const STATEHOUSE = (col) => `<svg viewBox="0 0 140 100" aria-hidden="true"><path d="M22 52 L70 26 L118 52Z" fill="${col}"/><rect x="28" y="52" width="84" height="38" fill="${col}" opacity=".9"/>${[38, 56, 74, 92].map((x) => `<rect x="${x}" y="58" width="9" height="26" fill="#fff" opacity=".5"/>`).join("")}<rect x="20" y="90" width="100" height="8" fill="${col}"/><rect x="54" y="8" width="32" height="20" rx="3" fill="#fff" stroke="${col}" stroke-width="3"/><text x="70" y="22" text-anchor="middle" font-family="Figtree" font-weight="800" font-size="10" fill="${col}">$</text></svg>`;

export const LESSONS = {
  oh: {
    scen: "oh_bills", code: "OH", short: "Your electric bill", nextId: "tx",
    coverH: "Three things we want you to know about your electric bill",
    startLabel: "Play the one-minute story",
    points: [
      ["Bills are up more than half since 2019", "#FDF1DC", '<span style="color:#E08A1A;display:contents">' + BOLT + "</span>"],
      ["Data centers are the biggest new reason", "#E3E8F0", '<span style="color:#1F2A3D;display:contents">' + SERVER + "</span>"],
      ["Maya makes them pay their own way. Her opponent leaves it to each state", "#E7EEF9", '<span style="color:#1F4C91;display:contents">' + CHECK + "</span>"],
    ],
    beats: [
      { h: "Home electric bills are up more than half since 2019", lines: [0, 1, 2], art: `<div class="a"><div class="a-bill rise" data-at="0"><div class="a-bill-h">${BOLT}Monthly electric bill</div><hr><div class="a-bars"><div class="a-b rise" data-at="1"><span class="v">$89</span><i style="height:48%"></i><small>2019</small></div><div class="a-b hot rise" data-at="2"><span class="v">$145</span><i style="height:78%"></i><small>This January</small></div></div><div class="a-stamp pop" data-at="2">Up more<br>than half</div></div></div>` },
      { h: "Data centers are the biggest new reason bills went up", lines: [3, 4], art: `<div class="a"><div class="a-dc"><div class="rise" data-at="3" style="width:52%;display:flex">${DC_SVG.replace('class="b"', 'class="b" style="width:100%"')}</div><div class="a-donut pop" data-at="4"><b>45%</b><small>of the costs in the grid’s last three power auctions</small></div></div></div>` },
      { h: "Maya: data centers pay their full cost, not you", lines: [5, 6], art: `<div class="a"><figure class="a-quote"><div class="qm rise" data-at="5">“</div><blockquote class="rise" data-at="5">I’ll require the data centers to pay the full cost of their own electricity, not you.</blockquote><figcaption class="rise" data-at="5"><i></i>Maya, in her words</figcaption><span class="a-pill rise" data-at="6">${CHECK}Also fighting to cap rate hikes</span></figure></div>` },
      { h: "Her opponent’s bill leaves it up to each state", lines: [7], art: `<div class="a"><div class="a-vs stag"><div class="a-side m rise" data-at="7"><span class="who">Maya</span><span class="ic">${CHECK}</span><b>Requires data centers to pay</b></div><div class="a-side o rise" data-at="7"><span class="who">Her opponent</span><span class="ic">${SPLIT}</span><b>Asks each state to consider it</b><small>No state has to</small></div><span class="a-stall pop" data-at="7" style="transition-delay:1.1s">Stalled in the Senate</span></div></div>` },
      { h: "At the door: their bill, the reason, then Maya’s fix", lines: [8], art: `<div class="a"><div class="a-steps stag"><div class="a-step rise" data-at="8"><span class="n" style="background:#E08A1A">${BOLT}</span><div><b>Their bill</b><small>Up more than half since 2019</small></div></div><div class="a-step rise" data-at="8"><span class="n" style="background:#1F2A3D">${SERVER}</span><div><b>The reason</b><small>Data centers’ power demand</small></div></div><div class="a-step rise" data-at="8"><span class="n" style="background:#1F4C91">${CHECK}</span><div><b>Maya’s fix</b><small>They pay their full cost, not you</small></div></div></div></div>` },
    ],
    quiz: [
      { h: "A neighbor says this. What’s accurate?", voter: "“It’s all from that power-company bailout scandal a few years back.”", opts: ["Right, that’s the main reason.", "That law’s charges ended. The big new cost is data centers."], right: 1, yes: "Exactly. The bailout law’s charges were repealed or have ended. Data center demand is the big new driver.", nope: "Not quite. The bailout law’s charges were repealed or have ended. Data center demand is the big new driver.", next: "One more quick check" },
      { h: "True or false: her opponent’s bill makes data centers pay.", opts: ["True", "False"], right: 1, yes: "Right. It only asks each state to consider it. No state has to.", nope: "It’s false. His bill only asks each state to consider it. No state has to.", next: "Now say it out loud" },
    ],
    sayIt: { h: "Say Maya’s plan out loud, in one sentence", sub: "Like you would on a porch. Your words show up as you talk.",
      re: ["(make|require|have|force|want|get|push)[^.]{0,40}(data cent|them|big tech|tech companies)[^.]{0,50}(pay|cover|foot)", "data cent[^.]{0,40}(pay|cover)[^.]{0,40}(full|own|their|cost|electric|power)"],
      yes: "That’s it: data centers pay the full cost of their own electricity, not regular customers.", model: "Maya would make data centers pay the full cost of their own electricity, so it doesn’t land on your bill.", next: "Meet Barb at her door" },
    voter: { name: "Barb", art: BARB, introH: "Now talk it through with Barb", introSub: "A retired bus driver on a fixed income, with a question about her bill. Answer out loud, the way you would on her porch.", goals: ["Start with her bill", "Say why bills went up", "Maya’s plan, and how her opponent’s bill differs"] },
    cards: ["bill", "why", "plan", "opp", "accurate"],
    doneH: "You’re ready for the electric bill question",
    doneSub: "Their bill, the reason, then Maya’s fix: data centers pay their own way.",
    credit: "This training was built from <b>Sherrod Brown</b>’s winning 2026 campaign for U.S. Senate in Ohio. The figures are Ohio’s. Maya Kaur and Woodbridge are a sample campaign.",
    sourcesSub: "Every number and quote in this lesson, with links.",
    sources: [
      ["The facts", [
        ["PolitiFact, from state utility bill data", "https://politifact.com/factchecks/2026/jul/20/sherrod-brown/sherrod-brown-blames-hb-6-for-electric-bill-spike-experts-say-the-law-wasnt-the-main-cause/", "Ohio’s average home bill, about $89 a month in 2019 and about $145 this January; the bailout law’s charges repealed or ended"],
        ["Utility Dive, on the grid’s independent market monitor", "https://www.utilitydive.com/news/data-centers-pjm-capacity-auction/808951/", "Data centers drove 45% of the costs ($21.3 billion of $47.2 billion) in the grid’s last three capacity auctions"],
        ["Roll Call", "https://rollcall.com/2026/09/30/voluntary-ratepayer-protection-bill-blocked-in-senate-again/", "The opponent’s bill asks states to consider rules; none has to; it passed the House 417 to 3 and stalled in the Senate, 57 to 43"],
      ]],
      ["Maya’s words (Sherrod Brown’s campaign)", [
        ["Fox News, quoting Brown’s campaign", "https://www.foxnews.com/politics/brown-embraced-amazon-data-centers-blaming-higher-utility-costs-high-stakes-senate-race", "“I’ll require the data centers to pay the full cost of their own electricity, not you.”"],
        ["sherrodbrown.com", "https://www.sherrodbrown.com/our-fight/", "Fighting to require data centers to pay the full cost of their utilities and to cap rate hikes"],
      ]],
      ["Her opponent (Sen. Jon Husted)", [
        ["Roll Call", "https://rollcall.com/2026/09/30/voluntary-ratepayer-protection-bill-blocked-in-senate-again/", "Husted introduced the Senate version of the voluntary bill and led efforts to pass it"],
      ]],
    ],
  },
  tx: {
    scen: "tx_vouchers", code: "TX", short: "School vouchers", nextId: "oh",
    coverH: "Three things we want you to know about school vouchers",
    startLabel: "Play the one-minute story",
    points: [
      ["$1 billion in tax money for private school, to start", "#E7EEF9", '<span style="color:#1F4C91;display:contents">' + SCHOOL + "</span>"],
      ["7 in 10 vouchers went to kids who weren’t in public school", "#FCEBD8", '<span style="color:#E08A2C;display:contents">' + KIDS + "</span>"],
      ["Maya fights vouchers. Her opponent vowed to defend them", "#E6F5EC", '<span style="color:#22895A;display:contents">' + CHECK + "</span>"],
    ],
    beats: [
      { h: "Vouchers started with $1 billion from the budget that pays for public schools", lines: [0, 1, 2], art: `<div class="a"><div class="a-flow"><div class="a-bld rise" data-at="0">${SCHOOL_BLD("#3B80B6", "#2C5F8A", "#fff")}Public schools</div><div class="a-arrow rise" data-at="1"><svg width="70" height="34" viewBox="0 0 70 34" aria-hidden="true"><path class="flow" d="M4 17 H60" stroke="#1F4C91" stroke-width="5" fill="none"/><path d="M54 7 L66 17 L54 27" stroke="#1F4C91" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg><span style="font:800 18px/1 Figtree;color:#1F4C91">$</span></div><div class="a-bld rise" data-at="0">${SCHOOL_BLD("#E08A2C", "#B5541B", "#fff")}Private schools</div><div class="a-big pop" data-at="2"><b>$1 billion</b><small>to start, from the same state budget</small></div></div></div>` },
      { h: "7 in 10 vouchers went to kids who weren’t in public school", lines: [3], art: `<div class="a"><div class="a-col"><div class="a-kids kids-in" data-turn="3">${Array.from({ length: 10 }, (_, k) => PERSON(k < 7 ? "kid7" : "kid3", k)).join("")}</div><div class="a-legend rise" data-at="3"><span><i style="background:#E08A2C"></i>Already in private school or homeschooled</span><span><i style="background:#3B80B6"></i>Came from public school</span></div></div></div>` },
      { h: "The state is already asking to double it", lines: [4], art: `<div class="a"><div class="a-grow"><div><span class="v" style="color:#B5541B">$1B</span><i style="height:38%;background:#E0B98A"></i><small>To start</small></div><div class="grow" data-at="4"><span class="v" style="color:#B5541B">$2B+</span><i class="a-dash" style="height:80%"></i><small>Requested next</small></div></div></div>` },
      { h: "Maya: public money belongs in public schools", lines: [5, 6], art: `<div class="a"><figure class="a-quote"><div class="qm rise" data-at="5">“</div><blockquote class="rise" data-at="5">A program that is taking tax dollars out of our public schools.</blockquote><figcaption class="rise" data-at="5"><i></i>Maya, on vouchers</figcaption><div class="a-chips stag"><span class="a-pill rise" data-at="6">${CHECK}Reject the voucher scams</span><span class="a-pill rise" data-at="6">${CHECK}Protect special education funding</span><span class="a-pill rise" data-at="6">${CHECK}Hire more teachers</span></div></figure></div>` },
      { h: "Her opponent backs vouchers and vowed to defend them", lines: [7], art: `<div class="a"><figure class="a-quote"><div class="a-side o a-opp rise" data-at="7"><span class="ic">${SHIELD}</span><span class="who">Her opponent, as attorney general</span><b style="font-family:Newsreader,Georgia,serif;font-weight:600">“I promise to vigorously defend this law.”</b></div></figure></div>` },
      { h: "Never promise Maya will cancel the state’s program", lines: [8], art: `<div class="a"><div class="a-caps"><div class="a-cap rise" data-at="8">${CAPITOL("#1F4C91")}U.S. Senate</div><div class="a-cap rise" data-at="8">${STATEHOUSE("#B5541B")}State voucher law</div><span class="a-no pop" data-at="8" style="transition-delay:.6s">${'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/></svg>'}A senator can’t cancel it</span></div></div>` },
    ],
    quiz: [
      { h: "True or false: most vouchers went to kids leaving public schools.", opts: ["True", "False"], right: 1, yes: "Right. Seven in ten weren’t in public school to begin with.", nope: "It’s false. Seven in ten weren’t in public school to begin with.", next: "One more quick check" },
      { h: "A voter asks this. What do you say?", voter: "“So if Maya wins, she’ll shut down the state’s voucher program?”", opts: ["Yes, on her first day.", "A senator can’t cancel a state program. She’d fight vouchers in the Senate and protect public school money."], right: 1, yes: "Exactly. Never promise what a senator can’t do.", nope: "Careful: a senator can’t cancel a state program. She’d fight vouchers in the Senate and protect public school money.", next: "Now say it out loud" },
    ],
    sayIt: { h: "Say Maya’s view out loud, in one sentence", sub: "Like you would in a driveway. Your words show up as you talk.",
      re: ["(against|oppos|fight|stop|reject|no on|end)[^.]{0,40}voucher", "public (money|dollars?|funds?|tax)[^.]{0,40}public school", "tax (money|dollars?)[^.]{0,40}(out of|from|away from)[^.]{0,30}public school", "(protect|fund|keep)[^.]{0,30}public school"],
      yes: "That’s it: Maya fights vouchers so public money stays in public schools.", model: "Maya fights vouchers because they take tax dollars out of our public schools.", next: "Meet Ray in his driveway" },
    voter: { name: "Ray", art: RAY, introH: "Now talk it through with Ray", introSub: "A ranch foreman and dad. His sister uses a voucher. Answer out loud, the way you would in his driveway.", goals: ["Say where the voucher money goes", "Explain Maya’s view", "Respect his sister’s choice"] },
    cards: ["money", "plan", "respect", "opp", "accurate"],
    doneH: "You’re ready for the voucher question",
    doneSub: "Where the money goes, Maya’s view, and respect for every family’s choice.",
    credit: "This training was built from <b>James Talarico</b>’s winning 2026 campaign for U.S. Senate in Texas. The figures are Texas’s. Maya Kaur and Woodbridge are a sample campaign.",
    sourcesSub: "Every number and quote in this lesson, with links.",
    sources: [
      ["The facts", [
        ["The Texas Tribune", "https://www.texastribune.org/2026/09/03/texas-school-voucher-program-2-billion-expansion-budget-comptroller/", "$1 billion to start; nearly 110,000 students funded; the comptroller asks to raise it to more than $2 billion"],
        ["KPRC, from the Texas Comptroller’s data", "https://www.click2houston.com/news/local/2026/08/18/70-of-texas-voucher-awardees-previously-attended-private-school-or-were-homeschooled-state-data-shows/", "70% of awardees had been in private school or homeschooled (parent-reported)"],
        ["KWTX", "https://www.kwtx.com/2025/04/17/voucher-vote-updates-bid-send-voucher-plan-statewide-vote-is-defeated/", "The bid to put vouchers to a statewide vote failed, 86 to 62"],
      ]],
      ["Maya’s words (James Talarico’s campaign)", [
        ["jamestalarico.com", "https://jamestalarico.com/issue/public-education/", "Vouchers as “a program that is taking tax dollars out of our public schools”; “Reject the voucher scams”; special education funding; hire more teachers"],
      ]],
      ["Her opponent (Ken Paxton)", [
        ["Texas Attorney General’s office", "https://www.texasattorneygeneral.gov/news/releases/attorney-general-ken-paxton-celebrates-school-choice-texans-and-vows-defend-new-law", "“I promise to vigorously defend this law.”"],
      ]],
    ],
  },
};
