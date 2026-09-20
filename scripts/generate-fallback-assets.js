const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Ensure directories exist
const publicDir = path.join(__dirname, '..', 'public');
const imagesDir = path.join(publicDir, 'images');
fs.mkdirSync(imagesDir, { recursive: true });

// 1. Create public/favicon.svg
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#14209C" />
      <stop offset="100%" stop-color="#0E1668" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047" />
      <stop offset="100%" stop-color="#F9C31C" />
    </linearGradient>
  </defs>
  <!-- Background rounded rect -->
  <rect width="64" height="64" rx="16" fill="url(#brandGrad)"/>
  <!-- Mortarboard cap / Education Icon -->
  <polygon points="32,15 54,26 32,37 10,26" fill="url(#goldGrad)" />
  <!-- Lower cap body -->
  <path d="M19,31.5 L19,43 C19,48 45,48 45,43 L45,31.5 L32,38 Z" fill="#FFFFFF" fill-opacity="0.9" />
  <!-- Tassel ribbon -->
  <path d="M50,28.5 L50,42 C50,44 48,44.5 48,43 L48,29.5 Z" fill="url(#goldGrad)" />
  <circle cx="48" cy="44" r="2" fill="url(#goldGrad)" />
</svg>`;

fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg, 'utf8');
console.log('Created public/favicon.svg');

// Helper to construct uncompressed/deflated raw PNG buffer
function createPng(width, height, r, g, b, a = 255) {
  // Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  
  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: RGBA (6)
  ihdrData[10] = 0; // Compression method: 0
  ihdrData[11] = 0; // Filter method: 0
  ihdrData[12] = 0; // Interlace method: 0
  
  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(4 + 4 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    // CRC32 calculation
    let crc = 0xffffffff;
    for (let i = 4; i < 8 + len; i++) {
      let c = (crc ^ buf[i]) & 0xff;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      crc = (crc >>> 8) ^ c;
    }
    crc = (crc ^ 0xffffffff) >>> 0;
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Scanlines for RGBA
  const rowStride = 1 + width * 4;
  const rawData = Buffer.alloc(rowStride * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowStride;
    rawData[rowOffset] = 0; // Filter: none
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      // Slight gradient
      const factor = 1 - (y / height) * 0.25;
      rawData[pxOffset]     = Math.floor(r * factor);
      rawData[pxOffset + 1] = Math.floor(g * factor);
      rawData[pxOffset + 2] = Math.floor(b * factor);
      rawData[pxOffset + 3] = a;
    }
  }

  const idatData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// 2. Create public/apple-touch-icon.png (180x180, Brand Blue #14209C)
const appleTouchPng = createPng(180, 180, 20, 32, 156);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouchPng);
console.log('Created public/apple-touch-icon.png');

// 3. Create public/images/og-default.png (1200x630, Brand Blue #14209C)
const ogPng = createPng(1200, 630, 20, 32, 156);
fs.writeFileSync(path.join(imagesDir, 'og-default.png'), ogPng);
console.log('Created public/images/og-default.png');

// 4. Create public/favicon.ico (32x32 PNG wrapped in ICO format)
function createIcoFromPng(pngBuffer, width, height) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(1, 4); // 1 Image

  const entry = Buffer.alloc(16);
  entry.writeUInt8(width >= 256 ? 0 : width, 0);
  entry.writeUInt8(height >= 256 ? 0 : height, 1);
  entry.writeUInt8(0, 2); // Colors
  entry.writeUInt8(0, 3); // Reserved
  entry.writeUInt16LE(1, 4); // Color planes
  entry.writeUInt16LE(32, 6); // Bits per pixel
  entry.writeUInt32LE(pngBuffer.length, 8); // Size of image data
  entry.writeUInt32LE(6 + 16, 12); // Offset to image data

  return Buffer.concat([header, entry, pngBuffer]);
}

const faviconPng = createPng(32, 32, 20, 32, 156);
const faviconIco = createIcoFromPng(faviconPng, 32, 32);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), faviconIco);
console.log('Created public/favicon.ico');
