// Redraws the favicon, app icons and default sharing image with the Sabina Edge shield.
//   node scripts/brand-icons.mjs [#primary] [#gold]
// Defaults are the colours in cms/brand.ts. Run again after changing the brand colours.
// The shield is the same drawing as components/brand/SabinaMark.tsx.
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const [primary = "#1800AB", gold = "#FCC10D"] = process.argv.slice(2);
const deep = "#14087C"; // brand-800
const rim = "#06368F"; // logo rim navy
const navy = "#0F123F"; // brand-950

/** The shield artwork (viewBox 0 0 120 150), as SVG elements. */
const shield = `
  <defs><linearGradient id="face" x1="0" y1="0" x2="0.6" y2="1"><stop offset="0" stop-color="${primary}"/><stop offset="1" stop-color="${deep}"/></linearGradient></defs>
  <path d="M60 2C61 10 62 13 69 14C62 15 61 18 60 26C59 18 58 15 51 14C58 13 59 10 60 2Z" fill="${gold}"/>
  <path d="M60 22C78 22 96 26 111 33V80C111 111 89 132 60 146C31 132 9 111 9 80V33C24 26 42 22 60 22Z" fill="${rim}"/>
  <path d="M111 40V80C111 111 89 132 60 146V139C85 127 104 108 104 80V46Z" fill="${gold}"/>
  <path d="M60 29C76 29 91 32 104 38V80C104 107 85 125 60 137C35 125 16 107 16 80V38C29 32 44 29 60 29Z" fill="url(#face)"/>
  <path d="M88 40C88.6 45 89.4 46 94 46.6C89.4 47.2 88.6 48.2 88 53C87.4 48.2 86.6 47.2 82 46.6C86.6 46 87.4 45 88 40Z" fill="${gold}"/>
  <path d="M55 64H37Q28 64 28 73V74Q28 83 37 83H46Q55 83 55 92V94Q55 103 46 103H26" fill="none" stroke="#fff" stroke-width="9" stroke-linejoin="round"/>
  <path d="M93 64H70V103H93M70 83.5H89" fill="none" stroke="${gold}" stroke-width="9" stroke-linejoin="round"/>
  <path d="M12 111C40 128 92 120 110 60C96 110 46 122 12 111Z" fill="${gold}"/>`;

/** A square icon: the shield centred on a background (or transparent), taking `scale` of the height. */
const icon = (size, { bg = null, radius = 0, scale = 0.86 } = {}) => {
  const h = 150 / scale, w = h; // square canvas in shield units
  const x = (w - 120) / 2, y = (h - 150) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${w} ${h}">
  ${bg ? `<rect width="${w}" height="${h}" rx="${radius * w}" fill="${bg}"/>` : ""}
  <g transform="translate(${x} ${y})">${shield}</g>
</svg>`;
};

const png = (svg, out) => sharp(Buffer.from(svg)).png().toFile(out);

writeFileSync("public/favicon.svg", icon(64, { scale: 0.98 }));
await png(icon(192, { bg: "#ffffff", radius: 0.22, scale: 0.78 }), "public/icons/icon-192.png");
await png(icon(512, { bg: "#ffffff", radius: 0.22, scale: 0.78 }), "public/icons/icon-512.png");
// Maskable icons are cropped to a circle or squircle: keep the shield inside the central safe zone.
await png(icon(512, { bg: "#ffffff", scale: 0.6 }), "public/icons/maskable-512.png");
await png(icon(180, { bg: "#ffffff", scale: 0.78 }), "public/apple-touch-icon.png");
// favicon.ico: a single 32px PNG inside an ICO container.
const ico32 = await sharp(Buffer.from(icon(32, { scale: 0.98 }))).png().toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
header.writeUInt8(32, 6); header.writeUInt8(32, 7); header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12);
header.writeUInt32LE(ico32.length, 14); header.writeUInt32LE(22, 18);
writeFileSync("public/favicon.ico", Buffer.concat([header, ico32]));

// Default sharing image (1200 × 630): the full logo on the brand navy.
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${navy}"/><stop offset="1" stop-color="${rim}"/></linearGradient>
    <radialGradient id="glow" cx="0.2" cy="0.3" r="0.6"><stop offset="0" stop-color="${primary}" stop-opacity="0.55"/><stop offset="1" stop-color="${primary}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <g transform="translate(130 120) scale(2.6)">${shield}</g>
  <rect x="490" y="170" width="4" height="290" fill="#ffffff" fill-opacity="0.35"/>
  <text x="540" y="290" font-family="Inter, DejaVu Sans, sans-serif" font-size="112" font-weight="800" letter-spacing="4" fill="#ffffff">SABINA</text>
  <text x="540" y="400" font-family="Inter, DejaVu Sans, sans-serif" font-size="112" font-weight="800" letter-spacing="4" fill="${gold}">EDGE</text>
  <text x="544" y="455" font-family="Inter, DejaVu Sans, sans-serif" font-size="30" font-weight="700" letter-spacing="2" fill="#ffffff" fill-opacity="0.8">BUILDING MINDS. IMPACTING LIVES.</text>
</svg>`;
await png(og, "public/images/og-default.png");
console.log("Icons and sharing image redrawn:", primary, gold);
