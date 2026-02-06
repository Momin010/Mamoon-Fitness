
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Target, Zap, ArrowRight, Users, Trophy, Share2, MessageSquare } from 'lucide-react-native';

const CommunityHub: React.FC = () => {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-black">
            <ScrollView className="flex-1 p-6 pb-32">
                <header className="mb-8 pt-8 px-2">
                    <Text className="text-4xl font-black uppercase tracking-tighter mb-2 italic text-white">Forge <Text className="text-green-500">Hub</Text></Text>
                    <View className="bg-zinc-900 w-fit px-2 py-1 rounded-md self-start">
                        <Text className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Connect & Grow</Text>
                    </View>
                </header>

                <View className="gap-6">
                    {/* Social Feed Card */}
                    <TouchableOpacity
                        onPress={() => router.push('/social')}
                        className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 overflow-hidden"
                    >
                        <View className="absolute -top-10 -right-10 w-40 h-40 bg-green-500/10 blur-3xl rounded-full" />

                        <View className="relative z-10">
                            <View className="w-14 h-14 bg-green-500/20 rounded-2xl items-center justify-center mb-8 border border-green-500/20">
                                <Share2 size={28} color="#22c55e" />
                            </View>

                            <Text className="text-white text-2xl font-black uppercase tracking-tight mb-2">Social Feed</Text>
                            <Text className="text-zinc-400 text-sm mb-6 leading-relaxed max-w-[240px]">
                                Share your progress and get inspired by the community.
                            </Text>

                            <View className="flex-row items-center gap-2">
                                <Text className="text-green-500 font-black uppercase tracking-widest text-[10px]">Open Feed</Text>
                                <ArrowRight size={14} color="#22c55e" />
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Human Mentorship Card */}
                    <TouchableOpacity
                        onPress={() => router.push('/mentorship')}
                        className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 overflow-hidden"
                    >
                        <View className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 blur-3xl rounded-full" />

                        <View className="relative z-10">
                            <View className="w-14 h-14 bg-blue-500/20 rounded-2xl items-center justify-center mb-8 border border-blue-500/20">
                                <Users size={28} color="#3b82f6" />
                            </View>

                            <Text className="text-white text-2xl font-black uppercase tracking-tight mb-2">Expert Mentors</Text>
                            <Text className="text-zinc-400 text-sm mb-6 leading-relaxed max-w-[240px]">
                                Elite human athletes. Custom coaching & 1-on-1 focus.
                            </Text>

                            <View className="flex-row items-center gap-2">
                                <Text className="text-blue-500 font-black uppercase tracking-widest text-[10px]">Discover Pro Coaches</Text>
                                <ArrowRight size={14} color="#3b82f6" />
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Secondary Actions */}
                    <View className="flex-row gap-4 mt-8">
                        <TouchableOpacity
                            onPress={() => router.push('/leaderboard')}
                            className="flex-1 items-center justify-center gap-3 p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl"
                        >
                            <Trophy size={24} color="#eab308" />
                            <Text className="text-white font-bold text-[10px] uppercase tracking-widest">Rankings</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => router.push('/messages')}
                            className="flex-1 items-center justify-center gap-3 p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl"
                        >
                            <MessageSquare size={24} color="#3b82f6" />
                            <Text className="text-white font-bold text-[10px] uppercase tracking-widest">Messages</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Bottom Accent */}
                <View className="mt-auto pt-10 pb-20 opacity-40">
                    <Text className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] text-center">Pure Performance. No AI.</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default CommunityHub;
