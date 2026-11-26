import { StyleSheet, Text } from 'react-native';

import { PlaceholderScreen } from '@/components/PlaceholderScreen';
import { theme } from '@/theme/tokens';

export default function MapScreen() {
  return (
    <PlaceholderScreen
      title="絵本マップ"
      lead="キャンパスの絵本マップは、これからここに載ります。ピンの位置は座標データで持ち、イラストはその上に被せる皮にします。"
    >
      <Text style={styles.credit}>地図データの出典：© OpenStreetMap contributors（ODbL）</Text>
    </PlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  credit: {
    color: theme.color.inkMuted,
    fontSize: theme.font.caption,
    lineHeight: theme.font.caption + theme.space.sm,
  },
});
