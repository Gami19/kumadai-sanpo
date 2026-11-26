import { StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture, useTapGesture } from 'react-native-gesture-handler';
import Animated, { cubicBezier, useReducedMotion } from 'react-native-reanimated';

import { EstimatedChip } from '@/components/EstimatedChip';
import { theme } from '@/theme/tokens';

type PanGesture = ReturnType<typeof usePanGesture>;

type Props = {
  name: string;
  x: number;
  y: number;
  color: string;
  muted: boolean;
  estimated: boolean;
  selected: boolean;
  imageWidth: number;
  imageHeight: number;
  fittedWidth: number;
  fittedHeight: number;
  pan: PanGesture;
  onPress: () => void;
};

const HEAD = theme.space.lg;

export function MapPin({
  name,
  x,
  y,
  color,
  muted,
  estimated,
  selected,
  imageWidth,
  imageHeight,
  fittedWidth,
  fittedHeight,
  pan,
  onPress,
}: Props) {
  const reduced = useReducedMotion();
  const tap = useTapGesture({
    maxDistance: theme.space.lg,
    requireToFail: pan,
    runOnJS: true,
    hitSlop: theme.space.xs,
    onActivate: () => {
      onPress();
    },
  });

  const left = (x / imageWidth) * fittedWidth - theme.hit / 2;
  const top = (y / imageHeight) * fittedHeight - theme.hit / 2;
  const knownEdge = color === theme.color.path || selected ? theme.color.ink : theme.color.paper;

  return (
    <GestureDetector gesture={tap}>
      <View
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={estimated ? `${name}、位置は推定` : name}
        style={[styles.hit, { left, top }, muted ? styles.muted : null]}
      >
        <Animated.View
          style={[
            styles.visual,
            visualMotion,
            selected && !reduced ? styles.visualSelected : null,
          ]}
        >
          {estimated ? (
            <View pointerEvents="none" style={styles.estimate}>
              <EstimatedChip interactive={false} />
            </View>
          ) : null}
          <View
            style={[
              styles.head,
              estimated ? styles.headEstimated : styles.headKnown,
              estimated
                ? null
                : { backgroundColor: color, borderColor: knownEdge },
              estimated && selected ? styles.headSelected : null,
            ]}
          />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const visualMotion = {
  transform: [{ scale: 1 }],
  transitionProperty: 'transform',
  transitionDuration: '120ms',
  transitionTimingFunction: cubicBezier(0.23, 1, 0.32, 1),
} as const;

const styles = StyleSheet.create({
  hit: {
    position: 'absolute',
    width: theme.hit,
    height: theme.hit,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muted: {
    opacity: 0.32,
  },
  visual: {
    width: HEAD,
    height: HEAD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualSelected: {
    transform: [{ scale: 1.18 }],
  },
  head: {
    width: HEAD,
    height: HEAD,
    borderRadius: theme.radius.pill,
    borderWidth: theme.border.mark,
  },
  headKnown: {
    backgroundColor: theme.color.brick,
    borderColor: theme.color.paper,
  },
  headEstimated: {
    backgroundColor: theme.color.paper,
    borderColor: theme.color.brick,
    borderStyle: 'dashed',
  },
  headSelected: {
    borderColor: theme.color.leafDark,
  },
  estimate: {
    position: 'absolute',
    bottom: HEAD + theme.space.xs,
    width: theme.space.xl + theme.space.lg,
    alignItems: 'center',
  },
});
