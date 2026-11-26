import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EstimatedChip } from '@/components/EstimatedChip';
import { ExpandableText } from '@/components/ExpandableText';
import { FactChip } from '@/components/FactChip';
import { Icon } from '@/components/Icon';
import { MapThumb } from '@/components/MapThumb';
import { SourceButton } from '@/components/SourceButton';
import { designationLabel, spots } from '@/features/map/spots';
import { BuildingActionBar } from '@/features/notebook/DetailActions';
import { RelatedPeople } from '@/features/people/RelatedPeople';
import type { Building, BuildingDesignation } from '@/lib/content/buildings';
import { primaryQuestionsFor } from '@/lib/content/quizzes';
import { useBuildings } from '@/lib/content/useBuildings';
import { useQuizzes } from '@/lib/content/useQuizzes';
import { haptics } from '@/lib/haptics';
import { theme } from '@/theme/tokens';

import { mapTargetForBuilding } from './mapTarget';

type Props = {
  id: string;
};

function known(value: string): boolean {
  return value.length > 0 && value !== '未確認';
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

export function BuildingDetail({ id }: Props) {
  const insets = useSafeAreaInsets();
  const buildings = useBuildings();
  const building = buildings.find((item) => item.id === id) ?? null;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.space.xl }]}
    >
      {building == null ? <UnknownBuilding /> : <BuildingBody building={building} />}
    </ScrollView>
  );
}

function UnknownBuilding() {
  return (
    <View style={styles.identity}>
      <Text style={styles.missing}>この建物は見当たりません。</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="地図"
        onPress={() => {
          haptics.select();
          router.push('/map');
        }}
        style={({ pressed }) => [styles.link, pressed && styles.pressed]}
      >
        <Text style={styles.linkLabel}>地図</Text>
      </Pressable>
    </View>
  );
}

function BuildingBody({ building }: { building: Building }) {
  const questions = useQuizzes();
  const spot = spots.find((item) => item.id === building.id);
  const target = mapTargetForBuilding(building, spot);
  const showQuiz = primaryQuestionsFor(questions, building.id).length > 0;
  const yearKnown = known(building.yearBuilt);

  return (
    <View style={styles.page}>
      <View style={styles.hero}>
        <MapThumb id={building.id} style={styles.heroImage} />
        {building.positionEstimated ? (
          <View style={styles.heroChip}>
            <EstimatedChip />
          </View>
        ) : null}
      </View>
      <View style={styles.identity}>
        <Text selectable style={styles.name}>
          {building.name}
        </Text>
        <Text selectable style={styles.reading}>
          {building.reading}
        </Text>
        {building.heritageName.length > 0 ? (
          <Text selectable style={styles.heritage}>
            {building.heritageName}
          </Text>
        ) : null}
      </View>
      <View style={styles.chips}>
        <FactChip
          icon="calendar"
          label={yearKnown ? building.yearBuilt : '?'}
          mark={!yearKnown}
          accessibilityLabel={yearKnown ? `竣工 ${building.yearBuilt}` : '竣工年は未確認'}
        />
        <FactChip
          dot={designationColor(building.designation)}
          label={designationLabel(building.designation)}
          accessibilityLabel={designationLabel(building.designation)}
        />
        <FactChip
          icon="mappin"
          label={building.campus}
          accessibilityLabel={`${building.campus}キャンパス`}
        />
        {known(building.visit) ? null : (
          <FactChip icon="clock" label="?" mark accessibilityLabel="見学は未確認" />
        )}
      </View>
      <ExpandableText
        key={building.summary}
        text={building.summary}
        more={building.yearNote.length > 0 ? [building.yearNote] : []}
      />
      {known(building.visit) ? (
        <View style={styles.visit}>
          <View style={styles.visitIcon}>
            <Icon name="clock" size={18} color={theme.color.ink} />
          </View>
          <View style={styles.visitBody}>
            <ExpandableText key={building.visit} text={building.visit} label="見学" />
          </View>
        </View>
      ) : null}
      <BuildingActionBar
        buildingId={building.id}
        buildingName={building.name}
        onMap={
          target == null
            ? null
            : () => {
                router.push({
                  pathname: '/map',
                  params: { campus: target.campus, spot: target.spotId },
                });
              }
        }
        onQuiz={
          showQuiz
            ? () => {
                router.push({ pathname: '/quiz/[id]', params: { id: building.id } });
              }
            : null
        }
      />
      <RelatedPeople personIds={building.relatedPersonIds} />
      <SourceButton sources={building.sources} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.space.lg,
    paddingTop: theme.space.sm,
  },
  page: {
    gap: theme.space.lg,
  },
  hero: {
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  heroChip: {
    position: 'absolute',
    left: theme.space.sm,
    bottom: theme.space.sm,
  },
  identity: {
    gap: theme.space.xs,
  },
  name: {
    color: theme.color.ink,
    fontFamily: theme.font.heading,
    fontSize: theme.font.title,
    lineHeight: theme.font.title + theme.space.sm,
  },
  reading: {
    color: theme.color.inkMuted,
    fontSize: theme.font.caption,
    lineHeight: theme.font.caption + theme.space.xs,
  },
  heritage: {
    color: theme.color.inkMuted,
    fontSize: theme.font.caption,
    lineHeight: theme.font.caption + theme.space.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.sm,
  },
  visit: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.space.sm,
  },
  visitIcon: {
    paddingTop: theme.space.xs,
  },
  visitBody: {
    flex: 1,
  },
  missing: {
    color: theme.color.ink,
    fontSize: theme.font.body,
    lineHeight: theme.font.body + theme.space.sm,
  },
  link: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    minHeight: theme.hit,
    paddingHorizontal: theme.space.sm,
    borderRadius: theme.radius.sm,
    borderCurve: 'continuous',
  },
  linkLabel: {
    color: theme.color.leafDark,
    fontSize: theme.font.body,
    fontWeight: '700',
  },
  pressed: {
    backgroundColor: theme.color.press,
  },
});
