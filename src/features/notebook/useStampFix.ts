import { Linking } from 'react-native';

import { useDevLocation } from '@/features/map/devLocation';
import { useMapLocation, type MapLocationState } from '@/features/map/useMapLocation';

import type { StampBlock } from '@/lib/stamp/gate';

/**
 * 押印の判定に使う現在地。
 * 開発ビルドで模擬位置があるときはそれを使い、端末の位置は取らない。
 * 座標は state にだけ置き、保存も送信もしない。画面を離れたら購読を止める。
 */
export function useStampFix(active: boolean): {
  state: MapLocationState;
  retry: () => void;
} {
  const dev = useDevLocation();
  const gps = useMapLocation(active && dev == null);
  if (dev != null) {
    return {
      state: {
        status: 'ready',
        lat: dev.lat,
        lon: dev.lon,
        accuracyMeters: dev.accuracyMeters,
      },
      retry: () => undefined,
    };
  }
  return gps;
}

/** 位置が取れないときの回復。範囲外では呼ばない。 */
export function recoverStampLocation(block: StampBlock, retry: () => void): void {
  if (block.kind === 'denied') {
    if (block.canAskAgain) {
      retry();
    } else {
      void Linking.openSettings();
    }
    return;
  }
  if (block.kind === 'off') {
    void Linking.openSettings();
    return;
  }
  if (block.kind === 'unknown') {
    retry();
  }
}
