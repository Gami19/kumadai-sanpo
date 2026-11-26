import { Stack } from 'expo-router';

import { DeviceOnlyMark } from '@/components/DeviceOnlyMark';
import { stackHeaderOptions } from '@/theme/navigation';

export default function NotebookTabLayout() {
  return (
    <Stack screenOptions={stackHeaderOptions}>
      <Stack.Screen
        name="index"
        options={{
          title: 'さんぽ帳',
          headerLargeTitleEnabled: true,
          headerRight: () => <DeviceOnlyMark />,
        }}
      />
    </Stack>
  );
}
