// Design system — mirrors coterie-ios/Circle/Theme/Theme.swift, including dark
// mode. Warm editorial: Cormorant Garamond (serif display) + Hanken Grotesk
// (body). Colours flow through a ThemeProvider so every screen adapts to the
// resolved light/dark scheme; the font helpers are colour-free (the themed
// `Text` in components/ui applies the default text colour).

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { TextStyle, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from './types';

// ---- Palettes (exact values from Theme.swift Color.dyn(light, dark)) --------

export interface Palette {
  paper: string;
  surface: string;
  ink: string;
  accent: string;
  accentInk: string;
  accentSoft: string;
  ink90: string;
  ink80: string;
  ink70: string;
  body: string;
  bodyLight: string;
  muted: string;
  faint: string;
  fainter: string;
  tabIdle: string;
  hairline: string;
  hairlineSoft: string;
  border: string;
  borderStrong: string;
  fill: string;
  disabledFill: string;
  disabledInk: string;
  bubbleThem: string;
  photoEmpty: string;
}

export const lightColors: Palette = {
  paper: '#FBFAF8',
  surface: '#FFFFFF',
  ink: '#0B0B0B',
  accent: '#E0674A',
  accentInk: '#FFFFFF',
  accentSoft: 'rgba(224,103,74,0.12)',
  ink90: '#16140F',
  ink80: '#1A1814',
  ink70: '#2A2823',
  body: '#56534E',
  bodyLight: '#76736E',
  muted: '#9A9792',
  faint: '#B6B3AE',
  fainter: '#C2BFBA',
  tabIdle: '#BCB9B4',
  hairline: 'rgba(0,0,0,0.08)',
  hairlineSoft: 'rgba(0,0,0,0.06)',
  border: 'rgba(0,0,0,0.16)',
  borderStrong: 'rgba(0,0,0,0.20)',
  fill: 'rgba(0,0,0,0.06)',
  disabledFill: 'rgba(0,0,0,0.07)',
  disabledInk: 'rgba(0,0,0,0.32)',
  bubbleThem: '#F0EEEA',
  photoEmpty: '#F1EFEB',
};

export const darkColors: Palette = {
  paper: '#100F0D',
  surface: '#1C1B18',
  ink: '#F4F1EC',
  accent: '#F07E5E',
  accentInk: '#1A0F0B',
  accentSoft: 'rgba(240,126,94,0.16)',
  ink90: '#ECE8E2',
  ink80: '#E2DED7',
  ink70: '#D2CEC6',
  body: '#ADA89F',
  bodyLight: '#948F86',
  muted: '#7B776F',
  faint: '#615D57',
  fainter: '#4D4A45',
  tabIdle: '#5A5650',
  hairline: 'rgba(255,255,255,0.12)',
  hairlineSoft: 'rgba(255,255,255,0.09)',
  border: 'rgba(255,255,255,0.20)',
  borderStrong: 'rgba(255,255,255,0.26)',
  fill: 'rgba(255,255,255,0.10)',
  disabledFill: 'rgba(255,255,255,0.10)',
  disabledInk: 'rgba(255,255,255,0.30)',
  bubbleThem: '#262320',
  photoEmpty: '#211F1D',
};

// ---- Fonts -----------------------------------------------------------------

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

// Font helpers are colour-free: the themed `Text` supplies the default colour,
// and callers override with an explicit colour where needed.
export function serif(size: number, weight: Weight = 'regular'): TextStyle {
  const family =
    weight === 'semibold' ? Fonts.serifSemibold
    : weight === 'medium' ? Fonts.serif
    : Fonts.serifRegular;
  return { fontFamily: family, fontSize: size, lineHeight: size * 1.05 };
}

export function serifItalic(size: number): TextStyle {
  return { fontFamily: Fonts.serifItalic, fontStyle: 'italic', fontSize: size };
}

export function grotesk(size: number, weight: Weight = 'regular'): TextStyle {
  const family =
    weight === 'bold' ? Fonts.groteskBold
    : weight === 'semibold' ? Fonts.groteskSemibold
    : weight === 'medium' ? Fonts.groteskMedium
    : Fonts.grotesk;
  return { fontFamily: family, fontSize: size };
}

/** Small uppercase tracked label — the app's `.eyebrow` style. */
export function eyebrow(color?: string, tracking = 2.2): TextStyle {
  return {
    ...grotesk(10.5, 'medium'),
    ...(color ? { color } : null),
    letterSpacing: tracking,
    textTransform: 'uppercase',
  };
}

// ---- Theme context ---------------------------------------------------------

type Scheme = 'light' | 'dark';

interface ThemeValue {
  colors: Palette;
  scheme: Scheme;
  appearance: Appearance;
  setAppearance: (a: Appearance) => void;
}

const STORAGE_KEY = 'circle.appearance';
const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const device = useColorScheme(); // 'light' | 'dark' | null, tracks the OS
  const [appearance, setAppearanceState] = useState<Appearance>('system');

  // Restore the saved override once on mount.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === 'light' || v === 'dark' || v === 'system') setAppearanceState(v);
    });
  }, []);

  const setAppearance = (a: Appearance) => {
    setAppearanceState(a);
    AsyncStorage.setItem(STORAGE_KEY, a).catch(() => {});
  };

  // 'system' follows the device; an explicit choice wins regardless of device.
  const scheme: Scheme = appearance === 'system' ? (device === 'dark' ? 'dark' : 'light') : appearance;
  const colors = scheme === 'dark' ? darkColors : lightColors;

  const value = useMemo<ThemeValue>(
    () => ({ colors, scheme, appearance, setAppearance }),
    [colors, scheme, appearance],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** The active colour palette. Re-renders the component on theme change. */
export function useTheme(): Palette {
  const ctx = useContext(ThemeContext);
  return ctx ? ctx.colors : lightColors;
}

/** Appearance control (for the Profile switch) + the resolved scheme. */
export function useAppearance(): { appearance: Appearance; setAppearance: (a: Appearance) => void; scheme: Scheme } {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { appearance: 'system', setAppearance: () => {}, scheme: 'light' };
  return { appearance: ctx.appearance, setAppearance: ctx.setAppearance, scheme: ctx.scheme };
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
