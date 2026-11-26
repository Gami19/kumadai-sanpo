import { type Href, router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { haptics } from '@/lib/haptics';
import { theme } from '@/theme/tokens';

import { Icon } from './Icon';

type Props = {
  href: Href;
  label: string;
  /** text は本文の中のリンク。既定は行全体。 */
  tone?: 'row' | 'text';
};

/**
 * Link の asChild は Pressable の見た目を落とすことがある。
 * 行の並びと背景は、この Pressable に直接置く。
 */
export function ScreenLink({ href, label, tone = 'row' }: Props) {
  const text = tone === 'text';
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={() => {
        haptics.select();
        router.push(href);
      }}
      style={({ pressed }) => [text ? styles.textLink : styles.row, pressed && styles.pressed]}
    >
      <Text style={text ? styles.textLabel : styles.label}>{label}</Text>
      {text ? null : <Icon name="chevron.right" size={18} color={theme.color.inkMuted} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.space.sm,
    minHeight: 44,
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.sm,
    borderRadius: theme.radius.sm,
    borderCurve: 'continuous',
  },
  pressed: {
    backgroundColor: theme.color.press,
  },
  label: {
    flex: 1,
    color: theme.color.ink,
    fontSize: theme.font.body,
    fontWeight: '600',
  },
  textLink: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    minHeight: 44,
    paddingVertical: theme.space.xs,
  },
  textLabel: {
    color: theme.color.leafDark,
    fontSize: theme.font.body,
    fontWeight: '700',
  },
});
