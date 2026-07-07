// Greeting composer on like — a bottom sheet (insyd-bottom-sheet) that slides
// up when you like someone. Mirrors LikeComposer.swift.

import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SmoothSheet } from 'insyd-bottom-sheet';
import { serif, grotesk, useTheme, Palette } from '../theme';
import { Text, PillButton, ProfilePhoto, TextInput } from '../components/ui';
import { useStore } from '../store';

export function LikeComposer() {
  const C = useTheme();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const pendingLike = useStore((s) => s.pendingLike);
  const confirmLike = useStore((s) => s.confirmLike);
  const cancelLike = useStore((s) => s.cancelLike);

  // Keep the last member + a fresh note while the sheet animates open/closed.
  const [member, setMember] = useState(pendingLike);
  const [note, setNote] = useState('');
  useEffect(() => {
    if (pendingLike) { setMember(pendingLike); setNote(''); }
  }, [pendingLike]);

  const photo = useStore((s) => (member ? s.memberPhotos[member.id]?.[0] : undefined));

  return (
    <SmoothSheet
      isVisible={!!pendingLike}
      onDismiss={cancelLike}
      backgroundColor={C.paper}
      handleColor={C.border}
      backdropColor="rgba(0,0,0,0.32)"
      borderRadius={30}
      minHeightFraction={0.42}
      bottomInset={insets.bottom + 16}
    >
      {member ? (
        <View style={styles.body}>
          <View style={styles.header}>
            <ProfilePhoto uri={photo} seed={member.portrait} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={serif(24)}>Say hi to {member.name}</Text>
              <Text style={[grotesk(12.5), { color: C.muted, marginTop: 3 }]}>
                Add a note — they’ll see it when you match.
              </Text>
            </View>
          </View>

          <TextInput
            placeholder="Write something warm… (optional)"
            placeholderTextColor={C.faint}
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
        </View>
      ) : null}
    </SmoothSheet>
  );
}

const makeStyles = (C: Palette) => StyleSheet.create({
  body: { paddingHorizontal: 24, paddingTop: 4 },
  header: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  avatar: { width: 52, height: 60, borderRadius: 12 },
  input: {
    marginTop: 18, padding: 14, minHeight: 54, backgroundColor: C.surface,
    borderRadius: 16, borderWidth: 1, borderColor: C.border,
    ...serif(18), color: C.ink,
  },
});
