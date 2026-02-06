
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, SafeAreaView, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Search,
  UserPlus,
  UserMinus,
  Check,
  X,
  User as UserIcon,
  MoreHorizontal,
  MessageCircle,
  Trophy,
  Clock,
  Loader2,
  Users,
  Compass,
  Star
} from 'lucide-react-native';
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '../lib/supabase';
import { ForgeButton } from '../components';

interface UserProfile {
  id: string;
  name: string;
  avatar_url?: string;
  level: number;
  xp: number;
  is_following?: boolean;
}

const FriendsPage: React.FC = () => {
  const router = useRouter();
  const { user: authUser } = useSupabase();

  const [activeTab, setActiveTab] = useState<'following' | 'followers' | 'discover'>('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!authUser?.id) return;
    loadUsers();
  }, [authUser?.id, activeTab]);

  const loadUsers = async () => {
    if (!authUser?.id) return;
    setIsLoading(true);
    try {
      if (activeTab === 'discover') {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, level, xp')
          .neq('id', authUser.id)
          .limit(50) as { data: any[] | null, error: any };

        if (profilesError) throw profilesError;

        const { data: following, error: followingError } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', authUser.id) as { data: any[] | null, error: any };

        if (followingError) throw followingError;
        const followingIds = new Set(following?.map(f => f.following_id) || []);

        setUsers((profiles || []).map(p => ({
          ...p,
          is_following: followingIds.has(p.id)
        })));

      } else if (activeTab === 'following') {
        const { data: followingData, error: followError } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', authUser.id) as { data: any[] | null, error: any };

        if (followError) throw followError;

        const followingIds = followingData?.map(f => f.following_id) || [];

        if (followingIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name, avatar_url, level, xp')
            .in('id', followingIds) as { data: any[] | null, error: any };

          setUsers((profiles || []).map(p => ({ ...p, is_following: true })));
        } else {
          setUsers([]);
        }

      } else if (activeTab === 'followers') {
        const { data: followerData, error: followError } = await supabase
          .from('user_follows')
          .select('follower_id')
          .eq('following_id', authUser.id) as { data: any[] | null, error: any };

        if (followError) throw followError;

        const followerIds = followerData?.map(f => f.follower_id) || [];

        if (followerIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name, avatar_url, level, xp')
            .in('id', followerIds) as { data: any[] | null, error: any };

          const { data: following } = await supabase
            .from('user_follows')
            .select('following_id')
            .eq('follower_id', authUser.id) as { data: any[] | null, error: any };

          const followingIds = new Set(following?.map(f => f.following_id) || []);

          setUsers((profiles || []).map(p => ({
            ...p,
            is_following: followingIds.has(p.id)
          })));
        } else {
          setUsers([]);
        }
      }
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !authUser?.id) return;

    setIsLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, level, xp')
        .ilike('name', `%${searchQuery}%`)
        .neq('id', authUser.id)
        .limit(20) as { data: any[] | null, error: any };

      if (error) throw error;

      const { data: following } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', authUser.id) as { data: any[] | null, error: any };

      const followingIds = new Set(following?.map(f => f.following_id) || []);

      setUsers((profiles || []).map(p => ({
        ...p,
        is_following: followingIds.has(p.id)
      })));
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFollow = async (targetUserId: string, isCurrentlyFollowing: boolean) => {
    if (!authUser?.id) return;

    setIsActionLoading(targetUserId);
    try {
      if (isCurrentlyFollowing) {
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', authUser.id)
          .eq('following_id', targetUserId);
      } else {
        await supabase
          .from('user_follows')
          .insert({
            follower_id: authUser.id,
            following_id: targetUserId
          } as any);
      }

      setUsers(prev => prev.map(u =>
        u.id === targetUserId
          ? { ...u, is_following: !isCurrentlyFollowing }
          : u
      ));

      if (activeTab === 'following' && isCurrentlyFollowing) {
        setUsers(prev => prev.filter(u => u.id !== targetUserId));
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    } finally {
      setIsActionLoading(null);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <header className="flex-row items-center gap-4 p-6 border-b border-zinc-900 bg-black">
        <TouchableOpacity onPress={() => router.back()} className="p-2 bg-zinc-900 rounded-full">
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-xl font-black uppercase tracking-tighter text-white">Community</Text>
      </header>

      <View className="flex-row border-b border-zinc-900">
        {[
          { id: 'discover', label: 'Disc', icon: Compass },
          { id: 'following', label: 'Follow', icon: Star },
          { id: 'followers', label: 'Fans', icon: Users }
        ].map(tab => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex-row items-center justify-center gap-2 py-4 ${activeTab === tab.id ? 'border-b-2 border-green-500' : ''}`}
          >
            <tab.icon size={16} color={activeTab === tab.id ? '#22c55e' : '#71717a'} />
            <Text className={`text-[10px] font-black uppercase tracking-widest ${activeTab === tab.id ? 'text-green-500' : 'text-zinc-500'}`}>
                {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView className="flex-1 p-6">
        {activeTab === 'discover' && (
          <View className="relative mb-6">
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              placeholder="Search athletes..."
              placeholderTextColor="#3f3f46"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-white font-bold"
            />
            <Search size={18} color="#71717a" className="absolute left-4 top-1/2 -mt-[9px]" />
          </View>
        )}

        {isLoading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#22c55e" />
          </View>
        ) : users.length === 0 ? (
          <View className="items-center py-20 bg-zinc-900/50 rounded-3xl border border-zinc-800">
            <Users size={48} color="#27272a" />
            <Text className="text-white text-lg font-bold mt-4">No users found</Text>
            <TouchableOpacity onPress={() => setActiveTab('discover')}>
                <Text className="text-green-500 font-bold mt-2 uppercase text-xs">Go to Discover</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="gap-4 pb-20">
            {users.map((profile) => (
              <View
                key={profile.id}
                className="flex-row items-center gap-4 p-4 bg-zinc-900 rounded-2xl border border-zinc-800"
              >
                <TouchableOpacity
                  onPress={() => router.push(`/profile/${profile.id}`)}
                  className="flex-row items-center gap-4 flex-1"
                >
                  <View className="relative">
                    {profile.avatar_url ? (
                      <Image
                        source={{ uri: profile.avatar_url }}
                        className="w-14 h-14 rounded-2xl"
                      />
                    ) : (
                      <View className="w-14 h-14 rounded-2xl bg-zinc-800 items-center justify-center">
                        <UserIcon size={28} color="#3f3f46" />
                      </View>
                    )}
                    <View className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg items-center justify-center bg-black border border-zinc-800">
                      <Text className="text-[10px] font-black text-green-500">{profile.level}</Text>
                    </View>
                  </View>

                  <View className="flex-1">
                    <Text className="font-bold text-white text-lg">{profile.name}</Text>
                    <Text className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                      {profile.xp.toLocaleString()} XP
                    </Text>
                  </View>
                </TouchableOpacity>

                <View className="flex-row items-center gap-2">
                  <TouchableOpacity
                    onPress={() => router.push(`/messages/${profile.id}`)}
                    className="p-3 bg-zinc-800 rounded-xl"
                  >
                    <MessageCircle size={18} color="#a1a1aa" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => toggleFollow(profile.id, !!profile.is_following)}
                    disabled={isActionLoading === profile.id}
                    className={`px-4 py-2 rounded-xl ${profile.is_following ? 'bg-zinc-800' : 'bg-green-500'}`}
                  >
                    {isActionLoading === profile.id ? (
                        <ActivityIndicator size="small" color={profile.is_following ? 'white' : 'black'} />
                    ) : (
                        <Text className={`text-xs font-bold uppercase ${profile.is_following ? 'text-white' : 'text-black'}`}>
                            {profile.is_following ? 'Unfollow' : 'Follow'}
                        </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default FriendsPage;
