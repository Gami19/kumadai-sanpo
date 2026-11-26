import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { mergeQuizResult, type QuizResult } from './score';

const STORAGE_KEY = 'kumadai-sanpo/quiz-results/v1';

export type QuizResultMap = Readonly<Record<string, QuizResult>>;

type Listener = () => void;

let cache: QuizResultMap | null = null;
let queue: Promise<void> = Promise.resolve();
const listeners = new Set<Listener>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseStored(value: unknown): QuizResultMap {
  if (!isRecord(value)) {
    return {};
  }
  const map: Record<string, QuizResult> = {};
  for (const [id, raw] of Object.entries(value)) {
    if (!isRecord(raw)) {
      continue;
    }
    const { bestCorrect, total, cleared, playedAt } = raw;
    if (
      typeof bestCorrect !== 'number' ||
      typeof total !== 'number' ||
      typeof cleared !== 'boolean' ||
      typeof playedAt !== 'string' ||
      !Number.isInteger(bestCorrect) ||
      !Number.isInteger(total) ||
      total <= 0 ||
      bestCorrect < 0 ||
      bestCorrect > total
    ) {
      continue;
    }
    map[id] = { bestCorrect, total, cleared, playedAt };
  }
  return map;
}

async function readStore(): Promise<QuizResultMap> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
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

export function loadQuizResults(): Promise<QuizResultMap> {
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

function validScore(correct: number, total: number): boolean {
  return (
    Number.isInteger(correct) &&
    Number.isInteger(total) &&
    total > 0 &&
    correct >= 0 &&
    correct <= total
  );
}

/**
 * 建物ごとの最高点・クリア・日時を、この端末の AsyncStorage だけに書く。
 * ネットワークへは送らない。
 */
export function recordQuizResult(
  buildingId: string,
  correct: number,
  total: number,
): Promise<QuizResult | null> {
  if (!validScore(correct, total) || buildingId.length === 0) {
    return Promise.resolve(null);
  }
  const playedAt = new Date().toISOString();
  const job = queue.then(async () => {
    const current = cache ?? (await readStore());
    const nextRecord = mergeQuizResult(current[buildingId], correct, total, playedAt);
    const next: QuizResultMap = { ...current, [buildingId]: nextRecord };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    cache = next;
    notify();
    return nextRecord;
  });
  queue = job.then(
    () => undefined,
    () => undefined,
  );
  return job;
}

/** 読み込み前は空。保存すると、開いたままの一覧も更新される。 */
export function useQuizResults(): { ready: boolean; results: QuizResultMap } {
  const [results, setResults] = useState<QuizResultMap>(cache ?? {});
  const [ready, setReady] = useState(cache != null);

  useEffect(() => {
    let cancelled = false;
    const listener = () => {
      if (cache != null) {
        setResults(cache);
        setReady(true);
      }
    };
    listeners.add(listener);
    void loadQuizResults().then(
      () => {
        if (!cancelled && cache != null) {
          setResults(cache);
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

  return { ready, results };
}
