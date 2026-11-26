import { type Href, Link } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { theme } from '@/theme/tokens';

import { Icon } from './Icon';

type Props = {
  href: Href;
  label: string;
  /** text は本文の中のリンク。既定は行全体。 */
  tone?: 'row' | 'text';
};

export function ScreenLink({ href, label, tone = 'row' }: Props) {
  const text = tone === 'text';
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="link"
        style={({ pressed }) => [
          text ? styles.textLink : styles.row,
          pressed && !text ? styles.pressed : null,
        ]}
      >
        <Text style={text ? styles.textLabel : styles.label}>{label}</Text>
        {text ? null : <Icon name="chevron.right" size={16} color={theme.color.inkMuted} />}
      </Pressable>
    </Link>
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
  },
  pressed: {
    backgroundColor: theme.color.press,
  },
  label: {
    flex: 1,
    color: theme.color.leafDark,
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
