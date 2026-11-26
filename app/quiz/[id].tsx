import { Stack, useLocalSearchParams } from 'expo-router';

import { QuizPlay } from '@/features/quiz/QuizPlay';
import { useBuildings } from '@/lib/content/useBuildings';

export default function QuizRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const raw = Array.isArray(params.id) ? params.id[0] : params.id;
  const id = raw ?? '';
  const buildings = useBuildings();
  const building = buildings.find((item) => item.id === id) ?? null;

  return (
    <>
      <Stack.Screen options={{ title: building?.name ?? 'クイズ' }} />
      <QuizPlay buildingId={id} />
    </>
  );
}
