import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatNotebookTime } from '@/lib/notebook/parse';
import { NotebookStorageError } from '@/lib/notebook/storage';
import { useNotebook } from '@/lib/notebook/useNotebook';
import { theme } from '@/theme/tokens';

function reportStorageError(error: unknown) {
  const reason = error instanceof NotebookStorageError ? error.reason : 'save';
  if (reason === 'load') {
    Alert.alert(
      '記録を読み込めませんでした',
      'この端末に保存されているさんぽ帳を読めませんでした。',
    );
    return;
  }
  Alert.alert('保存できませんでした', 'この端末への記録に失敗しました。もう一度試してください。');
}

function confirmRemove(title: string, message: string, onConfirm: () => void) {
  Alert.alert(title, message, [
    { text: 'やめる', style: 'cancel' },
    { text: '消す', style: 'destructive', onPress: onConfirm },
  ]);
}

type BuildingProps = {
  buildingId: string;
  buildingName: string;
  /** 詳細画面では、保存の説明を一緒に出す。 */
  verbose?: boolean;
  /** お気に入り一覧では、スタンプの操作を繰り返さない。 */
  favoriteOnly?: boolean;
};

export function BuildingRecordButtons({
  buildingId,
  buildingName,
  verbose = false,
  favoriteOnly = false,
}: BuildingProps) {
  const notebook = useNotebook();
  const stamp = notebook.stamps.find((item) => item.buildingId === buildingId) ?? null;
  const favorite = notebook.favoriteBuildings.some((item) => item.id === buildingId);
  const disabled = !notebook.ready || notebook.loadError;

  return (
    <View style={styles.block}>
      {verbose ? (
        <View style={styles.block}>
          <Text style={styles.section}>この端末の記録</Text>
          <Text style={styles.caption}>
            お気に入りと訪問スタンプは、この端末だけに保存します。サーバーへは送りません。位置は残りません。近くにいるだけでは、スタンプは付きません。
          </Text>
          {!notebook.ready ? <Text style={styles.caption}>記録を読み込んでいます。</Text> : null}
          {notebook.loadError ? (
            <Text style={styles.warning}>この端末の記録を読み込めませんでした。</Text>
          ) : null}
        </View>
      ) : null}
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
              disabled={disabled}
              onPress={() => {
                void notebook.stampBuilding(buildingId).catch(reportStorageError);
              }}
            />
          ) : (
            <RecordButton
              label="スタンプを消す"
              accessibilityLabel={`${buildingName}の訪問スタンプを消す`}
              disabled={disabled}
              onPress={() => {
                confirmRemove(
                  '訪問スタンプを消しますか',
                  `「${buildingName}」の訪問スタンプを、この端末から消します。`,
                  () => {
                    void notebook.removeStamp(buildingId).catch(reportStorageError);
                  },
                );
              }}
            />
          )}
        </View>
      )}
      <RecordButton
        label={favorite ? 'お気に入りから外す' : 'お気に入りに入れる'}
        accessibilityLabel={
          favorite ? `${buildingName}のお気に入りを外す` : `${buildingName}をお気に入りに入れる`
        }
        disabled={disabled}
        onPress={() => {
          if (favorite) {
            confirmRemove(
              'お気に入りから外しますか',
              `「${buildingName}」を、この端末のお気に入りから外します。`,
              () => {
                void notebook.removeFavoriteBuilding(buildingId).catch(reportStorageError);
              },
            );
            return;
          }
          void notebook.addFavoriteBuilding(buildingId).catch(reportStorageError);
        }}
      />
    </View>
  );
}

type PersonProps = {
  personId: string;
  personName: string;
  verbose?: boolean;
};

export function PersonFavoriteButton({ personId, personName, verbose = false }: PersonProps) {
  const notebook = useNotebook();
  const favorite = notebook.favoritePeople.some((item) => item.id === personId);
  const disabled = !notebook.ready || notebook.loadError;

  return (
    <View style={styles.block}>
      {verbose ? (
        <View style={styles.block}>
          <Text style={styles.section}>この端末の記録</Text>
          <Text style={styles.caption}>
            お気に入りは、この端末だけに保存します。サーバーへは送りません。
          </Text>
          {!notebook.ready ? <Text style={styles.caption}>記録を読み込んでいます。</Text> : null}
          {notebook.loadError ? (
            <Text style={styles.warning}>この端末の記録を読み込めませんでした。</Text>
          ) : null}
        </View>
      ) : null}
      <Text style={styles.body}>
        {favorite ? 'お気に入りに入っています。' : 'お気に入りには入っていません。'}
      </Text>
      <RecordButton
        label={favorite ? 'お気に入りから外す' : 'お気に入りに入れる'}
        accessibilityLabel={
          favorite ? `${personName}のお気に入りを外す` : `${personName}をお気に入りに入れる`
        }
        disabled={disabled}
        onPress={() => {
          if (favorite) {
            confirmRemove(
              'お気に入りから外しますか',
              `「${personName}」を、この端末のお気に入りから外します。`,
              () => {
                void notebook.removeFavoritePerson(personId).catch(reportStorageError);
              },
            );
            return;
          }
          void notebook.addFavoritePerson(personId).catch(reportStorageError);
        }}
      />
    </View>
  );
}

function RecordButton({
  label,
  accessibilityLabel,
  disabled,
  onPress,
}: {
  label: string;
  accessibilityLabel: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled ? styles.disabled : null,
        pressed && !disabled ? styles.pressed : null,
      ]}
    >
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: theme.space.sm,
  },
  section: {
    color: theme.color.moss,
    fontSize: theme.font.caption,
    fontWeight: '700',
  },
  caption: {
    color: theme.color.inkMuted,
    fontSize: theme.font.caption,
    lineHeight: theme.font.caption + theme.space.xs,
  },
  warning: {
    color: theme.color.clay,
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
    borderColor: theme.color.line,
    backgroundColor: theme.color.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealOn: {
    borderColor: theme.color.moss,
    backgroundColor: theme.color.mossWash,
  },
  sealLabel: {
    color: theme.color.inkMuted,
    fontSize: theme.font.caption,
    fontWeight: '700',
  },
  sealLabelOn: {
    color: theme.color.moss,
  },
  body: {
    flex: 1,
    color: theme.color.ink,
    fontSize: theme.font.body,
    lineHeight: theme.font.body + theme.space.sm,
  },
  button: {
    backgroundColor: theme.color.card,
    borderColor: theme.color.line,
    borderRadius: theme.radius.md,
    borderWidth: theme.border.hairline,
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.md,
  },
  buttonLabel: {
    color: theme.color.moss,
    fontSize: theme.font.body,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.45,
  },
});
