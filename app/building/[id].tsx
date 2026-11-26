import { useLocalSearchParams } from 'expo-router';

import { BuildingDetail } from '@/features/buildings/BuildingDetail';

export default function BuildingRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const raw = Array.isArray(params.id) ? params.id[0] : params.id;
  return <BuildingDetail id={raw ?? ''} />;
}
