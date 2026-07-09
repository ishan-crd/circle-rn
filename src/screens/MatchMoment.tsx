// "It's a match" celebration — mirrors MatchMoment.swift.

import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { serif, grotesk, eyebrow, useTheme, useAppearance, Palette } from '../theme';
import { Text, PillButton, ProfilePhoto } from '../components/ui';
import { useStore } from '../store';
import { Member } from '../types';

export function MatchMoment({ member }: { member: Member }) {
  const C = useTheme();
  const { scheme } = useAppearance();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const theirPhoto = useStore((s) => s.memberPhotos[member.id]?.[0]);
  const messageMatch = useStore((s) => s.messageMatch);
  const dismissMatch = useStore((s) => s.dismissMatch);

  const t = useSharedValue(0);
  useEffect(() => { t.value = withSpring(1, { damping: 12 }); }, []);

  const fade = useAnimatedStyle(() => ({ opacity: t.value }));
  const card = useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [{ scale: 0.8 + 0.2 * t.value }],
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <BlurView intensity={30} tint={scheme} style={StyleSheet.absoluteFill} />
      <View style={styles.center}>
        <Animated.View style={[{ alignItems: 'center' }, fade]}>
          <Eyebrowish>A NEW FRIEND</Eyebrowish>
          <Text style={[serif(46), { marginTop: 10 }]}>You’re both in.</Text>
          <Text style={[grotesk(15), { color: C.body, textAlign: 'center', marginTop: 14, maxWidth: 290, lineHeight: 22 }]}>
            You and {member.name} liked each other. Say hello and see where it goes.
          </Text>
        </Animated.View>

        <View style={styles.portraits}>
          <Animated.View style={card}>
            <ProfilePhoto uri={theirPhoto} seed={member.portrait} style={styles.card} />
          </Animated.View>
        </View>
      </View>

      <Animated.View style={[styles.actions, { bottom: insets.bottom + 24 }, fade]}>
        <PillButton title="Send a message" onPress={messageMatch} />
        <Pressable onPress={dismissMatch} style={{ paddingVertical: 12, alignItems: 'center' }}>
          <Text style={[grotesk(14, 'medium'), { color: C.muted }]}>Keep exploring</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function Eyebrowish({ children }: { children: React.ReactNode }) {
  const C = useTheme();
  return <Text style={[eyebrow(C.accent, 3), {}]}>{children}</Text>;
}

const makeStyles = (C: Palette) => StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  portraits: { marginTop: 40, alignItems: 'center' },
  card: {
    width: 210, height: 270, borderRadius: 24, borderWidth: 4, borderColor: C.paper,
  },
  actions: { position: 'absolute', left: 30, right: 30, bottom: 40, gap: 12 },
});
