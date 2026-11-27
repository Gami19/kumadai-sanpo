const EARTH_RADIUS_METERS = 6_371_000;

export type LatLon = {
  lat: number;
  lon: number;
};

/** 2点の距離（メートル）。印の範囲判定だけに使い、保存も送信もしない。 */
export function distanceMeters(from: LatLon, to: LatLon): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const dLat = lat2 - lat1;
  const dLon = toRad(to.lon - from.lon);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** 現地で押せる半径。仕様の「約100m」。 */
export const STAMP_RADIUS_METERS = 100;

/**
 * 押せないときの距離の目安。10m 未満は出さない。
 * 1km 未満は 10m 刻みで切り上げ、それ以上は 0.1km 刻み。
 */
export function formatStampDistance(meters: number): string {
  const { text } = distanceLabel(meters);
  return `約${text}`;
}

/** 読み上げ用。単位を漢字にする。 */
export function spokenStampDistance(meters: number): string {
  const { value, unit } = distanceLabel(meters);
  return unit === 'm' ? `約${value}メートル` : `約${value}キロ`;
}

function distanceLabel(meters: number): { value: string; unit: 'm' | 'km'; text: string } {
  if (!Number.isFinite(meters) || meters < 0) {
    return { value: '—', unit: 'm', text: '—' };
  }
  if (meters < 1000) {
    const rounded = Math.max(10, Math.ceil(meters / 10) * 10);
    return { value: String(rounded), unit: 'm', text: `${rounded}m` };
  }
  const km = (Math.ceil(meters / 100) / 10).toFixed(1);
  return { value: km, unit: 'km', text: `${km}km` };
}
