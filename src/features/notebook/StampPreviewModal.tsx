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
import { BuildingStamp } from '@/components/stamp/BuildingStamp';
import type { CampusId } from '@/features/map/campuses';
import type { Building } from '@/lib/content/buildings';
import { formatNotebookTime } from '@/lib/notebook/parse';
import type { StampGate } from '@/lib/stamp/gate';
import { theme } from '@/theme/tokens';

import { blockNeedsRecover, howToGetBody } from './stampCopy';

const EASE = Easing.bezier(0.23, 1, 0.32, 1);
const OPEN_MS = 220;
const CLOSE_MS = 160;

type Props = {
  building: Building;
  campusId: CampusId;
  stampedAt: string | null;
  gate: StampGate;
  visible: boolean;
  onClose: () => void;
  onOpenDetail: () => void;
  onOpenMap: () => void;
  onStamp: () => void;
  onRecover: () => void;
};

/** 取得済み・未取得の印を大きく見せる。 */
export function StampPreviewModal({
  building,
  campusId,
  stampedAt,
  gate,
  visible,
  onClose,
  onOpenDetail,
  onOpenMap,
  onStamp,
  onRecover,
}: Props) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  const seal = Math.round(width * 0.76);
  const progress = useSharedValue(0);
  const stamped = stampedAt != null;
  const ready = !stamped && gate.ok;
  const blocked = !stamped && !gate.ok ? gate.block : null;

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

  const title = stamped
    ? `${building.name}のスタンプ`
    : ready
      ? `${building.name}のスタンプを押せます`
      : `${building.name}のスタンプはまだ取れません`;

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
          <View
            accessible
            accessibilityRole="header"
            accessibilityLabel={title}
            style={styles.header}
          >
            <Text style={styles.name} maxFontSizeMultiplier={1.4}>
              {building.name}
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

          <View style={styles.stage} accessibilityElementsHidden={!stamped}>
            {stamped ? (
              <BuildingStamp buildingId={building.id} campusId={campusId} size={seal} />
            ) : (
              <View style={[styles.lockedPad, { width: seal * 0.72, height: seal * 0.72 }]}>
                <Icon name="lock" size={36} color={theme.color.inkMuted} />
              </View>
            )}
          </View>

          {stamped && stampedAt != null ? (
            <Text style={styles.meta} accessibilityLabel={`押した日時 ${formatNotebookTime(stampedAt)}`}>
              {formatNotebookTime(stampedAt)}
            </Text>
          ) : (
            <Text style={styles.meta}>{howToGetBody(blocked, ready)}</Text>
          )}

          <View style={styles.actions}>
            {stamped ? (
              <Action
                label="建物の詳細"
                accessibilityLabel={`${building.name}の詳細を開く`}
                primary
                onPress={onOpenDetail}
              />
            ) : ready ? (
              <Action
                label="スタンプを押す"
                accessibilityLabel={`${building.name}にスタンプを押す`}
                primary
                onPress={onStamp}
              />
            ) : blocked != null && blockNeedsRecover(blocked) ? (
              <Action
                label={blocked.kind === 'denied' ? '位置を許可' : '位置を再試行'}
                accessibilityLabel={
                  blocked.kind === 'denied' ? '位置情報の許可を開く' : '位置情報を再試行する'
                }
                primary
                onPress={onRecover}
              />
            ) : (
              <Action
                label="地図で開く"
                accessibilityLabel={`${building.name}を地図で開く`}
                primary
                onPress={onOpenMap}
              />
            )}
            {!stamped && !(blocked != null && blockNeedsRecover(blocked)) ? (
              <Action
                label="建物の詳細"
                accessibilityLabel={`${building.name}の詳細を開く`}
                onPress={onOpenDetail}
              />
            ) : null}
            {stamped ? (
              <Action
                label="地図で開く"
                accessibilityLabel={`${building.name}を地図で開く`}
                onPress={onOpenMap}
              />
            ) : null}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function Action({
  label,
  accessibilityLabel,
  onPress,
  primary = false,
}: {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        primary ? styles.actionPrimary : styles.actionQuiet,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.actionLabel, primary ? styles.actionLabelPrimary : null]}>{label}</Text>
    </Pressable>
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
    alignItems: 'center',
    gap: theme.space.sm,
  },
  name: {
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
  lockedPad: {
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
  actions: {
    gap: theme.space.sm,
  },
  action: {
    minHeight: theme.hit,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.space.lg,
  },
  actionPrimary: {
    backgroundColor: theme.color.vermilion,
  },
  actionQuiet: {
    backgroundColor: theme.color.white,
  },
  actionLabel: {
    color: theme.color.ink,
    fontSize: theme.font.body,
    fontWeight: '700',
  },
  actionLabelPrimary: {
    color: theme.color.white,
  },
  pressed: {
    opacity: theme.opacity.pressed,
  },
});
