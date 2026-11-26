import type { QuizQuestion } from '../content/quizzes';

export type PlayChoice = {
  text: string;
  correct: boolean;
};

export type PlayQuestion = {
  id: string;
  prompt: string;
  explanation: string;
  sources: QuizQuestion['sources'];
  choices: PlayChoice[];
};

export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = next[index];
    const swapped = next[swapIndex];
    if (current === undefined || swapped === undefined) {
      continue;
    }
    next[index] = swapped;
    next[swapIndex] = current;
  }
  return next;
}

/** 問題の順と、各問の選択肢の順を、渡した乱数で並べ替える。 */
export function buildPlayQuestions(
  questions: readonly QuizQuestion[],
  random: () => number = Math.random,
): PlayQuestion[] {
  const played = questions.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    explanation: question.explanation,
    sources: question.sources,
    choices: shuffle(
      question.choices.map((text, index) => ({
        text,
        correct: index === question.answerIndex,
      })),
      random,
    ),
  }));
  return shuffle(played, random);
}
