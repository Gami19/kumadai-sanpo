import { router } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenLink } from '@/components/ScreenLink';
import { designationLabel, spots } from '@/features/map/spots';
import { useBuildings } from '@/lib/content/useBuildings';
import type { Building } from '@/lib/content/buildings';
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

function goBack() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/map');
  }
}

export function BuildingDetail({ id }: Props) {
  const insets = useSafeAreaInsets();
  const buildings = useBuildings();
  const building = buildings.find((item) => item.id === id) ?? null;
  const spot = spots.find((item) => item.id === id);
  const target = building ? mapTargetForBuilding(building, spot) : null;

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
      <Text style={styles.title}>建物が見つかりません</Text>
      <Text style={styles.body}>
        この番号の建物は、いまの内容にありません。マップのピンから、座標のある地点を選んでください。
      </Text>
      <ScreenLink href="/map" label="マップへ" />
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
      <Text style={styles.title}>{building.name}</Text>
      <Text style={styles.reading}>{building.reading}</Text>
      <View style={styles.badges}>
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>{designationLabel(building.designation)}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>{building.campus}</Text>
        </View>
      </View>
      {building.positionEstimated ? (
        <Text style={styles.estimate}>
          位置は推定です。現地で確認できるまで、確定した場所としては扱いません。
        </Text>
      ) : null}
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
      <View style={styles.block}>
        <Text style={styles.section}>出典</Text>
        {building.sources.map((source) => (
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
      {target ? (
        <ScreenLink
          href={{ pathname: '/map', params: { campus: target.campus, spot: target.spotId } }}
          label="マップで見る"
        />
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
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.xs,
  },
  badge: {
    backgroundColor: theme.color.card,
    borderColor: theme.color.line,
    borderRadius: theme.radius.md,
    borderWidth: theme.border.hairline,
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.sm,
  },
  badgeLabel: {
    color: theme.color.ink,
    fontSize: theme.font.caption,
    fontWeight: '700',
  },
  estimate: {
    color: theme.color.clay,
    fontSize: theme.font.caption,
    lineHeight: theme.font.caption + theme.space.xs,
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
