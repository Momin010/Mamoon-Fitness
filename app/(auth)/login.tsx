
import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSupabase } from '../../context/SupabaseContext';
import { Dumbbell, Mail, Lock, User, AlertCircle } from 'lucide-react-native';

export default function LoginScreen() {
  const { signIn, signUp, isLoading, isConfigured } = useSupabase();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  if (!isConfigured) {
    return (
      <View className="flex-1 bg-black justify-center items-center p-6">
        <Text className="text-white text-3xl font-black uppercase italic mb-4">Cloud Sync Disabled</Text>
        <Text className="text-zinc-500 text-center">Supabase not configured. Check .env for credentials.</Text>
      </View>
    );
  }

  const handleSubmit = async () => {
    setError('');
    setMessage('');
    setBusy(true);
    try {
        if (isLogin) {
          const { error } = await signIn(email, password);
          if (error) setError(error.message || String(error));
        } else {
          const { error } = await signUp(email, password, name);
          if (error) setError(error.message || String(error));
          else setMessage('Check your email to confirm your account!');
        }
    } catch (e: any) {
        setError(e.message || String(e));
    } finally {
        setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-black"
    >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
            <View className="items-center mb-12">
                <View className="w-20 h-20 bg-green-500/20 rounded-[2rem] items-center justify-center rotate-3">
                    <Dumbbell size={40} color="#22c55e" strokeWidth={2.5} />
                </View>
                <Text className="text-white text-4xl font-black uppercase italic mt-6 tracking-tighter">Forge Fitness</Text>
                <Text className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-2">Level up your life</Text>
            </View>

            <View className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6">
                <Text className="text-white text-2xl font-black uppercase mb-2 italic">{isLogin ? 'Welcome Back' : 'Join the Forge'}</Text>
                <Text className="text-zinc-500 text-xs font-bold mb-8 uppercase tracking-widest">
                    {isLogin ? 'Sign in to sync your progress' : 'Create an account to start tracking'}
                </Text>

                {error ? (
                    <View className="flex-row items-center bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-6">
                        <AlertCircle size={18} color="#ef4444" />
                        <Text className="text-red-500 ml-3 font-bold text-xs flex-1">{error}</Text>
                    </View>
                ) : null}

                {message ? (
                    <View className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl mb-6">
                        <Text className="text-green-500 font-bold text-xs">{message}</Text>
                    </View>
                ) : null}

                {!isLogin && (
                    <View className="bg-black border border-zinc-800 rounded-xl flex-row items-center px-4 py-4 mb-4">
                        <User size={18} color="#71717a" />
                        <TextInput
                            placeholder="Full Name"
                            placeholderTextColor="#71717a"
                            value={name}
                            onChangeText={setName}
                            className="flex-1 ml-3 text-white font-bold"
                        />
                    </View>
                )}

                <View className="bg-black border border-zinc-800 rounded-xl flex-row items-center px-4 py-4 mb-4">
                    <Mail size={18} color="#71717a" />
                    <TextInput
                        placeholder="Email Address"
                        placeholderTextColor="#71717a"
                        value={email}
                        onChangeText={setEmail}
                        className="flex-1 ml-3 text-white font-bold"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <View className="bg-black border border-zinc-800 rounded-xl flex-row items-center px-4 py-4 mb-8">
                    <Lock size={18} color="#71717a" />
                    <TextInput
                        placeholder="Password"
                        placeholderTextColor="#71717a"
                        value={password}
                        onChangeText={setPassword}
                        className="flex-1 ml-3 text-white font-bold"
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={busy}
                    className={`bg-green-500 py-5 rounded-2xl items-center shadow-lg shadow-green-500/20 ${busy ? 'opacity-50' : ''}`}
                >
                    {busy ? (
                        <ActivityIndicator color="black" />
                    ) : (
                        <Text className="text-black font-black uppercase tracking-widest">{isLogin ? 'Sign In' : 'Forge Account'}</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => { setIsLogin(!isLogin); setError(''); setMessage(''); }}
                    className="mt-6 items-center"
                >
                    <Text className="text-zinc-500 font-bold text-xs uppercase tracking-widest">
                        {isLogin ? "Don't have an account? " : 'Already have an account? '}
                        <Text className="text-green-500">
                            {isLogin ? 'Sign up' : 'Sign in'}
                        </Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    </KeyboardAvoidingView>
  );
}
