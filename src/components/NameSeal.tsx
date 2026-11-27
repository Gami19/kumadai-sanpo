import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { theme } from '@/theme/tokens';

type Props = {
  name: string;
  size?: number;
  /** 押した直後だけ、印が着地する。 */
  pop?: boolean;
};

export function nameInitial(name: string): string {
  return Array.from(name.trim())[0] ?? '';
}

/** 印が少し大きく出て、紙に着地する。数値は印章で共通。 */
const LANDING = { damping: 12, stiffness: 240, reduceMotion: ReduceMotion.System };

export function NameSeal({ name, size = 44, pop = false }: Props) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(pop && !reduced ? 1.55 : 1);

  useEffect(() => {
    if (!pop || reduced) {
      scale.set(1);
      return;
    }
    scale.set(1.55);
    scale.set(withSpring(1, LANDING));
  }, [pop, reduced, scale]);

  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }, { rotate: '-10deg' }],
  }));

  return (
    <Animated.View
      accessible={false}
      style={[
        styles.seal,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: Math.max(2, Math.round(size * 0.06)),
        },
        animated,
      ]}
    >
      <Text style={[styles.letter, { fontSize: Math.round(size * 0.42) }]}>{nameInitial(name)}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  seal: {
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: theme.color.brick,
    backgroundColor: theme.color.paper,
  },
  letter: {
    fontFamily: theme.font.heading,
    color: theme.color.brick,
  },
});
