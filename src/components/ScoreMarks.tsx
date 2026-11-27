import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Icon } from '@/components/Icon';
import { theme } from '@/theme/tokens';

type Props = {
  correct: number;
  total: number;
  /** 一覧の小さい葉。結果画面は大きめ。 */
  size?: 'sm' | 'lg';
  /** 結果画面だけ短い出現。一覧では動かさない。 */
  animate?: boolean;
  accessibilityLabel?: string;
};

const RESULT_MS = 180;
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

/**
 * 成績の印。星ではなく葉。銀杏並木の世界観に合わせ、朱色のスタンプとは色を分ける。
 */
export function ScoreMarks({
  correct,
  total,
  size = 'sm',
  animate = false,
  accessibilityLabel,
}: Props) {
  const count = Math.max(total, 1);
  const mark = size === 'lg' ? theme.space.xl : 16;
  const reduced = useReducedMotion();
  const progress = useSharedValue(animate && !reduced ? 0 : 1);

  useEffect(() => {
    if (!animate) {
      progress.set(1);
      return;
    }
    progress.set(
      withTiming(1, {
        duration: reduced ? 0 : RESULT_MS,
        easing: EASE_OUT,
        reduceMotion: ReduceMotion.System,
      }),
    );
  }, [animate, progress, reduced]);

  const animated = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ scale: 0.94 + progress.get() * 0.06 }],
  }));

  const marks = Array.from({ length: count }, (_, index) => {
    const filled = index < correct;
    return (
      <View
        key={index}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Icon
          name={filled ? 'leaf.fill' : 'leaf'}
          size={mark}
          color={filled ? theme.color.brick : theme.color.inkMuted}
        />
      </View>
    );
  });

  if (animate) {
    return (
      <Animated.View
        accessible
        accessibilityRole="text"
        accessibilityLabel={accessibilityLabel}
        style={[styles.row, styles.rowLg, animated]}
      >
        {marks}
      </Animated.View>
    );
  }

  return (
    <View
      accessible={accessibilityLabel != null}
      accessibilityRole={accessibilityLabel != null ? 'text' : undefined}
      accessibilityLabel={accessibilityLabel}
      style={[styles.row, size === 'lg' && styles.rowLg, size === 'sm' && styles.slot]}
    >
      {marks}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: theme.space.xs,
    minHeight: theme.font.body + theme.space.xs,
  },
  rowLg: {
    minHeight: theme.space.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.space.sm,
  },
  slot: {
    minHeight: theme.font.body + theme.space.xs,
    paddingHorizontal: theme.space.xs,
  },
});
