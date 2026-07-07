// Animated launch splash:
//  1. A thick terracotta ring (the Circle mark) fades in with "Circle" beneath it.
//  2. After a short hold, it slowly grows while its border thins, expanding past
//     the screen edges as the caption fades out.
//  3. The whole splash fades to reveal the app.

import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, withSequence,
  Easing, runOnJS, interpolate,
} from 'react-native-reanimated';
import { CT, serif } from '../theme';
import { Text } from './ui';

const INTRO_MS = 380;   // ring + caption fade in
const HOLD_MS = 1200;    // hold on the logo before it grows
const GROW_MS = 3000;   // slow expansion
const FADE_MS = 420;    // final reveal

const START_DIAMETER = 88;
const START_BORDER = 14;
const END_BORDER = 2;

export function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const { width, height } = useWindowDimensions();
  // Just past the screen's diagonal so the ring reaches the corners exactly at
  // the end of the grow — no blank hold after it has already left the screen.
  const maxDiameter = Math.hypot(width, height) * 1.3;

  const intro = useSharedValue(0);   // 0 → 1 initial fade-in of the ring
  const grow = useSharedValue(0);    // 0 → 1 expansion
  const caption = useSharedValue(0); // caption opacity
  const fade = useSharedValue(1);    // whole-splash opacity

  useEffect(() => {
    intro.value = withTiming(1, { duration: INTRO_MS, easing: Easing.out(Easing.cubic) });
    // Caption fades in with the ring, holds, then fades out as the ring grows.
    caption.value = withSequence(
      withTiming(1, { duration: INTRO_MS, easing: Easing.out(Easing.cubic) }),
      withDelay(HOLD_MS - INTRO_MS, withTiming(0, { duration: 420, easing: Easing.out(Easing.cubic) })),
    );
    // Grow starts after the hold.
    grow.value = withDelay(HOLD_MS, withTiming(1, { duration: GROW_MS, easing: Easing.inOut(Easing.cubic) }));
    // Reveal the app near the end of the grow.
    fade.value = withDelay(
      HOLD_MS + GROW_MS - FADE_MS,
      withTiming(0, { duration: FADE_MS, easing: Easing.out(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(onFinish)();
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ringStyle = useAnimatedStyle(() => {
    const d = interpolate(grow.value, [0, 1], [START_DIAMETER, maxDiameter]);
    const borderWidth = interpolate(grow.value, [0, 1], [START_BORDER, END_BORDER]);
    return { width: d, height: d, borderRadius: d / 2, borderWidth, opacity: intro.value };
  });
  const captionStyle = useAnimatedStyle(() => ({ opacity: caption.value }));
  const rootStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  return (
    <Animated.View style={[styles.root, rootStyle]}>
      <Animated.View style={[styles.ring, ringStyle]} />
      <Animated.View style={[styles.caption, captionStyle]}>
        <Text style={[serif(30), { color: CT.ink }]}>Circle</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: CT.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: { borderColor: CT.accent },
  // Sits just below the centered ring's starting position.
  caption: {
    position: 'absolute',
    top: '50%',
    marginTop: START_DIAMETER / 2 + 26,
  },
});
