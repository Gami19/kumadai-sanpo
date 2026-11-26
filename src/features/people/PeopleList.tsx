import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePeople } from '@/lib/content/usePeople';
import { theme } from '@/theme/tokens';

export function PeopleList() {
  const insets = useSafeAreaInsets();
  const people = usePeople();

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
      <Text style={styles.title}>人物</Text>
      <Text style={styles.lead}>
        熊本大学と、その前身の学校にゆかりのある人物です。{people.length}
        人を掲載しています。写真は載せていません。読みや年が出典で確認できないときは、詳細に「未確認」と書いてあります。
      </Text>
      <View style={styles.list}>
        {people.map((person) => (
          <Link
            key={person.id}
            href={{ pathname: '/people/[id]', params: { id: person.id } }}
            asChild
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${person.name}の詳細を開く`}
              style={styles.card}
            >
              <Text style={styles.name}>{person.name}</Text>
              {person.nameAlt.length > 0 ? (
                <Text style={styles.alt}>別名：{person.nameAlt}</Text>
              ) : null}
              <Text style={styles.role}>{person.role}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
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
  list: {
    gap: theme.space.sm,
  },
  card: {
    backgroundColor: theme.color.card,
    borderColor: theme.color.line,
    borderRadius: theme.radius.md,
    borderWidth: theme.border.hairline,
    padding: theme.space.md,
    gap: theme.space.xs,
  },
  name: {
    color: theme.color.ink,
    fontSize: theme.font.body,
    fontWeight: '700',
  },
  alt: {
    color: theme.color.inkMuted,
    fontSize: theme.font.caption,
  },
  role: {
    color: theme.color.ink,
    fontSize: theme.font.caption,
    lineHeight: theme.font.caption + theme.space.xs,
  },
});
