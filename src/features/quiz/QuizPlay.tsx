import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { haptics } from '@/lib/haptics';
import { useBuildings } from '@/lib/content/useBuildings';
import { primaryQuestionsFor, type QuizQuestion } from '@/lib/content/quizzes';
import { useQuizzes } from '@/lib/content/useQuizzes';
import { buildPlayQuestions, type PlayQuestion } from '@/lib/quiz/play';
import { recordQuizResult } from '@/lib/quiz/results';
import { openSources } from '@/lib/sheet/session';
import { theme } from '@/theme/tokens';

type Phase = 'ask' | 'result';
type Outcome = 'correct' | 'wrong';

type Session = {
  round: readonly PlayQuestion[];
  cursor: number;
  picked: number | null;
  outcomes: readonly Outcome[];
  phase: Phase;
  /** 正解の自動送りを、出典を開いたので止めた。 */
  paused: boolean;
};

type Props = {
  buildingId: string;
};

/** 正解から次へ進むまで。計画の 0.8〜1.2 秒。 */
const CORRECT_ADVANCE_MS = 800;
/** 判定アイコンの出現。押した実感は 150ms 以内。 */
const MARK_MS = 120;
/** 結果の星。まれな結果表示なので、短い一回だけ。 */
const RESULT_MS = 180;

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

function createSession(questions: readonly QuizQuestion[]): Session {
  return {
    round: buildPlayQuestions(questions),
    cursor: 0,
    picked: null,
    outcomes: [],
    phase: 'ask',
    paused: false,
  };
}

function moveNext(current: Session, auto: boolean): Session {
  if (current.phase !== 'ask' || current.picked == null) {
    return current;
  }
  if (auto && (current.paused || current.outcomes[current.cursor] !== 'correct')) {
    return current;
  }
  if (current.cursor >= current.round.length - 1) {
    return { ...current, phase: 'result' };
  }
  return { ...current, cursor: current.cursor + 1, picked: null, paused: false };
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
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.space.xl }]}
    >
      {building == null || primary.length === 0 ? (
        <Missing />
      ) : (
        <QuizRound
          key={signature}
          buildingId={building.id}
          primary={primary}
          scrollRef={scrollRef}
        />
      )}
    </ScrollView>
  );
}

function QuizRound({
  buildingId,
  primary,
  scrollRef,
}: {
  buildingId: string;
  primary: readonly QuizQuestion[];
  scrollRef: { current: ScrollViewInstance | null };
}) {
  const locking = useRef(false);
  const [session, setSession] = useState<Session>(() => createSession(primary));
  const question = session.round[session.cursor];
  const outcome = session.outcomes[session.cursor];
  const revealedCorrect =
    session.phase === 'ask' && session.picked != null && outcome === 'correct' && !session.paused;

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [session.cursor, session.phase, scrollRef]);

  useEffect(() => {
    if (!revealedCorrect) {
      return undefined;
    }
    const id = setTimeout(() => {
      locking.current = false;
      setSession((current) => moveNext(current, true));
    }, CORRECT_ADVANCE_MS);
    return () => {
      clearTimeout(id);
    };
  }, [revealedCorrect]);

  function retry() {
    locking.current = false;
    haptics.select();
    setSession(createSession(primary));
  }

  function pick(choiceIndex: number) {
    if (locking.current || session.phase !== 'ask' || session.picked != null) {
      return;
    }
    const current = session.round[session.cursor];
    const choice = current?.choices[choiceIndex];
    if (current == null || choice == null) {
      return;
    }
    locking.current = true;
    const nextOutcome: Outcome = choice.correct ? 'correct' : 'wrong';
    if (choice.correct) {
      haptics.success();
    } else {
      haptics.error();
    }
    const outcomes = [...session.outcomes, nextOutcome];
    const correctCount = outcomes.filter((item) => item === 'correct').length;
    const last = session.cursor >= session.round.length - 1;
    setSession({ ...session, picked: choiceIndex, outcomes });
    if (last) {
      void recordQuizResult(buildingId, correctCount, session.round.length).catch(() => undefined);
    }
  }

  function goNext() {
    locking.current = false;
    haptics.select();
    setSession((current) => moveNext(current, false));
  }

  function showSources() {
    if (question == null || question.sources.length === 0) {
      return;
    }
    haptics.select();
    setSession((current) => {
      if (
        current.phase === 'ask' &&
        current.picked != null &&
        current.outcomes[current.cursor] === 'correct'
      ) {
        return { ...current, paused: true };
      }
      return current;
    });
    openSources(question.sources);
  }

  if (question == null) {
    return <Missing />;
  }

  if (session.phase === 'result') {
    const correct = session.outcomes.filter((item) => item === 'correct').length;
    return <Result correct={correct} total={session.round.length} onRetry={retry} />;
  }

  const revealed = session.picked != null;
  const correct = outcome === 'correct';
  const showNext = revealed && (!correct || session.paused);
  const announcement = !revealed ? '' : correct ? '正解' : `不正解。${question.explanation}`;

  return (
    <View style={styles.block}>
      <View style={styles.progressRow}>
        <Progress total={session.round.length} cursor={session.cursor} outcomes={session.outcomes} />
        {question.sources.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`出典 ${question.sources.length}件`}
            onPress={showSources}
            hitSlop={theme.space.xs}
            style={({ pressed }) => [styles.source, pressed && styles.pressed]}
          >
            <Icon name="link" size={theme.space.lg} color={theme.color.leafDark} />
          </Pressable>
        ) : null}
      </View>
      <Text selectable style={styles.prompt}>
        {question.prompt}
      </Text>
      <View style={styles.choices}>
        {question.choices.map((choice, choiceIndex) => (
          <ChoiceTile
            key={`${question.id}:${choiceIndex}`}
            text={choice.text}
            revealed={revealed}
            correct={choice.correct}
            picked={session.picked === choiceIndex}
            onPress={() => {
              pick(choiceIndex);
            }}
          />
        ))}
      </View>
      {showNext ? (
        <View style={styles.feedback}>
          {!correct ? (
            <Text
              selectable
              numberOfLines={2}
              accessibilityLabel={question.explanation}
              style={styles.explanation}
            >
              {question.explanation}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="次へ"
            onPress={goNext}
            style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
          >
            <Text style={styles.actionLabel}>次へ</Text>
            <Icon name="chevron.right" size={theme.space.lg} color={theme.color.white} />
          </Pressable>
        </View>
      ) : null}
      <Text accessibilityLiveRegion="polite" style={styles.live}>
        {announcement}
      </Text>
    </View>
  );
}

function Missing() {
  return (
    <View accessibilityRole="text" accessibilityLabel="問題がありません" style={styles.missing}>
      <Icon name="questionmark" size={theme.space.xl} color={theme.color.inkMuted} />
    </View>
  );
}

function Progress({
  total,
  cursor,
  outcomes,
}: {
  total: number;
  cursor: number;
  outcomes: readonly Outcome[];
}) {
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${cursor + 1}問目、全${total}問`}
      style={styles.dots}
    >
      {Array.from({ length: total }, (_, index) => {
        const mark = outcomes[index];
        const current = index === cursor && mark == null;
        return (
          <View
            key={index}
            style={[
              styles.dot,
              mark === 'correct' && styles.dotCorrect,
              mark === 'wrong' && styles.dotWrong,
              current && styles.dotCurrent,
              mark == null && !current && styles.dotFuture,
            ]}
          />
        );
      })}
    </View>
  );
}

function ChoiceTile({
  text,
  revealed,
  correct,
  picked,
  onPress,
}: {
  text: string;
  revealed: boolean;
  correct: boolean;
  picked: boolean;
  onPress: () => void;
}) {
  const right = revealed && correct;
  const wrong = revealed && picked && !correct;
  const marked = right || wrong;
  const label = right ? `${text}。正解` : wrong ? `${text}。不正解` : text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: revealed, selected: picked }}
      accessibilityLabel={label}
      disabled={revealed}
      onPress={onPress}
      pressRetentionOffset={theme.space.md}
      style={({ pressed }) => [
        styles.choice,
        right && styles.choiceCorrect,
        wrong && styles.choiceWrong,
        pressed && !revealed && styles.pressed,
      ]}
    >
      <Text style={[styles.choiceLabel, marked && styles.choiceLabelOnFill]}>{text}</Text>
      {marked ? (
        <Animated.View entering={FadeIn.duration(MARK_MS).reduceMotion(ReduceMotion.System)}>
          <Icon
            name={right ? 'checkmark' : 'xmark'}
            size={theme.space.lg}
            color={theme.color.white}
          />
        </Animated.View>
      ) : null}
    </Pressable>
  );
}

function Result({
  correct,
  total,
  onRetry,
}: {
  correct: number;
  total: number;
  onRetry: () => void;
}) {
  return (
    <View style={styles.result}>
      <ResultStars correct={correct} total={total} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="もう一度"
        onPress={onRetry}
        style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
      >
        <Icon name="arrow.clockwise" size={theme.space.lg} color={theme.color.white} />
        <Text style={styles.actionLabel}>もう一度</Text>
      </Pressable>
    </View>
  );
}

function ResultStars({ correct, total }: { correct: number; total: number }) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    progress.set(
      withTiming(1, {
        duration: reduced ? 0 : RESULT_MS,
        easing: EASE_OUT,
        reduceMotion: ReduceMotion.System,
      }),
    );
  }, [progress, reduced]);

  const animated = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ scale: 0.94 + progress.get() * 0.06 }],
  }));

  return (
    <Animated.View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${correct}問正解、全${total}問`}
      style={[styles.stars, animated]}
    >
      {Array.from({ length: Math.max(total, 1) }, (_, index) => (
        <View
          key={index}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Icon
            name={index < correct ? 'star.fill' : 'star'}
            size={theme.space.xl}
            color={index < correct ? theme.color.brick : theme.color.inkMuted}
          />
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.space.lg,
    paddingTop: theme.space.sm,
    flexGrow: 1,
  },
  block: {
    gap: theme.space.md,
  },
  progressRow: {
    minHeight: theme.hit,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
  },
  dots: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
  },
  dot: {
    width: theme.space.sm,
    height: theme.space.sm,
    borderRadius: theme.space.xs,
  },
  dotCurrent: {
    width: theme.space.md,
    height: theme.space.md,
    borderRadius: theme.space.sm,
    backgroundColor: theme.color.ink,
  },
  dotCorrect: {
    backgroundColor: theme.color.leafDark,
  },
  /** 丸が正解、四角が不正解。色が分からなくても形で区別する。 */
  dotWrong: {
    borderRadius: 0,
    backgroundColor: theme.color.brick,
  },
  dotFuture: {
    backgroundColor: 'transparent',
    borderWidth: theme.border.mark,
    borderColor: theme.color.inkMuted,
  },
  source: {
    width: theme.hit,
    height: theme.hit,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.pill,
  },
  prompt: {
    color: theme.color.ink,
    fontSize: theme.font.title,
    lineHeight: theme.font.title + theme.space.sm,
    fontWeight: '700',
  },
  choices: {
    gap: theme.space.sm,
  },
  choice: {
    minHeight: theme.hit + theme.space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.md,
    borderRadius: theme.radius.lg,
    borderCurve: 'continuous',
    backgroundColor: theme.color.white,
  },
  choiceCorrect: {
    backgroundColor: theme.color.leafDark,
  },
  choiceWrong: {
    backgroundColor: theme.color.brick,
  },
  pressed: {
    backgroundColor: theme.color.press,
  },
  choiceLabel: {
    flex: 1,
    color: theme.color.ink,
    fontSize: theme.font.body,
    lineHeight: theme.font.body + theme.space.sm,
    fontWeight: '600',
  },
  choiceLabelOnFill: {
    color: theme.color.white,
  },
  feedback: {
    gap: theme.space.sm,
  },
  explanation: {
    color: theme.color.ink,
    fontSize: theme.font.body,
    lineHeight: theme.font.body + theme.space.sm,
  },
  action: {
    minHeight: theme.hit + theme.space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.sm,
    paddingHorizontal: theme.space.lg,
    borderRadius: theme.radius.lg,
    borderCurve: 'continuous',
    backgroundColor: theme.color.leafDark,
  },
  actionPressed: {
    opacity: 0.85,
  },
  actionLabel: {
    color: theme.color.white,
    fontSize: theme.font.body,
    fontWeight: '700',
    textAlign: 'center',
  },
  result: {
    gap: theme.space.lg,
    paddingTop: theme.space.xl,
  },
  stars: {
    minHeight: theme.space.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.space.sm,
  },
  missing: {
    minHeight: theme.hit * 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  live: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    color: theme.color.paper,
  },
});
