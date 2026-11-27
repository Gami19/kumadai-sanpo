import { router, useIsFocused } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EstimatedChip } from '@/components/EstimatedChip';
import { Icon } from '@/components/Icon';
import { MapThumb } from '@/components/MapThumb';
import { NameSeal } from '@/components/NameSeal';
import { MasteryStamp } from '@/components/stamp/MasteryStamp';
import { useUndoToast } from '@/components/UndoToast';
import { mapTargetForBuilding } from '@/features/buildings/mapTarget';
import { campusIdForLabel, campuses, type CampusId } from '@/features/map/campuses';
import { spots } from '@/features/map/spots';
import type { Building } from '@/lib/content/buildings';
import { useBuildings } from '@/lib/content/useBuildings';
import { usePeople } from '@/lib/content/usePeople';
import { haptics } from '@/lib/haptics';
import { readCompletionSeen, writeCompletionSeen } from '@/lib/notebook/completion';
import { readDistrictSeen, writeDistrictSeen } from '@/lib/notebook/districtSeen';
import { CAMPUS_IDS, isCampusComplete } from '@/lib/notebook/districts';
import type { FavoriteRecord, StampRecord } from '@/lib/notebook/parse';
import { NotebookStorageError } from '@/lib/notebook/storage';
import { useNotebook } from '@/lib/notebook/useNotebook';
import { stampGate, type StampGate } from '@/lib/stamp/gate';
import { buildingsInCampusOrder } from '@/lib/quiz/order';
import { theme } from '@/theme/tokens';

import { StampControl } from './StampControl';
import { recoverStampLocation, useStampFix } from './useStampFix';

/** 円周の文字が読める大きさ。写真の中央に押す。 */
const SEAL = 104;
const DISTRICT_SEAL = 120;
const FULL_SEAL = 144;
const RING = 104;
const RING_DOT = theme.space.sm;
const RING_RADIUS = 40;
/** 大きな印が見える時間。着地のあと、すぐに消す。 */
const CELEBRATION_HOLD_MS = 720;
const CELEBRATION_FADE_MS = 180;

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

function byRecent(a: FavoriteRecord, b: FavoriteRecord): number {
  return Date.parse(b.savedAt) - Date.parse(a.savedAt);
}

function storageMessage(error: unknown): string {
  const reason = error instanceof NotebookStorageError ? error.reason : 'save';
  return reason === 'load' ? '記録を読み込めませんでした' : '保存できませんでした';
}

function openBuilding(building: Building) {
  haptics.select();
  const spot = spots.find((item) => item.id === building.id);
  const target = mapTargetForBuilding(building, spot);
  if (target != null) {
    router.push({
      pathname: '/map',
      params: { campus: target.campus, spot: target.spotId },
    });
    return;
  }
  router.push({ pathname: '/building/[id]', params: { id: building.id } });
}

export function NotebookHome() {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  const fix = useStampFix(focused);
  const buildings = useBuildings();
  const people = usePeople();
  const notebook = useNotebook();
  const showToast = useUndoToast();
  const [popId, setPopId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [seen, setSeen] = useState<boolean | null>(null);
  const [districtSeen, setDistrictSeen] = useState<ReadonlySet<CampusId> | null>(null);
  const [celebrationDone, setCelebrationDone] = useState(false);
  const wroteSeen = useRef(false);
  const wroteDistrictKey = useRef('');
  const ordered = buildingsInCampusOrder(buildings);
  const tile = (width - theme.space.lg * 2 - theme.space.sm) / 2;
  const stampedIds = new Set(notebook.stamps.map((stamp) => stamp.buildingId));
  if (pendingId != null) {
    stampedIds.add(pendingId);
  }
  const stampedCount = ordered.filter((building) => stampedIds.has(building.id)).length;
  const complete = notebook.ready && !notebook.loadError && ordered.length > 0 && stampedCount === ordered.length;
  const favoritePeople = notebook.favoritePeople
    .filter((record) => people.some((person) => person.id === record.id))
    .slice()
    .sort(byRecent);

  useEffect(() => {
    let live = true;
    void readCompletionSeen().then((value) => {
      if (live) {
        setSeen(value);
      }
    });
    void readDistrictSeen().then((value) => {
      if (live) {
        setDistrictSeen(value);
      }
    });
    return () => {
      live = false;
    };
  }, []);

  const stampedKey = ordered.map((building) => (stampedIds.has(building.id) ? building.id : '')).join(',');
  const pendingDistrict =
    districtSeen == null
      ? null
      : (CAMPUS_IDS.find(
          (id) => !districtSeen.has(id) && isCampusComplete(ordered, id, stampedIds),
        ) ?? null);
  const showDistrict = pendingDistrict != null && !reduced;
  const celebrating = !showDistrict && complete && seen === false && !reduced && !celebrationDone;
  const doneCampuses = CAMPUS_IDS.filter((id) => isCampusComplete(ordered, id, stampedIds));

  useEffect(() => {
    if (!reduced || districtSeen == null) {
      return;
    }
    const ids = new Set(stampedKey.length === 0 ? [] : stampedKey.split(','));
    const missing = CAMPUS_IDS.filter(
      (id) => !districtSeen.has(id) && isCampusComplete(ordered, id, ids),
    );
    const key = missing.join(',');
    if (key.length === 0 || wroteDistrictKey.current === key) {
      return;
    }
    wroteDistrictKey.current = key;
    void writeDistrictSeen([...new Set<CampusId>([...districtSeen, ...missing])]);
  }, [districtSeen, ordered, reduced, stampedKey]);

  useEffect(() => {
    if (!complete || seen !== false || !reduced || wroteSeen.current) {
      return;
    }
    wroteSeen.current = true;
    void writeCompletionSeen();
  }, [complete, reduced, seen]);

  const finishCelebration = useCallback(() => {
    wroteSeen.current = true;
    setCelebrationDone(true);
    setSeen(true);
    void writeCompletionSeen();
  }, []);

  const finishDistrict = useCallback((id: CampusId) => {
    setDistrictSeen((current) => {
      const next = new Set<CampusId>(current ?? []);
      next.add(id);
      void writeDistrictSeen([...next]);
      return next;
    });
  }, []);

  const gateFor = (building: Building): StampGate => {
    const spot = spots.find((item) => item.id === building.id);
    const point = spot != null && spot.lat != null && spot.lon != null ? { lat: spot.lat, lon: spot.lon } : null;
    return stampGate(fix.state, point);
  };

  const fail = (error: unknown) => {
    showToast(storageMessage(error));
  };

  const stamp = (building: Building) => {
    if (pendingId === building.id) {
      return;
    }
    const existing = notebook.stamps.find((item) => item.buildingId === building.id);
    if (existing == null) {
      if (!gateFor(building).ok) {
        return;
      }
      haptics.stamp();
      setPopId(building.id);
      setPendingId(building.id);
      void notebook.stampBuilding(building.id).then(() => {
        setPendingId((current) => (current === building.id ? null : current));
        showToast('スタンプを付けました', () => {
          setPopId((current) => (current === building.id ? null : current));
          return notebook.removeStamp(building.id).catch(fail);
        });
      }, (error: unknown) => {
        setPendingId((current) => (current === building.id ? null : current));
        setPopId((current) => (current === building.id ? null : current));
        fail(error);
      });
      return;
    }
    const saved: StampRecord = existing;
    haptics.remove();
    setPopId((current) => (current === building.id ? null : current));
    void notebook.removeStamp(building.id).then(() => {
      showToast('スタンプを消しました', () => {
        setPopId(building.id);
        return notebook.restoreStamp(saved).catch(fail);
      });
    }, fail);
  };

  const favorite = (building: Building) => {
    const existing = notebook.favoriteBuildings.find((item) => item.id === building.id);
    if (existing == null) {
      haptics.select();
      void notebook.addFavoriteBuilding(building.id).then(() => {
        showToast('お気に入りに入れました', () =>
          notebook.removeFavoriteBuilding(building.id).catch(fail),
        );
      }, fail);
      return;
    }
    const saved: FavoriteRecord = existing;
    haptics.remove();
    void notebook.removeFavoriteBuilding(building.id).then(() => {
      showToast('お気に入りから外しました', () =>
        notebook.restoreFavoriteBuilding(saved).catch(fail),
      );
    }, fail);
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={complete ? styles.complete : undefined}
      contentContainerStyle={[
        styles.content,
        complete ? styles.complete : null,
        { paddingBottom: insets.bottom + theme.space.xl },
      ]}
    >
      {notebook.loadError ? <Text style={styles.warning}>記録を読み込めませんでした</Text> : null}
      {notebook.ready && !notebook.loadError ? (
        <View>
          <ProgressRing
            marks={ordered.map((building) => stampedIds.has(building.id))}
          />
          <View style={styles.grid}>
            {ordered.map((building) => {
              const on = stampedIds.has(building.id);
              const spot = spots.find((item) => item.id === building.id);
              const onMap = mapTargetForBuilding(building, spot) != null;
              const campusId = campusIdForLabel(building.campus);
              return (
                <StampFrame
                  key={building.id}
                  building={building}
                  campusId={campusId}
                  width={tile}
                  stamped={on}
                  favorite={notebook.favoriteBuildings.some((item) => item.id === building.id)}
                  pop={popId === building.id && on}
                  gate={gateFor(building)}
                  onMap={onMap}
                  onOpen={() => {
                    openBuilding(building);
                  }}
                  onStamp={() => {
                    stamp(building);
                  }}
                  onRecover={() => {
                    const gate = gateFor(building);
                    if (!gate.ok) {
                      haptics.select();
                      recoverStampLocation(gate.block, fix.retry);
                    }
                  }}
                  onFavorite={() => {
                    favorite(building);
                  }}
                />
              );
            })}
          </View>
          {doneCampuses.length > 0 || complete ? (
            <View style={styles.mastery}>
              {doneCampuses.map((id) => {
                const label = campuses.find((campus) => campus.id === id)?.label ?? '';
                return (
                  <View key={id} accessible accessibilityLabel={`${label}を制覇`}>
                    <MasteryStamp campusId={id} size={DISTRICT_SEAL} />
                  </View>
                );
              })}
              {complete ? (
                <View accessible accessibilityLabel={`${ordered.length}件すべてにスタンプが付きました`}>
                  <MasteryStamp size={FULL_SEAL} />
                </View>
              ) : null}
            </View>
          ) : null}
          {favoritePeople.length > 0 ? (
            <View style={styles.people}>
              <Text style={styles.section}>人物</Text>
              {favoritePeople.map((record, index) => {
                const person = people.find((item) => item.id === record.id);
                if (person == null) {
                  return null;
                }
                return (
                  <Pressable
                    key={person.id}
                    accessibilityRole="button"
                    accessibilityLabel={person.name}
                    onPress={() => {
                      haptics.select();
                      router.push({ pathname: '/people/[id]', params: { id: person.id } });
                    }}
                    style={({ pressed }) => [
                      styles.personRow,
                      index < favoritePeople.length - 1 ? styles.personLine : null,
                      pressed && styles.rowPressed,
                    ]}
                  >
                    <NameSeal name={person.name} />
                    <Text style={styles.personName} numberOfLines={1}>
                      {person.name}
                    </Text>
                    <Icon name="chevron.right" size={18} color={theme.color.inkMuted} />
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          {showDistrict && pendingDistrict != null ? (
            <LandingOverlay
              key={pendingDistrict}
              label={`${campuses.find((campus) => campus.id === pendingDistrict)?.label ?? ''}の建物がそろいました`}
              onDone={() => {
                finishDistrict(pendingDistrict);
              }}
            >
              <MasteryStamp campusId={pendingDistrict} size={FULL_SEAL} pop />
            </LandingOverlay>
          ) : null}
          {celebrating && complete ? (
            <LandingOverlay
              label={`${ordered.length}件すべてにスタンプが付きました`}
              onDone={finishCelebration}
            >
              <MasteryStamp size={theme.space.xl * 4} pop />
            </LandingOverlay>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

function ProgressRing({ marks }: { marks: readonly boolean[] }) {
  const total = marks.length;
  const count = marks.filter(Boolean).length;
  if (total <= 0) {
    return null;
  }
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`訪問 ${count} / ${total}`}
      style={styles.ring}
    >
      {marks.map((on, index) => {
        const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
        return (
          <View
            key={index}
            style={[
              styles.ringDot,
              on ? styles.ringDotOn : styles.ringDotOff,
              {
                left: RING / 2 + Math.cos(angle) * RING_RADIUS - RING_DOT / 2,
                top: RING / 2 + Math.sin(angle) * RING_RADIUS - RING_DOT / 2,
              },
            ]}
          />
        );
      })}
      <Text
        style={styles.ringCount}
        importantForAccessibility="no"
        accessibilityElementsHidden
        maxFontSizeMultiplier={1.5}
      >
        {count}/{total}
      </Text>
    </View>
  );
}

function LandingOverlay({
  label,
  onDone,
  children,
}: {
  label: string;
  onDone: () => void;
  children: ReactNode;
}) {
  const opacity = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  useEffect(() => {
    const hold = setTimeout(() => {
      opacity.set(
        withTiming(0, {
          duration: CELEBRATION_FADE_MS,
          easing: EASE_OUT,
          reduceMotion: ReduceMotion.System,
        }),
      );
    }, CELEBRATION_HOLD_MS);
    const done = setTimeout(onDone, CELEBRATION_HOLD_MS + CELEBRATION_FADE_MS);
    return () => {
      clearTimeout(hold);
      clearTimeout(done);
    };
  }, [onDone, opacity]);

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      accessibilityLabel={label}
      style={[styles.celebration, animated]}
    >
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {children}
      </View>
    </Animated.View>
  );
}

function StampFrame({
  building,
  campusId,
  width,
  stamped,
  favorite,
  pop,
  gate,
  onMap,
  onOpen,
  onStamp,
  onRecover,
  onFavorite,
}: {
  building: Building;
  campusId: CampusId | null;
  width: number;
  stamped: boolean;
  favorite: boolean;
  pop: boolean;
  gate: StampGate;
  onMap: boolean;
  onOpen: () => void;
  onStamp: () => void;
  onRecover: () => void;
  onFavorite: () => void;
}) {
  const place = onMap ? `${building.name}を地図で見る` : `${building.name}の詳細`;
  return (
    <View style={{ width }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={building.positionEstimated ? `${place}。位置は推定` : place}
        onPress={onOpen}
        pressRetentionOffset={theme.space.md}
        style={({ pressed }) => [pressed && styles.tilePressed]}
      >
        <View style={styles.frame}>
          <MapThumb
            id={building.id}
            sepia={!stamped}
            style={[styles.thumb, stamped && styles.thumbStamped]}
          />
          {stamped ? <View pointerEvents="none" style={styles.thumbWash} /> : null}
          {stamped ? null : (
            <View pointerEvents="none" style={styles.cue}>
              <Icon name="mappin" size={16} color={theme.color.ink} />
            </View>
          )}
          {building.positionEstimated ? (
            <View pointerEvents="none" style={styles.estimated}>
              <EstimatedChip interactive={false} />
            </View>
          ) : null}
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {building.name}
        </Text>
      </Pressable>
      {campusId != null ? (
        <View style={[styles.sealHit, { top: (width - SEAL) / 2, left: (width - SEAL) / 2 }]}>
          <StampControl
            building={building}
            campusId={campusId}
            stamped={stamped}
            pop={pop}
            size={SEAL}
            gate={gate}
            onStamp={onStamp}
            onRemove={onStamp}
            onRecover={onRecover}
          />
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          favorite ? `${building.name}のお気に入りを外す` : `${building.name}をお気に入りに入れる`
        }
        accessibilityState={{ selected: favorite }}
        onPress={onFavorite}
        pressRetentionOffset={theme.space.md}
        style={({ pressed }) => [styles.heart, pressed && styles.sealPressed]}
      >
        <Icon
          name={favorite ? 'heart.fill' : 'heart'}
          size={18}
          color={favorite ? theme.color.brick : theme.color.ink}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.space.lg,
    paddingTop: theme.space.sm,
    gap: theme.space.lg,
  },
  complete: {
    backgroundColor: theme.color.vermilionWash,
  },
  warning: {
    color: theme.color.brick,
    fontSize: theme.font.caption,
  },
  ring: {
    width: RING,
    height: RING,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringDot: {
    position: 'absolute',
    width: RING_DOT,
    height: RING_DOT,
    borderRadius: theme.radius.pill,
    borderWidth: theme.border.mark,
  },
  ringDotOn: {
    backgroundColor: theme.color.vermilion,
    borderColor: theme.color.vermilion,
  },
  ringDotOff: {
    backgroundColor: theme.color.paper,
    borderColor: theme.color.inkMuted,
  },
  ringCount: {
    color: theme.color.ink,
    fontFamily: theme.font.heading,
    fontSize: theme.font.body,
    fontVariant: ['tabular-nums'],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.sm,
    marginTop: theme.space.lg,
  },
  frame: {
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  thumb: {
    aspectRatio: 1,
  },
  /** 押印済みはイラストを後ろに引き、印を主役にする。 */
  thumbStamped: {
    opacity: 0.42,
  },
  thumbWash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: theme.color.paper,
    opacity: 0.38,
  },
  tilePressed: {
    opacity: theme.opacity.pressed,
  },
  cue: {
    position: 'absolute',
    top: theme.space.xs,
    left: theme.space.xs,
    width: theme.space.lg + theme.space.xs,
    height: theme.space.lg + theme.space.xs,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.paper,
  },
  estimated: {
    position: 'absolute',
    left: theme.space.xs,
    bottom: theme.space.xs,
  },
  sealHit: {
    position: 'absolute',
    zIndex: 1,
    width: SEAL,
    height: SEAL,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  sealPressed: {
    opacity: theme.opacity.pressed,
  },
  mastery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.space.sm,
    marginTop: theme.space.lg,
  },
  heart: {
    position: 'absolute',
    zIndex: 2,
    top: theme.space.xs,
    right: theme.space.xs,
    width: theme.hit,
    height: theme.hit,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.paper,
  },
  name: {
    color: theme.color.ink,
    fontFamily: theme.font.heading,
    fontSize: theme.font.caption,
    marginTop: theme.space.xs,
  },
  people: {
    marginTop: theme.space.lg,
  },
  section: {
    color: theme.color.leafDark,
    fontSize: theme.font.body,
    fontWeight: '700',
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    minHeight: 64,
    paddingVertical: theme.space.sm,
  },
  personLine: {
    borderBottomWidth: theme.border.hairline,
    borderBottomColor: theme.color.separator,
  },
  rowPressed: {
    backgroundColor: theme.color.press,
  },
  personName: {
    flex: 1,
    color: theme.color.ink,
    fontFamily: theme.font.heading,
    fontSize: theme.font.body,
  },
  celebration: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: theme.space.xl * 3,
    alignItems: 'center',
  },
});
