import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme/tokens';

import { campuses } from './campuses';
import type { LocationCue } from './locationCue';
import type { MapLocationState } from './useMapLocation';

export type LocationBannerModel =
  | { kind: 'hidden' }
  | { kind: 'pending' }
  | { kind: 'denied'; canAskAgain: boolean }
  | { kind: 'services-off' }
  | { kind: 'failed' }
  | { kind: 'outside' }
  | { kind: 'jump'; title: string | null; action: string };

export function locationBannerModel(
  devFixActive: boolean,
  live: MapLocationState,
  cue: LocationCue | null,
): LocationBannerModel {
  if (!devFixActive) {
    if (live.status === 'pending') {
      return { kind: 'pending' };
    }
    if (live.status === 'denied') {
      return { kind: 'denied', canAskAgain: live.canAskAgain };
    }
    if (live.status === 'unavailable') {
      return { kind: live.reason === 'services-off' ? 'services-off' : 'failed' };
    }
  }
  if (cue?.kind === 'outside') {
    return { kind: 'outside' };
  }
  if (cue?.kind === 'here') {
    return { kind: 'jump', title: null, action: '現在地を中心に' };
  }
  if (cue?.kind === 'elsewhere') {
    const label = campuses.find((campus) => campus.id === cue.campusId)?.label ?? cue.campusId;
    return {
      kind: 'jump',
      title: `${label}キャンパスにいます`,
      action: `${label}の現在地へ`,
    };
  }
  return { kind: 'hidden' };
}

type Props = {
  model: LocationBannerModel;
  onOpenSettings: () => void;
  onRetry: () => void;
  onJump: () => void;
};

export function MapLocationBanner({ model, onOpenSettings, onRetry, onJump }: Props) {
  if (model.kind === 'hidden') {
    return null;
  }

  if (model.kind === 'pending') {
    return (
      <View style={styles.card}>
        <Text style={styles.message}>現在地を探しています</Text>
      </View>
    );
  }

  if (model.kind === 'outside') {
    return (
      <View style={styles.card}>
        <Text style={styles.message}>キャンパスの外にいます</Text>
      </View>
    );
  }

  if (model.kind === 'jump') {
    return (
      <View style={styles.card}>
        {model.title != null ? <Text style={styles.message}>{model.title}</Text> : null}
        <Action label={model.action} onPress={onJump} filled />
      </View>
    );
  }

  if (model.kind === 'denied') {
    return (
      <View style={styles.card}>
        <Text style={styles.message}>
          現在地を表示するには、位置情報の使用を許可してください。表示だけに使い、保存や送信はしません。
        </Text>
        <View style={styles.actions}>
          {model.canAskAgain ? <Action label="許可を求める" onPress={onRetry} filled /> : null}
          <Action label="設定を開く" onPress={onOpenSettings} filled={!model.canAskAgain} />
        </View>
      </View>
    );
  }

  if (model.kind === 'services-off') {
    return (
      <View style={styles.card}>
        <Text style={styles.message}>
          位置情報サービスがオフです。設定でオンにすると、現在地を表示できます。
        </Text>
        <Action label="設定を開く" onPress={onOpenSettings} filled />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.message}>現在地を取得できませんでした。</Text>
      <Action label="もう一度試す" onPress={onRetry} filled />
    </View>
  );
}

function Action({
  label,
  onPress,
  filled,
}: {
  label: string;
  onPress: () => void;
  filled: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={theme.space.sm}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        filled ? styles.actionFilled : styles.actionQuiet,
        pressed ? styles.actionPressed : null,
      ]}
    >
      <Text style={[styles.actionLabel, filled ? styles.actionLabelFilled : styles.actionLabelQuiet]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    maxWidth: '100%',
    alignItems: 'center',
    gap: theme.space.sm,
    backgroundColor: theme.color.card,
    borderColor: theme.color.line,
    borderRadius: theme.radius.md,
    borderWidth: theme.border.hairline,
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.sm,
  },
  message: {
    color: theme.color.ink,
    fontSize: theme.font.caption,
    lineHeight: theme.font.caption + theme.space.xs,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.space.sm,
  },
  action: {
    minHeight: theme.space.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.sm,
  },
  actionFilled: {
    backgroundColor: theme.color.moss,
  },
  actionQuiet: {
    backgroundColor: theme.color.card,
  },
  actionPressed: {
    opacity: 0.7,
  },
  actionLabel: {
    fontSize: theme.font.caption,
    fontWeight: '700',
  },
  actionLabelFilled: {
    color: theme.color.card,
  },
  actionLabelQuiet: {
    color: theme.color.moss,
  },
});
