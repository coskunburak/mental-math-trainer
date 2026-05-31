import type { GameThemeDefinition } from '@features/theme/domain/entities/GameTheme';

import type { ThemeColors } from './colors';

export type ThemeMode = 'light' | 'dark';

interface RgbColor {
  red: number;
  green: number;
  blue: number;
}

const HEX_COLOR = /^#([0-9a-f]{6}|[0-9a-f]{8})$/i;

const FALLBACK_BLACK = '#000000';
const FALLBACK_WHITE = '#FFFFFF';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeHexColor(color: string): string {
  return HEX_COLOR.test(color) ? color.toUpperCase() : FALLBACK_BLACK;
}

function parseHexColor(color: string): RgbColor {
  const normalized = normalizeHexColor(color).replace('#', '');
  const hex = normalized.length === 8 ? normalized.slice(0, 6) : normalized;

  return {
    red: Number.parseInt(hex.slice(0, 2), 16),
    green: Number.parseInt(hex.slice(2, 4), 16),
    blue: Number.parseInt(hex.slice(4, 6), 16),
  };
}

function toHexColor({ red, green, blue }: RgbColor): string {
  const toHex = (value: number) =>
    clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

function mixColors(first: string, second: string, amount: number): string {
  const ratio = clamp(amount, 0, 1);
  const one = parseHexColor(first);
  const two = parseHexColor(second);

  return toHexColor({
    red: one.red + (two.red - one.red) * ratio,
    green: one.green + (two.green - one.green) * ratio,
    blue: one.blue + (two.blue - one.blue) * ratio,
  });
}

function withAlpha(color: string, alpha: number): string {
  const normalized = normalizeHexColor(color).replace('#', '');
  const base = normalized.length === 8 ? normalized.slice(0, 6) : normalized;
  const clampedAlpha = clamp(alpha, 0, 1);
  const alphaHex = Math.round(clampedAlpha * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();

  return `#${base}${alphaHex}`;
}

function relativeLuminance(color: string): number {
  const rgb = parseHexColor(color);
  const linear = [rgb.red, rgb.green, rgb.blue].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrastRatio(colorA: string, colorB: string): number {
  const light = Math.max(relativeLuminance(colorA), relativeLuminance(colorB));
  const dark = Math.min(relativeLuminance(colorA), relativeLuminance(colorB));
  return (light + 0.05) / (dark + 0.05);
}

function readableTextColor(background: string): string {
  const whiteRatio = contrastRatio(background, FALLBACK_WHITE);
  const blackRatio = contrastRatio(background, FALLBACK_BLACK);
  return whiteRatio >= blackRatio ? FALLBACK_WHITE : FALLBACK_BLACK;
}

export function createThemeColors(theme: GameThemeDefinition, mode: ThemeMode): ThemeColors {
  const isDark = mode === 'dark';
  const [gradientStart, gradientMiddle, gradientEnd] = theme.backgroundGradient;
  const primary = normalizeHexColor(theme.primaryColor);
  const secondary = normalizeHexColor(theme.secondaryColor);
  const surface = normalizeHexColor(theme.surfaceColor);
  const accent = normalizeHexColor(theme.accentColor);
  const success = normalizeHexColor(theme.successColor);
  const danger = normalizeHexColor(theme.errorColor);

  const background = isDark
    ? mixColors(gradientStart, '#030712', 0.72)
    : mixColors(gradientMiddle, '#FFFFFF', 0.66);
  const backgroundElevated = isDark
    ? mixColors(surface, '#111827', 0.42)
    : mixColors(surface, '#FFFFFF', 0.78);
  const backgroundMuted = isDark
    ? mixColors(secondary, '#0A0F1A', 0.55)
    : mixColors(secondary, '#F8FBFF', 0.7);

  const surfaceColor = isDark
    ? mixColors(surface, '#0B1220', 0.38)
    : mixColors(surface, '#FFFFFF', 0.84);
  const surfaceAlt = isDark
    ? mixColors(surface, '#111827', 0.5)
    : mixColors(surface, '#F1F5F9', 0.56);
  const surfaceStrong = isDark
    ? mixColors(surface, '#1E293B', 0.52)
    : mixColors(surface, '#FFFFFF', 0.9);

  const border = isDark
    ? withAlpha(mixColors(primary, secondary, 0.3), 0.36)
    : withAlpha(mixColors(primary, secondary, 0.45), 0.22);
  const borderStrong = isDark
    ? withAlpha(mixColors(primary, accent, 0.4), 0.56)
    : withAlpha(mixColors(primary, accent, 0.35), 0.36);

  const textAnchor = readableTextColor(backgroundElevated);
  const textPrimary = textAnchor;
  const textSecondary = isDark
    ? mixColors(textPrimary, '#9CA3AF', 0.38)
    : mixColors(textPrimary, '#4B5563', 0.5);
  const textTertiary = isDark
    ? mixColors(textPrimary, '#64748B', 0.52)
    : mixColors(textPrimary, '#6B7280', 0.62);

  const brand = primary;
  const brandPressed = isDark
    ? mixColors(primary, '#000000', 0.3)
    : mixColors(primary, '#111827', 0.18);
  const brandSoft = withAlpha(primary, isDark ? 0.3 : 0.18);
  const accentSoft = withAlpha(accent, isDark ? 0.34 : 0.2);

  const keypadSurface = isDark
    ? mixColors(surfaceStrong, '#0F172A', 0.3)
    : mixColors(surfaceStrong, '#FFFFFF', 0.68);
  const keypadPressed = isDark
    ? mixColors(keypadSurface, primary, 0.24)
    : mixColors(keypadSurface, primary, 0.12);

  const blobTop = withAlpha(gradientStart, isDark ? 0.3 : 0.25);
  const blobMiddle = withAlpha(gradientMiddle, isDark ? 0.28 : 0.22);
  const blobBottom = withAlpha(gradientEnd, isDark ? 0.3 : 0.24);

  return {
    background,
    backgroundElevated,
    backgroundMuted,
    surface: surfaceColor,
    surfaceAlt,
    surfaceStrong,
    border,
    borderStrong,
    textPrimary,
    textSecondary,
    textTertiary,
    brand,
    brandPressed,
    brandSoft,
    accent,
    accentSoft,
    success,
    danger,
    keypadSurface,
    keypadPressed,
    blobTop,
    blobMiddle,
    blobBottom,
    shadow: isDark ? '#000000' : '#0B1324',
  };
}
