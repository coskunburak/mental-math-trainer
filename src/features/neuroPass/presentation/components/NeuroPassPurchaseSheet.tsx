import { useMemo } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@app/i18n';
import { useAppTheme } from '@app/theme';
import { PrimaryButton } from '@ui/components/buttons/PrimaryButton';
import { Card } from '@ui/components/layout/Card';

interface PurchaseOffer {
  sku: string;
  title: string;
  subtitle: string;
  localizedPrice: string;
}

interface NeuroPassPurchaseSheetProps {
  visible: boolean;
  loading: boolean;
  standard: PurchaseOffer;
  plus: PurchaseOffer;
  onBuyStandard: () => void;
  onBuyPlus: () => void;
  onRestore: () => void;
  onClose: () => void;
}

export function NeuroPassPurchaseSheet({
  visible,
  loading,
  standard,
  plus,
  onBuyStandard,
  onBuyPlus,
  onRestore,
  onClose,
}: NeuroPassPurchaseSheetProps) {
  const { theme } = useAppTheme();
  const { copy } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Card tone="accent" style={styles.sheet}>
          <Text style={styles.kicker}>{copy.neuroPass.kicker}</Text>
          <Text style={styles.title}>{copy.neuroPass.purchaseSheet.title}</Text>

          <View style={styles.offerCard}>
            <Text style={styles.offerTitle}>{standard.title}</Text>
            <Text style={styles.offerSubtitle}>{standard.subtitle}</Text>
            <Text style={styles.offerPrice}>{standard.localizedPrice}</Text>
            <PrimaryButton disabled={loading} onPress={onBuyStandard}>
              {copy.neuroPass.purchaseSheet.buyStandard}
            </PrimaryButton>
          </View>

          <View style={styles.offerCard}>
            <Text style={styles.offerTitle}>{plus.title}</Text>
            <Text style={styles.offerSubtitle}>{plus.subtitle}</Text>
            <Text style={styles.offerPrice}>{plus.localizedPrice}</Text>
            <PrimaryButton disabled={loading} onPress={onBuyPlus}>
              {copy.neuroPass.purchaseSheet.buyPlus}
            </PrimaryButton>
          </View>

          <PrimaryButton disabled={loading} variant="secondary" onPress={onRestore}>
            {copy.neuroPass.purchaseSheet.restorePurchases}
          </PrimaryButton>
          <PrimaryButton variant="secondary" onPress={onClose}>
            {copy.neuroPass.purchaseSheet.close}
          </PrimaryButton>

          <Text style={styles.legal}>{copy.neuroPass.purchaseSheet.legal}</Text>
        </Card>
      </View>
    </Modal>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.35)',
      padding: theme.spacing.md,
    },
    sheet: {
      gap: theme.spacing.sm,
      maxHeight: '90%',
    },
    kicker: {
      color: theme.colors.accent,
      ...theme.typography.caption,
    },
    title: {
      color: theme.colors.textPrimary,
      ...theme.typography.subtitle,
    },
    offerCard: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.sm,
      gap: theme.spacing.xs,
    },
    offerTitle: {
      color: theme.colors.textPrimary,
      ...theme.typography.caption,
    },
    offerSubtitle: {
      color: theme.colors.textSecondary,
      ...theme.typography.caption,
    },
    offerPrice: {
      color: theme.colors.brand,
      ...theme.typography.subtitle,
    },
    legal: {
      color: theme.colors.textTertiary,
      ...theme.typography.caption,
    },
  });
}
