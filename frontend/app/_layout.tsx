import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
// 1. Importiere deinen AuthProvider
import { AuthProvider } from '../context/AuthContext'; 

export const unstable_settings = {
  // Hier stellen wir sicher, dass die Tabs die Hauptroute sind
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    // 2. Umleite alles mit dem AuthProvider
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          {/* Die Tabs (geschützter Bereich) */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          {/* Die Login-Seiten (öffentlich) */}
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}