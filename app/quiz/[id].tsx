import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import { QuizPlay, type QuizMode } from '@/features/quiz/QuizPlay';
import { useBuildings } from '@/lib/content/useBuildings';

function readParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

export default function QuizRoute() {
  const params = useLocalSearchParams<{
    id?: string | string[];
    mode?: string | string[];
    q?: string | string[];
  }>();
  const id = readParam(params.id);
  const modeParam = readParam(params.mode);
  const mode: QuizMode = modeParam === 'review' ? 'review' : 'play';
  const reviewQuestionIds = useMemo(
    () =>
      readParam(params.q)
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    [params.q],
  );
  const buildings = useBuildings();
  const building = buildings.find((item) => item.id === id) ?? null;

  return (
    <>
      <Stack.Screen options={{ title: building?.name ?? (mode === 'review' ? '復習' : 'クイズ') }} />
      <QuizPlay buildingId={id} mode={mode} reviewQuestionIds={reviewQuestionIds} />
    </>
  );
}
