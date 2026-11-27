import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EstimatedChip } from '@/components/EstimatedChip';
import { Icon } from '@/components/Icon';
import { MapThumb } from '@/components/MapThumb';
import { ScoreMarks } from '@/components/ScoreMarks';
import { haptics } from '@/lib/haptics';
import { useBuildings } from '@/lib/content/useBuildings';
import type { Building, BuildingCampus, BuildingDesignation } from '@/lib/content/buildings';
import { missIdsFor, useQuizMisses } from '@/lib/quiz/misses';
import { buildingsInCampusOrder } from '@/lib/quiz/order';
import { useQuizResults } from '@/lib/quiz/results';
import type { QuizResult } from '@/lib/quiz/score';
import { theme } from '@/theme/tokens';

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

function designationColor(designation: BuildingDesignation): string {
  if (designation === '重要文化財') {
    return theme.color.brick;
  }
  if (designation === '登録有形文化財') {
    return theme.color.leafDark;
  }
  return theme.color.path;
}

export function BuildingQuizList() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const buildings = useBuildings();
  const { ready, results } = useQuizResults();
  const { ready: missesReady, misses } = useQuizMisses();
  const groups = useMemo(() => groupByCampus(buildings), [buildings]);
  const tile = (width - theme.space.lg * 2 - theme.space.sm) / 2;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.space.xl }]}
    >
      {groups.map((group) => (
        <View key={group.campus} style={styles.section}>
          <Text style={styles.sectionTitle}>{group.campus}</Text>
          <View style={styles.grid}>
            {group.items.map((building) => (
              <QuizTile
                key={building.id}
                building={building}
                result={ready ? results[building.id] : undefined}
                showScore={ready}
                missIds={missesReady ? missIdsFor(misses, building.id) : []}
                width={tile}
              />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function QuizTile({
  building,
  result,
  showScore,
  missIds,
  width,
}: {
  building: Building;
  result: QuizResult | undefined;
  showScore: boolean;
  missIds: readonly string[];
  width: number;
}) {
  const missCount = missIds.length;
  const score =
    showScore && result != null
      ? `最高 ${result.bestCorrect} / ${result.total}${result.cleared ? '、クリア' : ''}`
      : '未挑戦';
  const reviewLabel = missCount > 0 ? `復習 ${missCount}問。` : '';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${building.name}のクイズ。${building.designation}。${building.positionEstimated ? '位置は推定。' : ''}${score}。${reviewLabel}`}
      onPress={() => {
        haptics.select();
        router.push({ pathname: '/quiz/[id]', params: { id: building.id } });
      }}
      style={({ pressed }) => [styles.tile, { width }, pressed && styles.pressed]}
    >
      <View style={styles.art}>
        <MapThumb id={building.id} style={styles.thumb} label="" />
        {building.positionEstimated ? (
          <View style={styles.chip}>
            <EstimatedChip interactive={false} />
          </View>
        ) : null}
        {missCount > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${building.name}の復習 ${missCount}問`}
            hitSlop={theme.space.xs}
            onPress={() => {
              haptics.select();
              router.push({
                pathname: '/quiz/[id]',
                params: { id: building.id, mode: 'review', q: missIds.join(',') },
              });
            }}
            style={({ pressed }) => [styles.reviewBadge, pressed && styles.infoPressed]}
          >
            <Icon name="book" size={14} color={theme.color.white} />
            <Text style={styles.reviewCount}>{missCount}</Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${building.name}の説明`}
          hitSlop={theme.space.xs}
          onPress={() => {
            haptics.select();
            router.push({ pathname: '/building/[id]', params: { id: building.id } });
          }}
          style={({ pressed }) => [styles.info, pressed && styles.infoPressed]}
        >
          <Icon name="info.circle" size={20} color={theme.color.ink} />
        </Pressable>
      </View>
      <View style={styles.caption}>
        <View style={[styles.dot, { backgroundColor: designationColor(building.designation) }]} />
        <Text style={styles.name} numberOfLines={2}>
          {building.name}
        </Text>
      </View>
      {showScore ? (
        <ScoreMarks
          correct={result?.bestCorrect ?? 0}
          total={result?.total ?? 3}
          size="sm"
        />
      ) : (
        <View style={styles.starSlot} />
      )}
    </Pressable>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.sm,
  },
  tile: {
    gap: theme.space.xs,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    paddingBottom: theme.space.xs,
  },
  pressed: {
    backgroundColor: theme.color.press,
  },
  art: {
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  thumb: {
    aspectRatio: 1,
  },
  chip: {
    position: 'absolute',
    left: theme.space.xs,
    bottom: theme.space.xs,
  },
  reviewBadge: {
    position: 'absolute',
    left: theme.space.xs,
    top: theme.space.xs,
    minWidth: theme.hit - theme.space.sm,
    height: theme.hit - theme.space.sm,
    paddingHorizontal: theme.space.sm,
    borderRadius: theme.radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.xs,
    backgroundColor: theme.color.brick,
  },
  reviewCount: {
    color: theme.color.white,
    fontSize: theme.font.caption,
    fontWeight: '700',
  },
  info: {
    position: 'absolute',
    top: theme.space.xs,
    right: theme.space.xs,
    width: theme.hit,
    height: theme.hit,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.paper,
  },
  infoPressed: {
    opacity: theme.opacity.pressed,
  },
  caption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.space.xs,
    minHeight: theme.hit,
    paddingHorizontal: theme.space.xs,
  },
  dot: {
    width: theme.space.sm,
    height: theme.space.sm,
    borderRadius: theme.radius.pill,
    marginTop: theme.space.xs,
  },
  name: {
    flex: 1,
    color: theme.color.ink,
    fontFamily: theme.font.heading,
    fontSize: theme.font.body,
    lineHeight: theme.font.body + theme.space.xs,
  },
  starSlot: {
    height: theme.font.body + theme.space.xs,
  },
});
