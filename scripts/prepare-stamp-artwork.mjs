/**
 * 原画 SVG を透過化・viewBox 付与・SVGO 最適化し、
 * src/components/stamp/artwork/<id>.ts を生成する。
 *
 * 使い方:
 *   node scripts/prepare-stamp-artwork.mjs              # 全建物
 *   node scripts/prepare-stamp-artwork.mjs akamon honbu # 指定のみ
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

import sharp from 'sharp';

const require = createRequire(import.meta.url);
const { optimize } = require('svgo');

const ALL_IDS = [
  'akamon',
  'goko-kinenkan',
  'honbu',
  'kagaku-jikkenjo',
  'kougaku-shiryokan',
  'ooe-campus',
  'yakuyo-shokubutsuen',
  'yamazaki-kinenkan',
];

const ids = process.argv.slice(2);
const targets = ids.length > 0 ? ids : ALL_IDS;

const SVGO_CONFIG = {
  multipass: true,
  floatPrecision: 1,
  plugins: [
    'preset-default',
    // 朱色一色なので path をまとめて 8 マス同時表示の負荷を下げる。
    { name: 'convertPathData', params: { floatPrecision: 1, applyTransforms: true } },
    { name: 'mergePaths', params: { force: true, floatPrecision: 1 } },
    { name: 'cleanupNumericValues', params: { floatPrecision: 1 } },
    'removeXMLNS',
    {
      name: 'addAttributesToSVGElement',
      params: {
        attributes: [{ preserveAspectRatio: 'xMidYMid meet' }],
      },
    },
  ],
};

function extractPaths(xml) {
  return [...xml.matchAll(/<path\b[^>]*?\/>/g)].map((m) => m[0]);
}

async function isBackgroundPath(pathXml, width, height) {
  const svg = `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${pathXml}</svg>`;
  const { data, info } = await sharp(Buffer.from(svg), { density: 24 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let ink = 0;
  let corner = 0;
  let center = 0;
  const total = info.width * info.height;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const a = data[(y * info.width + x) * 4 + 3];
      if (a <= 20) continue;
      ink += 1;
      if (x < info.width * 0.08 || x > info.width * 0.92 || y < info.height * 0.08 || y > info.height * 0.92) {
        corner += 1;
      }
      if (x >= info.width * 0.3 && x < info.width * 0.7 && y >= info.height * 0.3 && y < info.height * 0.7) {
        center += 1;
      }
    }
  }
  if (ink === 0) return false;
  const inkRatio = ink / total;
  const centerShare = center / ink;
  const cornerShare = corner / ink;
  // VTracer の縁ノイズ・背景塗り。外周枠そのものは残す。
  if (inkRatio > 0.02 && centerShare < 0.05 && cornerShare > 0.4) return true;
  if (inkRatio > 0.35 && centerShare < 0.25) return true;
  return false;
}

async function cleanSvg(id) {
  const srcPath = join('assets/stamps', `${id}-stamp.svg`);
  const raw = readFileSync(srcPath, 'utf8');
  const width = Number(/width="(\d+)"/.exec(raw)?.[1]);
  const height = Number(/height="(\d+)"/.exec(raw)?.[1]);
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    throw new Error(`width/height が読めない: ${srcPath}`);
  }
  const paths = extractPaths(raw);
  const kept = [];
  let removed = 0;
  for (const path of paths) {
    if (await isBackgroundPath(path, width, height)) {
      removed += 1;
      continue;
    }
    kept.push(path);
  }
  const cleaned = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">`,
    ...kept,
    '</svg>',
    '',
  ].join('\n');
  return { cleaned, width, height, kept: kept.length, removed, total: paths.length };
}

async function centroidOf(xml, width, height) {
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
  if (sumA === 0) {
    return { centroidX: Math.round(width / 2), centroidY: Math.round(height / 2) };
  }
  return {
    centroidX: Math.round((sumX / sumA / info.width) * width),
    centroidY: Math.round((sumY / sumA / info.height) * height),
  };
}

function exportName(id) {
  return `${id.toUpperCase().replace(/-/g, '_')}_STAMP`;
}

async function processOne(id) {
  const { cleaned, width, height, kept, removed, total } = await cleanSvg(id);
  const { data: optXml } = optimize(cleaned, SVGO_CONFIG);
  // SVGO が xmlns を外すことがあるので、SvgXml 用に付け直す。
  let xml = optXml;
  if (!/xmlns=/.test(xml)) {
    xml = xml.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if (!/viewBox=/.test(xml)) {
    xml = xml.replace('<svg', `<svg viewBox="0 0 ${width} ${height}"`);
  }
  if (!/preserveAspectRatio=/.test(xml)) {
    xml = xml.replace('<svg', '<svg preserveAspectRatio="xMidYMid meet"');
  }

  const optPath = join('assets/stamps', `${id}-stamp.opt.svg`);
  writeFileSync(optPath, `${xml.trim()}\n`);

  const { centroidX, centroidY } = await centroidOf(xml, width, height);
  const body = `/** ${id} の原画印（SVGO 最適化版）。原画は assets/stamps/${id}-stamp.svg */
export const ${exportName(id)} = {
  width: ${width},
  height: ${height},
  centroidX: ${centroidX},
  centroidY: ${centroidY},
  xml: ${JSON.stringify(xml.trim())},
} as const;
`;
  const outPath = join('src/components/stamp/artwork', `${id}.ts`);
  writeFileSync(outPath, body);
  console.log(id, {
    paths: `${kept}/${total}`,
    removed,
    centroid: [centroidX, centroidY],
    optBytes: Buffer.byteLength(xml),
    out: outPath,
  });
}

mkdirSync(join('src/components/stamp/artwork'), { recursive: true });

// svgo が無ければ入れる（devDependency ではない一時利用）
try {
  require.resolve('svgo');
} catch {
  console.log('installing svgo…');
  execFileSync('npm', ['install', '--no-save', 'svgo@4'], { stdio: 'inherit' });
}

for (const id of targets) {
  await processOne(id);
}
