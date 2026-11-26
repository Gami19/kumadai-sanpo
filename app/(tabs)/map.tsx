import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CampusSwitcher } from '@/features/map/CampusSwitcher';
import { campuses, type CampusId } from '@/features/map/campuses';
import { ZoomableCampusMap } from '@/features/map/ZoomableCampusMap';
import { theme } from '@/theme/tokens';

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [campusId, setCampusId] = useState<CampusId>(campuses[0].id);
  const campus = campuses.find((item) => item.id === campusId) ?? campuses[0];

  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: insets.top + theme.space.sm,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <CampusSwitcher selectedId={campus.id} onSelect={setCampusId} />
      <View style={styles.stage}>
        <ZoomableCampusMap
          key={campus.id}
          source={campus.illustration}
          accessibilityLabel={`${campus.label}キャンパスの絵本マップ`}
        />
        <View pointerEvents="none" style={styles.creditWrap}>
          <Text style={styles.credit}>地図データの出典：© OpenStreetMap contributors（ODbL）</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.color.paper,
  },
  stage: {
    flex: 1,
  },
  creditWrap: {
    position: 'absolute',
    left: theme.space.md,
    right: theme.space.md,
    bottom: theme.space.sm,
    alignItems: 'center',
  },
  credit: {
    overflow: 'hidden',
    backgroundColor: theme.color.card,
    color: theme.color.inkMuted,
    fontSize: theme.font.caption,
    lineHeight: theme.font.caption + theme.space.xs,
    paddingHorizontal: theme.space.sm,
    paddingVertical: theme.space.xs,
    borderRadius: theme.radius.md,
  },
});
