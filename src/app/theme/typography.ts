import { Platform, type TextStyle } from 'react-native';

import type { TypographyStyle } from '@features/theme/domain/entities/GameTheme';

const displayCondensedFamily = Platform.select({
  ios: 'AvenirNextCondensed-Heavy',
  android: 'sans-serif-condensed',
  default: undefined,
});

const bodyFamily = Platform.select({
  ios: 'AvenirNext-Medium',
  android: 'sans-serif-medium',
  default: undefined,
});

const monoFamily = Platform.select({
  ios: 'Menlo-Bold',
  android: 'monospace',
  default: undefined,
});

const serifFamily = Platform.select({
  ios: 'Times New Roman',
  android: 'serif',
  default: undefined,
});

export interface TypographyTokens {
  hero: TextStyle;
  title: TextStyle;
  subtitle: TextStyle;
  body: TextStyle;
  caption: TextStyle;
  button: TextStyle;
  metric: TextStyle;
  question: TextStyle;
  answer: TextStyle;
  keypad: TextStyle;
}

function createTypographySet(
  display: string | undefined,
  body: string | undefined,
  numbers: string | undefined,
  weightBoost = 0,
): TypographyTokens {
  const questionSize = 45 + weightBoost;
  const answerSize = 31 + weightBoost;

  return {
    hero: {
      fontFamily: display,
      fontSize: 35,
      lineHeight: 39,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    title: {
      fontFamily: display,
      fontSize: 26,
      lineHeight: 30,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
    subtitle: {
      fontFamily: body,
      fontSize: 15,
      lineHeight: 21,
      fontWeight: '600',
    },
    body: {
      fontFamily: body,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: '500',
    },
    caption: {
      fontFamily: body,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: '600',
      letterSpacing: 0.4,
    },
    button: {
      fontFamily: body,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: '800',
      letterSpacing: 0.4,
    },
    metric: {
      fontFamily: numbers,
      fontSize: 21,
      lineHeight: 25,
      fontWeight: '700',
    },
    question: {
      fontFamily: numbers,
      fontSize: questionSize,
      lineHeight: questionSize + 6,
      fontWeight: '700',
      letterSpacing: 1,
    },
    answer: {
      fontFamily: numbers,
      fontSize: answerSize,
      lineHeight: answerSize + 4,
      fontWeight: '700',
      letterSpacing: 1,
    },
    keypad: {
      fontFamily: numbers,
      fontSize: 25,
      lineHeight: 30,
      fontWeight: '700',
    },
  };
}

const typographyByStyle: Record<TypographyStyle, TypographyTokens> = {
  focus: createTypographySet(displayCondensedFamily, bodyFamily, monoFamily),
  tech: createTypographySet(displayCondensedFamily, monoFamily, monoFamily),
  zen: createTypographySet(bodyFamily, bodyFamily, monoFamily),
  retro: createTypographySet(monoFamily, monoFamily, monoFamily, -1),
  elite: createTypographySet(serifFamily, bodyFamily, monoFamily),
  matrix: createTypographySet(monoFamily, monoFamily, monoFamily, -1),
  market: createTypographySet(displayCondensedFamily, bodyFamily, monoFamily),
};

export function createTypography(style: TypographyStyle): TypographyTokens {
  return typographyByStyle[style] ?? typographyByStyle.focus;
}

export const typography = typographyByStyle.focus;
