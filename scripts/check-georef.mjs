import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  campusesContaining,
  illustrationSize,
  lonLatToIllustrationPx,
  lonLatToIllustrationPxDirect,
  lonLatToUnderlayPx,
} from '../src/features/map/georef.ts';
import { placeSpots } from '../src/features/map/placeSpots.ts';
import { parseSpotsCsv } from '../src/features/map/parseSpotsCsv.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

function fail(message) {
  failures.push(message);
}

function distance(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function webpSize(buffer) {
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error('webp ではありません');
  }
  const chunk = buffer.toString('ascii', 12, 16);
  if (chunk === 'VP8X') {
    return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
  }
  if (chunk === 'VP8L') {
    const b0 = buffer[21];
    const b1 = buffer[22];
    const b2 = buffer[23];
    const b3 = buffer[24];
    return {
      width: 1 + (((b1 & 0x3f) << 8) | b0),
      height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
    };
  }
  if (chunk === 'VP8 ') {
    return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  }
  throw new Error(`未対応の webp です: ${chunk}`);
}

const georef = JSON.parse(readFileSync(join(root, 'data/geo/campus_georef.json'), 'utf8'));
const sanity = JSON.parse(readFileSync(join(root, 'scripts/fixtures/georef-sanity.json'), 'utf8'));
const spots = parseSpotsCsv(readFileSync(join(root, 'data/geo/spots.csv'), 'utf8'));
const byName = new Map(spots.map((spot) => [spot.name, spot]));

for (const entry of Object.values(georef)) {
  const size = illustrationSize(entry.campus_id);
  if (size.width !== entry.illustration_size[0] || size.height !== entry.illustration_size[1]) {
    fail(`${entry.campus_id} の illustration_size をモジュールが読んでいません`);
  }
  const file = join(root, 'assets/illustrations', entry.illustration);
  const actual = webpSize(readFileSync(file));
  if (actual.width !== entry.illustration_size[0] || actual.height !== entry.illustration_size[1]) {
    fail(
      `${entry.illustration} は ${actual.width}x${actual.height} ですが、ジオリファレンスは ${entry.illustration_size.join('x')} です`,
    );
  }
}

for (const control of sanity.controls) {
  const point = { lat: control.lat, lon: control.lon };
  const underlay = lonLatToUnderlayPx(control.campus, point);
  const underlayError = distance(underlay.x, underlay.y, control.underlayX, control.underlayY);
  if (underlayError > sanity.underlayTolerancePx) {
    fail(`${control.campus} の下敷き制御点が ${underlayError.toFixed(3)}px ずれています`);
  }
  const illustrated = lonLatToIllustrationPx(control.campus, point);
  const illusError = distance(illustrated.x, illustrated.y, control.illusX, control.illusY);
  if (illusError > sanity.controlTolerancePx) {
    fail(`${control.campus} のイラスト制御点が ${illusError.toFixed(3)}px ずれています`);
  }
  const direct = lonLatToIllustrationPxDirect(control.campus, point);
  const stepError = distance(illustrated.x, illustrated.y, direct.x, direct.y);
  if (stepError > sanity.directTolerancePx) {
    fail(`${control.campus} の2段変換と1段変換が ${stepError.toFixed(4)}px 違います`);
  }
}

if (spots.length !== sanity.spots.length) {
  fail(`スポット数が違います: csv ${spots.length} / 期待 ${sanity.spots.length}`);
}

for (const expected of sanity.spots) {
  const spot = byName.get(expected.name);
  if (!spot) {
    fail(`spots.csv に ${expected.name} がありません`);
    continue;
  }
  if (spot.designation !== expected.designation) {
    fail(`${expected.name} の区分が ${spot.designation} です`);
  }
  if (spot.positionStatus !== expected.positionStatus) {
    fail(`${expected.name} の position_status が ${spot.positionStatus} です`);
  }
  if (expected.latText != null && spot.latText !== expected.latText) {
    fail(`${expected.name} の緯度が ${spot.latText} です`);
  }
  if (expected.lonText != null && spot.lonText !== expected.lonText) {
    fail(`${expected.name} の経度が ${spot.lonText} です`);
  }
  if (expected.sourceIncludes && !spot.source.includes(expected.sourceIncludes)) {
    fail(`${expected.name} の出典に「${expected.sourceIncludes}」がありません`);
  }
  const point = spot.lat == null || spot.lon == null ? null : { lat: spot.lat, lon: spot.lon };
  const campuses = point ? campusesContaining(point) : [];
  if (campuses.join(',') !== expected.campuses.join(',')) {
    fail(`${expected.name} の所在キャンパスが ${campuses.join(',') || 'なし'} です`);
  }
  if (!point) {
    continue;
  }
  for (const [campus, pixel] of Object.entries(expected.pixels ?? {})) {
    const illustrated = lonLatToIllustrationPx(campus, point);
    const error = distance(illustrated.x, illustrated.y, pixel[0], pixel[1]);
    if (error > sanity.spotTolerancePx) {
      fail(`${expected.name} @ ${campus} が期待画素から ${error.toFixed(3)}px ずれています`);
    }
  }
}

const coordinated = spots.filter((spot) => spot.lat != null && spot.lon != null);
for (const campus of ['kurokami-north', 'kurokami-south', 'honjo', 'ooe']) {
  const placed = placeSpots(spots, campus, null);
  for (const pin of placed) {
    if (pin.lat == null || pin.lon == null) {
      fail(`${campus} に座標の無いピンがあります: ${pin.name}`);
    }
    if (pin.name === '文書館（煉瓦本館）') {
      fail('文書館のピンが置かれています');
    }
  }
  const expectedNames = sanity.spots
    .filter((spot) => spot.campuses.includes(campus))
    .map((spot) => spot.name);
  const actualNames = placed.map((spot) => spot.name);
  if (actualNames.join(',') !== expectedNames.join(',')) {
    fail(`${campus} のピンが ${actualNames.join(',')} です`);
  }
}

if (coordinated.some((spot) => spot.name === '文書館（煉瓦本館）')) {
  fail('文書館に座標が入っています');
}

const filteredNorth = placeSpots(spots, 'kurokami-north', '重要文化財').map((spot) => spot.name);
if (filteredNorth.join(',') !== '五高記念館,化学実験場,表門（赤門）') {
  fail(`黒髪北の重要文化財が ${filteredNorth.join(',')} です`);
}
const filteredHonjo = placeSpots(spots, 'honjo', '登録有形文化財').map((spot) => spot.name);
if (filteredHonjo.join(',') !== '山崎記念館') {
  fail(`本荘の登録有形文化財が ${filteredHonjo.join(',')} です`);
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`georef ok: controls ${sanity.controls.length}, spots ${spots.length}`);
