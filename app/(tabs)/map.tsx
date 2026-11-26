import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CampusSwitcher } from '@/features/map/CampusSwitcher';
import { CategoryFilter } from '@/features/map/CategoryFilter';
import { campuses, type CampusId } from '@/features/map/campuses';
import { illustrationSize } from '@/features/map/georef';
import { SpotCallout } from '@/features/map/SpotCallout';
import { designationLabel, mapSpots } from '@/features/map/spots';
import { ZoomableCampusMap } from '@/features/map/ZoomableCampusMap';
import { theme } from '@/theme/tokens';

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [campusId, setCampusId] = useState<CampusId>(campuses[0].id);
  const [designationId, setDesignationId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const campus = campuses.find((item) => item.id === campusId) ?? campuses[0];
  const image = illustrationSize(campus.id);
  const placed = useMemo(
    () => mapSpots(campus.id, designationId),
    [campus.id, designationId],
  );
  const selected = placed.find((spot) => spot.name === selectedName) ?? null;
  const pins = placed.map((spot) => ({
    id: spot.name,
    name: spot.name,
    x: spot.x,
    y: spot.y,
    estimated: spot.positionStatus === '推定',
  }));

  const selectCampus = (id: CampusId) => {
    setCampusId(id);
    setSelectedName(null);
  };

  const selectDesignation = (id: string | null) => {
    setDesignationId(id);
    setSelectedName(null);
  };

  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: insets.top + theme.space.sm,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <CampusSwitcher selectedId={campus.id} onSelect={selectCampus} />
      <CategoryFilter selectedId={designationId} onSelect={selectDesignation} />
      {placed.length === 0 ? (
        <Text style={styles.empty}>この区分の地点は、この地図にはありません。</Text>
      ) : null}
      <View style={styles.stage}>
        <ZoomableCampusMap
          key={campus.id}
          source={campus.illustration}
          accessibilityLabel={`${campus.label}キャンパスの絵本マップ`}
          imageWidth={image.width}
          imageHeight={image.height}
          pins={pins}
          selectedPinId={selected?.name ?? null}
          onSelectPin={(id) => setSelectedName((current) => (current === id ? null : id))}
        />
        <View pointerEvents="none" style={styles.creditWrap}>
          <Text style={styles.credit}>地図データの出典：© OpenStreetMap contributors（ODbL）</Text>
        </View>
        {selected ? (
          <SpotCallout
            name={selected.name}
            designationLabel={designationLabel(selected.designation)}
            estimated={selected.positionStatus === '推定'}
            onClose={() => setSelectedName(null)}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.color.paper,
  },
  empty: {
    color: theme.color.inkMuted,
    fontSize: theme.font.caption,
    paddingHorizontal: theme.space.md,
    paddingBottom: theme.space.sm,
  },
  stage: {
    flex: 1,
  },
  creditWrap: {
    position: 'absolute',
    left: theme.space.md,
    right: theme.space.md,
    bottom: theme.space.sm,
    alignItems: 'center',
  },
  credit: {
    overflow: 'hidden',
    backgroundColor: theme.color.card,
    color: theme.color.inkMuted,
    fontSize: theme.font.caption,
    lineHeight: theme.font.caption + theme.space.xs,
    paddingHorizontal: theme.space.sm,
    paddingVertical: theme.space.xs,
    borderRadius: theme.radius.md,
  },
});
