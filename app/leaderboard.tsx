
import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Share2, TrendingUp, Settings, Plus, BarChart3 } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';

const LeaderboardPage: React.FC = () => {
  const router = useRouter();
  const { user, friends, workoutHistory, meals } = useApp();
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Calculate user's tier based on level
  const getUserTier = (level: number): string => {
    if (level >= 80) return 'LEGENDARY';
    if (level >= 60) return 'ELITE';
    if (level >= 40) return 'MASTER';
    if (level >= 20) return 'VETERAN';
    return 'NOVICE';
  };

  const userTier = getUserTier(user.level);
  const xpToNextLevel = (user.level * 1000) - (user.xp % 1000);

  // Build leaderboard with real friends from settings
  const allStandings = useMemo(() => {
    const standings = [
      ...friends,
      {
        id: 'me',
        name: user.name,
        xp: user.xp,
        level: user.level,
        tier: userTier,
        avatar: user.avatar || ''
      }
    ].sort((a, b) => b.xp - a.xp);
    return standings;
  }, [friends, user, userTier]);

  const myRank = allStandings.findIndex(f => f.id === 'me') + 1;

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'LEGENDARY': return '#facc15';
      case 'ELITE': return '#c084fc';
      case 'MASTER': return '#60a5fa';
      case 'VETERAN': return '#4ade80';
      default: return '#71717a';
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#facc15';
    if (rank === 2) return '#d1d5db';
    if (rank === 3) return '#d97706';
    return '#3f3f46';
  };

  // Calculate weekly XP gain
  const weeklyXpGain = useMemo(() => {
    const lastWeek = workoutHistory
      .filter(w => w.date > Date.now() - 7 * 24 * 60 * 60 * 1000)
      .reduce((sum, w) => sum + w.totalXp, 0);
    return lastWeek;
  }, [workoutHistory]);

  return (
    <SafeAreaView className="flex-1 bg-black">
      <header className="flex-row justify-between items-center p-6">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 bg-zinc-900 rounded-full"
        >
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-zinc-500 uppercase text-xs font-black tracking-widest">Progress</Text>
        <TouchableOpacity
          onPress={() => router.push('/settings')}
          className="p-2 bg-zinc-900 rounded-full"
        >
          <Settings size={20} color="white" />
        </TouchableOpacity>
      </header>

      <ScrollView className="flex-1 p-6">
        <View className="items-center mb-8">
            <Text className="text-6xl font-black tracking-tighter mb-2 text-white">Level {user.level}</Text>
            <Text style={{ color: getTierColor(userTier) }} className="uppercase text-xs font-bold tracking-widest">
            {userTier} Tier • {xpToNextLevel.toLocaleString()} XP to next
            </Text>
        </View>

        <View className="flex-row gap-4 mb-8">
            <View className="flex-1 p-4 bg-zinc-900 rounded-2xl items-center border border-zinc-800">
            <Text className="text-3xl font-black text-green-500">{user.xp.toLocaleString()}</Text>
            <Text className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Total XP</Text>
            </View>
            <View className="flex-1 p-4 bg-zinc-900 rounded-2xl items-center border border-zinc-800">
            <Text className="text-3xl font-black text-blue-500">+{weeklyXpGain}</Text>
            <Text className="text-xs text-zinc-500 uppercase tracking-wider mt-1">This Week</Text>
            </View>
        </View>

        <View className="mb-12">
            <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-black tracking-tighter uppercase text-white">Leaderboard</Text>
                <View className="flex-row items-center gap-2">
                    <Text className="text-green-500 uppercase text-[10px] font-black tracking-widest">
                    Rank #{myRank}
                    </Text>
                    <TouchableOpacity
                    onPress={() => router.push('/settings')}
                    className="p-2 bg-zinc-900 rounded-lg"
                    >
                    <Plus size={16} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            {allStandings.length === 1 ? (
            <View className="items-center py-12">
                <Text className="text-zinc-500 text-center mb-4 font-bold">No friends added yet</Text>
                <TouchableOpacity
                onPress={() => router.push('/settings')}
                className="px-6 py-4 bg-green-500 rounded-xl"
                >
                <Text className="text-black font-black uppercase text-xs tracking-widest">Add Friends</Text>
                </TouchableOpacity>
            </View>
            ) : (
            <View className="gap-3">
                {allStandings.map((friend, idx) => (
                <View
                    key={friend.id}
                    className={`flex-row items-center gap-4 p-4 rounded-3xl ${
                    friend.id === 'me' ? 'bg-zinc-900 border border-green-500/30' : 'bg-zinc-900/50 border border-transparent'
                    }`}
                >
                    <Text style={{ color: getRankColor(idx + 1) }} className="w-8 font-black text-lg">
                    {(idx + 1).toString().padStart(2, '0')}
                    </Text>
                    <View className="relative">
                    {friend.avatar ? (
                        <Image
                        source={{ uri: friend.avatar }}
                        className="w-12 h-12 rounded-full border-2 border-zinc-800"
                        />
                    ) : (
                        <View className="w-12 h-12 rounded-full bg-green-500 items-center justify-center">
                            <Text className="text-black font-black text-[10px]">YOU</Text>
                        </View>
                    )}
                    {idx < 3 && (
                        <View style={{ backgroundColor: getRankColor(idx+1) }} className="absolute -top-1 -right-1 w-5 h-5 rounded-full items-center justify-center">
                            <Text className="text-black text-[10px] font-black">{idx + 1}</Text>
                        </View>
                    )}
                    </View>
                    <View className="flex-1 ml-1">
                    <Text className="font-bold text-sm text-white">{friend.name}</Text>
                    <Text style={{ color: getTierColor(friend.tier) }} className="text-[10px] font-black uppercase tracking-widest">
                        {friend.tier}
                    </Text>
                    </View>
                    <View className="items-end">
                    <Text className="font-black text-sm text-white">{friend.xp.toLocaleString()} XP</Text>
                    <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        LVL {friend.level}
                    </Text>
                    </View>
                </View>
                ))}
            </View>
            )}
        </View>
        <View className="h-24" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default LeaderboardPage;
