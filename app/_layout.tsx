import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { theme } from '@/theme/tokens';

const picturebookTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: theme.color.moss,
    background: theme.color.paper,
    card: theme.color.card,
    text: theme.color.ink,
    border: theme.color.line,
    notification: theme.color.clay,
  },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={picturebookTheme}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}
