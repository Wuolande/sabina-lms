// Redraws the favicon, app icons and default sharing image in the brand colours.
//   node scripts/brand-icons.mjs [#primary] [#accent]
// Defaults are the colours in cms/brand.ts. Run again after changing the brand colours.
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const [primary = "#0000FE", accent = "#009EFF"] = process.argv.slice(2);
const deep = "#0C1249";

/** The Sabina mark: an open book on the primary blue with a sky-blue spark. */
const mark = (size, { pad = 0, radius = 9 } = {}) => {
  const s = 32 - pad * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${primary}"/><stop offset="1" stop-color="${deep}"/></linearGradient></defs>
  <rect width="32" height="32" rx="${radius}" fill="url(#g)"/>
  <g transform="translate(${pad} ${pad}) scale(${s / 32})">
    <path d="M7 11.5c3.2-1.4 6.2-1.2 9 .8v11c-2.8-2-5.8-2.2-9-.8v-11Z" fill="#fff" opacity="0.95"/>
    <path d="M25 11.5c-3.2-1.4-6.2-1.2-9 .8v11c2.8-2 5.8-2.2 9-.8v-11Z" fill="#fff" opacity="0.75"/>
    <circle cx="23.5" cy="7.5" r="2.6" fill="${accent}"/>
  </g>
</svg>`;
};

const png = (svg, out) => sharp(Buffer.from(svg)).png().toFile(out);

writeFileSync("public/favicon.svg", mark(64));
await png(mark(192), "public/icons/icon-192.png");
await png(mark(512), "public/icons/icon-512.png");
// Maskable icons need the artwork inside the central safe zone and a square background.
await png(mark(512, { pad: 5, radius: 0 }), "public/icons/maskable-512.png");
await png(mark(180, { radius: 0 }), "public/apple-touch-icon.png");
// favicon.ico: a single 32px PNG inside an ICO container.
const ico32 = await sharp(Buffer.from(mark(32))).png().toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
header.writeUInt8(32, 6); header.writeUInt8(32, 7); header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12);
header.writeUInt32LE(ico32.length, 14); header.writeUInt32LE(22, 18);
writeFileSync("public/favicon.ico", Buffer.concat([header, ico32]));

// Default sharing image (1200 × 630), used when a page has none of its own.
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${primary}"/><stop offset="1" stop-color="${deep}"/></linearGradient>
    <radialGradient id="glow" cx="0.85" cy="0.1" r="0.6"><stop offset="0" stop-color="${accent}" stop-opacity="0.65"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <g transform="translate(96 150) scale(4.5)">
    <rect width="32" height="32" rx="9" fill="#fff" fill-opacity="0.12"/>
    <path d="M7 11.5c3.2-1.4 6.2-1.2 9 .8v11c-2.8-2-5.8-2.2-9-.8v-11Z" fill="#fff" opacity="0.95"/>
    <path d="M25 11.5c-3.2-1.4-6.2-1.2-9 .8v11c2.8-2 5.8-2.2 9-.8v-11Z" fill="#fff" opacity="0.75"/>
    <circle cx="23.5" cy="7.5" r="2.6" fill="${accent}"/>
  </g>
  <text x="96" y="400" font-family="Inter, DejaVu Sans, sans-serif" font-size="88" font-weight="800" fill="#fff">Sabina<tspan fill="${accent}">.</tspan></text>
  <text x="96" y="470" font-family="Inter, DejaVu Sans, sans-serif" font-size="40" font-weight="500" fill="#fff" fill-opacity="0.85">Live 1-on-1 lessons with tutors we've checked.</text>
  <rect x="96" y="520" width="120" height="8" rx="4" fill="${accent}"/>
</svg>`;
await png(og, "public/images/og-default.png");
console.log("Icons and sharing image redrawn in", primary, accent);
