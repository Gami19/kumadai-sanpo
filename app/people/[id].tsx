import { useLocalSearchParams } from 'expo-router';

import { PersonDetail } from '@/features/people/PersonDetail';

export default function PersonRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const raw = Array.isArray(params.id) ? params.id[0] : params.id;
  return <PersonDetail id={raw ?? ''} />;
}
