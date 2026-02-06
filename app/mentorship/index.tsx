
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, SafeAreaView, Image, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import {
    ChevronLeft,
    Target,
    Star,
    Plus,
    Filter,
    ArrowRight,
    Zap,
    X
} from 'lucide-react-native';
import { useSupabase } from '../../context/SupabaseContext';
import { supabase } from '../../lib/supabase';
import { ForgeButton } from '../../components/ForgeButton';

interface Mentorship {
    id: string;
    coach_id: string;
    title: string;
    description: string;
    price_monthly: number;
    features: string[];
    is_active: boolean;
    coach_name?: string;
    coach_avatar?: string;
}

export default function MentorshipScreen() {
    const router = useRouter();
    const { user: authUser } = useSupabase();

    const [mentorships, setMentorships] = useState<Mentorship[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCoach, setIsCoach] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Form state
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [newFeatures, setNewFeatures] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!authUser?.id) return;
        checkCoachStatus();
        loadMentorships();
    }, [authUser?.id]);

    const checkCoachStatus = async () => {
        try {
            const { data } = await supabase
                .from('coach_profiles')
                .select('id')
                .eq('user_id', authUser!.id)
                .single();

            if (data) setIsCoach(true);
        } catch (err) {
            // Not a coach
        }
    };

    const loadMentorships = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('coach_mentorships')
                .select('*')
                .eq('is_active', true);

            if (error) throw error;

            const coachIds = [...new Set((data || []).map(m => m.coach_id))];
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, name, avatar_url')
                .in('id', coachIds);

            const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

            const transformed = (data || []).map(m => ({
                ...m,
                coach_name: profilesMap.get(m.coach_id)?.name || 'Elite Coach',
                coach_avatar: profilesMap.get(m.coach_id)?.avatar_url
            }));

            setMentorships(transformed);
        } catch (err) {
            console.error('Error loading mentorships:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateMentorship = async () => {
        if (!authUser || !newTitle || !newDesc) return;

        setIsSubmitting(true);
        try {
            const featuresArray = newFeatures.split(',').map(f => f.trim()).filter(f => f !== '');

            const { error } = await supabase
                .from('coach_mentorships')
                .insert({
                    coach_id: authUser.id,
                    title: newTitle,
                    description: newDesc,
                    price_monthly: parseFloat(newPrice) || 0,
                    features: featuresArray,
                    is_active: true
                });

            if (error) throw error;

            await supabase.from('social_activities').insert({
                user_id: authUser.id,
                type: 'mentorship',
                content: {
                    title: `New Mentorship: ${newTitle}`,
                    description: `I just launched a new mentorship program: ${newDesc.substring(0, 100)}...`
                }
            });

            setShowCreateModal(false);
            loadMentorships();
            setNewTitle('');
            setNewDesc('');
            setNewPrice('');
            setNewFeatures('');

        } catch (err) {
            console.error('Error creating mentorship:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-black">
            <ScrollView className="flex-1">
                {/* Header Section */}
                <View className="relative h-64 overflow-hidden">
                    <View className="absolute inset-0 bg-green-500/20" />
                    <View className="p-6 h-full justify-between">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-10 h-10 bg-black/50 rounded-full items-center justify-center"
                        >
                            <ChevronLeft size={24} color="white" />
                        </TouchableOpacity>

                        <View>
                            <Text className="text-white text-4xl font-black uppercase tracking-tighter mb-2">Social Mentorship</Text>
                            <Text className="text-zinc-400 max-w-md text-sm font-medium">Elevate your game with 1-on-1 coaching from experts.</Text>
                        </View>
                    </View>
                </View>

                <View className="p-6">
                    <View className="flex-row items-center justify-between mb-8">
                        <TouchableOpacity className="px-4 py-2 bg-zinc-900 rounded-xl border border-zinc-800 flex-row items-center gap-2">
                            <Filter size={16} color="#71717a" />
                            <Text className="text-zinc-400 text-sm font-bold">Filter</Text>
                        </TouchableOpacity>
                        {isCoach && (
                            <ForgeButton
                                onPress={() => setShowCreateModal(true)}
                                leftIcon={<Plus size={18} color="black" />}
                            >
                                Post Program
                            </ForgeButton>
                        )}
                    </View>

                    {isLoading ? (
                        <View className="py-20 items-center">
                            <ActivityIndicator color="#22c55e" size="large" />
                            <Text className="mt-4 text-zinc-500 font-medium tracking-widest uppercase text-xs">Fetching Programs...</Text>
                        </View>
                    ) : mentorships.length === 0 ? (
                        <View className="text-center py-20 bg-zinc-950 rounded-3xl border border-dashed border-zinc-800 items-center">
                            <Target size={48} color="#3f3f46" className="mb-4" />
                            <Text className="text-white text-xl font-bold mb-2">No Active Programs</Text>
                            <Text className="text-zinc-500 text-sm text-center px-6">Be the first coach to offer expert guidance.</Text>
                        </View>
                    ) : (
                        <View className="gap-6">
                            {mentorships.map((program) => (
                                <View
                                    key={program.id}
                                    className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden"
                                >
                                    <View className="absolute top-0 right-0 p-4 opacity-10">
                                        <Target size={80} color="white" />
                                    </View>

                                    <View className="flex-row items-center gap-3 mb-6">
                                        {program.coach_avatar ? (
                                            <Image source={{ uri: program.coach_avatar }} className="w-10 h-10 rounded-full border border-zinc-700" />
                                        ) : (
                                            <View className="w-10 h-10 bg-zinc-800 rounded-full items-center justify-center border border-zinc-700">
                                                <Star size={18} color="#22c55e" />
                                            </View>
                                        )}
                                        <View>
                                            <Text className="text-sm font-black uppercase tracking-widest text-green-500">{program.coach_name}</Text>
                                            <Text className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Certified Pro Coach</Text>
                                        </View>
                                    </View>

                                    <Text className="text-white text-xl font-bold mb-3">{program.title}</Text>
                                    <Text className="text-zinc-400 text-sm mb-6 leading-relaxed" numberOfLines={2}>{program.description}</Text>

                                    <View className="space-y-3 mb-6">
                                        {program.features.slice(0, 3).map((feature, idx) => (
                                            <View key={idx} className="flex-row items-center gap-2">
                                                <Zap size={14} color="#22c55e" />
                                                <Text className="text-zinc-300 text-xs font-medium">{feature}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    <View className="flex-row items-center justify-between mt-auto pt-6 border-t border-zinc-800">
                                        <View className="flex-row items-end">
                                            <Text className="text-2xl font-black text-white">${program.price_monthly}</Text>
                                            <Text className="text-zinc-500 text-[10px] uppercase font-bold ml-1 mb-1">/ mo</Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => router.push(`/messages/${program.coach_id}`)}
                                            className="bg-white px-6 py-2.5 rounded-xl flex-row items-center gap-2"
                                        >
                                            <Text className="text-black font-bold text-sm">Contact</Text>
                                            <ArrowRight size={16} color="black" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            <Modal visible={showCreateModal} animationType="slide" transparent>
                <View className="flex-1 bg-black/95 justify-center p-6">
                    <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                        <View className="flex-row justify-between items-center mb-8">
                            <View>
                                <Text className="text-white text-2xl font-black uppercase tracking-tighter">New Mentorship</Text>
                                <Text className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Forging Next-Gen Athletes</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowCreateModal(false)} className="bg-zinc-800 p-2 rounded-full">
                                <X size={20} color="white" />
                            </TouchableOpacity>
                        </View>

                        <View className="space-y-4">
                            <View>
                                <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 ml-1">Program Title</Text>
                                <TextInput
                                    value={newTitle}
                                    onChangeText={setNewTitle}
                                    placeholder="e.g. 8-Week Strength Master"
                                    placeholderTextColor="#3f3f46"
                                    className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white"
                                />
                            </View>

                            <View>
                                <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 ml-1">Monthly Price ($)</Text>
                                <TextInput
                                    value={newPrice}
                                    onChangeText={setNewPrice}
                                    placeholder="99.00"
                                    placeholderTextColor="#3f3f46"
                                    keyboardType="numeric"
                                    className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white"
                                />
                            </View>

                            <View>
                                <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 ml-1">Description</Text>
                                <TextInput
                                    value={newDesc}
                                    onChangeText={setNewDesc}
                                    placeholder="Describe your coaching..."
                                    placeholderTextColor="#3f3f46"
                                    multiline
                                    className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white h-24"
                                    style={{ textAlignVertical: 'top' }}
                                />
                            </View>

                            <View>
                                <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 ml-1">Features (comma separated)</Text>
                                <TextInput
                                    value={newFeatures}
                                    onChangeText={setNewFeatures}
                                    placeholder="Custom Plans, 24/7 Chat"
                                    placeholderTextColor="#3f3f46"
                                    className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white"
                                />
                            </View>

                            <View className="pt-4 gap-3">
                                <TouchableOpacity
                                    onPress={handleCreateMentorship}
                                    disabled={isSubmitting || !newTitle || !newDesc}
                                    className={`py-4 bg-green-500 rounded-xl items-center ${isSubmitting || !newTitle || !newDesc ? 'opacity-50' : ''}`}
                                >
                                    <Text className="text-black font-black uppercase tracking-widest text-xs">{isSubmitting ? 'Launching...' : 'Launch Program'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setShowCreateModal(false)}
                                    className="py-4 bg-zinc-800 rounded-xl items-center"
                                >
                                    <Text className="text-white font-bold uppercase tracking-widest text-xs">Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
