import { useMemo } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@app/i18n';
import { useAppTheme } from '@app/theme';
import type { RetroClaimResult } from '@features/neuroPass/domain/iap/NeuroPassRetroClaimEngine';
import { PrimaryButton } from '@ui/components/buttons/PrimaryButton';
import { Card } from '@ui/components/layout/Card';

interface NeuroPassRetroClaimModalProps {
  visible: boolean;
  result: RetroClaimResult | null;
  onDismiss: () => void;
}

export function NeuroPassRetroClaimModal({
  visible,
  result,
  onDismiss,
}: NeuroPassRetroClaimModalProps) {
  const { theme } = useAppTheme();
  const { copy } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!result) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <Card tone="accent" style={styles.modal}>
          <Text style={styles.kicker}>{copy.neuroPass.retroClaim.kicker}</Text>
          <Text style={styles.title}>{copy.neuroPass.retroClaim.title(result.unlockedCount)}</Text>
          <Text style={styles.body}>{copy.neuroPass.retroClaim.tiers(result.unlockedTiers)}</Text>
          {result.highlightedRewards.length > 0 ? (
            <Text style={styles.body}>{copy.neuroPass.retroClaim.highlights(result.highlightedRewards)}</Text>
          ) : null}
          <PrimaryButton onPress={onDismiss}>{copy.neuroPass.retroClaim.nice}</PrimaryButton>
        </Card>
      </View>
    </Modal>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'center',
      padding: theme.spacing.lg,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    modal: {
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
    body: {
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
    },
  });
}
