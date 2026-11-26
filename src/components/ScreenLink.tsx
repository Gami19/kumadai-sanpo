import { type Href, Link } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { theme } from '@/theme/tokens';

type Props = {
  href: Href;
  label: string;
};

export function ScreenLink({ href, label }: Props) {
  return (
    <Link href={href} asChild>
      <Pressable style={styles.link}>
        <Text style={styles.label}>{label}</Text>
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
});
