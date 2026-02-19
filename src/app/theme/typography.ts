import { Platform, type TextStyle } from 'react-native';

const displayFamily = Platform.select({
  ios: 'AvenirNextCondensed-Heavy',
  android: 'sans-serif-condensed',
  default: undefined,
});

const bodyFamily = Platform.select({
  ios: 'AvenirNext-Medium',
  android: 'sans-serif-medium',
  default: undefined,
});

const numberFamily = Platform.select({
  ios: 'Menlo-Bold',
  android: 'monospace',
  default: undefined,
});

export const typography = {
  hero: {
    fontFamily: displayFamily,
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '800',
    letterSpacing: 0.5,
  } satisfies TextStyle,
  title: {
    fontFamily: displayFamily,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: 0.3,
  } satisfies TextStyle,
  subtitle: {
    fontFamily: bodyFamily,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
  } satisfies TextStyle,
  body: {
    fontFamily: bodyFamily,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  } satisfies TextStyle,
  caption: {
    fontFamily: bodyFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.4,
  } satisfies TextStyle,
  button: {
    fontFamily: bodyFamily,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
    letterSpacing: 0.4,
  } satisfies TextStyle,
  metric: {
    fontFamily: numberFamily,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
  } satisfies TextStyle,
  question: {
    fontFamily: numberFamily,
    fontSize: 52,
    lineHeight: 58,
    fontWeight: '700',
    letterSpacing: 1,
  } satisfies TextStyle,
  answer: {
    fontFamily: numberFamily,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: 1,
  } satisfies TextStyle,
  keypad: {
    fontFamily: numberFamily,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
  } satisfies TextStyle,
} as const;
