// "It's a match" celebration — mirrors MatchMoment.swift.

import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { CT, serif, grotesk, eyebrow } from '../theme';
import { Text, PillButton, ProfilePhoto } from '../components/ui';
import { useStore } from '../store';
import { Member } from '../types';

export function MatchMoment({ member }: { member: Member }) {
  const insets = useSafeAreaInsets();
  const profile = useStore((s) => s.profile);
  const theirPhoto = useStore((s) => s.memberPhotos[member.id]?.[0]);
  const messageMatch = useStore((s) => s.messageMatch);
  const dismissMatch = useStore((s) => s.dismissMatch);

  const t = useSharedValue(0);
  useEffect(() => { t.value = withSpring(1, { damping: 12 }); }, []);

  const fade = useAnimatedStyle(() => ({ opacity: t.value }));
  const leftCard = useAnimatedStyle(() => ({
    transform: [{ scale: 0.7 + 0.3 * t.value }, { rotate: `${-6 * t.value}deg` }],
  }));
  const rightCard = useAnimatedStyle(() => ({
    transform: [{ scale: 0.7 + 0.3 * t.value }, { rotate: `${6 * t.value}deg` }],
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
      <View style={styles.center}>
        <Animated.View style={[{ alignItems: 'center' }, fade]}>
          <Eyebrowish>A NEW FRIEND</Eyebrowish>
          <Text style={[serif(46), { marginTop: 10 }]}>You’re both in.</Text>
          <Text style={[grotesk(15), { color: CT.body, textAlign: 'center', marginTop: 14, maxWidth: 290, lineHeight: 22 }]}>
            You and {member.name} liked each other. Say hello and see where it goes.
          </Text>
        </Animated.View>

        <View style={styles.portraits}>
          <Animated.View style={[styles.cardWrap, { zIndex: 1 }, leftCard]}>
            <ProfilePhoto uri={profile.photos.find((p) => p) ?? undefined} seed={{ lx: 50, ly: 16 }} style={styles.card} />
          </Animated.View>
          <Animated.View style={[styles.cardWrap, { marginLeft: -26 }, rightCard]}>
            <ProfilePhoto uri={theirPhoto} seed={member.portrait} style={styles.card} />
          </Animated.View>
        </View>
      </View>

      <Animated.View style={[styles.actions, { bottom: insets.bottom + 24 }, fade]}>
        <PillButton title="Send a message" onPress={messageMatch} />
        <Pressable onPress={dismissMatch} style={{ paddingVertical: 12, alignItems: 'center' }}>
          <Text style={[grotesk(14, 'medium'), { color: CT.muted }]}>Keep exploring</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function Eyebrowish({ children }: { children: React.ReactNode }) {
  return <Text style={[eyebrow(CT.accent, 3), {}]}>{children}</Text>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  portraits: { flexDirection: 'row', marginTop: 40 },
  cardWrap: {},
  card: {
    width: 150, height: 190, borderRadius: 22, borderWidth: 4, borderColor: CT.paper,
  },
  actions: { position: 'absolute', left: 30, right: 30, bottom: 40, gap: 12 },
});
