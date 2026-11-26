import { theme } from '@/theme/tokens';

/** スタックヘッダーの共通。大見出しの書体だけ見出しフォントにする。 */
export const stackHeaderOptions = {
  headerTintColor: theme.color.ink,
  headerStyle: { backgroundColor: theme.color.paper },
  headerTitleStyle: {
    fontFamily: theme.font.heading,
    color: theme.color.ink,
  },
  headerLargeTitleStyle: {
    fontFamily: theme.font.heading,
    color: theme.color.ink,
  },
  headerShadowVisible: false,
  headerBackButtonDisplayMode: 'minimal' as const,
  contentStyle: { backgroundColor: theme.color.paper },
};
