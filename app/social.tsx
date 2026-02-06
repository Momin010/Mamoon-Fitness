
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, FlatList, Image, SafeAreaView, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Heart,
  MessageCircle,
  Share2,
  Trophy,
  Flame,
  Utensils,
  CheckCircle2,
  Clock,
  Loader2,
  MoreHorizontal,
  Dumbbell,
  Plus,
  Send,
  X,
  Target,
  Zap,
  Camera,
  Image as ImageIcon
} from 'lucide-react-native';
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '../lib/supabase';
import { ForgeButton } from '../components';

interface Activity {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  type: 'workout' | 'meal' | 'task' | 'achievement' | 'level_up' | 'post' | 'mentorship';
  content: {
    title: string;
    description: string;
    metadata?: Record<string, any>;
  };
  media_url?: string;
  likes: number;
  comments: number;
  created_at: string;
  is_liked_by_me: boolean;
}

const SocialFeedPage: React.FC = () => {
  const router = useRouter();
  const { user: authUser } = useSupabase();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'friends'>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Posting state
  const [isPosting, setIsPosting] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  useEffect(() => {
    if (!authUser) return;
    loadActivities();
  }, [authUser, activeTab, page]);

  const loadActivities = async () => {
    if (!authUser) return;

    if (page === 1) setIsLoading(true);
    try {
      // Get following IDs if filtering by following
      let followingIds: string[] = [];
      if (activeTab === 'friends') {
        const { data: following } = await (supabase as any)
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', authUser.id);

        followingIds = following?.map((f: any) => f.following_id) || [];
      }

      // Fetch activities
      let activitiesQuery = (supabase as any)
        .from('social_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .range((page - 1) * 20, page * 20 - 1);

      if (activeTab === 'friends') {
        activitiesQuery = activitiesQuery.in('user_id', [authUser.id, ...followingIds]);
      }

      const { data: activitiesData, error: activitiesError } = await activitiesQuery as { data: any[] | null, error: any };

      if (activitiesError) throw activitiesError;

      // Get unique user IDs from activities
      const userIds = [...new Set((activitiesData || []).map(a => a.user_id))];

      if (userIds.length === 0) {
        setActivities(prev => page === 1 ? [] : prev);
        setHasMore(false);
        return;
      }

      // Fetch user profiles separately
      const { data: profilesData, error: profilesError } = await (supabase as any)
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', userIds) as { data: any[] | null, error: any };

      if (profilesError) throw profilesError;

      // Create a map for quick profile lookup
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      // Fetch likes counts for activities
      const activityIds = (activitiesData || []).map(a => a.id);

      let likesCountMap = new Map<string, number>();
      let userLikedSet = new Set<string>();

      if (activityIds.length > 0) {
        const { data: likesData, error: likesError } = await (supabase as any)
          .from('social_likes')
          .select('activity_id')
          .in('activity_id', activityIds) as { data: any[] | null, error: any };

        if (likesError) throw likesError;

        likesData?.forEach(like => {
          const count = likesCountMap.get(like.activity_id) || 0;
          likesCountMap.set(like.activity_id, count + 1);
        });

        // Check which activities are liked by current user
        const { data: userLikesData, error: userLikesError } = await (supabase as any)
          .from('social_likes')
          .select('activity_id')
          .eq('user_id', authUser.id)
          .in('activity_id', activityIds) as { data: any[] | null, error: any };

        if (userLikesError) throw userLikesError;
        userLikedSet = new Set(userLikesData?.map(l => l.activity_id) || []);
      }

      // Merge data in code
      const transformed: Activity[] = (activitiesData || []).map((a: any) => {
        const profile = profilesMap.get(a.user_id) as any;
        return {
          id: a.id,
          user_id: a.user_id,
          user_name: profile?.name || 'Unknown User',
          user_avatar: profile?.avatar_url,
          type: a.type,
          content: a.content,
          media_url: a.media_url,
          likes: likesCountMap.get(a.id) || 0,
          comments: a.comments || 0,
          created_at: a.created_at,
          is_liked_by_me: userLikedSet.has(a.id)
        };
      });

      setActivities(prev => page === 1 ? transformed : [...prev, ...transformed]);
      setHasMore(transformed.length === 20);
    } catch (err) {
      console.error('Error loading activities:', err);
      if (page === 1) setActivities([]);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!authUser || (!postContent.trim() && !postTitle.trim())) return;

    setIsSubmitLoading(true);
    try {
      const { error } = await (supabase as any)
        .from('social_activities')
        .insert({
          user_id: authUser.id,
          type: 'post',
          content: {
            title: postTitle || 'Update',
            description: postContent
          }
        });

      if (error) throw error;

      setPostTitle('');
      setPostContent('');
      setIsPosting(false);
      setPage(1);
      loadActivities();
    } catch (err) {
      console.error('Error creating post:', err);
      Alert.alert('Error sharing post');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleLike = async (activityId: string, isLiked: boolean) => {
    if (!authUser) return;

    try {
      if (isLiked) {
        await (supabase as any)
          .from('social_likes')
          .delete()
          .eq('activity_id', activityId)
          .eq('user_id', authUser.id);
      } else {
        await (supabase as any)
          .from('social_likes')
          .insert({ activity_id: activityId, user_id: authUser.id });
      }

      setActivities(prev => prev.map(a =>
        a.id === activityId
          ? { ...a, likes: a.likes + (isLiked ? -1 : 1), is_liked_by_me: !isLiked }
          : a
      ));
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'workout': return <Dumbbell size={18} color="#22c55e" />;
      case 'meal': return <Utensils size={18} color="#f97316" />;
      case 'task': return <CheckCircle2 size={18} color="#3b82f6" />;
      case 'achievement': return <Trophy size={18} color="#eab308" />;
      case 'level_up': return <Flame size={18} color="#a855f7" />;
      case 'post': return <Send size={18} color="#71717a" />;
      case 'mentorship': return <Target size={18} color="#ef4444" />;
      default: return <Zap size={18} color="#22c55e" />;
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'workout': return 'bg-green-500/10 border-green-500/30';
      case 'meal': return 'bg-orange-500/10 border-orange-500/30';
      case 'task': return 'bg-blue-500/10 border-blue-500/30';
      case 'achievement': return 'bg-yellow-500/10 border-yellow-500/30';
      case 'level_up': return 'bg-purple-500/10 border-purple-500/30';
      case 'post': return 'bg-zinc-800/50 border-zinc-700/50';
      case 'mentorship': return 'bg-red-500/10 border-red-500/30';
      default: return 'bg-zinc-800';
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderActivity = ({ item }: { item: Activity }) => (
    <View className="p-6 border-b border-zinc-950">
      <View className="flex-row items-center gap-4 mb-4">
        <TouchableOpacity
          onPress={() => router.push(`/profile/${item.user_id}`)}
          className="flex-row items-center gap-4 flex-1"
        >
          {item.user_avatar ? (
            <Image
              source={{ uri: item.user_avatar }}
              className="w-12 h-12 rounded-2xl"
            />
          ) : (
            <View className="w-12 h-12 rounded-2xl bg-zinc-900 items-center justify-center border border-zinc-800">
              <Text className="text-lg font-black text-green-500">
                {item.user_name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View className="flex-1">
            <Text className="font-black text-sm uppercase tracking-tight text-white">{item.user_name}</Text>
            <Text className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
              {formatTimeAgo(item.created_at)}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View className={`p-6 rounded-[2.5rem] border ${getActivityColor(item.type)} mb-4`}>
        <View className="flex-row items-start gap-4">
          <View className="p-2 bg-black/20 rounded-xl">
            {getActivityIcon(item.type)}
          </View>
          <View className="flex-1">
            <Text className="font-black text-xs text-white uppercase tracking-widest mb-1">{item.content.title}</Text>
            <Text className="text-sm text-zinc-400 font-medium leading-relaxed mb-4">{item.content.description}</Text>
            {item.media_url && (
              <Image source={{ uri: item.media_url }} className="w-full h-48 rounded-2xl bg-black" resizeMode="cover" />
            )}
          </View>
        </View>
      </View>

      <View className="flex-row items-center gap-8">
        <TouchableOpacity
          onPress={() => handleLike(item.id, item.is_liked_by_me)}
          className="flex-row items-center gap-2"
        >
          <Heart
            size={18}
            color={item.is_liked_by_me ? '#ef4444' : '#52525b'}
            fill={item.is_liked_by_me ? '#ef4444' : 'transparent'}
          />
          <Text className={`text-[10px] font-black uppercase ${item.is_liked_by_me ? 'text-red-500' : 'text-zinc-600'}`}>{item.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-row items-center gap-2">
          <MessageCircle size={18} color="#52525b" />
          <Text className="text-[10px] font-black text-zinc-600 uppercase">{item.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity className="ml-auto">
          <Share2 size={18} color="#52525b" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-black">
      <header className="flex-row items-center gap-4 p-6 border-b border-zinc-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2 bg-zinc-900 rounded-full">
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-xl font-black uppercase tracking-tighter text-white">Forge Feed</Text>
      </header>

      <View className="flex-row border-b border-zinc-800">
        <TouchableOpacity
          onPress={() => { setActiveTab('all'); setPage(1); }}
          className={`flex-1 items-center py-4 ${activeTab === 'all' ? 'border-b-2 border-green-500' : ''}`}
        >
          <Text className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'all' ? 'text-green-500' : 'text-zinc-500'}`}>Discover</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { setActiveTab('friends'); setPage(1); }}
          className={`flex-1 items-center py-4 ${activeTab === 'friends' ? 'border-b-2 border-green-500' : ''}`}
        >
          <Text className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'friends' ? 'text-green-500' : 'text-zinc-500'}`}>Following</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activities}
        renderItem={renderActivity}
        keyExtractor={item => item.id}
        onEndReached={() => hasMore && setPage(p => p + 1)}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color="#22c55e" className="mt-20" />
          ) : (
            <View className="items-center py-20 px-6">
              <Share2 size={48} color="#27272a" />
              <Text className="text-white text-lg font-bold mt-6">The Silence of the Forge</Text>
              <Text className="text-zinc-500 text-center mt-2 uppercase tracking-widest text-[10px]">Be the first to ignite the discussion</Text>
            </View>
          )
        }
        ListFooterComponent={hasMore && activities.length > 0 ? <ActivityIndicator size="small" color="#22c55e" className="py-8" /> : null}
      />

      <TouchableOpacity
        onPress={() => setIsPosting(true)}
        className="absolute bottom-32 right-6 w-16 h-16 bg-green-500 rounded-2xl items-center justify-center shadow-lg"
      >
        <Plus size={32} color="black" strokeWidth={3} />
      </TouchableOpacity>

      <Modal visible={isPosting} transparent animationType="slide">
        <SafeAreaView className="flex-1 bg-black/95">
          <View className="flex-1 p-8">
            <View className="flex-row justify-between items-center mb-12">
              <Text className="text-2xl font-black uppercase italic text-white">Ignite Post</Text>
              <TouchableOpacity onPress={() => setIsPosting(false)} className="p-3 bg-zinc-800 rounded-2xl">
                <X size={20} color="white" />
              </TouchableOpacity>
            </View>

            <View className="gap-6">
              <View>
                <Text className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Title</Text>
                <TextInput
                  value={postTitle}
                  onChangeText={setPostTitle}
                  placeholder="Headline..."
                  placeholderTextColor="#27272a"
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white font-bold"
                />
              </View>
              <View>
                <Text className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Message</Text>
                <TextInput
                  value={postContent}
                  onChangeText={setPostContent}
                  placeholder="What's on your mind?"
                  placeholderTextColor="#27272a"
                  multiline
                  numberOfLines={4}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-5 text-white font-medium h-32"
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                onPress={handleCreatePost}
                disabled={isSubmitLoading || (!postContent.trim() && !postTitle.trim())}
                className="bg-green-500 py-5 rounded-2xl flex-row items-center justify-center gap-2 mt-8"
              >
                {isSubmitLoading ? <ActivityIndicator color="black" /> : <Send size={20} color="black" />}
                <Text className="text-black font-black uppercase tracking-widest">Post to Feed</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default SocialFeedPage;
