
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Modal, TextInput, SafeAreaView } from 'react-native';
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
  AlertCircle,
  MessageSquare
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useSupabase } from '../../context/SupabaseContext';
import { ForgeButton } from '../../components/ForgeButton';

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

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { user: authUser } = useSupabase();

  const [applications, setApplications] = useState<CoachApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedApp, setSelectedApp] = useState<CoachApplication | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // In a real app, this would be more secure
  const IS_ADMIN = authUser?.email === 'admin@forgetracker.com';

  useEffect(() => {
    if (authUser && !IS_ADMIN) {
        // Not admin, maybe redirect or show error
    }
    loadApplications();
  }, [filter, authUser]);

  const loadApplications = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = (supabase as any)
        .from('coach_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data: appsData, error: appsError } = await query;
      if (appsError) throw appsError;

      const userIds = appsData?.map((app: any) => app.user_id) || [];

      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await (supabase as any)
          .from('profiles')
          .select('id, name, email, avatar_url, level')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        const profilesMap = new Map(profilesData?.map((p: any) => [p.id, p]) || []);

        const transformed: CoachApplication[] = (appsData || []).map((app: any) => ({
          ...app,
          user: profilesMap.get(app.user_id)
        }));

        setApplications(transformed);
      } else {
        setApplications(appsData || []);
      }
    } catch (err: any) {
      console.error('Error loading applications:', err);
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
      console.error('Error approving application:', err);
      setError(err.message || 'Failed to approve application');
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
      console.error('Error rejecting application:', err);
      setError(err.message || 'Failed to reject application');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle size={20} color="#22c55e" />;
      case 'rejected': return <XCircle size={20} color="#ef4444" />;
      default: return <Clock size={20} color="#eab308" />;
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
      <View className="flex-row items-center gap-4 p-6 border-b border-zinc-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2 bg-zinc-900 rounded-full">
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-white text-xl font-bold">Admin Dashboard</Text>
          <Text className="text-xs text-zinc-500">Coach Applications</Text>
        </View>
      </View>

      <View className="p-4 border-b border-zinc-800">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              className={`px-6 py-2 rounded-full border mr-2 ${filter === f ? 'bg-green-500 border-green-500' : 'bg-zinc-900 border-zinc-800'}`}
            >
              <Text className={`text-sm font-medium ${filter === f ? 'text-black' : 'text-zinc-400'}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 p-4">
        {isLoading ? (
          <ActivityIndicator color="#22c55e" size="large" className="py-12" />
        ) : applications.length === 0 ? (
          <View className="items-center py-20 opacity-40">
            <Briefcase size={48} color="#52525b" />
            <Text className="text-zinc-500 mt-4">No applications found</Text>
          </View>
        ) : (
          <View className="gap-4">
            {applications.map((app) => (
              <TouchableOpacity
                key={app.id}
                onPress={() => {
                  setSelectedApp(app);
                  setAdminNote(app.admin_notes || '');
                }}
                className="bg-zinc-900 rounded-xl p-4 border border-zinc-800"
              >
                <View className="flex-row items-start gap-4">
                  <View className="w-12 h-12 bg-zinc-800 rounded-full items-center justify-center">
                    {app.user?.avatar_url ? (
                      <Image source={{ uri: app.user.avatar_url }} className="w-full h-full rounded-full" />
                    ) : (
                      <User size={24} color="#71717a" />
                    )}
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="text-white font-semibold truncate flex-1">{app.user?.name || 'Unknown User'}</Text>
                      {getStatusIcon(app.status)}
                    </View>
                    <Text className="text-sm text-zinc-500 mb-2">{app.user?.email}</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {app.specialties.slice(0, 2).map((specialty) => (
                        <View key={specialty} className="px-2 py-1 bg-zinc-800 rounded">
                           <Text className="text-[10px] text-zinc-400">{specialty}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View className="h-20" />
      </ScrollView>

      {selectedApp && (
        <Modal visible transparent animationType="slide">
          <View className="flex-1 bg-black/90 justify-end">
            <View className="bg-zinc-900 rounded-t-[2.5rem] p-6 max-h-[90%]">
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-white text-xl font-bold">Application Review</Text>
                    <TouchableOpacity onPress={() => setSelectedApp(null)} className="p-2 bg-zinc-800 rounded-full">
                        <XCircle size={24} color="white" />
                    </TouchableOpacity>
                </View>

                <ScrollView className="space-y-6">
                    <View className="flex-row items-center gap-4 mb-6">
                        <View className="w-16 h-16 bg-zinc-800 rounded-full items-center justify-center">
                            {selectedApp.user?.avatar_url ? (
                                <Image source={{ uri: selectedApp.user.avatar_url }} className="w-full h-full rounded-full" />
                            ) : (
                                <User size={32} color="#71717a" />
                            )}
                        </View>
                        <View>
                            <Text className="text-white text-xl font-bold">{selectedApp.user?.name}</Text>
                            <Text className="text-zinc-500">{selectedApp.user?.email}</Text>
                        </View>
                    </View>

                    <View className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 mb-6">
                        <Text className="text-zinc-400 text-sm leading-relaxed">{selectedApp.bio}</Text>
                    </View>

                    <View className="mb-6">
                         <Text className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-3">Specialties</Text>
                         <View className="flex-row flex-wrap gap-2">
                            {selectedApp.specialties.map(s => (
                                <View key={s} className="px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                                    <Text className="text-green-500 text-xs font-bold">{s}</Text>
                                </View>
                            ))}
                         </View>
                    </View>

                    <View className="mb-6">
                        <Text className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">Admin Notes</Text>
                        <TextInput
                            value={adminNote}
                            onChangeText={setAdminNote}
                            placeholder="Add notes..."
                            placeholderTextColor="#3f3f46"
                            multiline
                            className="bg-black border border-zinc-800 rounded-xl p-4 text-white min-h-[100]"
                            style={{ textAlignVertical: 'top' }}
                        />
                    </View>

                    {selectedApp.status === 'pending' && (
                        <View className="flex-row gap-3 pb-10">
                            <TouchableOpacity
                                onPress={() => handleReject(selectedApp.id)}
                                className="flex-1 py-4 bg-zinc-800 rounded-2xl items-center"
                            >
                                <Text className="text-red-500 font-bold">Reject</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handleApprove(selectedApp.id)}
                                className="flex-1 py-4 bg-green-500 rounded-2xl items-center"
                            >
                                <Text className="text-black font-bold">Approve</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}
