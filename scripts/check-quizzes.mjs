import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { bundledBuildings } from '../src/lib/content/buildings.ts';
import {
  bundledQuizzes,
  contentQuizzesUrl,
  parseQuizzesDocument,
  primaryQuestionsFor,
} from '../src/lib/content/quizzes.ts';
import { buildingsInCampusOrder } from '../src/lib/quiz/order.ts';
import { buildPlayQuestions } from '../src/lib/quiz/play.ts';
import { formatQuizPlayedAt, mergeQuizResult, quizCleared } from '../src/lib/quiz/score.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

function fail(message) {
  failures.push(message);
}

function expectThrow(label, run) {
  try {
    run();
  } catch {
    return;
  }
  fail(`${label} を拒否していません`);
}

const raw = readFileSync(join(root, 'content/quizzes.json'), 'utf8');
for (const token of ['"lat"', '"lon"', '"latitude"', '"longitude"', '32.7953', '130.7108']) {
  if (raw.includes(token)) {
    fail(`quizzes.json に座標の記述があります: ${token}`);
  }
}
for (const token of ['文書館', 'bunshokan', 'フクロウ', '1000種', '1,000種', '1500種', '1,500種', '2000種', '2,000種']) {
  if (raw.includes(token)) {
    fail(`クイズに出さない記述があります: ${token}`);
  }
}

const buildingIds = new Set(bundledBuildings.map((building) => building.id));
const document = JSON.parse(raw);
if (document.schemaVersion !== 1) {
  fail('quizzes.json の schemaVersion が 1 ではありません');
}
if (!Array.isArray(document.questions)) {
  fail('quizzes.json に questions 配列がありません');
}

const reserveIds = ['kougaku-shiryokan-q4', 'yakuyo-shokubutsuen-q4'];
const questions = Array.isArray(document.questions) ? document.questions : [];

for (const question of questions) {
  const id = typeof question.id === 'string' ? question.id : '(idなし)';
  if (!buildingIds.has(question.buildingId)) {
    fail(`${id} の buildingId「${question.buildingId}」が buildings.json にありません`);
  }
  if (!Array.isArray(question.choices) || question.choices.length !== 4) {
    fail(`${id} の選択肢は4つ必要です`);
  }
  if (![0, 1, 2, 3].includes(question.answerIndex)) {
    fail(`${id} の正解 index が 0 から 3 の整数ではありません`);
  }
  if (!Array.isArray(question.sources) || question.sources.length === 0) {
    fail(`${id} の出典がありません`);
  } else {
    for (const source of question.sources) {
      if (typeof source?.title !== 'string' || source.title.trim().length === 0) {
        fail(`${id} の出典に題名がありません`);
      }
      if (typeof source?.url !== 'string' || !source.url.startsWith('https://')) {
        fail(`${id} の出典 URL が https ではありません`);
      }
    }
  }
}

if (bundledQuizzes.length !== questions.length) {
  fail(`読み込んだ問題数 ${bundledQuizzes.length} と JSON の件数 ${questions.length} が違います`);
}

for (const building of bundledBuildings) {
  const primary = primaryQuestionsFor(bundledQuizzes, building.id);
  if (primary.length !== 3) {
    fail(`${building.name} の本番問題は3問必要です（${primary.length}）`);
  }
  for (const question of primary) {
    if (question.prompt.includes('未確認') || question.explanation.includes('未確認')) {
      fail(`${question.id} に未確認事項を出題しています`);
    }
    if (question.choices.some((choice) => choice.includes('未確認'))) {
      fail(`${question.id} の選択肢に未確認があります`);
    }
  }
  if (building.id === 'ooe-campus') {
    for (const question of primary) {
      if (question.prompt.includes('竣工')) {
        fail(`${question.id} は大江キャンパスの竣工年を問っています`);
      }
    }
  }
}

for (const question of bundledQuizzes) {
  if (question.buildingId !== 'kougaku-shiryokan') {
    continue;
  }
  const blob = [question.prompt, question.explanation, ...question.choices].join('\n');
  if (blob.includes('1909') || blob.includes('明治42')) {
    fail(`${question.id} に、機械実験工場の1909年表記があります`);
  }
}

for (const id of reserveIds) {
  const question = bundledQuizzes.find((item) => item.id === id);
  if (question == null || question.role !== 'reserve') {
    fail(`${id} は予備問題である必要があります`);
  }
}
const reserves = bundledQuizzes.filter((question) => question.role === 'reserve');
if (reserves.length !== reserveIds.length) {
  fail(`予備問題は ${reserveIds.length} 問です（${reserves.length}）`);
}
for (const building of bundledBuildings) {
  const leaked = primaryQuestionsFor(bundledQuizzes, building.id).some((question) =>
    reserveIds.includes(question.id),
  );
  if (leaked) {
    fail(`${building.name} の出題に予備問題が入っています`);
  }
}

const campusOrder = buildingsInCampusOrder(bundledBuildings).map((building) => building.id);
const expectedOrder = [
  'goko-kinenkan',
  'kagaku-jikkenjo',
  'akamon',
  'honbu',
  'kougaku-shiryokan',
  'yamazaki-kinenkan',
  'ooe-campus',
  'yakuyo-shokubutsuen',
];
if (campusOrder.join() !== expectedOrder.join()) {
  fail(`キャンパス順が違います: ${campusOrder.join('、')}`);
}

for (const building of bundledBuildings) {
  const primary = primaryQuestionsFor(bundledQuizzes, building.id);
  const forward = buildPlayQuestions(primary, () => 0);
  const backward = buildPlayQuestions(primary, () => 0.999999);
  if (forward.length !== 3 || backward.length !== 3) {
    fail(`${building.name} の出題が3問ではありません`);
  }
  for (const played of [forward, backward]) {
    const ids = new Set(played.map((item) => item.id));
    if (ids.size !== primary.length) {
      fail(`${building.name} の並べ替えで問題が欠けています`);
    }
    for (const item of played) {
      const correct = item.choices.filter((choice) => choice.correct);
      if (item.choices.length !== 4 || correct.length !== 1) {
        fail(`${item.id} の正解が一つではありません`);
      }
    }
  }
  const sameQuestions = forward.map((item) => item.id).join() === backward.map((item) => item.id).join();
  const sameChoices =
    forward[0]?.choices.map((choice) => choice.text).join() ===
    backward[0]?.choices.map((choice) => choice.text).join();
  if (sameQuestions && sameChoices) {
    fail(`${building.name} は乱数を変えても並びが変わりません`);
  }
}

if (!quizCleared(2, 3) || !quizCleared(3, 3) || quizCleared(1, 3) || quizCleared(0, 3)) {
  fail('3問中2問以上のクリア判定が違います');
}
const first = mergeQuizResult(undefined, 1, 3, '2026-11-26T00:00:00.000Z');
if (first.cleared || first.bestCorrect !== 1) {
  fail('1問ではクリアになりません');
}
const cleared = mergeQuizResult(first, 2, 3, '2026-11-26T01:00:00.000Z');
if (!cleared.cleared || cleared.bestCorrect !== 2 || cleared.playedAt !== '2026-11-26T01:00:00.000Z') {
  fail('再挑戦でクリアと最高点が残っていません');
}
const kept = mergeQuizResult(cleared, 3, 3, '2026-11-26T02:00:00.000Z');
const lower = mergeQuizResult(kept, 1, 3, '2026-11-26T03:00:00.000Z');
if (lower.bestCorrect !== 3 || lower.total !== 3 || !lower.cleared || lower.playedAt !== '2026-11-26T03:00:00.000Z') {
  fail('最高点かクリアが、低い得点で消えています');
}
const playedAt = '2026-11-26T11:46:00.000Z';
const playedDate = new Date(playedAt);
const expectedPlayedAt = `${playedDate.getFullYear()}年${playedDate.getMonth() + 1}月${playedDate.getDate()}日 ${String(playedDate.getHours()).padStart(2, '0')}:${String(playedDate.getMinutes()).padStart(2, '0')}`;
if (formatQuizPlayedAt(playedAt) !== expectedPlayedAt || formatQuizPlayedAt('not-a-date') !== '') {
  fail('成績の日時の表示が違います');
}

const previousUrl = process.env.EXPO_PUBLIC_CONTENT_URL;
try {
  process.env.EXPO_PUBLIC_CONTENT_URL = 'https://cdn.example.com/kumadai/';
  if (contentQuizzesUrl() !== 'https://cdn.example.com/kumadai/quizzes.json') {
    fail('配信 URL から quizzes.json を組み立てていません');
  }
  process.env.EXPO_PUBLIC_CONTENT_URL = '  ';
  if (contentQuizzesUrl() !== null) {
    fail('空の配信 URL でも quizzes.json を取りに行きます');
  }
} finally {
  if (previousUrl === undefined) {
    delete process.env.EXPO_PUBLIC_CONTENT_URL;
  } else {
    process.env.EXPO_PUBLIC_CONTENT_URL = previousUrl;
  }
}

const sample = bundledQuizzes[0];
expectThrow('schemaVersion の違い', () =>
  parseQuizzesDocument({ schemaVersion: 2, questions: [] }),
);
expectThrow('選択肢が3つ', () =>
  parseQuizzesDocument({
    schemaVersion: 1,
    questions: [
      {
        ...sample,
        choices: sample.choices.slice(0, 3),
        sources: sample.sources.map((source) => ({ ...source })),
      },
    ],
  }),
);
expectThrow('正解 index が範囲外', () =>
  parseQuizzesDocument({
    schemaVersion: 1,
    questions: [{ ...sample, answerIndex: 4, sources: sample.sources.map((source) => ({ ...source })) }],
  }),
);
expectThrow('出典なし', () =>
  parseQuizzesDocument({
    schemaVersion: 1,
    questions: [{ ...sample, sources: [] }],
  }),
);

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(
  `quizzes ok: 本番 ${bundledQuizzes.filter((question) => question.role === 'primary').length}、予備 ${reserves.length}`,
);
