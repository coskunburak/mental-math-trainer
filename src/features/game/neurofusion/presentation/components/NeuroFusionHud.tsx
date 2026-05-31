import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@app/i18n';
import { useAppTheme } from '@app/theme';
import type { NeuroFusionRunState } from '@features/game/neurofusion/domain/entities/NeuroFusionTypes';

interface NeuroFusionHudProps {
  runState: NeuroFusionRunState;
}

export function NeuroFusionHud({ runState }: NeuroFusionHudProps) {
  const { theme } = useAppTheme();
  const { copy } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const phase = runState.phases[runState.phaseIndex] ?? runState.phases[runState.phases.length - 1];
  const phaseProgress =
    phase.durationBeats <= 0
      ? 1
      : (runState.beatIndex - phase.startBeat) / phase.durationBeats;

  const beatProgress = runState.totalBeats <= 0 ? 1 : runState.beatIndex / runState.totalBeats;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{copy.neuroFusion.hud.phaseLabel[runState.currentPhase]}</Text>
        </View>
        <Text style={styles.metaText}>
          {copy.neuroFusion.hud.beatsLeft(Math.max(0, runState.totalBeats - runState.beatIndex))}
        </Text>
      </View>

      <View style={styles.progressBlock}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, beatProgress * 100))}%` }]} />
        </View>
        <View style={styles.progressTrackPhase}>
          <View style={[styles.progressFillPhase, { width: `${Math.max(0, Math.min(100, phaseProgress * 100))}%` }]} />
        </View>
      </View>

      <View style={styles.statsRow}>
        <Stat label={copy.neuroFusion.hud.score} value={`${runState.progress.score}`} styles={styles} />
        <Stat label={copy.neuroFusion.hud.combo} value={`${runState.progress.combo}`} styles={styles} />
        <Stat label={copy.neuroFusion.hud.flow} value={`${runState.progress.flow}`} styles={styles} />
        <Stat label={copy.neuroFusion.hud.beat} value={`${runState.beatIndex}`} styles={styles} />
      </View>
    </View>
  );
}

function Stat({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    container: {
      gap: theme.spacing.sm,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.sm,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    badge: {
      borderRadius: theme.radius.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.brandSoft,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 4,
    },
    badgeText: {
      color: theme.colors.brand,
      ...theme.typography.caption,
    },
    metaText: {
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
    },
    progressBlock: {
      gap: 6,
    },
    progressTrack: {
      height: 10,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.surfaceStrong,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.colors.brand,
    },
    progressTrackPhase: {
      height: 6,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.surfaceStrong,
      overflow: 'hidden',
    },
    progressFillPhase: {
      height: '100%',
      backgroundColor: theme.colors.accent,
    },
    statsRow: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    stat: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.sm,
      paddingVertical: 6,
      paddingHorizontal: 8,
      backgroundColor: theme.colors.surfaceAlt,
    },
    statLabel: {
      color: theme.colors.textTertiary,
      fontSize: 10,
      lineHeight: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    statValue: {
      marginTop: 2,
      color: theme.colors.textPrimary,
      ...theme.typography.subtitle,
    },
  });
}
