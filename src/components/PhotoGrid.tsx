// The reusable 6-slot photo grid — a 1:1 port of PhotoGrid/PhotoSlot in
// coterie-ios/Circle/Views/Onboarding/OnboardingView.swift. Three columns of
// 3:4 rounded frames: dashed border + plus when empty, image + remove button
// when filled. Used in onboarding and edit profile.
//
// Slot size is derived from the measured container width (not aspectRatio on a
// percentage width, which collapses to zero height under the New Architecture).

import React, { useState } from 'react';
import { View, StyleSheet, Pressable, LayoutChangeEvent } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { encode } from 'base64-arraybuffer';
import { CT } from '../theme';
import { Text, ProfilePhoto } from './ui';
import { useStore } from '../store';
import { seedFor } from '../data';

/** Fallback for the rare case ImagePicker returns no base64 (reads the file URI). */
async function fetchBase64(uri: string): Promise<string | null> {
  try {
    const res = await fetch(uri);
    const buf = await res.arrayBuffer();
    return encode(buf);
  } catch {
    return null;
  }
}

const COLS = 3;
const GAP = 10;
const RADIUS = 16;

export function PhotoGrid() {
  const photos = useStore((s) => s.profile.photos);
  const setPhoto = useStore((s) => s.setPhoto);
  const removePhoto = useStore((s) => s.removePhoto);
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const slotW = width > 0 ? Math.floor((width - GAP * (COLS - 1)) / COLS) : 0;
  const slotH = Math.round(slotW * (4 / 3));

  const pick = async (index: number) => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        console.warn('[PhotoGrid] media library permission not granted', perm.status);
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.72,
        base64: true,
      });
      if (res.canceled) return;
      const asset = res.assets[0];
      const base64 = asset.base64 ?? (await fetchBase64(asset.uri));
      if (base64) setPhoto(index, asset.uri, base64);
    } catch (e) {
      console.warn('[PhotoGrid] pick failed', e);
    }
  };

  return (
    <View style={styles.grid} onLayout={onLayout}>
      {slotW > 0 && Array.from({ length: 6 }, (_, i) => {
        const uri = photos[i];
        return (
          <View key={i} style={{ width: slotW, height: slotH }}>
            <Pressable
              onPress={() => pick(i)}
              style={({ pressed }) => [styles.slot, pressed && { opacity: 0.85 }]}
            >
              {uri ? (
                <ProfilePhoto uri={uri} seed={seedFor(String(i))} style={styles.fill} />
              ) : (
                <View style={styles.empty}>
                  <Text style={styles.plus}>+</Text>
                </View>
              )}
            </Pressable>
            {uri ? (
              <Pressable onPress={() => removePhoto(i)} hitSlop={8} style={styles.remove}>
                <Text style={styles.removeMark}>✕</Text>
              </Pressable>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  slot: { flex: 1, borderRadius: RADIUS, overflow: 'hidden', backgroundColor: CT.photoEmpty },
  fill: { flex: 1 },
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    borderRadius: RADIUS, borderWidth: 1, borderColor: CT.border, borderStyle: 'dashed',
  },
  plus: { fontSize: 26, color: CT.muted, lineHeight: 30 },
  remove: {
    position: 'absolute', top: 7, right: 7, width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  removeMark: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
