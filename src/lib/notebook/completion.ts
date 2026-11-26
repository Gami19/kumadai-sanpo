import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 8枚そろった演出を、もう見たかどうか。
 * notebook:v1 には入れない。スタンプとお気に入りの形はそのまま。
 * 端末の中だけに置き、サーバーへは送らない。
 */
export const COMPLETION_SEEN_KEY = 'notebook:complete-seen:v1';

export async function readCompletionSeen(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(COMPLETION_SEEN_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function writeCompletionSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(COMPLETION_SEEN_KEY, '1');
  } catch {
    // 覚えられなくても、次に帳面を開いたときもう一度だけ出す。
  }
}
