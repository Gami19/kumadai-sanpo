import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { theme } from '@/theme/tokens';

import { designationCategories } from './spots';

type Props = {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

const options: { id: string | null; label: string }[] = [
  { id: null, label: 'すべて' },
  ...designationCategories.map((category) => ({ id: category.id, label: category.label })),
];

export function CategoryFilter({ selectedId, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroller}
      contentContainerStyle={styles.row}
    >
      {options.map((option) => {
        const selected = option.id === selectedId;
        return (
          <Pressable
            key={option.label}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${option.label}で絞り込む`}
            onPress={() => onSelect(option.id)}
            style={[styles.chip, selected ? styles.chipSelected : styles.chipIdle]}
          >
            <Text style={[styles.label, selected ? styles.labelSelected : styles.labelIdle]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroller: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    gap: theme.space.xs,
    paddingHorizontal: theme.space.md,
    paddingBottom: theme.space.sm,
  },
  chip: {
    borderRadius: theme.radius.md,
    borderWidth: theme.border.hairline,
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.md,
    minHeight: theme.space.xl,
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: theme.color.moss,
    borderColor: theme.color.moss,
  },
  chipIdle: {
    backgroundColor: theme.color.card,
    borderColor: theme.color.line,
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
