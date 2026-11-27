import { useSyncExternalStore } from 'react';

import type { DevMapFix } from './devMapFix';

/**
 * 開発ビルドで選んだ模擬位置。メモリだけに置き、保存も送信もしない。
 * 公開ビルドでは常に null。プリセットの座標はこのファイルに置かない。
 */
let current: DevMapFix | null = null;
const listeners = new Set<() => void>();

export function getDevLocation(): DevMapFix | null {
  if (!__DEV__) {
    return null;
  }
  return current;
}

export function setDevLocation(fix: DevMapFix | null): void {
  if (!__DEV__) {
    return;
  }
  current = fix;
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeDevLocation(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useDevLocation(): DevMapFix | null {
  return useSyncExternalStore(subscribeDevLocation, getDevLocation, () => null);
}
