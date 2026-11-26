import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  EMPTY_NOTEBOOK,
  isNotebookId,
  parseNotebookData,
  type NotebookData,
} from './parse';

/** クイズなど別機能の保存キーとぶつからないよう、notebook: で始める。座標は書かない。 */
export const NOTEBOOK_STORAGE_KEY = 'notebook:v1';

export class NotebookStorageError extends Error {
  readonly reason: 'load' | 'save';

  constructor(reason: 'load' | 'save') {
    super(reason);
    this.name = 'NotebookStorageError';
    this.reason = reason;
  }
}

type Snapshot = {
  ready: boolean;
  loadError: boolean;
  data: NotebookData;
};

let snapshot: Snapshot = {
  ready: false,
  loadError: false,
  data: EMPTY_NOTEBOOK,
};

const listeners = new Set<() => void>();
let hydratePromise: Promise<void> | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function emit(next: Snapshot) {
  snapshot = next;
  for (const listener of listeners) {
    listener();
  }
}

export function getNotebookSnapshot(): Snapshot {
  return snapshot;
}

export function subscribeNotebook(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function hydrateNotebook(): Promise<void> {
  if (hydratePromise != null) {
    return hydratePromise;
  }
  hydratePromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(NOTEBOOK_STORAGE_KEY);
      emit({ ready: true, loadError: false, data: parseNotebookData(raw) });
    } catch {
      emit({ ready: true, loadError: true, data: EMPTY_NOTEBOOK });
    }
  })();
  return hydratePromise;
}

function commit(mutator: (current: NotebookData) => NotebookData): Promise<void> {
  const run = async () => {
    await hydrateNotebook();
    if (snapshot.loadError) {
      throw new NotebookStorageError('load');
    }
    const next = mutator(snapshot.data);
    if (next === snapshot.data) {
      return;
    }
    const previous = snapshot;
    emit({ ...snapshot, data: next });
    try {
      await AsyncStorage.setItem(NOTEBOOK_STORAGE_KEY, JSON.stringify(next));
    } catch {
      emit(previous);
      throw new NotebookStorageError('save');
    }
  };
  const queued = writeQueue.then(run);
  writeQueue = queued.then(
    () => undefined,
    () => undefined,
  );
  return queued;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function stampBuilding(buildingId: string): Promise<void> {
  return commit((current) => {
    if (!isNotebookId(buildingId) || current.stamps.some((stamp) => stamp.buildingId === buildingId)) {
      return current;
    }
    return {
      ...current,
      stamps: [...current.stamps, { buildingId, stampedAt: nowIso() }],
    };
  });
}

export function removeStamp(buildingId: string): Promise<void> {
  return commit((current) => {
    if (!current.stamps.some((stamp) => stamp.buildingId === buildingId)) {
      return current;
    }
    return {
      ...current,
      stamps: current.stamps.filter((stamp) => stamp.buildingId !== buildingId),
    };
  });
}

function addFavorite(kind: 'favoriteBuildings' | 'favoritePeople', id: string): Promise<void> {
  return commit((current) => {
    if (!isNotebookId(id) || current[kind].some((item) => item.id === id)) {
      return current;
    }
    return {
      ...current,
      [kind]: [...current[kind], { id, savedAt: nowIso() }],
    };
  });
}

function removeFavorite(kind: 'favoriteBuildings' | 'favoritePeople', id: string): Promise<void> {
  return commit((current) => {
    if (!current[kind].some((item) => item.id === id)) {
      return current;
    }
    return {
      ...current,
      [kind]: current[kind].filter((item) => item.id !== id),
    };
  });
}

export function addFavoriteBuilding(id: string): Promise<void> {
  return addFavorite('favoriteBuildings', id);
}

export function removeFavoriteBuilding(id: string): Promise<void> {
  return removeFavorite('favoriteBuildings', id);
}

export function addFavoritePerson(id: string): Promise<void> {
  return addFavorite('favoritePeople', id);
}

export function removeFavoritePerson(id: string): Promise<void> {
  return removeFavorite('favoritePeople', id);
}
