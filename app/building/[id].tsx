import { Stack, useLocalSearchParams } from 'expo-router';

import { BuildingDetail } from '@/features/buildings/BuildingDetail';
import { useBuildings } from '@/lib/content/useBuildings';

export default function BuildingRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const raw = Array.isArray(params.id) ? params.id[0] : params.id;
  const id = raw ?? '';
  const buildings = useBuildings();
  const building = buildings.find((item) => item.id === id) ?? null;

  return (
    <>
      <Stack.Screen
        options={{ title: building?.name ?? '建物', headerLargeTitleEnabled: true }}
      />
      <BuildingDetail id={id} />
    </>
  );
}
