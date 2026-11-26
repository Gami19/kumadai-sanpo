import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EstimatedChip } from '@/components/EstimatedChip';
import { ExpandableText } from '@/components/ExpandableText';
import { FactChip } from '@/components/FactChip';
import { Icon } from '@/components/Icon';
import { MapThumb } from '@/components/MapThumb';
import { NameSeal } from '@/components/NameSeal';
import { SourceButton } from '@/components/SourceButton';
import { mapTargetForBuilding } from '@/features/buildings/mapTarget';
import { spots } from '@/features/map/spots';
import type { Building } from '@/lib/content/buildings';
import { useBuildings } from '@/lib/content/useBuildings';
import type { Person } from '@/lib/content/people';
import { usePeople } from '@/lib/content/usePeople';
import { haptics } from '@/lib/haptics';
import { theme } from '@/theme/tokens';

type Props = {
  id: string;
};

const PERIOD_CHIP_MAX = 36;
const CHIP_LINE = 18;

function known(value: string): boolean {
  return value.length > 0 && value !== '未確認';
}

function periodChip(period: string): string | null {
  if (!known(period)) {
    return null;
  }
  const end = period.indexOf('。');
  const sentence = (end >= 0 ? period.slice(0, end) : period).trim();
  if (sentence.length === 0 || sentence.length > PERIOD_CHIP_MAX) {
    return null;
  }
  return sentence;
}

function periodRest(period: string, chip: string | null): string | null {
  if (!known(period)) {
    return null;
  }
  if (chip == null) {
    return period;
  }
  const rest = period.slice(chip.length).replace(/^。/, '').trim();
  return rest.length > 0 ? rest : null;
}

function personMore(person: Person): string[] {
  const more: string[] = [];
  if (person.role.length > CHIP_LINE) {
    more.push(person.role);
  }
  more.push(...person.facts);
  const rest = periodRest(person.period, periodChip(person.period));
  if (rest != null) {
    more.push(rest);
  }
  if (person.predecessorSchool.length > CHIP_LINE) {
    more.push(person.predecessorSchool);
  }
  return more;
}

export function PersonDetail({ id }: Props) {
  const insets = useSafeAreaInsets();
  const people = usePeople();
  const person = people.find((item) => item.id === id) ?? null;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.space.xl }]}
    >
      {person == null ? <UnknownPerson /> : <PersonBody person={person} />}
    </ScrollView>
  );
}

function UnknownPerson() {
  return (
    <View style={styles.missingBlock}>
      <Text style={styles.body}>この人物は見当たりません。</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="人物"
        onPress={() => {
          haptics.select();
          router.push('/people');
        }}
        style={({ pressed }) => [styles.link, pressed && styles.pressed]}
      >
        <Text style={styles.linkLabel}>人物</Text>
      </Pressable>
    </View>
  );
}

function PersonBody({ person }: { person: Person }) {
  const chip = periodChip(person.period);
  const school = person.predecessorSchool;
  const schoolLong = school.length > CHIP_LINE;

  return (
    <View style={styles.page}>
      <View style={styles.identity}>
        <NameSeal name={person.name} size={96} />
        <Text
          selectable
          style={styles.name}
          accessibilityLabel={known(person.reading) ? person.name : `${person.name}。読みは未確認`}
        >
          {person.name}
          {known(person.reading) ? null : (
            <Text style={styles.mark} accessibilityLabel="読みは未確認">
              {' ?'}
            </Text>
          )}
        </Text>
        {known(person.reading) ? (
          <Text selectable style={styles.reading}>
            {person.reading}
          </Text>
        ) : null}
        {person.nameAlt.length > 0 ? (
          <Text selectable style={styles.reading}>
            {person.nameAlt}
          </Text>
        ) : null}
        <Text style={styles.role} numberOfLines={1} accessibilityLabel={person.role}>
          {person.role}
        </Text>
      </View>
      <LifeLine birth={person.birthYear} death={person.deathYear} />
      <View style={styles.chips}>
        {known(school) ? (
          <FactChip
            icon="mappin"
            label={school}
            accessibilityLabel={school}
            wide={schoolLong}
            lines={schoolLong ? 1 : undefined}
          />
        ) : (
          <FactChip icon="mappin" label="?" mark accessibilityLabel="ゆかりの学校は未確認" />
        )}
        {chip != null ? (
          <FactChip icon="calendar" label={chip} accessibilityLabel={chip} wide={chip.length > CHIP_LINE} />
        ) : !known(person.period) ? (
          <FactChip icon="calendar" label="?" mark accessibilityLabel="在籍期間は未確認" />
        ) : null}
      </View>
      <ExpandableText key={person.summary} text={person.summary} more={personMore(person)} />
      <RelatedBuildings ids={person.relatedBuildingIds} />
      <SourceButton sources={person.sources} />
    </View>
  );
}

function LifeLine({ birth, death }: { birth: string; death: string }) {
  const birthKnown = known(birth);
  const deathKnown = known(death);
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`生年${birthKnown ? birth : '未確認'}、没年${deathKnown ? death : '未確認'}`}
      style={styles.life}
    >
      <View style={styles.lifeEnds} importantForAccessibility="no-hide-descendants">
        <Text style={[styles.year, birthKnown ? null : styles.yearUnknown]}>
          {birthKnown ? birth : '?'}
        </Text>
        <Text style={[styles.year, deathKnown ? null : styles.yearUnknown]}>
          {deathKnown ? death : '?'}
        </Text>
      </View>
      <View style={styles.lifeBar} importantForAccessibility="no-hide-descendants">
        <View style={[styles.dot, birthKnown ? styles.dotOn : styles.dotOff]} />
        <View style={styles.rule} />
        <View style={[styles.dot, deathKnown ? styles.dotOn : styles.dotOff]} />
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

  if (linked.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      style={styles.bleed}
      contentContainerStyle={styles.buildingRow}
    >
      {linked.map((building) => (
        <BuildingCard key={building.id} building={building} />
      ))}
    </ScrollView>
  );
}

function BuildingCard({ building }: { building: Building }) {
  const spot = spots.find((item) => item.id === building.id);
  const target = mapTargetForBuilding(building, spot);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        building.positionEstimated ? `${building.name}。位置は推定` : `${building.name}の詳細`
      }
      onPress={() => {
        haptics.select();
        router.push({ pathname: '/building/[id]', params: { id: building.id } });
      }}
      style={({ pressed }) => [styles.buildingCard, pressed && styles.pressed]}
    >
      <View style={styles.art}>
        <MapThumb id={building.id} style={styles.thumb} />
        {building.positionEstimated ? (
          <View style={styles.estimated}>
            <EstimatedChip interactive={false} />
          </View>
        ) : null}
        {target != null ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${building.name}を地図で見る`}
            onPress={() => {
              haptics.select();
              router.push({
                pathname: '/map',
                params: { campus: target.campus, spot: target.spotId },
              });
            }}
            style={({ pressed }) => [styles.mapHit, pressed && styles.mapPressed]}
          >
            <Icon name="map" size={20} color={theme.color.ink} />
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.buildingName} numberOfLines={2}>
        {building.name}
      </Text>
    </Pressable>
  );
}

const buildingLine = theme.font.body + theme.space.xs;

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.space.lg,
    paddingTop: theme.space.md,
  },
  page: {
    gap: theme.space.lg,
  },
  identity: {
    alignItems: 'center',
    gap: theme.space.xs,
  },
  name: {
    alignSelf: 'stretch',
    color: theme.color.ink,
    fontFamily: theme.font.heading,
    fontSize: theme.font.title,
    lineHeight: theme.font.title + theme.space.sm,
    textAlign: 'center',
  },
  reading: {
    color: theme.color.inkMuted,
    fontSize: theme.font.caption,
    lineHeight: theme.font.caption + theme.space.xs,
    textAlign: 'center',
  },
  mark: {
    color: theme.color.brick,
    fontFamily: theme.font.heading,
    fontSize: theme.font.body,
  },
  role: {
    alignSelf: 'stretch',
    color: theme.color.ink,
    fontSize: theme.font.body,
    lineHeight: theme.font.body + theme.space.sm,
    textAlign: 'center',
  },
  life: {
    gap: theme.space.xs,
  },
  lifeEnds: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lifeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.xs,
  },
  year: {
    color: theme.color.ink,
    fontSize: theme.font.body,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  yearUnknown: {
    color: theme.color.brick,
  },
  rule: {
    flex: 1,
    height: 2,
    backgroundColor: theme.color.path,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: theme.radius.pill,
  },
  dotOn: {
    backgroundColor: theme.color.brick,
  },
  dotOff: {
    borderWidth: theme.border.mark,
    borderColor: theme.color.brick,
    backgroundColor: theme.color.paper,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.space.sm,
  },
  bleed: {
    marginHorizontal: -theme.space.lg,
  },
  buildingRow: {
    paddingHorizontal: theme.space.lg,
    gap: theme.space.sm,
  },
  buildingCard: {
    width: 156,
    gap: theme.space.xs,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
  },
  art: {
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  thumb: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  estimated: {
    position: 'absolute',
    left: theme.space.xs,
    bottom: theme.space.xs,
  },
  mapHit: {
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
  mapPressed: {
    opacity: 0.7,
  },
  buildingName: {
    minHeight: buildingLine * 2,
    color: theme.color.ink,
    fontFamily: theme.font.heading,
    fontSize: theme.font.body,
    lineHeight: buildingLine,
  },
  pressed: {
    backgroundColor: theme.color.press,
  },
  missingBlock: {
    gap: theme.space.sm,
  },
  body: {
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
});
