import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@app/i18n';
import { useAppTheme } from '@app/theme';
import { Keypad } from '@features/game/presentation/components/Keypad';
import type { NeuroFusionRunSummary } from '@features/game/neurofusion/domain/entities/NeuroFusionTypes';
import { PrimaryButton } from '@ui/components/buttons/PrimaryButton';
import { Screen } from '@ui/components/layout/Screen';

import { MemoryStackView } from '../components/MemoryStackView';
import { NeuroFusionHud } from '../components/NeuroFusionHud';
import { PuzzleView } from '../components/PuzzleView';
import { ReactionGateView } from '../components/ReactionGateView';
import { RhythmMathView } from '../components/RhythmMathView';
import { NeuroFusionStore } from '../state/neuroFusionStore';

interface NeuroFusionRunScreenProps {
  store: NeuroFusionStore;
  onFinished: (summary: NeuroFusionRunSummary) => void;
}

export function NeuroFusionRunScreen({ store, onFinished }: NeuroFusionRunScreenProps) {
  const { theme } = useAppTheme();
  const { copy } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const state = useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getState(),
    () => store.getState(),
  );

  const finishedNotifiedRef = useRef(false);

  useEffect(() => {
    if (state.phase === 'idle') {
      store.startRun();
    }
  }, [state.phase, store]);

  useEffect(() => {
    if (state.phase !== 'running') {
      return undefined;
    }

    const interval = setInterval(() => {
      store.tick(Date.now());
    }, 50);

    return () => {
      clearInterval(interval);
    };
  }, [state.phase, store]);

  useEffect(() => {
    if (state.phase === 'finished' && state.summary && !finishedNotifiedRef.current) {
      finishedNotifiedRef.current = true;
      onFinished(state.summary);
    }
  }, [onFinished, state.phase, state.summary]);

  const runState = state.runState;

  if (!runState || state.phase !== 'running') {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.loading}>{copy.neuroFusion.run.loading}</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scrollable={false} contentStyle={styles.content}>
      <NeuroFusionHud runState={runState} />

      {runState.currentItem?.kind === 'rhythm_question' && (
        <RhythmMathView
          item={runState.currentItem}
          beatIndex={runState.beatIndex}
          answerInput={state.answerInput}
          lastAnswerCorrect={state.lastAnswerCorrect}
        />
      )}

      {runState.currentItem?.kind === 'puzzle' && (
        <PuzzleView
          item={runState.currentItem}
          beatIndex={runState.beatIndex}
          showHint={runState.preset !== 'hardcore'}
          showExplanation={runState.preset !== 'hardcore' && state.lastAnswerCorrect === false}
          onSelectOption={(index) => store.submitPuzzleOption(index)}
        />
      )}

      {runState.currentItem?.kind === 'memory_stack' && (
        <MemoryStackView
          item={runState.currentItem}
          beatIndex={runState.beatIndex}
          answerInput={state.answerInput}
        />
      )}

      {runState.currentItem?.kind === 'reaction_gate' && (
        <ReactionGateView
          item={runState.currentItem}
          beatIndex={runState.beatIndex}
          onAnswer={(answer) => store.submitReaction(answer)}
        />
      )}

      {(runState.currentItem?.kind === 'rhythm_question' ||
        runState.currentItem?.kind === 'memory_stack') && (
        <Keypad
          onDigit={(digit) => store.appendDigit(digit)}
          onBackspace={() => store.backspace()}
          onClear={() => store.clearInput()}
          onSubmit={() => store.submitNumericInput()}
          isSubmitDisabled={state.answerInput.length === 0}
        />
      )}

      <View style={styles.actions}>
        <PrimaryButton onPress={() => store.finishRun()} variant="secondary">
          {copy.neuroFusion.run.finish}
        </PrimaryButton>
      </View>
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    content: {
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loading: {
      color: theme.colors.textSecondary,
      ...theme.typography.subtitle,
    },
    actions: {
      marginTop: 'auto',
    },
  });
}
