import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@app/i18n';
import { useAppTheme } from '@app/theme';
import type {
  NeuroFusionProgressData,
  NeuroFusionRunSummary,
} from '@features/game/neurofusion/domain/entities/NeuroFusionTypes';
import { PrimaryButton } from '@ui/components/buttons/PrimaryButton';
import { Card } from '@ui/components/layout/Card';
import { Screen } from '@ui/components/layout/Screen';

interface NeuroFusionResultScreenProps {
  summary: NeuroFusionRunSummary;
  progress: NeuroFusionProgressData;
  onGrantNeuroPassXp: (summary: NeuroFusionRunSummary) => Promise<{
    grantedAmount: number;
    isDuplicate: boolean;
    showPremiumUpsellHint?: boolean;
    premiumUpsellMessage?: string;
  }>;
  onRunAgain: () => void;
  onBackHome: () => void;
  onOpenNeuroPass?: () => void;
}

export function NeuroFusionResultScreen({
  summary,
  progress,
  onGrantNeuroPassXp,
  onRunAgain,
  onBackHome,
  onOpenNeuroPass,
}: NeuroFusionResultScreenProps) {
  const { theme } = useAppTheme();
  const { copy } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [grantToast, setGrantToast] = useState<string | null>(null);
  const [premiumUpsellHint, setPremiumUpsellHint] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setGrantToast(null);
    setPremiumUpsellHint(null);

    void onGrantNeuroPassXp(summary)
      .then((result) => {
        if (!active || result.isDuplicate) {
          return;
        }

        setGrantToast(copy.neuroFusion.result.grantToast(result.grantedAmount));
        if (result.showPremiumUpsellHint) {
          setPremiumUpsellHint(copy.neuroFusion.result.premiumHint);
        }
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setGrantToast(null);
      });

    return () => {
      active = false;
    };
  }, [copy.neuroFusion.result, onGrantNeuroPassXp, summary]);

  useEffect(() => {
    if (!grantToast) {
      return;
    }

    const timeout = setTimeout(() => {
      setGrantToast(null);
    }, 1800);

    return () => clearTimeout(timeout);
  }, [grantToast]);

  return (
    <Screen>
      {grantToast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{grantToast}</Text>
        </View>
      ) : null}

      <Card tone="accent" style={styles.card}>
        <Text style={styles.kicker}>{copy.neuroFusion.result.kicker}</Text>
        <Text style={styles.title}>{copy.neuroFusion.result.grade(summary.grade)}</Text>

        <StatRow label={copy.neuroFusion.result.score} value={`${summary.score}`} styles={styles} />
        <StatRow label={copy.neuroFusion.result.accuracy} value={`${Math.round(summary.accuracy * 100)}%`} styles={styles} />
        <StatRow label={copy.neuroFusion.result.avgBeatOffset} value={`${summary.avgBeatOffsetMs} ms`} styles={styles} />
        <StatRow label={copy.neuroFusion.result.bestCombo} value={`${summary.bestCombo}`} styles={styles} />
        <StatRow label={copy.neuroFusion.result.flowPeak} value={`${summary.flowPeak}`} styles={styles} />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>{copy.neuroFusion.result.phaseBreakdown}</Text>
        {Object.entries(summary.phaseBreakdown).map(([phase, stats]) => (
          <View key={phase} style={styles.phaseRow}>
            <Text style={styles.phaseTitle}>
              {copy.neuroFusion.hud.phaseLabel[phase as keyof typeof copy.neuroFusion.hud.phaseLabel] ?? phase}
            </Text>
            <Text style={styles.phaseMeta}>{copy.neuroFusion.result.phaseMeta(stats.score, stats.correct, stats.total)}</Text>
          </View>
        ))}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>{copy.neuroFusion.result.rewards}</Text>
        <StatRow label={copy.neuroFusion.result.rewardXp} value={`+${summary.rewards.xp}`} styles={styles} />
        <StatRow label={copy.neuroFusion.result.rewardCoins} value={`+${summary.rewards.coins}`} styles={styles} />
        <StatRow label={copy.neuroFusion.result.rewardTrackFragments} value={`+${summary.rewards.trackFragments}`} styles={styles} />
        <StatRow label={copy.neuroFusion.result.rewardWeeklyLeague} value={`+${summary.rewards.weeklyLeaguePoints}`} styles={styles} />
        <Text style={styles.badges}>
          {copy.neuroFusion.result.badgeLabel(
            summary.rewards.badges.map((badge) => copy.neuroFusion.result.localizeBadge(badge)),
          )}
        </Text>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>{copy.neuroFusion.result.progress}</Text>
        <StatRow label={copy.neuroFusion.result.bestScore} value={`${progress.bestScore}`} styles={styles} />
        <StatRow label={copy.neuroFusion.result.bestGrade} value={`${progress.bestGrade ?? '-'}`} styles={styles} />
        <StatRow label={copy.neuroFusion.result.totalFragments} value={`${progress.totalTrackFragments}`} styles={styles} />
      </Card>

      {premiumUpsellHint ? (
        <Card tone="accent" style={styles.card}>
          <Text style={styles.kicker}>{copy.neuroFusion.result.premiumTip}</Text>
          <Text style={styles.badges}>{premiumUpsellHint}</Text>
          {onOpenNeuroPass ? (
            <PrimaryButton variant="secondary" onPress={onOpenNeuroPass}>
              {copy.neuroFusion.result.openNeuroPass}
            </PrimaryButton>
          ) : null}
        </Card>
      ) : null}

      <View style={styles.actions}>
        <PrimaryButton onPress={onRunAgain}>{copy.neuroFusion.result.runAgain}</PrimaryButton>
        <PrimaryButton onPress={onBackHome} variant="secondary">
          {copy.neuroFusion.result.backHome}
        </PrimaryButton>
      </View>
    </Screen>
  );
}

function StatRow({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    card: {
      gap: theme.spacing.sm,
    },
    kicker: {
      color: theme.colors.accent,
      ...theme.typography.caption,
    },
    title: {
      color: theme.colors.textPrimary,
      ...theme.typography.title,
    },
    sectionTitle: {
      color: theme.colors.textPrimary,
      ...theme.typography.subtitle,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    label: {
      color: theme.colors.textSecondary,
      ...theme.typography.body,
    },
    value: {
      color: theme.colors.textPrimary,
      ...theme.typography.subtitle,
    },
    phaseRow: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: theme.spacing.xs,
      gap: 2,
    },
    phaseTitle: {
      color: theme.colors.accent,
      ...theme.typography.caption,
    },
    phaseMeta: {
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
    },
    badges: {
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
    },
    actions: {
      gap: theme.spacing.xs,
    },
    toast: {
      borderRadius: theme.radius.pill,
      borderWidth: 1,
      borderColor: theme.colors.brand,
      backgroundColor: theme.colors.brandSoft,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      alignSelf: 'flex-start',
    },
    toastText: {
      color: theme.colors.textPrimary,
      ...theme.typography.caption,
    },
  });
}
