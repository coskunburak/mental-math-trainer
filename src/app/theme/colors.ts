export interface ThemeColors {
  background: string;
  backgroundElevated: string;
  backgroundMuted: string;
  surface: string;
  surfaceAlt: string;
  surfaceStrong: string;
  border: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  brand: string;
  brandPressed: string;
  brandSoft: string;
  accent: string;
  accentSoft: string;
  success: string;
  danger: string;
  keypadSurface: string;
  keypadPressed: string;
  blobTop: string;
  blobMiddle: string;
  blobBottom: string;
  shadow: string;
}

export const lightColors: ThemeColors = {
  background: '#F2F5FF',
  backgroundElevated: '#FFFFFF',
  backgroundMuted: '#E8EEFF',
  surface: 'rgba(255, 255, 255, 0.86)',
  surfaceAlt: '#F6F8FF',
  surfaceStrong: '#FFFFFF',
  border: 'rgba(24, 40, 82, 0.14)',
  borderStrong: 'rgba(24, 40, 82, 0.26)',
  textPrimary: '#0B1730',
  textSecondary: '#44506A',
  textTertiary: '#68738F',
  brand: '#0B8F87',
  brandPressed: '#0A756E',
  brandSoft: '#D9F3F0',
  accent: '#F97316',
  accentSoft: '#FFE9DA',
  success: '#14B87A',
  danger: '#EF476F',
  keypadSurface: '#FFFFFF',
  keypadPressed: '#ECF1FF',
  blobTop: 'rgba(14, 165, 233, 0.22)',
  blobMiddle: 'rgba(249, 115, 22, 0.18)',
  blobBottom: 'rgba(11, 143, 135, 0.2)',
  shadow: '#111A2E',
};

export const darkColors: ThemeColors = {
  background: '#070B16',
  backgroundElevated: '#0E1528',
  backgroundMuted: '#111A31',
  surface: 'rgba(14, 22, 41, 0.84)',
  surfaceAlt: '#131D37',
  surfaceStrong: '#172140',
  border: 'rgba(124, 151, 211, 0.24)',
  borderStrong: 'rgba(124, 151, 211, 0.42)',
  textPrimary: '#F1F5FF',
  textSecondary: '#B4C0DE',
  textTertiary: '#8594B8',
  brand: '#19C5BB',
  brandPressed: '#13A69E',
  brandSoft: 'rgba(25, 197, 187, 0.18)',
  accent: '#FF9248',
  accentSoft: 'rgba(255, 146, 72, 0.2)',
  success: '#2CD98F',
  danger: '#FF6F91',
  keypadSurface: '#121D39',
  keypadPressed: '#1C2A52',
  blobTop: 'rgba(56, 189, 248, 0.2)',
  blobMiddle: 'rgba(255, 146, 72, 0.2)',
  blobBottom: 'rgba(45, 212, 191, 0.2)',
  shadow: '#000000',
};
