import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
await mkdir(`${root}public/images`, { recursive: true });
for (const name of ['hero', 'cutout', 'quiet']) {
  for (const size of [640, 828, 1080, 1600]) {
    await sharp(`${root}assets/source/${name}.png`).resize({ width: size, withoutEnlargement: true }).webp({ quality: 82, effort: 5 }).toFile(`${root}public/images/${name}-${size}.webp`);
    if(name === 'hero') await sharp(`${root}assets/source/${name}.png`).resize({width:size,withoutEnlargement:true}).avif({quality:48,effort:5}).toFile(`${root}public/images/${name}-${size}.avif`);
  }
}
// A real supplied portrait and typesetting, with no synthetic personal imagery.
const portrait = await sharp(`${root}assets/source/hero.png`).resize(525, 630).flatten({ background: '#F3F0E8' }).toBuffer();
const svg = Buffer.from(`<svg width="1200" height="630"><rect width="1200" height="630" fill="#F3F0E8"/><rect x="50" y="50" width="18" height="18" fill="#ED3345"/><g fill="#0B0C0F" font-family="Arial,sans-serif"><text x="86" y="67" font-size="19">PIYUSH RAJPUT</text><text x="50" y="225" font-size="92" font-weight="bold" letter-spacing="-6">THE BUILDER'S</text><text x="50" y="330" font-size="110" font-weight="bold" letter-spacing="-6">MIND.</text><text x="50" y="430" font-size="26">From curiosity to creation.</text><text x="50" y="565" font-size="16">AI / SOFTWARE / PHYSICAL SYSTEMS</text></g></svg>`);
await sharp(svg).composite([{ input: portrait, left: 670, top: 0, blend: 'multiply' }]).png().toFile(`${root}public/og.png`);
console.log('Created responsive WebP portraits, AVIF hero variants, and og.png.');
