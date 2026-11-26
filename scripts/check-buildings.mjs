import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { bundledBuildings } from '../src/lib/content/buildings.ts';
import { parseNotebookData } from '../src/lib/notebook/parse.ts';
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
let peopleCount = null;
if (!existsSync(peoplePath)) {
  for (const building of bundledBuildings) {
    if (building.relatedPersonIds.length > 0) {
      fail(`${building.name} の人物 id は、people.json が無いので置けません`);
    }
  }
} else {
  peopleCount = await checkPeople(peoplePath);
}

checkNotebookParser();

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`buildings ok: ${bundledBuildings.length}（座標のある地点と id が一致）`);
if (peopleCount == null) {
  console.log('people.json は無いため、建物の人物 id が空であることだけを確認しました');
} else {
  console.log(`people ok: ${peopleCount}（id が一意で、建物との参照と出典がある）`);
}
console.log('notebook parser ok');

async function checkPeople(path) {
  const rawPeople = readFileSync(path, 'utf8');
  for (const token of ['32.7953', '130.7108', '"lat"', '"lon"', '"latitude"', '"longitude"', '"portrait"']) {
    if (rawPeople.includes(token)) {
      fail(`people.json に置けない項目があります: ${token}`);
    }
  }
  let bundledPeople;
  try {
    ({ bundledPeople } = await import('../src/lib/content/people.ts'));
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
    return 0;
  }
  const peopleById = new Map(bundledPeople.map((person) => [person.id, person]));
  if (peopleById.size !== bundledPeople.length) {
    fail('人物 id が重複しています');
  }
  for (const person of bundledPeople) {
    if (person.sources.length === 0) {
      fail(`${person.name} の出典がありません`);
    }
    if (person.name.includes('文書館')) {
      fail('文書館が人物データに入っています');
    }
    const seenBuildings = new Set();
    for (const buildingId of person.relatedBuildingIds) {
      if (seenBuildings.has(buildingId)) {
        fail(`${person.name} の建物 id が重複しています: ${buildingId}`);
      }
      seenBuildings.add(buildingId);
      const building = buildingById.get(buildingId);
      if (!building) {
        fail(`${person.name} の建物 ${buildingId} が buildings.json にありません`);
        continue;
      }
      if (!building.relatedPersonIds.includes(person.id)) {
        fail(`${building.name} が ${person.name} を relatedPersonIds に含めていません`);
      }
    }
  }
  for (const building of bundledBuildings) {
    const seenPeople = new Set();
    for (const personId of building.relatedPersonIds) {
      if (seenPeople.has(personId)) {
        fail(`${building.name} の人物 id が重複しています: ${personId}`);
      }
      seenPeople.add(personId);
      const person = peopleById.get(personId);
      if (!person) {
        fail(`${building.name} の人物 ${personId} が people.json にありません`);
        continue;
      }
      if (!person.relatedBuildingIds.includes(building.id)) {
        fail(`${person.name} が ${building.name} を relatedBuildingIds に含めていません`);
      }
    }
  }
  return bundledPeople.length;
}

function checkNotebookParser() {
  const empty = parseNotebookData(null);
  if (empty.stamps.length !== 0 || empty.favoriteBuildings.length !== 0 || empty.favoritePeople.length !== 0) {
    fail('空のさんぽ帳を読めません');
  }
  if (parseNotebookData('{').stamps.length !== 0) {
    fail('壊れたさんぽ帳で落ちます');
  }
  if (parseNotebookData({ schemaVersion: 2, stamps: [], favoriteBuildings: [], favoritePeople: [] }).schemaVersion !== 1) {
    fail('未知の schemaVersion を空に戻せません');
  }
  const cleaned = parseNotebookData(
    JSON.stringify({
      schemaVersion: 1,
      stamps: [
        { buildingId: 'akamon', stampedAt: '2026-11-26T01:00:00.000Z' },
        { buildingId: 'akamon', stampedAt: '2026-11-26T05:00:00.000Z' },
        { buildingId: 'honbu', stampedAt: '2026-11-26T04:00:00.000Z', lat: 32.8 },
        { buildingId: 'NOT-AN-ID', stampedAt: '2026-11-26T05:00:00.000Z' },
      ],
      favoriteBuildings: [{ id: 'goko-kinenkan', savedAt: '2026-11-26T03:00:00.000Z' }],
      favoritePeople: [],
      quizResults: [{ quizId: 'goko-kinenkan-basic' }],
      notes: 'memo',
    }),
  );
  const serialized = JSON.stringify(cleaned);
  if (serialized.includes('lat') || serialized.includes('quiz') || serialized.includes('notes')) {
    fail('さんぽ帳の保存形に、座標・クイズ・メモが残っています');
  }
  if (cleaned.stamps.length !== 1 || cleaned.stamps[0].buildingId !== 'akamon' || cleaned.stamps[0].stampedAt !== '2026-11-26T05:00:00.000Z') {
    fail('座標つきのスタンプを捨て、同じ建物は時刻が遅い方だけ残す処理が違います');
  }
  if (cleaned.favoriteBuildings.length !== 1) {
    fail('さんぽ帳のお気に入りが落ちています');
  }
  const rooted = parseNotebookData({
    schemaVersion: 1,
    lat: 32.8,
    stamps: [],
    favoriteBuildings: [{ id: 'goko-kinenkan', savedAt: '2026-11-26T03:00:00.000Z' }],
    favoritePeople: [],
  });
  if (rooted.favoriteBuildings.length !== 0) {
    fail('座標を含むさんぽ帳は全体を使わないようにします');
  }
}
