// Messages — ongoing conversations, ordered by recency.
// Mirrors coterie-ios/Circle/Views/Main/MessagesView.swift.

import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CT, serif, grotesk } from '../theme';
import { Text, Eyebrow, Pressed, ProfilePhoto } from '../components/ui';
import { useStore, memberOf } from '../store';
import { Member, Conversation } from '../types';

export function Messages() {
  const s = useStore();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 96 }]}>
      <Eyebrow tracking={2.6} style={{ paddingTop: 18, paddingBottom: 4 }}>MESSAGES</Eyebrow>
      <Text style={[serif(33), { marginBottom: 22 }]}>Conversations</Text>

      {s.conversationOrder.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[grotesk(14), { color: CT.muted }]}>
            Match with someone to start talking.
          </Text>
        </View>
      ) : (
        s.conversationOrder.map((id) => {
          const convo = s.conversations[id];
          const member = memberOf(s, id);
          if (!convo || !member) return null;
          return (
            <ConversationRow
              key={id}
              member={member}
              convo={convo}
              uri={s.memberPhotos[id]?.[0]}
              onPress={() => s.openChat(id)}
            />
          );
        })
      )}
    </ScrollView>
  );
}

function ConversationRow({
  member, convo, uri, onPress,
}: { member: Member; convo: Conversation; uri?: string; onPress: () => void }) {
  return (
    <Pressed scale={0.99} onPress={onPress}>
      <View style={styles.row}>
        <ProfilePhoto uri={uri} seed={member.portrait} style={styles.photo} />

        <View style={styles.body}>
          <View style={styles.topRow}>
            <Text style={serif(22)}>{member.name}</Text>
            <Text style={[grotesk(11), { color: CT.faint }]}>{convo.time}</Text>
          </View>
          <Text style={[grotesk(11), styles.meta]}>
            {member.role} · {member.city}
          </Text>
          <View style={styles.previewRow}>
            <Text numberOfLines={1} style={[grotesk(13.5), { color: CT.body, flexShrink: 1 }]}>
              {convo.preview}
            </Text>
            {convo.unread ? <View style={styles.unread} /> : null}
          </View>
        </View>
      </View>
    </Pressed>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22 },
  empty: { alignItems: 'center', paddingTop: 80 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: CT.hairline,
  },
  photo: { width: 58, height: 58, borderRadius: 29, backgroundColor: CT.photoEmpty },
  body: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  meta: { color: CT.muted, paddingVertical: 3 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  unread: { width: 7, height: 7, borderRadius: 4, backgroundColor: CT.ink },
});
