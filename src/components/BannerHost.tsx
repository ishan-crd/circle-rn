// In-app notification banner — a themed toast that slides down from the top for
// incoming messages / likes / matches while the app is foregrounded. Tap to open
// the relevant screen; auto-dismisses (timer lives in the store).

import React, { useEffect } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { grotesk, useTheme, type Palette } from '../theme';
import { Text } from './ui';
import { useStore } from '../store';

export function BannerHost() {
  const C = useTheme();
  const styles = React.useMemo(() => makeStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const banner = useStore((s) => s.banner);
  const openBanner = useStore((s) => s.openBanner);
  const dismissBanner = useStore((s) => s.dismissBanner);

  const ty = useSharedValue(-160);
  const op = useSharedValue(0);
  useEffect(() => {
    if (banner) {
      ty.value = withSpring(0, { damping: 18, stiffness: 180 });
      op.value = withTiming(1, { duration: 160 });
    } else {
      ty.value = withTiming(-160, { duration: 200 });
      op.value = withTiming(0, { duration: 160 });
    }
  }, [banner?.id, banner]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }], opacity: op.value }));

  return (
    <Animated.View
      pointerEvents={banner ? 'box-none' : 'none'}
      style={[styles.wrap, { top: insets.top + 8 }, style]}
    >
      {banner && (
        <Pressable onPress={openBanner} style={styles.card}>
          <Animated.View style={styles.iconWrap}>
            <Ionicons name={banner.icon === 'heart' ? 'heart' : banner.icon === 'sparkles' ? 'sparkles' : 'chatbubble'} size={18} color={C.accentInk} />
          </Animated.View>
          <Animated.View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={[grotesk(14.5, 'semibold'), { color: C.ink }]}>{banner.title}</Text>
            <Text numberOfLines={1} style={[grotesk(12.5), { color: C.muted, marginTop: 1 }]}>{banner.subtitle}</Text>
          </Animated.View>
          <Pressable hitSlop={10} onPress={dismissBanner} style={styles.close}>
            <Ionicons name="close" size={15} color={C.muted} />
          </Pressable>
        </Pressable>
      )}
    </Animated.View>
  );
}

const makeStyles = (C: Palette) => StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12, zIndex: 1000 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 18, backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  iconWrap: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: C.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  close: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: C.fill },
});
