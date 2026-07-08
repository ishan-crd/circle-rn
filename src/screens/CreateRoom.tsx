// CreateRoom — name a room and invite your matches into it.

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { grotesk, serif, eyebrow, useTheme, Palette } from '../theme';
import { Text, UnderlineField, ProfilePhoto } from '../components/ui';
import { useStore, myMatches } from '../store';

export function CreateRoom() {
  const C = useTheme();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const s = useStore();
  const insets = useSafeAreaInsets();
  const matches = myMatches(s);

  const [name, setName] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const canCreate = name.trim().length > 0 && !saving;
  const create = async () => {
    if (!canCreate) return;
    setSaving(true);
    await s.createRoom(name.trim(), picked); // navigates to the new room, closes this sheet
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <View style={[styles.navBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => s.closeSheet()} hitSlop={10} disabled={saving}>
          <Text style={[grotesk(14), { color: saving ? C.faint : C.muted }]}>Cancel</Text>
        </Pressable>
        <Text style={[grotesk(11), { letterSpacing: 2.2, textTransform: 'uppercase', color: C.ink }]}>New Room</Text>
        <Pressable onPress={create} hitSlop={10} disabled={!canCreate} style={{ minWidth: 52, alignItems: 'flex-end' }}>
          {saving ? <ActivityIndicator size="small" color={C.ink} />
            : <Text style={[grotesk(14, 'semibold'), { color: canCreate ? C.ink : C.faint }]}>Create</Text>}
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[eyebrow(C.muted, 2.6), { marginBottom: 12 }]}>Room name</Text>
        <UnderlineField placeholder="e.g. Sunday hikers" value={name} onChangeText={setName} fontSize={26} autoCapitalize="sentences" />

        <Text style={[eyebrow(C.muted, 2.6), { marginTop: 34, marginBottom: 6 }]}>
          Invite matches {picked.length > 0 ? `· ${picked.length} selected` : ''}
        </Text>
        {matches.length === 0 ? (
          <Text style={[grotesk(14), { color: C.muted, marginTop: 12 }]}>
            Match with people first — then you can invite them here.
          </Text>
        ) : (
          matches.map((m) => {
            const on = picked.includes(m.id);
            return (
              <Pressable key={m.id} onPress={() => toggle(m.id)} style={styles.row}>
                <ProfilePhoto uri={s.memberPhotos[m.id]?.[0]} seed={m.portrait} style={styles.avatar} />
                <View style={{ flex: 1 }}>
                  <Text style={serif(20)}>{m.name}</Text>
                  <Text style={[grotesk(12), { color: C.muted, marginTop: 1 }]}>{m.role} · {m.city}</Text>
                </View>
                <View style={[styles.check, on && { backgroundColor: C.accent, borderColor: C.accent }]}>
                  {on && <Ionicons name="checkmark" size={15} color={C.accentInk} />}
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (C: Palette) => StyleSheet.create({
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingBottom: 14,
    backgroundColor: C.paper, borderBottomWidth: 1, borderBottomColor: C.hairline,
  },
  content: { paddingHorizontal: 26, paddingTop: 24, paddingBottom: 60 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.hairline },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.photoEmpty },
  check: {
    width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
});
