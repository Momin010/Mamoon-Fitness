
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, SafeAreaView, Image, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import {
    ChevronLeft,
    Target,
    Star,
    Users,
    Search,
    Filter,
    ArrowRight,
    ShieldCheck,
    Zap,
    Loader2,
    Calendar,
    DollarSign,
    Plus,
    Edit3,
    Trash2,
    MessageSquare,
    X
} from 'lucide-react-native';
import { useSupabase } from '../context/SupabaseContext';
import { supabase } from '../lib/supabase';
import { ForgeButton } from '../components';

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

const MentorshipPage: React.FC = () => {
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
        if (!authUser?.id) return;
        try {
            const { data } = await supabase
                .from('coach_profiles')
                .select('id')
                .eq('user_id', authUser.id)
                .single() as { data: any, error: any };

            if (data) setIsCoach(true);
        } catch (err) { }
    };

    const loadMentorships = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('coach_mentorships')
                .select(`*`)
                .eq('is_active', true) as { data: any[] | null, error: any };

            if (error) throw error;

            const coachIds = [...new Set((data || []).map(m => m.coach_id))];
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, name, avatar_url')
                .in('id', coachIds) as { data: any[] | null, error: any };

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
                } as any);

            if (error) throw error;

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
                {/* Header */}
                <View className="h-64 bg-zinc-900 relative">
                    <View className="absolute inset-0 bg-green-500/10" />
                    <View className="p-6 flex-1 justify-between">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-10 h-10 bg-black/50 rounded-full items-center justify-center"
                        >
                            <ChevronLeft size={24} color="white" />
                        </TouchableOpacity>

                        <View>
                            <Text className="text-4xl font-black uppercase tracking-tighter mb-2 text-white">Social Mentorship</Text>
                            <Text className="text-zinc-400 text-sm font-medium">Elevate your game with 1-on-1 coaching.</Text>
                        </View>
                    </View>
                </View>

                <View className="p-6">
                    {/* Actions Bar */}
                    <View className="flex-row items-center justify-between mb-8">
                        <TouchableOpacity className="px-4 py-2 bg-zinc-900 rounded-xl border border-zinc-800 flex-row items-center gap-2">
                            <Filter size={16} color="white" />
                            <Text className="text-white font-bold text-sm">Filter</Text>
                        </TouchableOpacity>
                        {isCoach && (
                            <TouchableOpacity
                                onPress={() => setShowCreateModal(true)}
                                className="bg-green-500 px-4 py-2 rounded-xl flex-row items-center gap-2"
                            >
                                <Plus size={18} color="black" />
                                <Text className="text-black font-bold">Post Program</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Mentorship List */}
                    {isLoading ? (
                        <View className="items-center justify-center py-20">
                            <ActivityIndicator size="large" color="#22c55e" />
                        </View>
                    ) : mentorships.length === 0 ? (
                        <View className="items-center py-20 bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-800">
                            <Target size={48} color="#27272a" />
                            <Text className="text-white text-xl font-bold mt-4">No Active Programs</Text>
                        </View>
                    ) : (
                        <View className="gap-6">
                            {mentorships.map((program) => (
                                <View
                                    key={program.id}
                                    className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6"
                                >
                                    <View className="flex-row items-center gap-3 mb-6">
                                        {program.coach_avatar ? (
                                            <Image source={{ uri: program.coach_avatar }} className="w-10 h-10 rounded-full" />
                                        ) : (
                                            <View className="w-10 h-10 bg-zinc-800 rounded-full items-center justify-center">
                                                <Star size={18} color="#22c55e" />
                                            </View>
                                        )}
                                        <View>
                                            <Text className="text-sm font-black uppercase tracking-widest text-green-500">{program.coach_name}</Text>
                                            <Text className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Pro Coach</Text>
                                        </View>
                                    </View>

                                    <Text className="text-xl font-bold text-white mb-3">{program.title}</Text>
                                    <Text className="text-zinc-400 text-sm mb-6 leading-relaxed">{program.description}</Text>

                                    <View className="gap-3 mb-6">
                                        {program.features.slice(0, 3).map((feature, idx) => (
                                            <View key={idx} className="flex-row items-center gap-2">
                                                <Zap size={14} color="#22c55e" />
                                                <Text className="text-xs text-zinc-300 font-medium">{feature}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    <View className="flex-row items-center justify-between pt-6 border-t border-zinc-800">
                                        <View className="flex-row items-end">
                                            <Text className="text-2xl font-black text-white">${program.price_monthly}</Text>
                                            <Text className="text-zinc-500 text-[10px] uppercase font-bold ml-1 mb-1">/ month</Text>
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
                <View className="h-32" />
            </ScrollView>

            <Modal visible={showCreateModal} transparent animationType="slide">
                <SafeAreaView className="flex-1 bg-black/95">
                    <ScrollView className="flex-1 p-8">
                        <View className="flex-row justify-between items-center mb-8">
                            <Text className="text-2xl font-black uppercase text-white italic">New Program</Text>
                            <TouchableOpacity onPress={() => setShowCreateModal(false)} className="p-2 bg-zinc-800 rounded-full">
                                <X size={20} color="white" />
                            </TouchableOpacity>
                        </View>

                        <View className="gap-6">
                            <View>
                                <Text className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Program Title</Text>
                                <TextInput
                                    value={newTitle}
                                    onChangeText={setNewTitle}
                                    placeholder="e.g. 8-Week Strength Master"
                                    placeholderTextColor="#27272a"
                                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-white font-bold"
                                />
                            </View>
                            <View>
                                <Text className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Monthly Price ($)</Text>
                                <TextInput
                                    value={newPrice}
                                    onChangeText={setNewPrice}
                                    placeholder="99.00"
                                    placeholderTextColor="#27272a"
                                    keyboardType="numeric"
                                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-white font-bold"
                                />
                            </View>
                            <View>
                                <Text className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Description</Text>
                                <TextInput
                                    value={newDesc}
                                    onChangeText={setNewDesc}
                                    placeholder="Describe your program..."
                                    placeholderTextColor="#27272a"
                                    multiline
                                    numberOfLines={4}
                                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-white font-medium h-32"
                                    textAlignVertical="top"
                                />
                            </View>
                            <View>
                                <Text className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Key Features (comma separated)</Text>
                                <TextInput
                                    value={newFeatures}
                                    onChangeText={setNewFeatures}
                                    placeholder="Custom Plans, 24/7 Chat..."
                                    placeholderTextColor="#27272a"
                                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-white font-bold"
                                />
                            </View>

                            <TouchableOpacity
                                onPress={handleCreateMentorship}
                                disabled={isSubmitting || !newTitle || !newDesc}
                                className="bg-green-500 py-5 rounded-2xl items-center mt-8 shadow-lg"
                            >
                                {isSubmitting ? <ActivityIndicator color="black" /> : <Text className="text-black font-black uppercase tracking-widest">Launch Program</Text>}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

export default MentorshipPage;
