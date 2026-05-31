import type { GameMode } from '@features/game/domain/entities/GameMode';
import type { SessionFinishReason } from '@features/game/domain/entities/ProgressModels';
import type { QuestionType } from '@features/game/domain/entities/Question';
import {
  enNeuroFusionCopy,
  enNeuroPassCopy,
  trNeuroFusionCopy,
  trNeuroPassCopy,
  type NeuroFusionCopy,
  type NeuroPassCopy,
} from './featureCopy';

export type AppLanguage = 'en' | 'tr';

export interface AppCopy {
  app: {
    failedToInitialize: string;
    bootstrapping: string;
    retry: string;
    somethingWentWrong: string;
    unexpectedRuntimeError: string;
  };
  common: {
    back: string;
    home: string;
    none: string;
    untimed: string;
  };
  controls: {
    light: string;
    dark: string;
    auto: string;
    english: string;
    turkish: string;
    lockedThemesHint: (lockedThemeCount: number, premiumLockHint: string) => string;
    lockedPremiumThemeHint: (themeName: string) => string;
  };
  labels: {
    mode: Record<GameMode, string>;
    questionType: Record<QuestionType, string>;
    questionTypeShort: Record<QuestionType, string>;
    finishReason: Record<SessionFinishReason, string>;
  };
  home: {
    kicker: string;
    heroTitle: string;
    heroBody: string;
    playerLevel: string;
    totalXp: string;
    streakDays: string;
    bestScore: string;
    dailyClears: string;
    dailyBest: string;
    coinsEarned: (coins: number) => string;
    coinsTotal: (coins: number) => string;
    plan: (isPremium: boolean) => string;
    modeSummary: (modeLabel: string, durationLabel: string) => string;
    modeDurationWithLimit: (durationSeconds: number, questionLimit: number) => string;
    modeDurationTimed: (durationSeconds: number) => string;
    modeTitle: string;
    operationsTitle: string;
    unlockLevel: (level: number) => string;
    dailySet: string;
    customSet: string;
    neuroFusionSet: string;
    ready: string;
    selected: (value: string) => string;
    dailyCompletedHint: string;
    dailyTarget: (questionLimit: number) => string;
    customHint: (durationSeconds: number, questionLimit: number) => string;
    neuroFusionHint: string;
    completedToday: string;
    startMode: (modeLabel: string) => string;
    openInsights: string;
    managePremium: string;
    goPremium: string;
    themeShowcase: string;
    editCustomTraining: string;
    customTraining: string;
    recentRuns: string;
    recentRunsEmpty: string;
    recentRunTitle: (index: number, modeLabel: string, score: number) => string;
    recentRunMeta: (accuracy: number, combo: number) => string;
    flagshipTag: string;
  };
  game: {
    calibrating: string;
    finish: string;
    liveMode: (modeLabel: string) => string;
    keypadDelete: string;
    keypadClear: string;
    keypadSubmit: string;
    hudTime: string;
    hudScore: string;
    hudCombo: string;
    hudLevel: string;
    modeTitle: Record<GameMode, string>;
    modeFooter: Record<GameMode, string>;
    difficultyBadge: (difficulty: number) => string;
    answerPlaceholder: string;
    feedbackIdle: string;
    feedbackCorrect: string;
    feedbackWrong: string;
  };
  insights: {
    kicker: string;
    title: string;
    totalSessions: string;
    lifetimeAccuracy: string;
    avgResponse: string;
    bestCombo: string;
    modePerformance: string;
    operationPerformance: string;
    sessions: string;
    bestScore: string;
    answered: string;
    accuracy: string;
    backHome: string;
  };
  premium: {
    kicker: string;
    title: string;
    advancedInsights: string;
    customTrainingControls: string;
    unlimitedPractice: string;
    noAds: string;
    currentPlan: string;
    premiumActive: string;
    free: string;
    upgradeToPremium: string;
    themeShowcase: string;
  };
  themeShowcase: {
    kicker: string;
    title: string;
    subtitle: string;
    unlockedThemes: (unlocked: number, total: number) => string;
    activeTheme: (name: string) => string;
    selectTheme: string;
    selectedTheme: string;
    lockedReason: string;
    unlockPremium: string;
    emotionalFeel: string;
    animationBehavior: string;
    targetPersona: string;
    tagline: string;
    appStoreConcept: string;
    instagramStory: string;
    beforeAfter: string;
    adCopy: string;
    visualSystem: string;
    audioSystem: string;
    marketingAssets: string;
    category: {
      all: string;
      free: string;
      premium: string;
      seasonal: string;
      limited: string;
      collab: string;
    };
  };
  customTraining: {
    kicker: string;
    title: string;
    duration: string;
    questionLimit: string;
    operations: string;
    selected: (value: string) => string;
    startCustomRun: string;
  };
  result: {
    kicker: string;
    title: string;
    mode: string;
    endedBy: string;
    operations: string;
    score: string;
    accuracy: string;
    avgResponse: string;
    correctTotal: string;
    bestCombo: string;
    xpGained: string;
    totalXp: string;
    level: string;
    streakDays: string;
    runsPlayed: string;
    sessionBonus: string;
    sessionBonusBody: (bonusXp: number) => string;
    bonusApplied: string;
    bonusUnavailable: string;
    loading: string;
    watchAdAndClaim: string;
    runAgain: string;
  };
  neuroFusion: NeuroFusionCopy;
  neuroPass: NeuroPassCopy;
}

const en: AppCopy = {
  app: {
    failedToInitialize: 'Failed to initialize app services.',
    bootstrapping: 'Bootstrapping game systems...',
    retry: 'Retry',
    somethingWentWrong: 'Something went wrong',
    unexpectedRuntimeError: 'Unexpected runtime error',
  },
  common: {
    back: 'Back',
    home: 'Home',
    none: 'None',
    untimed: 'Untimed',
  },
  controls: {
    light: 'Light',
    dark: 'Dark',
    auto: 'Auto',
    english: 'EN',
    turkish: 'TR',
    lockedThemesHint: (lockedThemeCount, premiumLockHint) =>
      `${lockedThemeCount} themes locked. ${premiumLockHint}`,
    lockedPremiumThemeHint: (themeName) => `${themeName}: Premium subscription required`,
  },
  labels: {
    mode: {
      custom: 'Custom',
      daily: 'Daily',
      sprint: 'Sprint',
      survival: 'Survival',
      zen: 'Zen',
      neuro_fusion: 'Neuro Fusion',
    },
    questionType: {
      addition: 'Addition',
      subtraction: 'Subtraction',
      multiplication: 'Multiplication',
      division: 'Division',
    },
    questionTypeShort: {
      addition: 'Add',
      subtraction: 'Sub',
      multiplication: 'Mul',
      division: 'Div',
    },
    finishReason: {
      timeout: 'Timeout',
      manual: 'Manual',
      mistake: 'Mistake',
      daily_complete: 'Daily Complete',
      question_limit: 'Question Limit',
    },
  },
  home: {
    kicker: 'PUREMIND SPRINT 8',
    heroTitle: 'Train Faster\nThink Sharper',
    heroBody: 'Daily Challenge is live. Complete the fixed run each day and stack long streaks.',
    playerLevel: 'Player Level',
    totalXp: 'Total XP',
    streakDays: 'Streak Days',
    bestScore: 'Best Score',
    dailyClears: 'Daily Clears',
    dailyBest: 'Daily Best',
    coinsEarned: (coins) => `+${coins}`,
    coinsTotal: (coins) => `Coins ${coins}`,
    plan: (isPremium) => `Plan: ${isPremium ? 'Premium' : 'Free'}`,
    modeSummary: (modeLabel, durationLabel) => `Mode: ${modeLabel} / ${durationLabel}`,
    modeDurationWithLimit: (durationSeconds, questionLimit) =>
      `${durationSeconds}s / ${questionLimit}Q`,
    modeDurationTimed: (durationSeconds) => `${durationSeconds}s`,
    modeTitle: 'Mode',
    operationsTitle: 'Operations',
    unlockLevel: (level) => `Unlock L${level}`,
    dailySet: 'Daily Set',
    customSet: 'Custom Set',
    neuroFusionSet: 'Neuro Fusion Set',
    ready: 'Ready',
    selected: (value) => `Selected: ${value}`,
    dailyCompletedHint: 'Daily Challenge completed for today. Come back tomorrow for a new set.',
    dailyTarget: (questionLimit) =>
      `Daily target: ${questionLimit} fixed questions before time expires.`,
    customHint: (durationSeconds, questionLimit) =>
      `Custom set: ${durationSeconds}s, ${questionLimit} questions. Edit in Custom Training.`,
    neuroFusionHint:
      'Neuro Fusion uses rhythm + puzzle + cognition phases. Configure BPM and preset in mode setup.',
    completedToday: 'Completed Today',
    startMode: (modeLabel) => `Start ${modeLabel}`,
    openInsights: 'Open Insights',
    managePremium: 'Manage Premium',
    goPremium: 'Go Premium',
    themeShowcase: 'Theme Showcase',
    editCustomTraining: 'Edit Custom Training',
    customTraining: 'Custom Training',
    recentRuns: 'Recent Runs',
    recentRunsEmpty: 'No runs yet. Complete your first session to start tracking history.',
    recentRunTitle: (index, modeLabel, score) => `#${index} ${modeLabel} · Score ${score}`,
    recentRunMeta: (accuracy, combo) => `${accuracy}% / combo ${combo}`,
    flagshipTag: 'Flagship',
  },
  game: {
    calibrating: 'Calibrating challenge...',
    finish: 'Finish',
    liveMode: (modeLabel) => `${modeLabel} Live`,
    keypadDelete: 'Del',
    keypadClear: 'Clear',
    keypadSubmit: 'Submit',
    hudTime: 'TIME',
    hudScore: 'SCORE',
    hudCombo: 'COMBO',
    hudLevel: 'LEVEL',
    modeTitle: {
      custom: 'Custom Training',
      daily: 'Daily Challenge',
      sprint: 'Math Flow',
      survival: 'No-Miss Run',
      zen: 'Calm Focus',
      neuro_fusion: 'Neuro Fusion',
    },
    modeFooter: {
      custom: 'Custom run. Keep focus and clear your configured question set.',
      daily: 'Daily fixed set. Finish all questions before the timer ends.',
      sprint: 'Build a streak. Difficulty adapts in real time to your performance.',
      survival: 'One mistake ends the run. Prioritize accuracy under pressure.',
      zen: 'No timer. Practice consistency and let adaptive difficulty shape the pace.',
      neuro_fusion:
        'Music-driven math + puzzles + cognition in one addictive run. Keep flow high for max rewards.',
    },
    difficultyBadge: (difficulty) => `Difficulty ${difficulty}`,
    answerPlaceholder: '...',
    feedbackIdle: 'Stay calm. Build rhythm, then increase speed.',
    feedbackCorrect: 'Perfect. Keep momentum high.',
    feedbackWrong: 'Missed one. Reset and continue.',
  },
  insights: {
    kicker: 'SPRINT 6 ANALYTICS',
    title: 'Insights',
    totalSessions: 'Total Sessions',
    lifetimeAccuracy: 'Lifetime Accuracy',
    avgResponse: 'Avg Response',
    bestCombo: 'Best Combo',
    modePerformance: 'Mode Performance',
    operationPerformance: 'Operation Performance',
    sessions: 'Sessions',
    bestScore: 'Best Score',
    answered: 'Answered',
    accuracy: 'Accuracy',
    backHome: 'Back Home',
  },
  premium: {
    kicker: 'SPRINT 7 MONETIZATION',
    title: 'Premium',
    advancedInsights: 'Advanced insights dashboard',
    customTrainingControls: 'Custom training controls',
    unlimitedPractice: 'Unlimited focused practice',
    noAds: 'No rewarded ad prompts',
    currentPlan: 'Current Plan',
    premiumActive: 'Premium Active',
    free: 'Free',
    upgradeToPremium: 'Upgrade to Premium',
    themeShowcase: 'Explore Theme Showcase',
  },
  themeShowcase: {
    kicker: 'PREMIUM VISUAL SYSTEM',
    title: 'Theme Showcase',
    subtitle:
      'High-converting visual packs optimized for App Store creatives, paid ads, and premium subscriptions.',
    unlockedThemes: (unlocked, total) => `Unlocked Themes: ${unlocked}/${total}`,
    activeTheme: (name) => `Active Theme: ${name}`,
    selectTheme: 'Apply Theme',
    selectedTheme: 'Theme Active',
    lockedReason: 'Unlock Rule',
    unlockPremium: 'Unlock with Premium',
    emotionalFeel: 'Emotional Feel',
    animationBehavior: 'Animation Behavior',
    targetPersona: 'Target Persona',
    tagline: 'Tagline',
    appStoreConcept: 'App Store Shot',
    instagramStory: 'Instagram Story',
    beforeAfter: 'Before / After',
    adCopy: 'Sample Ad Copy',
    visualSystem: 'Visual System',
    audioSystem: 'Audio + FX',
    marketingAssets: 'Marketing Assets',
    category: {
      all: 'All',
      free: 'Free',
      premium: 'Premium',
      seasonal: 'Seasonal',
      limited: 'Limited',
      collab: 'Collab',
    },
  },
  customTraining: {
    kicker: 'SPRINT 8 CUSTOM',
    title: 'Custom Training',
    duration: 'Duration',
    questionLimit: 'Question Limit',
    operations: 'Operations',
    selected: (value) => `Selected: ${value}`,
    startCustomRun: 'Start Custom Run',
  },
  result: {
    kicker: 'SESSION REPORT',
    title: 'Performance',
    mode: 'Mode',
    endedBy: 'Ended By',
    operations: 'Operations',
    score: 'Score',
    accuracy: 'Accuracy',
    avgResponse: 'Avg Response',
    correctTotal: 'Correct / Total',
    bestCombo: 'Best Combo',
    xpGained: 'XP Gained',
    totalXp: 'Total XP',
    level: 'Level',
    streakDays: 'Streak Days',
    runsPlayed: 'Runs Played',
    sessionBonus: 'Session Bonus',
    sessionBonusBody: (bonusXp) => `Watch a rewarded ad to gain +${bonusXp} XP.`,
    bonusApplied: 'Bonus applied.',
    bonusUnavailable: 'Bonus unavailable.',
    loading: 'Loading...',
    watchAdAndClaim: 'Watch Ad & Claim',
    runAgain: 'Run Again',
  },
  neuroFusion: enNeuroFusionCopy,
  neuroPass: enNeuroPassCopy,
};

const tr: AppCopy = {
  app: {
    failedToInitialize: 'Uygulama servisleri başlatılamadı.',
    bootstrapping: 'Oyun sistemleri hazırlanıyor...',
    retry: 'Tekrar Dene',
    somethingWentWrong: 'Bir şeyler ters gitti',
    unexpectedRuntimeError: 'Beklenmeyen çalışma zamanı hatası',
  },
  common: {
    back: 'Geri',
    home: 'Ana Sayfa',
    none: 'Yok',
    untimed: 'Süresiz',
  },
  controls: {
    light: 'Açık',
    dark: 'Koyu',
    auto: 'Oto',
    english: 'EN',
    turkish: 'TR',
    lockedThemesHint: (lockedThemeCount, premiumLockHint) =>
      `${lockedThemeCount} tema kilitli. ${premiumLockHint}`,
    lockedPremiumThemeHint: (themeName) => `${themeName}: Premium abonelik gerekli`,
  },
  labels: {
    mode: {
      custom: 'Özel',
      daily: 'Günlük',
      sprint: 'Sprint',
      survival: 'Hayatta Kal',
      zen: 'Zen',
      neuro_fusion: 'Neuro Fusion',
    },
    questionType: {
      addition: 'Toplama',
      subtraction: 'Çıkarma',
      multiplication: 'Çarpma',
      division: 'Bölme',
    },
    questionTypeShort: {
      addition: 'Top',
      subtraction: 'Çık',
      multiplication: 'Çrp',
      division: 'Böl',
    },
    finishReason: {
      timeout: 'Süre Doldu',
      manual: 'Manuel',
      mistake: 'Hata',
      daily_complete: 'Günlük Tamamlandı',
      question_limit: 'Soru Limiti',
    },
  },
  home: {
    kicker: 'PUREMIND SPRINT 8',
    heroTitle: 'Daha Hızlı Düşün\nDaha Keskin Hesapla',
    heroBody: 'Günlük görev aktif. Her gün sabit koşuyu tamamlayıp uzun seriler biriktir.',
    playerLevel: 'Oyuncu Seviyesi',
    totalXp: 'Toplam XP',
    streakDays: 'Seri Günü',
    bestScore: 'En İyi Skor',
    dailyClears: 'Günlük Tamamlama',
    dailyBest: 'Günlük En İyi',
    coinsEarned: (coins) => `+${coins}`,
    coinsTotal: (coins) => `Jeton ${coins}`,
    plan: (isPremium) => `Plan: ${isPremium ? 'Premium' : 'Ücretsiz'}`,
    modeSummary: (modeLabel, durationLabel) => `Mod: ${modeLabel} / ${durationLabel}`,
    modeDurationWithLimit: (durationSeconds, questionLimit) =>
      `${durationSeconds} sn / ${questionLimit} soru`,
    modeDurationTimed: (durationSeconds) => `${durationSeconds} sn`,
    modeTitle: 'Mod',
    operationsTitle: 'İşlemler',
    unlockLevel: (level) => `S${level} seviyede açılır`,
    dailySet: 'Günlük Set',
    customSet: 'Özel Set',
    neuroFusionSet: 'Neuro Fusion Seti',
    ready: 'Hazır',
    selected: (value) => `Seçili: ${value}`,
    dailyCompletedHint: 'Bugünün günlük görevi tamamlandı. Yeni set için yarın tekrar gel.',
    dailyTarget: (questionLimit) =>
      `Günlük hedef: süre bitmeden ${questionLimit} sabit soruyu tamamla.`,
    customHint: (durationSeconds, questionLimit) =>
      `Özel set: ${durationSeconds} sn, ${questionLimit} soru. Özel Antrenman ekranından düzenleyebilirsin.`,
    neuroFusionHint:
      'Neuro Fusion ritim + bulmaca + bilişsel fazlar içerir. BPM ve preset ayarlarını mod ekranından yap.',
    completedToday: 'Bugün Tamamlandı',
    startMode: (modeLabel) => `${modeLabel} Başlat`,
    openInsights: 'İçgörüleri Aç',
    managePremium: 'Premium Yönet',
    goPremium: 'Premium Ol',
    themeShowcase: 'Tema Vitrini',
    editCustomTraining: 'Özel Antrenmanı Düzenle',
    customTraining: 'Özel Antrenman',
    recentRuns: 'Son Koşular',
    recentRunsEmpty: 'Henüz koşu yok. Geçmişi başlatmak için ilk oturumu tamamla.',
    recentRunTitle: (index, modeLabel, score) => `#${index} ${modeLabel} · Skor ${score}`,
    recentRunMeta: (accuracy, combo) => `%${accuracy} / kombo ${combo}`,
    flagshipTag: 'Öne Çıkan',
  },
  game: {
    calibrating: 'Meydan okuma hazırlanıyor...',
    finish: 'Bitir',
    liveMode: (modeLabel) => `${modeLabel} Canlı`,
    keypadDelete: 'Sil',
    keypadClear: 'Temizle',
    keypadSubmit: 'Gönder',
    hudTime: 'SÜRE',
    hudScore: 'SKOR',
    hudCombo: 'KOMBO',
    hudLevel: 'SEVİYE',
    modeTitle: {
      custom: 'Özel Antrenman',
      daily: 'Günlük Görev',
      sprint: 'Matematik Akışı',
      survival: 'Hatasız Koşu',
      zen: 'Sakin Odak',
      neuro_fusion: 'Neuro Fusion',
    },
    modeFooter: {
      custom: 'Özel koşu. Odağını koru ve ayarladığın soru setini tamamla.',
      daily: 'Günlük sabit set. Süre bitmeden tüm soruları tamamla.',
      sprint: 'Seri kur. Zorluk gerçek zamanda performansına göre uyarlanır.',
      survival: 'Tek hata koşuyu bitirir. Baskı altında doğruluğa odaklan.',
      zen: 'Süre yok. Tutarlılık çalış ve tempoyu adaptif zorluk belirlesin.',
      neuro_fusion:
        'Müzik odaklı matematik + bulmaca + biliş bir arada. Yüksek ödül için flow seviyeni koru.',
    },
    difficultyBadge: (difficulty) => `Zorluk ${difficulty}`,
    answerPlaceholder: '...',
    feedbackIdle: 'Sakin kal. Ritmi kur, sonra hızını artır.',
    feedbackCorrect: 'Harika. Momentumu koru.',
    feedbackWrong: 'Bir hata oldu. Sıfırla ve devam et.',
  },
  insights: {
    kicker: 'SPRINT 6 ANALİTİK',
    title: 'İçgörüler',
    totalSessions: 'Toplam Oturum',
    lifetimeAccuracy: 'Genel Doğruluk',
    avgResponse: 'Ort. Yanıt',
    bestCombo: 'En İyi Kombo',
    modePerformance: 'Mod Performansı',
    operationPerformance: 'İşlem Performansı',
    sessions: 'Oturum',
    bestScore: 'En İyi Skor',
    answered: 'Yanıtlanan',
    accuracy: 'Doğruluk',
    backHome: 'Ana Sayfaya Dön',
  },
  premium: {
    kicker: 'SPRINT 7 GELİR MODELİ',
    title: 'Premium',
    advancedInsights: 'Gelişmiş içgörü paneli',
    customTrainingControls: 'Özel antrenman kontrolleri',
    unlimitedPractice: 'Sınırsız odaklı pratik',
    noAds: 'Ödüllü reklam istemleri yok',
    currentPlan: 'Mevcut Plan',
    premiumActive: 'Premium Aktif',
    free: 'Ücretsiz',
    upgradeToPremium: 'Premiuma Yükselt',
    themeShowcase: 'Tema Vitrinini Keşfet',
  },
  themeShowcase: {
    kicker: 'PREMIUM GÖRSEL SİSTEM',
    title: 'Tema Vitrini',
    subtitle:
      'App Store görselleri, performans reklamları ve premium dönüşümü için optimize edilmiş yüksek etki temalar.',
    unlockedThemes: (unlocked, total) => `Açılan Temalar: ${unlocked}/${total}`,
    activeTheme: (name) => `Aktif Tema: ${name}`,
    selectTheme: 'Temayı Uygula',
    selectedTheme: 'Tema Aktif',
    lockedReason: 'Açılma Kuralı',
    unlockPremium: 'Premium ile Aç',
    emotionalFeel: 'Duygusal Etki',
    animationBehavior: 'Animasyon Davranışı',
    targetPersona: 'Hedef Persona',
    tagline: 'Slogan',
    appStoreConcept: 'App Store Görseli',
    instagramStory: 'Instagram Story',
    beforeAfter: 'Önce / Sonra',
    adCopy: 'Reklam Metni',
    visualSystem: 'Görsel Sistem',
    audioSystem: 'Ses + Efekt',
    marketingAssets: 'Pazarlama İçeriği',
    category: {
      all: 'Tümü',
      free: 'Ücretsiz',
      premium: 'Premium',
      seasonal: 'Sezonluk',
      limited: 'Sınırlı',
      collab: 'İş Birliği',
    },
  },
  customTraining: {
    kicker: 'SPRINT 8 ÖZEL',
    title: 'Özel Antrenman',
    duration: 'Süre',
    questionLimit: 'Soru Limiti',
    operations: 'İşlemler',
    selected: (value) => `Seçili: ${value}`,
    startCustomRun: 'Özel Koşuyu Başlat',
  },
  result: {
    kicker: 'OTURUM RAPORU',
    title: 'Performans',
    mode: 'Mod',
    endedBy: 'Bitiş Nedeni',
    operations: 'İşlemler',
    score: 'Skor',
    accuracy: 'Doğruluk',
    avgResponse: 'Ort. Yanıt',
    correctTotal: 'Doğru / Toplam',
    bestCombo: 'En İyi Kombo',
    xpGained: 'Kazanılan XP',
    totalXp: 'Toplam XP',
    level: 'Seviye',
    streakDays: 'Seri Günü',
    runsPlayed: 'Oynanan Koşu',
    sessionBonus: 'Oturum Bonusu',
    sessionBonusBody: (bonusXp) => `+${bonusXp} XP kazanmak için ödüllü reklam izle.`,
    bonusApplied: 'Bonus uygulandı.',
    bonusUnavailable: 'Bonus kullanılamıyor.',
    loading: 'Yükleniyor...',
    watchAdAndClaim: 'Reklam İzle ve Al',
    runAgain: 'Tekrar Koş',
  },
  neuroFusion: trNeuroFusionCopy,
  neuroPass: trNeuroPassCopy,
};

export const copyByLanguage: Record<AppLanguage, AppCopy> = {
  en,
  tr,
};
