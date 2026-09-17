// Builds assets/header.svg: the name decrypting from noise, letter by letter,
// the way the section labels do on lorenzopasquali.dev, over the site's
// drifting dot grid. GitHub serves README images from a sandbox that loads
// nothing external, so the font travels inside the file.
//
//   node scripts/header.mjs
//
// The embedded face is JetBrains Mono, under the SIL Open Font License 1.1;
// the licence travels next to it in scripts/JetBrainsMono-OFL.txt.
import { readFileSync, writeFileSync } from 'node:fs';

const NAME = 'LORENZO PASQUALI';
const ROLE = 'AI FULLSTACK DEVELOPER';
const TAG = '// lorenzopasquali.dev';
const GLYPHS = '01X#@$%&*!?/<>ABCDEFGHKMNRSTWZ';

const W = 880;
const H = 210;
const NAME_SIZE = 46;
const CHAR_W = NAME_SIZE * 0.6; // JetBrains Mono advances 600/1000 of the em
const START = 0.35; // seconds before the first letter starts
const STAGGER = 0.07; // between letters
const FRAME = 0.055; // how long each noise glyph shows
const FRAMES = 7; // noise glyphs before the letter settles

const font = readFileSync(new URL('./jetbrains-mono-var.woff2', import.meta.url)).toString('base64');

// Deterministic noise, so regenerating the file does not churn the diff.
let seed = 7;
const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = () => GLYPHS[Math.floor(random() * GLYPHS.length)];
const esc = (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c] ?? c;

const x0 = W / 2 - (NAME.length * CHAR_W) / 2;
const nameY = 108;
const glyphs = [];
let settled = 0;

[...NAME].forEach((char, i) => {
  if (char === ' ') return;
  const x = (x0 + i * CHAR_W + CHAR_W / 2).toFixed(1);
  const t = START + i * STAGGER;
  for (let f = 0; f < FRAMES; f += 1) {
    glyphs.push(`<text class="n f" x="${x}" y="${nameY}" style="animation-delay:${(t + f * FRAME).toFixed(3)}s">${esc(pick())}</text>`);
  }
  const done = t + FRAMES * FRAME;
  settled = Math.max(settled, done);
  glyphs.push(`<text class="n s" x="${x}" y="${nameY}" style="animation-delay:${done.toFixed(3)}s">${char}</text>`);
});

const roleDelay = (settled + 0.15).toFixed(2);
// 14px mono advances 0.6 em, plus the 0.2 em tracking the role carries.
const roleX = W / 2 + (ROLE.length * (14 * 0.6 + 14 * 0.2)) / 2 + 8;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Lorenzo Pasquali, AI Fullstack Developer">
<title>Lorenzo Pasquali, AI Fullstack Developer</title>
<defs>
<style>
@font-face{font-family:"JBM";src:url(data:font/woff2;base64,${font}) format("woff2");font-weight:100 800}
text{font-family:"JBM",ui-monospace,Menlo,monospace}
.n{font-size:${NAME_SIZE}px;font-weight:600;fill:#f5f5f7;text-anchor:middle;opacity:0}
.f{animation:flash ${FRAME}s steps(1);animation-fill-mode:none}
.s{animation:on .01s forwards}
.tag{font-size:12px;fill:rgba(245,245,247,.45);letter-spacing:.08em}
.role{font-size:14px;fill:rgba(245,245,247,.7);letter-spacing:.2em;text-anchor:middle;opacity:0;animation:on .6s ease-out ${roleDelay}s forwards}
.cur{fill:#f5f5f7;opacity:0;animation:on .01s ${roleDelay}s forwards,blink 1.1s steps(1) ${roleDelay}s infinite}
.grid{animation:drift 6s linear infinite}
.sweep{animation:sweep 2.4s ease-in-out .2s both}
@keyframes flash{0%,100%{opacity:1}}
@keyframes on{to{opacity:1}}
@keyframes blink{50%{opacity:0}}
@keyframes drift{to{transform:translate(26px,26px)}}
@keyframes sweep{from{transform:translateY(-60px);opacity:.9}to{transform:translateY(${H + 60}px);opacity:0}}
@media (prefers-reduced-motion:reduce){
.f,.sweep{display:none}.s,.role,.cur{animation:none;opacity:1}.grid{animation:none}
}
</style>
<pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="13" cy="13" r="1" fill="#f5f5f7" fill-opacity=".09"/></pattern>
<radialGradient id="fade" cx="50%" cy="50%" r="65%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>
<mask id="vignette"><rect width="${W}" height="${H}" fill="url(#fade)"/></mask>
<linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f5f5f7" stop-opacity="0"/><stop offset=".5" stop-color="#f5f5f7" stop-opacity=".07"/><stop offset="1" stop-color="#f5f5f7" stop-opacity="0"/></linearGradient>
<clipPath id="card"><rect width="${W}" height="${H}" rx="14"/></clipPath>
</defs>
<g clip-path="url(#card)">
<rect width="${W}" height="${H}" fill="#08080a"/>
<g mask="url(#vignette)"><rect class="grid" x="-26" y="-26" width="${W + 52}" height="${H + 52}" fill="url(#dots)"/></g>
<rect class="sweep" y="0" width="${W}" height="60" fill="url(#beam)"/>
<text class="tag" x="28" y="36">${TAG}</text>
<text class="tag" x="${W - 28}" y="36" text-anchor="end">BR · REMOTE / RELOCATION</text>
${glyphs.join('\n')}
<text class="role" x="${W / 2}" y="152">${ROLE}</text>
<rect class="cur" x="${roleX.toFixed(1)}" y="140" width="8" height="15"/>
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="14" fill="none" stroke="#f5f5f7" stroke-opacity=".12"/>
</svg>
`;

writeFileSync(new URL('../assets/header.svg', import.meta.url), svg);
console.log(`assets/header.svg ${(svg.length / 1024).toFixed(1)} kB, name settles at ${settled.toFixed(2)}s`);
