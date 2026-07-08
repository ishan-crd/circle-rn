// RoomChat — a group conversation. Header opens room settings; only members
// can send. Mirrors the 1:1 Chat but with sender names on incoming messages.

import React, { useRef, useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { grotesk, serif, useTheme, Palette } from '../theme';
import { Text, Pressed, TextInput } from '../components/ui';
import { useStore } from '../store';
import { useKeyboardVisible } from '../lib/useKeyboard';
import { RoomChatMessage } from '../types';

export function RoomChat({ roomId }: { roomId: string }) {
  const C = useTheme();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const s = useStore();
  const insets = useSafeAreaInsets();
  const keyboardUp = useKeyboardVisible();
  const room = s.rooms[roomId];
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  if (!room) return <View style={{ flex: 1, backgroundColor: C.paper }} />;

  const joined = room.members.filter((m) => m.status === 'joined').length;
  const send = () => { const t = draft; setDraft(''); s.sendRoom(roomId, t); };
  const openSettings = () => useStore.setState({ activeSheet: { type: 'roomSettings', id: roomId } });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.paper }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.navBar, { paddingTop: insets.top + 8 }]}>
        <Pressed scale={0.9} onPress={() => s.closeSheet()} style={styles.backBtn}>
          <Text style={{ fontFamily: 'System', fontSize: 26, color: C.ink, marginTop: -2 }}>‹</Text>
        </Pressed>
        <Pressed scale={0.98} onPress={openSettings} style={styles.headerTap}>
          <View style={styles.roomAvatar}>
            <Ionicons name="people" size={18} color={C.accentInk} />
          </View>
          <View style={{ gap: 2 }}>
            <Text numberOfLines={1} style={serif(21)}>{room.name}</Text>
            <Text style={styles.sub}>{joined} {joined === 1 ? 'member' : 'members'}</Text>
          </View>
        </Pressed>
        <Pressed scale={0.9} onPress={openSettings} style={styles.gear}>
          <Ionicons name="ellipsis-horizontal" size={20} color={C.muted} />
        </Pressed>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        <Text style={styles.caption}>{room.name.toUpperCase()}</Text>
        {room.messages.length === 0 && (
          <Text style={[grotesk(14), { color: C.muted, textAlign: 'center', marginTop: 8 }]}>
            Say hello to start the conversation.
          </Text>
        )}
        {room.messages.map((msg, i) => (
          <Bubble key={msg.id} msg={msg} showName={!msg.fromMe && room.messages[i - 1]?.senderId !== msg.senderId} />
        ))}
      </ScrollView>

      <View style={[styles.composer, { paddingBottom: keyboardUp ? 8 : insets.bottom + 12 }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Message the room…"
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

function Bubble({ msg, showName }: { msg: RoomChatMessage; showName: boolean }) {
  const C = useTheme();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  return (
    <View style={{ alignItems: msg.fromMe ? 'flex-end' : 'flex-start' }}>
      {showName && <Text style={styles.senderName}>{msg.senderName}</Text>}
      <View
        style={[
          styles.bubble,
          msg.fromMe
            ? { backgroundColor: C.accent, borderBottomRightRadius: 7 }
            : { backgroundColor: C.bubbleThem, borderBottomLeftRadius: 7 },
        ]}
      >
        <Text style={[grotesk(15), { color: msg.fromMe ? C.accentInk : C.ink90, lineHeight: 21 }]}>{msg.text}</Text>
      </View>
    </View>
  );
}

const makeStyles = (C: Palette) => StyleSheet.create({
  navBar: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    paddingHorizontal: 18, paddingBottom: 12,
    backgroundColor: C.paper, borderBottomWidth: 1, borderBottomColor: C.hairline,
  },
  backBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  headerTap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 13 },
  roomAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  sub: { ...grotesk(10), letterSpacing: 1.2, textTransform: 'uppercase', color: C.muted },
  gear: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  messages: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 8, gap: 8 },
  caption: { ...grotesk(10.5), letterSpacing: 2, textTransform: 'uppercase', color: C.faint, textAlign: 'center', marginBottom: 12 },
  senderName: { ...grotesk(11, 'medium'), color: C.muted, marginBottom: 3, marginLeft: 6 },
  bubble: { maxWidth: '78%', paddingHorizontal: 16, paddingVertical: 11, borderRadius: 22 },
  composer: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: C.paper, borderTopWidth: 1, borderTopColor: C.hairline,
  },
  input: {
    flex: 1, ...grotesk(15), color: C.ink,
    paddingHorizontal: 18, paddingVertical: 13,
    backgroundColor: C.surface, borderRadius: 999, borderWidth: 1, borderColor: C.border,
  },
  sendBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
});
