// ProfileDetail — a full member profile with pass / say-hi actions.
// Mirrors coterie-ios/Circle/Views/Sheets/ProfileDetailView.swift.

import React from 'react';
import { View, ScrollView, StyleSheet, useWindowDimensions, Pressable, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS } from 'react-native-reanimated';
import { serif, grotesk, eyebrow, useTheme, Palette } from '../theme';
import { Text, ProfilePhoto, TagPill } from '../components/ui';
import { useStore, sharedInterests } from '../store';

export function ProfileDetail({ memberId }: { memberId: string }) {
  const C = useTheme();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const s = useStore();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const member = s.knownMembers[memberId];
  const photos = s.memberPhotos[memberId] ?? [];
  const matched = !!s.matchIDs[memberId];

  const close = () => s.closeSheet();
  const pass = () => { s.passMember(memberId); close(); };
  const like = () => { if (s.likesRemaining === 0) return; s.likeMember(memberId); close(); };
  const confirmUnmatch = () => {
    Alert.alert(
      'Unmatch?',
      `Are you sure you want to unmatch with ${member?.name ?? 'this person'}? This removes your conversation.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Unmatch', style: 'destructive', onPress: () => { s.unmatch(memberId); close(); } },
      ],
    );
  };

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
            </View>

            {/* Details — all photos interleaved with every detail, like Today */}
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

              {member.prompts[0] && (
                <Block title={member.prompts[0].q}>
                  <Text style={[serif(25), { color: C.ink90, lineHeight: 30 }]}>“{member.prompts[0].a}”</Text>
                </Block>
              )}
              {photos[1] && <ProfilePhoto uri={photos[1]} seed={member.portrait} style={styles.photoCard} />}
              {member.prompts[1] && (
                <Block title={member.prompts[1].q}>
                  <Text style={[serif(25), { color: C.ink90, lineHeight: 30 }]}>“{member.prompts[1].a}”</Text>
                </Block>
              )}
              {photos[2] && <ProfilePhoto uri={photos[2]} seed={member.portrait} style={styles.photoCard} />}
              {member.prompts[2] && (
                <Block title={member.prompts[2].q}>
                  <Text style={[serif(25), { color: C.ink90, lineHeight: 30 }]}>“{member.prompts[2].a}”</Text>
                </Block>
              )}
              {/* any remaining photos */}
              {photos.slice(3).map((uri, i) => (
                <ProfilePhoto key={`ph-${i}`} uri={uri} seed={member.portrait} style={styles.photoCard} />
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

          {/* Fixed back button — stays put while the content scrolls */}
          <Pressable onPress={close} hitSlop={8} style={[styles.closeBtn, { top: insets.top + 12 }]}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>

          {/* Action bar — Unmatch once matched, otherwise Pass + Say Hi */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
            {matched ? (
              <Pressable onPress={confirmUnmatch} style={({ pressed }) => [styles.unmatch, pressed && { opacity: 0.85 }]}>
                <Ionicons name="close" size={20} color={C.ink} />
                <Text style={[grotesk(14, 'semibold'), { color: C.ink, letterSpacing: 0.5 }]}>Unmatch</Text>
              </Pressable>
            ) : (
              <>
                <Pressable onPress={pass} style={({ pressed }) => [styles.passCircle, pressed && { opacity: 0.7 }]}>
                  <Ionicons name="close" size={26} color={C.ink70} />
                </Pressable>
                <Pressable
                  onPress={like}
                  disabled={disabled}
                  style={({ pressed }) => [styles.sayHi, { opacity: disabled ? 0.4 : pressed ? 0.9 : 1 }]}
                >
                  <Ionicons name="heart" size={18} color={C.accentInk} />
                  <Text style={[grotesk(15, 'semibold'), { color: C.accentInk, letterSpacing: 0.5 }]}>Say Hi</Text>
                </Pressable>
              </>
            )}
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
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: { paddingHorizontal: 26, paddingTop: 28 },
  photoCard: { width: '100%', aspectRatio: 3 / 4, borderRadius: 22, marginTop: 22, backgroundColor: C.photoEmpty },
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
  unmatch: {
    flex: 1, height: 62, borderRadius: 31,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.borderStrong,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
});
