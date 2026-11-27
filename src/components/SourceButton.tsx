import { Pressable, StyleSheet, Text } from 'react-native';

import { haptics } from '@/lib/haptics';
import type { SourceLink } from '@/lib/sheet/session';
import { openSources } from '@/lib/sheet/session';
import { theme } from '@/theme/tokens';

import { Icon } from './Icon';

type Props = {
  sources: readonly SourceLink[];
};

/** 出典はタップの先。件数だけを画面に出す。 */
export function SourceButton({ sources }: Props) {
  if (sources.length === 0) {
    return null;
  }
  const label = `出典 ${sources.length}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}件を開く`}
      onPress={() => {
        haptics.select();
        openSources(sources);
      }}
      style={({ pressed }) => [styles.hit, pressed && styles.pressed]}
    >
      <Icon name="link" size={18} color={theme.color.leafDark} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    minHeight: theme.hit,
    paddingHorizontal: theme.space.sm,
    borderRadius: theme.radius.sm,
    borderCurve: 'continuous',
  },
  pressed: {
    backgroundColor: theme.color.press,
  },
  label: {
    color: theme.color.leafDark,
    fontSize: theme.font.body,
    fontWeight: '600',
  },
});
