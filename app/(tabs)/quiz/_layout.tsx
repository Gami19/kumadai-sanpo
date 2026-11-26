import { Stack } from 'expo-router';

import { stackHeaderOptions } from '@/theme/navigation';

export default function QuizTabLayout() {
  return (
    <Stack screenOptions={stackHeaderOptions}>
      <Stack.Screen name="index" options={{ title: 'クイズ' }} />
    </Stack>
  );
}
