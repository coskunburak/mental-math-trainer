import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Container } from '@app/di/container';
import { TOKENS } from '@app/di/tokens';
import { useLocalization } from '@app/i18n';
import { useAppTheme } from '@app/theme';
import { gameEvents, purchaseEvents } from '@core/analytics/events';
import type { GameProgress } from '@features/game/domain/entities/GameProgress';
import { DEFAULT_GAME_PROGRESS } from '@features/game/domain/entities/GameProgress';
import { GAME_MODE_POLICIES, type GameMode } from '@features/game/domain/entities/GameMode';
import { buildEntitlements } from '@features/game/domain/entities/Monetization';
import type { QuestionType } from '@features/game/domain/entities/Question';
import {
  buildDailyChallengePlan,
  isDailyChallengeCompletedToday,
  toLocalDateKey,
} from '@features/game/domain/services/daily/DailyChallenge';
import { NeuroFusionModeSelectScreen } from '@features/game/neurofusion/presentation/screens/NeuroFusionModeSelectScreen';
import { NeuroFusionCalibrationScreen } from '@features/game/neurofusion/presentation/screens/NeuroFusionCalibrationScreen';
import { NeuroFusionRunScreen } from '@features/game/neurofusion/presentation/screens/NeuroFusionRunScreen';
import { NeuroFusionResultScreen } from '@features/game/neurofusion/presentation/screens/NeuroFusionResultScreen';
import {
  NeuroFusionStore,
  type NeuroFusionSessionConfig,
} from '@features/game/neurofusion/presentation/state/neuroFusionStore';
import type {
  NeuroFusionProgressData,
  NeuroFusionRunSummary,
} from '@features/game/neurofusion/domain/entities/NeuroFusionTypes';
import { DEFAULT_NEURO_FUSION_PROGRESS } from '@features/game/neurofusion/data/NeuroFusionProgressStore';
import { CalibrateBeatOffset } from '@features/game/neurofusion/domain/usecases/CalibrateBeatOffset';
import { NeuroFusionAnalytics } from '@features/game/neurofusion/domain/services/NeuroFusionAnalytics';
import { NeuroPassScreen } from '@features/neuroPass/presentation/screens/NeuroPassScreen';
import { NeuroPassStore } from '@features/neuroPass/presentation/store/neuroPassStore';
import type { NeuroPassDashboard } from '@features/neuroPass/domain/models/NeuroPassDashboard';
import { useNeuroPassProgress } from '@features/neuroPass/presentation/hooks/useNeuroPassProgress';
import { NeuroPassHomeCard } from '@features/neuroPass/presentation/components/NeuroPassHomeCard';
import { type NeuroPassRunSummaryInput } from '@features/neuroPass/domain/usecases/GrantNeuroPassXpFromRun';
import type { UpdateQuestsFromRunSummaryInput } from '@features/neuroPass/domain/usecases/UpdateQuestsFromRunSummary';
import {
  computeUnlockState,
  type UnlockState,
} from '@features/game/domain/services/unlocks/Unlocks';
import { CustomTrainingScreen } from '@features/game/presentation/screens/CustomTrainingScreen';
import { GameScreen } from '@features/game/presentation/screens/GameScreen';
import { InsightsScreen } from '@features/game/presentation/screens/InsightsScreen';
import { PremiumScreen } from '@features/game/presentation/screens/PremiumScreen';
import { ResultScreen } from '@features/game/presentation/screens/ResultScreen';
import { ThemeShowcaseScreen } from '@features/game/presentation/screens/ThemeShowcaseScreen';
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

type Scene =
  | 'home'
  | 'game'
  | 'result'
  | 'insights'
  | 'premium'
  | 'custom_training'
  | 'theme_showcase'
  | 'neuro_pass'
  | 'neuro_fusion_select'
  | 'neuro_fusion_calibration'
  | 'neuro_fusion_run'
  | 'neuro_fusion_result';

const REWARDED_BONUS_XP = 20;

const MODE_ORDER: GameMode[] = ['daily', 'sprint', 'neuro_fusion', 'custom', 'zen', 'survival'];
const QUESTION_TYPE_ORDER: QuestionType[] = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
];

const MODE_UNLOCK_LEVEL: Record<GameMode, number> = {
  custom: 1,
  daily: 1,
  sprint: 1,
  zen: 2,
  survival: 4,
  neuro_fusion: 6,
};

const QUESTION_UNLOCK_LEVEL: Record<QuestionType, number> = {
  addition: 1,
  subtraction: 1,
  multiplication: 3,
  division: 5,
};

export function RootNavigator({ container }: RootNavigatorProps) {
  const { setUnlockContext } = useAppTheme();
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
      neuroFusionProgressStore: container.resolve(TOKENS.neuroFusionProgressStore),
      neuroPassStoreFactory: container.resolve(TOKENS.neuroPassStoreFactory),
      neuroPassLoadDashboard: container.resolve(TOKENS.neuroPassLoadDashboard),
      neuroPassGrantXpFromRun: container.resolve(TOKENS.neuroPassGrantXpFromRun),
      neuroPassUpdateQuestsFromRunSummary: container.resolve(
        TOKENS.neuroPassUpdateQuestsFromRunSummary,
      ),
      neuroPassOfferEngine: container.resolve(TOKENS.neuroPassOfferEngine),
      neuroPassLocalStore: container.resolve(TOKENS.neuroPassLocalStore),
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
  const [neuroPassStore, setNeuroPassStore] = useState<NeuroPassStore | null>(null);
  const [neuroFusionStore, setNeuroFusionStore] = useState<NeuroFusionStore | null>(null);
  const [neuroFusionSummary, setNeuroFusionSummary] = useState<NeuroFusionRunSummary | null>(null);
  const [neuroFusionSessionConfig, setNeuroFusionSessionConfig] =
    useState<NeuroFusionSessionConfig>({
      preset: 'standard',
      modeVariant: 'standard',
      bpm: 120,
      trackId: 'metro_130',
    });
  const [neuroFusionProgress, setNeuroFusionProgress] = useState<NeuroFusionProgressData>(
    DEFAULT_NEURO_FUSION_PROGRESS,
  );
  const [neuroFusionCalibrationTaps, setNeuroFusionCalibrationTaps] = useState<number[]>([]);
  const [neuroFusionCalibrationBpm, setNeuroFusionCalibrationBpm] = useState(120);
  const [inventoryCoinsTotal, setInventoryCoinsTotal] = useState(0);
  const [inventoryCoinsGained, setInventoryCoinsGained] = useState(0);
  const inventoryCoinsRef = useRef(0);
  const coinGainResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const neuroPassEntryCoinsRef = useRef<number | null>(null);

  const neuroPassProgress = useNeuroPassProgress(services.neuroPassLoadDashboard);

  const neuroFusionAnalytics = useMemo(
    () => new NeuroFusionAnalytics(services.analytics),
    [services.analytics],
  );
  const calibrateBeatOffset = useMemo(() => new CalibrateBeatOffset(), []);

  const clearCoinGainReset = useCallback(() => {
    if (!coinGainResetTimeoutRef.current) {
      return;
    }
    clearTimeout(coinGainResetTimeoutRef.current);
    coinGainResetTimeoutRef.current = null;
  }, []);

  const showCoinGain = useCallback(
    (coins: number) => {
      if (coins <= 0) {
        return;
      }

      setInventoryCoinsGained(coins);
      clearCoinGainReset();
      coinGainResetTimeoutRef.current = setTimeout(() => {
        setInventoryCoinsGained(0);
        coinGainResetTimeoutRef.current = null;
      }, 2600);
    },
    [clearCoinGainReset],
  );

  const syncCoinHud = useCallback(
    (totalCoins: number, gainHint?: number) => {
      const nextTotal = Math.max(0, Math.floor(totalCoins));
      const inferredGain = Math.max(0, nextTotal - inventoryCoinsRef.current);
      const normalizedGain = Math.max(0, Math.floor(gainHint ?? inferredGain));

      inventoryCoinsRef.current = nextTotal;
      setInventoryCoinsTotal(nextTotal);
      showCoinGain(normalizedGain);
    },
    [showCoinGain],
  );

  const refreshCoinHudFromInventory = useCallback(
    async (options?: { gainHint?: number; baselineCoins?: number }) => {
      try {
        const inventory = await services.neuroPassLocalStore.readInventory();
        const baselineGain =
          typeof options?.baselineCoins === 'number'
            ? Math.max(0, inventory.coins - Math.max(0, Math.floor(options.baselineCoins)))
            : undefined;
        const gainHint = baselineGain ?? options?.gainHint;
        syncCoinHud(inventory.coins, gainHint);
        return inventory;
      } catch {
        return null;
      }
    },
    [services.neuroPassLocalStore, syncCoinHud],
  );

  useEffect(() => {
    void refreshCoinHudFromInventory({ gainHint: 0 });
  }, [refreshCoinHudFromInventory]);

  useEffect(
    () => () => {
      clearCoinGainReset();
    },
    [clearCoinGainReset],
  );

  const unlockState = useMemo(
    () => computeUnlockState(progress.player.level),
    [progress.player.level],
  );
  const now = Date.now();
  const dailyPlan = buildDailyChallengePlan(progress.player.level, now);
  const dailyCompletedToday = isDailyChallengeCompletedToday(progress, now);
  const entitlements = buildEntitlements(progress.monetization.tier);

  useEffect(() => {
    const currentTime = Date.now();
    const seasonStart = Date.parse('2026-06-01T00:00:00.000Z');
    const seasonEnd = Date.parse('2026-08-31T23:59:59.000Z');
    const campaignStart = Date.parse('2026-03-01T00:00:00.000Z');
    const campaignEnd = Date.parse('2026-04-15T23:59:59.000Z');

    const activeSeasonIds =
      currentTime >= seasonStart && currentTime <= seasonEnd ? ['summer_drop'] : [];
    const activeCampaignIds =
      currentTime >= campaignStart && currentTime <= campaignEnd ? ['festival_drop_2026'] : [];

    setUnlockContext({
      tier: progress.monetization.tier,
      streakDays: progress.lifetime.streakDays,
      referralCount: 0,
      purchasedThemeIds: [],
      activeSeasonIds,
      activeCampaignIds,
      collabPassIds: [],
      now: currentTime,
    });
  }, [progress.lifetime.streakDays, progress.monetization.tier, setUnlockContext]);

  useEffect(() => {
    setCustomTraining(progress.customTraining);
  }, [progress.customTraining]);

  useEffect(() => {
    let active = true;

    services.neuroFusionProgressStore
      .load()
      .then((loaded) => {
        if (!active) {
          return;
        }
        setNeuroFusionProgress(loaded);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setNeuroFusionProgress(DEFAULT_NEURO_FUSION_PROGRESS);
      });

    return () => {
      active = false;
    };
  }, [services.neuroFusionProgressStore]);

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

  const openNeuroFusionSelect = () => {
    neuroFusionAnalytics.trackScreenView('neurofusion_select');
    setNeuroFusionSummary(null);
    setScene('neuro_fusion_select');
  };

  const startNeuroFusionRun = (config: NeuroFusionSessionConfig) => {
    let sessionConfig = { ...config };
    let nextProgress = neuroFusionProgress;

    if (config.modeVariant === 'daily_challenge') {
      const dateKey = toLocalDateKey(Date.now());
      const resolved = services.neuroFusionProgressStore.resolveDailySeed(nextProgress, dateKey);
      sessionConfig = {
        ...sessionConfig,
        seedOverride: resolved.seed,
      };
      nextProgress = resolved.progress;
      setNeuroFusionProgress(nextProgress);
      void services.neuroFusionProgressStore.save(nextProgress);
    }

    const nextStore = new NeuroFusionStore(
      {
        analyticsService: services.analytics,
        progressStore: services.neuroFusionProgressStore,
      },
      sessionConfig,
      nextProgress,
    );

    setNeuroFusionSessionConfig(sessionConfig);
    setNeuroFusionStore(nextStore);
    setNeuroFusionSummary(null);
    setNeuroFusionCalibrationBpm(config.bpm ?? 120);
    setScene('neuro_fusion_run');
  };

  const finishNeuroFusionRun = (runSummary: NeuroFusionRunSummary) => {
    setNeuroFusionSummary(runSummary);

    const latestNeuroProgress = neuroFusionStore?.getState().progress ?? neuroFusionProgress;
    setNeuroFusionProgress(latestNeuroProgress);

    setProgress((previous) => {
      const next = applyNeuroFusionSummaryToProgress(previous, runSummary);
      void services.gameProgressStore.save(next);
      return next;
    });

    void services.neuroPassLocalStore
      .applyCurrencyDeltaToInventory({
        coins: runSummary.rewards.coins,
        trackFragments: runSummary.rewards.trackFragments,
      })
      .then((inventory) => {
        syncCoinHud(inventory.coins, runSummary.rewards.coins);
      })
      .catch(() => {
        void refreshCoinHudFromInventory();
      });

    setScene('neuro_fusion_result');
  };

  const grantNeuroPassXpFromRun = useCallback(
    async (runSummary: NeuroFusionRunSummary) => {
      const grantResult = await services.neuroPassGrantXpFromRun.execute(
        mapNeuroFusionSummaryToPassRunInput(runSummary),
      );

      let showPremiumUpsellHint = false;
      let premiumUpsellMessage: string | undefined;

      if (!grantResult.isDuplicate) {
        try {
          await services.neuroPassUpdateQuestsFromRunSummary.execute(
            mapNeuroFusionSummaryToQuestRunInput(runSummary),
          );
        } catch {
          // Quest progression must never block run result flow.
        }

        await neuroPassProgress.refresh('cached_only');

        try {
          const dashboard = await services.neuroPassLoadDashboard.execute({
            strategy: 'cached_first',
          });
          const hint = services.neuroPassOfferEngine.buildPostRunUpsellHint({
            dashboard,
            gainedNxp: grantResult.grantedAmount,
          });

          if (hint.visible) {
            const nowIso = new Date().toISOString();
            const lastUpsellAtUtc = await services.neuroPassLocalStore.readLastUpsellAtUtc();
            const canShow = services.neuroPassOfferEngine.canShowUpsellSurface({
              nowUtcIso: nowIso,
              lastUpsellAtUtc,
            });

            if (canShow) {
              services.neuroPassOfferEngine.markUpsellShown();
              await services.neuroPassLocalStore.writeLastUpsellAtUtc(nowIso);
              showPremiumUpsellHint = true;
              premiumUpsellMessage = hint.message;
            }
          }
        } catch {
          showPremiumUpsellHint = false;
        }
      }

      return {
        ...grantResult,
        showPremiumUpsellHint,
        premiumUpsellMessage,
      };
    },
    [
      neuroPassProgress,
      services.neuroPassGrantXpFromRun,
      services.neuroPassLoadDashboard,
      services.neuroPassLocalStore,
      services.neuroPassOfferEngine,
      services.neuroPassUpdateQuestsFromRunSummary,
    ],
  );

  const openNeuroFusionCalibration = (bpm: number) => {
    setNeuroFusionCalibrationBpm(bpm);
    setNeuroFusionCalibrationTaps([]);
    setScene('neuro_fusion_calibration');
  };

  const registerNeuroFusionCalibrationTap = () => {
    setNeuroFusionCalibrationTaps((previous) => {
      const taps = [...previous, Date.now()];
      if (taps.length < 10) {
        return taps;
      }

      const result = calibrateBeatOffset.execute({
        tapTimestampsMs: taps,
        bpm: neuroFusionCalibrationBpm,
        referenceStartMs: taps[0],
      });

      const updatedProgress = services.neuroFusionProgressStore.upsertCalibration(
        neuroFusionProgress,
        result,
      );
      setNeuroFusionProgress(updatedProgress);
      void services.neuroFusionProgressStore.save(updatedProgress);
      neuroFusionAnalytics.trackCalibrationCompleted(result.offsetMs, result.stdDevMs);
      setScene('neuro_fusion_select');
      return [];
    });
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

    if (selectedMode === 'neuro_fusion') {
      openNeuroFusionSelect();
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
    void neuroPassProgress.refresh('cached_only');
    const baselineCoins = neuroPassEntryCoinsRef.current;
    neuroPassEntryCoinsRef.current = null;
    void refreshCoinHudFromInventory({
      baselineCoins: typeof baselineCoins === 'number' ? baselineCoins : undefined,
    });
    setScene('home');
    setStore(null);
    setNeuroPassStore(null);
    setNeuroFusionStore(null);
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

  const openNeuroPass = () => {
    void services.neuroPassLocalStore
      .readInventory()
      .then((inventory) => {
        neuroPassEntryCoinsRef.current = inventory.coins;
      })
      .catch(() => {
        neuroPassEntryCoinsRef.current = null;
      });
    const nextStore = services.neuroPassStoreFactory();
    setNeuroPassStore(nextStore);
    setScene('neuro_pass');
  };

  const openThemeShowcase = () => {
    services.analytics.track(gameEvents.themeShowcaseViewed, {
      source: scene,
      tier: progress.monetization.tier,
    });
    setScene('theme_showcase');
  };

  const trackThemeSelected = (themeId: string, category: string) => {
    services.analytics.track(gameEvents.themeSelected, {
      theme_id: themeId,
      category,
      tier: progress.monetization.tier,
    });
  };

  const trackThemeUpsellPressed = (themeId: string, category: string) => {
    services.analytics.track(purchaseEvents.themeUpsellPressed, {
      theme_id: themeId,
      category,
      tier: progress.monetization.tier,
    });
  };

  const startCustomTraining = () => {
    setSelectedMode('custom');
    const allowedFromUnlocks = customTraining.questionTypes.filter((type) =>
      unlockState.unlockedQuestionTypes.includes(type),
    );
    const allowedQuestionTypes =
      allowedFromUnlocks.length > 0
        ? allowedFromUnlocks
        : [unlockState.unlockedQuestionTypes[0] ?? 'addition'];

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

  const playNeuroFusionAgain = () => {
    startNeuroFusionRun(neuroFusionSessionConfig);
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
        onThemeShowcase={openThemeShowcase}
        onBack={backHome}
      />
    );
  }

  if (scene === 'theme_showcase') {
    return (
      <ThemeShowcaseScreen
        tier={progress.monetization.tier}
        onUpgrade={upgradePremium}
        onThemeSelected={trackThemeSelected}
        onThemeUpsellPressed={trackThemeUpsellPressed}
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

  if (scene === 'neuro_pass' && neuroPassStore) {
    return (
      <NeuroPassScreen
        store={neuroPassStore}
        onBack={backHome}
        onInventoryChanged={(inventory) => {
          syncCoinHud(inventory.coins);
        }}
      />
    );
  }

  if (scene === 'neuro_fusion_select') {
    return (
      <NeuroFusionModeSelectScreen
        entitlements={entitlements}
        progress={neuroFusionProgress}
        calibration={neuroFusionProgress.calibration}
        onStart={startNeuroFusionRun}
        onCalibrate={openNeuroFusionCalibration}
        onBack={backHome}
        onOpenPremium={openPremium}
      />
    );
  }

  if (scene === 'neuro_fusion_calibration') {
    return (
      <NeuroFusionCalibrationScreen
        bpm={neuroFusionCalibrationBpm}
        tapCount={neuroFusionCalibrationTaps.length}
        targetTapCount={10}
        onTap={registerNeuroFusionCalibrationTap}
        onCancel={() => setScene('neuro_fusion_select')}
      />
    );
  }

  if (scene === 'neuro_fusion_run' && neuroFusionStore) {
    return <NeuroFusionRunScreen store={neuroFusionStore} onFinished={finishNeuroFusionRun} />;
  }

  if (scene === 'neuro_fusion_result' && neuroFusionSummary) {
    return (
      <NeuroFusionResultScreen
        summary={neuroFusionSummary}
        progress={neuroFusionProgress}
        onGrantNeuroPassXp={grantNeuroPassXpFromRun}
        onOpenNeuroPass={openNeuroPass}
        onRunAgain={playNeuroFusionAgain}
        onBackHome={backHome}
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
      onThemeShowcase={openThemeShowcase}
      onCustomTraining={openCustomTraining}
      onNeuroPass={openNeuroPass}
      neuroPassDashboard={neuroPassProgress.state.dashboard}
      neuroPassLoading={neuroPassProgress.state.loading}
      sprintDurationSeconds={services.env.sessionDurationSeconds}
      inventoryCoinsTotal={inventoryCoinsTotal}
      inventoryCoinsGained={inventoryCoinsGained}
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
  onThemeShowcase: () => void;
  onCustomTraining: () => void;
  onNeuroPass: () => void;
  neuroPassDashboard: NeuroPassDashboard;
  neuroPassLoading: boolean;
  sprintDurationSeconds: number;
  inventoryCoinsTotal: number;
  inventoryCoinsGained: number;
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
  onThemeShowcase,
  onCustomTraining,
  onNeuroPass,
  neuroPassDashboard,
  neuroPassLoading,
  sprintDurationSeconds,
  inventoryCoinsTotal,
  inventoryCoinsGained,
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
  const selectedModeDuration = formatModeDuration(
    selectedMode,
    sprintDurationSeconds,
    customTraining,
    copy,
  );
  const displayedQuestionTypes =
    selectedMode === 'daily'
      ? dailyQuestionTypes
      : selectedMode === 'custom'
        ? customTraining.questionTypes
        : selectedMode === 'neuro_fusion'
          ? QUESTION_TYPE_ORDER
          : selectedQuestionTypes;
  const selectedOperationsLabel = formatQuestionTypes(displayedQuestionTypes, copy);
  const startDisabled = selectedMode === 'daily' && dailyCompletedToday;

  return (
    <Screen>
      <Animated.View style={revealStyle(topReveal, 12)}>
        <View style={styles.topRow}>
          <Text style={styles.kicker}>{copy.home.kicker}</Text>
          <View style={styles.topRight}>
            <View style={styles.coinHud}>
              {inventoryCoinsGained > 0 ? (
                <Text style={styles.coinGain}>{copy.home.coinsEarned(inventoryCoinsGained)}</Text>
              ) : null}
              <Text style={styles.coinTotal}>{copy.home.coinsTotal(inventoryCoinsTotal)}</Text>
            </View>
            <ThemeModeSwitch />
          </View>
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

          <NeuroPassHomeCard
            dashboard={neuroPassDashboard}
            loading={neuroPassLoading}
            onOpen={onNeuroPass}
          />

          <View style={styles.selectionBlock}>
            <Text style={styles.selectionTitle}>{copy.home.modeTitle}</Text>
            <View style={styles.modeGrid}>
              {MODE_ORDER.map((mode) => {
                const unlocked = unlockState.unlockedModes.includes(mode);
                const isNeuroFusion = mode === 'neuro_fusion';
                return (
                  <View key={mode} style={styles.modeCell}>
                    <SelectionChip
                      label={copy.labels.mode[mode]}
                      meta={
                        unlocked
                          ? formatModeDuration(mode, sprintDurationSeconds, customTraining, copy)
                          : copy.home.unlockLevel(MODE_UNLOCK_LEVEL[mode])
                      }
                      selected={selectedMode === mode}
                      locked={!unlocked}
                      featured={isNeuroFusion}
                      featuredTag={isNeuroFusion ? copy.home.flagshipTag : undefined}
                      variant="mode"
                      onPress={() => onModeChange(mode)}
                      styles={styles}
                    />
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.selectionBlock}>
            <Text style={styles.selectionTitle}>{copy.home.operationsTitle}</Text>
            <View style={styles.operationGrid}>
              {QUESTION_TYPE_ORDER.map((type) => {
                const unlocked = unlockState.unlockedQuestionTypes.includes(type);
                const lockedByPreset =
                  selectedMode === 'daily' ||
                  selectedMode === 'custom' ||
                  selectedMode === 'neuro_fusion';
                return (
                  <View key={type} style={styles.operationCell}>
                    <SelectionChip
                      label={copy.labels.questionType[type]}
                      meta={
                        unlocked
                          ? lockedByPreset
                            ? selectedMode === 'daily'
                              ? copy.home.dailySet
                              : selectedMode === 'custom'
                                ? copy.home.customSet
                                : copy.home.neuroFusionSet
                            : copy.home.ready
                          : copy.home.unlockLevel(QUESTION_UNLOCK_LEVEL[type])
                      }
                      selected={displayedQuestionTypes.includes(type)}
                      locked={!unlocked}
                      disabled={lockedByPreset}
                      variant="operation"
                      onPress={() => onToggleQuestionType(type)}
                      styles={styles}
                    />
                  </View>
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
            {selectedMode === 'neuro_fusion' && (
              <Text style={styles.dailyHint}>{copy.home.neuroFusionHint}</Text>
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
            <PrimaryButton disabled={startDisabled} onPress={onStart}>
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

          <PrimaryButton onPress={onThemeShowcase} variant="secondary">
            {copy.home.themeShowcase}
          </PrimaryButton>

          <PrimaryButton onPress={onNeuroPass} variant="secondary">
            Neuro Pass
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
                  <Text style={styles.historyMeta}>
                    {formatQuestionTypes(item.questionTypes, copy)}
                  </Text>
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
  featured?: boolean;
  featuredTag?: string;
  variant: 'mode' | 'operation';
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}

function SelectionChip({
  label,
  meta,
  selected,
  locked,
  disabled = false,
  featured = false,
  featuredTag,
  variant,
  onPress,
  styles,
}: SelectionChipProps) {
  return (
    <Pressable
      disabled={locked || disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        variant === 'mode' ? styles.modeChip : styles.operationChip,
        featured && styles.chipFeatured,
        selected && styles.chipSelected,
        locked && styles.chipLocked,
        disabled && !locked && styles.chipDisabled,
        pressed && !locked && styles.chipPressed,
      ]}
    >
      <View style={styles.chipTop}>
        <Text
          numberOfLines={variant === 'mode' ? 2 : 1}
          style={[styles.chipLabel, selected && styles.chipLabelSelected]}
        >
          {label}
        </Text>
      </View>
      {featuredTag ? (
        <View style={styles.chipTagBadge}>
          <Text numberOfLines={1} style={styles.chipTag}>
            {featuredTag}
          </Text>
        </View>
      ) : null}
      <Text numberOfLines={2} style={[styles.chipMeta, selected && styles.chipMetaSelected]}>
        {meta}
      </Text>
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
    return copy.home.modeDurationWithLimit(
      policy.defaultDurationSeconds,
      policy.questionLimit ?? 0,
    );
  }

  if (mode === 'sprint') {
    return copy.home.modeDurationTimed(sprintDurationSeconds);
  }

  const policy = GAME_MODE_POLICIES[mode];
  return policy.timed
    ? copy.home.modeDurationTimed(policy.defaultDurationSeconds)
    : copy.common.untimed;
}

function applyNeuroFusionSummaryToProgress(
  progress: GameProgress,
  summary: NeuroFusionRunSummary,
): GameProgress {
  const totalAnswers = Object.values(summary.phaseBreakdown).reduce(
    (sum, item) => sum + item.total,
    0,
  );
  const correctAnswers = Object.values(summary.phaseBreakdown).reduce(
    (sum, item) => sum + item.correct,
    0,
  );

  const totalXp = progress.player.xp + summary.rewards.xp;
  const levelAfter = levelFromXp(totalXp);
  const nowDateKey = new Date(summary.endedAtMs).toISOString().slice(0, 10);

  const mappedSummary: GameSessionSummary = {
    sessionId: summary.runId,
    mode: 'neuro_fusion',
    questionTypes: ['addition', 'subtraction', 'multiplication', 'division'],
    score: summary.score,
    accuracyRate: summary.accuracy,
    correctAnswers,
    totalAnswers,
    bestCombo: summary.bestCombo,
    durationSeconds: summary.durationSeconds,
    averageResponseTimeMs: Math.max(280, Math.round(summary.avgBeatOffsetMs * 7)),
    questionTypeStats: {},
    endedAt: summary.endedAtMs,
    gainedXp: summary.rewards.xp,
    totalXp,
    levelBefore: progress.player.level,
    levelAfter,
    reason: 'manual',
  };

  const modeStats = progress.analytics.mode.neuro_fusion;

  return {
    ...progress,
    player: {
      xp: totalXp,
      level: levelAfter,
    },
    lifetime: {
      ...progress.lifetime,
      sessionsPlayed: progress.lifetime.sessionsPlayed + 1,
      totalAnswers: progress.lifetime.totalAnswers + totalAnswers,
      totalCorrectAnswers: progress.lifetime.totalCorrectAnswers + correctAnswers,
      bestScore: Math.max(progress.lifetime.bestScore, summary.score),
      bestCombo: Math.max(progress.lifetime.bestCombo, summary.bestCombo),
      totalPlayTimeSeconds: progress.lifetime.totalPlayTimeSeconds + summary.durationSeconds,
      streakDays:
        progress.lifetime.lastPlayedDate === nowDateKey
          ? progress.lifetime.streakDays
          : progress.lifetime.streakDays + 1,
      lastPlayedDate: nowDateKey,
    },
    analytics: {
      ...progress.analytics,
      mode: {
        ...progress.analytics.mode,
        neuro_fusion: {
          sessionsPlayed: modeStats.sessionsPlayed + 1,
          bestScore: Math.max(modeStats.bestScore, summary.score),
          totalScore: modeStats.totalScore + summary.score,
          totalAnswers: modeStats.totalAnswers + totalAnswers,
          totalCorrectAnswers: modeStats.totalCorrectAnswers + correctAnswers,
          totalDurationSeconds: modeStats.totalDurationSeconds + summary.durationSeconds,
          totalResponseTimeMs:
            modeStats.totalResponseTimeMs + mappedSummary.averageResponseTimeMs * totalAnswers,
        },
      },
    },
    recentSessions: [mappedSummary, ...progress.recentSessions].slice(0, 12),
  };
}

function mapNeuroFusionSummaryToPassRunInput(
  summary: NeuroFusionRunSummary,
): NeuroPassRunSummaryInput {
  const totalAnswers = Object.values(summary.phaseBreakdown).reduce(
    (sum, phase) => sum + Math.max(0, phase.total),
    0,
  );
  const correctAnswers = Object.values(summary.phaseBreakdown).reduce(
    (sum, phase) => sum + Math.max(0, phase.correct),
    0,
  );
  const offbeatAnswers = Object.values(summary.phaseBreakdown).reduce(
    (sum, phase) => sum + Math.max(0, phase.offbeat),
    0,
  );
  const wrongAnswers = Math.max(0, totalAnswers - correctAnswers);
  const tapRatePerSecond =
    summary.durationSeconds > 0 ? totalAnswers / Math.max(1, summary.durationSeconds) : 0;
  const offbeatRate = totalAnswers > 0 ? offbeatAnswers / totalAnswers : 0;

  // Local deterministic anti-abuse proxy from run telemetry currently available in summary.
  const invalidInputCount = Math.max(0, Math.round(wrongAnswers * 0.45 + offbeatAnswers * 0.2));
  const rapidRepeatWrongCount = Math.max(0, Math.floor(wrongAnswers / 6));
  const spamFlags =
    (tapRatePerSecond > 9.5 ? 1 : 0) +
    (offbeatRate > 0.55 ? 1 : 0) +
    (summary.avgBeatOffsetMs > 230 ? 1 : 0);

  return {
    runId: summary.runId,
    grade: summary.grade,
    accuracy: summary.accuracy,
    avgBeatOffsetMs: summary.avgBeatOffsetMs,
    bestCombo: summary.bestCombo,
    phasesPlayed: Object.entries(summary.phaseBreakdown)
      .filter(([, stats]) => stats.total > 0)
      .map(([phase]) => phase),
    phaseBreakdown: summary.phaseBreakdown,
    antiSpamSignals: {
      tapRatePerSecond,
      invalidInputCount,
      rapidRepeatWrongCount,
      spamFlags,
    },
  };
}

function mapNeuroFusionSummaryToQuestRunInput(
  summary: NeuroFusionRunSummary,
): UpdateQuestsFromRunSummaryInput {
  const totalQuestions = Object.values(summary.phaseBreakdown).reduce(
    (sum, phase) => sum + Math.max(0, phase.total),
    0,
  );
  const correctAnswers = Object.values(summary.phaseBreakdown).reduce(
    (sum, phase) => sum + Math.max(0, phase.correct),
    0,
  );
  const offbeatAnswers = Object.values(summary.phaseBreakdown).reduce(
    (sum, phase) => sum + Math.max(0, phase.offbeat),
    0,
  );
  const wrongAnswers = Math.max(0, totalQuestions - correctAnswers);
  const tapRatePerSecond =
    summary.durationSeconds > 0 ? totalQuestions / Math.max(1, summary.durationSeconds) : 0;
  const offbeatRate = totalQuestions > 0 ? offbeatAnswers / totalQuestions : 0;

  const invalidInputCount = Math.max(0, Math.round(wrongAnswers * 0.45 + offbeatAnswers * 0.2));
  const rapidRepeatWrongCount = Math.max(0, Math.floor(wrongAnswers / 6));
  const spamFlags =
    (tapRatePerSecond > 9.5 ? 1 : 0) +
    (offbeatRate > 0.55 ? 1 : 0) +
    (summary.avgBeatOffsetMs > 230 ? 1 : 0);

  const bossStats = summary.phaseBreakdown.boss;
  const bossAccuracy = bossStats.total > 0 ? bossStats.correct / bossStats.total : 0;
  const bossCompleted = bossStats.total > 0 && (bossAccuracy >= 0.5 || summary.grade !== 'C');

  return {
    runId: summary.runId,
    endedAtUtc: new Date(summary.endedAtMs).toISOString(),
    grade: summary.grade,
    accuracy: summary.accuracy,
    bestCombo: summary.bestCombo,
    avgBeatOffsetMs: summary.avgBeatOffsetMs,
    totalQuestions,
    durationMs: Math.max(0, Math.round(summary.durationSeconds * 1000)),
    phasesPlayed: Object.entries(summary.phaseBreakdown)
      .filter(([, stats]) => stats.total > 0)
      .map(([phase]) => phase),
    bossCompleted,
    antiSpamSignals: {
      tapRatePerSecond,
      invalidInputCount,
      rapidRepeatWrongCount,
      spamFlags,
    },
  };
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
    topRight: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: theme.spacing.xs,
    },
    kicker: {
      flex: 1,
      color: theme.colors.textTertiary,
      ...theme.typography.caption,
    },
    coinHud: {
      borderRadius: theme.radius.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceStrong,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 4,
      alignItems: 'flex-end',
      justifyContent: 'center',
      minWidth: 86,
      gap: 1,
    },
    coinGain: {
      color: theme.colors.brand,
      ...theme.typography.caption,
      fontSize: 10,
      lineHeight: 12,
      letterSpacing: 0.2,
    },
    coinTotal: {
      color: theme.colors.textPrimary,
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
    modeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: theme.spacing.xs,
    },
    operationGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: theme.spacing.xs,
    },
    modeCell: {
      width: '32%',
    },
    operationCell: {
      width: '49%',
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
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.xs + 1,
      paddingVertical: theme.spacing.xs + 1,
      gap: 2,
      justifyContent: 'flex-start',
      overflow: 'hidden',
    },
    modeChip: {
      minHeight: 66,
    },
    operationChip: {
      minHeight: 54,
    },
    chipFeatured: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.accentSoft,
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
    chipTop: {
      minHeight: 14,
    },
    chipTagBadge: {
      alignSelf: 'flex-start',
      borderRadius: theme.radius.pill,
      borderWidth: 1,
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.surfaceStrong,
      paddingHorizontal: 6,
      paddingVertical: 1,
      marginTop: 2,
    },
    chipTag: {
      color: theme.colors.accent,
      fontSize: 8,
      lineHeight: 10,
      fontWeight: '800',
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    chipLabel: {
      color: theme.colors.textPrimary,
      ...theme.typography.caption,
      flexShrink: 1,
    },
    chipLabelSelected: {
      color: theme.colors.brand,
    },
    chipMeta: {
      color: theme.colors.textTertiary,
      fontSize: 9,
      lineHeight: 11,
      fontWeight: '600',
      marginTop: 2,
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
