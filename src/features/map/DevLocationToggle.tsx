import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { haptics } from '@/lib/haptics';
import { theme } from '@/theme/tokens';

import { campuses } from './campuses';
import type { DevLocationToggleProps, DevMapFix } from './devMapFix';
import { campusBoundsCenter } from './georef';

const MOCK_ACCURACY_METERS = 20;

/**
 * 開発ビルドだけで出す、キャンパス外から地図を試すための位置。
 * 本番バンドルでは metro がこのファイルを空実装に差し替える。
 * 座標はジオリファレンス範囲の確認用で、地点データではない。
 */
const presets: readonly DevMapFix[] = [
  ...campuses.map((campus) => {
    const center = campusBoundsCenter(campus.id);
    return {
      id: campus.id,
      label: campus.label,
      lat: center.lat,
      lon: center.lon,
      accuracyMeters: MOCK_ACCURACY_METERS,
    };
  }),
  {
    id: 'outside',
    label: '外',
    // 4区画の下敷き範囲より南西。実在の地点としては扱わない。
    lat: 32.78,
    lon: 130.7,
    accuracyMeters: MOCK_ACCURACY_METERS,
  },
];

export function DevLocationToggle({ selectedId, onChange }: DevLocationToggleProps) {
  if (!__DEV__) {
    return null;
  }

  return (
    <View>
      <Text style={styles.caption}>開発用の位置（公開ビルドには出ません）</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroller}
        contentContainerStyle={styles.row}
      >
        <Chip
          label="オフ"
          selected={selectedId === null}
          accessibilityLabel="開発用の位置をオフにして、端末の位置を使う"
          onPress={() => onChange(null)}
        />
        {presets.map((preset) => (
          <Chip
            key={preset.id}
            label={preset.label}
            selected={preset.id === selectedId}
            accessibilityLabel={`開発用の位置、${preset.label}`}
            onPress={() => onChange(preset)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function Chip({
  label,
  selected,
  accessibilityLabel,
  onPress,
}: {
  label: string;
  selected: boolean;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}
      onPress={() => {
        haptics.select();
        onPress();
      }}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.chipSelected : styles.chipIdle,
        pressed && styles.chipPressed,
      ]}
    >
      <Text style={[styles.label, selected ? styles.labelSelected : styles.labelIdle]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  caption: {
    color: theme.color.inkMuted,
    fontSize: theme.font.caption,
    paddingHorizontal: theme.space.md,
    paddingBottom: theme.space.xs,
  },
  scroller: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    gap: theme.space.xs,
    paddingHorizontal: theme.space.md,
    paddingBottom: theme.space.sm,
  },
  chip: {
    borderRadius: theme.radius.pill,
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.md,
    minHeight: theme.hit,
    justifyContent: 'center',
    boxShadow: theme.shadow.float,
  },
  chipSelected: {
    backgroundColor: theme.color.brick,
  },
  chipIdle: {
    backgroundColor: theme.color.paper,
  },
  chipPressed: {
    opacity: theme.opacity.pressed,
  },
  label: {
    fontSize: theme.font.caption,
    fontWeight: '600',
  },
  labelSelected: {
    color: theme.color.white,
  },
  labelIdle: {
    color: theme.color.ink,
  },
});
