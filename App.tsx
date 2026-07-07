import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { CT, fontsToLoad } from './src/theme';
import { useStore } from './src/store';
import { RootView } from './src/RootView';
import { AnimatedSplash } from './src/components/AnimatedSplash';

export default function App() {
  const [fontsLoaded] = useFonts(fontsToLoad);
  const [splashDone, setSplashDone] = useState(false);
  const bootstrap = useStore((s) => s.bootstrap);

  useEffect(() => { bootstrap(); }, [bootstrap]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {fontsLoaded ? <RootView /> : <View style={{ flex: 1, backgroundColor: CT.paper }} />}
        {!splashDone && <AnimatedSplash onFinish={() => setSplashDone(true)} />}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
