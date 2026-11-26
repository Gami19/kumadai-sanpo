import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
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

export function NameSeal({ name, size = 44, pop = false }: Props) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!pop || reduced) {
      scale.value = 1;
      return;
    }
    scale.value = 1.55;
    scale.value = withSpring(1, { damping: 12, stiffness: 240 });
  }, [pop, reduced, scale]);

  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: '-10deg' }],
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
