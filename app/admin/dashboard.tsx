
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Image, ActivityIndicator, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Award,
  Briefcase,
  ExternalLink,
  Loader2,
  AlertCircle,
  Search,
  Filter,
  MessageSquare
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useSupabase } from '../../context/SupabaseContext';
import { ForgeButton } from '../../components';

interface CoachApplication {
  id: string;
  user_id: string;
  bio: string;
  specialties: string[];
  experience_years: number;
  certifications: string[];
  social_links: {
    instagram?: string;
    youtube?: string;
    website?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    name: string;
    email: string;
    avatar_url: string | null;
    level: number;
  };
}

const AdminCoachApplications: React.FC = () => {
  const router = useRouter();
  const { user: authUser } = useSupabase();

  const [applications, setApplications] = useState<CoachApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedApp, setSelectedApp] = useState<CoachApplication | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const ADMIN_EMAIL = 'admin@forgefitness.com';

  useEffect(() => {
    if (authUser && authUser.email !== ADMIN_EMAIL) {
      router.replace('/admin/auth');
      return;
    }
    loadApplications();
  }, [filter, authUser]);

  const loadApplications = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('coach_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data: appsData, error: appsError } = await query as { data: any[] | null, error: any };

      if (appsError) throw appsError;

      const userIds = appsData?.map(app => app.user_id) || [];

      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, email, avatar_url, level')
          .in('id', userIds) as { data: any[] | null, error: any };

        if (profilesError) throw profilesError;

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

        const transformed: CoachApplication[] = (appsData || []).map((app: any) => ({
          ...app,
          user: profilesMap.get(app.user_id)
        }));

        setApplications(transformed);
      } else {
        setApplications(appsData || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (appId: string) => {
    setProcessingId(appId);
    try {
      const { error } = await (supabase as any)
        .from('coach_applications')
        .update({
          status: 'approved',
          admin_notes: adminNote || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', appId);

      if (error) throw error;
      await loadApplications();
      setSelectedApp(null);
      setAdminNote('');
    } catch (err: any) {
      setError(err.message || 'Failed to approve');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (appId: string) => {
    setProcessingId(appId);
    try {
      const { error } = await (supabase as any)
        .from('coach_applications')
        .update({
          status: 'rejected',
          admin_notes: adminNote || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', appId);

      if (error) throw error;
      await loadApplications();
      setSelectedApp(null);
      setAdminNote('');
    } catch (err: any) {
      setError(err.message || 'Failed to reject');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-500 border-red-500/30';
      default: return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <header className="flex-row items-center gap-4 p-6 border-b border-zinc-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2 bg-zinc-900 rounded-full">
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
        <View>
          <Text className="text-xl font-bold text-white">Coach Review</Text>
          <Text className="text-xs text-zinc-500">Manage applications</Text>
        </View>
      </header>

      <View className="p-4 border-b border-zinc-800">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              className={`px-6 py-2 rounded-full mr-2 ${filter === f ? 'bg-green-500' : 'bg-zinc-900'}`}
            >
              <Text className={`font-bold text-sm ${filter === f ? 'text-black' : 'text-zinc-400'}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 p-4">
        {isLoading ? (
          <ActivityIndicator size="large" color="#22c55e" className="mt-12" />
        ) : applications.length === 0 ? (
          <View className="items-center py-20 opacity-30">
            <Briefcase size={48} color="white" />
            <Text className="text-white mt-4">No applications found</Text>
          </View>
        ) : (
          <View className="gap-4 pb-20">
            {applications.map((app) => (
              <TouchableOpacity
                key={app.id}
                onPress={() => {
                  setSelectedApp(app);
                  setAdminNote(app.admin_notes || '');
                }}
                className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800"
              >
                <View className="flex-row gap-4">
                    <View className="w-12 h-12 bg-zinc-800 rounded-full items-center justify-center">
                        {app.user?.avatar_url ? (
                            <Image source={{ uri: app.user.avatar_url }} className="w-full h-full rounded-full" />
                        ) : (
                            <User size={24} color="#71717a" />
                        )}
                    </View>
                    <View className="flex-1">
                        <View className="flex-row items-center gap-2 mb-1">
                            <Text className="font-bold text-white text-lg">{app.user?.name || 'Unknown'}</Text>
                        </View>
                        <Text className="text-zinc-500 text-xs mb-3">{app.user?.email}</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {app.specialties.slice(0, 2).map(s => (
                                <View key={s} className="bg-zinc-800 px-2 py-1 rounded">
                                    <Text className="text-[10px] text-zinc-400 uppercase font-black">{s}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                    <View className={`px-2 py-1 rounded h-6 ${getStatusClass(app.status)}`}>
                        <Text className="text-[8px] font-black uppercase">{app.status}</Text>
                    </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {selectedApp && (
        <Modal visible transparent animationType="slide">
            <SafeAreaView className="flex-1 bg-black/95">
                <ScrollView className="flex-1 p-8">
                    <View className="flex-row justify-between items-center mb-8">
                        <Text className="text-2xl font-black text-white uppercase italic">Details</Text>
                        <TouchableOpacity onPress={() => setSelectedApp(null)} className="p-2 bg-zinc-800 rounded-full">
                            <XCircle size={20} color="white" />
                        </TouchableOpacity>
                    </View>

                    <View className="gap-6 pb-20">
                        <View className="flex-row items-center gap-4">
                            <View className="w-20 h-20 bg-zinc-800 rounded-full items-center justify-center">
                                {selectedApp.user?.avatar_url ? (
                                    <Image source={{ uri: selectedApp.user.avatar_url }} className="w-full h-full rounded-full" />
                                ) : (
                                    <User size={40} color="#71717a" />
                                )}
                            </View>
                            <View>
                                <Text className="text-2xl font-bold text-white">{selectedApp.user?.name}</Text>
                                <Text className="text-zinc-500">{selectedApp.user?.email}</Text>
                            </View>
                        </View>

                        <View>
                            <Text className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">Bio</Text>
                            <View className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
                                <Text className="text-zinc-300 leading-relaxed">{selectedApp.bio}</Text>
                            </View>
                        </View>

                        <View>
                            <Text className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">Specialties</Text>
                            <View className="flex-row flex-wrap gap-2">
                                {selectedApp.specialties.map(s => (
                                    <View key={s} className="bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                                        <Text className="text-green-500 font-bold text-xs">{s}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        <View>
                            <Text className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">Admin Notes</Text>
                            <TextInput
                                value={adminNote}
                                onChangeText={setAdminNote}
                                placeholder="Add note..."
                                placeholderTextColor="#3f3f46"
                                multiline
                                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white font-medium h-24"
                                textAlignVertical="top"
                            />
                        </View>

                        {selectedApp.status === 'pending' && (
                            <View className="flex-row gap-4 mt-4">
                                <TouchableOpacity
                                    onPress={() => handleReject(selectedApp.id)}
                                    disabled={!!processingId}
                                    className="flex-1 bg-zinc-800 py-5 rounded-2xl items-center"
                                >
                                    <Text className="text-white font-black uppercase tracking-widest">Reject</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => handleApprove(selectedApp.id)}
                                    disabled={!!processingId}
                                    className="flex-1 bg-green-500 py-5 rounded-2xl items-center"
                                >
                                    <Text className="text-black font-black uppercase tracking-widest">Approve</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
};

export default AdminCoachApplications;
