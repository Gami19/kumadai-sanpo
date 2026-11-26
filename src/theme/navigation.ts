import { theme } from '@/theme/tokens';

/**
 * スタックヘッダーの共通。
 * バーのタイトルはシステム書体にする。カスタムフォントの大見出しは、
 * Expo Go では欄だけ空くことがある。建物名や人物名は本文側で見出し書体を使う。
 */
export const stackHeaderOptions = {
  headerTintColor: theme.color.ink,
  headerStyle: { backgroundColor: theme.color.paper },
  headerTitleStyle: {
    color: theme.color.ink,
    fontWeight: '700' as const,
  },
  headerShadowVisible: false,
  headerLargeTitleEnabled: false,
  headerBackButtonDisplayMode: 'minimal' as const,
  contentStyle: { backgroundColor: theme.color.paper },
};
