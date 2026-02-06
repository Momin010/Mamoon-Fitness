
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    ChevronLeft,
    MapPin,
    Calendar,
    Trophy,
    Flame,
    MessageSquare,
    UserPlus,
    UserMinus,
    Loader2,
    Heart,
    Share2,
    MoreHorizontal,
    Plus
} from 'lucide-react-native';
import { useSupabase } from '../../context/SupabaseContext';
import { supabase } from '../../lib/supabase';
import { ForgeButton } from '../../components';

interface ProfileData {
    id: string;
    name: string;
    avatar_url?: string;
    xp: number;
    level: number;
    rank: number;
    created_at: string;
    is_following: boolean;
    followers_count: number;
    following_count: number;
}

interface Activity {
    id: string;
    type: string;
    content: any;
    likes: number;
    created_at: string;
}

const PublicProfilePage: React.FC = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user: authUser } = useSupabase();

    const [isLoading, setIsLoading] = useState(true);
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isActionLoading, setIsActionLoading] = useState(false);

    useEffect(() => {
        if (id) {
            loadProfile();
            loadActivities();
        }
    }, [id, authUser]);

    const loadProfile = async () => {
        if (!id) return;
        try {
            const { data, error } = await (supabase as any)
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            let isFollowing = false;
            if (authUser && authUser.id !== id) {
                const { data: followData } = await (supabase as any)
                    .from('user_follows')
                    .select('*')
                    .eq('follower_id', authUser.id)
                    .eq('following_id', id);
                isFollowing = (followData?.length || 0) > 0;
            }

            // Get stats
            const { data: statsData } = await (supabase as any)
                .rpc('get_profile_stats', { profile_id: id });

            const stats = statsData && statsData.length > 0 ? statsData[0] : { followers_count: 0, following_count: 0 };

            setProfile({
                ...data,
                is_following: isFollowing,
                followers_count: stats.followers_count || 0,
                following_count: stats.following_count || 0
            });
        } catch (err) {
            console.error('Error loading profile:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const loadActivities = async () => {
        if (!id) return;
        try {
            const { data, error } = await (supabase as any)
                .from('social_activities')
                .select('*')
                .eq('user_id', id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setActivities(data || []);
        } catch (err) {
            console.error('Error loading activities:', err);
        }
    };

    const handleFollow = async () => {
        if (!authUser || !profile || !id) return;
        setIsActionLoading(true);
        try {
            if (profile.is_following) {
                await (supabase as any)
                    .from('user_follows')
                    .delete()
                    .eq('follower_id', authUser.id)
                    .eq('following_id', id);
            } else {
                await (supabase as any)
                    .from('user_follows')
                    .insert({
                        follower_id: authUser.id,
                        following_id: id
                    });
            }
            setProfile(prev => prev ? { ...prev, is_following: !prev.is_following } : null);
        } catch (err) {
            console.error('Error toggling follow:', err);
        } finally {
            setIsActionLoading(false);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-black items-center justify-center">
                <ActivityIndicator size="large" color="#22c55e" />
            </SafeAreaView>
        );
    }

    if (!profile) {
        return (
            <SafeAreaView className="flex-1 bg-black items-center justify-center p-6">
                <Text className="text-2xl font-black uppercase mb-4 text-red-500">Athlete Not Found</Text>
                <ForgeButton onPress={() => router.back()}>Go Back</ForgeButton>
            </SafeAreaView>
        );
    }

    return (
        <View className="flex-1 bg-black">
            <ScrollView className="flex-1">
                {/* Header / Cover Area */}
                <View className="h-48 bg-zinc-900 relative">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="absolute top-12 left-6 p-3 bg-black/50 rounded-2xl z-10"
                    >
                        <ChevronLeft size={20} color="white" />
                    </TouchableOpacity>
                </View>

                <View className="px-6 -mt-16 z-10">
                    <View className="flex-row justify-between items-end mb-6">
                        <View className="relative">
                            {profile.avatar_url ? (
                                <Image
                                    source={{ uri: profile.avatar_url }}
                                    className="w-32 h-32 rounded-[2.5rem] border-4 border-black shadow-2xl"
                                />
                            ) : (
                                <View className="w-32 h-32 rounded-[2.5rem] bg-zinc-800 border-4 border-black items-center justify-center shadow-2xl">
                                    <Text className="text-4xl font-black text-green-500">{profile.name.charAt(0).toUpperCase()}</Text>
                                </View>
                            )}
                            <View className="absolute -bottom-2 -right-2 bg-green-500 px-3 py-1 rounded-lg">
                                <Text className="text-black text-[10px] font-black">LVL {profile.level}</Text>
                            </View>
                        </View>

                        <View className="flex-row gap-3">
                            {authUser?.id !== id ? (
                                <>
                                    <TouchableOpacity
                                        onPress={() => router.push(`/messages/${id}`)}
                                        className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800"
                                    >
                                        <MessageSquare size={20} color="white" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleFollow}
                                        disabled={isActionLoading}
                                        className={`px-8 py-4 rounded-2xl items-center justify-center flex-row gap-2 ${profile.is_following ? 'bg-zinc-800' : 'bg-green-500'}`}
                                    >
                                        {profile.is_following ? <UserMinus size={18} color="white" /> : <UserPlus size={18} color="black" />}
                                        <Text className={`font-bold ${profile.is_following ? 'text-white' : 'text-black'}`}>
                                            {profile.is_following ? "Unfollow" : "Follow"}
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <ForgeButton onPress={() => router.push('/settings')}>Edit Profile</ForgeButton>
                            )}
                        </View>
                    </View>

                    <View className="mb-8">
                        <Text className="text-3xl font-black uppercase tracking-tighter italic mb-1 text-white">{profile.name}</Text>
                        <View className="flex-row items-center gap-4">
                            <View className="flex-row items-center gap-1">
                                <Calendar size={12} color="#71717a" />
                                <Text className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                                    Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                </Text>
                            </View>
                            <View className="flex-row items-center gap-1">
                                <Trophy size={12} color="#22c55e" />
                                <Text className="text-green-500 text-[10px] font-black uppercase tracking-widest">Rank #{profile.rank}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Stats Grid */}
                    <View className="flex-row gap-4 mb-4">
                        <View className="flex-1 p-4 bg-zinc-900/50 border border-zinc-900 rounded-3xl items-center">
                            <Text className="text-xl font-black italic text-white">{profile.followers_count}</Text>
                            <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mt-1">Followers</Text>
                        </View>
                        <View className="flex-1 p-4 bg-zinc-900/50 border border-zinc-900 rounded-3xl items-center">
                            <Text className="text-xl font-black italic text-white">{profile.following_count}</Text>
                            <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mt-1">Following</Text>
                        </View>
                    </View>

                    <View className="flex-row gap-4 mb-10">
                        {[
                            { label: 'Total XP', value: profile.xp.toLocaleString(), icon: <Flame size={14} color="#f97316" /> },
                            { label: 'Posts', value: activities.length, icon: <Share2 size={14} color="#3b82f6" /> },
                            { label: 'Level', value: profile.level, icon: <Trophy size={14} color="#eab308" /> }
                        ].map((stat, i) => (
                            <View key={i} className="flex-1 p-4 bg-zinc-900/50 border border-zinc-900 rounded-3xl items-center">
                                <View className="flex-row items-center gap-2 mb-1">
                                    {stat.icon}
                                    <Text className="text-xs font-black italic text-white">{stat.value}</Text>
                                </View>
                                <Text className="text-[8px] font-black uppercase tracking-widest text-zinc-600">{stat.label}</Text>
                            </View>
                        ))}
                    </View>

                    <View className="mb-6 flex-row items-center">
                        <Text className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 italic">Athlete Activities</Text>
                        <View className="h-px flex-1 bg-zinc-900 ml-4" />
                    </View>

                    <View className="gap-4 pb-20">
                        {activities.length === 0 ? (
                            <View className="py-20 items-center opacity-30">
                                <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-white">No activities recorded</Text>
                            </View>
                        ) : (
                            activities.map(activity => (
                                <View key={activity.id} className="p-5 bg-zinc-900/30 border border-zinc-900 rounded-3xl">
                                    <View className="flex-row justify-between items-start mb-3">
                                        <Text className="font-black text-xs text-white uppercase tracking-tight">{activity.content.title}</Text>
                                        <Text className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                                            {new Date(activity.created_at).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <Text className="text-sm text-zinc-500 leading-relaxed mb-4">{activity.content.description}</Text>
                                    <View className="flex-row gap-4">
                                        <TouchableOpacity className="flex-row items-center gap-1.5">
                                            <Heart size={14} color="#3f3f46" />
                                            <Text className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">{activity.likes || 0}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity className="ml-auto">
                                            <Share2 size={14} color="#3f3f46" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

export default PublicProfilePage;
