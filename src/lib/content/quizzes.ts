import type { ContentSource } from './buildings';
import quizzesDocument from '../../../content/quizzes.json';

import { fetchContentJson } from './fetchTimeout';

/** 配信先が未設定のときは null。建物本文と同じく、URL の口だけを開ける。 */
export function contentQuizzesUrl(): string | null {
  const base = process.env.EXPO_PUBLIC_CONTENT_URL?.trim() ?? '';
  if (base.length === 0) {
    return null;
  }
  return `${base.replace(/\/$/, '')}/quizzes.json`;
}

export const QUIZ_ROLES = ['primary', 'reserve'] as const;
export type QuizRole = (typeof QUIZ_ROLES)[number];

export type QuizQuestion = {
  id: string;
  buildingId: string;
  /** primary が第1版の3問。reserve は同梱するが、出題には使わない。 */
  role: QuizRole;
  prompt: string;
  choices: readonly [string, string, string, string];
  answerIndex: 0 | 1 | 2 | 3;
  explanation: string;
  sources: readonly ContentSource[];
};

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const QUESTION_KEYS = [
  'id',
  'buildingId',
  'role',
  'prompt',
  'choices',
  'answerIndex',
  'explanation',
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

function parseAnswerIndex(value: unknown, label: string): 0 | 1 | 2 | 3 {
  if (value === 0 || value === 1 || value === 2 || value === 3) {
    return value;
  }
  throw new Error(`${label} の正解 index が 0 から 3 の整数ではありません`);
}

function parseQuestion(value: unknown, index: number): QuizQuestion {
  if (!isRecord(value)) {
    throw new Error(`questions[${index}] がオブジェクトではありません`);
  }
  for (const key of COORDINATE_KEYS) {
    if (key in value) {
      throw new Error(`クイズに座標 ${key} は置きません`);
    }
  }
  const id = requireString(value, 'id', `questions[${index}]`);
  const label = id.length > 0 ? id : `questions[${index}]`;
  for (const key of Object.keys(value)) {
    if (!(QUESTION_KEYS as readonly string[]).includes(key)) {
      throw new Error(`${label} に未知の項目があります: ${key}`);
    }
  }
  if (!ID_PATTERN.test(id)) {
    throw new Error(`問題 id が不正です: ${id}`);
  }
  const buildingId = requireString(value, 'buildingId', label);
  if (!ID_PATTERN.test(buildingId)) {
    throw new Error(`${label} の buildingId が不正です: ${buildingId}`);
  }
  const role = requireString(value, 'role', label);
  if (!(QUIZ_ROLES as readonly string[]).includes(role)) {
    throw new Error(`${label} の role が不正です: ${role}`);
  }
  const prompt = requireString(value, 'prompt', label);
  if (prompt.length === 0) {
    throw new Error(`${label} の問題文が空です`);
  }
  if (!Array.isArray(value.choices) || value.choices.length !== 4) {
    throw new Error(`${label} の選択肢は4つ必要です`);
  }
  const choices = value.choices.map((choice) => {
    if (typeof choice !== 'string' || choice.trim().length === 0) {
      throw new Error(`${label} の選択肢が空です`);
    }
    return choice.trim();
  });
  if (new Set(choices).size !== choices.length) {
    throw new Error(`${label} の選択肢が重複しています`);
  }
  const answerIndex = parseAnswerIndex(value.answerIndex, label);
  const explanation = requireString(value, 'explanation', label);
  if (explanation.length === 0) {
    throw new Error(`${label} の解説が空です`);
  }
  if (!Array.isArray(value.sources) || value.sources.length === 0) {
    throw new Error(`${label} の出典がありません`);
  }
  const sources = value.sources.map((source) => parseSource(source, label));
  const [first, second, third, fourth] = choices;
  if (first == null || second == null || third == null || fourth == null) {
    throw new Error(`${label} の選択肢は4つ必要です`);
  }
  return {
    id,
    buildingId,
    role: role as QuizRole,
    prompt,
    choices: [first, second, third, fourth],
    answerIndex,
    explanation,
    sources,
  };
}

export function parseQuizzesDocument(value: unknown): readonly QuizQuestion[] {
  if (!isRecord(value)) {
    throw new Error('quizzes.json がオブジェクトではありません');
  }
  if (value.schemaVersion !== 1) {
    throw new Error('quizzes.json の schemaVersion が 1 ではありません');
  }
  if (!Array.isArray(value.questions)) {
    throw new Error('quizzes.json に questions 配列がありません');
  }
  const questions = value.questions.map((question, index) => parseQuestion(question, index));
  const seen = new Set<string>();
  for (const question of questions) {
    if (seen.has(question.id)) {
      throw new Error(`問題 id が重複しています: ${question.id}`);
    }
    seen.add(question.id);
  }
  return questions;
}

export const bundledQuizzes: readonly QuizQuestion[] = parseQuizzesDocument(quizzesDocument);

/** 第1版で出題する3問。予備（reserve）は含めない。 */
export function primaryQuestionsFor(
  questions: readonly QuizQuestion[],
  buildingId: string,
): QuizQuestion[] {
  return questions.filter(
    (question) => question.buildingId === buildingId && question.role === 'primary',
  );
}

/**
 * EXPO_PUBLIC_CONTENT_URL があれば `{URL}/quizzes.json` を読む。
 * 未設定・失敗・形式違いのときは同梱 JSON に戻す。
 */
export async function loadQuizzes(): Promise<readonly QuizQuestion[]> {
  const url = contentQuizzesUrl();
  if (url == null) {
    return bundledQuizzes;
  }
  try {
    const response = await fetchContentJson(url);
    if (!response.ok) {
      return bundledQuizzes;
    }
    return parseQuizzesDocument(await response.json());
  } catch {
    return bundledQuizzes;
  }
}
