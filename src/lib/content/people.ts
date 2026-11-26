import type { ContentSource } from './buildings';

import peopleDocument from '../../../content/people.json';

/** 配信先が未設定のときは null。建物と同じく、Worker からの差し替え口だけを開ける。 */
export function contentPeopleUrl(): string | null {
  const base = process.env.EXPO_PUBLIC_CONTENT_URL?.trim() ?? '';
  if (base.length === 0) {
    return null;
  }
  return `${base.replace(/\/$/, '')}/people.json`;
}

export type Person = {
  id: string;
  name: string;
  /** ひらがな。公式のルビが無いときは「未確認」。 */
  reading: string;
  /** 別名。無ければ空文字。 */
  nameAlt: string;
  /** 西暦4桁、または「未確認」。 */
  birthYear: string;
  /** 西暦4桁、または「未確認」。 */
  deathYear: string;
  role: string;
  period: string;
  predecessorSchool: string;
  summary: string;
  facts: readonly string[];
  relatedBuildingIds: readonly string[];
  sources: readonly ContentSource[];
};

const UNCONFIRMED = '未確認';
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const YEAR_PATTERN = /^\d{4}$/;
const READING_CHARS = /^[\u3040-\u309f\u30a0-\u30ffー・ 　]+$/;
const READING_KANA = /[\u3040-\u309f\u30a0-\u30ff]/;

const PERSON_KEYS = [
  'id',
  'name',
  'reading',
  'nameAlt',
  'birthYear',
  'deathYear',
  'role',
  'period',
  'predecessorSchool',
  'summary',
  'facts',
  'relatedBuildingIds',
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

function requireYear(value: string, label: string, key: string): string {
  if (value !== UNCONFIRMED && !YEAR_PATTERN.test(value)) {
    throw new Error(`${label} の ${key} は西暦4桁か「未確認」です: ${value}`);
  }
  return value;
}

function requireReading(value: string, label: string): string {
  if (value === UNCONFIRMED) {
    return value;
  }
  if (!READING_CHARS.test(value) || !READING_KANA.test(value)) {
    throw new Error(`${label} の読みはひらがな・カタカナか「未確認」です`);
  }
  return value;
}

function parsePerson(value: unknown, index: number): Person {
  if (!isRecord(value)) {
    throw new Error(`people[${index}] がオブジェクトではありません`);
  }
  for (const key of COORDINATE_KEYS) {
    if (key in value) {
      throw new Error(`人物データに座標 ${key} は置きません`);
    }
  }
  const id = requireString(value, 'id', `people[${index}]`);
  const label = id.length > 0 ? id : `people[${index}]`;
  for (const key of Object.keys(value)) {
    if (!(PERSON_KEYS as readonly string[]).includes(key)) {
      throw new Error(`${label} に未知の項目があります: ${key}`);
    }
  }
  if (!ID_PATTERN.test(id)) {
    throw new Error(`人物 id が不正です: ${id}`);
  }
  const name = requireString(value, 'name', label);
  if (name.length === 0) {
    throw new Error(`${label} の名称が空です`);
  }
  const summary = requireString(value, 'summary', label);
  if (summary.length < 20) {
    throw new Error(`${label} の説明が短すぎます`);
  }
  const role = requireString(value, 'role', label);
  const period = requireString(value, 'period', label);
  const predecessorSchool = requireString(value, 'predecessorSchool', label);
  if (role.length === 0 || period.length === 0 || predecessorSchool.length === 0) {
    throw new Error(`${label} の関わりが空です。「未確認」と書いてください`);
  }
  if (!Array.isArray(value.facts) || value.facts.length === 0) {
    throw new Error(`${label} のエピソードがありません`);
  }
  const facts = value.facts.map((fact) => {
    if (typeof fact !== 'string' || fact.trim().length === 0) {
      throw new Error(`${label} のエピソードが空です`);
    }
    return fact.trim();
  });
  if (!Array.isArray(value.relatedBuildingIds)) {
    throw new Error(`${label} の relatedBuildingIds が配列ではありません`);
  }
  const relatedBuildingIds = value.relatedBuildingIds.map((buildingId) => {
    if (typeof buildingId !== 'string' || !ID_PATTERN.test(buildingId)) {
      throw new Error(`${label} の建物 id が不正です`);
    }
    return buildingId;
  });
  if (new Set(relatedBuildingIds).size !== relatedBuildingIds.length) {
    throw new Error(`${label} の建物 id が重複しています`);
  }
  if (!Array.isArray(value.sources) || value.sources.length === 0) {
    throw new Error(`${label} の出典がありません`);
  }
  return {
    id,
    name,
    reading: requireReading(requireString(value, 'reading', label), label),
    nameAlt: requireString(value, 'nameAlt', label),
    birthYear: requireYear(requireString(value, 'birthYear', label), label, 'birthYear'),
    deathYear: requireYear(requireString(value, 'deathYear', label), label, 'deathYear'),
    role,
    period,
    predecessorSchool,
    summary,
    facts,
    relatedBuildingIds,
    sources: value.sources.map((source) => parseSource(source, label)),
  };
}

export function parsePeopleDocument(value: unknown): readonly Person[] {
  if (!isRecord(value)) {
    throw new Error('people.json がオブジェクトではありません');
  }
  if (value.schemaVersion !== 1) {
    throw new Error('people.json の schemaVersion が 1 ではありません');
  }
  if (!Array.isArray(value.people)) {
    throw new Error('people.json に people 配列がありません');
  }
  const people = value.people.map((person, index) => parsePerson(person, index));
  const seen = new Set<string>();
  for (const person of people) {
    if (seen.has(person.id)) {
      throw new Error(`人物 id が重複しています: ${person.id}`);
    }
    seen.add(person.id);
  }
  return people;
}

export const bundledPeople: readonly Person[] = parsePeopleDocument(peopleDocument);

/**
 * EXPO_PUBLIC_CONTENT_URL があれば `{URL}/people.json` を読む。
 * 未設定・失敗・形式違いのときは同梱 JSON に戻す。
 */
export async function loadPeople(): Promise<readonly Person[]> {
  const url = contentPeopleUrl();
  if (url == null) {
    return bundledPeople;
  }
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return bundledPeople;
    }
    return parsePeopleDocument(await response.json());
  } catch {
    return bundledPeople;
  }
}
