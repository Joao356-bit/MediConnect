import '@/global.css';

import { Platform } from 'react-native';

/** Design tokens do MediConnect 2.0. */
export const Colors = {
  light: {
    text: '#183153',
    background: '#F4F7FB',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E7F0F5',
    textSecondary: '#64748B',
    primary: '#176B87',
    primaryPressed: '#12566D',
    border: '#DCE5ED',
    success: '#15803D',
    successBackground: '#EAF7EF',
    warning: '#B45309',
    warningBackground: '#FFF7E8',
    danger: '#B91C1C',
    dangerBackground: '#FDECEC',
    surfaceMuted: '#EEF3F7',
    white: '#FFFFFF',
  },
  dark: {
    text: '#E7EEF7',
    background: '#101B2A',
    backgroundElement: '#18283B',
    backgroundSelected: '#203B50',
    textSecondary: '#A8B7C8',
    primary: '#55A9C5',
    primaryPressed: '#3E91AE',
    border: '#2B4055',
    success: '#4ADE80',
    successBackground: '#153B2A',
    warning: '#FBBF24',
    warningBackground: '#493516',
    danger: '#F87171',
    dangerBackground: '#451F27',
    surfaceMuted: '#203247',
    white: '#FFFFFF',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 48,
  seven: 64,
} as const;

export const Radius = { small: 8, medium: 12, large: 16, pill: 999 } as const;

export const Shadows = {
  card: Platform.select({
    web: { boxShadow: '0 2px 10px rgba(24, 49, 83, 0.05)' },
    default: {
      shadowColor: '#183153',
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
  }),
};

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 1120;
