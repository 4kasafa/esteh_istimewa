import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const iconsDir = join(publicDir, 'icons');
const svgPath = join(publicDir, 'Appic.svg');

const svgBuffer = readFileSync(svgPath);

const sizes = [
  { name: 'pwa-192.png', size: 192, bg: null },
  { name: 'pwa-512.png', size: 512, bg: null },
  { name: 'pwa-maskable-512.png', size: 512, bg: '#15803d', contentScale: 0.72 },
  { name: 'apple-touch-icon.png', size: 180, bg: '#15803d', contentScale: 0.78 },
];

console.log('Generating PWA icons from Appic.svg...\n');

for (const { name, size, bg, contentScale } of sizes) {
  const outputPath = join(iconsDir, name);
  
  if (bg && contentScale) {
    const contentSize = Math.round(size * contentScale);
    const padding = Math.round((size - contentSize) / 2);
    
    await sharp(svgBuffer)
      .resize(contentSize, contentSize)
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: bg,
      })
      .png()
      .toFile(outputPath);
  } else {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
  }
  
  console.log(`✓ ${name} (${size}x${size})`);
}

console.log('\nDone! Icons saved to public/icons/');
