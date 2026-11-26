import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme/tokens';

type Props = {
  id: string;
  name: string;
  designationLabel: string;
  estimated: boolean;
  onClose: () => void;
};

export function SpotCallout({ id, name, designationLabel, estimated, onClose }: Props) {
  return (
    <View style={styles.sheet} accessibilityRole="summary">
      <View style={styles.copy}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.meta}>{designationLabel}</Text>
        {estimated ? (
          <Text style={styles.estimate}>
            位置は推定です。現地で確認できるまで、確定した場所としては扱いません。
          </Text>
        ) : null}
        <Link
          href={{ pathname: '/building/[id]', params: { id } }}
          asChild
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${name}の建物ページを開く`}
            style={styles.open}
          >
            <Text style={styles.openLabel}>この建物を見る</Text>
          </Pressable>
        </Link>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="地点の表示を閉じる"
        onPress={onClose}
        style={styles.close}
      >
        <Text style={styles.closeLabel}>閉じる</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: theme.space.md,
    right: theme.space.md,
    bottom: theme.space.xl + theme.space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    backgroundColor: theme.color.card,
    borderColor: theme.color.line,
    borderRadius: theme.radius.md,
    borderWidth: theme.border.hairline,
    padding: theme.space.md,
  },
  copy: {
    flex: 1,
    gap: theme.space.xs,
  },
  name: {
    color: theme.color.ink,
    fontSize: theme.font.body,
    fontWeight: '700',
  },
  meta: {
    color: theme.color.inkMuted,
    fontSize: theme.font.caption,
  },
  estimate: {
    color: theme.color.clay,
    fontSize: theme.font.caption,
    lineHeight: theme.font.caption + theme.space.xs,
  },
  open: {
    alignSelf: 'flex-start',
    paddingVertical: theme.space.xs,
  },
  openLabel: {
    color: theme.color.moss,
    fontSize: theme.font.caption,
    fontWeight: '700',
  },
  close: {
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.sm,
  },
  closeLabel: {
    color: theme.color.moss,
    fontSize: theme.font.caption,
    fontWeight: '700',
  },
});
