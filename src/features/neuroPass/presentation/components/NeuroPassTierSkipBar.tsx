import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@app/i18n';
import { useAppTheme } from '@app/theme';
import { PrimaryButton } from '@ui/components/buttons/PrimaryButton';
import { Card } from '@ui/components/layout/Card';

interface NeuroPassTierSkipBarProps {
  balance: number;
  dayCount: number;
  onUseOne: () => void;
  onUseFive: () => void;
  onPurchaseFive: () => void;
  disabled?: boolean;
}

export function NeuroPassTierSkipBar({
  balance,
  dayCount,
  onUseOne,
  onUseFive,
  onPurchaseFive,
  disabled = false,
}: NeuroPassTierSkipBarProps) {
  const { theme } = useAppTheme();
  const { copy } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const dailyBlocked = dayCount >= 2;

  return (
    <Card style={styles.card}>
      <Text style={styles.kicker}>{copy.neuroPass.tierSkip.kicker}</Text>
      <Text style={styles.title}>{copy.neuroPass.tierSkip.skips(balance)}</Text>
      <Text style={styles.body}>{copy.neuroPass.tierSkip.dailyPurchaseCount(dayCount)}</Text>

      <View style={styles.actions}>
        <PrimaryButton disabled={disabled || balance <= 0} onPress={onUseOne}>
          {copy.neuroPass.tierSkip.useOne}
        </PrimaryButton>
        <PrimaryButton disabled={disabled || balance < 5} onPress={onUseFive}>
          {copy.neuroPass.tierSkip.useFive}
        </PrimaryButton>
      </View>

      <PrimaryButton
        variant="secondary"
        disabled={disabled || dailyBlocked}
        onPress={onPurchaseFive}
      >
        {dailyBlocked ? copy.neuroPass.tierSkip.dailyLimitReached : copy.neuroPass.tierSkip.buyFive}
      </PrimaryButton>
    </Card>
  );
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
    body: {
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
    },
    actions: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
  });
}
