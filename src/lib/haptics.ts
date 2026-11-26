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
  /** スタンプを押したとき。重いものが置かれる感触。 */
  stamp() {
    onIos(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  },
  remove() {
    onIos(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  },
  /** シートが指を離して元の位置に戻ったとき。 */
  settle() {
    onIos(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  },
};
