import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { useUndoToast } from '@/components/UndoToast';
import { mapTargetForBuilding } from '@/features/buildings/mapTarget';
import { spots } from '@/features/map/spots';
import type { Building } from '@/lib/content/buildings';
import { useBuildings } from '@/lib/content/useBuildings';
import { usePeople } from '@/lib/content/usePeople';
import { haptics } from '@/lib/haptics';
import { readCompletionSeen, writeCompletionSeen } from '@/lib/notebook/completion';
import type { FavoriteRecord, StampRecord } from '@/lib/notebook/parse';
import { NotebookStorageError } from '@/lib/notebook/storage';
import { useNotebook } from '@/lib/notebook/useNotebook';
import { buildingsInCampusOrder } from '@/lib/quiz/order';
import { theme } from '@/theme/tokens';

/** 印の顔。44pt より大きく、押した場所だと形で分かる。 */
const SEAL = 56;
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
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  const buildings = useBuildings();
  const people = usePeople();
  const notebook = useNotebook();
  const showToast = useUndoToast();
  const [popId, setPopId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [seen, setSeen] = useState<boolean | null>(null);
  const [celebrationDone, setCelebrationDone] = useState(false);
  const wroteSeen = useRef(false);
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
    return () => {
      live = false;
    };
  }, []);

  const celebrating = complete && seen === false && !reduced && !celebrationDone;

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

  const fail = (error: unknown) => {
    showToast(storageMessage(error));
  };

  const stamp = (building: Building) => {
    if (pendingId === building.id) {
      return;
    }
    const existing = notebook.stamps.find((item) => item.buildingId === building.id);
    if (existing == null) {
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
              return (
                <StampFrame
                  key={building.id}
                  building={building}
                  width={tile}
                  stamped={on}
                  favorite={notebook.favoriteBuildings.some((item) => item.id === building.id)}
                  pop={popId === building.id && on}
                  onMap={onMap}
                  onOpen={() => {
                    openBuilding(building);
                  }}
                  onStamp={() => {
                    stamp(building);
                  }}
                  onFavorite={() => {
                    favorite(building);
                  }}
                />
              );
            })}
          </View>
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
          {celebrating && complete ? (
            <CompletionStamp total={ordered.length} onDone={finishCelebration} />
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

function CompletionStamp({ total, onDone }: { total: number; onDone: () => void }) {
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
      accessibilityLabel={`${total}件すべてにスタンプが付きました`}
      style={[styles.celebration, animated]}
    >
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <NameSeal name="完" size={theme.space.xl * 3} pop />
      </View>
    </Animated.View>
  );
}

function StampFrame({
  building,
  width,
  stamped,
  favorite,
  pop,
  onMap,
  onOpen,
  onStamp,
  onFavorite,
}: {
  building: Building;
  width: number;
  stamped: boolean;
  favorite: boolean;
  pop: boolean;
  onMap: boolean;
  onOpen: () => void;
  onStamp: () => void;
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
          <MapThumb id={building.id} sepia={!stamped} style={styles.thumb} />
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={stamped ? `${building.name}のスタンプを消す` : `${building.name}にスタンプを押す`}
        accessibilityState={{ selected: stamped }}
        onPress={onStamp}
        pressRetentionOffset={theme.space.md}
        style={({ pressed }) => [
          styles.sealHit,
          { top: (width - SEAL) / 2, left: (width - SEAL) / 2 },
          pressed && styles.sealPressed,
        ]}
      >
        {stamped ? (
          <NameSeal name={building.name} size={SEAL} pop={pop} />
        ) : (
          <View style={styles.emptySeal} />
        )}
      </Pressable>
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
    backgroundColor: theme.color.brickWash,
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
    backgroundColor: theme.color.brick,
    borderColor: theme.color.brick,
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
  },
  sealPressed: {
    opacity: theme.opacity.pressed,
  },
  emptySeal: {
    width: SEAL,
    height: SEAL,
    borderRadius: theme.radius.pill,
    borderWidth: theme.border.mark,
    borderStyle: 'dashed',
    borderColor: theme.color.brick,
    backgroundColor: theme.color.paper,
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
