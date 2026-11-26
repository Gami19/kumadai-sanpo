import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenLink } from '@/components/ScreenLink';
import { useBuildings } from '@/lib/content/useBuildings';
import { primaryQuestionsFor, type QuizQuestion } from '@/lib/content/quizzes';
import { useQuizzes } from '@/lib/content/useQuizzes';
import { buildPlayQuestions, type PlayQuestion } from '@/lib/quiz/play';
import { recordQuizResult } from '@/lib/quiz/results';
import { questionsToClear, quizCleared, type QuizResult } from '@/lib/quiz/score';
import { theme } from '@/theme/tokens';

const ESTIMATED_POSITION_NOTE =
  '位置は推定です。現地で確認できるまで、確定した場所としては扱いません。';

type Phase = 'ask' | 'result';

type Session = {
  round: readonly PlayQuestion[];
  cursor: number;
  picked: number | null;
  correctCount: number;
  phase: Phase;
};

type Props = {
  buildingId: string;
};

function createSession(questions: Parameters<typeof buildPlayQuestions>[0]): Session {
  return {
    round: buildPlayQuestions(questions),
    cursor: 0,
    picked: null,
    correctCount: 0,
    phase: 'ask',
  };
}

function goBack() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/building');
  }
}

export function QuizPlay({ buildingId }: Props) {
  const insets = useSafeAreaInsets();
  const buildings = useBuildings();
  const questions = useQuizzes();
  const building = buildings.find((item) => item.id === buildingId) ?? null;
  const primary = useMemo(
    () => primaryQuestionsFor(questions, buildingId),
    [questions, buildingId],
  );
  const signature = primary
    .map((question) => `${question.id}:${question.answerIndex}:${question.choices.join('\u0001')}`)
    .join('|');
  const scrollRef = useRef<ScrollViewInstance>(null);

  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + theme.space.lg,
          paddingBottom: insets.bottom + theme.space.xl,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="建物の一覧に戻る"
        onPress={goBack}
        style={styles.back}
      >
        <Text style={styles.backLabel}>一覧へ</Text>
      </Pressable>
      {building == null ? (
        <Missing message="この番号の建物は、いまの内容にありません。" />
      ) : primary.length === 0 ? (
        <Missing message="この建物の問題は、いま用意されていません。" />
      ) : (
        <QuizRound
          key={signature}
          buildingId={building.id}
          buildingName={building.name}
          positionEstimated={building.positionEstimated}
          primary={primary}
          scrollRef={scrollRef}
        />
      )}
    </ScrollView>
  );
}

function QuizRound({
  buildingId,
  buildingName,
  positionEstimated,
  primary,
  scrollRef,
}: {
  buildingId: string;
  buildingName: string;
  positionEstimated: boolean;
  primary: readonly QuizQuestion[];
  scrollRef: { current: ScrollViewInstance | null };
}) {
  const locking = useRef(false);
  const attempt = useRef(0);
  const [session, setSession] = useState<Session>(() => createSession(primary));
  const [saved, setSaved] = useState<QuizResult | null>(null);

  function retry() {
    attempt.current += 1;
    locking.current = false;
    setSaved(null);
    setSession(createSession(primary));
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  function pick(choiceIndex: number) {
    if (locking.current || session.phase !== 'ask' || session.picked != null) {
      return;
    }
    const question = session.round[session.cursor];
    const choice = question?.choices[choiceIndex];
    if (question == null || choice == null) {
      return;
    }
    locking.current = true;
    const correctCount = session.correctCount + (choice.correct ? 1 : 0);
    const last = session.cursor >= session.round.length - 1;
    setSession({ ...session, picked: choiceIndex, correctCount });
    if (last) {
      const generation = attempt.current;
      void recordQuizResult(buildingId, correctCount, session.round.length).then(
        (result) => {
          if (attempt.current === generation && result != null) {
            setSaved(result);
          }
        },
        () => undefined,
      );
    }
  }

  function goNext() {
    if (session.picked == null) {
      return;
    }
    locking.current = false;
    if (session.cursor >= session.round.length - 1) {
      setSession({ ...session, phase: 'result' });
    } else {
      setSession({ ...session, cursor: session.cursor + 1, picked: null });
    }
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  const question = session.round[session.cursor];
  if (question == null) {
    return <Missing message="この建物の問題は、いま用意されていません。" />;
  }

  return (
    <View style={styles.block}>
      <Text style={styles.title}>{buildingName}</Text>
      {positionEstimated ? <Text style={styles.estimate}>{ESTIMATED_POSITION_NOTE}</Text> : null}
      {session.phase === 'result' ? (
        <Result
          buildingId={buildingId}
          correct={session.correctCount}
          total={session.round.length}
          saved={saved}
          onRetry={retry}
        />
      ) : (
        <QuestionStep
          question={question}
          index={session.cursor}
          total={session.round.length}
          picked={session.picked}
          onPick={pick}
          onNext={goNext}
        />
      )}
    </View>
  );
}

function Missing({ message }: { message: string }) {
  return (
    <View style={styles.block}>
      <Text style={styles.title}>クイズを始められません</Text>
      <Text style={styles.body}>{message}</Text>
      <ScreenLink href="/building" label="建物の一覧へ" />
    </View>
  );
}

function QuestionStep({
  question,
  index,
  total,
  picked,
  onPick,
  onNext,
}: {
  question: PlayQuestion;
  index: number;
  total: number;
  picked: number | null;
  onPick: (choiceIndex: number) => void;
  onNext: () => void;
}) {
  const revealed = picked != null;
  const pickedChoice = picked == null ? null : question.choices[picked];
  const correct = pickedChoice?.correct === true;
  return (
    <View style={styles.block}>
      <Text style={styles.progress}>
        {index + 1} / {total}
      </Text>
      <Text style={styles.prompt}>{question.prompt}</Text>
      <View style={styles.choices}>
        {question.choices.map((choice, choiceIndex) => {
          const mine = picked === choiceIndex;
          const showCorrect = revealed && choice.correct;
          const showWrong = revealed && mine && !choice.correct;
          const mark = showCorrect ? '正解' : showWrong ? '不正解' : '';
          return (
            <Pressable
              key={choice.text}
              accessibilityRole="button"
              accessibilityState={{ disabled: revealed, selected: mine }}
              accessibilityLabel={mark.length > 0 ? `${choice.text}。${mark}` : choice.text}
              disabled={revealed}
              onPress={() => {
                onPick(choiceIndex);
              }}
              style={({ pressed }) => [
                styles.choice,
                showCorrect && styles.choiceCorrect,
                showWrong && styles.choiceWrong,
                pressed && !revealed && styles.pressed,
              ]}
            >
              {mark.length > 0 ? (
                <Text style={showCorrect ? styles.markCorrect : styles.markWrong}>{mark}</Text>
              ) : null}
              <Text style={styles.choiceLabel}>{choice.text}</Text>
            </Pressable>
          );
        })}
      </View>
      {revealed ? (
        <View accessibilityLiveRegion="polite" style={styles.feedback}>
          <Text style={styles.feedbackTitle}>{correct ? '正解です' : '不正解です'}</Text>
          <Text style={styles.section}>解説</Text>
          <Text style={styles.body}>{question.explanation}</Text>
          <Text style={styles.section}>出典</Text>
          {question.sources.map((source) => (
            <Pressable
              key={source.url}
              accessibilityRole="link"
              accessibilityLabel={`${source.title}を開く`}
              onPress={() => {
                void Linking.openURL(source.url);
              }}
              style={styles.source}
            >
              <Text style={styles.sourceLabel}>{source.title}</Text>
            </Pressable>
          ))}
          <Pressable
            accessibilityRole="button"
            onPress={onNext}
            style={({ pressed }) => [styles.next, pressed && styles.pressed]}
          >
            <Text style={styles.nextLabel}>{index >= total - 1 ? '結果を見る' : '次の問題'}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function Result({
  buildingId,
  correct,
  total,
  saved,
  onRetry,
}: {
  buildingId: string;
  correct: number;
  total: number;
  saved: QuizResult | null;
  onRetry: () => void;
}) {
  const clearedNow = quizCleared(correct, total);
  const need = questionsToClear(total);
  return (
    <View style={styles.block}>
      <Text style={styles.score}>
        {correct} / {total}
      </Text>
      <Text style={styles.body}>
        {clearedNow ? 'クリアしました。' : '今回はクリアになりませんでした。'}
      </Text>
      <Text style={styles.body}>
        {total}問中{need}問以上でクリアです。何度でもやり直せます。
      </Text>
      {!clearedNow && saved?.cleared ? (
        <Text style={styles.body}>以前のクリアは、この端末に残っています。</Text>
      ) : null}
      {saved != null ? (
        <Text style={styles.body}>
          この端末の最高点は {saved.bestCorrect} / {saved.total} です。
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="もう一度挑戦する"
        onPress={onRetry}
        style={({ pressed }) => [styles.next, pressed && styles.pressed]}
      >
        <Text style={styles.nextLabel}>もう一度挑戦する</Text>
      </Pressable>
      <ScreenLink href="/building" label="建物の一覧へ" />
      <ScreenLink
        href={{ pathname: '/building/[id]', params: { id: buildingId } }}
        label="この建物の説明"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.space.lg,
    gap: theme.space.md,
  },
  back: {
    alignSelf: 'flex-start',
    paddingVertical: theme.space.sm,
  },
  backLabel: {
    color: theme.color.moss,
    fontSize: theme.font.body,
    fontWeight: '700',
  },
  block: {
    gap: theme.space.sm,
  },
  title: {
    color: theme.color.ink,
    fontSize: theme.font.title,
    fontWeight: '700',
  },
  estimate: {
    color: theme.color.clay,
    fontSize: theme.font.caption,
    lineHeight: theme.font.caption + theme.space.xs,
  },
  progress: {
    color: theme.color.moss,
    fontSize: theme.font.caption,
    fontWeight: '700',
  },
  prompt: {
    color: theme.color.ink,
    fontSize: theme.font.body,
    fontWeight: '700',
    lineHeight: theme.font.body + theme.space.sm,
  },
  choices: {
    gap: theme.space.sm,
  },
  choice: {
    backgroundColor: theme.color.card,
    borderColor: theme.color.line,
    borderRadius: theme.radius.md,
    borderWidth: theme.border.hairline,
    gap: theme.space.xs,
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.md,
  },
  choiceCorrect: {
    backgroundColor: theme.color.mossWash,
    borderColor: theme.color.moss,
  },
  choiceWrong: {
    borderColor: theme.color.clay,
  },
  pressed: {
    opacity: 0.75,
  },
  markCorrect: {
    color: theme.color.moss,
    fontSize: theme.font.caption,
    fontWeight: '700',
  },
  markWrong: {
    color: theme.color.clay,
    fontSize: theme.font.caption,
    fontWeight: '700',
  },
  choiceLabel: {
    color: theme.color.ink,
    fontSize: theme.font.body,
    lineHeight: theme.font.body + theme.space.sm,
  },
  feedback: {
    gap: theme.space.sm,
  },
  feedbackTitle: {
    color: theme.color.ink,
    fontSize: theme.font.body,
    fontWeight: '700',
  },
  section: {
    color: theme.color.moss,
    fontSize: theme.font.caption,
    fontWeight: '700',
  },
  body: {
    color: theme.color.ink,
    fontSize: theme.font.body,
    lineHeight: theme.font.body + theme.space.sm,
  },
  source: {
    backgroundColor: theme.color.card,
    borderColor: theme.color.line,
    borderRadius: theme.radius.md,
    borderWidth: theme.border.hairline,
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.md,
  },
  sourceLabel: {
    color: theme.color.moss,
    fontSize: theme.font.caption,
    fontWeight: '600',
  },
  next: {
    backgroundColor: theme.color.moss,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.md,
  },
  nextLabel: {
    color: theme.color.card,
    fontSize: theme.font.body,
    fontWeight: '700',
    textAlign: 'center',
  },
  score: {
    color: theme.color.ink,
    fontSize: theme.font.title,
    fontWeight: '700',
  },
});
