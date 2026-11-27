import AsyncStorage from '@react-native-async-storage/async-storage';

import { isCampusId, type CampusId } from '@/features/map/campuses';

/**
 * 区画制覇の着地を、もう見たかどうか。
 * notebook:v1 には入れない。スタンプの形はそのまま。
 * 端末の中だけに置き、座標は書かず、サーバーへは送らない。
 */
export const DISTRICT_SEEN_KEY = 'notebook:district-seen:v1';

export async function readDistrictSeen(): Promise<ReadonlySet<CampusId>> {
  try {
    const raw = await AsyncStorage.getItem(DISTRICT_SEEN_KEY);
    if (raw == null || raw.trim().length === 0) {
      return new Set();
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return new Set();
    }
    const ids = parsed.filter((item): item is CampusId => typeof item === 'string' && isCampusId(item));
    return new Set(ids);
  } catch {
    return new Set();
  }
}

export async function writeDistrictSeen(ids: readonly CampusId[]): Promise<void> {
  try {
    await AsyncStorage.setItem(DISTRICT_SEEN_KEY, JSON.stringify(ids));
  } catch {
    // 覚えられなくても、次に帳面を開いたときもう一度だけ出す。
  }
}
