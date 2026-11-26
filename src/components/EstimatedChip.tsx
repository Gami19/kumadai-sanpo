import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ESTIMATED_LABEL, notices } from '@/copy/notices';
import { openInfo } from '@/lib/sheet/session';
import { theme } from '@/theme/tokens';

type Props = {
  /** ピンの上では false。タップはピン側に任せる。 */
  interactive?: boolean;
};

const note = notices.estimated.paragraphs[0] ?? ESTIMATED_LABEL;

/** 推定位置の見える印。全文はシートに1つだけ。 */
export function EstimatedChip({ interactive = true }: Props) {
  if (!interactive) {
    return (
      <View accessible={false} importantForAccessibility="no" style={styles.compact}>
        <Text style={styles.label}>{ESTIMATED_LABEL}</Text>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="位置は推定"
      accessibilityHint={note}
      onPress={() => {
        openInfo('estimated');
      }}
      style={({ pressed }) => [styles.hit, pressed && styles.pressed]}
    >
      <Text style={styles.label}>{ESTIMATED_LABEL}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: theme.space.sm,
    borderRadius: theme.radius.pill,
    borderCurve: 'continuous',
    backgroundColor: theme.color.paper,
  },
  compact: {
    borderRadius: theme.radius.pill,
    borderCurve: 'continuous',
    backgroundColor: theme.color.paper,
    paddingHorizontal: theme.space.xs,
    paddingVertical: 1,
  },
  pressed: {
    backgroundColor: theme.color.press,
  },
  label: {
    color: theme.color.brick,
    fontSize: theme.font.caption,
    fontWeight: '700',
    lineHeight: theme.font.caption + theme.space.xs,
  },
});
