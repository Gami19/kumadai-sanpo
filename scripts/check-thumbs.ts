/**
 * 挿絵の切り抜きが、いまの座標と揃っているか確認する。
 * ずれていたら npm run thumbs を再実行する。
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { lonLatToIllustrationPx } from '../src/features/map/georef';
import { parseSpotsCsv } from '../src/features/map/parseSpotsCsv';

const CAMPUS_ID = {
  黒髪北: 'kurokami-north',
  黒髪南: 'kurokami-south',
  本荘: 'honjo',
  大江: 'ooe',
} as const;

type Manifest = {
  buildings: { id: string; x: number; y: number }[];
};

const root = process.cwd();

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

const buildings = (
  JSON.parse(readFileSync(path.join(root, 'content/buildings.json'), 'utf8')) as {
    buildings: { id: string; campus: string }[];
  }
).buildings;
const spots = parseSpotsCsv(readFileSync(path.join(root, 'data/geo/spots.csv'), 'utf8'));
const spotById = new Map(spots.map((spot) => [spot.id, spot]));
const manifestPath = path.join(root, 'assets/thumbs/manifest.json');
if (!existsSync(manifestPath)) {
  fail('assets/thumbs/manifest.json がありません。npm run thumbs を実行してください。');
}
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest;
const recorded = new Map(manifest.buildings.map((item) => [item.id, item]));
const sources = readFileSync(path.join(root, 'src/features/thumbs/sources.ts'), 'utf8');

for (const building of buildings) {
  const spot = spotById.get(building.id);
  if (spot?.lat == null || spot.lon == null) {
    fail(`${building.id} に座標がありません`);
  }
  const campusId = CAMPUS_ID[building.campus as keyof typeof CAMPUS_ID];
  if (campusId == null) {
    fail(`${building.id} のキャンパスが不明です`);
  }
  const pixel = lonLatToIllustrationPx(campusId, { lat: spot.lat, lon: spot.lon });
  const saved = recorded.get(building.id);
  if (saved == null) {
    fail(`${building.id} が挿絵の目録にありません。npm run thumbs を実行してください。`);
  }
  if (Math.abs(saved.x - pixel.x) > 1 || Math.abs(saved.y - pixel.y) > 1) {
    fail(`${building.id} の切り出し位置が座標とずれています。npm run thumbs を実行してください。`);
  }
  for (const name of [`${building.id}.webp`, `${building.id}-sepia.webp`]) {
    if (!existsSync(path.join(root, 'assets/thumbs', name))) {
      fail(`assets/thumbs/${name} がありません。npm run thumbs を実行してください。`);
    }
  }
  if (!sources.includes(`'${building.id}'`)) {
    fail(`src/features/thumbs/sources.ts に ${building.id} がありません。`);
  }
}

console.log(`thumbs ok: ${buildings.length}`);
