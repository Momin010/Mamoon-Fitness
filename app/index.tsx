
import { Redirect } from 'expo-router';
import { useSupabase } from '../context/SupabaseContext';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { user, isLoading, isConfigured } = useSupabase();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  // If Supabase is not configured, we allow access to the app (local-only mode)
  if (!isConfigured) {
    return <Redirect href="/(tabs)/workout" />;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(tabs)/workout" />;
}
