import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { MapThumb } from '@/components/MapThumb';
import { NameSeal } from '@/components/NameSeal';
import { useUndoToast } from '@/components/UndoToast';
import { haptics } from '@/lib/haptics';
import type { Building } from '@/lib/content/buildings';
import { useBuildings } from '@/lib/content/useBuildings';
import { usePeople } from '@/lib/content/usePeople';
import { buildingsInCampusOrder } from '@/lib/quiz/order';
import type { FavoriteRecord } from '@/lib/notebook/parse';
import { NotebookStorageError } from '@/lib/notebook/storage';
import { useNotebook } from '@/lib/notebook/useNotebook';
import { theme } from '@/theme/tokens';

function byRecent(a: FavoriteRecord, b: FavoriteRecord): number {
  return Date.parse(b.savedAt) - Date.parse(a.savedAt);
}

function storageMessage(error: unknown): string {
  const reason = error instanceof NotebookStorageError ? error.reason : 'save';
  return reason === 'load' ? '記録を読み込めませんでした' : '保存できませんでした';
}

export function NotebookHome() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const buildings = useBuildings();
  const people = usePeople();
  const notebook = useNotebook();
  const showToast = useUndoToast();
  const [popId, setPopId] = useState<string | null>(null);
  const ordered = buildingsInCampusOrder(buildings);
  const tile = (width - theme.space.lg * 2 - theme.space.sm) / 2;
  const stampedCount = ordered.filter((building) =>
    notebook.stamps.some((stamp) => stamp.buildingId === building.id),
  ).length;
  const favoritePeople = notebook.favoritePeople
    .filter((record) => people.some((person) => person.id === record.id))
    .slice()
    .sort(byRecent);

  const fail = (error: unknown) => {
    showToast(storageMessage(error));
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.space.xl }]}
    >
      {notebook.loadError ? <Text style={styles.warning}>記録を読み込めませんでした</Text> : null}
      {notebook.ready && !notebook.loadError ? (
        <>
          <Text
            style={styles.progress}
            accessibilityLabel={`訪問 ${stampedCount} / ${ordered.length}`}
          >
            {stampedCount}/{ordered.length}
          </Text>
          <View style={styles.grid}>
            {ordered.map((building) => (
              <StampFrame
                key={building.id}
                building={building}
                width={tile}
                stamped={notebook.stamps.some((stamp) => stamp.buildingId === building.id)}
                favorite={notebook.favoriteBuildings.some((item) => item.id === building.id)}
                pop={popId === building.id}
                onStamp={() => {
                  const existing = notebook.stamps.find((stamp) => stamp.buildingId === building.id);
                  if (existing == null) {
                    haptics.stamp();
                    setPopId(building.id);
                    void notebook.stampBuilding(building.id).then(() => {
                      showToast('スタンプを付けました', () => {
                        setPopId(null);
                        return notebook.removeStamp(building.id).catch(fail);
                      });
                    }, fail);
                    return;
                  }
                  const saved = existing;
                  haptics.remove();
                  setPopId(null);
                  void notebook.removeStamp(building.id).then(() => {
                    showToast('スタンプを消しました', () => {
                      setPopId(building.id);
                      return notebook.restoreStamp(saved).catch(fail);
                    });
                  }, fail);
                }}
                onFavorite={() => {
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
                  const saved = existing;
                  haptics.remove();
                  void notebook.removeFavoriteBuilding(building.id).then(() => {
                    showToast('お気に入りから外しました', () =>
                      notebook.restoreFavoriteBuilding(saved).catch(fail),
                    );
                  }, fail);
                }}
              />
            ))}
          </View>
          {favoritePeople.length > 0 ? (
            <View style={styles.people}>
              <Text style={styles.section}>人物</Text>
              {favoritePeople.map((record) => {
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
                    style={({ pressed }) => [styles.personRow, pressed && styles.pressed]}
                  >
                    <NameSeal name={person.name} size={36} />
                    <Text style={styles.personName} numberOfLines={1}>
                      {person.name}
                    </Text>
                    <Icon name="chevron.right" size={18} color={theme.color.inkMuted} />
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </>
      ) : null}
    </ScrollView>
  );
}

function StampFrame({
  building,
  width,
  stamped,
  favorite,
  pop,
  onStamp,
  onFavorite,
}: {
  building: Building;
  width: number;
  stamped: boolean;
  favorite: boolean;
  pop: boolean;
  onStamp: () => void;
  onFavorite: () => void;
}) {
  return (
    <View style={{ width }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${building.name}。${stamped ? '押印済み' : '未押印'}${building.positionEstimated ? '。位置は推定' : ''}`}
        accessibilityHint="タップでスタンプを切り替える"
        onPress={onStamp}
        style={({ pressed }) => [styles.frame, pressed && styles.pressed]}
      >
        <MapThumb id={building.id} sepia={!stamped} style={styles.thumb} />
        {stamped ? (
          <View style={styles.seal} pointerEvents="none">
            <NameSeal name={building.name} size={56} pop={pop} />
          </View>
        ) : null}
        {building.positionEstimated ? <Text style={styles.estimated}>推定</Text> : null}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          favorite ? `${building.name}のお気に入りを外す` : `${building.name}をお気に入りに入れる`
        }
        onPress={onFavorite}
        style={styles.heart}
      >
        <Icon
          name={favorite ? 'heart.fill' : 'heart'}
          size={18}
          color={favorite ? theme.color.brick : theme.color.ink}
        />
      </Pressable>
      <Text style={styles.name} numberOfLines={1}>
        {building.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.space.lg,
    paddingTop: theme.space.sm,
    gap: theme.space.md,
  },
  warning: {
    color: theme.color.brick,
    fontSize: theme.font.caption,
  },
  progress: {
    color: theme.color.ink,
    fontFamily: theme.font.heading,
    fontSize: theme.font.title,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.sm,
  },
  frame: {
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  thumb: {
    aspectRatio: 1,
  },
  pressed: {
    opacity: 0.82,
  },
  seal: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  estimated: {
    position: 'absolute',
    left: theme.space.xs,
    bottom: theme.space.xs,
    color: theme.color.brick,
    backgroundColor: theme.color.paper,
    fontSize: theme.font.caption,
    fontWeight: '700',
    overflow: 'hidden',
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.space.xs,
    paddingVertical: 2,
  },
  heart: {
    position: 'absolute',
    top: theme.space.xs,
    right: theme.space.xs,
    width: 44,
    height: 44,
    borderRadius: 22,
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
    gap: theme.space.xs,
  },
  section: {
    color: theme.color.leafDark,
    fontSize: theme.font.caption,
    fontWeight: '700',
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    minHeight: 44,
  },
  personName: {
    flex: 1,
    color: theme.color.ink,
    fontFamily: theme.font.heading,
    fontSize: theme.font.body,
  },
});
