
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  CheckCircle,
  Star,
  Users,
  Trophy,
  Upload,
  Loader2,
  AlertCircle,
  Clock,
  XCircle,
  MessageSquare,
  X
} from 'lucide-react-native';
import { useSupabase } from '../../context/SupabaseContext';
import { supabase } from '../../lib/supabase';
import { ForgeButton, ForgeSlider } from '../../components';

interface CoachApplication {
  bio: string;
  specialties: string[];
  experience: number;
  certifications: string[];
  socialLinks: {
    instagram?: string;
    youtube?: string;
    website?: string;
  };
}

const SPECIALTIES_OPTIONS = [
  'Strength Training',
  'Weight Loss',
  'Bodybuilding',
  'CrossFit',
  'Yoga',
  'Nutrition',
  'HIIT',
  'Powerlifting',
  'Calisthenics',
  'Running'
];

interface ExistingApplication {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const CoachSignupPage: React.FC = () => {
  const router = useRouter();
  const { user: authUser } = useSupabase();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [existingApp, setExistingApp] = useState<ExistingApplication | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  const [application, setApplication] = useState<CoachApplication>({
    bio: '',
    specialties: [],
    experience: 1,
    certifications: [],
    socialLinks: {}
  });

  const [newCertification, setNewCertification] = useState('');

  useEffect(() => {
    const checkExistingApplication = async () => {
      if (!authUser) {
        setIsChecking(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('coach_applications')
          .select('id, status, admin_notes, created_at, updated_at')
          .eq('user_id', authUser.id)
          .single();

        if (data) setExistingApp(data as ExistingApplication);
      } catch (err) { } finally {
        setIsChecking(false);
      }
    };

    checkExistingApplication();
  }, [authUser]);

  const toggleSpecialty = (specialty: string) => {
    setApplication(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const addCertification = () => {
    if (newCertification.trim()) {
      setApplication(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification.trim()]
      }));
      setNewCertification('');
    }
  };

  const removeCertification = (index: number) => {
    setApplication(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!authUser) {
      setError('You must be logged in to apply');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { error: submitError } = await supabase
        .from('coach_applications')
        .insert({
          user_id: authUser.id,
          bio: application.bio,
          specialties: application.specialties,
          experience_years: application.experience,
          certifications: application.certifications,
          social_links: application.socialLinks,
          status: 'pending'
        } as any);

      if (submitError) throw submitError;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return application.bio.length >= 50;
      case 2: return application.specialties.length > 0;
      case 3: return true;
      default: return false;
    }
  };

  if (isChecking) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#22c55e" />
        <Text className="mt-4 text-zinc-400">Checking status...</Text>
      </SafeAreaView>
    );
  }

  if (existingApp && !success) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center p-6">
        <View className="items-center max-w-md w-full">
            <View className={`w-24 h-24 bg-zinc-900 rounded-full items-center justify-center mb-6 border border-zinc-800`}>
                {existingApp.status === 'approved' ? <CheckCircle size={48} color="#22c55e" /> : existingApp.status === 'rejected' ? <XCircle size={48} color="#ef4444" /> : <Clock size={48} color="#eab308" />}
            </View>
            <Text className="text-2xl font-bold text-white mb-4 text-center">
                {existingApp.status === 'approved' ? 'Application Approved!' : existingApp.status === 'rejected' ? 'Application Not Approved' : 'Under Review'}
            </Text>
            <Text className="text-zinc-400 mb-8 text-center px-4">
                {existingApp.status === 'approved' ? 'Congratulations! You are now a coach.' : existingApp.status === 'rejected' ? 'Unfortunately, your application was not approved.' : 'Your application is currently being reviewed.'}
            </Text>

            <TouchableOpacity
                onPress={() => router.replace('/(tabs)/settings')}
                className="bg-zinc-900 w-full py-5 rounded-2xl items-center border border-zinc-800"
            >
                <Text className="text-white font-bold uppercase tracking-widest">Back to Settings</Text>
            </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (success) {
    return (
        <SafeAreaView className="flex-1 bg-black items-center justify-center p-6">
            <View className="items-center max-w-md w-full">
                <CheckCircle size={64} color="#22c55e" className="mb-6" />
                <Text className="text-2xl font-bold text-white mb-4">Submitted!</Text>
                <Text className="text-zinc-400 mb-12 text-center px-4">We'll review your application and get back to you soon.</Text>
                <TouchableOpacity
                    onPress={() => router.replace('/(tabs)/settings')}
                    className="bg-green-500 w-full py-5 rounded-2xl items-center"
                >
                    <Text className="text-black font-black uppercase tracking-widest">Back to Settings</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <header className="flex-row items-center gap-4 p-6 border-b border-zinc-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2 bg-zinc-900 rounded-full">
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
        <View>
          <Text className="text-xl font-bold text-white">Become a Coach</Text>
          <Text className="text-xs text-zinc-500">Step {step} of 3</Text>
        </View>
      </header>

      <View className="flex-row gap-1 px-6 py-4">
        {[1, 2, 3].map((s) => (
          <View key={s} className={`flex-1 h-1 rounded-full ${s <= step ? 'bg-green-500' : 'bg-zinc-800'}`} />
        ))}
      </View>

      <ScrollView className="flex-1 p-6">
        {error && (
          <View className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex-row items-center gap-3">
            <AlertCircle size={20} color="#ef4444" />
            <Text className="text-red-400 text-sm flex-1">{error}</Text>
          </View>
        )}

        {step === 1 && (
          <View className="gap-6">
            <View className="items-center mb-8">
              <View className="w-16 h-16 bg-green-500/20 rounded-full items-center justify-center mb-4">
                <Star size={32} color="#22c55e" />
              </View>
              <Text className="text-xl font-bold text-white mb-2 text-center">Tell us about yourself</Text>
              <Text className="text-zinc-500 text-center">Share your fitness journey</Text>
            </View>

            <View>
              <Text className="text-zinc-400 text-sm font-bold mb-4 uppercase tracking-widest">Bio ({application.bio.length}/500)</Text>
              <TextInput
                value={application.bio}
                onChangeText={(text) => setApplication(prev => ({ ...prev, bio: text }))}
                placeholder="Tell us about your fitness philosophy..."
                placeholderTextColor="#3f3f46"
                maxLength={500}
                multiline
                numberOfLines={6}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white font-medium min-h-[150px]"
                textAlignVertical="top"
              />
              <Text className="text-zinc-600 text-xs mt-2 uppercase font-bold">Min. 50 characters</Text>
            </View>
          </View>
        )}

        {step === 2 && (
          <View className="gap-6">
            <View className="items-center mb-8">
              <View className="w-16 h-16 bg-blue-500/20 rounded-full items-center justify-center mb-4">
                <Trophy size={32} color="#3b82f6" />
              </View>
              <Text className="text-xl font-bold text-white mb-2">Your Specialties</Text>
            </View>

            <View className="flex-row flex-wrap gap-2">
              {SPECIALTIES_OPTIONS.map((specialty) => (
                <TouchableOpacity
                  key={specialty}
                  onPress={() => toggleSpecialty(specialty)}
                  className={`px-4 py-3 rounded-xl border-2 mb-2 ${
                    application.specialties.includes(specialty)
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-zinc-800 bg-zinc-900'
                  }`}
                >
                    <Text className={`font-bold text-sm ${application.specialties.includes(specialty) ? 'text-green-500' : 'text-zinc-500'}`}>
                        {specialty}
                    </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 3 && (
          <View className="gap-8">
            <View className="items-center mb-4">
                <View className="w-16 h-16 bg-purple-500/20 rounded-full items-center justify-center mb-4">
                    <Users size={32} color="#a855f7" />
                </View>
                <Text className="text-xl font-bold text-white">Credentials</Text>
            </View>

            <ForgeSlider
              label="Years of Experience"
              value={application.experience}
              onChange={(value) => setApplication(prev => ({ ...prev, experience: value }))}
              min={0}
              max={30}
              color="blue"
            />

            <View>
              <Text className="text-zinc-400 text-sm font-bold mb-4 uppercase tracking-widest">Certifications</Text>
              <View className="flex-row gap-2 mb-4">
                <TextInput
                  value={newCertification}
                  onChangeText={setNewCertification}
                  placeholder="e.g., NASM-CPT"
                  placeholderTextColor="#3f3f46"
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white font-bold"
                />
                <TouchableOpacity
                  onPress={addCertification}
                  disabled={!newCertification.trim()}
                  className="bg-zinc-800 px-6 py-4 rounded-xl border border-zinc-700 disabled:opacity-50"
                >
                  <Text className="text-white font-bold">Add</Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row flex-wrap gap-2">
                {application.certifications.map((cert, index) => (
                    <View key={index} className="bg-zinc-800 px-4 py-2 rounded-full flex-row items-center gap-2">
                        <Text className="text-zinc-300 text-xs font-bold">{cert}</Text>
                        <TouchableOpacity onPress={() => removeCertification(index)}>
                            <X size={14} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                ))}
              </View>
            </View>
          </View>
        )}
        <View className="h-32" />
      </ScrollView>

      <View className="p-6 border-t border-zinc-800 flex-row gap-3">
        {step > 1 && (
            <TouchableOpacity onPress={() => setStep(step - 1)} className="flex-1 bg-zinc-900 py-5 rounded-2xl items-center border border-zinc-800">
                <Text className="text-white font-bold uppercase tracking-widest">Back</Text>
            </TouchableOpacity>
        )}
        <TouchableOpacity
            onPress={step < 3 ? () => setStep(step + 1) : handleSubmit}
            disabled={!canProceed() || isSubmitting}
            className={`flex-1 py-5 rounded-2xl items-center ${canProceed() ? 'bg-green-500' : 'bg-zinc-800 opacity-50'}`}
        >
            {isSubmitting ? <ActivityIndicator color="black" /> : <Text className="text-black font-black uppercase tracking-widest">{step < 3 ? 'Continue' : 'Apply Now'}</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CoachSignupPage;
