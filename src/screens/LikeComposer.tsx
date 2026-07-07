// Greeting composer on like — mirrors LikeComposer.swift.

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { useKeyboardVisible } from '../lib/useKeyboard';
import { CT, serif, grotesk } from '../theme';
import { Text, PillButton, ProfilePhoto } from '../components/ui';
import { useStore } from '../store';
import { Member } from '../types';

export function LikeComposer({ member }: { member: Member }) {
  const insets = useSafeAreaInsets();
  const keyboardUp = useKeyboardVisible();
  const photo = useStore((s) => s.memberPhotos[member.id]?.[0]);
  const confirmLike = useStore((s) => s.confirmLike);
  const cancelLike = useStore((s) => s.cancelLike);
  const [note, setNote] = useState('');

  const t = useSharedValue(0);
  useEffect(() => { t.value = withSpring(1, { damping: 16 }); }, []);
  const scrim = useAnimatedStyle(() => ({ opacity: 0.32 * t.value }));
  const sheet = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - t.value) * 420 }] }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }, scrim]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={cancelLike} />
      </Animated.View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.bottom}>
        <Animated.View style={[styles.card, { paddingBottom: keyboardUp ? 14 : insets.bottom + 20 }, sheet]}>
          <View style={styles.grabber} />
          <View style={styles.header}>
            <ProfilePhoto uri={photo} seed={member.portrait} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={serif(24)}>Say hi to {member.name}</Text>
              <Text style={[grotesk(12.5), { color: CT.muted, marginTop: 3 }]}>
                Add a note — they’ll see it when you match.
              </Text>
            </View>
          </View>

          <TextInput
            placeholder="Write something warm… (optional)"
            placeholderTextColor={CT.faint}
            value={note}
            onChangeText={setNote}
            multiline
            style={styles.input}
          />

          <View style={{ marginTop: 16 }}>
            <PillButton
              title={note.trim() ? 'Send Like & Note' : 'Send Like'}
              onPress={() => confirmLike(note)}
            />
          </View>
          <Pressable onPress={cancelLike} style={{ paddingVertical: 12, alignItems: 'center', marginTop: 2 }}>
            <Text style={[grotesk(14, 'medium'), { color: CT.muted }]}>Cancel</Text>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  bottom: { flex: 1, justifyContent: 'flex-end' },
  card: {
    backgroundColor: CT.paper, borderTopLeftRadius: 30, borderTopRightRadius: 30,
    paddingHorizontal: 24, paddingBottom: 32, paddingTop: 10,
    borderWidth: 1, borderColor: CT.hairline,
  },
  grabber: { width: 38, height: 4, borderRadius: 2, backgroundColor: CT.border, alignSelf: 'center' },
  header: { flexDirection: 'row', gap: 14, alignItems: 'center', marginTop: 20 },
  avatar: { width: 52, height: 60, borderRadius: 12 },
  input: {
    marginTop: 18, padding: 14, minHeight: 54, backgroundColor: CT.surface,
    borderRadius: 16, borderWidth: 1, borderColor: CT.border,
    ...serif(18), color: CT.ink,
  },
});
