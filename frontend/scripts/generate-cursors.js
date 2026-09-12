import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDir = path.resolve(__dirname, '../public/assets/cursors');
fs.mkdirSync(targetDir, { recursive: true });

// --- SVG 1: CRIMSON FLAME-ARROW CURSOR ---
const flameArrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
  <defs>
    <linearGradient id="flameBlade" x1="1" y1="1" x2="16" y2="18" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="12%" stop-color="#FF4D6D"/>
      <stop offset="45%" stop-color="#FF2446"/>
      <stop offset="85%" stop-color="#E10613"/>
      <stop offset="100%" stop-color="#7A0009"/>
    </linearGradient>
    <linearGradient id="darkBevel" x1="1" y1="1" x2="20" y2="24" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FF2446"/>
      <stop offset="50%" stop-color="#B8000C"/>
      <stop offset="100%" stop-color="#400004"/>
    </linearGradient>
    <linearGradient id="energyTrail" x1="6" y1="14" x2="22" y2="24" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FF2446" stop-opacity="0.85"/>
      <stop offset="50%" stop-color="#E10613" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#E10613" stop-opacity="0"/>
    </linearGradient>
    <filter id="crimsonAura" x="-20%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="0" dy="0" stdDeviation="1" flood-color="#FF2446" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- High contrast dark silhouette shadow -->
  <path d="M1 1 L1 22.5 L6.5 17 L11.5 26.5 L15.5 24.5 L10.8 15.2 L19 14.5 Z" 
        fill="#050505" stroke="#000000" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>

  <!-- Flame exhaust fins / energy trailing -->
  <path d="M11 15.5 L16.5 25 L14 25.8 L9.5 17.5 Z" fill="url(#energyTrail)"/>
  <path d="M11 15 L22 17.5 L18 18.5 L10.5 16 Z" fill="url(#energyTrail)"/>

  <!-- Main blade lower dark facet -->
  <path d="M2 2 L7.5 8 L18 13.8 L10.5 14.6 Z" fill="url(#darkBevel)"/>

  <!-- Main blade upper bright crimson facet -->
  <path d="M2 2 L2 20.5 L6.8 16.2 L7.5 8 Z" fill="url(#flameBlade)"/>

  <!-- Tactical stem -->
  <path d="M6.8 16.2 L11.2 24.8 L14.5 23.2 L10.5 14.6 Z" fill="#940008"/>

  <!-- Metallic silver spine highlight -->
  <path d="M2 2 L7.5 8 L10.5 14.6" stroke="#FFFFFF" stroke-width="0.9" stroke-linecap="round"/>
  <!-- Sharp top bevel highlight -->
  <path d="M2 2 L2 19.5" stroke="#FFFFFF" stroke-width="0.8" stroke-linecap="round"/>
  <!-- Right edge crimson glow accent -->
  <path d="M2 2 L18 13.8" stroke="#FF8A9A" stroke-width="0.75" stroke-linecap="round"/>

  <!-- Sharp arrow tip apex hot point -->
  <circle cx="2" cy="2" r="1.1" fill="#FFFFFF"/>
</svg>
`;

// --- SVG 2: ARMORED POINTING-HAND CURSOR WITH FINGERTIP GLOW ---
const knockHandSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
  <defs>
    <radialGradient id="fingertipAura" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="1"/>
      <stop offset="25%" stop-color="#FF4D6D" stop-opacity="0.9"/>
      <stop offset="55%" stop-color="#FF2446" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#E10613" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="armorPlate" x1="8" y1="4" x2="24" y2="28" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#3A3A46"/>
      <stop offset="40%" stop-color="#24242E"/>
      <stop offset="100%" stop-color="#14141A"/>
    </linearGradient>
    <linearGradient id="crimsonSeam" x1="8" y1="2" x2="16" y2="20" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FF2446"/>
      <stop offset="100%" stop-color="#940008"/>
    </linearGradient>
    <filter id="handShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="#000000" flood-opacity="0.85"/>
    </filter>
  </defs>

  <style>
    @keyframes fingertip-pulse {
      0%, 100% {
        transform: scale(0.92);
        opacity: 0.75;
      }
      50% {
        transform: scale(1.22);
        opacity: 1;
      }
    }
    .pulsing-glow {
      transform-origin: 11px 2.5px;
      animation: fingertip-pulse 1.35s ease-in-out infinite;
    }
  </style>

  <!-- Dark base silhouette / outline for universal visibility -->
  <g filter="url(#handShadow)">
    <path d="
      M 9 2.5
      C 9 1 13 1 13 2.5
      L 13 11
      C 14 10 17 10.5 17.5 12
      C 18.5 11.5 21 12 21.5 13.5
      C 22.5 13 24.5 14 25 15.5
      L 25 21
      C 25 24 22 27 18.5 27.5
      L 13 27.5
      C 10 27 8.5 24 8.5 22
      L 5.5 18
      C 4.5 16.5 5.5 14.5 7 14.5
      L 9 15
      Z"
      fill="#050505" stroke="#000000" stroke-width="2" stroke-linejoin="round"/>
  </g>

  <!-- Armored Gauntlet Body (Plates & Curled Fingers) -->
  <!-- Palm and cuff base -->
  <path d="M 9 16 L 24 16 C 24.5 21 21.5 26.5 18 26.5 L 12 26.5 C 9 26.5 8 22 8 19 Z" fill="url(#armorPlate)"/>
  
  <!-- Curled fingers knuckles -->
  <!-- Pinky -->
  <path d="M 21.5 16 C 23.5 16 24 17.5 24 19.5 C 24 21 23 21.8 21.5 21.8 Z" fill="#202028" stroke="#3D3D4E" stroke-width="0.75"/>
  <!-- Ring finger -->
  <path d="M 17.5 14.5 C 20 14.5 20.8 16 20.8 18.5 C 20.8 20 19.5 20.8 17.5 20.8 Z" fill="#282834" stroke="#48485C" stroke-width="0.75"/>
  <!-- Middle finger -->
  <path d="M 13.5 13.5 C 16.5 13.5 17.2 15 17.2 18 C 17.2 19.5 15.8 20.2 13.5 20.2 Z" fill="#2F2F3D" stroke="#55556A" stroke-width="0.75"/>
  <!-- Folded Thumb -->
  <path d="M 6.5 15.5 C 5.5 16 5.8 17.5 7 18.5 L 9.5 20.5 L 10.5 16.5 Z" fill="#24242E" stroke="#454555" stroke-width="0.75"/>

  <!-- Raised Armored Index Finger (Hotspot at top apex: 11, 2) -->
  <!-- Index finger main segment -->
  <path d="M 9.2 3 C 9.2 1.5 12.8 1.5 12.8 3 L 12.8 14 L 9.2 14 Z" fill="url(#armorPlate)"/>
  
  <!-- Armor segment joint plates on index finger -->
  <path d="M 9.2 5 L 12.8 5" stroke="#E10613" stroke-width="0.8"/>
  <path d="M 9.2 9 L 12.8 9" stroke="#E10613" stroke-width="0.8"/>
  <path d="M 9.2 13 L 12.8 13" stroke="#FF2446" stroke-width="0.9"/>

  <!-- Cybernetic crimson seam along finger -->
  <path d="M 11 3 L 11 13" stroke="url(#crimsonSeam)" stroke-width="0.8"/>

  <!-- Metallic specular edge highlights on gauntlet -->
  <path d="M 9.5 3.5 L 9.5 13" stroke="#FFFFFF" stroke-width="0.6" stroke-opacity="0.8"/>
  <path d="M 13.8 14.5 L 17 14.5" stroke="#FFFFFF" stroke-width="0.6" stroke-opacity="0.6"/>
  <path d="M 18 15.5 L 20.5 15.5" stroke="#FFFFFF" stroke-width="0.5" stroke-opacity="0.6"/>

  <!-- Gauntlet wrist plate & crimson indicator -->
  <path d="M 10 24 L 21 24 L 20 26 L 11 26 Z" fill="#181820" stroke="#E10613" stroke-width="0.6"/>
  <circle cx="15.5" cy="25" r="0.9" fill="#FF2446"/>

  <!-- SUBTLE CRIMSON-RED GLOW PULSE AROUND RAISED FINGERTIP -->
  <!-- Outer pulsing aura -->
  <circle cx="11" cy="2.5" r="5" fill="url(#fingertipAura)" class="pulsing-glow"/>
  
  <!-- Focused crimson diode & white tip hot-core -->
  <circle cx="11" cy="2.5" r="2.2" fill="#E10613"/>
  <circle cx="11" cy="2.5" r="1.3" fill="#FF2446"/>
  <circle cx="11" cy="2.5" r="0.7" fill="#FFFFFF"/>
</svg>
`;

// Save SVGs
fs.writeFileSync(path.join(targetDir, 'crimson-flame-arrow.svg'), flameArrowSvg.trim());
fs.writeFileSync(path.join(targetDir, 'crimson-knock-hand.svg'), knockHandSvg.trim());

// Helper function to encode raw RGBA bitmap into PNG format
function encodePNG(width, height, rgbaBuffer) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);

    const typeBuf = Buffer.from(type, 'ascii');
    const body = Buffer.concat([typeBuf, data]);

    const crcBuf = Buffer.alloc(4);
    const crc = calculateCRC(body);
    crcBuf.writeUInt32BE(crc, 0);

    return Buffer.concat([len, body, crcBuf]);
  }

  // Precomputed CRC table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }

  function calculateCRC(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT - Scanlines with filter byte 0 (None)
  const scanlineSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * scanlineSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = rowOffset + 1 + x * 4;
      rawData[dstIdx] = rgbaBuffer[srcIdx];         // R
      rawData[dstIdx + 1] = rgbaBuffer[srcIdx + 1]; // G
      rawData[dstIdx + 2] = rgbaBuffer[srcIdx + 2]; // B
      rawData[dstIdx + 3] = rgbaBuffer[srcIdx + 3]; // A
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate PNG 1: 32x32 Crimson Flame-Arrow
{
  const width = 32;
  const height = 32;
  const rgba = Buffer.alloc(width * height * 4);

  function setPixel(x, y, r, g, b, a) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = (y * width + x) * 4;
    // Alpha blending
    const srcA = a / 255;
    const dstA = rgba[idx + 3] / 255;
    const outA = srcA + dstA * (1 - srcA);
    if (outA > 0) {
      rgba[idx] = Math.round((r * srcA + rgba[idx] * dstA * (1 - srcA)) / outA);
      rgba[idx + 1] = Math.round((g * srcA + rgba[idx + 1] * dstA * (1 - srcA)) / outA);
      rgba[idx + 2] = Math.round((b * srcA + rgba[idx + 2] * dstA * (1 - srcA)) / outA);
      rgba[idx + 3] = Math.round(outA * 255);
    }
  }

  // Draw polygon rasterizer helper for arrow
  // Arrow silhouette points
  const points = [
    [1, 1], [1, 22], [6.5, 17], [11.5, 26], [15.5, 24], [10.5, 15], [19, 14]
  ];

  // Draw arrow shape
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      // Basic distance to arrow main triangle
      // Triangle 1: (1,1) -> (1,22) -> (6.5, 17) -> (19, 14)
      const insideBlade = (x >= 1 && y >= 1 && (x <= 1 + y * 0.9) && (y <= 22 - x * 0.4) && (x + y <= 33));
      const insideStem = (x >= 6 && x <= 16 && y >= 14 && y <= 26 && Math.abs((y - 14) - 2.2 * (x - 6)) < 4);

      if (insideBlade || insideStem) {
        // Shading
        const distFromSpine = Math.abs(y - x * 1.1);
        if (x <= 3 && y <= 3) {
          // Sharp white tip
          setPixel(x, y, 255, 255, 255, 255);
        } else if (x === 1 || (y === 1 && x <= 3)) {
          // Left edge white highlight
          setPixel(x, y, 245, 245, 255, 255);
        } else if (distFromSpine < 1.2) {
          // Central spine
          setPixel(x, y, 255, 120, 140, 255);
        } else if (x < y * 0.5) {
          // Upper crimson facet
          setPixel(x, y, 255, 36, 70, 255);
        } else {
          // Lower darker crimson facet
          setPixel(x, y, 180, 6, 19, 255);
        }
      }
    }
  }

  // Add 1px dark border around all opaque pixels
  const borderPixels = [];
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const idx = (y * width + x) * 4;
      if (rgba[idx + 3] === 0) {
        // Check 8-neighbors
        let hasOpaqueNeighbor = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < 32 && ny >= 0 && ny < 32) {
              if (rgba[(ny * width + nx) * 4 + 3] > 180) {
                hasOpaqueNeighbor = true;
                break;
              }
            }
          }
          if (hasOpaqueNeighbor) break;
        }
        if (hasOpaqueNeighbor) {
          borderPixels.push([x, y]);
        }
      }
    }
  }

  for (const [bx, by] of borderPixels) {
    setPixel(bx, by, 5, 5, 5, 240);
  }

  // Ensure tip at (1, 1) is white
  setPixel(1, 1, 255, 255, 255, 255);
  setPixel(2, 2, 255, 255, 255, 255);

  const pngBuf = encodePNG(width, height, rgba);
  fs.writeFileSync(path.join(targetDir, 'crimson-flame-arrow.png'), pngBuf);
}

// Generate PNG 2: 32x32 Armored Pointing-Hand with Crimson Glow
{
  const width = 32;
  const height = 32;
  const rgba = Buffer.alloc(width * height * 4);

  function setPixel(x, y, r, g, b, a) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = (y * width + x) * 4;
    const srcA = a / 255;
    const dstA = rgba[idx + 3] / 255;
    const outA = srcA + dstA * (1 - srcA);
    if (outA > 0) {
      rgba[idx] = Math.round((r * srcA + rgba[idx] * dstA * (1 - srcA)) / outA);
      rgba[idx + 1] = Math.round((g * srcA + rgba[idx + 1] * dstA * (1 - srcA)) / outA);
      rgba[idx + 2] = Math.round((b * srcA + rgba[idx + 2] * dstA * (1 - srcA)) / outA);
      rgba[idx + 3] = Math.round(outA * 255);
    }
  }

  // Fingertip at (11, 2)
  // 1. Draw glowing crimson aura around fingertip (radius 4)
  for (let y = 0; y < 8; y++) {
    for (let x = 7; x <= 15; x++) {
      const dist = Math.hypot(x - 11, y - 2);
      if (dist <= 5.0) {
        const falloff = Math.max(0, 1 - dist / 5.0);
        setPixel(x, y, 255, 36, 70, Math.round(falloff * falloff * 200));
      }
    }
  }

  // 2. Draw Hand base & armor
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      // Index finger column: x in [9, 13], y in [2, 14]
      const isIndexFinger = (x >= 9 && x <= 13 && y >= 2 && y <= 14);
      // Fist palm & knuckles: x in [8, 24], y in [13, 26]
      const isPalmFist = (x >= 8 && x <= 24 && y >= 14 && y <= 26 && (x + y <= 47));
      // Folded thumb: x in [5, 9], y in [15, 20]
      const isThumb = (x >= 5 && x <= 9 && y >= 15 && y <= 20);

      if (isIndexFinger || isPalmFist || isThumb) {
        if (isIndexFinger) {
          if (y === 2 && x === 11) {
            // White diode core
            setPixel(x, y, 255, 255, 255, 255);
          } else if (y <= 3) {
            // Bright red diode ring
            setPixel(x, y, 255, 36, 70, 255);
          } else if (y === 6 || y === 10) {
            // Crimson seam
            setPixel(x, y, 225, 6, 19, 255);
          } else if (x === 9) {
            // Left metallic highlight
            setPixel(x, y, 210, 210, 225, 255);
          } else {
            // Armor plate
            setPixel(x, y, 42, 42, 54, 255);
          }
        } else {
          // Gauntlet body
          if (x === 8 || y === 14) {
            setPixel(x, y, 90, 90, 105, 255);
          } else if (y === 24) {
            setPixel(x, y, 225, 6, 19, 255); // Crimson wrist line
          } else {
            setPixel(x, y, 32, 32, 42, 255);
          }
        }
      }
    }
  }

  // Add 1px dark border
  const borderPixels = [];
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const idx = (y * width + x) * 4;
      if (rgba[idx + 3] < 50) {
        let hasOpaqueNeighbor = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < 32 && ny >= 0 && ny < 32) {
              if (rgba[(ny * width + nx) * 4 + 3] > 200) {
                hasOpaqueNeighbor = true;
                break;
              }
            }
          }
          if (hasOpaqueNeighbor) break;
        }
        if (hasOpaqueNeighbor) {
          borderPixels.push([x, y]);
        }
      }
    }
  }

  for (const [bx, by] of borderPixels) {
    setPixel(bx, by, 5, 5, 5, 240);
  }

  // Redraw diode core at (11, 2)
  setPixel(11, 2, 255, 255, 255, 255);
  setPixel(11, 1, 255, 100, 120, 255);

  const pngBuf = encodePNG(width, height, rgba);
  fs.writeFileSync(path.join(targetDir, 'crimson-knock-hand.png'), pngBuf);
}

console.log('Successfully generated cursor assets in', targetDir);
