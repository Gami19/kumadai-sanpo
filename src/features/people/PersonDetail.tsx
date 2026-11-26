import { router } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenLink } from '@/components/ScreenLink';
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

function goBack() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/people');
  }
}

export function PersonDetail({ id }: Props) {
  const insets = useSafeAreaInsets();
  const people = usePeople();
  const person = people.find((item) => item.id === id) ?? null;

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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="前の画面に戻る"
        onPress={goBack}
        style={styles.back}
      >
        <Text style={styles.backLabel}>戻る</Text>
      </Pressable>
      {person == null ? <UnknownPerson /> : <PersonBody person={person} />}
    </ScrollView>
  );
}

function UnknownPerson() {
  return (
    <View style={styles.block}>
      <Text style={styles.title}>人物が見つかりません</Text>
      <Text style={styles.body}>この番号の人物は、いまの内容にありません。</Text>
      <ScreenLink href="/people" label="人物一覧へ" />
    </View>
  );
}

function PersonBody({ person }: { person: Person }) {
  return (
    <View style={styles.block}>
      <Text style={styles.title}>{person.name}</Text>
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
      <PersonFavoriteButton personId={person.id} personName={person.name} verbose />
      <View style={styles.block}>
        <Text style={styles.section}>出典</Text>
        {person.sources.map((source) => (
          <Pressable
            key={source.url}
            accessibilityRole="link"
            accessibilityLabel={`${source.title}を開く`}
            onPress={() => {
              void Linking.openURL(source.url);
            }}
            style={styles.source}
          >
            <Text style={styles.sourceLabel}>{source.title}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function RelatedBuildings({ ids }: { ids: readonly string[] }) {
  const buildings = useBuildings();
  const linked = ids.flatMap((id) => {
    const building = buildings.find((item) => item.id === id);
    return building == null ? [] : [building];
  });

  return (
    <View style={styles.block}>
      <Text style={styles.section}>関係する建物</Text>
      {ids.length === 0 ? (
        <Text style={styles.body}>掲載中の建物とは結びつけていません。</Text>
      ) : null}
      {ids.length > 0 && linked.length === 0 ? (
        <Text style={styles.body}>結びつけてあった建物が、いまの内容に見当たりません。</Text>
      ) : null}
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
      {building.positionEstimated ? (
        <Text style={styles.estimate}>
          地図の位置は推定です。確定した場所としては扱いません。
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.space.lg,
    gap: theme.space.md,
  },
  back: {
    alignSelf: 'flex-start',
    paddingVertical: theme.space.sm,
  },
  backLabel: {
    color: theme.color.moss,
    fontSize: theme.font.body,
    fontWeight: '700',
  },
  block: {
    gap: theme.space.sm,
  },
  title: {
    color: theme.color.ink,
    fontSize: theme.font.title,
    fontWeight: '700',
  },
  reading: {
    color: theme.color.inkMuted,
    fontSize: theme.font.caption,
  },
  section: {
    color: theme.color.moss,
    fontSize: theme.font.caption,
    fontWeight: '700',
  },
  body: {
    color: theme.color.ink,
    fontSize: theme.font.body,
    lineHeight: theme.font.body + theme.space.sm,
  },
  estimate: {
    color: theme.color.clay,
    fontSize: theme.font.caption,
    lineHeight: theme.font.caption + theme.space.xs,
  },
  source: {
    backgroundColor: theme.color.card,
    borderColor: theme.color.line,
    borderRadius: theme.radius.md,
    borderWidth: theme.border.hairline,
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.md,
  },
  sourceLabel: {
    color: theme.color.moss,
    fontSize: theme.font.caption,
    fontWeight: '600',
  },
});
