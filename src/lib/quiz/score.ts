/** 3問中2問以上。問題数が変わっても、同じ割合（切り上げ）で判定する。 */
export function quizCleared(correct: number, total: number): boolean {
  return total > 0 && correct * 3 >= total * 2;
}

export function questionsToClear(total: number): number {
  if (total <= 0) {
    return 0;
  }
  return Math.ceil((total * 2) / 3);
}

export type QuizResult = {
  bestCorrect: number;
  total: number;
  cleared: boolean;
  /** 最後に解き終えた日時（ISO 8601）。 */
  playedAt: string;
};

/** 最高点は正答率で比べる。クリアは一度でも達したら残す。日時は今回の挑戦。 */
export function mergeQuizResult(
  previous: QuizResult | undefined,
  correct: number,
  total: number,
  playedAt: string,
): QuizResult {
  const cleared = (previous?.cleared ?? false) || quizCleared(correct, total);
  if (previous == null || previous.total <= 0) {
    return { bestCorrect: correct, total, cleared, playedAt };
  }
  const previousRate = previous.bestCorrect / previous.total;
  const nextRate = total > 0 ? correct / total : 0;
  if (previousRate > nextRate) {
    return {
      bestCorrect: previous.bestCorrect,
      total: previous.total,
      cleared,
      playedAt,
    };
  }
  return { bestCorrect: correct, total, cleared, playedAt };
}

export function formatQuizPlayedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${hour}:${minute}`;
}
