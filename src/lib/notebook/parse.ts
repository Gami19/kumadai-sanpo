/**
 * さんぽ帳の保存形。
 * 残すのは id と時刻だけ。座標・メモ・クイズ結果は読み捨てる。
 */
export const NOTEBOOK_SCHEMA_VERSION = 1;

export type StampRecord = {
  buildingId: string;
  stampedAt: string;
};

export type FavoriteRecord = {
  id: string;
  savedAt: string;
};

export type NotebookData = {
  schemaVersion: typeof NOTEBOOK_SCHEMA_VERSION;
  stamps: readonly StampRecord[];
  favoriteBuildings: readonly FavoriteRecord[];
  favoritePeople: readonly FavoriteRecord[];
};

export const EMPTY_NOTEBOOK: NotebookData = {
  schemaVersion: NOTEBOOK_SCHEMA_VERSION,
  stamps: [],
  favoriteBuildings: [],
  favoritePeople: [],
};

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const COORDINATE_KEYS = ['lat', 'lon', 'latitude', 'longitude', 'coordinates', 'location', 'accuracy'];

const TIME_FORMAT = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasCoordinate(record: Record<string, unknown>): boolean {
  return COORDINATE_KEYS.some((key) => key in record);
}

function isTime(value: string): boolean {
  return value.length > 0 && value.length < 40 && Number.isFinite(Date.parse(value));
}

function laterTime(current: string, next: string): boolean {
  return Date.parse(next) >= Date.parse(current);
}

function dedupeStamps(stamps: readonly StampRecord[]): StampRecord[] {
  const byId = new Map<string, StampRecord>();
  for (const stamp of stamps) {
    const previous = byId.get(stamp.buildingId);
    if (previous == null || laterTime(previous.stampedAt, stamp.stampedAt)) {
      byId.set(stamp.buildingId, stamp);
    }
  }
  return [...byId.values()];
}

function dedupeFavorites(favorites: readonly FavoriteRecord[]): FavoriteRecord[] {
  const byId = new Map<string, FavoriteRecord>();
  for (const favorite of favorites) {
    const previous = byId.get(favorite.id);
    if (previous == null || laterTime(previous.savedAt, favorite.savedAt)) {
      byId.set(favorite.id, favorite);
    }
  }
  return [...byId.values()];
}

function parseStamp(value: unknown): StampRecord | null {
  if (!isRecord(value) || hasCoordinate(value)) {
    return null;
  }
  if (typeof value.buildingId !== 'string' || !ID_PATTERN.test(value.buildingId)) {
    return null;
  }
  if (typeof value.stampedAt !== 'string' || !isTime(value.stampedAt)) {
    return null;
  }
  return { buildingId: value.buildingId, stampedAt: value.stampedAt };
}

function parseFavorite(value: unknown): FavoriteRecord | null {
  if (!isRecord(value) || hasCoordinate(value)) {
    return null;
  }
  if (typeof value.id !== 'string' || !ID_PATTERN.test(value.id)) {
    return null;
  }
  if (typeof value.savedAt !== 'string' || !isTime(value.savedAt)) {
    return null;
  }
  return { id: value.id, savedAt: value.savedAt };
}

function parseList<T>(value: unknown, parseItem: (item: unknown) => T | null): readonly T[] | null {
  if (value == null) {
    return [];
  }
  if (!Array.isArray(value)) {
    return null;
  }
  return value.flatMap((item) => {
    const parsed = parseItem(item);
    return parsed == null ? [] : [parsed];
  });
}

/** 壊れた JSON や未知の形は空にする。アプリは落とさない。 */
export function parseNotebookData(raw: unknown): NotebookData {
  if (raw == null) {
    return EMPTY_NOTEBOOK;
  }
  let value: unknown = raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
      return EMPTY_NOTEBOOK;
    }
    try {
      value = JSON.parse(trimmed) as unknown;
    } catch {
      return EMPTY_NOTEBOOK;
    }
  }
  if (!isRecord(value) || value.schemaVersion !== NOTEBOOK_SCHEMA_VERSION || hasCoordinate(value)) {
    return EMPTY_NOTEBOOK;
  }
  const stamps = parseList(value.stamps, parseStamp);
  const favoriteBuildings = parseList(value.favoriteBuildings, parseFavorite);
  const favoritePeople = parseList(value.favoritePeople, parseFavorite);
  if (stamps == null || favoriteBuildings == null || favoritePeople == null) {
    return EMPTY_NOTEBOOK;
  }
  return {
    schemaVersion: NOTEBOOK_SCHEMA_VERSION,
    stamps: dedupeStamps(stamps),
    favoriteBuildings: dedupeFavorites(favoriteBuildings),
    favoritePeople: dedupeFavorites(favoritePeople),
  };
}

export function formatNotebookTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '時刻を表示できません';
  }
  return TIME_FORMAT.format(date);
}

export function isNotebookId(value: string): boolean {
  return ID_PATTERN.test(value);
}
