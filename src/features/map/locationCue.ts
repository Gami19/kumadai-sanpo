import type { CampusId } from './campuses';
import {
  campusBoundsCenter,
  campusesContaining,
  illustrationSize,
  lonLatToIllustrationPx,
  type LonLat,
  type Pixel,
} from './georef';

export type MapFix = LonLat & {
  accuracyMeters: number | null;
};

export type LocationCue =
  | { kind: 'here'; campusId: CampusId; pixel: Pixel; radiusPx: number }
  | { kind: 'elsewhere'; campusId: CampusId }
  | { kind: 'outside' };

const METERS_PER_DEGREE_LAT = 111320;
const MAX_ACCURACY_METERS = 250;
const MAX_RADIUS_FRACTION = 0.45;

/** 精度（メートル）を、そのキャンパスのイラスト上の半径にする。大きすぎる円は出さない。 */
export function accuracyRadiusPx(
  campusId: CampusId,
  point: LonLat,
  accuracyMeters: number | null,
): number {
  if (accuracyMeters == null || !Number.isFinite(accuracyMeters) || accuracyMeters <= 0) {
    return 0;
  }
  if (accuracyMeters > MAX_ACCURACY_METERS) {
    return 0;
  }
  const metersPerDegreeLon = METERS_PER_DEGREE_LAT * Math.cos((point.lat * Math.PI) / 180);
  if (metersPerDegreeLon < 1) {
    return 0;
  }
  const origin = lonLatToIllustrationPx(campusId, point);
  const shifted = lonLatToIllustrationPx(campusId, {
    lon: point.lon + accuracyMeters / metersPerDegreeLon,
    lat: point.lat,
  });
  const radius = Math.hypot(shifted.x - origin.x, shifted.y - origin.y);
  const { width, height } = illustrationSize(campusId);
  const limit = Math.min(width, height) * MAX_RADIUS_FRACTION;
  if (!Number.isFinite(radius) || radius <= 0 || radius > limit) {
    return 0;
  }
  return radius;
}

function nearestCampus(point: LonLat, candidates: readonly CampusId[]): CampusId {
  let best = candidates[0];
  if (best == null) {
    throw new Error('キャンパスがありません');
  }
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const campusId of candidates) {
    const center = campusBoundsCenter(campusId);
    const dLat = point.lat - center.lat;
    const dLon = (point.lon - center.lon) * Math.cos((point.lat * Math.PI) / 180);
    const distance = dLat * dLat + dLon * dLon;
    if (distance < bestDistance) {
      best = campusId;
      bestDistance = distance;
    }
  }
  return best;
}

/**
 * 見ている地図に現在地を載せられるか。
 * 範囲はイラストに入る緯度経度（campusesContaining）。外なら点を出さない。
 */
export function resolveLocationCue(viewing: CampusId, fix: MapFix): LocationCue {
  const inside = campusesContaining(fix);
  if (inside.length === 0) {
    return { kind: 'outside' };
  }
  if (inside.includes(viewing)) {
    return {
      kind: 'here',
      campusId: viewing,
      pixel: lonLatToIllustrationPx(viewing, fix),
      radiusPx: accuracyRadiusPx(viewing, fix, fix.accuracyMeters),
    };
  }
  return { kind: 'elsewhere', campusId: nearestCampus(fix, inside) };
}
