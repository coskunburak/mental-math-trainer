import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@app/i18n';
import { useAppTheme } from '@app/theme';
import { PrimaryButton } from '@ui/components/buttons/PrimaryButton';
import { Card } from '@ui/components/layout/Card';

interface CatchUpOfferCardProps {
  tiersLeft: number;
  disabled?: boolean;
  onOpenPurchase: () => void;
}

export function CatchUpOfferCard({
  tiersLeft,
  disabled = false,
  onOpenPurchase,
}: CatchUpOfferCardProps) {
  const { theme } = useAppTheme();
  const { copy } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Card tone="accent" style={styles.card}>
      <Text style={styles.kicker}>{copy.neuroPass.catchUp.kicker}</Text>
      <Text style={styles.title}>{copy.neuroPass.catchUp.title(tiersLeft)}</Text>
      <Text style={styles.body}>{copy.neuroPass.catchUp.body(tiersLeft)}</Text>
      <View style={styles.actions}>
        <PrimaryButton onPress={onOpenPurchase} disabled={disabled}>
          {copy.neuroPass.catchUp.cta}
        </PrimaryButton>
      </View>
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
      marginTop: 2,
    },
  });
}
