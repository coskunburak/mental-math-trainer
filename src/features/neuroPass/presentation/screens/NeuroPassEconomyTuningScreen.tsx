import { useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@app/i18n';
import { useAppTheme } from '@app/theme';
import type { NeuroPassConfig } from '@features/neuroPass/domain/config/NeuroPassConfig';
import {
  defaultSimulationInput,
  type NeuroPassPlayerProfile,
  type NeuroPassSimulationInput,
  type NeuroPassSimulationReport,
} from '@features/neuroPass/domain/economy/NeuroPassSimulationEngine';
import { PrimaryButton } from '@ui/components/buttons/PrimaryButton';
import { Card } from '@ui/components/layout/Card';
import { Screen } from '@ui/components/layout/Screen';

interface NeuroPassEconomyTuningScreenProps {
  config: NeuroPassConfig;
  onSimulate: (input: NeuroPassSimulationInput) => NeuroPassSimulationReport;
  onClose: () => void;
}

export function NeuroPassEconomyTuningScreen({
  config,
  onSimulate,
  onClose,
}: NeuroPassEconomyTuningScreenProps) {
  const { theme } = useAppTheme();
  const { language } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isTr = language === 'tr';
  const labels = useMemo(() => ({
    copied: isTr ? 'JSON panoya kopyalandi' : 'JSON copied to clipboard',
    sharedFallback: isTr ? 'Pano kullanilamadi, JSON paylasildi' : 'Clipboard unavailable, shared JSON instead',
    devOnly: isTr ? 'SADECE DEV' : 'DEV ONLY',
    title: isTr ? 'Neuro Pass Ekonomi Ayari' : 'Neuro Pass Economy Tuning',
    subtitle: isTr ? 'P50/P75/P90 oyuncu tipleri icin tohumlu simulator.' : 'Seeded simulator for P50/P75/P90-style players.',
    back: isTr ? 'Geri' : 'Back',
    remoteConfig: isTr ? 'Remote Config Ozeti' : 'Remote Config Snapshot',
    softHardCap: isTr ? 'yumusak/sert cap' : 'soft/hard cap',
    softMultiplier: isTr ? 'yumusak carpani' : 'soft multiplier',
    weights: isTr ? 'agirliklar' : 'weights',
    manifestOverride: isTr ? 'manifest override' : 'manifest override',
    none: isTr ? '(yok)' : '(none)',
    playerProfile: isTr ? 'Oyuncu Profili' : 'Player Profile',
    sessionsPerDay: isTr ? 'oturum/gun' : 'sessions/day',
    activeDaysPerWeek: isTr ? 'aktif gun/hafta' : 'active days/week',
    rhythmMean: isTr ? 'ritim ort.' : 'rhythm mean',
    comboMean: isTr ? 'kombo ort.' : 'combo mean',
    antiSpamMean: isTr ? 'anti-spam ort.' : 'anti-spam mean',
    runDistribution: isTr ? 'Kosu NXP Dagilimi' : 'Run NXP Distribution',
    avgPreCap: isTr ? 'cap oncesi ort.' : 'avg pre-cap',
    avgAfterCap: isTr ? 'cap sonrasi ort.' : 'avg after-cap',
    lostToCaps: isTr ? 'cap kaybi ort.' : 'lost to caps',
    capCurve: isTr ? 'Cap Egrisi (todayRunNxp -> effective)' : 'Cap Curve (todayRunNxp -> effective)',
    projection: isTr ? '28 Gunluk Projeksiyon' : '28-Day Projection',
    totalNxp: isTr ? 'toplam NXP' : 'total NXP',
    tiersReached: isTr ? 'ulasilan kademe' : 'tiers reached',
    completionP75: isTr ? 'tamamlama gunu P75' : 'completion day P75',
    completionP90: isTr ? 'tamamlama gunu P90' : 'completion day P90',
    notReached: isTr ? 'ulasilmadi' : 'not reached',
    fromRuns: isTr ? 'kosulardan' : 'from runs',
    fromDailyQuests: isTr ? 'gunluk gorevlerden' : 'from daily quests',
    fromWeeklyBoss: isTr ? 'haftalik+boss gorevlerden' : 'from weekly+boss',
    exportJson: isTr ? 'JSON Raporunu Disa Aktar' : 'Export JSON Report',
    close: isTr ? 'Kapat' : 'Close',
  }), [isTr]);

  const [profile, setProfile] = useState<NeuroPassPlayerProfile>('P50');
  const [input, setInput] = useState<NeuroPassSimulationInput>(() => defaultSimulationInput('P50'));
  const [report, setReport] = useState<NeuroPassSimulationReport>(() => onSimulate(defaultSimulationInput('P50')));
  const [exportToast, setExportToast] = useState<string | null>(null);

  const rerun = (next: NeuroPassSimulationInput) => {
    setInput(next);
    setReport(onSimulate(next));
  };

  const updateNumeric = (
    key: keyof NeuroPassSimulationInput,
    delta: number,
    bounds: [number, number],
  ) => {
    if (typeof input[key] !== 'number') {
      return;
    }

    const next = Number(input[key]) + delta;
    const clamped = Math.max(bounds[0], Math.min(bounds[1], next));
    rerun({
      ...input,
      [key]: clamped,
    } as NeuroPassSimulationInput);
  };

  const exportJson = async () => {
    const payload = {
      generatedAtUtc: new Date().toISOString(),
      input,
      config,
      report,
    };
    const text = JSON.stringify(payload, null, 2);

    let copied = false;
    try {
      const module = require('expo-clipboard') as {
        setStringAsync?: (value: string) => Promise<void>;
      };
      if (typeof module.setStringAsync === 'function') {
        await module.setStringAsync(text);
        copied = true;
      }
    } catch {
      copied = false;
    }

    if (copied) {
      setExportToast(labels.copied);
      return;
    }

    await Share.share({
      message: text,
    });
    setExportToast(labels.sharedFallback);
  };

  return (
    <Screen>
      <Card tone="accent" style={styles.card}>
        <Text style={styles.kicker}>{labels.devOnly}</Text>
        <Text style={styles.title}>{labels.title}</Text>
        <Text style={styles.body}>{labels.subtitle}</Text>
        <PrimaryButton variant="secondary" onPress={onClose}>{labels.back}</PrimaryButton>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>{labels.remoteConfig}</Text>
        <Text style={styles.body}>{`${labels.softHardCap}: ${config.softCapThreshold}/${config.hardCapThreshold}`}</Text>
        <Text style={styles.body}>{`${labels.softMultiplier}: ${config.softCapMultiplier}`}</Text>
        <Text style={styles.body}>{`${labels.weights}: rhythm ${config.rhythmBonusWeight}, combo ${config.comboBonusWeight}, antiSpam ${config.antiSpamScale}`}</Text>
        <Text style={styles.body}>{`${labels.manifestOverride}: v${config.manifestOverrideVersion} ${config.manifestOverrideKey || labels.none}`}</Text>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>{labels.playerProfile}</Text>
        <View style={styles.segmentRow}>
          {(['P50', 'P75', 'P90'] as const).map((item) => (
            <Pressable
              key={item}
              onPress={() => {
                setProfile(item);
                rerun(defaultSimulationInput(item));
              }}
              style={({ pressed }) => [
                styles.segment,
                profile === item && styles.segmentSelected,
                pressed && styles.segmentPressed,
              ]}
            >
              <Text style={[styles.segmentLabel, profile === item && styles.segmentLabelSelected]}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <StepperRow
          label={labels.sessionsPerDay}
          value={input.sessionsPerDay}
          onDecrease={() => updateNumeric('sessionsPerDay', -1, [0, 20])}
          onIncrease={() => updateNumeric('sessionsPerDay', 1, [0, 20])}
        />
        <StepperRow
          label={labels.activeDaysPerWeek}
          value={input.daysActivePerWeek}
          onDecrease={() => updateNumeric('daysActivePerWeek', -1, [1, 7])}
          onIncrease={() => updateNumeric('daysActivePerWeek', 1, [1, 7])}
        />
        <StepperRow
          label={labels.rhythmMean}
          value={input.rhythmBonusMean}
          onDecrease={() => updateNumeric('rhythmBonusMean', -1, [0, 40])}
          onIncrease={() => updateNumeric('rhythmBonusMean', 1, [0, 40])}
        />
        <StepperRow
          label={labels.comboMean}
          value={input.comboBonusMean}
          onDecrease={() => updateNumeric('comboBonusMean', -1, [0, 25])}
          onIncrease={() => updateNumeric('comboBonusMean', 1, [0, 25])}
        />
        <StepperRow
          label={labels.antiSpamMean}
          value={input.antiSpamPenaltyMean}
          onDecrease={() => updateNumeric('antiSpamPenaltyMean', -1, [0, 60])}
          onIncrease={() => updateNumeric('antiSpamPenaltyMean', 1, [0, 60])}
        />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>{labels.runDistribution}</Text>
        <Text style={styles.body}>{`${labels.avgPreCap}: ${report.runDistribution.averageRunNxpPreCap}`}</Text>
        <Text style={styles.body}>{`${labels.avgAfterCap}: ${report.runDistribution.averageRunNxpAfterCap}`}</Text>
        <Text style={styles.body}>{`${labels.lostToCaps}: ${report.runDistribution.averageLostToCap}`}</Text>
        {report.runDistribution.histogram.map((bucket) => (
          <Text key={`${bucket.minInclusive}-${bucket.maxInclusive}`} style={styles.monoText}>
            {`${bucket.minInclusive}-${bucket.maxInclusive}`.padEnd(8, ' ')} {bar(bucket.count)} {bucket.count}
          </Text>
        ))}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>{labels.capCurve}</Text>
        {report.capCurve.points.map((point) => (
          <Text key={point.todayRunTotal} style={styles.monoText}>
            {`${`${point.todayRunTotal}`.padStart(4, ' ')} -> ${`${point.effectiveForCandidateRun}`.padStart(3, ' ')} (lost ${point.lostForCandidateRun})`}
          </Text>
        ))}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>{labels.projection}</Text>
        <Text style={styles.body}>{`${labels.totalNxp}: ${report.seasonProjection.totalNxp}`}</Text>
        <Text style={styles.body}>{`${labels.tiersReached}: ${report.seasonProjection.tiersReached}/40`}</Text>
        <Text style={styles.body}>{`${labels.completionP75}: ${report.seasonProjection.completionDayEstimateP75 ?? labels.notReached}`}</Text>
        <Text style={styles.body}>{`${labels.completionP90}: ${report.seasonProjection.completionDayEstimateP90 ?? labels.notReached}`}</Text>
        <Text style={styles.body}>{`${labels.fromRuns}: ${report.seasonProjection.runNxp}`}</Text>
        <Text style={styles.body}>{`${labels.fromDailyQuests}: ${report.seasonProjection.dailyQuestNxp}`}</Text>
        <Text style={styles.body}>{`${labels.fromWeeklyBoss}: ${report.seasonProjection.weeklyQuestNxp}`}</Text>
      </Card>

      <PrimaryButton onPress={exportJson}>{labels.exportJson}</PrimaryButton>
      {exportToast ? <Text style={styles.toastText}>{exportToast}</Text> : null}
      <PrimaryButton variant="secondary" onPress={onClose}>{labels.close}</PrimaryButton>
    </Screen>
  );
}

function StepperRow({
  label,
  value,
  onDecrease,
  onIncrease,
}: {
  label: string;
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <Text style={{ color: '#d8e2ff', fontSize: 13 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Pressable onPress={onDecrease} style={{ paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#365389', borderRadius: 8 }}>
          <Text style={{ color: '#d8e2ff', fontSize: 13 }}>-</Text>
        </Pressable>
        <Text style={{ color: '#f7fbff', fontSize: 13, minWidth: 32, textAlign: 'center' }}>{Math.round(value)}</Text>
        <Pressable onPress={onIncrease} style={{ paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#365389', borderRadius: 8 }}>
          <Text style={{ color: '#d8e2ff', fontSize: 13 }}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function bar(count: number): string {
  const length = Math.min(24, Math.max(0, Math.round(count / 10)));
  return '#'.repeat(length);
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    card: {
      gap: theme.spacing.xs,
    },
    kicker: {
      color: theme.colors.accent,
      ...theme.typography.caption,
    },
    title: {
      color: theme.colors.textPrimary,
      ...theme.typography.subtitle,
    },
    sectionTitle: {
      color: theme.colors.textPrimary,
      ...theme.typography.caption,
    },
    body: {
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
    },
    segmentRow: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.xs,
    },
    segment: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.pill,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 4,
      backgroundColor: theme.colors.surface,
    },
    segmentSelected: {
      borderColor: theme.colors.brand,
      backgroundColor: theme.colors.brandSoft,
    },
    segmentPressed: {
      opacity: 0.85,
    },
    segmentLabel: {
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
    },
    segmentLabelSelected: {
      color: theme.colors.textPrimary,
    },
    monoText: {
      color: theme.colors.textSecondary,
      fontFamily: 'Courier',
      fontSize: 11,
      lineHeight: 16,
    },
    toastText: {
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
    },
  });
}
