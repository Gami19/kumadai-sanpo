import { Pressable, StyleSheet, View } from 'react-native';

import { theme } from '@/theme/tokens';

import { designationCategories } from './spots';

const COLOR: Record<string, string> = {
  重要文化財: theme.color.brick,
  登録有形文化財: theme.color.leaf,
  なし: theme.color.path,
};

export function legendColor(id: string): string {
  return COLOR[id] ?? theme.color.path;
}

type Props = {
  shown: Readonly<Record<string, boolean>>;
  onToggle: (id: string) => void;
};

/** 文字のチップは置かない。色の丸が、その区分のオンとオフ。 */
export function CategoryFilter({ shown, onToggle }: Props) {
  return (
    <View style={styles.bar}>
      {designationCategories.map((category) => {
        const on = shown[category.id] !== false;
        const color = legendColor(category.id);
        return (
          <Pressable
            key={category.id}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${category.label}、${on ? '表示' : '非表示'}`}
            testID={`legend-${category.id}`}
            onPress={() => onToggle(category.id)}
            hitSlop={theme.space.xs}
            pressRetentionOffset={theme.space.md}
            style={({ pressed }) => [styles.hit, pressed ? styles.hitPressed : null]}
          >
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: color,
                  width: on ? theme.space.lg : theme.space.md,
                  height: on ? theme.space.lg : theme.space.md,
                  borderRadius: on ? theme.space.lg / 2 : theme.space.md / 2,
                  opacity: on ? 1 : 0.35,
                },
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.paper,
    boxShadow: theme.shadow.float,
  },
  hit: {
    width: theme.hit,
    height: theme.hit,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
  },
  hitPressed: {
    backgroundColor: theme.color.press,
  },
  dot: {
    borderWidth: theme.border.mark,
    borderColor: theme.color.ink,
  },
});
