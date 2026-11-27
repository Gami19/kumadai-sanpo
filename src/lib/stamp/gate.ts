import { distanceMeters, STAMP_RADIUS_METERS, type LatLon } from '@/lib/geo/distance';
import type { MapLocationState } from '@/features/map/useMapLocation';

/**
 * いま押せるか。座標は引数だけで、ここから保存も送信もしない。
 * 地点の座標が無いときは押せない（確認できない印は出さない）。
 */
export type StampBlock =
  | { kind: 'pending' }
  | { kind: 'denied'; canAskAgain: boolean }
  | { kind: 'off' }
  | { kind: 'unknown' }
  | { kind: 'far'; meters: number };

export type StampGate = { ok: true } | { ok: false; block: StampBlock };

export function stampGate(state: MapLocationState, spot: LatLon | null): StampGate {
  if (spot == null) {
    return { ok: false, block: { kind: 'unknown' } };
  }
  if (state.status === 'idle' || state.status === 'pending') {
    return { ok: false, block: { kind: 'pending' } };
  }
  if (state.status === 'denied') {
    return { ok: false, block: { kind: 'denied', canAskAgain: state.canAskAgain } };
  }
  if (state.status === 'unavailable') {
    return { ok: false, block: { kind: state.reason === 'services-off' ? 'off' : 'unknown' } };
  }
  const meters = distanceMeters(state, spot);
  if (meters <= STAMP_RADIUS_METERS) {
    return { ok: true };
  }
  return { ok: false, block: { kind: 'far', meters } };
}
