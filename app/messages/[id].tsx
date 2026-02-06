
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, SafeAreaView, Image, ActivityIndicator, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    ChevronLeft,
    Send,
    Loader2,
    MoreHorizontal,
    Image as ImageIcon,
    Camera,
    Check,
    CheckCheck,
    X
} from 'lucide-react-native';
import { useSupabase } from '../../context/SupabaseContext';
import { supabase } from '../../lib/supabase';

interface Message {
    id: string;
    sender_id: string;
    content: string;
    media_url?: string;
    media_type?: string;
    created_at: string;
    is_read: boolean;
}

interface OtherUser {
    id: string;
    name: string;
    avatar_url?: string;
}

const ChatPage: React.FC = () => {
    const { id: otherUserId } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user: authUser } = useSupabase();

    const [isLoading, setIsLoading] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);

    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (authUser && otherUserId) {
            initChat();
        }
    }, [authUser, otherUserId]);

    useEffect(() => {
        if (conversationId) {
            const subscription = (supabase as any)
                .channel(`chat_${conversationId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `conversation_id=eq.${conversationId}`
                    },
                    (payload: any) => {
                        setMessages(prev => [...prev, payload.new]);
                    }
                )
                .subscribe();

            return () => {
                subscription.unsubscribe();
            };
        }
    }, [conversationId]);

    const initChat = async () => {
        if (!authUser || !otherUserId) return;
        try {
            const { data: profile, error: profError } = await (supabase as any)
                .from('profiles')
                .select('id, name, avatar_url')
                .eq('id', otherUserId)
                .single();

            if (profError) throw profError;
            setOtherUser(profile);

            const { data: convId, error: convError } = await (supabase as any)
                .rpc('create_chat_with_user', { other_user_id: otherUserId });

            if (convError || !convId) throw convError || new Error('Failed to establish frequency');

            setConversationId(convId);

            const { data: msgs, error: msgsError } = await (supabase as any)
                .from('messages')
                .select('*')
                .eq('conversation_id', convId)
                .order('created_at', { ascending: true });

            if (msgsError) throw msgsError;
            setMessages(msgs || []);
        } catch (err) {
            console.error('Error initializing chat:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !conversationId || !authUser || isSending) return;

        setIsSending(true);
        const content = newMessage.trim();
        setNewMessage('');

        try {
            const { error } = await (supabase as any)
                .from('messages')
                .insert({
                    conversation_id: conversationId,
                    sender_id: authUser.id,
                    content: content,
                });

            if (error) throw error;
        } catch (err) {
            console.error('Error sending message:', err);
            setNewMessage(content);
        } finally {
            setIsSending(false);
        }
    };

    const renderMessage = ({ item, index }: { item: Message, index: number }) => {
        const isMe = item.sender_id === authUser?.id;
        const showDate = index === 0 ||
            new Date(item.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() > 3600000;

        return (
            <View className="mb-4">
                {showDate && (
                    <View className="items-center my-4">
                        <View className="bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                            <Text className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                                {new Date(item.created_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                    </View>
                )}
                <View className={`flex-row ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <View className={`max-w-[80%] px-5 py-4 rounded-[2rem] ${isMe
                            ? 'bg-white rounded-tr-none'
                            : 'bg-zinc-900 border border-zinc-800 rounded-tl-none'
                        }`}>
                        {item.media_url && (
                            <Image source={{ uri: item.media_url }} className="w-full h-40 rounded-2xl mb-3" resizeMode="cover" />
                        )}
                        <Text className={`text-sm font-medium leading-relaxed ${isMe ? 'text-black' : 'text-white'}`}>
                            {item.content}
                        </Text>
                        {isMe && (
                            <View className="flex-row justify-end mt-1">
                                {item.is_read ? (
                                    <CheckCheck size={12} color="#3b82f6" />
                                ) : (
                                    <Check size={12} color="#71717a" />
                                )}
                            </View>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-black items-center justify-center">
                <ActivityIndicator size="large" color="#22c55e" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-black">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                {/* Header */}
                <View className="p-4 border-b border-zinc-900 bg-black flex-row items-center justify-between">
                    <View className="flex-row items-center gap-4">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="p-2 bg-zinc-900 rounded-xl"
                        >
                            <ChevronLeft size={20} color="white" />
                        </TouchableOpacity>
                        <View className="flex-row items-center gap-3">
                            {otherUser?.avatar_url ? (
                                <Image source={{ uri: otherUser.avatar_url }} className="w-10 h-10 rounded-xl" />
                            ) : (
                                <View className="w-10 h-10 rounded-xl bg-zinc-800 items-center justify-center border border-zinc-700">
                                    <Text className="text-sm font-black text-green-500">{otherUser?.name.charAt(0).toUpperCase()}</Text>
                                </View>
                            )}
                            <View>
                                <Text className="text-sm font-black uppercase tracking-tight text-white">{otherUser?.name}</Text>
                                <View className="flex-row items-center gap-1.5">
                                    <View className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                    <Text className="text-[8px] font-black text-green-500 uppercase tracking-widest">Active Tactical</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity className="p-2 bg-zinc-900 rounded-xl">
                        <MoreHorizontal size={20} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Messages */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item, index) => item.id || index.toString()}
                    contentContainerStyle={{ padding: 24 }}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                {/* Input */}
                <View className="p-6 bg-black border-t border-zinc-900 flex-row gap-3">
                    <TouchableOpacity
                        className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 items-center justify-center"
                    >
                        <Camera size={20} color="#71717a" />
                    </TouchableOpacity>
                    <View className="flex-1 relative">
                        <TextInput
                            value={newMessage}
                            onChangeText={setNewMessage}
                            placeholder="Transmit intelligence..."
                            placeholderTextColor="#3f3f46"
                            className="w-full bg-zinc-900 border border-zinc-900 rounded-3xl px-6 py-4 text-sm text-white font-medium"
                        />
                        <TouchableOpacity
                            onPress={handleSendMessage}
                            disabled={!newMessage.trim() || isSending}
                            className={`absolute right-2 top-2 p-3 rounded-2xl ${newMessage.trim() ? 'bg-green-500' : 'bg-zinc-800'}`}
                        >
                            {isSending ? <ActivityIndicator size="small" color="black" /> : <Send size={18} color={newMessage.trim() ? 'black' : '#52525b'} />}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ChatPage;
