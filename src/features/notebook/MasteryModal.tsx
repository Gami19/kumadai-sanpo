import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { MasteryStamp } from '@/components/stamp/MasteryStamp';
import { campuses, type CampusId } from '@/features/map/campuses';
import type { Building } from '@/lib/content/buildings';
import { campusBuildings } from '@/lib/notebook/districts';
import { theme } from '@/theme/tokens';

const EASE = Easing.bezier(0.23, 1, 0.32, 1);
const OPEN_MS = 220;
const CLOSE_MS = 160;

export type MasteryModalKind =
  | { mode: 'preview'; campusId: CampusId | null }
  | { mode: 'celebrate'; campusId: CampusId | null };

type Props = {
  kind: MasteryModalKind;
  buildings: readonly Building[];
  stampedIds: ReadonlySet<string>;
  visible: boolean;
  onClose: () => void;
};

/** 制覇の印の拡大表示と、制覇した瞬間の演出。 */
export function MasteryModal({ kind, buildings, stampedIds, visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  const seal = Math.round(width * 0.72);
  const progress = useSharedValue(0);
  const campusId = kind.campusId;
  const campus = campusId != null ? campuses.find((item) => item.id === campusId) : null;
  const group = campusId != null ? campusBuildings(buildings, campusId) : [...buildings];
  const got = group.filter((building) => stampedIds.has(building.id)).length;
  const total = group.length;
  const done = total > 0 && got === total;
  const remaining = group.filter((building) => !stampedIds.has(building.id));
  const celebrate = kind.mode === 'celebrate';

  useEffect(() => {
    if (reduced) {
      progress.set(visible ? 1 : 0);
      return;
    }
    progress.set(
      withTiming(visible ? 1 : 0, {
        duration: visible ? OPEN_MS : CLOSE_MS,
        easing: EASE,
        reduceMotion: ReduceMotion.System,
      }),
    );
  }, [visible, reduced, progress]);

  const backdrop = useAnimatedStyle(() => ({
    opacity: progress.get() * 0.4,
  }));
  const sheet = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ scale: reduced ? 1 : 0.92 + progress.get() * 0.08 }],
  }));

  const headline = celebrate
    ? campus != null
      ? `${campus.label}キャンパスを制覇しました`
      : `${total}件すべてを制覇しました`
    : campus != null
      ? `${campus.label} 制覇`
      : '全制覇';

  const body = celebrate
    ? campus != null
      ? `${campus.label}の建物がそろい、制覇の印が押せました。`
      : 'さんぽ帳の建物印がすべてそろいました。'
    : done
      ? `${got}/${total}。そろっています。`
      : `進捗 ${got}/${total}。あと${total - got}件：${remaining.map((item) => item.name).join('、')}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={styles.root} accessibilityViewIsModal>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="閉じる"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        >
          <Animated.View style={[styles.scrim, backdrop]} />
        </Pressable>
        <Animated.View
          style={[
            styles.card,
            sheet,
            { paddingBottom: Math.max(insets.bottom, theme.space.lg) + theme.space.sm },
          ]}
        >
          <View style={styles.header}>
            <Text
              style={styles.title}
              accessibilityRole="header"
              accessibilityLabel={headline}
              maxFontSizeMultiplier={1.4}
            >
              {headline}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="閉じる"
              onPress={onClose}
              hitSlop={theme.space.sm}
              style={({ pressed }) => [styles.close, pressed && styles.pressed]}
            >
              <Icon name="xmark" size={20} color={theme.color.ink} />
            </Pressable>
          </View>

          <View style={styles.stage}>
            {done || celebrate ? (
              <MasteryStamp campusId={campusId ?? undefined} size={seal} pop={celebrate} />
            ) : (
              <View style={[styles.lockPad, { width: seal * 0.55, height: seal * 0.55 }]}>
                <Icon name="lock" size={36} color={theme.color.inkMuted} />
              </View>
            )}
          </View>

          <Text style={styles.meta}>{body}</Text>

          {!celebrate && !done && remaining.length > 0 ? (
            <View style={styles.remainList}>
              {remaining.map((building) => (
                <Text key={building.id} style={styles.remainItem}>
                  ・{building.name}
                </Text>
              ))}
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="閉じる"
            onPress={onClose}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          >
            <Text style={styles.actionLabel}>{celebrate ? 'つづける' : '閉じる'}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: theme.color.ink,
  },
  card: {
    marginHorizontal: theme.space.md,
    marginBottom: theme.space.md,
    paddingTop: theme.space.md,
    paddingHorizontal: theme.space.lg,
    borderRadius: theme.radius.lg,
    borderCurve: 'continuous',
    backgroundColor: theme.color.paper,
    gap: theme.space.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.space.sm,
  },
  title: {
    flex: 1,
    color: theme.color.ink,
    fontFamily: theme.font.heading,
    fontSize: theme.font.body,
  },
  close: {
    width: theme.hit,
    height: theme.hit,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
  },
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    paddingVertical: theme.space.sm,
  },
  lockPad: {
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.separator,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    color: theme.color.inkMuted,
    fontSize: theme.font.caption,
    textAlign: 'center',
    lineHeight: 20,
  },
  remainList: {
    gap: 2,
  },
  remainItem: {
    color: theme.color.ink,
    fontSize: theme.font.caption,
  },
  action: {
    minHeight: theme.hit,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.vermilion,
  },
  actionLabel: {
    color: theme.color.white,
    fontSize: theme.font.body,
    fontWeight: '700',
  },
  pressed: {
    opacity: theme.opacity.pressed,
  },
});
