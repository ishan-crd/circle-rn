// EditProfile — edit the signed-in member's profile.
// Mirrors coterie-ios/Circle/Views/Sheets/EditProfileView.swift.

import React, { useState } from 'react';
import { View, ScrollView, TextInput, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { CT, serif, grotesk, eyebrow } from '../theme';
import { Text, Pressed, ProfilePhoto, ChoiceChip, UnderlineField } from '../components/ui';
import { useStore, interestLabels } from '../store';
import { PRONOUNS, SEEKING, seedFor } from '../data';
import { MAX_PROMPTS } from '../types';

export function EditProfile() {
  const s = useStore();
  const insets = useSafeAreaInsets();
  const p = s.profile;

  const done = () => { s.saveProfileEdits(); };

  return (
    <View style={{ flex: 1, backgroundColor: CT.paper }}>
      {/* Nav bar */}
      <View style={[styles.navBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => s.closeSheet()} hitSlop={10}>
          <Text style={[grotesk(14), { color: CT.muted }]}>Cancel</Text>
        </Pressable>
        <Text style={[grotesk(11), { letterSpacing: 2.2, textTransform: 'uppercase', color: CT.ink }]}>
          Edit Profile
        </Text>
        <Pressable onPress={done} hitSlop={10}>
          <Text style={[grotesk(14, 'semibold'), { color: CT.ink }]}>Done</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Label>Photos</Label>
        <PhotoGrid />

        <Label top={30}>Name</Label>
        <UnderlineField placeholder="First name" value={p.name} onChangeText={(t) => s.patchProfile({ name: t })} fontSize={26} autoCapitalize="words" />

        <Label top={28}>Birthday</Label>
        <View style={styles.dobRow}>
          <View style={{ flex: 1 }}>
            <UnderlineField placeholder="DD" value={p.dobD} onChangeText={(t) => s.patchProfile({ dobD: digits(t, 2) })} fontSize={24} keyboardType="number-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <UnderlineField placeholder="MM" value={p.dobM} onChangeText={(t) => s.patchProfile({ dobM: digits(t, 2) })} fontSize={24} keyboardType="number-pad" />
          </View>
          <View style={{ flex: 1.4 }}>
            <UnderlineField placeholder="YYYY" value={p.dobY} onChangeText={(t) => s.patchProfile({ dobY: digits(t, 4) })} fontSize={24} keyboardType="number-pad" />
          </View>
        </View>

        <Label top={28}>I am</Label>
        <View style={styles.chips}>
          {PRONOUNS.map((o) => (
            <ChoiceChip key={o} label={o} selected={p.pronouns === o} onPress={() => s.patchProfile({ pronouns: o })} />
          ))}
        </View>

        <Label top={24}>Interested in meeting</Label>
        <View style={styles.chips}>
          {SEEKING.map((o) => (
            <ChoiceChip key={o} label={o} selected={p.seeking === o} onPress={() => s.patchProfile({ seeking: o })} />
          ))}
        </View>

        <Label top={28}>City</Label>
        <UnderlineField placeholder="Your city" value={p.city} onChangeText={(t) => s.patchProfile({ city: t })} fontSize={24} autoCapitalize="words" />

        <Label top={28}>Work</Label>
        <UnderlineField placeholder="e.g. Architect, Writer, Founder" value={p.work} onChangeText={(t) => s.patchProfile({ work: t })} fontSize={24} autoCapitalize="sentences" />

        <Label top={28}>About</Label>
        <TextInput
          placeholder="A few considered lines about you…"
          placeholderTextColor={CT.faint}
          value={p.bio}
          onChangeText={(t) => s.patchProfile({ bio: t })}
          multiline
          style={styles.bio}
        />

        <Label top={28}>Your prompts</Label>
        <PromptComposer />

        <Label top={28}>Interests</Label>
        <View style={styles.chips}>
          {interestLabels(s).map((t) => (
            <ChoiceChip
              key={t}
              label={t}
              selected={p.interests.includes(t)}
              onPress={() => s.toggleInterest(t)}
              fontSize={13}
              hPad={16}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ---- Photo grid ------------------------------------------------------------

function PhotoGrid() {
  const s = useStore();
  const photos = s.profile.photos;

  const pick = async (index: number) => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
    });
    if (!res.canceled && res.assets[0]) {
      const next = [...photos];
      next[index] = res.assets[0].uri;
      s.patchProfile({ photos: next });
    }
  };

  const clear = (index: number) => {
    const next = [...photos];
    next[index] = null;
    s.patchProfile({ photos: next });
  };

  return (
    <View style={styles.grid}>
      {Array.from({ length: 6 }).map((_, i) => {
        const uri = photos[i];
        return (
          <Pressed key={i} scale={0.97} onPress={() => pick(i)} style={styles.slot}>
            {uri ? (
              <>
                <ProfilePhoto uri={uri} seed={seedFor(String(i))} style={StyleSheet.absoluteFill} />
                <Pressable onPress={() => clear(i)} hitSlop={8} style={styles.slotRemove}>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>✕</Text>
                </Pressable>
              </>
            ) : (
              <View style={styles.slotEmpty}>
                <Text style={{ fontSize: 26, color: CT.faint }}>＋</Text>
              </View>
            )}
          </Pressed>
        );
      })}
    </View>
  );
}

// ---- Prompt composer -------------------------------------------------------

function PromptComposer() {
  const s = useStore();
  const responses = s.profile.prompts;

  return (
    <View style={{ gap: 18 }}>
      {Array.from({ length: MAX_PROMPTS }).map((_, i) => (
        <PromptSlot key={i} index={i} response={responses[i]} />
      ))}
    </View>
  );
}

function PromptSlot({ index, response }: { index: number; response?: { promptId: string; answer: string } }) {
  const s = useStore();
  const [open, setOpen] = useState(false);
  const usedIds = s.profile.prompts.map((r) => r?.promptId).filter(Boolean);
  const question = s.promptOptions.find(([id]) => id === response?.promptId)?.[1];

  const available = s.promptOptions.filter(([id]) => id === response?.promptId || !usedIds.includes(id));

  return (
    <View style={styles.promptCard}>
      <Pressable onPress={() => setOpen((v) => !v)}>
        <Text style={[grotesk(13, 'medium'), { color: question ? CT.ink70 : CT.muted }]}>
          {question ?? 'Choose a prompt'}
        </Text>
      </Pressable>

      {open && (
        <View style={[styles.chips, { marginTop: 12 }]}>
          {available.map(([id, q]) => (
            <ChoiceChip
              key={id}
              label={q}
              selected={id === response?.promptId}
              onPress={() => { s.setPrompt(index, id, response?.answer ?? ''); setOpen(false); }}
              fontSize={12}
              hPad={14}
              vPad={8}
            />
          ))}
        </View>
      )}

      {!!response?.promptId && (
        <TextInput
          placeholder="Your answer…"
          placeholderTextColor={CT.faint}
          value={response.answer}
          onChangeText={(t) => s.setPrompt(index, response.promptId, t)}
          multiline
          style={styles.promptAnswer}
        />
      )}
    </View>
  );
}

// ---- helpers ---------------------------------------------------------------

function digits(t: string, max: number): string {
  return t.replace(/[^0-9]/g, '').slice(0, max);
}

function Label({ children, top }: { children: React.ReactNode; top?: number }) {
  return <Text style={[eyebrow(CT.muted, 2.6), { marginTop: top ?? 0, marginBottom: 12 }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingBottom: 14,
    backgroundColor: CT.paper,
    borderBottomWidth: 1,
    borderBottomColor: CT.hairline,
  },
  content: { paddingHorizontal: 26, paddingTop: 24, paddingBottom: 80 },
  dobRow: { flexDirection: 'row', gap: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  bio: {
    ...serif(22),
    color: CT.ink,
    minHeight: 90,
    textAlignVertical: 'top',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: CT.border,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slot: {
    width: '31.5%',
    aspectRatio: 3 / 4,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: CT.photoEmpty,
  },
  slotEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: CT.border, borderRadius: 14 },
  slotRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptCard: {
    borderWidth: 1,
    borderColor: CT.hairline,
    borderRadius: 16,
    padding: 16,
    backgroundColor: CT.surface,
  },
  promptAnswer: {
    ...serif(20),
    color: CT.ink90,
    marginTop: 10,
    minHeight: 44,
    textAlignVertical: 'top',
  },
});
