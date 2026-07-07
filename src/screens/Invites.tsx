// Invites — members who liked you. Like back to connect.
// Mirrors coterie-ios/Circle/Views/Main/InvitesView.swift.

import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CT, serif, serifItalic, grotesk } from '../theme';
import { Text, Eyebrow, Pressed, ProfilePhoto } from '../components/ui';
import { useStore, memberOf } from '../store';
import { Member, Invitation } from '../types';

export function Invites() {
  const s = useStore();

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <Eyebrow tracking={2.6} style={{ paddingTop: 18, paddingBottom: 4 }}>INVITATIONS</Eyebrow>
      <Text style={serif(33)}>They liked you</Text>
      <Text style={[grotesk(14), styles.subtitle]}>
        People who'd like to be your friend. Like them back to connect.
      </Text>

      {s.invitations.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[grotesk(14), { color: CT.muted }]}>
            No new likes yet — they'll appear here.
          </Text>
        </View>
      ) : (
        s.invitations.map((invite) => {
          const member = memberOf(s, invite.id);
          if (!member) return null;
          return (
            <InviteRow
              key={invite.id}
              member={member}
              invite={invite}
              uri={s.memberPhotos[member.id]?.[0]}
              onPress={() => s.openProfile(member.id)}
            />
          );
        })
      )}
    </ScrollView>
  );
}

function InviteRow({
  member, invite, uri, onPress,
}: { member: Member; invite: Invitation; uri?: string; onPress: () => void }) {
  return (
    <Pressed scale={0.99} onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.photo}>
          <ProfilePhoto uri={uri} seed={member.portrait} style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)']}
            locations={[0.55, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>

        <View style={styles.body}>
          <View style={styles.topRow}>
            <View style={styles.nameRow}>
              <Text style={serif(25)}>{member.name}</Text>
              <Text style={[serif(16), { color: CT.muted }]}>{member.age}</Text>
            </View>
            {invite.time ? <Text style={[grotesk(11), { color: CT.faint }]}>{invite.time}</Text> : null}
          </View>
          <Text style={[grotesk(10), styles.meta]}>
            {member.role} · {member.city}
          </Text>
          <Text style={[serifItalic(17), { color: CT.ink70, lineHeight: 22 }]}>
            “{invite.note}”
          </Text>
        </View>
      </View>
    </Pressed>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingBottom: 110, paddingTop: 8 },
  subtitle: { color: CT.bodyLight, maxWidth: 282, marginTop: 4, marginBottom: 26, lineHeight: 20 },
  empty: { alignItems: 'center', paddingTop: 70 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    paddingBottom: 22,
    marginBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: CT.hairline,
  },
  photo: { width: 92, height: 118, borderRadius: 18, overflow: 'hidden', backgroundColor: CT.photoEmpty },
  body: { flex: 1, paddingTop: 4 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  nameRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  meta: {
    color: CT.muted,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginTop: 5,
    marginBottom: 10,
  },
});
