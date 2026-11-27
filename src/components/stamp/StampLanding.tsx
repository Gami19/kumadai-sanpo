import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { theme } from '@/theme/tokens';

/** 印が少し大きく出て、紙に着地する。人物の印と同じばね。 */
const LANDING = { damping: 12, stiffness: 240, reduceMotion: ReduceMotion.System };

/** 台紙を印より少し大きくし、傾きではみ出さない余白も兼ねる。 */
const PAD_SCALE = 1.1;

type Props = {
  pop?: boolean;
  size: number;
  /** 押印済みだけ和紙台紙を敷く。空枠は false。 */
  pad?: boolean;
  children: ReactNode;
};

export function StampLanding({ pop = false, size, pad = true, children }: Props) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(pop && !reduced ? 1.55 : 1);
  const padSize = size * PAD_SCALE;

  useEffect(() => {
    if (!pop || reduced) {
      scale.set(1);
      return;
    }
    scale.set(1.55);
    scale.set(withSpring(1, LANDING));
  }, [pop, reduced, scale]);

  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }, { rotate: '-8deg' }],
  }));

  return (
    <Animated.View accessible={false} style={animated}>
      <View style={[styles.cell, { width: size, height: size }]}>
        {pad ? (
          <View
            pointerEvents="none"
            style={[
              styles.pad,
              {
                width: padSize,
                height: padSize,
                borderRadius: padSize / 2,
              },
            ]}
          />
        ) : null}
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  /**
   * 和紙／生成り色の円形台紙。朱のインクがイラストの上でもくっきり見えるようにする。
   * 紙 #F6F3E7 の上で朱色は約 4.6:1（非テキスト 3:1 以上）。
   */
  pad: {
    position: 'absolute',
    backgroundColor: theme.color.paper,
    shadowColor: theme.color.ink,
    shadowOpacity: 0.14,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});
