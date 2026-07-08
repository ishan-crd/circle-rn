// Rooms — group chats. See invitations, your rooms, and create a new one.
// Replaces the old Gallery tab.

import React from 'react';
import { ScrollView, View, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { grotesk, serif, useTheme, Palette } from '../theme';
import { Text, Eyebrow, Pressed, PillButton } from '../components/ui';
import { useStore } from '../store';
import { Room } from '../types';

export function Rooms() {
  const C = useTheme();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const rooms = useStore((s) => s.rooms);
  const order = useStore((s) => s.roomOrder);

  const all = order.map((id) => rooms[id]).filter(Boolean) as Room[];
  const invites = all.filter((r) => r.myStatus === 'invited');
  const joined = all.filter((r) => r.myStatus === 'joined');

  return (
    <ScrollView showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 96 }]}>
      <View style={styles.head}>
        <View>
          <Eyebrow tracking={2.6} style={{ paddingBottom: 4 }}>ROOMS</Eyebrow>
          <Text style={serif(33)}>Group chats</Text>
        </View>
        <Pressed scale={0.94} onPress={() => useStore.setState({ activeSheet: { type: 'createRoom' } })} style={styles.newBtn}>
          <Ionicons name="add" size={22} color={C.accentInk} />
        </Pressed>
      </View>
      <Text style={[grotesk(14), styles.subtitle]}>
        Bring your matches together. Create a room and invite the people you&apos;ve matched with.
      </Text>

      {invites.length > 0 && (
        <View style={{ marginTop: 8 }}>
          <Eyebrow tracking={2.2} color={C.accent} style={{ marginBottom: 12 }}>INVITATIONS</Eyebrow>
          {invites.map((r) => <InviteRow key={r.id} room={r} />)}
        </View>
      )}

      {joined.length === 0 && invites.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[serif(26), { textAlign: 'center' }]}>No rooms yet.</Text>
          <Text style={[grotesk(14), { color: C.bodyLight, textAlign: 'center', marginTop: 12, maxWidth: 260, lineHeight: 21 }]}>
            Start one and invite your matches to hang out together.
          </Text>
          <View style={{ marginTop: 24, width: 200 }}>
            <PillButton title="Create a room" onPress={() => useStore.setState({ activeSheet: { type: 'createRoom' } })} />
          </View>
        </View>
      ) : (
        joined.map((r) => <RoomRow key={r.id} room={r} />)
      )}
    </ScrollView>
  );
}

function RoomRow({ room }: { room: Room }) {
  const C = useTheme();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const openRoom = useStore((s) => s.openRoom);
  const joined = room.members.filter((m) => m.status === 'joined').length;
  return (
    <Pressed scale={0.99} onPress={() => openRoom(room.id)}>
      <View style={styles.row}>
        <View style={styles.icon}><Ionicons name="people" size={22} color={C.accentInk} /></View>
        <View style={{ flex: 1 }}>
          <View style={styles.rowTop}>
            <Text numberOfLines={1} style={[serif(22), { flex: 1 }]}>{room.name}</Text>
            {room.time ? <Text style={[grotesk(11), { color: C.faint }]}>{room.time}</Text> : null}
          </View>
          <Text numberOfLines={1} style={[grotesk(13), { color: room.unread ? C.ink : C.muted, marginTop: 2 }]}>
            {room.lastText || `${joined} ${joined === 1 ? 'member' : 'members'}`}
          </Text>
        </View>
        {room.unread ? <View style={styles.unread} /> : null}
      </View>
    </Pressed>
  );
}

function InviteRow({ room }: { room: Room }) {
  const C = useTheme();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const respond = useStore((s) => s.respondRoomInvite);
  return (
    <View style={styles.invite}>
      <View style={styles.icon}><Ionicons name="people" size={22} color={C.accentInk} /></View>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={serif(21)}>{room.name}</Text>
        <Text style={[grotesk(12.5), { color: C.muted, marginTop: 2 }]}>
          {room.invitedByName ? `${room.invitedByName} invited you` : 'You were invited'}
        </Text>
      </View>
      <Pressable onPress={() => respond(room.id, false)} hitSlop={6} style={styles.decline}>
        <Ionicons name="close" size={18} color={C.muted} />
      </Pressable>
      <Pressable onPress={() => respond(room.id, true)} hitSlop={6} style={styles.accept}>
        <Ionicons name="checkmark" size={18} color={C.accentInk} />
      </Pressable>
    </View>
  );
}

const makeStyles = (C: Palette) => StyleSheet.create({
  content: { paddingHorizontal: 22 },
  head: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 12 },
  newBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  subtitle: { color: C.bodyLight, maxWidth: 300, marginTop: 8, marginBottom: 26, lineHeight: 20 },
  empty: { alignItems: 'center', paddingTop: 60 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: C.hairline,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  icon: { width: 52, height: 52, borderRadius: 16, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  unread: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent },
  invite: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14,
    marginBottom: 12, backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border,
  },
  decline: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: C.fill },
  accept: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: C.accent },
});
