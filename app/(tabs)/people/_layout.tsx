import { Stack } from 'expo-router';

import { stackHeaderOptions } from '@/theme/navigation';

export default function PeopleTabLayout() {
  return (
    <Stack screenOptions={stackHeaderOptions}>
      <Stack.Screen name="index" options={{ title: '人物', headerLargeTitleEnabled: true }} />
    </Stack>
  );
}
