import { isInsideIllustration, lonLatToIllustrationPx, type LonLat } from './georef';
import type { CampusId } from './campuses';
import type { Spot } from './parseSpotsCsv';

export type PlacedSpot = Spot & {
  lat: number;
  lon: number;
  x: number;
  y: number;
};

function coordinate(spot: Spot): LonLat | null {
  if (spot.lat == null || spot.lon == null) {
    return null;
  }
  return { lat: spot.lat, lon: spot.lon };
}

/**
 * 座標があり、指定キャンパスのイラスト範囲に入り、区分が合うスポット。
 * 座標の無い行（文書館）はここでは落ちる。
 * 範囲が重なるキャンパスでは、同じ地点がそれぞれの地図に載る。
 */
export function placeSpots(
  spots: readonly Spot[],
  campusId: CampusId,
  designationId: string | null,
): PlacedSpot[] {
  const placed: PlacedSpot[] = [];
  for (const spot of spots) {
    const point = coordinate(spot);
    if (!point || spot.lat == null || spot.lon == null) {
      continue;
    }
    if (designationId != null && spot.designation !== designationId) {
      continue;
    }
    if (!isInsideIllustration(campusId, point)) {
      continue;
    }
    const pixel = lonLatToIllustrationPx(campusId, point);
    placed.push({
      ...spot,
      lat: spot.lat,
      lon: spot.lon,
      x: pixel.x,
      y: pixel.y,
    });
  }
  return placed;
}
