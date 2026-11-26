import { router } from 'expo-router';

export type SourceLink = {
  title: string;
  url: string;
};

export type InfoId = 'device' | 'estimated' | 'osm';

export type NoticeRequest =
  | { kind: 'sources'; sources: readonly SourceLink[] }
  | { kind: 'info'; id: InfoId };

let current: NoticeRequest | null = null;

export function peekNotice(): NoticeRequest | null {
  return current;
}

function present(request: NoticeRequest) {
  current = request;
  router.push('/notice');
}

export function openSources(sources: readonly SourceLink[]) {
  present({ kind: 'sources', sources });
}

export function openInfo(id: InfoId) {
  present({ kind: 'info', id });
}
