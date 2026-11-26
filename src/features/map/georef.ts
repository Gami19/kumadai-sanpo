import rawGeoref from '../../../data/geo/campus_georef.json';

import type { CampusId } from './campuses';

export type Pixel = {
  x: number;
  y: number;
};

export type LonLat = {
  lon: number;
  lat: number;
};

type CoefficientRow = readonly [number, number, number];

type CampusGeoref = {
  campus_id: CampusId;
  illustration: string;
  illustration_size: readonly [number, number];
  underlay_bounds: {
    north: number;
    south: number;
    west: number;
    east: number;
  };
  lonlat_to_underlay_px: {
    x: CoefficientRow;
    y: CoefficientRow;
  };
  underlay_px_to_illustration_px: readonly [CoefficientRow, CoefficientRow];
  lonlat_to_illustration_px: readonly [CoefficientRow, CoefficientRow];
};

const CAMPUS_IDS: readonly CampusId[] = ['kurokami-north', 'kurokami-south', 'honjo', 'ooe'];

function isCampusId(value: string): value is CampusId {
  return (CAMPUS_IDS as readonly string[]).includes(value);
}

function coefficientRow(values: readonly number[], label: string): CoefficientRow {
  const [a, b, c] = values;
  if (values.length !== 3 || a == null || b == null || c == null) {
    throw new Error(`${label} の係数が3つではありません`);
  }
  return [a, b, c];
}

function readCampus(entry: (typeof rawGeoref)[keyof typeof rawGeoref]): CampusGeoref {
  if (!isCampusId(entry.campus_id)) {
    throw new Error(`未知のキャンパスです: ${entry.campus_id}`);
  }
  const [width, height] = entry.illustration_size;
  if (width == null || height == null) {
    throw new Error(`${entry.campus_id} のイラスト寸法がありません`);
  }
  return {
    campus_id: entry.campus_id,
    illustration: entry.illustration,
    illustration_size: [width, height],
    underlay_bounds: entry.underlay_bounds,
    lonlat_to_underlay_px: {
      x: coefficientRow(entry.lonlat_to_underlay_px.x, entry.campus_id),
      y: coefficientRow(entry.lonlat_to_underlay_px.y, entry.campus_id),
    },
    underlay_px_to_illustration_px: [
      coefficientRow(entry.underlay_px_to_illustration_px[0], entry.campus_id),
      coefficientRow(entry.underlay_px_to_illustration_px[1], entry.campus_id),
    ],
    lonlat_to_illustration_px: [
      coefficientRow(entry.lonlat_to_illustration_px[0], entry.campus_id),
      coefficientRow(entry.lonlat_to_illustration_px[1], entry.campus_id),
    ],
  };
}

const byCampus = new Map<CampusId, CampusGeoref>();

for (const entry of Object.values(rawGeoref)) {
  const campus = readCampus(entry);
  byCampus.set(campus.campus_id, campus);
}

for (const campusId of CAMPUS_IDS) {
  if (!byCampus.has(campusId)) {
    throw new Error(`ジオリファレンスがありません: ${campusId}`);
  }
}

function campusGeoref(campusId: CampusId): CampusGeoref {
  const entry = byCampus.get(campusId);
  if (!entry) {
    throw new Error(`ジオリファレンスがありません: ${campusId}`);
  }
  return entry;
}

export function illustrationSize(campusId: CampusId): { width: number; height: number } {
  const [width, height] = campusGeoref(campusId).illustration_size;
  return { width, height };
}

/** 下敷き範囲の中心。建物の座標ではなく、その地図の代表点。 */
export function campusBoundsCenter(campusId: CampusId): LonLat {
  const { north, south, west, east } = campusGeoref(campusId).underlay_bounds;
  return {
    lat: (north + south) / 2,
    lon: (west + east) / 2,
  };
}

/**
 * 緯度経度を下敷き画像のピクセルにする。
 * 西端・北端を原点に寄せてから係数を掛ける。定数が大きいので、そのまま足すと桁が落ちる。
 */
export function lonLatToUnderlayPx(campusId: CampusId, point: LonLat): Pixel {
  const campus = campusGeoref(campusId);
  const { west, north } = campus.underlay_bounds;
  const [scaleX, , offsetX] = campus.lonlat_to_underlay_px.x;
  const [, scaleY, offsetY] = campus.lonlat_to_underlay_px.y;
  const originX = scaleX * west + offsetX;
  const originY = scaleY * north + offsetY;
  return {
    x: scaleX * (point.lon - west) + originX,
    y: scaleY * (point.lat - north) + originY,
  };
}

export function underlayPxToIllustrationPx(campusId: CampusId, underlay: Pixel): Pixel {
  const [xRow, yRow] = campusGeoref(campusId).underlay_px_to_illustration_px;
  const [m00, m01, m02] = xRow;
  const [m10, m11, m12] = yRow;
  return {
    x: m00 * underlay.x + m01 * underlay.y + m02,
    y: m10 * underlay.x + m11 * underlay.y + m12,
  };
}

/** 緯度経度を、そのキャンパスのイラスト画像上のピクセルにする。 */
export function lonLatToIllustrationPx(campusId: CampusId, point: LonLat): Pixel {
  return underlayPxToIllustrationPx(campusId, lonLatToUnderlayPx(campusId, point));
}

/**
 * 緯度経度からイラスト画素への1段の係数。
 * アプリは2段変換を使う。検査で両者が一致するか見る。
 */
export function lonLatToIllustrationPxDirect(campusId: CampusId, point: LonLat): Pixel {
  const campus = campusGeoref(campusId);
  const { west, north } = campus.underlay_bounds;
  const [a, b, c] = campus.lonlat_to_illustration_px[0];
  const [d, e, f] = campus.lonlat_to_illustration_px[1];
  const originX = a * west + b * north + c;
  const originY = d * west + e * north + f;
  return {
    x: a * (point.lon - west) + b * (point.lat - north) + originX,
    y: d * (point.lon - west) + e * (point.lat - north) + originY,
  };
}

export function isInsideIllustration(campusId: CampusId, point: LonLat): boolean {
  const pixel = lonLatToIllustrationPx(campusId, point);
  const { width, height } = illustrationSize(campusId);
  return pixel.x >= 0 && pixel.y >= 0 && pixel.x <= width && pixel.y <= height;
}

/** イラストの範囲に入るキャンパス。黒髪北と黒髪南の重なりでは両方が返る。 */
export function campusesContaining(point: LonLat): CampusId[] {
  return CAMPUS_IDS.filter((campusId) => isInsideIllustration(campusId, point));
}
