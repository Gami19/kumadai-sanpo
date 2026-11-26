import { type Href, Link } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { theme } from '@/theme/tokens';

type Props = {
  href: Href;
  label: string;
  /** card は独立したボタン。text はカードの中に置く文のリンク。 */
  tone?: 'card' | 'text';
};

export function ScreenLink({ href, label, tone = 'card' }: Props) {
  const text = tone === 'text';
  return (
    <Link href={href} asChild>
      <Pressable accessibilityRole="link" style={text ? styles.textLink : styles.link}>
        <Text style={text ? styles.textLabel : styles.label}>{label}</Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  link: {
    backgroundColor: theme.color.card,
    borderColor: theme.color.line,
    borderRadius: theme.radius.md,
    borderWidth: theme.border.hairline,
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.md,
  },
  label: {
    color: theme.color.moss,
    fontSize: theme.font.body,
    fontWeight: '600',
  },
  textLink: {
    alignSelf: 'flex-start',
    paddingVertical: theme.space.xs,
  },
  textLabel: {
    color: theme.color.moss,
    fontSize: theme.font.body,
    fontWeight: '700',
  },
});
