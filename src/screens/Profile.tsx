// Own profile + settings — mirrors ProfileView.swift.

import React from 'react';
import { View, StyleSheet, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CT, serif, grotesk, eyebrow } from '../theme';
import { Text, LogoMark, ProfilePhoto, PillButton, TagPill } from '../components/ui';
import { useStore, promptQuestion } from '../store';
import { ageFrom } from '../types';
import { seedFor } from '../data';

export function Profile() {
  const insets = useSafeAreaInsets();
  const s = useStore();
  const p = s.profile;
  const age = ageFrom(p);
  const meta = [p.work, p.city, p.pronouns].filter(Boolean).join(' · ') || 'Add your details';
  const firstPhoto = p.photos.find((x) => x) ?? undefined;

  return (
    <ScrollView showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 22, paddingTop: insets.top + 8, paddingBottom: 130 }}>
      {/* header */}
      <View style={styles.header}>
        <Text style={eyebrow(CT.muted, 2.6)}>Your Profile</Text>
        <LogoMark height={19} />
      </View>

      {/* portrait card */}
      <View style={styles.card}>
        <ProfilePhoto uri={firstPhoto} seed={{ lx: 50, ly: 16 }} style={StyleSheet.absoluteFill as any} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.64)']} style={StyleSheet.absoluteFill} />
        <View style={{ padding: 24 }}>
          <Text style={[serif(40), { color: '#fff' }]}>{(p.name || 'Your profile') + (age != null ? `, ${age}` : '')}</Text>
          <Text style={[grotesk(10.5), { color: 'rgba(255,255,255,0.82)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 8 }]}>
            {meta}
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 16 }}>
        <PillButton title="Edit Profile" style="outline" onPress={() => useStore.setState({ activeSheet: { type: 'edit' } })} />
      </View>

      {!!p.bio && (
        <View style={{ marginTop: 30 }}>
          <Text style={eyebrow(CT.muted, 2.6)}>About</Text>
          <Text style={[serif(21), { color: CT.ink90, marginTop: 10, lineHeight: 28 }]}>{p.bio}</Text>
        </View>
      )}

      {p.prompts.filter((r) => r.answer.trim()).map((r) => (
        <View key={r.id} style={styles.promptSection}>
          <Text style={eyebrow(CT.muted, 2.6)}>{promptQuestion(s, r.promptId)}</Text>
          <Text style={[serif(24), { color: CT.ink90, marginTop: 8, marginBottom: 18, lineHeight: 30 }]}>“{r.answer}”</Text>
        </View>
      ))}

      {p.interests.length > 0 && (
        <View style={{ marginTop: 24 }}>
          <Text style={eyebrow(CT.muted, 2.6)}>Interests</Text>
          <View style={styles.wrap}>{p.interests.map((t) => <TagPill key={t} text={t} />)}</View>
        </View>
      )}

      {/* preferences */}
      <Text style={[eyebrow(CT.muted, 2.6), { marginTop: 34 }]}>Preferences</Text>
      <ToggleRow title="New introductions" subtitle="A daily notification at 8am"
        value={s.notifications} onChange={s.setNotifications} />
      <ToggleRow title="Pause introductions" subtitle="Quietly step away for a while"
        value={s.paused} onChange={(v) => useStore.setState({ paused: v })} />

      {/* account */}
      <Text style={[eyebrow(CT.muted, 2.6), { marginTop: 30 }]}>Account</Text>
      <View style={styles.accountRow}>
        <Text style={[grotesk(15), { color: CT.ink80 }]}>Membership</Text>
        <Text style={[grotesk(13), { color: CT.muted }]}>Member since 2026</Text>
      </View>

      <View style={{ marginTop: 30 }}>
        <PillButton title="Log Out" style="outline" onPress={s.logout} />
      </View>

      <Pressable
        style={{ paddingVertical: 12, marginTop: 8, alignItems: 'center' }}
        onPress={() =>
          Alert.alert(
            'Delete your account?',
            'This permanently clears your profile, photos, prompts and interests. You can sign back in anytime to start over.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete Account', style: 'destructive', onPress: s.deleteAccount },
            ],
          )
        }>
        <Text style={[grotesk(13, 'medium'), { color: CT.accent }]}>Delete Account</Text>
      </Pressable>

      <Text style={[grotesk(11), { color: CT.fainter, letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center', marginTop: 22 }]}>
        Circle · Find your people
      </Text>
    </ScrollView>
  );
}

function ToggleRow({ title, subtitle, value, onChange }: {
  title: string; subtitle: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={[grotesk(15), { color: CT.ink80 }]}>{title}</Text>
        <Text style={[grotesk(12.5), { color: CT.muted, marginTop: 3 }]}>{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: CT.ink }} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingTop: 18, paddingBottom: 12 },
  card: { width: '100%', height: 330, borderRadius: 28, overflow: 'hidden', justifyContent: 'flex-end' },
  promptSection: { marginTop: 30, borderBottomWidth: 1, borderBottomColor: CT.hairline },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 14 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  accountRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 18, marginTop: 6,
    borderBottomWidth: 1, borderBottomColor: CT.hairlineSoft,
  },
});
