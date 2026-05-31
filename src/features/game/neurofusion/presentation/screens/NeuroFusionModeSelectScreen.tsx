import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@app/i18n';
import { useAppTheme } from '@app/theme';
import type { PremiumEntitlements } from '@features/game/domain/entities/Monetization';
import type {
  NeuroFusionModeVariant,
  NeuroFusionPreset,
  NeuroFusionProgressData,
} from '@features/game/neurofusion/domain/entities/NeuroFusionTypes';
import { PrimaryButton } from '@ui/components/buttons/PrimaryButton';
import { Card } from '@ui/components/layout/Card';
import { Screen } from '@ui/components/layout/Screen';

import type { NeuroFusionSessionConfig } from '../state/neuroFusionStore';

interface NeuroFusionModeSelectScreenProps {
  entitlements: PremiumEntitlements;
  progress: NeuroFusionProgressData;
  calibration: NeuroFusionProgressData['calibration'];
  onStart: (config: NeuroFusionSessionConfig) => void;
  onCalibrate: (bpm: number) => void;
  onBack: () => void;
  onOpenPremium: () => void;
}

const PRESETS: NeuroFusionPreset[] = ['beginner', 'standard', 'hardcore'];
const BPM_OPTIONS = [90, 110, 130, 150];
const TRACK_OPTIONS = ['metro_90', 'metro_110', 'metro_130', 'metro_150'];

export function NeuroFusionModeSelectScreen({
  entitlements,
  progress,
  calibration,
  onStart,
  onCalibrate,
  onBack,
  onOpenPremium,
}: NeuroFusionModeSelectScreenProps) {
  const { theme } = useAppTheme();
  const { copy } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [preset, setPreset] = useState<NeuroFusionPreset>('standard');
  const [modeVariant, setModeVariant] = useState<NeuroFusionModeVariant>('standard');
  const [bpm, setBpm] = useState(120);
  const [trackId, setTrackId] = useState('metro_130');

  const premiumUnlocked = entitlements.unlimitedPractice;

  return (
    <Screen>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.kicker}>{copy.neuroFusion.modeSelect.kicker}</Text>
          <Text style={styles.title}>{copy.neuroFusion.modeSelect.title}</Text>
        </View>
      </View>

      <Card tone="accent" style={styles.card}>
        <Text style={styles.sectionTitle}>{copy.neuroFusion.modeSelect.runPreset}</Text>
        <View style={styles.row}>
          {PRESETS.map((item) => (
            <Chip
              key={item}
              label={copy.neuroFusion.modeSelect.presetLabel(item)}
              selected={preset === item}
              onPress={() => setPreset(item)}
              styles={styles}
            />
          ))}
        </View>

        <Text style={styles.sectionTitle}>{copy.neuroFusion.modeSelect.variant}</Text>
        <View style={styles.row}>
          <Chip
            label={copy.neuroFusion.modeSelect.variantStandard}
            selected={modeVariant === 'standard'}
            onPress={() => setModeVariant('standard')}
            styles={styles}
          />
          <Chip
            label={copy.neuroFusion.modeSelect.variantDailyChallenge}
            selected={modeVariant === 'daily_challenge'}
            onPress={() => setModeVariant('daily_challenge')}
            styles={styles}
          />
          <Chip
            label={
              premiumUnlocked
                ? copy.neuroFusion.modeSelect.variantPractice
                : copy.neuroFusion.modeSelect.variantPracticePremium
            }
            selected={modeVariant === 'practice'}
            onPress={() => {
              if (premiumUnlocked) {
                setModeVariant('practice');
                return;
              }

              onOpenPremium();
            }}
            styles={styles}
          />
        </View>

        <Text style={styles.sectionTitle}>{copy.neuroFusion.modeSelect.bpm}</Text>
        <View style={styles.row}>
          {BPM_OPTIONS.map((item) => (
            <Chip
              key={item}
              label={`${item}`}
              selected={bpm === item}
              onPress={() => {
                if (!premiumUnlocked && item !== 120) {
                  onOpenPremium();
                  return;
                }

                setBpm(item);
              }}
              styles={styles}
            />
          ))}
        </View>

        <Text style={styles.sectionTitle}>{copy.neuroFusion.modeSelect.track}</Text>
        <View style={styles.row}>
          {TRACK_OPTIONS.map((option) => (
            <Chip
              key={option}
              label={copy.neuroFusion.modeSelect.trackLabel(option)}
              selected={trackId === option}
              onPress={() => {
                if (!premiumUnlocked && option !== 'metro_130') {
                  onOpenPremium();
                  return;
                }

                setTrackId(option);
              }}
              styles={styles}
            />
          ))}
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.stat}>
            {copy.neuroFusion.modeSelect.bestScore}: {progress.bestScore}
          </Text>
          <Text style={styles.stat}>
            {copy.neuroFusion.modeSelect.bestGrade}: {progress.bestGrade ?? '-'}
          </Text>
          <Text style={styles.stat}>
            {copy.neuroFusion.modeSelect.fragments}: {progress.totalTrackFragments}
          </Text>
        </View>

        <View style={styles.calibrationCard}>
          <Text style={styles.sectionTitle}>{copy.neuroFusion.modeSelect.latencyCalibration}</Text>
          <Text style={styles.calibrationText}>
            {calibration
              ? copy.neuroFusion.modeSelect.calibrationReady(calibration.offsetMs, calibration.stdDevMs)
              : copy.neuroFusion.modeSelect.notCalibrated}
          </Text>
          <PrimaryButton onPress={() => onCalibrate(bpm)} variant="secondary">
            {copy.neuroFusion.modeSelect.tapToCalibrate(10)}
          </PrimaryButton>
        </View>
      </Card>

      <View style={styles.actions}>
        <PrimaryButton
          onPress={() =>
            onStart({
              preset,
              modeVariant,
              bpm,
              trackId,
            })
          }
        >
          {copy.neuroFusion.modeSelect.start}
        </PrimaryButton>
        <PrimaryButton onPress={onBack} variant="secondary">
          {copy.neuroFusion.modeSelect.back}
        </PrimaryButton>
      </View>
    </Screen>
  );
}

function Chip({
  label,
  selected,
  onPress,
  styles,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.chipPressed,
      ]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    topRow: {
      gap: theme.spacing.xs,
    },
    kicker: {
      color: theme.colors.accent,
      ...theme.typography.caption,
    },
    title: {
      color: theme.colors.textPrimary,
      ...theme.typography.title,
      maxWidth: 360,
    },
    card: {
      gap: theme.spacing.md,
    },
    sectionTitle: {
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
    },
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
    chip: {
      borderRadius: theme.radius.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 8,
    },
    chipSelected: {
      borderColor: theme.colors.brand,
      backgroundColor: theme.colors.brandSoft,
    },
    chipPressed: {
      transform: [{ scale: 0.99 }],
    },
    chipText: {
      color: theme.colors.textPrimary,
      ...theme.typography.caption,
    },
    chipTextSelected: {
      color: theme.colors.brand,
    },
    statsRow: {
      gap: 4,
    },
    stat: {
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
    },
    calibrationCard: {
      gap: theme.spacing.xs,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.sm,
      padding: theme.spacing.sm,
      backgroundColor: theme.colors.surfaceAlt,
    },
    calibrationText: {
      color: theme.colors.textPrimary,
      ...theme.typography.caption,
    },
    actions: {
      gap: theme.spacing.xs,
    },
  });
}
