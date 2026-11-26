import { Link } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenLink } from '@/components/ScreenLink';
import { designationLabel } from '@/features/map/spots';
import { useBuildings } from '@/lib/content/useBuildings';
import type { Building, BuildingCampus } from '@/lib/content/buildings';
import { buildingsInCampusOrder } from '@/lib/quiz/order';
import { useQuizResults } from '@/lib/quiz/results';
import { formatQuizPlayedAt, type QuizResult } from '@/lib/quiz/score';
import { theme } from '@/theme/tokens';

const ESTIMATED_POSITION_NOTE =
  '位置は推定です。現地で確認できるまで、確定した場所としては扱いません。';

function scoreLabel(result: QuizResult | undefined, ready: boolean): string {
  if (!ready) {
    return '成績を読み込んでいます';
  }
  if (result == null) {
    return 'まだ挑戦していません';
  }
  const when = formatQuizPlayedAt(result.playedAt);
  const score = `最高 ${result.bestCorrect}/${result.total}`;
  const head = result.cleared ? `クリア済み · ${score}` : score;
  return when.length > 0 ? `${head} · 最終 ${when}` : head;
}

function groupByCampus(buildings: readonly Building[]): { campus: BuildingCampus; items: Building[] }[] {
  const groups: { campus: BuildingCampus; items: Building[] }[] = [];
  for (const building of buildingsInCampusOrder(buildings)) {
    const last = groups[groups.length - 1];
    if (last == null || last.campus !== building.campus) {
      groups.push({ campus: building.campus, items: [building] });
    } else {
      last.items.push(building);
    }
  }
  return groups;
}

export function BuildingQuizList() {
  const insets = useSafeAreaInsets();
  const buildings = useBuildings();
  const { ready, results } = useQuizResults();
  const groups = useMemo(() => groupByCampus(buildings), [buildings]);

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
      <Text style={styles.title}>建物のクイズ</Text>
      <Text style={styles.lead}>
        気になる建物を選んで、四択を三問解きます。三問中二問以上でクリアです。現地にいなくても解けて、成績はこの端末だけに残ります。
      </Text>
      {groups.map((group) => (
        <View key={group.campus} style={styles.section}>
          <Text style={styles.sectionTitle}>{group.campus}</Text>
          {group.items.map((building) => (
            <BuildingRow
              key={building.id}
              building={building}
              result={results[building.id]}
              ready={ready}
            />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

function BuildingRow({
  building,
  result,
  ready,
}: {
  building: Building;
  result: QuizResult | undefined;
  ready: boolean;
}) {
  const startLabel = result == null ? 'クイズを始める' : 'もう一度挑戦する';
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{building.name}</Text>
      <Text style={styles.reading}>{building.reading}</Text>
      <Text style={styles.meta}>{designationLabel(building.designation)}</Text>
      {building.positionEstimated ? (
        <Text style={styles.estimate}>{ESTIMATED_POSITION_NOTE}</Text>
      ) : null}
      <Text style={styles.score}>{scoreLabel(result, ready)}</Text>
      <Link href={{ pathname: '/quiz/[id]', params: { id: building.id } }} asChild>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${building.name}の${startLabel}`}
          style={({ pressed }) => [styles.start, pressed && styles.pressed]}
        >
          <Text style={styles.startLabel}>{startLabel}</Text>
        </Pressable>
      </Link>
      <ScreenLink
        href={{ pathname: '/building/[id]', params: { id: building.id } }}
        label="説明を見る"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.space.lg,
    gap: theme.space.lg,
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
  section: {
    gap: theme.space.md,
  },
  sectionTitle: {
    color: theme.color.moss,
    fontSize: theme.font.body,
    fontWeight: '700',
  },
  card: {
    backgroundColor: theme.color.card,
    borderColor: theme.color.line,
    borderRadius: theme.radius.md,
    borderWidth: theme.border.hairline,
    gap: theme.space.sm,
    padding: theme.space.md,
  },
  name: {
    color: theme.color.ink,
    fontSize: theme.font.body,
    fontWeight: '700',
  },
  reading: {
    color: theme.color.inkMuted,
    fontSize: theme.font.caption,
  },
  meta: {
    color: theme.color.ink,
    fontSize: theme.font.caption,
  },
  estimate: {
    color: theme.color.clay,
    fontSize: theme.font.caption,
    lineHeight: theme.font.caption + theme.space.xs,
  },
  score: {
    color: theme.color.inkMuted,
    fontSize: theme.font.caption,
  },
  start: {
    backgroundColor: theme.color.moss,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.md,
  },
  pressed: {
    opacity: 0.75,
  },
  startLabel: {
    color: theme.color.card,
    fontSize: theme.font.body,
    fontWeight: '700',
    textAlign: 'center',
  },
});
