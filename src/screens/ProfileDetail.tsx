// ProfileDetail — a full member profile with pass / say-hi actions.
// Mirrors coterie-ios/Circle/Views/Sheets/ProfileDetailView.swift.

import React from 'react';
import { View, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS } from 'react-native-reanimated';
import { serif, grotesk, eyebrow, useTheme, Palette } from '../theme';
import { Text, Pressed, ProfilePhoto, TagPill } from '../components/ui';
import { useStore, sharedInterests } from '../store';

export function ProfileDetail({ memberId }: { memberId: string }) {
  const C = useTheme();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const s = useStore();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const member = s.knownMembers[memberId];

  const close = () => s.closeSheet();
  const pass = () => { s.passMember(memberId); close(); };
  const like = () => { if (s.likesRemaining === 0) return; s.likeMember(memberId); close(); };

  // Swipe-right-to-go-back (like the native back gesture), only on this page.
  const tx = useSharedValue(0);
  const swipe = Gesture.Pan()
    .activeOffsetX(20)          // only claim clearly-horizontal swipes; vertical scroll still works
    .failOffsetY([-14, 14])
    .onUpdate((e) => { tx.value = Math.max(0, e.translationX); })
    .onEnd((e) => {
      if (e.translationX > 120 || e.velocityX > 800) {
        tx.value = withTiming(width, { duration: 200 }, (done) => { if (done) runOnJS(close)(); });
      } else {
        tx.value = withSpring(0, { damping: 20 });
      }
    });
  const pageStyle = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));

  if (!member) return <View style={{ flex: 1, backgroundColor: C.paper }} />;

  const shared = sharedInterests(s, member);
  const disabled = s.likesRemaining === 0;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={swipe}>
        <Animated.View style={[{ flex: 1, backgroundColor: C.paper }, pageStyle]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
            {/* Hero */}
            <View style={styles.hero}>
              <ProfilePhoto uri={s.memberPhotos[memberId]?.[0]} seed={member.portrait} style={StyleSheet.absoluteFill} />
              <LinearGradient
                colors={['rgba(0,0,0,0.18)', 'transparent', 'transparent', 'rgba(0,0,0,0.6)']}
                locations={[0, 0.35, 0.62, 1]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.heroBody}>
                <View style={styles.nameRow}>
                  <Text style={[serif(48), { color: '#fff' }]}>{member.name}</Text>
                  <Text style={[serif(26), { color: 'rgba(255,255,255,0.8)' }]}>{member.age}</Text>
                </View>
                <Text style={styles.role}>
                  {member.role} · {member.city}
                </Text>
              </View>
              <Pressed
                scale={0.92}
                onPress={close}
                style={[styles.closeBtn, { top: insets.top + 12 }]}
              >
                <Ionicons name="chevron-back" size={22} color="#fff" />
              </Pressed>
            </View>

            {/* Details */}
            <View style={styles.details}>
              {!!member.bio && (
                <Text style={[serif(23), { color: C.ink80, lineHeight: 30 }]}>{member.bio}</Text>
              )}

              {shared.length > 0 && (
                <Block title="Shared interests" first={!member.bio}>
                  <View style={styles.tags}>
                    {shared.map((t) => <TagPill key={t} text={t} />)}
                  </View>
                </Block>
              )}

              {member.prompts.map((pr) => (
                <Block key={pr.id} title={pr.q}>
                  <Text style={[serif(25), { color: C.ink90, lineHeight: 30 }]}>“{pr.a}”</Text>
                </Block>
              ))}

              {member.interests.length > 0 && (
                <Block title="Interests">
                  <View style={styles.tags}>
                    {member.interests.map((t) => <TagPill key={t} text={t} />)}
                  </View>
                </Block>
              )}
            </View>
          </ScrollView>

          {/* Action bar */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
            <Pressed scale={0.94} onPress={pass} style={styles.passCircle}>
              <Ionicons name="close" size={26} color={C.ink70} />
            </Pressed>
            <Pressed
              scale={0.97}
              onPress={like}
              disabled={disabled}
              style={[styles.sayHi, { opacity: disabled ? 0.4 : 1 }]}
            >
              <Ionicons name="heart" size={18} color={C.accentInk} />
              <Text style={[grotesk(15, 'semibold'), { color: C.accentInk, letterSpacing: 0.5 }]}>Say Hi</Text>
            </Pressed>
          </View>
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

function Block({ title, children, first }: { title: string; children: React.ReactNode; first?: boolean }) {
  const C = useTheme();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  return (
    <View style={[styles.block, first && { borderTopWidth: 0, marginTop: 0, paddingTop: 0 }]}>
      <Text style={[eyebrow(C.muted, 2.6), { marginBottom: 12 }]}>{title}</Text>
      {children}
    </View>
  );
}

const makeStyles = (C: Palette) => StyleSheet.create({
  hero: { height: 486, width: '100%', backgroundColor: C.photoEmpty, justifyContent: 'flex-end' },
  heroBody: { padding: 26, gap: 10 },
  nameRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  role: {
    ...grotesk(11),
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.82)',
  },
  closeBtn: {
    position: 'absolute',
    left: 22,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: { paddingHorizontal: 26, paddingTop: 28 },
  block: {
    marginTop: 22,
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: C.hairline,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 24,
    paddingTop: 14,
    backgroundColor: C.paper,
    borderTopWidth: 1,
    borderTopColor: C.hairline,
  },
  passCircle: {
    width: 62, height: 62, borderRadius: 31,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.borderStrong,
  },
  sayHi: {
    flex: 1, height: 62, borderRadius: 31,
    backgroundColor: C.accent,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
});
