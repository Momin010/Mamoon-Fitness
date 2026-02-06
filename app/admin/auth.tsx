
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, Lock, Mail, User, Loader2, AlertCircle } from 'lucide-react-native';
import { useSupabase } from '../../context/SupabaseContext';
import { ForgeButton } from '../../components';

const AdminAuthPage: React.FC = () => {
  const router = useRouter();
  const { signIn, signOut, user } = useSupabase();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Admin credentials - using placeholder since process.env is not fully set up here
  const ADMIN_EMAIL = 'admin@forgefitness.com';
  const ADMIN_PASSWORD = 'adminpassword';
  const ADMIN_USERNAME = 'admin';

  useEffect(() => {
    if (user) {
      if (user.email === ADMIN_EMAIL) {
        router.replace('/admin/dashboard');
      } else {
        const signOutExistingUser = async () => {
          setIsSigningOut(true);
          try {
            await signOut();
          } catch (err) { } finally {
            setIsSigningOut(false);
          }
        };
        signOutExistingUser();
      }
    }
  }, [user]);

  const handleSubmit = async () => {
    setError(null);

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD || username !== ADMIN_USERNAME) {
      setError('Invalid admin credentials. Access denied.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(`Sign in failed: ${error.message}`);
        return;
      }
      router.replace('/admin/dashboard');
    } catch (err: any) {
      setError(`Login failed: ${err.message || 'Failed to sign in'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSigningOut) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#22c55e" />
        <Text className="mt-4 text-zinc-400">Signing out...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 items-center justify-center p-6">
            <View className="w-full max-w-md">
                <View className="items-center mb-8">
                <View className="w-20 h-20 bg-green-500 rounded-2xl items-center justify-center shadow-lg">
                    <Shield size={40} color="black" />
                </View>
                </View>

                <View className="items-center mb-8">
                <Text className="text-3xl font-black text-white uppercase italic">Admin Access</Text>
                <Text className="text-zinc-500 mt-2">Sign in to access the panel</Text>
                </View>

                {error && (
                <View className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex-row items-center gap-3">
                    <AlertCircle size={20} color="#ef4444" />
                    <Text className="text-red-400 text-sm flex-1">{error}</Text>
                </View>
                )}

                <View className="gap-4">
                <View>
                    <Text className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Username</Text>
                    <View className="relative">
                        <TextInput
                            value={username}
                            onChangeText={setUsername}
                            placeholder="Enter admin username"
                            placeholderTextColor="#3f3f46"
                            className="bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-4 text-white font-bold"
                        />
                        <User size={18} color="#71717a" className="absolute left-4 top-1/2 -mt-[9px]" />
                    </View>
                </View>

                <View>
                    <Text className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Email</Text>
                    <View className="relative">
                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Enter admin email"
                            placeholderTextColor="#3f3f46"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            className="bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-4 text-white font-bold"
                        />
                        <Mail size={18} color="#71717a" className="absolute left-4 top-1/2 -mt-[9px]" />
                    </View>
                </View>

                <View>
                    <Text className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Password</Text>
                    <View className="relative">
                        <TextInput
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Enter admin password"
                            placeholderTextColor="#3f3f46"
                            secureTextEntry
                            className="bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-4 text-white font-bold"
                        />
                        <Lock size={18} color="#71717a" className="absolute left-4 top-1/2 -mt-[9px]" />
                    </View>
                </View>

                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isLoading}
                    className="bg-green-500 py-5 rounded-2xl items-center flex-row justify-center gap-3 mt-4"
                >
                    {isLoading ? <ActivityIndicator color="black" /> : (
                        <>
                            <Shield size={18} color="black" />
                            <Text className="text-black font-black uppercase tracking-widest">Sign In as Admin</Text>
                        </>
                    )}
                </TouchableOpacity>
                </View>

                <View className="mt-12 p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 items-center">
                <Text className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                    🔒 Restricted Area. Transmission Logged.
                </Text>
                </View>
            </View>
        </View>
    </SafeAreaView>
  );
};

export default AdminAuthPage;
