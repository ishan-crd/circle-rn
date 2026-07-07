// Design system — mirrors coterie-ios/Circle/Theme/Theme.swift (light mode).
// Warm editorial: Cormorant Garamond (serif display) + Hanken Grotesk (body)
// on a paper background with a warm orange accent.

import { TextStyle } from 'react-native';

export const CT = {
  // Surfaces
  paper: '#FBFAF8',
  surface: '#FFFFFF',
  ink: '#0B0B0B',

  // Warm accent
  accent: '#E0674A',
  accentInk: '#FFFFFF',
  accentSoft: 'rgba(224,103,74,0.12)',

  // Text tones
  ink90: '#16140F',
  ink80: '#1A1814',
  ink70: '#2A2823',
  body: '#56534E',
  bodyLight: '#76736E',
  muted: '#9A9792',
  faint: '#B6B3AE',
  fainter: '#C2BFBA',

  // Lines / borders / fills
  hairline: 'rgba(0,0,0,0.08)',
  hairlineSoft: 'rgba(0,0,0,0.06)',
  border: 'rgba(0,0,0,0.16)',
  borderStrong: 'rgba(0,0,0,0.20)',
  fill: 'rgba(0,0,0,0.06)',

  // Component-specific
  bubbleThem: '#F0EEEA',
  photoEmpty: '#F1EFEB',
} as const;

// Font family names as registered by @expo-google-fonts.
export const Fonts = {
  serif: 'CormorantGaramond_500Medium',
  serifRegular: 'CormorantGaramond_400Regular',
  serifSemibold: 'CormorantGaramond_600SemiBold',
  serifItalic: 'CormorantGaramond_500Medium_Italic',
  grotesk: 'HankenGrotesk_400Regular',
  groteskMedium: 'HankenGrotesk_500Medium',
  groteskSemibold: 'HankenGrotesk_600SemiBold',
  groteskBold: 'HankenGrotesk_700Bold',
} as const;

type Weight = 'regular' | 'medium' | 'semibold' | 'bold';

export function serif(size: number, weight: Weight = 'regular'): TextStyle {
  const family =
    weight === 'semibold' ? Fonts.serifSemibold
    : weight === 'medium' ? Fonts.serif
    : Fonts.serifRegular;
  // Cormorant runs small; nudge line height for editorial display.
  return { fontFamily: family, fontSize: size, lineHeight: size * 1.05, color: CT.ink };
}

export function serifItalic(size: number): TextStyle {
  return { fontFamily: Fonts.serifItalic, fontStyle: 'italic', fontSize: size, color: CT.ink };
}

export function grotesk(size: number, weight: Weight = 'regular'): TextStyle {
  const family =
    weight === 'bold' ? Fonts.groteskBold
    : weight === 'semibold' ? Fonts.groteskSemibold
    : weight === 'medium' ? Fonts.groteskMedium
    : Fonts.grotesk;
  return { fontFamily: family, fontSize: size, color: CT.ink };
}

/** Small uppercase tracked label — the app's `.eyebrow` style. */
export function eyebrow(color: string = CT.muted, tracking = 2.2): TextStyle {
  return {
    ...grotesk(10.5, 'medium'),
    color,
    letterSpacing: tracking,
    textTransform: 'uppercase',
  };
}

export const fontsToLoad = {
  CormorantGaramond_400Regular: require('@expo-google-fonts/cormorant-garamond/400Regular/CormorantGaramond_400Regular.ttf'),
  CormorantGaramond_500Medium: require('@expo-google-fonts/cormorant-garamond/500Medium/CormorantGaramond_500Medium.ttf'),
  CormorantGaramond_600SemiBold: require('@expo-google-fonts/cormorant-garamond/600SemiBold/CormorantGaramond_600SemiBold.ttf'),
  CormorantGaramond_500Medium_Italic: require('@expo-google-fonts/cormorant-garamond/500Medium_Italic/CormorantGaramond_500Medium_Italic.ttf'),
  HankenGrotesk_400Regular: require('@expo-google-fonts/hanken-grotesk/400Regular/HankenGrotesk_400Regular.ttf'),
  HankenGrotesk_500Medium: require('@expo-google-fonts/hanken-grotesk/500Medium/HankenGrotesk_500Medium.ttf'),
  HankenGrotesk_600SemiBold: require('@expo-google-fonts/hanken-grotesk/600SemiBold/HankenGrotesk_600SemiBold.ttf'),
  HankenGrotesk_700Bold: require('@expo-google-fonts/hanken-grotesk/700Bold/HankenGrotesk_700Bold.ttf'),
};
