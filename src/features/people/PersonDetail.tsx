import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EstimatedChip } from '@/components/EstimatedChip';
import { ScreenLink } from '@/components/ScreenLink';
import { SourceButton } from '@/components/SourceButton';
import { PersonFavoriteButton } from '@/features/notebook/RecordControls';
import type { Building } from '@/lib/content/buildings';
import type { Person } from '@/lib/content/people';
import { useBuildings } from '@/lib/content/useBuildings';
import { usePeople } from '@/lib/content/usePeople';
import { theme } from '@/theme/tokens';

type Props = {
  id: string;
};

function yearsText(person: Person): string {
  const birth = person.birthYear === '未確認' ? '生年は未確認です。' : `${person.birthYear}年生まれ。`;
  const death = person.deathYear === '未確認' ? '没年は未確認です。' : `${person.deathYear}年に没しています。`;
  return `${birth}${death}`;
}

function readingText(reading: string): string {
  return reading === '未確認' ? '読みは未確認です。' : reading;
}

export function PersonDetail({ id }: Props) {
  const insets = useSafeAreaInsets();
  const people = usePeople();
  const person = people.find((item) => item.id === id) ?? null;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + theme.space.xl },
      ]}
    >
      {person == null ? <UnknownPerson /> : <PersonBody person={person} />}
    </ScrollView>
  );
}

function UnknownPerson() {
  return (
    <View style={styles.block}>
      <Text style={styles.body}>この人物は見当たりません。</Text>
      <ScreenLink href="/people" label="人物" />
    </View>
  );
}

function PersonBody({ person }: { person: Person }) {
  return (
    <View style={styles.block}>
      <Text style={styles.reading}>{readingText(person.reading)}</Text>
      {person.nameAlt.length > 0 ? <Text style={styles.body}>別名：{person.nameAlt}</Text> : null}
      <Text style={styles.body}>{person.summary}</Text>
      <View style={styles.block}>
        <Text style={styles.section}>生没年</Text>
        <Text style={styles.body}>{yearsText(person)}</Text>
      </View>
      <View style={styles.block}>
        <Text style={styles.section}>学校との関わり</Text>
        <Text style={styles.body}>{person.role}</Text>
        <Text style={styles.body}>{person.period}</Text>
        <Text style={styles.body}>前身：{person.predecessorSchool}</Text>
      </View>
      <RelatedBuildings ids={person.relatedBuildingIds} />
      <View style={styles.block}>
        <Text style={styles.section}>エピソード</Text>
        {person.facts.map((fact) => (
          <Text key={fact} style={styles.body}>
            {fact}
          </Text>
        ))}
      </View>
      <PersonFavoriteButton personId={person.id} personName={person.name} />
      <SourceButton sources={person.sources} />
    </View>
  );
}

function RelatedBuildings({ ids }: { ids: readonly string[] }) {
  const buildings = useBuildings();
  const linked = ids.flatMap((id) => {
    const building = buildings.find((item) => item.id === id);
    return building == null ? [] : [building];
  });

  if (linked.length === 0) {
    return null;
  }

  return (
    <View style={styles.block}>
      <Text style={styles.section}>関係する建物</Text>
      {linked.map((building) => (
        <BuildingLink key={building.id} building={building} />
      ))}
    </View>
  );
}

function BuildingLink({ building }: { building: Building }) {
  return (
    <View style={styles.block}>
      <ScreenLink
        href={{ pathname: '/building/[id]', params: { id: building.id } }}
        label={building.name}
      />
      {building.positionEstimated ? <EstimatedChip /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.space.lg,
    paddingTop: theme.space.lg,
    gap: theme.space.md,
  },
  block: {
    gap: theme.space.sm,
  },
  reading: {
    color: theme.color.inkMuted,
    fontSize: theme.font.caption,
  },
  section: {
    color: theme.color.leafDark,
    fontSize: theme.font.caption,
    fontWeight: '700',
  },
  body: {
    color: theme.color.ink,
    fontSize: theme.font.body,
    lineHeight: theme.font.body + theme.space.sm,
  },
});
