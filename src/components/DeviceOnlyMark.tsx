import { Pressable, StyleSheet } from 'react-native';

import { openInfo } from '@/lib/sheet/session';
import { theme } from '@/theme/tokens';

import { Icon } from './Icon';

/** 端末内保存の記号。説明の全文はさんぽ帳から開くシートにだけ置く。 */
export function DeviceOnlyMark() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="この端末だけに保存。説明を開く"
      hitSlop={theme.space.sm}
      onPress={() => {
        openInfo('device');
      }}
      style={styles.hit}
    >
      <Icon name="lock" color={theme.color.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
