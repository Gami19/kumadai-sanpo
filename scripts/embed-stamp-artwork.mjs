/**
 * assets/stamps/<id>-stamp-vermilion.opt.svg から
 * src/components/stamp/artwork/<id>.ts を生成する。
 *
 * 使い方: node scripts/embed-stamp-artwork.mjs goko-kinenkan
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import sharp from 'sharp';

const id = process.argv[2];
if (id == null || id.length === 0) {
  console.error('usage: node scripts/embed-stamp-artwork.mjs <building-id>');
  process.exit(1);
}

const optPath = join('assets/stamps', `${id}-stamp-vermilion.opt.svg`);
const xml = readFileSync(optPath, 'utf8');
const viewBox = /viewBox="0 0 (\d+) (\d+)"/.exec(xml);
if (viewBox == null) {
  console.error('viewBox="0 0 W H" が必要です:', optPath);
  process.exit(1);
}
const width = Number(viewBox[1]);
const height = Number(viewBox[2]);

const { data, info } = await sharp(Buffer.from(xml), { density: 144 })
  .ensureAlpha()
  .resize(800, null)
  .raw()
  .toBuffer({ resolveWithObject: true });

let sumX = 0;
let sumY = 0;
let sumA = 0;
for (let y = 0; y < info.height; y += 1) {
  for (let x = 0; x < info.width; x += 1) {
    const a = data[(y * info.width + x) * 4 + 3];
    if (a > 20) {
      sumX += x * a;
      sumY += y * a;
      sumA += a;
    }
  }
}
const centroidX = Math.round((sumX / sumA / info.width) * width);
const centroidY = Math.round((sumY / sumA / info.height) * height);

const exportName = `${id.toUpperCase().replace(/-/g, '_')}_STAMP`;
const outPath = join('src/components/stamp/artwork', `${id}.ts`);
const body = `/** ${id} の原画印（SVGO 最適化版）。原画は assets/stamps/${id}-stamp-vermilion.svg */
export const ${exportName} = {
  width: ${width},
  height: ${height},
  centroidX: ${centroidX},
  centroidY: ${centroidY},
  xml: ${JSON.stringify(xml)},
} as const;
`;

writeFileSync(outPath, body);
console.log('wrote', outPath, { width, height, centroidX, centroidY, bytes: Buffer.byteLength(xml) });
