import { StyleSheet, View } from 'react-native';

import { theme } from '@/theme/tokens';

type Props = {
  x: number;
  y: number;
  radiusPx: number;
  imageWidth: number;
  imageHeight: number;
  fittedWidth: number;
  fittedHeight: number;
};

const DOT = theme.space.md + theme.space.xs;
const CORE = theme.space.sm;

/** ピンと同じ拡大・移動の中に置く、絵本風の現在地。 */
export function UserLocationMarker({
  x,
  y,
  radiusPx,
  imageWidth,
  imageHeight,
  fittedWidth,
  fittedHeight,
}: Props) {
  if (imageWidth <= 0 || imageHeight <= 0 || fittedWidth <= 0 || fittedHeight <= 0) {
    return null;
  }

  const scaleX = fittedWidth / imageWidth;
  const scaleY = fittedHeight / imageHeight;
  const cx = x * scaleX;
  const cy = y * scaleY;
  const radius = radiusPx * ((scaleX + scaleY) / 2);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {radius > DOT / 2 ? (
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={[
            styles.halo,
            {
              left: cx - radius,
              top: cy - radius,
              width: radius * 2,
              height: radius * 2,
              borderRadius: radius,
            },
          ]}
        />
      ) : null}
      <View
        pointerEvents="none"
        accessible
        accessibilityLabel="現在地"
        style={[styles.dot, { left: cx - DOT / 2, top: cy - DOT / 2 }]}
      >
        <View style={styles.core} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  halo: {
    position: 'absolute',
    backgroundColor: theme.color.mossWash,
    borderColor: theme.color.moss,
    borderWidth: theme.border.hairline,
  },
  dot: {
    position: 'absolute',
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: theme.color.moss,
    borderColor: theme.color.card,
    borderWidth: theme.border.hairline * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  core: {
    width: CORE,
    height: CORE,
    borderRadius: CORE / 2,
    backgroundColor: theme.color.card,
  },
});
