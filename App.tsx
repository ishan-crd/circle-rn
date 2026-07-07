import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { CT, fontsToLoad } from './src/theme';
import { useStore } from './src/store';
import { RootView } from './src/RootView';

export default function App() {
  const [fontsLoaded] = useFonts(fontsToLoad);
  const bootstrap = useStore((s) => s.bootstrap);

  useEffect(() => { bootstrap(); }, [bootstrap]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: CT.paper, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={CT.accent} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <RootView />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
