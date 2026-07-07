// Onboarding — 1:1 port of coterie-ios/Circle/Views/Onboarding/OnboardingView.swift.
// A ten-step introduction builder. Progress, validation and persistence live in
// the store (useStore); this file is purely presentation.

import React, { useEffect, useState } from 'react';
import {
  View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
  SlideInRight, SlideOutLeft, SlideInLeft, SlideOutRight,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardVisible } from '../lib/useKeyboard';
import { CT, serif, serifItalic, grotesk } from '../theme';
import {
  Text, Eyebrow, PillButton, UnderlineField, ChoiceChip, ProfilePhoto, Pressed,
} from '../components/ui';
import { PhotoGrid } from '../components/PhotoGrid';
import { useStore, ONBOARDING_STEPS, interestLabels, OnboardingStep } from '../store';
import { PRONOUNS, SEEKING, seedFor } from '../data';
import { UserProfile, ageFrom, birthdayIssue, MAX_PROMPTS } from '../types';

const ME_SEED = seedFor('me');

// ---- Shared step heading ---------------------------------------------------

function StepHeading({ title, subtitle, topPad = 18 }: {
  title: string; subtitle?: string; topPad?: number;
}) {
  return (
    <View style={{ paddingTop: topPad }}>
      <Text style={[serif(34), { lineHeight: 38 }]}>{title}</Text>
      {subtitle ? (
        <Text style={[grotesk(14.5), { color: CT.bodyLight, lineHeight: 21, marginTop: 12 }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

// ---- Steps -----------------------------------------------------------------

function WelcomeStep() {
  return (
    <View style={{ paddingTop: 30 }}>
      <Eyebrow tracking={3.0} style={{ marginBottom: 22 }}>Invitation Accepted</Eyebrow>
      <Text style={[serif(46), { lineHeight: 50 }]}>Welcome to Circle.</Text>
      <Text style={[grotesk(15.5), { color: CT.body, lineHeight: 26, marginTop: 20, maxWidth: 300 }]}>
        You’ve been introduced by someone we trust. The next few moments shape how
        you’ll appear to others — there are no wrong answers, only honest ones.
      </Text>
      <Text style={[serifItalic(20), { color: CT.muted, marginTop: 30 }]}>
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
          <Text style={[grotesk(14, 'medium'), { color: CT.accent }]}>⚠  {issue}</Text>
        ) : age != null ? (
          <Text style={[serifItalic(17), { color: CT.muted }]}>You’ll appear as {age}</Text>
        ) : (
          <Text style={[serifItalic(17), { color: CT.muted }]}> </Text>
        )}
      </View>
    </View>
  );
}

function PhotosStep() {
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
      <Text style={[grotesk(12), { color: CT.muted, textAlign: 'center', marginTop: 16 }]}>{hint}</Text>
    </View>
  );
}

function ChipGroup({ label, options, selected, onSelect }: {
  label: string; options: string[]; selected: string; onSelect: (v: string) => void;
}) {
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
  const profile = useStore((s) => s.profile);
  const patch = useStore((s) => s.patchProfile);
  return (
    <View style={{ gap: 30 }}>
      <StepHeading title="Tell us who you are." />
      <ChipGroup label="I am" options={PRONOUNS} selected={profile.pronouns}
        onSelect={(v) => patch({ pronouns: v })} />
      <ChipGroup label="Interested in meeting" options={SEEKING} selected={profile.seeking}
        onSelect={(v) => patch({ seeking: v })} />
      <View style={{ gap: 14 }}>
        <Eyebrow tracking={2.2}>A little about you</Eyebrow>
        <TextInput
          placeholder="Your answer…"
          placeholderTextColor={CT.faint}
          value={profile.bio}
          onChangeText={(t) => patch({ bio: t })}
          multiline
          style={[grotesk(15), styles.bioField, { color: CT.ink90 }]}
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
        subtitle="Tell us the city you call home." />
      <View style={{ marginTop: 26 }}>
        <UnderlineField placeholder="e.g. San Francisco" value={city}
          onChangeText={(t) => patch({ city: t })} fontSize={28} autoCapitalize="words" />
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
              <Eyebrow color={CT.accent} tracking={2.0} style={{ flex: 1 }}>
                {questionFor(resp.promptId)}
              </Eyebrow>
              <Pressed scale={0.9} onPress={() => removePrompt(i)} style={styles.promptRemove}>
                <Text style={{ color: CT.muted, fontSize: 11, fontWeight: '700' }}>✕</Text>
              </Pressed>
            </View>
            <TextInput
              placeholder="Your answer…"
              placeholderTextColor={CT.faint}
              value={resp.answer}
              onChangeText={(t) => setPrompt(i, resp.promptId, t)}
              multiline
              style={[grotesk(15), styles.answerField, { color: CT.ink90 }]}
            />
          </View>
        ))}

        {profile.prompts.length < MAX_PROMPTS ? (
          picking ? (
            <View style={styles.picker}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Eyebrow tracking={2.2} style={{ flex: 1 }}>Pick a prompt</Eyebrow>
                <Pressed onPress={() => setPicking(false)}>
                  <Text style={[grotesk(12, 'medium'), { color: CT.muted }]}>Cancel</Text>
                </Pressed>
              </View>
              {available.map(([id, q]) => (
                <Pressed key={id} scale={0.99} onPress={() => addPrompt(id)}
                  style={styles.pickerRow}>
                  <Text style={[serif(18), { color: CT.ink }]}>{q}</Text>
                </Pressed>
              ))}
            </View>
          ) : (
            <Pressed scale={0.99} onPress={() => setPicking(true)} style={styles.addPrompt}>
              <Text style={[grotesk(13, 'medium'), { color: CT.accent, letterSpacing: 0.4 }]}>
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
      <Text style={[grotesk(12), { color: CT.muted, marginTop: 18 }]}>{hint}</Text>
    </View>
  );
}

function ReviewStep() {
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
      <Text style={[serifItalic(18), { color: CT.body, marginTop: 18 }]}>
        {p.interests.slice(0, 3).join('   ·   ')}
      </Text>
      <View style={{ width: 34, height: 1, backgroundColor: CT.border, marginVertical: 26 }} />
      <Text style={[grotesk(15), { color: CT.body, textAlign: 'center', lineHeight: 24, maxWidth: 280 }]}>
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

  // Direction of the last navigation: forward slides in from the right, back
  // from the left. Set just before the step changes so the entering/exiting
  // step uses the right direction.
  const [dir, setDir] = useState(1);
  const goNext = () => { setDir(1); nextStep(); };
  const goPrev = () => { setDir(-1); prevStep(); };

  // Progress bar fills smoothly (not instantly) as the step changes.
  const trackW = useSharedValue(0);
  const frac = useSharedValue((stepIndex + 1) / total);
  useEffect(() => {
    frac.value = withTiming((stepIndex + 1) / total, {
      duration: SLIDE_MS, easing: Easing.out(Easing.cubic),
    });
  }, [stepIndex, total]);
  const fillStyle = useAnimatedStyle(() => ({ width: trackW.value * frac.value }));

  const entering = (dir >= 0 ? SlideInRight : SlideInLeft).duration(SLIDE_MS).easing(Easing.out(Easing.cubic));
  const exiting = (dir >= 0 ? SlideOutLeft : SlideOutRight).duration(SLIDE_MS).easing(Easing.out(Easing.cubic));

  return (
    <KeyboardAvoidingView style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header: progress */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        {stepIndex > 0 ? (
          <Pressed scale={0.9} onPress={goPrev}>
            <Text style={{ fontSize: 20, color: CT.ink }}>‹</Text>
          </Pressed>
        ) : null}
        <View style={styles.track} onLayout={(e) => { trackW.value = e.nativeEvent.layout.width; }}>
          <Animated.View style={[styles.fill, fillStyle]} />
        </View>
        <Text style={[grotesk(10), { color: CT.muted, letterSpacing: 1.8 }]}>
          {pad(stepIndex + 1)} / {pad(total)}
        </Text>
      </View>

      <View style={{ flex: 1, overflow: 'hidden' }}>
        <ScrollView showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 26, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled">
          <Animated.View key={stepIndex} entering={entering} exiting={exiting}>
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CT.paper },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 26, paddingBottom: 8,
  },
  track: { flex: 1, height: 2, borderRadius: 1, backgroundColor: CT.fill, overflow: 'hidden' },
  fill: { height: 2, borderRadius: 1, backgroundColor: CT.ink },
  footer: {
    paddingHorizontal: 26, paddingTop: 14, paddingBottom: 12,
    borderTopWidth: 1, borderTopColor: CT.hairlineSoft,
  },
  flow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  bioField: {
    minHeight: 96, borderWidth: 1, borderColor: CT.border, borderRadius: 16,
    padding: 14, textAlignVertical: 'top', backgroundColor: CT.surface,
  },
  promptCard: {
    padding: 16, backgroundColor: CT.surface, borderRadius: 18,
    borderWidth: 1, borderColor: CT.border, gap: 10,
  },
  promptRemove: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: CT.fill,
    alignItems: 'center', justifyContent: 'center',
  },
  answerField: {
    minHeight: 88, borderWidth: 1, borderColor: CT.border, borderRadius: 16,
    padding: 12, textAlignVertical: 'top', backgroundColor: CT.surface,
  },
  addPrompt: {
    paddingVertical: 16, alignItems: 'center', borderRadius: 16,
    backgroundColor: CT.accentSoft, borderWidth: 1, borderColor: 'rgba(224,103,74,0.4)',
    borderStyle: 'dashed',
  },
  picker: {
    padding: 16, backgroundColor: CT.paper, borderRadius: 18,
    borderWidth: 1, borderColor: CT.hairline, gap: 9,
  },
  pickerRow: { paddingVertical: 6 },
  reviewPhoto: {
    width: 230, height: 294, borderRadius: 26, backgroundColor: '#E6E4E0',
    shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 28, shadowOffset: { width: 0, height: 22 },
  },
});
