// Own profile + settings — mirrors ProfileView.swift.

import React from 'react';
import { View, StyleSheet, ScrollView, Pressable, Switch, Alert, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { serif, grotesk, eyebrow, useTheme, useAppearance, type Palette } from '../theme';
import { Text, LogoMark, ProfilePhoto, PillButton, TagPill, Pressed } from '../components/ui';
import { useStore, promptQuestion } from '../store';
import { ageFrom, Appearance } from '../types';
import { CIRCLE_LEGAL_URL } from '../data';

const APPEARANCE_OPTIONS: { label: string; value: Appearance }[] = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

export function Profile() {
  const C = useTheme();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const s = useStore();
  const [busy, setBusy] = React.useState<'logout' | 'delete' | null>(null);
  const p = s.profile;
  const age = ageFrom(p);
  const meta = [p.work, p.city, p.pronouns].filter(Boolean).join(' · ') || 'Add your details';
  const firstPhoto = p.photos.find((x) => x) ?? undefined;

  return (
    <ScrollView showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 22, paddingTop: insets.top + 8, paddingBottom: 130 }}>
      {/* header */}
      <View style={styles.header}>
        <Text style={eyebrow(C.muted, 2.6)}>Your Profile</Text>
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
          <Text style={eyebrow(C.muted, 2.6)}>About</Text>
          <Text style={[serif(21), { color: C.ink90, marginTop: 10, lineHeight: 28 }]}>{p.bio}</Text>
        </View>
      )}

      {p.prompts.filter((r) => r.answer.trim()).map((r) => (
        <View key={r.id} style={styles.promptSection}>
          <Text style={eyebrow(C.muted, 2.6)}>{promptQuestion(s, r.promptId)}</Text>
          <Text style={[serif(24), { color: C.ink90, marginTop: 8, marginBottom: 18, lineHeight: 30 }]}>“{r.answer}”</Text>
        </View>
      ))}

      {p.interests.length > 0 && (
        <View style={{ marginTop: 24 }}>
          <Text style={eyebrow(C.muted, 2.6)}>Interests</Text>
          <View style={styles.wrap}>{p.interests.map((t) => <TagPill key={t} text={t} />)}</View>
        </View>
      )}

      {/* appearance */}
      <Text style={[eyebrow(C.muted, 2.6), { marginTop: 34 }]}>Appearance</Text>
      <ThemeSegment />

      {/* preferences */}
      <Text style={[eyebrow(C.muted, 2.6), { marginTop: 30 }]}>Preferences</Text>
      <ToggleRow title="New introductions" subtitle="A daily notification at 8am"
        value={s.notifications} onChange={s.setNotifications} />
      <ToggleRow title="Pause introductions" subtitle="Quietly step away for a while"
        value={s.paused} onChange={(v) => useStore.setState({ paused: v })} />

      {/* account */}
      <Text style={[eyebrow(C.muted, 2.6), { marginTop: 30 }]}>Account</Text>
      <View style={styles.accountRow}>
        <Text style={[grotesk(15), { color: C.ink80 }]}>Membership</Text>
        <Text style={[grotesk(13), { color: C.muted }]}>Member since 2026</Text>
      </View>

      <View style={{ marginTop: 30 }}>
        <PillButton title="Log Out" style="outline" loading={busy === 'logout'} enabled={busy === null}
          onPress={async () => { setBusy('logout'); await s.logout(); }} />
      </View>

      <Pressable
        disabled={busy !== null}
        style={{ paddingVertical: 12, marginTop: 8, alignItems: 'center', minHeight: 40, justifyContent: 'center' }}
        onPress={() =>
          Alert.alert(
            'Delete your account?',
            'This permanently clears your profile, photos, prompts and interests. You can sign back in anytime to start over.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete Account', style: 'destructive', onPress: async () => { setBusy('delete'); await s.deleteAccount(); } },
            ],
          )
        }>
        {busy === 'delete' ? (
          <ActivityIndicator size="small" color={C.accent} />
        ) : (
          <Text style={[grotesk(13, 'medium'), { color: C.accent }]}>Delete Account</Text>
        )}
      </Pressable>

      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 26 }}>
        <Pressable onPress={() => WebBrowser.openBrowserAsync(CIRCLE_LEGAL_URL)} hitSlop={8}>
          <Text style={[grotesk(12), { color: C.muted }]}>Privacy Policy</Text>
        </Pressable>
        <Text style={[grotesk(12), { color: C.faint }]}>·</Text>
        <Pressable onPress={() => WebBrowser.openBrowserAsync(CIRCLE_LEGAL_URL)} hitSlop={8}>
          <Text style={[grotesk(12), { color: C.muted }]}>Terms of Use</Text>
        </Pressable>
      </View>

      <Text style={[grotesk(11), { color: C.fainter, letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center', marginTop: 16 }]}>
        Circle · Find your people
      </Text>
    </ScrollView>
  );
}

// System / Light / Dark segmented control — mirrors ProfileView.swift segmentRow.
function ThemeSegment() {
  const C = useTheme();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const { appearance, setAppearance } = useAppearance();
  return (
    <View style={styles.segmentRow}>
      <Text style={[grotesk(14.5), { color: C.ink80 }]}>Theme</Text>
      <View style={styles.segment}>
        {APPEARANCE_OPTIONS.map((o) => {
          const on = appearance === o.value;
          return (
            <Pressed key={o.value} scale={0.96} onPress={() => setAppearance(o.value)}
              style={[styles.segmentItem, on && { backgroundColor: C.ink }]}>
              <Text style={[grotesk(11.5), { color: on ? C.paper : C.body }]}>{o.label}</Text>
            </Pressed>
          );
        })}
      </View>
    </View>
  );
}

function ToggleRow({ title, subtitle, value, onChange }: {
  title: string; subtitle: string; value: boolean; onChange: (v: boolean) => void;
}) {
  const C = useTheme();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={[grotesk(15), { color: C.ink80 }]}>{title}</Text>
        <Text style={[grotesk(12.5), { color: C.muted, marginTop: 3 }]}>{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: C.ink }} />
    </View>
  );
}

const makeStyles = (C: Palette) => StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingTop: 18, paddingBottom: 12 },
  card: { width: '100%', height: 330, borderRadius: 28, overflow: 'hidden', justifyContent: 'flex-end' },
  promptSection: { marginTop: 30, borderBottomWidth: 1, borderBottomColor: C.hairline },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 14 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  accountRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 18, marginTop: 6,
    borderBottomWidth: 1, borderBottomColor: C.hairlineSoft,
  },
  segmentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  segment: { flexDirection: 'row', gap: 3, padding: 4, borderRadius: 999, backgroundColor: C.fill },
  segmentItem: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999 },
});
