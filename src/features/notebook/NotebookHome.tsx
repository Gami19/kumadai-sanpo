import { router, useIsFocused } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EstimatedChip } from '@/components/EstimatedChip';
import { Icon } from '@/components/Icon';
import { MapThumb } from '@/components/MapThumb';
import { NameSeal } from '@/components/NameSeal';
import { BuildingStamp } from '@/components/stamp/BuildingStamp';
import { useUndoToast } from '@/components/UndoToast';
import { mapTargetForBuilding } from '@/features/buildings/mapTarget';
import { campusIdForLabel, type CampusId } from '@/features/map/campuses';
import { spots } from '@/features/map/spots';
import type { Building } from '@/lib/content/buildings';
import { useBuildings } from '@/lib/content/useBuildings';
import { usePeople } from '@/lib/content/usePeople';
import { haptics } from '@/lib/haptics';
import { readCompletionSeen, writeCompletionSeen } from '@/lib/notebook/completion';
import { readDistrictSeen, writeDistrictSeen } from '@/lib/notebook/districtSeen';
import { CAMPUS_IDS, isCampusComplete } from '@/lib/notebook/districts';
import type { FavoriteRecord } from '@/lib/notebook/parse';
import { NotebookStorageError } from '@/lib/notebook/storage';
import { useNotebook } from '@/lib/notebook/useNotebook';
import { stampGate, type StampGate } from '@/lib/stamp/gate';
import { buildingsInCampusOrder } from '@/lib/quiz/order';
import { theme } from '@/theme/tokens';

import { StampPreviewModal } from './StampPreviewModal';
import { howToGetLabel, STAMP_HINT } from './stampCopy';
import { recoverStampLocation, useStampFix } from './useStampFix';

/** 円周の文字が読める大きさ。写真の中央に押す。 */
const SEAL = 104;
const RING = 104;
const RING_DOT = theme.space.sm;
const RING_RADIUS = 40;

function byRecent(a: FavoriteRecord, b: FavoriteRecord): number {
  return Date.parse(b.savedAt) - Date.parse(a.savedAt);
}

function storageMessage(error: unknown): string {
  const reason = error instanceof NotebookStorageError ? error.reason : 'save';
  return reason === 'load' ? '記録を読み込めませんでした' : '保存できませんでした';
}

function openMap(building: Building) {
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

function openDetail(building: Building) {
  haptics.select();
  router.push({ pathname: '/building/[id]', params: { id: building.id } });
}

export function NotebookHome() {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const { width } = useWindowDimensions();
  const fix = useStampFix(focused);
  const buildings = useBuildings();
  const people = usePeople();
  const notebook = useNotebook();
  const showToast = useUndoToast();
  const [popId, setPopId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [seen, setSeen] = useState<boolean | null>(null);
  const [districtSeen, setDistrictSeen] = useState<ReadonlySet<CampusId> | null>(null);
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
  const previewBuilding = previewId != null ? ordered.find((item) => item.id === previewId) ?? null : null;
  const previewCampusId =
    previewBuilding != null ? campusIdForLabel(previewBuilding.campus) : null;
  const previewStamp =
    previewBuilding != null
      ? (notebook.stamps.find((item) => item.buildingId === previewBuilding.id) ?? null)
      : null;

  const openPreview = (id: string) => {
    haptics.select();
    setPreviewId(id);
    setPreviewVisible(true);
  };

  const closePreview = () => {
    setPreviewVisible(false);
    setTimeout(() => {
      setPreviewId(null);
    }, 200);
  };

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

  // 区画／全制覇の印は出さないが、seen キーは互換のため静かに更新する。
  const stampedKey = ordered.map((building) => (stampedIds.has(building.id) ? building.id : '')).join(',');
  useEffect(() => {
    if (districtSeen == null) {
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
    const next = new Set<CampusId>([...districtSeen, ...missing]);
    setDistrictSeen(next);
    void writeDistrictSeen([...next]);
  }, [districtSeen, ordered, stampedKey]);

  useEffect(() => {
    if (!complete || seen !== false || wroteSeen.current) {
      return;
    }
    wroteSeen.current = true;
    setSeen(true);
    void writeCompletionSeen();
  }, [complete, seen]);

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
    if (existing != null) {
      return;
    }
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
    <>
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
            <Text style={styles.hint} accessibilityRole="text">
              {STAMP_HINT}
            </Text>
            <View style={styles.grid}>
              {ordered.map((building) => {
                const on = stampedIds.has(building.id);
                const campusId = campusIdForLabel(building.campus);
                const gate = gateFor(building);
                return (
                  <StampFrame
                    key={building.id}
                    building={building}
                    campusId={campusId}
                    width={tile}
                    stamped={on}
                    favorite={notebook.favoriteBuildings.some((item) => item.id === building.id)}
                    pop={popId === building.id && on}
                    gate={gate}
                    onOpenPreview={() => {
                      openPreview(building.id);
                    }}
                    onStamp={() => {
                      stamp(building);
                    }}
                    onFavorite={() => {
                      favorite(building);
                    }}
                    onOpenMap={() => {
                      openMap(building);
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
          </View>
        ) : null}
      </ScrollView>
      {previewBuilding != null && previewCampusId != null ? (
        <StampPreviewModal
          building={previewBuilding}
          campusId={previewCampusId}
          stampedAt={previewStamp?.stampedAt ?? null}
          gate={gateFor(previewBuilding)}
          visible={previewVisible}
          onClose={closePreview}
          onOpenDetail={() => {
            closePreview();
            openDetail(previewBuilding);
          }}
          onOpenMap={() => {
            closePreview();
            openMap(previewBuilding);
          }}
          onStamp={() => {
            closePreview();
            stamp(previewBuilding);
          }}
          onRecover={() => {
            const gate = gateFor(previewBuilding);
            if (!gate.ok) {
              haptics.select();
              recoverStampLocation(gate.block, fix.retry);
            }
          }}
        />
      ) : null}
    </>
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

function StampFrame({
  building,
  campusId,
  width,
  stamped,
  favorite,
  pop,
  gate,
  onOpenPreview,
  onStamp,
  onFavorite,
  onOpenMap,
}: {
  building: Building;
  campusId: CampusId | null;
  width: number;
  stamped: boolean;
  favorite: boolean;
  pop: boolean;
  gate: StampGate;
  onOpenPreview: () => void;
  onStamp: () => void;
  onFavorite: () => void;
  onOpenMap: () => void;
}) {
  const ready = !stamped && gate.ok;
  const blocked = !stamped && !gate.ok ? gate.block : null;
  const how = howToGetLabel(blocked, ready);
  const label = stamped
    ? `${building.name}のスタンプを見る`
    : ready
      ? `${building.name}。${how}`
      : `${building.name}。まだ取れていません。${how}`;

  return (
    <View style={{ width }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={building.positionEstimated ? `${label}。位置は推定` : label}
        onPress={onOpenPreview}
        pressRetentionOffset={theme.space.md}
        style={({ pressed }) => [pressed && styles.tilePressed]}
      >
        <View style={styles.frame}>
          <MapThumb
            id={building.id}
            sepia={!stamped}
            style={[styles.thumb, stamped ? styles.thumbStamped : styles.thumbLocked]}
          />
          {stamped ? <View pointerEvents="none" style={styles.thumbWash} /> : null}
          {!stamped ? <View pointerEvents="none" style={styles.lockDim} /> : null}
          {!stamped ? (
            <View pointerEvents="none" style={styles.lockBadge}>
              <Icon name={ready ? 'location.fill' : 'lock'} size={18} color={theme.color.ink} />
            </View>
          ) : null}
          {building.positionEstimated ? (
            <View pointerEvents="none" style={styles.estimated}>
              <EstimatedChip interactive={false} />
            </View>
          ) : null}
          {stamped && campusId != null ? (
            <View pointerEvents="none" style={styles.sealCenter}>
              <BuildingStamp
                buildingId={building.id}
                campusId={campusId}
                size={SEAL}
                pop={pop}
              />
            </View>
          ) : null}
          {!stamped ? (
            <View pointerEvents="none" style={styles.howOverlay}>
              <Text style={[styles.howText, ready ? styles.howReady : null]} numberOfLines={2}>
                {how}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {building.name}
        </Text>
      </Pressable>
      {!stamped ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            ready ? `${building.name}にスタンプを押す` : `${building.name}を地図で開く`
          }
          onPress={() => {
            if (ready) {
              onStamp();
              return;
            }
            onOpenMap();
          }}
          style={({ pressed }) => [styles.cueLink, pressed && styles.sealPressed]}
        >
          <Icon name={ready ? 'checkmark' : 'map'} size={14} color={theme.color.leafDark} />
          <Text style={styles.cueLinkText}>{ready ? '押す' : '地図で見る'}</Text>
        </Pressable>
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
  hint: {
    color: theme.color.inkMuted,
    fontSize: theme.font.caption,
    textAlign: 'center',
    marginTop: theme.space.sm,
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
    marginTop: theme.space.md,
  },
  frame: {
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  thumb: {
    aspectRatio: 1,
  },
  thumbStamped: {
    opacity: 0.42,
  },
  thumbLocked: {
    opacity: 0.45,
  },
  thumbWash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: theme.color.paper,
    opacity: 0.38,
  },
  lockDim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: theme.color.ink,
    opacity: 0.28,
  },
  lockBadge: {
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
  howOverlay: {
    position: 'absolute',
    left: theme.space.xs,
    right: theme.space.xs,
    bottom: theme.space.xs,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.color.paper,
    paddingHorizontal: theme.space.sm,
    paddingVertical: theme.space.xs,
  },
  howText: {
    color: theme.color.ink,
    fontSize: theme.font.caption,
    fontWeight: '700',
    textAlign: 'center',
  },
  howReady: {
    color: theme.color.vermilion,
  },
  sealCenter: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tilePressed: {
    opacity: theme.opacity.pressed,
  },
  estimated: {
    position: 'absolute',
    left: theme.space.xs,
    bottom: theme.space.lg + theme.space.sm,
  },
  sealPressed: {
    opacity: theme.opacity.pressed,
  },
  cueLink: {
    marginTop: theme.space.xs,
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.xs,
  },
  cueLinkText: {
    color: theme.color.leafDark,
    fontSize: theme.font.caption,
    fontWeight: '700',
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
});
