import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '@/theme/tokens';

type Props = {
  title: string;
  lead: string;
  children?: ReactNode;
};

export function PlaceholderScreen({ title, lead, children }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + theme.space.lg,
          paddingBottom: insets.bottom + theme.space.xl,
        },
      ]}
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.lead}>{lead}</Text>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.space.lg,
    gap: theme.space.md,
  },
  title: {
    color: theme.color.ink,
    fontSize: theme.font.title,
    fontWeight: '700',
  },
  lead: {
    color: theme.color.inkMuted,
    fontSize: theme.font.body,
    lineHeight: theme.font.body + theme.space.sm,
  },
});
