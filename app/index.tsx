import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, ActivityIndicator, Alert } from 'react-native';
import { SupabaseProvider, useSupabase } from '../context/SupabaseContext';
import { AppProvider } from '../context/AppContext';

function LoginScreen() {
  const { signIn, signUp, isLoading, user } = useSupabase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async () => {
    const { error } = await signIn(email, password);
    if (error) Alert.alert('Sign in failed', error.message || String(error));
  };

  const handleSignUp = async () => {
    const { error } = await signUp(email, password, 'New User');
    if (error) Alert.alert('Sign up failed', error.message || String(error));
  };

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} />;

  if (user) return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>You are signed in.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.main}>
        <Text style={styles.title}>Sign in</Text>
        <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" keyboardType="email-address" />
        <TextInput placeholder="Password" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />
        <View style={styles.row}>
          <Button title="Sign In" onPress={handleSignIn} />
          <Button title="Sign Up" onPress={handleSignUp} />
        </View>
      </View>
    </View>
  );
}

export default function Page() {
  return (
    <SupabaseProvider>
      <AppProvider>
        <LoginScreen />
      </AppProvider>
    </SupabaseProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff'
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 960,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 12
  },
  subtitle: {
    fontSize: 18,
    color: '#38434D',
    marginBottom: 24
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  }
});
