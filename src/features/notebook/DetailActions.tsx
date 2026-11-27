import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { NameSeal } from '@/components/NameSeal';
import { useUndoToast } from '@/components/UndoToast';
import { haptics } from '@/lib/haptics';
import type { FavoriteRecord, StampRecord } from '@/lib/notebook/parse';
import { NotebookStorageError } from '@/lib/notebook/storage';
import { useNotebook } from '@/lib/notebook/useNotebook';
import { theme } from '@/theme/tokens';

function storageMessage(error: unknown): string {
  const reason = error instanceof NotebookStorageError ? error.reason : 'save';
  return reason === 'load' ? '記録を読み込めませんでした' : '保存できませんでした';
}

type BarProps = {
  buildingId: string;
  buildingName: string;
  onMap: (() => void) | null;
  onQuiz: (() => void) | null;
};

export function BuildingActionBar({ buildingId, buildingName, onMap, onQuiz }: BarProps) {
  const notebook = useNotebook();
  const showToast = useUndoToast();
  const [celebrated, setCelebrated] = useState(0);
  const stamp = notebook.stamps.find((item) => item.buildingId === buildingId) ?? null;
  const favorite = notebook.favoriteBuildings.find((item) => item.id === buildingId) ?? null;

  const fail = (error: unknown) => {
    showToast(storageMessage(error));
  };

  const guard = (): boolean => {
    if (!notebook.ready) {
      return false;
    }
    if (notebook.loadError) {
      showToast(storageMessage(new NotebookStorageError('load')));
      return false;
    }
    return true;
  };

  return (
    <View style={styles.stack}>
      <View style={styles.row}>
        <ActionButton
          tone="stamp"
          selected={stamp != null}
          label={stamp != null ? '消す' : 'スタンプ'}
          accessibilityLabel={
            stamp != null
              ? `${buildingName}の訪問スタンプを消す`
              : `${buildingName}に訪問スタンプを付ける`
          }
          glyph={
            <NameSeal
              key={celebrated}
              name={buildingName}
              size={32}
              pop={stamp != null && celebrated > 0}
            />
          }
          onPress={() => {
            if (!guard()) {
              return;
            }
            if (stamp != null) {
              const saved: StampRecord = stamp;
              haptics.remove();
              void notebook.removeStamp(buildingId).then(() => {
                showToast('スタンプを消しました', () => notebook.restoreStamp(saved).catch(fail));
              }, fail);
              return;
            }
            haptics.stamp();
            void notebook.stampBuilding(buildingId).then(() => {
              setCelebrated((value) => value + 1);
              showToast('スタンプを付けました', () => notebook.removeStamp(buildingId).catch(fail));
            }, fail);
          }}
        />
        <ActionButton
          tone="quiet"
          selected={favorite != null}
          icon={favorite != null ? 'heart.fill' : 'heart'}
          label="お気に入り"
          accessibilityLabel={
            favorite != null
              ? `${buildingName}のお気に入りを外す`
              : `${buildingName}をお気に入りに入れる`
          }
          onPress={() => {
            if (!guard()) {
              return;
            }
            if (favorite != null) {
              const saved: FavoriteRecord = favorite;
              haptics.remove();
              void notebook.removeFavoriteBuilding(buildingId).then(() => {
                showToast('お気に入りから外しました', () =>
                  notebook.restoreFavoriteBuilding(saved).catch(fail),
                );
              }, fail);
              return;
            }
            haptics.select();
            void notebook.addFavoriteBuilding(buildingId).then(() => {
              showToast('お気に入りに入れました', () =>
                notebook.removeFavoriteBuilding(buildingId).catch(fail),
              );
            }, fail);
          }}
        />
      </View>
      {onMap != null || onQuiz != null ? (
        <View style={styles.row}>
          {onMap != null ? (
            <ActionButton
              tone="quiet"
              icon="map"
              label="地図で見る"
              accessibilityLabel={`${buildingName}を地図で見る`}
              onPress={() => {
                haptics.select();
                onMap();
              }}
            />
          ) : null}
          {onQuiz != null ? (
            <ActionButton
              tone="quiet"
              icon="questionmark"
              label="クイズ"
              accessibilityLabel={`${buildingName}のクイズ`}
              onPress={() => {
                haptics.select();
                onQuiz();
              }}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

type FavoriteProps = {
  personId: string;
  personName: string;
};

/** ヘッダー右のハート。画面の中には説明を足さない。 */
export function PersonFavoriteButton({ personId, personName }: FavoriteProps) {
  const notebook = useNotebook();
  const showToast = useUndoToast();
  const favorite = notebook.favoritePeople.find((item) => item.id === personId) ?? null;
  const on = favorite != null;
  const fail = (error: unknown) => {
    showToast(storageMessage(error));
  };

  if (!notebook.ready) {
    return <View style={styles.headerHit} />;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={on ? `${personName}のお気に入りを外す` : `${personName}をお気に入りに入れる`}
      accessibilityState={{ selected: on }}
      hitSlop={theme.space.xs}
      onPress={() => {
        if (notebook.loadError) {
          fail(new NotebookStorageError('load'));
          return;
        }
        if (favorite != null) {
          const saved: FavoriteRecord = favorite;
          haptics.remove();
          void notebook.removeFavoritePerson(personId).then(() => {
            showToast('お気に入りから外しました', () =>
              notebook.restoreFavoritePerson(saved).catch(fail),
            );
          }, fail);
          return;
        }
        haptics.select();
        void notebook.addFavoritePerson(personId).then(() => {
          showToast('お気に入りに入れました', () =>
            notebook.removeFavoritePerson(personId).catch(fail),
          );
        }, fail);
      }}
      style={({ pressed }) => [styles.headerHit, pressed && styles.pressed]}
    >
      <Icon
        name={on ? 'heart.fill' : 'heart'}
        size={22}
        color={on ? theme.color.brick : theme.color.ink}
      />
    </Pressable>
  );
}

function buttonColor(tone: 'stamp' | 'quiet', selected: boolean): string {
  if (tone === 'stamp' && !selected) {
    return theme.color.white;
  }
  if (tone === 'quiet' && !selected) {
    return theme.color.ink;
  }
  return theme.color.brick;
}

function ActionButton({
  label,
  accessibilityLabel,
  onPress,
  tone,
  icon,
  glyph,
  selected = false,
}: {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  tone: 'stamp' | 'quiet';
  icon?: IconName;
  glyph?: ReactNode;
  selected?: boolean;
}) {
  const filled = tone === 'stamp' && !selected;
  const color = buttonColor(tone, selected);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: filled ? theme.color.brick : theme.color.white },
        pressed && styles.pressed,
      ]}
    >
      {glyph ?? (icon != null ? <Icon name={icon} size={22} color={color} /> : null)}
      <Text style={[styles.buttonLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: theme.space.sm,
  },
  row: {
    flexDirection: 'row',
    gap: theme.space.sm,
  },
  button: {
    flex: 1,
    minHeight: theme.hit,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.xs,
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.sm,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
  },
  buttonLabel: {
    fontSize: theme.font.body,
    fontWeight: '700',
    textAlign: 'center',
  },
  pressed: {
    opacity: theme.opacity.pressed,
  },
  headerHit: {
    width: theme.hit,
    height: theme.hit,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
