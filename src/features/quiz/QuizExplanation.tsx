import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { NameSeal } from '@/components/NameSeal';
import { haptics } from '@/lib/haptics';
import { useBuildings } from '@/lib/content/useBuildings';
import { usePeople } from '@/lib/content/usePeople';
import { theme } from '@/theme/tokens';

type Props = {
  buildingId: string;
  explanation: string;
  /** 不正解・復習では最初から開く。 */
  initiallyOpen?: boolean;
};

/**
 * 解説本文と、関連する建物・人物への短い入口。
 * 文字は最小限。形（本のアイコン・印・建物アイコン）で行き先を示す。
 */
export function QuizExplanation({
  buildingId,
  explanation,
  initiallyOpen = false,
}: Props) {
  const [open, setOpen] = useState(initiallyOpen);
  const buildings = useBuildings();
  const people = usePeople();
  const building = buildings.find((item) => item.id === buildingId) ?? null;
  const related = (building?.relatedPersonIds ?? []).flatMap((id) => {
    const person = people.find((item) => item.id === id);
    return person == null ? [] : [person];
  });

  function toggle() {
    haptics.select();
    setOpen((current) => !current);
  }

  return (
    <View style={styles.wrap}>
      {!open ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`解説。${explanation}`}
          onPress={toggle}
          style={({ pressed }) => [styles.preview, pressed && styles.pressed]}
        >
          <Icon name="book" size={theme.space.lg} color={theme.color.leafDark} />
          <Text numberOfLines={2} style={styles.previewText}>
            {explanation}
          </Text>
          <Icon name="chevron.right" size={theme.space.lg} color={theme.color.inkMuted} />
        </Pressable>
      ) : null}
      {open ? (
        <View style={styles.body}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="解説を閉じる"
            onPress={toggle}
            hitSlop={theme.space.xs}
            style={({ pressed }) => [styles.closeRow, pressed && styles.pressed]}
          >
            <Icon name="book" size={theme.space.lg} color={theme.color.leafDark} />
            <View style={styles.closeSpacer} />
            <Icon name="xmark" size={theme.space.lg} color={theme.color.inkMuted} />
          </Pressable>
          <Text selectable style={styles.text}>
            {explanation}
          </Text>
          {building != null || related.length > 0 ? (
            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.links}
            >
              {building != null ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${building.name}の詳細`}
                  onPress={() => {
                    haptics.select();
                    router.push({ pathname: '/building/[id]', params: { id: building.id } });
                  }}
                  style={({ pressed }) => [styles.link, pressed && styles.pressed]}
                >
                  <Icon name="building.2" size={20} color={theme.color.brick} />
                  <Text numberOfLines={1} style={styles.linkLabel}>
                    {building.name}
                  </Text>
                </Pressable>
              ) : null}
              {related.map((person) => (
                <Pressable
                  key={person.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${person.name}の詳細`}
                  onPress={() => {
                    haptics.select();
                    router.push({ pathname: '/people/[id]', params: { id: person.id } });
                  }}
                  style={({ pressed }) => [styles.person, pressed && styles.pressed]}
                >
                  <NameSeal name={person.name} size={36} />
                  <Text numberOfLines={1} style={styles.personName}>
                    {person.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: theme.space.sm,
  },
  preview: {
    minHeight: theme.hit,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.sm,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    backgroundColor: theme.color.leafWash,
  },
  previewText: {
    flex: 1,
    color: theme.color.ink,
    fontSize: theme.font.caption,
    lineHeight: theme.font.caption + theme.space.xs,
  },
  body: {
    gap: theme.space.sm,
    padding: theme.space.md,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    backgroundColor: theme.color.leafWash,
  },
  closeRow: {
    minHeight: theme.hit - theme.space.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeSpacer: {
    flex: 1,
  },
  text: {
    color: theme.color.ink,
    fontSize: theme.font.body,
    lineHeight: theme.font.body + theme.space.sm,
  },
  links: {
    gap: theme.space.sm,
    paddingTop: theme.space.xs,
  },
  link: {
    maxWidth: 160,
    minHeight: theme.hit,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.xs,
    paddingHorizontal: theme.space.sm,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    backgroundColor: theme.color.white,
  },
  linkLabel: {
    flexShrink: 1,
    color: theme.color.ink,
    fontSize: theme.font.caption,
    fontWeight: '600',
  },
  person: {
    width: 72,
    alignItems: 'center',
    gap: theme.space.xs,
    paddingVertical: theme.space.xs,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    backgroundColor: theme.color.white,
  },
  personName: {
    alignSelf: 'stretch',
    color: theme.color.ink,
    fontFamily: theme.font.heading,
    fontSize: theme.font.caption,
    textAlign: 'center',
  },
  pressed: {
    opacity: theme.opacity.pressed,
  },
});
