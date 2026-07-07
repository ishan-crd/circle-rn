import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { fontsToLoad, ThemeProvider, useTheme, useAppearance } from './src/theme';
import { useStore } from './src/store';
import { RootView } from './src/RootView';
import { AnimatedSplash } from './src/components/AnimatedSplash';
import { setupNotifications } from './src/lib/notifications';

function Root() {
  const C = useTheme();
  const { scheme } = useAppearance();
  const [fontsLoaded] = useFonts(fontsToLoad);
  const [splashDone, setSplashDone] = useState(false);
  const bootstrap = useStore((s) => s.bootstrap);

  useEffect(() => { bootstrap(); }, [bootstrap]);
  useEffect(() => setupNotifications(), []);

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {fontsLoaded ? <RootView /> : <View style={{ flex: 1, backgroundColor: C.paper }} />}
      {!splashDone && <AnimatedSplash onFinish={() => setSplashDone(true)} />}
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <SafeAreaProvider>
          <Root />
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
