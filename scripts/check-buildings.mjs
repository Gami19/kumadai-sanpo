import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { bundledBuildings } from '../src/lib/content/buildings.ts';
import { campusesContaining } from '../src/features/map/georef.ts';
import { parseSpotsCsv } from '../src/features/map/parseSpotsCsv.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

function fail(message) {
  failures.push(message);
}

const campusLabel = {
  'kurokami-north': '黒髪北',
  'kurokami-south': '黒髪南',
  honjo: '本荘',
  ooe: '大江',
};

const raw = readFileSync(join(root, 'content/buildings.json'), 'utf8');
for (const token of ['32.7953', '130.7108', '"lat"', '"lon"', '"latitude"', '"longitude"']) {
  if (raw.includes(token)) {
    fail(`buildings.json に座標の記述があります: ${token}`);
  }
}

const spots = parseSpotsCsv(readFileSync(join(root, 'data/geo/spots.csv'), 'utf8'));
const spotById = new Map(spots.map((spot) => [spot.id, spot]));
const buildingById = new Map(bundledBuildings.map((building) => [building.id, building]));
const coordinated = spots.filter((spot) => spot.lat != null && spot.lon != null);

if (buildingById.size !== bundledBuildings.length) {
  fail('建物 id が重複しています');
}
if (bundledBuildings.length !== coordinated.length) {
  fail(`建物数 ${bundledBuildings.length} と座標のある地点 ${coordinated.length} が違います`);
}

for (const spot of spots) {
  const building = buildingById.get(spot.id);
  if (spot.lat == null || spot.lon == null) {
    if (building) {
      fail(`${spot.name} は座標が無いのに建物データがあります`);
    }
    continue;
  }
  if (!building) {
    fail(`${spot.id}（${spot.name}）の建物データがありません`);
    continue;
  }
  if (building.name !== spot.name) {
    fail(`${spot.id} の名称が spots.csv と違います: ${building.name}`);
  }
  if (building.spotId !== spot.id) {
    fail(`${spot.id} の spotId が違います`);
  }
  if (building.designation !== spot.designation) {
    fail(`${spot.name} の文化財指定が spots.csv の ${spot.designation} と違います`);
  }
  const estimated = spot.positionStatus === '推定';
  if (building.positionEstimated !== estimated) {
    fail(`${spot.name} の推定フラグが position_status と違います`);
  }
  if (estimated && !building.summary.includes('推定')) {
    fail(`${spot.name} の説明に、位置が推定である旨がありません`);
  }
  if (!estimated && building.summary.includes('位置は推定')) {
    fail(`${spot.name} の説明が、確定位置を推定としています`);
  }
  const labels = campusesContaining({ lat: spot.lat, lon: spot.lon }).map((id) => campusLabel[id]);
  if (!labels.includes(building.campus)) {
    fail(`${spot.name} のキャンパス「${building.campus}」は地図範囲（${labels.join('、') || 'なし'}）に入りません`);
  }
}

for (const building of bundledBuildings) {
  if (!spotById.has(building.id)) {
    fail(`${building.id} は spots.csv にありません`);
  }
  if (building.name.includes('文書館')) {
    fail('文書館が建物データに入っています');
  }
}

const peoplePath = join(root, 'content/people.json');
if (!existsSync(peoplePath)) {
  for (const building of bundledBuildings) {
    if (building.relatedPersonIds.length > 0) {
      fail(`${building.name} の人物 id は、people.json が無いので置けません`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`buildings ok: ${bundledBuildings.length}（座標のある地点と id が一致）`);
