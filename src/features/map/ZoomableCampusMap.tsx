/* eslint-disable react-hooks/immutability -- Reanimated の shared value は .value への代入で更新する */
import { Image } from 'expo-image';
import { useLayoutEffect, useState } from 'react';
import { Image as ReactNativeImage, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { GestureDetector, usePanGesture, usePinchGesture, useSimultaneousGestures } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { theme } from '@/theme/tokens';

import { MapPin } from './MapPin';
import { UserLocationMarker } from './UserLocationMarker';
import { clamp, containSize, focusTranslation, translationBounds, type Size } from './viewport';

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const FOCUS_SCALE = 2.5;
const FOCUS_MS = 280;
const PAN_SLOP = theme.space.sm * 2;

export type CampusMapPin = {
  id: string;
  name: string;
  x: number;
  y: number;
  estimated: boolean;
};

export type UserMapLocation = {
  x: number;
  y: number;
  radiusPx: number;
};

export type MapFocus = {
  x: number;
  y: number;
  /** 同じ地点をもう一度中心にするとき、親が増やす。 */
  token: number;
};

type Props = {
  source: number;
  accessibilityLabel: string;
  imageWidth: number;
  imageHeight: number;
  pins: readonly CampusMapPin[];
  selectedPinId: string | null;
  onSelectPin: (id: string) => void;
  userLocation: UserMapLocation | null;
  focus: MapFocus | null;
};

function bundledImageSize(source: number): Size | null {
  if (typeof ReactNativeImage.resolveAssetSource !== 'function') {
    return null;
  }
  const resolved = ReactNativeImage.resolveAssetSource(source);
  const width = resolved?.width;
  const height = resolved?.height;
  if (width == null || height == null || width <= 0 || height <= 0) {
    return null;
  }
  return { width, height };
}

export function ZoomableCampusMap({
  source,
  accessibilityLabel,
  imageWidth,
  imageHeight,
  pins,
  selectedPinId,
  onSelectPin,
  userLocation,
  focus,
}: Props) {
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
  const focusToken = focus?.token ?? 0;
  const focusX = focus?.x ?? 0;
  const focusY = focus?.y ?? 0;

  useLayoutEffect(() => {
    containerWidth.value = container.width;
    containerHeight.value = container.height;
    fittedWidth.value = fitted.width;
    fittedHeight.value = fitted.height;
    if (container.width <= 0 || fitted.width <= 0 || imageWidth <= 0 || imageHeight <= 0) {
      return;
    }
    // 緯度経度の更新では動かさない。ボタンで token が増えたときだけ中心へ寄る。
    if (focusToken > 0) {
      const next = focusTranslation(
        container.width,
        container.height,
        fitted.width,
        fitted.height,
        imageWidth,
        imageHeight,
        focusX,
        focusY,
        FOCUS_SCALE,
      );
      scale.value = withTiming(FOCUS_SCALE, { duration: FOCUS_MS });
      translateX.value = withTiming(next.x, { duration: FOCUS_MS });
      translateY.value = withTiming(next.y, { duration: FOCUS_MS });
      savedScale.value = FOCUS_SCALE;
      savedTranslateX.value = next.x;
      savedTranslateY.value = next.y;
      return;
    }
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
    focusToken,
    focusX,
    focusY,
    imageHeight,
    imageWidth,
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
    minDistance: PAN_SLOP,
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
      >
        {fitted.width > 0 ? (
          <Animated.View
            pointerEvents="box-none"
            style={[{ width: fitted.width, height: fitted.height }, animatedStyle]}
          >
            <Image
              source={source}
              style={styles.image}
              contentFit="contain"
              accessible
              accessibilityRole="image"
              accessibilityLabel={accessibilityLabel}
              pointerEvents="none"
              onLoad={(event) => {
                const { width, height } = event.source;
                if (width <= 0 || height <= 0) {
                  return;
                }
                setImageSize((current) => current ?? { width, height });
              }}
            />
            {pins.map((pin) => (
              <MapPin
                key={pin.id}
                name={pin.name}
                x={pin.x}
                y={pin.y}
                estimated={pin.estimated}
                selected={pin.id === selectedPinId}
                imageWidth={imageWidth}
                imageHeight={imageHeight}
                fittedWidth={fitted.width}
                fittedHeight={fitted.height}
                pan={pan}
                onPress={() => onSelectPin(pin.id)}
              />
            ))}
            {userLocation ? (
              <UserLocationMarker
                x={userLocation.x}
                y={userLocation.y}
                radiusPx={userLocation.radiusPx}
                imageWidth={imageWidth}
                imageHeight={imageHeight}
                fittedWidth={fitted.width}
                fittedHeight={fitted.height}
              />
            ) : null}
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
