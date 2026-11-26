import { ZenMaruGothic_700Bold } from '@expo-google-fonts/zen-maru-gothic/700Bold';
import { useFonts } from 'expo-font';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { UndoProvider } from '@/components/UndoToast';
import { stackHeaderOptions } from '@/theme/navigation';
import { theme } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export const unstable_settings = {
  anchor: '(tabs)',
};

const picturebookTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: theme.color.leafDark,
    background: theme.color.paper,
    card: theme.color.paper,
    text: theme.color.ink,
    border: theme.color.separator,
    notification: theme.color.brick,
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    [theme.font.heading]: ZenMaruGothic_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [loaded, error]);

  if (!loaded && error == null) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <UndoProvider>
        <ThemeProvider value={picturebookTheme}>
          <StatusBar style="dark" />
          <Stack screenOptions={stackHeaderOptions}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="notice"
              options={{
                presentation: 'formSheet',
                sheetAllowedDetents: [0.45, 0.9],
                sheetGrabberVisible: true,
                title: '説明',
              }}
            />
          </Stack>
        </ThemeProvider>
      </UndoProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.color.paper,
  },
});
