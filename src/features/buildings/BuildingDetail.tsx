import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EstimatedChip } from '@/components/EstimatedChip';
import { ScreenLink } from '@/components/ScreenLink';
import { SourceButton } from '@/components/SourceButton';
import { designationLabel, spots } from '@/features/map/spots';
import { BuildingRecordButtons } from '@/features/notebook/RecordControls';
import { RelatedPeople } from '@/features/people/RelatedPeople';
import type { Building } from '@/lib/content/buildings';
import { useBuildings } from '@/lib/content/useBuildings';
import { theme } from '@/theme/tokens';

import { mapTargetForBuilding } from './mapTarget';

type Props = {
  id: string;
};

function yearText(building: Building): string {
  if (building.yearBuilt === '未確認') {
    return building.yearNote.length > 0 ? building.yearNote : '竣工年は未確認です。';
  }
  const year = `竣工年は${building.yearBuilt}年です。`;
  return building.yearNote.length > 0 ? `${year}${building.yearNote}` : year;
}

function visitText(building: Building): string {
  return building.visit === '未確認' ? '見学情報は未確認です。' : building.visit;
}

export function BuildingDetail({ id }: Props) {
  const insets = useSafeAreaInsets();
  const buildings = useBuildings();
  const building = buildings.find((item) => item.id === id) ?? null;
  const spot = spots.find((item) => item.id === id);
  const target = building ? mapTargetForBuilding(building, spot) : null;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + theme.space.xl },
      ]}
    >
      {building == null ? (
        <UnknownBuilding />
      ) : (
        <BuildingBody building={building} target={target} />
      )}
    </ScrollView>
  );
}

function UnknownBuilding() {
  return (
    <View style={styles.block}>
      <Text style={styles.body}>この建物は見当たりません。</Text>
      <ScreenLink href="/map" label="地図" />
    </View>
  );
}

function BuildingBody({
  building,
  target,
}: {
  building: Building;
  target: ReturnType<typeof mapTargetForBuilding>;
}) {
  return (
    <View style={styles.block}>
      <Text style={styles.reading}>{building.reading}</Text>
      <View style={styles.badges}>
        <Text style={styles.badge}>{designationLabel(building.designation)}</Text>
        <Text style={styles.badge}>{building.campus}</Text>
      </View>
      {building.positionEstimated ? <EstimatedChip /> : null}
      {building.heritageName.length > 0 ? (
        <View style={styles.block}>
          <Text style={styles.section}>文化財の名称</Text>
          <Text style={styles.body}>{building.heritageName}</Text>
        </View>
      ) : null}
      <Text style={styles.body}>{yearText(building)}</Text>
      <Text style={styles.body}>{building.summary}</Text>
      <View style={styles.block}>
        <Text style={styles.section}>見学</Text>
        <Text style={styles.body}>{visitText(building)}</Text>
      </View>
      <RelatedPeople personIds={building.relatedPersonIds} />
      <BuildingRecordButtons buildingId={building.id} buildingName={building.name} />
      <SourceButton sources={building.sources} />
      {target ? (
        <ScreenLink
          href={{ pathname: '/map', params: { campus: target.campus, spot: target.spotId } }}
          label="地図で見る"
        />
      ) : null}
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
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.sm,
  },
  badge: {
    color: theme.color.ink,
    fontSize: theme.font.caption,
    fontWeight: '700',
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
