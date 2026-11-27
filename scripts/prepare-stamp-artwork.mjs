/**
 * 原画 SVG に viewBox を付け、SVGO で軽くし、
 * src/components/stamp/artwork/<id>.ts を生成する。
 *
 * - 白／背景塗りだけ除く（外周枠は残す）
 * - path を無理に1本へまとめない（穴が潰れて線がつぶれるため）
 * - インクの外接矩形に揃えた viewBox で余白をそろえる
 *
 * 使い方:
 *   node scripts/prepare-stamp-artwork.mjs
 *   node scripts/prepare-stamp-artwork.mjs goko-kinenkan
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

/** 外周枠の穴を潰さない。精度は 2。 */
const SVGO_CONFIG = {
  multipass: true,
  floatPrecision: 2,
  plugins: [
    'preset-default',
    { name: 'convertPathData', params: { floatPrecision: 2, applyTransforms: true } },
    { name: 'cleanupNumericValues', params: { floatPrecision: 2 } },
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

function isWhiteFill(pathXml) {
  const fill = /fill="([^"]+)"/.exec(pathXml)?.[1]?.toLowerCase();
  if (fill == null) return false;
  if (fill === '#fff' || fill === '#ffffff' || fill === 'white' || fill === 'none') return fill === 'none' ? false : true;
  if (fill.startsWith('#') && (fill.length === 4 || fill.length === 7)) {
    const hex = fill.length === 4
      ? `#${fill[1]}${fill[1]}${fill[2]}${fill[2]}${fill[3]}${fill[3]}`
      : fill;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return r >= 0xe8 && g >= 0xe8 && b >= 0xe0;
  }
  return false;
}

async function inkBounds(xml, width, height) {
  const { data, info } = await sharp(Buffer.from(xml), { density: 48 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let minX = info.width;
  let minY = info.height;
  let maxX = 0;
  let maxY = 0;
  let ink = 0;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      if (data[(y * info.width + x) * 4 + 3] <= 20) continue;
      ink += 1;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (ink === 0) {
    return { x: 0, y: 0, w: width, h: height, inkRatio: 0 };
  }
  const sx = width / info.width;
  const sy = height / info.height;
  const pad = Math.max(width, height) * 0.02;
  const x0 = Math.max(0, minX * sx - pad);
  const y0 = Math.max(0, minY * sy - pad);
  const x1 = Math.min(width, (maxX + 1) * sx + pad);
  const y1 = Math.min(height, (maxY + 1) * sy + pad);
  return {
    x: x0,
    y: y0,
    w: x1 - x0,
    h: y1 - y0,
    inkRatio: ink / (info.width * info.height),
  };
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
    if (isWhiteFill(path)) {
      removed += 1;
      continue;
    }
    kept.push(path);
  }
  const base = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    ...kept,
    '</svg>',
  ].join('\n');
  const bounds = await inkBounds(base, width, height);
  const outW = Math.round(bounds.w);
  const outH = Math.round(bounds.h);
  const cleaned = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${outW}" height="${outH}" viewBox="${bounds.x.toFixed(1)} ${bounds.y.toFixed(1)} ${bounds.w.toFixed(1)} ${bounds.h.toFixed(1)}" preserveAspectRatio="xMidYMid meet">`,
    ...kept,
    '</svg>',
    '',
  ].join('\n');
  return {
    cleaned,
    width: outW,
    height: outH,
    viewX: bounds.x,
    viewY: bounds.y,
    kept: kept.length,
    removed,
    total: paths.length,
    inkRatio: bounds.inkRatio,
  };
}

/** 重心は表示箱（width×height）内の相対座標。viewBox 原点は含めない。 */
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
  const { cleaned, width, height, kept, removed, total, inkRatio } = await cleanSvg(id);
  const { data: optXml } = optimize(cleaned, SVGO_CONFIG);
  let xml = optXml;
  if (!/xmlns=/.test(xml)) {
    xml = xml.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
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
    inkRatio: +inkRatio.toFixed(3),
    size: `${width}x${height}`,
    centroid: [centroidX, centroidY],
    optBytes: Buffer.byteLength(xml),
  });
}

mkdirSync(join('src/components/stamp/artwork'), { recursive: true });

try {
  require.resolve('svgo');
} catch {
  console.log('installing svgo…');
  execFileSync('npm', ['install', '--no-save', 'svgo@4'], { stdio: 'inherit' });
}

for (const id of targets) {
  await processOne(id);
}
