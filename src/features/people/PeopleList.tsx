import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { NameSeal } from '@/components/NameSeal';
import { isKnownPersonField, lifeSpanLabel } from '@/lib/content/personDisplay';
import { usePeople } from '@/lib/content/usePeople';
import { haptics } from '@/lib/haptics';
import { theme } from '@/theme/tokens';

export function PeopleList() {
  const insets = useSafeAreaInsets();
  const people = usePeople();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.space.xl }]}
    >
      {people.map((person, index) => {
        const role = isKnownPersonField(person.role) ? person.role : null;
        const life = lifeSpanLabel(person.birthYear, person.deathYear);
        const a11y = [person.name, role, life].filter((part): part is string => part != null).join('。');
        return (
          <Pressable
            key={person.id}
            accessibilityRole="button"
            accessibilityLabel={a11y}
            onPress={() => {
              haptics.select();
              router.push({ pathname: '/people/[id]', params: { id: person.id } });
            }}
            style={({ pressed }) => [
              styles.row,
              index < people.length - 1 ? styles.separator : null,
              pressed && styles.pressed,
            ]}
          >
            <NameSeal name={person.name} />
            <View style={styles.copy}>
              <Text style={styles.name} numberOfLines={1}>
                {person.name}
              </Text>
              {role != null ? (
                <Text style={styles.role} numberOfLines={1}>
                  {role}
                </Text>
              ) : null}
              {life != null ? (
                <Text style={styles.life} numberOfLines={1}>
                  {life}
                </Text>
              ) : null}
            </View>
            <Icon name="chevron.right" size={18} color={theme.color.inkMuted} />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.space.lg,
    paddingTop: theme.space.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    minHeight: 64,
    paddingVertical: theme.space.sm,
  },
  separator: {
    borderBottomWidth: theme.border.hairline,
    borderBottomColor: theme.color.separator,
  },
  pressed: {
    backgroundColor: theme.color.press,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: theme.color.ink,
    fontFamily: theme.font.heading,
    fontSize: theme.font.body,
  },
  role: {
    color: theme.color.inkMuted,
    fontSize: theme.font.caption,
  },
  life: {
    color: theme.color.inkMuted,
    fontSize: theme.font.caption,
    fontVariant: ['tabular-nums'],
  },
});
