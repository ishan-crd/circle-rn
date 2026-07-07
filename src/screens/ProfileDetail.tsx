// ProfileDetail — a full member profile with pass / say-hi actions.
// Mirrors coterie-ios/Circle/Views/Sheets/ProfileDetailView.swift.

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CT, serif, grotesk, eyebrow } from '../theme';
import { Text, Pressed, ProfilePhoto, TagPill } from '../components/ui';
import { useStore, sharedInterests } from '../store';

export function ProfileDetail({ memberId }: { memberId: string }) {
  const s = useStore();
  const insets = useSafeAreaInsets();
  const member = s.knownMembers[memberId];
  if (!member) return <View style={{ flex: 1, backgroundColor: CT.paper }} />;

  const shared = sharedInterests(s, member);
  const disabled = s.likesRemaining === 0;

  const pass = () => { s.passMember(memberId); s.closeSheet(); };
  const like = () => { if (disabled) return; s.likeMember(memberId); s.closeSheet(); };

  return (
    <View style={{ flex: 1, backgroundColor: CT.paper }}>
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
            onPress={() => s.closeSheet()}
            style={[styles.closeBtn, { top: insets.top + 12 }]}
          >
            <Text style={{ fontSize: 18, color: '#fff', fontWeight: '600' }}>✕</Text>
          </Pressed>
        </View>

        {/* Details */}
        <View style={styles.details}>
          {!!member.bio && (
            <Text style={[serif(23), { color: CT.ink80, lineHeight: 30 }]}>{member.bio}</Text>
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
              <Text style={[serif(25), { color: CT.ink90, lineHeight: 30 }]}>“{pr.a}”</Text>
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
        <Pressed scale={0.96} onPress={pass} style={[styles.action, styles.actionOutline]}>
          <Text style={[styles.actionLabel, { color: CT.ink }]}>PASS</Text>
        </Pressed>
        <Pressed
          scale={0.96}
          onPress={like}
          disabled={disabled}
          style={[styles.action, styles.actionFilled, { flex: 1, opacity: disabled ? 0.4 : 1 }]}
        >
          <Text style={[styles.actionLabel, { color: CT.accentInk }]}>SAY HI</Text>
        </Pressed>
      </View>
    </View>
  );
}

function Block({ title, children, first }: { title: string; children: React.ReactNode; first?: boolean }) {
  return (
    <View style={[styles.block, first && { borderTopWidth: 0, marginTop: 0, paddingTop: 0 }]}>
      <Text style={[eyebrow(CT.muted, 2.6), { marginBottom: 12 }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { height: 486, width: '100%', backgroundColor: CT.photoEmpty, justifyContent: 'flex-end' },
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
    borderTopColor: CT.hairline,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 14,
    backgroundColor: CT.paper,
    borderTopWidth: 1,
    borderTopColor: CT.hairline,
  },
  action: {
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionOutline: { paddingHorizontal: 34, borderWidth: 1, borderColor: CT.borderStrong, backgroundColor: CT.paper },
  actionFilled: { backgroundColor: CT.accent },
  actionLabel: { ...grotesk(12), letterSpacing: 2, textTransform: 'uppercase' },
});
