import { useMemo, useRef, useEffect } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { useLocalization } from '@app/i18n';
import { useAppTheme } from '@app/theme';
import type { SubscriptionTier } from '@features/game/domain/entities/Monetization';
import { PrimaryButton } from '@ui/components/buttons/PrimaryButton';
import { ThemeModeSwitch } from '@ui/components/buttons/ThemeModeSwitch';
import { Card } from '@ui/components/layout/Card';
import { Screen } from '@ui/components/layout/Screen';

interface PremiumScreenProps {
  tier: SubscriptionTier;
  onUpgrade: () => void;
  onBack: () => void;
}

export function PremiumScreen({ tier, onUpgrade, onBack }: PremiumScreenProps) {
  const { theme } = useAppTheme();
  const { copy } = useLocalization();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const revealTop = useRef(new Animated.Value(0)).current;
  const revealCard = useRef(new Animated.Value(0)).current;
  const revealActions = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sequence = [revealTop, revealCard, revealActions];
    sequence.forEach((value) => value.setValue(0));

    Animated.stagger(
      90,
      sequence.map((value) =>
        Animated.spring(value, {
          toValue: 1,
          tension: 88,
          friction: 10,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [revealActions, revealCard, revealTop]);

  const alreadyPremium = tier === 'premium';

  return (
    <Screen>
      <Animated.View style={[revealStyle(revealTop, 14), styles.topRow]}>
        <View>
          <Text style={styles.kicker}>{copy.premium.kicker}</Text>
          <Text style={styles.title}>{copy.premium.title}</Text>
        </View>
        <ThemeModeSwitch />
      </Animated.View>

      <Animated.View style={revealStyle(revealCard, 22)}>
        <Card tone="accent" style={styles.section}>
          <Benefit text={copy.premium.advancedInsights} styles={styles} />
          <Benefit text={copy.premium.customTrainingControls} styles={styles} />
          <Benefit text={copy.premium.unlimitedPractice} styles={styles} />
          <Benefit text={copy.premium.noAds} styles={styles} />

          <View style={styles.statusWrap}>
            <Text style={styles.statusLabel}>{copy.premium.currentPlan}</Text>
            <Text style={styles.statusValue}>
              {alreadyPremium ? copy.premium.premiumActive : copy.premium.free}
            </Text>
          </View>
        </Card>
      </Animated.View>

      <Animated.View style={revealStyle(revealActions, 30)}>
        <View style={styles.actions}>
          <PrimaryButton onPress={onUpgrade} disabled={alreadyPremium}>
            {alreadyPremium ? copy.premium.premiumActive : copy.premium.upgradeToPremium}
          </PrimaryButton>
          <PrimaryButton onPress={onBack} variant="secondary">
            {copy.common.back}
          </PrimaryButton>
        </View>
      </Animated.View>
    </Screen>
  );
}

function Benefit({ text, styles }: { text: string; styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.benefitRow}>
      <Text style={styles.benefitDot}>•</Text>
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

function revealStyle(value: Animated.Value, fromY: number) {
  return {
    opacity: value,
    transform: [
      {
        translateY: value.interpolate({
          inputRange: [0, 1],
          outputRange: [fromY, 0],
        }),
      },
    ],
  } as const;
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    kicker: {
      color: theme.colors.textTertiary,
      ...theme.typography.caption,
    },
    title: {
      color: theme.colors.textPrimary,
      ...theme.typography.title,
    },
    section: {
      gap: theme.spacing.md,
    },
    benefitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    benefitDot: {
      color: theme.colors.brand,
      ...theme.typography.subtitle,
    },
    benefitText: {
      color: theme.colors.textSecondary,
      ...theme.typography.body,
      flex: 1,
    },
    statusWrap: {
      marginTop: theme.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: theme.spacing.sm,
      gap: 2,
    },
    statusLabel: {
      color: theme.colors.textTertiary,
      ...theme.typography.caption,
    },
    statusValue: {
      color: theme.colors.textPrimary,
      ...theme.typography.subtitle,
    },
    actions: {
      gap: theme.spacing.sm,
    },
  });
}
