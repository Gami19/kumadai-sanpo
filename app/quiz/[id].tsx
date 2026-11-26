import { useLocalSearchParams } from 'expo-router';

import { QuizPlay } from '@/features/quiz/QuizPlay';

export default function QuizRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const raw = Array.isArray(params.id) ? params.id[0] : params.id;
  return <QuizPlay buildingId={raw ?? ''} />;
}
