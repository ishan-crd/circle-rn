// The signed-in shell — mirrors MainTabView.swift. Custom frosted tab bar over
// the active screen.

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { grotesk, useTheme, useAppearance, Palette } from '../theme';
import { Text } from '../components/ui';
import { useStore } from '../store';
import { MainTab } from '../types';
import { Today } from './Today';
import { Rooms } from './Rooms';
import { Invites } from './Invites';
import { Messages } from './Messages';
import { Profile } from './Profile';

const TABS: { tab: MainTab; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { tab: 'today', icon: 'sparkles-outline', label: 'Today' },
  { tab: 'rooms', icon: 'people-outline', label: 'Rooms' },
  { tab: 'invites', icon: 'mail-outline', label: 'Invites' },
  { tab: 'messages', icon: 'chatbubble-outline', label: 'Messages' },
  { tab: 'profile', icon: 'person-outline', label: 'You' },
];

export function MainTabs() {
  const C = useTheme();
  const tab = useStore((s) => s.tab);

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <View style={{ flex: 1 }}>
        {tab === 'today' && <Today />}
        {tab === 'rooms' && <Rooms />}
        {tab === 'invites' && <Invites />}
        {tab === 'messages' && <Messages />}
        {tab === 'profile' && <Profile />}
      </View>
      <GlassTabBar />
    </View>
  );
}

function GlassTabBar() {
  const C = useTheme();
  const { scheme } = useAppearance();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const tab = useStore((s) => s.tab);
  const setTab = useStore.setState;
  const insets = useSafeAreaInsets();
  const invitesCount = useStore((s) => s.invitations.length);
  const roomInvites = useStore((s) => Object.values(s.rooms).filter((r) => r.myStatus === 'invited').length);

  // Translucent version of the paper surface so the frosted bar matches the theme.
  const barTint = scheme === 'dark' ? 'rgba(16,15,13,0.72)' : 'rgba(251,250,248,0.72)';

  return (
    <BlurView intensity={40} tint={scheme} style={[styles.bar, { backgroundColor: barTint, paddingBottom: insets.bottom + 6 }]}>
      <View style={styles.row}>
        {TABS.map((t) => {
          const active = tab === t.tab;
          return (
            <Pressable key={t.tab} style={styles.item} onPress={() => setTab({ tab: t.tab })}>
              <View>
                <Ionicons name={t.icon} size={22} color={active ? C.accent : C.faint} />
                {t.tab === 'invites' && invitesCount > 0 && <View style={styles.badge} />}
                {t.tab === 'rooms' && roomInvites > 0 && <View style={styles.badge} />}
              </View>
              <Text style={[grotesk(9.5, 'medium'), { color: active ? C.accent : C.faint, marginTop: 3, letterSpacing: 0.4 }]}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </BlurView>
  );
}

const makeStyles = (C: Palette) => StyleSheet.create({
  bar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.hairline,
    paddingTop: 10,
  },
  row: { flexDirection: 'row', paddingHorizontal: 12 },
  item: { flex: 1, alignItems: 'center' },
  badge: {
    position: 'absolute', top: -2, right: -6, width: 7, height: 7, borderRadius: 4, backgroundColor: C.accent,
  },
});
