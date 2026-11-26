import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CampusSwitcher } from '@/features/map/CampusSwitcher';
import { CategoryFilter } from '@/features/map/CategoryFilter';
import { campuses, isCampusId, type CampusId } from '@/features/map/campuses';
import { illustrationSize } from '@/features/map/georef';
import { SpotCallout } from '@/features/map/SpotCallout';
import { designationLabel, mapSpots } from '@/features/map/spots';
import { ZoomableCampusMap } from '@/features/map/ZoomableCampusMap';
import { theme } from '@/theme/tokens';

function routeParam(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ campus?: string | string[]; spot?: string | string[] }>();
  const campusParam = routeParam(params.campus);
  const spotParam = routeParam(params.spot);
  const [campusId, setCampusId] = useState<CampusId>(
    campusParam != null && isCampusId(campusParam) ? campusParam : campuses[0].id,
  );
  const [designationId, setDesignationId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(spotParam);
  const linkKey = `${campusParam ?? ''}:${spotParam ?? ''}`;
  const [appliedLink, setAppliedLink] = useState(linkKey);
  if (appliedLink !== linkKey) {
    setAppliedLink(linkKey);
    if (campusParam != null && isCampusId(campusParam)) {
      setCampusId(campusParam);
    }
    if (spotParam != null) {
      setDesignationId(null);
      setSelectedId(spotParam);
    }
  }
  const campus = campuses.find((item) => item.id === campusId) ?? campuses[0];
  const image = illustrationSize(campus.id);
  const placed = useMemo(
    () => mapSpots(campus.id, designationId),
    [campus.id, designationId],
  );
  const selected = placed.find((spot) => spot.id === selectedId) ?? null;
  const pins = placed.map((spot) => ({
    id: spot.id,
    name: spot.name,
    x: spot.x,
    y: spot.y,
    estimated: spot.positionStatus === '推定',
  }));

  const selectCampus = (id: CampusId) => {
    setCampusId(id);
    setSelectedId(null);
  };

  const selectDesignation = (id: string | null) => {
    setDesignationId(id);
    setSelectedId(null);
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
          selectedPinId={selected?.id ?? null}
          onSelectPin={(id) => setSelectedId((current) => (current === id ? null : id))}
        />
        <View pointerEvents="none" style={styles.creditWrap}>
          <Text style={styles.credit}>地図データの出典：© OpenStreetMap contributors（ODbL）</Text>
        </View>
        {selected ? (
          <SpotCallout
            id={selected.id}
            name={selected.name}
            designationLabel={designationLabel(selected.designation)}
            estimated={selected.positionStatus === '推定'}
            onClose={() => setSelectedId(null)}
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
