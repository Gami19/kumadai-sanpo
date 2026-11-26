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
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + theme.space.xl },
      ]}
    >
      <View>
        {people.map((person, index) => (
          <Link
            key={person.id}
            href={{ pathname: '/people/[id]', params: { id: person.id } }}
            asChild
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${person.name}の詳細を開く`}
              style={({ pressed }) => [
                styles.row,
                index < people.length - 1 ? styles.separator : null,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.name}>{person.name}</Text>
              {person.nameAlt.length > 0 ? <Text style={styles.alt}>別名：{person.nameAlt}</Text> : null}
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
    paddingTop: theme.space.sm,
  },
  row: {
    gap: theme.space.xs,
    paddingVertical: theme.space.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  separator: {
    borderBottomWidth: theme.border.hairline,
    borderBottomColor: theme.color.separator,
  },
  pressed: {
    backgroundColor: theme.color.press,
  },
  name: {
    color: theme.color.ink,
    fontFamily: theme.font.heading,
    fontSize: theme.font.body,
  },
  alt: {
    color: theme.color.inkMuted,
    fontSize: theme.font.caption,
  },
  role: {
    color: theme.color.inkMuted,
    fontSize: theme.font.caption,
    lineHeight: theme.font.caption + theme.space.xs,
  },
});
