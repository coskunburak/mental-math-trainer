import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { Animated, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { useLocalization } from '@app/i18n';
import { useAppTheme } from '@app/theme';
import type { GameMode } from '@features/game/domain/entities/GameMode';
import { ThemeModeSwitch } from '@ui/components/buttons/ThemeModeSwitch';
import { PrimaryButton } from '@ui/components/buttons/PrimaryButton';
import { Screen } from '@ui/components/layout/Screen';

import { HudBar } from '../components/HudBar';
import { Keypad } from '../components/Keypad';
import { QuestionCard } from '../components/QuestionCard';
import type { GameSessionSummary } from '../state/gameStore';
import { GameStore } from '../state/gameStore';

interface GameScreenProps {
  store: GameStore;
  onFinished: (summary: GameSessionSummary) => void;
}

export function GameScreen({ store, onFinished }: GameScreenProps) {
  const { theme } = useAppTheme();
  const { copy } = useLocalization();
  const { height } = useWindowDimensions();
  const compact = height <= 900;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const state = useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getState(),
    () => store.getState(),
  );

  const finishedNotifiedRef = useRef(false);

  const topRowReveal = useRef(new Animated.Value(0)).current;
  const hudReveal = useRef(new Animated.Value(0)).current;
  const questionReveal = useRef(new Animated.Value(0)).current;
  const keypadReveal = useRef(new Animated.Value(0)).current;
  const footerReveal = useRef(new Animated.Value(0)).current;
  const urgency = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    store.startSession();
  }, [store]);

  useEffect(() => {
    const sequence = [topRowReveal, hudReveal, questionReveal, keypadReveal, footerReveal];

    sequence.forEach((value) => value.setValue(0));

    Animated.stagger(
      70,
      sequence.map((value) =>
        Animated.spring(value, {
          toValue: 1,
          tension: 95,
          friction: 11,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [footerReveal, hudReveal, keypadReveal, questionReveal, topRowReveal]);

  useEffect(() => {
    if (state.phase !== 'running') {
      return undefined;
    }

    const interval = setInterval(() => {
      store.tick(100);
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [state.phase, store]);

  const isUrgent = state.isTimedMode && state.remainingMs <= 10_000;

  useEffect(() => {
    if (!isUrgent) {
      urgency.stopAnimation();
      urgency.setValue(0);
      return undefined;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(urgency, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(urgency, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
      urgency.stopAnimation();
    };
  }, [isUrgent, urgency]);

  useEffect(() => {
    if (state.phase === 'finished' && state.summary && !finishedNotifiedRef.current) {
      finishedNotifiedRef.current = true;
      onFinished(state.summary);
    }
  }, [onFinished, state.phase, state.summary]);

  if (state.phase !== 'running' || !state.session || !state.currentQuestion) {
    return (
      <Screen scrollable={false} contentStyle={compact ? styles.screenContentCompact : styles.screenContent}>
        <View style={styles.centered}>
          <Text style={styles.loading}>{copy.game.calibrating}</Text>
        </View>
      </Screen>
    );
  }

  const modeLabel = copy.labels.mode[state.session.mode];
  const title = modeTitle(state.session.mode, copy);
  const footerCopy = modeFooterCopy(state.session.mode, copy);

  const urgentTopStyle = {
    transform: [
      {
        scale: urgency.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.02],
        }),
      },
      {
        translateX: urgency.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 2],
        }),
      },
    ],
  } as const;

  return (
    <Screen scrollable={false} contentStyle={compact ? styles.screenContentCompact : styles.screenContent}>
      <Animated.View style={[revealStyle(topRowReveal, 14), isUrgent && urgentTopStyle]}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.kicker}>{copy.game.liveMode(modeLabel)}</Text>
            <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
          </View>
          <ThemeModeSwitch />
        </View>
      </Animated.View>

      <Animated.View style={revealStyle(hudReveal, 18)}>
        <HudBar
          remainingMs={state.remainingMs}
          score={state.session.score}
          combo={state.session.combo}
          level={state.player.level}
          isTimedMode={state.isTimedMode}
          isUrgent={isUrgent}
          compact={compact}
        />
      </Animated.View>

      <Animated.View style={revealStyle(questionReveal, 24)}>
        <QuestionCard
          questionId={state.currentQuestion.id}
          prompt={state.currentQuestion.prompt}
          difficulty={state.session.difficultyLevel}
          inputValue={state.answerInput}
          lastAnswerCorrect={state.lastAnswerCorrect}
          compact={compact}
        />
      </Animated.View>

      <Animated.View style={revealStyle(keypadReveal, 28)}>
        <Keypad
          onDigit={(digit) => store.appendDigit(digit)}
          onBackspace={() => store.backspace()}
          onClear={() => store.clearInput()}
          onSubmit={() => store.submitAnswer()}
          isSubmitDisabled={state.answerInput.length === 0}
          compact={compact}
        />
      </Animated.View>

      <Animated.View style={revealStyle(footerReveal, 30)}>
        <View style={[styles.footer, compact && styles.footerCompact]}>
          {!compact && <Text style={styles.footerText}>{footerCopy}</Text>}
          <PrimaryButton
            onPress={() => store.finishSession('manual')}
            variant="secondary"
            style={compact ? styles.finishButtonCompact : undefined}
            textStyle={compact ? styles.finishButtonTextCompact : undefined}
          >
            {copy.game.finish}
          </PrimaryButton>
        </View>
      </Animated.View>
    </Screen>
  );
}

function revealStyle(value: Animated.Value, fromY: number) {
  return {
    opacity: value,
    transform: [
      {
        translateY: value.interpolate({
          inputRange: [0, 1],
          outputRange: [fromY, 0],
        }),
      },
      {
        scale: value.interpolate({
          inputRange: [0, 1],
          outputRange: [0.98, 1],
        }),
      },
    ],
  } as const;
}

function modeTitle(mode: GameMode, copy: ReturnType<typeof useLocalization>['copy']): string {
  return copy.game.modeTitle[mode];
}

function modeFooterCopy(mode: GameMode, copy: ReturnType<typeof useLocalization>['copy']): string {
  return copy.game.modeFooter[mode];
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    screenContent: {
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    screenContentCompact: {
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.xs,
      gap: theme.spacing.xs,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    kicker: {
      color: theme.colors.textTertiary,
      ...theme.typography.caption,
    },
    title: {
      color: theme.colors.textPrimary,
      ...theme.typography.title,
    },
    titleCompact: {
      fontSize: 28,
      lineHeight: 30,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loading: {
      color: theme.colors.textSecondary,
      ...theme.typography.subtitle,
    },
    footer: {
      marginTop: theme.spacing.xs,
      gap: theme.spacing.sm,
    },
    footerCompact: {
      marginTop: 2,
      gap: 4,
    },
    footerText: {
      color: theme.colors.textSecondary,
      ...theme.typography.body,
    },
    finishButtonCompact: {
      minHeight: 44,
      paddingVertical: theme.spacing.xs,
    },
    finishButtonTextCompact: {
      fontSize: 13,
      lineHeight: 16,
    },
  });
}
