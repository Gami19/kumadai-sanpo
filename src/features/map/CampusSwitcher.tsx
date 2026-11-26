import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme/tokens';

import { campuses, type CampusId } from './campuses';

type Props = {
  selectedId: CampusId;
  onSelect: (id: CampusId) => void;
};

export function CampusSwitcher({ selectedId, onSelect }: Props) {
  return (
    <View style={styles.row}>
      {campuses.map((campus) => {
        const selected = campus.id === selectedId;
        return (
          <Pressable
            key={campus.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${campus.label}キャンパス`}
            onPress={() => onSelect(campus.id)}
            style={({ pressed }) => [
              styles.tab,
              selected ? styles.tabSelected : styles.tabIdle,
              pressed ? styles.tabPressed : null,
            ]}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.label, selected ? styles.labelSelected : styles.labelIdle]}
            >
              {campus.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: theme.space.xs,
    paddingHorizontal: theme.space.md,
    paddingBottom: theme.space.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    borderWidth: theme.border.hairline,
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.xs,
    minHeight: theme.space.xl,
  },
  tabSelected: {
    backgroundColor: theme.color.moss,
    borderColor: theme.color.moss,
  },
  tabIdle: {
    backgroundColor: theme.color.card,
    borderColor: theme.color.line,
  },
  tabPressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: theme.font.caption,
    fontWeight: '600',
  },
  labelSelected: {
    color: theme.color.card,
  },
  labelIdle: {
    color: theme.color.ink,
  },
});
