// Onboarding — 1:1 port of coterie-ios/Circle/Views/Onboarding/OnboardingView.swift.
// A ten-step introduction builder. Progress, validation and persistence live in
// the store (useStore); this file is purely presentation.

import React, { useEffect, useRef, useState } from 'react';
import {
  View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardVisible } from '../lib/useKeyboard';
import { serif, serifItalic, grotesk, useTheme, type Palette } from '../theme';
import {
  Text, Eyebrow, PillButton, UnderlineField, ChoiceChip, ProfilePhoto, Pressed, TextInput,
} from '../components/ui';
import { PhotoGrid } from '../components/PhotoGrid';
import { LocationPicker } from '../components/LocationPicker';
import { useStore, ONBOARDING_STEPS, interestLabels, OnboardingStep } from '../store';
import { PRONOUNS, seedFor } from '../data';
import { ageFrom, birthdayIssue, MAX_PROMPTS } from '../types';

const ME_SEED = seedFor('me');

// ---- Shared step heading ---------------------------------------------------

function StepHeading({ title, subtitle, topPad = 18 }: {
  title: string; subtitle?: string; topPad?: number;
}) {
  const C = useTheme();
  return (
    <View style={{ paddingTop: topPad }}>
      <Text style={[serif(34), { lineHeight: 38 }]}>{title}</Text>
      {subtitle ? (
        <Text style={[grotesk(14.5), { color: C.bodyLight, lineHeight: 21, marginTop: 12 }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

// ---- Steps -----------------------------------------------------------------

function WelcomeStep() {
  const C = useTheme();
  return (
    <View style={{ paddingTop: 30 }}>
      <Eyebrow tracking={3.0} style={{ marginBottom: 22 }}>Invitation Accepted</Eyebrow>
      <Text style={[serif(46), { lineHeight: 50 }]}>Welcome to Circle.</Text>
      <Text style={[grotesk(15.5), { color: C.body, lineHeight: 26, marginTop: 20, maxWidth: 300 }]}>
        You’ve been introduced by someone we trust. The next few moments shape how
        you’ll appear to others — there are no wrong answers, only honest ones.
      </Text>
      <Text style={[serifItalic(20), { color: C.muted, marginTop: 30 }]}>
        It takes about two minutes.
      </Text>
    </View>
  );
}

function NameStep() {
  const name = useStore((s) => s.profile.name);
  const patch = useStore((s) => s.patchProfile);
  return (
    <View>
      <StepHeading title="What should we call you?"
        subtitle="Your first name is how members will know you." />
      <View style={{ marginTop: 34 }}>
        <UnderlineField placeholder="First name" value={name}
          onChangeText={(t) => patch({ name: t })} fontSize={30} autoCapitalize="words" />
      </View>
    </View>
  );
}

function clampDigits(raw: string, maxDigits: number, maxValue?: number): string {
  let d = raw.replace(/[^0-9]/g, '').slice(0, maxDigits);
  if (maxValue != null && d.length > 0) {
    const n = parseInt(d, 10);
    if (n > maxValue) d = String(maxValue);
  }
  return d;
}

function DobField({ label, placeholder, value, onChangeText, wide }: {
  label: string; placeholder: string; value: string;
  onChangeText: (t: string) => void; wide?: boolean;
}) {
  return (
    <View style={{ flex: 1, minWidth: wide ? 96 : 64, gap: 10 }}>
      <Eyebrow tracking={2.0}>{label}</Eyebrow>
      <UnderlineField placeholder={placeholder} value={value}
        onChangeText={onChangeText} fontSize={28} keyboardType="number-pad" />
    </View>
  );
}

function BirthdayStep() {
  const profile = useStore((s) => s.profile);
  const patch = useStore((s) => s.patchProfile);
  const issue = birthdayIssue(profile);
  const age = ageFrom(profile);
  const C = useTheme();
  return (
    <View>
      <StepHeading title="When’s your birthday?"
        subtitle="We show your age, never your date of birth." />
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 16, marginTop: 36 }}>
        <DobField label="Day" placeholder="DD" value={profile.dobD}
          onChangeText={(t) => patch({ dobD: clampDigits(t, 2, 31) })} />
        <DobField label="Month" placeholder="MM" value={profile.dobM}
          onChangeText={(t) => patch({ dobM: clampDigits(t, 2, 12) })} />
        <DobField label="Year" placeholder="YYYY" value={profile.dobY}
          onChangeText={(t) => patch({ dobY: clampDigits(t, 4) })} wide />
      </View>
      <View style={{ marginTop: 24, height: 22, justifyContent: 'center' }}>
        {issue ? (
          <Text style={[grotesk(14, 'medium'), { color: C.accent }]}>⚠  {issue}</Text>
        ) : age != null ? (
          <Text style={[serifItalic(17), { color: C.muted }]}>You’ll appear as {age}</Text>
        ) : (
          <Text style={[serifItalic(17), { color: C.muted }]}> </Text>
        )}
      </View>
    </View>
  );
}

function PhotosStep() {
  const C = useTheme();
  const filled = useStore((s) => s.profile.photos.filter((x) => x != null).length);
  const hint = filled >= 2 ? `${filled} added`
    : filled === 0 ? 'Tap a frame to add a photo' : 'Add at least one more';
  return (
    <View>
      <StepHeading title="Show your world."
        subtitle="Add at least two. The best photographs say something true — not just a good angle." />
      <View style={{ marginTop: 28 }}>
        <PhotoGrid />
      </View>
      <Text style={[grotesk(12), { color: C.muted, textAlign: 'center', marginTop: 16 }]}>{hint}</Text>
    </View>
  );
}

function ChipGroup({ label, options, selected, onSelect }: {
  label: string; options: string[]; selected: string; onSelect: (v: string) => void;
}) {
  const C = useTheme();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  return (
    <View style={{ gap: 14 }}>
      <Eyebrow tracking={2.2}>{label}</Eyebrow>
      <View style={styles.flow}>
        {options.map((o) => (
          <ChoiceChip key={o} label={o} selected={selected === o} onPress={() => onSelect(o)} />
        ))}
      </View>
    </View>
  );
}

function AboutStep() {
  const C = useTheme();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const profile = useStore((s) => s.profile);
  const patch = useStore((s) => s.patchProfile);
  return (
    <View style={{ gap: 30 }}>
      <StepHeading title="Tell us who you are." />
      <ChipGroup label="I am" options={PRONOUNS} selected={profile.pronouns}
        onSelect={(v) => patch({ pronouns: v })} />
      <View style={{ gap: 14 }}>
        <Eyebrow tracking={2.2}>A little about you</Eyebrow>
        <TextInput
          placeholder="Your answer…"
          placeholderTextColor={C.faint}
          value={profile.bio}
          onChangeText={(t) => patch({ bio: t })}
          multiline
          style={[grotesk(15), styles.bioField, { color: C.ink90 }]}
        />
      </View>
    </View>
  );
}

function CityStep() {
  const city = useStore((s) => s.profile.city);
  const patch = useStore((s) => s.patchProfile);
  return (
    <View>
      <StepHeading title="Where are you based?"
        subtitle="Search, detect, or drag the map — we’ll set your city." />
      <View style={{ marginTop: 22 }}>
        <LocationPicker value={city} onChange={(t) => patch({ city: t })} />
      </View>
    </View>
  );
}

function WorkStep() {
  const work = useStore((s) => s.profile.work);
  const patch = useStore((s) => s.patchProfile);
  return (
    <View>
      <StepHeading title="What do you do?"
        subtitle="However you’d describe it — a title, a craft, a calling." />
      <View style={{ marginTop: 32 }}>
        <UnderlineField placeholder="e.g. Architect, Writer, Founder" value={work}
          onChangeText={(t) => patch({ work: t })} fontSize={28} autoCapitalize="sentences" />
      </View>
    </View>
  );
}

function PromptStep() {
  const C = useTheme();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const profile = useStore((s) => s.profile);
  const promptOptions = useStore((s) => s.promptOptions);
  const setPrompt = useStore((s) => s.setPrompt);
  const patch = useStore((s) => s.patchProfile);
  const [picking, setPicking] = useState(false);

  const questionFor = (id: string) => promptOptions.find(([pid]) => pid === id)?.[1] ?? '';
  const usedIds = profile.prompts.map((r) => r.promptId);
  const available = promptOptions.filter(([id]) => !usedIds.includes(id));

  function addPrompt(promptId: string) {
    setPrompt(profile.prompts.length, promptId, '');
    setPicking(false);
  }
  function removePrompt(index: number) {
    patch({ prompts: profile.prompts.filter((_, i) => i !== index) });
  }

  return (
    <View>
      <StepHeading title="Answer a few prompts."
        subtitle="Choose up to three. Members fall for the way people answer these." />
      <View style={{ marginTop: 26, gap: 16 }}>
        {profile.prompts.map((resp, i) => (
          <View key={i} style={styles.promptCard}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Eyebrow color={C.accent} tracking={2.0} style={{ flex: 1 }}>
                {questionFor(resp.promptId)}
              </Eyebrow>
              <Pressed scale={0.9} onPress={() => removePrompt(i)} style={styles.promptRemove}>
                <Text style={{ color: C.muted, fontSize: 11, fontWeight: '700' }}>✕</Text>
              </Pressed>
            </View>
            <TextInput
              placeholder="Your answer…"
              placeholderTextColor={C.faint}
              value={resp.answer}
              onChangeText={(t) => setPrompt(i, resp.promptId, t)}
              multiline
              style={[grotesk(15), styles.answerField, { color: C.ink90 }]}
            />
          </View>
        ))}

        {profile.prompts.length < MAX_PROMPTS ? (
          picking ? (
            <View style={styles.picker}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Eyebrow tracking={2.2} style={{ flex: 1 }}>Pick a prompt</Eyebrow>
                <Pressed onPress={() => setPicking(false)}>
                  <Text style={[grotesk(12, 'medium'), { color: C.muted }]}>Cancel</Text>
                </Pressed>
              </View>
              {available.map(([id, q]) => (
                <Pressed key={id} scale={0.99} onPress={() => addPrompt(id)}
                  style={styles.pickerRow}>
                  <Text style={[serif(18), { color: C.ink }]}>{q}</Text>
                </Pressed>
              ))}
            </View>
          ) : (
            <Pressed scale={0.99} onPress={() => setPicking(true)} style={styles.addPrompt}>
              <Text style={[grotesk(13, 'medium'), { color: C.accent, letterSpacing: 0.4 }]}>
                +  {profile.prompts.length === 0 ? 'Choose a prompt' : 'Add another prompt'}
              </Text>
            </Pressed>
          )
        ) : null}
      </View>
    </View>
  );
}

function InterestsStep() {
  const C = useTheme();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const interests = useStore((s) => s.profile.interests);
  const toggle = useStore((s) => s.toggleInterest);
  const labels = interestLabels(useStore.getState());
  const count = interests.length;
  const hint = count >= 3 ? `${count} selected` : `Choose at least ${3 - count} more`;
  return (
    <View>
      <StepHeading title="What moves you?" subtitle="Choose at least three." />
      <View style={[styles.flow, { marginTop: 26 }]}>
        {labels.map((t) => (
          <ChoiceChip key={t} label={t} selected={interests.includes(t)}
            onPress={() => toggle(t)} fontSize={13} hPad={16} vPad={10} />
        ))}
      </View>
      <Text style={[grotesk(12), { color: C.muted, marginTop: 18 }]}>{hint}</Text>
    </View>
  );
}

function ReviewStep() {
  const C = useTheme();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const p = useStore((s) => s.profile);
  const age = ageFrom(p);
  const firstPhoto = p.photos.find((x) => x != null) ?? null;
  return (
    <View style={{ alignItems: 'center', paddingTop: 90 }}>
      <ProfilePhoto uri={firstPhoto} seed={ME_SEED} style={styles.reviewPhoto} />
      <Text style={[serif(40), { textAlign: 'center', marginTop: 26 }]}>
        {p.name}{age != null ? `, ${age}` : ''}
      </Text>
      <Eyebrow tracking={2.0} style={{ marginTop: 10 }}>
        {p.work}{p.city ? ` · ${p.city}` : ''}
      </Eyebrow>
      <Text style={[serifItalic(18), { color: C.body, marginTop: 18 }]}>
        {p.interests.slice(0, 3).join('   ·   ')}
      </Text>
      <View style={{ width: 34, height: 1, backgroundColor: C.border, marginVertical: 26 }} />
      <Text style={[grotesk(15), { color: C.body, textAlign: 'center', lineHeight: 24, maxWidth: 280 }]}>
        Your introduction is ready.
      </Text>
    </View>
  );
}

// ---- Root ------------------------------------------------------------------

const STEP_RENDER: Record<OnboardingStep, () => React.ReactElement> = {
  welcome: WelcomeStep,
  name: NameStep,
  birthday: BirthdayStep,
  photos: PhotosStep,
  about: AboutStep,
  city: CityStep,
  work: WorkStep,
  prompt: PromptStep,
  interests: InterestsStep,
  review: ReviewStep,
};

const SLIDE_MS = 420;

export function Onboarding() {
  const C = useTheme();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const keyboardUp = useKeyboardVisible();
  const stepIndex = useStore((s) => s.onboardingStep);
  const nextStep = useStore((s) => s.nextStep);
  const prevStep = useStore((s) => s.prevStep);
  const canAdvance = useStore((s) => s.canAdvance);
  // Subscribe to profile so canAdvance re-evaluates on every edit.
  useStore((s) => s.profile);

  const total = ONBOARDING_STEPS.length;
  const step = ONBOARDING_STEPS[stepIndex];
  const StepView = STEP_RENDER[step];
  const enabled = canAdvance(step);
  const buttonLabel = step === 'welcome' ? 'Begin' : step === 'review' ? 'Enter Circle' : 'Continue';
  const pad = (n: number) => String(n).padStart(2, '0');

  // Direction of the last navigation: forward = slide in from the right, back
  // from the left. Set just before the step changes. Stored in a ref so the
  // slide effect reads the latest value without re-subscribing.
  const dirRef = useRef(1);
  const goNext = () => { dirRef.current = 1; nextStep(); };
  const goPrev = () => { dirRef.current = -1; prevStep(); };

  // Content slide — driven manually (no Reanimated layout clones, which can
  // linger as invisible touch-blocking overlays on the New Architecture). Only
  // the current step is rendered; it slides + fades in on each change.
  const tx = useSharedValue(0);
  const op = useSharedValue(1);
  useEffect(() => {
    tx.value = dirRef.current * 90;
    op.value = 0;
    tx.value = withTiming(0, { duration: SLIDE_MS, easing: Easing.out(Easing.cubic) });
    op.value = withTiming(1, { duration: SLIDE_MS, easing: Easing.out(Easing.cubic) });
  }, [stepIndex]);
  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }], opacity: op.value,
  }));

  // Progress bar fills smoothly (not instantly) as the step changes.
  const trackW = useSharedValue(0);
  const frac = useSharedValue((stepIndex + 1) / total);
  useEffect(() => {
    frac.value = withTiming((stepIndex + 1) / total, {
      duration: SLIDE_MS, easing: Easing.out(Easing.cubic),
    });
  }, [stepIndex, total]);
  const fillStyle = useAnimatedStyle(() => ({ width: trackW.value * frac.value }));

  return (
    <KeyboardAvoidingView style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header: progress */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        {stepIndex > 0 ? (
          <Pressed scale={0.9} onPress={goPrev}>
            <Text style={{ fontSize: 20, color: C.ink }}>‹</Text>
          </Pressed>
        ) : null}
        <View style={styles.track} onLayout={(e) => { trackW.value = e.nativeEvent.layout.width; }}>
          <Animated.View style={[styles.fill, fillStyle]} />
        </View>
        <Text style={[grotesk(10), { color: C.muted, letterSpacing: 1.8 }]}>
          {pad(stepIndex + 1)} / {pad(total)}
        </Text>
      </View>

      <View style={{ flex: 1, overflow: 'hidden' }}>
        <ScrollView showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 26, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled">
          <Animated.View style={slideStyle}>
            <StepView />
          </Animated.View>
        </ScrollView>
      </View>

      {/* Footer: primary action */}
      <View style={[styles.footer, { paddingBottom: keyboardUp ? 8 : insets.bottom + 12 }]}>
        <PillButton title={buttonLabel} style="filled" enabled={enabled} onPress={goNext} />
      </View>
    </KeyboardAvoidingView>
  );
}

export default Onboarding;

const makeStyles = (C: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.paper },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 26, paddingBottom: 8,
  },
  track: { flex: 1, height: 2, borderRadius: 1, backgroundColor: C.fill, overflow: 'hidden' },
  fill: { height: 2, borderRadius: 1, backgroundColor: C.ink },
  footer: {
    paddingHorizontal: 26, paddingTop: 14, paddingBottom: 12,
    borderTopWidth: 1, borderTopColor: C.hairlineSoft,
  },
  flow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  bioField: {
    minHeight: 96, borderWidth: 1, borderColor: C.border, borderRadius: 16,
    padding: 14, textAlignVertical: 'top', backgroundColor: C.surface,
  },
  promptCard: {
    padding: 16, backgroundColor: C.surface, borderRadius: 18,
    borderWidth: 1, borderColor: C.border, gap: 10,
  },
  promptRemove: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: C.fill,
    alignItems: 'center', justifyContent: 'center',
  },
  answerField: {
    minHeight: 88, borderWidth: 1, borderColor: C.border, borderRadius: 16,
    padding: 12, textAlignVertical: 'top', backgroundColor: C.surface,
  },
  addPrompt: {
    paddingVertical: 16, alignItems: 'center', borderRadius: 16,
    backgroundColor: C.accentSoft, borderWidth: 1, borderColor: 'rgba(224,103,74,0.4)',
    borderStyle: 'dashed',
  },
  picker: {
    padding: 16, backgroundColor: C.paper, borderRadius: 18,
    borderWidth: 1, borderColor: C.hairline, gap: 9,
  },
  pickerRow: { paddingVertical: 6 },
  reviewPhoto: {
    width: 230, height: 294, borderRadius: 26, backgroundColor: '#E6E4E0',
    shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 28, shadowOffset: { width: 0, height: 22 },
  },
});
