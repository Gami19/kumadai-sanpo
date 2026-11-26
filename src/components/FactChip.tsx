import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme/tokens';

import { Icon, type IconName } from './Icon';

type Props = {
  label: string;
  accessibilityLabel: string;
  icon?: IconName;
  /** 文化財区分の色。文字には使わない。 */
  dot?: string;
  /** 「未確認」の印。文字色だけ煉瓦にする。 */
  mark?: boolean;
  /** 長い学校名など。幅いっぱいで1行に収める。 */
  lines?: number;
  wide?: boolean;
};

/** アイコンと短い事実。押さない。 */
export function FactChip({
  label,
  accessibilityLabel,
  icon,
  dot,
  mark = false,
  lines,
  wide = false,
}: Props) {
  const color = mark ? theme.color.brick : theme.color.ink;
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      style={[styles.chip, wide ? styles.wide : null]}
    >
      {dot != null ? (
        <View style={[styles.dot, { backgroundColor: dot }]} accessibilityElementsHidden />
      ) : null}
      {icon != null ? <Icon name={icon} size={16} color={color} /> : null}
      <Text style={[styles.label, { color }]} numberOfLines={lines}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '100%',
    gap: theme.space.xs,
    paddingVertical: theme.space.xs,
    paddingHorizontal: theme.space.sm,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.white,
  },
  wide: {
    width: '100%',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: theme.radius.pill,
  },
  label: {
    flexShrink: 1,
    fontSize: theme.font.caption,
    fontWeight: '600',
    lineHeight: theme.font.caption + theme.space.xs,
  },
});
