import AsyncStorage from '@react-native-async-storage/async-storage';

import { isCampusId, type CampusId } from './campuses';

/** 最後に見ていたキャンパス。位置ではなく、地図のページだけ。 */
const KEY = 'map:last-campus';

export async function readLastCampus(): Promise<CampusId | null> {
  try {
    const value = await AsyncStorage.getItem(KEY);
    if (value != null && isCampusId(value)) {
      return value;
    }
  } catch {
    // 読めなくても、最初のキャンパスで地図は開く。
  }
  return null;
}

export async function writeLastCampus(id: CampusId): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, id);
  } catch {
    // 覚えられなくても、いま開いている地図はそのまま。
  }
}
