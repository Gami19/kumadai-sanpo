import { useIsFocused, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CampusSwitcher } from '@/features/map/CampusSwitcher';
import { CategoryFilter } from '@/features/map/CategoryFilter';
import { DevLocationToggle } from '@/features/map/DevLocationToggle';
import { MapLocationBanner, locationBannerModel } from '@/features/map/MapLocationBanner';
import { campuses, isCampusId, type CampusId } from '@/features/map/campuses';
import type { DevMapFix } from '@/features/map/devMapFix';
import { illustrationSize, lonLatToIllustrationPx } from '@/features/map/georef';
import { resolveLocationCue, type MapFix } from '@/features/map/locationCue';
import { SpotCallout } from '@/features/map/SpotCallout';
import { designationLabel, mapSpots } from '@/features/map/spots';
import { useMapLocation } from '@/features/map/useMapLocation';
import { ZoomableCampusMap } from '@/features/map/ZoomableCampusMap';
import { theme } from '@/theme/tokens';

function routeParam(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const params = useLocalSearchParams<{ campus?: string | string[]; spot?: string | string[] }>();
  const campusParam = routeParam(params.campus);
  const spotParam = routeParam(params.spot);
  const [campusId, setCampusId] = useState<CampusId>(
    campusParam != null && isCampusId(campusParam) ? campusParam : campuses[0].id,
  );
  const [designationId, setDesignationId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(spotParam);
  const [devFix, setDevFix] = useState<DevMapFix | null>(null);
  const [focusRequest, setFocusRequest] = useState<{
    campusId: CampusId;
    token: number;
    x: number;
    y: number;
  } | null>(null);
  const location = useMapLocation(focused && devFix === null);
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
  const placed = useMemo(() => mapSpots(campus.id, designationId), [campus.id, designationId]);
  const selected = placed.find((spot) => spot.id === selectedId) ?? null;
  const pins = placed.map((spot) => ({
    id: spot.id,
    name: spot.name,
    x: spot.x,
    y: spot.y,
    estimated: spot.positionStatus === '推定',
  }));
  const fix: MapFix | null = devFix
    ? { lat: devFix.lat, lon: devFix.lon, accuracyMeters: devFix.accuracyMeters }
    : location.state.status === 'ready'
      ? {
          lat: location.state.lat,
          lon: location.state.lon,
          accuracyMeters: location.state.accuracyMeters,
        }
      : null;
  const cue = fix == null ? null : resolveLocationCue(campus.id, fix);
  const banner = locationBannerModel(devFix !== null, location.state, cue);
  const focus =
    focusRequest != null && focusRequest.campusId === campus.id
      ? { x: focusRequest.x, y: focusRequest.y, token: focusRequest.token }
      : null;
  const userLocation =
    cue?.kind === 'here' ? { x: cue.pixel.x, y: cue.pixel.y, radiusPx: cue.radiusPx } : null;

  const selectCampus = (id: CampusId) => {
    setCampusId(id);
    setSelectedId(null);
  };

  const selectDesignation = (id: string | null) => {
    setDesignationId(id);
    setSelectedId(null);
  };

  const jumpToUser = () => {
    if (fix == null || cue == null || cue.kind === 'outside') {
      return;
    }
    const target = cue.campusId;
    const pixel = cue.kind === 'here' ? cue.pixel : lonLatToIllustrationPx(target, fix);
    if (target !== campus.id) {
      setCampusId(target);
      setSelectedId(null);
    }
    setFocusRequest((current) => ({
      campusId: target,
      token: (current?.token ?? 0) + 1,
      x: pixel.x,
      y: pixel.y,
    }));
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
      <DevLocationToggle selectedId={devFix?.id ?? null} onChange={setDevFix} />
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
          userLocation={userLocation}
          focus={focus}
        />
        <View pointerEvents="box-none" style={styles.bannerWrap}>
          <MapLocationBanner
            model={banner}
            onOpenSettings={() => {
              void Linking.openSettings();
            }}
            onRetry={location.retry}
            onJump={jumpToUser}
          />
        </View>
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
  bannerWrap: {
    position: 'absolute',
    top: theme.space.sm,
    left: theme.space.md,
    right: theme.space.md,
    alignItems: 'center',
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
