// Shared design-system components — mirror the reusable views in Theme.swift.

import React from 'react';
import {
  Text as RNText, TextProps, View, Pressable, StyleSheet, TextStyle, ViewStyle,
  ActivityIndicator, StyleProp,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { CT, serif, grotesk, eyebrow, Fonts } from '../theme';
import { PortraitSeed } from '../types';

// ---- Text ------------------------------------------------------------------

export const Text = (p: TextProps) => <RNText {...p} allowFontScaling={false} />;

export function Eyebrow({ children, color, tracking, style }: {
  children: React.ReactNode; color?: string; tracking?: number; style?: StyleProp<TextStyle>;
}) {
  return <Text style={[eyebrow(color, tracking), style]}>{children}</Text>;
}

// ---- Pressable with press-scale (PressableStyle) ---------------------------

export function Pressed({ children, onPress, scale = 0.96, style, disabled }: {
  children: React.ReactNode; onPress?: () => void; scale?: number;
  style?: StyleProp<ViewStyle>; disabled?: boolean;
}) {
  const s = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Animated.View style={anim}>
      <Pressable
        onPressIn={() => (s.value = withSpring(scale, { damping: 15 }))}
        onPressOut={() => (s.value = withSpring(1, { damping: 15 }))}
        onPress={onPress}
        disabled={disabled}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

// ---- PillButton ------------------------------------------------------------

export function PillButton({ title, style = 'filled', onPress, enabled = true, loading }: {
  title: string; style?: 'filled' | 'outline'; onPress?: () => void; enabled?: boolean; loading?: boolean;
}) {
  const filled = style === 'filled';
  const disabled = !enabled || loading;
  return (
    <Pressed scale={0.97} onPress={disabled ? undefined : onPress} disabled={disabled}
      style={[
        styles.pill,
        filled ? { backgroundColor: disabled ? CT.fill : CT.ink } : { borderWidth: 1, borderColor: CT.border },
        disabled && filled ? { opacity: 1 } : null,
      ]}>
      {loading ? (
        <ActivityIndicator color={filled ? CT.paper : CT.ink} />
      ) : (
        <Text style={[grotesk(15, 'semibold'), { color: filled ? CT.paper : CT.ink, letterSpacing: 0.3 }]}>
          {title}
        </Text>
      )}
    </Pressed>
  );
}

// ---- LogoMark --------------------------------------------------------------

export function LogoMark({ height = 20, color = CT.ink }: { height?: number; color?: string }) {
  return (
    <Text style={{ fontFamily: Fonts.serif, fontSize: height * 1.15, letterSpacing: height * 0.04, color }}>
      Circle
    </Text>
  );
}

// ---- PortraitGradient (placeholder for photos) -----------------------------

const MOODS = {
  hi: '#C9C4BC', mid: '#8E8880', lo: '#141210',
};

export function PortraitGradient({ seed }: { seed: PortraitSeed }) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient colors={[MOODS.hi, MOODS.mid, MOODS.lo]} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(255,255,255,0.9)', 'transparent']}
        start={{ x: seed.lx / 100, y: seed.ly / 100 }}
        end={{ x: seed.lx / 100 + 0.4, y: seed.ly / 100 + 0.4 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(4,4,4,0.9)', 'transparent']}
        start={{ x: (100 - seed.lx) / 100, y: (100 - seed.ly) / 100 }}
        end={{ x: (100 - seed.lx) / 100 - 0.4, y: (100 - seed.ly) / 100 - 0.4 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

// ---- ProfilePhoto: real photo (fills + clips) or gradient placeholder ------

export function ProfilePhoto({ uri, seed, style }: {
  uri?: string | null; seed: PortraitSeed; style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ overflow: 'hidden' }, style]}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      ) : (
        <PortraitGradient seed={seed} />
      )}
    </View>
  );
}

// ---- ChoiceChip ------------------------------------------------------------

export function ChoiceChip({ label, selected, onPress, fontSize = 14, hPad = 18, vPad = 10 }: {
  label: string; selected: boolean; onPress: () => void; fontSize?: number; hPad?: number; vPad?: number;
}) {
  return (
    <Pressed scale={0.95} onPress={onPress}
      style={{
        paddingHorizontal: hPad, paddingVertical: vPad, borderRadius: 999,
        backgroundColor: selected ? CT.ink : 'transparent',
        borderWidth: 1, borderColor: selected ? CT.ink : CT.border,
      }}>
      <Text style={[grotesk(fontSize, 'medium'), { color: selected ? CT.paper : CT.ink70 }]}>{label}</Text>
    </Pressed>
  );
}

// ---- TagPill ---------------------------------------------------------------

export function TagPill({ text }: { text: string }) {
  return (
    <View style={{ paddingHorizontal: 15, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: CT.border }}>
      <Text style={[grotesk(11, 'medium'), { letterSpacing: 1.1, textTransform: 'uppercase', color: CT.ink70 }]}>{text}</Text>
    </View>
  );
}

// ---- UnderlineField --------------------------------------------------------

import { TextInput, KeyboardTypeOptions } from 'react-native';

export function UnderlineField({ placeholder, value, onChangeText, fontSize = 26, keyboardType, autoCapitalize }: {
  placeholder: string; value: string; onChangeText: (t: string) => void; fontSize?: number;
  keyboardType?: KeyboardTypeOptions; autoCapitalize?: 'none' | 'sentences' | 'words';
}) {
  return (
    <View style={{ gap: 12 }}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={CT.faint}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={[serif(fontSize), { color: CT.ink, paddingVertical: 4 }]}
      />
      <View style={{ height: 1, backgroundColor: CT.border }} />
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: 54, borderRadius: 999, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', width: '100%',
  },
});
