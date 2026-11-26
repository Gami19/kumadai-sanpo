/**
 * 建物のピン位置で絵本イラストを正方形に切る。
 *
 * 使い方（リポジトリのルート）: npm run thumbs
 * 座標・イラスト・ジオリファレンスを変えたあとに再実行する。
 * 出力:
 *   assets/thumbs/{id}.webp        色つき
 *   assets/thumbs/{id}-sepia.webp  未訪問用のセピア
 *   assets/thumbs/manifest.json    切り出し位置。check:data が座標と突き合わせる
 *   src/features/thumbs/sources.ts Metro が読める require
 *
 * 画素は src/features/map/georef.ts と同じ変換。位置は創作しない。
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import sharp from 'sharp';

import { illustrationSize, lonLatToIllustrationPx } from '../src/features/map/georef';
import { parseSpotsCsv } from '../src/features/map/parseSpotsCsv';

type CampusId = 'kurokami-north' | 'kurokami-south' | 'honjo' | 'ooe';

const CAMPUS_ID: Record<string, CampusId> = {
  黒髪北: 'kurokami-north',
  黒髪南: 'kurokami-south',
  本荘: 'honjo',
  大江: 'ooe',
};

const CROP_PX = 240;
const OUTPUT_PX = 480;

const ILLUSTRATION: Record<CampusId, string> = {
  'kurokami-north': 'kurokami-north-illustrated.webp',
  'kurokami-south': 'kurokami-south-illustrated.webp',
  honjo: 'honjo-illustrated.webp',
  ooe: 'ooe-illustrated.webp',
};

type BuildingRow = {
  id: string;
  name: string;
  campus: string;
};

type ManifestBuilding = {
  id: string;
  campusId: CampusId;
  x: number;
  y: number;
  left: number;
  top: number;
  cropPx: number;
};

const root = process.cwd();

function readBuildings(): BuildingRow[] {
  const document = JSON.parse(readFileSync(path.join(root, 'content/buildings.json'), 'utf8')) as {
    buildings: BuildingRow[];
  };
  return document.buildings;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function cropWindow(
  x: number,
  y: number,
  width: number,
  height: number,
): { left: number; top: number; crop: number } {
  const crop = Math.min(CROP_PX, width, height);
  const left = Math.max(0, Math.min(Math.round(x - crop / 2), width - crop));
  const top = Math.max(0, Math.min(Math.round(y - crop / 2), height - crop));
  return { left, top, crop };
}

async function main() {
  const spots = parseSpotsCsv(readFileSync(path.join(root, 'data/geo/spots.csv'), 'utf8'));
  const spotById = new Map(spots.map((spot) => [spot.id, spot]));
  const outDir = path.join(root, 'assets/thumbs');
  mkdirSync(outDir, { recursive: true });
  mkdirSync(path.join(root, 'src/features/thumbs'), { recursive: true });

  const manifestBuildings: ManifestBuilding[] = [];
  const requires: string[] = [];

  for (const building of readBuildings()) {
    const spot = spotById.get(building.id);
    if (spot == null || spot.lat == null || spot.lon == null) {
      throw new Error(`${building.id} に切り抜く座標がありません`);
    }
    const campusId = CAMPUS_ID[building.campus];
    if (campusId == null) {
      throw new Error(`${building.id} のキャンパスが不明です: ${building.campus}`);
    }
    const pixel = lonLatToIllustrationPx(campusId, { lat: spot.lat, lon: spot.lon });
    const { width, height } = illustrationSize(campusId);
    if (pixel.x < 0 || pixel.y < 0 || pixel.x > width || pixel.y > height) {
      throw new Error(`${building.id} のピンがイラストの外です (${pixel.x}, ${pixel.y})`);
    }
    const file = path.join(root, 'assets/illustrations', ILLUSTRATION[campusId]);
    const meta = await sharp(file).metadata();
    if (meta.width !== width || meta.height !== height) {
      throw new Error(
        `${ILLUSTRATION[campusId]} の寸法がジオリファレンスと違います: ${meta.width}x${meta.height}`,
      );
    }
    const box = cropWindow(pixel.x, pixel.y, width, height);
    const color = await sharp(file)
      .extract({ left: box.left, top: box.top, width: box.crop, height: box.crop })
      .resize(OUTPUT_PX, OUTPUT_PX)
      .webp({ quality: 82 })
      .toBuffer();
    const colorName = `${building.id}.webp`;
    const sepiaName = `${building.id}-sepia.webp`;
    await sharp(color).toFile(path.join(outDir, colorName));
    await sharp(color)
      .modulate({ saturation: 0.15, brightness: 1.08 })
      .tint('#A68462')
      .webp({ quality: 80 })
      .toFile(path.join(outDir, sepiaName));
    manifestBuildings.push({
      id: building.id,
      campusId,
      x: round2(pixel.x),
      y: round2(pixel.y),
      left: box.left,
      top: box.top,
      cropPx: box.crop,
    });
    requires.push(
      `  '${building.id}': require('../../../assets/thumbs/${colorName}'),`,
    );
    console.log(
      `${building.id} ${campusId} pin ${round2(pixel.x)},${round2(pixel.y)} crop ${box.left},${box.top} ${box.crop}px`,
    );
  }

  const manifest = {
    cropPx: CROP_PX,
    outputPx: OUTPUT_PX,
    buildings: manifestBuildings,
  };
  writeFileSync(path.join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  const sepiaRequires = manifestBuildings
    .map((item) => `  '${item.id}': require('../../../assets/thumbs/${item.id}-sepia.webp'),`)
    .join('\n');
  const source = `/* このファイルは scripts/crop-thumbs.ts が生成する。手で編集しない。 */
export const thumbColor = {
${requires.join('\n')}
} as const;

export const thumbSepia = {
${sepiaRequires}
} as const;
`;
  writeFileSync(path.join(root, 'src/features/thumbs/sources.ts'), source);
  console.log(`thumbs: ${manifestBuildings.length}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
