import { useIsFocused, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { useUndoToast } from '@/components/UndoToast';
import { OSM_CREDIT } from '@/copy/notices';
import { CampusSwitcher } from '@/features/map/CampusSwitcher';
import { CategoryFilter, legendColor } from '@/features/map/CategoryFilter';
import { DevLocationToggle } from '@/features/map/DevLocationToggle';
import { LocationButton, locationButtonModel } from '@/features/map/LocationButton';
import { SpotPreviewSheet } from '@/features/map/SpotPreviewSheet';
import { campuses, isCampusId, type CampusId } from '@/features/map/campuses';
import type { DevMapFix } from '@/features/map/devMapFix';
import { lonLatToIllustrationPx, illustrationSize } from '@/features/map/georef';
import { readLastCampus, writeLastCampus } from '@/features/map/lastCampus';
import { resolveLocationCue, type MapFix } from '@/features/map/locationCue';
import { designationCategories, mapSpots, spots } from '@/features/map/spots';
import { useMapLocation } from '@/features/map/useMapLocation';
import { ZoomableCampusMap } from '@/features/map/ZoomableCampusMap';
import { useBuildings } from '@/lib/content/useBuildings';
import { haptics } from '@/lib/haptics';
import { useNotebook } from '@/lib/notebook/useNotebook';
import { openInfo } from '@/lib/sheet/session';
import { theme } from '@/theme/tokens';

function routeParam(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}

function shownAll(): Record<string, boolean> {
  return Object.fromEntries(designationCategories.map((category) => [category.id, true]));
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const showToast = useUndoToast();
  const params = useLocalSearchParams<{ campus?: string | string[]; spot?: string | string[] }>();
  const campusParam = routeParam(params.campus);
  const spotParam = routeParam(params.spot);
  const [campusId, setCampusId] = useState<CampusId>(
    campusParam != null && isCampusId(campusParam) ? campusParam : campuses[0].id,
  );
  const [shown, setShown] = useState(shownAll);
  const [selectedId, setSelectedId] = useState<string | null>(spotParam);
  const [devFix, setDevFix] = useState<DevMapFix | null>(null);
  const [following, setFollowing] = useState(false);
  const [chromeHeight, setChromeHeight] = useState<number>(theme.hit);
  const [focusRequest, setFocusRequest] = useState<{
    campusId: CampusId;
    token: number;
    x: number;
    y: number;
  } | null>(null);
  const [persistReady, setPersistReady] = useState(false);
  const touched = useRef(false);
  const location = useMapLocation(focused && devFix === null);
  const buildings = useBuildings();
  const notebook = useNotebook();
  const linkKey = `${campusParam ?? ''}:${spotParam ?? ''}`;
  const [appliedLink, setAppliedLink] = useState(linkKey);
  if (appliedLink !== linkKey) {
    setAppliedLink(linkKey);
    if (campusParam != null && isCampusId(campusParam)) {
      setCampusId(campusParam);
    }
    if (spotParam != null) {
      setShown(shownAll());
      setSelectedId(spotParam);
      setFollowing(false);
    }
  }

  useEffect(() => {
    let live = true;
    void (async () => {
      if (campusParam == null && !touched.current) {
        const saved = await readLastCampus();
        if (live && !touched.current && saved != null) {
          setCampusId(saved);
        }
      }
      if (live) {
        setPersistReady(true);
      }
    })();
    return () => {
      live = false;
    };
  }, [campusParam]);

  useEffect(() => {
    if (!persistReady) {
      return;
    }
    void writeLastCampus(campusId);
  }, [persistReady, campusId]);

  const campus = campuses.find((item) => item.id === campusId) ?? campuses[0];
  const image = illustrationSize(campus.id);
  const placedAll = useMemo(() => mapSpots(campus.id, null), [campus.id]);
  const activeCount = designationCategories.filter((category) => shown[category.id] !== false).length;
  const allOff = activeCount === 0;
  const placed = allOff
    ? placedAll
    : placedAll.filter((spot) => shown[spot.designation] !== false);
  const selected = placed.find((spot) => spot.id === selectedId) ?? null;
  if (
    selectedId != null &&
    selected == null &&
    !allOff &&
    placedAll.some((spot) => spot.id === selectedId)
  ) {
    setSelectedId(null);
  }
  const building = selected == null ? null : buildings.find((item) => item.id === selected.id) ?? null;
  const stamp =
    selected == null || !notebook.ready || notebook.loadError
      ? 'unknown'
      : notebook.stamps.some((item) => item.buildingId === selected.id)
        ? 'on'
        : 'off';
  const pins = placed.map((spot) => ({
    id: spot.id,
    name: spot.name,
    x: spot.x,
    y: spot.y,
    color: legendColor(spot.designation),
    muted: allOff,
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
  const hereX = cue?.kind === 'here' ? cue.pixel.x : null;
  const hereY = cue?.kind === 'here' ? cue.pixel.y : null;
  const locationModel = locationButtonModel(devFix !== null, location.state, cue, following);
  const focus =
    focusRequest != null && focusRequest.campusId === campus.id
      ? { x: focusRequest.x, y: focusRequest.y, token: focusRequest.token }
      : null;
  const userLocation =
    cue?.kind === 'here' ? { x: cue.pixel.x, y: cue.pixel.y, radiusPx: cue.radiusPx } : null;
  const bottomInset = Math.max(insets.bottom, theme.space.sm);
  // Web のタブは画面上部に浮く。iOS では下なので足さない。
  const topInset = insets.top + (process.env.EXPO_OS === 'web' ? theme.space.xl + theme.space.lg : 0);
  const trackKey =
    following && hereX != null && hereY != null ? `${campus.id}:${hereX}:${hereY}` : '';
  const [appliedTrack, setAppliedTrack] = useState(trackKey);
  if (appliedTrack !== trackKey) {
    setAppliedTrack(trackKey);
    if (following && hereX != null && hereY != null) {
      const x = hereX;
      const y = hereY;
      setFocusRequest((current) => {
        if (
          current != null &&
          current.campusId === campus.id &&
          current.x === x &&
          current.y === y
        ) {
          return current;
        }
        if (current != null && current.campusId === campus.id) {
          return { ...current, x, y };
        }
        return {
          campusId: campus.id,
          token: (current?.token ?? 0) + 1,
          x,
          y,
        };
      });
    }
  }

  const selectCampus = (id: CampusId) => {
    if (id === campusId) {
      return;
    }
    haptics.select();
    touched.current = true;
    setCampusId(id);
    setSelectedId(null);
    setFollowing(false);
  };

  const swipeCampus = (direction: -1 | 1) => {
    const index = campuses.findIndex((item) => item.id === campusId);
    const next = campuses[index + direction];
    if (next == null) {
      return;
    }
    selectCampus(next.id);
  };

  const toggleDesignation = (id: string) => {
    haptics.select();
    const turningOff = shown[id] !== false;
    setShown((current) => ({ ...current, [id]: !turningOff }));
    if (!turningOff) {
      return;
    }
    const stillOn = designationCategories.some(
      (category) => category.id !== id && shown[category.id] !== false,
    );
    if (!stillOn) {
      return;
    }
    setSelectedId((current) => {
      if (current == null) {
        return null;
      }
      const spot = spots.find((item) => item.id === current);
      return spot?.designation === id ? null : current;
    });
  };

  const jumpToUser = () => {
    if (fix == null || cue == null || cue.kind === 'outside') {
      return;
    }
    const target = cue.campusId;
    const pixel = cue.kind === 'here' ? cue.pixel : lonLatToIllustrationPx(target, fix);
    if (target !== campus.id) {
      touched.current = true;
      setCampusId(target);
      setSelectedId(null);
    }
    setFollowing(true);
    setFocusRequest((current) => ({
      campusId: target,
      token: (current?.token ?? 0) + 1,
      x: pixel.x,
      y: pixel.y,
    }));
  };

  const onLocationPress = () => {
    if (locationModel.kind === 'pending') {
      return;
    }
    haptics.select();
    if (locationModel.kind === 'blocked') {
      if (locationModel.canAskAgain) {
        location.retry();
      } else {
        void Linking.openSettings();
      }
      return;
    }
    if (locationModel.kind === 'failed') {
      location.retry();
      return;
    }
    if (locationModel.kind === 'outside') {
      showToast('学外');
      return;
    }
    jumpToUser();
  };

  return (
    <View style={styles.screen}>
      <ZoomableCampusMap
        key={campus.id}
        source={campus.illustration}
        accessibilityLabel={`${campus.label}キャンパスの絵本マップ`}
        imageWidth={image.width}
        imageHeight={image.height}
        pins={pins}
        selectedPinId={selected?.id ?? null}
        onSelectPin={(id) => {
          haptics.select();
          setFollowing(false);
          setSelectedId((current) => (current === id ? null : id));
        }}
        userLocation={userLocation}
        focus={focus}
        onSwipeCampus={swipeCampus}
        onUserPan={() => {
          setFollowing(false);
        }}
      />
      <View
        pointerEvents="box-none"
        style={[styles.topBar, { top: topInset + theme.space.sm }]}
      >
        <CategoryFilter shown={shown} onToggle={toggleDesignation} />
        <CampusSwitcher selectedId={campus.id} onSelect={selectCampus} />
      </View>
      <View pointerEvents="box-none" style={[styles.devSlot, { top: topInset + theme.hit + theme.space.lg }]}>
        <DevLocationToggle selectedId={devFix?.id ?? null} onChange={setDevFix} />
      </View>
      {selected ? (
        <SpotPreviewSheet
          key={selected.id}
          id={selected.id}
          name={selected.name}
          summary={building?.summary ?? ''}
          estimated={selected.positionStatus === '推定'}
          stamp={stamp}
          bottom={bottomInset + chromeHeight}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
      <View
        pointerEvents="box-none"
        onLayout={(event) => {
          const next = event.nativeEvent.layout.height;
          setChromeHeight((current) => (current === next ? current : next));
        }}
        style={[styles.bottomBar, { bottom: bottomInset }]}
      >
        <View style={styles.creditWrap}>
          <Text numberOfLines={1} style={styles.credit}>
            {OSM_CREDIT}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="地図の出典を開く"
            hitSlop={theme.space.sm}
            onPress={() => {
              haptics.select();
              openInfo('osm');
            }}
            style={({ pressed }) => [styles.creditInfo, pressed && styles.creditPressed]}
          >
            <Icon name="info.circle" size={theme.space.md + theme.space.xs} color={theme.color.ink} />
          </Pressable>
        </View>
        <LocationButton model={locationModel} onPress={onLocationPress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.color.paper,
  },
  topBar: {
    position: 'absolute',
    left: theme.space.md,
    right: theme.space.md,
    zIndex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
  },
  devSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
  },
  bottomBar: {
    position: 'absolute',
    left: theme.space.md,
    right: theme.space.md,
    zIndex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.space.sm,
  },
  creditWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.xs,
  },
  credit: {
    flexShrink: 1,
    color: theme.color.ink,
    backgroundColor: theme.color.paper,
    fontSize: theme.font.caption,
    lineHeight: theme.font.caption + theme.space.xs,
    paddingHorizontal: theme.space.sm,
    paddingVertical: theme.space.xs,
    borderRadius: theme.radius.pill,
    overflow: 'hidden',
  },
  creditInfo: {
    width: theme.hit,
    height: theme.hit,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.paper,
    boxShadow: theme.shadow.float,
  },
  creditPressed: {
    opacity: theme.opacity.pressed,
  },
});
