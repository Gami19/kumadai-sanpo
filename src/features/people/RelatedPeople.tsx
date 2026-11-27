import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { NameSeal } from '@/components/NameSeal';
import { isKnownPersonField, lifeSpanLabel } from '@/lib/content/personDisplay';
import { usePeople } from '@/lib/content/usePeople';
import { haptics } from '@/lib/haptics';
import { theme } from '@/theme/tokens';

type Props = {
  personIds: readonly string[];
};

const line = theme.font.body + theme.space.xs;

export function RelatedPeople({ personIds }: Props) {
  const people = usePeople();
  const linked = personIds.flatMap((id) => {
    const person = people.find((item) => item.id === id);
    return person == null ? [] : [person];
  });

  if (linked.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      style={styles.bleed}
      contentContainerStyle={styles.row}
    >
      {linked.map((person) => {
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
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <NameSeal name={person.name} size={56} />
            <Text style={styles.name} numberOfLines={2}>
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
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bleed: {
    marginHorizontal: -theme.space.lg,
  },
  row: {
    paddingHorizontal: theme.space.lg,
    gap: theme.space.sm,
  },
  card: {
    width: 132,
    alignItems: 'center',
    gap: theme.space.xs,
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.sm,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    backgroundColor: theme.color.white,
  },
  pressed: {
    backgroundColor: theme.color.press,
  },
  name: {
    alignSelf: 'stretch',
    minHeight: line * 2,
    color: theme.color.ink,
    fontFamily: theme.font.heading,
    fontSize: theme.font.body,
    lineHeight: line,
    textAlign: 'center',
  },
  role: {
    alignSelf: 'stretch',
    color: theme.color.inkMuted,
    fontSize: theme.font.caption,
    lineHeight: theme.font.caption + theme.space.xs,
    textAlign: 'center',
  },
  life: {
    alignSelf: 'stretch',
    color: theme.color.inkMuted,
    fontSize: theme.font.caption,
    lineHeight: theme.font.caption + theme.space.xs,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
});
