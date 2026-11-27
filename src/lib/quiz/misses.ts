import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

/**
 * 間違えた問題 id を建物ごとに残す。成績キーとは別。
 * 形: { [buildingId]: string[] }。ネットワークへは送らない。
 */
export const QUIZ_MISSES_KEY = 'kumadai-sanpo/quiz-misses/v1';

export type QuizMissMap = Readonly<Record<string, readonly string[]>>;

type Listener = () => void;

let cache: QuizMissMap | null = null;
let queue: Promise<void> = Promise.resolve();
const listeners = new Set<Listener>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== 'string') {
      continue;
    }
    const id = item.trim();
    if (id.length === 0 || seen.has(id)) {
      continue;
    }
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

function parseStored(value: unknown): QuizMissMap {
  if (!isRecord(value)) {
    return {};
  }
  const map: Record<string, readonly string[]> = {};
  for (const [buildingId, raw] of Object.entries(value)) {
    if (buildingId.length === 0) {
      continue;
    }
    const ids = parseIds(raw);
    if (ids.length > 0) {
      map[buildingId] = ids;
    }
  }
  return map;
}

async function readStore(): Promise<QuizMissMap> {
  try {
    const raw = await AsyncStorage.getItem(QUIZ_MISSES_KEY);
    if (raw == null) {
      return {};
    }
    return parseStored(JSON.parse(raw) as unknown);
  } catch {
    return {};
  }
}

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export function loadQuizMisses(): Promise<QuizMissMap> {
  const job = queue.then(async () => {
    if (cache != null) {
      return cache;
    }
    cache = await readStore();
    return cache;
  });
  queue = job.then(
    () => undefined,
    () => undefined,
  );
  return job;
}

export function missCountFor(misses: QuizMissMap, buildingId: string): number {
  return misses[buildingId]?.length ?? 0;
}

export function missIdsFor(misses: QuizMissMap, buildingId: string): readonly string[] {
  return misses[buildingId] ?? [];
}

/**
 * 不正解の問題 id を足す。すでにあればそのまま。
 * 成績（quiz-results/v1）には触らない。
 */
export function recordQuizMiss(buildingId: string, questionId: string): Promise<void> {
  if (buildingId.length === 0 || questionId.length === 0) {
    return Promise.resolve();
  }
  const job = queue.then(async () => {
    const current = cache ?? (await readStore());
    const previous = current[buildingId] ?? [];
    if (previous.includes(questionId)) {
      cache = current;
      return;
    }
    const next: QuizMissMap = {
      ...current,
      [buildingId]: [...previous, questionId],
    };
    await AsyncStorage.setItem(QUIZ_MISSES_KEY, JSON.stringify(next));
    cache = next;
    notify();
  });
  queue = job.then(
    () => undefined,
    () => undefined,
  );
  return job;
}

/**
 * 正解した問題 id を復習リストから外す。
 * 復習モードでも通常プレイでも呼ぶ。空になった建物はキーごと消す。
 */
export function clearQuizMiss(buildingId: string, questionId: string): Promise<void> {
  if (buildingId.length === 0 || questionId.length === 0) {
    return Promise.resolve();
  }
  const job = queue.then(async () => {
    const current = cache ?? (await readStore());
    const previous = current[buildingId];
    if (previous == null || !previous.includes(questionId)) {
      cache = current;
      return;
    }
    const remaining = previous.filter((id) => id !== questionId);
    const next: Record<string, readonly string[]> = { ...current };
    if (remaining.length === 0) {
      delete next[buildingId];
    } else {
      next[buildingId] = remaining;
    }
    await AsyncStorage.setItem(QUIZ_MISSES_KEY, JSON.stringify(next));
    cache = next;
    notify();
  });
  queue = job.then(
    () => undefined,
    () => undefined,
  );
  return job;
}

/** 読み込み前は空。保存すると、開いたままの一覧も更新される。 */
export function useQuizMisses(): { ready: boolean; misses: QuizMissMap } {
  const [misses, setMisses] = useState<QuizMissMap>(cache ?? {});
  const [ready, setReady] = useState(cache != null);

  useEffect(() => {
    let cancelled = false;
    const listener = () => {
      if (cache != null) {
        setMisses(cache);
        setReady(true);
      }
    };
    listeners.add(listener);
    void loadQuizMisses().then(
      () => {
        if (!cancelled && cache != null) {
          setMisses(cache);
          setReady(true);
        }
      },
      () => {
        if (!cancelled) {
          setReady(true);
        }
      },
    );
    return () => {
      cancelled = true;
      listeners.delete(listener);
    };
  }, []);

  return { ready, misses };
}
