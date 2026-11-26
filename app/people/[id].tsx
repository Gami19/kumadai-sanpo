import { Stack, useLocalSearchParams } from 'expo-router';

import { PersonDetail } from '@/features/people/PersonDetail';
import { usePeople } from '@/lib/content/usePeople';

export default function PersonRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const raw = Array.isArray(params.id) ? params.id[0] : params.id;
  const id = raw ?? '';
  const people = usePeople();
  const person = people.find((item) => item.id === id) ?? null;

  return (
    <>
      <Stack.Screen options={{ title: person?.name ?? '人物' }} />
      <PersonDetail id={id} />
    </>
  );
}
