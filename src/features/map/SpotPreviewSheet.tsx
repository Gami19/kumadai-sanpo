import { router } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { EstimatedChip } from '@/components/EstimatedChip';
import { Icon } from '@/components/Icon';
import { MapThumb } from '@/components/MapThumb';
import { NameSeal } from '@/components/NameSeal';
import { haptics } from '@/lib/haptics';
import { theme } from '@/theme/tokens';

type Stamp = 'unknown' | 'on' | 'off';

type Props = {
  id: string;
  name: string;
  summary: string;
  estimated: boolean;
  stamp: Stamp;
  bottom: number;
  onClose: () => void;
};

const THUMB = theme.space.xl + theme.space.lg;
const MARK = theme.space.lg + theme.space.xs;

function firstSentence(text: string): string {
  const trimmed = text.trim();
  const end = trimmed.indexOf('。');
  if (end === -1) {
    return trimmed;
  }
  return trimmed.slice(0, end + 1);
}

function project(velocity: number, decelerationRate = 0.998) {
  'worklet';
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

function rubberband(overshoot: number, dimension: number, constant = 0.55) {
  'worklet';
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

export function SpotPreviewSheet({ id, name, summary, estimated, stamp, bottom, onClose }: Props) {
  const reduced = useReducedMotion();
  const translateY = useSharedValue(reduced ? 0 : 360);
  const height = useSharedValue(360);
  const context = useSharedValue(0);
  const line = firstSentence(summary);

  useEffect(() => {
    translateY.set(
      withSpring(0, {
        duration: 300,
        dampingRatio: 0.8,
        reduceMotion: ReduceMotion.System,
      }),
    );
  }, [translateY]);

  const dismiss = useCallback(() => {
    const limit = Math.max(height.get(), 1);
    translateY.set(
      withSpring(
        limit,
        {
          duration: 300,
          dampingRatio: 1,
          overshootClamping: true,
          reduceMotion: ReduceMotion.System,
        },
        (finished) => {
          if (finished) {
            scheduleOnRN(onClose);
          }
        },
      ),
    );
  }, [height, onClose, translateY]);

  const pan = usePanGesture({
    activeOffsetY: 12,
    onBegin: () => {
      context.set(translateY.get());
    },
    onUpdate: (event) => {
      const next = context.get() + event.translationY;
      const limit = Math.max(height.get(), 1);
      translateY.set(next >= 0 ? next : rubberband(next, limit));
    },
    onDeactivate: (event) => {
      const limit = Math.max(height.get(), 1);
      const pulled = translateY.get();
      const projected = pulled + project(event.velocityY);
      if (!event.canceled && (projected > limit * 0.4 || event.velocityY > 1400)) {
        translateY.set(
          withSpring(
            limit,
            {
              duration: 300,
              dampingRatio: 1,
              velocity: event.velocityY,
              overshootClamping: true,
              reduceMotion: ReduceMotion.System,
            },
            (finished) => {
              if (finished) {
                scheduleOnRN(onClose);
              }
            },
          ),
        );
        return;
      }
      translateY.set(
        withSpring(0, {
          duration: 300,
          dampingRatio: 0.8,
          velocity: event.velocityY,
          reduceMotion: ReduceMotion.System,
        }),
      );
      if (pulled > 12) {
        scheduleOnRN(haptics.settle);
      }
    },
  });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.get() }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.get(), [0, Math.max(height.get(), 1)], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <View style={styles.fill} pointerEvents="box-none" testID="spot-sheet">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="プレビューを閉じる"
        onPress={() => {
          haptics.select();
          dismiss();
        }}
        style={styles.fill}
      >
        <Animated.View pointerEvents="none" style={[styles.backdrop, backdropStyle]} />
      </Pressable>
      <GestureDetector gesture={pan}>
        <Animated.View
          onLayout={(event) => {
            height.set(event.nativeEvent.layout.height);
          }}
          style={[styles.sheet, { bottom }, sheetStyle]}
        >
          <View style={styles.grabber} />
          <View style={styles.body}>
            <View style={styles.thumbWrap}>
              <MapThumb id={id} sepia={stamp === 'off'} style={styles.thumb} label={name} />
              {stamp === 'unknown' ? null : (
                <View
                  accessible
                  accessibilityLabel={stamp === 'on' ? '押印済み' : '未押印'}
                  style={styles.mark}
                >
                  {stamp === 'on' ? (
                    <NameSeal name={name} size={MARK} />
                  ) : (
                    <View style={styles.emptyMark} />
                  )}
                </View>
              )}
            </View>
            <View style={styles.copy}>
              <Text selectable numberOfLines={1} style={styles.name}>
                {name}
              </Text>
              {line.length > 0 ? (
                <Text numberOfLines={1} style={styles.summary}>
                  {line}
                </Text>
              ) : null}
              {estimated ? <EstimatedChip /> : null}
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${name}の詳細`}
            onPress={() => {
              haptics.select();
              router.push({ pathname: '/building/[id]', params: { id } });
            }}
            style={({ pressed }) => [styles.detail, pressed ? styles.detailPressed : null]}
          >
            <Text style={styles.detailLabel}>詳細</Text>
            <Icon name="chevron.right" color={theme.color.white} />
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: theme.color.scrim,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    gap: theme.space.md,
    paddingTop: theme.space.sm,
    paddingHorizontal: theme.space.md,
    paddingBottom: theme.space.md,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    borderCurve: 'continuous',
    backgroundColor: theme.color.paper,
    boxShadow: theme.shadow.float,
  },
  grabber: {
    alignSelf: 'center',
    width: theme.space.xl,
    height: theme.space.xs,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.inkMuted,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
  },
  thumbWrap: {
    width: THUMB,
    height: THUMB,
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: theme.radius.sm,
    borderCurve: 'continuous',
  },
  mark: {
    position: 'absolute',
    right: -theme.space.xs,
    bottom: -theme.space.xs,
  },
  emptyMark: {
    width: MARK,
    height: MARK,
    borderRadius: MARK / 2,
    borderWidth: theme.border.mark,
    borderColor: theme.color.brick,
    backgroundColor: theme.color.paper,
  },
  copy: {
    flex: 1,
    gap: theme.space.xs,
  },
  name: {
    fontFamily: theme.font.heading,
    fontSize: theme.font.body,
    lineHeight: theme.font.body + theme.space.xs,
    color: theme.color.ink,
  },
  summary: {
    fontSize: theme.font.caption,
    lineHeight: theme.font.caption + theme.space.xs,
    color: theme.color.inkMuted,
  },
  detail: {
    minHeight: theme.hit,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.xs,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    backgroundColor: theme.color.brick,
  },
  detailPressed: {
    opacity: 0.7,
  },
  detailLabel: {
    color: theme.color.white,
    fontSize: theme.font.body,
    fontWeight: '700',
    lineHeight: theme.font.body + theme.space.xs,
  },
});
