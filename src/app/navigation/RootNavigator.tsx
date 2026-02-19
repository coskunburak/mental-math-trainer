import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Container } from '@app/di/container';
import { TOKENS } from '@app/di/tokens';
import { useLocalization } from '@app/i18n';
import { useAppTheme } from '@app/theme';
import { gameEvents, purchaseEvents } from '@core/analytics/events';
import type { GameProgress } from '@features/game/domain/entities/GameProgress';
import { DEFAULT_GAME_PROGRESS } from '@features/game/domain/entities/GameProgress';
import {
  GAME_MODE_POLICIES,
  type GameMode,
} from '@features/game/domain/entities/GameMode';
import { buildEntitlements } from '@features/game/domain/entities/Monetization';
import type { QuestionType } from '@features/game/domain/entities/Question';
import {
  buildDailyChallengePlan,
  isDailyChallengeCompletedToday,
} from '@features/game/domain/services/daily/DailyChallenge';
import { computeUnlockState, type UnlockState } from '@features/game/domain/services/unlocks/Unlocks';
import { CustomTrainingScreen } from '@features/game/presentation/screens/CustomTrainingScreen';
import { GameScreen } from '@features/game/presentation/screens/GameScreen';
import { InsightsScreen } from '@features/game/presentation/screens/InsightsScreen';
import { PremiumScreen } from '@features/game/presentation/screens/PremiumScreen';
import { ResultScreen } from '@features/game/presentation/screens/ResultScreen';
import {
  GameStore,
  type GameSessionConfig,
  type GameSessionSummary,
} from '@features/game/presentation/state/gameStore';
import { PrimaryButton } from '@ui/components/buttons/PrimaryButton';
import { ThemeModeSwitch } from '@ui/components/buttons/ThemeModeSwitch';
import { Card } from '@ui/components/layout/Card';
import { Screen } from '@ui/components/layout/Screen';

interface RootNavigatorProps {
  container: Container;
}

type Scene = 'home' | 'game' | 'result' | 'insights' | 'premium' | 'custom_training';

const REWARDED_BONUS_XP = 20;

const MODE_ORDER: GameMode[] = ['daily', 'sprint', 'custom', 'zen', 'survival'];
const QUESTION_TYPE_ORDER: QuestionType[] = ['addition', 'subtraction', 'multiplication', 'division'];

const MODE_UNLOCK_LEVEL: Record<GameMode, number> = {
  custom: 1,
  daily: 1,
  sprint: 1,
  zen: 2,
  survival: 4,
};

const QUESTION_UNLOCK_LEVEL: Record<QuestionType, number> = {
  addition: 1,
  subtraction: 1,
  multiplication: 3,
  division: 5,
};

export function RootNavigator({ container }: RootNavigatorProps) {
  const services = useMemo(
    () => ({
      env: container.resolve(TOKENS.env),
      analytics: container.resolve(TOKENS.analyticsService),
      rewardedAdService: container.resolve(TOKENS.rewardedAdService),
      scoreCalculator: container.resolve(TOKENS.scoreCalculator),
      difficultyController: container.resolve(TOKENS.difficultyController),
      answerValidator: container.resolve(TOKENS.answerValidator),
      questionGeneratorFactory: container.resolve(TOKENS.questionGeneratorFactory),
      gameProgressStore: container.resolve(TOKENS.gameProgressStore),
      bootstrapState: container.resolve(TOKENS.bootstrapState),
    }),
    [container],
  );

  const [scene, setScene] = useState<Scene>('home');
  const [progress, setProgress] = useState<GameProgress>(
    services.bootstrapState.initialGameProgress ?? DEFAULT_GAME_PROGRESS,
  );
  const [store, setStore] = useState<GameStore | null>(null);
  const [summary, setSummary] = useState<GameSessionSummary | null>(null);
  const [lastSessionConfig, setLastSessionConfig] = useState<GameSessionConfig | null>(null);
  const [selectedMode, setSelectedMode] = useState<GameMode>('daily');
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<QuestionType[]>([
    'addition',
    'subtraction',
  ]);
  const [customTraining, setCustomTraining] = useState(progress.customTraining);

  const unlockState = useMemo(() => computeUnlockState(progress.player.level), [progress.player.level]);
  const now = Date.now();
  const dailyPlan = buildDailyChallengePlan(progress.player.level, now);
  const dailyCompletedToday = isDailyChallengeCompletedToday(progress, now);
  const entitlements = buildEntitlements(progress.monetization.tier);

  useEffect(() => {
    setCustomTraining(progress.customTraining);
  }, [progress.customTraining]);

  useEffect(() => {
    if (!unlockState.unlockedModes.includes(selectedMode)) {
      setSelectedMode(unlockState.unlockedModes[0] ?? 'sprint');
    }

    const filteredTypes = selectedQuestionTypes.filter((type) =>
      unlockState.unlockedQuestionTypes.includes(type),
    );

    if (filteredTypes.length !== selectedQuestionTypes.length) {
      setSelectedQuestionTypes(
        filteredTypes.length > 0
          ? filteredTypes
          : [unlockState.unlockedQuestionTypes[0] ?? 'addition'],
      );
      return;
    }

    if (filteredTypes.length === 0 && unlockState.unlockedQuestionTypes.length > 0) {
      setSelectedQuestionTypes([unlockState.unlockedQuestionTypes[0]]);
    }
  }, [selectedMode, selectedQuestionTypes, unlockState]);

  const createConfigFromSelection = (): GameSessionConfig => {
    if (selectedMode === 'custom') {
      const allowedFromUnlocks = customTraining.questionTypes.filter((type) =>
        unlockState.unlockedQuestionTypes.includes(type),
      );
      const allowedQuestionTypes =
        allowedFromUnlocks.length > 0
          ? allowedFromUnlocks
          : [unlockState.unlockedQuestionTypes[0] ?? 'addition'];

      return {
        mode: 'custom',
        allowedQuestionTypes,
        durationSecondsOverride: customTraining.durationSeconds,
        questionLimitOverride: customTraining.questionLimit,
      };
    }

    if (selectedMode === 'daily') {
      return {
        mode: 'daily',
        allowedQuestionTypes: dailyPlan.questionTypes,
        durationSecondsOverride: dailyPlan.durationSeconds,
        questionLimitOverride: dailyPlan.questionLimit,
        seedOverride: dailyPlan.seed,
      };
    }

    const availableTypes = unlockState.unlockedQuestionTypes;
    const chosen = selectedQuestionTypes.filter((type) => availableTypes.includes(type));
    const allowedQuestionTypes = chosen.length > 0 ? chosen : [availableTypes[0] ?? 'addition'];

    return {
      mode: selectedMode,
      allowedQuestionTypes,
    };
  };

  const startWithConfig = (config: GameSessionConfig) => {
    const nextStore = new GameStore(services, progress.player, config);
    setSummary(null);
    setStore(nextStore);
    setLastSessionConfig(config);
    setScene('game');
  };

  const startSelectedRun = () => {
    if (selectedMode === 'daily' && dailyCompletedToday) {
      return;
    }

    if (selectedMode === 'custom' && !entitlements.customTraining) {
      services.analytics.track(purchaseEvents.premiumGateBlocked, {
        feature: 'custom_training',
        source: 'home_start',
      });
      openPremium();
      return;
    }

    const config = createConfigFromSelection();
    services.analytics.track('session_start_button_clicked', {
      source: 'home',
      mode: config.mode,
      question_types: config.allowedQuestionTypes.join(','),
      question_limit: config.questionLimitOverride,
    });
    startWithConfig(config);
  };

  const onToggleQuestionType = (type: QuestionType) => {
    if (!unlockState.unlockedQuestionTypes.includes(type)) {
      return;
    }

    setSelectedQuestionTypes((previous) => {
      if (previous.includes(type)) {
        if (previous.length === 1) {
          return previous;
        }

        return previous.filter((item) => item !== type);
      }

      return [...previous, type];
    });
  };

  const onFinished = (sessionSummary: GameSessionSummary) => {
    setSummary(sessionSummary);

    setProgress((previous) => {
      const next = services.gameProgressStore.applySession(previous, sessionSummary);
      void services.gameProgressStore.save(next);
      return next;
    });

    setScene('result');
  };

  const backHome = () => {
    setScene('home');
    setStore(null);
  };

  const updateCustomTraining = (nextSettings: GameProgress['customTraining']) => {
    setCustomTraining(nextSettings);

    setProgress((previous) => {
      const next = services.gameProgressStore.applyCustomTrainingSettings(previous, nextSettings);
      void services.gameProgressStore.save(next);
      return next;
    });
  };

  const openPremium = () => {
    services.analytics.track(purchaseEvents.premiumPaywallViewed, {
      source: scene,
      tier: progress.monetization.tier,
    });
    setScene('premium');
  };

  const upgradePremium = () => {
    services.analytics.track(purchaseEvents.premiumUpgradeStarted, {
      source: 'premium',
      tier_before: progress.monetization.tier,
    });

    setProgress((previous) => {
      const next = services.gameProgressStore.applyPremiumUpgrade(previous);
      void services.gameProgressStore.save(next);
      return next;
    });

    services.analytics.track(purchaseEvents.premiumUpgradeCompleted, {
      source: 'premium',
      tier_after: 'premium',
    });

    setScene('home');
  };

  const openInsights = () => {
    if (!entitlements.advancedInsights) {
      services.analytics.track(purchaseEvents.premiumGateBlocked, {
        feature: 'advanced_insights',
        source: 'home',
      });
      openPremium();
      return;
    }

    services.analytics.track(gameEvents.insightsViewed, {
      source: 'home',
      level: progress.player.level,
    });
    setScene('insights');
  };

  const openCustomTraining = () => {
    if (!entitlements.customTraining) {
      services.analytics.track(purchaseEvents.premiumGateBlocked, {
        feature: 'custom_training',
        source: 'home',
      });
      openPremium();
      return;
    }

    setScene('custom_training');
  };

  const startCustomTraining = () => {
    setSelectedMode('custom');
    const allowedFromUnlocks = customTraining.questionTypes.filter((type) =>
      unlockState.unlockedQuestionTypes.includes(type),
    );
    const allowedQuestionTypes =
      allowedFromUnlocks.length > 0 ? allowedFromUnlocks : [unlockState.unlockedQuestionTypes[0] ?? 'addition'];

    const config = {
      mode: 'custom' as const,
      allowedQuestionTypes,
      durationSecondsOverride: customTraining.durationSeconds,
      questionLimitOverride: customTraining.questionLimit,
    };
    startWithConfig(config);
  };

  const claimRewardedBonus = async (): Promise<boolean> => {
    if (!summary || progress.monetization.tier !== 'free') {
      return false;
    }

    if (progress.monetization.lastRewardedSessionId === summary.sessionId) {
      return false;
    }

    services.analytics.track(purchaseEvents.rewardedAdRequested, {
      session_id: summary.sessionId,
      source: 'result',
    });

    const granted = await services.rewardedAdService.show('session_end_bonus');
    if (!granted) {
      services.analytics.track(purchaseEvents.rewardedAdFailed, {
        session_id: summary.sessionId,
      });
      return false;
    }

    setProgress((previous) => {
      const next = services.gameProgressStore.applyRewardedAdBonus(
        previous,
        summary.sessionId,
        REWARDED_BONUS_XP,
      );
      void services.gameProgressStore.save(next);
      return next;
    });

    setSummary((previous) => {
      if (!previous) {
        return previous;
      }

      const totalXp = previous.totalXp + REWARDED_BONUS_XP;
      return {
        ...previous,
        gainedXp: previous.gainedXp + REWARDED_BONUS_XP,
        totalXp,
        levelAfter: levelFromXp(totalXp),
      };
    });

    services.analytics.track(purchaseEvents.rewardedAdCompleted, {
      session_id: summary.sessionId,
      bonus_xp: REWARDED_BONUS_XP,
    });

    return true;
  };

  const playAgain = () => {
    if (summary?.mode === 'daily' && dailyCompletedToday) {
      backHome();
      return;
    }

    startWithConfig(lastSessionConfig ?? createConfigFromSelection());
  };

  if (scene === 'game' && store) {
    return <GameScreen store={store} onFinished={onFinished} />;
  }

  if (scene === 'result' && summary) {
    return (
      <ResultScreen
        summary={summary}
        lifetime={progress.lifetime}
        subscriptionTier={progress.monetization.tier}
        rewardedBonusXp={REWARDED_BONUS_XP}
        rewardedClaimed={progress.monetization.lastRewardedSessionId === summary.sessionId}
        onClaimRewardedBonus={claimRewardedBonus}
        onPlayAgain={playAgain}
        onBackHome={backHome}
      />
    );
  }

  if (scene === 'insights') {
    return <InsightsScreen progress={progress} onBack={backHome} />;
  }

  if (scene === 'premium') {
    return (
      <PremiumScreen
        tier={progress.monetization.tier}
        onUpgrade={upgradePremium}
        onBack={backHome}
      />
    );
  }

  if (scene === 'custom_training') {
    return (
      <CustomTrainingScreen
        values={customTraining}
        unlockedQuestionTypes={unlockState.unlockedQuestionTypes}
        onChange={updateCustomTraining}
        onStart={startCustomTraining}
        onBack={backHome}
      />
    );
  }

  return (
    <HomeScene
      progress={progress}
      selectedMode={selectedMode}
      selectedQuestionTypes={selectedQuestionTypes}
      customTraining={customTraining}
      unlockState={unlockState}
      dailyQuestionTypes={dailyPlan.questionTypes}
      dailyQuestionLimit={dailyPlan.questionLimit}
      dailyCompletedToday={dailyCompletedToday}
      onModeChange={setSelectedMode}
      onToggleQuestionType={onToggleQuestionType}
      onStart={startSelectedRun}
      onInsights={openInsights}
      onPremium={openPremium}
      onCustomTraining={openCustomTraining}
      sprintDurationSeconds={services.env.sessionDurationSeconds}
    />
  );
}

interface HomeSceneProps {
  progress: GameProgress;
  selectedMode: GameMode;
  selectedQuestionTypes: QuestionType[];
  customTraining: GameProgress['customTraining'];
  unlockState: UnlockState;
  dailyQuestionTypes: QuestionType[];
  dailyQuestionLimit: number;
  dailyCompletedToday: boolean;
  onModeChange: (mode: GameMode) => void;
  onToggleQuestionType: (type: QuestionType) => void;
  onStart: () => void;
  onInsights: () => void;
  onPremium: () => void;
  onCustomTraining: () => void;
  sprintDurationSeconds: number;
}

function HomeScene({
  progress,
  selectedMode,
  selectedQuestionTypes,
  customTraining,
  unlockState,
  dailyQuestionTypes,
  dailyQuestionLimit,
  dailyCompletedToday,
  onModeChange,
  onToggleQuestionType,
  onStart,
  onInsights,
  onPremium,
  onCustomTraining,
  sprintDurationSeconds,
}: HomeSceneProps) {
  const { theme } = useAppTheme();
  const { copy } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const topReveal = useRef(new Animated.Value(0)).current;
  const heroReveal = useRef(new Animated.Value(0)).current;
  const statsReveal = useRef(new Animated.Value(0)).current;
  const historyReveal = useRef(new Animated.Value(0)).current;
  const heroFloat = useRef(new Animated.Value(0)).current;
  const ctaPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const reveals = [topReveal, heroReveal, statsReveal, historyReveal];
    reveals.forEach((value) => value.setValue(0));

    Animated.stagger(
      80,
      reveals.map((value) =>
        Animated.spring(value, {
          toValue: 1,
          tension: 92,
          friction: 10,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [historyReveal, heroReveal, statsReveal, topReveal]);

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(heroFloat, {
          toValue: 1,
          duration: 2400,
          useNativeDriver: true,
        }),
        Animated.timing(heroFloat, {
          toValue: 0,
          duration: 2400,
          useNativeDriver: true,
        }),
      ]),
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ctaPulse, {
          toValue: 1,
          duration: 520,
          useNativeDriver: true,
        }),
        Animated.timing(ctaPulse, {
          toValue: 0,
          duration: 520,
          useNativeDriver: true,
        }),
      ]),
    );

    floatLoop.start();
    pulseLoop.start();

    return () => {
      floatLoop.stop();
      pulseLoop.stop();
      heroFloat.stopAnimation();
      ctaPulse.stopAnimation();
    };
  }, [ctaPulse, heroFloat]);

  const recentSessions = progress.recentSessions.slice(0, 3);
  const selectedModeDuration = formatModeDuration(selectedMode, sprintDurationSeconds, customTraining, copy);
  const displayedQuestionTypes =
    selectedMode === 'daily'
      ? dailyQuestionTypes
      : selectedMode === 'custom'
        ? customTraining.questionTypes
        : selectedQuestionTypes;
  const selectedOperationsLabel = formatQuestionTypes(displayedQuestionTypes, copy);
  const startDisabled = selectedMode === 'daily' && dailyCompletedToday;

  return (
    <Screen>
      <Animated.View style={revealStyle(topReveal, 12)}>
        <View style={styles.topRow}>
          <Text style={styles.kicker}>{copy.home.kicker}</Text>
          <ThemeModeSwitch />
        </View>
      </Animated.View>

      <Animated.View
        style={[
          revealStyle(heroReveal, 20),
          {
            transform: [
              {
                translateY: heroFloat.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -4],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.heroWrap}>
          <Text style={styles.hero}>{copy.home.heroTitle}</Text>
          <Text style={styles.heroBody}>{copy.home.heroBody}</Text>
        </View>
      </Animated.View>

      <Animated.View style={revealStyle(statsReveal, 24)}>
        <Card tone="accent" style={styles.statsCard}>
          <View style={styles.statRow}>
            <View>
              <Text style={styles.statLabel}>{copy.home.playerLevel}</Text>
              <Text style={styles.statValue}>{progress.player.level}</Text>
            </View>
            <View>
              <Text style={styles.statLabel}>{copy.home.totalXp}</Text>
              <Text style={styles.statValue}>{progress.player.xp}</Text>
            </View>
          </View>

          <View style={styles.statRow}>
            <View>
              <Text style={styles.statLabel}>{copy.home.streakDays}</Text>
              <Text style={styles.statValue}>{progress.lifetime.streakDays}</Text>
            </View>
            <View>
              <Text style={styles.statLabel}>{copy.home.bestScore}</Text>
              <Text style={styles.statValue}>{progress.lifetime.bestScore}</Text>
            </View>
          </View>

          <View style={styles.statRow}>
            <View>
              <Text style={styles.statLabel}>{copy.home.dailyClears}</Text>
              <Text style={styles.statValue}>{progress.daily.completions}</Text>
            </View>
            <View>
              <Text style={styles.statLabel}>{copy.home.dailyBest}</Text>
              <Text style={styles.statValue}>{progress.daily.bestScore}</Text>
            </View>
          </View>

          <View style={styles.modePill}>
            <Text style={styles.modePillText}>
              {copy.home.plan(progress.monetization.tier === 'premium')}
            </Text>
          </View>

          <View style={styles.modePill}>
            <Text style={styles.modePillText}>
              {copy.home.modeSummary(copy.labels.mode[selectedMode], selectedModeDuration)}
            </Text>
          </View>

          <View style={styles.selectionBlock}>
            <Text style={styles.selectionTitle}>{copy.home.modeTitle}</Text>
            <View style={styles.selectionRow}>
              {MODE_ORDER.map((mode) => {
                const unlocked = unlockState.unlockedModes.includes(mode);
                return (
                  <SelectionChip
                    key={mode}
                    label={copy.labels.mode[mode]}
                    meta={
                      unlocked
                        ? formatModeDuration(mode, sprintDurationSeconds, customTraining, copy)
                        : copy.home.unlockLevel(MODE_UNLOCK_LEVEL[mode])
                    }
                    selected={selectedMode === mode}
                    locked={!unlocked}
                    onPress={() => onModeChange(mode)}
                    styles={styles}
                  />
                );
              })}
            </View>
          </View>

          <View style={styles.selectionBlock}>
            <Text style={styles.selectionTitle}>{copy.home.operationsTitle}</Text>
            <View style={styles.selectionGrid}>
              {QUESTION_TYPE_ORDER.map((type) => {
                const unlocked = unlockState.unlockedQuestionTypes.includes(type);
                const lockedByPreset = selectedMode === 'daily' || selectedMode === 'custom';
                return (
                  <SelectionChip
                    key={type}
                    label={copy.labels.questionType[type]}
                    meta={
                      unlocked
                        ? lockedByPreset
                          ? selectedMode === 'daily'
                            ? copy.home.dailySet
                            : copy.home.customSet
                          : copy.home.ready
                        : copy.home.unlockLevel(QUESTION_UNLOCK_LEVEL[type])
                    }
                    selected={displayedQuestionTypes.includes(type)}
                    locked={!unlocked}
                    disabled={lockedByPreset}
                    onPress={() => onToggleQuestionType(type)}
                    styles={styles}
                  />
                );
              })}
            </View>
            <Text style={styles.selectionHint}>{copy.home.selected(selectedOperationsLabel)}</Text>
            {selectedMode === 'daily' && (
              <Text style={styles.dailyHint}>
                {dailyCompletedToday
                  ? copy.home.dailyCompletedHint
                  : copy.home.dailyTarget(dailyQuestionLimit)}
              </Text>
            )}
            {selectedMode === 'custom' && (
              <Text style={styles.dailyHint}>
                {copy.home.customHint(customTraining.durationSeconds, customTraining.questionLimit)}
              </Text>
            )}
          </View>

          <Animated.View
            style={{
              transform: [
                {
                  scale: ctaPulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.015],
                  }),
                },
              ],
            }}
          >
            <PrimaryButton
              disabled={startDisabled}
              onPress={onStart}
            >
              {startDisabled
                ? copy.home.completedToday
                : copy.home.startMode(copy.labels.mode[selectedMode])}
            </PrimaryButton>
          </Animated.View>

          <PrimaryButton onPress={onInsights} variant="secondary">
            {copy.home.openInsights}
          </PrimaryButton>

          <PrimaryButton onPress={onPremium} variant="secondary">
            {progress.monetization.tier === 'premium'
              ? copy.home.managePremium
              : copy.home.goPremium}
          </PrimaryButton>

          <PrimaryButton onPress={onCustomTraining} variant="secondary">
            {progress.monetization.tier === 'premium'
              ? copy.home.editCustomTraining
              : copy.home.customTraining}
          </PrimaryButton>
        </Card>
      </Animated.View>

      <Animated.View style={revealStyle(historyReveal, 28)}>
        <Card style={styles.historyCard}>
          <Text style={styles.featureTitle}>{copy.home.recentRuns}</Text>
          {recentSessions.length === 0 ? (
            <Text style={styles.featureBody}>{copy.home.recentRunsEmpty}</Text>
          ) : (
            recentSessions.map((item, index) => (
              <View key={`${item.sessionId}-${index}`} style={styles.historyRow}>
                <View style={styles.historyColumn}>
                  <Text style={styles.featureBody}>
                    {copy.home.recentRunTitle(index + 1, copy.labels.mode[item.mode], item.score)}
                  </Text>
                  <Text style={styles.historyMeta}>{formatQuestionTypes(item.questionTypes, copy)}</Text>
                </View>
                <Text style={styles.historyMeta}>
                  {copy.home.recentRunMeta(Math.round(item.accuracyRate * 100), item.bestCombo)}
                </Text>
              </View>
            ))
          )}
        </Card>
      </Animated.View>
    </Screen>
  );
}

interface SelectionChipProps {
  label: string;
  meta: string;
  selected: boolean;
  locked: boolean;
  disabled?: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}

function SelectionChip({
  label,
  meta,
  selected,
  locked,
  disabled = false,
  onPress,
  styles,
}: SelectionChipProps) {
  return (
    <Pressable
      disabled={locked || disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        locked && styles.chipLocked,
        disabled && !locked && styles.chipDisabled,
        pressed && !locked && styles.chipPressed,
      ]}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
      <Text style={[styles.chipMeta, selected && styles.chipMetaSelected]}>{meta}</Text>
    </Pressable>
  );
}

function formatQuestionTypes(
  types: QuestionType[],
  copy: ReturnType<typeof useLocalization>['copy'],
): string {
  if (types.length === 0) {
    return copy.common.none;
  }

  return types.map((type) => copy.labels.questionType[type]).join(' + ');
}

function formatModeDuration(
  mode: GameMode,
  sprintDurationSeconds: number,
  customTraining: GameProgress['customTraining'],
  copy: ReturnType<typeof useLocalization>['copy'],
): string {
  if (mode === 'custom') {
    const policy = GAME_MODE_POLICIES.custom;
    const durationSeconds = customTraining?.durationSeconds ?? policy.defaultDurationSeconds;
    const questionLimit = customTraining?.questionLimit ?? policy.questionLimit ?? 0;
    return copy.home.modeDurationWithLimit(durationSeconds, questionLimit);
  }

  if (mode === 'daily') {
    const policy = GAME_MODE_POLICIES.daily;
    return copy.home.modeDurationWithLimit(policy.defaultDurationSeconds, policy.questionLimit ?? 0);
  }

  if (mode === 'sprint') {
    return copy.home.modeDurationTimed(sprintDurationSeconds);
  }

  const policy = GAME_MODE_POLICIES[mode];
  return policy.timed ? copy.home.modeDurationTimed(policy.defaultDurationSeconds) : copy.common.untimed;
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
    ],
  } as const;
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    kicker: {
      color: theme.colors.textTertiary,
      ...theme.typography.caption,
    },
    heroWrap: {
      gap: theme.spacing.sm,
    },
    hero: {
      color: theme.colors.textPrimary,
      ...theme.typography.hero,
    },
    heroBody: {
      color: theme.colors.textSecondary,
      ...theme.typography.subtitle,
      maxWidth: 360,
    },
    statsCard: {
      gap: theme.spacing.md,
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    statLabel: {
      color: theme.colors.textTertiary,
      ...theme.typography.caption,
    },
    statValue: {
      marginTop: theme.spacing.xs,
      color: theme.colors.textPrimary,
      ...theme.typography.metric,
    },
    modePill: {
      alignSelf: 'flex-start',
      borderRadius: theme.radius.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.accentSoft,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
    },
    modePillText: {
      color: theme.colors.accent,
      ...theme.typography.caption,
    },
    selectionBlock: {
      gap: theme.spacing.xs,
    },
    selectionTitle: {
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
    },
    selectionRow: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    selectionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
    selectionHint: {
      color: theme.colors.textTertiary,
      ...theme.typography.caption,
    },
    dailyHint: {
      color: theme.colors.accent,
      ...theme.typography.caption,
    },
    chip: {
      flex: 1,
      minWidth: 88,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
      gap: 2,
    },
    chipSelected: {
      borderColor: theme.colors.brand,
      backgroundColor: theme.colors.brandSoft,
    },
    chipLocked: {
      opacity: 0.48,
    },
    chipDisabled: {
      opacity: 0.8,
    },
    chipPressed: {
      transform: [{ scale: 0.99 }],
    },
    chipLabel: {
      color: theme.colors.textPrimary,
      ...theme.typography.caption,
    },
    chipLabelSelected: {
      color: theme.colors.brand,
    },
    chipMeta: {
      color: theme.colors.textTertiary,
      fontSize: 10,
      lineHeight: 12,
      fontWeight: '600',
    },
    chipMetaSelected: {
      color: theme.colors.textSecondary,
    },
    historyCard: {
      gap: theme.spacing.sm,
    },
    historyRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    historyColumn: {
      flex: 1,
      gap: 2,
    },
    historyMeta: {
      color: theme.colors.textTertiary,
      ...theme.typography.caption,
      textAlign: 'right',
    },
    featureTitle: {
      color: theme.colors.textPrimary,
      ...theme.typography.subtitle,
    },
    featureBody: {
      color: theme.colors.textSecondary,
      ...theme.typography.body,
    },
  });
}

function levelFromXp(xp: number): number {
  return Math.floor(Math.max(0, xp) / 100) + 1;
}
