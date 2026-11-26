import { Link } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EstimatedChip } from '@/components/EstimatedChip';
import { ScreenLink } from '@/components/ScreenLink';
import { designationLabel } from '@/features/map/spots';
import { useBuildings } from '@/lib/content/useBuildings';
import type { Building, BuildingCampus } from '@/lib/content/buildings';
import { buildingsInCampusOrder } from '@/lib/quiz/order';
import { useQuizResults } from '@/lib/quiz/results';
import { formatQuizPlayedAt, type QuizResult } from '@/lib/quiz/score';
import { theme } from '@/theme/tokens';

function scoreLabel(result: QuizResult | undefined): string {
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
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + theme.space.xl },
      ]}
    >
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
  const score = ready ? scoreLabel(result) : null;
  return (
    <View style={styles.row}>
      <Text style={styles.name}>{building.name}</Text>
      <Text style={styles.reading}>{building.reading}</Text>
      <Text style={styles.meta}>{designationLabel(building.designation)}</Text>
      {building.positionEstimated ? <EstimatedChip /> : null}
      {score != null ? <Text style={styles.score}>{score}</Text> : null}
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
    paddingTop: theme.space.sm,
    gap: theme.space.lg,
  },
  section: {
    gap: theme.space.sm,
  },
  sectionTitle: {
    color: theme.color.leafDark,
    fontSize: theme.font.body,
    fontWeight: '700',
  },
  row: {
    gap: theme.space.sm,
    paddingVertical: theme.space.sm,
    borderBottomWidth: theme.border.hairline,
    borderBottomColor: theme.color.separator,
  },
  name: {
    color: theme.color.ink,
    fontFamily: theme.font.heading,
    fontSize: theme.font.body,
  },
  reading: {
    color: theme.color.inkMuted,
    fontSize: theme.font.caption,
  },
  meta: {
    color: theme.color.ink,
    fontSize: theme.font.caption,
  },
  score: {
    color: theme.color.inkMuted,
    fontSize: theme.font.caption,
  },
  start: {
    backgroundColor: theme.color.leafDark,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.md,
  },
  pressed: {
    opacity: 0.75,
  },
  startLabel: {
    color: theme.color.white,
    fontSize: theme.font.body,
    fontWeight: '700',
    textAlign: 'center',
  },
});
