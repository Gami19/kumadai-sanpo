import { StyleSheet, Text, View } from 'react-native';
import { GestureDetector, usePanGesture, useTapGesture } from 'react-native-gesture-handler';

import { theme } from '@/theme/tokens';

type PanGesture = ReturnType<typeof usePanGesture>;

type Props = {
  name: string;
  x: number;
  y: number;
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
  estimated,
  selected,
  imageWidth,
  imageHeight,
  fittedWidth,
  fittedHeight,
  pan,
  onPress,
}: Props) {
  const tap = useTapGesture({
    maxDistance: theme.space.lg,
    requireToFail: pan,
    runOnJS: true,
    hitSlop: theme.space.xs,
    onActivate: () => {
      onPress();
    },
  });

  const left = (x / imageWidth) * fittedWidth - HEAD / 2;
  const top = (y / imageHeight) * fittedHeight - HEAD / 2;

  return (
    <GestureDetector gesture={tap}>
      <View
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={estimated ? `${name}、位置は推定` : name}
        style={[styles.hit, { left, top }]}
      >
        {estimated ? <Text style={styles.estimate}>推定</Text> : null}
        <View
          style={[
            styles.head,
            estimated ? styles.headEstimated : styles.headKnown,
            selected ? styles.headSelected : null,
          ]}
        />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  hit: {
    position: 'absolute',
    width: HEAD,
    height: HEAD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  head: {
    width: HEAD,
    height: HEAD,
    borderRadius: theme.radius.md,
    borderWidth: theme.border.hairline * 2,
  },
  headKnown: {
    backgroundColor: theme.color.clay,
    borderColor: theme.color.card,
  },
  headEstimated: {
    backgroundColor: theme.color.card,
    borderColor: theme.color.clay,
    borderStyle: 'dashed',
  },
  headSelected: {
    borderColor: theme.color.moss,
  },
  estimate: {
    position: 'absolute',
    bottom: HEAD + theme.space.xs,
    width: theme.space.xl + theme.space.lg,
    textAlign: 'center',
    color: theme.color.ink,
    backgroundColor: theme.color.card,
    fontSize: theme.font.caption,
    fontWeight: '700',
    overflow: 'hidden',
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.space.xs,
  },
});
