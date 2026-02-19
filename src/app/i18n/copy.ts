import type { GameMode } from '@features/game/domain/entities/GameMode';
import type { SessionFinishReason } from '@features/game/domain/entities/ProgressModels';
import type { QuestionType } from '@features/game/domain/entities/Question';

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
    english: string;
    turkish: string;
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
    plan: (isPremium: boolean) => string;
    modeSummary: (modeLabel: string, durationLabel: string) => string;
    modeDurationWithLimit: (durationSeconds: number, questionLimit: number) => string;
    modeDurationTimed: (durationSeconds: number) => string;
    modeTitle: string;
    operationsTitle: string;
    unlockLevel: (level: number) => string;
    dailySet: string;
    customSet: string;
    ready: string;
    selected: (value: string) => string;
    dailyCompletedHint: string;
    dailyTarget: (questionLimit: number) => string;
    customHint: (durationSeconds: number, questionLimit: number) => string;
    completedToday: string;
    startMode: (modeLabel: string) => string;
    openInsights: string;
    managePremium: string;
    goPremium: string;
    editCustomTraining: string;
    customTraining: string;
    recentRuns: string;
    recentRunsEmpty: string;
    recentRunTitle: (index: number, modeLabel: string, score: number) => string;
    recentRunMeta: (accuracy: number, combo: number) => string;
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
    english: 'EN',
    turkish: 'TR',
  },
  labels: {
    mode: {
      custom: 'Custom',
      daily: 'Daily',
      sprint: 'Sprint',
      survival: 'Survival',
      zen: 'Zen',
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
    plan: (isPremium) => `Plan: ${isPremium ? 'Premium' : 'Free'}`,
    modeSummary: (modeLabel, durationLabel) => `Mode: ${modeLabel} / ${durationLabel}`,
    modeDurationWithLimit: (durationSeconds, questionLimit) => `${durationSeconds}s / ${questionLimit}Q`,
    modeDurationTimed: (durationSeconds) => `${durationSeconds}s`,
    modeTitle: 'Mode',
    operationsTitle: 'Operations',
    unlockLevel: (level) => `Unlock L${level}`,
    dailySet: 'Daily Set',
    customSet: 'Custom Set',
    ready: 'Ready',
    selected: (value) => `Selected: ${value}`,
    dailyCompletedHint: 'Daily Challenge completed for today. Come back tomorrow for a new set.',
    dailyTarget: (questionLimit) => `Daily target: ${questionLimit} fixed questions before time expires.`,
    customHint: (durationSeconds, questionLimit) =>
      `Custom set: ${durationSeconds}s, ${questionLimit} questions. Edit in Custom Training.`,
    completedToday: 'Completed Today',
    startMode: (modeLabel) => `Start ${modeLabel}`,
    openInsights: 'Open Insights',
    managePremium: 'Manage Premium',
    goPremium: 'Go Premium',
    editCustomTraining: 'Edit Custom Training',
    customTraining: 'Custom Training',
    recentRuns: 'Recent Runs',
    recentRunsEmpty: 'No runs yet. Complete your first session to start tracking history.',
    recentRunTitle: (index, modeLabel, score) => `#${index} ${modeLabel} · Score ${score}`,
    recentRunMeta: (accuracy, combo) => `${accuracy}% / combo ${combo}`,
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
    },
    modeFooter: {
      custom: 'Custom run. Keep focus and clear your configured question set.',
      daily: 'Daily fixed set. Finish all questions before the timer ends.',
      sprint: 'Build a streak. Difficulty adapts in real time to your performance.',
      survival: 'One mistake ends the run. Prioritize accuracy under pressure.',
      zen: 'No timer. Practice consistency and let adaptive difficulty shape the pace.',
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
    english: 'EN',
    turkish: 'TR',
  },
  labels: {
    mode: {
      custom: 'Özel',
      daily: 'Günlük',
      sprint: 'Sprint',
      survival: 'Hayatta Kal',
      zen: 'Zen',
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
    plan: (isPremium) => `Plan: ${isPremium ? 'Premium' : 'Ücretsiz'}`,
    modeSummary: (modeLabel, durationLabel) => `Mod: ${modeLabel} / ${durationLabel}`,
    modeDurationWithLimit: (durationSeconds, questionLimit) => `${durationSeconds} sn / ${questionLimit} soru`,
    modeDurationTimed: (durationSeconds) => `${durationSeconds} sn`,
    modeTitle: 'Mod',
    operationsTitle: 'İşlemler',
    unlockLevel: (level) => `S${level} seviyede açılır`,
    dailySet: 'Günlük Set',
    customSet: 'Özel Set',
    ready: 'Hazır',
    selected: (value) => `Seçili: ${value}`,
    dailyCompletedHint: 'Bugünün günlük görevi tamamlandı. Yeni set için yarın tekrar gel.',
    dailyTarget: (questionLimit) => `Günlük hedef: süre bitmeden ${questionLimit} sabit soruyu tamamla.`,
    customHint: (durationSeconds, questionLimit) =>
      `Özel set: ${durationSeconds} sn, ${questionLimit} soru. Özel Antrenman ekranından düzenleyebilirsin.`,
    completedToday: 'Bugün Tamamlandı',
    startMode: (modeLabel) => `${modeLabel} Başlat`,
    openInsights: 'İçgörüleri Aç',
    managePremium: 'Premium Yönet',
    goPremium: 'Premium Ol',
    editCustomTraining: 'Özel Antrenmanı Düzenle',
    customTraining: 'Özel Antrenman',
    recentRuns: 'Son Koşular',
    recentRunsEmpty: 'Henüz koşu yok. Geçmişi başlatmak için ilk oturumu tamamla.',
    recentRunTitle: (index, modeLabel, score) => `#${index} ${modeLabel} · Skor ${score}`,
    recentRunMeta: (accuracy, combo) => `%${accuracy} / kombo ${combo}`,
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
    },
    modeFooter: {
      custom: 'Özel koşu. Odağını koru ve ayarladığın soru setini tamamla.',
      daily: 'Günlük sabit set. Süre bitmeden tüm soruları tamamla.',
      sprint: 'Seri kur. Zorluk gerçek zamanda performansına göre uyarlanır.',
      survival: 'Tek hata koşuyu bitirir. Baskı altında doğruluğa odaklan.',
      zen: 'Süre yok. Tutarlılık çalış ve tempoyu adaptif zorluk belirlesin.',
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
};

export const copyByLanguage: Record<AppLanguage, AppCopy> = {
  en,
  tr,
};
