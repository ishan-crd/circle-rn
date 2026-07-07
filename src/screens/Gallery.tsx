// Gallery — a curated selection of members as full-bleed portrait cards.
// Mirrors coterie-ios/Circle/Views/Main/GalleryView.swift.

import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CT, serif, serifItalic, grotesk } from '../theme';
import { Text, Eyebrow, Pressed, ProfilePhoto } from '../components/ui';
import { useStore } from '../store';
import { Member } from '../types';

export function Gallery() {
  const s = useStore();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 96 }]}>
      <Eyebrow tracking={2.6} style={{ paddingTop: 18, paddingBottom: 4 }}>THE GALLERY</Eyebrow>
      <Text style={serif(33)}>Curated for you</Text>
      <Text style={[grotesk(14), styles.subtitle]}>
        A small, considered selection. We'd rather show you six than six hundred.
      </Text>

      {s.feed.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[grotesk(14), { color: CT.muted }]}>
            {s.feedLoading ? 'Gathering people…' : 'No one new right now.'}
          </Text>
        </View>
      ) : (
        s.feed.map((member) => (
          <GalleryCard
            key={member.id}
            member={member}
            uri={s.memberPhotos[member.id]?.[0]}
            onPress={() => s.openProfile(member.id)}
          />
        ))
      )}
    </ScrollView>
  );
}

function GalleryCard({ member, uri, onPress }: { member: Member; uri?: string; onPress: () => void }) {
  return (
    <Pressed scale={0.985} onPress={onPress} style={styles.card}>
      <ProfilePhoto uri={uri} seed={member.portrait} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.08)', 'rgba(0,0,0,0.62)']}
        locations={[0.42, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.cardBody}>
        <View style={styles.nameRow}>
          <Text style={[serif(38), { color: '#fff' }]}>{member.name}</Text>
          <Text style={[serif(22), { color: 'rgba(255,255,255,0.78)' }]}>{member.age}</Text>
        </View>
        <Text style={[grotesk(10.5), styles.meta]}>
          {member.role} · {member.city}
        </Text>
        <Text style={[serifItalic(17), styles.bio]}>{member.bio}</Text>
      </View>
    </Pressed>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22 },
  subtitle: { color: CT.bodyLight, maxWidth: 280, marginTop: 4, marginBottom: 24, lineHeight: 20 },
  empty: { alignItems: 'center', paddingTop: 80 },
  card: {
    width: '100%',
    height: 434,
    borderRadius: 26,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginBottom: 26,
    backgroundColor: CT.photoEmpty,
  },
  cardBody: { padding: 24 },
  nameRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  meta: {
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  bio: { color: 'rgba(255,255,255,0.92)', marginTop: 10, lineHeight: 22 },
});
