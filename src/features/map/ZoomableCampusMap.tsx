/* eslint-disable react-hooks/immutability -- Reanimated の shared value は .value への代入で更新する */
import { Image } from 'expo-image';
import { useLayoutEffect, useState } from 'react';
import { Image as ReactNativeImage, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { GestureDetector, usePanGesture, usePinchGesture, useSimultaneousGestures } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { clamp, containSize, translationBounds, type Size } from './viewport';

const MIN_SCALE = 1;
const MAX_SCALE = 5;

type Props = {
  source: number;
  accessibilityLabel: string;
};

function bundledImageSize(source: number): Size | null {
  const resolved = ReactNativeImage.resolveAssetSource(source);
  const width = resolved?.width;
  const height = resolved?.height;
  if (width == null || height == null || width <= 0 || height <= 0) {
    return null;
  }
  return { width, height };
}

export function ZoomableCampusMap({ source, accessibilityLabel }: Props) {
  const [imageSize, setImageSize] = useState<Size | null>(() => bundledImageSize(source));
  const [container, setContainer] = useState<Size>({ width: 0, height: 0 });
  const fitted = containSize(
    container.width,
    container.height,
    imageSize?.width ?? 0,
    imageSize?.height ?? 0,
  );

  const containerWidth = useSharedValue(0);
  const containerHeight = useSharedValue(0);
  const fittedWidth = useSharedValue(0);
  const fittedHeight = useSharedValue(0);
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const contentX = useSharedValue(0);
  const contentY = useSharedValue(0);
  const pinchScaleAtStart = useSharedValue(1);
  const panOriginX = useSharedValue(0);
  const panOriginY = useSharedValue(0);

  useLayoutEffect(() => {
    containerWidth.value = container.width;
    containerHeight.value = container.height;
    fittedWidth.value = fitted.width;
    fittedHeight.value = fitted.height;
    scale.value = MIN_SCALE;
    translateX.value = 0;
    translateY.value = 0;
    savedScale.value = MIN_SCALE;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, [
    container.height,
    container.width,
    containerHeight,
    containerWidth,
    fitted.height,
    fitted.width,
    fittedHeight,
    fittedWidth,
    savedScale,
    savedTranslateX,
    savedTranslateY,
    scale,
    translateX,
    translateY,
  ]);

  const pinch = usePinchGesture({
    onActivate: (event) => {
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      const focalX = event.focalX - containerWidth.value / 2;
      const focalY = event.focalY - containerHeight.value / 2;
      const currentScale = scale.value === 0 ? MIN_SCALE : scale.value;
      contentX.value = (focalX - translateX.value) / currentScale;
      contentY.value = (focalY - translateY.value) / currentScale;
      pinchScaleAtStart.value = event.scale === 0 ? 1 : event.scale;
    },
    onUpdate: (event) => {
      if (fittedWidth.value <= 0 || containerWidth.value <= 0) {
        return;
      }
      const relativeScale = event.scale / pinchScaleAtStart.value;
      const nextScale = clamp(savedScale.value * relativeScale, MIN_SCALE, MAX_SCALE);
      const focalX = event.focalX - containerWidth.value / 2;
      const focalY = event.focalY - containerHeight.value / 2;
      // 指の下の絵が拡大後も指の下に残るよう、中心からのずれを平行移動に換える。
      const nextX = focalX - contentX.value * nextScale;
      const nextY = focalY - contentY.value * nextScale;
      const { maxX, maxY } = translationBounds(
        containerWidth.value,
        containerHeight.value,
        fittedWidth.value,
        fittedHeight.value,
        nextScale,
      );
      scale.value = nextScale;
      translateX.value = clamp(nextX, -maxX, maxX);
      translateY.value = clamp(nextY, -maxY, maxY);
    },
  });

  const pan = usePanGesture({
    maxPointers: 1,
    onActivate: (event) => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      panOriginX.value = event.translationX;
      panOriginY.value = event.translationY;
    },
    onUpdate: (event) => {
      if (fittedWidth.value <= 0 || containerWidth.value <= 0) {
        return;
      }
      const nextX = savedTranslateX.value + (event.translationX - panOriginX.value);
      const nextY = savedTranslateY.value + (event.translationY - panOriginY.value);
      const { maxX, maxY } = translationBounds(
        containerWidth.value,
        containerHeight.value,
        fittedWidth.value,
        fittedHeight.value,
        scale.value,
      );
      translateX.value = clamp(nextX, -maxX, maxX);
      translateY.value = clamp(nextY, -maxY, maxY);
    },
  });

  const gesture = useSimultaneousGestures(pan, pinch);

  const animatedStyle = useAnimatedStyle(() => ({
    // scale を末尾に置く。先に拡大し、その後の平行移動は画面上の距離のままになる。
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContainer((current) =>
      current.width === width && current.height === height ? current : { width, height },
    );
  };

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={styles.viewport}
        onLayout={onLayout}
        collapsable={false}
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
      >
        {fitted.width > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[{ width: fitted.width, height: fitted.height }, animatedStyle]}
          >
            <Image
              source={source}
              style={styles.image}
              contentFit="contain"
              accessible={false}
              onLoad={(event) => {
                const { width, height } = event.source;
                if (width <= 0 || height <= 0) {
                  return;
                }
                setImageSize((current) => current ?? { width, height });
              }}
            />
          </Animated.View>
        ) : null}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
