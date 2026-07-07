// Explore — mirrors TodayView.swift. One person at a time as a scrolling
// profile; pass swipes the card away, like opens the greeting composer.

import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { CT, serif, grotesk, eyebrow } from '../theme';
import { Text, LogoMark, ProfilePhoto, TagPill, ChoiceChip, PillButton } from '../components/ui';
import { useStore, exploreCandidates, sharedInterests, myTopics } from '../store';
import { Member } from '../types';

export function Today() {
  const insets = useSafeAreaInsets();
  const state = useStore();
  const candidates = exploreCandidates(state);
  const candidate = candidates[0];

  const tx = useSharedValue(0);
  const rot = useSharedValue(0);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { rotateZ: `${rot.value}deg` }],
  }));

  function doPass(id: string) {
    tx.value = withTiming(-640, { duration: 320 });
    rot.value = withTiming(-15, { duration: 320 }, (done) => {
      if (done) {
        runOnJS(state.passMember)(id);
        tx.value = 0; rot.value = 0;
      }
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: CT.paper, paddingTop: insets.top }}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topRow}>
          <LogoMark height={20} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="heart" size={11} color={CT.accent} />
            <Text style={[grotesk(10.5, 'medium'), { color: CT.muted, letterSpacing: 1.4, textTransform: 'uppercase' }]}>
              {state.likesRemaining === 1 ? '1 like left' : `${state.likesRemaining} likes left`}
            </Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <ChoiceChip label="Everyone" selected={state.exploreTopics.length === 0} fontSize={13} hPad={16} vPad={9}
            onPress={state.clearTopics} />
          {myTopics(state).map((topic) => (
            <ChoiceChip key={topic} label={topic} selected={state.exploreTopics.includes(topic)}
              fontSize={13} hPad={16} vPad={9} onPress={() => state.toggleTopic(topic)} />
          ))}
        </ScrollView>
      </View>

      {candidate ? (
        <View style={{ flex: 1 }}>
          <Animated.View style={[{ flex: 1 }, cardStyle]}>
            <ProfileScroll member={candidate} shared={sharedInterests(state, candidate)} />
          </Animated.View>

          <View style={[styles.actions, { paddingBottom: 96 }]}>
            <Pressable onPress={() => doPass(candidate.id)} style={[styles.circle, styles.circleOutline]}>
              <Ionicons name="close" size={24} color={CT.ink70} />
            </Pressable>
            <Pressable
              onPress={() => state.beginLike(candidate.id)}
              disabled={state.likesRemaining === 0}
              style={[styles.circle, styles.circleFilled, state.likesRemaining === 0 && { opacity: 0.4 }]}>
              <Ionicons name="heart" size={23} color={CT.accentInk} />
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.empty}>
          <Text style={[serif(30), { textAlign: 'center' }]}>
            {state.feedLoading ? 'Finding your people…' : state.exploreTopics.length ? 'No one new in these topics.' : 'You’re all caught up.'}
          </Text>
          <Text style={[grotesk(14.5), { color: CT.bodyLight, textAlign: 'center', marginTop: 14, maxWidth: 270, lineHeight: 22 }]}>
            {state.exploreTopics.length ? 'Try removing a topic, or come back later as more people join.'
              : 'You’ve seen everyone for now. New people join all the time — check back soon.'}
          </Text>
          {state.passedIDs.length > 0 && (
            <View style={{ marginTop: 28, width: 200 }}>
              <PillButton title="Start Over" style="outline" onPress={state.resetDeck} />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function ProfileScroll({ member, shared }: { member: Member; shared: string[] }) {
  const photos = useStore((s) => s.memberPhotos[member.id]) ?? [];
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 130 }}>
      <View style={{ gap: 6, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
          <Text style={serif(40)}>{member.name}</Text>
          <Text style={[serif(28), { color: CT.body }]}>{member.age}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#34C759' }} />
          <Text style={[grotesk(11), { color: CT.muted, letterSpacing: 1.6, textTransform: 'uppercase' }]}>Active today</Text>
        </View>
      </View>

      <Photo uri={photos[0]} member={member} />

      {shared.length > 0 && (
        <Card>
          <Eye>You both like</Eye>
          <View style={styles.wrap}>{shared.map((s) => <TagPill key={s} text={s} />)}</View>
        </Card>
      )}

      {member.prompts[0] && <Prompt q={member.prompts[0].q} a={member.prompts[0].a} />}
      {photos[1] && <Photo uri={photos[1]} member={member} />}
      {member.bio ? (
        <Card>
          <Eye>About</Eye>
          <Text style={[serif(21), { color: CT.ink90, marginTop: 8, lineHeight: 28 }]}>{member.bio}</Text>
        </Card>
      ) : null}
      {member.prompts[1] && <Prompt q={member.prompts[1].q} a={member.prompts[1].a} />}
      {photos[2] && <Photo uri={photos[2]} member={member} />}
      {member.prompts[2] && <Prompt q={member.prompts[2].q} a={member.prompts[2].a} />}

      {member.interests.length > 0 && (
        <Card>
          <Eye>Into</Eye>
          <View style={styles.wrap}>{member.interests.map((s) => <TagPill key={s} text={s} />)}</View>
        </Card>
      )}
    </ScrollView>
  );
}

function Photo({ uri, member }: { uri?: string; member: Member }) {
  return <ProfilePhoto uri={uri} seed={member.portrait} style={styles.photo} />;
}
function Card({ children }: { children: React.ReactNode }) { return <View style={styles.card}>{children}</View>; }
function Eye({ children }: { children: React.ReactNode }) { return <Text style={eyebrow(CT.muted, 2.4)}>{children}</Text>; }
function Prompt({ q, a }: { q: string; a: string }) {
  return (
    <Card>
      <Eye>{q}</Eye>
      <Text style={[serif(26), { color: CT.ink90, marginTop: 8, lineHeight: 32 }]}>“{a}”</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingTop: 6, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: CT.hairlineSoft },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22 },
  chips: { paddingHorizontal: 22, paddingVertical: 8, gap: 9, flexDirection: 'row' },
  photo: { width: '100%', aspectRatio: 3 / 4, borderRadius: 22, marginTop: 16 },
  card: {
    width: '100%', marginTop: 16, padding: 22, backgroundColor: CT.surface,
    borderRadius: 22, borderWidth: 1, borderColor: CT.border, gap: 0,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  actions: {
    position: 'absolute', left: 30, right: 30, bottom: 0, flexDirection: 'row', justifyContent: 'space-between',
  },
  circle: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center' },
  circleOutline: { backgroundColor: 'rgba(255,255,255,0.9)', borderWidth: 1, borderColor: CT.border },
  circleFilled: { backgroundColor: CT.accent },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
});
