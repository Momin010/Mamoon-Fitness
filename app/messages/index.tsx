
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, SafeAreaView, Image, ActivityIndicator, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import {
    ChevronLeft,
    Search,
    MessageSquare,
    Loader2,
    MoreHorizontal,
    Circle,
    Plus
} from 'lucide-react-native';
import { useSupabase } from '../../context/SupabaseContext';
import { supabase } from '../../lib/supabase';

interface Conversation {
    id: string;
    last_message?: string;
    last_message_at?: string;
    unread_count: number;
    other_user: {
        id: string;
        name: string;
        avatar_url?: string;
    };
}

const MessagesPage: React.FC = () => {
    const router = useRouter();
    const { user: authUser } = useSupabase();

    const [isLoading, setIsLoading] = useState(true);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (authUser) {
            loadConversations();
        }
    }, [authUser]);

    const loadConversations = async () => {
        if (!authUser) return;
        try {
            const { data: memberships, error: memError } = await (supabase as any)
                .from('conversation_members')
                .select('conversation_id')
                .eq('user_id', authUser.id);

            if (memError) throw memError;

            const conversationIds = memberships?.map((m: any) => m.conversation_id) || [];

            if (conversationIds.length === 0) {
                setConversations([]);
                setIsLoading(false);
                return;
            }

            const conversationsData: Conversation[] = [];

            for (const convId of conversationIds) {
                const { data: otherMemberRef, error: otherMemberError } = await (supabase as any)
                    .from('conversation_members')
                    .select('user_id')
                    .eq('conversation_id', convId)
                    .neq('user_id', authUser.id)
                    .limit(1)
                    .single();

                if (otherMemberError) continue;

                const { data: profile, error: profError } = await (supabase as any)
                    .from('profiles')
                    .select('id, name, avatar_url')
                    .eq('id', otherMemberRef.user_id)
                    .single();

                if (profError) continue;

                const { data: lastMessage } = await (supabase as any)
                    .from('messages')
                    .select('content, created_at')
                    .eq('conversation_id', convId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                conversationsData.push({
                    id: convId,
                    last_message: lastMessage?.content || 'Started a conversation',
                    last_message_at: lastMessage?.created_at,
                    unread_count: 0,
                    other_user: profile
                });
            }

            conversationsData.sort((a, b) => {
                const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
                const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
                if (timeA === 0 && timeB === 0) return a.id.localeCompare(b.id);
                return timeB - timeA;
            });

            setConversations(conversationsData);
        } catch (err) {
            console.error('Error loading conversations:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredConversations = conversations.filter(c =>
        c.other_user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderConversation = ({ item }: { item: Conversation }) => (
        <TouchableOpacity
            onPress={() => router.push(`/messages/${item.other_user.id}`)}
            className="flex-row items-center gap-4 p-6 border-b border-zinc-950"
        >
            <View className="relative">
                {item.other_user.avatar_url ? (
                    <Image
                        source={{ uri: item.other_user.avatar_url }}
                        className="w-14 h-14 rounded-2xl"
                    />
                ) : (
                    <View className="w-14 h-14 rounded-2xl bg-zinc-900 items-center justify-center border border-zinc-800">
                        <Text className="text-xl font-black text-green-500">{item.other_user.name.charAt(0).toUpperCase()}</Text>
                    </View>
                )}
                {item.unread_count > 0 && (
                    <View className="absolute -top-1 -right-1">
                        <Circle size={14} color="#22c55e" fill="#22c55e" />
                    </View>
                )}
            </View>

            <View className="flex-1">
                <View className="flex-row justify-between items-baseline mb-1">
                    <Text className="font-black text-sm uppercase tracking-tight text-white flex-1 mr-2" numberOfLines={1}>{item.other_user.name}</Text>
                    {item.last_message_at && (
                        <Text className="text-[8px] font-bold text-zinc-600 uppercase">
                            {new Date(item.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    )}
                </View>
                <Text className="text-xs text-zinc-500 font-medium" numberOfLines={1}>
                    {item.last_message}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-black">
            <View className="p-6 border-b border-zinc-900 bg-black">
                <View className="flex-row justify-between items-center mb-6">
                    <View className="flex-row items-center gap-4">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="p-3 bg-zinc-900 rounded-2xl"
                        >
                            <ChevronLeft size={20} color="white" />
                        </TouchableOpacity>
                        <Text className="text-xl font-black uppercase tracking-tighter text-white">Secure Comms</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => router.push('/friends')}
                        className="p-3 bg-green-500 rounded-2xl flex-row items-center gap-2"
                    >
                        <Plus size={18} color="black" strokeWidth={3} />
                    </TouchableOpacity>
                </View>

                <View className="relative">
                    <TextInput
                        placeholder="Search transmission..."
                        placeholderTextColor="#3f3f46"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        className="w-full bg-zinc-900 border border-zinc-900 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white"
                    />
                    <Search size={18} color="#52525b" className="absolute left-4 top-1/2 -mt-[9px]" />
                </View>
            </View>

            <View className="flex-1">
                {isLoading ? (
                    <View className="items-center justify-center py-20">
                        <ActivityIndicator size="large" color="#22c55e" />
                    </View>
                ) : filteredConversations.length === 0 ? (
                    <View className="px-6 py-32 items-center opacity-30">
                        <View className="w-20 h-20 bg-zinc-900 rounded-[2rem] items-center justify-center mb-6">
                            <MessageSquare size={32} color="white" />
                        </View>
                        <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{searchQuery ? 'No matching frequencies' : 'Frequencies silent'}</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredConversations}
                        renderItem={renderConversation}
                        keyExtractor={item => item.id}
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

export default MessagesPage;
