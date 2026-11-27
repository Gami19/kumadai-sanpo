import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme/tokens';

import { campuses, type CampusId } from './campuses';

type Props = {
  selectedId: CampusId;
  onSelect: (id: CampusId) => void;
};

export function CampusSwitcher({ selectedId, onSelect }: Props) {
  return (
    <View accessibilityRole="tablist" style={styles.bar} testID="campus-switcher">
      {campuses.map((campus) => {
        const selected = campus.id === selectedId;
        return (
          <Pressable
            key={campus.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={`${campus.label}キャンパス`}
            onPress={() => onSelect(campus.id)}
            style={({ pressed }) => [
              styles.item,
              selected ? styles.itemOn : null,
              pressed ? styles.itemPressed : null,
            ]}
          >
            <Text numberOfLines={1} style={[styles.label, selected ? styles.labelOn : styles.labelOff]}>
              {campus.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.xs,
    padding: theme.space.xs,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.paper,
    boxShadow: theme.shadow.float,
  },
  item: {
    flex: 1,
    minHeight: theme.hit,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.space.xs,
    borderRadius: theme.radius.pill,
  },
  itemOn: {
    backgroundColor: theme.color.brick,
  },
  itemPressed: {
    opacity: theme.opacity.pressed,
  },
  label: {
    fontSize: theme.font.caption,
    fontWeight: '700',
    lineHeight: theme.font.caption + theme.space.xs,
  },
  labelOn: {
    color: theme.color.white,
  },
  labelOff: {
    color: theme.color.ink,
  },
});
