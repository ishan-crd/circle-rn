// RoomSettings — manage a room. Owner can rename, invite, remove, and promote/
// demote admins; admins can invite matches and remove members; anyone can leave.

import React, { useState } from 'react';
import {
  View, ScrollView, StyleSheet, Pressable, ActionSheetIOS, Alert, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { grotesk, serif, eyebrow, useTheme, Palette } from '../theme';
import { Text, UnderlineField, ProfilePhoto } from '../components/ui';
import { useStore, myMatches } from '../store';
import { RoomMember } from '../types';

export function RoomSettings({ roomId }: { roomId: string }) {
  const C = useTheme();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const s = useStore();
  const insets = useSafeAreaInsets();
  const room = s.rooms[roomId];
  const [name, setName] = useState(room?.name ?? '');

  if (!room) return <View style={{ flex: 1, backgroundColor: C.paper }} />;

  const isOwner = room.myRole === 'owner';
  const canManage = room.myRole === 'owner' || room.myRole === 'admin';
  const members = room.members.filter((m) => m.status === 'joined');
  const invitable = myMatches(s).filter((m) => !room.members.some((rm) => rm.userId === m.id));

  const saveName = () => { const n = name.trim(); if (n && n !== room.name) s.renameRoom(roomId, n); };

  const manage = (m: RoomMember) => {
    if (!canManage || m.role === 'owner') return;
    const opts: { label: string; run: () => void; destructive?: boolean }[] = [];
    if (isOwner && m.role === 'member') opts.push({ label: 'Make admin', run: () => s.setRoomRole(roomId, m.userId, 'admin') });
    if (isOwner && m.role === 'admin') opts.push({ label: 'Remove admin', run: () => s.setRoomRole(roomId, m.userId, 'member') });
    const canRemove = isOwner || m.role === 'member';
    if (canRemove) opts.push({ label: `Remove ${m.name}`, run: () => s.removeRoomMember(roomId, m.userId), destructive: true });
    if (!opts.length) return;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: m.name,
          options: [...opts.map((o) => o.label), 'Cancel'],
          cancelButtonIndex: opts.length,
          destructiveButtonIndex: opts.findIndex((o) => o.destructive),
        },
        (i) => { if (i < opts.length) opts[i].run(); },
      );
    } else {
      Alert.alert(m.name, undefined, [
        ...opts.map((o) => ({ text: o.label, style: (o.destructive ? 'destructive' : 'default') as 'destructive' | 'default', onPress: o.run })),
        { text: 'Cancel', style: 'cancel' as const },
      ]);
    }
  };

  const confirmLeaveOrDelete = () => {
    if (isOwner) {
      Alert.alert('Delete room?', `This permanently deletes “${room.name}” and its messages for everyone.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Room', style: 'destructive', onPress: () => s.deleteRoom(roomId) },
      ]);
    } else {
      Alert.alert('Leave room?', `You'll stop receiving messages from “${room.name}”.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => s.leaveRoom(roomId) },
      ]);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <View style={[styles.navBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => useStore.setState({ activeSheet: { type: 'room', id: roomId } })} hitSlop={10} style={styles.back}>
          <Text style={{ fontFamily: 'System', fontSize: 26, color: C.ink, marginTop: -2 }}>‹</Text>
        </Pressable>
        <Text style={[grotesk(11), { letterSpacing: 2.2, textTransform: 'uppercase', color: C.ink }]}>Room Details</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[eyebrow(C.muted, 2.6), { marginBottom: 12 }]}>Name</Text>
        {isOwner ? (
          <UnderlineField placeholder="Room name" value={name} onChangeText={setName} onEndEditing={saveName} fontSize={26} autoCapitalize="sentences" />
        ) : (
          <Text style={serif(26)}>{room.name}</Text>
        )}

        <Text style={[eyebrow(C.muted, 2.6), { marginTop: 34, marginBottom: 6 }]}>
          {members.length} {members.length === 1 ? 'member' : 'members'}
        </Text>
        {members.map((m) => (
          <Pressable key={m.userId} onPress={() => manage(m)} disabled={!canManage || m.role === 'owner'} style={styles.row}>
            <ProfilePhoto uri={s.memberPhotos[m.userId]?.[0]} seed={{ lx: 50, ly: 30 }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={serif(20)}>{m.name}</Text>
            </View>
            {m.role !== 'member' && (
              <View style={styles.badge}>
                <Text style={[grotesk(10, 'semibold'), { color: C.accent, letterSpacing: 0.6, textTransform: 'uppercase' }]}>{m.role}</Text>
              </View>
            )}
            {canManage && m.role !== 'owner' && <Ionicons name="ellipsis-horizontal" size={18} color={C.faint} />}
          </Pressable>
        ))}

        {canManage && invitable.length > 0 && (
          <>
            <Text style={[eyebrow(C.muted, 2.6), { marginTop: 34, marginBottom: 6 }]}>Invite your matches</Text>
            {invitable.map((m) => (
              <View key={m.id} style={styles.row}>
                <ProfilePhoto uri={s.memberPhotos[m.id]?.[0]} seed={m.portrait} style={styles.avatar} />
                <View style={{ flex: 1 }}>
                  <Text style={serif(20)}>{m.name}</Text>
                  <Text style={[grotesk(12), { color: C.muted, marginTop: 1 }]}>{m.role} · {m.city}</Text>
                </View>
                <Pressable onPress={() => s.inviteToRoom(roomId, m.id)} hitSlop={8} style={styles.invite}>
                  <Ionicons name="add" size={18} color={C.accentInk} />
                </Pressable>
              </View>
            ))}
          </>
        )}

        <Pressable onPress={confirmLeaveOrDelete} style={styles.leave}>
          <Ionicons name={isOwner ? 'trash-outline' : 'exit-outline'} size={16} color={C.accent} />
          <Text style={[grotesk(14, 'semibold'), { color: C.accent }]}>{isOwner ? 'Delete room' : 'Leave room'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const makeStyles = (C: Palette) => StyleSheet.create({
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingBottom: 12,
    backgroundColor: C.paper, borderBottomWidth: 1, borderBottomColor: C.hairline,
  },
  back: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 26, paddingTop: 24, paddingBottom: 60 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.hairline },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.photoEmpty },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: C.accentSoft },
  invite: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  leave: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 44, paddingVertical: 14 },
});
