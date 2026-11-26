import * as Haptics from 'expo-haptics';

/**
 * 触覚は iOS だけ。視覚と同時に、操作1回につき1回。
 * Android では振動が無い人にも伝わるよう、見た目の変化を先に出す。
 */
function onIos(run: () => Promise<void>) {
  if (process.env.EXPO_OS !== 'ios') {
    return;
  }
  void run();
}

export const haptics = {
  select() {
    onIos(() => Haptics.selectionAsync());
  },
  /** スタンプが着地したとき。成功の触覚。この操作の触覚はこれ1回。 */
  stamp() {
    onIos(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  },
  /** スタンプやお気に入りを取り消したとき。軽い触覚。 */
  remove() {
    onIos(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  },
  /** シートが指を離して元の位置に戻ったとき。 */
  settle() {
    onIos(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  },
  /** クイズの正解。タイルの色とチェックと同じ瞬間。 */
  success() {
    onIos(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  },
  /** クイズの不正解。タイルの色とバツと同じ瞬間。 */
  error() {
    onIos(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
  },
};
