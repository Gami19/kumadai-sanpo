import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useUndoToast } from '@/components/UndoToast';
import { haptics } from '@/lib/haptics';
import { formatNotebookTime, type FavoriteRecord, type StampRecord } from '@/lib/notebook/parse';
import { NotebookStorageError } from '@/lib/notebook/storage';
import { useNotebook } from '@/lib/notebook/useNotebook';
import { theme } from '@/theme/tokens';

function storageMessage(error: unknown): string {
  const reason = error instanceof NotebookStorageError ? error.reason : 'save';
  return reason === 'load' ? '記録を読み込めませんでした' : '保存できませんでした';
}

type BuildingProps = {
  buildingId: string;
  buildingName: string;
  /** お気に入り一覧では、スタンプの操作を繰り返さない。 */
  favoriteOnly?: boolean;
};

export function BuildingRecordButtons({
  buildingId,
  buildingName,
  favoriteOnly = false,
}: BuildingProps) {
  const notebook = useNotebook();
  const showToast = useUndoToast();
  const stamp = notebook.stamps.find((item) => item.buildingId === buildingId) ?? null;
  const favorite = notebook.favoriteBuildings.find((item) => item.id === buildingId) ?? null;

  const fail = (error: unknown) => {
    showToast(storageMessage(error));
  };

  if (!notebook.ready) {
    return null;
  }
  if (notebook.loadError) {
    return <Text style={styles.warning}>記録を読み込めませんでした</Text>;
  }

  return (
    <View style={styles.block}>
      {favoriteOnly ? null : (
        <View style={styles.block}>
          <View style={styles.statusRow}>
            <View style={[styles.seal, stamp != null ? styles.sealOn : null]}>
              <Text style={[styles.sealLabel, stamp != null ? styles.sealLabelOn : null]}>
                {stamp != null ? '印' : '未'}
              </Text>
            </View>
            <Text style={styles.body}>
              {stamp != null
                ? `${formatNotebookTime(stamp.stampedAt)}に訪問`
                : '訪問スタンプはまだありません'}
            </Text>
          </View>
          {stamp == null ? (
            <RecordButton
              label="訪問した"
              accessibilityLabel={`${buildingName}に訪問スタンプを付ける`}
              onPress={() => {
                haptics.stamp();
                void notebook.stampBuilding(buildingId).then(() => {
                  showToast('スタンプを付けました', () =>
                    notebook.removeStamp(buildingId).catch(fail),
                  );
                }, fail);
              }}
            />
          ) : (
            <RecordButton
              label="スタンプを消す"
              accessibilityLabel={`${buildingName}の訪問スタンプを消す`}
              onPress={() => {
                const saved: StampRecord = stamp;
                haptics.remove();
                void notebook.removeStamp(buildingId).then(() => {
                  showToast('スタンプを消しました', () => notebook.restoreStamp(saved).catch(fail));
                }, fail);
              }}
            />
          )}
        </View>
      )}
      <RecordButton
        label={favorite != null ? 'お気に入りから外す' : 'お気に入りに入れる'}
        accessibilityLabel={
          favorite != null
            ? `${buildingName}のお気に入りを外す`
            : `${buildingName}をお気に入りに入れる`
        }
        onPress={() => {
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
  );
}

type PersonProps = {
  personId: string;
  personName: string;
};

export function PersonFavoriteButton({ personId, personName }: PersonProps) {
  const notebook = useNotebook();
  const showToast = useUndoToast();
  const favorite = notebook.favoritePeople.find((item) => item.id === personId) ?? null;

  const fail = (error: unknown) => {
    showToast(storageMessage(error));
  };

  if (!notebook.ready) {
    return null;
  }
  if (notebook.loadError) {
    return <Text style={styles.warning}>記録を読み込めませんでした</Text>;
  }

  return (
    <View style={styles.block}>
      <Text style={styles.body}>
        {favorite != null ? 'お気に入りに入っています。' : 'お気に入りには入っていません。'}
      </Text>
      <RecordButton
        label={favorite != null ? 'お気に入りから外す' : 'お気に入りに入れる'}
        accessibilityLabel={
          favorite != null
            ? `${personName}のお気に入りを外す`
            : `${personName}をお気に入りに入れる`
        }
        onPress={() => {
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
      />
    </View>
  );
}

function RecordButton({
  label,
  accessibilityLabel,
  onPress,
}: {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}
    >
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: theme.space.sm,
  },
  warning: {
    color: theme.color.brick,
    fontSize: theme.font.caption,
    lineHeight: theme.font.caption + theme.space.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
  },
  seal: {
    width: theme.space.xl,
    height: theme.space.xl,
    borderRadius: theme.radius.md,
    borderWidth: theme.border.hairline,
    borderColor: theme.color.separator,
    backgroundColor: theme.color.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealOn: {
    borderColor: theme.color.leafDark,
    backgroundColor: theme.color.leafWash,
  },
  sealLabel: {
    color: theme.color.inkMuted,
    fontSize: theme.font.caption,
    fontWeight: '700',
  },
  sealLabelOn: {
    color: theme.color.leafDark,
  },
  body: {
    flex: 1,
    color: theme.color.ink,
    fontSize: theme.font.body,
    lineHeight: theme.font.body + theme.space.sm,
  },
  button: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.md,
    borderRadius: theme.radius.md,
    borderCurve: 'continuous',
    backgroundColor: theme.color.brick,
  },
  buttonLabel: {
    color: theme.color.white,
    fontSize: theme.font.body,
    fontWeight: '700',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
