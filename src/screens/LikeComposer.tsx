// Greeting composer on like — a bottom sheet (insyd-bottom-sheet) that slides
// up when you like someone. Mirrors LikeComposer.swift.

import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SmoothSheet } from 'insyd-bottom-sheet';
import { serif, grotesk, useTheme, Palette } from '../theme';
import { Text, PillButton, ProfilePhoto } from '../components/ui';
import { useStore } from '../store';

export function LikeComposer() {
  const C = useTheme();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const pendingLike = useStore((s) => s.pendingLike);
  const confirmLike = useStore((s) => s.confirmLike);
  const cancelLike = useStore((s) => s.cancelLike);

  // Keep the last member while the sheet animates open/closed.
  const [member, setMember] = useState(pendingLike);
  useEffect(() => {
    if (pendingLike) setMember(pendingLike);
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
      minHeightFraction={0.2}
      bottomInset={insets.bottom + 12}
    >
      {member ? (
        <View style={styles.body}>
          <View style={styles.header}>
            <ProfilePhoto uri={photo} seed={member.portrait} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={serif(24)}>Say hi to {member.name}</Text>
              <Text style={[grotesk(12.5), { color: C.muted, marginTop: 3 }]}>
                If you both like each other, you’ll match and can start talking.
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 20 }}>
            <PillButton title="Send Like" onPress={() => confirmLike('')} />
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
});
