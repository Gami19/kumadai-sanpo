import { useEffect, useState } from 'react';

import { bundledQuizzes, contentQuizzesUrl, loadQuizzes, type QuizQuestion } from './quizzes';

/** 最初は同梱データ。配信 URL があるときだけ、あとから差し替える。 */
export function useQuizzes(): readonly QuizQuestion[] {
  const [questions, setQuestions] = useState<readonly QuizQuestion[]>(bundledQuizzes);

  useEffect(() => {
    if (contentQuizzesUrl() == null) {
      return undefined;
    }
    let cancelled = false;
    void loadQuizzes().then((loaded) => {
      if (!cancelled) {
        setQuestions(loaded);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return questions;
}
