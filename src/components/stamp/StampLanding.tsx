import { useEffect, type ReactNode } from 'react';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

/** 印が少し大きく出て、紙に着地する。人物の印と同じばね。 */
const LANDING = { damping: 12, stiffness: 240, reduceMotion: ReduceMotion.System };

type Props = {
  pop?: boolean;
  children: ReactNode;
};

export function StampLanding({ pop = false, children }: Props) {
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
    transform: [{ scale: scale.get() }, { rotate: '-8deg' }],
  }));

  return (
    <Animated.View accessible={false} style={animated}>
      {children}
    </Animated.View>
  );
}
