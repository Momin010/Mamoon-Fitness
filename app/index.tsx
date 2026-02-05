import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SupabaseProvider, useSupabase } from '../context/SupabaseContext';
import { supabase } from '../lib/supabase';
import { AppProvider } from '../context/AppContext';
import { Dumbbell, Mail, Lock, User, AlertCircle } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';

function LoginScreen() {
  const { signIn, signUp, isLoading, user, isConfigured } = useSupabase();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  if (!isConfigured) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <Text style={styles.title}>Cloud Sync Disabled</Text>
        <Text style={styles.subtitle}>Supabase not configured. Check .env for credentials.</Text>
      </View>
    );
  }

  const handleSubmit = async () => {
    setError('');
    setMessage('');
    setBusy(true);
    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) setError(error.message || String(error));
    } else {
      const { error } = await signUp(email, password, name);
      if (error) setError(error.message || String(error));
      else setMessage('Check your email to confirm your account!');
    }
    setBusy(false);
  };

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} />;

  if (user) return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>You are signed in.</Text>
      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: '#ef4444', marginTop: 20 }]}
        onPress={async () => {
          try {
            if (typeof signOut === 'function') {
              await signOut();
            } else {
              Alert.alert('Not available', 'Sign out is not available in this session.');
            }
          } catch (e) {
            Alert.alert('Error', String(e));
          }
        }}
      >
        <Text style={[styles.primaryText, { color: '#fff' }]}>Sign Out</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.primaryButton, { backgroundColor: '#374151', marginTop: 12 }]} onPress={async () => {
        const keys = [
          'supabase.auth.token',
          'supabase.auth.refresh_token',
          'supabase.auth.session',
          'sb:token',
          'sb:auth',
          'supabase-session'
        ];
        for (const k of keys) {
          try { await SecureStore.deleteItemAsync(k); } catch (e) { /* ignore */ }
        }
        Alert.alert('Cleared', 'Attempted to clear SecureStore keys. Restart the app.');
      }}>
        <Text style={[styles.primaryText, { color: '#fff' }]}>Clear Secure Storage</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.primaryButton, { backgroundColor: '#111827', marginTop: 12 }]} onPress={async () => {
        try {
          const session = await supabase.auth.getSession();
          const keys = ['supabase.auth.token','supabase.auth.refresh_token','supabase.auth.session','sb:token','sb:auth','supabase-session'];
          const found: Record<string,string|null> = {};
          for (const k of keys) {
            try { found[k] = await SecureStore.getItemAsync(k); } catch (e) { found[k] = null; }
          }
          Alert.alert('Debug', JSON.stringify({ session: session?.data ?? session, keys: found }, null, 2).slice(0, 1000));
        } catch (e) {
          Alert.alert('Error', String(e));
        }
      }}>
        <Text style={[styles.primaryText, { color: '#fff' }]}>Debug Session</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.logoWrap}>
        <View style={styles.logoCircle}><Dumbbell size={28} color="#10b981" /></View>
      </View>

      <Text style={styles.heading}>{isLogin ? 'Welcome Back' : 'Get Started'}</Text>
      <Text style={styles.lead}>{isLogin ? 'Sign in to sync your progress' : 'Create an account to start tracking'}</Text>

      {error ? (
        <View style={styles.alertRow}><AlertCircle size={18} color="#ef4444" /><Text style={styles.alertText}>{error}</Text></View>
      ) : null}

      {message ? (
        <View style={styles.messageBox}><Text style={styles.messageText}>{message}</Text></View>
      ) : null}

      {!isLogin && (
        <View style={styles.inputWrap}>
          <User size={16} color="#666" style={styles.icon} />
          <TextInput placeholder="Name" value={name} onChangeText={setName} style={styles.input} />
        </View>
      )}

      <View style={styles.inputWrap}>
        <Mail size={16} color="#666" style={styles.icon} />
        <TextInput placeholder="you@example.com" value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" autoCapitalize="none" />
      </View>

      <View style={styles.inputWrap}>
        <Lock size={16} color="#666" style={styles.icon} />
        <TextInput placeholder="Password" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />
      </View>

      <TouchableOpacity style={[styles.primaryButton, busy && { opacity: 0.6 }]} onPress={handleSubmit} disabled={busy}>
        {busy ? <ActivityIndicator color="#000" /> : <Text style={styles.primaryText}>{isLogin ? 'Sign In' : 'Create Account'}</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => { setIsLogin(!isLogin); setError(''); setMessage(''); }}>
        <Text style={styles.switchText}>{isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}</Text>
      </TouchableOpacity>
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
  ,
  logoWrap: {
    marginTop: 24,
    marginBottom: 18,
    alignItems: 'center'
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ecfccb',
    alignItems: 'center',
    justifyContent: 'center'
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 6
  },
  lead: {
    color: '#6b7280',
    marginBottom: 12
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12
  },
  alertText: {
    color: '#991b1b',
    marginLeft: 8
  },
  messageBox: {
    backgroundColor: '#ecfccb',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12
  },
  messageText: {
    color: '#065f46'
  },
  inputWrap: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#11182710',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 12
  },
  icon: {
    marginRight: 8
  },
  primaryButton: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 8
  },
  primaryText: {
    fontWeight: '700',
    color: '#000'
  },
  switchText: {
    color: '#6b7280',
    marginTop: 8
  }
});
