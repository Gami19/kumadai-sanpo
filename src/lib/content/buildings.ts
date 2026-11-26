import buildingsDocument from '../../../content/buildings.json';

/** 配信先が未設定のときは null。Worker は別作業で、ここでは URL の口だけを開ける。 */
export function contentBuildingsUrl(): string | null {
  const base = process.env.EXPO_PUBLIC_CONTENT_URL?.trim() ?? '';
  if (base.length === 0) {
    return null;
  }
  return `${base.replace(/\/$/, '')}/buildings.json`;
}

export const BUILDING_CAMPUSES = ['黒髪北', '黒髪南', '本荘', '大江'] as const;
export const BUILDING_DESIGNATIONS = ['重要文化財', '登録有形文化財', 'なし'] as const;

export type BuildingCampus = (typeof BUILDING_CAMPUSES)[number];
export type BuildingDesignation = (typeof BUILDING_DESIGNATIONS)[number];

export type ContentSource = {
  title: string;
  url: string;
};

export type Building = {
  id: string;
  spotId: string;
  name: string;
  reading: string;
  heritageName: string;
  campus: BuildingCampus;
  designation: BuildingDesignation;
  /** 西暦4桁、または「未確認」。庭園の開設年は yearNote に書き、ここは竣工年だけ。 */
  yearBuilt: string;
  yearNote: string;
  summary: string;
  /** 分かっている見学案内、または「未確認」。 */
  visit: string;
  positionEstimated: boolean;
  relatedPersonIds: readonly string[];
  sources: readonly ContentSource[];
};

const UNCONFIRMED = '未確認';
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const YEAR_PATTERN = /^\d{4}$/;
const READING_PATTERN = /^[\u3040-\u309f\u30a0-\u30ffー（）・]+$/;

const BUILDING_KEYS = [
  'id',
  'spotId',
  'name',
  'reading',
  'heritageName',
  'campus',
  'designation',
  'yearBuilt',
  'yearNote',
  'summary',
  'visit',
  'positionEstimated',
  'relatedPersonIds',
  'sources',
] as const;

const COORDINATE_KEYS = ['lat', 'lon', 'latitude', 'longitude', 'coordinates'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireString(record: Record<string, unknown>, key: string, label: string): string {
  const value = record[key];
  if (typeof value !== 'string') {
    throw new Error(`${label} の ${key} が文字列ではありません`);
  }
  return value.trim();
}

function parseSource(value: unknown, label: string): ContentSource {
  if (!isRecord(value)) {
    throw new Error(`${label} の出典がオブジェクトではありません`);
  }
  const title = requireString(value, 'title', label);
  const url = requireString(value, 'url', label);
  if (title.length === 0 || !url.startsWith('https://')) {
    throw new Error(`${label} の出典は、題名と https の URL が必要です`);
  }
  return { title, url };
}

function parseBuilding(value: unknown, index: number): Building {
  if (!isRecord(value)) {
    throw new Error(`buildings[${index}] がオブジェクトではありません`);
  }
  for (const key of COORDINATE_KEYS) {
    if (key in value) {
      throw new Error(`建物データに座標 ${key} は置きません。緯度経度は spots.csv が正です`);
    }
  }
  const id = requireString(value, 'id', `buildings[${index}]`);
  const label = id.length > 0 ? id : `buildings[${index}]`;
  for (const key of Object.keys(value)) {
    if (!(BUILDING_KEYS as readonly string[]).includes(key)) {
      throw new Error(`${label} に未知の項目があります: ${key}`);
    }
  }
  if (!ID_PATTERN.test(id)) {
    throw new Error(`建物 id が不正です: ${id}`);
  }
  const spotId = requireString(value, 'spotId', label);
  if (spotId !== id) {
    throw new Error(`${label} の spotId が id と違います`);
  }
  const name = requireString(value, 'name', label);
  const reading = requireString(value, 'reading', label);
  if (name.length === 0 || !READING_PATTERN.test(reading)) {
    throw new Error(`${label} の名称か読みが不正です`);
  }
  const campus = requireString(value, 'campus', label);
  if (!(BUILDING_CAMPUSES as readonly string[]).includes(campus)) {
    throw new Error(`${label} のキャンパスが不正です: ${campus}`);
  }
  const designation = requireString(value, 'designation', label);
  if (!(BUILDING_DESIGNATIONS as readonly string[]).includes(designation)) {
    throw new Error(`${label} の文化財指定が不正です: ${designation}`);
  }
  const yearBuilt = requireString(value, 'yearBuilt', label);
  if (yearBuilt !== UNCONFIRMED && !YEAR_PATTERN.test(yearBuilt)) {
    throw new Error(`${label} の竣工年は西暦4桁か「未確認」です: ${yearBuilt}`);
  }
  const yearNote = requireString(value, 'yearNote', label);
  const summary = requireString(value, 'summary', label);
  if (summary.length < 20) {
    throw new Error(`${label} の説明が短すぎます`);
  }
  const visit = requireString(value, 'visit', label);
  if (visit.length === 0) {
    throw new Error(`${label} の見学情報は空にできません。「未確認」と書いてください`);
  }
  if (typeof value.positionEstimated !== 'boolean') {
    throw new Error(`${label} の positionEstimated が真偽値ではありません`);
  }
  if (!Array.isArray(value.relatedPersonIds)) {
    throw new Error(`${label} の relatedPersonIds が配列ではありません`);
  }
  const relatedPersonIds = value.relatedPersonIds.map((personId) => {
    if (typeof personId !== 'string' || !ID_PATTERN.test(personId)) {
      throw new Error(`${label} の人物 id が不正です`);
    }
    return personId;
  });
  if (!Array.isArray(value.sources) || value.sources.length === 0) {
    throw new Error(`${label} の出典がありません`);
  }
  const sources = value.sources.map((source) => parseSource(source, label));
  return {
    id,
    spotId,
    name,
    reading,
    heritageName: requireString(value, 'heritageName', label),
    campus: campus as BuildingCampus,
    designation: designation as BuildingDesignation,
    yearBuilt,
    yearNote,
    summary,
    visit,
    positionEstimated: value.positionEstimated,
    relatedPersonIds,
    sources,
  };
}

export function parseBuildingsDocument(value: unknown): readonly Building[] {
  if (!isRecord(value)) {
    throw new Error('buildings.json がオブジェクトではありません');
  }
  if (value.schemaVersion !== 1) {
    throw new Error('buildings.json の schemaVersion が 1 ではありません');
  }
  if (!Array.isArray(value.buildings)) {
    throw new Error('buildings.json に buildings 配列がありません');
  }
  const buildings = value.buildings.map((building, index) => parseBuilding(building, index));
  const seen = new Set<string>();
  for (const building of buildings) {
    if (seen.has(building.id)) {
      throw new Error(`建物 id が重複しています: ${building.id}`);
    }
    seen.add(building.id);
  }
  return buildings;
}

export const bundledBuildings: readonly Building[] = parseBuildingsDocument(buildingsDocument);

/**
 * EXPO_PUBLIC_CONTENT_URL があれば `{URL}/buildings.json` を読む。
 * 未設定・失敗・形式違いのときは同梱 JSON に戻す。
 */
export async function loadBuildings(): Promise<readonly Building[]> {
  const url = contentBuildingsUrl();
  if (url == null) {
    return bundledBuildings;
  }
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return bundledBuildings;
    }
    return parseBuildingsDocument(await response.json());
  } catch {
    return bundledBuildings;
  }
}
