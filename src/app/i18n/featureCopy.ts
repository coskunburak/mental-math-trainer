type NeuroFusionPhaseType = 'rhythm_math' | 'puzzle' | 'cognitive_blend' | 'boss';
type NeuroPassSeasonState = 'preseason' | 'active' | 'grace' | 'ended';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function formatDurationCompact(ms: number, dayUnit: string, hourUnit: string): string {
  const safe = Math.max(0, Math.floor(ms));
  const totalHours = Math.floor(safe / HOUR_MS);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (days <= 0) {
    return `${hours}${hourUnit}`;
  }

  return `${days}${dayUnit} ${hours}${hourUnit}`;
}

interface QuestCopyEntry {
  title: string;
  description: string;
}

function copyQuestText(
  map: Record<string, QuestCopyEntry>,
  questId: string,
  fallbackTitle: string,
  fallbackDescription: string,
): QuestCopyEntry {
  return (
    map[questId] ?? {
      title: fallbackTitle,
      description: fallbackDescription,
    }
  );
}

function localizeRewardTitleTr(raw: string): string {
  const metronomeMatch = raw.match(/^Metronome Skin\s+(\d+)$/i);
  if (metronomeMatch) {
    return `Metronom Temasi ${metronomeMatch[1]}`;
  }

  const coinsMatch = raw.match(/^Coins\s*x(\d+)$/i);
  if (coinsMatch) {
    return `Jeton x${coinsMatch[1]}`;
  }

  const fragmentsMatch = raw.match(/^Track Fragments\s*x(\d+)$/i);
  if (fragmentsMatch) {
    return `Parca x${fragmentsMatch[1]}`;
  }

  return raw;
}

const enQuestCopyById: Record<string, QuestCopyEntry> = {
  d_runs_1: {
    title: 'Complete 1 Fusion Run',
    description: 'Finish 1 Neuro Fusion run.',
  },
  d_runs_2: {
    title: 'Complete 2 Fusion Runs',
    description: 'Finish 2 Neuro Fusion runs.',
  },
  d_accuracy_80: {
    title: 'Accuracy 80%+',
    description: 'Finish a run with at least 80% accuracy.',
  },
  d_accuracy_90: {
    title: 'Accuracy 90%+',
    description: 'Finish a run with at least 90% accuracy.',
  },
  d_combo_18: {
    title: 'Reach Combo 18',
    description: 'Hit combo 18+ in any run.',
  },
  d_grade_b: {
    title: 'Earn Grade B+',
    description: 'Finish a run at grade B or higher.',
  },
  d_grade_a: {
    title: 'Earn Grade A+',
    description: 'Finish a run at grade A or higher.',
  },
  d_clean_run: {
    title: 'Clean Input Run',
    description: 'Finish a run with anti-spam penalty <= 15.',
  },
  d_all_phases: {
    title: 'Play All 4 Phases',
    description: 'Complete one run touching Rhythm, Puzzle, Cognitive and Boss phases.',
  },
  d_rhythm_95ms: {
    title: 'Beat Focus <= 95ms',
    description: 'Finish a run with average beat offset <= 95 ms.',
  },
  d_questions_35: {
    title: 'Solve 35 Questions',
    description: 'Answer 35 questions in total.',
  },
  w_runs_10: {
    title: 'Complete 10 Fusion Runs',
    description: 'Finish 10 Neuro Fusion runs.',
  },
  w_runs_16: {
    title: 'Complete 16 Fusion Runs',
    description: 'Finish 16 Neuro Fusion runs.',
  },
  w_s_grade_3: {
    title: 'Get S Grade x3',
    description: 'Finish 3 runs with S grade this week.',
  },
  w_s_grade_5: {
    title: 'Get S Grade x5',
    description: 'Finish 5 runs with S grade this week.',
  },
  w_combo_22_x4: {
    title: 'Combo 22+ x4',
    description: 'Hit combo 22+ in 4 runs this week.',
  },
  w_combo_28_x3: {
    title: 'Combo 28+ x3',
    description: 'Hit combo 28+ in 3 runs this week.',
  },
  w_boss_3: {
    title: 'Defeat Boss x3',
    description: 'Complete boss challenge 3 times this week.',
  },
  w_run_nxp_1800: {
    title: 'Earn 1800 Run NXP',
    description: 'Accumulate 1800 NXP from runs this week.',
  },
  w_distinct_days_4: {
    title: 'Play on 4 Days',
    description: 'Complete runs on 4 distinct UTC days this week.',
  },
  w_duration_75: {
    title: 'Play 75 Minutes',
    description: 'Accumulate 75 total run minutes this week.',
  },
  w_all_phases_6: {
    title: 'All Phases x6',
    description: 'Play all 4 phases in 6 runs this week.',
  },
  boss_weekly: {
    title: 'Defeat Boss Phase',
    description: 'Complete 1 Boss phase run this week.',
  },
};

const trQuestCopyById: Record<string, QuestCopyEntry> = {
  d_runs_1: {
    title: '1 Fusion Kosusu Tamamla',
    description: '1 Neuro Fusion kosusu bitir.',
  },
  d_runs_2: {
    title: '2 Fusion Kosusu Tamamla',
    description: '2 Neuro Fusion kosusu bitir.',
  },
  d_accuracy_80: {
    title: 'Dogruluk %80+',
    description: 'En az %80 dogrulukla bir kosu bitir.',
  },
  d_accuracy_90: {
    title: 'Dogruluk %90+',
    description: 'En az %90 dogrulukla bir kosu bitir.',
  },
  d_combo_18: {
    title: '18 Kombo Yap',
    description: 'Herhangi bir kosuda 18+ kombo yap.',
  },
  d_grade_b: {
    title: 'B+ Notu Al',
    description: 'Bir kosuyu B veya ustu notla bitir.',
  },
  d_grade_a: {
    title: 'A+ Notu Al',
    description: 'Bir kosuyu A veya ustu notla bitir.',
  },
  d_clean_run: {
    title: 'Temiz Giris Kosusu',
    description: 'Anti-spam cezasi <= 15 olacak sekilde kosuyu bitir.',
  },
  d_all_phases: {
    title: '4 Fazin Hepsini Oyna',
    description: 'Ritim, Bulmaca, Bilissel ve Boss fazlarini iceren bir kosu tamamla.',
  },
  d_rhythm_95ms: {
    title: 'Ritim Odagi <= 95ms',
    description: 'Ortalama vurus sapmasi <= 95 ms olacak sekilde kosu bitir.',
  },
  d_questions_35: {
    title: '35 Soru Coz',
    description: 'Toplamda 35 soru cevapla.',
  },
  w_runs_10: {
    title: '10 Fusion Kosusu Tamamla',
    description: '10 Neuro Fusion kosusu bitir.',
  },
  w_runs_16: {
    title: '16 Fusion Kosusu Tamamla',
    description: '16 Neuro Fusion kosusu bitir.',
  },
  w_s_grade_3: {
    title: 'S Notu x3',
    description: 'Bu hafta 3 kosuyu S notuyla bitir.',
  },
  w_s_grade_5: {
    title: 'S Notu x5',
    description: 'Bu hafta 5 kosuyu S notuyla bitir.',
  },
  w_combo_22_x4: {
    title: '22+ Kombo x4',
    description: 'Bu hafta 4 kosuda 22+ kombo yap.',
  },
  w_combo_28_x3: {
    title: '28+ Kombo x3',
    description: 'Bu hafta 3 kosuda 28+ kombo yap.',
  },
  w_boss_3: {
    title: 'Boss Yen x3',
    description: 'Bu hafta boss gorevini 3 kez tamamla.',
  },
  w_run_nxp_1800: {
    title: '1800 Kosu NXP Kazan',
    description: 'Bu hafta kosulardan toplam 1800 NXP biriktir.',
  },
  w_distinct_days_4: {
    title: '4 Gun Oyna',
    description: 'Bu hafta UTC bazinda farkli 4 gunde kosu tamamla.',
  },
  w_duration_75: {
    title: '75 Dakika Oyna',
    description: 'Bu hafta toplam 75 dakika kosu suresi biriktir.',
  },
  w_all_phases_6: {
    title: 'Tum Fazlar x6',
    description: 'Bu hafta 6 kosuda 4 fazin tamamini oyna.',
  },
  boss_weekly: {
    title: 'Boss Fazini Yen',
    description: 'Bu hafta 1 kez Boss fazini tamamla.',
  },
};

const enDailyQuestCopyById: Record<string, QuestCopyEntry> = {
  fusion_run_1: {
    title: 'Fusion Pulse',
    description: 'Finish 1 Neuro Fusion run.',
  },
  rhythm_focus_75: {
    title: 'Beat Focus',
    description: 'Land 75%+ rhythm accuracy in a run.',
  },
  boss_clear_1: {
    title: 'Boss Circuit',
    description: 'Clear the Boss phase once today.',
  },
};

const trDailyQuestCopyById: Record<string, QuestCopyEntry> = {
  fusion_run_1: {
    title: 'Fusion Nabzi',
    description: '1 Neuro Fusion kosusu bitir.',
  },
  rhythm_focus_75: {
    title: 'Ritim Odagi',
    description: 'Bir kosuda ritim dogrulugunu %75+ yap.',
  },
  boss_clear_1: {
    title: 'Boss Devresi',
    description: 'Bugun Boss fazini 1 kez temizle.',
  },
};

export interface NeuroFusionCopy {
  modeSelect: {
    kicker: string;
    title: string;
    runPreset: string;
    variant: string;
    bpm: string;
    track: string;
    latencyCalibration: string;
    presetLabel: (preset: 'beginner' | 'standard' | 'hardcore') => string;
    variantStandard: string;
    variantDailyChallenge: string;
    variantPractice: string;
    variantPracticePremium: string;
    trackLabel: (trackId: string) => string;
    bestScore: string;
    bestGrade: string;
    fragments: string;
    calibrationReady: (offsetMs: number, stdDevMs: number) => string;
    notCalibrated: string;
    tapToCalibrate: (targetTapCount: number) => string;
    start: string;
    back: string;
  };
  calibration: {
    title: string;
    body: (targetTapCount: number) => string;
    tapOnBeat: string;
    cancel: string;
  };
  run: {
    loading: string;
    finish: string;
  };
  hud: {
    phaseLabel: Record<NeuroFusionPhaseType, string>;
    beatsLeft: (beats: number) => string;
    score: string;
    combo: string;
    flow: string;
    beat: string;
  };
  rhythm: {
    kicker: string;
    beatCount: (beats: number) => string;
    statusIdle: string;
    statusCorrect: string;
    statusWrong: string;
  };
  puzzle: {
    kicker: string;
    beatCount: (beats: number) => string;
    oddOneOutPrompt: string;
    oddOneOutHint: string;
    oddOneOutExplanation: (optionIndex: number) => string;
    quickEstimatePrompt: (left: number, right: number) => string;
    quickEstimateHint: string;
    quickEstimateExplanation: (exact: number, nearestTen: number) => string;
    missingSequenceHintMultiply: string;
    missingSequenceHintAdd: string;
    missingSequenceExplanationMultiply: (change: number) => string;
    missingSequenceExplanationAdd: (change: number) => string;
    mixedOperationHint: string;
    mixedOperationExplanation: (multiplier: number, addend: number) => string;
    gridHint: string;
    gridExplanation: (colStep: number, rowStep: number) => string;
    equationBalanceHint: string;
    equationBalanceExplanation: (right: number, known: number, correct: number) => string;
  };
  memory: {
    kicker: string;
    beatCount: (beats: number) => string;
    baseUnknown: string;
    baseKnown: (baseNumber: number) => string;
    caption: string;
  };
  reaction: {
    kicker: string;
    beatCount: (beats: number) => string;
    trueLabel: string;
    falseLabel: string;
    reactionWindow: (reactionWindowMs: number) => string;
  };
  result: {
    kicker: string;
    grade: (grade: string) => string;
    score: string;
    accuracy: string;
    avgBeatOffset: string;
    bestCombo: string;
    flowPeak: string;
    phaseBreakdown: string;
    rewards: string;
    rewardXp: string;
    rewardCoins: string;
    rewardTrackFragments: string;
    rewardWeeklyLeague: string;
    badges: string;
    none: string;
    progress: string;
    bestScore: string;
    bestGrade: string;
    totalFragments: string;
    premiumTip: string;
    openNeuroPass: string;
    runAgain: string;
    backHome: string;
    grantToast: (grantedAmount: number) => string;
    premiumHint: string;
    phaseMeta: (score: number, correct: number, total: number) => string;
    badgeLabel: (badges: string[]) => string;
    localizeBadge: (badge: string) => string;
  };
}

export interface NeuroPassCopy {
  kicker: string;
  seasonName: (seasonId: string, fallbackName: string) => string;
  stateLabel: Record<NeuroPassSeasonState, string>;
  timeLeftLabel: (ms: number) => string;
  tierLabel: (current: number, total: number) => string;
  nxpLabel: (nxp: number) => string;
  screen: {
    loadingTitle: string;
    loadingBody: string;
    unavailableTitle: string;
    unavailableBody: string;
    unlockPremium: string;
    restorePurchases: string;
    devEconomyTuning: string;
    standardOfferTitle: string;
    standardOfferSubtitle: string;
    plusOfferTitle: string;
    plusOfferSubtitle: string;
  };
  homeCard: {
    unavailableTitle: string;
    unavailableBody: string;
    refreshing: string;
    open: string;
  };
  purchaseSheet: {
    title: string;
    buyStandard: string;
    buyPlus: string;
    restorePurchases: string;
    close: string;
    legal: string;
  };
  tierCell: {
    free: string;
    premium: string;
    lock: string;
    claim: string;
    claiming: string;
    claimed: string;
    unlock: string;
    locked: string;
  };
  catchUp: {
    kicker: string;
    title: (tiersLeft: number) => string;
    body: (tiersLeft: number) => string;
    cta: string;
  };
  urgency: {
    label: (hoursLeft: number) => string;
    hoursShort: (hoursLeft: number) => string;
  };
  tierSkip: {
    kicker: string;
    skips: (balance: number) => string;
    dailyPurchaseCount: (dayCount: number) => string;
    useOne: string;
    useFive: string;
    dailyLimitReached: string;
    buyFive: string;
  };
  quests: {
    kicker: string;
    title: string;
    subtitle: (dailyKey: string, weeklyKey: string) => string;
    tabDaily: string;
    tabWeekly: string;
    tabBoss: string;
    loading: string;
    empty: string;
    statusClaimed: string;
    statusCompleted: string;
    statusActive: string;
    claim: string;
    claiming: string;
    toast: (grantedAmount: number) => string;
    reward: (rewardNxp: number) => string;
    questText: (
      questId: string,
      fallbackTitle: string,
      fallbackDescription: string,
    ) => QuestCopyEntry;
  };
  dailyQuests: {
    kicker: string;
    title: string;
    subtitle: string;
    claim: string;
    claiming: string;
    claimed: string;
    reward: (rewardNxp: number) => string;
    toast: (grantedAmount: number) => string;
    questText: (
      questId: string,
      fallbackTitle: string,
      fallbackDescription: string,
    ) => QuestCopyEntry;
  };
  retroClaim: {
    kicker: string;
    title: (count: number) => string;
    tiers: (tiers: number[]) => string;
    highlights: (items: string[]) => string;
    nice: string;
  };
  messages: {
    purchaseCancelled: string;
    purchaseFailed: string;
    noPurchasesToRestore: string;
    purchasesRestored: string;
    dailyLimitReachedSkip5: string;
    skip5Added: string;
    seasonAlreadyMaxed: string;
    notEnoughSkips: string;
    usedSkips: (count: number) => string;
    tierClaimed: (rewardTitle: string, coinsDelta: number, totalCoins: number) => string;
    tierAlreadyClaimed: string;
    tierLocked: string;
    premiumRequired: string;
  };
  rewardTitle: (raw: string) => string;
}

export const enNeuroFusionCopy: NeuroFusionCopy = {
  modeSelect: {
    kicker: 'NEURO FUSION',
    title: 'Music-driven math + puzzles + cognition',
    runPreset: 'Run Preset',
    variant: 'Variant',
    bpm: 'BPM',
    track: 'Track',
    latencyCalibration: 'Latency Calibration',
    presetLabel: (preset) => {
      if (preset === 'beginner') {
        return 'Beginner';
      }

      if (preset === 'hardcore') {
        return 'Hardcore';
      }

      return 'Standard';
    },
    variantStandard: 'Standard',
    variantDailyChallenge: 'Daily Challenge',
    variantPractice: 'Practice Phase',
    variantPracticePremium: 'Practice (Premium)',
    trackLabel: (trackId) => `Metronome ${trackId.replace('metro_', '')}`,
    bestScore: 'Best Score',
    bestGrade: 'Best Grade',
    fragments: 'Fragments',
    calibrationReady: (offsetMs, stdDevMs) => `Offset ${offsetMs}ms · StdDev ${stdDevMs}ms`,
    notCalibrated: 'Not calibrated',
    tapToCalibrate: (targetTapCount) => `Tap to Calibrate (${targetTapCount} taps)`,
    start: 'Start Neuro Fusion',
    back: 'Back',
  },
  calibration: {
    title: 'Calibration',
    body: (targetTapCount) => `Tap exactly on each pulse for ${targetTapCount} beats.`,
    tapOnBeat: 'Tap On Beat',
    cancel: 'Cancel',
  },
  run: {
    loading: 'Booting Neuro Fusion...',
    finish: 'Finish Run',
  },
  hud: {
    phaseLabel: {
      rhythm_math: 'Rhythm Math',
      puzzle: 'Puzzle',
      cognitive_blend: 'Cognitive Blend',
      boss: 'Boss Phase',
    },
    beatsLeft: (beats) => `${beats} beats left`,
    score: 'Score',
    combo: 'Combo',
    flow: 'Flow',
    beat: 'Beat',
  },
  rhythm: {
    kicker: 'Rhythm Math',
    beatCount: (beats) => `${beats} beats`,
    statusIdle: 'Hit the beat for bonus',
    statusCorrect: 'Clean hit',
    statusWrong: 'Missed - reset combo',
  },
  puzzle: {
    kicker: 'Puzzle',
    beatCount: (beats) => `${beats} beats`,
    oddOneOutPrompt: 'Which expression breaks the pattern?',
    oddOneOutHint: 'Three expressions follow a stable relation; one does not.',
    oddOneOutExplanation: (optionIndex) =>
      `Option ${optionIndex} is inconsistent with the repeated pattern.`,
    quickEstimatePrompt: (left, right) => `Nearest estimate for ${left} + ${right}?`,
    quickEstimateHint: 'Round quickly, then pick the closest bucket.',
    quickEstimateExplanation: (exact, nearestTen) =>
      `Exact is ${exact}, nearest ten is ${nearestTen}.`,
    missingSequenceHintMultiply: 'Rule: same multiplier each step.',
    missingSequenceHintAdd: 'Rule: add a constant each step.',
    missingSequenceExplanationMultiply: (change) => `Pattern is ×${change} each step.`,
    missingSequenceExplanationAdd: (change) => `Pattern is +${change} each step.`,
    mixedOperationHint: 'Apply the same transform each jump.',
    mixedOperationExplanation: (multiplier, addend) =>
      `Each step is ×${multiplier} then +${addend}.`,
    gridHint: 'Rows and columns progress by fixed steps.',
    gridExplanation: (colStep, rowStep) => `Right adds ${colStep}, down adds ${rowStep}.`,
    equationBalanceHint: 'Move terms mentally to isolate the blank.',
    equationBalanceExplanation: (right, known, correct) =>
      `Missing value is ${right} - ${known} = ${correct}.`,
  },
  memory: {
    kicker: 'Echo Stack',
    beatCount: (beats) => `${beats} beats`,
    baseUnknown: 'Base: ?',
    baseKnown: (baseNumber) => `Base: ${baseNumber}`,
    caption: 'Remember the stack, then solve in one pass.',
  },
  reaction: {
    kicker: 'Reflex Gate',
    beatCount: (beats) => `${beats} beats`,
    trueLabel: 'True',
    falseLabel: 'False',
    reactionWindow: (reactionWindowMs) => `Reaction window: ${reactionWindowMs}ms`,
  },
  result: {
    kicker: 'NEURO FUSION RESULT',
    grade: (grade) => `Grade ${grade}`,
    score: 'Score',
    accuracy: 'Accuracy',
    avgBeatOffset: 'Avg Beat Offset',
    bestCombo: 'Best Combo',
    flowPeak: 'Flow Peak',
    phaseBreakdown: 'Phase Breakdown',
    rewards: 'Rewards',
    rewardXp: 'XP',
    rewardCoins: 'Coins',
    rewardTrackFragments: 'Track Fragments',
    rewardWeeklyLeague: 'Weekly League',
    badges: 'Badges',
    none: 'None',
    progress: 'Neuro Fusion Progress',
    bestScore: 'Best Score',
    bestGrade: 'Best Grade',
    totalFragments: 'Total Fragments',
    premiumTip: 'PREMIUM TIP',
    openNeuroPass: 'Open Neuro Pass',
    runAgain: 'Run Again',
    backHome: 'Back Home',
    grantToast: (grantedAmount) => `+${grantedAmount} NXP`,
    premiumHint: 'Premium unlocks the next milestone reward.',
    phaseMeta: (score, correct, total) => `${score} pts · ${correct}/${total}`,
    badgeLabel: (badges) => `Badges: ${badges.length > 0 ? badges.join(', ') : 'None'}`,
    localizeBadge: (badge) => badge,
  },
};

export const trNeuroFusionCopy: NeuroFusionCopy = {
  modeSelect: {
    kicker: 'NEURO FUSION',
    title: 'Muzik odakli matematik + bulmaca + bilis',
    runPreset: 'Kosu On Ayari',
    variant: 'Varyant',
    bpm: 'BPM',
    track: 'Parca',
    latencyCalibration: 'Gecikme Kalibrasyonu',
    presetLabel: (preset) => {
      if (preset === 'beginner') {
        return 'Baslangic';
      }

      if (preset === 'hardcore') {
        return 'Zor';
      }

      return 'Standart';
    },
    variantStandard: 'Standart',
    variantDailyChallenge: 'Gunluk Gorev',
    variantPractice: 'Pratik Faz',
    variantPracticePremium: 'Pratik (Premium)',
    trackLabel: (trackId) => `Metronom ${trackId.replace('metro_', '')}`,
    bestScore: 'En Iyi Skor',
    bestGrade: 'En Iyi Not',
    fragments: 'Parca',
    calibrationReady: (offsetMs, stdDevMs) => `Ofset ${offsetMs}ms · StdSapma ${stdDevMs}ms`,
    notCalibrated: 'Kalibre edilmedi',
    tapToCalibrate: (targetTapCount) => `Kalibre Etmek Icin Dokun (${targetTapCount} dokunus)`,
    start: 'Neuro Fusion Baslat',
    back: 'Geri',
  },
  calibration: {
    title: 'Kalibrasyon',
    body: (targetTapCount) => `${targetTapCount} vurus boyunca her darbeye tam zamaninda dokun.`,
    tapOnBeat: 'Darbe Uzerinde Dokun',
    cancel: 'Iptal',
  },
  run: {
    loading: 'Neuro Fusion baslatiliyor...',
    finish: 'Kosuyu Bitir',
  },
  hud: {
    phaseLabel: {
      rhythm_math: 'Ritim Matematik',
      puzzle: 'Bulmaca',
      cognitive_blend: 'Bilissel Harman',
      boss: 'Boss Fazi',
    },
    beatsLeft: (beats) => `${beats} vurus kaldi`,
    score: 'Skor',
    combo: 'Kombo',
    flow: 'Akis',
    beat: 'Vurus',
  },
  rhythm: {
    kicker: 'Ritim Matematik',
    beatCount: (beats) => `${beats} vurus`,
    statusIdle: 'Bonus icin darbeyi yakala',
    statusCorrect: 'Temiz vurus',
    statusWrong: 'Kacirildi - komboyu sifirla',
  },
  puzzle: {
    kicker: 'Bulmaca',
    beatCount: (beats) => `${beats} vurus`,
    oddOneOutPrompt: 'Hangi ifade deseni bozuyor?',
    oddOneOutHint: 'Uc ifade tutarli iliskiyi izler; biri izlemez.',
    oddOneOutExplanation: (optionIndex) => `${optionIndex}. secenek tekrar eden desenle uyumsuz.`,
    quickEstimatePrompt: (left, right) => `${left} + ${right} icin en yakin tahmin hangisi?`,
    quickEstimateHint: 'Hizlica yuvarla, sonra en yakin araligi sec.',
    quickEstimateExplanation: (exact, nearestTen) =>
      `Tam deger ${exact}, en yakin onluk ${nearestTen}.`,
    missingSequenceHintMultiply: 'Kural: her adimda ayni carpani uygula.',
    missingSequenceHintAdd: 'Kural: her adimda sabit bir deger ekle.',
    missingSequenceExplanationMultiply: (change) => `Desen her adimda ×${change}.`,
    missingSequenceExplanationAdd: (change) => `Desen her adimda +${change}.`,
    mixedOperationHint: 'Her geciste ayni donusumu uygula.',
    mixedOperationExplanation: (multiplier, addend) => `Her adim: ×${multiplier} sonra +${addend}.`,
    gridHint: 'Satirlar ve sutunlar sabit adimlarla ilerler.',
    gridExplanation: (colStep, rowStep) => `Saga giderken +${colStep}, asagi giderken +${rowStep}.`,
    equationBalanceHint: 'Boslugu yalitmak icin terimleri zihinde tasi.',
    equationBalanceExplanation: (right, known, correct) =>
      `Eksik deger ${right} - ${known} = ${correct}.`,
  },
  memory: {
    kicker: 'Eko Yigini',
    beatCount: (beats) => `${beats} vurus`,
    baseUnknown: 'Temel: ?',
    baseKnown: (baseNumber) => `Temel: ${baseNumber}`,
    caption: 'Diziyi hatirla, sonra tek seferde coz.',
  },
  reaction: {
    kicker: 'Refleks Kapisi',
    beatCount: (beats) => `${beats} vurus`,
    trueLabel: 'Dogru',
    falseLabel: 'Yanlis',
    reactionWindow: (reactionWindowMs) => `Tepki penceresi: ${reactionWindowMs}ms`,
  },
  result: {
    kicker: 'NEURO FUSION SONUCU',
    grade: (grade) => `Not ${grade}`,
    score: 'Skor',
    accuracy: 'Dogruluk',
    avgBeatOffset: 'Ort. Vurus Sapmasi',
    bestCombo: 'En Iyi Kombo',
    flowPeak: 'En Yuksek Akis',
    phaseBreakdown: 'Faz Dagilimi',
    rewards: 'Oduller',
    rewardXp: 'XP',
    rewardCoins: 'Jeton',
    rewardTrackFragments: 'Parca',
    rewardWeeklyLeague: 'Haftalik Lig',
    badges: 'Rozetler',
    none: 'Yok',
    progress: 'Neuro Fusion Ilerlemesi',
    bestScore: 'En Iyi Skor',
    bestGrade: 'En Iyi Not',
    totalFragments: 'Toplam Parca',
    premiumTip: 'PREMIUM IPUCU',
    openNeuroPass: 'Neuro Pass Ac',
    runAgain: 'Tekrar Oyna',
    backHome: 'Ana Sayfaya Don',
    grantToast: (grantedAmount) => `+${grantedAmount} NXP`,
    premiumHint: 'Bir sonraki kilometre tasi odulunu Premium aciyor.',
    phaseMeta: (score, correct, total) => `${score} puan · ${correct}/${total}`,
    badgeLabel: (badges) => `Rozetler: ${badges.length > 0 ? badges.join(', ') : 'Yok'}`,
    localizeBadge: (badge) => {
      if (badge === 'Perfect Streak') {
        return 'Kusursuz Seri';
      }

      if (badge === 'Puzzle Master') {
        return 'Bulmaca Ustasi';
      }

      if (badge === 'Reflex King') {
        return 'Refleks Krali';
      }

      if (badge === 'Echo Memory') {
        return 'Eko Hafiza';
      }

      if (badge === 'Neuro Fusion S-tier') {
        return 'Neuro Fusion S-Seviye';
      }

      return badge;
    },
  },
};

export const enNeuroPassCopy: NeuroPassCopy = {
  kicker: 'NEURO PASS',
  seasonName: (_seasonId, fallbackName) => fallbackName,
  stateLabel: {
    preseason: 'PRESEASON',
    active: 'ACTIVE',
    grace: 'GRACE',
    ended: 'ENDED',
  },
  timeLeftLabel: (ms) => `Time Left: ${formatDurationCompact(ms, 'd', 'h')}`,
  tierLabel: (current, total) => `Tier ${current}/${total}`,
  nxpLabel: (nxp) => `${nxp} NXP`,
  screen: {
    loadingTitle: 'Neuro Pass',
    loadingBody: 'Loading season manifest...',
    unavailableTitle: 'Neuro Pass unavailable',
    unavailableBody: 'Season manifest is not valid right now. Please try again later.',
    unlockPremium: 'Unlock Premium',
    restorePurchases: 'Restore Purchases',
    devEconomyTuning: 'Economy Tuning (DEV)',
    standardOfferTitle: 'Pass Standard',
    standardOfferSubtitle: 'Unlock premium track for this season.',
    plusOfferTitle: 'Pass Plus',
    plusOfferSubtitle: 'Premium + 10 tier skips.',
  },
  homeCard: {
    unavailableTitle: 'Neuro Pass unavailable',
    unavailableBody: 'Manifest data is not ready on this device.',
    refreshing: 'Refreshing...',
    open: 'Open Neuro Pass',
  },
  purchaseSheet: {
    title: 'Unlock Premium Track',
    buyStandard: 'Buy Standard',
    buyPlus: 'Buy Plus',
    restorePurchases: 'Restore Purchases',
    close: 'Close',
    legal: 'Purchases are processed by Apple/Google. Client-only verification is not secure.',
  },
  tierCell: {
    free: 'Free',
    premium: 'Premium',
    lock: 'LOCK',
    claim: 'Claim',
    claiming: 'Claiming...',
    claimed: 'Claimed',
    unlock: 'Unlock',
    locked: 'Locked',
  },
  catchUp: {
    kicker: 'CATCH-UP OFFER',
    title: (tiersLeft) => `${tiersLeft} tiers left`,
    body: (tiersLeft) =>
      `You have ${tiersLeft} tiers left. Finish your pass with a catch-up bundle.`,
    cta: 'Get Catch-Up Bundle',
  },
  urgency: {
    label: (hoursLeft) => `Season ends in ${hoursLeft}h`,
    hoursShort: (hoursLeft) => `${hoursLeft}h`,
  },
  tierSkip: {
    kicker: 'TIER SKIPS',
    skips: (balance) => `Skips: ${balance}`,
    dailyPurchaseCount: (dayCount) => `Tier Skip 5 purchases today: ${dayCount}/2`,
    useOne: 'Use 1 Skip',
    useFive: 'Use 5 Skips',
    dailyLimitReached: 'Daily Limit Reached',
    buyFive: 'Buy +5 Skips',
  },
  quests: {
    kicker: 'NEURO PASS QUESTS',
    title: 'Daily / Weekly Missions',
    subtitle: (dailyKey, weeklyKey) => `Daily ${dailyKey} · Weekly ${weeklyKey}`,
    tabDaily: 'Daily',
    tabWeekly: 'Weekly',
    tabBoss: 'Boss',
    loading: 'Loading quests...',
    empty: 'No quests available.',
    statusClaimed: 'Claimed',
    statusCompleted: 'Completed',
    statusActive: 'Active',
    claim: 'Claim',
    claiming: 'Claiming...',
    toast: (grantedAmount) => `+${grantedAmount} NXP`,
    reward: (rewardNxp) => `Reward: +${rewardNxp} NXP`,
    questText: (questId, fallbackTitle, fallbackDescription) =>
      copyQuestText(enQuestCopyById, questId, fallbackTitle, fallbackDescription),
  },
  dailyQuests: {
    kicker: 'NEURO PASS',
    title: 'Daily Neuro Pass',
    subtitle: '3 daily quests, 120 NXP each.',
    claim: 'Claim',
    claiming: 'Claiming...',
    claimed: 'Claimed',
    reward: (rewardNxp) => `Reward: +${rewardNxp} NXP`,
    toast: (grantedAmount) => `+${grantedAmount} NXP`,
    questText: (questId, fallbackTitle, fallbackDescription) =>
      copyQuestText(enDailyQuestCopyById, questId, fallbackTitle, fallbackDescription),
  },
  retroClaim: {
    kicker: 'PREMIUM UNLOCKED',
    title: (count) => `Unlocked ${count} premium rewards`,
    tiers: (tiers) => `Tiers: ${tiers.slice(0, 12).join(', ')}`,
    highlights: (items) => `Highlights: ${items.join(' · ')}`,
    nice: 'Nice!',
  },
  messages: {
    purchaseCancelled: 'Purchase cancelled',
    purchaseFailed: 'Purchase failed, try again',
    noPurchasesToRestore: 'No purchases to restore',
    purchasesRestored: 'Purchases restored',
    dailyLimitReachedSkip5: 'Daily limit reached for +5 skips',
    skip5Added: '+5 tier skips added',
    seasonAlreadyMaxed: 'Season already maxed',
    notEnoughSkips: 'Not enough skips',
    usedSkips: (count) => `Used ${count} skip${count > 1 ? 's' : ''}`,
    tierClaimed: (rewardTitle, coinsDelta, totalCoins) =>
      coinsDelta > 0
        ? `Claimed ${rewardTitle} (+${coinsDelta} coins, total ${totalCoins})`
        : `Claimed ${rewardTitle}`,
    tierAlreadyClaimed: 'Reward already claimed',
    tierLocked: 'Tier is locked',
    premiumRequired: 'Premium required for this reward',
  },
  rewardTitle: (raw) => raw,
};

export const trNeuroPassCopy: NeuroPassCopy = {
  kicker: 'NEURO PASS',
  seasonName: (seasonId, fallbackName) => {
    if (seasonId === 'neuro_pass_s1') {
      return 'Neuro Pass S1: Nabiz Matrisi';
    }

    return fallbackName;
  },
  stateLabel: {
    preseason: 'ON SEZON',
    active: 'AKTIF',
    grace: 'EK SURE',
    ended: 'BITTI',
  },
  timeLeftLabel: (ms) => `Kalan Sure: ${formatDurationCompact(ms, 'g', 's')}`,
  tierLabel: (current, total) => `Kademe ${current}/${total}`,
  nxpLabel: (nxp) => `${nxp} NXP`,
  screen: {
    loadingTitle: 'Neuro Pass',
    loadingBody: 'Sezon verisi yukleniyor...',
    unavailableTitle: 'Neuro Pass su an kullanilamiyor',
    unavailableBody: 'Sezon verisi su anda gecerli degil. Lutfen daha sonra tekrar dene.',
    unlockPremium: 'Premium Kilidini Ac',
    restorePurchases: 'Satin Alimlari Geri Yukle',
    devEconomyTuning: 'Ekonomi Ayari (DEV)',
    standardOfferTitle: 'Pass Standart',
    standardOfferSubtitle: 'Bu sezon icin premium yolu ac.',
    plusOfferTitle: 'Pass Plus',
    plusOfferSubtitle: 'Premium + 10 kademe atlama.',
  },
  homeCard: {
    unavailableTitle: 'Neuro Pass su an kullanilamiyor',
    unavailableBody: 'Manifest verisi bu cihazda hazir degil.',
    refreshing: 'Yenileniyor...',
    open: 'Neuro Pass Ac',
  },
  purchaseSheet: {
    title: 'Premium Yolu Ac',
    buyStandard: 'Standart Satin Al',
    buyPlus: 'Plus Satin Al',
    restorePurchases: 'Satin Alimlari Geri Yukle',
    close: 'Kapat',
    legal:
      'Satin alimlar Apple/Google tarafindan islenir. Yalnizca istemci dogrulamasi guvenli degildir.',
  },
  tierCell: {
    free: 'Ucretsiz',
    premium: 'Premium',
    lock: 'KILIT',
    claim: 'Al',
    claiming: 'Aliniyor...',
    claimed: 'Alindi',
    unlock: 'Kilidi Ac',
    locked: 'Kilitli',
  },
  catchUp: {
    kicker: 'YETISME TEKLIFI',
    title: (tiersLeft) => `${tiersLeft} kademe kaldi`,
    body: (tiersLeft) => `${tiersLeft} kademe kaldi. Yetisme paketi ile sezonu tamamla.`,
    cta: 'Yetisme Paketini Al',
  },
  urgency: {
    label: (hoursLeft) => `Sezonun bitmesine ${hoursLeft}s kaldi`,
    hoursShort: (hoursLeft) => `${hoursLeft}s`,
  },
  tierSkip: {
    kicker: 'KADEME ATLAMA',
    skips: (balance) => `Atlama: ${balance}`,
    dailyPurchaseCount: (dayCount) => `Bugun +5 kademe atlama satin alimi: ${dayCount}/2`,
    useOne: '1 Atlama Kullan',
    useFive: '5 Atlama Kullan',
    dailyLimitReached: 'Gunluk Limit Doldu',
    buyFive: '+5 Atlama Satin Al',
  },
  quests: {
    kicker: 'NEURO PASS GOREVLERI',
    title: 'Gunluk / Haftalik Gorevler',
    subtitle: (dailyKey, weeklyKey) => `Gunluk ${dailyKey} · Haftalik ${weeklyKey}`,
    tabDaily: 'Gunluk',
    tabWeekly: 'Haftalik',
    tabBoss: 'Boss',
    loading: 'Gorevler yukleniyor...',
    empty: 'Kullanilabilir gorev yok.',
    statusClaimed: 'Alindi',
    statusCompleted: 'Tamamlandi',
    statusActive: 'Aktif',
    claim: 'Al',
    claiming: 'Aliniyor...',
    toast: (grantedAmount) => `+${grantedAmount} NXP`,
    reward: (rewardNxp) => `Odul: +${rewardNxp} NXP`,
    questText: (questId, fallbackTitle, fallbackDescription) =>
      copyQuestText(trQuestCopyById, questId, fallbackTitle, fallbackDescription),
  },
  dailyQuests: {
    kicker: 'NEURO PASS',
    title: 'Gunluk Neuro Pass',
    subtitle: 'Her biri 120 NXP olan 3 gunluk gorev.',
    claim: 'Al',
    claiming: 'Aliniyor...',
    claimed: 'Alindi',
    reward: (rewardNxp) => `Odul: +${rewardNxp} NXP`,
    toast: (grantedAmount) => `+${grantedAmount} NXP`,
    questText: (questId, fallbackTitle, fallbackDescription) =>
      copyQuestText(trDailyQuestCopyById, questId, fallbackTitle, fallbackDescription),
  },
  retroClaim: {
    kicker: 'PREMIUM ACILDI',
    title: (count) => `${count} premium odul acildi`,
    tiers: (tiers) => `Kademeler: ${tiers.slice(0, 12).join(', ')}`,
    highlights: (items) => `One Cikanlar: ${items.join(' · ')}`,
    nice: 'Harika!',
  },
  messages: {
    purchaseCancelled: 'Satin alim iptal edildi',
    purchaseFailed: 'Satin alim basarisiz oldu, tekrar dene',
    noPurchasesToRestore: 'Geri yuklenecek satin alim bulunamadi',
    purchasesRestored: 'Satin alimlar geri yüklendi',
    dailyLimitReachedSkip5: 'Gunluk +5 atlama limiti doldu',
    skip5Added: '+5 kademe atlama eklendi',
    seasonAlreadyMaxed: 'Sezon zaten maksimum seviyede',
    notEnoughSkips: 'Yeterli atlama yok',
    usedSkips: (count) => `${count} atlama kullanildi`,
    tierClaimed: (rewardTitle, coinsDelta, totalCoins) =>
      coinsDelta > 0
        ? `${rewardTitle} odulu alindi (+${coinsDelta} jeton, toplam ${totalCoins})`
        : `${rewardTitle} odulu alindi`,
    tierAlreadyClaimed: 'Odul zaten alinmis',
    tierLocked: 'Kademe kilitli',
    premiumRequired: 'Bu odul icin Premium gerekli',
  },
  rewardTitle: (raw) => localizeRewardTitleTr(raw),
};
