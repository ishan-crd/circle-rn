// Chat — a one-to-one conversation with a composer.
// Mirrors coterie-ios/Circle/Views/Sheets/ChatView.swift.

import React, { useRef, useState } from 'react';
import {
  View, ScrollView, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { grotesk, serif, useTheme, Palette } from '../theme';
import { Text, Pressed, ProfilePhoto, TextInput } from '../components/ui';
import { useStore } from '../store';
import { useKeyboardVisible } from '../lib/useKeyboard';
import { ChatMessage } from '../types';

export function Chat({ memberId }: { memberId: string }) {
  const C = useTheme();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const s = useStore();
  const insets = useSafeAreaInsets();
  const keyboardUp = useKeyboardVisible();
  const member = s.knownMembers[memberId];
  const convo = s.conversations[memberId];
  const messages = convo?.messages ?? [];

  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const send = () => {
    const text = draft;
    setDraft('');
    s.send(text, memberId);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.paper }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Nav bar */}
      <View style={[styles.navBar, { paddingTop: insets.top + 8 }]}>
        <Pressed scale={0.9} onPress={() => s.closeSheet()} style={styles.backBtn}>
          <Text style={{ fontFamily: 'System', fontSize: 26, color: C.ink, marginTop: -2 }}>‹</Text>
        </Pressed>
        {member && (
          <>
            <ProfilePhoto
              uri={s.memberPhotos[memberId]?.[0]}
              seed={member.portrait}
              style={styles.avatar}
            />
            <View style={{ gap: 2 }}>
              <Text style={serif(21)}>{member.name}</Text>
              <Text style={styles.role}>
                {member.role} · {member.city}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        <Text style={styles.friendsCaption}>YOU'RE FRIENDS ON CIRCLE</Text>
        {messages.map((msg) => (
          <Bubble key={msg.id} msg={msg} />
        ))}
      </ScrollView>

      {/* Composer */}
      <View style={[styles.composer, { paddingBottom: keyboardUp ? 8 : insets.bottom + 12 }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Write something considered…"
          placeholderTextColor={C.faint}
          style={styles.input}
          returnKeyType="send"
          onSubmitEditing={send}
        />
        <Pressed scale={0.9} onPress={send} style={styles.sendBtn}>
          <Text style={{ fontSize: 20, color: C.accentInk, fontWeight: '600', marginTop: -2 }}>↑</Text>
        </Pressed>
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ msg }: { msg: ChatMessage }) {
  const C = useTheme();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  return (
    <View style={[styles.bubbleRow, { justifyContent: msg.fromMe ? 'flex-end' : 'flex-start' }]}>
      <View
        style={[
          styles.bubble,
          msg.fromMe
            ? { backgroundColor: C.accent, borderBottomRightRadius: 7 }
            : { backgroundColor: C.bubbleThem, borderBottomLeftRadius: 7 },
        ]}
      >
        <Text style={[grotesk(15), { color: msg.fromMe ? C.accentInk : C.ink90, lineHeight: 21 }]}>
          {msg.text}
        </Text>
      </View>
    </View>
  );
}

const makeStyles = (C: Palette) => StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: 18,
    paddingBottom: 12,
    backgroundColor: C.paper,
    borderBottomWidth: 1,
    borderBottomColor: C.hairline,
  },
  backBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.photoEmpty },
  role: {
    ...grotesk(10),
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: C.muted,
  },
  messages: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 10,
  },
  friendsCaption: {
    ...grotesk(10.5),
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: C.faint,
    textAlign: 'center',
    marginBottom: 12,
  },
  bubbleRow: { flexDirection: 'row' },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 22,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: C.paper,
    borderTopWidth: 1,
    borderTopColor: C.hairline,
  },
  input: {
    flex: 1,
    ...grotesk(15),
    color: C.ink,
    paddingHorizontal: 18,
    paddingVertical: 13,
    backgroundColor: C.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
