import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';

import { theme } from '@/theme/tokens';

export type IconName =
  | 'chevron.right'
  | 'info.circle'
  | 'link'
  | 'iphone'
  | 'heart'
  | 'heart.fill'
  | 'checkmark'
  | 'arrow.uturn.backward';

const symbols = {
  'chevron.right': { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  'info.circle': { ios: 'info.circle', android: 'info', web: 'info' },
  link: { ios: 'link', android: 'link', web: 'link' },
  iphone: { ios: 'iphone', android: 'smartphone', web: 'smartphone' },
  heart: { ios: 'heart', android: 'favorite_border', web: 'favorite_border' },
  'heart.fill': { ios: 'heart.fill', android: 'favorite', web: 'favorite' },
  checkmark: { ios: 'checkmark', android: 'check', web: 'check' },
  'arrow.uturn.backward': { ios: 'arrow.uturn.backward', android: 'undo', web: 'undo' },
} as const satisfies Record<IconName, { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol }>;

type Props = {
  name: IconName;
  size?: number;
  color?: string;
};

/** 操作用アイコン。iOS は SF Symbols、Android と Web は Material。 */
export function Icon({ name, size = 20, color = theme.color.ink }: Props) {
  return (
    <SymbolView
      name={symbols[name]}
      size={size}
      tintColor={color}
      resizeMode="scaleAspectFit"
      weight="regular"
    />
  );
}
