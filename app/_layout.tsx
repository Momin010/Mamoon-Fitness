
import "./../global.css";
import { Stack } from 'expo-router';
import { SupabaseProvider } from '../context/SupabaseContext';
import { AppProvider } from '../context/AppContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SupabaseProvider>
        <AppProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
          </Stack>
        </AppProvider>
      </SupabaseProvider>
    </GestureHandlerRootView>
  );
}
